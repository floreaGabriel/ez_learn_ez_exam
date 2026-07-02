/* ============================================================
   Simulatoare · Memorie — harta VAS, paginare & TLB,
   înlocuirea paginilor
   ============================================================ */
"use strict";

/* ============================================================
   8) Memoria unui proces (layout + permisiuni) — subiect 2023
   ============================================================ */
(function(){

/* harta verticală a spațiului de adrese; itemii sunt chipuri în zone */
var ZONE=[
  {id:'stack', nume:'STIVĂ ↓',        perm:'rw-', sub:'cadre de funcții, crește în JOS'},
  {id:'gap',   nume:'…liber / mmap…', perm:'',    sub:'biblioteci, mmap, gardă'},
  {id:'heap',  nume:'HEAP ↑',         perm:'rw-', sub:'malloc/free, crește în SUS'},
  {id:'bss',   nume:'.bss',           perm:'rw-', sub:'globale NEinițializate (zero)'},
  {id:'data',  nume:'.data',          perm:'rw-', sub:'globale inițializate'},
  {id:'rodata',nume:'.rodata',        perm:'r--', sub:'constante, literali de șir'},
  {id:'text',  nume:'.text',          perm:'r-x', sub:'codul mașină al funcțiilor'}
];
function vasMap(items, hotZona, msg){
  var out=S.open(760,392);
  out+=S.text(20,24,'0xFFFF…','xs mono mut')+S.text(20,378,'0x0000…','xs mono mut');
  var y=14, H={stack:64,gap:34,heap:64,bss:48,data:48,rodata:48,text:52};
  ZONE.forEach(function(z){
    var h=H[z.id], hot=hotZona===z.id;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(96,y,380,h-6,'sv-n '+(z.id==='gap'?'ghost':(hot?'acc':'')),9);
    out+=S.text(112,y+20,z.nume,'sm b'+(hot?' acc':''));
    out+=S.text(112,y+37,z.sub,'xs mut');
    if(z.perm) out+=S.badge(440,y+16,z.perm,z.perm.indexOf('w')>=0?'sv-fill-grn':(z.perm.indexOf('x')>=0?'sv-fill-org':'sv-fill-mut'));
    out+='</g>';
    /* itemii din zonă */
    var inZ=items.filter(function(it){ return it.z===z.id; });
    inZ.forEach(function(it,i){
      var iy=y+(h-6)/2 - (inZ.length*11) + i*22 + 11;
      out+='<g'+(it.hot?' class="sv-hot"':'')+'>';
      out+=S.rect(500,iy-10,244,20,'sv-n deep'+(it.hot?' acc':''),6);
      out+=S.text(510,iy+4,it.t,'xs mono '+(it.hot?'acc':'soft'));
      out+='</g>';
      out+=S.line(476,y+(h-6)/2,500,iy,it.hot?'acc':'dim',it.hot?'acc':'');
    });
    y+=h;
  });
  if(msg) out+=S.text(420,388,msg,'xs mut','middle');
  return out+S.close;
}

function scUnde(){
  var cod=[
'#include <stdlib.h>',
'',
'int g = 42;                /* global initializat   */',
'int v;                     /* global NEinitializat */',
'const char *msg = "salut";',
'',
'void f(int x){',
'    static int nr = 0;',
'    int local;',
'    int *p = malloc(40);',
'}'].join('\n');
  var IT={
    g:{z:'data',t:'g = 42'},
    v:{z:'bss',t:'v (0 implicit)'},
    lit:{z:'rodata',t:'"salut" (literalul)'},
    msg:{z:'data',t:'msg (pointerul)'},
    fcod:{z:'text',t:'codul lui f() și main()'},
    nr:{z:'bss',t:'static nr = 0'},
    x:{z:'stack',t:'x, local (cadrul lui f)'},
    heap:{z:'heap',t:'blocul de 40B (malloc)'},
    p:{z:'stack',t:'p (pointerul, pe stivă!)'}
  };
  function pana(chei,hotKey,hotZ,msg){
    var items=chei.map(function(k){ var it=Object.assign({},IT[k]); it.hot=(k===hotKey); return it; });
    return vasMap(items,hotZ,msg);
  }
  return {
    cod:cod,
    stageTitlu:'Harta spațiului de adrese (subiectul din 2023)',
    legenda:[{c:'run',t:'rw- (scriibil)'},{c:'blk',t:'r-x (executabil)'},{c:'acc',t:'zona activă'}],
    pasi:[
      {titlu:'zonele și permisiunile lor', linii:[],
       svg:vasMap([],null,'fiecare zonă = pagini cu permisiuni proprii (r/w/x), verificate de MMU la FIECARE acces'),
       ce:'Orice proces vede aceeași hartă: <b>.text</b> jos (cod, r-x), apoi <b>.rodata</b> (r--), <b>.data</b> și <b>.bss</b> (rw-), <b>heap-ul</b> crescând în sus, iar la vârf <b>stiva</b> crescând în jos.',
       dece:'Subiectul din 2023 dă un program și cere, element cu element: <b>în ce zonă ajunge și ce permisiuni au paginile lui</b>. Parcurge pașii și construiește răspunsul complet.'},
      {titlu:'int g = 42 → .data', linii:[3],
       svg:pana(['g'],'g','data'),
       ce:'<code>g</code> e variabilă <b>globală cu valoare inițială</b> → zona <b>.data</b>, pagini <b>rw-</b> (citire+scriere, fără execuție).',
       dece:'Valoarea 42 trebuie să existe deja la pornire → e stocată în fișierul executabil și încărcată în .data. Scriibilă, pentru că programul o poate modifica.'},
      {titlu:'int v; → .bss', linii:[4],
       svg:pana(['g','v'],'v','bss'),
       ce:'<code>v</code> e globală <b>neinițializată</b> → <b>.bss</b>, pagini <b>rw-</b>. La pornire, kernelul o umple cu <b>zero</b>.',
       dece:'.bss nu ocupă loc în fișierul executabil (se știe doar dimensiunea) — de-asta există separat de .data. Întrebare frecventă: „unde stă o globală fără valoare?” → .bss, nu .data.'},
      {titlu:'"salut" → .rodata; msg → .data', linii:[5],
       svg:pana(['g','v','lit','msg'],'lit','rodata'),
       ce:'Atenție, sunt <b>două</b> obiecte: <b>literalul</b> "salut" stă în <b>.rodata</b> (r--), iar <b>pointerul</b> <code>msg</code> (global inițializat cu adresa literalului) stă în <b>.data</b> (rw-).',
       dece:'Capcana clasică a subiectului: poți schimba <code>msg</code> să arate altundeva (e rw-), dar <code>msg[0]=\'S\'</code> scrie în .rodata → <b>SIGSEGV</b>. Permisiunile paginii, nu compilatorul, opresc scrierea la runtime.'},
      {titlu:'codul funcțiilor → .text', linii:[7],
       svg:pana(['g','v','lit','msg','fcod'],'fcod','text'),
       ce:'Instrucțiunile compilate ale lui <code>f()</code> și <code>main()</code> stau în <b>.text</b>: pagini <b>r-x</b> — se pot citi și executa, dar <b>nu scrie</b>.',
       dece:'W^X (write xor execute): nicio pagină nu e simultan scriibilă și executabilă — altfel un atacator ar injecta cod în date și l-ar rula. De-asta „codul executabil al lui main” e răspuns de examen: .text, r-x.'},
      {titlu:'static int nr = 0 → .bss', linii:[8],
       svg:pana(['g','v','lit','msg','fcod','nr'],'nr','bss'),
       ce:'<code>static</code> local înseamnă <b>durată de viață globală</b>, dar vizibilitate locală → stă tot în date (.bss aici, fiind inițializat cu 0), <b>nu pe stivă</b>.',
       dece:'De aceea își păstrează valoarea între apelurile lui f(). Nuanță fină: inițializat cu 0 → .bss; inițializat cu altceva (ex. 5) → .data. Ambele variante apar la grile.'},
      {titlu:'x și local → STIVĂ', linii:[7,9],
       svg:pana(['g','v','lit','msg','fcod','nr','x'],'x','stack'),
       ce:'Parametrul <code>x</code> și variabila <code>local</code> trăiesc în <b>cadrul de stivă</b> al lui f(): apar la apel, dispar la return. Pagini <b>rw-</b>.',
       dece:'Stiva crește <b>în jos</b> (spre adrese mici) cu fiecare apel. <code>local</code> e neinițializată — conține „gunoi”, ce a rămas pe stivă de la apeluri anterioare.'},
      {titlu:'malloc(40) → HEAP; p → stivă', linii:[10],
       svg:pana(['g','v','lit','msg','fcod','nr','x','heap','p'],'heap','heap'),
       ce:'Blocul de <b>40 de octeți</b> alocat de malloc stă pe <b>heap</b>; dar <b>pointerul</b> <code>p</code> care îl ține minte e variabilă locală → pe <b>stivă</b>.',
       dece:'A doua capcană recurentă: „unde e p?” vs „unde arată p?”. La return fără free(), p dispare (stiva se strânge) dar blocul rămâne → <b>memory leak</b>.'},
      {titlu:'recapitularea răspunsului de examen', linii:[],
       svg:pana(['g','v','lit','msg','fcod','nr','x','heap','p'],null,null,'g→.data · v→.bss · "salut"→.rodata · msg→.data · cod→.text · nr→.bss · x,local,p→stivă · malloc→heap'),
       ce:'Harta completă, exact ca în baremul din 2023: fiecare element în zona lui, cu permisiunile paginilor: .text <b>r-x</b>, .rodata <b>r--</b>, restul <b>rw-</b>.',
       dece:'Șablonul de răspuns: (1) numești zona, (2) dai permisiunile, (3) menționezi capcanele (literal vs pointer, static, malloc vs p). Toate cele trei aduc punctaj.'}
    ]
  };
}

/* --- stiva & heap în mișcare --- */
function stivaHeap(o){
  o=o||{};
  var out=S.open(760,340);
  /* stiva (stânga) */
  out+=S.text(150,26,'STIVA (crește în jos)','sm b','middle');
  var frames=o.frames||['main()'];
  frames.forEach(function(f,i){
    var y=44+i*52, hot=o.hotF===i;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(40,y,220,44,'sv-n'+(hot?' acc':''),8);
    out+=S.text(150,y+20,f,'sm mono b','middle');
    out+=S.text(150,y+36,'cadru: parametri + locale + adresa de retur','xs mut','middle');
    out+='</g>';
  });
  out+=S.line(150,44+frames.length*52+4,150,44+frames.length*52+30,'acc','acc');
  out+=S.text(150,44+frames.length*52+46,'↓ spre adrese mici','xs mut','middle');
  /* heap (dreapta) */
  out+=S.text(590,26,'HEAP (crește în sus)','sm b','middle');
  var blocks=o.blocks||[];
  var hy=300;
  blocks.forEach(function(b,i){
    var y=hy-(i+1)*50, hot=o.hotB===i;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(480,y,220,42,'sv-n deep'+(b.free?' ghost':(hot?' acc':'')),8);
    out+=S.text(590,y+19,b.t,'sm mono'+(b.free?' mut':''),'middle');
    out+=S.text(590,y+34,b.free?'eliberat cu free() — gaură':'alocat',b.free?'xs red':'xs mut','middle');
    out+='</g>';
  });
  out+=S.line(590,300,590,272-blocks.length*50+40,'dim',null);
  out+=S.text(590,318,'↑ brk / sbrk împinge limita heap-ului','xs mut','middle');
  if(o.msg) out+=S.badge(380,326,o.msg,o.msgCls||'sv-fill-acc');
  return out+S.close;
}
function scStiva(){
  var cod=[
'void g(void){',
'    int t[100];      /* pe stiva lui g */',
'}',
'void f(void){',
'    int a;',
'    g();             /* push cadrul g  */',
'}',
'int main(void){',
'    char *p = malloc(100);',
'    char *q = malloc(200);',
'    free(p);          /* gaura in heap */',
'    f();',
'}'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Stiva și heap-ul, în mișcare',
    pasi:[
      {titlu:'main() are primul cadru', linii:[8],
       svg:stivaHeap({frames:['main()'],hotF:0}),
       ce:'La pornire, stiva conține doar cadrul lui <code>main()</code>. Heap-ul e gol.',
       dece:'Un „cadru” (stack frame) = parametrii, variabilele locale și adresa de retur ale unui apel de funcție.'},
      {titlu:'malloc împinge heap-ul în sus', linii:[9,10],
       svg:stivaHeap({frames:['main()'],blocks:[{t:'p → 100 B'},{t:'q → 200 B'}],hotB:1}),
       ce:'Două malloc-uri: alocatorul cere kernelului (brk/mmap) și heap-ul <b>crește în sus</b>, bloc peste bloc.',
       dece:'Heap = memoria cu <b>durată de viață controlată manual</b>: trăiește până la free(), indiferent de funcția care a alocat-o.'},
      {titlu:'free() lasă o gaură', linii:[11],
       svg:stivaHeap({frames:['main()'],blocks:[{t:'p → 100 B',free:true},{t:'q → 200 B'}],hotB:0,msg:'fragmentare: gaura poate fi refolosită doar de alocări ≤ 100 B',msgCls:'sv-fill-org'}),
       ce:'<code>free(p)</code> eliberează blocul, dar heap-ul nu se poate „strânge” peste q → rămâne o <b>gaură</b>.',
       dece:'Asta e <b>fragmentarea externă</b> a heap-ului — motivul pentru care alocatoarele țin liste de blocuri libere și de ce malloc/free repetate pot „umfla” procesul.'},
      {titlu:'apelurile împing stiva în jos', linii:[4,5,6,12],
       svg:stivaHeap({frames:['main()','f()'],hotF:1,blocks:[{t:'p → 100 B',free:true},{t:'q → 200 B'}]}),
       ce:'<code>main</code> apelează <code>f</code>: se împinge un cadru nou <b>sub</b> cel al lui main (adrese mai mici). <code>a</code> trăiește în acest cadru.',
       dece:'Push la apel, pop la return — de aceea localele „dispar” automat și de aceea un pointer la o locală returnat din funcție e un bug clasic (dangling pointer).'},
      {titlu:'g() mai adâncește un nivel', linii:[1,2,6],
       svg:stivaHeap({frames:['main()','f()','g()'],hotF:2,blocks:[{t:'p → 100 B',free:true},{t:'q → 200 B'}],msg:'recursie fără oprire = cadre la nesfârșit → STACK OVERFLOW',msgCls:'sv-fill-red'}),
       ce:'<code>f</code> apelează <code>g</code>: încă un cadru, cu tot cu <code>t[100]</code> (400 B pe stivă). La return-ul lui g, cadrul dispare instant.',
       dece:'Stiva are o limită (tipic 8 MB): recursia infinită sau tablourile locale uriașe o depășesc → <b>stack overflow</b> → SIGSEGV. Heap-ul, în schimb, e limitat doar de RAM/swap.'}
    ]
  };
}

/* --- mmap partajat între procese (subiect 2024) --- */
function mmapSvg(o){
  o=o||{};
  var out=S.open(760,300);
  [['Părinte · PID 4200',30],['Copil · PID 4201',530]].forEach(function(p){
    out+=S.rect(p[1],36,200,220,'sv-n ghost',12);
    out+=S.text(p[1]+100,60,p[0],'sm b mono','middle');
    out+=S.rect(p[1]+20,80,160,40,'sv-n',7)+S.text(p[1]+100,104,'stivă / date proprii','xs mut','middle');
    var hot=o.hotMap;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(p[1]+20,140,160,52,'sv-n '+(o.shared?'acc':'deep'),7);
    out+=S.text(p[1]+100,161,'zona mmap',hot?'xs b acc':'xs b','middle');
    out+=S.text(p[1]+100,178,o.val!=null?('contor = '+o.val):'MAP_SHARED','xs mono soft','middle');
    out+='</g>';
  });
  /* cadrul fizic comun */
  out+='<g'+(o.hotPhy?' class="sv-hot"':'')+'>';
  out+=S.rect(300,150,160,60,'sv-n '+(o.shared?'acc':''),9);
  out+=S.text(380,172,'RAM: același cadru',(o.shared?'xs b acc':'xs b'),'middle');
  out+=S.text(380,192,o.val!=null?('contor = '+o.val):'—','sm mono grn','middle');
  out+='</g>';
  if(o.shared){
    out+=S.curve(230,166,300,176,'acc','acc');
    out+='<path d="M550 166 C500 160,470 170,460 176" class="sv-l acc" marker-end="url(#ma-acc)"/>';
  }
  if(o.msg) out+=S.text(380,286,o.msg,'xs mut','middle');
  return out+S.close;
}
function scMmap(){
  var cod=[
'int *contor = mmap(NULL, sizeof(int),',
'        PROT_READ | PROT_WRITE,',
'        MAP_SHARED | MAP_ANONYMOUS,',
'        -1, 0);',
'*contor = 0;',
'',
'if(fork() == 0){       /* copilul  */',
'    (*contor)++;       /* vede aceeasi zona! */',
'    exit(0);',
'}',
'wait(NULL);',
'printf("%d\\n", *contor);   /* 1 */'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Memorie partajată prin mmap (subiectul din 2024)',
    pasi:[
      {titlu:'mmap creează zona partajabilă', linii:[1,2,3,4],
       svg:mmapSvg({val:0,msg:'MAP_ANONYMOUS = fără fișier în spate; MAP_SHARED = scrierile se văd între procese'}),
       ce:'<code>mmap</code> cu <b>MAP_SHARED | MAP_ANONYMOUS</b> alocă o zonă nouă în spațiul de adrese, mapată pe un cadru fizic care <b>va putea fi partajat</b> la fork.',
       dece:'Exact apelul din subiectul 2024. „Anonim” = memorie pură (nu un fișier mapat); „shared” = la fork, pagina NU intră sub Copy-On-Write.'},
      {titlu:'fork(): zona rămâne COMUNĂ', linii:[7],
       svg:mmapSvg({shared:true,val:0,hotMap:true,hotPhy:true,msg:'restul memoriei se separă prin COW — zona MAP_SHARED nu'}),
       ce:'După fork, părintele și copilul au <b>tabele de pagini separate</b>, dar intrările pentru zona mmap arată spre <b>același cadru fizic</b>.',
       dece:'Diferența-cheie față de restul memoriei: variabilele obișnuite se despart (COW), dar zona MAP_SHARED rămâne <b>fizic comună</b> — singura fereastră prin care procesele își văd unul altuia scrierile.'},
      {titlu:'copilul scrie → părintele vede', linii:[8],
       svg:mmapSvg({shared:true,val:1,hotPhy:true}),
       ce:'<code>(*contor)++</code> în copil modifică <b>cadrul comun</b> → după <code>wait()</code>, părintele citește <b>1</b>.',
       dece:'Fără MAP_SHARED (adică MAP_PRIVATE), incrementarea copilului ar fi declanșat COW și părintele ar fi afișat <b>0</b>. Grilă frecventă: shared vs private.',
       out:'1'},
      {titlu:'de ce e nevoie și de semafor', linii:[8],
       svg:mmapSvg({shared:true,val:1,msg:'mmap dă memoria comună; semaforul dă ORDINEA — una fără alta nu ajunge'}),
       ce:'Memoria comună rezolvă doar <b>comunicarea</b>. Dacă ambele procese incrementează simultan, apare exact <b>lost update</b>-ul de la fire → subiectul 2024 adaugă un semafor POSIX (<code>sem_init</code> cu <code>pshared=1</code>) în aceeași zonă mmap.',
       dece:'Răspunsul cerut la examen: „mmap facilitează <b>memoria partajată</b> între procese, iar semaforul <b>sincronizează accesul</b> la ea”. Vezi și simulatoarele Producător–Consumator și Explorator de întrețeseri.'}
    ]
  };
}

PSO.register({
  id:'vas', cat:'memorie', icon:'🧠',
  titlu:'Memoria unui proces: zone & permisiuni',
  scurt:'Unde „cade” fiecare variabilă (.text/.rodata/.data/.bss/heap/stivă), permisiunile paginilor și mmap partajat.',
  desc:'Programul din subiectul 2023, element cu element: fiecare variabilă își găsește zona pe harta spațiului de adrese, cu permisiunile paginilor (<b>r/w/x</b>). Apoi stiva și heap-ul în mișcare, și zona <b>mmap partajată</b> din subiectul 2024.',
  ani:[2019,2023,2024],
  nota:'În <b>2023</b>: „în ce zonă de memorie (data, text, stivă, rodata, bss, heap) vor fi încărcate și ce permisiuni vor avea paginile pentru următoarele elemente…”. În <b>2024</b>: „care este motivul apelului mmap()? ce mecanism al SO e facilitat?”.',
  scenarii:[
    {id:'unde',  nume:'unde cade fiecare variabilă? (2023)', build:scUnde},
    {id:'stiva', nume:'stiva & heap în mișcare',             build:scStiva},
    {id:'mmap',  nume:'mmap partajat (2024)',                build:scMmap}
  ]
});
})();

/* ============================================================
   9) Paginare & TLB — translatarea adreselor
   ============================================================ */
(function(){

/* schema de translatare: adresă virtuală → (TLB) → tabelă → adresă fizică */
function trad(o){
  o=o||{};
  var out=S.open(760,350);
  /* adresa virtuală */
  out+=S.text(30,30,'adresa virtuală (16 biți, pagini de 4 KB)','xs b mut');
  out+='<g'+(o.hotVA?' class="sv-hot"':'')+'>';
  out+=S.rect(30,40,120,44,'sv-n '+(o.hotP?'acc':''),8)+S.text(90,58,'p = '+(o.p!=null?o.p:'?'),'sm mono b','middle')+S.text(90,76,'4 biți: pagina','xs mut','middle');
  out+=S.rect(150,40,220,44,'sv-n',8)+S.text(260,58,'offset = '+(o.off||'?'),'sm mono b','middle')+S.text(260,76,'12 biți: poziția în pagină','xs mut','middle');
  out+='</g>';
  /* TLB */
  var tlb=o.tlb||[];
  out+=S.text(470,30,'TLB (cache-ul translatărilor)','xs b mut');
  out+='<g'+(o.hotTLB?' class="sv-hot"':'')+'>';
  out+=S.rect(470,40,260,26+Math.max(tlb.length,1)*22,'sv-n '+(o.hotTLB?'acc':'deep'),9);
  if(!tlb.length) out+=S.text(600,74,'— gol —','xs mono mut','middle');
  tlb.forEach(function(e,i){
    out+=S.text(500,66+i*22,'pag '+e[0]+' → cadru '+e[1],'xs mono '+(o.tlbHit===i?'grn':'soft'));
    if(o.tlbHit===i) out+=S.text(690,66+i*22,'HIT ✓','xs b grn');
  });
  out+='</g>';
  /* tabela de pagini */
  out+=S.text(30,132,'tabela de pagini (în RAM!)','xs b mut');
  var pt=o.pt||[[0,5,1],[1,9,1],[2,null,0],[3,7,1],[4,2,1]];
  pt.forEach(function(r,i){
    var y=142+i*26, hot=o.hotPT===i;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(30,y,240,22,'sv-n '+(hot?'acc':(r[2]?'':'ghost')),5);
    out+=S.text(46,y+15,'pag '+r[0],'xs mono b');
    out+=S.text(110,y+15,r[2]?('cadru '+r[1]):'INVALID (pe disc)','xs mono '+(r[2]?'soft':'red'));
    out+=S.text(226,y+15,'v='+r[2],'xs mono '+(r[2]?'grn':'red'));
    out+='</g>';
  });
  /* memoria fizică */
  out+=S.text(470,132,'memoria fizică','xs b mut');
  for(var f=0;f<6;f++){
    var fy=142+f*26, frameNo=[2,5,7,9,12,14][f];
    var hot=o.hotFrame===frameNo;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(470,fy,260,22,'sv-n '+(hot?'acc':'deep'),5);
    out+=S.text(486,fy+15,'cadrul '+frameNo,'xs mono '+(hot?'acc':'mut'));
    if(hot && o.pa) out+=S.text(700,fy+15,o.pa,'xs mono b grn','end');
    out+='</g>';
  }
  /* săgeți */
  if(o.sagVA_TLB) out+=S.curve(370,62,470,62,'acc','acc');
  if(o.sagVA_PT) out+='<path d="M90 84 C90 110,60 118,60 138" class="sv-l acc" marker-end="url(#ma-acc)"/>';
  if(o.sagPT_F!=null){ var y1=142+o.sagPT_F*26+11, fy2=142+[2,5,7,9,12,14].indexOf(o.hotFrame)*26+11; out+=S.curve(270,y1,470,fy2,'acc','acc'); }
  if(o.msg) out+=S.badge(380,330,o.msg,o.msgCls||'sv-fill-acc');
  return out+S.close;
}

function scTrad(){
  return {
    stageTitlu:'0x3A7F: din virtual în fizic, pas cu pas',
    pasi:[
      {titlu:'adresa se sparge în p | offset',
       svg:trad({p:3,off:'0xA7F',hotVA:true,hotP:true,msg:'0x3A7F = 0011 1010 0111 1111₂ → p=0011₂=3, offset=0xA7F'}),
       ce:'CPU generează adresa virtuală <b>0x3A7F</b>. Cu pagini de 4 KB (2¹²), ultimii <b>12 biți</b> sunt offsetul în pagină, iar primii <b>4 biți</b> dau numărul paginii: <b>p = 3</b>.',
       dece:'Împărțirea e pur pozițională — de aceea dimensiunea paginii e mereu putere a lui 2. Offsetul <b>nu se traduce niciodată</b>: poziția în pagină e aceeași și în cadru.'},
      {titlu:'căutăm întâi în TLB… gol → MISS',
       svg:trad({p:3,off:'0xA7F',tlb:[],hotTLB:true,sagVA_TLB:true,msg:'TLB miss: translatarea nu e în cache',msgCls:'sv-fill-red'}),
       ce:'Înainte de tabela de pagini, MMU întreabă <b>TLB-ul</b> — un cache mic (zeci de intrări) cu translatări recente. Acum e gol → <b>miss</b>.',
       dece:'Tabela de pagini stă în RAM: fără TLB, <b>fiecare</b> acces la memorie ar costa un acces suplimentar (întâi tabela, apoi datele) — dublu. TLB-ul face translatarea aproape gratuită în cazul obișnuit.'},
      {titlu:'page walk: tabela de pagini, intrarea 3',
       svg:trad({p:3,off:'0xA7F',tlb:[],hotPT:3,sagVA_PT:true,msg:'PTE 3: cadru 7, valid=1'}),
       ce:'MMU citește din RAM intrarea <b>3</b> a tabelei de pagini: pagina 3 e <b>validă</b> și stă în <b>cadrul 7</b>.',
       dece:'Intrarea (PTE) ține și biții de control: valid, permisiuni r/w/x, referenced, modified — pe ei se sprijină și protecția (SIGSEGV) și înlocuirea paginilor.'},
      {titlu:'adresa fizică = cadru·4096 + offset',
       svg:trad({p:3,off:'0xA7F',tlb:[[3,7]],hotPT:3,hotFrame:7,sagPT_F:3,pa:'0x7A7F',msg:'fizic: 7×0x1000 + 0xA7F = 0x7A7F · translatarea intră în TLB'}),
       ce:'Se lipesc: numărul cadrului (7) + offsetul neschimbat (0xA7F) → adresa fizică <b>0x7A7F</b>. Translatarea proaspătă se scrie în <b>TLB</b>.',
       dece:'Formula de examen: <code>AF = cadru × dim_pagină + offset</code>. Costul total al acestui prim acces: 2 accese la RAM (tabelă + date).'},
      {titlu:'al doilea acces în pagina 3 → TLB HIT',
       svg:trad({p:3,off:'0x120',tlb:[[3,7]],tlbHit:0,hotTLB:true,sagVA_TLB:true,hotFrame:7,pa:'0x7120',msg:'hit: fără page walk — un singur acces la RAM',msgCls:'sv-fill-grn'}),
       ce:'Următorul acces la <b>aceeași pagină</b> (0x3120): TLB-ul are deja „pag 3 → cadru 7” → <b>hit</b>, translatare instantanee, un singur acces la RAM.',
       dece:'Localitatea programelor face ca ~99% din accese să fie hit-uri. EAT (timpul mediu) = α·(t<sub>TLB</sub>+t<sub>mem</sub>) + (1−α)·(t<sub>TLB</sub>+2·t<sub>mem</sub>) — formula standard din curs.'},
      {titlu:'pagina 2: valid=0 → PAGE FAULT',
       svg:trad({p:2,off:'0x004',tlb:[[3,7]],hotPT:2,sagVA_PT:true,msg:'excepție: pagina nu e în RAM → intervine sistemul de operare',msgCls:'sv-fill-red'}),
       ce:'Acces la pagina <b>2</b>: intrarea are <b>valid = 0</b> (pagina e pe disc sau încă nealocată) → MMU ridică o excepție: <b>page fault</b>.',
       dece:'Kernelul decide: adresă legitimă → aduce pagina de pe disc (<b>demand paging</b>), eventual evacuând alta (vezi simulatorul „Înlocuirea paginilor”); adresă ilegală → <b>SIGSEGV</b>. Apoi instrucțiunea se reia identic.'},
      {titlu:'context switch → TLB-ul se golește',
       svg:trad({p:3,off:'—',tlb:[],hotTLB:true,msg:'alt proces = alte translatări: TLB flush (sau ASID per proces)',msgCls:'sv-fill-org'}),
       ce:'La schimbarea procesului, translatările din TLB devin <b>invalide</b> (alt spațiu de adrese!) → TLB <b>flush</b>. Primele accese ale noului proces sunt toate miss-uri.',
       dece:'Ăsta e costul „ascuns” al context switch-ului între <b>procese</b> — și motivul pentru care switch-ul între <b>firele</b> aceluiași proces e mai ieftin (TLB-ul rămâne valid). CPU-urile moderne atenuează cu ASID (etichetă de proces în TLB).'}
    ]
  };
}

PSO.register({
  id:'paginare', cat:'memorie', icon:'📄',
  titlu:'Paginare & TLB: translatarea adreselor',
  scurt:'Adresa virtuală se sparge în p|offset, trece prin TLB și tabela de pagini și devine adresă fizică.',
  desc:'Drumul complet al unei adrese: spargerea în <b>pagină + offset</b>, căutarea în <b>TLB</b>, page walk-ul prin tabela de pagini, lipirea adresei fizice — plus page fault-ul și golirea TLB-ului la context switch.',
  ani:[],
  notaTag:'Curs',
  nota:'Translatarea de adrese ca algoritm OS nu a picat direct la licență (apare doar în varianta hardware, la Arhitecturi) — dar e tema centrală a cursurilor 5–6 de PSO și a întrebărilor de curs (TLB, EAT, demand paging, de ce thread switch < process switch).',
  scenarii:[
    {id:'trad', nume:'translatare + TLB + fault', build:scTrad}
  ]
});
})();

/* ============================================================
   10) Înlocuirea paginilor — FIFO / LRU / OPT / Clock
   ============================================================ */
(function(){

var RALG=[
  {id:'FIFO', nume:'FIFO',  hint:'iese prima intrată'},
  {id:'LRU',  nume:'LRU',   hint:'iese cea mai demult nefolosită'},
  {id:'OPT',  nume:'Optimal',hint:'iese cea folosită cel mai târziu în viitor'},
  {id:'CLOCK',nume:'Clock', hint:'a doua șansă cu bit R'}
];

/* simulează și întoarce pașii: {frames, R, ptr, hit, victima, de_ce} per acces */
function ruleaza(ref, nF, alg){
  var frames=[], R=[], ptr=0, pasi=[], intrare=[], ultimUz=[];
  ref.forEach(function(pg,ai){
    var idx=frames.indexOf(pg), hit=idx>=0, victima=null, dece='';
    if(hit){
      if(alg==='CLOCK') R[idx]=1;
      if(alg==='LRU') ultimUz[idx]=ai;
      dece='pagina '+pg+' e deja în memorie → HIT (niciun fault).';
    } else if(frames.length<nF){
      frames.push(pg); R.push(1); intrare.push(ai); ultimUz.push(ai);
      dece='mai există un cadru liber → pagina '+pg+' se încarcă fără victimă (fault „rece”).';
    } else {
      var vi=0;
      if(alg==='FIFO'){
        vi=0; intrare.forEach(function(t,i){ if(t<intrare[vi]) vi=i; });
        dece='FIFO: victima e cea mai VECHE în memorie — pagina '+frames[vi]+' (a intrat la accesul #'+(intrare[vi]+1)+').';
      } else if(alg==='LRU'){
        vi=0; ultimUz.forEach(function(t,i){ if(t<ultimUz[vi]) vi=i; });
        dece='LRU: victima e cea mai demult NEFOLOSITĂ — pagina '+frames[vi]+' (ultima utilizare la accesul #'+(ultimUz[vi]+1)+').';
      } else if(alg==='OPT'){
        var best=-1;
        frames.forEach(function(f,i){
          var next=ref.indexOf(f,ai+1); if(next<0) next=1e9;
          if(best<0 || next>best){ best=next; vi=i; }
        });
        var cand=ref.indexOf(frames[vi],ai+1);
        dece='Optimal: victima e cea folosită cel mai TÂRZIU în viitor — pagina '+frames[vi]+(cand<0?' (nu mai apare deloc)':' (reapare abia la accesul #'+(cand+1)+')')+'. Nerealizabil practic (cere viitorul), dar e etalonul.';
      } else { /* CLOCK */
        var pasiCeas=[];
        while(true){
          if(R[ptr]===1){ pasiCeas.push('pagina '+frames[ptr]+': R=1 → a doua șansă (R←0)'); R[ptr]=0; ptr=(ptr+1)%nF; }
          else { pasiCeas.push('pagina '+frames[ptr]+': R=0 → victimă'); vi=ptr; ptr=(ptr+1)%nF; break; }
        }
        dece='Clock: '+pasiCeas.join('; ')+'.';
      }
      victima=frames[vi];
      frames[vi]=pg; R[vi]=1; intrare[vi]=ai; ultimUz[vi]=ai;
    }
    pasi.push({frames:frames.slice(), R:R.slice(), ptr:ptr, hit:hit, victima:victima, dece:dece, pg:pg});
  });
  return pasi;
}

function grila(ref, nF, pasi, idx, alg){
  var n=ref.length, X0=64, cw=Math.min(46,(760-X0-16)/n);
  var out=S.open(760, 120+nF*34+(alg==='CLOCK'?34:0)+50);
  /* header: șirul de referințe */
  ref.forEach(function(pg,i){
    var x=X0+i*cw+cw/2, cur=(i===idx);
    if(cur) out+=S.rect(X0+i*cw+2,10,cw-4,24+nF*34+((alg==='CLOCK')?34:0)+26,'sv-n ghost acc',7);
    out+=S.text(x,30,String(pg),'sm mono '+(cur?'b acc':(i<idx?'soft':'mut')),'middle');
  });
  out+=S.text(30,30,'ref:','xs b mut');
  /* cadrele în timp */
  for(var f=0;f<nF;f++){
    out+=S.text(30,66+f*34,'C'+f,'xs mono mut');
    for(var i=0;i<=idx;i++){
      var st=pasi[i], x=X0+i*cw;
      var val=st.frames[f]!=null?st.frames[f]:null;
      if(val===null) continue;
      var nou=(i===idx)&&!st.hit&&st.frames[f]===st.pg;
      out+=S.rect(x+3,50+f*34,cw-6,26,'sv-n '+(nou?'acc':'deep'),6);
      out+=S.text(x+cw/2,68+f*34,String(val),'xs mono '+(nou?'b acc':'soft'),'middle');
    }
  }
  /* biții R + pointerul (Clock) */
  if(alg==='CLOCK' && idx>=0){
    var yR=50+nF*34+8;
    out+=S.text(30,yR+14,'R:','xs mono mut');
    var st2=pasi[idx];
    st2.frames.forEach(function(v,fi){
      out+=S.text(64+fi*60, yR+14, 'C'+fi+'·R='+st2.R[fi]+(st2.ptr===fi?' ◀':''),'xs mono '+(st2.ptr===fi?'acc b':'mut'));
    });
  }
  /* hit / fault pe rând */
  var yhf=50+nF*34+(alg==='CLOCK'?34:0)+8;
  var faults=0;
  for(var i2=0;i2<=idx;i2++){
    var s=pasi[i2]; if(!s.hit) faults++;
    out+=S.text(X0+i2*cw+cw/2, yhf+14, s.hit?'H':'F','xs mono b '+(s.hit?'grn':'red'),'middle');
  }
  out+=S.badge(660,yhf+38,'fault-uri: '+faults+' / '+(idx+1),'sv-fill-red');
  return out+S.close;
}

function construieste(refStr, nF, alg){
  var ref=refStr.trim().split(/[\s,]+/).map(Number).filter(function(x){ return !isNaN(x); });
  if(!ref.length) ref=[7,0,1,2,0,3,0,4,2,3,0,3];
  var pasi=ruleaza(ref,nF,alg);
  var scPasi=[{
    titlu:'punctul de plecare',
    svg:grila(ref,nF,pasi,-1,alg),
    ce:'Șirul de referințe are <b>'+ref.length+'</b> accese; memoria are <b>'+nF+' cadre</b>, toate goale. Algoritmul: <b>'+alg+'</b>.',
    dece:'Formatul standard din curs: la fiecare acces, dacă pagina nu e în memorie avem <b>page fault</b>; când nu mai sunt cadre libere, algoritmul alege <b>victima</b>.'
  }];
  pasi.forEach(function(p,i){
    scPasi.push({
      titlu:'accesul #'+(i+1)+': pagina '+p.pg+(p.hit?' → HIT':' → FAULT'),
      svg:grila(ref,nF,pasi,i,alg),
      ce:(p.hit?'Pagina <b>'+p.pg+'</b> e deja într-un cadru → <b>hit</b>, mergem mai departe.':
          (p.victima!=null?'Pagina <b>'+p.pg+'</b> lipsește → <b>fault</b>; victima: pagina <b>'+p.victima+'</b>, în locul ei intră '+p.pg+'.'
                          :'Pagina <b>'+p.pg+'</b> lipsește → <b>fault</b>, dar există cadru liber.')),
      dece:p.dece
    });
  });
  var tf=pasi.filter(function(p){ return !p.hit; }).length;
  scPasi.push({
    titlu:'bilanțul',
    svg:grila(ref,nF,pasi,pasi.length-1,alg),
    ce:'<b>'+alg+'</b> a produs <b>'+tf+' fault-uri</b> din '+ref.length+' accese pe '+nF+' cadre.',
    dece:'Schimbă algoritmul sau numărul de cadre și compară. Reper: Optimal dă mereu minimul; LRU se apropie de el; FIFO poate avea <b>anomalia Belady</b> — mai multe cadre, mai multe fault-uri (încearcă presetul dedicat!).'
  });
  return {stageTitlu:'Înlocuirea paginilor — '+alg+' pe '+nF+' cadre', pasi:scPasi};
}

function mountRepl(preset){
  return function(root){
    var api={player:null, destroy:function(){ if(api.player) api.player.destroy(); }};
    var cfg={ref:preset.ref, nF:preset.nF, alg:preset.alg};
    var el=document.createElement('div');
    el.innerHTML=''
      +'<div class="cfg">'
      +'<div class="fld" style="flex:1 1 100%"><label>Algoritmul</label><div class="chips" data-el="algos" style="margin:0"></div></div>'
      +'<div class="fld" style="flex:1 1 340px"><label>șirul de referințe</label><input data-el="ref" value="'+preset.ref+'" style="min-width:280px"></div>'
      +'<div class="fld"><label>cadre</label><input type="number" min="2" max="6" data-el="nf" value="'+preset.nF+'"></div>'
      +'<button class="btn" data-a="run">⟳ Simulează</button>'
      +'</div>'
      +'<div data-el="player"></div>';
    root.appendChild(el);
    var q=function(k){ return el.querySelector('[data-el="'+k+'"]'); };
    function drawAlgos(){
      q('algos').innerHTML=RALG.map(function(a){
        return '<button class="chip'+(a.id===cfg.alg?' active':'')+'" data-al="'+a.id+'" title="'+a.hint+'">'+a.nume+'</button>';
      }).join('');
      q('algos').querySelectorAll('.chip').forEach(function(b){
        b.onclick=function(){ cfg.alg=b.dataset.al; drawAlgos(); run(); };
      });
    }
    function run(){
      cfg.ref=q('ref').value;
      cfg.nF=Math.max(2,Math.min(6,parseInt(q('nf').value,10)||3));
      if(api.player) api.player.destroy();
      api.player=new Player(q('player'), construieste(cfg.ref, cfg.nF, cfg.alg));
    }
    el.querySelector('[data-a="run"]').onclick=run;
    q('ref').onchange=run; q('nf').onchange=run;
    drawAlgos(); run();
    return api;
  };
}

PSO.register({
  id:'pagerepl', cat:'memorie', icon:'🔁',
  titlu:'Înlocuirea paginilor: FIFO · LRU · OPT · Clock',
  scurt:'Șirul de referințe din curs, acces cu acces: hit/fault, alegerea victimei și anomalia lui Belady.',
  desc:'Clasicul tabel din curs, animat: fiecare acces colorează hit (H) sau fault (F), iar la fault vezi <b>exact de ce</b> a fost aleasă victima — coada FIFO, vechimea LRU, viitorul OPT sau acele ceasului cu biți R. Editează șirul și numărul de cadre după plac.',
  ani:[],
  notaTag:'Curs',
  nota:'Algoritmii de înlocuire nu au apărut în subiectele de licență 2000–2024 (memoria virtuală pică doar în varianta „arhitecturi”) — dar sunt materia de bază a cursului 6 și a întrebărilor de curs. Dacă îi înveți, învață-i cu tot cu „de ce”-ul victimei.',
  scenarii:[
    {id:'curs',  nume:'șirul clasic din curs', build:function(){ return {custom:mountRepl({ref:'7 0 1 2 0 3 0 4 2 3 0 3',nF:3,alg:'FIFO'})}; }},
    {id:'belady',nume:'anomalia Belady (FIFO)', build:function(){ return {custom:mountRepl({ref:'1 2 3 4 1 2 5 1 2 3 4 5',nF:3,alg:'FIFO'})}; }}
  ]
});
/* expus pentru verificări automate (harness) */
PSO._pagerepl={ruleaza:ruleaza, construieste:construieste};
})();
