// ============================================================
//  SQL Runner — backend pentru sectiunea "Interogare Live"
//  Conecteaza la Azure SQL Edge (motor SQL Server, T-SQL) si:
//    1) la PRIMA pornire ruleaza init.sql ca `sa` (creeaza cele 5 baze,
//       datele si loginul read-only) — idempotent (sare daca exista deja);
//    2) serveste interogarile colegilor ca user `readonly` (db_datareader),
//       deci la nivel de motor NU se poate INSERT/UPDATE/DELETE/DDL.
//
//  Rute (nginx proxy-aza /sqlapi/ -> acest serviciu):
//    GET  /sqlapi/scenarios         -> lista scenariilor + tabelele lor
//    GET  /sqlapi/tables?scenario=X -> coloanele + toate randurile fiecarui tabel
//    POST /sqlapi/query  {scenario, sql} -> ruleaza un SELECT, intoarce coloane+randuri
//    GET  /sqlapi/health
//
//  Singura dependenta: pachetul `mssql` (driver tedious).
// ============================================================
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const sql  = require("mssql");

const PORT        = parseInt(process.env.PORT || "3001", 10);
const DB_HOST     = process.env.DB_HOST || "sqltrainer-db";
const DB_PORT     = parseInt(process.env.DB_PORT || "1433", 10);
const SA_PASSWORD = process.env.SA_PASSWORD || "Trainer_SA_Pass123";
const RO_PASSWORD = process.env.READONLY_PASSWORD || "Trainer_RO_Pass123";
const MAX_ROWS    = parseInt(process.env.MAX_ROWS || "2000", 10);
const QUERY_TIMEOUT = parseInt(process.env.QUERY_TIMEOUT_MS || "8000", 10);

// ---------- metadate scenarii (numele + ordinea tabelelor pentru UI) ----------
const SCENARIOS = {
  biblioteca: { nume:"Bibliotecă universitară", icon:"📚", db:"biblioteca",
                tables:["Cititori","Imprumuturi","Volume"] },
  clinica:    { nume:"Clinică medicală", icon:"🩺", db:"clinica",
                tables:["Pacienti","Programari","Retete"] },
  magazin:    { nume:"Magazin online", icon:"🛒", db:"magazin",
                tables:["Clienti","Comenzi","Produse_Comandate"] },
  aeriana:    { nume:"Companie aeriană", icon:"✈️", db:"aeriana",
                tables:["Pasageri","Rezervari","Bilete"] },
  service:    { nume:"Service auto", icon:"🔧", db:"service",
                tables:["Clienti","Comenzi_Service","Piese_Montate"] },
  hotel:      { nume:"Hotel", icon:"🏨", db:"hotel",
                tables:["Oaspeti","Rezervari","Facturi"] },
  banca:      { nume:"Bancă", icon:"🏦", db:"banca",
                tables:["Clienti","Conturi","Tranzactii"] },
  asigurari:  { nume:"Asigurări auto", icon:"🚗", db:"asigurari",
                tables:["Asigurati","Polite","Daune"] },
  curierat:   { nume:"Curierat", icon:"📦", db:"curierat",
                tables:["Expeditori","Colete","Livrari"] },
  universitate:{ nume:"Universitate", icon:"🎓", db:"universitate",
                tables:["Studenti","Inscrieri","Note"] },
  biblioteca_carti:{ nume:"Bibliotecă (împrumut cărți)", icon:"📖", db:"biblioteca_carti",
                tables:["Abonati","Carti","Imprumuturi"] },
  gsm:        { nume:"Operator telefonie mobilă (GSM)", icon:"📱", db:"gsm",
                tables:["Abonati","Solicitari","Cartele"] }
};

function baseCfg(extra){
  return Object.assign({
    server: DB_HOST,
    port: DB_PORT,
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: QUERY_TIMEOUT
  }, extra);
}

// ---------- pool-uri read-only, cate unul pe scenariu (lazy) ----------
const roPools = new Map();
async function getPool(scenario){
  const meta = SCENARIOS[scenario];
  if(!meta) throw new Error("scenariu necunoscut");
  if(roPools.has(scenario)) return roPools.get(scenario);
  const pool = new sql.ConnectionPool(baseCfg({
    user: "readonly", password: RO_PASSWORD, database: meta.db
  }));
  const p = pool.connect().then(() => pool);
  roPools.set(scenario, p);
  return p;
}

// ---------- init: ruleaza init.sql ca `sa`, o singura data ----------
async function waitForDb(){
  // pool de O SINGURĂ conexiune: init.sql se bazează pe `USE <db>` care trebuie
  // să persiste între batch-uri (același connection), altfel s-ar crea în master.
  const cfg = baseCfg({ user: "sa", password: SA_PASSWORD, database: "master",
                        pool: { max: 1, min: 1, idleTimeoutMillis: 60000 } });
  for(let i=1; i<=60; i++){
    try{
      const pool = await new sql.ConnectionPool(cfg).connect();
      console.log("conectat la SQL Edge (incercarea " + i + ")");
      return pool;
    }catch(e){
      console.log("astept baza... (" + i + "/60): " + e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error("baza nu a pornit la timp");
}

// erori SQL Server care inseamna "exista deja" -> le ignoram la re-rulare, ca
// init.sql sa fie idempotent si sa poata adauga scenarii NOI peste baze vechi:
//   1801 = database exists, 2714 = object (tabel) exists,
//   2627/2601 = duplicate key (INSERT rulat deja), 15023/15025 = user/login exists.
const IGNORABLE_INIT_ERRORS = new Set([1801, 2714, 2627, 2601, 15023, 15025]);

async function ensureInitialized(saPool){
  // Sentinel = cel mai NOU obiect asteptat. Cand adaugi un scenariu, actualizeaza-l
  // la un obiect din noua baza, ca init.sql sa se re-ruleze si sa-l creeze.
  const check = await saPool.request().query(
    "SELECT CASE WHEN DB_ID('gsm') IS NOT NULL " +
    "AND OBJECT_ID('gsm.dbo.Cartele') IS NOT NULL THEN 1 ELSE 0 END AS ok");
  if(check.recordset[0].ok === 1){
    console.log("bazele exista deja (inclusiv scenariile noi) — sar peste init");
    return;
  }
  console.log("rulez init.sql (aplicare/actualizare scenarii)...");
  let script = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
  script = script.split("{{READONLY_PASSWORD}}").join(RO_PASSWORD);
  // batch-urile sunt separate prin linii care contin doar `GO`
  const batches = script.split(/^\s*GO\s*$/im).map(b => b.trim()).filter(Boolean);
  let aplicate = 0, sarite = 0;
  for(let i=0; i<batches.length; i++){
    try{
      await saPool.request().batch(batches[i]);
      aplicate++;
    }catch(e){
      // batch pe o baza deja creata (ex. CREATE TABLE existent) -> il sarim
      if(IGNORABLE_INIT_ERRORS.has(e.number)){ sarite++; continue; }
      console.error("eroare la batch-ul " + (i+1) + ": " + e.message);
      throw e;
    }
  }
  console.log("init.sql aplicat (" + aplicate + " batch-uri noi, " + sarite + " deja existente)");
}

// ---------- validarea interogarii (defense-in-depth peste read-only) ----------
const BLOCKED = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|MERGE|EXEC|EXECUTE|GRANT|REVOKE|DENY|BACKUP|RESTORE|SHUTDOWN|RECONFIGURE|WAITFOR|OPENROWSET|OPENQUERY|BULK|INTO)\b/i;
function validateQuery(raw){
  let q = String(raw == null ? "" : raw).trim();
  if(!q) return { error: "Scrie o interogare." };
  q = q.replace(/;+\s*$/,"");                       // elimina `;` final(e)
  if(q.indexOf(";") >= 0)
    return { error: "Rulează un singur SELECT (fără `;` în mijloc)." };
  if(!/^\s*(SELECT|WITH|\()/i.test(q))
    return { error: "Doar interogări SELECT sunt permise (poate începe cu WITH)." };
  if(BLOCKED.test(q))
    return { error: "Permise doar interogări de citire (SELECT). Cuvinte de modificare a datelor sunt blocate." };
  return { sql: q };
}

// ---------- helpers HTTP ----------
function sendJSON(res, code, obj){
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(obj));
}
function readBody(req){
  return new Promise((resolve) => {
    let data = ""; let tooBig = false;
    req.on("data", c => { data += c; if(data.length > 100000){ tooBig = true; req.destroy(); } });
    req.on("end", () => { if(tooBig) return resolve(null); try{ resolve(JSON.parse(data||"{}")); }catch(e){ resolve(null); } });
    req.on("error", () => resolve(null));
  });
}

// columns in declared order + filtrarea coloanelor interne tedious
function shapeResult(result){
  const cols = (result.recordset && result.recordset.columns)
    ? Object.values(result.recordset.columns).sort((a,b)=>a.index-b.index).map(c=>c.name)
    : [];
  const rows = (result.recordset || []).map(r => cols.map(c => {
    const v = r[c];
    if(v instanceof Date) return v.toISOString().replace("T"," ").replace(/\.000Z$/,"").replace(/Z$/,"");
    return v;
  }));
  return { columns: cols, rows: rows };
}

// ---------- rute ----------
async function handleTables(scenario, res){
  const meta = SCENARIOS[scenario];
  if(!meta) return sendJSON(res, 400, { error: "scenariu necunoscut" });
  const pool = await getPool(scenario);
  const out = [];
  for(const t of meta.tables){
    const colsRes = await pool.request().query(
      "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE " +
      "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + t + "' " +
      "ORDER BY ORDINAL_POSITION");
    const columns = colsRes.recordset.map(c => ({
      name: c.COLUMN_NAME,
      type: c.DATA_TYPE + (c.CHARACTER_MAXIMUM_LENGTH ? "(" + c.CHARACTER_MAXIMUM_LENGTH + ")" : ""),
      nullable: c.IS_NULLABLE === "YES"
    }));
    const dataRes = await pool.request().query("SELECT * FROM [" + t + "]");
    const shaped = shapeResult(dataRes);
    out.push({ name: t, columns: columns, rows: shaped.rows });
  }
  return sendJSON(res, 200, { scenario: scenario, tables: out });
}

async function handleQuery(body, res){
  if(!body) return sendJSON(res, 400, { error: "corp invalid" });
  const meta = SCENARIOS[body.scenario];
  if(!meta) return sendJSON(res, 400, { error: "Alege un scenariu valid." });
  const v = validateQuery(body.sql);
  if(v.error) return sendJSON(res, 200, { error: v.error });
  try{
    const pool = await getPool(body.scenario);
    const started = Date.now();
    const result = await pool.request().query(v.sql);
    const elapsed = Date.now() - started;
    const shaped = shapeResult(result);
    let truncated = false;
    if(shaped.rows.length > MAX_ROWS){ shaped.rows = shaped.rows.slice(0, MAX_ROWS); truncated = true; }
    return sendJSON(res, 200, {
      columns: shaped.columns, rows: shaped.rows,
      rowCount: shaped.rows.length, truncated: truncated, elapsedMs: elapsed
    });
  }catch(e){
    // mesajul motorului SQL Server e util pentru invatare
    return sendJSON(res, 200, { error: (e.message || "eroare SQL").replace(/^RequestError: /,"") });
  }
}

const server = http.createServer(async function(req, res){
  let url;
  try{ url = new URL(req.url, "http://x"); }catch(e){ return sendJSON(res, 400, { error:"bad url" }); }
  const route = url.pathname.replace(/^\/sqlapi/, "") || "/";
  try{
    if(req.method === "GET" && (route === "/health" || route === "/")) return sendJSON(res, 200, { ok: true });
    if(req.method === "GET" && route === "/scenarios"){
      const list = Object.keys(SCENARIOS).map(id => ({
        id: id, nume: SCENARIOS[id].nume, icon: SCENARIOS[id].icon, tables: SCENARIOS[id].tables
      }));
      return sendJSON(res, 200, { scenarios: list });
    }
    if(req.method === "GET" && route === "/tables")
      return await handleTables(url.searchParams.get("scenario") || "", res);
    if(req.method === "POST" && route === "/query")
      return await handleQuery(await readBody(req), res);
    return sendJSON(res, 404, { error: "not found" });
  }catch(e){
    return sendJSON(res, 500, { error: e.message || "eroare interna" });
  }
});

(async function main(){
  try{
    const saPool = await waitForDb();
    await ensureInitialized(saPool);
    await saPool.close();
  }catch(e){
    console.error("INIT esuat: " + e.message);
    // continuam totusi sa ascultam — /health raspunde, dar interogarile vor esua clar
  }
  server.listen(PORT, () => console.log("sqlrunner asculta pe :" + PORT));
})();
