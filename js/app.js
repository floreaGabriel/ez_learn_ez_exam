// ============================================================
//  PSO Trainer — logica aplicatiei
// ============================================================
"use strict";

const ICONS = {
  "Sistem de operare":"🖥️", "Procese":"⚙️", "Memorie":"🧠", "Fire de execuție":"🧵",
  "Semnale":"📡", "Sincronizare":"🔒", "Planificare":"⏱️", "IPC":"🔗", "Sistem de fișiere":"📁"
};

// ---------- Syntax highlight pentru blocuri pre.code ----------
const C_KEYWORDS = ["int","char","void","const","static","struct","class","public","private","protected","return","if","else","for","while","do","unsigned","signed","long","short","float","double","new","delete","virtual","switch","case","break","continue","default","true","false","NULL","sizeof","typedef","union","enum","goto","extern","volatile","register","size_t","pid_t"];
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function highlightCode(text){
  // 1) protejam comentarii/string-uri cu caractere Private Use (imune la restul procesarii)
  const store = [];
  function hold(cls,val){ store.push('<span class="'+cls+'">'+esc(val)+'</span>'); return String.fromCharCode(0xE000 + store.length - 1); }
  let s = text;
  s = s.replace(/\/\*[\s\S]*?\*\//g, function(m){ return hold("tok-com",m); });  // /* bloc */
  s = s.replace(/\/\/[^\n]*/g,       function(m){ return hold("tok-com",m); });  // // linie
  s = s.replace(/"(?:[^"\\]|\\.)*"/g,function(m){ return hold("tok-str",m); });  // "string"
  s = s.replace(/'(?:[^'\\]|\\.)*'/g,function(m){ return hold("tok-str",m); });  // 'c'
  s = s.replace(/^\s*#[^\n]*/gm,     function(m){ return hold("tok-pre",m); });  // #preproc
  s = esc(s);
  // 2) UN SINGUR pass: identificatori (+functii) si numere. Spans inserate NU mai sunt reprocesate.
  s = s.replace(/([A-Za-z_]\w*)([ \t]*\()?|0x[0-9A-Fa-f]+|\b\d+\b/g, function(m, ident, paren){
    if(ident === undefined){ // numar
      return '<span class="tok-num">'+m+'</span>';
    }
    if(C_KEYWORDS.indexOf(ident) >= 0){
      return '<span class="tok-key">'+ident+'</span>'+(paren||"");
    }
    if(paren){ // urmat de '(' => apel/definitie functie
      return '<span class="tok-fn">'+ident+'</span>'+paren;
    }
    return ident;
  });
  // 3) restauram placeholderele
  s = s.replace(/[-]/g, function(ch){ return store[ch.charCodeAt(0) - 0xE000]; });
  return s;
}
function applyHighlight(root){
  root.querySelectorAll("pre.code").forEach(function(pre){
    if(pre.dataset.hl) return;
    pre.dataset.hl = "1";
    pre.innerHTML = highlightCode(pre.textContent);
  });
}

// ============================================================
//  MATERII — registrul materiilor disponibile
// ============================================================
const MATERII = [
  {
    id:"pso", nume:"PSO", icon:"🧠",
    sub:"Programarea Sistemelor de Operare",
    descriere:"Procese, fire de execuție, semafoare, mutex, bariere, deadlock, planificare, semnale și zone de memorie — explicate cu diagrame, plus teste în stilul subiectelor reale ATM.",
    tip:"native"
  },
  {
    id:"retele", nume:"Rețele", icon:"🌐",
    sub:"Headere de rețea",
    descriere:"Headere Ethernet / IP / TCP / UDP / ARP / DHCP — diagrame interactive, exerciții drag & drop, completare câmpuri, analiză de pachete (hexdump) și quiz.",
    tip:"embed", src:"retele/index.html",
    sectiuni:[
      {id:"ref",   nume:"Învață",          icon:"📘"},
      {id:"drag",  nume:"Trage câmpul",    icon:"🧲"},
      {id:"bytes", nume:"Octeți",          icon:"🔢"},
      {id:"write", nume:"Scrie câmpurile", icon:"✍️"},
      {id:"quiz",  nume:"Quiz",            icon:"❓"},
      {id:"hex",   nume:"Analiză pachete", icon:"🔬"}
    ]
  },
  {
    id:"sda", nume:"SDA", icon:"🧮",
    sub:"Structuri de Date și Algoritmi",
    descriere:"Complexitate, liste, arbori BST și AVL, grafuri și Dijkstra, tabele hash, sortări și tehnici (Divide et Impera, Backtracking, Greedy) — plus exerciții rezolvate în stil examen de licență.",
    tip:"embed", src:"sda/index.html",
    sectiuni:[
      {id:"complexitate", nume:"Complexitate",        icon:"📈"},
      {id:"liste",        nume:"Liste & Stive",        icon:"🔗"},
      {id:"bst",          nume:"Arbori BST",           icon:"🌳"},
      {id:"avl",          nume:"Arbori AVL",           icon:"⚖️"},
      {id:"grafuri",      nume:"Grafuri",              icon:"🕸️"},
      {id:"hash",         nume:"Tabele hash",          icon:"#️⃣"},
      {id:"sortari",      nume:"Sortări",              icon:"🔢"},
      {id:"tehnici",      nume:"Tehnici de programare",icon:"🧩"},
      {id:"exercitii",    nume:"Exerciții examen",     icon:"📝"}
    ]
  }
];
function materie(id){ return MATERII.find(function(m){ return m.id===id; }); }

// ============================================================
//  MATERIALE VIDEO — clipuri YouTube pe categorii, per materie
// ============================================================
const VIDEOS = [
  { materie:"PSO", icon:"🧠", items:[
    { cat:"Procese & fork()",            id:"taNzTCO-k3U", titlu:"fork() System Call Explained — demo proces copil & zombie", canal:"OS Tutorial" },
    { cat:"Sincronizare (mutex/semafor)",id:"8wcuLCvMmF8", titlu:"Semaphore vs. Mutex — A Clear Understanding", canal:"Jacob Sorber" },
    { cat:"Deadlock",                    id:"y7DOHyBTWps", titlu:"Deadlock — Operating Systems, Simply Explained", canal:"Kantan Coding" },
    { cat:"Planificare (scheduling)",    id:"zFnrUVqtiOY", titlu:"Process Scheduling Algorithms (Preemptive vs Non-preemptive)", canal:"Gate Smashers" }
  ]},
  { materie:"Rețele", icon:"🌐", items:[
    { cat:"Model OSI & TCP/IP",      id:"3up1FsVRUfE", titlu:"The OSI Model and TCP/IP: Explained", canal:"PowerCert" },
    { cat:"TCP — 3-way handshake",   id:"rmFX1V49K8U", titlu:"How TCP really works — Three-way handshake", canal:"Practical Networking" },
    { cat:"Subnetting",              id:"GSX1GlaznKM", titlu:"Subnetting Made Easy", canal:"Sunny Classroom" },
    { cat:"ARP",                     id:"cn8Zxh9bPio", titlu:"ARP Explained — Address Resolution Protocol", canal:"PowerCert" },
    { cat:"DHCP (DORA)",             id:"4pkDL1pgCgQ", titlu:"DHCP Explained — procesul DORA", canal:"TechTerms" }
  ]},
  { materie:"SDA", icon:"🧮", items:[
    { cat:"Complexitate (Big-O)",  id:"__vX2sjlpXU", titlu:"Big-O notation in 5 minutes — The basics", canal:"Michael Sambol" },
    { cat:"Liste înlănțuite",      id:"N6dOwBde7-M", titlu:"Learn Linked Lists in 13 minutes", canal:"Bro Code" },
    { cat:"Arbori BST",            id:"cySVml6e_Fc", titlu:"Binary Search Trees — Insertion & Deletion", canal:"Jenny's Lectures" },
    { cat:"Arbori AVL",            id:"jDM6_TnYIqE", titlu:"AVL Tree — Insertion and Rotations", canal:"Abdul Bari" },
    { cat:"Grafuri — Dijkstra",    id:"XB4MIexjvY0", titlu:"Dijkstra Algorithm — Single Source Shortest Path", canal:"Abdul Bari" },
    { cat:"Tabele hash",           id:"KyUTuwz_b7Q", titlu:"Hash Tables and Hash Functions", canal:"Computer Science" },
    { cat:"Sortări",               id:"6drK7cVIb84", titlu:"Sorting Algorithms — Bubble, Selection, Insertion, Merge, Quick", canal:"Lapix" }
  ]}
];

// ---------- Temă (dark/light) — la nivel de întreaga aplicație ----------
function currentTheme(){ return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
function applyThemeToFrames(t){
  // iframe-urile (ex. Rețele) sunt cross-origin sub file:// -> comunicăm prin postMessage
  document.querySelectorAll("iframe.embed-frame").forEach(function(f){
    try{ f.contentWindow.postMessage({ type:"theme", theme:t }, "*"); }catch(e){}
  });
}
function applyTheme(t){
  document.documentElement.dataset.theme = t;
  try{ localStorage.setItem("app-theme", t); }catch(e){}
  const btn = document.getElementById("themeToggle");
  if(btn) btn.textContent = t === "light" ? "☀️" : "🌙";
  applyThemeToFrames(t);   // propagă către materiile încărcate în iframe (ex. Rețele)
}
function toggleTheme(){ applyTheme(currentTheme()==="light" ? "dark" : "light"); }

// ---------- Navigatie ----------
function shortTitle(t){ return t.split("—")[0].trim(); }

function buildNav(){
  const nav = document.getElementById("nav");
  let html = ''
    + '<div class="nav-section">'
    + '<div class="nav-item active" data-view="dashboard"><span class="ico">🏠</span> Acasă — Materii</div>'
    + '<div class="nav-item" data-view="videos"><span class="ico">🎬</span> Materiale Video</div>'
    + '</div>';
  MATERII.forEach(function(m){
    html += '<div class="nav-subject" data-subject="'+m.id+'">';
    html += '<div class="nav-subhead" data-subject="'+m.id+'">'
          + '<span class="caret">▸</span><span class="ico">'+m.icon+'</span>'
          + '<span class="nm">'+m.nume+'</span></div>';
    html += '<div class="nav-children">';
    if(m.tip==="native" && m.id==="pso"){
      html += psoNavChildren();
    } else if(m.tip==="embed"){
      m.sectiuni.forEach(function(s){
        html += '<div class="nav-item nav-sub" data-view="embed" data-subject="'+m.id+'" data-sec="'+s.id+'">'
              + '<span class="ico">'+s.icon+'</span> '+s.nume+'</div>';
      });
    }
    html += '</div></div>';
  });
  nav.innerHTML = html;
  wireNav();
}

function psoNavChildren(){
  let html = '<div class="nav-item nav-sub" data-view="quiz"><span class="ico">📝</span> Teste examen</div>';
  const cats = [];
  CONCEPTE.forEach(function(c){ if(cats.indexOf(c.cat)<0) cats.push(c.cat); });
  cats.forEach(function(cat){
    html += '<div class="nav-cat">'+(ICONS[cat]||"📘")+' '+cat+'</div>';
    CONCEPTE.filter(function(c){ return c.cat===cat; }).forEach(function(c){
      html += '<div class="nav-item nav-sub" data-view="concept" data-id="'+c.id+'"><span class="ico">›</span> '+shortTitle(c.titlu)+'</div>';
    });
  });
  return html;
}

function wireNav(){
  const nav = document.getElementById("nav");
  nav.querySelectorAll(".nav-subhead").forEach(function(h){
    h.addEventListener("click", function(){
      const g = h.closest(".nav-subject");
      if(g.classList.contains("expanded")){ g.classList.remove("expanded"); return; }
      openSubject(h.dataset.subject);
    });
  });
  nav.querySelectorAll(".nav-item").forEach(function(it){
    it.addEventListener("click", function(e){
      e.stopPropagation();
      const v = it.dataset.view;
      if(v==="dashboard") showDashboard();
      else if(v==="videos") showVideos();
      else if(v==="quiz") showQuiz();
      else if(v==="concept") showConcept(it.dataset.id);
      else if(v==="embed") showEmbed(it.dataset.subject, it.dataset.sec);
    });
  });
}

// extinde grupul materiei (acordeon) și marchează elementul activ
function setActive(view,id,sec){
  document.querySelectorAll(".nav-item").forEach(function(n){ n.classList.remove("active"); });
  document.querySelectorAll(".nav-subhead").forEach(function(n){ n.classList.remove("active"); });

  let subj = null;
  if(view==="home" || view==="quiz" || view==="concept") subj = "pso";
  else if(view==="embed") subj = id;
  document.querySelectorAll(".nav-subject").forEach(function(g){
    g.classList.toggle("expanded", g.dataset.subject===subj);
  });

  if(view==="dashboard"){
    const el = document.querySelector('.nav-item[data-view="dashboard"]'); if(el) el.classList.add("active");
  } else if(view==="videos"){
    const el = document.querySelector('.nav-item[data-view="videos"]'); if(el) el.classList.add("active");
  } else if(view==="home"){
    const el = document.querySelector('.nav-subhead[data-subject="pso"]'); if(el) el.classList.add("active");
  } else if(view==="quiz"){
    const el = document.querySelector('.nav-item[data-view="quiz"]'); if(el) el.classList.add("active");
  } else if(view==="concept"){
    const el = document.querySelector('.nav-item[data-view="concept"][data-id="'+id+'"]'); if(el) el.classList.add("active");
  } else if(view==="embed"){
    const el = document.querySelector('.nav-item[data-view="embed"][data-subject="'+id+'"][data-sec="'+sec+'"]'); if(el) el.classList.add("active");
  }

  if(view!=="quiz"){ const bar=document.getElementById("scorebar"); if(bar) bar.remove(); }
  window.scrollTo(0,0);
  const cnt = document.querySelector(".content");
  if(cnt){ cnt.classList.toggle("embed", view==="embed"); cnt.classList.toggle("videos", view==="videos"); cnt.scrollTop = 0; }
}

// deschide o materie din dashboard sau din bara laterală
function openSubject(id){
  const m = materie(id);
  if(!m){ showDashboard(); return; }
  if(m.tip==="embed") showEmbed(id, m.sectiuni[0].id);
  else showHome();
}

// ---------- Vederi ----------
function showDashboard(){
  setActive("dashboard");
  document.getElementById("crumb").textContent = "Pregătire licență";
  document.getElementById("title").textContent = "Materii";
  const c = document.getElementById("content");
  c.innerHTML = ''
    + '<div class="hero">'
    + '<h2>Pregătire pentru examenul de licență 🎓</h2>'
    + '<p>Alege o materie pentru a începe. Fiecare materie are propriile lecții și exerciții. Din bara din stânga poți <b>extinde</b> materia care te interesează.</p>'
    + '</div>'
    + '<div class="grid">'
    + MATERII.map(function(m){
        return '<div class="tile feat" onclick="openSubject(\''+m.id+'\')">'
          + '<div class="ico">'+m.icon+'</div>'
          + '<h3>'+m.nume+'</h3>'
          + '<p>'+m.descriere+'</p>'
          + '<span class="cat-tag">'+m.sub+' →</span></div>';
      }).join("")
    + '</div>';
}

function showVideos(){
  setActive("videos");
  document.getElementById("crumb").textContent = "Pregătire licență";
  document.getElementById("title").textContent = "Materiale Video";
  const c = document.getElementById("content");
  let html = ''
    + '<div class="hero">'
    + '<h2>Materiale Video 🎬</h2>'
    + '<p>Clipuri YouTube selectate, care explică vizual conceptele cheie din fiecare materie. Dă play direct aici sau deschide pe YouTube. Grupate pe categorii.</p>'
    + '</div>';
  VIDEOS.forEach(function(grup){
    html += '<h3 class="vid-mat">'+grup.icon+' '+grup.materie+'</h3>';
    html += '<div class="vid-grid">';
    grup.items.forEach(function(v){
      html += '<div class="vid-card">'
        + '<div class="vid-frame"><iframe loading="lazy" src="https://www.youtube.com/embed/'+v.id+'" '
        + 'title="'+v.titlu+'" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
        + '<div class="vid-meta">'
        + '<span class="vid-cat">'+v.cat+'</span>'
        + '<div class="vid-title">'+v.titlu+'</div>'
        + '<a class="vid-yt" href="https://www.youtube.com/watch?v='+v.id+'" target="_blank" rel="noopener">▶ '+(v.canal||"YouTube")+'</a>'
        + '</div></div>';
    });
    html += '</div>';
  });
  c.innerHTML = html;
}

function showHome(){
  setActive("home");
  document.getElementById("crumb").textContent = "Materii · PSO";
  document.getElementById("title").textContent = "PSO — Programarea Sistemelor de Operare";
  const c = document.getElementById("content");
  c.innerHTML = ''
    + '<div class="hero">'
    + '<h2>PSO Trainer 🧠</h2>'
    + '<p>Aplicație de pregătire pentru examenul de licență — <b>Programarea Sistemelor de Operare</b>. Procese, fire de execuție, semafoare, mutex, bariere, deadlock, planificare, semnale și zone de memorie — explicate în detaliu, cu diagrame, plus teste în stilul subiectelor reale ATM.</p>'
    + '</div>'
    + '<div class="grid">'
    + '<div class="tile feat" onclick="showQuiz()"><div class="ico">📝</div><h3>Teste examen</h3>'
    + '<p>'+INTREBARI.length+' întrebări (grile + probleme deschise) din 2020–2024, cu explicații.</p>'
    + '<span class="cat-tag">Începe testul →</span></div>'
    + CONCEPTE.map(function(x){
        return '<div class="tile" onclick="showConcept(\''+x.id+'\')">'
          + '<div class="ico">'+(ICONS[x.cat]||"📘")+'</div>'
          + '<h3>'+shortTitle(x.titlu)+'</h3>'
          + '<p>'+x.rezumat+'</p>'
          + '<span class="cat-tag">'+x.cat+'</span></div>';
      }).join("")
    + '</div>';
}

// materie embed (pagină self-contained încărcată în iframe, ex. Rețele)
function showEmbed(subId, sec){
  const m = materie(subId);
  if(!m || m.tip!=="embed"){ showDashboard(); return; }
  const s = m.sectiuni.find(function(x){ return x.id===sec; }) || m.sectiuni[0];
  sec = s.id;
  setActive("embed", subId, sec);
  document.getElementById("crumb").textContent = "Materii · "+m.nume;
  document.getElementById("title").textContent = m.nume+" — "+m.sub;
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject===subId){
    try{ frame.contentWindow.postMessage({ type:"tab", tab:sec }, "*"); }
    catch(err){ frame.src = m.src+"#"+sec; }
  } else {
    c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
      + 'data-subject="'+subId+'" src="'+m.src+'#'+sec+'" title="'+m.nume+'"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage({ type:"theme", theme:currentTheme() }, "*"); }catch(e){}
    });
  }
}

function showConcept(id){
  const c = CONCEPTE.find(function(x){ return x.id===id; });
  if(!c){ showHome(); return; }
  setActive("concept",id);
  document.getElementById("crumb").textContent = "Concepte · "+c.cat;
  document.getElementById("title").textContent = shortTitle(c.titlu);
  const el = document.getElementById("content");
  el.innerHTML = '<article class="article">'+c.html+'</article>'+conceptNav(id);
  applyHighlight(el);
}

function conceptNav(id){
  const idx = CONCEPTE.findIndex(function(x){ return x.id===id; });
  const prev = CONCEPTE[idx-1], next = CONCEPTE[idx+1];
  let out = '<div class="btn-row" style="margin-top:34px; justify-content:space-between">';
  out += prev ? '<button class="btn ghost" onclick="showConcept(\''+prev.id+'\')">← '+shortTitle(prev.titlu)+'</button>' : '<span></span>';
  out += next ? '<button class="btn" onclick="showConcept(\''+next.id+'\')">'+shortTitle(next.titlu)+' →</button>'
              : '<button class="btn" onclick="showQuiz()">Testează-te →</button>';
  out += '</div>';
  return out;
}

// ---------- Init ----------
window.addEventListener("DOMContentLoaded", function(){
  applyTheme(currentTheme());
  buildNav();
  showDashboard();
});
