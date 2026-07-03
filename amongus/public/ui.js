// ============================================================
//  Among Us CS — interfața (ecrane, lobby, ședințe, chat, acțiuni)
//  ------------------------------------------------------------
//  Leagă totul: mesajele de rețea (retea.js) -> starea globală (STARE)
//  -> DOM + canvas (joc.js) + minijocuri (minijocuri.js).
//  Pagina respectă contractul embed al aplicației-gazdă: primește
//  postMessage {type:"theme", theme, vars} și își schimbă tema pe loc.
// ============================================================
(function(){
  "use strict";

  var COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
  var $ = function(id){ return document.getElementById(id); };

  // ---------- mărunte ----------
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }
  function svgBob(colorIdx, mort){
    var c = COLORS[colorIdx] || "#999";
    return '<svg class="bob" viewBox="0 0 34 46">' +
      '<rect x="1" y="16" width="8" height="18" rx="3.5" fill="' + c + '" opacity=".75" stroke="#0a0e1a" stroke-width="1.5"/>' +
      '<rect x="5" y="30" width="10" height="13" rx="4" fill="' + c + '" opacity=".85"/>' +
      '<rect x="19" y="30" width="10" height="13" rx="4" fill="' + c + '" opacity=".85"/>' +
      '<rect x="6" y="2" width="26" height="34" rx="12" fill="' + c + '" stroke="#0a0e1a" stroke-width="2"/>' +
      '<rect x="16" y="9" width="15" height="10" rx="5" fill="' + (mort ? "#8b93a8" : "#c6e6f2") + '" stroke="#0a0e1a" stroke-width="1.5"/>' +
      '<rect x="18.5" y="11" width="7" height="3" rx="1.5" fill="#fff" opacity=".6"/>' +
      (mort ? '<path d="M20 11 l6 6 M26 11 l-6 6" stroke="#39404f" stroke-width="1.8"/>' : '') +
      '</svg>';
  }
  var toastT = null;
  function toast(msg, ok){
    var t = $("toast");
    t.textContent = msg;
    t.className = "arata" + (ok ? " ok" : "");
    clearTimeout(toastT);
    toastT = setTimeout(function(){ t.className = ""; }, 2600);
  }
  function ecran(n){
    STARE.ecran = n;
    ["meniu", "lobby", "joc"].forEach(function(e){
      $("ecran-" + e).classList.toggle("ascuns", e !== n);
    });
    JOC.arata(n === "joc");
  }
  function materieMeta(id){
    for(var i = 0; i < STARE.materiiDisponibile.length; i++){
      if(STARE.materiiDisponibile[i].id === id) return STARE.materiiDisponibile[i];
    }
    return { id: id, nume: id, icon: "📚" };
  }
  function ascunde(id){ $(id).classList.add("ascuns"); }
  function arataEl(id){ $(id).classList.remove("ascuns"); }

  // ---------- tema (contractul embed) ----------
  var temaChei = [];
  window.addEventListener("message", function(e){
    var d = e.data || {};
    if(d.type === "theme" && d.theme){
      document.documentElement.dataset.theme = d.theme;
      var s = document.documentElement.style;
      temaChei.forEach(function(k){ s.removeProperty(k); });
      temaChei = [];
      if(d.vars){ for(var k in d.vars){ s.setProperty(k, d.vars[k]); temaChei.push(k); } }
      try{
        localStorage.setItem("app-theme-mode", d.theme);
        if(d.vars) localStorage.setItem("app-theme-vars", JSON.stringify(d.vars));
        else localStorage.removeItem("app-theme-vars");
      }catch(err){}
    }
  });

  // ============================================================
  //  MENIU
  // ============================================================
  $("meniu-nume").value = NET.numeSalvat();
  $("btn-creeaza").addEventListener("click", function(){
    var nume = $("meniu-nume").value.trim() || "Anonim";
    NET.salveazaNume(nume);
    STARE.eu.nume = nume;
    NET.connect(function(){ NET.send({ t: "create", nume: nume }); });
  });
  $("btn-intra").addEventListener("click", function(){
    var nume = $("meniu-nume").value.trim() || "Anonim";
    var cod = $("meniu-cod").value.trim().toUpperCase();
    if(cod.length !== 4){ toast("Codul are 4 caractere."); return; }
    NET.salveazaNume(nume);
    STARE.eu.nume = nume;
    NET.connect(function(){ NET.send({ t: "join", cod: cod, nume: nume }); });
  });
  $("meniu-cod").addEventListener("keydown", function(e){ if(e.key === "Enter") $("btn-intra").click(); });

  // ============================================================
  //  LOBBY
  // ============================================================
  $("lobby-cod").addEventListener("click", function(){
    try{ navigator.clipboard.writeText(STARE.eu.cod || ""); toast("Cod copiat!", true); }catch(e){}
  });
  $("btn-pleaca").addEventListener("click", function(){
    NET.send({ t: "leave" });
    NET.clearSession();
    ecran("meniu");
  });
  $("btn-sunet").addEventListener("click", function(){
    $("btn-sunet").textContent = SFX.toggle() ? "🔊" : "🔇";
  });
  $("btn-ready").addEventListener("click", function(){
    var eu = jucatorulMeu();
    NET.send({ t: "ready", ready: !(eu && eu.ready) });
    SFX.play("click");
  });
  $("btn-start").addEventListener("click", function(){ NET.send({ t: "start" }); });
  Array.prototype.forEach.call($("lobby-impostori").children, function(b){
    b.addEventListener("click", function(){ NET.send({ t: "impostori", n: Number(b.dataset.n) }); });
  });

  function jucatorulMeu(){
    if(!STARE.lobby) return null;
    for(var i = 0; i < STARE.lobby.jucatori.length; i++){
      if(STARE.lobby.jucatori[i].id === STARE.eu.id) return STARE.lobby.jucatori[i];
    }
    return null;
  }

  function randeazaLobby(){
    var L = STARE.lobby; if(!L) return;
    var eSefu = L.hostId === STARE.eu.id;
    $("lobby-cod").textContent = L.cod;
    $("lobby-nrjuc").textContent = "(" + L.jucatori.length + "/" + L.maxPlayers + ")";
    $("lobby-maxmat").textContent = "(alege gazda, max " + L.maxMaterii + ")";

    // jucători
    $("lobby-jucatori").innerHTML = L.jucatori.map(function(j){
      return '<div class="juc' + (j.ready ? " gata" : "") + (j.connected ? "" : " dcx") + '">' +
        svgBob(j.color) +
        '<span class="nm">' + esc(j.nume) + (j.id === STARE.eu.id ? " (tu)" : "") + '</span>' +
        '<span class="tag">' + (j.host ? "⭐ gazdă " : "") + (j.connected ? (j.ready ? "✅ gata" : "…așteaptă") : "📵 deconectat") + '</span>' +
        '</div>';
    }).join("");

    // culori
    var luate = {};
    L.jucatori.forEach(function(j){ luate[j.color] = j.id; });
    $("lobby-culori").innerHTML = COLORS.map(function(c, i){
      var cine = luate[i];
      var cls = "cul" + (cine === STARE.eu.id ? " activ" : "") + (cine && cine !== STARE.eu.id ? " luat" : "");
      return '<div class="' + cls + '" data-i="' + i + '" style="background:' + c + '"></div>';
    }).join("");
    Array.prototype.forEach.call($("lobby-culori").children, function(d){
      d.addEventListener("click", function(){ NET.send({ t: "culoare", idx: Number(d.dataset.i) }); });
    });

    // materii
    $("lobby-materii").innerHTML = STARE.materiiDisponibile.map(function(m){
      var aleasa = L.materii.indexOf(m.id) >= 0;
      return '<div class="materie' + (aleasa ? " aleasa" : "") + (eSefu ? "" : " doarcitire") + '" data-id="' + esc(m.id) + '">' +
        '<span class="ic">' + m.icon + '</span><span class="n">' + esc(m.nume) + '</span>' +
        '<span style="color:var(--muted);font-size:12px">' + m.intrari + ' itemi</span>' +
        '<span class="bifa">' + (aleasa ? "✓" : "") + '</span></div>';
    }).join("");
    if(eSefu){
      Array.prototype.forEach.call($("lobby-materii").children, function(d){
        d.addEventListener("click", function(){ NET.send({ t: "materie", id: d.dataset.id }); });
      });
    }

    // impostori
    Array.prototype.forEach.call($("lobby-impostori").children, function(b){
      b.classList.toggle("activ", Number(b.dataset.n) === L.impostori);
      b.disabled = !eSefu;
    });

    // butoane + hint
    var eu = jucatorulMeu();
    $("btn-ready").textContent = eu && eu.ready ? "❌ Nu-s gata" : "✅ Sunt gata";
    $("btn-start").classList.toggle("ascuns", !eSefu);
    var conectati = L.jucatori.filter(function(j){ return j.connected; });
    var gata = conectati.length >= L.minPlayers &&
               L.materii.length > 0 &&
               conectati.every(function(j){ return j.ready; }) &&
               L.impostori * 2 < conectati.length;
    $("btn-start").disabled = !gata;
    var hint = [];
    if(conectati.length < L.minPlayers) hint.push("minim " + L.minPlayers + " jucători (sunteți " + conectati.length + ")");
    if(!L.materii.length) hint.push("gazda alege materiile");
    if(!conectati.every(function(j){ return j.ready; })) hint.push("toți dau „Sunt gata”");
    if(L.impostori * 2 >= conectati.length && conectati.length >= L.minPlayers) hint.push("prea mulți impostori pentru " + conectati.length);
    $("lobby-hint").textContent = hint.length ? "Ca să porniți: " + hint.join(" · ") : "Totul e gata — gazda poate porni! 🚀";

    // rosterul de bază (nume+culori) pentru joc
    L.jucatori.forEach(function(j){
      var r = STARE.roster[j.id] || {};
      STARE.roster[j.id] = { nume: j.nume, color: j.color, viu: r.viu != null ? r.viu : true, connected: j.connected };
    });
  }

  // ============================================================
  //  HUD joc: taskuri, progres, acțiuni
  // ============================================================
  $("pt-cap").addEventListener("click", function(){
    $("panou-taskuri").classList.toggle("strans");
  });
  $("btn-harta").addEventListener("click", function(){ JOC.minimapa("toggle"); });

  function randeazaTaskuri(){
    var html = STARE.tasks.map(function(tk){
      var st = null;
      for(var i = 0; i < AMAP.STATIONS.length; i++) if(AMAP.STATIONS[i].id === tk.statie) st = AMAP.STATIONS[i];
      var sala = st && st.room ? AMAP.ROOM_NAMES[st.room] : "Coridor";
      var m = materieMeta(tk.materie);
      return '<div class="task-item' + (tk.done ? " gata" : "") + '">' +
        '<span class="ic">' + (tk.done ? "✅" : "⬜") + '</span>' +
        '<span>' + m.icon + ' ' + esc(tk.nume) + ' — <span class="st">' + esc(sala) + '</span></span></div>';
    }).join("");
    if(STARE.fake) html += '<div id="fake-note">🤫 Ești impostor: lista e de fațadă — taskurile tale NU mișcă bara. Prefă-te că muncești.</div>';
    html += '<div class="pt-hint">🟡 poteca punctată = drumul spre task · 🗺️ M = harta stației</div>';
    $("pt-corp").innerHTML = html || '<div class="task-item">…</div>';
  }

  function randeazaProgres(){
    var p = STARE.progres;
    var pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    $("bara-progres").querySelector(".fill").style.width = pct + "%";
    $("bara-progres").querySelector(".txt").textContent = "TASKURI ECHIPAJ: " + p.done + "/" + p.total + " (" + pct + "%)";
  }

  // ---- butoanele de acțiune (reconstruite doar când li se schimbă starea) ----
  var ctxUltima = "";
  var ctxCurent = { taskA: null, butonA: false, fixA: false, corpA: false, killT: null };
  function actualizeazaActiuni(c){
    ctxCurent = c;
    if(!STARE.inJoc || STARE.meeting){ if(ctxUltima !== "-"){ $("actiuni").innerHTML = ""; ctxUltima = "-"; } return; }
    var me = STARE.me;
    var imp = STARE.rol === "impostor" && me.viu === 1;
    var semn = [c.taskA && c.taskA.tid, c.butonA, c.fixA, c.corpA, c.killT, me.kill, me.sabo,
                me.viu, me.urgente, imp, !!STARE.sabotaj].join("|");
    if(semn === ctxUltima) return;
    ctxUltima = semn;

    var h = "";
    h += '<button class="act folos" id="act-folos"' + (c.taskA ? "" : " disabled") + '>🔧 Folosește</button>';
    if(me.viu === 1){
      if(STARE.sabotaj) h += '<button class="act sabo" id="act-fix"' + (c.fixA ? "" : " disabled") + '>🛠 REPARĂ<span class="cd">ține apăsat</span></button>';
      if(c.butonA) h += '<button class="act urgent" id="act-urgent">🚨 URGENȚĂ<span class="cd">' + me.urgente + ' rămasă/e</span></button>';
      h += '<button class="act raport" id="act-raport"' + (c.corpA ? "" : " disabled") + '>📢 Raportează</button>';
      if(imp){
        h += '<button class="act omoara" id="act-omoara"' + (c.killT && me.kill === 0 ? "" : " disabled") + '>🔪 Omoară' +
             (me.kill > 0 ? '<span class="cd">' + me.kill + 's</span>' : '') + '</button>';
        h += '<button class="act sabo" id="act-sabo"' + (!STARE.sabotaj && me.sabo === 0 ? "" : " disabled") + '>📡 Sabotaj' +
             (me.sabo > 0 ? '<span class="cd">' + me.sabo + 's</span>' : '') + '</button>';
      }
    }
    $("actiuni").innerHTML = h;

    var bF = $("act-folos");
    if(bF) bF.addEventListener("click", function(){
      if(ctxCurent.taskA) NET.send({ t: "taskOpen", tid: ctxCurent.taskA.tid });
    });
    var bR = $("act-raport");
    if(bR) bR.addEventListener("click", function(){ NET.send({ t: "report" }); });
    var bU = $("act-urgent");
    if(bU) bU.addEventListener("click", function(){ NET.send({ t: "emergency" }); });
    var bK = $("act-omoara");
    if(bK) bK.addEventListener("click", function(){
      if(ctxCurent.killT) NET.send({ t: "kill", target: ctxCurent.killT });
    });
    var bS = $("act-sabo");
    if(bS) bS.addEventListener("click", function(){ NET.send({ t: "sabotaj" }); });
    var bX = $("act-fix");
    if(bX){
      var tine = function(on){ return function(e){ e.preventDefault(); NET.send({ t: "fix", on: on }); }; };
      bX.addEventListener("pointerdown", tine(true));
      bX.addEventListener("pointerup", tine(false));
      bX.addEventListener("pointerleave", tine(false));
    }
  }

  // tastele de acțiune (E/Space = folosește / ține pentru reparat, R = raport, K = kill)
  var fixCuTasta = false;
  function tasta(code, jos){
    if(STARE.meeting || STARE.taskActiv) return;
    if(code === "KeyE" || code === "Space"){
      if(jos){
        if(ctxCurent.fixA){ fixCuTasta = true; NET.send({ t: "fix", on: true }); }
        else if(ctxCurent.taskA) NET.send({ t: "taskOpen", tid: ctxCurent.taskA.tid });
        else if(ctxCurent.butonA) NET.send({ t: "emergency" });
      } else if(fixCuTasta){
        fixCuTasta = false; NET.send({ t: "fix", on: false });
      }
    }
    if(jos && code === "KeyR" && ctxCurent.corpA) NET.send({ t: "report" });
    if(jos && code === "KeyK" && ctxCurent.killT && STARE.me.kill === 0) NET.send({ t: "kill", target: ctxCurent.killT });
  }

  // ============================================================
  //  Ședința + votul
  // ============================================================
  var meetVot = null, meetAmVotat = false, meetTimer = null, meetDurata = 1;

  function randeazaMeeting(){
    var m = STARE.meeting; if(!m) return;
    var potVota = STARE.me.viu === 1 && m.faza === "vot" && !meetAmVotat;
    var titlu = m.tip === "corp"
      ? "☠️ CADAVRU RAPORTAT"
      : "🚨 ȘEDINȚĂ DE URGENȚĂ";
    var repInfo = STARE.roster[m.reporter] || {};
    var sub = (m.tip === "corp" && m.victima)
      ? esc(repInfo.nume || "?") + " a găsit cadavrul lui " + esc(m.victima.nume)
      : "convocată de " + esc(repInfo.nume || "?");

    var carduri = m.jucatori.map(function(j){
      var cls = "mcard" + (!j.viu ? " mort" : "") + (!j.connected && j.viu ? " dcx" : "") +
                (meetVot === j.id ? " ales" : "") + (j.id === STARE.eu.id ? " eu" : "");
      return '<div class="' + cls + '" data-id="' + j.id + '">' +
        svgBob(j.color, !j.viu) +
        '<div><div class="nm">' + esc(j.nume) + '</div><div class="avotat ascuns" data-votat="' + j.id + '">🗳 a votat</div></div>' +
        '</div>';
    }).join("");

    $("ecran-meeting").innerHTML =
      '<div class="meet-cutie">' +
        '<div class="meet-cap"><h2>' + titlu + '</h2><div class="cine">' + sub + '</div></div>' +
        '<div class="meet-timer"><span class="faza-nume" id="meet-faza">' + (m.faza === "vot" ? "VOT" : "DISCUȚIE") + '</span>' +
          '<div class="tbar"><div class="f" id="meet-tbar"></div></div><span id="meet-sec"></span></div>' +
        '<div class="meet-grid">' +
          '<div><div class="meet-juc" id="meet-juc">' + carduri + '</div>' +
            '<div class="meet-actiuni">' +
              '<button class="btn prim mare' + (potVota && meetVot ? "" : " ascuns") + '" id="meet-voteaza">✔ Votează</button>' +
              '<button class="btn mare' + (potVota ? "" : " ascuns") + '" id="meet-skip">⏭ Skip vote</button>' +
            '</div>' +
            '<div class="meet-nota">' + (STARE.me.viu !== 1 ? "Ești mort — nu votezi, dar poți privi. 👻" :
              (m.faza === "vot" ? (meetAmVotat ? "Ai votat. Așteptăm restul…" : "Alege un jucător sau Skip.") : "Discutați! Votul începe imediat.")) + '</div>' +
          '</div>' +
          '<div class="meet-chat"><div class="cap">💬 CHAT ' + (STARE.me.viu !== 1 ? "(al morților)" : "") + '</div>' +
            '<div id="chat-mesaje"></div>' +
            '<form id="chat-forma"><input type="text" maxlength="200" placeholder="scrie…" autocomplete="off">' +
            '<button class="btn prim" type="submit">➤</button></form></div>' +
        '</div>' +
      '</div>';
    arataEl("ecran-meeting");

    // voturile deja anunțate
    (m._auVotat || []).forEach(function(id){ marcheazaVotat(id); });

    Array.prototype.forEach.call($("meet-juc").children, function(card){
      card.addEventListener("click", function(){
        var id = card.dataset.id;
        var j = null;
        m.jucatori.forEach(function(x){ if(x.id === id) j = x; });
        if(!j || !j.viu || STARE.me.viu !== 1 || m.faza !== "vot" || meetAmVotat) return;
        meetVot = (meetVot === id) ? null : id;
        randeazaMeeting();
      });
    });
    var bV = $("meet-voteaza");
    if(bV) bV.addEventListener("click", function(){
      if(!meetVot || meetAmVotat) return;
      NET.send({ t: "vote", target: meetVot });
      meetAmVotat = true;
      randeazaMeeting();
    });
    var bS = $("meet-skip");
    if(bS) bS.addEventListener("click", function(){
      if(meetAmVotat) return;
      NET.send({ t: "vote", target: null });
      meetAmVotat = true; meetVot = null;
      randeazaMeeting();
    });
    $("chat-forma").addEventListener("submit", function(e){
      e.preventDefault();
      var inp = e.target.querySelector("input");
      var txt = inp.value.trim();
      if(txt){ NET.send({ t: "chat", text: txt }); inp.value = ""; }
    });
    randeazaChat();
  }
  function marcheazaVotat(id){
    var e = document.querySelector('[data-votat="' + id + '"]');
    if(e) e.classList.remove("ascuns");
  }
  function pornesteMeetTimer(){
    clearInterval(meetTimer);
    meetTimer = setInterval(function(){
      var m = STARE.meeting;
      if(!m){ clearInterval(meetTimer); return; }
      var ramas = Math.max(0, m.pana - Date.now());
      var b = $("meet-tbar"), s = $("meet-sec");
      if(b) b.style.width = Math.min(100, (ramas / meetDurata) * 100) + "%";
      if(s) s.textContent = Math.ceil(ramas / 1000) + "s";
    }, 200);
  }

  var chatLog = [];
  function randeazaChat(){
    var cutie = $("chat-mesaje");
    if(!cutie) return;
    cutie.innerHTML = chatLog.map(function(c){
      return '<div class="cmsg' + (c.mort ? " fantoma" : "") + '"><b style="color:' + (COLORS[c.color] || "#fff") + '">' +
             esc(c.nume) + (c.mort ? " 👻" : "") + ':</b> <span class="txt">' + esc(c.text) + '</span></div>';
    }).join("");
    cutie.scrollTop = cutie.scrollHeight;
  }
  function randeazaChatFantome(){
    var cutie = $("cf-mesaje");
    cutie.innerHTML = chatLog.filter(function(c){ return c.mort; }).slice(-30).map(function(c){
      return '<div><b style="color:' + (COLORS[c.color] || "#fff") + '">' + esc(c.nume) + ':</b> ' + esc(c.text) + '</div>';
    }).join("");
    cutie.scrollTop = cutie.scrollHeight;
  }
  $("cf-forma").addEventListener("submit", function(e){
    e.preventDefault();
    var inp = e.target.querySelector("input");
    var txt = inp.value.trim();
    if(txt){ NET.send({ t: "chat", text: txt }); inp.value = ""; }
  });

  // ============================================================
  //  Mesajele de la server
  // ============================================================
  NET.on("_online", function(){
    var e = $("stare-net");
    e.classList.remove("jos");
    e.innerHTML = "Server: <b>conectat</b> ✓";
  });
  NET.on("_offline", function(){
    var e = $("stare-net");
    e.classList.add("jos");
    e.innerHTML = "Server: <b>deconectat</b> — reîncerc…";
    if(STARE.inJoc) toast("Conexiune pierdută — mă reconectez…");
  });

  NET.on("joined", function(msg){
    STARE.eu.id = msg.playerId;
    STARE.eu.cod = msg.cod;
    STARE.materiiDisponibile = msg.materii || [];
    NET.saveSession(msg.cod, msg.playerId);
    if(STARE.ecran === "meniu") ecran("lobby");
  });

  NET.on("lobby", function(msg){
    STARE.lobby = msg;
    if(msg.faza === "LOBBY"){
      if(STARE.ecran === "joc"){   // partida s-a încheiat -> înapoi în lobby
        STARE.inJoc = false;
        STARE.meeting = null; STARE.final = null; STARE.sabotaj = null;
        MINIJOC.inchide();
        ascunde("ecran-meeting"); ascunde("ecran-eject"); ascunde("ecran-final");
        ascunde("banner-rol"); ascunde("banner-mort"); ascunde("chat-fantome");
        ecran("lobby");
      }
      if(STARE.ecran !== "joc") randeazaLobby();
    } else {
      randeazaLobby();   // doar starea de „connected” din roster
    }
  });

  NET.on("startat", function(){
    STARE.inJoc = true;
    STARE.interp = {}; STARE.bodies = [];
    STARE.meeting = null; STARE.final = null; STARE.sabotaj = null;
    STARE.taskActiv = null; STARE.tasks = []; STARE.progres = { done: 0, total: 0 };
    chatLog = [];
    meetVot = null; meetAmVotat = false;
    ascunde("ecran-meeting"); ascunde("ecran-eject"); ascunde("ecran-final");
    ascunde("banner-mort"); ascunde("chat-fantome"); ascunde("alarma");
    STARE.me = { x: AMAP.SPAWN.x, y: AMAP.SPAWN.y, viu: 1, kill: null, urgente: 1, sabo: null };
    STARE.pred = { x: AMAP.SPAWN.x, y: AMAP.SPAWN.y, f: 1 };
    ecran("joc");
    randeazaProgres();
  });

  NET.on("rol", function(msg){
    STARE.rol = msg.rol;
    STARE.colegi = msg.colegi || [];
    var b = $("banner-rol");
    if(msg.rol === "impostor"){
      b.className = "banner-plin imp";
      b.innerHTML = "<h1>IMPOSTOR</h1><p>Elimină echipajul fără să fii prins. Ai kill, sabotaj și o listă de taskuri de fațadă." +
        (STARE.colegi.length ? "<br>Coleg impostor: <b>" + STARE.colegi.map(function(c){ return esc(c.nume); }).join(", ") + "</b>" : "") + "</p>";
    } else {
      b.className = "banner-plin crew";
      b.innerHTML = "<h1>ECHIPAJ</h1><p>Termină taskurile (minijocuri din materiile alese) și demascați impostorul la ședințe.</p>";
    }
    SFX.play("reveal");
    setTimeout(function(){ ascunde("banner-rol"); }, 3600);
    // după dezvăluirea rolului, arătăm scurt harta — să vezi pe unde s-o iei
    setTimeout(function(){ if(STARE.inJoc && !STARE.meeting && !STARE.final) JOC.minimapa(true, true); }, 3800);
    setTimeout(function(){ JOC.minimapa(false, true); }, 9800);
  });

  NET.on("roster", function(msg){
    var nou = {};
    (msg.jucatori || []).forEach(function(j){ nou[j.id] = j; });
    STARE.roster = nou;
  });

  NET.on("tasks", function(msg){
    STARE.tasks = msg.lista || [];
    STARE.fake = !!msg.fake;
    randeazaTaskuri();
  });

  NET.on("progres", function(msg){
    STARE.progres = { done: msg.done, total: msg.total };
    randeazaProgres();
  });

  NET.on("snap", function(msg){
    STARE.me = msg.me;
    STARE.bodies = msg.bodies || [];
    STARE.sabotaj = msg.sabotaj || null;
    // alarma din HUD
    if(STARE.sabotaj){
      var a = $("alarma");
      a.classList.remove("ascuns");
      a.textContent = "⚠️ SUPRAÎNCĂLZIRE KERNEL — reparați în Kernel Core! " + Math.ceil(STARE.sabotaj.ramas / 1000) + "s" +
                      (STARE.sabotaj.pct ? " · reparat " + STARE.sabotaj.pct + "%" : "");
    } else ascunde("alarma");

    var acum = performance.now();
    var vazuti = {};
    (msg.jucatori || []).forEach(function(j){
      vazuti[j.id] = 1;
      var buf = STARE.interp[j.id] = STARE.interp[j.id] || [];
      buf.push({ t: acum, x: j.x, y: j.y, dx: j.dx, dy: j.dy, viu: j.viu });
      if(buf.length > 12) buf.shift();
    });
    for(var id in STARE.interp){ if(!vazuti[id]) delete STARE.interp[id]; }
    // fantomele: panoul de chat
    $("chat-fantome").classList.toggle("ascuns", !(STARE.me.viu === 0 && !STARE.meeting));
  });

  NET.on("task", function(msg){
    STARE.taskActiv = msg;
    JOC.minimapa(false);
    MINIJOC.deschide(msg, materieMeta(msg.materie),
      function(raspuns){ NET.send({ t: "taskSubmit", tid: msg.tid, raspuns: raspuns }); },
      function(){ NET.send({ t: "taskClose" }); STARE.taskActiv = null; MINIJOC.inchide(); });
  });
  NET.on("taskRezultat", function(msg){
    MINIJOC.rezultat(msg.ok);
    if(msg.ok && msg.done){
      STARE.tasks.forEach(function(tk){ if(tk.tid === msg.tid) tk.done = true; });
      randeazaTaskuri();
      setTimeout(function(){ STARE.taskActiv = null; }, 900);
    }
  });
  NET.on("taskInchis", function(){
    STARE.taskActiv = null;
    MINIJOC.inchide();
  });

  NET.on("mort", function(){
    STARE.me.viu = 0;
    SFX.play("kill");
    MINIJOC.inchide(); STARE.taskActiv = null;
    arataEl("banner-mort");
    setTimeout(function(){ ascunde("banner-mort"); }, 3400);
  });

  NET.on("sabotaj", function(msg){
    if(msg.activ){
      STARE.sabotaj = { tip: msg.tip, ramas: msg.ramas, pct: 0 };
      SFX.play("sabotaj");
    } else {
      STARE.sabotaj = null;
      ascunde("alarma");
      SFX.play("reparat");
      toast("Sabotaj reparat! ✅", true);
    }
  });

  NET.on("meeting", function(msg){
    STARE.meeting = msg;
    msg._auVotat = [];
    meetVot = null; meetAmVotat = false;
    meetDurata = Math.max(1, msg.pana - Date.now());
    MINIJOC.inchide(); STARE.taskActiv = null;
    JOC.minimapa(false);
    ascunde("chat-fantome");
    SFX.play(msg.tip === "corp" ? "report" : "urgenta");
    setTimeout(function(){ SFX.play("meeting"); }, 500);
    randeazaMeeting();
    pornesteMeetTimer();
    if(window.SFX) SFX.pasi(false);
  });
  NET.on("meetingFaza", function(msg){
    if(!STARE.meeting) return;
    STARE.meeting.faza = msg.faza;
    STARE.meeting.pana = msg.pana;
    meetDurata = Math.max(1, msg.pana - Date.now());
    randeazaMeeting();
  });
  NET.on("votat", function(msg){
    if(!STARE.meeting) return;
    STARE.meeting._auVotat.push(msg.cine);
    marcheazaVotat(msg.cine);
  });
  NET.on("chat", function(msg){
    chatLog.push(msg);
    if(chatLog.length > 120) chatLog.shift();
    randeazaChat();
    randeazaChatFantome();
  });

  NET.on("eject", function(msg){
    clearInterval(meetTimer);
    var text;
    if(msg.id){
      text = esc(msg.nume) + " a fost ejectat.";
      if(msg.eraImpostor === true) text += "<br><b style='color:#ff6b5b'>Era impostor.</b>";
      if(msg.eraImpostor === false) text += "<br><b style='color:#9fd6ff'>NU era impostor.</b>";
    } else {
      text = msg.egalitate ? "Egalitate — nimeni nu a fost ejectat." : "Nimeni nu a fost ejectat (skip).";
    }
    // rezumatul voturilor
    var pe = {};
    for(var cine in (msg.voturi || {})){
      var tinta = msg.voturi[cine];
      (pe[tinta] = pe[tinta] || []).push((STARE.roster[cine] || {}).nume || "?");
    }
    var linii = [];
    for(var t in pe){
      var numeT = t === "skip" ? "Skip" : ((STARE.roster[t] || {}).nume || "?");
      linii.push(numeT + ": " + pe[t].length + " (" + pe[t].join(", ") + ")");
    }
    $("ecran-eject").innerHTML =
      '<div class="stele"></div>' +
      (msg.id ? '<div id="eject-bob" style="width:60px">' + svgBob(msg.color, true) + '</div>' : '') +
      '<div class="mesaj">' + text +
      (linii.length ? '<div style="font-size:13px;color:#8e9ac2;margin-top:14px">🗳 ' + esc(linii.join(" · ")) + '</div>' : '') +
      '</div>';
    ascunde("ecran-meeting");
    arataEl("ecran-eject");
  });

  NET.on("reluat", function(){
    STARE.meeting = null;
    meetVot = null; meetAmVotat = false;
    clearInterval(meetTimer);
    ascunde("ecran-meeting"); ascunde("ecran-eject");
    STARE.pred.x = STARE.me.x; STARE.pred.y = STARE.me.y;   // toți la spawn
    STARE.interp = {};
  });

  NET.on("final", function(msg){
    STARE.final = msg;
    STARE.meeting = null; STARE.sabotaj = null;
    clearInterval(meetTimer);
    MINIJOC.inchide(); STARE.taskActiv = null;
    JOC.minimapa(false);
    ascunde("ecran-meeting"); ascunde("ecran-eject"); ascunde("alarma"); ascunde("chat-fantome");
    var f = $("ecran-final");
    var crew = msg.castiga === "crew";
    f.className = crew ? "crew" : "imp";
    f.innerHTML = '<div>' +
      '<h1>' + (crew ? "VICTORIA ECHIPAJULUI" : "IMPOSTORII AU CÂȘTIGAT") + '</h1>' +
      '<div class="motiv">' + esc(msg.motiv || "") + '</div>' +
      '<div id="final-impostori">' + (msg.impostori || []).map(function(i){
        return '<div class="imp-card">' + svgBob(i.color) + '<span>🕵️ ' + esc(i.nume) + '</span></div>';
      }).join("") + '</div>' +
      '<div class="jos">Reveniți automat în lobby pentru revanșă…</div></div>';
    arataEl("ecran-final");
    SFX.play(crew && STARE.rol !== "impostor" || !crew && STARE.rol === "impostor" ? "task" : "kill");
  });

  NET.on("error", function(msg){
    var m = msg.msg || "Eroare.";
    toast(m);
    if(m.indexOf("Camera nu mai există") >= 0 || m.indexOf("Sesiune expirată") >= 0){
      NET.clearSession();
      if(STARE.ecran !== "meniu") ecran("meniu");
    }
  });

  // expunem ce folosește joc.js
  window.UI = {
    actualizeazaActiuni: actualizeazaActiuni,
    tasta: tasta
  };

  // ---------- pornirea ----------
  JOC.porneste();
  var ses = NET.session();
  NET.connect(ses ? function(){ NET.send({ t: "reconnect", cod: ses.cod, playerId: ses.playerId }); } : null);
})();
