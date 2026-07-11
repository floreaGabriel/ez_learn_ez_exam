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
//    GET  /sqlapi/tables?scenario=X[&sandbox=1&sid=..] -> coloane + randuri
//    POST /sqlapi/query  {scenario, sql} -> ruleaza un SELECT, intoarce coloane+randuri
//    POST /sqlapi/run    {scenario, sid, sql} -> MOD EXERSARE: ruleaza scriptul
//         (DML/DDL/EXEC/tranzactii, batch-uri separate cu GO) in baza-sandbox
//         PERSONALA a sesiunii (sbx_<scenariu>_<sid>) — izolata per utilizator.
//    POST /sqlapi/sandbox-reset {scenario, sid} -> sterge sandbox-ul propriu
//         (se recreeaza automat, cu datele initiale, la urmatoarea rulare)
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
const SBX_PASSWORD = process.env.SANDBOX_PASSWORD || "Trainer_SBX_Pass123";
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
                tables:["Abonati","Solicitari","Cartele"] },
  transferuri:{ nume:"Transferuri bancare (tranzacții & proceduri)", icon:"💸", db:"transferuri",
                tables:["Conturi","Transferuri","AuditSolduri"],
                sandboxFile:"sandbox-transferuri.sql" },
  bilete:     { nume:"Casă de bilete (triggere)", icon:"🎟️", db:"bilete",
                tables:["Spectacole","Vanzari","JurnalStoc"],
                sandboxFile:"sandbox-bilete.sql" }
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
    "SELECT CASE WHEN DB_ID('bilete') IS NOT NULL " +
    "AND OBJECT_ID('transferuri.dbo.pr_Transfera') IS NOT NULL " +
    "AND OBJECT_ID('bilete.dbo.tr_Vanzari_Anulare') IS NOT NULL " +
    "AND SUSER_ID('sandbox') IS NOT NULL THEN 1 ELSE 0 END AS ok");
  if(check.recordset[0].ok === 1){
    console.log("bazele exista deja (inclusiv scenariile noi) — sar peste init");
    return;
  }
  console.log("rulez init.sql (aplicare/actualizare scenarii)...");
  let script = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
  script = script.split("{{READONLY_PASSWORD}}").join(RO_PASSWORD);
  script = script.split("{{SANDBOX_PASSWORD}}").join(SBX_PASSWORD);
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

// ============================================================
//  MOD EXERSARE (sandbox): fiecare sesiune de browser primeste PROPRIA
//  baza de date (sbx_<scenariu>_<sid>), creata la prima rulare din
//  sablonul scenariului. Izolarea e la nivel de motor: userul `sandbox`
//  are drepturi (datareader/datawriter/ddladmin/EXECUTE) DOAR in bazele
//  sbx_*, deci nici scripturile rau-intentionate nu ating bazele comune.
//  Plafon + evacuare LRU + stergere dupa inactivitate => Pi-ul respira.
// ============================================================
let SA = null;                                  // pool `sa` pastrat deschis (management sandbox)
const SBX_MAX    = parseInt(process.env.SANDBOX_MAX || "30", 10);
const SBX_TTL_MS = parseInt(process.env.SANDBOX_TTL_MIN || "60", 10) * 60 * 1000;
const sbxLive = new Map();                      // dbName -> lastUsed (ms)
const sbxCreating = new Map();                  // dbName -> Promise (anti-dublare la cereri simultane)

function sbxName(id, sid){ return "sbx_" + id + "_" + sid; }

async function dropDb(name){
  try{
    await SA.request().batch(
      "IF DB_ID('" + name + "') IS NOT NULL BEGIN " +
      "ALTER DATABASE [" + name + "] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; " +
      "DROP DATABASE [" + name + "]; END");
  }catch(e){ console.error("drop sandbox " + name + ": " + e.message); }
  sbxLive.delete(name);
}

// la pornirea serviciului, sandbox-urile vechi se curata (registrul e in memorie)
async function dropAllSandboxes(){
  const r = await SA.request().query("SELECT name FROM sys.databases WHERE name LIKE 'sbx[_]%'");
  for(const row of r.recordset) await dropDb(row.name);
  if(r.recordset.length) console.log("curatat " + r.recordset.length + " sandbox-uri ramase de la rularea anterioara");
}

async function sweepSandboxes(){
  const now = Date.now();
  for(const [n, ts] of Array.from(sbxLive))
    if(now - ts > SBX_TTL_MS) await dropDb(n);
}

async function ensureSandbox(meta, scenarioId, sid){
  const name = sbxName(scenarioId, sid);
  if(sbxCreating.has(name)){ await sbxCreating.get(name); sbxLive.set(name, Date.now()); return { name, fresh:false }; }
  if(sbxLive.has(name)){ sbxLive.set(name, Date.now()); return { name, fresh:false }; }
  const p = (async () => {
    while(sbxLive.size >= SBX_MAX){               // evacuare LRU peste plafon
      let oldest = null, t = Infinity;
      for(const [n, ts] of sbxLive) if(ts < t){ t = ts; oldest = n; }
      if(!oldest) break;
      await dropDb(oldest);
    }
    await SA.request().batch("IF DB_ID('" + name + "') IS NOT NULL BEGIN ALTER DATABASE [" + name + "] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [" + name + "]; END");
    await SA.request().batch("CREATE DATABASE [" + name + "]");
    const tpl = fs.readFileSync(path.join(__dirname, meta.sandboxFile), "utf8");
    const batches = tpl.split(/^\s*GO\s*$/im).map(b => b.trim()).filter(Boolean);
    const pool = await new sql.ConnectionPool(baseCfg({
      user:"sa", password:SA_PASSWORD, database:name, pool:{max:1, min:0} })).connect();
    try{ for(const b of batches) await pool.request().batch(b); }
    finally{ try{ await pool.close(); }catch(e){} }
    sbxLive.set(name, Date.now());
  })();
  sbxCreating.set(name, p);
  try{ await p; } finally{ sbxCreating.delete(name); }
  return { name, fresh:true };
}

// validarea scriptului de exersare: DML/DDL/EXEC/tranzactii permise;
// blocate doar administrarea serverului si evadarile din sandbox.
const SBX_BLOCKED = /\b(SHUTDOWN|RECONFIGURE|BACKUP|RESTORE|GRANT|REVOKE|DENY|OPENROWSET|OPENQUERY|BULK|WAITFOR|KILL|DBCC|CREATE\s+LOGIN|ALTER\s+LOGIN|DROP\s+LOGIN|CREATE\s+USER|ALTER\s+USER|DROP\s+USER|ALTER\s+ROLE|ALTER\s+AUTHORIZATION|EXECUTE\s+AS|xp_\w+|sp_configure|sp_addsrvrolemember|sp_addrolemember|CREATE\s+DATABASE|DROP\s+DATABASE|ALTER\s+DATABASE|USE\b)/i;
function validateSandboxSql(raw){
  const q = String(raw == null ? "" : raw);
  if(!q.trim()) return { error: "Scrie ceva de executat." };
  if(q.length > 20000) return { error: "Script prea lung (max 20.000 de caractere)." };
  if(SBX_BLOCKED.test(q))
    return { error: "Comandă blocată în modul exersare (administrare server, USE, WAITFOR etc.). Ai la dispoziție SELECT, INSERT/UPDATE/DELETE, CREATE/DROP pe obiecte, EXEC și tranzacții." };
  const batches = q.split(/^\s*GO\s*$/im).map(b => b.trim()).filter(Boolean);
  if(batches.length > 25) return { error: "Prea multe secțiuni GO (max 25)." };
  return { batches };
}

function sidValid(sid){ return /^[a-z0-9]{6,16}$/.test(String(sid || "")); }

// un set de rezultate (recordset mssql) -> {columns, rows} pt. UI
function shapeSet(rs){
  const cols = (rs && rs.columns)
    ? Object.values(rs.columns).sort((a,b)=>a.index-b.index).map(c=>c.name)
    : [];
  let rows = (rs || []).map(r => cols.map(c => {
    const v = r[c];
    if(v instanceof Date) return v.toISOString().replace("T"," ").replace(/\.000Z$/,"").replace(/Z$/,"");
    return v;
  }));
  let truncated = false;
  if(rows.length > 500){ rows = rows.slice(0, 500); truncated = true; }
  return { columns: cols, rows: rows, truncated: truncated };
}

async function handleRun(body, res){
  if(!body) return sendJSON(res, 400, { error: "corp invalid" });
  const meta = SCENARIOS[body.scenario];
  if(!meta) return sendJSON(res, 200, { error: "Alege un scenariu valid." });
  if(!meta.sandboxFile)
    return sendJSON(res, 200, { error: "Scenariul acesta nu are mod de exersare — e disponibil la „Transferuri bancare” și „Casă de bilete”." });
  if(!sidValid(body.sid)) return sendJSON(res, 200, { error: "Sesiune invalidă — reîncarcă pagina." });
  const v = validateSandboxSql(body.sql);
  if(v.error) return sendJSON(res, 200, { error: v.error });
  if(!SA) return sendJSON(res, 200, { error: "Serviciul încă pornește — reîncearcă în câteva secunde." });
  try{
    const t0 = Date.now();
    const sb = await ensureSandbox(meta, body.scenario, body.sid);
    const pool = await new sql.ConnectionPool(baseCfg({
      user:"sandbox", password:SBX_PASSWORD, database:sb.name, pool:{max:1, min:0} })).connect();
    const out = [];
    try{
      await pool.request().batch("SET LOCK_TIMEOUT 4000;");
      for(const b of v.batches){
        const req = pool.request();
        const messages = [];
        req.on("info", function(m){ if(messages.length < 50 && m && m.message) messages.push(m.message); });
        try{
          const r = await req.batch(b);
          out.push({ ok:true, messages: messages,
                     results: (r.recordsets || []).map(shapeSet),
                     rowsAffected: r.rowsAffected || [] });
        }catch(e){
          out.push({ ok:false, messages: messages,
                     error: (e.message || "eroare SQL").replace(/^RequestError: /,"") });
          // ca in SSMS: o eroare intr-un batch NU opreste batch-urile urmatoare
          // (scripturile didactice au erori intentionate urmate de verificari)
        }
      }
    } finally {
      try{ await pool.close(); }catch(e){}   // inchiderea anuleaza orice tranzactie ramasa deschisa
    }
    return sendJSON(res, 200, { batches: out, fresh: sb.fresh, elapsedMs: Date.now() - t0 });
  }catch(e){
    return sendJSON(res, 200, { error: "Sandbox: " + (e.message || "eroare la pregătire") });
  }
}

async function handleSandboxReset(body, res){
  if(!body) return sendJSON(res, 400, { error: "corp invalid" });
  const meta = SCENARIOS[body.scenario];
  if(!meta || !meta.sandboxFile) return sendJSON(res, 200, { error: "Scenariu fără sandbox." });
  if(!sidValid(body.sid)) return sendJSON(res, 200, { error: "Sesiune invalidă." });
  if(!SA) return sendJSON(res, 200, { error: "Serviciul încă pornește." });
  await dropDb(sbxName(body.scenario, body.sid));
  return sendJSON(res, 200, { ok: true });     // se recreeaza la urmatoarea rulare
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
async function tablesPayload(pool, meta){
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
  return out;
}

async function handleTables(scenario, res){
  const meta = SCENARIOS[scenario];
  if(!meta) return sendJSON(res, 400, { error: "scenariu necunoscut" });
  const pool = await getPool(scenario);
  const out = await tablesPayload(pool, meta);
  return sendJSON(res, 200, { scenario: scenario, tables: out });
}

// varianta sandbox: citeste tabelele din baza personala a sesiunii
async function handleTablesSbx(scenario, sid, res){
  const meta = SCENARIOS[scenario];
  if(!meta) return sendJSON(res, 400, { error: "scenariu necunoscut" });
  if(!meta.sandboxFile) return sendJSON(res, 200, { error: "Scenariu fără sandbox." });
  if(!sidValid(sid)) return sendJSON(res, 200, { error: "Sesiune invalidă — reîncarcă pagina." });
  if(!SA) return sendJSON(res, 200, { error: "Serviciul încă pornește." });
  const sb = await ensureSandbox(meta, scenario, sid);
  const pool = await new sql.ConnectionPool(baseCfg({
    user:"sandbox", password:SBX_PASSWORD, database:sb.name, pool:{max:1, min:0} })).connect();
  try{
    const out = await tablesPayload(pool, meta);
    return sendJSON(res, 200, { scenario: scenario, sandbox: true, fresh: sb.fresh, tables: out });
  } finally {
    try{ await pool.close(); }catch(e){}
  }
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
        id: id, nume: SCENARIOS[id].nume, icon: SCENARIOS[id].icon, tables: SCENARIOS[id].tables,
        sandbox: !!SCENARIOS[id].sandboxFile
      }));
      return sendJSON(res, 200, { scenarios: list });
    }
    if(req.method === "GET" && route === "/tables"){
      const sc = url.searchParams.get("scenario") || "";
      if(url.searchParams.get("sandbox") === "1")
        return await handleTablesSbx(sc, url.searchParams.get("sid") || "", res);
      return await handleTables(sc, res);
    }
    if(req.method === "POST" && route === "/query")
      return await handleQuery(await readBody(req), res);
    if(req.method === "POST" && route === "/run")
      return await handleRun(await readBody(req), res);
    if(req.method === "POST" && route === "/sandbox-reset")
      return await handleSandboxReset(await readBody(req), res);
    return sendJSON(res, 404, { error: "not found" });
  }catch(e){
    return sendJSON(res, 500, { error: e.message || "eroare interna" });
  }
});

(async function main(){
  try{
    SA = await waitForDb();                 // ramane deschis: management sandbox (create/drop)
    await ensureInitialized(SA);
    await dropAllSandboxes();               // sandbox-urile nu supravietuiesc restartului
    setInterval(function(){ sweepSandboxes().catch(function(){}); }, 10 * 60 * 1000);
  }catch(e){
    console.error("INIT esuat: " + e.message);
    // continuam totusi sa ascultam — /health raspunde, dar interogarile vor esua clar
  }
  server.listen(PORT, () => console.log("sqlrunner asculta pe :" + PORT));
})();
