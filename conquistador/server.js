// ============================================================
//  Conquistador — server de joc multiplayer (Triviador pe harta României)
//  Node + WebSocket (ws). Întrebările stau în YAML pe SERVER (js-yaml),
//  iar răspunsurile corecte NU pleacă niciodată către client înainte de
//  "reveal" -> imposibil de trișat din DevTools.
//
//  Starea camerelor trăiește DOAR în memorie (efemeră) — fără bază de date,
//  exact ca "live" din serviciul counter. Când partida se termină sau toți
//  pleacă, camera dispare.
//
//  nginx proxează /game/ -> acest serviciu (cu upgrade WebSocket).
//
//  FAZA 1 (implementată acum): conectare, creare cameră, join cu cod,
//  lobby live (3-4 jucători), alegere topic + dificultate, ready, start,
//  reconectare după pică net-ul. Harta + automatul complet de fază vin în
//  Faza 2 — dar protocolul și structura camerei sunt deja pregătite pentru ele.
// ============================================================
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { WebSocketServer } = require("ws");
const MAP = require("./map.js");

const PORT          = parseInt(process.env.PORT || "3002", 10);
const QUESTIONS_DIR = process.env.QUESTIONS_DIR || path.join(__dirname, "questions");
const MAX_PLAYERS   = parseInt(process.env.MAX_PLAYERS || "8", 10);
const MIN_PLAYERS   = parseInt(process.env.MIN_PLAYERS || "2", 10);

const MAX_TOPICS = parseInt(process.env.MAX_TOPICS || "3", 10);  // câte materii poți combina

// Moduri de joc: harta + intervalul de jucători
const MODES = {
  romania: { min: 2, max: 4, nume: "România", map: "./map.js" },
  europa:  { min: 4, max: 8, nume: "Europa",  map: "./map-europa.js" }
};
function modeCfg(room){ return MODES[room && room.mode] || MODES.romania; }
const MAP_CACHE = {};
function loadMap(mode){
  if(MAP_CACHE[mode] !== undefined) return MAP_CACHE[mode];
  try{ MAP_CACHE[mode] = require((MODES[mode] || {}).map || "./map.js"); }
  catch(e){ MAP_CACHE[mode] = null; }   // harta poate lipsi (ex. Europa până e gata)
  return MAP_CACHE[mode];
}
const RECONNECT_MS  = parseInt(process.env.RECONNECT_MS || "45000", 10); // grațieer reconectare
const EMPTY_ROOM_MS = parseInt(process.env.EMPTY_ROOM_MS || "60000", 10); // cameră goală -> ștearsă

// ---- timere de joc (ms) — generoase, neabuzive ----
const T_BASE_PICK = parseInt(process.env.T_BASE_PICK || "25000", 10);
const T_SELECT    = parseInt(process.env.T_SELECT    || "25000", 10);  // faza de alegere a teritoriului
const T_QUESTION  = parseInt(process.env.T_QUESTION  || "30000", 10);   // timp implicit / întrebare
const T_QUESTION_MAX = parseInt(process.env.T_QUESTION_MAX || "75000", 10); // plafon (întrebări grele cu cod/diagrame)
const T_ATTACKPICK= parseInt(process.env.T_ATTACKPICK|| "25000", 10);
const T_REVEAL    = parseInt(process.env.T_REVEAL    || "7000", 10);    // reveal când toți au răspuns corect
const T_REVEAL_WRONG = parseInt(process.env.T_REVEAL_WRONG || "13000", 10); // reveal mai lung dacă cineva a greșit (timp de învățat)
const ATTACKS_PER_PLAYER = parseInt(process.env.ATTACKS_PER_PLAYER || "3", 10);
const BASE_VALUE  = 1000;  // valoarea (puncte) a unei regiuni-bază — stil Triviador
const BASE_LIVES  = 3;     // o bază rezistă la BASE_LIVES atacuri reușite înainte de a cădea

// Culorile jucătorilor (pentru hartă, în ordinea intrării) — până la 8 jucători
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const MASCOTS = ["fox", "bear", "cat", "frog", "panda", "owl", "robot", "dragon"];
const EMOJIS  = ["😂", "😮", "❤️", "👍", "😢", "🔥", "😎", "👏"];

// timpul alocat unei întrebări: dacă YAML are `timp` (secunde), îl folosim (plafonat),
// altfel implicit. Așa întrebările mai grele (cod/diagrame) primesc mai mult timp.
function questionMs(q){
  const t = q && Number(q.timp);
  if(t && isFinite(t) && t > 0) return Math.min(T_QUESTION_MAX, Math.max(10000, t * 1000));
  return T_QUESTION;
}
// reveal mai lung dacă vreun participant a greșit (ca să apuce să învețe)
function revealMs(hadWrong){ return hadWrong ? T_REVEAL_WRONG : T_REVEAL; }

// ============================================================
//  Banca de întrebări — încărcată din YAML la pornire
//  TOPICS: { topic -> { topic, nume, intrebari:[...], dificultati:Set } }
// ============================================================
const TOPICS = new Map();

// Variantele FIXE pentru întrebările de departajare Adevărat / Fals.
// În yaml: tip: adevarat_fals, corect: 0 (Adevărat) sau 1 (Fals).
const AF_VARIANTE = ["Adevărat", "Fals"];

function validQuestion(q){
  if(!q || typeof q.enunt !== "string") return false;
  if(q.tip === "grila"){
    return Array.isArray(q.variante) && q.variante.length >= 2 &&
           Number.isInteger(q.corect) && q.corect >= 0 && q.corect < q.variante.length;
  }
  if(q.tip === "adevarat_fals"){
    return Number.isInteger(q.corect) && (q.corect === 0 || q.corect === 1);
  }
  if(q.tip === "numeric_exact" || q.tip === "numeric_aprox"){
    return typeof q.corect === "number" && isFinite(q.corect);
  }
  return false;
}

function loadQuestions(){
  TOPICS.clear();
  let files = [];
  try{ files = fs.readdirSync(QUESTIONS_DIR).filter(f => /\.ya?ml$/i.test(f)); }
  catch(e){ console.error("nu pot citi", QUESTIONS_DIR, "-", e.message); }

  for(const f of files){
    try{
      const raw = fs.readFileSync(path.join(QUESTIONS_DIR, f), "utf8");
      const doc = yaml.load(raw) || {};
      const topic = String(doc.topic || path.basename(f).replace(/\.ya?ml$/i, ""));
      const intrebari = Array.isArray(doc.intrebari) ? doc.intrebari.filter(validQuestion) : [];
      if(!intrebari.length){ console.warn("topic", topic, "fără întrebări valide — sărit"); continue; }
      const dificultati = new Set(intrebari.map(q => q.dificultate || "licenta"));
      TOPICS.set(topic, { topic, nume: doc.nume || topic, intrebari, dificultati });
      console.log("topic încărcat:", topic, "·", intrebari.length, "întrebări");
    }catch(e){ console.error("eroare YAML în", f, "-", e.message); }
  }
  console.log("total topicuri:", TOPICS.size);
}

// Lista topicurilor expusă clientului (FĂRĂ întrebări/răspunsuri)
function topicsForClient(){
  return Array.from(TOPICS.values()).map(t => ({
    topic: t.topic,
    nume: t.nume,
    intrebari: t.intrebari.length,
    dificultati: Array.from(t.dificultati)
  }));
}

// ============================================================
//  Camere (în memorie)
//  Room: { cod, players:Map<id,Player>, order:[ids], hostId, faza,
//          topic, dificultate, createdAt, emptyTimer }
//  Player: { id, nume, color, ready, ws|null, dcTimer|null }
// ============================================================
const rooms = new Map();

function genCode(){
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // fără I,O,0,1 (confuzie)
  let cod;
  do{
    cod = "";
    for(let i = 0; i < 4; i++) cod += A[Math.floor(Math.random() * A.length)];
  }while(rooms.has(cod));
  return cod;
}

function genId(){
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

function publicPlayers(room){
  return room.order.map(id => {
    const p = room.players.get(id);
    return { id: p.id, nume: p.nume, color: p.color, mascot: p.mascot, ready: p.ready,
             host: id === room.hostId, connected: !!p.ws };
  });
}

function lobbyState(room){
  return {
    t: "lobby",
    cod: room.cod,
    faza: room.faza,
    hostId: room.hostId,
    mode: room.mode || "romania",
    modeNume: modeCfg(room).nume,
    topics: room.topics || [],
    maxTopics: MAX_TOPICS,
    dificultate: room.dificultate,
    minPlayers: modeCfg(room).min,
    maxPlayers: modeCfg(room).max,
    jucatori: publicPlayers(room)
  };
}

function broadcast(room, obj){
  const msg = JSON.stringify(obj);
  for(const id of room.order){
    const p = room.players.get(id);
    if(p && p.ws && p.ws.readyState === p.ws.OPEN){
      try{ p.ws.send(msg); }catch(e){}
    }
  }
}

function send(ws, obj){
  if(ws && ws.readyState === ws.OPEN){
    try{ ws.send(JSON.stringify(obj)); }catch(e){}
  }
}
// trimite starea potrivită fazei: lobby în așteptare, snapshot în timpul jocului
function broadcastRoom(room){
  if((room.faza === "GAME" || room.faza === "RESULTS") && room.game) broadcastGame(room);
  else broadcast(room, lobbyState(room));
}
function sendError(ws, msg){ send(ws, { t: "error", msg }); }

function deleteRoom(room){
  if(room.emptyTimer){ clearTimeout(room.emptyTimer); room.emptyTimer = null; }
  for(const p of room.players.values()){ if(p.dcTimer) clearTimeout(p.dcTimer); }
  rooms.delete(room.cod);
  console.log("cameră ștearsă:", room.cod);
}

function scheduleEmptyCheck(room){
  if(room.emptyTimer) clearTimeout(room.emptyTimer);
  room.emptyTimer = setTimeout(() => {
    const anyConnected = Array.from(room.players.values()).some(p => p.ws);
    if(!anyConnected) deleteRoom(room);
  }, EMPTY_ROOM_MS);
}

// promovează un nou host dacă cel curent a plecat
function ensureHost(room){
  if(room.players.has(room.hostId) && room.players.get(room.hostId).ws) return;
  const next = room.order.find(id => room.players.get(id) && room.players.get(id).ws);
  if(next){ room.hostId = next; }
}

// scoate definitiv un jucător (după expirarea grațierii sau leave explicit)
function removePlayer(room, id){
  const p = room.players.get(id);
  if(!p) return;
  // în timpul jocului NU ștergem slotul (codul de joc se bazează pe el) —
  // doar îl marcăm deconectat; poate reveni până la finalul partidei.
  if((room.faza === "GAME" || room.faza === "RESULTS")){
    if(p.ws){ try{ p.ws.close(); }catch(e){} }
    p.ws = null;
    broadcastRoom(room);
    return;
  }
  if(p.dcTimer) clearTimeout(p.dcTimer);
  room.players.delete(id);
  room.order = room.order.filter(x => x !== id);
  if(!room.order.length){ deleteRoom(room); return; }
  ensureHost(room);
  broadcast(room, lobbyState(room));
}

// ============================================================
//  Handlere de mesaje
// ============================================================
function sanitizeName(s){
  s = (typeof s === "string" ? s : "").trim().replace(/\s+/g, " ").slice(0, 20);
  return s || "Anonim";
}

function handleCreate(ws, msg){
  const cod = genCode();
  const id = genId();
  const player = { id, nume: sanitizeName(msg.nume), color: COLORS[0], mascot: MASCOTS[0], ready: false, ws, dcTimer: null };
  const room = {
    cod,
    players: new Map([[id, player]]),
    order: [id],
    hostId: id,
    faza: "LOBBY",
    mode: (MODES[String(msg.mode)] ? String(msg.mode) : "romania"),
    topics: [],
    dificultate: null,
    createdAt: Date.now(),
    emptyTimer: null
  };
  rooms.set(cod, room);
  ws._roomCod = cod; ws._playerId = id;
  console.log("cameră creată:", cod, "de", player.nume);
  send(ws, { t: "joined", cod, playerId: id, topicuri: topicsForClient() });
  broadcast(room, lobbyState(room));
}

function handleJoin(ws, msg){
  const cod = String(msg.cod || "").toUpperCase().trim();
  const room = rooms.get(cod);
  if(!room) return sendError(ws, "Camera nu există. Verifică codul.");
  if(room.faza !== "LOBBY") return sendError(ws, "Partida a început deja.");
  if(room.order.length >= modeCfg(room).max) return sendError(ws, "Camera e plină (" + modeCfg(room).max + " jucători).");

  const id = genId();
  const color = COLORS[room.order.length % COLORS.length];
  const player = { id, nume: sanitizeName(msg.nume), color, mascot: MASCOTS[room.order.length % MASCOTS.length], ready: false, ws, dcTimer: null };
  room.players.set(id, player);
  room.order.push(id);
  ws._roomCod = cod; ws._playerId = id;
  if(room.emptyTimer){ clearTimeout(room.emptyTimer); room.emptyTimer = null; }
  console.log(player.nume, "a intrat în", cod);
  send(ws, { t: "joined", cod, playerId: id, topicuri: topicsForClient() });
  broadcast(room, lobbyState(room));
}

function handleReconnect(ws, msg){
  const cod = String(msg.cod || "").toUpperCase().trim();
  const room = rooms.get(cod);
  if(!room) return sendError(ws, "Camera nu mai există.");
  const p = room.players.get(String(msg.playerId || ""));
  if(!p) return sendError(ws, "Sesiune expirată — intră din nou cu codul.");
  if(p.dcTimer){ clearTimeout(p.dcTimer); p.dcTimer = null; }
  if(p.ws && p.ws !== ws){ try{ p.ws.close(); }catch(e){} }
  p.ws = ws;
  ws._roomCod = cod; ws._playerId = p.id;
  if(room.emptyTimer){ clearTimeout(room.emptyTimer); room.emptyTimer = null; }
  ensureHost(room);
  console.log(p.nume, "s-a reconectat la", cod);
  send(ws, { t: "joined", cod, playerId: p.id, topicuri: topicsForClient() });
  if(room.faza === "GAME" && room.game) room.game.mapDirty = true;   // retrimite harta celui reconectat
  broadcastRoom(room);
}

function roomOf(ws){
  const room = rooms.get(ws._roomCod);
  if(!room) return null;
  if(!room.players.has(ws._playerId)) return null;
  return room;
}

function handleTopic(ws, msg){
  const room = roomOf(ws); if(!room) return;
  if(ws._playerId !== room.hostId) return sendError(ws, "Doar gazda alege materiile.");
  if(room.faza !== "LOBBY") return;
  if(!room.topics) room.topics = [];
  if(msg.topic != null){
    const tp = String(msg.topic);
    if(!TOPICS.has(tp)) return sendError(ws, "Topic necunoscut.");
    const i = room.topics.indexOf(tp);
    if(i >= 0) room.topics.splice(i, 1);                          // deselectează
    else if(room.topics.length >= MAX_TOPICS) return sendError(ws, "Poți alege maxim " + MAX_TOPICS + " materii.");
    else room.topics.push(tp);                                    // selectează
  }
  if(msg.dificultate != null) room.dificultate = String(msg.dificultate);
  // schimbarea materiilor resetează "ready" (ca să confirme toți pe noua alegere)
  for(const p of room.players.values()) p.ready = false;
  broadcast(room, lobbyState(room));
}

function handleMascot(ws, msg){
  const room = roomOf(ws); if(!room) return;
  const p = room.players.get(ws._playerId); if(!p) return;
  if(room.faza !== "LOBBY") return;
  const mm = String(msg.mascot || "");
  if(MASCOTS.indexOf(mm) < 0) return;
  p.mascot = mm;
  broadcast(room, lobbyState(room));
}

function handleEmoji(ws, msg){
  const room = roomOf(ws); if(!room) return;
  const p = room.players.get(ws._playerId); if(!p) return;
  const e = String(msg.e || "");
  if(EMOJIS.indexOf(e) < 0) return;
  const now = Date.now();
  if(p._lastEmoji && now - p._lastEmoji < 600) return;   // anti-spam
  p._lastEmoji = now;
  broadcast(room, { t: "emoji", from: ws._playerId, e });
}

function handleChat(ws, msg){
  const room = roomOf(ws); if(!room) return;
  const p = room.players.get(ws._playerId); if(!p) return;
  const text = String(msg.text || "").replace(/\s+/g, " ").trim().slice(0, 200);
  if(!text) return;
  const now = Date.now();
  if(p._lastChat && now - p._lastChat < 400) return;     // anti-spam
  p._lastChat = now;
  broadcast(room, { t: "chat", from: p.id, nume: p.nume, color: p.color, text });
}

function handleMode(ws, msg){
  const room = roomOf(ws); if(!room) return;
  if(ws._playerId !== room.hostId) return sendError(ws, "Doar gazda alege modul.");
  if(room.faza !== "LOBBY") return;
  const m = String(msg.mode || "");
  if(!MODES[m]) return sendError(ws, "Mod necunoscut.");
  if(room.order.length > MODES[m].max) return sendError(ws, "Sunt prea mulți jucători pentru modul " + MODES[m].nume + " (max " + MODES[m].max + ").");
  room.mode = m;
  for(const p of room.players.values()) p.ready = false;
  broadcast(room, lobbyState(room));
}

function handleReady(ws, msg){
  const room = roomOf(ws); if(!room) return;
  const p = room.players.get(ws._playerId); if(!p) return;
  p.ready = !!msg.ready;
  broadcast(room, lobbyState(room));
}

function handleStart(ws){
  const room = roomOf(ws); if(!room) return;
  if(ws._playerId !== room.hostId) return sendError(ws, "Doar gazda poate porni jocul.");
  if(room.faza !== "LOBBY") return;
  const cfg = modeCfg(room);
  if(room.order.length < cfg.min) return sendError(ws, "Modul " + cfg.nume + " are nevoie de minim " + cfg.min + " jucători.");
  if(!loadMap(room.mode)) return sendError(ws, "Harta pentru modul " + cfg.nume + " nu e gata încă.");
  if(!room.topics || !room.topics.length) return sendError(ws, "Alege cel puțin o materie.");
  const connected = room.order.filter(id => room.players.get(id).ws);
  const allReady = connected.every(id => room.players.get(id).ready);
  if(!allReady) return sendError(ws, "Nu toți jucătorii sunt pregătiți.");

  console.log("pornire joc în camera", room.cod, "· mod", room.mode, "· materii", (room.topics || []).join("+"), "· dif", room.dificultate);
  startGame(room);
}

// ============================================================
//  MOTORUL DE JOC — automat de stări
//  BASE_PICK -> EXPANSION -> ATTACK -> RESULTS
//  Serverul e autoritate: validează răspunsurile, ține timerele,
//  decide cuceririle. Răspunsul corect + explicația pleacă spre client
//  DOAR la "reveal".
// ============================================================
function shuffle(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function clearGameTimer(room){ if(room.game && room.game.timer){ clearTimeout(room.game.timer); room.game.timer = null; } }

// alege o întrebare nefolosită de tipul cerut + dificultatea camerei
function pickQuestion(room, kinds){
  const topics = (room.topics && room.topics.length) ? room.topics : (room.topic ? [room.topic] : []);
  const dif = room.dificultate;
  // pool combinat din TOATE materiile alese; cheie = "topic#idx" (indecșii se repetă între materii)
  let pool = [];
  for(const tp of topics){
    const T = TOPICS.get(tp); if(!T) continue;
    T.intrebari.forEach((q, idx) => {
      if(kinds.indexOf(q.tip) >= 0 && (!dif || (q.dificultate || "licenta") === dif)) pool.push({ q, key: tp + "#" + idx });
    });
  }
  if(!pool.length){ // relaxează dificultatea dacă nu sunt destule
    for(const tp of topics){ const T = TOPICS.get(tp); if(!T) continue;
      T.intrebari.forEach((q, idx) => { if(kinds.indexOf(q.tip) >= 0) pool.push({ q, key: tp + "#" + idx }); }); }
  }
  if(!pool.length) return null;
  let fresh = pool.filter(o => !room.game.usedQ.has(o.key));
  if(!fresh.length){ for(const o of pool) room.game.usedQ.delete(o.key); fresh = pool; }
  const pick = fresh[Math.floor(Math.random() * fresh.length)];
  room.game.usedQ.add(pick.key);
  return pick;
}

function isCorrect(q, val){
  if(q.tip === "grila") return Number(val) === q.corect;
  if(q.tip === "adevarat_fals") return Number(val) === q.corect;  // 0=Adevărat, 1=Fals
  if(q.tip === "numeric_exact") return Number(val) === q.corect;
  return false; // numeric_aprox nu are corect/greșit — se judecă prin distanță
}

// versiunea publică a întrebării (FĂRĂ corect/explicatie). Întrebările de tip
// adevarat_fals sunt trimise clientului CA grila (3 variante fixe), ca să refolosească
// exact aceeași interfață de răspuns — fără cod nou pe client.
function pubQuestion(q, qid, mode, deadline){
  const o = { qid, tip: q.tip, enunt: q.enunt, mode, deadline };
  if(q.tip === "grila") o.variante = q.variante;
  if(q.tip === "adevarat_fals"){ o.tip = "grila"; o.variante = AF_VARIANTE; }
  if(q.cod) o.cod = String(q.cod);   // bloc de cod/schemă (afișat monospace)
  return o;
}

function ownerRegions(room, pid){ return room.game.regions.filter(r => room.game.owners[r.id] === pid).map(r => r.id); }
function regionNeighbors(room, id){ const r = room.game.regions.find(x => x.id === id); return r ? (r.neighbors || []) : []; }
function isAdjacentToOwner(room, pid, regionId){
  const mine = new Set(ownerRegions(room, pid));
  return regionNeighbors(room, regionId).some(n => mine.has(n));
}
function freeRegions(room){ return room.game.regions.filter(r => !room.game.owners[r.id]).map(r => r.id); }
function claimTargets(room, pid){ return freeRegions(room).filter(id => isAdjacentToOwner(room, pid, id)); }
// teritoriile pe care le poate alege la EXPANSION: cele libere vecine; dar dacă
// e ÎNCERCUIT (niciun liber vecin), poate alege ORICE teritoriu liber rămas.
function selectTargets(room, pid){
  const adj = claimTargets(room, pid);
  return adj.length ? adj : freeRegions(room);
}
function attackTargets(room, pid){
  return room.game.regions.map(r => r.id)
    .filter(id => room.game.owners[id] !== pid && isAdjacentToOwner(room, pid, id));
}

// valoarea unei regiuni (bazele valorează BASE_VALUE — stil Triviador)
function regionWorth(room, r){ return (room.game.bases[room.game.owners[r.id]] === r.id) ? BASE_VALUE : r.val; }

function computeScores(room){
  const s = {};
  for(const id of room.game.order) s[id] = 0;
  for(const r of room.game.regions){
    const o = room.game.owners[r.id];
    if(o != null && s[o] != null) s[o] += regionWorth(room, r);
  }
  return s;
}

function startGame(room){
  const order = shuffle(room.order.filter(id => room.players.get(id) && room.players.get(id).ws));
  room.faza = "GAME";
  const mapMod = loadMap(room.mode) || loadMap("romania");
  const mapData = mapMod.mapForClient();
  room.game = {
    mapData,                    // {border, labels, regions} — trimis clientului
    regions: mapData.regions,   // array intern de regiuni
    mapDirty: true,             // trimite harta (poligoane mari) o singură dată; clientul o cache-uiește
    order,
    owners: {},                 // regionId -> playerId
    lives: {},                  // regionId -> vieți (doar bazele)
    bases: {},                  // playerId -> regionId
    phase: "BASE_PICK",
    picker: 0,
    attacker: 0,
    attacksLeft: {},
    usedQ: new Set(),
    prompt: null,
    answers: new Map(),
    answerers: [],
    selections: {},             // EXPANSION select: playerId -> regionId
    mode: null,
    duel: null,
    curQ: null,
    expRounds: 0,
    timer: null,
    deadline: 0,
    lastOutcome: null
  };
  for(const r of room.game.regions) room.game.owners[r.id] = null;
  for(const id of order) room.game.attacksLeft[id] = ATTACKS_PER_PLAYER;
  room.game.attacksTotal = order.length * ATTACKS_PER_PLAYER;   // pentru bara de progres a meciului
  beginBasePick(room);
}

function playerName(room, id){ const p = room.players.get(id); return p ? p.nume : "?"; }

function snapshot(room){
  const g = room.game;
  return {
    t: "game",
    cod: room.cod,
    phase: g.phase,
    map: g.mapDirty ? g.mapData : undefined,   // harta doar prima dată (apoi clientul o refolosește din cache)
    owners: g.owners,
    lives: g.lives,
    bases: g.bases,
    players: room.order.map(id => { const p = room.players.get(id); return { id, nume: p.nume, color: p.color, mascot: p.mascot, connected: !!p.ws }; }),
    order: g.order,
    turn: g.phase === "BASE_PICK" ? g.order[g.picker]
        : g.phase === "ATTACK" && g.prompt && g.prompt.kind === "attackPick" ? g.order[g.attacker]
        : null,
    attacksLeft: g.attacksLeft,
    attacksTotal: g.attacksTotal,
    round: g.expRounds,
    selections: g.prompt && g.prompt.kind === "select" ? g.selections : null,
    scores: computeScores(room),
    prompt: g.prompt,
    outcome: g.lastOutcome
  };
}
function broadcastGame(room){ broadcast(room, snapshot(room)); if(room.game) room.game.mapDirty = false; }

// ---------- BASE_PICK ----------
function beginBasePick(room){
  const g = room.game;
  clearGameTimer(room);
  // sări peste pickerii deconectați
  let guard = 0;
  while(guard++ < g.order.length && !room.players.get(g.order[g.picker]).ws){
    autoBasePick(room, g.order[g.picker]);
    g.picker++;
    if(g.picker >= g.order.length) return finishBasePick(room);
  }
  if(g.picker >= g.order.length) return finishBasePick(room);
  g.prompt = { kind: "basePick", picker: g.order[g.picker], deadline: Date.now() + T_BASE_PICK };
  g.lastOutcome = { text: playerName(room, g.order[g.picker]) + " își alege baza…" };
  broadcastGame(room);
  g.timer = setTimeout(() => { autoBasePick(room, g.order[g.picker]); advanceBasePick(room); }, T_BASE_PICK);
}
function autoBasePick(room, pid){
  const free = freeRegions(room);
  if(!free.length) return;
  setBase(room, pid, free[Math.floor(Math.random() * free.length)]);
}
function setBase(room, pid, regionId){
  if(room.game.owners[regionId]) return false;
  room.game.owners[regionId] = pid;
  room.game.bases[pid] = regionId;
  room.game.lives[regionId] = BASE_LIVES;
  return true;
}
function handleBasePick(ws, msg){
  const room = roomOf(ws); if(!room || !room.game) return;
  const g = room.game;
  if(g.phase !== "BASE_PICK") return;
  if(ws._playerId !== g.order[g.picker]) return sendError(ws, "Nu e rândul tău.");
  if(!setBase(room, ws._playerId, String(msg.region || ""))) return sendError(ws, "Regiune indisponibilă.");
  clearGameTimer(room);
  advanceBasePick(room);
}
function advanceBasePick(room){
  const g = room.game;
  g.picker++;
  if(g.picker >= g.order.length) return finishBasePick(room);
  beginBasePick(room);
}
function finishBasePick(room){
  room.game.phase = "EXPANSION";
  room.game.expRounds = 0;
  beginExpansionRound(room);
}

// ---------- EXPANSION (în doi pași: întâi aleg toți, apoi vine întrebarea) ----------
// PAS 1 — alegerea teritoriului (toți simultan, fără grabă)
function beginExpansionRound(room){
  const g = room.game;
  clearGameTimer(room);
  // continuăm cât timp există teritorii libere (chiar dacă cineva e încercuit —
  // primește fallback la orice teritoriu liber); altfel trecem la atac.
  if(!freeRegions(room).length || g.expRounds >= room.game.regions.length + 2){
    return beginAttackPhase(room);
  }
  g.expRounds++;
  g.selections = {};
  g.phase = "EXPANSION";
  // participă toți cei care au unde să se extindă (vecin liber SAU, dacă-s încercuiți, orice liber)
  g.answerers = g.order.filter(id => room.players.get(id).ws && selectTargets(room, id).length > 0);
  const deadline = Date.now() + T_SELECT;
  g.deadline = deadline; g.qStart = Date.now();
  g.prompt = { kind: "select", deadline, round: g.expRounds };
  g.lastOutcome = { text: "Runda " + g.expRounds + " · Alegeți pe rând ce teritoriu liber vreți să cuceriți." };
  broadcastGame(room);
  g.timer = setTimeout(() => finishExpansionSelect(room), T_SELECT + 200);
}
function handleSelect(ws, msg){
  const room = roomOf(ws); if(!room || !room.game) return;
  const g = room.game;
  if(g.phase !== "EXPANSION" || !g.prompt || g.prompt.kind !== "select") return;
  if(g.answerers.indexOf(ws._playerId) < 0) return;
  const region = String(msg.region || "");
  if(selectTargets(room, ws._playerId).indexOf(region) < 0) return sendError(ws, "Teritoriu indisponibil.");
  g.selections[ws._playerId] = region;
  broadcastGame(room);
  // au ales toți cei care pot? -> trecem la întrebare
  const pending = g.answerers.filter(id => room.players.get(id).ws && !g.selections[id]);
  if(!pending.length){ clearGameTimer(room); finishExpansionSelect(room); }
}
function finishExpansionSelect(room){
  const g = room.game; clearGameTimer(room);
  // cine n-a ales (timeout) -> alegere automată dintre țintele valide
  for(const id of g.answerers){
    if(!g.selections[id]){ const t = selectTargets(room, id); if(t.length) g.selections[id] = t[Math.floor(Math.random() * t.length)]; }
  }
  const chosen = Object.keys(g.selections).filter(id => g.selections[id]);
  if(!chosen.length) return beginAttackPhase(room);
  beginExpansionQuestion(room);
}
// PAS 2 — întrebarea care decide cine primește teritoriul ales
function beginExpansionQuestion(room){
  const g = room.game; clearGameTimer(room);
  const pick = pickQuestion(room, ["grila", "numeric_exact"]);
  if(!pick) return beginAttackPhase(room);
  g.qid = (g.qid || 0) + 1;
  g.curQ = { q: pick.q, qid: g.qid };
  g.answers = new Map();
  g.answerers = Object.keys(g.selections).filter(id => g.selections[id] && room.players.get(id).ws);
  g.mode = "expansion";
  const ms = questionMs(pick.q);
  const deadline = Date.now() + ms;
  g.deadline = deadline; g.qStart = Date.now();
  g.prompt = pubQuestion(pick.q, g.qid, "expansion", deadline);
  g.prompt.kind = "question";
  g.prompt.selections = g.selections;   // ca să vadă fiecare ce a ales
  g.lastOutcome = { text: "Răspundeți! Cine răspunde corect (cel mai repede) primește teritoriul ales." };
  broadcastGame(room);
  g.timer = setTimeout(() => resolveExpansion(room), ms + 300);
}
function resolveExpansion(room){
  const g = room.game; clearGameTimer(room);
  const q = g.curQ.q;
  const gained = {};
  // pentru fiecare teritoriu ales: dintre cei care l-au ales ȘI au răspuns corect,
  // câștigă cel mai rapid (departajare pe viteză).
  const byRegion = {};
  for(const id of Object.keys(g.selections)){
    const reg = g.selections[id]; if(!reg) continue;
    (byRegion[reg] = byRegion[reg] || []).push(id);
  }
  for(const reg of Object.keys(byRegion)){
    if(room.game.owners[reg]) continue; // deja luat
    const contenders = byRegion[reg]
      .map(id => ({ id, a: g.answers.get(id) }))
      .filter(o => o.a && isCorrect(q, o.a.val))
      .sort((x, y) => x.a.time - y.a.time);
    if(contenders.length){ room.game.owners[reg] = contenders[0].id; gained[contenders[0].id] = reg; }
  }
  const results = g.answerers.map(id => {
    const a = g.answers.get(id);
    return { playerId: id, val: a ? a.val : null, correct: a ? isCorrect(q, a.val) : false,
             ms: a ? (a.time - g.qStart) : null, chose: g.selections[id] || null, gained: gained[id] || null };
  });
  g.prompt = revealPrompt(q, g.qid, "expansion", results, "Teritoriile au fost revendicate de cei mai rapizi corecți.");
  g.lastOutcome = { text: "Rezolvare — vezi cine a cucerit." };
  broadcastGame(room);
  const hadWrong = results.some(r => !r.correct);
  g.timer = setTimeout(() => beginExpansionRound(room), revealMs(hadWrong));
}

function revealPrompt(q, qid, mode, results, outcome, extra){
  const isAF = q.tip === "adevarat_fals";
  const tip = isAF ? "grila" : q.tip;
  const variante = isAF ? AF_VARIANTE : q.variante;
  const o = {
    kind: "reveal", qid, tip, mode,
    corect: q.corect,
    corectText: tip === "grila" ? (variante[q.corect]) : String(q.corect),
    variante: tip === "grila" ? variante : undefined,
    explicatie: q.explicatie || "",
    enunt: q.enunt,
    cod: q.cod ? String(q.cod) : "",
    results, outcome
  };
  if(extra) Object.assign(o, extra);
  return o;
}

// ---------- ATTACK ----------
function beginAttackPhase(room){
  const g = room.game;
  g.phase = "ATTACK";
  g.attacker = -1;
  nextAttackTurn(room);
}
function anyAttacksLeft(room){ return room.game.order.some(id => room.game.attacksLeft[id] > 0 && room.players.get(id).ws && attackTargets(room, id).length); }
function nextAttackTurn(room){
  const g = room.game; clearGameTimer(room);
  if(!anyAttacksLeft(room)) return toResults(room);
  // următorul atacator cu atacuri rămase + ținte valide
  let guard = 0;
  do{
    g.attacker = (g.attacker + 1) % g.order.length;
    guard++;
  }while(guard <= g.order.length &&
        (g.attacksLeft[g.order[g.attacker]] <= 0 || !room.players.get(g.order[g.attacker]).ws || !attackTargets(room, g.order[g.attacker]).length));
  if(guard > g.order.length) return toResults(room);
  const atk = g.order[g.attacker];
  g.prompt = { kind: "attackPick", attacker: atk, deadline: Date.now() + T_ATTACKPICK };
  g.lastOutcome = { text: playerName(room, atk) + " alege pe cine atacă (" + g.attacksLeft[atk] + " atacuri rămase)." };
  broadcastGame(room);
  g.timer = setTimeout(() => { g.attacksLeft[atk]--; nextAttackTurn(room); }, T_ATTACKPICK);
}
function handleAttackPick(ws, msg){
  const room = roomOf(ws); if(!room || !room.game) return;
  const g = room.game;
  if(g.phase !== "ATTACK" || !g.prompt || g.prompt.kind !== "attackPick") return;
  const atk = g.order[g.attacker];
  if(ws._playerId !== atk) return sendError(ws, "Nu e rândul tău să ataci.");
  const region = String(msg.region || "");
  if(attackTargets(room, atk).indexOf(region) < 0) return sendError(ws, "Țintă invalidă (trebuie vecină cu teritoriul tău).");
  clearGameTimer(room);
  g.attacksLeft[atk]--;   // un attackPick = un atac consumat (asaltul pe bază nu mai consumă în plus)
  const defender = room.game.owners[region]; // poate fi null (neutru)
  beginDuel(room, atk, defender, region, defender ? "duel-grila" : "duel-solo");
}
function beginDuel(room, attacker, defender, region, mode){
  const g = room.game; clearGameTimer(room);
  const kinds = (mode === "duel-tie") ? ["adevarat_fals"] : ["grila"];
  const pick = pickQuestion(room, kinds);
  if(!pick){ // fără întrebare potrivită: atacul eșuează grațios
    return finishDuel(room, attacker, defender, region, false, "Fără întrebare disponibilă — atac anulat.");
  }
  g.qid = (g.qid || 0) + 1;
  g.curQ = { q: pick.q, qid: g.qid };
  g.duel = { attacker, defender, region, mode };
  g.answers = new Map();
  g.answerers = defender ? [attacker, defender].filter(id => room.players.get(id).ws) : [attacker];
  g.mode = mode;
  const ms = questionMs(pick.q);
  const deadline = Date.now() + ms;
  g.deadline = deadline; g.qStart = Date.now();
  g.prompt = pubQuestion(pick.q, g.qid, mode, deadline);
  g.prompt.kind = "question";
  g.prompt.region = region;
  g.prompt.attacker = attacker;
  g.prompt.defender = defender;
  const label = defender
    ? playerName(room, attacker) + " atacă " + regionName(room, region) + " (apărat de " + playerName(room, defender) + ")"
    : playerName(room, attacker) + " cucerește teritoriul neutru " + regionName(room, region);
  g.lastOutcome = { text: label + (mode === "duel-tie" ? " — DEPARTAJARE (Adevărat/Fals): cine răspunde corect mai repede!" : "") };
  broadcastGame(room);
  g.timer = setTimeout(() => resolveDuel(room), ms + 300);
}
function regionName(room, id){ const r = room.game.regions.find(x => x.id === id); return r ? r.nume : id; }

function resolveDuel(room){
  const g = room.game; clearGameTimer(room);
  const q = g.curQ.q;
  const d = g.duel;
  const aA = g.answers.get(d.attacker);
  const aD = d.defender ? g.answers.get(d.defender) : null;

  if(d.mode === "duel-solo"){
    const ok = aA && isCorrect(q, aA.val);
    const results = [{ playerId: d.attacker, val: aA ? aA.val : null, correct: !!ok, ms: aA ? (aA.time - g.qStart) : null }];
    return finishDuel(room, d.attacker, d.defender, d.region, ok,
      ok ? "Cucerit!" : "Răspuns greșit — teritoriul rămâne neutru.", q, results);
  }

  if(d.mode === "duel-grila"){
    const aC = aA && isCorrect(q, aA.val);
    const dC = aD && isCorrect(q, aD.val);
    const results = [
      { playerId: d.attacker, val: aA ? aA.val : null, correct: !!aC, ms: aA ? (aA.time - g.qStart) : null },
      { playerId: d.defender, val: aD ? aD.val : null, correct: !!dC, ms: aD ? (aD.time - g.qStart) : null }
    ];
    if(aC && !dC) return finishDuel(room, d.attacker, d.defender, d.region, true,  "Atacatorul a răspuns corect, apărătorul nu — cucerit!", q, results);
    if(!aC && dC) return finishDuel(room, d.attacker, d.defender, d.region, false, "Apărarea a rezistat!", q, results);
    // egalitate (ambii corect sau ambii greșit) -> departajare numerică
    g.prompt = revealPrompt(q, g.qid, "duel-grila", results, "Egalitate! Urmează o întrebare de departajare Adevărat/Fals — cine răspunde corect mai repede.");
    g.lastOutcome = { text: "Egalitate — departajare!" };
    broadcastGame(room);
    g.timer = setTimeout(() => beginDuel(room, d.attacker, d.defender, d.region, "duel-tie"), revealMs(!(aC && dC)));
    return;
  }

  if(d.mode === "duel-tie"){
    // DEPARTAJARE Adevărat/Fals: câștigă cine răspunde CORECT; dacă ambii
    // răspund corect, departajează VITEZA (mai rapid). Dacă niciunul nu e corect
    // (greșit sau „Nu știu"), apărarea ține. La viteză perfect egală -> atacatorul.
    const aC = aA && isCorrect(q, aA.val);
    const dC = aD && isCorrect(q, aD.val);
    const ta = aA ? (aA.time - g.qStart) : Infinity;
    const td = aD ? (aD.time - g.qStart) : Infinity;
    let aWin;
    if(aC && !dC) aWin = true;
    else if(dC && !aC) aWin = false;
    else if(aC && dC) aWin = (ta <= td);
    else aWin = false;
    const results = [
      { playerId: d.attacker, val: aA ? aA.val : null, correct: !!aC, ms: isFinite(ta) ? ta : null },
      { playerId: d.defender, val: aD ? aD.val : null, correct: !!dC, ms: isFinite(td) ? td : null }
    ];
    const txt = aWin
      ? (aC && dC ? "Ambii corect — atacatorul a răspuns mai repede, cucerit!" : "Atacatorul a răspuns corect — cucerit!")
      : (dC && !aC ? "Apărătorul a răspuns corect — rezistă!"
                   : (aC && dC ? "Ambii corect — apărătorul a fost mai rapid, rezistă!"
                               : "Niciunul n-a răspuns corect — apărarea ține."));
    return finishDuel(room, d.attacker, d.defender, d.region, aWin, txt, q, results);
  }
}

function finishDuel(room, attacker, defender, region, success, outcomeText, q, results){
  const g = room.game;
  let gained = null, lifeLost = false;
  if(success){
    if(defender && g.bases[defender] === region && g.lives[region] > 1){
      // ASALT PE BAZĂ: baza pierde o viață dar rezistă -> atacatorul CONTINUĂ
      // imediat cu un nou duel pe aceeași bază (poate s-o doboare din mai multe
      // lovituri consecutive în aceeași tură). Dacă greșește, asaltul se oprește
      // și baza rămâne cu viețile câte i-au mai rămas.
      g.lives[region]--; lifeLost = true;
      outcomeText = "Lovitură la bază! Vieți rămase: " + g.lives[region] + ". Continuă asaltul!";
    } else {
      g.owners[region] = attacker;
      if(g.bases[defender] === region){ delete g.lives[region]; }  // baza a căzut
      gained = region;
    }
  }
  // NU mai scădem aici atacurile — un atac (o tură) = un attackPick (vezi handleAttackPick).
  if(q){
    const rev = revealPrompt(q, g.qid, g.duel ? g.duel.mode : "duel", results || [], outcomeText, { region, gained, lifeLost, attacker, defender });
    g.prompt = rev;
  } else {
    g.prompt = { kind: "reveal", mode: "duel", outcome: outcomeText, region, gained, results: results || [] };
  }
  g.duel = null;
  g.lastOutcome = { text: outcomeText };
  broadcastGame(room);
  const hadWrong = (results || []).some(r => r.correct === false);
  if(lifeLost){
    // continuă asaltul pe aceeași bază (nouă rundă de duel), fără a consuma alt atac
    g.timer = setTimeout(() => beginDuel(room, attacker, defender, region, "duel-grila"), revealMs(false) + 700);
  } else {
    g.timer = setTimeout(() => nextAttackTurn(room), revealMs(hadWrong) + 800);
  }
}

// ---------- RESULTS ----------
function toResults(room){
  const g = room.game; clearGameTimer(room);
  g.phase = "RESULTS";
  const scores = computeScores(room);
  const board = g.order.map(id => ({
    playerId: id, nume: playerName(room, id), color: room.players.get(id).color,
    score: scores[id], regiuni: ownerRegions(room, id).length
  })).sort((a, b) => b.score - a.score);
  g.prompt = { kind: "results", board };
  g.lastOutcome = { text: "Final! Câștigă " + (board[0] ? board[0].nume : "—") + "." };
  broadcastGame(room);
}

// ---------- răspuns la întrebare (expansion + duel) ----------
function handleAnswer(ws, msg){
  const room = roomOf(ws); if(!room || !room.game) return;
  const g = room.game;
  if(!g.prompt || g.prompt.kind !== "question") return;
  if(Number(msg.qid) !== g.qid) return;
  if(g.answerers.indexOf(ws._playerId) < 0) return;     // nu participă la această întrebare
  if(g.answers.has(ws._playerId)) return;               // un singur răspuns
  g.answers.set(ws._playerId, { val: msg.val, time: Date.now(), target: msg.target ? String(msg.target) : null });
  // confirmă clientului că răspunsul a fost înregistrat
  send(ws, { t: "answered", qid: g.qid });
  // dacă au răspuns toți participanții conectați -> rezolvă imediat
  const pending = g.answerers.filter(id => room.players.get(id) && room.players.get(id).ws && !g.answers.has(id));
  if(!pending.length){
    clearGameTimer(room);
    if(g.mode === "expansion") return resolveExpansion(room);
    return resolveDuel(room);
  }
}

function handleClose(ws){
  const room = rooms.get(ws._roomCod);
  if(!room) return;
  const p = room.players.get(ws._playerId);
  if(!p || p.ws !== ws) return;
  p.ws = null;
  // marchează deconectat, dar păstrează locul pentru reconectare
  ensureHost(room);
  broadcastRoom(room);
  // grațiere: în LOBBY îl scoatem după RECONNECT_MS; în timpul jocului îi
  // păstrăm locul până la final (poate reveni oricând), ca să nu blocăm partida.
  if(p.dcTimer) clearTimeout(p.dcTimer);
  if(room.faza === "LOBBY"){
    p.dcTimer = setTimeout(() => {
      const cur = room.players.get(p.id);
      if(cur && !cur.ws) removePlayer(room, p.id);
    }, RECONNECT_MS);
  }
  scheduleEmptyCheck(room);
}

// ============================================================
//  Server HTTP (health) + WebSocket
// ============================================================
const server = http.createServer((req, res) => {
  // singura rută HTTP simplă: health (restul e WebSocket)
  if(req.url && req.url.replace(/\/game/, "").startsWith("/health")){
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, rooms: rooms.size, topics: TOPICS.size }));
  }
  res.writeHead(426, { "Content-Type": "text/plain" });
  res.end("Conquistador: doar WebSocket pe această rută.");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (data) => {
    let msg;
    try{ msg = JSON.parse(data.toString()); }
    catch(e){ return sendError(ws, "Mesaj invalid."); }
    if(!msg || typeof msg.t !== "string") return;

    switch(msg.t){
      case "create":    return handleCreate(ws, msg);
      case "join":      return handleJoin(ws, msg);
      case "reconnect": return handleReconnect(ws, msg);
      case "topic":     return handleTopic(ws, msg);
      case "mode":      return handleMode(ws, msg);
      case "mascot":    return handleMascot(ws, msg);
      case "emoji":     return handleEmoji(ws, msg);
      case "chat":      return handleChat(ws, msg);
      case "ready":     return handleReady(ws, msg);
      case "start":     return handleStart(ws);
      case "basePick":  return handleBasePick(ws, msg);
      case "select":    return handleSelect(ws, msg);
      case "attackPick":return handleAttackPick(ws, msg);
      case "answer":    return handleAnswer(ws, msg);
      case "leave":     {
        const room = rooms.get(ws._roomCod);
        if(room && room.players.has(ws._playerId)) removePlayer(room, ws._playerId);
        ws._roomCod = null; ws._playerId = null;
        return;
      }
      case "ping":      return send(ws, { t: "pong" });
      default:          return;
    }
  });

  ws.on("close", () => handleClose(ws));
  ws.on("error", () => {});
});

// heartbeat la nivel de protocol: taie conexiunile moarte (TTL ~60s)
const hb = setInterval(() => {
  wss.clients.forEach((ws) => {
    if(ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try{ ws.ping(); }catch(e){}
  });
}, 30000);
hb.unref();

loadQuestions();
server.listen(PORT, () => console.log("conquistador ascultă pe :" + PORT));

function shutdown(){ try{ clearInterval(hb); }catch(e){} process.exit(0); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
