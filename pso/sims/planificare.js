/* ============================================================
   Simulator · Planificarea CPU — Gantt interactiv
   FCFS / SJF / SRTF / RR / RR pe priorități, cu problema
   exactă din subiectele 2020/2022/2023 preîncărcată.
   ============================================================ */
"use strict";

(function(){

var ALGOS=[
  {id:'FCFS',  nume:'FCFS',          hint:'primul sosit, primul servit; ne-preemptiv'},
  {id:'SJF',   nume:'SJF',           hint:'cel mai scurt job; ne-preemptiv'},
  {id:'SRTF',  nume:'SRTF',          hint:'cel mai mic timp rămas; preemptiv'},
  {id:'RR',    nume:'Round-Robin',   hint:'coadă circulară cu cuantă'},
  {id:'PRIORR',nume:'RR + priorități',hint:'clase de prioritate, RR în clasă (subiectele 2020/2022/2023)'}
];
var FILLS=['sv-fill-acc','sv-fill-blu','sv-fill-grn','sv-fill-prp','sv-fill-org','sv-fill-aqu','sv-fill-red','sv-fill-mut'];

/* ---------------- motorul de simulare ---------------- */
/* procs: [{n, at, bt, pr}] · întoarce {segs, finish, total}
   segs: {t0,t1,pi,motiv,fin}  (pi = -1 pentru CPU idle)     */
function simuleaza(procs, algo, q){
  var n=procs.length;
  var rem=procs.map(function(p){ return p.bt; });
  var finish=new Array(n).fill(null);
  var inQ=new Array(n).fill(false);
  var t=0, done=0, rq=[], segs=[];

  function sosesc(pana){
    /* pune în coadă procesele sosite până la momentul `pana` inclusiv,
       în ordinea timpului de sosire (stabil pe index la egalitate) */
    var noi=[];
    procs.forEach(function(p,i){
      if(!inQ[i] && finish[i]===null && p.at<=pana) noi.push(i);
    });
    noi.sort(function(a,b){ return procs[a].at-procs[b].at || a-b; });
    noi.forEach(function(i){ inQ[i]=true; rq.push(i); });
  }
  function urmSosire(dupa){
    var best=null;
    procs.forEach(function(p,i){
      if(!inQ[i] && finish[i]===null && p.at>dupa && (best===null||p.at<best)) best=p.at;
    });
    return best;
  }
  function readyStr(){
    return rq.map(function(i){ return procs[i].n+'('+rem[i]+(algo==='PRIORR'?'·p'+procs[i].pr:'')+')'; }).join(', ')||'—';
  }
  function alege(){
    if(!rq.length) return null;
    if(algo==='FCFS'||algo==='RR') return rq[0];
    if(algo==='SJF'){
      var b=rq[0]; rq.forEach(function(i){ if(rem[i]<rem[b]) b=i; }); return b;
    }
    if(algo==='SRTF'){
      var b2=rq[0]; rq.forEach(function(i){ if(rem[i]<rem[b2]) b2=i; }); return b2;
    }
    if(algo==='PRIORR'){
      var mx=-1; rq.forEach(function(i){ if(procs[i].pr>mx) mx=procs[i].pr; });
      for(var k=0;k<rq.length;k++) if(procs[rq[k]].pr===mx) return rq[k];
    }
    return rq[0];
  }
  function motivPentru(pi){
    var p=procs[pi];
    if(algo==='FCFS') return p.n+' e primul din coada FIFO (sosit la t='+p.at+'). Rulează până termină — FCFS nu preemptează.';
    if(algo==='SJF') return 'dintre cei sosiți, '+p.n+' are cel mai scurt timp de execuție ('+rem[pi]+'). Odată pornit, nu mai e întrerupt.';
    if(algo==='SRTF') return p.n+' are cel mai mic timp RĂMAS ('+rem[pi]+') dintre cei sosiți. Orice sosire nouă redeschide competiția.';
    if(algo==='RR') return p.n+' e la rând în coada circulară și primește o cuantă de '+q+'.';
    /* PRIORR */
    var laFel=rq.filter(function(i){ return procs[i].pr===p.pr; }).length;
    return 'cea mai mare prioritate din READY este '+p.pr+' → rulează '+p.n
      +(laFel>1?' (RR cu cuanta '+q+' în clasa lui, unde mai așteaptă '+(laFel-1)+')':' (singur în clasa lui, deci cuanta doar se reînnoiește)')+'.';
  }

  sosesc(0);
  var pas=0;
  while(done<n && pas++<2000){
    if(!rq.length){
      var na=urmSosire(t);
      if(na===null) break;
      segs.push({t0:t,t1:na,pi:-1,motiv:'niciun proces sosit — CPU-ul rulează procesul IDLE.',ready:'—'});
      t=na; sosesc(t); continue;
    }
    var pi=alege();
    var ready=readyStr();
    var motiv=motivPentru(pi);
    rq.splice(rq.indexOf(pi),1);

    /* cât rulează segmentul acesta? */
    var d;
    if(algo==='FCFS'||algo==='SJF') d=rem[pi];
    else if(algo==='SRTF'){
      var na2=urmSosire(t);
      d=(na2!==null)?Math.min(rem[pi],na2-t):rem[pi];
    } else {
      d=Math.min(q,rem[pi]);
      if(algo==='PRIORR'){
        /* preempțiune dacă sosește cineva cu prioritate mai mare în timpul cuantei */
        var cut=null;
        procs.forEach(function(p,i){
          if(!inQ[i] && finish[i]===null && p.at>t && p.at<t+d && p.pr>procs[pi].pr)
            if(cut===null||p.at<cut) cut=p.at;
        });
        if(cut!==null) d=cut-t;
      }
    }
    var t1=t+d;
    rem[pi]-=d;
    var fin=(rem[pi]===0), ev;
    if(fin){ finish[pi]=t1; inQ[pi]=false; done++; ev=procs[pi].n+' termină la t='+t1+'.'; }
    sosesc(t1);
    if(!fin){
      rq.push(pi); /* sosirile din timpul cuantei intră ÎNAINTEA celui preemptat */
      if(algo==='SRTF') ev='la t='+t1+' se re-evaluează timpii rămași ('+procs[pi].n+' mai are '+rem[pi]+').';
      else ev='cuanta expiră la t='+t1+': '+procs[pi].n+' (rămas '+rem[pi]+') trece la coada cozii.';
    }
    segs.push({t0:t,t1:t1,pi:pi,motiv:motiv,ev:ev,ready:ready,fin:fin});
    t=t1;
  }
  /* îmbină segmentele consecutive ale ACELUIAȘI proces (ex. PRIORR unde
     procesul e singur în clasa lui și cuanta doar se reînnoiește) */
  var m=[];
  segs.forEach(function(sg){
    var last=m[m.length-1];
    if(last && last.pi===sg.pi && last.t1===sg.t0 && sg.pi>=0){
      last.t1=sg.t1; last.ev=sg.ev; last.fin=sg.fin;
    } else m.push(sg);
  });
  return {segs:m, finish:finish, total:t};
}

/* ---------------- desenul Gantt ---------------- */
function ganttSvg(procs, res, idx, remLa){
  /* idx = câte segmente desenăm (curentul = ultimul); -1 = doar setup */
  var segs=res.segs, total=Math.max(res.total,1);
  var X0=56, W=688, sc=W/total;
  var H=326;
  var out=S.open(760,H);
  /* axa + bara */
  out+=S.rect(X0,34,W,40,'sv-n deep',7);
  var tickPas=total>40?10:(total>18?5:1);
  for(var tt=0;tt<=total;tt+=tickPas){
    var x=X0+tt*sc;
    out+=S.line(x,80,x,88,'dim',null)+S.text(x,102,String(tt),'xs mono mut','middle');
  }
  /* segmente */
  for(var i=0;i<segs.length && i<=idx;i++){
    var sg=segs[i], x1=X0+sg.t0*sc, w=(sg.t1-sg.t0)*sc;
    if(sg.pi<0){
      out+=S.rect(x1+1,36,Math.max(w-2,1),36,'sv-n ghost',5);
      if(w>34) out+=S.text(x1+w/2,58,'idle','xs mut','middle');
    } else {
      var hot=(i===idx);
      out+='<g'+(hot?' class="sv-hot"':'')+'>';
      out+='<rect x="'+(x1+1)+'" y="36" width="'+Math.max(w-2,1)+'" height="36" rx="5" class="'+FILLS[sg.pi%FILLS.length]+'" opacity="'+(hot?'1':'.78')+'"/>';
      if(w>26) out+=S.text(x1+w/2,58,procs[sg.pi].n,'xs b onacc','middle');
      out+='</g>';
    }
    /* granițele de timp ale segmentelor */
    out+=S.text(x1,26,String(sg.t0),'xs mono mut','middle');
    if(i===segs.length-1||i===idx) out+=S.text(X0+sg.t1*sc,26,String(sg.t1),'xs mono acc','middle');
  }
  /* coada ready la începutul segmentului curent */
  if(idx>=0 && idx<segs.length){
    var cur=segs[idx];
    out+=S.text(X0,132,'READY la t='+cur.t0+':','xs b mut');
    out+=S.text(X0+104,132,cur.ready,'xs mono soft');
  }
  /* tabelul proceselor */
  var ty=158;
  out+=S.text(X0,ty,'proces','xs b mut')+S.text(X0+120,ty,'sosire','xs b mut')
     +S.text(X0+200,ty,'durată','xs b mut')+S.text(X0+280,ty,'prioritate','xs b mut')
     +S.text(X0+380,ty,'rămas acum','xs b mut');
  procs.forEach(function(p,i){
    var y=ty+20+i*22;
    out+='<rect x="'+X0+'" y="'+(y-11)+'" width="13" height="13" rx="4" class="'+FILLS[i%FILLS.length]+'"/>';
    out+=S.text(X0+22,y,p.n,'xs mono b')+S.text(X0+120,y,String(p.at),'xs mono soft')
       +S.text(X0+200,y,String(p.bt),'xs mono soft')+S.text(X0+280,y,String(p.pr),'xs mono soft')
       +S.text(X0+380,y,String(remLa[i]),'xs mono '+(remLa[i]===0?'grn':'acc'));
  });
  return out+S.close;
}

function metriciSvg(procs, res){
  var out=S.open(760,300);
  var X0=56;
  out+=S.text(X0,32,'Rezultate finale','b acc');
  var ty=64;
  ['proces','sosire','durată','sfârșit','turnaround (TT)','așteptare (WT)'].forEach(function(h,i){
    out+=S.text(X0+[0,90,170,250,350,520][i],ty,h,'xs b mut');
  });
  var sumT=0,sumW=0;
  procs.forEach(function(p,i){
    var y=ty+22+i*22, f=res.finish[i]||0, ttv=f-p.at, wtv=ttv-p.bt;
    sumT+=ttv; sumW+=wtv;
    out+='<rect x="'+(X0-22)+'" y="'+(y-11)+'" width="13" height="13" rx="4" class="'+FILLS[i%FILLS.length]+'"/>';
    out+=S.text(X0,y,p.n,'xs mono b')+S.text(X0+90,y,String(p.at),'xs mono soft')
       +S.text(X0+170,y,String(p.bt),'xs mono soft')+S.text(X0+250,y,String(f),'xs mono soft')
       +S.text(X0+350,y,ttv+'  (= '+f+'−'+p.at+')','xs mono soft')
       +S.text(X0+520,y,wtv+'  (= '+ttv+'−'+p.bt+')','xs mono soft');
  });
  var n=procs.length, y2=ty+22+n*22+18;
  out+=S.text(X0,y2,'TT mediu = '+(sumT/n).toFixed(2)+'   ·   WT mediu = '+(sumW/n).toFixed(2),'sm b acc');
  var ordine=[]; res.segs.forEach(function(sg){ if(sg.pi>=0 && (!ordine.length||ordine[ordine.length-1]!==procs[sg.pi].n)) ordine.push(procs[sg.pi].n); });
  out+=S.text(X0,y2+28,'ordinea pe CPU: '+ordine.join(' → '),'sm mono soft');
  out+=S.text(X0,y2+56,'WT = tot timpul petrecut în READY; TT = de la sosire până la terminare.','xs mut');
  return out+S.close;
}

/* ---------------- pașii playerului din segmente ---------------- */
function construiesteScena(procs, algo, q){
  var res=simuleaza(procs, algo, q);
  var pasi=[];
  /* pasul 0: setup */
  var remStart=procs.map(function(p){ return p.bt; });
  pasi.push({
    titlu:'configurația',
    svg:ganttSvg(procs,res,-1,remStart),
    ce:'Pornim <b>'+ALGOS.filter(function(a){return a.id===algo;})[0].nume+'</b>'
      +(algo==='RR'||algo==='PRIORR'?' cu cuanta <b>q = '+q+'</b>':'')
      +'. Procesele, cu timpii de sosire, duratele și prioritățile lor, sunt în tabel. Apasă „Pas” și urmărește fiecare decizie a planificatorului.',
    dece:(algo==='PRIORR'
      ?'Convenția din subiecte: <b>numărul mai mare = prioritate mai mare</b> (maximul 5). Se rulează mereu clasa de prioritate cea mai mare; în interiorul unei clase se face Round-Robin cu cuanta dată.'
      :'Fiecare algoritm răspunde diferit la aceeași întrebare: „cine primește CPU acum?”. Compară aceleași procese pe algoritmi diferiți din selectorul de sus.')
  });
  /* câte un pas per segment */
  var rem=procs.map(function(p){ return p.bt; });
  res.segs.forEach(function(sg,i){
    if(sg.pi>=0) rem[sg.pi]-=(sg.t1-sg.t0);
    var remCopy=rem.slice();
    pasi.push({
      titlu:'t = '+sg.t0+' → '+sg.t1+(sg.pi>=0?' · rulează '+procs[sg.pi].n:' · idle'),
      svg:ganttSvg(procs,res,i,remCopy),
      ce:(sg.pi>=0?'<b>'+procs[sg.pi].n+'</b> primește CPU pentru <b>'+(sg.t1-sg.t0)+'</b> unități ('+sg.t0+'–'+sg.t1+'). ':'')+(sg.ev||''),
      dece:'Decizia: '+sg.motiv+(sg.ready!=='—'?' <span class="muted">(READY la t='+sg.t0+': '+sg.ready+')</span>':'')
    });
  });
  /* pasul final: metrici */
  pasi.push({
    titlu:'rezultatele',
    svg:metriciSvg(procs,res),
    ce:'Execuția s-a încheiat la <b>t = '+res.total+'</b>. Tabelul dă timpii de terminare, turnaround (TT = sfârșit − sosire) și așteptare (WT = TT − durată), plus mediile.',
    dece:'La examen se cere de obicei <b>ordinea de execuție</b> (răspunsul de grilă) și/sau <b>timpul mediu de așteptare</b>. Verifică-ți calculul de mână contra tabelului.'
  });
  return {stageTitlu:'Diagrama Gantt — '+algo+(algo==='RR'||algo==='PRIORR'?' (q='+q+')':''), pasi:pasi};
}

/* ---------------- interfața (config + player) ---------------- */
function mountGantt(preset){
  return function(root){
    var api={player:null, destroy:function(){ if(api.player) api.player.destroy(); }};
    var cfg={algo:preset.algo, q:preset.q, procs:preset.procs.map(function(p){ return {n:p.n,at:p.at,bt:p.bt,pr:p.pr}; })};

    var el=document.createElement('div');
    el.innerHTML=''
      +'<div class="cfg" data-el="cfg">'
      +'<div class="fld" style="flex:1 1 100%"><label>Algoritmul</label><div class="chips" data-el="algos" style="margin:0"></div></div>'
      +'<div style="flex:1 1 100%"><table class="cfg-tbl" data-el="tbl"></table></div>'
      +'<div class="fld"><label>cuanta (RR)</label><input type="number" min="1" max="20" data-el="q" value="'+cfg.q+'"></div>'
      +'<button class="btn ghost" data-a="add">+ proces</button>'
      +'<button class="btn" data-a="run">⟳ Simulează</button>'
      +'</div>'
      +'<div data-el="player"></div>';
    root.appendChild(el);
    var q=function(k){ return el.querySelector('[data-el="'+k+'"]'); };

    function drawAlgos(){
      q('algos').innerHTML=ALGOS.map(function(a){
        return '<button class="chip'+(a.id===cfg.algo?' active':'')+'" data-al="'+a.id+'" title="'+a.hint+'">'+a.nume+'</button>';
      }).join('');
      q('algos').querySelectorAll('.chip').forEach(function(b){
        b.onclick=function(){ cfg.algo=b.dataset.al; drawAlgos(); run(); };
      });
    }
    function drawTbl(){
      var h='<tr><th>proces</th><th>sosire</th><th>durată</th><th>prioritate</th><th></th></tr>';
      cfg.procs.forEach(function(p,i){
        h+='<tr>'
          +'<td class="mono" style="font-family:var(--mono)">'+esc(p.n)+'</td>'
          +'<td><input type="number" min="0" max="99" value="'+p.at+'" data-f="at" data-i="'+i+'"></td>'
          +'<td><input type="number" min="1" max="99" value="'+p.bt+'" data-f="bt" data-i="'+i+'"></td>'
          +'<td><input type="number" min="1" max="9" value="'+p.pr+'" data-f="pr" data-i="'+i+'"></td>'
          +'<td>'+(cfg.procs.length>2?'<button class="del" data-i="'+i+'" title="șterge">✕</button>':'')+'</td>'
          +'</tr>';
      });
      q('tbl').innerHTML=h;
      q('tbl').querySelectorAll('input').forEach(function(inp){
        inp.onchange=function(){
          var v=parseInt(inp.value,10); if(isNaN(v)) v=(inp.dataset.f==='at'?0:1);
          cfg.procs[+inp.dataset.i][inp.dataset.f]=Math.max(inp.dataset.f==='at'?0:1, Math.min(99,v));
          run();
        };
      });
      q('tbl').querySelectorAll('.del').forEach(function(b){
        b.onclick=function(){ cfg.procs.splice(+b.dataset.i,1); renum(); drawTbl(); run(); };
      });
    }
    function renum(){ cfg.procs.forEach(function(p,i){ p.n='P'+(i+1); }); }
    function run(){
      cfg.q=Math.max(1,parseInt(q('q').value,10)||1);
      if(api.player) api.player.destroy();
      api.player=new Player(q('player'), construiesteScena(cfg.procs, cfg.algo, cfg.q));
    }
    q('q').onchange=run;
    el.querySelector('[data-a="add"]').onclick=function(){
      if(cfg.procs.length>=8) return;
      cfg.procs.push({n:'P'+(cfg.procs.length+1),at:0,bt:5,pr:1});
      drawTbl(); run();
    };
    el.querySelector('[data-a="run"]').onclick=run;

    drawAlgos(); drawTbl(); run();
    return api;
  };
}

var P2023=[{n:'P1',at:0,bt:14,pr:5},{n:'P2',at:0,bt:3,pr:3},{n:'P3',at:0,bt:10,pr:1},
           {n:'P4',at:0,bt:8,pr:4},{n:'P5',at:0,bt:17,pr:2}];

PSO.register({
  id:'gantt', cat:'planificare', icon:'⏱️',
  titlu:'Planificarea CPU — Gantt interactiv',
  scurt:'FCFS, SJF, SRTF, RR și RR pe priorități — cu problema exactă din subiectele 2020/2022/2023.',
  desc:'Introdu procesele (sau folosește presetul din subiect), alege algoritmul și urmărește <b>fiecare decizie</b> a planificatorului pe diagrama Gantt: cine primește CPU, de ce, când expiră cuanta și cum ies timpii medii de așteptare. Poți edita orice valoare — simularea se reface instant.',
  ani:[2020,2022,2023],
  nota:'Problema care se repetă identic în <b>2020, 2022 și 2023</b>: „P1..P5 cu timpii 14, 3, 10, 8, 17 secunde, priorități fixe 5, 3, 1, 4, 2 (5 = maxim), round-robin pe priorități cu cuanta de 3 secunde — care e ordinea de execuție?” Rulează presetul și vezi și de ce: <b>P1 → P4 → P2 → P5 → P3</b> (prioritățile fiind toate diferite, fiecare proces rulează singur în clasa lui până termină).',
  scenarii:[
    {id:'subiect', nume:'subiectul 2020/2022/2023', build:function(){ return {custom:mountGantt({algo:'PRIORR',q:3,procs:P2023})}; }},
    {id:'fcfs',    nume:'FCFS & efectul de convoi', build:function(){ return {custom:mountGantt({algo:'FCFS',q:3,procs:[
      {n:'P1',at:0,bt:24,pr:1},{n:'P2',at:1,bt:3,pr:1},{n:'P3',at:2,bt:3,pr:1}]})}; }},
    {id:'srtf',    nume:'SRTF cu preempțiune',      build:function(){ return {custom:mountGantt({algo:'SRTF',q:3,procs:[
      {n:'P1',at:0,bt:8,pr:1},{n:'P2',at:1,bt:4,pr:1},{n:'P3',at:2,bt:2,pr:1},{n:'P4',at:3,bt:1,pr:1}]})}; }},
    {id:'rr',      nume:'Round-Robin simplu',       build:function(){ return {custom:mountGantt({algo:'RR',q:2,procs:[
      {n:'P1',at:0,bt:5,pr:1},{n:'P2',at:0,bt:3,pr:1},{n:'P3',at:0,bt:4,pr:1}]})}; }}
  ]
});
/* expus pentru verificări automate (harness) */
PSO._gantt={simuleaza:simuleaza, construiesteScena:construiesteScena, P2023:P2023};
})();
