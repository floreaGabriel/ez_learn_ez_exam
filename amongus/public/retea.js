// ============================================================
//  Among Us CS — stratul de rețea (WebSocket)
//  ------------------------------------------------------------
//  Vorbește cu serverul pe /amongus/ws (proxat de nginx către serviciul
//  Node). Sesiunea {cod, playerId} se ține în localStorage ca după o
//  cădere scurtă de net să revenim automat în cameră (reconnect grațios,
//  la fel ca la Conquistador).
// ============================================================
(function(){
  "use strict";

  var SESSION_KEY = "amongus-session";
  var NAME_KEY    = "amongus-nume";

  var ws = null;
  var handlers = {};        // t -> [fn]
  var vreauReconect = true; // false după "leave" explicit

  function wsUrl(){
    // override pentru dev local (fără nginx): ?ws=ws://localhost:3003/amongus/ws
    try{
      var q = new URLSearchParams(location.search).get("ws");
      if(q) return q;
      var ls = localStorage.getItem("amongus-ws");
      if(ls) return ls;
    }catch(e){}
    var proto = location.protocol === "https:" ? "wss" : "ws";
    return proto + "://" + location.host + "/amongus/ws";
  }

  function emit(t, msg){
    var list = handlers[t] || [];
    for(var i = 0; i < list.length; i++){
      try{ list[i](msg); }catch(e){ console.error("handler", t, e); }
    }
  }

  function connect(onOpen){
    if(ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)){
      if(ws.readyState === WebSocket.OPEN && onOpen) onOpen();
      return;
    }
    try{ ws = new WebSocket(wsUrl()); }
    catch(e){ emit("_offline", {}); return; }

    ws.onopen = function(){
      emit("_online", {});
      if(onOpen) onOpen();
    };
    ws.onmessage = function(ev){
      var msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
      if(msg && msg.t) emit(msg.t, msg);
    };
    ws.onclose = function(){
      emit("_offline", {});
      // reconectare automată dacă eram într-o cameră
      var s = session();
      if(vreauReconect && s){
        setTimeout(function(){
          connect(function(){ send({ t: "reconnect", cod: s.cod, playerId: s.playerId }); });
        }, 1500);
      }
    };
    ws.onerror = function(){ /* onclose reîncearcă */ };
  }

  function send(obj){
    if(ws && ws.readyState === WebSocket.OPEN){ ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  function session(){
    try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }catch(e){ return null; }
  }
  function saveSession(cod, playerId){
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify({ cod: cod, playerId: playerId })); }catch(e){}
    vreauReconect = true;
  }
  function clearSession(){
    try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
    vreauReconect = false;
  }

  window.NET = {
    connect: connect,
    send: send,
    on: function(t, fn){ (handlers[t] = handlers[t] || []).push(fn); },
    session: session,
    saveSession: saveSession,
    clearSession: clearSession,
    numeSalvat: function(){ try{ return localStorage.getItem(NAME_KEY) || ""; }catch(e){ return ""; } },
    salveazaNume: function(n){ try{ localStorage.setItem(NAME_KEY, n); }catch(e){} }
  };
})();
