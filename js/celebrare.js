// ============================================================
//  Celebrare — confetti + artificii + avion cu banner, la fiecare 5 minute.
//  Rulează DOAR în shell-ul principal (index.html). Overlay peste toată
//  fereastra, pointer-events:none (nu blochează nimic din UI). Momentul e
//  aliniat la CEASUL DE PERETE (Math.floor(Date.now()/5min)) => toate
//  browserele deschise îl arată în ACELAȘI timp, fără server, fără refresh.
// ============================================================
(function(){
  "use strict";

  var MESAJ   = "Baftă mâine, colegi! Sper că a fost de ajutor aplicația ❤️  Vă pup!";
  var DURATA  = 9000;              // cât ține o sărbătoare (ms)
  var FADE    = 800;               // stingerea la final (ms)
  var PERIODA = 5 * 60 * 1000;     // la 5 minute
  var COLORS  = ["#e9b143","#fb4934","#b8bb26","#83a598","#d3869b",
                 "#8ec07c","#fabd2f","#fe8019","#ffffff","#d65d0e"];

  var reduce = false;
  try{ reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}

  var running = false;

  // ---------- stiluri (injectate o singură dată) ----------
  function injectCss(){
    if(document.getElementById("celebrare-css")) return;
    var css = ""
      + "#celebrare-layer{position:fixed; inset:0; pointer-events:none; z-index:2147483000; overflow:hidden; opacity:1; transition:opacity " + FADE + "ms ease}"
      + "#celebrare-layer.cel-out{opacity:0}"
      + "#celebrare-layer canvas{position:absolute; inset:0; width:100%; height:100%}"
      + ".cel-plane{position:absolute; top:15%; left:0; display:flex; align-items:center; white-space:nowrap; will-change:transform; animation:cel-fly " + DURATA + "ms linear forwards}"
      + ".cel-plane-in{display:flex; align-items:center; animation:cel-bob 1.5s ease-in-out infinite}"
      + ".cel-banner{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-weight:800; font-size:clamp(15px,2.4vw,24px); color:#2a1c05; letter-spacing:.2px; padding:10px 20px; border-radius:12px; background:linear-gradient(135deg,#ffe08a,#f4a836 60%,#f08b2e); box-shadow:0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.6); border:2px solid rgba(255,255,255,.55); text-shadow:0 1px 0 rgba(255,255,255,.35)}"
      + ".cel-rope{width:26px; height:3px; background:repeating-linear-gradient(90deg,#4a3f30 0 6px,transparent 6px 11px); flex:none; margin:0 2px}"
      + ".cel-plane-emoji{font-size:clamp(38px,5vw,58px); line-height:1; filter:drop-shadow(0 6px 10px rgba(0,0,0,.35)); transform:scaleX(1)}"
      + "@keyframes cel-fly{from{transform:translateX(-70vw)} to{transform:translateX(170vw)}}"
      + "@keyframes cel-bob{0%,100%{transform:translateY(-7px) rotate(-2deg)} 50%{transform:translateY(7px) rotate(2deg)}}"
      + ".cel-static{position:absolute; left:50%; top:22%; transform:translateX(-50%); max-width:90vw; text-align:center; animation:cel-pop 600ms cubic-bezier(.2,1.3,.4,1) both}"
      + "@keyframes cel-pop{from{transform:translateX(-50%) scale(.7); opacity:0} to{transform:translateX(-50%) scale(1); opacity:1}}";
    var s = document.createElement("style");
    s.id = "celebrare-css";
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  function rnd(a,b){ return a + Math.random()*(b-a); }
  function pick(a){ return a[(Math.random()*a.length)|0]; }

  // ---------- varianta redusă (fără mișcare) ----------
  function celebrateReduced(layer){
    var box = document.createElement("div");
    box.className = "cel-static";
    var b = document.createElement("div");
    b.className = "cel-banner";
    b.textContent = "✈️  " + MESAJ;
    box.appendChild(b);
    layer.appendChild(box);
  }

  // ---------- artificii + confetti pe canvas ----------
  function runCanvas(layer, start){
    var canvas = document.createElement("canvas");
    layer.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if(!ctx) return;                 // mediu fără canvas 2D — avionul rămâne, fără confetti
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    function resize(){
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W*dpr; canvas.height = H*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener("resize", resize);

    var parts = [];
    function confetti(n, x, spreadTop){
      for(var i=0;i<n;i++) parts.push({
        t:"c", x:(x==null?rnd(0,W):x+rnd(-40,40)), y:(spreadTop?rnd(-H*0.25,0):rnd(-40,-4)),
        vx:rnd(-1.4,1.4), vy:rnd(1.6,4.2), g:0.10,
        s:rnd(6,12), col:pick(COLORS), rot:rnd(0,6.28), vr:rnd(-0.22,0.22), round:Math.random()<0.35
      });
    }
    function burst(x,y){
      var col = pick(COLORS), k = 30;
      for(var i=0;i<k;i++){
        var a = (i/k)*6.283 + rnd(-0.1,0.1), sp = rnd(1.6,4.6);
        parts.push({ t:"s", x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0.045,
          s:rnd(2,3.6), col:(Math.random()<0.3?pick(COLORS):col), life:1, dl:rnd(0.008,0.016) });
      }
    }

    confetti(150, null, true);
    var bursts = [280,1500,2700,3900,5100,6300,7200], bi = 0;
    var wave2 = false;

    function frame(){
      var el = Date.now() - start;
      ctx.clearRect(0,0,W,H);
      while(bi < bursts.length && el >= bursts[bi]){ burst(rnd(W*0.15,W*0.85), rnd(H*0.12,H*0.5)); bi++; }
      if(!wave2 && el > 2400){ wave2 = true; confetti(90, null, false); }

      for(var i=parts.length-1;i>=0;i--){
        var p = parts[i];
        p.vy += p.g; p.x += p.vx; p.y += p.vy;
        if(p.t==="c"){
          p.rot += p.vr; p.vx *= 0.995;
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
          if(p.round){ ctx.beginPath(); ctx.arc(0,0,p.s*0.5,0,6.283); ctx.fill(); }
          else ctx.fillRect(-p.s*0.5,-p.s*0.35,p.s,p.s*0.7);
          ctx.restore();
          if(p.y > H+30) parts.splice(i,1);
        } else {
          p.life -= p.dl; p.vx *= 0.99;
          if(p.life <= 0){ parts.splice(i,1); continue; }
          ctx.globalAlpha = Math.max(0,p.life);
          ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,6.283); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      if(layer._alive){ requestAnimationFrame(frame); }
      else { window.removeEventListener("resize", resize); }
    }
    requestAnimationFrame(frame);
  }

  // ---------- avionul cu banner ----------
  function runPlane(layer){
    var plane = document.createElement("div");
    plane.className = "cel-plane";
    var inner = document.createElement("div");
    inner.className = "cel-plane-in";
    var banner = document.createElement("div");
    banner.className = "cel-banner";
    banner.textContent = MESAJ;
    var rope = document.createElement("div");
    rope.className = "cel-rope";
    var emoji = document.createElement("div");
    emoji.className = "cel-plane-emoji";
    emoji.textContent = "✈️";               // ✈️ conduce în dreapta, bannerul îl urmează
    inner.appendChild(banner); inner.appendChild(rope); inner.appendChild(emoji);
    plane.appendChild(inner);
    layer.appendChild(plane);
  }

  // ---------- o sărbătoare completă ----------
  function celebrate(){
    if(running) return;
    running = true;
    injectCss();
    var layer = document.createElement("div");
    layer.id = "celebrare-layer";
    layer._alive = true;
    document.body.appendChild(layer);

    if(reduce){
      celebrateReduced(layer);
    } else {
      runCanvas(layer, Date.now());
      runPlane(layer);
    }

    setTimeout(function(){ layer.classList.add("cel-out"); }, DURATA);
    setTimeout(function(){
      layer._alive = false;
      if(layer.parentNode) layer.parentNode.removeChild(layer);
      running = false;
    }, DURATA + FADE + 60);
  }
  window.celebrareAcum = celebrate;   // pt. test manual din consolă

  // ---------- planificator: aliniat pe ceasul de perete ----------
  var lastBucket = Math.floor(Date.now()/PERIODA);
  var pending = false;

  function tick(){
    var b = Math.floor(Date.now()/PERIODA);
    if(b !== lastBucket){
      lastBucket = b;
      if(document.hidden) pending = true;   // rulează când revine pe tab (să nu piardă mesajul)
      else celebrate();
    }
  }

  function boot(){
    setInterval(tick, 1000);
    document.addEventListener("visibilitychange", function(){
      if(!document.hidden && pending){ pending = false; celebrate(); }
    });
    // o dată la scurt timp după încărcare (confirmă imediat că merge)
    setTimeout(function(){ if(!document.hidden) celebrate(); }, 6000);
  }

  if(document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", boot);
  else
    boot();
})();
