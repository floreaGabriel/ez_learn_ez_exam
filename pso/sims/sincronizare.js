/* ============================================================
   Simulatoare · Fire & sincronizare — threaduri, producător–
   consumator, explorator de întrețeseri, deadlock
   ============================================================ */
"use strict";

/* ============================================================
   4) Threaduri vs procese & mutex
   ============================================================ */
(function(){

/* procesul cu firele lui: zonele partajate sus, per-thread jos */
function casaFirelor(o){
  o=o||{};
  var out=S.open(760,330);
  out+=S.rect(14,14,732,302,'sv-n ghost',14);
  out+=S.text(30,38,'PROCES · PID 4200','b mono acc');
  /* partajate */
  out+=S.text(30,66,'PARTAJATE de toate firele:','xs mut');
  var sh=[['cod (.text)','r-x'],['globale (.data/.bss)','rw-'],['heap','rw-'],['tabela de fd','0,1,2…']];
  sh.forEach(function(s,i){
    var x=30+i*178;
    out+=S.rect(x,76,166,44,'sv-n deep'+(o.hotSh===i?' acc':''),8);
    out+=S.text(x+83,95,s[0],'xs b','middle');
    out+=S.text(x+83,111,s[1],'xs mono mut','middle');
  });
  /* fire */
  var fire=o.fire!=null?o.fire:1;
  for(var t=0;t<fire;t++){
    var y=150, x=30+t*360;
    var hot=o.hotT===t;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(x,y,330,148,'sv-n'+(hot?' acc':''),10);
    out+=S.text(x+14,y+24,(t===0?'main (T1)':'T'+(t+1)),'b mono'+(hot?' acc':''));
    out+=S.text(x+14,y+42,'PRIVATE firului:','xs mut');
    var pv=[['stivă proprie','local, cadre'],['registre + PC','contextul'],['TLS + errno','per-fir']];
    pv.forEach(function(p,i){
      var px=x+14+i*104;
      out+=S.rect(px,y+52,96,52,'sv-n deep',7);
      out+=S.text(px+48,y+73,p[0],'xs b','middle');
      out+=S.text(px+48,y+89,p[1],'xs mut','middle');
    });
    if(o.subT && o.subT[t]) out+=S.text(x+14,y+128,o.subT[t],'xs '+(hot?'acc':'mut'));
    out+='</g>';
  }
  if(o.msg) out+=S.text(380,318,o.msg,'xs mut','middle');
  return out+S.close;
}

/* două procese complet separate (comparativ cu fork) */
function douaProcese(){
  var out=S.open(760,300);
  [['PID 4200 · părinte',30],['PID 4201 · copil (fork)',390]].forEach(function(p){
    var x=p[1];
    out+=S.rect(x,30,340,240,'sv-n ghost',14);
    out+=S.text(x+16,56,p[0],'b mono acc');
    var z=[['cod','partajabil r-x'],['date + heap','COPIE separată'],['stivă','COPIE separată'],['tabela fd','copiată (cursor comun!)']];
    z.forEach(function(s,i){
      out+=S.rect(x+16,70+i*48,308,40,'sv-n deep',8);
      out+=S.text(x+30,70+i*48+18,s[0],'xs b');
      out+=S.text(x+30,70+i*48+33,s[1],'xs mut');
    });
  });
  out+=S.line(370,150,390,150,'red dash',null);
  out+=S.text(380,288,'între procese: memorie separată ⇒ comunicare doar prin IPC (pipe, mmap, semnale…)','xs red','middle');
  return out+S.close;
}

function scPartajare(){
  var cod=[
'int global = 0;            /* partajat  */',
'',
'void *f(void *arg){',
'    int local = 7;         /* pe stivă — privat */',
'    global++;              /* toți îl văd */',
'    return NULL;',
'}',
'',
'int main(void){',
'    pthread_t t2, t3;',
'    pthread_create(&t2, NULL, f, NULL);',
'    pthread_create(&t3, NULL, f, NULL);',
'    pthread_join(t2, NULL);',
'    pthread_join(t3, NULL);',
'}'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Un proces, mai multe fire',
    pasi:[
      {titlu:'un proces = un fir la început', linii:[9],
       svg:casaFirelor({fire:1,hotT:0,subT:['singurul fir: execută main()']}),
       ce:'La pornire, procesul are <b>un singur fir</b> (main). Firul e unitatea care <b>execută</b>; procesul e containerul de resurse (memorie, fd-uri).',
       dece:'Separarea proces = resurse / fir = execuție explică tot ce urmează: firele noi primesc doar ce ține de execuție.'},
      {titlu:'pthread_create → apare T2', linii:[11],
       svg:casaFirelor({fire:2,hotT:1,subT:['își vede de main()','rulează f() în paralel']}),
       ce:'<code>pthread_create</code> pornește un fir nou care execută <code>f()</code>. T2 primește <b>stivă proprie, registre proprii, TLS</b> — dar împarte cu T1 <b>codul, globalele, heap-ul și tabela de fd</b>.',
       dece:'Crearea unui fir nu copiază spațiul de adrese (spre deosebire de fork) — de aceea e mult mai ieftină și comunicarea între fire e banală: o variabilă globală.'},
      {titlu:'global++ e văzut de toți; local nu', linii:[4,5],
       svg:casaFirelor({fire:2,hotSh:1,hotT:1,subT:['vede global schimbat','scrie în global']}),
       ce:'<code>global</code> stă în <b>.data</b>, zonă partajată: orice fir îl citește/scrie. <code>local</code> stă pe <b>stiva lui T2</b> — celelalte fire nici nu știu de el.',
       dece:'Regula de aur la examen: <b>globale + heap = partajate; stiva = privată</b>. Partajarea e puterea firelor — și sursa race condition-urilor (vezi scenariul „contor++ pierdut”).'},
      {titlu:'comparație: fork() separă tot', linii:[],
       svg:douaProcese(),
       ce:'La <code>fork()</code>, copilul primește o <b>copie</b> (leneșă, COW) a întregii memorii: după fork, <code>global++</code> într-un proces <b>nu se vede</b> în celălalt.',
       dece:'Întrebare clasică: „prin ce diferă un fir de un proces?” — memoria. Fire = un spațiu de adrese comun; procese = spații separate, comunicare doar prin IPC explicit (pipe, mmap partajat, socketuri).'},
      {titlu:'bonus: context switch mai ieftin între fire', linii:[],
       svg:casaFirelor({fire:2,msg:'switch T1→T2: se schimbă doar registrele + stiva; spațiul de adrese și TLB-ul rămân!'}),
       ce:'La comutarea <b>între firele aceluiași proces</b> nu se schimbă spațiul de adrese: rămân valabile tabela de pagini și <b>TLB-ul</b>. Se salvează/încarcă doar registrele.',
       dece:'De aceea „thread switch” e mai ieftin decât „process switch” — întrebare directă din banca de întrebări a cursului. Switch-ul între procese golește TLB-ul (dacă nu există ASID) → penalizări la fiecare acces ulterior.'}
    ]
  };
}

/* --- contor++ pierdut --- */
function lostSvg(o){
  o=o||{};
  var out=S.open(760,280);
  /* variabila partajată */
  out+='<g'+(o.hotC?' class="sv-hot"':'')+'>';
  out+=S.rect(300,26,160,54,'sv-n deep'+(o.hotC?' acc':''),9);
  out+=S.text(380,48,'contor (global)','xs mut','middle');
  out+=S.text(380,70,String(o.contor),'b mono acc','middle');
  out+='</g>';
  /* fire */
  [[30,'T1',o.reg1,o.st1],[530,'T2',o.reg2,o.st2]].forEach(function(t,ti){
    var x=t[0], hot=o.hotT===ti;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(x,120,200,110,'sv-n'+(hot?' acc':''),10);
    out+=S.text(x+16,146,t[1],'b mono'+(hot?' acc':''));
    out+=S.rect(x+16,158,168,40,'sv-n deep',7);
    out+=S.text(x+30,175,'reg (privat)','xs mut');
    out+=S.text(x+30,191,t[2]==null?'—':String(t[2]),'b mono prp');
    if(t[3]) out+=S.text(x+16,220,t[3],'xs '+(hot?'acc':'mut'));
    out+='</g>';
  });
  /* săgeți load/store */
  if(o.arrow==='load1')  out+=S.curve(310,60,190,120,'acc','acc')+S.text(215,86,'LOAD','xs mono acc');
  if(o.arrow==='store1') out+=S.curve(190,120,310,64,'red','red')+S.text(215,86,'STORE','xs mono red');
  if(o.arrow==='load2')  out+=S.curve(450,60,570,120,'acc','acc')+S.text(540,86,'LOAD','xs mono acc');
  if(o.arrow==='store2') out+=S.curve(570,120,450,64,'red','red')+S.text(540,86,'STORE','xs mono red');
  /* mutex */
  if(o.mutex!==undefined){
    out+=S.rect(300,120,160,54,'sv-n '+(o.mutex?'acc':''),9);
    out+=S.text(380,141,'mutex','xs mut','middle');
    out+=S.text(380,161,o.mutex?('ținut de '+o.mutex):'liber','b mono '+(o.mutex?'org':'grn'),'middle');
    if(o.coada) out+=S.text(380,190,'așteaptă: '+o.coada,'xs org','middle');
  }
  if(o.msg) out+=S.text(380,262,o.msg,'sm '+(o.msgCls||'mut'),'middle');
  return out+S.close;
}

function scLost(){
  var cod=[
'int contor = 0;',
'',
'void *inc(void *a){',
'    contor++;      /* NU e atomic! */',
'    return NULL;',
'}',
'/* contor++ înseamnă de fapt: */',
'/*   reg = contor     (LOAD)  */',
'/*   reg = reg + 1    (ADD)   */',
'/*   contor = reg     (STORE) */'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Două fire, un contor — update pierdut',
    legenda:[{c:'acc',t:'activ'},{c:'prp',t:'registru privat'}],
    pasi:[
      {titlu:'contor++ = trei instrucțiuni', linii:[7,8,9,10],
       svg:lostSvg({contor:0,reg1:null,reg2:null,msg:'CPU nu poate incrementa direct în RAM: citește → modifică → scrie'}),
       ce:'<code>contor++</code> pare o operație — dar CPU execută <b>trei</b>: LOAD în registru, ADD, STORE înapoi. Între ele, planificatorul poate comuta firele oricând.',
       dece:'Registrul e <b>privat</b> firului (se salvează la context switch), dar <code>contor</code> e <b>partajat</b>. Aici se naște race condition-ul.'},
      {titlu:'T1: LOAD → reg1 = 0', linii:[8],
       svg:lostSvg({contor:0,reg1:0,reg2:null,hotT:0,arrow:'load1',st1:'a citit 0'}),
       ce:'T1 citește contorul: <b>reg1 = 0</b>.',
       dece:'Valoarea trăiește acum în două locuri: RAM (0) și registrul lui T1 (0). Deocamdată sunt la fel.'},
      {titlu:'context switch! T2: LOAD → reg2 = 0', linii:[8],
       svg:lostSvg({contor:0,reg1:0,reg2:0,hotT:1,arrow:'load2',st1:'preemptat cu reg1=0',st2:'a citit tot 0'}),
       ce:'Înainte ca T1 să apuce să scrie, cuanta îi expiră. T2 rulează și citește <b>aceeași valoare veche: reg2 = 0</b>.',
       dece:'Aici e răul: <b>ambele fire cred că pornesc de la 0</b>. Registrul lui T1 (cu 0) a fost salvat în contextul lui și așteaptă cuminte.'},
      {titlu:'T2: ADD + STORE → contor = 1', linii:[9,10],
       svg:lostSvg({contor:1,reg1:0,reg2:1,hotT:1,arrow:'store2',st1:'încă preemptat',st2:'a scris 1'}),
       ce:'T2 incrementează și scrie: <b>contor = 1</b>. Din punctul lui de vedere, treaba e făcută corect.',
       dece:'T2 nu are de unde ști că T1 e „în mijlocul” propriului increment — firele nu-și văd registrele între ele.'},
      {titlu:'T1 revine: ADD + STORE → contor = 1 (!!)', linii:[9,10],
       svg:lostSvg({contor:1,reg1:1,reg2:1,hotT:0,arrow:'store1',st1:'suprascrie cu 1',st2:'gata',msg:'două incrementări, dar contor = 1 → un update s-a PIERDUT',msgCls:'red b'}),
       ce:'T1 își reia contextul cu <b>reg1 = 0</b> (valoarea veche!), calculează 0+1 și scrie <b>contor = 1</b> — peste 1-ul lui T2. Rezultatul lui T2 <b>s-a pierdut</b>.',
       dece:'Asta e <b>lost update</b>: două incrementări, efect de una singură. Cu N incrementări per fir, rezultatul final poate fi orice între 2 și 2N — grila din 2020 („ce șiruri/valori sunt posibile?”) exact asta testează.'},
      {titlu:'fix: mutex în jurul secțiunii critice', linii:[4],
       svg:lostSvg({contor:2,reg1:1,reg2:2,mutex:null,msg:'cu lock/unlock în jurul lui contor++, execuțiile se serializează: mereu 2',msgCls:'grn b'}),
       ce:'Cu <code>pthread_mutex_lock/unlock</code> în jurul lui <code>contor++</code>, cele 3 instrucțiuni devin <b>secțiune critică</b>: un singur fir le execută la un moment dat → rezultat mereu corect.',
       dece:'Mutexul garantează <b>excludere mutuală</b>. Alternativ: instrucțiuni atomice (test-and-set, compare-and-swap) — pe ele sunt construite mutexurile. Încearcă și scenariul interactiv din „Explorator de întrețeseri”!'},
      {titlu:'cum arată cu mutex, pas critic', linii:[4],
       svg:lostSvg({contor:1,reg1:null,reg2:1,mutex:'T2',coada:'T1',hotT:1,st1:'blocat pe lock()',st2:'în secțiunea critică',msg:'T1 nu poate nici măcar citi contorul până T2 nu dă unlock'}),
       ce:'T2 a luat mutexul primul; T1 a încercat <code>lock()</code> și a fost <b>blocat</b> (stare WAITING, în coada mutexului). Când T2 face unlock, T1 e trezit și își execută incrementul <b>pe valoarea proaspătă</b>.',
       dece:'De remarcat: T1 nu „se învârte” consumând CPU (ca la spinlock) — mutexul îl <b>adoarme</b>. Diferența spinlock vs mutex e întrebare separată în banca de curs.'}
    ]
  };
}

PSO.register({
  id:'threads', cat:'sincronizare', icon:'🧵',
  titlu:'Threaduri vs procese & lost update',
  scurt:'Ce partajează firele, ce rămâne privat, și cum se pierde un contor++ fără mutex.',
  desc:'Firele împart memoria procesului — asta le face rapide <b>și</b> periculoase. Vezi întâi harta partajat/privat, apoi anatomia exactă a unui <code>contor++</code> pierdut și repararea lui cu mutex.',
  ani:[2015,2020,2023,2024],
  nota:'Subiectul <b>2024</b>: server cu fork + pthread_create + mutex — „care este rolul mutexului?”. Grila din <b>2020</b>: „ce șiruri pot fi afișate de 3 fire cu P(mutex)/V(mutex)?”. În <b>2022</b>: „ce semafoare garantează contor = 11?”.',
  scenarii:[
    {id:'partajare', nume:'ce se partajează',   build:scPartajare},
    {id:'lost',      nume:'contor++ pierdut',   build:scLost}
  ]
});
})();

/* ============================================================
   5) Producător–Consumator cu semafoare
   ============================================================ */
(function(){

/* tava circulară cu 8 sloturi + semafoare + actori */
function tava(o){
  o=o||{};
  var buf=o.buf||[0,0,0,0,0,0,0,0];
  var out=S.open(760,340);
  var cx=380, cy=150, R=92;
  /* tava */
  out+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R+30)+'" class="sv-n flat"/>';
  out+=S.text(cx,cy+4,'tava (buffer circular, 8 locuri)','xs mut','middle');
  for(var i=0;i<8;i++){
    var a=-Math.PI/2 + i*Math.PI/4;
    var x=cx+Math.cos(a)*R, y=cy+Math.sin(a)*R;
    var hot=o.hotSlot===i;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+='<circle cx="'+x+'" cy="'+y+'" r="17" class="sv-n '+(buf[i]?'acc':'deep')+'"/>';
    if(buf[i]) out+='<text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="14">🍕</text>';
    else out+=S.text(x,y+4,String(i),'xs mono mut','middle');
    out+='</g>';
  }
  /* actori */
  function actor(x,nume,ico,st,cls,hot){
    var o2='<g'+(hot?' class="sv-hot"':'')+'>';
    o2+=S.rect(x,64,150,64,'sv-n '+(cls||''),10);
    o2+='<text x="'+(x+24)+'" y="'+96+'" font-size="19">'+ico+'</text>';
    o2+=S.text(x+46,88,nume,'b sm');
    o2+=S.text(x+46,106,st,'xs '+(cls==='blk'?'org':'mut'));
    return o2+'</g>';
  }
  out+=actor(16,'Producător','👨‍🍳',o.prodSt||'gata de lucru',o.prodCls,o.hotP);
  out+=actor(594,'Consumator','😋',o.consSt||'îi e foame',o.consCls,o.hotC);
  /* semafoare */
  function semBox(x,nume,val,coada,hot){
    var zero=val===0;
    var o2='<g'+(hot?' class="sv-hot"':'')+'>';
    o2+=S.rect(x,268,206,58,'sv-n'+(hot?' acc':''),10);
    o2+=S.text(x+14,290,nume,'xs mono mut');
    o2+=S.text(x+14,312,String(val),'b mono '+(zero?'red':'grn'));
    if(coada) o2+=S.text(x+60,312,'⏳ '+coada,'xs org');
    return o2+'</g>';
  }
  out+=semBox(24,'sem goluri (locuri libere)',o.goluri,o.qGoluri,o.hotSem==='goluri');
  out+=semBox(258,'sem pline (porții gata)',o.pline,o.qPline,o.hotSem==='pline');
  /* mutex */
  var mHot=o.hotSem==='m';
  out+='<g'+(mHot?' class="sv-hot"':'')+'>';
  out+=S.rect(492,268,244,58,'sv-n'+(mHot?' acc':''),10);
  out+=S.text(506,290,'mutex m (protejează tava)','xs mono mut');
  out+=S.text(506,312,o.mutex?('🔒 ținut de '+o.mutex):'🔓 liber','b mono '+(o.mutex?'org':'grn'));
  if(o.qM) out+=S.text(640,312,'⏳ '+o.qM,'xs org');
  out+='</g>';
  if(o.msg) out+=S.badge(380,246,o.msg,o.msgCls||'sv-fill-acc');
  return out+S.close;
}

function scBuffer(){
  var cod=[
'sem_t goluri;   /* init 8 — locuri libere */',
'sem_t pline;    /* init 0 — porții gata   */',
'pthread_mutex_t m;',
'',
'void producator(void){',
'    sem_wait(&goluri);        /* P(goluri) */',
'    pthread_mutex_lock(&m);',
'    pune_portia();',
'    pthread_mutex_unlock(&m);',
'    sem_post(&pline);         /* V(pline)  */',
'}',
'',
'void consumator(void){',
'    sem_wait(&pline);         /* P(pline)  */',
'    pthread_mutex_lock(&m);',
'    ia_portia();',
'    pthread_mutex_unlock(&m);',
'    sem_post(&goluri);        /* V(goluri) */',
'}'].join('\n');
  var B0=[0,0,0,0,0,0,0,0], BFull=[1,1,1,1,1,1,1,1];
  return {
    cod:cod,
    stageTitlu:'Tava de pizza — bufferul mărginit din subiecte',
    legenda:[{c:'acc',t:'porție / activ'},{c:'blk',t:'blocat'}],
    pasi:[
      {titlu:'inițializare: goluri=8, pline=0', linii:[1,2,3],
       svg:tava({goluri:8,pline:0}),
       ce:'Cele două semafoare <b>numără resursele</b>: <code>goluri</code> = câte locuri libere are tava (8), <code>pline</code> = câte porții sunt gata (0). Mutexul protejează accesul la tavă.',
       dece:'Un semafor Dijkstra e un contor cu așteptare: <b>P/sem_wait</b> scade (și blochează pe 0), <b>V/sem_post</b> crește (și trezește un blocat). Valorile inițiale descriu starea de start a tăvii.'},
      {titlu:'producătorul: P(goluri) → 7', linii:[6],
       svg:tava({goluri:7,pline:0,hotP:true,hotSem:'goluri',prodSt:'a rezervat un loc'}),
       ce:'Producătorul cere un loc liber: <code>P(goluri)</code> reușește (8&gt;0) și scade contorul la <b>7</b>. Și-a „rezervat” dreptul de a pune o porție.',
       dece:'P înainte de a atinge tava: dacă n-ar exista rezervarea, producătorul ar putea pune porții peste o tavă plină. Semaforul contorizează <b>promisiuni</b>, nu doar starea curentă.'},
      {titlu:'lock(m), pune porția, unlock(m)', linii:[7,8,9],
       svg:tava({goluri:7,pline:0,buf:[1,0,0,0,0,0,0,0],hotSlot:0,mutex:'producător',hotSem:'m',prodSt:'pune porția în slotul 0'}),
       ce:'Cu mutexul luat, producătorul <b>modifică tava</b>: pune porția în slotul 0 și avansează indexul de scriere. Apoi eliberează mutexul.',
       dece:'Tava (bufferul + indecșii in/out) e <b>structură partajată</b> — fără mutex, doi actori care o ating simultan o corup (vezi scenariul „fără mutex”).'},
      {titlu:'V(pline) → 1: anunță marfa', linii:[10],
       svg:tava({goluri:7,pline:1,buf:[1,0,0,0,0,0,0,0],hotSem:'pline',prodSt:'a anunțat: e o porție!'}),
       ce:'<code>V(pline)</code> urcă contorul de porții la <b>1</b>. Dacă vreun consumator dormea blocat pe <code>P(pline)</code>, exact acum ar fi trezit.',
       dece:'V se face <b>după</b> ce porția e realmente în tavă — altfel un consumator trezit prea devreme ar găsi tava goală.'},
      {titlu:'consumatorul: P(pline), ia porția, V(goluri)', linii:[14,15,16,17,18],
       svg:tava({goluri:8,pline:0,hotC:true,consSt:'a mâncat porția 0',msg:'ciclul complet: P(goluri)…V(pline) / P(pline)…V(goluri)'}),
       ce:'Consumatorul face oglinda: <code>P(pline)</code> (ia „biletul” pentru o porție), lock, scoate porția, unlock, <code>V(goluri)</code> (a eliberat un loc).',
       dece:'Simetria e cheia: fiecare actor <b>consumă</b> un semafor și <b>alimentează</b> celălalt semafor. Ce scade unul, crește celălalt.'},
      {titlu:'tava plină: goluri = 0', linii:[6],
       svg:tava({goluri:0,pline:8,buf:BFull,prodSt:'vrea să mai pună…'}),
       ce:'Producătorul a fost harnic: <b>8 porții</b>, tava plină, <code>goluri = 0</code>, <code>pline = 8</code>.',
       dece:'Invariantul de verificat la examen: <code>goluri + pline = 8</code> (când nimeni nu e „în mijlocul” unei operații). Dacă nu iese, soluția din subiect e greșită.'},
      {titlu:'P(goluri) pe 0 → producătorul DOARME', linii:[6],
       svg:tava({goluri:0,pline:8,buf:BFull,prodCls:'blk',prodSt:'BLOCAT pe goluri',qGoluri:'producătorul',msg:'blocare pe tavă plină — exact condiția cerută în subiecte',msgCls:'sv-fill-org'}),
       ce:'Următorul <code>P(goluri)</code> găsește contorul pe <b>0</b> → producătorul e pus în <b>coada semaforului</b> și trece în WAITING. Nu consumă CPU.',
       dece:'Asta e „blocarea producătorului pe buffer plin” din enunțurile de examen. Fără semafor ar trebui să verifice în buclă (busy-waiting) — risipă de CPU.'},
      {titlu:'un consumator mănâncă → V(goluri) îl trezește', linii:[18],
       svg:tava({goluri:1,pline:7,buf:[0,1,1,1,1,1,1,1],hotSem:'goluri',hotC:true,prodSt:'trezit! reia P(goluri)',consSt:'a luat porția 0',msg:'V pe un semafor cu procese în coadă = trezește unul'}),
       ce:'Consumatorul ia o porție și face <code>V(goluri)</code>: contorul ar deveni 1, dar există cineva în coadă → <b>producătorul e trezit</b> și își continuă treaba.',
       dece:'Simetric, pe <b>tavă goală</b> consumatorii dorm pe <code>P(pline)</code> și îi trezește <code>V(pline)</code> al producătorului. Cele două blocări sunt întrebarea „când se blochează fiecare?” din banca de curs.'},
      {titlu:'recapitulare: cine ce păzește', linii:[1,2,3],
       svg:tava({goluri:5,pline:3,buf:[0,1,1,1,0,0,0,0],msg:'goluri+pline = 8 ✓'}),
       ce:'<b>goluri</b> îl oprește pe producător când tava e plină; <b>pline</b> îl oprește pe consumator când e goală; <b>mutexul</b> împiedică atingerea simultană a tăvii.',
       dece:'Trei mecanisme, trei roluri diferite — soluțiile greșite din subiecte încurcă exact aceste roluri (ordinea P-urilor sau lipsa mutexului). Vezi următoarele două scenarii!'}
    ]
  };
}

function scGresit(){
  var cod=[
'/* varianta GREȘITĂ — ordinea inversată */',
'void producator(void){',
'    pthread_mutex_lock(&m);    /* întâi mutexul */',
'    sem_wait(&goluri);         /* apoi P(goluri) ⚠ */',
'    pune_portia();',
'    sem_post(&pline);',
'    pthread_mutex_unlock(&m);',
'}',
'',
'void consumator(void){',
'    sem_wait(&pline);',
'    pthread_mutex_lock(&m);    /* ⚠ va aștepta mutexul */',
'    ia_portia();',
'    pthread_mutex_unlock(&m);',
'    sem_post(&goluri);',
'}'].join('\n');
  var BFull=[1,1,1,1,1,1,1,1];
  return {
    cod:cod,
    stageTitlu:'Găsește greșeala — ca în subiectele 2018/2019',
    pasi:[
      {titlu:'punctul de plecare: tava PLINĂ', linii:[1],
       svg:tava({goluri:0,pline:8,buf:BFull}),
       ce:'Codul arată aproape la fel ca soluția corectă — doar că producătorul ia <b>întâi mutexul</b> și abia apoi face <code>P(goluri)</code>. Pornim din cazul-limită: tava plină.',
       dece:'Subiectele (pizza 2019, cartofi 2018) dau 2 soluții și cer să spui <b>care e corectă și de ce</b>. Testul standard: încearcă scenariile-limită — tavă plină, tavă goală.'},
      {titlu:'producătorul ia mutexul… apoi P(goluri) pe 0', linii:[3,4],
       svg:tava({goluri:0,pline:8,buf:BFull,mutex:'producător',prodCls:'blk',prodSt:'BLOCAT ținând mutexul!',qGoluri:'producătorul',msg:'doarme cu cheia tăvii în buzunar',msgCls:'sv-fill-red'}),
       ce:'lock(m) reușește. Dar <code>P(goluri)</code> găsește 0 → producătorul <b>adoarme ținând mutexul</b>.',
       dece:'Regula încălcată: <b>nu te bloca pe un semafor cât timp ții un lock</b> de care ar avea nevoie cel ce te-ar putea trezi. Urmărește ce pățește acum consumatorul…'},
      {titlu:'consumatorul: P(pline) ok… lock(m) → BLOCAT', linii:[11,12],
       svg:tava({goluri:0,pline:7,buf:BFull,mutex:'producător',prodCls:'blk',consCls:'blk',prodSt:'doarme pe goluri',consSt:'BLOCAT pe mutex',qGoluri:'producătorul',qM:'consumatorul',msg:'DEADLOCK: fiecare așteaptă după celălalt',msgCls:'sv-fill-red'}),
       ce:'Consumatorul trece de <code>P(pline)</code> (erau 8 porții), dar la <code>lock(m)</code> se lovește de mutexul ținut de producătorul adormit → <b>se blochează și el</b>.',
       dece:'<b>Deadlock</b>: producătorul așteaptă <code>V(goluri)</code> pe care doar consumatorul l-ar face; consumatorul așteaptă mutexul pe care doar producătorul l-ar elibera. Așteptare circulară — nimeni nu mai înaintează vreodată.'},
      {titlu:'verdictul & regula de aur', linii:[3,4],
       svg:S.open(760,220)
         +S.node(30,30,340,60,'GREȘIT','lock(m); P(goluri); … unlock(m)','zmb')
         +S.node(390,30,340,60,'CORECT','P(goluri); lock(m); … unlock(m); V(pline)','acc')
         +S.text(380,130,'P-urile care pot bloca se fac ÎNAINTE de a lua mutexul;','sm soft','middle')
         +S.text(380,152,'mutexul se ține cât mai puțin: doar cât atingi efectiv bufferul.','sm soft','middle')
         +S.text(380,186,'la examen: caută „cine doarme ținând lock-ul?” — dacă există, soluția e greșită','xs acc b','middle')
         +S.close,
       ce:'Răspunsul de examen: soluția e <b>greșită</b>, pentru că producătorul se poate bloca în <code>P(goluri)</code> <b>ținând mutexul</b>, iar consumatorul care i-ar elibera un loc are nevoie de exact acel mutex → interblocare.',
       dece:'Formularea contează la punctaj: identifici <b>secvența</b> care duce la blocare (tava plină → lock → P) și <b>ciclul</b> de așteptare. Simulatorul de deadlock detaliază graful de alocare.'}
    ]
  };
}

function scFaraMutex(){
  var cod=[
'/* fără mutex: doar semafoarele */',
'void producator(void){',
'    sem_wait(&goluri);',
'    buf[in] = portie;     /* ⚠ in e partajat */',
'    in = (in + 1) % 8;    /* ⚠ nu e atomic  */',
'    sem_post(&pline);',
'}'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Doi producători, fără mutex',
    pasi:[
      {titlu:'doi producători trec de P(goluri)', linii:[3],
       svg:tava({goluri:6,pline:0,prodSt:'ambii au trecut de P',msg:'P(goluri) de două ori: 8→7→6 — corect până aici'}),
       ce:'Doi producători apelează <code>P(goluri)</code>: semaforul scade corect 8→7→6 (P e atomic). Fiecare are dreptul la <b>un</b> loc.',
       dece:'Semafoarele își fac treaba de <b>numărare</b> perfect. Problema care urmează nu e a lor.'},
      {titlu:'ambii citesc in = 0', linii:[4],
       svg:tava({goluri:6,pline:0,hotSlot:0,prodSt:'ambii țintesc slotul 0!',msg:'race pe indexul partajat in',msgCls:'sv-fill-red'}),
       ce:'Ambii citesc <b>același index</b> <code>in = 0</code> înainte ca vreunul să-l incrementeze → ambii scriu porția <b>în slotul 0</b>.',
       dece:'Exact „lost update”-ul de la contor++, dar pe indexul bufferului. Semaforul a numărat două locuri, însă <b>amândoi folosesc același loc</b>.'},
      {titlu:'rezultatul: o porție pierdută, un slot fantomă', linii:[4,5],
       svg:tava({goluri:6,pline:2,buf:[1,0,0,0,0,0,0,0],hotSlot:0,msg:'pline zice 2, în tavă e 1 → contabilitate ruptă',msgCls:'sv-fill-red'}),
       ce:'O porție a suprascris-o pe cealaltă; <code>in</code> a ajuns (poate) la 1 sau 2, <code>pline</code> zice 2, dar în tavă există <b>o singură porție reală</b>. Un consumator va „mânca” dintr-un slot gol.',
       dece:'Concluzia de reținut: <b>semafoarele numără, mutexul protejează structura</b>. Ambele sunt necesare — grilele adoră soluțiile cărora le lipsește exact una dintre piese.'}
    ]
  };
}

PSO.register({
  id:'prodcons', cat:'sincronizare', icon:'🚦',
  titlu:'Producător–Consumator cu semafoare',
  scurt:'Tava de pizza din subiecte: P/V pe goluri și pline, mutex pe tavă, plus soluțiile greșite tipice.',
  desc:'Problema-vedetă a examenului, în varianta ei „culinară” (tava de pizza / porțiile de cartofi): un <b>buffer mărginit</b> cu 8 locuri, semafoare care numără <code>goluri</code> și <code>pline</code>, mutex pe tavă. Include cele două soluții greșite care pică la examen: ordinea inversată (deadlock) și lipsa mutexului (porții pierdute).',
  ani:[2018,2019,2021,2024],
  nota:'În <b>2019</b>: „pizza e servită într-o tavă cu fix 8 felii… explicați pentru fiecare soluție dacă e corectă sau greșită”. În <b>2018</b>: aceeași poveste cu 7 porții de cartofi. În <b>2024</b>: producător–consumator cu procese, semafoare și memorie partajată prin mmap.',
  scenarii:[
    {id:'buffer',   nume:'soluția corectă',        build:scBuffer},
    {id:'gresit',   nume:'greșeala 1: deadlock',   build:scGresit},
    {id:'faramutex',nume:'greșeala 2: fără mutex', build:scFaraMutex}
  ]
});
})();

/* ============================================================
   6) Explorator de întrețeseri (race conditions) — interactiv
   ============================================================ */
(function(){

var I={
  P:function(s){ return {t:'P',s:s,txt:'P('+s+')'}; },
  V:function(s){ return {t:'V',s:s,txt:'V('+s+')'}; },
  pr:function(v){ return {t:'pr',v:v,txt:'printf("'+v+'")'}; },
  load:function(){ return {t:'load',txt:'reg = contor'}; },
  add:function(){ return {t:'add',txt:'reg = reg + 1'}; },
  store:function(){ return {t:'store',txt:'contor = reg'}; }
};
function rep(n,arr){ var out=[]; for(var i=0;i<n;i++) out=out.concat(arr); return out; }

var PRESETS={
  ordonare:{
    intro:'Semafoarele inițializate cu <b>0</b> impun ordinea între fire: T1 nu poate tipări „B” înainte ca T2 să fi tipărit „A” și să fi făcut V(s). Încearcă să obții „BA” — apoi cere lista tuturor ieșirilor.',
    sems:{s:0}, vars:null,
    threads:[
      {nume:'T1', instr:[I.P('s'), I.pr('B')]},
      {nume:'T2', instr:[I.pr('A'), I.V('s')]}
    ],
    intrebare:'Întrebare de grilă: câte ieșiri diferite sunt posibile? (verifică apoi cu butonul „toate ieșirile”)'
  },
  stil2013:{
    intro:'În stilul subiectelor 2010/2013/2021: două procese tipăresc caractere, sincronizate prin semafoarele <code>sem1 = 3</code> și <code>sem2 = 0</code>. Fiecare „1” eliberează un „2”; „1”-urile sunt limitate de rezerva inițială din sem1 plus V-urile lui P2.',
    sems:{sem1:3, sem2:0}, vars:null,
    threads:[
      {nume:'P1', instr:rep(3,[I.P('sem1'), I.pr('1'), I.V('sem2')])},
      {nume:'P2', instr:rep(3,[I.P('sem2'), I.pr('2'), I.V('sem1')])}
    ],
    intrebare:'Câte caractere „1” pot apărea consecutiv la început? Poate începe ieșirea cu „2”? Poate apărea „111222” — dar „121212”?'
  },
  lost:{
    intro:'Clasicul <b>lost update</b>: două fire fac <code>contor++</code> (LOAD / ADD / STORE) pe un contor pornit de la 0. Alege tu ordinea instrucțiunilor și încearcă să obții <b>contor = 1</b>.',
    sems:{}, vars:{contor:0},
    threads:[
      {nume:'T1', instr:[I.load(),I.add(),I.store()]},
      {nume:'T2', instr:[I.load(),I.add(),I.store()]}
    ],
    intrebare:'Ce valori finale sunt posibile pentru contor? (întrebarea standard de grilă — verifică apoi cu „toate ieșirile”)'
  },
  mutex:{
    intro:'Același <code>contor++</code>, dar protejat de un semafor binar folosit ca <b>mutex</b> (init 1). Oricum ai întrețese firele, rezultatul e mereu același.',
    sems:{m:1}, vars:{contor:0},
    threads:[
      {nume:'T1', instr:[I.P('m'),I.load(),I.add(),I.store(),I.V('m')]},
      {nume:'T2', instr:[I.P('m'),I.load(),I.add(),I.store(),I.V('m')]}
    ],
    intrebare:'Mai poți obține contor = 1? De ce s-a redus numărul de întrețeseri posibile?'
  },
  posibil:{
    intro:'Formatul de grilă „<b>care șiruri pot fi afișate?</b>”: T1 tipărește „X”, așteaptă semaforul, apoi „Y”; T2 tipărește „Z” și face V. Testează șirurile propuse jucându-le pas cu pas.',
    sems:{s:0}, vars:null,
    threads:[
      {nume:'T1', instr:[I.pr('X'), I.P('s'), I.pr('Y')]},
      {nume:'T2', instr:[I.pr('Z'), I.V('s')]}
    ],
    intrebare:'E posibil „XZY”? Dar „ZXY”? Dar „XYZ”? Justifică prin poziția lui V(s) față de „Y”.'
  }
};

/* starea execuției + motorul */
function mkState(prog){
  var st={ip:[],reg:[],sems:{},vars:{},out:'',hist:[]};
  prog.threads.forEach(function(t,i){ st.ip[i]=0; st.reg[i]=null; });
  for(var k in prog.sems) st.sems[k]=prog.sems[k];
  for(var v in (prog.vars||{})) st.vars[v]=prog.vars[v];
  return st;
}
function snap(st){ return JSON.stringify([st.ip,st.reg,st.sems,st.vars,st.out]); }
function unsnap(s){ var a=JSON.parse(s); return {ip:a[0],reg:a[1],sems:a[2],vars:a[3],out:a[4],hist:null}; }
function canRun(prog,st,ti){
  var ip=st.ip[ti];
  if(ip>=prog.threads[ti].instr.length) return false;
  var ins=prog.threads[ti].instr[ip];
  if(ins.t==='P' && st.sems[ins.s]<=0) return false;
  return true;
}
function isDone(prog,st,ti){ return st.ip[ti]>=prog.threads[ti].instr.length; }
function exec(prog,st,ti){
  var ins=prog.threads[ti].instr[st.ip[ti]];
  if(ins.t==='P') st.sems[ins.s]--;
  else if(ins.t==='V') st.sems[ins.s]++;
  else if(ins.t==='pr') st.out+=ins.v;
  else if(ins.t==='load') st.reg[ti]=st.vars.contor;
  else if(ins.t==='add') st.reg[ti]=st.reg[ti]+1;
  else if(ins.t==='store') st.vars.contor=st.reg[ti];
  st.ip[ti]++;
}
/* explorare exhaustivă (BFS) a tuturor întrețeserilor */
function explore(prog){
  var start=mkState(prog), seen={}, queue=[snap(start)], results={}, states=0, truncat=false;
  seen[queue[0]]=1;
  while(queue.length){
    if(++states>30000){ truncat=true; break; }
    var st=unsnap(queue.shift());
    var moved=false;
    for(var ti=0; ti<prog.threads.length; ti++){
      if(!canRun(prog,st,ti)) continue;
      moved=true;
      var st2=unsnap(snap(st));
      exec(prog,st2,ti);
      var key=snap(st2);
      if(!seen[key]){ seen[key]=1; queue.push(key); }
    }
    if(!moved){
      var allDone=prog.threads.every(function(t,ti){ return isDone(prog,st,ti); });
      var res = prog.vars ? ('contor = '+st.vars.contor) : ('„'+(st.out||'—')+'”');
      if(!allDone) res+='  ⚠ DEADLOCK';
      results[res]=(results[res]||0)+1;
    }
  }
  return {rezultate:Object.keys(results).sort(), truncat:truncat};
}

function mountRace(prog){
  return function(root){
    var st=mkState(prog);
    var el=document.createElement('div');
    el.innerHTML=''
      +(prog.intro?'<div class="sim-desc" style="margin-top:0">'+prog.intro+'</div>':'')
      +'<div class="ix-wrap">'
      +'<div class="ix-threads" data-el="ths"></div>'
      +'<div class="ix-side">'
      +'  <div class="ix-box"><div class="bh">Semafoare</div><div class="ix-sems" data-el="sems"></div></div>'
      +'  <div class="ix-box" data-el="varsbox" style="display:none"><div class="bh">Variabile partajate</div><div class="ix-vars" data-el="vars"></div></div>'
      +'  <div class="ix-box"><div class="bh">Output</div><div class="ix-out" data-el="out"></div></div>'
      +'  <div class="ix-box"><div class="bh">Verdict</div><div class="ix-msg" data-el="msg"></div></div>'
      +'  <div class="ix-box"><div class="bh">Istoric</div><div class="ix-hist" data-el="hist"></div></div>'
      +'</div></div>'
      +'<div class="controls">'
      +'<button class="btn ghost" data-a="undo">↩ Undo</button>'
      +'<button class="btn ghost" data-a="reset">⏮ Reset</button>'
      +'<button class="btn" data-a="explore">Toate ieșirile posibile</button>'
      +'</div>'
      +'<div class="ix-box" data-el="expbox" style="display:none"><div class="bh">Toate rezultatele posibile (explorare exhaustivă)</div><div class="ix-msg" data-el="expl"></div></div>'
      +(prog.intrebare?'<div class="exam-note" style="margin-top:14px"><span class="tag">Întrebare</span><div>'+prog.intrebare+'</div></div>':'');
    root.appendChild(el);
    var q=function(k){ return el.querySelector('[data-el="'+k+'"]'); };

    function semQueues(){
      /* cine e blocat pe ce semafor */
      var m={};
      prog.threads.forEach(function(t,ti){
        if(isDone(prog,st,ti)) return;
        var ins=t.instr[st.ip[ti]];
        if(ins.t==='P' && st.sems[ins.s]<=0){ (m[ins.s]=m[ins.s]||[]).push(t.nume); }
      });
      return m;
    }
    function render(){
      /* thread cards */
      var ths=q('ths'); ths.innerHTML='';
      prog.threads.forEach(function(t,ti){
        var done=isDone(prog,st,ti), poate=canRun(prog,st,ti);
        var stat=done?'done':(poate?'ready':'blocked');
        var card=document.createElement('div');
        card.className='ix-th'+(done?' done':'');
        var lines=t.instr.map(function(ins,i){
          var cls=i<st.ip[ti]?'done':(i===st.ip[ti]?'next':'');
          return '<span class="il '+cls+'">'+(i+1)+'. '+esc(ins.txt)+'</span>';
        }).join('');
        card.innerHTML='<div class="ix-th-h"><b>'+esc(t.nume)+'</b>'
          +(st.reg[ti]!=null?'<span class="ix-var" style="padding:1px 8px">reg = <b>'+st.reg[ti]+'</b></span>':'')
          +'<span class="st '+stat+'">'+(done?'terminat':(poate?'poate rula':'BLOCAT'))+'</span></div>'
          +'<div class="ix-code">'+lines+'</div>'
          +'<button class="ix-run"'+(poate?'':' disabled')+'>Execută pasul lui '+esc(t.nume)+' ▶</button>';
        card.querySelector('.ix-run').onclick=function(){
          if(!canRun(prog,st,ti)) return;
          st.hist.push(snap(st));
          var ins=t.instr[st.ip[ti]];
          exec(prog,st,ti);
          st.histTxt=st.histTxt||[];
          st.histTxt.push(t.nume+': '+ins.txt);
          render();
        };
        ths.appendChild(card);
      });
      /* semafoare */
      var qs=semQueues();
      q('sems').innerHTML=Object.keys(st.sems).length?Object.keys(st.sems).map(function(s){
        return '<div class="ix-sem"><span class="v'+(st.sems[s]===0?' zero':'')+'">'+st.sems[s]+'</span><span class="n">'+esc(s)+'</span>'
          +(qs[s]?'<span class="q">⏳ '+qs[s].join(', ')+'</span>':'')+'</div>';
      }).join(''):'<span class="muted" style="font-size:12px">— fără semafoare —</span>';
      /* variabile */
      if(prog.vars){
        q('varsbox').style.display='';
        q('vars').innerHTML=Object.keys(st.vars).map(function(v){
          return '<span class="ix-var">'+esc(v)+' = <b>'+st.vars[v]+'</b></span>';
        }).join('');
      }
      /* output */
      q('out').innerHTML=(esc(st.out)||'<span class="muted" style="font-size:12px;letter-spacing:0">— nimic încă —</span>')+'<span class="cursor"></span>';
      /* verdict */
      var allDone=prog.threads.every(function(t,ti){ return isDone(prog,st,ti); });
      var anyRun=prog.threads.some(function(t,ti){ return canRun(prog,st,ti); });
      var msg=q('msg');
      if(allDone){
        msg.className='ix-msg';
        msg.innerHTML='✅ Execuție completă. '+(prog.vars?'Rezultat: <b>contor = '+st.vars.contor+'</b>':'Ieșirea: <b>„'+esc(st.out)+'”</b>')+' — apasă Reset și încearcă altă ordine!';
      } else if(!anyRun){
        msg.className='ix-msg deadlock';
        msg.innerHTML='☠️ DEADLOCK — niciun fir nu mai poate rula: toate sunt blocate în P() pe semafoare cu valoarea 0. Exact asta trebuie să depistezi în soluțiile greșite de la examen.';
      } else {
        msg.className='ix-msg';
        msg.innerHTML='Alege ce fir execută <b>următoarea instrucțiune</b> — tu joci rolul planificatorului.';
      }
      /* istoric */
      q('hist').innerHTML=(st.histTxt&&st.histTxt.length)?st.histTxt.map(function(h,i){ return (i+1)+'. '+esc(h); }).join('<br>'):'—';
    }
    el.querySelector('[data-a="undo"]').onclick=function(){
      if(!st.hist.length) return;
      var prev=unsnap(st.hist.pop());
      var keepHist=st.hist, keepTxt=(st.histTxt||[]); keepTxt.pop();
      st=prev; st.hist=keepHist; st.histTxt=keepTxt;
      render();
    };
    el.querySelector('[data-a="reset"]').onclick=function(){
      st=mkState(prog); q('expbox').style.display='none'; render();
    };
    el.querySelector('[data-a="explore"]').onclick=function(){
      var r=explore(prog);
      q('expbox').style.display='';
      q('expl').innerHTML='<b>'+r.rezultate.length+'</b> rezultat(e) distincte:'
        +'<div style="font-family:var(--mono); font-size:12.5px; margin-top:6px; line-height:1.9">'
        +r.rezultate.map(function(x){ return esc(x); }).join('<br>')+'</div>'
        +(r.truncat?'<div class="muted" style="font-size:11.5px; margin-top:4px">(explorare oprită la 30.000 de stări — listă posibil incompletă)</div>':'');
    };
    render();
    return {destroy:function(){ root.innerHTML=''; }};
  };
}

function buildRace(presetId){
  return function(){ return {custom:mountRace(PRESETS[presetId])}; };
}

PSO.register({
  id:'race', cat:'sincronizare', icon:'🎛️',
  titlu:'Explorator de întrețeseri (race)',
  scurt:'TU ești planificatorul: rulezi firele instrucțiune cu instrucțiune și descoperi ce ieșiri sunt posibile.',
  desc:'Formatul preferat al grilelor: „<b>ce șiruri pot fi afișate?</b>”, „<b>ce valori finale sunt posibile?</b>”. Aici joci rolul planificatorului: apeși pe firul care primește CPU, semafoarele te blochează exact ca în realitate, iar la final poți cere <b>lista exhaustivă</b> a tuturor rezultatelor posibile — demonstrația perfectă pentru orice grilă.',
  ani:[2010,2013,2015,2020,2021,2022],
  nota:'Probleme reale în acest format: <b>2013/2021</b> — „semaphore sem1=3, sem2=0… e posibilă secvența 312134231244?”; <b>2020</b> — „care din cele 4 șiruri pot fi afișate de 3 fire?”; <b>2022</b> — „ce semafoare garantează contor = 11?”.',
  scenarii:[
    {id:'ordonare', nume:'ordonare cu semafor',  build:buildRace('ordonare')},
    {id:'stil2013', nume:'sem1=3, sem2=0 (2013)',build:buildRace('stil2013')},
    {id:'lost',     nume:'contor++ pierdut',     build:buildRace('lost')},
    {id:'mutex',    nume:'contor++ cu mutex',    build:buildRace('mutex')},
    {id:'posibil',  nume:'„e posibil șirul…?”',  build:buildRace('posibil')}
  ]
});
/* expus pentru verificări automate (harness) */
PSO._race={PRESETS:PRESETS, mkState:mkState, exec:exec, canRun:canRun, isDone:isDone, explore:explore};
})();

/* ============================================================
   7) Deadlock & condițiile Coffman
   ============================================================ */
(function(){

/* graful de alocare a resurselor: P=cerc, R=pătrat */
function rag(o){
  o=o||{};
  var out=S.open(760,300);
  var P1={x:120,y:76}, P2={x:640,y:224}, R1={x:640,y:76}, R2={x:120,y:224};
  function proc(p,nume,cls,hot,sub){
    var o2='<g'+(hot?' class="sv-hot"':'')+'>';
    o2+='<circle cx="'+p.x+'" cy="'+p.y+'" r="34" class="sv-n '+(cls||'')+'"/>';
    o2+=S.text(p.x,p.y+5,nume,'b mono','middle');
    if(sub) o2+=S.text(p.x,p.y+52,sub,'xs '+(cls==='blk'?'org':'mut'),'middle');
    return o2+'</g>';
  }
  function res(r,nume,cls,tinut){
    var o2=S.rect(r.x-34,r.y-26,68,52,'sv-n deep '+(cls||''),8);
    o2+=S.text(r.x,r.y+1,nume,'b mono','middle');
    o2+=S.text(r.x,r.y+17,tinut||'liber','xs '+(tinut?'org':'grn'),'middle');
    return o2;
  }
  /* muchii: alocare R→P (plină), cerere P→R (punctată) */
  function edge(a,b,tip,cls){
    var dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy);
    var ox=dx/len, oy=dy/len;
    var pad1=40, pad2=44;
    var x1=a.x+ox*pad1, y1=a.y+oy*pad1, x2=b.x-ox*pad2, y2=b.y-oy*pad2;
    var mk=cls?cls.split(' ')[0]:'';
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="sv-l '+(cls||'')+(tip==='cerere'?' dash':'')+'" marker-end="url(#ma'+(mk?'-'+mk:'')+')"/>';
  }
  var E=o.edges||[];
  E.forEach(function(e){
    var pts={P1:P1,P2:P2,R1:R1,R2:R2};
    out+=edge(pts[e[0]],pts[e[1]],e[2],e[3]);
    var a=pts[e[0]],b=pts[e[1]];
    if(e[4]) out+=S.text((a.x+b.x)/2,(a.y+b.y)/2-8,e[4],'xs mono '+(e[3]==='red'?'red':(e[3]==='org'?'org':'mut')),'middle');
  });
  out+=proc(P1,'P1',o.p1cls,o.hot==='P1',o.p1sub);
  out+=proc(P2,'P2',o.p2cls,o.hot==='P2',o.p2sub);
  out+=res(R1,'R1',o.r1cls,o.r1de);
  out+=res(R2,'R2',o.r2cls,o.r2de);
  if(o.badge) out+=S.badge(380,150,o.badge,o.badgeCls||'sv-fill-red');
  if(o.msg) out+=S.text(380,288,o.msg,'xs mut','middle');
  return out+S.close;
}

function scDoua(){
  var cod=[
'/* P1 */                /* P2 */',
'lock(R1);               lock(R2);',
'lock(R2);               lock(R1);',
'  /* lucrează…    lucrează… */',
'unlock(R2);             unlock(R1);',
'unlock(R1);             unlock(R2);'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Graful de alocare a resurselor (RAG)',
    legenda:[{c:'acc',t:'deține'},{c:'blk',t:'cere / blocat'},{c:'zmb',t:'ciclu = deadlock'}],
    pasi:[
      {titlu:'P1 ia R1', linii:[2],
       svg:rag({edges:[['R1','P1','aloc','acc','deținut']],r1de:'ținut de P1',hot:'P1',p1sub:'are R1'}),
       ce:'P1 face <code>lock(R1)</code> — reușește. În graf apare muchia de <b>alocare</b> R1 → P1 („R1 e deținut de P1”).',
       dece:'Graful de alocare (RAG) are două tipuri de muchii: <b>alocare</b> (resursă → proces, linie plină) și <b>cerere</b> (proces → resursă, linie punctată). Cu el se detectează formal deadlock-ul.'},
      {titlu:'P2 ia R2', linii:[2],
       svg:rag({edges:[['R1','P1','aloc','acc'],['R2','P2','aloc','acc']],r1de:'ținut de P1',r2de:'ținut de P2',hot:'P2',p2sub:'are R2'}),
       ce:'În paralel, P2 face <code>lock(R2)</code> — și el reușește. Fiecare proces ține câte o resursă.',
       dece:'Până aici nimic anormal: excluderea mutuală funcționează exact cum trebuie. Pericolul vine din <b>ordinea diferită</b> în care cele două procese vor cere a doua resursă.'},
      {titlu:'P1 cere R2 → se blochează', linii:[3],
       svg:rag({edges:[['R1','P1','aloc','acc'],['R2','P2','aloc','acc'],['P1','R2','cerere','org','cere']],
                r1de:'ținut de P1',r2de:'ținut de P2',p1cls:'blk',p1sub:'BLOCAT: vrea R2'}),
       ce:'P1 vrea și R2, dar R2 e ținut de P2 → P1 <b>așteaptă</b> (muchie de cerere P1 ⇢ R2, punctată).',
       dece:'A aștepta o resursă ținută de altcineva e normal și de obicei temporar. Devine fatal doar dacă se închide un <b>ciclu</b>…'},
      {titlu:'P2 cere R1 → CICLU → deadlock', linii:[3],
       svg:rag({edges:[['R1','P1','aloc','red'],['R2','P2','aloc','red'],['P1','R2','cerere','red'],['P2','R1','cerere','red']],
                r1de:'ținut de P1',r2de:'ținut de P2',p1cls:'blk',p2cls:'blk',p1sub:'așteaptă R2',p2sub:'așteaptă R1',
                badge:'CICLU: P1→R2→P2→R1→P1 = DEADLOCK'}),
       ce:'P2 cere R1 (ținut de P1). Acum graful conține ciclul <b>P1 → R2 → P2 → R1 → P1</b>: fiecare așteaptă o resursă ținută de celălalt. <b>Nimeni nu va mai înainta vreodată.</b>',
       dece:'Cu o singură instanță per resursă, <b>ciclu în RAG ⇔ deadlock</b>. Asta e definiția operațională pe care o desenezi la examen ca demonstrație.'},
      {titlu:'cele 4 condiții Coffman',
       svg:S.open(760,270)
         +S.node(30,24,340,48,'1 · Excludere mutuală','resursa nu poate fi partajată','zmb')
         +S.node(390,24,340,48,'2 · Hold &amp; wait','ții o resursă și ceri alta','zmb')
         +S.node(30,88,340,48,'3 · Fără preempțiune','resursa nu poate fi luată cu forța','zmb')
         +S.node(390,88,340,48,'4 · Așteptare circulară','ciclul P1→R2→P2→R1','zmb')
         +S.text(380,178,'deadlock ⇔ TOATE cele patru condiții sunt simultan adevărate','sm b red','middle')
         +S.text(380,206,'prevenirea = spargi cel puțin una dintre ele','sm soft','middle')
         +S.text(380,232,'cea mai practică țintă: condiția 4 → impui o ordine globală pe lacăte','sm acc b','middle')
         +S.close,
       ce:'Deadlock-ul cere <b>toate cele 4 condiții Coffman</b> simultan: excludere mutuală, hold-and-wait, fără preempțiune, așteptare circulară.',
       dece:'Fiecare strategie de prevenire atacă exact una din condiții. În practică se sparge nr. 4 — vezi scenariul următor, „spargem ciclul”.'}
    ]
  };
}

function scOrdine(){
  var cod=[
'/* regulă globală: ÎNTÂI R1, apoi R2 */',
'/* P1 */                /* P2 */',
'lock(R1);               lock(R1);   /* aceeași ordine! */',
'lock(R2);               lock(R2);',
'  /* lucrează…    lucrează… */',
'unlock-uri în ordine inversă'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Aceeași problemă, cu ordine globală pe lacăte',
    pasi:[
      {titlu:'P1 ia R1; P2 vrea tot R1', linii:[3],
       svg:rag({edges:[['R1','P1','aloc','acc'],['P2','R1','cerere','org','cere']],
                r1de:'ținut de P1',p2cls:'blk',p2sub:'așteaptă R1 (devreme!)',hot:'P1'}),
       ce:'Ambele procese încep cu <code>lock(R1)</code>. P1 câștigă; P2 <b>se blochează imediat</b>, înainte să fi apucat vreo resursă.',
       dece:'Aici e toată șmecheria: P2 așteaptă <b>fără să țină nimic</b> — condiția hold-and-wait nu se poate forma în cerc.'},
      {titlu:'P1 ia liniștit și R2, lucrează, eliberează', linii:[4,6],
       svg:rag({edges:[['R1','P1','aloc','acc'],['R2','P1','aloc','acc'],['P2','R1','cerere','org']],
                r1de:'ținut de P1',r2de:'ținut de P1',p2cls:'blk',p2sub:'încă așteaptă',hot:'P1',p1sub:'are ambele → lucrează'}),
       ce:'R2 e liber (P2 n-a ajuns la el!), deci P1 îl ia fără conflict, își face treaba și eliberează ambele resurse.',
       dece:'Cu ordinea comună, „a doua resursă” a oricui nu poate fi ținută de cineva care așteaptă „prima” — lanțul de așteptare e mereu liniar, niciodată circular.'},
      {titlu:'P2 se trezește și își face treaba', linii:[3,4],
       svg:rag({edges:[['R1','P2','aloc','acc'],['R2','P2','aloc','acc']],
                r1de:'ținut de P2',r2de:'ținut de P2',hot:'P2',p2sub:'acum lucrează el',p1sub:'terminat ✓',
                badge:'FĂRĂ deadlock — mereu',badgeCls:'sv-fill-grn'}),
       ce:'După unlock-urile lui P1, P2 e trezit, ia R1, apoi R2, și termină și el. <b>Serializare curată, zero deadlock — garantat, oricare ar fi întrețeserea.</b>',
       dece:'Regula „<b>toată lumea ia lacătele în aceeași ordine</b>” elimină matematic ciclurile din RAG (condiția Coffman #4). E și răspunsul așteptat la examen la „cum previi deadlock-ul?”.'}
    ]
  };
}

function scLivelock(){
  return {
    stageTitlu:'Deadlock vs livelock vs înfometare',
    pasi:[
      {titlu:'deadlock: nimic nu se mai mișcă',
       svg:S.open(760,180)
         +S.node(60,40,180,54,'P1','blocat pe R2','zmb')
         +S.node(520,40,180,54,'P2','blocat pe R1','zmb')
         +S.line(240,58,520,58,'red dash','red')+S.line(520,80,240,80,'red dash','red')
         +S.text(380,140,'stările NU se schimbă deloc: ambele procese dorm pentru totdeauna','sm red','middle')
         +S.close,
       ce:'În <b>deadlock</b>, procesele sunt blocate (WAITING) și <b>starea sistemului îngheață</b>: fără intervenție externă, nimic nu se schimbă vreodată.',
       dece:'Detectabil formal prin ciclul din RAG. „Tratament”: omori un proces sau îi iei forțat resursa (preempțiune).'},
      {titlu:'livelock: totul se mișcă, nimic nu avansează',
       svg:S.open(760,180)
         +S.node(60,40,180,54,'P1','ia · vede conflict · cedează','blk')
         +S.node(520,40,180,54,'P2','ia · vede conflict · cedează','blk')
         +S.curve(240,54,520,54,'org','org')+S.curve(520,84,240,84,'org','org')
         +S.text(380,140,'stările se schimbă continuu (retry politicos la nesfârșit), dar niciun progres real','sm org','middle')
         +S.close,
       ce:'În <b>livelock</b>, procesele rulează (nu dorm!): fiecare detectează conflictul, cedează politicos, reîncearcă… simultan cu celălalt, la nesfârșit — ca doi oameni care se feresc mereu pe aceeași parte pe hol.',
       dece:'Diferența față de deadlock — întrebare directă din banca de curs: deadlock = blocați (stare fixă); livelock = activi (stare schimbătoare), progres zero. Soluția tipică: backoff aleator.'},
      {titlu:'înfometare: alții progresează, tu nu',
       svg:S.open(760,180)
         +S.node(60,40,140,54,'P prio 9','rulează des','run')
         +S.node(240,40,140,54,'P prio 8','rulează des','run')
         +S.node(430,40,140,54,'P prio 7','mai rar…','rdy')
         +S.node(610,40,130,54,'P prio 1','NICIODATĂ','zmb')
         +S.text(380,140,'sistemul per total merge — dar procesul cu prioritate mică nu primește nimic','sm mut','middle')
         +S.close,
       ce:'<b>Înfometarea</b> (starvation): sistemul progresează, dar un proces anume <b>nu primește niciodată</b> resursa/CPU — de pildă la planificare pe priorități fără corecții.',
       dece:'Soluția clasică: <b>aging</b> — prioritatea celui care așteaptă crește treptat, garantând că va rula cândva. Termenul apare la planificare și la lacăte deopotrivă.'}
    ]
  };
}

PSO.register({
  id:'deadlock', cat:'sincronizare', icon:'🔒',
  titlu:'Deadlock, livelock & condițiile Coffman',
  scurt:'Ciclul din graful de alocare, cele 4 condiții Coffman și cum îl previi cu ordine globală pe lacăte.',
  desc:'Doi actori, două lacăte, ordini diferite → <b>așteptare circulară</b>. Simulatorul construiește graful de alocare a resurselor muchie cu muchie, arată ciclul fatal, apoi demonstrează de ce ordinea globală pe lacăte îl face imposibil.',
  ani:[],
  notaTag:'Curs',
  nota:'Deadlock-ul ca algoritm (detecție/evitare) nu a apărut direct în subiectele 2000–2024 — dar <b>mecanismul</b> lui e exact ce trebuie să recunoști în soluțiile greșite de producător–consumator (2018/2019) și e întrebat explicit în banca de curs (deadlock vs livelock, condițiile Coffman).',
  scenarii:[
    {id:'doua',    nume:'2 procese, 2 lacăte',  build:scDoua},
    {id:'ordine',  nume:'spargem ciclul',       build:scOrdine},
    {id:'livelock',nume:'live-lock & înfometare',build:scLivelock}
  ]
});
})();
