// ============================================================
//  Widget statistici: online · total accesări · vizitatori unici
//  - la încărcare: un singur "hit" (crește accesările + unicul)
//  - apoi heartbeat "ping" (doar prezență, nu crește totalul)
//  Dacă backendul (serviciul "counter") nu răspunde — ex. rulare
//  locală fără Docker — widgetul rămâne ascuns, fără să afecteze app-ul.
// ============================================================
(function(){
  "use strict";
  var API = "/api";
  var KEY = "elee-uid";
  var INTERVAL = 15000;   // heartbeat la 15s (sub TTL-ul de 35s din backend)

  function uid(){
    var v = null;
    try{ v = localStorage.getItem(KEY); }catch(e){}
    if(!v || !/^[A-Za-z0-9_-]{6,64}$/.test(v)){
      v = (Date.now().toString(36) + Math.random().toString(36).slice(2,12)).replace(/[^A-Za-z0-9_-]/g,"");
      try{ localStorage.setItem(KEY, v); }catch(e){}
    }
    return v;
  }
  var ID = uid();

  function fmt(n){ return (n||0).toLocaleString("ro-RO"); }

  function render(d){
    var el = document.getElementById("live-stats");
    if(!el) return;
    if(!d){ el.innerHTML = ""; return; }   // backend indisponibil -> ascuns (CSS :empty)
    el.innerHTML =
        '<span class="ls-item ls-live" title="Utilizatori activi în acest moment">'
      +   '<span class="ls-dot"></span><b>' + fmt(d.live) + '</b> online'
      + '</span>'
      + '<span class="ls-item ls-total" title="Total accesări ale site-ului (fiecare vizită)">'
      +   '<span class="ls-ico">👁️</span><b>' + fmt(d.total) + '</b> accesări'
      + '</span>'
      + '<span class="ls-item ls-uniq" title="Vizitatori unici (după browser)">'
      +   '<span class="ls-ico">👤</span><b>' + fmt(d.unici) + '</b> unici'
      + '</span>';
  }

  function call(route){
    fetch(API + route + "?id=" + encodeURIComponent(ID), { cache:"no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(render)
      .catch(function(){ render(null); });
  }

  function start(){
    call("/hit");                              // o accesare nouă (o singură dată la încărcare)
    setInterval(function(){ call("/ping"); }, INTERVAL);   // heartbeat: doar prezență
    document.addEventListener("visibilitychange", function(){
      if(!document.hidden) call("/ping");       // revenire pe tab -> reîmprospătează prezența
    });
  }

  if(document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", start);
  else
    start();
})();
