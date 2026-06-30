// ============================================================
//  Conquistador — UI client (Play with friends)
//  Joc de cucerire pe harta României, întrebări la nivel de licență.
//  Vorbește cu serviciul Node prin WebSocket la /game/.
//
//  FAZA 1: lobby complet (creează / join cu cod / vezi jucătorii live /
//  alege topic+dificultate / ready / start), cu reconectare după pică net-ul.
//  Harta + rundele de joc vin în Faza 2.
// ============================================================
(function(){
  "use strict";

  var SESSION_KEY = "conq-session";   // {cod, playerId} pentru reconectare
  var NAME_KEY    = "conq-name";      // ultimul nume folosit

  var ws = null;
  var state = {
    connected: false,
    you: null,          // playerId
    cod: null,
    hostId: null,
    faza: null,         // null | LOBBY | STARTING
    topic: null,
    dificultate: null,
    topicuri: [],       // [{topic, nume, intrebari, dificultati}]
    jucatori: [],       // [{id, nume, color, ready, host, connected}]
    minPlayers: 2,
    maxPlayers: 4,
    error: null,
    pending: null       // "create" | "join" — acțiune în curs, până vine "joined"
  };

  // ---------- WebSocket ----------
  function wsUrl(){
    // override pentru dev local (fără nginx): ?ws=ws://localhost:3099/game/
    // sau localStorage.setItem("conq-ws","ws://localhost:3099/game/")
    try{
      var q = new URLSearchParams(location.search).get("ws");
      if(q) return q;
      var ls = localStorage.getItem("conq-ws");
      if(ls) return ls;
    }catch(e){}
    var proto = location.protocol === "https:" ? "wss" : "ws";
    return proto + "://" + location.host + "/game/";
  }

  function connect(onOpen){
    if(ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)){
      if(ws.readyState === WebSocket.OPEN && onOpen) onOpen();
      return;
    }
    try{ ws = new WebSocket(wsUrl()); }
    catch(e){ state.error = "Nu mă pot conecta la server."; render(); return; }

    ws.onopen = function(){
      state.connected = true; state.error = null;
      if(onOpen) onOpen();
      render();
    };
    ws.onmessage = function(ev){
      var msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
      onMessage(msg);
    };
    ws.onclose = function(){
      state.connected = false;
      // dacă eram într-o cameră, încercăm reconectarea automată
      if(state.cod && state.you){
        setTimeout(function(){ if(isActiveView()) reconnect(); }, 1500);
      }
      render();
    };
    ws.onerror = function(){ /* onclose se ocupă de reîncercare */ };
  }

  function sendMsg(obj){
    if(ws && ws.readyState === WebSocket.OPEN){ ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  function onMessage(msg){
    switch(msg.t){
      case "joined":
        state.you = msg.playerId;
        state.cod = msg.cod;
        state.topicuri = msg.topicuri || state.topicuri;
        state.pending = null;
        state.error = null;
        saveSession();
        break;
      case "lobby":
        state.cod = msg.cod;
        state.faza = msg.faza;
        state.mode = msg.mode || "romania";
        state.modeNume = msg.modeNume || "România";
        state.hostId = msg.hostId;
        state.topics = msg.topics || [];
        state.maxTopics = msg.maxTopics || 3;
        state.dificultate = msg.dificultate;
        state.minPlayers = msg.minPlayers || state.minPlayers;
        state.maxPlayers = msg.maxPlayers || state.maxPlayers;
        state.jucatori = msg.jucatori || [];
        break;
      case "game":
        if(msg.map) state.gameMap = msg.map;             // harta vine o singură dată
        else if(state.gameMap) msg.map = state.gameMap;  // apoi o refolosim din cache
        var prev = state.game;
        state.game = msg;
        state.faza = msg.phase;
        // la o întrebare nouă, resetăm starea locală de răspuns/țintă
        var qid = msg.prompt && msg.prompt.kind === "question" ? msg.prompt.qid : null;
        if(qid !== state.lastQid){ state.lastQid = qid; state.answered = false; state.target = null; state.numInput = ""; state.myAnswer = null; }
        gameSounds(prev, msg);
        // muzica: piesa „întrebări" cât timp e activă o întrebare, altfel cea generală
        if(window.ConqAudio) window.ConqAudio.scene(msg.prompt && msg.prompt.kind === "question" ? "questions" : "adventure");
        break;
      case "answered":
        state.answered = true;
        break;
      case "error":
        state.error = msg.msg || "Eroare.";
        state.pending = null;
        break;
      case "emoji": if(isActiveView()) showReaction(msg.from, msg.e); return;
      case "chat":
        state.chat = state.chat || [];
        state.chat.push({ nume: msg.nume, color: msg.color, text: msg.text });
        if(state.chat.length > 60) state.chat.shift();
        if(isActiveView()) appendChatMsg(state.chat[state.chat.length - 1]);
        return;
      case "pong": return;
    }
    if(isActiveView()) render();
  }

  // ---------- sesiune (reconectare) ----------
  function saveSession(){
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify({ cod: state.cod, playerId: state.you })); }catch(e){}
  }
  function loadSession(){
    try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }catch(e){ return null; }
  }
  function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }

  function reconnect(){
    var s = loadSession(); if(!s || !s.cod || !s.playerId) return;
    connect(function(){ sendMsg({ t: "reconnect", cod: s.cod, playerId: s.playerId }); });
  }

  // ---------- acțiuni ----------
  function getName(){
    var el = document.getElementById("conq-name");
    var n = el ? el.value.trim() : "";
    if(n) try{ localStorage.setItem(NAME_KEY, n); }catch(e){}
    return n;
  }
  function savedName(){ try{ return localStorage.getItem(NAME_KEY) || ""; }catch(e){ return ""; } }

  function doCreate(){
    var nume = getName();
    if(!nume){ state.error = "Scrie-ți un nume."; return render(); }
    state.pending = "create"; state.error = null; render();
    connect(function(){ sendMsg({ t: "create", nume: nume }); });
  }
  function doJoin(){
    var nume = getName();
    var codEl = document.getElementById("conq-cod");
    var cod = codEl ? codEl.value.trim().toUpperCase() : "";
    if(!nume){ state.error = "Scrie-ți un nume."; return render(); }
    if(cod.length !== 4){ state.error = "Codul are 4 caractere."; return render(); }
    state.pending = "join"; state.error = null; render();
    connect(function(){ sendMsg({ t: "join", cod: cod, nume: nume }); });
  }
  function pickTopic(topic){ sendMsg({ t: "topic", topic: topic }); }
  function pickDif(dif){ sendMsg({ t: "topic", dificultate: dif }); }
  function pickMode(mode){ snd("select"); sendMsg({ t: "mode", mode: mode }); }
  function mascotImg(id, size){ return (window.ConqMascots && window.ConqMascots.has(id)) ? window.ConqMascots.svg(id, size || 34) : ""; }
  function pickMascot(id){ snd("select"); sendMsg({ t: "mascot", mascot: id }); }
  function sendEmoji(e){ sendMsg({ t: "emoji", e: e }); }
  function showReaction(pid, e){
    var el = document.getElementById("conq-pc-" + pid); if(!el) return;
    var s = document.createElement("span"); s.className = "conq-reaction"; s.textContent = e;
    el.appendChild(s); setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 2400);
  }
  function appendChatMsg(m){
    var log = document.getElementById("conq-chatlog"); if(!log) return;
    var d = document.createElement("div"); d.className = "conq-chatmsg";
    d.innerHTML = '<b style="color:' + (m.color || "#888") + '">' + esc(m.nume) + '</b> ' + esc(m.text);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function chatLogHTML(){ return (state.chat || []).map(function(m){ return '<div class="conq-chatmsg"><b style="color:' + (m.color || "#888") + '">' + esc(m.nume) + '</b> ' + esc(m.text) + '</div>'; }).join(""); }
  function sendChat(){ var i = document.getElementById("conq-chatin"); if(!i) return; var t = i.value.trim(); if(!t) return; sendMsg({ t: "chat", text: t }); i.value = ""; state.chatDraft = ""; }
  function toggleReady(){
    var me = myPlayer();
    sendMsg({ t: "ready", ready: !(me && me.ready) });
  }
  function doStart(){ sendMsg({ t: "start" }); }
  function doLeave(){
    sendMsg({ t: "leave" });
    clearSession();
    state.you = null; state.cod = null; state.faza = null; state.jucatori = [];
    state.topics = []; state.dificultate = null; state.error = null;
    state.game = null; state.lastQid = null; state.answered = false; state.target = null;
    state.cells = null; state.cellsKey = null; state.gameMap = null; state.chat = [];
    if(window.ConqAudio) window.ConqAudio.stopMusic();
    render();
  }

  // ---------- acțiuni de joc ----------
  function regionsArr(){ return (state.game.map && state.game.map.regions) || []; }
  function gAdj(id){ var r = regionsArr().filter(function(x){ return x.id === id; })[0]; return r ? r.neighbors : []; }
  function gMine(pid){ return regionsArr().filter(function(r){ return state.game.owners[r.id] === pid; }).map(function(r){ return r.id; }); }
  function gFreeAdj(pid){
    var mine = {}; gMine(pid).forEach(function(id){ mine[id] = 1; });
    return regionsArr().map(function(r){ return r.id; }).filter(function(id){
      return !state.game.owners[id] && gAdj(id).some(function(n){ return mine[n]; });
    });
  }
  function gEnemyAdj(pid){
    var mine = {}; gMine(pid).forEach(function(id){ mine[id] = 1; });
    return regionsArr().map(function(r){ return r.id; }).filter(function(id){
      return state.game.owners[id] !== pid && gAdj(id).some(function(n){ return mine[n]; });
    });
  }
  function snd(name){ if(window.ConqAudio) window.ConqAudio.play(name); }

  // declanșează sunete pe baza diferenței între două snapshot-uri de joc
  function ownersCount(g){ return g && g.owners ? Object.keys(g.owners).filter(function(k){ return g.owners[k]; }).length : 0; }
  function gameSounds(prev, next){
    if(!next || !window.ConqAudio) return;
    var pPr = (prev && prev.prompt) || {}, nPr = next.prompt || {};
    if(next.phase === "BASE_PICK" && prev && ownersCount(next) > ownersCount(prev)) snd("place");
    if(nPr.kind === "question" && nPr.qid !== pPr.qid){
      snd(nPr.mode && nPr.mode.indexOf("duel") >= 0 ? "battle" : "question");
    }
    if(nPr.kind === "reveal" && pPr.kind !== "reveal"){
      var gained = false, lost = false;
      if(prev && prev.owners && next.map){
        next.map.regions.forEach(function(r){
          var was = prev.owners[r.id], now = next.owners[r.id];
          if(now === state.you && was !== state.you) gained = true;
          if(was === state.you && now !== state.you) lost = true;
        });
      }
      snd(gained ? "conquer" : (lost ? "lose" : "reveal"));
    }
    if(next.phase === "RESULTS" && (!prev || prev.phase !== "RESULTS")){
      var board = nPr.board || [];
      snd(board[0] && board[0].playerId === state.you ? "win" : "lose");
    }
  }

  // teritorii pe care le pot alege la selecție: vecine libere; dacă-s încercuit, orice liber
  function gSelectTargets(){
    var a = gFreeAdj(state.you);
    if(a.length) return a;
    return regionsArr().map(function(r){ return r.id; }).filter(function(id){ return !state.game.owners[id]; });
  }
  function onRegionClick(id){
    var g = state.game, pr = g.prompt; if(!pr) return;
    if(pr.kind === "basePick" && pr.picker === state.you){
      if(!g.owners[id]){ snd("select"); sendMsg({ t: "basePick", region: id }); }
    } else if(pr.kind === "select" && participatesSelect()){
      if(gSelectTargets().indexOf(id) >= 0){ snd("select"); sendMsg({ t: "select", region: id }); }
    } else if(pr.kind === "attackPick" && pr.attacker === state.you){
      if(gEnemyAdj(state.you).indexOf(id) >= 0){ snd("battle"); sendMsg({ t: "attackPick", region: id }); }
    }
  }
  function participatesSelect(){ return state.game.prompt && state.game.prompt.kind === "select" && gSelectTargets().length > 0; }
  function mySelection(){ var s = state.game.selections; return s ? s[state.you] : null; }

  function answerGrila(idx){
    var pr = state.game.prompt; if(!pr || state.answered) return;
    state.answered = true; state.myAnswer = idx; snd("click"); sendMsg({ t: "answer", qid: pr.qid, val: idx }); render();
  }
  function answerNumeric(){
    var pr = state.game.prompt; if(!pr || state.answered) return;
    var v = parseFloat(state.numInput);
    if(isNaN(v)){ state.error = "Scrie un număr."; return render(); }
    state.answered = true; state.myAnswer = v; state.error = null; snd("click"); sendMsg({ t: "answer", qid: pr.qid, val: v }); render();
  }

  // ---------- helpers ----------
  function myPlayer(){ return state.jucatori.filter(function(p){ return p.id === state.you; })[0] || null; }
  function isHost(){ return state.you && state.you === state.hostId; }
  function inRoom(){ return !!(state.cod && state.you && state.faza); }
  function isActiveView(){ var c = document.getElementById("content"); return c && c.dataset.view === "conquistador"; }
  function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  // ---------- randare ----------
  var GAME_PHASES = ["BASE_PICK", "EXPANSION", "ATTACK", "RESULTS"];
  function render(){
    var c = document.getElementById("content");
    if(!c || c.dataset.view !== "conquistador") return;

    if(state.game && GAME_PHASES.indexOf(state.game.phase) >= 0) return renderGame(c);
    if(state.you && state.cod) return renderLobby(c);
    return renderHome(c);
  }

  function errBox(){
    return state.error ? '<div class="conq-err">⚠️ ' + esc(state.error) + '</div>' : "";
  }

  function renderHome(c){
    var busy = state.pending ? ' disabled' : '';
    var label = state.pending === "create" ? "Se creează…" : (state.pending === "join" ? "Se intră…" : null);
    c.innerHTML = ''
      + '<div class="hero">'
      +   '<h2>Conquistador ⚔️🗺️</h2>'
      +   '<p>Joc de cucerire pe harta României, cu prietenii (2–4 jucători). Răspunzi corect → cucerești teritorii. '
      +   'Întrebările sunt la nivel de <b>examen de licență</b> — înveți în timp ce te joci.</p>'
      + '</div>'
      + '<div class="conq-home">'
      +   errBox()
      +   '<label class="conq-label">Numele tău</label>'
      +   '<input id="conq-name" class="conq-input" maxlength="20" placeholder="ex. Gabi" value="' + esc(savedName()) + '">'
      +   '<div class="conq-actions">'
      +     '<button class="conq-btn primary" id="conq-create"' + busy + '>➕ Creează cameră</button>'
      +   '</div>'
      +   '<div class="conq-or">— sau —</div>'
      +   '<div class="conq-join-row">'
      +     '<input id="conq-cod" class="conq-input code" maxlength="4" placeholder="COD" style="text-transform:uppercase">'
      +     '<button class="conq-btn" id="conq-join"' + busy + '>Intră în cameră</button>'
      +   '</div>'
      +   (label ? '<div class="conq-status">' + label + '</div>' : '')
      + '</div>';

    byId("conq-create", function(b){ b.onclick = doCreate; });
    byId("conq-join", function(b){ b.onclick = doJoin; });
    byId("conq-cod", function(i){ i.onkeydown = function(e){ if(e.key === "Enter") doJoin(); }; });
    byId("conq-name", function(i){ i.onkeydown = function(e){ if(e.key === "Enter") doCreate(); }; });
  }

  function renderLobby(c){
    var connBadge = state.connected ? '' : '<span class="conq-reconnect">reconectare…</span>';
    var me = myPlayer();
    var iAmReady = me && me.ready;
    var host = isHost();

    // listă jucători
    var slots = '';
    for(var i = 0; i < state.maxPlayers; i++){
      var p = state.jucatori[i];
      if(p){
        slots += '<div class="conq-pl' + (p.connected ? '' : ' off') + '">'
          + '<span class="conq-pl-masc" style="background:' + p.color + '">' + mascotImg(p.mascot, 30) + '</span>'
          + '<span class="conq-pl-name">' + esc(p.nume) + (p.id === state.you ? ' <em>(tu)</em>' : '') + '</span>'
          + (p.host ? '<span class="conq-tag host">gazdă</span>' : '')
          + (p.connected ? (p.ready ? '<span class="conq-tag ready">✓ gata</span>' : '<span class="conq-tag wait">așteaptă</span>')
                         : '<span class="conq-tag off">deconectat</span>')
          + '</div>';
      } else {
        slots += '<div class="conq-pl empty"><span class="conq-dot ghost"></span><span class="conq-pl-name">loc liber…</span></div>';
      }
    }

    // topicuri (multi-select, max state.maxTopics)
    var sel = state.topics || [];
    var topics = state.topicuri.map(function(t){
      var active = sel.indexOf(t.topic) >= 0 ? ' active' : '';
      var dis = host ? '' : ' disabled';
      return '<button class="conq-topic' + active + '" data-topic="' + esc(t.topic) + '"' + dis + '>'
        + '<b>' + esc(t.nume) + '</b><small>' + t.intrebari + ' întrebări</small></button>';
    }).join("");

    // dificultăți (reuniunea materiilor alese)
    var difs = [];
    state.topicuri.filter(function(t){ return sel.indexOf(t.topic) >= 0; })
      .forEach(function(t){ (t.dificultati || []).forEach(function(d){ if(difs.indexOf(d) < 0) difs.push(d); }); });
    var difBtns = difs.map(function(d){
      var active = state.dificultate === d ? ' active' : '';
      var dis = host ? '' : ' disabled';
      return '<button class="conq-dif' + active + '" data-dif="' + esc(d) + '"' + dis + '>' + esc(d) + '</button>';
    }).join("");

    var connected = state.jucatori.filter(function(p){ return p.connected; });
    var allReady = connected.length >= state.minPlayers && connected.every(function(p){ return p.ready; });
    var canStart = host && sel.length > 0 && allReady;

    var modeRow = '<div class="conq-modebar"><span class="conq-modebar-lbl">Mod de joc:</span>'
      + [["romania", "🇷🇴 România", "2–4"], ["europa", "🇪🇺 Europa", "4–8"]].map(function(m){
          return '<button class="conq-mode' + (state.mode === m[0] ? " active" : "") + '" data-mode="' + m[0] + '"' + (host ? "" : " disabled") + '>'
            + m[1] + ' <small>' + m[2] + ' jucători</small></button>';
        }).join("")
      + (host ? "" : '<span class="conq-hint" style="margin-left:8px">(alege gazda)</span>') + '</div>';

    var myMascot = (me && me.mascot) || (window.ConqMascots && window.ConqMascots.DEFAULT);
    var mascotBar = (window.ConqMascots ? ('<div class="conq-modebar"><span class="conq-modebar-lbl">Mascota ta:</span><div class="conq-mascot-pick">'
      + window.ConqMascots.LIST.map(function(m){
          return '<button class="conq-mascot-btn' + (myMascot === m.id ? " active" : "") + '" data-mascot="' + m.id + '" title="' + esc(m.nume) + '">' + window.ConqMascots.svg(m.id, 40) + '</button>';
        }).join("") + '</div></div>') : "");

    c.innerHTML = ''
      + '<div class="conq-lobby">'
      +   '<div class="conq-room-head">'
      +     '<div><div class="conq-room-label">Cod cameră ' + connBadge + '</div>'
      +     '<div class="conq-code-big" title="Click pentru a copia">' + esc(state.cod) + '</div></div>'
      +     '<button class="conq-btn ghost" id="conq-leave">Părăsește</button>'
      +   '</div>'
      +   errBox()
      +   modeRow
      +   mascotBar
      +   '<div class="conq-cols">'
      +     '<div class="conq-card">'
      +       '<h3>Jucători <small>' + connected.length + '/' + state.maxPlayers + '</small></h3>'
      +       '<div class="conq-players">' + slots + '</div>'
      +       '<p class="conq-hint">Trimite codul <b>' + esc(state.cod) + '</b> prietenilor ca să intre.</p>'
      +     '</div>'
      +     '<div class="conq-card">'
      +       '<h3>Materii <small>(' + sel.length + '/' + (state.maxTopics || 3) + (host ? ' · alege până la ' + (state.maxTopics || 3) : ' · alege gazda') + ')</small></h3>'
      +       '<div class="conq-topics">' + (topics || '<i>Niciun topic încărcat.</i>') + '</div>'
      +       (sel.length ? '<h3 style="margin-top:14px">Dificultate</h3><div class="conq-difs">' + difBtns + '</div>' : '')
      +     '</div>'
      +   '</div>'
      +   '<div class="conq-foot">'
      +     '<button class="conq-btn ' + (iAmReady ? '' : 'primary') + '" id="conq-ready">'
      +        (iAmReady ? '✓ Sunt gata (anulează)' : 'Sunt gata') + '</button>'
      +     (host ? '<button class="conq-btn primary" id="conq-start"' + (canStart ? '' : ' disabled') + '>▶ Pornește jocul</button>' : '')
      +     (host && !canStart ? '<span class="conq-status">' + startHint(host, allReady, connected.length) + '</span>' : '')
      +   '</div>'
      + '</div>';

    byId("conq-leave", function(b){ b.onclick = doLeave; });
    byId("conq-ready", function(b){ b.onclick = toggleReady; });
    byId("conq-start", function(b){ b.onclick = doStart; });
    var codeEl = c.querySelector(".conq-code-big");
    if(codeEl) codeEl.onclick = function(){ copyText(state.cod); codeEl.classList.add("copied"); setTimeout(function(){ codeEl.classList.remove("copied"); }, 900); };
    c.querySelectorAll(".conq-mode").forEach(function(b){ b.onclick = function(){ if(!b.disabled) pickMode(b.dataset.mode); }; });
    c.querySelectorAll(".conq-mascot-btn").forEach(function(b){ b.onclick = function(){ pickMascot(b.dataset.mascot); }; });
    c.querySelectorAll(".conq-topic").forEach(function(b){ b.onclick = function(){ pickTopic(b.dataset.topic); }; });
    c.querySelectorAll(".conq-dif").forEach(function(b){ b.onclick = function(){ pickDif(b.dataset.dif); }; });
  }

  function startHint(host, allReady, n){
    if(!state.topics || !state.topics.length) return "Alege cel puțin o materie.";
    if(n < state.minPlayers) return "Minim " + state.minPlayers + " jucători.";
    if(!allReady) return "Așteptăm ca toți să fie gata.";
    return "";
  }

  // ---------- harta: imaginea reală a României + regiuni Voronoi peste ea ----------
  function playerColor(pid){ var p = (state.game.players || []).filter(function(x){ return x.id === pid; })[0]; return p ? p.color : null; }

  // taie un poligon cu semiplanul „mai aproape de A decât de B" (Sutherland-Hodgman)
  function clipHalf(poly, ax, ay, bx, by){
    var mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay;
    function f(p){ return (p[0] - mx) * dx + (p[1] - my) * dy; }
    var out = [];
    for(var i = 0; i < poly.length; i++){
      var cur = poly[i], prv = poly[(i + poly.length - 1) % poly.length];
      var fc = f(cur), fp = f(prv);
      if(fc <= 0){
        if(fp > 0){ var t = fp / (fp - fc); out.push([prv[0] + t * (cur[0] - prv[0]), prv[1] + t * (cur[1] - prv[1])]); }
        out.push(cur);
      } else if(fp <= 0){ var t2 = fp / (fp - fc); out.push([prv[0] + t2 * (cur[0] - prv[0]), prv[1] + t2 * (cur[1] - prv[1])]); }
    }
    return out;
  }
  function buildCells(){
    var g = state.game, border = g.map.border, regs = g.map.regions;
    var cells = {};
    regs.forEach(function(s){
      var poly = border.map(function(p){ return [p[0], p[1]]; });
      regs.forEach(function(o){ if(o.id === s.id || !poly.length) return; poly = clipHalf(poly, s.cx, s.cy, o.cx, o.cy); });
      cells[s.id] = poly;
    });
    return cells;
  }
  function getCells(){ if(!state.cells || state.cellsKey !== state.cod + state.faza0) { state.cells = buildCells(); state.cellsKey = state.cod + state.faza0; } return state.cells; }
  function centroid(poly){ var x = 0, y = 0; poly.forEach(function(p){ x += p[0]; y += p[1]; }); return [x / poly.length, y / poly.length]; }
  function polyStr(poly){ return poly.map(function(p){ return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }

  function mapSVG(highlight){
    var g = state.game;
    var pathMode = !!(g.map.regions[0] && g.map.regions[0].d);             // Europa = poligoane reale de țări
    var hasBorder = !pathMode && !!(g.map.border && g.map.border.length);  // România = Voronoi peste imagine
    var cells = hasBorder ? getCells() : null;
    var hl = {}; (highlight || []).forEach(function(id){ hl[id] = 1; });
    var W = pathMode ? g.map.viewBox.w : ((g.map.img && g.map.img.w) || 700);
    var H = pathMode ? g.map.viewBox.h : ((g.map.img && g.map.img.h) || 500);
    var svg = '<svg class="conq-map" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    svg += '<defs><filter id="cqShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.5" flood-color="rgba(0,0,0,.55)"/></filter></defs>';
    if(pathMode){
      // POLIGOANE REALE pe țări (formele țărilor SUNT harta) peste un fundal de mare
      svg += '<rect class="conq-sea" x="0" y="0" width="' + W + '" height="' + H + '"></rect>';
      g.map.regions.forEach(function(rg){
        var owner = g.owners[rg.id];
        var col = owner ? playerColor(owner) : null;
        var cls = "conq-land" + (hl[rg.id] ? " hl" : "") + (owner ? "" : " neutral");
        svg += '<path class="' + cls + '" data-id="' + rg.id + '" d="' + rg.d + '" style="fill:' + (col || "#d9cba6") + ';fill-opacity:' + (col ? "0.8" : "1") + '"></path>';
      });
    } else {
      var img = g.map.img || { url: "", w: 700, h: 500 };
      svg += '<image href="' + img.url + '" xlink:href="' + img.url + '" x="0" y="0" width="' + img.w + '" height="' + img.h + '" preserveAspectRatio="none"></image>';
      if(hasBorder){
        g.map.regions.forEach(function(rg){
          var poly = cells[rg.id]; if(!poly || !poly.length) return;
          var owner = g.owners[rg.id];
          var col = owner ? playerColor(owner) : null;
          var cls = "conq-reg" + (hl[rg.id] ? " hl" : "") + (owner ? "" : " neutral");
          svg += '<polygon class="' + cls + '" data-id="' + rg.id + '" points="' + polyStr(poly) + '" style="fill:' + (col || "#ffffff") + ';fill-opacity:' + (col ? "0.42" : "0") + '"></polygon>';
        });
      } else {
        g.map.regions.forEach(function(rg){
          var owner = g.owners[rg.id];
          var col = owner ? playerColor(owner) : null;
          var rr = hl[rg.id] ? 28 : 24;
          svg += '<circle class="conq-disc' + (hl[rg.id] ? " hl" : "") + (owner ? "" : " neutral") + '" data-id="' + rg.id + '" cx="' + rg.cx + '" cy="' + rg.cy + '" r="' + rr + '" style="fill:' + (col || "#d8c9ad") + ';fill-opacity:' + (col ? "0.62" : "0.32") + '"></circle>';
        });
      }
    }
    // markere (castel = bază / scut = normal + valoare) la centrul regiunii
    g.map.regions.forEach(function(rg){
      if(hasBorder && (!cells[rg.id] || !cells[rg.id].length)) return;
      var owner = g.owners[rg.id];
      var col = owner ? playerColor(owner) : "#6b5b3e";
      var isBase = g.bases && Object.keys(g.bases).some(function(pid){ return g.bases[pid] === rg.id; });
      var worth = isBase ? 1000 : rg.val;
      svg += '<g class="conq-marker" data-id="' + rg.id + '" filter="url(#cqShadow)" transform="translate(' + rg.cx + ',' + rg.cy + ')">';
      svg += '<text class="conq-icon" text-anchor="middle" y="-5">' + (isBase ? "🏰" : "🛡️") + '</text>';
      svg += '<rect class="conq-badge" x="-19" y="5" width="38" height="16" rx="8" style="fill:' + col + '"></rect>';
      svg += '<text class="conq-badge-t" text-anchor="middle" y="17">' + worth + '</text>';
      if(g.lives && g.lives[rg.id] != null){
        var lv = g.lives[rg.id];
        for(var k = 0; k < lv; k++) svg += '<circle class="conq-life" cx="' + (-((lv - 1) * 5) + k * 10) + '" cy="-25" r="2.6"></circle>';
      }
      svg += '</g>';
    });
    // steaguri de selecție (faza select) — steag desenat în CULOAREA jucătorului
    if(g.selections){
      Object.keys(g.selections).forEach(function(pid){
        var rid = g.selections[pid];
        var rg = g.map.regions.filter(function(x){ return x.id === rid; })[0];
        if(!rid || !rg) return;
        var col = playerColor(pid) || "#888";
        var fx = rg.cx + 13, fy = rg.cy - 8;
        svg += '<g class="conq-flag2" filter="url(#cqShadow)">'
          + '<line x1="' + fx + '" y1="' + fy + '" x2="' + fx + '" y2="' + (fy - 22) + '" stroke="#2a1d0e" stroke-width="2"></line>'
          + '<path d="M' + fx + ' ' + (fy - 22) + ' L' + (fx + 16) + ' ' + (fy - 17.5) + ' L' + fx + ' ' + (fy - 13) + ' Z" fill="' + col + '" stroke="rgba(0,0,0,.45)" stroke-width="0.7"></path>'
          + '</g>';
      });
    }
    svg += '</svg>';
    return svg;
  }
  function shortReg(n){ return n.replace("Transilvania", "Trans."); }

  // ---------- bara de jucători (carduri stil joc) ----------
  function scoreStrip(){
    var g = state.game;
    return '<div class="conq-score-strip">' + (g.order || []).map(function(id){
      var p = (g.players || []).filter(function(x){ return x.id === id; })[0] || {};
      var isTurn = g.turn === id;
      var sc = (g.scores && g.scores[id]) || 0;
      var atk = (g.phase === "ATTACK" && g.attacksLeft) ? '<span class="conq-atk" title="atacuri rămase">⚔ ' + (g.attacksLeft[id] || 0) + '</span>' : '';
      return '<div class="conq-pcard' + (isTurn ? ' turn' : '') + (p.connected === false ? ' off' : '') + '" style="--pc:' + (p.color || '#888') + '">'
        + '<span class="conq-pcard-bar"></span>'
        + '<span class="conq-pcard-name">' + esc(p.nume || '?') + (id === state.you ? ' ·tu' : '') + '</span>'
        + '<span class="conq-pcard-pts">' + sc + '</span>' + atk
        + '</div>';
    }).join("") + '</div>';
  }

  function phaseLabel(ph){
    return { BASE_PICK: "Alegerea bazelor", EXPANSION: "Expansiune", ATTACK: "Atac", RESULTS: "Rezultate" }[ph] || ph;
  }
  function muteBtn(){
    var m = window.ConqAudio && window.ConqAudio.isMuted();
    return '<button class="conq-btn ghost sm" id="conq-mute" title="Sunet">' + (m ? "🔇" : "🔊") + '</button>';
  }

  // progresul meciului (cât mai e): runda de expansiune / atacuri rămase + bară
  function matchProgress(g){
    if(g.phase === "EXPANSION") return '<span class="conq-progress">🧭 Expansiune · runda ' + (g.round || 1) + '</span>';
    if(g.phase === "ATTACK"){
      var total = g.attacksTotal || 0, rem = 0;
      if(g.attacksLeft) Object.keys(g.attacksLeft).forEach(function(k){ rem += g.attacksLeft[k]; });
      var pct = total ? Math.round((total - rem) / total * 100) : 0;
      return '<span class="conq-progress">⚔️ ' + rem + '/' + total + ' atacuri rămase'
        + '<span class="conq-progbar"><span class="conq-progfill" style="width:' + pct + '%"></span></span></span>';
    }
    if(g.phase === "BASE_PICK") return '<span class="conq-progress">🏰 Alegerea bazelor</span>';
    return '';
  }

  // panou lateral: fiecare jucător cu mascota, numele și punctele + bara de emoji
  var SIDE_EMOJIS = ["😂", "😮", "❤️", "👍", "😢", "🔥", "😎", "👏"];
  function playersSide(g){
    var html = '<div class="conq-side">';
    (g.order || []).forEach(function(id){
      var p = (g.players || []).filter(function(x){ return x.id === id; })[0] || {};
      var isTurn = g.turn === id;
      var sc = (g.scores && g.scores[id]) || 0;
      var atk = (g.phase === "ATTACK" && g.attacksLeft) ? '<span class="conq-side-atk">⚔ ' + (g.attacksLeft[id] || 0) + '</span>' : "";
      html += '<div class="conq-pcard2' + (isTurn ? " turn" : "") + (p.connected === false ? " off" : "") + '" id="conq-pc-' + id + '" style="--pc:' + (p.color || "#888") + '">'
        + '<span class="conq-pcard2-masc">' + mascotImg(p.mascot, 42) + '</span>'
        + '<span class="conq-pcard2-info"><span class="conq-pcard2-name">' + esc(p.nume || "?") + (id === state.you ? " ·tu" : "") + '</span>'
        + '<span class="conq-pcard2-pts">' + sc + ' p' + atk + '</span></span>'
        + '</div>';
    });
    html += '<div class="conq-emojibar">' + SIDE_EMOJIS.map(function(e){ return '<button class="conq-emoji-btn" data-e="' + e + '">' + e + '</button>'; }).join("") + '</div>';
    html += '<div class="conq-chat"><div class="conq-chatlog" id="conq-chatlog">' + chatLogHTML() + '</div>'
      + '<div class="conq-chatin-row"><input id="conq-chatin" class="conq-chatin" maxlength="200" placeholder="Scrie un mesaj…" value="' + esc(state.chatDraft || "") + '"><button class="conq-chatsend" id="conq-chatsend" title="Trimite">➤</button></div></div>';
    html += '</div>';
    return html;
  }

  function renderGame(c){
    var g = state.game, pr = g.prompt || {};
    if(pr.kind === "results") return renderResults(c, pr);

    // regiuni clicabile, în funcție de fază
    var highlight = [];
    if(pr.kind === "basePick" && pr.picker === state.you) highlight = g.map.regions.filter(function(r){ return !g.owners[r.id]; }).map(function(r){ return r.id; });
    else if(pr.kind === "select" && participatesSelect()) highlight = gSelectTargets();
    else if(pr.kind === "attackPick" && pr.attacker === state.you) highlight = gEnemyAdj(state.you);

    var modal = (pr.kind === "question" || pr.kind === "reveal") ? questionModal(g, pr) : "";

    c.innerHTML = ''
      + '<div class="conq-game" id="conq-game">'
      +   '<div class="conq-gtop">'
      +     '<span class="conq-phase">' + phaseLabel(g.phase) + '</span>'
      +     matchProgress(g)
      +     '<span style="flex:1"></span>'
      +     '<div class="conq-zoombar inline">'
      +       '<button class="conq-zbtn" id="conq-zout" title="Micșorează harta">−</button>'
      +       '<span class="conq-zlvl">' + Math.round((state.mapZoom || 1) * 100) + '%</span>'
      +       '<button class="conq-zbtn" id="conq-zin" title="Mărește harta">+</button>'
      +     '</div>'
      +     muteBtn()
      +     '<button class="conq-btn ghost sm" id="conq-zfs" title="Tot ecranul">⛶</button>'
      +     '<button class="conq-btn ghost sm" id="conq-leave">Ieși</button>'
      +   '</div>'
      +   errBox()
      +   '<div class="conq-arena">'
      +     '<div class="conq-stage" id="conq-stage">'
      +       '<div class="conq-mapwrap" id="conq-mapwrap"><div class="conq-mapzoom" style="width:' + Math.round((state.mapZoom || 1) * 100) + '%">' + mapSVG(highlight) + '</div></div>'
      +       modal       /* modalul de întrebare stă PESTE hartă (întunecă doar harta, nu chat-ul) */
      +     '</div>'
      +     playersSide(g)
      +   '</div>'
      +   '<div class="conq-bottombar">' + banner(g, pr) + '</div>'
      + '</div>';

    byId("conq-leave", function(b){ b.onclick = doLeave; });
    byId("conq-mute", function(b){ b.onclick = function(){ var m = window.ConqAudio.toggle(); b.textContent = m ? "🔇" : "🔊"; }; });
    byId("conq-zin", function(b){ b.onclick = function(){ state.mapZoom = Math.min(2.6, (state.mapZoom || 1) + 0.2); render(); }; });
    byId("conq-zout", function(b){ b.onclick = function(){ state.mapZoom = Math.max(0.6, (state.mapZoom || 1) - 0.2); render(); }; });
    byId("conq-zfs", function(b){ b.onclick = function(){ var el = document.getElementById("conq-game"); if(document.fullscreenElement) document.exitFullscreen(); else if(el && el.requestFullscreen) el.requestFullscreen(); }; });
    c.querySelectorAll(".conq-reg, .conq-marker, .conq-disc, .conq-land").forEach(function(el){ el.onclick = function(){ onRegionClick(el.dataset.id); }; });
    c.querySelectorAll(".conq-emoji-btn").forEach(function(b){ b.onclick = function(){ sendEmoji(b.dataset.e); }; });
    byId("conq-chatsend", function(b){ b.onclick = sendChat; });
    byId("conq-chatin", function(i){ i.oninput = function(){ state.chatDraft = i.value; }; i.onkeydown = function(e){ if(e.key === "Enter"){ e.preventDefault(); sendChat(); } }; });
    byId("conq-chatlog", function(l){ l.scrollTop = l.scrollHeight; });
    wireModal(g, pr);
    startCountdown(pr);
  }

  // banner de instrucțiuni peste hartă (pentru fazele de click)
  function banner(g, pr){
    var txt = "", cls = "";
    if(pr.kind === "basePick"){
      cls = pr.picker === state.you ? "me" : "";
      txt = pr.picker === state.you ? "🏰 <b>Rândul tău!</b> Click pe o regiune liberă ca să-ți pui baza."
                                    : "🏰 " + esc(nameOf(g, pr.picker)) + " își alege baza…";
    } else if(pr.kind === "select"){
      if(participatesSelect()){
        cls = mySelection() ? "" : "me";
        var boxed = gFreeAdj(state.you).length === 0;
        txt = mySelection() ? "✅ Ai ales <b>" + esc(regName(g, mySelection())) + "</b>. Așteptăm ceilalți jucători…"
              : (boxed ? "🧭 Ești încercuit — <b>alege orice teritoriu liber</b> (evidențiat)."
                       : "🧭 <b>Alege un teritoriu</b> liber vecin (evidențiat) pe care vrei să-l cucerești.");
      } else txt = "🧭 Ceilalți își aleg teritoriile…";
    } else if(pr.kind === "attackPick"){
      cls = pr.attacker === state.you ? "me" : "";
      txt = pr.attacker === state.you ? "⚔️ <b>Atacă!</b> Click pe un teritoriu vecin (evidențiat)."
                                      : "⚔️ " + esc(nameOf(g, pr.attacker)) + " alege pe cine atacă…";
    } else {
      // întrebare/reveal: modalul acoperă ecranul, bannerul rămâne discret în spate, fără timer
      txt = esc((g.outcome && g.outcome.text) || "");
    }
    var pickPhase = pr.kind === "basePick" || pr.kind === "select" || pr.kind === "attackPick";
    var timer = (pickPhase && pr.deadline) ? '<span class="conq-timer" id="conq-timer"></span>' : '';
    return '<div class="conq-banner ' + cls + '">' + timer + '<span>' + txt + '</span></div>';
  }

  // ---------- MODAL întrebare / rezolvare (pop-up în mijloc) ----------
  function questionModal(g, pr){
    var body = "";
    if(pr.kind === "question"){
      var participate = pr.mode === "expansion" || pr.attacker === state.you || pr.defender === state.you;
      var tag = pr.mode === "expansion" ? "Întrebare — Expansiune"
              : pr.mode === "duel-tie" ? "Departajare — cine se apropie 🎯" : "Duel ⚔️";
      var combat = (pr.attacker || pr.defender)
        ? '<div class="conq-vs">' + fighter(g, pr.attacker, "atac") + '<span class="conq-vs-x">VS</span>' + (pr.defender ? fighter(g, pr.defender, "apărare") : '<span class="conq-neutral-tag">teritoriu neutru</span>') + '</div>'
        : '';
      body += '<div class="conq-modal-tag">' + tag + '</div>';
      body += combat;
      body += '<div class="conq-modal-q">' + esc(pr.enunt) + '</div>';
      if(pr.cod) body += '<pre class="conq-code">' + esc(pr.cod) + '</pre>';
      if(!participate){
        // spectator: vede întrebarea ȘI variantele (read-only), ca să urmărească duelul
        if(pr.tip === "grila"){
          body += '<div class="conq-modal-opts">' + pr.variante.map(function(v, i){
            return '<div class="conq-modal-opt disabled"><span class="conq-opt-k">' + String.fromCharCode(65 + i) + '</span>' + esc(v) + '</div>';
          }).join("") + '</div>';
        }
        body += '<div class="conq-modal-wait">⚔️ Duel în desfășurare — privești.</div>';
      } else if(state.answered){
        // cât aștept, văd ce am ales (evidențiat în culoarea mea)
        if(pr.tip === "grila"){
          body += '<div class="conq-modal-opts">' + pr.variante.map(function(v, i){
            var mine = state.myAnswer === i;
            return '<div class="conq-modal-opt disabled' + (mine ? " mine" : "") + '"' + (mine ? ' style="--pc:' + (playerColor(state.you) || "#888") + '"' : "") + '><span class="conq-opt-k">' + String.fromCharCode(65 + i) + '</span>' + esc(v) + (mine ? ' <span class="conq-yourpick">alegerea ta</span>' : "") + '</div>';
          }).join("") + '</div>';
        } else if(state.myAnswer != null){
          body += '<div class="conq-yourpick-num" style="--pc:' + (playerColor(state.you) || "#888") + '">Ai răspuns: <b>' + esc(state.myAnswer) + '</b></div>';
        }
        body += '<div class="conq-modal-wait">✓ Trimis. Așteptăm ceilalți…</div>';
      } else if(pr.tip === "grila"){
        body += '<div class="conq-modal-opts">' + pr.variante.map(function(v, i){
          return '<button class="conq-modal-opt" data-i="' + i + '"><span class="conq-opt-k">' + String.fromCharCode(65 + i) + '</span>' + esc(v) + '</button>';
        }).join("") + '</div>';
      } else {
        body += '<div class="conq-modal-num"><input id="conq-numin" class="conq-input" type="number" step="any" placeholder="răspunsul tău (număr)" value="' + esc(state.numInput || "") + '"><button class="conq-btn primary" id="conq-numsend">Trimite</button></div>';
      }
    } else { // reveal
      body += '<div class="conq-modal-tag reveal">💡 Rezolvare</div>';
      if(pr.enunt) body += '<div class="conq-modal-q small">' + esc(pr.enunt) + '</div>';
      if(pr.cod) body += '<pre class="conq-code">' + esc(pr.cod) + '</pre>';
      if(pr.tip === "grila" && pr.variante){
        // variantele: cea corectă verde + bulinele celor care au ales (în culoarea lor)
        body += '<div class="conq-modal-opts reveal">' + pr.variante.map(function(v, i){
          var isC = i === pr.corect;
          var dots = (pr.results || []).filter(function(r){ return r.val === i; }).map(function(r){
            return '<span class="conq-pick-dot" title="' + esc(nameOf(g, r.playerId)) + '" style="background:' + (playerColor(r.playerId) || "#888") + '"></span>';
          }).join("");
          return '<div class="conq-modal-opt reveal' + (isC ? " ok" : "") + '"><span class="conq-opt-k">' + String.fromCharCode(65 + i) + '</span><span class="conq-opt-txt">' + esc(v) + '</span>'
            + (isC ? '<span class="conq-opt-ck">✓</span>' : "") + (dots ? '<span class="conq-pick-dots">' + dots + '</span>' : "") + '</div>';
        }).join("") + '</div>';
      } else if(pr.corectText != null){
        body += '<div class="conq-correct">Corect: <b>' + esc(pr.corectText) + '</b></div>';
      }
      if(pr.explicatie) body += '<div class="conq-expl">' + esc(pr.explicatie) + '</div>';
      var rows = (pr.results || []).map(function(rr){
        var nm = esc(nameOf(g, rr.playerId));
        var detail;
        if(rr.dist != null) detail = '<span class="conq-rev-val">' + esc(rr.val) + '</span> <small>dist. ' + rr.dist + '</small>';
        else if(rr.val == null) detail = '<i>fără răspuns</i>';
        else if(pr.tip === "grila") detail = '<span class="conq-rev-val ' + (rr.correct ? "ok" : "no") + '">' + (rr.correct ? "✓ corect" : "✗ greșit") + '</span>';
        else detail = '<span class="conq-rev-val ' + (rr.correct ? "ok" : "no") + '">' + (rr.correct ? "✓" : "✗") + ' ' + esc(rr.val) + '</span>';
        var t = rr.ms != null ? ' <small class="conq-rev-ms">⏱ ' + (rr.ms / 1000).toFixed(1) + 's</small>' : "";
        var gain = rr.gained ? ' <span class="conq-gain">+' + esc(regName(g, rr.gained)) + '</span>' : "";
        return '<div class="conq-rev-row"><b><span class="conq-rev-dot" style="background:' + (playerColor(rr.playerId) || "#888") + '"></span>' + nm + '</b><span>' + detail + t + gain + '</span></div>';
      }).join("");
      if(rows) body += '<div class="conq-rev">' + rows + '</div>';
      if(pr.outcome) body += '<div class="conq-outcome">' + esc(pr.outcome) + '</div>';
    }
    var timer = (pr.kind === "question" && pr.deadline) ? '<div class="conq-modal-timer" id="conq-timer"></div>' : '';
    return '<div class="conq-modal-back"><div class="conq-modal">' + timer + body + '</div></div>';
  }
  function fighter(g, pid, role){
    var p = (g.players || []).filter(function(x){ return x.id === pid; })[0] || {};
    return '<div class="conq-fighter ' + (pid === state.you ? 'me' : '') + '" style="--pc:' + (p.color || '#888') + '">'
      + '<span class="conq-fighter-dot"></span><b>' + esc(p.nume || '?') + '</b><small>' + role + '</small></div>';
  }
  function wireModal(g, pr){
    if(pr.kind !== "question" || state.answered) return;
    var participate = pr.mode === "expansion" || pr.attacker === state.you || pr.defender === state.you;
    if(!participate) return;
    var c = document.getElementById("content");
    c.querySelectorAll(".conq-modal-opt").forEach(function(b){ b.onclick = function(){ answerGrila(parseInt(b.dataset.i, 10)); }; });
    byId("conq-numin", function(i){ i.oninput = function(){ state.numInput = i.value; }; i.onkeydown = function(e){ if(e.key === "Enter") answerNumeric(); }; setTimeout(function(){ i.focus(); }, 30); });
    byId("conq-numsend", function(b){ b.onclick = answerNumeric; });
  }

  // countdown vizual (actualizează doar textul, fără re-render)
  function startCountdown(pr){
    if(state.tick){ clearInterval(state.tick); state.tick = null; }
    if(!pr || !pr.deadline) return;
    function upd(){
      var el = document.getElementById("conq-timer"); if(!el){ clearInterval(state.tick); return; }
      var s = Math.max(0, Math.ceil((pr.deadline - Date.now()) / 1000));
      el.textContent = "⏱ " + s + "s";
      el.classList.toggle("urgent", s <= 5);
    }
    upd(); state.tick = setInterval(upd, 250);
  }

  function renderResults(c, pr){
    if(state.tick){ clearInterval(state.tick); state.tick = null; }
    var rows = (pr.board || []).map(function(b, i){
      var medal = ["🥇", "🥈", "🥉"][i] || "";
      return '<div class="conq-res-row r' + (i + 1) + (i === 0 ? ' win' : '') + '" style="--pc:' + b.color + '">'
        + '<span class="conq-rank">' + (i + 1) + '</span>'
        + '<span class="conq-medal">' + medal + '</span>'
        + '<span class="conq-dot" style="background:' + b.color + '"></span>'
        + '<b>' + esc(b.nume) + (b.playerId === state.you ? ' (tu)' : '') + '</b>'
        + '<span class="conq-res-pts">' + b.score + 'p · ' + b.regiuni + ' regiuni</span></div>';
    }).join("");
    c.innerHTML = ''
      + '<div class="conq-lobby">'
      +   '<div class="conq-card conq-finale">'
      +     '<h2>🏁 Final de partidă</h2>'
      +     '<div class="conq-results">' + rows + '</div>'
      +     '<button class="conq-btn primary" id="conq-again">Înapoi în lobby</button>'
      +   '</div>'
      + '</div>';
    byId("conq-again", function(b){ b.onclick = doLeave; });
  }

  function nameOf(g, id){ var p = (g.players || []).filter(function(x){ return x.id === id; })[0]; return p ? p.nume : "?"; }
  function regName(g, id){ var r = ((g.map && g.map.regions) || []).filter(function(x){ return x.id === id; })[0]; return r ? r.nume : id; }

  function topicName(t){
    var o = state.topicuri.filter(function(x){ return x.topic === t; })[0];
    return o ? o.nume : (t || "");
  }

  // ---------- utilitare DOM ----------
  function byId(id, fn){ var el = document.getElementById(id); if(el) fn(el); }
  function copyText(t){
    try{ navigator.clipboard.writeText(t); }
    catch(e){ var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(_){} document.body.removeChild(ta); }
  }

  // ---------- punct de intrare (apelat din app.js) ----------
  window.showConquistador = function(){
    if(typeof setActive === "function") setActive("conquistador");
    var crumb = document.getElementById("crumb"); if(crumb) crumb.textContent = "Joacă cu prietenii";
    var title = document.getElementById("title"); if(title) title.textContent = "Conquistador";
    var c = document.getElementById("content");
    if(c){ c.dataset.view = "conquistador"; c.classList.remove("embed", "videos"); }

    // dacă avem o sesiune salvată, încercăm reconectarea; altfel ecranul home
    var s = loadSession();
    if(s && s.cod && s.playerId && !inRoom()){ reconnect(); }
    render();
  };
})();
