// ============================================================
//  Among Us CS — randarea lumii (Canvas 2D) + inputul de mișcare
//  ------------------------------------------------------------
//  Serverul rămâne autoritatea pe poziții; aici doar:
//   • prezicem mișcarea PROPRIE (aceeași integrare + coliziuni ca pe
//     server, prin AMAP) și ne corectăm ușor spre poziția oficială,
//   • interpolăm ceilalți jucători între snapshot-uri (~120ms în urmă),
//   • desenăm harta în stil „The Skeld”: carenă, podele cu dale, camere
//     etichetate, stații de task, buton de urgență, cadavre, fog of war.
//  Tot ce e desenat vine din geometria AMAP — fără imagini externe.
// ============================================================
(function(){
  "use strict";

  var canvas = null, ctx = null;
  var activ = false;
  var dpr = 1, cw = 0, ch = 0;

  var cam = { x: AMAP.SPAWN.x, y: AMAP.SPAWN.y, s: 1 };
  var faza = 0;                       // faza animației de mers
  var ultimT = null;
  var pozLive = {};                   // id -> {x,y,viu,mers} (pozițiile interpolate din cadrul curent)

  // ---------- stele de fundal (deterministe) ----------
  var stele = [];
  (function(){
    var s = 1234567;
    function rnd(){ s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
    for(var i = 0; i < 230; i++){
      stele.push({ x: rnd() * 2200, y: rnd() * 1400, r: 0.5 + rnd() * 1.4, a: 0.25 + rnd() * 0.6 });
    }
  })();

  // nuanțe pe camere (peste podeaua de bază — subtile)
  var TENTA = {
    cafeteria: "rgba(255,255,255,.05)", kernel: "rgba(255,110,80,.10)",
    server: "rgba(90,160,255,.09)",     compiler: "rgba(150,255,130,.07)",
    network: "rgba(120,220,255,.09)",   database: "rgba(255,200,90,.08)",
    memory: "rgba(210,140,255,.09)"
  };

  var COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

  function shade(hex, f){
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  // ---------- poteca spre următorul obiectiv ----------
  // BFS pe grila hărții (AMAP.cale) până la cel mai APROPIAT task nerezolvat
  // — după drum, nu în linie dreaptă. În timpul sabotajului, echipajul viu e
  // condus la punctul de reparat. Recalculăm doar când s-a schimbat ceva sau
  // ne-am deplasat suficient (cache pe poziție + țintele curente).
  var traseu = { cheie: "", sx: 0, sy: 0, cale: null, fel: "task" };
  function actualizeazaTraseu(){
    if(!STARE.inJoc || STARE.meeting){ traseu.cale = null; traseu.cheie = ""; return; }
    var tinte = [];
    if(STARE.sabotaj && STARE.me.viu === 1 && STARE.rol !== "impostor"){
      tinte.push({ x: AMAP.FIX_KERNEL.x, y: AMAP.FIX_KERNEL.y, id: "fix", fel: "fix" });
    } else {
      (STARE.tasks || []).forEach(function(tk){
        if(tk.done) return;
        for(var i = 0; i < AMAP.STATIONS.length; i++){
          if(AMAP.STATIONS[i].id === tk.statie){
            tinte.push({ x: AMAP.STATIONS[i].x, y: AMAP.STATIONS[i].y, id: tk.tid, fel: "task" });
            break;
          }
        }
      });
    }
    if(!tinte.length){ traseu.cale = null; traseu.cheie = ""; return; }
    var cheie = tinte.map(function(t){ return t.id; }).join(",");
    if(cheie === traseu.cheie && traseu.cale &&
       AMAP.dist(STARE.pred.x, STARE.pred.y, traseu.sx, traseu.sy) < 60) return;
    var best = null, bestFel = "task";
    for(var k = 0; k < tinte.length; k++){
      var c = AMAP.cale(STARE.pred.x, STARE.pred.y, tinte[k].x, tinte[k].y);
      if(c && (!best || c.lungime < best.lungime)){ best = c; bestFel = tinte[k].fel; }
    }
    traseu.cheie = cheie;
    traseu.sx = STARE.pred.x; traseu.sy = STARE.pred.y;
    traseu.fel = bestFel;
    traseu.cale = (best && best.lungime > AMAP.USE_R) ? best : null;   // ești deja acolo -> nimic
  }
  function culoareTraseu(alpha){
    return (traseu.fel === "fix" ? "rgba(255,140,66," : "rgba(255,215,107,") + alpha + ")";
  }
  // desenată în spațiul lumii (sub jucători): „furnicuțe” spre țintă
  function desenTraseu(tNow){
    if(!traseu.cale) return;
    var p = traseu.cale.puncte;
    ctx.save();
    ctx.strokeStyle = culoareTraseu(0.8);
    ctx.lineWidth = 5;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.setLineDash([11, 10]);
    ctx.lineDashOffset = -((tNow / 32) % 21);   // punctele „curg” spre țintă
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for(var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.stroke();
    ctx.restore();
  }
  // punctul de pe traseu aflat la distanța d de start (pentru săgeata de direcție)
  function punctPeTraseu(d){
    var p = traseu.cale.puncte;
    for(var i = 1; i < p.length; i++){
      var seg = AMAP.dist(p[i-1][0], p[i-1][1], p[i][0], p[i][1]);
      if(d <= seg){
        var f = seg ? d / seg : 0;
        return [p[i-1][0] + (p[i][0] - p[i-1][0]) * f, p[i-1][1] + (p[i][1] - p[i-1][1]) * f];
      }
      d -= seg;
    }
    return p[p.length - 1];
  }
  // săgeată mică lângă propriul bob, orientată pe drum (peste jucători)
  function desenSageataTraseu(tNow){
    if(!traseu.cale) return;
    var P = punctPeTraseu(85);
    var a = Math.atan2(P[1] - STARE.pred.y, P[0] - (STARE.pred.x));
    var r = 46 + Math.sin(tNow / 220) * 3;
    var x = STARE.pred.x + Math.cos(a) * r;
    var y = STARE.pred.y - 20 + Math.sin(a) * r;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = culoareTraseu(0.95);
    ctx.strokeStyle = "rgba(8,10,20,.6)"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ---------- minimapa (M / butonul 🗺️) ----------
  var mmap = { on: false, auto: false };
  function desenMinimapa(tNow){
    if(!mmap.on || !STARE.inJoc) return;
    ctx.fillStyle = "rgba(3,5,12,.72)";
    ctx.fillRect(0, 0, cw, ch);
    var s2 = Math.min((cw * 0.88) / AMAP.W, (ch * 0.68) / AMAP.H);
    var w = AMAP.W * s2, h = AMAP.H * s2;
    var ox = (cw - w) / 2, oy = (ch - h) / 2 + 12;
    ctx.fillStyle = "rgba(9,12,26,.96)";
    roundRect(ox - 16, oy - 46, w + 32, h + 76, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1.5;
    roundRect(ox - 16, oy - 46, w + 32, h + 76, 14);
    ctx.stroke();
    ctx.fillStyle = "#cdd6ee";
    ctx.font = "800 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HARTA STAȚIEI  ·  M sau o atingere = închide", cw / 2, oy - 22);
    ctx.font = "600 11.5px Inter, sans-serif";
    ctx.fillStyle = "#8e9ac2";
    ctx.fillText("! = taskurile tale  ·  punct roșu = butonul de urgență  ·  poteca punctată = drumul cel mai scurt" +
                 (STARE.sabotaj ? "  ·  ⚠ = REPARĂ AICI" : ""), cw / 2, oy + h + 18);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s2, s2);
    // podele + tente + nume
    AMAP.FLOORS.forEach(function(f){
      ctx.fillStyle = "#828bb3";
      ctx.fillRect(f.x, f.y, f.w, f.h);
      if(f.room && TENTA[f.room]){ ctx.fillStyle = TENTA[f.room]; ctx.fillRect(f.x, f.y, f.w, f.h); }
    });
    ctx.font = "800 44px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(16,22,44,.65)";
    AMAP.FLOORS.forEach(function(f){
      if(f.room) ctx.fillText(AMAP.ROOM_NAMES[f.room].toUpperCase(), f.x + f.w / 2, f.y + 62);
    });
    // poteca
    if(traseu.cale){
      var p = traseu.cale.puncte;
      ctx.strokeStyle = culoareTraseu(0.9);
      ctx.lineWidth = 14;
      ctx.setLineDash([34, 30]);
      ctx.lineDashOffset = -((tNow / 12) % 64);
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for(var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // taskurile tale nerezolvate
    (STARE.tasks || []).forEach(function(tk){
      if(tk.done) return;
      for(var i = 0; i < AMAP.STATIONS.length; i++){
        if(AMAP.STATIONS[i].id !== tk.statie) continue;
        var s = AMAP.STATIONS[i];
        var puls = 1 + Math.sin(tNow / 260) * 0.12;
        ctx.fillStyle = "#ffd76b";
        ctx.beginPath(); ctx.arc(s.x, s.y, 30 * puls, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3b2c05";
        ctx.font = "900 44px Inter, sans-serif";
        ctx.fillText("!", s.x, s.y + 16);
        break;
      }
    });
    // butonul de urgență + punctul de reparat
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath(); ctx.arc(AMAP.BUTTON.x, AMAP.BUTTON.y, 22, 0, Math.PI * 2); ctx.fill();
    if(STARE.sabotaj){
      var pf = 0.55 + Math.abs(Math.sin(tNow / 150)) * 0.45;
      ctx.save(); ctx.globalAlpha = pf;
      ctx.fillStyle = "#ff8c42";
      ctx.beginPath(); ctx.arc(AMAP.FIX_KERNEL.x, AMAP.FIX_KERNEL.y, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3b1d08";
      ctx.font = "900 52px Inter, sans-serif";
      ctx.fillText("⚠", AMAP.FIX_KERNEL.x, AMAP.FIX_KERNEL.y + 18);
      ctx.restore();
    }
    // fantomele văd toată lumea; cei vii doar propriul punct
    if(STARE.me.viu === 0){
      for(var id in pozLive){
        var info = STARE.roster[id] || {};
        ctx.globalAlpha = pozLive[id].viu ? 1 : 0.5;
        ctx.fillStyle = COLORS[info.color] || "#999";
        ctx.beginPath(); ctx.arc(pozLive[id].x, pozLive[id].y, 18, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // tu — punct pulsând în culoarea ta
    var mc = COLORS[(STARE.roster[STARE.eu.id] || {}).color || 0];
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(STARE.pred.x, STARE.pred.y, 26 + Math.sin(tNow / 180) * 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = mc;
    ctx.beginPath(); ctx.arc(STARE.pred.x, STARE.pred.y, 20, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------- inputul ----------
  var taste = {};
  var joy = { activ: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  var dirTrimis = { dx: 0, dy: 0 };

  function directia(){
    var dx = 0, dy = 0;
    if(taste.KeyA || taste.ArrowLeft) dx -= 1;
    if(taste.KeyD || taste.ArrowRight) dx += 1;
    if(taste.KeyW || taste.ArrowUp) dy -= 1;
    if(taste.KeyS || taste.ArrowDown) dy += 1;
    if(joy.activ){
      var l = Math.hypot(joy.dx, joy.dy);
      if(l > 12){ dx = Math.abs(joy.dx) > 12 ? (joy.dx > 0 ? 1 : -1) : 0;
                  dy = Math.abs(joy.dy) > 12 ? (joy.dy > 0 ? 1 : -1) : 0; }
    }
    return { dx: dx, dy: dy };
  }
  function trimiteInput(fortat){
    var d = STARE.inJoc && !STARE.meeting && !STARE.taskActiv ? directia() : { dx: 0, dy: 0 };
    if(fortat || d.dx !== dirTrimis.dx || d.dy !== dirTrimis.dy){
      dirTrimis = d;
      NET.send({ t: "input", dx: d.dx, dy: d.dy });
    }
  }
  setInterval(function(){ if(STARE.inJoc) trimiteInput(true); }, 400);   // plasă de siguranță

  window.addEventListener("keydown", function(e){
    if(!STARE.inJoc) return;
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    taste[e.code] = true;
    trimiteInput(false);
    if(e.code === "KeyM" && !e.repeat && !STARE.taskActiv && !STARE.meeting){
      mmap.on = !mmap.on; mmap.auto = false;
    }
    if(e.code === "Escape" && mmap.on){ mmap.on = false; mmap.auto = false; }
    if(!e.repeat && window.UI && UI.tasta) UI.tasta(e.code, true);
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].indexOf(e.code) >= 0) e.preventDefault();
  });
  window.addEventListener("keyup", function(e){
    taste[e.code] = false;
    trimiteInput(false);
    if(window.UI && UI.tasta) UI.tasta(e.code, false);
  });
  window.addEventListener("blur", function(){ taste = {}; trimiteInput(false); });

  function leagaJoystick(){
    canvas.addEventListener("pointerdown", function(e){
      if(mmap.on){ mmap.on = false; mmap.auto = false; return; }   // atingerea închide harta
      if(!STARE.inJoc || STARE.meeting || STARE.taskActiv) return;
      if(e.pointerType === "mouse") return;              // joystick doar la touch
      if(e.clientX > window.innerWidth * 0.55) return;   // jumătatea stângă
      joy.activ = true; joy.id = e.pointerId;
      joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = 0; joy.dy = 0;
      canvas.setPointerCapture(e.pointerId);
      trimiteInput(false);
    });
    canvas.addEventListener("pointermove", function(e){
      if(!joy.activ || e.pointerId !== joy.id) return;
      joy.dx = Math.max(-56, Math.min(56, e.clientX - joy.ox));
      joy.dy = Math.max(-56, Math.min(56, e.clientY - joy.oy));
      trimiteInput(false);
    });
    function gata(e){
      if(!joy.activ || e.pointerId !== joy.id) return;
      joy.activ = false; joy.dx = 0; joy.dy = 0;
      trimiteInput(false);
    }
    canvas.addEventListener("pointerup", gata);
    canvas.addEventListener("pointercancel", gata);
  }

  // ---------- interpolare ----------
  function pozitiaRemota(id, tRandare){
    var buf = STARE.interp[id];
    if(!buf || !buf.length) return null;
    if(buf.length === 1 || buf[buf.length - 1].t <= tRandare){
      return buf[buf.length - 1];
    }
    for(var i = buf.length - 2; i >= 0; i--){
      if(buf[i].t <= tRandare){
        var a = buf[i], b = buf[i + 1];
        var f = (tRandare - a.t) / Math.max(1, b.t - a.t);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f,
                 dx: b.dx, dy: b.dy, viu: b.viu };
      }
    }
    return buf[0];
  }

  // ---------- desen ----------
  function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function desenBob(x, y, culoare, fata, mers, optiuni){
    var o = optiuni || {};
    var alpha = o.fantoma ? 0.45 : 1;
    ctx.save();
    ctx.globalAlpha = alpha * (o.alpha == null ? 1 : o.alpha);
    ctx.translate(x, y + (o.fantoma ? Math.sin(faza * 2.2) * 3 : 0));
    if(o.rotit) ctx.rotate(Math.PI / 2);

    var sq = mers ? 1 + Math.sin(faza * 10) * 0.03 : 1;

    // umbră
    if(!o.fantoma && !o.rotit){
      ctx.fillStyle = "rgba(0,0,0,.32)";
      ctx.beginPath(); ctx.ellipse(0, 3, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // picioare (dacă nu e fantomă)
    if(!o.fantoma){
      var pasP = mers ? Math.sin(faza * 10) * 4 : 0;
      ctx.fillStyle = shade(culoare, 0.75);
      roundRect(-13, -8 + pasP * 0.4, 10, 11, 4); ctx.fill();
      roundRect(3, -8 - pasP * 0.4, 10, 11, 4); ctx.fill();
    }
    // corp
    ctx.fillStyle = culoare;
    ctx.strokeStyle = "rgba(8,10,20,.7)"; ctx.lineWidth = 3;
    roundRect(-16, -42 * sq, 32, 38 * sq, 15); ctx.fill(); ctx.stroke();
    // ranița pe spate
    ctx.fillStyle = shade(culoare, 0.8);
    roundRect(fata >= 0 ? -24 : 14, -34, 10, 20, 4); ctx.fill(); ctx.stroke();
    // vizorul
    ctx.fillStyle = o.mort ? "#8b93a8" : "#c6e6f2";
    roundRect(fata >= 0 ? 0 : -16, -36, 16, 11, 6); ctx.fill();
    ctx.strokeStyle = "rgba(8,10,20,.5)"; ctx.lineWidth = 2;
    roundRect(fata >= 0 ? 0 : -16, -36, 16, 11, 6); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    roundRect(fata >= 0 ? 3 : -13, -34, 7, 3, 2); ctx.fill();
    if(o.mort){
      ctx.strokeStyle = "#39404f"; ctx.lineWidth = 2;
      var vx = fata >= 0 ? 8 : -8;
      ctx.beginPath();
      ctx.moveTo(vx - 4, -35); ctx.lineTo(vx + 4, -28);
      ctx.moveTo(vx + 4, -35); ctx.lineTo(vx - 4, -28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function nume(x, y, txt, cul){
    ctx.save();
    ctx.font = "700 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(5,8,16,.85)";
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = cul || "#fff";
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function cadru(tNow){
    if(!activ){ ultimT = null; requestAnimationFrame(cadru); return; }
    if(ultimT == null) ultimT = tNow;
    var dt = Math.min(0.05, (tNow - ultimT) / 1000);
    ultimT = tNow;
    faza += dt * (dirTrimis.dx || dirTrimis.dy ? 1 : 0.35);

    // ---- predicția mișcării proprii ----
    var d = STARE.inJoc && !STARE.meeting && !STARE.taskActiv ? directia() : { dx: 0, dy: 0 };
    var seMisca = !!(d.dx || d.dy);
    if(seMisca){
      var poz = AMAP.misca(STARE.pred.x, STARE.pred.y, d.dx, d.dy, AMAP.SPEED * dt);
      STARE.pred.x = poz[0]; STARE.pred.y = poz[1];
      if(d.dx) STARE.pred.f = d.dx;
    }
    // corecție blândă spre poziția serverului
    var ex = STARE.me.x - STARE.pred.x, ey = STARE.me.y - STARE.pred.y;
    var err = Math.hypot(ex, ey);
    if(err > 90){ STARE.pred.x = STARE.me.x; STARE.pred.y = STARE.me.y; }
    else { STARE.pred.x += ex * 0.08; STARE.pred.y += ey * 0.08; }

    if(window.SFX) SFX.pasi(seMisca && STARE.inJoc && !STARE.meeting && STARE.me.viu === 1 && !document.hidden);

    // ---- camera ----
    cam.s = Math.max(0.62, Math.min(1.45, Math.min(cw / 1150, ch / 760)));
    cam.x += (STARE.pred.x - cam.x) * 0.12;
    cam.y += (STARE.pred.y - cam.y) * 0.12;

    // ---- desen ----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#06070f";
    ctx.fillRect(0, 0, cw, ch);

    // stele (parallax)
    ctx.save();
    for(var i = 0; i < stele.length; i++){
      var st = stele[i];
      var sx = ((st.x - cam.x * 0.28) % (cw + 60) + cw + 60) % (cw + 60) - 30;
      var sy = ((st.y - cam.y * 0.28) % (ch + 60) + ch + 60) % (ch + 60) - 30;
      ctx.globalAlpha = st.a;
      ctx.fillStyle = "#cfd8ef";
      ctx.beginPath(); ctx.arc(sx, sy, st.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(cam.s, cam.s);
    ctx.translate(-cam.x, -cam.y);

    // carena (conturul exterior al stației)
    AMAP.FLOORS.forEach(function(f){
      ctx.fillStyle = "#232b4a";
      roundRect(f.x - 26, f.y - 26, f.w + 52, f.h + 52, 26); ctx.fill();
    });
    AMAP.FLOORS.forEach(function(f){
      ctx.strokeStyle = "#3d4a7d"; ctx.lineWidth = 5;
      roundRect(f.x - 26, f.y - 26, f.w + 52, f.h + 52, 26); ctx.stroke();
    });
    // umplem din nou interiorul, ca linia de carenă să rămână doar pe exterior
    AMAP.FLOORS.forEach(function(f){
      ctx.fillStyle = "#232b4a";
      roundRect(f.x - 21, f.y - 21, f.w + 42, f.h + 42, 21); ctx.fill();
    });

    // podelele
    AMAP.FLOORS.forEach(function(f){
      ctx.fillStyle = "#a0a8c8";
      ctx.fillRect(f.x, f.y, f.w, f.h);
    });
    // dalele (grilă aliniată la lume)
    ctx.save();
    ctx.beginPath();
    AMAP.FLOORS.forEach(function(f){ ctx.rect(f.x, f.y, f.w, f.h); });
    ctx.clip();
    ctx.strokeStyle = "rgba(24,30,58,.16)"; ctx.lineWidth = 1.5;
    for(var gx = 0; gx <= AMAP.W; gx += 44){ ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, AMAP.H); ctx.stroke(); }
    for(var gy = 0; gy <= AMAP.H; gy += 44){ ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(AMAP.W, gy); ctx.stroke(); }
    ctx.restore();
    // tentele camerelor + marginea interioară
    AMAP.FLOORS.forEach(function(f){
      if(f.room && TENTA[f.room]){ ctx.fillStyle = TENTA[f.room]; ctx.fillRect(f.x, f.y, f.w, f.h); }
      ctx.strokeStyle = "rgba(30,38,72,.5)"; ctx.lineWidth = 3;
      ctx.strokeRect(f.x + 1.5, f.y + 1.5, f.w - 3, f.h - 3);
    });
    // etichetele camerelor
    ctx.save();
    ctx.font = "800 15px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(18,24,48,.55)";
    AMAP.FLOORS.forEach(function(f){
      if(!f.room) return;
      ctx.fillText(AMAP.ROOM_NAMES[f.room].toUpperCase(), f.x + f.w / 2, f.y + 26);
    });
    ctx.restore();

    var ctxA = { taskA: null, butonA: false, fixA: false, corpA: false, killT: null };
    var px = STARE.pred.x, py = STARE.pred.y;

    // butonul de urgență (masa din Cafeteria)
    (function(){
      var B = AMAP.BUTTON;
      ctx.fillStyle = "#7d879f";
      ctx.beginPath(); ctx.ellipse(B.x, B.y + 4, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(20,26,50,.6)"; ctx.lineWidth = 3; ctx.stroke();
      var aproape = AMAP.dist(px, py, B.x, B.y) <= AMAP.USE_R + 20;
      ctx.fillStyle = aproape ? "#ff5b5b" : "#c0392b";
      ctx.beginPath(); ctx.ellipse(B.x, B.y - 4, 18, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#7c1d12"; ctx.lineWidth = 3; ctx.stroke();
      if(aproape && !STARE.sabotaj && STARE.me.viu === 1) ctxA.butonA = true;
    })();

    // punctul de reparat (doar în timpul sabotajului)
    if(STARE.sabotaj){
      var F = AMAP.FIX_KERNEL;
      var puls = 0.6 + Math.sin(tNow / 130) * 0.4;
      ctx.save();
      ctx.globalAlpha = puls;
      ctx.fillStyle = "#ff8c42";
      ctx.beginPath(); ctx.arc(F.x, F.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "#ffd76b"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(F.x, F.y, 32, -Math.PI / 2, -Math.PI / 2 + (STARE.sabotaj.pct / 100) * Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#3b1d08"; ctx.font = "900 22px Inter"; ctx.textAlign = "center";
      ctx.fillText("⚠", F.x, F.y + 8);
      nume(F.x, F.y - 44, "REPARĂ AICI", "#ffd76b");
      if(AMAP.dist(px, py, F.x, F.y) <= AMAP.USE_R * 1.2 && STARE.me.viu === 1) ctxA.fixA = true;
    }

    // stațiile de task
    var taskuriPeStatie = {};
    (STARE.tasks || []).forEach(function(tk){
      if(!tk.done) (taskuriPeStatie[tk.statie] = taskuriPeStatie[tk.statie] || []).push(tk);
    });
    AMAP.STATIONS.forEach(function(s){
      // terminalul
      ctx.fillStyle = "#59627f";
      roundRect(s.x - 17, s.y + 4, 34, 8, 3); ctx.fill();
      ctx.fillStyle = "#141b30";
      roundRect(s.x - 15, s.y - 18, 30, 22, 4); ctx.fill();
      ctx.strokeStyle = "#57d8e8"; ctx.lineWidth = 2;
      roundRect(s.x - 15, s.y - 18, 30, 22, 4); ctx.stroke();
      ctx.fillStyle = "rgba(87,216,232,.5)";
      ctx.fillRect(s.x - 10, s.y - 13, 20, 3);
      ctx.fillRect(s.x - 10, s.y - 8, 13, 3);

      var ale = taskuriPeStatie[s.id];
      if(ale && ale.length){
        // semn de exclamare săltăreț deasupra taskurilor tale
        var salt = Math.abs(Math.sin(tNow / 260)) * 8;
        ctx.fillStyle = "#ffd76b";
        ctx.font = "900 24px Inter"; ctx.textAlign = "center";
        ctx.fillText("!", s.x, s.y - 30 - salt);
        var ap = AMAP.dist(px, py, s.x, s.y) <= AMAP.USE_R;
        if(ap){
          ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.arc(s.x, s.y - 6, 32, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          if(!ctxA.taskA) ctxA.taskA = ale[0];
        }
      }
    });

    // poteca punctată spre următorul obiectiv (sub jucători)
    actualizeazaTraseu();
    desenTraseu(tNow);

    // cadavrele
    (STARE.bodies || []).forEach(function(b){
      desenBob(b.x, b.y, COLORS[b.color] || "#999", 1, false, { rotit: true, mort: true });
      if(STARE.me.viu === 1 && AMAP.dist(px, py, b.x, b.y) <= AMAP.REPORT_R) ctxA.corpA = true;
    });

    // ceilalți jucători (interpolați) — sortați pe y ca să se suprapună natural
    var tRandare = performance.now() - 120;
    var deDesenat = [];
    pozLive = {};
    for(var id in STARE.interp){
      if(id === STARE.eu.id) continue;
      var pz = pozitiaRemota(id, tRandare);
      if(!pz) continue;
      var info = STARE.roster[id] || {};
      var viu = (pz.viu == null) ? 1 : pz.viu;   // cei vii primesc doar jucători vii
      pozLive[id] = { x: pz.x, y: pz.y, viu: viu };
      deDesenat.push({ id: id, x: pz.x, y: pz.y, viu: viu,
                       mers: !!(pz.dx || pz.dy), f: pz.dx ? (pz.dx > 0 ? 1 : -1) : 1,
                       nume: info.nume || "?", color: COLORS[info.color] || "#999" });
    }
    // + propriul bob
    deDesenat.push({ id: STARE.eu.id, x: px, y: py, viu: STARE.me.viu,
                     mers: seMisca, f: STARE.pred.f || 1,
                     nume: STARE.eu.nume, color: COLORS[(STARE.roster[STARE.eu.id] || {}).color || 0], eu: true });
    deDesenat.sort(function(a, b){ return a.y - b.y; });
    deDesenat.forEach(function(o){
      desenBob(o.x, o.y, o.color, o.f, o.mers, { fantoma: !o.viu });
      if(o.viu || STARE.me.viu === 0) nume(o.x, o.y - 52, o.nume + (o.eu ? " (tu)" : ""), o.eu ? "#ffd76b" : "#fff");
    });

    // săgeata de direcție de lângă propriul bob (pe drumul calculat)
    desenSageataTraseu(tNow);

    // ținta de kill (pentru impostor): cel mai apropiat NE-coleg viu
    if(STARE.rol === "impostor" && STARE.me.viu === 1){
      var best = null, bd = AMAP.KILL_R;
      var colegi = {};
      (STARE.colegi || []).forEach(function(c){ colegi[c.id] = 1; });
      for(var idd in pozLive){
        if(colegi[idd] || !pozLive[idd].viu) continue;
        var dd = AMAP.dist(px, py, pozLive[idd].x, pozLive[idd].y);
        if(dd <= bd){ bd = dd; best = idd; }
      }
      if(best){
        ctxA.killT = best;
        var t = pozLive[best];
        ctx.strokeStyle = "rgba(255,90,70,.9)"; ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.arc(t.x, t.y - 20, 34, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();   // gata cu spațiul lumii

    // ---- fog of war (doar cei vii) ----
    if(STARE.me.viu === 1 && STARE.inJoc){
      var R = Math.hypot(cw, ch);
      var vz = AMAP.VISION * cam.s;
      var g = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, R);
      g.addColorStop(0, "rgba(4,6,14,0)");
      g.addColorStop(Math.min(0.98, (vz * 0.55) / R), "rgba(4,6,14,0)");
      g.addColorStop(Math.min(0.99, (vz * 1.05) / R), "rgba(4,6,14,.93)");
      g.addColorStop(1, "rgba(4,6,14,.93)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
    } else if(STARE.inJoc){
      // fantomele văd tot — doar o tentă albăstruie pe margini
      var g2 = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.7);
      g2.addColorStop(0, "rgba(90,110,200,0)");
      g2.addColorStop(1, "rgba(60,80,180,.22)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, cw, ch);
    }

    // ---- alarmă de sabotaj: margini roșii pulsând ----
    if(STARE.sabotaj){
      var a = 0.10 + Math.abs(Math.sin(tNow / 240)) * 0.14;
      var g3 = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.32, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.62);
      g3.addColorStop(0, "rgba(255,40,20,0)");
      g3.addColorStop(1, "rgba(255,40,20," + a + ")");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, cw, ch);
    }

    // ---- joystickul (touch) ----
    if(joy.activ){
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 46, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 0.8, joy.oy + joy.dy * 0.8, 20, 0, Math.PI * 2); ctx.fill();
    }

    // ---- minimapa (peste tot restul) ----
    desenMinimapa(tNow);

    if(window.UI && UI.actualizeazaActiuni) UI.actualizeazaActiuni(ctxA);
    requestAnimationFrame(cadru);
  }

  function dimensioneaza(){
    if(!canvas) return;
    dpr = window.devicePixelRatio || 1;
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }

  window.JOC = {
    porneste: function(){
      if(canvas) return;
      canvas = document.getElementById("scena");
      ctx = canvas.getContext("2d");
      dimensioneaza();
      window.addEventListener("resize", dimensioneaza);
      leagaJoystick();
      requestAnimationFrame(cadru);
    },
    arata: function(on){
      activ = on;
      if(on){
        STARE.pred.x = STARE.me.x || AMAP.SPAWN.x;
        STARE.pred.y = STARE.me.y || AMAP.SPAWN.y;
        traseu.cheie = ""; traseu.cale = null;
        mmap.on = false; mmap.auto = false;
        dimensioneaza();
      } else if(window.SFX) SFX.pasi(false);
    },
    // controlul minimapei: "toggle" | true/false; auto=true = deschidere/închidere
    // automată (cea de la începutul rundei) — nu calcă peste alegerea userului
    minimapa: function(on, auto){
      if(on === "toggle"){ mmap.on = !mmap.on; mmap.auto = false; return; }
      if(auto){
        if(on && !mmap.on){ mmap.on = true; mmap.auto = true; }
        else if(!on && mmap.auto){ mmap.on = false; mmap.auto = false; }
      } else {
        mmap.on = !!on; mmap.auto = false;
      }
    },
    pozitii: function(){ return pozLive; }
  };
})();
