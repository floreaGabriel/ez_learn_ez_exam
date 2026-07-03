// ============================================================
//  Among Us CS — server de joc multiplayer (Node + WebSocket)
//  ------------------------------------------------------------
//  Clonă „Among Us” cu temă de informatică, pe tiparul serviciului
//  Conquistador: un singur proces Node cu librăria `ws`, starea camerelor
//  DOAR în memorie (efemeră), proxat de nginx pe /amongus/ (cu upgrade WS).
//
//  Serverul e AUTORITAR — el deține adevărul despre:
//    • poziții (integrează inputul, aplică coliziunile cu harta),
//    • cine e impostor (nu pleacă NICIODATĂ spre echipaj),
//    • soluțiile minijocurilor (clientul primește doar enunțul amestecat),
//    • kill / report / ședințe / voturi / sabotaj / condiții de câștig.
//  Clientul doar trimite intenții (direcție, use, kill, vot) și randează.
//
//  Conținutul minijocurilor stă în content/*.yaml (un fișier per materie),
//  derivat din băncile conquistador/questions/*.yaml și din cursuri —
//  vezi content/_SCHEMA.md. Se încarcă la pornire, cu validare per tip.
//
//  Protocolul de mesaje e documentat în PROTOCOL.md.
// ============================================================
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { WebSocketServer } = require("ws");
const AMAP = require("./public/map.js");   // geometria partajată server+client

const PORT        = parseInt(process.env.PORT || "3003", 10);
const CONTENT_DIR = process.env.CONTENT_DIR || path.join(__dirname, "content");
const PUBLIC_DIR  = path.join(__dirname, "public");

const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS || "8", 10);
const MIN_PLAYERS = parseInt(process.env.MIN_PLAYERS || "4", 10);
const MAX_MATERII = parseInt(process.env.MAX_MATERII || "3", 10);   // câte materii pot fi combinate

// ---- ritmul simulării ----
const TICK_MS = 50;               // 20 actualizări / secundă

// ---- timere de joc (ms) ----
const T_DISCUTIE   = parseInt(process.env.T_DISCUTIE   || "45000", 10);  // ședință: discuție
const T_VOT        = parseInt(process.env.T_VOT        || "30000", 10);  // ședință: vot
const T_EJECT      = parseInt(process.env.T_EJECT      || "6000",  10);  // ecranul de ejectare
const T_FINAL      = parseInt(process.env.T_FINAL      || "12000", 10);  // ecranul final -> înapoi în lobby
const KILL_CD      = parseInt(process.env.KILL_CD      || "30000", 10);  // cooldown kill
const KILL_CD_START= parseInt(process.env.KILL_CD_START|| "15000", 10);  // cooldown la începutul rundei
const SABOTAJ_MS   = parseInt(process.env.SABOTAJ_MS   || "45000", 10);  // cât ai să repari kernelul
const SABOTAJ_CD   = parseInt(process.env.SABOTAJ_CD   || "40000", 10);  // pauza între sabotaje
const FIX_MS       = parseInt(process.env.FIX_MS       || "3000",  10);  // cât ții apăsat ca să repari
const BUTON_CD     = parseInt(process.env.BUTON_CD     || "20000", 10);  // buton urgență după ședință
const RECONNECT_MS = parseInt(process.env.RECONNECT_MS || "45000", 10);  // grațiere reconectare
const EMPTY_ROOM_MS= parseInt(process.env.EMPTY_ROOM_MS|| "60000", 10);  // cameră goală -> ștearsă

const TASKS_PER_PLAYER = parseInt(process.env.TASKS_PER_PLAYER || "4", 10);
const URGENTE_DE_PERSOANA = parseInt(process.env.URGENTE || "1", 10);    // ședințe de urgență / jucător

// Culorile jucătorilor (aceeași paletă ca la Conquistador) + numele lor
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const COLOR_NAMES = ["Roșu", "Albastru", "Verde", "Galben", "Mov", "Roz", "Turcoaz", "Portocaliu"];

// Numele tipurilor de minijoc (apar în lista de taskuri, înainte de deschidere)
const TIP_NUME = {
  fire:      "Conectează firele",
  ordonare:  "Pune în ordine",
  calibrare: "Calibrează valoarea",
  stiva:     "Golește stiva",
  arbore:    "Parcurge arborele",
  sortare:   "Sortează pachetele",
  stari:     "Diagrama de stări",
  sql:       "Repară interogarea"
};
const TIPURI = Object.keys(TIP_NUME);

// ============================================================
//  Conținutul minijocurilor — încărcat din content/*.yaml la pornire.
//  CONTINUT: Map<materieId, {materie, nume, icon, fire:[], ordonare:[], ...}>
//  Soluțiile NU pleacă spre client: din aceste structuri se construiesc
//  instanțe {spec (public), solutie (rămâne pe server)}.
// ============================================================
const CONTINUT = new Map();

function esteText(s){ return typeof s === "string" && s.trim().length > 0; }
function esteIntreg(n){ return Number.isInteger(n); }
function distincte(arr){ return new Set(arr).size === arr.length; }

// puzzle-ul de stivă e rezolvabil? (simulare greedy — unica strategie corectă)
function realizabilaStiva(sosire, iesire){
  const st = [];
  let next = 0;
  for(const out of iesire){
    if(st.length && st[st.length - 1] === out){ st.pop(); continue; }
    let found = false;
    while(next < sosire.length){
      const v = sosire[next++];
      if(v === out){ found = true; break; }
      st.push(v);
    }
    if(!found) return false;
  }
  return st.length === 0;
}

function culegeValori(nod, acc){
  if(!nod || typeof nod !== "object") return acc;
  acc.push(nod.v);
  culegeValori(nod.st, acc); culegeValori(nod.dr, acc);
  return acc;
}
function parcurgeArbore(nod, tip, acc){
  if(!nod) return acc;
  if(tip === "preordine") acc.push(nod.v);
  parcurgeArbore(nod.st, tip, acc);
  if(tip === "inordine") acc.push(nod.v);
  parcurgeArbore(nod.dr, tip, acc);
  if(tip === "postordine") acc.push(nod.v);
  return acc;
}
// o singură trecere de bubble sort (stânga -> dreapta)
function trecereBubble(valori){
  const a = valori.slice();
  for(let i = 0; i < a.length - 1; i++){
    if(a[i] > a[i + 1]){ const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }
  }
  return a;
}
function numaraGoluri(sablon){ return (String(sablon).match(/___/g) || []).length; }

// validatoare per tip de conținut — intrările stricate sunt sărite cu avertisment
const VALID = {
  fire(e){
    if(!esteText(e.titlu) || !Array.isArray(e.perechi)) return "lipsește titlu/perechi";
    if(e.perechi.length < 3 || e.perechi.length > 6) return "3–6 perechi";
    for(const p of e.perechi){
      if(!Array.isArray(p) || p.length !== 2 || !esteText(String(p[0])) || !esteText(String(p[1]))) return "pereche invalidă";
    }
    if(!distincte(e.perechi.map(p => String(p[0]))) || !distincte(e.perechi.map(p => String(p[1])))) return "valori duplicate";
    return null;
  },
  ordonare(e){
    if(!esteText(e.titlu) || !Array.isArray(e.pasi)) return "lipsește titlu/pasi";
    if(e.pasi.length < 3 || e.pasi.length > 8) return "3–8 pași";
    if(!e.pasi.every(p => esteText(String(p))) || !distincte(e.pasi.map(String))) return "pași invalizi/duplicat";
    return null;
  },
  calibrare(e){
    if(!esteText(e.intrebare)) return "lipsește întrebarea";
    if(![e.min, e.max, e.corect].every(esteIntreg)) return "min/max/corect trebuie întregi";
    if(!(e.min < e.corect && e.corect < e.max)) return "corect nu e strict între min și max";
    if(e.max - e.min < 5) return "interval prea mic";
    return null;
  },
  stiva(e){
    if(!esteText(e.titlu) || !Array.isArray(e.sosire) || !Array.isArray(e.iesire)) return "lipsește titlu/sosire/iesire";
    if(e.sosire.length < 3 || e.sosire.length > 6) return "3–6 elemente";
    const a = e.sosire.map(String), b = e.iesire.map(String);
    if(a.length !== b.length || a.slice().sort().join("") !== b.slice().sort().join("")) return "sosire/iesire nu au aceleași elemente";
    if(!distincte(a)) return "elemente duplicate";
    if(!realizabilaStiva(a, b)) return "ieșirea NU e realizabilă cu o stivă";
    return null;
  },
  arbore(e){
    if(!esteText(e.titlu) || !e.rad || typeof e.rad !== "object") return "lipsește titlu/rad";
    const vals = culegeValori(e.rad, []);
    if(vals.length < 3 || vals.length > 9) return "3–9 noduri";
    if(vals.some(v => v === undefined || v === null) || !distincte(vals.map(String))) return "valori lipsă/duplicat";
    const ok = ["inordine", "preordine", "postordine"];
    if(!Array.isArray(e.parcurgeri) || !e.parcurgeri.length || !e.parcurgeri.every(p => ok.includes(p))) return "parcurgeri invalide";
    return null;
  },
  sortare(e){
    if(!esteText(e.titlu) || !Array.isArray(e.valori)) return "lipsește titlu/valori";
    if(e.valori.length < 4 || e.valori.length > 7 || !e.valori.every(esteIntreg)) return "4–7 numere întregi";
    if(!distincte(e.valori.map(String))) return "valori duplicate";
    const sortat = e.valori.slice().sort((a, b) => a - b);
    if(sortat.join(",") === e.valori.join(",")) return "șirul e deja sortat";
    return null;
  },
  stari(e){
    if(!esteText(e.titlu) || !Array.isArray(e.noduri) || !Array.isArray(e.tranzitii)) return "lipsește titlu/noduri/tranzitii";
    if(e.noduri.length < 3 || e.noduri.length > 6 || !distincte(e.noduri.map(String))) return "3–6 noduri distincte";
    if(e.tranzitii.length < 3 || e.tranzitii.length > 8) return "3–8 tranziții";
    for(const t of e.tranzitii){
      if(!t || !e.noduri.includes(t.de) || !e.noduri.includes(t.la) || !esteText(t.eticheta)) return "tranziție invalidă";
    }
    if(!distincte(e.tranzitii.map(t => t.eticheta))) return "etichete duplicate";
    return null;
  },
  sql(e){
    if(!esteText(e.titlu) || !esteText(e.sablon) || !Array.isArray(e.goluri)) return "lipsește titlu/sablon/goluri";
    if(numaraGoluri(e.sablon) !== e.goluri.length) return "nr. de ___ diferă de goluri";
    if(!e.goluri.length || !e.goluri.every(g => esteText(String(g)))) return "goluri invalide";
    if(e.momeli && !Array.isArray(e.momeli)) return "momeli invalide";
    return null;
  }
};

function loadContent(){
  CONTINUT.clear();
  let files = [];
  try{ files = fs.readdirSync(CONTENT_DIR).filter(f => /\.ya?ml$/i.test(f)); }
  catch(e){ console.error("nu pot citi", CONTENT_DIR, "-", e.message); }

  for(const f of files){
    try{
      const doc = yaml.load(fs.readFileSync(path.join(CONTENT_DIR, f), "utf8")) || {};
      const id = String(doc.materie || f.replace(/\.ya?ml$/i, ""));
      const mat = { materie: id, nume: doc.nume || id, icon: doc.icon || "📚" };
      let total = 0;
      for(const tip of TIPURI){
        const lista = Array.isArray(doc[tip]) ? doc[tip] : [];
        mat[tip] = [];
        for(const e of lista){
          const err = VALID[tip](e || {});
          if(err){ console.warn(`content ${id}/${tip} „${(e && e.titlu) || "?"}”: ${err} — sărit`); continue; }
          // la sql: o momeală identică cu un gol ar face potrivirea ambiguă — o eliminăm
          if(tip === "sql" && Array.isArray(e.momeli)){
            e.momeli = e.momeli.map(String).filter(m => !e.goluri.map(String).includes(m));
          }
          mat[tip].push(e);
        }
        total += mat[tip].length;
      }
      if(!total){ console.warn("materia", id, "fără conținut valid — sărită"); continue; }
      CONTINUT.set(id, mat);
      console.log("materie încărcată:", id, "·", total, "intrări",
        "(" + TIPURI.filter(t => mat[t].length).map(t => t + ":" + mat[t].length).join(" ") + ")");
    }catch(e){ console.error("eroare YAML în", f, "-", e.message); }
  }
  console.log("total materii:", CONTINUT.size);
}

// lista materiilor pentru client (FĂRĂ conținut, doar metadate)
function materiiForClient(){
  return Array.from(CONTINUT.values()).map(m => ({
    id: m.materie, nume: m.nume, icon: m.icon,
    intrari: TIPURI.reduce((s, t) => s + m[t].length, 0)
  }));
}

// ============================================================
//  Instanțe de minijoc — spec (public, amestecat) + solutie (pe server)
// ============================================================
function shuffle(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// permutare care NU e identitatea (altfel „amestecatul” ar da răspunsul de-a gata)
function permutareNeidentica(n){
  if(n < 2) return [0];
  let p;
  do{ p = shuffle(Array.from({length: n}, (_, i) => i)); }
  while(p.every((v, i) => v === i));
  return p;
}
function alege(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

// construiește o instanță jucabilă din intrarea de conținut
function construiesteInstanta(tip, e){
  if(tip === "fire"){
    const perm = permutareNeidentica(e.perechi.length);
    return {
      spec: { titlu: e.titlu, context: e.context || null,
              etichete: { stanga: e.stanga || "", dreapta: e.dreapta || "" },
              stanga: e.perechi.map(p => String(p[0])),
              dreapta: perm.map(i => String(e.perechi[i][1])) },
      solutie: { dreapta: e.perechi.map(p => String(p[1])) }   // per index din stânga
    };
  }
  if(tip === "ordonare"){
    const perm = permutareNeidentica(e.pasi.length);
    return {
      spec: { titlu: e.titlu, context: e.context || null, itemi: perm.map(i => String(e.pasi[i])) },
      solutie: { ordine: e.pasi.map(String) }
    };
  }
  if(tip === "calibrare"){
    const tol = Math.max(e.tol || 0, Math.round((e.max - e.min) * 0.02));
    return {
      spec: { titlu: e.intrebare, context: e.context || null,
              intrebare: e.intrebare, min: e.min, max: e.max, unitate: e.unitate || "" },
      solutie: { corect: e.corect, tol }
    };
  }
  if(tip === "stiva"){
    return {
      spec: { titlu: e.titlu, context: e.context || null,
              sosire: e.sosire.map(String), iesire: e.iesire.map(String) },
      solutie: { sosire: e.sosire.map(String), iesire: e.iesire.map(String) }
    };
  }
  if(tip === "arbore"){
    const fel = alege(e.parcurgeri);
    return {
      spec: { titlu: e.titlu, context: e.context || null, arbore: e.rad, fel },
      solutie: { secventa: parcurgeArbore(e.rad, fel, []).map(String) }
    };
  }
  if(tip === "sortare"){
    return {
      spec: { titlu: e.titlu, context: e.context || null, valori: e.valori.slice() },
      solutie: { rezultat: trecereBubble(e.valori) }
    };
  }
  if(tip === "stari"){
    const perm = permutareNeidentica(e.tranzitii.length);
    return {
      spec: { titlu: e.titlu, context: e.context || null,
              noduri: e.noduri.slice(),
              sageti: e.tranzitii.map(t => ({ de: t.de, la: t.la })),
              etichete: perm.map(i => e.tranzitii[i].eticheta) },
      solutie: { etichete: e.tranzitii.map(t => t.eticheta) }   // per săgeată
    };
  }
  if(tip === "sql"){
    const frag = e.goluri.map(String).concat((e.momeli || []).map(String));
    const perm = permutareNeidentica(frag.length);
    return {
      spec: { titlu: e.titlu, context: e.context || null,
              sablon: e.sablon, fragmente: perm.map(i => frag[i]) },
      solutie: { goluri: e.goluri.map(String) }
    };
  }
  return null;
}

// verifică răspunsul clientului pentru instanța construită mai sus.
// Compară VALORI (nu indici), ca răspunsul să fie corect indiferent de amestec.
function valideazaRaspuns(tip, inst, raspuns){
  const spec = inst.spec, sol = inst.solutie;
  const r = raspuns || {};
  if(tip === "fire"){
    const a = Array.isArray(r.alegeri) ? r.alegeri : [];
    if(a.length !== sol.dreapta.length || !distincte(a.map(Number))) return false;
    return a.every((idx, l) => spec.dreapta[idx] === sol.dreapta[l]);
  }
  if(tip === "ordonare"){
    const a = Array.isArray(r.ordine) ? r.ordine : [];
    if(a.length !== sol.ordine.length || !distincte(a.map(Number))) return false;
    return a.every((idx, k) => spec.itemi[idx] === sol.ordine[k]);
  }
  if(tip === "calibrare"){
    const v = Number(r.valoare);
    return isFinite(v) && Math.abs(v - sol.corect) <= sol.tol;
  }
  if(tip === "stiva"){
    const ops = Array.isArray(r.operatii) ? r.operatii : [];
    if(ops.length > 40) return false;
    const st = []; const out = []; let next = 0;
    for(const op of ops){
      if(op === "push"){ if(next >= sol.sosire.length) return false; st.push(sol.sosire[next++]); }
      else if(op === "pop"){ if(!st.length) return false; out.push(st.pop()); }
      else return false;
    }
    return out.length === sol.iesire.length && out.every((v, i) => v === sol.iesire[i]);
  }
  if(tip === "arbore"){
    const a = Array.isArray(r.secventa) ? r.secventa.map(String) : [];
    return a.length === sol.secventa.length && a.every((v, i) => v === sol.secventa[i]);
  }
  if(tip === "sortare"){
    const a = Array.isArray(r.rezultat) ? r.rezultat.map(Number) : [];
    return a.length === sol.rezultat.length && a.every((v, i) => v === sol.rezultat[i]);
  }
  if(tip === "stari"){
    const a = Array.isArray(r.alegeri) ? r.alegeri : [];
    if(a.length !== sol.etichete.length || !distincte(a.map(Number))) return false;
    return a.every((idx, k) => spec.etichete[idx] === sol.etichete[k]);
  }
  if(tip === "sql"){
    const a = Array.isArray(r.alegeri) ? r.alegeri : [];
    if(a.length !== sol.goluri.length || !distincte(a.map(Number))) return false;
    return a.every((idx, k) => spec.fragmente[idx] === sol.goluri[k]);
  }
  return false;
}

// ============================================================
//  Camere (în memorie)
//  Room: { cod, players:Map<id,P>, order:[ids], hostId, faza, materii,
//          impostori, createdAt, emptyTimer, game }
//  P:    { id, nume, color(idx), ready, ws|null, dcTimer, dcSince,
//          + în joc: rol, viu, x, y, dx, dy, tasks, activeTask,
//            killReadyAt, urgente, ghostVazut }
// ============================================================
const rooms = new Map();

function genCode(){
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let cod;
  do{ cod = ""; for(let i = 0; i < 4; i++) cod += A[Math.floor(Math.random() * A.length)]; }
  while(rooms.has(cod));
  return cod;
}
function genId(){ return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); }

function sanitizeName(s){
  s = (typeof s === "string" ? s : "").trim().replace(/\s+/g, " ").slice(0, 16);
  return s || "Anonim";
}

function send(ws, obj){
  if(ws && ws.readyState === ws.OPEN){ try{ ws.send(JSON.stringify(obj)); }catch(e){} }
}
function sendTo(room, id, obj){ const p = room.players.get(id); if(p) send(p.ws, obj); }
function broadcast(room, obj, filtru){
  const msg = JSON.stringify(obj);
  for(const id of room.order){
    const p = room.players.get(id);
    if(!p || !p.ws || p.ws.readyState !== p.ws.OPEN) continue;
    if(filtru && !filtru(p)) continue;
    try{ p.ws.send(msg); }catch(e){}
  }
}
function sendError(ws, msg){ send(ws, { t: "error", msg }); }

function publicPlayers(room){
  return room.order.map(id => {
    const p = room.players.get(id);
    return { id: p.id, nume: p.nume, color: p.color, ready: p.ready,
             host: id === room.hostId, connected: !!p.ws };
  });
}
function lobbyState(room){
  return {
    t: "lobby", cod: room.cod, faza: room.faza, hostId: room.hostId,
    materii: room.materii, maxMaterii: MAX_MATERII, impostori: room.impostori,
    minPlayers: MIN_PLAYERS, maxPlayers: MAX_PLAYERS,
    jucatori: publicPlayers(room)
  };
}

function deleteRoom(room){
  if(room.emptyTimer) clearTimeout(room.emptyTimer);
  if(room.game && room.game.timer) clearTimeout(room.game.timer);
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
function ensureHost(room){
  if(room.players.has(room.hostId) && room.players.get(room.hostId).ws) return;
  const next = room.order.find(id => room.players.get(id) && room.players.get(id).ws);
  if(next) room.hostId = next;
}
function roomOf(ws){
  const room = rooms.get(ws._roomCod);
  if(!room || !room.players.has(ws._playerId)) return null;
  return room;
}
function playerOf(ws){
  const room = roomOf(ws);
  return room ? { room, p: room.players.get(ws._playerId) } : null;
}

// scoate un jucător din LOBBY (în timpul jocului slotul rămâne — poate reveni)
function removePlayer(room, id){
  const p = room.players.get(id);
  if(!p) return;
  if(room.faza !== "LOBBY"){
    if(p.ws){ try{ p.ws.close(); }catch(e){} }
    p.ws = null; p.dcSince = Date.now();
    checkWin(room);
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
//  Handlere de lobby
// ============================================================
function handleCreate(ws, msg){
  const cod = genCode();
  const id = genId();
  const player = { id, nume: sanitizeName(msg.nume), color: 0, ready: false, ws, dcTimer: null, dcSince: 0 };
  const room = {
    cod, players: new Map([[id, player]]), order: [id], hostId: id,
    faza: "LOBBY", materii: [], impostori: 1,
    createdAt: Date.now(), emptyTimer: null, game: null
  };
  rooms.set(cod, room);
  ws._roomCod = cod; ws._playerId = id;
  console.log("cameră creată:", cod, "de", player.nume);
  send(ws, { t: "joined", cod, playerId: id, materii: materiiForClient() });
  broadcast(room, lobbyState(room));
}

function handleJoin(ws, msg){
  const cod = String(msg.cod || "").toUpperCase().trim();
  const room = rooms.get(cod);
  if(!room) return sendError(ws, "Camera nu există. Verifică codul.");
  if(room.faza !== "LOBBY") return sendError(ws, "Partida a început deja.");
  if(room.order.length >= MAX_PLAYERS) return sendError(ws, "Camera e plină (" + MAX_PLAYERS + " jucători).");

  const id = genId();
  const luate = new Set(Array.from(room.players.values()).map(q => q.color));
  let color = 0; while(luate.has(color) && color < COLORS.length - 1) color++;
  const player = { id, nume: sanitizeName(msg.nume), color, ready: false, ws, dcTimer: null, dcSince: 0 };
  room.players.set(id, player);
  room.order.push(id);
  ws._roomCod = cod; ws._playerId = id;
  if(room.emptyTimer){ clearTimeout(room.emptyTimer); room.emptyTimer = null; }
  console.log(player.nume, "a intrat în", cod);
  send(ws, { t: "joined", cod, playerId: id, materii: materiiForClient() });
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
  p.ws = ws; p.dcSince = 0;
  ws._roomCod = cod; ws._playerId = p.id;
  if(room.emptyTimer){ clearTimeout(room.emptyTimer); room.emptyTimer = null; }
  ensureHost(room);
  console.log(p.nume, "s-a reconectat la", cod);
  send(ws, { t: "joined", cod, playerId: p.id, materii: materiiForClient() });
  if(room.faza === "LOBBY") broadcast(room, lobbyState(room));
  else resync(room, p);
}

// retrimite unui jucător toată starea necesară după reconectare în joc
function resync(room, p){
  const g = room.game; if(!g) return;
  send(p.ws, { t: "startat", faza: room.faza });
  trimiteRol(room, p);
  trimiteTaskuri(room, p);
  send(p.ws, { t: "roster", jucatori: rosterMeeting(room) });
  if(g.sabotaj) send(p.ws, { t: "sabotaj", activ: true, tip: g.sabotaj.tip, ramas: Math.max(0, g.sabotaj.endsAt - Date.now()) });
  if(room.faza === "MEETING" && g.meeting){
    send(p.ws, mesajMeeting(room));
    if(g.meeting.faza === "vot") send(p.ws, { t: "meetingFaza", faza: "vot", pana: g.meeting.endsAt });
  }
  if(room.faza === "END" && g.final) send(p.ws, g.final);
  broadcast(room, lobbyState(room));   // roster/connected actualizat pentru toți
}

function handleMaterie(ws, msg){
  const room = roomOf(ws); if(!room) return;
  if(ws._playerId !== room.hostId) return sendError(ws, "Doar gazda alege materiile.");
  if(room.faza !== "LOBBY") return;
  const id = String(msg.id || "");
  if(!CONTINUT.has(id)) return sendError(ws, "Materie necunoscută.");
  const i = room.materii.indexOf(id);
  if(i >= 0) room.materii.splice(i, 1);
  else if(room.materii.length >= MAX_MATERII) return sendError(ws, "Poți alege maxim " + MAX_MATERII + " materii.");
  else room.materii.push(id);
  for(const p of room.players.values()) p.ready = false;   // reconfirmă pe noua alegere
  broadcast(room, lobbyState(room));
}

function handleImpostori(ws, msg){
  const room = roomOf(ws); if(!room) return;
  if(ws._playerId !== room.hostId) return sendError(ws, "Doar gazda setează impostorii.");
  if(room.faza !== "LOBBY") return;
  const n = Number(msg.n);
  if(n !== 1 && n !== 2) return sendError(ws, "1 sau 2 impostori.");
  room.impostori = n;
  for(const p of room.players.values()) p.ready = false;
  broadcast(room, lobbyState(room));
}

function handleCuloare(ws, msg){
  const room = roomOf(ws); if(!room) return;
  const p = room.players.get(ws._playerId); if(!p) return;
  if(room.faza !== "LOBBY") return;
  const c = Number(msg.idx);
  if(!Number.isInteger(c) || c < 0 || c >= COLORS.length) return;
  const luata = Array.from(room.players.values()).some(q => q !== p && q.color === c);
  if(luata) return sendError(ws, "Culoarea e luată deja.");
  p.color = c;
  broadcast(room, lobbyState(room));
}

function handleReady(ws, msg){
  const room = roomOf(ws); if(!room) return;
  const p = room.players.get(ws._playerId); if(!p) return;
  if(room.faza !== "LOBBY") return;
  p.ready = !!msg.ready;
  broadcast(room, lobbyState(room));
}

function handleStart(ws){
  const room = roomOf(ws); if(!room) return;
  if(ws._playerId !== room.hostId) return sendError(ws, "Doar gazda poate porni jocul.");
  if(room.faza !== "LOBBY") return;
  const conectati = room.order.filter(id => room.players.get(id).ws);
  if(conectati.length < MIN_PLAYERS) return sendError(ws, "E nevoie de minim " + MIN_PLAYERS + " jucători conectați.");
  if(!room.materii.length) return sendError(ws, "Alege cel puțin o materie.");
  if(room.impostori * 2 >= conectati.length) return sendError(ws, "Prea mulți impostori pentru " + conectati.length + " jucători.");
  if(!conectati.every(id => room.players.get(id).ready)) return sendError(ws, "Nu toți jucătorii sunt pregătiți.");
  // jucătorii rămași deconectați în lobby nu intră în partidă
  for(const id of room.order.slice()){
    if(!room.players.get(id).ws) removePlayer(room, id);
  }
  startGame(room);
}

// ============================================================
//  Pornirea partidei: roluri, poziții, taskuri
// ============================================================
function pozitiiSpawn(room){
  const n = room.order.length;
  room.order.forEach((id, i) => {
    const p = room.players.get(id);
    const a = (2 * Math.PI * i) / n;
    p.x = AMAP.SPAWN.x + Math.cos(a) * AMAP.SPAWN.r;
    p.y = AMAP.SPAWN.y + Math.sin(a) * AMAP.SPAWN.r;
    p.dx = 0; p.dy = 0;
    if(!AMAP.canStand(p.x, p.y)){ p.x = AMAP.SPAWN.x; p.y = AMAP.SPAWN.y; }
  });
}

// împarte taskurile unui jucător: echilibrat între materiile alese,
// tipuri diverse, stații cât mai diferite
function imparteTaskuri(room, p, seed){
  const tasks = [];
  const statii = shuffle(AMAP.STATIONS.slice());
  for(let k = 0; k < TASKS_PER_PLAYER; k++){
    const matId = room.materii[(seed + k) % room.materii.length];
    const mat = CONTINUT.get(matId);
    if(!mat) continue;
    const disponibile = TIPURI.filter(t => mat[t].length);
    if(!disponibile.length) continue;
    const tip = alege(disponibile);
    const idx = Math.floor(Math.random() * mat[tip].length);
    const st = statii[k % statii.length];
    tasks.push({
      tid: "t" + (room.game.nextTid++),
      statie: st.id, materie: matId, tip, idx,
      done: false
    });
  }
  return tasks;
}

function trimiteRol(room, p){
  if(p.rol === "impostor"){
    const colegi = room.order
      .filter(id => id !== p.id && room.players.get(id).rol === "impostor")
      .map(id => ({ id, nume: room.players.get(id).nume, color: room.players.get(id).color }));
    send(p.ws, { t: "rol", rol: "impostor", colegi });
  } else {
    send(p.ws, { t: "rol", rol: "crew", colegi: [] });
  }
}
function trimiteTaskuri(room, p){
  send(p.ws, {
    t: "tasks",
    fake: p.rol === "impostor",   // impostorul își vede lista „de fațadă”
    lista: p.tasks.map(tk => ({
      tid: tk.tid, statie: tk.statie, materie: tk.materie, tip: tk.tip,
      nume: TIP_NUME[tk.tip], done: tk.done
    }))
  });
}
// roster complet (nume+culori+viu) — clientul îl folosește la randare și la vot
function rosterMeeting(room){
  return room.order.map(id => {
    const q = room.players.get(id);
    return { id, nume: q.nume, color: q.color, viu: !!q.viu, connected: !!q.ws };
  });
}

function startGame(room){
  const now = Date.now();
  room.faza = "PLAY";
  room.game = {
    startedAt: now, nextTid: 1,
    tasksDone: 0,
    bodies: [], nextBid: 1,
    meeting: null, sabotaj: null,
    saboCdUntil: now + SABOTAJ_CD,      // fără sabotaj în primele secunde
    butonCdUntil: now + BUTON_CD,       // nici ședințe de urgență imediat
    fixeri: new Set(), fixPct: 0,
    timer: null, final: null, lastSnap: 0
  };
  // roluri: amestecăm ordinea și primii N devin impostori
  const idsAmestecate = shuffle(room.order.slice());
  room.order.forEach(id => {
    const p = room.players.get(id);
    p.rol = "crew"; p.viu = true; p.ghost = false;
    p.killReadyAt = now + KILL_CD_START;
    p.urgente = URGENTE_DE_PERSOANA;
    p.activeTask = null; p.fixing = false;
  });
  for(let i = 0; i < room.impostori; i++) room.players.get(idsAmestecate[i]).rol = "impostor";

  pozitiiSpawn(room);
  room.order.forEach((id, i) => {
    const p = room.players.get(id);
    p.tasks = imparteTaskuri(room, p, i);
  });

  console.log("pornire Among Us CS în camera", room.cod,
    "· materii", room.materii.join("+"), "· impostori", room.impostori, "· jucători", room.order.length);

  broadcast(room, { t: "startat", faza: "PLAY" });
  broadcast(room, { t: "roster", jucatori: rosterMeeting(room) });
  for(const id of room.order){
    const p = room.players.get(id);
    trimiteRol(room, p);
    trimiteTaskuri(room, p);
  }
  trimiteProgres(room);
}

// ============================================================
//  Progresul taskurilor + condiții de câștig
// ============================================================
// taskurile cui SE PUN la socoteală: echipaj (viu sau fantomă) care nu e
// deconectat de prea mult (un AFK definitiv nu trebuie să blocheze victoria)
function crewCuTaskuri(room){
  const now = Date.now();
  return room.order
    .map(id => room.players.get(id))
    .filter(p => p.rol === "crew" && (p.ws || (p.dcSince && now - p.dcSince < RECONNECT_MS)));
}
function progres(room){
  const lista = crewCuTaskuri(room);
  let total = 0, done = 0;
  for(const p of lista){ for(const tk of p.tasks){ total++; if(tk.done) done++; } }
  return { done, total };
}
function trimiteProgres(room){
  const pr = progres(room);
  broadcast(room, { t: "progres", done: pr.done, total: pr.total });
}

function aliveOf(room, rol){
  return room.order.map(id => room.players.get(id)).filter(p => p.viu && (!rol || p.rol === rol));
}

function checkWin(room){
  if(room.faza === "LOBBY" || room.faza === "END" || !room.game) return false;
  const impVii = aliveOf(room, "impostor").length;
  const crewVii = aliveOf(room, "crew").length;
  const pr = progres(room);
  let castiga = null, motiv = null;
  if(impVii === 0){ castiga = "crew"; motiv = "Toți impostorii au fost eliminați."; }
  else if(pr.total > 0 && pr.done >= pr.total){ castiga = "crew"; motiv = "Echipajul a terminat toate taskurile."; }
  else if(impVii >= crewVii){ castiga = "impostor"; motiv = "Impostorii sunt cel puțin cât echipajul."; }
  if(!castiga) return false;
  terminaJocul(room, castiga, motiv);
  return true;
}

function terminaJocul(room, castiga, motiv){
  const g = room.game;
  if(g.timer){ clearTimeout(g.timer); g.timer = null; }
  room.faza = "END";
  g.meeting = null; g.sabotaj = null; g.fixeri.clear();
  const impostori = room.order
    .filter(id => room.players.get(id).rol === "impostor")
    .map(id => ({ id, nume: room.players.get(id).nume, color: room.players.get(id).color }));
  g.final = { t: "final", castiga, motiv, impostori };
  broadcast(room, g.final);
  console.log("final în", room.cod, "->", castiga, "(", motiv, ")");
  // înapoi în lobby pentru revanșă
  g.timer = setTimeout(() => {
    room.faza = "LOBBY";
    room.game = null;
    for(const p of room.players.values()){
      p.ready = false; p.rol = null; p.viu = true; p.tasks = []; p.activeTask = null;
    }
    // sloturile rămase fără conexiune se curăță la revenirea în lobby
    for(const id of room.order.slice()){
      if(!room.players.get(id).ws) removePlayer(room, id);
    }
    if(rooms.has(room.cod)) broadcast(room, lobbyState(room));
  }, T_FINAL);
}

// ============================================================
//  Bucla de simulare (globală, 20 Hz): mișcare + sabotaj + snapshot-uri
// ============================================================
function handleInput(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY") return;      // (și fantomele se pot plimba)
  const cl = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
  p.dx = cl(Number(msg.dx) || 0);
  p.dy = cl(Number(msg.dy) || 0);
}

function integreaza(room, dt){
  for(const id of room.order){
    const p = room.players.get(id);
    if(!p.ws) { p.dx = 0; p.dy = 0; }
    if(!p.dx && !p.dy) continue;
    // integrarea partajată cu clientul (alunecare pe pereți + ajutor de colț)
    const poz = AMAP.misca(p.x, p.y, p.dx, p.dy, AMAP.SPEED * dt);
    p.x = poz[0]; p.y = poz[1];
    // dacă s-a îndepărtat de stația taskului deschis, îl închidem
    if(p.activeTask){
      const st = statiaLui(p.activeTask.statie);
      if(st && AMAP.dist(p.x, p.y, st.x, st.y) > AMAP.USE_R * 1.6){
        p.activeTask = null;
        send(p.ws, { t: "taskInchis" });
      }
    }
  }
}

function statiaLui(id){ return AMAP.STATIONS.find(s => s.id === id) || null; }

// snapshot per destinatar — anti-cheat:
//  • cei vii văd DOAR jucătorii vii din raza de vizibilitate (fără wallhack
//    prin DevTools) și cadavrele din apropiere;
//  • fantomele văd tot (inclusiv alte fantome).
function snapshotPentru(room, dest){
  const g = room.game;
  const acum = Date.now();
  const vede = [];
  for(const id of room.order){
    const p = room.players.get(id);
    if(p === dest){ continue; }
    if(dest.viu){
      if(!p.viu) continue;
      if(AMAP.dist(dest.x, dest.y, p.x, p.y) > AMAP.VISION + 80) continue;
    }
    const e = { id: p.id, x: Math.round(p.x), y: Math.round(p.y), dx: p.dx, dy: p.dy };
    if(!dest.viu) e.viu = p.viu ? 1 : 0;
    vede.push(e);
  }
  const bodies = g.bodies
    .filter(b => !dest.viu || AMAP.dist(dest.x, dest.y, b.x, b.y) <= AMAP.VISION + 80)
    .map(b => ({ bid: b.bid, x: b.x, y: b.y, color: b.color }));
  return {
    t: "snap", now: acum,
    jucatori: vede, bodies,
    me: {
      x: Math.round(dest.x), y: Math.round(dest.y), viu: dest.viu ? 1 : 0,
      kill: dest.rol === "impostor" ? Math.max(0, Math.ceil((dest.killReadyAt - acum) / 1000)) : null,
      urgente: dest.urgente,
      sabo: dest.rol === "impostor" ? Math.max(0, Math.ceil((g.saboCdUntil - acum) / 1000)) : null
    },
    sabotaj: g.sabotaj ? { tip: g.sabotaj.tip, ramas: Math.max(0, g.sabotaj.endsAt - acum), pct: Math.round(g.fixPct * 100) } : null
  };
}

const GLOBAL_TICK = setInterval(() => {
  const now = Date.now();
  for(const room of rooms.values()){
    if(room.faza !== "PLAY" || !room.game) continue;
    const g = room.game;
    integreaza(room, TICK_MS / 1000);

    // sabotajul critic: progres de reparare / expirare
    if(g.sabotaj){
      // repară doar cine ține apăsat, e viu și e lângă punctul de fix
      for(const fid of Array.from(g.fixeri)){
        const f = room.players.get(fid);
        if(!f || !f.viu || !f.ws || AMAP.dist(f.x, f.y, AMAP.FIX_KERNEL.x, AMAP.FIX_KERNEL.y) > AMAP.USE_R * 1.4){
          g.fixeri.delete(fid);
        }
      }
      if(g.fixeri.size > 0) g.fixPct += TICK_MS / FIX_MS;
      if(g.fixPct >= 1){
        g.sabotaj = null; g.fixeri.clear(); g.fixPct = 0;
        broadcast(room, { t: "sabotaj", activ: false });
      } else if(now >= g.sabotaj.endsAt){
        terminaJocul(room, "impostor", "Nucleul s-a supraîncălzit — sabotaj nereparat.");
        continue;
      }
    }

    // snapshot-uri 20/s (poziții mărunte -> mesaje mici)
    for(const id of room.order){
      const p = room.players.get(id);
      if(p.ws && p.ws.readyState === p.ws.OPEN){
        try{ p.ws.send(JSON.stringify(snapshotPentru(room, p))); }catch(e){}
      }
    }
  }
}, TICK_MS);
GLOBAL_TICK.unref();

// ============================================================
//  Acțiuni în joc: taskuri, kill, report, urgență, sabotaj, fix
// ============================================================
function handleTaskOpen(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY") return;
  const tk = (p.tasks || []).find(t => t.tid === String(msg.tid || ""));
  if(!tk) return sendError(ws, "Nu e taskul tău.");
  if(tk.done) return sendError(ws, "Task deja rezolvat.");
  const st = statiaLui(tk.statie);
  if(!st || AMAP.dist(p.x, p.y, st.x, st.y) > AMAP.USE_R) return sendError(ws, "Apropie-te de stație.");
  const mat = CONTINUT.get(tk.materie);
  const entry = mat && mat[tk.tip] && mat[tk.tip][tk.idx];
  if(!entry) return sendError(ws, "Conținut lipsă pentru task.");
  const inst = construiesteInstanta(tk.tip, entry);
  p.activeTask = { tid: tk.tid, tip: tk.tip, inst };
  send(ws, { t: "task", tid: tk.tid, tip: tk.tip, materie: tk.materie, spec: inst.spec });
}

function handleTaskSubmit(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY" || !p.activeTask) return;
  if(p.activeTask.tid !== String(msg.tid || "")) return;
  const tk = p.tasks.find(t => t.tid === p.activeTask.tid);
  if(!tk || tk.done) return;
  const ok = valideazaRaspuns(p.activeTask.tip, p.activeTask.inst, msg.raspuns);
  if(!ok){
    // răspuns greșit: poate încerca din nou pe aceeași instanță
    return send(ws, { t: "taskRezultat", tid: tk.tid, ok: false, done: false });
  }
  tk.done = true;
  p.activeTask = null;
  send(ws, { t: "taskRezultat", tid: tk.tid, ok: true, done: true });
  // taskurile impostorului sunt de fațadă — nu mișcă bara echipajului
  if(p.rol === "crew"){
    trimiteProgres(room);
    checkWin(room);
  }
}

function handleTaskClose(ws){
  const ctx = playerOf(ws); if(!ctx) return;
  ctx.p.activeTask = null;
}

function handleKill(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY") return;
  if(p.rol !== "impostor" || !p.viu) return;
  const now = Date.now();
  if(now < p.killReadyAt) return sendError(ws, "Kill în cooldown.");
  const v = room.players.get(String(msg.target || ""));
  if(!v || !v.viu || v.rol === "impostor") return;
  if(AMAP.dist(p.x, p.y, v.x, v.y) > AMAP.KILL_R) return sendError(ws, "Prea departe.");

  v.viu = false; v.ghost = true; v.dx = 0; v.dy = 0; v.activeTask = null;
  room.game.bodies.push({ bid: "b" + (room.game.nextBid++), victimId: v.id, x: Math.round(v.x), y: Math.round(v.y), color: v.color });
  // impostorul „sare” pe victimă, ca în original
  p.x = v.x; p.y = v.y;
  p.killReadyAt = now + KILL_CD;
  send(v.ws, { t: "mort" });
  broadcast(room, { t: "roster", jucatori: rosterMeeting(room) }, q => !q.viu);   // fantomele află imediat
  console.log("kill în", room.cod, ":", p.nume, "->", v.nume);
  checkWin(room);
}

function handleReport(ws){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY" || !p.viu) return;
  const g = room.game;
  const body = g.bodies.find(b => AMAP.dist(p.x, p.y, b.x, b.y) <= AMAP.REPORT_R);
  if(!body) return sendError(ws, "Niciun cadavru în apropiere.");
  startMeeting(room, p, body);
}

function handleEmergency(ws){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY" || !p.viu) return;
  const g = room.game;
  if(g.sabotaj) return sendError(ws, "Repară întâi sabotajul!");
  if(Date.now() < g.butonCdUntil) return sendError(ws, "Butonul e în cooldown.");
  if(p.urgente <= 0) return sendError(ws, "Nu mai ai ședințe de urgență.");
  if(AMAP.dist(p.x, p.y, AMAP.BUTTON.x, AMAP.BUTTON.y) > AMAP.USE_R + 20) return sendError(ws, "Du-te la butonul din Cafeteria.");
  p.urgente--;
  startMeeting(room, p, null);
}

function handleSabotaj(ws){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY") return;
  if(p.rol !== "impostor" || !p.viu) return;
  const g = room.game;
  const now = Date.now();
  if(g.sabotaj) return;
  if(now < g.saboCdUntil) return sendError(ws, "Sabotajul e în cooldown.");
  g.sabotaj = { tip: "kernel", endsAt: now + SABOTAJ_MS };
  g.fixPct = 0; g.fixeri.clear();
  g.saboCdUntil = now + SABOTAJ_MS + SABOTAJ_CD;
  broadcast(room, { t: "sabotaj", activ: true, tip: "kernel", ramas: SABOTAJ_MS });
  console.log("sabotaj kernel în", room.cod, "de", p.nume);
}

function handleFix(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  if(room.faza !== "PLAY" || !p.viu) return;
  const g = room.game;
  if(!g.sabotaj) return;
  if(msg.on){
    if(AMAP.dist(p.x, p.y, AMAP.FIX_KERNEL.x, AMAP.FIX_KERNEL.y) > AMAP.USE_R * 1.2)
      return sendError(ws, "Punctul de reparat e în Kernel Core.");
    g.fixeri.add(p.id);
  } else {
    g.fixeri.delete(p.id);
  }
}

// ============================================================
//  Ședințe & vot
// ============================================================
function mesajMeeting(room){
  const m = room.game.meeting;
  return {
    t: "meeting", tip: m.tip,
    reporter: m.reporterId,
    victima: m.victima,                 // {id,nume,color} | null
    faza: m.faza, pana: m.endsAt,
    jucatori: rosterMeeting(room)
  };
}

function startMeeting(room, reporter, body){
  const g = room.game;
  if(g.meeting || room.faza !== "PLAY") return;
  if(g.timer){ clearTimeout(g.timer); g.timer = null; }
  room.faza = "MEETING";
  let victima = null;
  if(body){
    const v = room.players.get(body.victimId);
    if(v) victima = { id: v.id, nume: v.nume, color: v.color };
  }
  g.bodies = [];                        // cadavrele dispar la ședință (ca în original)
  g.sabotaj = null; g.fixeri.clear(); g.fixPct = 0;   // sabotajul critic se anulează
  g.meeting = {
    tip: body ? "corp" : "urgenta",
    reporterId: reporter.id, victima,
    faza: "discutie", endsAt: Date.now() + T_DISCUTIE,
    votes: new Map()
  };
  // toată lumea la masă (pozițiile se resetează după vot)
  for(const p of room.players.values()){ p.dx = 0; p.dy = 0; p.activeTask = null; p.fixing = false; }
  broadcast(room, mesajMeeting(room));
  console.log("ședință în", room.cod, "(", g.meeting.tip, ") convocată de", reporter.nume);
  g.timer = setTimeout(() => incepeVotul(room), T_DISCUTIE);
}

function incepeVotul(room){
  const g = room.game;
  if(!g || !g.meeting || g.meeting.faza !== "discutie") return;
  g.meeting.faza = "vot";
  g.meeting.endsAt = Date.now() + T_VOT;
  broadcast(room, { t: "meetingFaza", faza: "vot", pana: g.meeting.endsAt });
  if(g.timer) clearTimeout(g.timer);
  g.timer = setTimeout(() => tallyMeeting(room), T_VOT);
}

function handleVote(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  const g = room.game;
  if(room.faza !== "MEETING" || !g.meeting || g.meeting.faza !== "vot") return;
  if(!p.viu) return;                                  // morții nu votează
  if(g.meeting.votes.has(p.id)) return;               // un singur vot
  let tinta = "skip";
  if(msg.target != null){
    const t = room.players.get(String(msg.target));
    if(!t || !t.viu) return sendError(ws, "Țintă invalidă.");
    tinta = t.id;
  }
  g.meeting.votes.set(p.id, tinta);
  broadcast(room, { t: "votat", cine: p.id });        // se vede CINE a votat, nu și cu cine
  // toți cei vii și conectați au votat -> numărăm mai devreme
  const activi = aliveOf(room).filter(q => q.ws);
  if(activi.every(q => g.meeting.votes.has(q.id))) tallyMeeting(room);
}

function tallyMeeting(room){
  const g = room.game;
  if(!g || !g.meeting || g.meeting.faza !== "vot") return;
  if(g.timer){ clearTimeout(g.timer); g.timer = null; }
  const m = g.meeting;
  m.faza = "gata";

  // numărăm: cine are cele mai multe voturi? (skip = abținere)
  const scor = new Map();
  for(const tinta of m.votes.values()){
    scor.set(tinta, (scor.get(tinta) || 0) + 1);
  }
  let ejectatId = null, maxV = 0, egalitate = false;
  for(const [tinta, v] of scor){
    if(tinta === "skip") continue;
    if(v > maxV){ maxV = v; ejectatId = tinta; egalitate = false; }
    else if(v === maxV){ egalitate = true; }
  }
  const skipV = scor.get("skip") || 0;
  if(maxV === 0 || maxV < skipV || (maxV === skipV) || egalitate) ejectatId = null;

  // dezvăluim voturile (cine cu cine) — ca în original la „anonymous off”
  const voturi = {};
  for(const [cine, tinta] of m.votes){ voturi[cine] = tinta; }

  let info = { t: "eject", id: null, nume: null, color: null, eraImpostor: null, egalitate: egalitate || (maxV === skipV && maxV > 0), voturi };
  if(ejectatId){
    const e = room.players.get(ejectatId);
    e.viu = false; e.ghost = true;
    info.id = e.id; info.nume = e.nume; info.color = e.color;
    info.eraImpostor = e.rol === "impostor";
    console.log("ejectat din", room.cod, ":", e.nume, info.eraImpostor ? "(IMPOSTOR)" : "(nevinovat)");
  }
  broadcast(room, info);

  g.timer = setTimeout(() => {
    g.meeting = null;
    if(checkWin(room)) return;
    // reluăm jocul: toată lumea înapoi în Cafeteria, cooldown-uri resetate
    room.faza = "PLAY";
    pozitiiSpawn(room);
    const now = Date.now();
    for(const p of room.players.values()){
      if(p.rol === "impostor") p.killReadyAt = now + KILL_CD;
    }
    g.butonCdUntil = now + BUTON_CD;
    broadcast(room, { t: "reluat" });
    broadcast(room, { t: "roster", jucatori: rosterMeeting(room) });
  }, T_EJECT);
}

// ============================================================
//  Chat — în ședință pentru cei vii; morții au canalul lor separat
// ============================================================
function handleChat(ws, msg){
  const ctx = playerOf(ws); if(!ctx) return;
  const { room, p } = ctx;
  const text = String(msg.text || "").replace(/\s+/g, " ").trim().slice(0, 200);
  if(!text) return;
  const now = Date.now();
  if(p._lastChat && now - p._lastChat < 400) return;   // anti-spam
  p._lastChat = now;
  const pachet = { t: "chat", from: p.id, nume: p.nume, color: p.color, text, mort: !p.viu };
  if(!p.viu){
    // fantomele vorbesc doar între ele (oricând)
    broadcast(room, pachet, q => !q.viu);
    return;
  }
  // cei vii pot vorbi doar în timpul ședinței
  if(room.faza !== "MEETING") return sendError(ws, "Chatul e deschis doar în ședință.");
  broadcast(room, pachet);
}

// ============================================================
//  Conexiuni WebSocket
// ============================================================
function handleClose(ws){
  const room = rooms.get(ws._roomCod);
  if(!room) return;
  const p = room.players.get(ws._playerId);
  if(!p || p.ws !== ws) return;
  p.ws = null; p.dcSince = Date.now();
  p.dx = 0; p.dy = 0;
  if(room.game) room.game.fixeri.delete(p.id);
  console.log(p.nume, "s-a deconectat din", room.cod);
  if(room.faza === "LOBBY"){
    // grațiere: dacă nu revine în RECONNECT_MS, îl scoatem din lobby
    p.dcTimer = setTimeout(() => { p.dcTimer = null; removePlayer(room, p.id); }, RECONNECT_MS);
    broadcast(room, lobbyState(room));
  } else {
    broadcast(room, lobbyState(room));   // doar pentru starea „connected” din roster
  }
  ensureHost(room);
  scheduleEmptyCheck(room);
}

const server = http.createServer((req, res) => {
  // nginx trimite /amongus/... — normalizăm ca să meargă și direct (dev local)
  let u = (req.url || "/").split("?")[0];
  u = u.replace(/^\/amongus/, "") || "/";

  if(u === "/health" || u.startsWith("/health")){
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, rooms: rooms.size, materii: CONTINUT.size }));
  }

  // fișierele clientului (public/) — no-cache: clientul și serverul vin din
  // aceeași imagine, deci după fiecare deploy toți vorbesc același protocol
  if(u === "/") u = "/index.html";
  const fp = path.normalize(path.join(PUBLIC_DIR, u));
  if(!fp.startsWith(PUBLIC_DIR)){ res.writeHead(403); return res.end(); }
  fs.readFile(fp, (err, data) => {
    if(err){ res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("404"); }
    const ext = path.extname(fp).toLowerCase();
    const mime = {
      ".html": "text/html; charset=utf-8",
      ".js":   "application/javascript; charset=utf-8",
      ".css":  "text/css; charset=utf-8",
      ".svg":  "image/svg+xml",
      ".png":  "image/png",
      ".json": "application/json; charset=utf-8"
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-cache" });
    res.end(data);
  });
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
      // lobby
      case "create":     return handleCreate(ws, msg);
      case "join":       return handleJoin(ws, msg);
      case "reconnect":  return handleReconnect(ws, msg);
      case "materie":    return handleMaterie(ws, msg);
      case "impostori":  return handleImpostori(ws, msg);
      case "culoare":    return handleCuloare(ws, msg);
      case "ready":      return handleReady(ws, msg);
      case "start":      return handleStart(ws);
      // joc
      case "input":      return handleInput(ws, msg);
      case "taskOpen":   return handleTaskOpen(ws, msg);
      case "taskSubmit": return handleTaskSubmit(ws, msg);
      case "taskClose":  return handleTaskClose(ws);
      case "kill":       return handleKill(ws, msg);
      case "report":     return handleReport(ws);
      case "emergency":  return handleEmergency(ws);
      case "sabotaj":    return handleSabotaj(ws);
      case "fix":        return handleFix(ws, msg);
      case "vote":       return handleVote(ws, msg);
      case "chat":       return handleChat(ws, msg);
      // diverse
      case "leave": {
        const room = rooms.get(ws._roomCod);
        if(room && room.players.has(ws._playerId)) removePlayer(room, ws._playerId);
        ws._roomCod = null; ws._playerId = null;
        return;
      }
      case "ping":       return send(ws, { t: "pong" });
      default:           return;
    }
  });

  ws.on("close", () => handleClose(ws));
  ws.on("error", () => {});
});

// heartbeat: taie conexiunile moarte (TTL ~60s)
const hb = setInterval(() => {
  wss.clients.forEach((ws) => {
    if(ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try{ ws.ping(); }catch(e){}
  });
}, 30000);
hb.unref();

if(require.main === module){
  loadContent();
  server.listen(PORT, () => console.log("among us CS ascultă pe :" + PORT));
} else {
  // exporturi pentru testele automate (harness) — funcții pure, fără listen
  module.exports = {
    loadContent, CONTINUT, TIPURI,
    construiesteInstanta, valideazaRaspuns,
    realizabilaStiva, parcurgeArbore, trecereBubble, numaraGoluri,
    _internal: { server, rooms, PORT }
  };
}

function shutdown(){ try{ clearInterval(hb); clearInterval(GLOBAL_TICK); }catch(e){} process.exit(0); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
