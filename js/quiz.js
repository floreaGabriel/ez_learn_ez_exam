// ============================================================
//  PSO Trainer — motorul de teste
// ============================================================
"use strict";

const Quiz = {
  filtru: "toate",      // tema selectată
  set: [],              // întrebările active
  raspunsuri: {},       // id -> [indici selectați] (pt grile)
  verificat: {},        // id -> true
  scor: 0, total: 0
};

function temeDisponibile(){
  const t = ["toate"];
  INTREBARI.forEach(function(q){ if(t.indexOf(q.tema)<0) t.push(q.tema); });
  return t;
}

function showQuiz(){
  setActive("quiz");
  document.getElementById("crumb").textContent = "Teste în stil examen";
  document.getElementById("title").textContent = "Teste examen";
  renderQuizIntro();
}

function renderQuizIntro(){
  const teme = temeDisponibile();
  const c = document.getElementById("content");
  c.innerHTML = ''
    + '<div class="quiz-intro">'
    + '<h2>📝 Teste în stilul examenului de licență</h2>'
    + '<p class="muted">Întrebări grilă (cu verificare instant și explicații) și probleme deschise cu rezolvare model. Sursă: subiecte reale ATM 2020–2024 + grile conceptuale.</p>'
    + '<div class="filters">'
    + teme.map(function(t){
        return '<div class="chip'+(Quiz.filtru===t?' active':'')+'" onclick="setFiltru(\''+t+'\')">'
          + (t==="toate"?"Toate temele":t)
          + ' <span class="muted">('+ (t==="toate"?INTREBARI.length:INTREBARI.filter(function(q){return q.tema===t;}).length) +')</span></div>';
      }).join("")
    + '</div>'
    + '<div class="btn-row">'
    + '<button class="btn" onclick="startQuiz(false)">Începe testul (în ordine)</button>'
    + '<button class="btn ghost" onclick="startQuiz(true)">Amestecă întrebările</button>'
    + '</div>'
    + '</div>'
    + '<div id="quiz-list"></div>';
}

function setFiltru(t){ Quiz.filtru = t; renderQuizIntro(); }

function shuffle(a){
  a = a.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const x=a[i]; a[i]=a[j]; a[j]=x; }
  return a;
}

function startQuiz(amesteca){
  let pool = INTREBARI.filter(function(q){ return Quiz.filtru==="toate" || q.tema===Quiz.filtru; });
  Quiz.set = amesteca ? shuffle(pool) : pool;
  Quiz.raspunsuri = {}; Quiz.verificat = {}; Quiz.scor = 0;
  Quiz.total = Quiz.set.filter(function(q){ return q.tip==="grila"; }).length;
  renderQuizList();
}

function renderQuizList(){
  const wrap = document.getElementById("quiz-list");
  wrap.innerHTML = Quiz.set.map(function(q,i){ return renderQ(q,i); }).join("")
    + '<div class="btn-row" style="margin-top:10px">'
    + '<button class="btn ghost" onclick="renderQuizIntro()">↩ Înapoi la filtre</button>'
    + '</div>';
  applyHighlight(wrap);
  updateScorebar();
}

function renderQ(q,i){
  let h = '<div class="qcard" id="card-'+q.id+'">';
  h += '<div class="qhead"><div class="qmeta">';
  h += '<span class="qtag an">'+(q.an==="concept"?"concept":q.an)+'</span>';
  h += '<span class="qtag">'+q.tema+'</span>';
  if(q.tip==="grila" && q.multi) h += '<span class="qtag multi">răspuns multiplu</span>';
  if(q.tip==="deschis") h += '<span class="qtag multi">problemă deschisă</span>';
  h += '</div><span class="qnum">#'+(i+1)+'</span></div>';
  h += '<div class="qtext">'+q.enunt+'</div>';
  if(q.cod) h += '<pre class="code qcode">'+esc(q.cod)+'</pre>';

  if(q.tip==="grila"){
    h += '<div class="opts" id="opts-'+q.id+'">';
    q.optiuni.forEach(function(opt,idx){
      const mk = q.multi ? '☐' : '';
      h += '<div class="opt'+(q.multi?' multi':'')+'" data-q="'+q.id+'" data-idx="'+idx+'" onclick="pickOption(\''+q.id+'\','+idx+')">'
         + '<span class="mark">'+mk+'</span><span>'+opt+'</span></div>';
    });
    h += '</div>';
    h += '<div class="btn-row"><button class="btn" id="check-'+q.id+'" onclick="checkQ(\''+q.id+'\')">Verifică</button></div>';
    h += '<div class="explain" id="exp-'+q.id+'"></div>';
  } else {
    h += '<div class="reveal-box">'
       + '<button class="btn ghost" onclick="toggleAnswer(\''+q.id+'\')" id="rev-'+q.id+'">Arată rezolvarea</button>'
       + '<div class="model-answer" id="ans-'+q.id+'">'+q.raspuns+'</div></div>';
  }
  h += '</div>';
  return h;
}

function pickOption(qid,idx){
  const q = Quiz.set.find(function(x){ return x.id===qid; });
  if(Quiz.verificat[qid]) return;
  let sel = Quiz.raspunsuri[qid] || [];
  if(q.multi){
    if(sel.indexOf(idx)>=0) sel = sel.filter(function(x){ return x!==idx; });
    else sel = sel.concat([idx]);
  } else {
    sel = [idx];
  }
  Quiz.raspunsuri[qid] = sel;
  // re-render doar opțiunile acestei întrebări
  document.querySelectorAll('#opts-'+qid+' .opt').forEach(function(el){
    const i = +el.dataset.idx;
    const on = sel.indexOf(i)>=0;
    el.classList.toggle("selected", on);
    if(q.multi) el.querySelector(".mark").textContent = on ? '✓' : '☐';
  });
}

function checkQ(qid){
  const q = Quiz.set.find(function(x){ return x.id===qid; });
  const sel = (Quiz.raspunsuri[qid]||[]).slice().sort();
  if(sel.length===0){ return; }
  if(Quiz.verificat[qid]) return;
  Quiz.verificat[qid] = true;

  const corecte = q.corecte.slice().sort();
  const corect = sel.length===corecte.length && sel.every(function(v,i){ return v===corecte[i]; });
  if(corect) Quiz.scor++;

  document.querySelectorAll('#opts-'+qid+' .opt').forEach(function(el){
    const i = +el.dataset.idx;
    el.classList.add("disabled");
    if(q.corecte.indexOf(i)>=0){ el.classList.add("correct"); el.querySelector(".mark").textContent='✓'; }
    else if(sel.indexOf(i)>=0){ el.classList.add("wrong"); el.querySelector(".mark").textContent='✕'; }
  });
  const exp = document.getElementById('exp-'+qid);
  exp.innerHTML = '<b>'+(corect?'✅ Corect!':'❌ Greșit.')+'</b> '+q.explicatie;
  exp.classList.add("show");
  if(!corect) exp.classList.add("bad");
  const btn = document.getElementById('check-'+qid);
  if(btn){ btn.textContent = corect ? 'Corect ✓' : 'Răspuns afișat'; btn.disabled = true; btn.style.opacity=.6; }
  updateScorebar();
}

function toggleAnswer(qid){
  const a = document.getElementById('ans-'+qid);
  const b = document.getElementById('rev-'+qid);
  const open = a.classList.toggle("show");
  b.textContent = open ? 'Ascunde rezolvarea' : 'Arată rezolvarea';
}

function updateScorebar(){
  let bar = document.getElementById("scorebar");
  const raspunse = Object.keys(Quiz.verificat).length;
  if(!bar){
    bar = document.createElement("div");
    bar.id = "scorebar"; bar.className = "scorebar";
    document.querySelector(".main").appendChild(bar);
  }
  const pct = Quiz.total ? Math.round(100*Quiz.scor/Quiz.total) : 0;
  const fillPct = Quiz.total ? Math.round(100*raspunse/Quiz.total) : 0;
  bar.innerHTML = ''
    + '<div class="score">Scor: '+Quiz.scor+' / '+Quiz.total+' <span class="muted">('+pct+'%)</span></div>'
    + '<div class="progress"><div class="fill" style="width:'+fillPct+'%"></div></div>'
    + '<button class="btn ghost" onclick="finishQuiz()">Rezultat final</button>';
}

function finishQuiz(){
  const pct = Quiz.total ? Math.round(100*Quiz.scor/Quiz.total) : 0;
  let mesaj = pct>=85 ? "Excelent! Ești pregătit. 🎯" : pct>=60 ? "Bine, dar mai recapitulează conceptele slabe. 📚" : "Mai e de lucru — reia conceptele și încearcă din nou. 💪";
  const c = document.getElementById("content");
  c.innerHTML = ''
    + '<div class="result-card">'
    + '<div class="big">'+pct+'%</div>'
    + '<p>Ai răspuns corect la <b>'+Quiz.scor+'</b> din <b>'+Quiz.total+'</b> grile.</p>'
    + '<p style="margin-top:8px">'+mesaj+'</p>'
    + '</div>'
    + '<div class="btn-row">'
    + '<button class="btn" onclick="renderQuizIntro()">Alt test</button>'
    + '<button class="btn ghost" onclick="showHome()">Acasă</button>'
    + '</div>';
  const bar = document.getElementById("scorebar"); if(bar) bar.remove();
  window.scrollTo(0,0);
}
