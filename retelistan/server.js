/* ============================================================================
   RETELISTAN — server de PREZENȚĂ online (WebSocket)
   ----------------------------------------------------------------------------
   Rol minimal, fără gameplay pe server: fiecare client anunță numele și
   poziția lui, serverul difuzează tuturor un instantaneu cu toți jucătorii.
   Progresul (teorie citită, fapte-cheie) rămâne LOCAL, în browserul fiecăruia.

   - totul în memorie (efemer) — fără bază de date, fără volume;
   - nginx proxează /retelistan/ către acest serviciu (upgrade WebSocket);
   - limite stricte: mesaje mici, rate-limit pe poziții, plafon de conexiuni.
   ============================================================================ */
'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 3004;

/* limitele lumii, în pixeli — trebuie să încapă orice poziție raportată
   (harta din game.js: 110×80 tile-uri × 32 px) */
const LUME_W = 110 * 32;
const LUME_H = 80 * 32;

const MAX_JUCATORI = 80;      // plafon global de conexiuni
const MAX_PE_IP = 4;          // conexiuni simultane per IP (mai multe taburi ok)
const MIN_INTERVAL_POZ = 50;  // ms — pozițiile mai dese de-atât se ignoră
const MIN_INTERVAL_EMOTE = 700; // ms — anti-spam pe emoji/fraze
const MAX_STRIKES = 5;        // mesaje invalide până la deconectare
const TICK_MS = 120;          // cât de des difuzăm instantaneul (dacă s-a mișcat ceva)

// paleta socială/avatar e FIXĂ și indexată — clientul trimite doar indici, deci
// serverul nu vede niciodată text arbitrar (fără moderare, fără injecții)
const NR_EMOTE = 16;          // 8 emoji + 8 fraze gata făcute (vezi game.js → EMOTE)
const NR_CULORI = 8;          // culori de avatar (game.js → AVATAR_CULORI)
const NR_ACCES = 7;           // accesorii de avatar (game.js → AVATAR_ACCESORII)
const MAX_SCOR = 1000000;     // plafon de siguranță pentru scorul de clasament

const DIRECTII = ['jos', 'sus', 'stanga', 'dreapta'];

// întreg validat într-un interval (altfel — valoarea implicită)
const intInterval = (v, min, max, impl) =>
  (Number.isInteger(v) && v >= min && v <= max) ? v : impl;

/** id -> { ws, ip, nume, x, y, dir, misca, reg, ultimPoz, strikes, viu } */
const jucatori = new Map();
const peIp = new Map(); // ip -> număr de conexiuni active
let urmatorulId = 1;
let schimbat = false;   // s-a modificat ceva de la ultimul broadcast?

/* numele: fără HTML/control chars, spații normalizate, 2–14 caractere */
function curataNume(s) {
  s = String(s || '')
    .replace(/[\u0000-\u001F\u007F<>&"'`\\]/g, '')
    .replace(/\p{Cf}/gu, '') // caractere de format Unicode (bidi, zero-width) — anti-spoofing de nume
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14);
  return s.length >= 2 ? s : null;
}

const eNumarBun = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function ipDin(req) {
  // nginx trimite IP-ul real în X-Forwarded-For (setat cu $remote_addr, nu listă)
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket.remoteAddress || '?';
}

/* ── HTTP: doar /health (pentru HEALTHCHECK-ul din Docker) ── */
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/retelistan/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, online: jucatori.size }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('retelistan-presence');
});

const wss = new WebSocketServer({ server, maxPayload: 1024 });

wss.on('connection', (ws, req) => {
  // acceptăm doar calea de ws (prin nginx vine /retelistan/ws)
  const cale = (req.url || '').split('?')[0];
  if (!/\/ws$/.test(cale)) { ws.close(4404, 'cale necunoscuta'); return; }

  const ip = ipDin(req);
  // plafon și pe socket-urile conectate (nu doar pe jucătorii intrați);
  // în ws, socketul curent e deja numărat în wss.clients la 'connection' → „>"
  if (wss.clients.size > MAX_JUCATORI) { ws.close(4001, 'plin'); return; }
  if ((peIp.get(ip) || 0) >= MAX_PE_IP) { ws.close(4002, 'prea multe conexiuni'); return; }
  peIp.set(ip, (peIp.get(ip) || 0) + 1);

  const stare = {
    ws, ip, id: 0, nume: null,
    x: 0, y: 0, dir: 0, misca: false, reg: '',
    avc: 0, avh: 0,  // avatar: index de culoare + index de accesoriu
    scor: 0,         // scorul de clasament (derivat din progresul local al clientului)
    arePoz: false,   // nu-l difuzăm până nu-și anunță prima poziție (altfel apare la (0,0))
    ultimPoz: 0, ultimEmote: 0, strikes: 0,
  };

  ws.viu = true; // pentru heartbeat — acoperă și socket-urile care n-au dat join
  ws.on('pong', () => { ws.viu = true; });

  // cine nu intră cu nume în 15s nu are ce căuta conectat (ocupă un slot de IP)
  const timeoutJoin = setTimeout(() => { if (!stare.id) ws.terminate(); }, 15000);

  ws.on('message', (date) => {
    let m;
    try { m = JSON.parse(date.toString()); } catch (e) { return strike(); }
    if (!m || typeof m !== 'object') return strike();

    /* intrarea în lume: {t:"j", nume} */
    if (m.t === 'j') {
      if (stare.id) return strike();           // deja intrat
      const nume = curataNume(m.nume);
      if (!nume) { ws.close(4003, 'nume invalid'); return; }
      // plafonul REAL se impune aici (la conectare încă nu se știe cine intră)
      if (jucatori.size >= MAX_JUCATORI) { ws.close(4001, 'plin'); return; }
      stare.id = urmatorulId++;
      stare.nume = nume;
      stare.avc = intInterval(m.c, 0, NR_CULORI - 1, 0);
      stare.avh = intInterval(m.h, 0, NR_ACCES - 1, 0);
      stare.scor = intInterval(m.s, 0, MAX_SCOR, 0);
      jucatori.set(stare.id, stare);
      schimbat = true;
      trimite(ws, { t: 'ok', id: stare.id });
      trimite(ws, instantaneu());              // starea completă, imediat
      console.log(`[+] ${nume} (#${stare.id}, ${ip}) — online: ${jucatori.size}`);
      return;
    }

    /* poziție: {t:"p", x, y, d, m, r} — doar după join, cu rate-limit */
    if (m.t === 'p') {
      if (!stare.id) return strike();
      const acum = Date.now();
      if (acum - stare.ultimPoz < MIN_INTERVAL_POZ) return; // prea des — ignorăm tăcut
      stare.ultimPoz = acum;
      if (!eNumarBun(m.x, 0, LUME_W) || !eNumarBun(m.y, 0, LUME_H)) return strike();
      stare.x = Math.round(m.x);
      stare.y = Math.round(m.y);
      stare.arePoz = true;
      stare.dir = DIRECTII.includes(m.d) ? DIRECTII.indexOf(m.d) : (Number.isInteger(m.d) && m.d >= 0 && m.d < 4 ? m.d : 0);
      stare.misca = !!m.m;
      stare.reg = typeof m.r === 'string' ? m.r.slice(0, 12).replace(/[^a-z-]/g, '') : '';
      schimbat = true;
      return;
    }

    /* emoji / frază: {t:"e", k} — k = index în paleta fixă; difuzat imediat */
    if (m.t === 'e') {
      if (!stare.id) return strike();
      if (!Number.isInteger(m.k) || m.k < 0 || m.k >= NR_EMOTE) return strike();
      const acum = Date.now();
      if (acum - stare.ultimEmote < MIN_INTERVAL_EMOTE) return; // prea des — ignorăm tăcut
      stare.ultimEmote = acum;
      difuzeaza({ t: 'em', id: stare.id, k: m.k });
      return;
    }

    /* schimbare de avatar: {t:"av", c, h} — reflectată în următorul instantaneu */
    if (m.t === 'av') {
      if (!stare.id) return strike();
      stare.avc = intInterval(m.c, 0, NR_CULORI - 1, stare.avc);
      stare.avh = intInterval(m.h, 0, NR_ACCES - 1, stare.avh);
      schimbat = true;
      return;
    }

    /* scor de clasament: {t:"sc", s} — reflectat în următorul instantaneu */
    if (m.t === 'sc') {
      if (!stare.id) return strike();
      if (!Number.isInteger(m.s) || m.s < 0 || m.s > MAX_SCOR) return strike();
      if (m.s !== stare.scor) { stare.scor = m.s; schimbat = true; }
      return;
    }

    strike();
    function strike() {
      if (++stare.strikes >= MAX_STRIKES) ws.terminate();
    }
  });

  ws.on('close', () => {
    clearTimeout(timeoutJoin);
    const n = (peIp.get(ip) || 1) - 1;
    n > 0 ? peIp.set(ip, n) : peIp.delete(ip);
    if (stare.id && jucatori.delete(stare.id)) {
      schimbat = true;
      console.log(`[-] ${stare.nume} (#${stare.id}) — online: ${jucatori.size}`);
    }
  });
  ws.on('error', () => { /* close vine oricum după error */ });
});

/* instantaneul difuzat: compact, ca listă de tupluri
   [id, nume, x, y, dir, misca, reg, culoareAvatar, accesoriuAvatar, scor] */
function instantaneu() {
  const j = [];
  for (const s of jucatori.values()) {
    if (!s.arePoz) continue; // încă n-a trimis prima poziție — nu-l arătăm la (0,0)
    j.push([s.id, s.nume, s.x, s.y, s.dir, s.misca ? 1 : 0, s.reg, s.avc || 0, s.avh || 0, s.scor || 0]);
  }
  return { t: 's', j };
}

function trimite(ws, obiect) {
  if (ws.readyState === ws.OPEN) { try { ws.send(JSON.stringify(obiect)); } catch (e) {} }
}

/* difuzare imediată a unui obiect mic (emoji/fraze) către toți jucătorii */
function difuzeaza(obiect) {
  const pachet = JSON.stringify(obiect);
  for (const s of jucatori.values()) {
    if (s.ws.readyState === s.ws.OPEN && s.ws.bufferedAmount < 65536) {
      try { s.ws.send(pachet); } catch (e) {}
    }
  }
}

/* difuzare periodică — doar când s-a schimbat ceva (mișcare/intrări/ieșiri) */
setInterval(() => {
  if (!schimbat || !jucatori.size) return;
  schimbat = false;
  const pachet = JSON.stringify(instantaneu());
  for (const s of jucatori.values()) {
    // un client lent (buffer > 64KB) sare peste instantaneul ăsta — nu lăsăm
    // memoria serverului să crească din cauza unei conexiuni proaste
    if (s.ws.readyState === s.ws.OPEN && s.ws.bufferedAmount < 65536) {
      try { s.ws.send(pachet); } catch (e) {}
    }
  }
}, TICK_MS);

/* heartbeat: cine nu răspunde la ping în 30s e deconectat */
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.viu) { ws.terminate(); continue; }
    ws.viu = false;
    try { ws.ping(); } catch (e) {}
  }
}, 30000);

server.listen(PORT, () => console.log('Rețelistan presence pe portul ' + PORT));
