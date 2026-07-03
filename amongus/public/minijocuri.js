// ============================================================
//  Among Us CS — minijocurile de task (clientul)
//  ------------------------------------------------------------
//  Serverul trimite doar SPEC-ul (enunț cu variantele amestecate);
//  soluția nu ajunge niciodată aici. Jucătorul interacționează,
//  iar răspunsul e trimis serverului, care îl validează.
//
//  Fiecare tip are un constructor BUILD[tip](corp, spec) care întoarce:
//    { raspuns(): obiect|null,   // null = incomplet (butonul Trimite e stins)
//      reset():   void }
//  Orice interacțiune cheamă MINIJOC._refresh() ca să aprindă butonul.
// ============================================================
(function(){
  "use strict";

  var TIP_ICON = { fire:"🔌", ordonare:"🧩", calibrare:"🎚️", stiva:"📚",
                   arbore:"🌳", sortare:"📦", stari:"🔁", sql:"🗄️" };
  var TIP_CERINTA = {
    fire:      "Leagă fiecare element din stânga de perechea lui din dreapta.",
    ordonare:  "Atinge piesele de jos ca să umpli pozițiile în ordinea corectă.",
    calibrare: "Oprește acul cât mai aproape de valoarea corectă.",
    stiva:     "Folosește PUSH și POP ca să produci exact ordinea cerută la ieșire.",
    arbore:    "Atinge nodurile în ordinea parcurgerii cerute.",
    sortare:   "Execută O SINGURĂ trecere de bubble sort: compară vecinii de la stânga la dreapta.",
    stari:     "Atinge o căsuță de pe săgeată, apoi eticheta potrivită.",
    sql:       "Atinge un fragment ca să umpli golul următor. Atinge un gol plin ca să-l golești."
  };
  var CULORI_FIRE = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"];

  var modal = null, builder = null, curent = null, blocat = false;

  function el(tag, cls, txt){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt != null) e.textContent = txt;
    return e;
  }
  function esc(s){ return String(s); }   // textContent peste tot — fără HTML injectat

  // ---------------------------------------------------------- 1. FIRE
  function buildFire(corp, spec){
    var zona = el("div", "fire-zona");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "fire-svg");
    var colane = el("div", "fire-coloane");
    var colS = el("div", "fire-col"), colD = el("div", "fire-col");
    if(spec.etichete && spec.etichete.stanga) colS.appendChild(el("div", "eticheta", spec.etichete.stanga));
    if(spec.etichete && spec.etichete.dreapta) colD.appendChild(el("div", "eticheta", spec.etichete.dreapta));

    var legaturi = spec.stanga.map(function(){ return null; });   // idxStanga -> idxDreapta
    var selectat = null;
    var chipS = [], chipD = [];

    spec.stanga.forEach(function(txt, i){
      var w = el("div", "fir-nod");
      var c = el("div", "chip", esc(txt));
      c.addEventListener("click", function(){
        selectat = (selectat === i) ? null : i;
        deseneaza();
      });
      w.appendChild(c); colS.appendChild(w); chipS.push(c);
    });
    spec.dreapta.forEach(function(txt, j){
      var w = el("div", "fir-nod");
      var c = el("div", "chip", esc(txt));
      c.addEventListener("click", function(){
        var cine = legaturi.indexOf(j);
        if(selectat != null){
          if(cine >= 0) legaturi[cine] = null;      // firul vechi spre acest nod dispare
          legaturi[selectat] = j;
          selectat = null;
        } else if(cine >= 0){
          legaturi[cine] = null;                    // click pe nod legat => dezleagă
        }
        deseneaza(); MINIJOC._refresh();
      });
      w.appendChild(c); colD.appendChild(w); chipD.push(c);
    });

    colane.appendChild(colS); colane.appendChild(colD);
    zona.appendChild(colane); zona.appendChild(svg);
    corp.appendChild(zona);

    function deseneaza(){
      chipS.forEach(function(c, i){
        c.classList.toggle("ales", selectat === i || legaturi[i] != null);
      });
      chipD.forEach(function(c, j){
        c.classList.toggle("ales", legaturi.indexOf(j) >= 0);
      });
      // firele în SVG (coordonate relative la zonă)
      var zr = zona.getBoundingClientRect();
      svg.setAttribute("viewBox", "0 0 " + zr.width + " " + zr.height);
      while(svg.firstChild) svg.removeChild(svg.firstChild);
      legaturi.forEach(function(j, i){
        if(j == null) return;
        var a = chipS[i].getBoundingClientRect(), b = chipD[j].getBoundingClientRect();
        var x1 = a.right - zr.left, y1 = a.top + a.height / 2 - zr.top;
        var x2 = b.left - zr.left,  y2 = b.top + b.height / 2 - zr.top;
        var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var mx = (x1 + x2) / 2;
        p.setAttribute("d", "M" + x1 + " " + y1 + " C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2);
        p.setAttribute("stroke", CULORI_FIRE[i % CULORI_FIRE.length]);
        p.setAttribute("stroke-width", "3.5");
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-linecap", "round");
        svg.appendChild(p);
      });
    }
    window.addEventListener("resize", deseneaza);
    setTimeout(deseneaza, 0);

    return {
      raspuns: function(){
        return legaturi.every(function(v){ return v != null; }) ? { alegeri: legaturi.slice() } : null;
      },
      reset: function(){ legaturi = legaturi.map(function(){ return null; }); selectat = null; deseneaza(); }
    };
  }

  // ------------------------------------------------ 2. ORDONARE (sloturi)
  function buildSloturi(corp, itemi, textSlot){
    var slots = itemi.map(function(){ return null; });   // pozitie -> idxRezervor
    var zonaS = el("div", "sloturi");
    var rez = el("div", "rezervor");
    var slotEls = [], chipEls = [];

    itemi.forEach(function(_, k){
      var r = el("div", "slot");
      r.appendChild(el("span", "nr", (k + 1) + "."));
      var g = el("div", "chip gol", textSlot || "· · ·");
      g.style.flex = "1";
      g.addEventListener("click", function(){
        if(slots[k] == null) return;
        chipEls[slots[k]].classList.remove("folosit");
        slots[k] = null;
        randeaza(); MINIJOC._refresh();
      });
      r.appendChild(g);
      slotEls.push(g); zonaS.appendChild(r);
    });
    itemi.forEach(function(txt, i){
      var c = el("div", "chip", esc(txt));
      c.addEventListener("click", function(){
        if(c.classList.contains("folosit")) return;
        var liber = slots.indexOf(null);
        if(liber < 0) return;
        slots[liber] = i;
        c.classList.add("folosit");
        randeaza(); MINIJOC._refresh();
      });
      rez.appendChild(c); chipEls.push(c);
    });
    corp.appendChild(zonaS); corp.appendChild(rez);

    function randeaza(){
      slots.forEach(function(idx, k){
        var g = slotEls[k];
        if(idx == null){ g.classList.add("gol"); g.classList.remove("plin"); g.textContent = textSlot || "· · ·"; }
        else{ g.classList.remove("gol"); g.classList.add("plin"); g.textContent = esc(itemi[idx]); }
      });
    }

    return {
      raspuns: function(){
        return slots.every(function(v){ return v != null; }) ? { ordine: slots.slice() } : null;
      },
      reset: function(){
        slots = slots.map(function(){ return null; });
        chipEls.forEach(function(c){ c.classList.remove("folosit"); });
        randeaza();
      }
    };
  }
  function buildOrdonare(corp, spec){ return buildSloturi(corp, spec.itemi); }

  // ------------------------------------------------ 3. CALIBRARE (acul)
  function buildCalibrare(corp, spec){
    corp.appendChild(el("div", null, "")).style.cssText = "text-align:center;font-weight:700;font-size:16px";
    corp.lastChild.textContent = spec.intrebare;
    var scala = el("div", "cal-scala");
    var ac = el("div", "cal-ac");
    scala.appendChild(ac);
    var repere = el("div", "cal-repere");
    repere.appendChild(el("span", null, String(spec.min) + (spec.unitate ? " " + spec.unitate : "")));
    repere.appendChild(el("span", null, String(Math.round((spec.min + spec.max) / 2))));
    repere.appendChild(el("span", null, String(spec.max) + (spec.unitate ? " " + spec.unitate : "")));
    var valE = el("div", "cal-valoare", "—");
    var but = el("div", "stiva-but");
    var stop = el("button", "btn prim mare", "⏸ OPREȘTE");
    var reia = el("button", "btn", "↻ Reia");
    reia.disabled = true;
    but.appendChild(stop); but.appendChild(reia);
    corp.appendChild(scala); corp.appendChild(repere); corp.appendChild(valE); corp.appendChild(but);

    var pornit = true, poz = 0, dir = 1, valoare = null, raf = null, ultim = null;
    var PERIOADA = 2800;   // ms pentru o traversare completă

    function pas(t){
      if(!pornit) return;
      if(ultim == null) ultim = t;
      var dt = t - ultim; ultim = t;
      poz += dir * (dt / PERIOADA);
      if(poz >= 1){ poz = 1; dir = -1; }
      if(poz <= 0){ poz = 0; dir = 1; }
      ac.style.left = "calc(" + (poz * 100) + "% - 1px)";
      valE.textContent = String(Math.round(spec.min + poz * (spec.max - spec.min)));
      raf = requestAnimationFrame(pas);
    }
    raf = requestAnimationFrame(pas);

    stop.addEventListener("click", function(){
      if(!pornit) return;
      pornit = false; cancelAnimationFrame(raf);
      valoare = Math.round(spec.min + poz * (spec.max - spec.min));
      valE.textContent = String(valoare) + (spec.unitate ? " " + spec.unitate : "");
      stop.disabled = true; reia.disabled = false;
      MINIJOC._refresh();
    });
    reia.addEventListener("click", function(){
      valoare = null; pornit = true; ultim = null;
      stop.disabled = false; reia.disabled = true;
      raf = requestAnimationFrame(pas);
      MINIJOC._refresh();
    });

    return {
      raspuns: function(){ return valoare == null ? null : { valoare: valoare }; },
      reset: function(){ reia.click(); },
      opreste: function(){ pornit = false; if(raf) cancelAnimationFrame(raf); }
    };
  }

  // ------------------------------------------------ 4. STIVA (push/pop)
  function buildStiva(corp, spec){
    var zone = el("div", "stiva-zone");
    var zS = el("div"), zM = el("div"), zI = el("div");
    zS.appendChild(el("h4", null, "Sosire →"));
    zM.appendChild(el("h4", null, "Stiva"));
    zI.appendChild(el("h4", null, "Ieșire cerută"));
    var cS = el("div", "zona-cutie orizontal");
    var cM = el("div", "zona-cutie");
    var cI = el("div", "zona-cutie orizontal");
    zS.appendChild(cS); zM.appendChild(cM); zI.appendChild(cI);
    zone.appendChild(zS); zone.appendChild(zM); zone.appendChild(zI);
    corp.appendChild(zone);

    var but = el("div", "stiva-but");
    var bPush = el("button", "btn prim", "PUSH ↓");
    var bPop  = el("button", "btn", "POP ↑");
    var bReset= el("button", "btn", "↻ Reset");
    but.appendChild(bPush); but.appendChild(bPop); but.appendChild(bReset);
    corp.appendChild(but);

    var next, stiva, iesit, ops;
    function reset(){
      next = 0; stiva = []; iesit = []; ops = [];
      randeaza(); MINIJOC._refresh();
    }
    function randeaza(){
      cS.innerHTML = ""; cM.innerHTML = ""; cI.innerHTML = "";
      spec.sosire.forEach(function(v, i){
        if(i < next) return;
        var e = el("div", "stiva-el" + (i === next ? " next" : ""), esc(v));
        cS.appendChild(e);
      });
      stiva.forEach(function(v){ cM.appendChild(el("div", "stiva-el", esc(v))); });
      spec.iesire.forEach(function(v, i){
        var e;
        if(i < iesit.length){
          e = el("div", "stiva-el " + (iesit[i] === v ? "ok" : "next"), esc(iesit[i]));
        } else {
          e = el("div", "stiva-el tinta", esc(v));
        }
        cI.appendChild(e);
      });
      bPush.disabled = next >= spec.sosire.length;
      bPop.disabled = !stiva.length;
    }
    bPush.addEventListener("click", function(){
      if(next >= spec.sosire.length) return;
      stiva.push(spec.sosire[next++]); ops.push("push");
      randeaza(); MINIJOC._refresh();
    });
    bPop.addEventListener("click", function(){
      if(!stiva.length) return;
      iesit.push(stiva.pop()); ops.push("pop");
      randeaza(); MINIJOC._refresh();
    });
    bReset.addEventListener("click", reset);
    reset();

    return {
      raspuns: function(){
        var gata = iesit.length === spec.iesire.length &&
                   iesit.every(function(v, i){ return v === spec.iesire[i]; });
        return gata ? { operatii: ops.slice() } : null;
      },
      reset: reset
    };
  }

  // ------------------------------------------------ 5. ARBORE (parcurgere)
  function buildArbore(corp, spec){
    var noduri = [];   // {v, x(depth-order), adanc, el}
    (function parcurge(nod, adanc){
      if(!nod) return;
      parcurge(nod.st, adanc + 1);
      noduri.push({ v: String(nod.v), adanc: adanc, nod: nod });
      parcurge(nod.dr, adanc + 1);
    })(spec.arbore, 0);
    var maxAdanc = Math.max.apply(null, noduri.map(function(n){ return n.adanc; }));

    var NUME_FEL = { inordine: "INORDINE (stânga–rădăcină–dreapta)",
                     preordine: "PREORDINE (rădăcină–stânga–dreapta)",
                     postordine: "POSTORDINE (stânga–dreapta–rădăcină)" };
    var cer = el("div", null, "Parcurgere cerută: ");
    cer.style.cssText = "text-align:center;font-weight:700;margin-bottom:10px";
    var b = el("b", null, NUME_FEL[spec.fel] || spec.fel);
    b.style.color = "var(--accent)";
    cer.appendChild(b);
    corp.appendChild(cer);

    var W = 640, HH = 90 + maxAdanc * 80;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + HH);
    svg.setAttribute("class", "svg-cutie");

    // pozițiile: x = rangul în inordine, y = adâncimea
    var pas = W / (noduri.length + 1);
    noduri.forEach(function(n, i){ n.x = pas * (i + 1); n.y = 55 + n.adanc * 80; });
    function poz(nod){ for(var i = 0; i < noduri.length; i++) if(noduri[i].nod === nod) return noduri[i]; }

    // muchiile întâi (sub noduri)
    noduri.forEach(function(n){
      ["st", "dr"].forEach(function(dirc){
        var c = n.nod[dirc]; if(!c) return;
        var p2 = poz(c);
        var l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", n.x); l.setAttribute("y1", n.y);
        l.setAttribute("x2", p2.x); l.setAttribute("y2", p2.y);
        l.setAttribute("stroke", "var(--line2)"); l.setAttribute("stroke-width", "2");
        svg.appendChild(l);
      });
    });

    var secventa = [];
    var secvE = el("div", "arb-secv", "—");
    noduri.forEach(function(n){
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "nod-arb");
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", n.x); c.setAttribute("cy", n.y); c.setAttribute("r", "22");
      var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", n.x); t.setAttribute("y", n.y);
      t.textContent = n.v;
      var badge = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badge.setAttribute("x", n.x + 20); badge.setAttribute("y", n.y - 20);
      badge.setAttribute("style", "font-size:11px;fill:var(--accent);font-weight:700");
      g.appendChild(c); g.appendChild(t); g.appendChild(badge);
      g.addEventListener("click", function(){
        if(secventa.indexOf(n.v) >= 0) return;
        secventa.push(n.v);
        g.classList.add("ales");
        badge.textContent = String(secventa.length);
        arata(); MINIJOC._refresh();
      });
      n.el = g; n.badge = badge;
      svg.appendChild(g);
    });
    corp.appendChild(svg);
    corp.appendChild(secvE);

    var but = el("div", "stiva-but");
    var bUndo = el("button", "btn", "↶ Înapoi un pas");
    var bReset = el("button", "btn", "↻ Reset");
    but.appendChild(bUndo); but.appendChild(bReset);
    corp.appendChild(but);

    function arata(){ secvE.textContent = secventa.length ? secventa.join(" → ") : "—"; }
    function sterge(v){
      noduri.forEach(function(n){
        if(n.v === v){ n.el.classList.remove("ales"); n.badge.textContent = ""; }
      });
    }
    bUndo.addEventListener("click", function(){
      var v = secventa.pop(); if(v != null) sterge(v);
      // re-numerotăm badge-urile
      noduri.forEach(function(n){
        var k = secventa.indexOf(n.v);
        n.badge.textContent = k >= 0 ? String(k + 1) : "";
      });
      arata(); MINIJOC._refresh();
    });
    bReset.addEventListener("click", function(){
      secventa = [];
      noduri.forEach(function(n){ n.el.classList.remove("ales"); n.badge.textContent = ""; });
      arata(); MINIJOC._refresh();
    });

    return {
      raspuns: function(){ return secventa.length === noduri.length ? { secventa: secventa.slice() } : null; },
      reset: function(){ bReset.click(); }
    };
  }

  // ------------------------------------------------ 6. SORTARE (o trecere)
  function buildSortare(corp, spec){
    var valori, i, terminat;
    var rand = el("div", "sort-rand");
    var info = el("div", null, "");
    info.style.cssText = "text-align:center;font-size:14px;color:var(--muted);min-height:22px";
    var but = el("div", "stiva-but");
    var bSwap = el("button", "btn prim", "🔁 Interschimbă");
    var bLasa = el("button", "btn", "✓ Lasă așa");
    var bReset = el("button", "btn", "↻ Reset");
    but.appendChild(bSwap); but.appendChild(bLasa); but.appendChild(bReset);
    corp.appendChild(rand); corp.appendChild(info); corp.appendChild(but);

    function reset(){
      valori = spec.valori.slice(); i = 0; terminat = false;
      randeaza(); MINIJOC._refresh();
    }
    function randeaza(){
      rand.innerHTML = "";
      valori.forEach(function(v, k){
        var c = el("div", "sort-el", String(v));
        if(!terminat && (k === i || k === i + 1)) c.classList.add("cmp");
        if(terminat) c.classList.add("gataa");
        rand.appendChild(c);
      });
      if(terminat){
        info.textContent = "Trecerea s-a încheiat — trimite rezultatul.";
        bSwap.disabled = true; bLasa.disabled = true;
      } else {
        info.textContent = "Compar pozițiile " + (i + 1) + " și " + (i + 2) + ": " + valori[i] + " față de " + valori[i + 1];
        bSwap.disabled = false; bLasa.disabled = false;
      }
    }
    function avanseaza(){
      i++;
      if(i >= valori.length - 1) terminat = true;
      randeaza(); MINIJOC._refresh();
    }
    bSwap.addEventListener("click", function(){
      var t = valori[i]; valori[i] = valori[i + 1]; valori[i + 1] = t;
      avanseaza();
    });
    bLasa.addEventListener("click", avanseaza);
    bReset.addEventListener("click", reset);
    reset();

    return {
      raspuns: function(){ return terminat ? { rezultat: valori.slice() } : null; },
      reset: reset
    };
  }

  // ------------------------------------------------ 7. STĂRI (diagrama)
  function buildStari(corp, spec){
    var W = 660, HH = 400;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + HH);
    svg.setAttribute("class", "svg-cutie");

    // nodurile pe o elipsă
    var n = spec.noduri.length;
    var cx = W / 2, cy = HH / 2, rx = W * 0.36, ry = HH * 0.33;
    var poz = {};
    spec.noduri.forEach(function(nume, i){
      var a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      poz[nume] = { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    });

    // săgeată cu vârf
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = '<marker id="varf" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">' +
                     '<path d="M0 0 L9 4.5 L0 9 z" fill="var(--muted)"/></marker>';
    svg.appendChild(defs);

    var NW = 108, NH = 34;
    var alegeri = spec.sageti.map(function(){ return null; });   // sageata -> idxEticheta
    var slotEls = [], activ = null;

    // există și săgeata inversă? => curbează în sensuri opuse
    function areInvers(s){
      return spec.sageti.some(function(o){ return o.de === s.la && o.la === s.de; });
    }

    spec.sageti.forEach(function(s, k){
      var A = poz[s.de], B = poz[s.la];
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      var dx = B.x - A.x, dy = B.y - A.y;
      var len = Math.hypot(dx, dy) || 1;
      var off = areInvers(s) ? 34 : 16;
      var px = -dy / len * off, py = dx / len * off;
      var cxq = mx + px, cyq = my + py;
      // scurtăm capetele ca săgeata să nu intre în casete
      var t1 = 0.16, t2 = 0.84;
      function punct(t){
        var x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * cxq + t * t * B.x;
        var y = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * cyq + t * t * B.y;
        return { x: x, y: y };
      }
      var P1 = punct(t1), P2 = punct(t2), M = punct(0.5);
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M" + P1.x + " " + P1.y + " Q" + cxq + " " + cyq + " " + P2.x + " " + P2.y);
      path.setAttribute("stroke", "var(--muted)"); path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none"); path.setAttribute("marker-end", "url(#varf)");
      svg.appendChild(path);

      // căsuța de etichetă pe mijlocul curbei
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "sag-slot gol");
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      var BW = 128, BH = 24;
      r.setAttribute("x", M.x - BW / 2); r.setAttribute("y", M.y - BH / 2);
      r.setAttribute("width", BW); r.setAttribute("height", BH); r.setAttribute("rx", "6");
      var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", M.x); t.setAttribute("y", M.y + 1);
      t.textContent = "···";
      g.appendChild(r); g.appendChild(t);
      g.addEventListener("click", function(){
        if(alegeri[k] != null){                    // golește
          alegeri[k] = null; activ = k;
        } else {
          activ = (activ === k) ? null : k;
        }
        randeaza(); MINIJOC._refresh();
      });
      svg.appendChild(g);
      slotEls.push({ g: g, t: t });
    });

    // nodurile (peste săgeți)
    spec.noduri.forEach(function(nume){
      var P = poz[nume];
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", P.x - NW / 2); r.setAttribute("y", P.y - NH / 2);
      r.setAttribute("width", NW); r.setAttribute("height", NH); r.setAttribute("rx", "9");
      r.setAttribute("fill", "var(--panel2)"); r.setAttribute("stroke", "var(--accent)");
      r.setAttribute("stroke-width", "2");
      var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", P.x); t.setAttribute("y", P.y + 1);
      t.setAttribute("style", "fill:var(--ink);font-weight:700;font-size:13px;text-anchor:middle;dominant-baseline:central");
      t.textContent = nume;
      g.appendChild(r); g.appendChild(t);
      svg.appendChild(g);
    });

    corp.appendChild(svg);
    var rez = el("div", "rezervor");
    var chipEls = [];
    spec.etichete.forEach(function(txt, i){
      var c = el("div", "chip", esc(txt));
      c.addEventListener("click", function(){
        if(c.classList.contains("folosit")) return;
        var tinta = activ != null ? activ : alegeri.indexOf(null);
        if(tinta < 0 || alegeri[tinta] != null) return;
        alegeri[tinta] = i; activ = null;
        randeaza(); MINIJOC._refresh();
      });
      rez.appendChild(c); chipEls.push(c);
    });
    corp.appendChild(rez);

    function randeaza(){
      slotEls.forEach(function(s, k){
        var idx = alegeri[k];
        s.g.setAttribute("class", "sag-slot" + (idx != null ? " plin" : " gol") + (activ === k ? " activ" : ""));
        s.t.textContent = idx != null ? spec.etichete[idx] : "···";
      });
      chipEls.forEach(function(c, i){
        c.classList.toggle("folosit", alegeri.indexOf(i) >= 0);
      });
    }

    return {
      raspuns: function(){
        return alegeri.every(function(v){ return v != null; }) ? { alegeri: alegeri.slice() } : null;
      },
      reset: function(){
        alegeri = alegeri.map(function(){ return null; }); activ = null;
        randeaza();
      }
    };
  }

  // ------------------------------------------------ 8. SQL (goluri)
  function buildSql(corp, spec){
    var bucati = String(spec.sablon).split("___");
    var nGoluri = bucati.length - 1;
    var alegeri = []; for(var k = 0; k < nGoluri; k++) alegeri.push(null);
    var activ = null;

    var cutie = el("div", "sql-sablon");
    var golEls = [];
    bucati.forEach(function(txt, i){
      cutie.appendChild(document.createTextNode(txt));
      if(i < nGoluri){
        (function(k){
          var g = el("span", "sql-gol", "gol " + (k + 1));
          g.addEventListener("click", function(){
            if(alegeri[k] != null){ alegeri[k] = null; activ = k; }
            else activ = (activ === k) ? null : k;
            randeaza(); MINIJOC._refresh();
          });
          cutie.appendChild(g); golEls.push(g);
        })(i);
      }
    });
    corp.appendChild(cutie);

    var rez = el("div", "rezervor");
    var chipEls = [];
    spec.fragmente.forEach(function(txt, i){
      var c = el("div", "chip", esc(txt));
      c.addEventListener("click", function(){
        if(c.classList.contains("folosit")) return;
        var tinta = activ != null && alegeri[activ] == null ? activ : alegeri.indexOf(null);
        if(tinta < 0) return;
        alegeri[tinta] = i; activ = null;
        randeaza(); MINIJOC._refresh();
      });
      rez.appendChild(c); chipEls.push(c);
    });
    corp.appendChild(rez);

    function randeaza(){
      golEls.forEach(function(g, k){
        var idx = alegeri[k];
        g.className = "sql-gol" + (idx != null ? " plin" : "") + (activ === k ? " activ" : "");
        g.textContent = idx != null ? spec.fragmente[idx] : "gol " + (k + 1);
      });
      chipEls.forEach(function(c, i){ c.classList.toggle("folosit", alegeri.indexOf(i) >= 0); });
    }

    return {
      raspuns: function(){
        return alegeri.every(function(v){ return v != null; }) ? { alegeri: alegeri.slice() } : null;
      },
      reset: function(){
        alegeri = alegeri.map(function(){ return null; }); activ = null;
        randeaza();
      }
    };
  }

  var BUILD = { fire: buildFire, ordonare: buildOrdonare, calibrare: buildCalibrare,
                stiva: buildStiva, arbore: buildArbore, sortare: buildSortare,
                stari: buildStari, sql: buildSql };

  // ---------------------------------------------------------- modalul
  function deschide(task, mat, onSubmit, onRenunta){
    inchide();
    blocat = false;
    var spec = task.spec;
    modal = document.getElementById("modal-task");
    modal.classList.remove("ascuns");
    modal.innerHTML = "";

    var mj = el("div", "mj");
    var cap = el("div", "mj-cap");
    cap.appendChild(el("div", "ic", (mat && mat.icon) || TIP_ICON[task.tip] || "🧩"));
    var titluri = el("div");
    titluri.appendChild(el("div", "t", spec.titlu || TIP_ICON[task.tip]));
    titluri.appendChild(el("div", "sub", ((mat && mat.nume) ? mat.nume + " · " : "") + TIP_CERINTA[task.tip]));
    cap.appendChild(titluri);
    var x = el("button", "inchide", "✕");
    x.addEventListener("click", function(){ onRenunta(); });
    cap.appendChild(x);
    mj.appendChild(cap);

    if(spec.context){
      mj.appendChild(el("div", "mj-context", spec.context));
    }

    var corp = el("div", "mj-corp");
    mj.appendChild(corp);

    var jos = el("div", "mj-jos");
    var fb = el("div", "mj-fb", "");
    var spatiu = el("div", "spatiu");
    var renunta = el("button", "btn", "Renunță");
    renunta.addEventListener("click", function(){ onRenunta(); });
    var trimite = el("button", "btn prim", "Trimite ✓");
    trimite.disabled = true;
    jos.appendChild(fb); jos.appendChild(spatiu); jos.appendChild(renunta); jos.appendChild(trimite);
    mj.appendChild(jos);
    modal.appendChild(mj);

    builder = BUILD[task.tip] ? BUILD[task.tip](corp, spec) : null;
    if(!builder){ onRenunta(); return; }

    curent = {
      mj: mj, fb: fb, trimite: trimite,
      refresh: function(){ trimite.disabled = blocat || !builder.raspuns(); }
    };
    trimite.addEventListener("click", function(){
      var r = builder.raspuns();
      if(!r || blocat) return;
      blocat = true;
      trimite.disabled = true;
      fb.className = "mj-fb"; fb.textContent = "se verifică…";
      onSubmit(r);
    });
    if(window.SFX) SFX.play("usa");
  }

  // verdictul serverului
  function rezultat(ok){
    if(!curent) return;
    blocat = false;
    if(ok){
      curent.fb.className = "mj-fb bine";
      curent.fb.textContent = "✔ Corect! Task rezolvat.";
      curent.trimite.disabled = true;
      if(window.SFX) SFX.play("task");
      setTimeout(inchide, 900);
    } else {
      curent.fb.className = "mj-fb rau";
      curent.fb.textContent = "✘ Greșit — mai încearcă.";
      curent.mj.classList.remove("scutura");
      void curent.mj.offsetWidth;               // reset animație
      curent.mj.classList.add("scutura");
      curent.refresh();
    }
  }

  function inchide(){
    if(builder && builder.opreste) builder.opreste();
    builder = null; curent = null;
    var m = document.getElementById("modal-task");
    if(m){ m.classList.add("ascuns"); m.innerHTML = ""; }
  }

  window.MINIJOC = {
    deschide: deschide,
    rezultat: rezultat,
    inchide: inchide,
    _refresh: function(){ if(curent) curent.refresh(); }
  };
})();
