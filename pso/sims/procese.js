/* ============================================================
   Simulatoare · Procese — fork(), stări & context switch, COW
   ============================================================ */
"use strict";

/* ---------- helper comun: arbore de procese ----------
   nodes: {id,x,y,pid,sub,cls,hot,ret}  (cutie 108×46, x/y = colț stânga-sus)
   edges: [idParinte, idCopil, etichetă?, mk?]                      */
function pTree(w,h,nodes,edges,extra){
  var by={}; nodes.forEach(function(n){ by[n.id]=n; });
  var out=S.open(w,h);
  (edges||[]).forEach(function(e){
    var a=by[e[0]], b=by[e[1]]; if(!a||!b) return;
    var x1=a.x+(a.w||108)/2, y1=a.y+(a.h||46), x2=b.x+(b.w||108)/2, y2=b.y;
    out+='<path d="M'+x1+' '+y1+' C'+x1+' '+(y1+24)+','+x2+' '+(y2-24)+','+x2+' '+y2
       +'" class="sv-l '+(e[3]==='acc'?'acc':'dim')+'" marker-end="url(#ma'+(e[3]?'-'+e[3]:'')+')"/>';
    if(e[2]) out+=S.text((x1+x2)/2+7, (y1+y2)/2+3, e[2], 'xs mono acc');
  });
  nodes.forEach(function(n){
    var W=n.w||108, H=n.h||46;
    out+='<g'+(n.hot?' class="sv-hot"':'')+'>';
    out+=S.rect(n.x,n.y,W,H,'sv-n '+(n.cls||'')+(n.hot?' ':''),9);
    out+=S.text(n.x+W/2, n.y+19, n.pid, 'b mono'+(n.cls&&n.cls.indexOf('dead')>=0?' mut':''), 'middle');
    if(n.sub) out+=S.text(n.x+W/2, n.y+35, n.sub, 'xs '+(n.subCls||'mut'), 'middle');
    out+='</g>';
    if(n.ret!=null) out+=S.badge(n.x+W/2, n.y-14, 'fork() = '+n.ret, 'sv-fill-acc');
  });
  out+=(extra||'')+S.close;
  return out;
}

/* ============================================================
   1) fork() și arborele de procese
   ============================================================ */
(function(){

/* --- scenariul 1: fork de bază --- */
function scBaza(){
  var cod=[
'#include <stdio.h>',
'#include <unistd.h>',
'',
'int main(void){',
'    printf("start %d\\n", getpid());',
'',
'    pid_t pid = fork();',
'',
'    if(pid == 0){',
'        printf("copil %d (tata %d)\\n",',
'               getpid(), getppid());',
'    } else {',
'        printf("tata %d a creat %d\\n",',
'               getpid(), pid);',
'    }',
'    return 0;',
'}'].join('\n');

  function unProc(hot){
    return pTree(760,150,[{id:'p',x:326,y:44,pid:'PID 4200',sub:'rulează main()',cls:'run',hot:hot}]);
  }
  function douaProc(o){
    o=o||{};
    return pTree(760,190,[
      {id:'p',x:180,y:20,pid:'PID 4200',sub:o.subP||'părinte',cls:o.clsP||'run',hot:o.hotP,ret:o.retP},
      {id:'c',x:470,y:118,pid:'PID 4201',sub:o.subC||'copil',cls:o.clsC||'run',hot:o.hotC,ret:o.retC}
    ],[['p','c','fork()','acc']]);
  }
  return {
    cod:cod,
    stageTitlu:'Arborele de procese',
    legenda:[{c:'run',t:'rulează'},{c:'zmb',t:'terminat'}],
    pasi:[
      {titlu:'un singur proces', linii:[5],
       svg:unProc(true),
       ce:'Programul pornește ca <b>un singur proces</b>, cu PID-ul 4200. <code>getpid()</code> întoarce PID-ul propriu.',
       dece:'Orice program devine proces abia când kernelul îi creează un <b>PCB</b> (task_struct), un PID și un spațiu de adrese. Până la <code>fork()</code>, există o singură copie a programului.',
       out:'start 4200'},
      {titlu:'fork() clonează procesul', linii:[7],
       svg:douaProc({hotP:true,hotC:true}),
       ce:'<code>fork()</code> creează o <b>clonă aproape identică</b>: copilul primește o copie a spațiului de adrese (leneșă, prin Copy-On-Write), a tabelei de descriptori și a contorului de program. <b>Ambele procese continuă exact de la fork()</b>.',
       dece:'Kernelul duplică PCB-ul părintelui. Singura diferență vizibilă în cod este <b>valoarea returnată</b> de fork() — altfel cele două procese nu s-ar putea deosebi.',
       out:'start 4200'},
      {titlu:'în părinte: fork() = PID-ul copilului', linii:[12,13,14],
       svg:douaProc({retP:'4201',hotP:true,subC:'așteaptă CPU',clsC:'rdy'}),
       ce:'În <b>părinte</b>, fork() întoarce <b>4201</b> — PID-ul copilului nou creat. Condiția <code>pid == 0</code> e falsă, deci părintele intră pe ramura <code>else</code>.',
       dece:'Părintele poate avea mai mulți copii — trebuie să afle PID-ul fiecăruia ca să-l poată aștepta cu <code>waitpid()</code>. De aceea primește PID-ul, nu 0.',
       out:'start 4200\ntata 4200 a creat 4201'},
      {titlu:'în copil: fork() = 0', linii:[9,10,11],
       svg:douaProc({retC:'0',hotC:true,subP:'așteaptă CPU',clsP:'rdy'}),
       ce:'În <b>copil</b>, fork() întoarce <b>0</b>. Condiția <code>pid == 0</code> e adevărată — copilul intră pe ramura <code>if</code>. <code>getppid()</code> îi dă PID-ul părintelui: 4200.',
       dece:'0 nu poate fi PID-ul unui proces real (PID-urile încep de la 1 — init). E folosit ca semnal: „<b>tu ești copilul</b>”. Copilul își află propriul PID cu getpid() dacă are nevoie.',
       out:'start 4200\ntata 4200 a creat 4201\ncopil 4201 (tata 4200)'},
      {titlu:'ordinea output-ului NU e garantată', linii:[9,13],
       svg:douaProc({subP:'concurent',subC:'concurent',hotP:true,hotC:true}),
       ce:'După fork(), părintele și copilul sunt <b>procese concurente</b> — planificatorul decide cine primește CPU primul. Mesajele „tata…” și „copil…” pot apărea <b>în orice ordine</b>.',
       dece:'Nu există nicio sincronizare între cele două procese. La examen: dacă se cere „ce afișează programul”, răspunsul corect enumeră <b>toate ordinile posibile</b> (sau folosește wait() pentru a impune una).',
       out:'start 4200\ncopil 4201 (tata 4200)\ntata 4200 a creat 4201\n— sau invers: ordinea depinde de planificator —'},
      {titlu:'fork() poate și eșua', linii:[7],
       svg:pTree(760,150,[
         {id:'p',x:326,y:44,pid:'PID 4200',sub:'fork() = -1',cls:'zmb',hot:true}
       ],[],S.text(380,130,'errno = EAGAIN (limita de procese atinsă)','xs mono red','middle')),
       ce:'Dacă s-a atins limita de procese (per utilizator sau global) ori nu mai e memorie, fork() întoarce <b>-1</b> în părinte și <b>nu se creează niciun copil</b>.',
       dece:'De aceea cele <b>trei valori posibile</b> ale lui fork() sunt: <code>&gt;0</code> (ești părinte, ai primit PID-ul copilului), <code>0</code> (ești copilul), <code>-1</code> (eroare). Întrebare clasică de examen.'}
    ]
  };
}

/* --- scenariul 2: 2^n procese (subiect 2023) --- */
function scPutere(){
  var cod=[
'int main(void){',
'    for(int i = 0; i < 3; i++)',
'        fork();',
'',
'    printf("proces %d\\n", getpid());',
'    return 0;',
'}'].join('\n');

  /* arborele complet după 3 iterații (P + 7 copii); ap = pasul la care apare */
  var N=[
    {id:'P',x:338,y:12, pid:'P',  sub:'inițial', ap:1},
    {id:'A',x:120,y:106,pid:'A',  sub:'i=0',     ap:2},
    {id:'B',x:338,y:106,pid:'B',  sub:'i=1',     ap:3},
    {id:'D',x:560,y:106,pid:'D',  sub:'i=2',     ap:4},
    {id:'C',x:32, y:200,pid:'C',  sub:'i=1',     ap:3},
    {id:'E',x:208,y:200,pid:'E',  sub:'i=2',     ap:4},
    {id:'F',x:338,y:200,pid:'F',  sub:'i=2',     ap:4},
    {id:'G',x:32, y:292,pid:'G',  sub:'i=2',     ap:4}
  ];
  var E=[['P','A','i=0'],['P','B','i=1'],['P','D','i=2'],
         ['A','C','i=1'],['A','E','i=2'],['B','F','i=2'],['C','G','i=2']];
  function stadiu(pas,hotAp){
    var ns=N.filter(function(n){ return n.ap<=pas; }).map(function(n){
      return {id:n.id,x:n.x,y:n.y,w:96,h:42,pid:n.pid,sub:n.sub,cls:'run',hot:hotAp&&n.ap===pas};
    });
    var ids={}; ns.forEach(function(n){ ids[n.id]=1; });
    var es=E.filter(function(e){ return ids[e[0]]&&ids[e[1]]; })
            .map(function(e){ return [e[0],e[1],e[2], (by(e[1]).ap===pas&&hotAp)?'acc':undefined]; });
    function by(id){ for(var i=0;i<N.length;i++) if(N[i].id===id) return N[i]; }
    var cnt=ns.length;
    return pTree(760,352,ns,es,S.badge(680,30,cnt+(cnt===1?' proces':' procese'),'sv-fill-acc'));
  }
  return {
    cod:cod,
    stageTitlu:'Arborele crește exponențial',
    pasi:[
      {titlu:'pornim cu 1 proces', linii:[1],
       svg:stadiu(1,false),
       ce:'La început există un singur proces, <b>P</b>. Urmează o buclă cu <b>3 apeluri fork()</b>, fără nicio condiție.',
       dece:'Detaliul-cheie al problemei: <b>fiecare proces</b> (inclusiv copiii!) continuă bucla de unde a rămas, deci execută și el fork-urile rămase.'},
      {titlu:'i = 0 → 2 procese', linii:[2,3],
       svg:stadiu(2,true),
       ce:'P face fork() și apare <b>A</b>. Acum ambele procese sunt în buclă la <code>i=0</code> și amândouă vor trece la <code>i=1</code>.',
       dece:'Copilul moștenește <b>valoarea curentă a lui i</b> (copie a memoriei), deci nu o ia de la zero — continuă bucla din același punct.'},
      {titlu:'i = 1 → 4 procese', linii:[2,3],
       svg:stadiu(3,true),
       ce:'La <code>i=1</code>, <b>ambele</b> procese existente fac fork(): P creează B, A creează C. Total: <b>4 procese</b>.',
       dece:'Numărul se <b>dublează</b> la fiecare iterație, pentru că toate procesele existente execută același fork().'},
      {titlu:'i = 2 → 8 procese', linii:[2,3],
       svg:stadiu(4,true),
       ce:'La <code>i=2</code>, toate cele 4 procese fac fork(): apar D, E, F, G. Total: <b>8 procese</b>.',
       dece:'1 → 2 → 4 → <b>8</b>. Arborele are forma clasică de „fork tree”: P are 3 copii (A, B, D), A are 2 (C, E), B și C câte unul.'},
      {titlu:'formula: 2^n', linii:[5],
       svg:stadiu(4,false),
       ce:'<code>printf</code> rulează <b>o dată în fiecare proces</b> → 8 linii de output (în ordine imprevizibilă). Regula: <b>n fork-uri în lanț ⇒ 2ⁿ procese</b>, dintre care <b>2ⁿ − 1 copii</b> nou creați.',
       dece:'Fix întrebarea din subiectul <b>2023</b>: cu 3 fork-uri fără condiții se ajunge la 2³ = 8 procese, adică 7 procese copil create. Dacă vezi fork-uri în buclă, numără-le pe proces și aplică formula.',
       out:'proces 4200\nproces 4203\nproces 4201\nproces 4207\nproces 4202\nproces 4205\nproces 4204\nproces 4206'}
    ]
  };
}

/* --- scenariul 3: cine iese din buclă? (variantele cu if) --- */
function scVariante(){
  var cod=[
'/* A: părintele iese din buclă */',
'for(i = 0; i < 3; i++){',
'    pid = fork();',
'    if(pid != 0) break;',
'}',
'',
'/* B: copilul iese din buclă */',
'for(i = 0; i < 3; i++){',
'    pid = fork();',
'    if(pid == 0) break;',
'}',
'',
'/* C: nimeni nu iese (subiect 2023) */',
'for(i = 0; i < 3; i++)',
'    fork();'].join('\n');

  function lant(hot){
    return pTree(760,220,[
      {id:'p',x:40, y:80,pid:'P',   sub:'iese la i=0',cls:'run',hot:hot},
      {id:'c1',x:240,y:80,pid:'C1', sub:'iese la i=1',cls:'run',hot:hot},
      {id:'c2',x:440,y:80,pid:'C2', sub:'iese la i=2',cls:'run',hot:hot},
      {id:'c3',x:632,y:80,pid:'C3', sub:'i=3, gata',  cls:'run',hot:hot}
    ],[['p','c1','fork'],['c1','c2','fork'],['c2','c3','fork']],
    S.text(380,40,'LANȚ: fiecare copil creează următorul copil','sm b acc','middle'));
  }
  function stea(hot){
    return pTree(760,240,[
      {id:'p',x:326,y:24,pid:'P',sub:'face 3 fork-uri',cls:'run',hot:hot},
      {id:'c1',x:80,y:150,pid:'C1',sub:'i=0, iese',cls:'run'},
      {id:'c2',x:326,y:150,pid:'C2',sub:'i=1, iese',cls:'run'},
      {id:'c3',x:570,y:150,pid:'C3',sub:'i=2, iese',cls:'run'}
    ],[['p','c1','i=0'],['p','c2','i=1'],['p','c3','i=2']],
    S.text(380,222,'STEA: toți copiii au același părinte, P','sm b acc','middle'));
  }
  return {
    cod:cod,
    stageTitlu:'Forma arborelui depinde de cine iese din buclă',
    pasi:[
      {titlu:'varianta A — părintele iese', linii:[2,3,4,5],
       svg:lant(true),
       ce:'<code>if(pid != 0) break;</code> — după fork, <b>părintele</b> (pid ≠ 0) iese din buclă. <b>Copilul</b> continuă și face următorul fork. Rezultat: un <b>lanț</b> P → C1 → C2 → C3.',
       dece:'Se creează tot 3 copii + P = <b>4 procese</b>, dar fiecare copil are <b>alt părinte</b> (C2 e copilul lui C1, nu al lui P). Contează la wait(): P poate aștepta doar pe C1!'},
      {titlu:'varianta B — copilul iese', linii:[8,9,10,11],
       svg:stea(true),
       ce:'<code>if(pid == 0) break;</code> — <b>copilul</b> iese imediat din buclă (nu mai clonează nimic). <b>Părintele</b> continuă și face toate cele 3 fork-uri. Rezultat: o <b>stea</b> — P cu 3 copii direcți.',
       dece:'Așa se creează „<b>exact 3 procese copil</b>” — construcția cerută de subiectul 2023. P îi poate aștepta pe toți trei cu wait() în buclă.'},
      {titlu:'varianta C — nimeni nu iese', linii:[14,15],
       svg:pTree(760,190,[
         {id:'x',x:280,y:60,w:200,h:60,pid:'2³ = 8 procese',sub:'vezi scenariul „2ⁿ procese”',cls:'acc',hot:true}
       ],[]),
       ce:'Fără nicio condiție, <b>toate</b> procesele execută fork-urile rămase → 2³ = <b>8 procese</b> (7 copii).',
       dece:'Exact întrebarea-capcană din subiectul 2023: „câte procese copil se creează dacă se elimină if-ul?” — răspuns: <b>7</b>, nu 3. Diferența dintre 3 și 7 vine doar din acel <code>if</code>.'},
      {titlu:'recapitulare — cele 3 forme',
       svg:S.open(760,190)
         +S.node(30,30,220,52,'A: if(pid != 0) break','lanț: P→C1→C2→C3','','')
         +S.node(270,30,220,52,'B: if(pid == 0) break','stea: P + 3 copii direcți','acc','')
         +S.node(510,30,220,52,'C: fără if','arbore complet: 2ⁿ procese','','')
         +S.text(380,130,'toate creează 3 fork-uri, dar arborele diferă','sm mut','middle')
         +S.text(380,155,'★ la examen: desenează arborele, nu număra din ochi','sm acc b','middle')
         +S.close,
       ce:'Aceleași 3 apeluri fork(), <b>trei arbori complet diferiți</b>: lanț, stea sau arbore complet cu 2ⁿ noduri.',
       dece:'Grilele combină des cele trei forme. Metoda sigură: simulezi bucla <b>pentru fiecare proces în parte</b> și desenezi arborele, exact ca în acest simulator.'}
    ]
  };
}

/* --- scenariul 4: zombie, orfan și wait() --- */
function scZombie(){
  var cod=[
'pid_t pid = fork();',
'',
'if(pid == 0){          /* copilul  */',
'    printf("copil gata\\n");',
'    exit(0);',
'}',
'/* părintele nu apelează wait() încă */',
'sleep(60);',
'',
'wait(NULL);   /* culege copilul */'].join('\n');

  function duo(o){
    o=o||{};
    return pTree(760,200,[
      {id:'p',x:150,y:24,pid:'PID 4200',sub:o.subP||'părinte',cls:o.clsP||'run',hot:o.hotP},
      {id:'c',x:460,y:120,pid:'PID 4201',sub:o.subC||'copil',cls:o.clsC||'run',hot:o.hotC}
    ],[['p','c',undefined,o.mk]], o.extra||'');
  }
  return {
    cod:cod,
    stageTitlu:'Zombie & orfan',
    legenda:[{c:'run',t:'rulează'},{c:'zmb',t:'zombie'},{c:'acc',t:'adoptat de init'}],
    pasi:[
      {titlu:'fork: părinte + copil', linii:[1],
       svg:duo({hotP:true,hotC:true}),
       ce:'După fork() există două procese. Copilul își va termina treaba repede; părintele doarme 60 s <b>fără să apeleze wait()</b>.',
       dece:'Scenariul tipic de examen: ce se întâmplă cu un copil terminat dacă părintele nu-l „culege”?'},
      {titlu:'copilul face exit(0) → ZOMBIE', linii:[4,5],
       svg:duo({clsC:'zmb',subC:'&lt;defunct&gt; · zombie',hotC:true,subP:'sleep(60), fără wait'}),
       ce:'Copilul se termină, dar în <code>ps</code> apare ca <b>&lt;defunct&gt;</b>: e <b>zombie</b> — mort, dar încă prezent în tabela de procese.',
       dece:'Kernelul trebuie să păstreze <b>PID-ul și codul de ieșire</b> (exit status) până când părintele le citește cu wait(). Nu poate elibera PCB-ul mai devreme — altfel exit status-ul s-ar pierde.',
       out:'copil gata'},
      {titlu:'zombie ≠ scurgere inofensivă', linii:[7,8],
       svg:duo({clsC:'zmb',subC:'PCB reținut în kernel',subP:'sleep(60)…',
        extra:S.text(380,20,'zombie: nu consumă CPU/RAM, dar ocupă un PID','xs mono red','middle')}),
       ce:'Zombie-ul nu mai execută nimic și nu mai are memorie proprie — rămâne doar intrarea din tabela de procese (PID + status).',
       dece:'Dacă un server face fork() în buclă și nu apelează niciodată wait(), <b>epuizează PID-urile</b> → sistemul nu mai poate crea procese. De aceea zombie-urile sunt un bug, nu o curiozitate.'},
      {titlu:'wait(NULL) culege copilul', linii:[10],
       svg:pTree(760,200,[
         {id:'p',x:150,y:24,pid:'PID 4200',sub:'a citit statusul',cls:'run',hot:true},
         {id:'c',x:460,y:120,pid:'PID 4201',sub:'PCB eliberat ✓',cls:'dead'}
       ],[['p','c']]),
       ce:'<code>wait(NULL)</code> întoarce PID-ul copilului terminat și îi citește statusul → kernelul <b>eliberează PCB-ul</b>. Zombie-ul dispare.',
       dece:'wait() are dublu rol: <b>sincronizare</b> (blochează părintele până termină un copil) și <b>curățenie</b> (reaping). La examen: fără wait ⇒ zombie; cu wait ⇒ copilul e cules.'},
      {titlu:'cazul invers: ORFANUL', linii:[8],
       svg:pTree(760,230,[
         {id:'i',x:40,y:24,pid:'PID 1',sub:'init / systemd',cls:'acc'},
         {id:'p',x:320,y:24,pid:'PID 4200',sub:'părinte terminat ✗',cls:'dead'},
         {id:'c',x:460,y:140,pid:'PID 4201',sub:'orfan → adoptat',cls:'run',hot:true}
       ],[['p','c'],['i','c','adopție','acc']]),
       ce:'Dacă <b>părintele moare primul</b>, copilul rămas în viață devine <b>orfan</b> și e <b>adoptat de init</b> (PID 1): getppid() al copilului devine 1.',
       dece:'init apelează wait() în buclă pentru toți copiii adoptați, deci orfanii <b>nu rămân zombie</b> când se termină. Așa funcționează și rularea în fundal cu <code>&amp;</code> din shell.'},
      {titlu:'recapitulare',
       svg:S.open(760,170)
         +S.node(40,26,330,54,'ZOMBIE','copil mort + părinte viu care nu a apelat wait()','zmb')
         +S.node(400,26,330,54,'ORFAN','părinte mort + copil viu → adoptat de init (PPID=1)','acc')
         +S.text(380,120,'un proces poate fi întâi orfan, apoi zombie? Nu — init îl culege imediat.','sm mut','middle')
         +S.text(380,145,'dar poate fi zombie și orfan simultan? Da: moare, apoi moare și părintele → init îl culege.','sm mut','middle')
         +S.close,
       ce:'<b>Zombie</b> = terminat, dar necules de părinte. <b>Orfan</b> = viu, dar fără părinte (adoptat de init).',
       dece:'Cele două se confundă frecvent la examen. Reține pe cine descrie fiecare termen: zombie = despre <b>copilul mort</b>; orfan = despre <b>copilul viu</b>.'}
    ]
  };
}

PSO.register({
  id:'fork', cat:'procese', icon:'🌳',
  titlu:'fork() și arborele de procese',
  scurt:'Valorile returnate de fork, arbori 2ⁿ, lanț vs stea, zombie & orfan — pas cu pas, cu cod real.',
  desc:'<b>fork()</b> e singura cale prin care UNIX creează procese — și subiectul preferat al examenului. Urmărește cum crește arborele de procese la fiecare pas, ce valoare vede fiecare proces și ce se întâmplă când părintele nu-și „culege” copiii.',
  ani:[2010,2016,2023,2024],
  nota:'Subiectul din <b>2023</b> a cerut exact: valorile posibile returnate de fork(), câte procese copil se creează cu și fără <code>if(pid&gt;0)</code>, și output-ul unui program cu getpid()/getppid(). Subiectul din <b>2024</b> a folosit fork() dublu pentru un server cu 2 procese.',
  scenarii:[
    {id:'baza',    nume:'fork() de bază',       build:scBaza},
    {id:'putere',  nume:'2ⁿ procese (2023)',    build:scPutere},
    {id:'variante',nume:'cine iese din buclă?', build:scVariante},
    {id:'zombie',  nume:'zombie & orfan',       build:scZombie}
  ]
});
})();

/* ============================================================
   2) Stările unui proces & context switch
   ============================================================ */
(function(){

/* mașina de stări: desenează cele 5 stări + tranzițiile
   activ  = id-ul stării active
   edgeOn = id-ul tranziției parcurse acum
   bad    = tranziție ilegală de evidențiat (roșu, punctat)      */
var ST={
  NEW:       {x:20,  y:96, w:110, nume:'NEW',        sub:'se creează'},
  READY:     {x:210, y:96, w:130, nume:'READY',      sub:'vrea CPU'},
  RUNNING:   {x:430, y:96, w:130, nume:'RUNNING',    sub:'pe CPU'},
  WAITING:   {x:320, y:230, w:130, nume:'WAITING',   sub:'așteaptă I/O'},
  TERMINATED:{x:620, y:96, w:120, nume:'TERMINATED', sub:'terminat'}
};
var TR={
  admit:   {a:'NEW',b:'READY',lbl:'admis'},
  dispatch:{a:'READY',b:'RUNNING',lbl:'dispatch'},
  preempt: {a:'RUNNING',b:'READY',lbl:'cuantă expirată / preempted'},
  block:   {a:'RUNNING',b:'WAITING',lbl:'cere I/O (read, sleep…)'},
  wake:    {a:'WAITING',b:'READY',lbl:'I/O gata'},
  exit:    {a:'RUNNING',b:'TERMINATED',lbl:'exit()'}
};
function masina(activ, edgeOn, o){
  o=o||{};
  var out=S.open(760,320);
  function box(id){
    var s=ST[id], on=(id===activ);
    var cls = on ? (id==='RUNNING'?'run':id==='WAITING'?'blk':id==='TERMINATED'?'zmb':id==='READY'?'rdy':'acc') : '';
    return '<g'+(on?' class="sv-hot"':'')+'>'+S.rect(s.x,s.y,s.w,56,'sv-n '+cls,11)
      +S.text(s.x+s.w/2,s.y+24,s.nume,'b mono','middle')
      +S.text(s.x+s.w/2,s.y+42,s.sub,'xs mut','middle')+'</g>';
  }
  function edge(id,cls,mk){
    var t=TR[id],a=ST[t.a],b=ST[t.b],d='',lx,ly;
    if(id==='admit'||id==='dispatch'||id==='exit'){
      d='M'+(a.x+a.w)+' '+(a.y+22)+' L'+b.x+' '+(b.y+22); lx=(a.x+a.w+b.x)/2; ly=a.y+14;
    } else if(id==='preempt'){
      d='M'+b.x+' '+(b.y+44)+' L'+(a.x+a.w)+' '+(a.y+44)+''; /* invers, sub */
      d='M'+(a.x)+' '+(a.y+44)+' L'+(ST.READY.x+ST.READY.w)+' '+(ST.READY.y+44); lx=(a.x+ST.READY.x+ST.READY.w)/2; ly=a.y+62;
    } else if(id==='block'){
      var x1=ST.RUNNING.x+55, y1=ST.RUNNING.y+56, x2=ST.WAITING.x+ST.WAITING.w-10, y2=ST.WAITING.y;
      d='M'+x1+' '+y1+' C'+x1+' '+(y1+40)+','+(x2+30)+' '+(y2-36)+','+x2+' '+y2; lx=x2+64; ly=(y1+y2)/2+4;
    } else if(id==='wake'){
      var x1b=ST.WAITING.x+18, y1b=ST.WAITING.y, x2b=ST.READY.x+65, y2b=ST.READY.y+56;
      d='M'+x1b+' '+y1b+' C'+x1b+' '+(y1b-40)+','+x2b+' '+(y2b+36)+','+x2b+' '+y2b; lx=x1b-72; ly=(y1b+y2b)/2+4;
    }
    var on=(id===edgeOn);
    return '<path d="'+d+'" class="sv-l '+(cls||(on?'acc':'dim'))+(o.bad===id?' red dash':'')+'" marker-end="url(#ma'+(on?'-acc':(o.bad===id?'-red':''))+')"/>'
      +S.text(lx,ly,t.lbl,'xs '+(on?'acc b':'mut'),'middle');
  }
  out+=edge('admit')+edge('dispatch')+edge('preempt')+edge('block')+edge('wake')+edge('exit');
  for(var id in ST) out+=box(id);
  if(o.cs!=null) out+=S.badge(660,26,'context switch: '+o.cs,'sv-fill-org');
  if(o.extra) out+=o.extra;
  return out+S.close;
}

function scCiclu(){
  return {
    stageTitlu:'Mașina de stări a procesului',
    legenda:[{c:'rdy',t:'READY'},{c:'run',t:'RUNNING'},{c:'blk',t:'WAITING'},{c:'zmb',t:'TERMINATED'}],
    pasi:[
      {titlu:'NEW — procesul se naște',
       svg:masina('NEW',null,{cs:0}),
       ce:'fork() a creat procesul: kernelul îi construiește <b>PCB-ul</b> (PID, spațiu de adrese, tabela de fd). Încă nu concurează pentru CPU.',
       dece:'Starea NEW există ca să separe <b>crearea</b> (alocarea structurilor) de <b>competiția pentru CPU</b> — un proces incomplet nu poate fi planificat.'},
      {titlu:'admis → READY',
       svg:masina('READY','admit',{cs:0}),
       ce:'Procesul intră în <b>coada READY</b>: e gata de execuție și <b>așteaptă doar CPU</b>. Poate sta aici oricât — depinde de planificator.',
       dece:'READY nu înseamnă „face ceva”, ci „ar putea rula chiar acum dacă ar primi CPU”. Toate procesele gata de rulare stau în această coadă.'},
      {titlu:'dispatch → RUNNING (context switch)',
       svg:masina('RUNNING','dispatch',{cs:1}),
       ce:'Planificatorul îl alege: <b>dispatcher-ul</b> încarcă registrele, contorul de program și spațiul de adrese ale procesului → <b>context switch</b>. Procesul execută instrucțiuni pe CPU.',
       dece:'Pe un sistem cu un singur nucleu, <b>cel mult un proces</b> e în RUNNING la un moment dat — de aici toate întrebările de numărat context switch-uri.'},
      {titlu:'cuanta expiră → înapoi în READY',
       svg:masina('READY','preempt',{cs:2}),
       ce:'Timer-ul hardware anunță că <b>cuanta de timp</b> a expirat → kernelul îl <b>preemptează</b>: salvează contextul și îl pune la coada READY. Alt proces primește CPU.',
       dece:'Asta e diferența <b>preemptiv vs cooperativ</b>: procesul nu cedează de bunăvoie — kernelul îl întrerupe. RUNNING→READY înseamnă „mai are treabă, dar i s-a luat CPU-ul”.'},
      {titlu:'dispatch din nou → RUNNING',
       svg:masina('RUNNING','dispatch',{cs:3}),
       ce:'Când îi vine iar rândul, procesul e <b>re-dispecerizat</b>: încă un context switch, execuția continuă exact de unde a fost întreruptă.',
       dece:'Contextul salvat (registre + PC) garantează că procesul <b>nu observă</b> întreruperea — iluzia de execuție continuă e temelia multitasking-ului.'},
      {titlu:'cere I/O → WAITING (blocat)',
       svg:masina('WAITING','block',{cs:4}),
       ce:'Procesul apelează <code>read()</code> de pe disc (sau sleep, sau așteaptă un semafor). Nu mai are ce executa până nu vin datele → kernelul îl mută în <b>WAITING</b> și dă CPU-ul altcuiva.',
       dece:'Ar fi risipă să ții pe CPU un proces care doar așteaptă discul (de mii de ori mai lent). <b>RUNNING→WAITING e voluntar</b> (procesul a cerut ceva); RUNNING→READY e forțat.'},
      {titlu:'I/O gata → READY (nu direct RUNNING!)',
       svg:masina('READY','wake',{cs:4}),
       ce:'Întreruperea de la disc anunță: datele au sosit. Procesul e trezit și mutat în <b>READY</b> — <b>nu</b> direct în RUNNING.',
       dece:'CPU-ul poate fi ocupat de alt proces. Trezirea îl face doar <b>eligibil</b>; planificatorul decide când primește efectiv CPU. Capcană clasică de grilă: WAITING→RUNNING direct <b>nu există</b>.'},
      {titlu:'exit() → TERMINATED',
       svg:masina('TERMINATED','exit',{cs:5}),
       ce:'Procesul își termină treaba și apelează <code>exit()</code>. Eliberează resursele, dar PCB-ul rămâne până îl culege părintele cu wait() — starea <b>zombie</b>.',
       dece:'Tranziția spre TERMINATED pleacă <b>doar din RUNNING</b>: ca să mori, trebuie să rulezi instrucțiunea exit. Un proces din READY sau WAITING poate fi doar omorât cu un semnal (care tot îl trece prin execuție).'}
    ]
  };
}

/* --- scenariul 2: numără context switch-urile (stil subiect 2023) --- */
function scTimeline(){
  /* P1: CPU 2ms, I/O 3ms, CPU 2ms;  P2: CPU 4ms; un singur nucleu */
  var SEG={ P1:[['run',0,2],['blk',2,5],['rdy',5,6],['run',6,8]],
            P2:[['rdy',0,2],['run',2,6],['end',6,6]] };
  function lane(y,nume,segs,tMax){
    var x0=90, sc=(760-110)/tMax, out=S.text(20,y+21,nume,'b mono');
    segs.forEach(function(s){
      var cls=s[0], x=x0+s[1]*sc, w=(s[2]-s[1])*sc;
      if(w<=0) return;
      var fill=cls==='run'?'sv-fill-grn':cls==='rdy'?'sv-fill-blu':cls==='blk'?'sv-fill-org':'sv-fill-mut';
      out+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="30" rx="5" class="'+fill+'" opacity="0.82"/>';
      out+=S.text(x+w/2,y+20,cls==='run'?'RUN':cls==='rdy'?'READY':(cls==='blk'?'I/O':''),'xs b onacc','middle');
    });
    return out;
  }
  function timeline(t,cs,note){
    var tMax=8, x0=90, sc=(760-110)/tMax;
    var out=S.open(760,240);
    /* axa timpului */
    for(var i=0;i<=tMax;i++){
      var x=x0+i*sc;
      out+=S.line(x,36,x,150,'dim',null)+S.text(x,168,String(i),'xs mono mut','middle');
    }
    out+=lane(44,'P1',SEG.P1.map(function(s){ return [s[0],s[1],Math.min(s[2],t)]; }).filter(function(s){return s[2]>s[1];}),tMax);
    out+=lane(96,'P2',SEG.P2.map(function(s){ return [s[0],s[1],Math.min(s[2],t)]; }).filter(function(s){return s[2]>s[1];}),tMax);
    /* momentul curent */
    var xc=x0+t*sc;
    out+=S.line(xc,26,xc,158,'acc',null)+S.badge(xc,16,'t='+t+'ms','sv-fill-acc');
    out+=S.badge(660,206,'context switch: '+cs,'sv-fill-org');
    if(note) out+=S.text(90,206,note,'sm mut');
    return out+S.close;
  }
  return {
    stageTitlu:'Un singur nucleu: P1 (CPU 2 · I/O 3 · CPU 2) și P2 (CPU 4)',
    legenda:[{c:'run',t:'RUNNING'},{c:'rdy',t:'READY'},{c:'blk',t:'WAITING (I/O)'}],
    pasi:[
      {titlu:'t=0 — P1 primește CPU',
       svg:timeline(0,0,'ambele sosesc la t=0; planificatorul alege P1'),
       ce:'La t=0 ambele procese sunt READY. Planificatorul îl <b>dispecerizează pe P1</b>; P2 rămâne în coada READY.',
       dece:'Un singur nucleu ⇒ un singur RUNNING. Numărăm de acum fiecare schimbare de proces pe CPU.'},
      {titlu:'t=2 — P1 cere I/O → switch la P2',
       svg:timeline(2,1),
       ce:'P1 și-a terminat prima „explozie” de CPU (2 ms) și cere I/O → trece în <b>WAITING</b>. CPU-ul ar rămâne gol, așa că kernelul face <b>context switch #1</b> către P2.',
       dece:'Blocarea voluntară e cel mai frecvent motiv de context switch: procesul nu mai poate folosi CPU-ul, deci îl cedează. P2: READY → RUNNING.'},
      {titlu:'t=5 — I/O-ul lui P1 s-a terminat',
       svg:timeline(5,1),
       ce:'Discul termină după 3 ms: P1 e trezit → <b>READY</b>. Dar <b>P2 nu e întrerupt</b> — continuă să ruleze.',
       dece:'Trezirea din I/O nu ia CPU-ul nimănui (în planificarea fără priorități preemptive). P1 doar reintră în competiție. <b>Nu e context switch</b> — CPU-ul rămâne la P2.'},
      {titlu:'t=6 — P2 se termină → switch la P1',
       svg:timeline(6,2),
       ce:'P2 și-a consumat cele 4 ms de CPU și face exit → <b>context switch #2</b>: P1 trece din READY în RUNNING pentru ultimele 2 ms.',
       dece:'Terminarea procesului forțează alegerea altuia din coada READY. P1 își reia execuția exact de unde a rămas (contextul salvat).'},
      {titlu:'t=8 — gata: 2 context switch-uri',
       svg:timeline(8,2,'P1: run 0-2, I/O 2-5, ready 5-6, run 6-8 · P2: ready 0-2, run 2-6'),
       ce:'Execuția completă a durat 8 ms, cu <b>2 schimbări de context</b> (t=2 și t=6). Fiecare proces a trecut prin READY / RUNNING / WAITING exact ca în mașina de stări.',
       dece:'Subiectul din <b>2023</b> cerea o planificare cu „cel puțin 2 schimbări de context” și starea fiecărui proces în timp — adică exact acest desen. Convenție de examen: dispatch-ul inițial de la t=0 nu se numără de obicei; dacă îl numeri, spune explicit.'}
    ]
  };
}

/* --- scenariul 3: tranziții-capcană --- */
function scCapcane(){
  return {
    stageTitlu:'Care tranziții NU există?',
    pasi:[
      {titlu:'WAITING → RUNNING? NU',
       svg:masina('WAITING',null,{bad:'wake',extra:
         S.text(380,300,'după I/O procesul devine READY; doar dispatcher-ul îl poate face RUNNING','xs red','middle')}),
       ce:'Un proces trezit din I/O <b>nu sare direct pe CPU</b> — merge în coada READY și așteaptă dispatch.',
       dece:'CPU-ul poate fi ocupat. Dacă trezirea ar însemna rulare imediată, două procese ar fi „RUNNING” simultan pe un nucleu — imposibil.'},
      {titlu:'READY → WAITING? NU',
       svg:masina('READY',null,{extra:
         '<path d="M'+(ST.READY.x+40)+' '+(ST.READY.y+56)+' C'+(ST.READY.x+40)+' '+(ST.READY.y+120)+','+(ST.WAITING.x-30)+' '+(ST.WAITING.y+10)+','+ST.WAITING.x+' '+(ST.WAITING.y+20)+'" class="sv-l red dash" marker-end="url(#ma-red)"/>'
         +S.text(160,300,'ca să ceri I/O trebuie să EXECUȚI apelul read() — deci să fii RUNNING','xs red')}),
       ce:'Din READY nu poți trece în WAITING: blocarea se întâmplă <b>doar executând</b> un apel blocant (read, sleep, sem_wait…).',
       dece:'Un proces din READY nu execută nimic — deci nu are cum să „ceară” I/O. Orice blocare pleacă din RUNNING.'},
      {titlu:'READY → TERMINATED? (aproape) NU',
       svg:masina('READY',null,{extra:
         '<path d="M'+(ST.READY.x+ST.READY.w-20)+' '+(ST.READY.y)+' C'+(ST.READY.x+ST.READY.w+40)+' '+(ST.READY.y-46)+','+(ST.TERMINATED.x-60)+' '+(ST.TERMINATED.y-40)+','+ST.TERMINATED.x+' '+(ST.TERMINATED.y+6)+'" class="sv-l red dash" marker-end="url(#ma-red)"/>'
         +S.text(420,30,'exit() e o instrucțiune — se execută din RUNNING','xs red')}),
       ce:'Terminarea normală cere execuția lui <code>exit()</code> → doar din RUNNING. Excepția practică: un <b>semnal fatal</b> (SIGKILL) poate elimina un proces din orice stare.',
       dece:'La grile, răspunsul „de manual” este: tranziția spre TERMINATED pleacă din RUNNING. Menționează excepția semnalelor doar dacă întrebarea o cere.'},
      {titlu:'recapitulare: cele 6 tranziții legale',
       svg:masina(null,null,{extra:S.text(380,300,'admis · dispatch · preempted · cere I/O · I/O gata · exit — atât și nimic altceva','sm acc b','middle')}),
       ce:'Mașina de stări completă are exact <b>6 tranziții</b>. Orice altă săgeată propusă într-o grilă e greșită.',
       dece:'Subiectul din 2015 cerea enumerarea stărilor, cauzele tranzițiilor și câte procese pot fi în fiecare stare: RUNNING ≤ numărul de nuclee; READY/WAITING — oricâte.'}
    ]
  };
}

PSO.register({
  id:'stari', cat:'procese', icon:'🔄',
  titlu:'Stările unui proces & context switch',
  scurt:'Mașina de stări READY/RUNNING/WAITING, cine declanșează fiecare tranziție și cum numeri context switch-urile.',
  desc:'Fiecare proces trăiește în <b>mașina de stări</b> a kernelului. Simulatorul parcurge tranzițiile una câte una, apoi numără context switch-urile pe un caz concret cu două procese — exact ca la subiect.',
  ani:[2015,2023],
  nota:'În <b>2015</b>: „enumerați stările, cauzele tranzițiilor, câte procese pot fi în fiecare stare”. În <b>2023</b>: „descrieți o planificare cu cel puțin 2 schimbări de context, cu starea fiecărui proces (running, ready, blocked)”.',
  scenarii:[
    {id:'ciclu',   nume:'ciclul de viață',          build:scCiclu},
    {id:'timeline',nume:'numără context switch-urile', build:scTimeline},
    {id:'capcane', nume:'tranziții-capcană',        build:scCapcane}
  ]
});
})();

/* ============================================================
   3) Copy-On-Write după fork()
   ============================================================ */
(function(){

/* două tabele de pagini + cadrele fizice; săgețile arată maparea */
function cow(o){
  o=o||{};
  var out=S.open(760,330);
  /* tabela părintelui */
  out+=S.text(90,26,'Tabela de pagini — părinte','sm b','middle');
  /* tabela copilului */
  if(o.copil) out+=S.text(670,26,'Tabela de pagini — copil','sm b','middle');
  /* cadre fizice în mijloc */
  out+=S.text(380,26,'Memoria fizică (cadre)','sm b mut','middle');

  var pag=[{n:'cod',perm:o.permCod||'r-x'},{n:'date',perm:o.permDate||(o.cow?'r--':'rw-')},{n:'stivă',perm:o.permStk||(o.cow?'r--':'rw-')}];
  var frames=[{id:'f1',n:'cadrul 7 · cod',y:52},{id:'f2',n:'cadrul 12 · date',y:132},{id:'f3',n:'cadrul 19 · stivă',y:212},
              {id:'f4',n:'cadrul 23 · date′',y:292}];
  /* părinte: rânduri */
  pag.forEach(function(p,i){
    var y=52+i*80;
    out+=S.rect(20,y,150,44,'sv-n'+(o.hotP===i?' acc':''),8);
    out+=S.text(45,y+20,p.n,'b');
    out+=S.text(45,y+36,(o.permP&&o.permP[i])||p.perm,'xs mono '+(((o.permP&&o.permP[i])||p.perm).indexOf('w')>=0?'grn':'org'));
  });
  /* copil: rânduri */
  if(o.copil) pag.forEach(function(p,i){
    var y=52+i*80;
    out+=S.rect(590,y,150,44,'sv-n'+(o.hotC===i?' acc':''),8);
    out+=S.text(615,y+20,p.n,'b');
    out+=S.text(615,y+36,(o.permC&&o.permC[i])||p.perm,'xs mono '+(((o.permC&&o.permC[i])||p.perm).indexOf('w')>=0?'grn':'org'));
  });
  /* cadre */
  frames.forEach(function(f,i){
    if(i===3 && !o.f4) return;
    var refs=o.refs?o.refs[i]:null;
    out+=S.rect(300,f.y,160,40,'sv-n deep'+(o.hotF===i?' acc':''),8);
    out+=S.text(380,f.y+18,f.n,'xs mono soft','middle');
    if(refs!=null) out+=S.text(380,f.y+33,'ref = '+refs,'xs mono '+(refs>1?'org':'grn'),'middle');
  });
  /* mapări părinte -> cadre */
  var mapP=o.mapP||[0,1,2];
  mapP.forEach(function(fi,pi){
    var y1=52+pi*80+22, y2=frames[fi].y+20;
    out+=S.curve(170,y1,300,y2,(o.hotP===pi?'acc':''),o.hotP===pi?'acc':'');
  });
  if(o.copil){
    var mapC=o.mapC||[0,1,2];
    mapC.forEach(function(fi,pi){
      var y1=52+pi*80+22, y2=frames[fi].y+20;
      out+='<path d="M590 '+y1+' C520 '+y1+',530 '+y2+',460 '+y2+'" class="sv-l '+(o.hotC===pi?'acc':'')+'" marker-end="url(#ma'+(o.hotC===pi?'-acc':'')+')"/>';
    });
  }
  if(o.fault) out+=S.badge(380,313,'PAGE FAULT la scriere → kernelul copiază pagina','sv-fill-red');
  if(o.nota) out+=S.text(380,316,o.nota,'xs mut','middle');
  return out+S.close;
}

function scCow(){
  return {
    stageTitlu:'Tabele de pagini + cadre fizice',
    legenda:[{c:'acc',t:'activ acum'},{c:'blk',t:'read-only'},{c:'run',t:'read-write'}],
    pasi:[
      {titlu:'înainte de fork: un proces, 3 pagini',
       svg:cow({nota:'părintele are cod (r-x), date (rw-), stivă (rw-)'}),
       ce:'Părintele are trei pagini mapate pe trei cadre fizice: <b>cod</b> (r-x), <b>date</b> (rw-), <b>stivă</b> (rw-). Tabela de pagini traduce paginile virtuale în cadre.',
       dece:'Permisiunile stau <b>în tabela de pagini</b>, per pagină — pe ele se sprijină întregul truc Copy-On-Write.'},
      {titlu:'fork(): se copiază TABELA, nu memoria',
       svg:cow({copil:true,cow:true,permP:['r-x','r--','r--'],refs:[2,2,2],nota:'ambele tabele arată spre ACELEAȘI cadre; paginile scriibile devin read-only'}),
       ce:'fork() duplică doar <b>tabela de pagini</b>: copilul arată spre <b>aceleași cadre fizice</b> (ref = 2). Paginile care erau rw- sunt marcate <b>read-only în ambele procese</b>.',
       dece:'Copierea a giga-octeți de memorie ar face fork() inutilizabil de lent. COW amână copierea până când chiar e nevoie — de multe ori (fork + exec) nu e nevoie deloc.'},
      {titlu:'copilul CITEȘTE → nimic special',
       svg:cow({copil:true,cow:true,permP:['r-x','r--','r--'],refs:[2,2,2],hotC:1,hotF:1}),
       ce:'Copilul citește o variabilă din pagina de date. Citirea pe o pagină read-only e <b>perfect legală</b> — merge direct, fără intervenția kernelului.',
       dece:'Partajarea e invizibilă cât timp nimeni nu scrie: ambele procese văd aceleași valori, pentru că e fizic aceeași memorie.'},
      {titlu:'copilul SCRIE → page fault → copie',
       svg:cow({copil:true,cow:true,permP:['r-x','r--','r--'],permC:['r-x','rw-','r--'],refs:[2,1,2],mapC:[0,3,2],f4:true,hotC:1,hotF:3,fault:true}),
       ce:'Copilul scrie în pagina de date → MMU vede „read-only” → <b>page fault</b>. Kernelul recunoaște pagina COW: <b>alocă un cadru nou (23), copiază conținutul</b>, remapează pagina copilului ca rw-.',
       dece:'Abia acum se plătește costul copierii — și doar pentru <b>pagina atinsă</b>, nu pentru tot spațiul de adrese. Părintele nu simte nimic: cadrul lui 12 rămâne neschimbat.'},
      {titlu:'părintele scrie și el → fără copie',
       svg:cow({copil:true,permP:['r-x','rw-','r--'],permC:['r-x','rw-','r--'],refs:[2,1,2],mapC:[0,3,2],f4:true,hotP:1,hotF:1,nota:'ref=1 ⇒ pagina nu mai e partajată: kernelul o face direct rw-'}),
       ce:'Când scrie și părintele în pagina lui de date, kernelul vede că <b>ref = 1</b> (nu o mai partajează nimeni) → o marchează direct <b>rw-</b>, fără să copieze nimic.',
       dece:'Contorul de referințe decide: ref &gt; 1 ⇒ copiază; ref = 1 ⇒ doar schimbă permisiunea. Așa fiecare pagină e copiată <b>cel mult o dată</b>.'},
      {titlu:'de ce fork + exec e ieftin',
       svg:cow({copil:true,cow:true,permP:['r-x','r--','r--'],refs:[2,2,2],nota:'exec() aruncă oricum tot spațiul copilului → nu s-ar fi copiat nimic degeaba'}),
       ce:'Modelul tipic din shell: <code>fork()</code> apoi imediat <code>exec()</code>. exec aruncă întregul spațiu de adrese al copilului și încarcă alt program — deci paginile <b>nu ar fi fost folosite oricum</b>.',
       dece:'Fără COW, fork ar copia tot doar ca exec să arunce totul o microsecundă mai târziu. Cu COW, fork+exec costă doar copierea tabelei de pagini. Întrebare frecventă din banca de întrebări a cursului.'}
    ]
  };
}

PSO.register({
  id:'cow', cat:'procese', icon:'🐑',
  titlu:'Copy-On-Write după fork()',
  scurt:'De ce fork() nu copiază memoria: pagini partajate read-only, page fault la scriere, copierea leneșă.',
  desc:'fork() pare că duplică tot spațiul de adrese — în realitate kernelul folosește <b>Copy-On-Write</b>: paginile se partajează read-only și se copiază abia la prima scriere. Simulatorul arată tabelele de pagini, contorul de referințe și page fault-ul care declanșează copierea.',
  ani:[],
  notaTag:'Curs',
  nota:'COW apare în cursurile 4 (Procese) și 6 (Memoria virtuală) și în banca de întrebări a cursului („de ce e rapid fork?”, „ce se întâmplă la scriere după fork?”). În subiectele de licență nu a apărut direct — dar explică răspunsurile corecte la întrebările despre fork.',
  scenarii:[
    {id:'cow', nume:'pas cu pas', build:scCow}
  ]
});
})();
