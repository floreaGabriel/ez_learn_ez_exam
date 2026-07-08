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
    descriere:"Procese, fire de execuție, semafoare, mutex, bariere, deadlock, planificare, semnale și zone de memorie — explicate cu diagrame, plus 14 simulatoare vizuale pas-cu-pas și teste în stilul subiectelor reale ATM.",
    tip:"native"
  },
  {
    id:"retele", nume:"Rețele", icon:"🌐",
    sub:"Headere de rețea",
    descriere:"Headere Ethernet / IP / TCP / UDP / ARP / DHCP — diagrame interactive, exerciții drag & drop, completare câmpuri, analiză de pachete (hexdump) și quiz.",
    tip:"embed", src:"retele/index.html",
    sectiuni:[
      {id:"ref",     nume:"Învață",                  icon:"📘"},
      {id:"harta",   nume:"Rețelistan 🗺️",           icon:"🎮"},
      {id:"osi",     nume:"OSI & TCP/IP",            icon:"📚"},
      {id:"porturi", nume:"Porturi & servicii",      icon:"🔌"},
      {id:"anatomy", nume:"Anatomie pe biți",        icon:"🧬"},
      {id:"journey", nume:"Călătoria pachetului",    icon:"🎬"},
      {id:"tcpseq",  nume:"Transmisia TCP",           icon:"🤝"},
      {id:"dhcp",    nume:"DHCP (DORA)",              icon:"🆔"},
      {id:"ipclase", nume:"Clase & adrese IP",        icon:"🏷️"},
      {id:"subnet",  nume:"Subnetizare",             icon:"🧮"},
      {id:"drag",  nume:"Trage câmpul",    icon:"🧲"},
      {id:"tryhard", nume:"Trage câmpul TRYHARD", icon:"🛠️"},
      {id:"bytes", nume:"Octeți",          icon:"🔢"},
      {id:"write", nume:"Scrie câmpurile", icon:"✍️"},
      {id:"quiz",  nume:"Quiz",            icon:"❓"},
      {id:"hex",   nume:"Analiză pachete", icon:"🔬"},
      {id:"exercitii", nume:"Exerciții examen", icon:"📝"},
      {id:"salvate",   nume:"Probleme salvate", icon:"🔖"}
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
  },
  {
    id:"arhitecturi", nume:"Arhitecturi", icon:"🖥️",
    sub:"Arhitectura sistemelor de calcul",
    descriere:"Cursurile 3–5: moduri de operare IA-32 (real/protejat), gestionarea memoriei (segmentare, paginare, swapping), ierarhia memoriei și memoria cache (mapare directă / asociativă / pe seturi), CPU, codificarea instrucțiunilor x86 (8086) și pipelining cu predicția salturilor — concepte explicate cu diagrame SVG și toate problemele din cursuri, rezolvate pas cu pas.",
    tip:"embed", src:"arhitecturi/index.html",
    sectiuni:[
      {id:"c3",     nume:"C3 · Moduri & Memorie",   icon:"🧠"},
      {id:"c4",     nume:"C4 · Memoria & Cache",     icon:"💾"},
      {id:"c5",     nume:"C5 · CPU & Pipelining",    icon:"⚙️"}
    ]
  },
  {
    id:"sql", nume:"SQL", icon:"🗄️",
    sub:"Baze de date — interogări",
    descriere:"Interogări SQL în SQL Server / T-SQL (ca în laboratoare, baza Northwind): SELECT/JOIN în lanț, semantica NULL, LIKE cu clase de caractere, GROUP BY/HAVING, TOP/agregări — 5 scenarii rezolvate complet (a–i), exerciții de antrenament și 4 jocuri (quiz, construiește interogarea, găsește capcana, funcții T-SQL).",
    tip:"embed", src:"sql/index.html",
    sectiuni:[
      {id:"ref",       nume:"Învață",                  icon:"📘"},
      {id:"scenarii",  nume:"Scenarii rezolvate",      icon:"📚"},
      {id:"exercitii", nume:"Exerciții",               icon:"📝"},
      {id:"quiz",      nume:"Quiz",                     icon:"❓"},
      {id:"build",     nume:"Construiește interogarea", icon:"🧩"},
      {id:"capcana",   nume:"Găsește capcana",          icon:"🪤"},
      {id:"match",     nume:"Funcții T-SQL",            icon:"🔁"}
    ]
  },
  {
    id:"oop", nume:"OOP C++", icon:"🧩",
    sub:"Programare orientată pe obiecte (C++)",
    descriere:"Cursul complet de OOP în C++ după programa de facultate, capitol cu capitol: de la clase, constructori și destructori la moștenire, polimorfism (metode virtuale, vtable), supraîncărcarea operatorilor, template-uri, STL, excepții și C++11. Fiecare concept-cheie are un joculeț conceptual integrat — cod în stânga, ce se întâmplă și de ce în dreapta, pas cu pas — plus exerciții de tip examen.",
    tip:"embed", src:"oop/index.html",
    sectiuni:[
      {id:"elemente-introductive",   nume:"1 · Introductiv",                icon:"📘"},
      {id:"clase-obiecte",           nume:"2 · Clase & obiecte",            icon:"🧱"},
      {id:"constructori-destructori",nume:"3 · Constructori & destructori", icon:"🏗️"},
      {id:"statice-friend",          nume:"4 · Statice & friend",           icon:"🔗"},
      {id:"mostenire-1",             nume:"5 · Moștenire (1)",              icon:"🧬"},
      {id:"mostenire-2",             nume:"6 · Moștenire (2)",              icon:"🌿"},
      {id:"polimorfism",             nume:"7 · Polimorfism",                icon:"🎭"},
      {id:"operatori",               nume:"8 · Operatori",                  icon:"➕"},
      {id:"template",                nume:"9 · Template",                   icon:"🧩"},
      {id:"stl",                     nume:"10 · STL",                       icon:"📦"},
      {id:"exceptii",                nume:"12 · Excepții",                  icon:"🚨"},
      {id:"cpp11",                   nume:"13 · C++11",                     icon:"✨"},
      {id:"exercitii",               nume:"Exerciții & quiz",               icon:"📝"}
    ]
  },
  {
    id:"subiecte", nume:"Subiecte Generate", icon:"📄",
    sub:"Modele de examen de licență",
    descriere:"Modele complete de examen (3 subiecte / 3 ore) generate în stilul subiectelor reale ATM 2017–2024 și pe baza cursurilor: Programare/OOP/SDA + o problemă de arhitecturi, Rețele & protocoale, Baze de date și PSO (cod lung + întrebări, formatul 2024). Fiecare subiect are rezolvarea/baremul ascuns, pentru autoevaluare.",
    tip:"native"
  }
];
function materie(id){ return MATERII.find(function(m){ return m.id===id; }); }

// ============================================================
//  MATERIALE VIDEO — clipuri YouTube pe categorii, per materie
// ============================================================
const VIDEOS = [
  { materie:"PSO", icon:"🧠", items:[
    { cat:"Procese & fork()",            id:"cex9XrZCU14", start:23, titlu:"fork() — crearea proceselor în C", canal:"YouTube" },
    { cat:"Stări proces",                id:"2dJdHMpCLIg", titlu:"Stările unui proces (process states)", canal:"YouTube" },
    { cat:"Fire de execuție (threads)",  id:"M9HHWFp84f0", titlu:"Threads — fire de execuție", canal:"YouTube" },
    { cat:"Memorie partajată",           id:"Y2mDwW2pMv4", titlu:"Shared memory — memorie partajată între procese", canal:"YouTube" },
    { cat:"Pipe-uri (IPC tată-fiu)",     id:"Mqb2dVRe0uo", titlu:"Pipes — comunicare inter-proces în C", canal:"YouTube" },
    { cat:"Sincronizare (mutex/semafor)",id:"kd8b9Fr0Xbo", titlu:"Mutex vs Semaphore în C++", canal:"YouTube" },
    { cat:"Deadlock",                    id:"y7DOHyBTWps", titlu:"Deadlock — Operating Systems, Simply Explained", canal:"Kantan Coding" },
    { cat:"Planificare (scheduling)",    id:"zFnrUVqtiOY", titlu:"Process Scheduling Algorithms (Preemptive vs Non-preemptive)", canal:"Gate Smashers" }
  ]},
  { materie:"Rețele", icon:"🌐", items:[
    { cat:"Model OSI & TCP/IP",      id:"3up1FsVRUfE", titlu:"The OSI Model and TCP/IP: Explained", canal:"PowerCert" },
    { cat:"TCP — 3-way handshake",   id:"F27PLin3TV0", titlu:"TCP — stabilirea conexiunii (3-way handshake)", canal:"YouTube" },
    { cat:"Subnetting",              id:"nFYilGQ-p-8", titlu:"Subnetting explicat", canal:"YouTube" },
    { cat:"ARP",                     id:"cn8Zxh9bPio", titlu:"ARP Explained — Address Resolution Protocol", canal:"PowerCert" },
    { cat:"DHCP (DORA)",             id:"kS42C3vqFco", titlu:"DHCP — procesul DORA", canal:"YouTube" }
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

// Clipul atașat fiecărei lecții PSO (apare în pagina conceptului)
const CONCEPT_VIDEOS = {
  fork:        { id:"cex9XrZCU14", start:23 },
  stari:       { id:"2dJdHMpCLIg" },
  fire:        { id:"M9HHWFp84f0" },
  ipc:         { id:"Y2mDwW2pMv4" },
  mutex:       { id:"kd8b9Fr0Xbo" },
  deadlock:    { id:"y7DOHyBTWps" },
  planificare: { id:"zFnrUVqtiOY" },
  pipe:        { id:"Mqb2dVRe0uo" }
};
// Simulatoarele PSO atașate fiecărei lecții (butoane „Deschide simulatorul”).
// Valoarea s = id-ul simulatorului din pso/index.html, opțional cu /scenariu.
const CONCEPT_SIMS = {
  intro:              [{s:"syscall",       t:"🖥️ Apelul de sistem: user ↔ kernel"}],
  procese:            [{s:"fork",          t:"🌳 fork() și arborele de procese"},
                       {s:"stari",         t:"🔄 Stările unui proces"}],
  stari:              [{s:"stari",         t:"🔄 Stările procesului & context switch"}],
  fork:               [{s:"fork",          t:"🌳 fork() și arborele de procese"},
                       {s:"cow",           t:"🐑 Copy-On-Write după fork()"}],
  "exec-wait":        [{s:"fork/zombie",   t:"🌳 Zombie & orfan, pas cu pas"}],
  memorie:            [{s:"vas",           t:"🧠 Zonele de memorie (subiect 2023)"}],
  "gestiune-memorie": [{s:"paginare",      t:"📄 Paginare & TLB: translatarea adreselor"}],
  "memorie-virtuala": [{s:"pagerepl",      t:"🔁 Înlocuirea paginilor (FIFO/LRU/OPT/Clock)"},
                       {s:"cow",           t:"🐑 Copy-On-Write"}],
  fire:               [{s:"threads",       t:"🧵 Threaduri vs procese & lost update"}],
  semnale:            [{s:"semnale",       t:"⚡ SIGINT & handlere (subiect 2022)"}],
  race:               [{s:"race",          t:"🎛️ Explorator de întrețeseri"},
                       {s:"threads/lost",  t:"🧵 contor++ pierdut"}],
  mutex:              [{s:"threads/lost",  t:"🧵 contor++ cu și fără mutex"},
                       {s:"race/mutex",    t:"🎛️ întrețeseri cu mutex"}],
  semafoare:          [{s:"prodcons",      t:"🚦 Producător–Consumator cu semafoare"},
                       {s:"race",          t:"🎛️ Explorator de întrețeseri"}],
  "condvar-bariere":  [{s:"prodcons",      t:"🚦 Producător–Consumator (bounded buffer)"}],
  deadlock:           [{s:"deadlock",      t:"🔒 Deadlock & condițiile Coffman"}],
  prodcons:           [{s:"prodcons",      t:"🚦 Tava de pizza: P/V pe goluri & pline"}],
  ipc:                [{s:"vas/mmap",      t:"🧠 mmap partajat (subiect 2024)"},
                       {s:"fd/pipe",       t:"🗂️ Pipe & descriptori"}],
  pipe:               [{s:"fd/pipe",       t:"🗂️ Pipe: schema din subiectul 2019"}],
  fisiere:            [{s:"fd",            t:"🗂️ Descriptorii: cele 3 tabele"}],
  planificare:        [{s:"gantt",         t:"⏱️ Planificator Gantt interactiv"}],
  "round-robin":      [{s:"gantt/subiect", t:"⏱️ RR pe priorități (2020/2022/2023)"}]
};
function conceptSimsHtml(id){
  const sims = CONCEPT_SIMS[id];
  if(!sims || !sims.length) return "";
  return '<h2>🎮 Vezi conceptul în mișcare</h2>'
    + '<p>Simulatoare interactive, pas cu pas — cu scenariile din subiectele reale:</p>'
    + '<div class="btn-row">'
    + sims.map(function(x){
        return '<button class="btn" onclick="showSimLab(\'sim/'+x.s+'\')">'+x.t+' →</button>';
      }).join("")
    + '</div>';
}

function conceptVideoHtml(id){
  const v = CONCEPT_VIDEOS[id];
  if(!v) return "";
  const embed = "https://www.youtube.com/embed/"+v.id+(v.start?"?start="+v.start:"");
  const watch = "https://www.youtube.com/watch?v="+v.id+(v.start?"&t="+v.start+"s":"");
  return '<h2>📺 Video explicativ</h2>'
    + '<div class="video"><iframe loading="lazy" src="'+embed+'" title="Video explicativ" '
    + 'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
    + '<p class="vid-fallback">Nu pornește în pagină? <a href="'+watch+'" target="_blank" rel="noopener">Deschide pe YouTube</a></p>';
}

// ---------- Temă ----------
// Logica de teme (selector 100+, dark/light, propagare în iframe-uri) este în
// js/theme.js, care expune: applyThemeById, toggleTheme, currentTheme,
// openThemePicker și frameThemeMsg (folosit mai jos la încărcarea iframe-urilor).

// ---------- Navigatie ----------
function shortTitle(t){ return t.split("—")[0].trim(); }

function buildNav(){
  const nav = document.getElementById("nav");
  let html = ''
    + '<div class="nav-section">'
    + '<div class="nav-item active" data-view="dashboard"><span class="ico">🏠</span> Acasă — Materii</div>'
    + '<div class="nav-item" data-view="videos"><span class="ico">🎬</span> Materiale Video</div>'
    + '<div class="nav-item" data-view="conquistador"><span class="ico">⚔️</span> Joacă cu prietenii</div>'
    + '<div class="nav-item" data-view="amongus"><span class="ico">🛸</span> Among Us CS</div>'
    + '<div class="nav-item" data-view="salvate"><span class="ico">⭐</span> Probleme salvate'
    +   '<span id="salvateBadge" style="display:none; margin-left:auto; font-size:11px; font-weight:700; color:var(--accent,#e9b143); background:color-mix(in srgb,var(--accent,#e9b143) 16%,transparent); border-radius:20px; padding:1px 8px"></span></div>'
    + '</div>';
  MATERII.forEach(function(m){
    html += '<div class="nav-subject" data-subject="'+m.id+'">';
    html += '<div class="nav-subhead" data-subject="'+m.id+'">'
          + '<span class="caret">▸</span><span class="ico">'+m.icon+'</span>'
          + '<span class="nm">'+m.nume+'</span></div>';
    html += '<div class="nav-children">';
    if(m.tip==="native" && m.id==="pso"){
      html += psoNavChildren();
    } else if(m.tip==="native" && m.id==="subiecte"){
      html += subiecteNavChildren();
    } else if(m.tip==="embed"){
      m.sectiuni.forEach(function(s){
        html += '<div class="nav-item nav-sub" data-view="embed" data-subject="'+m.id+'" data-sec="'+s.id+'">'
              + '<span class="ico">'+s.icon+'</span> '+s.nume+'</div>';
      });
      if(m.id==="oop"){   // subiectele generate C & C++ (protejate cu parolă)
        html += '<div class="nav-item nav-sub" data-view="oopsub"><span class="ico">🔐</span> Subiecte examen</div>';
      }
      if(m.id==="sda"){   // subiectele generate SDA (protejate cu parolă)
        html += '<div class="nav-item nav-sub" data-view="sdasub"><span class="ico">🔐</span> Subiecte examen</div>';
      }
    }
    html += '</div></div>';
  });
  nav.innerHTML = html;
  wireNav();
  updateSalvateBadge();
}

function psoNavChildren(){
  let html = '<div class="nav-item nav-sub" data-view="quiz"><span class="ico">📝</span> Teste examen</div>';
  html += '<div class="nav-item nav-sub" data-view="simlab"><span class="ico">🎮</span> Simulatoare</div>';
  html += '<div class="nav-item nav-sub" data-view="psosub"><span class="ico">🔐</span> Subiecte examen</div>';
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

function subiecteNavChildren(){
  let html = '<div class="nav-item nav-sub" data-view="examindex"><span class="ico">🗂️</span> Toate modelele</div>';
  html += '<div class="nav-cat">📄 Modele de examen</div>';
  SUBIECTE.forEach(function(x){
    html += '<div class="nav-item nav-sub" data-view="exam" data-id="'+x.id+'">'
          + '<span class="ico">›</span> '+x.navTitlu+'</div>';
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
      else if(v==="conquistador") showConquistador();
      else if(v==="amongus") showAmongUs();
      else if(v==="quiz") showQuiz();
      else if(v==="simlab") showSimLab();
      else if(v==="psosub") showPsoSub();
      else if(v==="oopsub") showOopSub();
      else if(v==="sdasub") showSdaSub();
      else if(v==="salvate") showSalvate();
      else if(v==="concept") showConcept(it.dataset.id);
      else if(v==="exam") showExam(it.dataset.id);
      else if(v==="examindex") showExamIndex();
      else if(v==="embed") showEmbed(it.dataset.subject, it.dataset.sec);
      closeSidebar();   // pe mobil, închide drawer-ul după ce alegi ceva
    });
  });
}

// ---------- Bară laterală ----------
// Pe mobil (≤860px): drawer glisant (clasa "nav-open").
// Pe desktop: se poate restrânge/extinde (clasa "sidebar-collapsed"), stare salvată.
function isMobileNav(){ return window.matchMedia("(max-width:860px)").matches; }

function openSidebar(){ document.body.classList.add("nav-open"); var t=document.getElementById("navToggle"); if(t) t.setAttribute("aria-expanded","true"); }
function closeSidebar(){ document.body.classList.remove("nav-open"); var t=document.getElementById("navToggle"); if(t) t.setAttribute("aria-expanded","false"); }

function setSidebarCollapsed(collapsed){
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  var t=document.getElementById("navToggle"); if(t) t.setAttribute("aria-expanded", collapsed ? "false" : "true");
  try{ localStorage.setItem("app-sidebar-collapsed", collapsed ? "1" : "0"); }catch(e){}
}

function toggleSidebar(){
  if(isMobileNav())
    document.body.classList.contains("nav-open") ? closeSidebar() : openSidebar();
  else
    setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
}

// La pornire: reaplică starea salvată (relevant doar pe desktop; pe mobil clasa nu afectează drawerul)
function initSidebar(){
  try{ if(localStorage.getItem("app-sidebar-collapsed")==="1") document.body.classList.add("sidebar-collapsed"); }catch(e){}
  var t=document.getElementById("navToggle");
  if(t && !isMobileNav()) t.setAttribute("aria-expanded", document.body.classList.contains("sidebar-collapsed") ? "false" : "true");
}

document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeSidebar(); });

// extinde grupul materiei (acordeon) și marchează elementul activ
function setActive(view,id,sec){
  document.querySelectorAll(".nav-item").forEach(function(n){ n.classList.remove("active"); });
  document.querySelectorAll(".nav-subhead").forEach(function(n){ n.classList.remove("active"); });

  let subj = null;
  if(view==="home" || view==="quiz" || view==="concept" || view==="simlab" || view==="psosub") subj = "pso";
  else if(view==="oopsub") subj = "oop";
  else if(view==="sdasub") subj = "sda";
  else if(view==="exam" || view==="examindex") subj = "subiecte";
  else if(view==="embed") subj = id;
  document.querySelectorAll(".nav-subject").forEach(function(g){
    g.classList.toggle("expanded", g.dataset.subject===subj);
  });

  if(view==="dashboard"){
    const el = document.querySelector('.nav-item[data-view="dashboard"]'); if(el) el.classList.add("active");
  } else if(view==="videos"){
    const el = document.querySelector('.nav-item[data-view="videos"]'); if(el) el.classList.add("active");
  } else if(view==="conquistador"){
    const el = document.querySelector('.nav-item[data-view="conquistador"]'); if(el) el.classList.add("active");
  } else if(view==="amongus"){
    const el = document.querySelector('.nav-item[data-view="amongus"]'); if(el) el.classList.add("active");
  } else if(view==="salvate"){
    const el = document.querySelector('.nav-item[data-view="salvate"]'); if(el) el.classList.add("active");
  } else if(view==="home"){
    const el = document.querySelector('.nav-subhead[data-subject="pso"]'); if(el) el.classList.add("active");
  } else if(view==="quiz"){
    const el = document.querySelector('.nav-item[data-view="quiz"]'); if(el) el.classList.add("active");
  } else if(view==="simlab"){
    const el = document.querySelector('.nav-item[data-view="simlab"]'); if(el) el.classList.add("active");
  } else if(view==="psosub"){
    const el = document.querySelector('.nav-item[data-view="psosub"]'); if(el) el.classList.add("active");
  } else if(view==="oopsub"){
    const el = document.querySelector('.nav-item[data-view="oopsub"]'); if(el) el.classList.add("active");
  } else if(view==="sdasub"){
    const el = document.querySelector('.nav-item[data-view="sdasub"]'); if(el) el.classList.add("active");
  } else if(view==="concept"){
    const el = document.querySelector('.nav-item[data-view="concept"][data-id="'+id+'"]'); if(el) el.classList.add("active");
  } else if(view==="embed"){
    const el = document.querySelector('.nav-item[data-view="embed"][data-subject="'+id+'"][data-sec="'+sec+'"]'); if(el) el.classList.add("active");
  } else if(view==="exam"){
    const el = document.querySelector('.nav-item[data-view="exam"][data-id="'+id+'"]'); if(el) el.classList.add("active");
  } else if(view==="examindex"){
    const el = document.querySelector('.nav-item[data-view="examindex"]'); if(el) el.classList.add("active");
  }

  if(view!=="quiz"){ const bar=document.getElementById("scorebar"); if(bar) bar.remove(); }
  window.scrollTo(0,0);
  const cnt = document.querySelector(".content");
  if(cnt){ cnt.classList.toggle("embed", view==="embed" || view==="simlab" || view==="psosub" || view==="oopsub" || view==="sdasub" || view==="salvate" || view==="amongus"); cnt.classList.toggle("videos", view==="videos"); cnt.scrollTop = 0;
    if(view!=="conquistador") delete cnt.dataset.view;   // ca mesajele WS întârziate să nu rescrie altă vedere
  }
}

// deschide o materie din dashboard sau din bara laterală
function openSubject(id){
  const m = materie(id);
  if(!m){ showDashboard(); return; }
  if(m.tip==="embed") showEmbed(id, m.sectiuni[0].id);
  else if(m.id==="subiecte") showExamIndex();
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
      const embed = "https://www.youtube.com/embed/"+v.id+(v.start?"?start="+v.start:"");
      const watch = "https://www.youtube.com/watch?v="+v.id+(v.start?"&t="+v.start+"s":"");
      html += '<div class="vid-card">'
        + '<div class="vid-frame"><iframe loading="lazy" src="'+embed+'" '
        + 'title="'+v.titlu+'" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
        + '<div class="vid-meta">'
        + '<span class="vid-cat">'+v.cat+'</span>'
        + '<div class="vid-title">'+v.titlu+'</div>'
        + '<a class="vid-yt" href="'+watch+'" target="_blank" rel="noopener">▶ '+(v.canal||"YouTube")+'</a>'
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
    + '<div class="tile feat" onclick="showSimLab()"><div class="ico">🎮</div><h3>Simulatoare vizuale</h3>'
    + '<p>14 simulatoare interactive, pas cu pas: fork & arborele de procese, semafoare și producător–consumator, planificare Gantt, memoria procesului, descriptori & pipe, semnale — cu scenariile din subiectele reale.</p>'
    + '<span class="cat-tag">Deschide laboratorul →</span></div>'
    + '<div class="tile feat" onclick="showPsoSub()"><div class="ico">🔐</div><h3>Subiecte examen (protejat)</h3>'
    + '<p>10 variante generate în formatul subiectului PSO din 2024: cod C concurent + 6 întrebări justificate, cu rezolvări detaliate și barem. Conținut criptat — se deblochează cu parolă.</p>'
    + '<span class="cat-tag">Deblochează →</span></div>'
    + CONCEPTE.map(function(x){
        return '<div class="tile" onclick="showConcept(\''+x.id+'\')">'
          + '<div class="ico">'+(ICONS[x.cat]||"📘")+'</div>'
          + '<h3>'+shortTitle(x.titlu)+'</h3>'
          + '<p>'+x.rezumat+'</p>'
          + '<span class="cat-tag">'+x.cat+'</span></div>';
      }).join("")
    + '</div>';
}

// Versiune a aplicației (definită mai jos, lângă jurnalul UPDATES). O punem ca
// „?v=" pe URL-urile iframe-urilor: când versiunea se schimbă (feature nou),
// browserul e obligat să reîncarce pagina embed (nu mai servește din cache/bfcache
// o versiune veche — cauza „am adăugat ceva și nu apărea"). embSrc citește
// APP_VER la momentul apelului (runtime), deci ordinea declarării nu contează.
function embSrc(path){
  var hash = "", p = path, i = path.indexOf("#");
  if(i >= 0){ hash = path.slice(i); p = path.slice(0, i); }
  var v = (typeof APP_VER !== "undefined") ? APP_VER : "1";
  return p + (p.indexOf("?") >= 0 ? "&" : "?") + "v=" + v + hash;
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
      + 'data-subject="'+subId+'" src="'+embSrc(m.src+'#'+sec)+'" title="'+m.nume+'"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
    });
  }
}

// Laboratorul de simulatoare PSO — pagină embed (pso/index.html), secțiune a
// materiei native PSO. sec = "jocuri" (grila) sau "sim/<id>[/<scenariu>]".
function showSimLab(sec){
  sec = sec || "jocuri";
  setActive("simlab");
  document.getElementById("crumb").textContent = "Materii · PSO";
  document.getElementById("title").textContent = "PSO — Simulatoare vizuale";
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject==="pso-sim"){
    try{ frame.contentWindow.postMessage({ type:"tab", tab:sec }, "*"); }
    catch(err){ frame.src = "pso/index.html#"+sec; }
  } else {
    c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
      + 'data-subject="pso-sim" src="'+embSrc('pso/index.html#'+sec)+'" title="Simulatoare PSO"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
    });
  }
}

// Subiectele PSO protejate cu parolă — pagină embed (pso/subiecte.html).
// Conținutul e criptat AES în subiecte-secret.enc.js; deblocarea se face în pagină.
function showPsoSub(sec){
  sec = sec || "lista";
  setActive("psosub");
  document.getElementById("crumb").textContent = "Materii · PSO";
  document.getElementById("title").textContent = "PSO — Subiecte examen 🔐";
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject==="pso-sub"){
    try{ frame.contentWindow.postMessage({ type:"tab", tab:sec }, "*"); }
    catch(err){ frame.src = "pso/subiecte.html#"+sec; }
  } else {
    c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
      + 'data-subject="pso-sub" src="'+embSrc('pso/subiecte.html#'+sec)+'" title="Subiecte examen PSO"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
    });
  }
}

// Subiectele SDA protejate cu parolă — pagină embed (sda/subiecte.html).
// Conținutul e criptat AES în sda/subiecte-secret.enc.js; deblocarea are loc în pagină.
function showSdaSub(sec){
  sec = sec || "lista";
  setActive("sdasub");
  document.getElementById("crumb").textContent = "Materii · SDA";
  document.getElementById("title").textContent = "SDA — Subiecte examen 🔐";
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject==="sda-sub"){
    try{ frame.contentWindow.postMessage({ type:"tab", tab:sec }, "*"); }
    catch(err){ frame.src = "sda/subiecte.html#"+sec; }
  } else {
    c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
      + 'data-subject="sda-sub" src="'+embSrc('sda/subiecte.html#'+sec)+'" title="Subiecte examen SDA"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
    });
  }
}

// Probleme salvate (⭐) — pagină embed (salvate.html) care citește
// localStorage 'probleme-salvate-v1'. Fără parolă: conținutul e deja decriptat
// din momentul salvării. Per stație/browser (nu avem conturi).
function showSalvate(){
  setActive("salvate");
  document.getElementById("crumb").textContent = "Personal";
  document.getElementById("title").textContent = "⭐ Probleme salvate";
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject==="salvate"){
    try{ frame.contentWindow.postMessage({ type:"tab", tab:"lista" }, "*"); }
    catch(err){ frame.src = "salvate.html"; }
  } else {
    c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
      + 'data-subject="salvate" src="'+embSrc('salvate.html')+'" title="Probleme salvate"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
    });
  }
}

// contorul de pe elementul „⭐ Probleme salvate" din bara laterală
function updateSalvateBadge(){
  var el = document.getElementById("salvateBadge");
  if(!el) return;
  var n = 0;
  try{ n = (JSON.parse(localStorage.getItem("probleme-salvate-v1")||"[]")||[]).length; }catch(e){}
  if(n>0){ el.textContent = n; el.style.display=""; }
  else{ el.textContent = ""; el.style.display="none"; }
}
// se actualizează când o altă filă (iframe-ul de subiecte) salvează/scoate ceva
window.addEventListener("storage", function(e){ if(e.key==="probleme-salvate-v1") updateSalvateBadge(); });

// Subiectele C & C++ protejate cu parolă — pagină embed (oop/subiecte.html).
// Conținutul e criptat AES în oop/subiecte-secret.enc.js; deblocarea are loc în pagină.
function showOopSub(sec){
  sec = sec || "lista";
  setActive("oopsub");
  document.getElementById("crumb").textContent = "Materii · OOP C++";
  document.getElementById("title").textContent = "C & C++ — Subiecte examen 🔐";
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject==="oop-sub"){
    try{ frame.contentWindow.postMessage({ type:"tab", tab:sec }, "*"); }
    catch(err){ frame.src = "oop/subiecte.html#"+sec; }
  } else {
    c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
      + 'data-subject="oop-sub" src="'+embSrc('oop/subiecte.html#'+sec)+'" title="Subiecte examen C & C++"></iframe></div>';
    const f = document.getElementById("embed-frame");
    f.addEventListener("load", function(){
      try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
    });
  }
}

// Among Us CS — joc multiplayer (clona Among Us cu taskuri-minijoc din materii).
// Clientul e servit de serviciul Node "amongus" prin nginx pe /amongus/
// (aceeași imagine cu serverul de joc), încărcat aici în iframe cu tema sincronă.
function showAmongUs(){
  setActive("amongus");
  document.getElementById("crumb").textContent = "Multiplayer";
  document.getElementById("title").textContent = "Among Us CS 🛸";
  const c = document.getElementById("content");
  let frame = document.getElementById("embed-frame");
  if(frame && frame.dataset.subject==="amongus") return;   // e deja deschis — nu-i întrerupem partida
  c.innerHTML = '<div class="embed-wrap"><iframe id="embed-frame" class="embed-frame" '
    + 'data-subject="amongus" src="/amongus/" title="Among Us CS" allow="autoplay"></iframe></div>';
  const f = document.getElementById("embed-frame");
  f.addEventListener("load", function(){
    try{ f.contentWindow.postMessage(frameThemeMsg(), "*"); }catch(e){}
  });
}

function showConcept(id){
  const c = CONCEPTE.find(function(x){ return x.id===id; });
  if(!c){ showHome(); return; }
  setActive("concept",id);
  document.getElementById("crumb").textContent = "Concepte · "+c.cat;
  document.getElementById("title").textContent = shortTitle(c.titlu);
  const el = document.getElementById("content");
  el.innerHTML = '<article class="article">'+c.html+conceptSimsHtml(id)+conceptVideoHtml(id)+'</article>'+conceptNav(id);
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

// ---------- Subiecte generate (modele de examen) ----------
function exam(id){ return SUBIECTE.find(function(x){ return x.id===id; }); }

function showExamIndex(){
  setActive("examindex");
  document.getElementById("crumb").textContent = "Subiecte Generate";
  document.getElementById("title").textContent = "Modele de examen";
  const c = document.getElementById("content");
  c.innerHTML = ''
    + '<div class="hero">'
    + '<h2>Modele de examen generate 📄</h2>'
    + '<p>Modele complete în stilul subiectelor reale ATM (2017–2024), construite pe baza cursurilor. Fiecare model are <b>3 subiecte</b>, este gândit să fie rezolvabil în <b>3 ore</b> și conține <b>rezolvarea/baremul</b> pentru fiecare subiect (ascuns, ca să te poți autoevalua).</p>'
    + '<p class="muted" style="margin-top:8px">⚠️ Subiecte de antrenament generate automat — nu sunt subiecte oficiale. Folosește-le doar pentru exersare.</p>'
    + '</div>'
    + '<div class="grid">'
    + SUBIECTE.map(function(x){
        return '<div class="tile feat" onclick="showExam(\''+x.id+'\')">'
          + '<div class="ico">📄</div>'
          + '<h3>'+x.titlu+'</h3>'
          + '<p>'+x.rezumat+'</p>'
          + '<span class="cat-tag">'+x.combo+' →</span></div>';
      }).join("")
    + '</div>';
}

function showExam(id){
  const x = exam(id);
  if(!x){ showExamIndex(); return; }
  setActive("exam", id);
  document.getElementById("crumb").textContent = "Subiecte Generate · "+x.navTitlu;
  document.getElementById("title").textContent = x.titlu;
  const el = document.getElementById("content");
  el.innerHTML = '<article class="article">'+x.html+'</article>'+examNav(id);
  applyHighlight(el);
}

function examNav(id){
  const idx = SUBIECTE.findIndex(function(x){ return x.id===id; });
  const prev = SUBIECTE[idx-1], next = SUBIECTE[idx+1];
  let out = '<div class="btn-row" style="margin-top:34px; justify-content:space-between">';
  out += prev ? '<button class="btn ghost" onclick="showExam(\''+prev.id+'\')">← '+prev.navTitlu+'</button>' : '<span></span>';
  out += next ? '<button class="btn" onclick="showExam(\''+next.id+'\')">'+next.navTitlu+' →</button>'
              : '<button class="btn ghost" onclick="showExamIndex()">↩ Toate modelele</button>';
  out += '</div>';
  return out;
}

// ---------- Bandă de noutăți (ticker de sus) ----------
// Editează AICI la fiecare modificare notabilă (cea mai NOUĂ prima). Apare în
// banda care se derulează sus, ca toți utilizatorii să vadă ce s-a adăugat.
const UPDATES = [
  { d:"08.07.2026", t:"Rețele → „🆔 DHCP (DORA)”: cum obține un dispozitiv IP-ul automat — Discover/Offer/Request/Ack cu anteturile Ethernet/IP/UDP completate pas cu pas" },
  { d:"08.07.2026", t:"Rețele → „🤝 Transmisia TCP”: SEQ/ACK pas cu pas (handshake, transfer, închidere) + antrenament de calcul al ACK-ului" },
  { d:"08.07.2026", t:"Rețele → „📝 Exerciții examen”: buton „🔖 Salvează problema” pe fiecare exercițiu + tab nou „🔖 Probleme salvate” unde le reexersezi (salvate local, în browser)" },
  { d:"08.07.2026", t:"Rețele → Ex. 30 (DNS): rezoluția recursivă a lui www.mta.ro explicată pas cu pas, cu diagramă a fluxului recursiv ↔ iterativ (root → .ro → mta.ro)" },
  { d:"08.07.2026", t:"Rețele → „🏷️ Clase & adrese IP”: calculator de clasă (A–E) + privat / public / multicast / broadcast / loopback / link-local" },
  { d:"07.07.2026", t:"SDA → „🔐 Subiecte examen”: 10 variante noi în stil licență, cu rezolvări și barem" },
  { d:"06.07.2026", t:"Nou: „⭐ Probleme salvate” — pinuiește problemele mai tricky din PSO / OOP / SDA și reexersează-le" },
];

// Versiunea aplicației = data celui mai nou update (fără separatori). Se schimbă
// automat la fiecare intrare nouă în UPDATES → busts cache-ul iframe-urilor (embSrc).
const APP_VER = (UPDATES[0] && UPDATES[0].d) ? UPDATES[0].d.replace(/\W/g, "") : "1";

function renderUpdateTicker(){
  const track = document.getElementById("utTrack");
  if(!track || !UPDATES.length) return;
  function e(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  const items = UPDATES.map(function(u,i){
    return '<span class="ut-item">'
      + (i===0 ? '<span class="ut-new">NOU</span>' : '')
      + '<span class="ut-date">'+e(u.d)+'</span>'+e(u.t)+'</span>';
  }).join('<span class="ut-sep">•</span>');
  const oneCopy = items + '<span class="ut-sep">•</span>';   // separator și la cusătură
  track.innerHTML = oneCopy + oneCopy;                        // două copii → buclă fără salt
  // viteză constantă (~55 px/s) indiferent de câte noutăți sunt
  requestAnimationFrame(function(){
    const latimeCopie = track.scrollWidth / 2;
    const durata = Math.max(16, Math.round(latimeCopie / 55));
    track.style.animationDuration = durata + "s";
  });
}

// ---------- Init ----------
window.addEventListener("DOMContentLoaded", function(){
  // tema este aplicată de js/theme.js (tot pe DOMContentLoaded)
  renderUpdateTicker();
  initSidebar();
  buildNav();
  showDashboard();
});
