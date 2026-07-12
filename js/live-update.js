// ============================================================
//  Live update — reîmprospătare automată la un DEPLOY nou, fără refresh manual.
//  ------------------------------------------------------------
//  nginx servește index.html cu "no-cache" (revalidare mereu), iar CI adaugă
//  ?v=<git-sha> pe toate css/js la fiecare build. Deci amprenta lui index.html
//  se schimbă la FIECARE deploy. Aici, tab-urile deja deschise verifică periodic
//  această amprentă și, când s-a schimbat, oferă/aplică reîncărcarea — așa userii
//  NU rămân blocați pe versiunea veche și nu trebuie să dea refresh manual.
//
//  Notă: mecanismul ajunge la un tab abia DUPĂ ce acel tab a încărcat o dată
//  versiunea care conține acest script (nu poți injecta cod într-o pagină deja
//  deschisă cu cod vechi). De la primul load cu acest fișier încolo, orice deploy
//  ulterior e preluat automat.
// ============================================================
(function(){
  "use strict";

  var POLL = 60000;          // verifică la 60s (doar când tab-ul e vizibil)
  var baseline = null;       // amprenta versiunii cu care s-a încărcat pagina
  var pendingNew = false;    // s-a detectat o versiune nouă
  var dismissed = false;     // userul a ales „mai târziu" (nu-l mai batem la cap)

  function hashStr(s){
    var h = 5381, i = s.length;
    while(i) h = (h*33) ^ s.charCodeAt(--i);
    return (h >>> 0).toString(36);
  }

  function fetchVer(cb){
    fetch("/?_lv=" + Date.now(), { cache:"no-store" })
      .then(function(r){ return r.ok ? r.text() : null; })
      .then(function(t){ cb(t ? hashStr(t) : null); })
      .catch(function(){ cb(null); });
  }

  // ---------- bannerul discret de reîncărcare ----------
  function injectCss(){
    if(document.getElementById("liveupd-css")) return;
    var css = ""
      + "#liveupd{position:fixed; left:50%; bottom:22px; transform:translateX(-50%) translateY(140%);"
      + "  z-index:2147482000; display:flex; align-items:center; gap:12px; max-width:92vw;"
      + "  padding:11px 14px 11px 16px; border-radius:12px; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"
      + "  background:#221e1a; color:#ece3d2; border:1px solid #403930; box-shadow:0 14px 40px rgba(0,0,0,.45);"
      + "  transition:transform .4s cubic-bezier(.2,1.1,.3,1)}"
      + "#liveupd.on{transform:translateX(-50%) translateY(0)}"
      + "#liveupd .lu-txt{font-size:13.5px; line-height:1.35}"
      + "#liveupd .lu-txt b{color:#e9b143}"
      + "#liveupd .lu-go{cursor:pointer; font-family:inherit; font-size:13px; font-weight:700; white-space:nowrap;"
      + "  color:#1a1714; background:#e9b143; border:none; padding:8px 14px; border-radius:9px}"
      + "#liveupd .lu-go:hover{filter:brightness(1.06)}"
      + "#liveupd .lu-x{cursor:pointer; background:transparent; border:none; color:#a8997f; font-size:18px; line-height:1; padding:2px 6px}"
      + "#liveupd .lu-x:hover{color:#ece3d2}"
      + "@media(max-width:520px){#liveupd{flex-wrap:wrap; bottom:14px}}";
    var s = document.createElement("style");
    s.id = "liveupd-css";
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  var bar = null;
  function showBar(){
    if(bar || dismissed) return;
    injectCss();
    bar = document.createElement("div");
    bar.id = "liveupd";
    var txt = document.createElement("div");
    txt.className = "lu-txt";
    txt.innerHTML = "<b>✨ Am actualizat aplicația.</b> Reîmprospătează ca să vezi noutățile.";
    var go = document.createElement("button");
    go.className = "lu-go";
    go.textContent = "Actualizează acum";
    go.onclick = function(){ location.reload(); };
    var x = document.createElement("button");
    x.className = "lu-x";
    x.setAttribute("aria-label","închide");
    x.innerHTML = "&times;";
    x.onclick = function(){ dismissed = true; hideBar(); };
    bar.appendChild(txt); bar.appendChild(go); bar.appendChild(x);
    document.body.appendChild(bar);
    requestAnimationFrame(function(){ bar.classList.add("on"); });
  }
  function hideBar(){
    if(!bar) return;
    bar.classList.remove("on");
    var b = bar; bar = null;
    setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 450);
  }

  function poll(){
    if(document.hidden || pendingNew) return;
    fetchVer(function(v){
      if(!v) return;
      if(baseline === null){ baseline = v; return; }
      if(v !== baseline){ pendingNew = true; showBar(); }
    });
  }

  // amprenta inițială + verificarea periodică
  fetchVer(function(v){ baseline = v; });
  setInterval(poll, POLL);

  document.addEventListener("visibilitychange", function(){
    if(document.hidden) return;
    // Când userul REVINE pe tab și există o versiune nouă, reîncărcăm automat
    // (momentul cel mai puțin deranjant — nu era în mijlocul unei acțiuni).
    // Dacă a apăsat „mai târziu", îi respectăm alegerea și nu reîncărcăm forțat.
    if(pendingNew && !dismissed){ location.reload(); return; }
    poll();
  });
})();
