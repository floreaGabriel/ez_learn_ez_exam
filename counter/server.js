// ============================================================
//  Counter — micro-serviciu pentru statistici de trafic
//  Zero dependențe (doar module Node native). Persistență pe fișier
//  JSON atomic (scriere în .tmp + rename) pe un volum Docker.
//
//  Rute (nginx proxy-ază /api/ -> acest serviciu):
//    GET /api/hit?id=<uid>    -> o ACCESARE nouă (page load): total++,
//                                 + marchează vizitatorul unic, + prezență
//    GET /api/ping?id=<uid>   -> heartbeat: doar prezență (NU crește total)
//    GET /api/stats           -> citește {live,total,unici}
//
//  Întoarce 3 valori:
//    "live"  = id-uri active acum (au pulsat în ultimele LIVE_TTL ms) — în memorie
//    "total" = total accesări / vizite (fiecare încărcare de pagină) — persistat
//    "unici" = vizitatori unici (după id de browser) — persistat
// ============================================================
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT      = parseInt(process.env.PORT || "3000", 10);
const DATA_FILE = process.env.DATA_FILE || "/data/stats.json";
const LIVE_TTL  = parseInt(process.env.LIVE_TTL_MS || "35000", 10); // 35s

// ---------- stare persistentă ----------
let total = 0;            // total accesări (vizite)
let seen  = new Set();    // id-uri unice de browser -> "unici"

function load(){
  try{
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    total = raw.total || 0;
    seen  = new Set(Array.isArray(raw.seen) ? raw.seen : []);
    console.log("loaded: total=" + total + ", unici=" + seen.size);
  }catch(e){ console.log("fără date anterioare (prima rulare)"); }
}

let saveTimer = null;
function saveSoon(){
  if(saveTimer) return;                 // coalesce: o scriere la max 2s (blând cu cardul SD)
  saveTimer = setTimeout(function(){
    saveTimer = null;
    try{
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive:true });
      const tmp = DATA_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify({ total: total, seen: Array.from(seen) }));
      fs.renameSync(tmp, DATA_FILE);    // atomic -> nu se corupe la restart
    }catch(e){ console.error("save failed:", e.message); }
  }, 2000);
}

// ---------- prezență (în memorie) ----------
const live = new Map();   // id -> lastSeen(ms)
function liveCount(){
  const now = Date.now();
  for(const [id,t] of live) if(now - t > LIVE_TTL) live.delete(id);
  return live.size;
}
function validId(s){ return /^[A-Za-z0-9_-]{6,64}$/.test(s); }
function stats(){ return { live: liveCount(), total: total, unici: seen.size }; }

function sendJSON(res, code, obj){
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(function(req, res){
  let url;
  try{ url = new URL(req.url, "http://x"); }catch(e){ return sendJSON(res, 400, { error:"bad url" }); }
  const route = url.pathname.replace(/^\/api/, "") || "/";   // tolerează prefixul /api
  const id = url.searchParams.get("id") || "";

  if(route === "/hit"){                  // o accesare nouă (page load)
    if(!validId(id)) return sendJSON(res, 400, { error:"bad id" });
    total++;                             // fiecare încărcare = +1 accesare
    if(!seen.has(id)) seen.add(id);      // prima dată pentru acest browser = +1 unic
    saveSoon();
    live.set(id, Date.now());
    return sendJSON(res, 200, stats());
  }
  if(route === "/ping"){                 // heartbeat: doar prezență
    if(!validId(id)) return sendJSON(res, 400, { error:"bad id" });
    live.set(id, Date.now());
    return sendJSON(res, 200, stats());
  }
  if(route === "/stats" || route === "/" || route === "/health"){
    return sendJSON(res, 200, stats());
  }
  return sendJSON(res, 404, { error:"not found" });
});

load();
setInterval(liveCount, 30000).unref();   // curăță periodic prezențele expirate
server.listen(PORT, function(){ console.log("counter ascultă pe :" + PORT); });

// salvare sigură la oprire (SIGTERM de la docker stop / watchtower)
function shutdown(){
  try{
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive:true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({ total: total, seen: Array.from(seen) }));
  }catch(e){}
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
