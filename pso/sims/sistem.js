/* ============================================================
   Simulatoare · Sistem — apelul de sistem (user/kernel mode)
   și semnalele (SIGINT, handlere — subiectul 2022)
   ============================================================ */
"use strict";

/* ============================================================
   11) Apelul de sistem: user mode ↔ kernel mode
   ============================================================ */
(function(){

function sysSvg(o){
  o=o||{};
  var out=S.open(760,352);
  /* benzile user / kernel */
  out+=S.rect(14,34,732,132,'sv-n flat',12);
  out+=S.text(30,56,'USER SPACE','xs b blu');
  out+=S.rect(14,190,732,130,'sv-n deep',12);
  out+=S.text(30,212,'KERNEL SPACE','xs b org');
  /* granița */
  out+=S.line(14,178,746,178,'red dash',null);
  out+=S.text(380,174,'granița de privilegiu — se trece DOAR prin trap/syscall','xs red','middle');
  /* bitul de mod */
  out+=S.badge(668,20,'mod: '+(o.kernel?'KERNEL (0)':'USER (1)'),o.kernel?'sv-fill-org':'sv-fill-blu');
  /* cutii user */
  function box(x,y,w,h,t1,t2,hot,cls){
    var g='<g'+(hot?' class="sv-hot"':'')+'>';
    g+=S.rect(x,y,w,h,'sv-n '+(hot?'acc':(cls||'')),9);
    g+=S.text(x+w/2,y+h/2-4,t1,'sm b','middle');
    g+=S.text(x+w/2,y+h/2+14,t2,'xs mut','middle');
    return g+'</g>';
  }
  out+=box(60,74,220,64,'aplicația','printf("salut\\n")',o.hot==='app');
  out+=box(420,74,240,64,'libc','write(1, buf, 6) — wrapper',o.hot==='libc');
  out+=box(60,228,200,64,'dispecerul de syscall','tabela: nr → funcție',o.hot==='disp');
  out+=box(300,228,180,64,'sys_write()','validează + copiază',o.hot==='sys');
  out+=box(520,228,180,64,'driverul tty','scrie pe terminal',o.hot==='drv');
  /* săgeți */
  if(o.s1) out+=S.line(280,106,420,106,'acc','acc')+S.text(350,96,'call obișnuit','xs mono mut','middle');
  if(o.s2) out+='<path d="M540 138 C540 168,220 160,175 228" class="sv-l acc" marker-end="url(#ma-acc)"/>'
             +S.text(400,172,'syscall (trap)','xs mono acc','middle');
  if(o.s3) out+=S.line(260,260,300,260,'acc','acc');
  if(o.s4) out+=S.line(480,260,520,260,'acc','acc');
  if(o.s5) out+='<path d="M610 228 C640 180,600 150,560 138" class="sv-l grn" marker-end="url(#ma-grn)"/>'
             +S.text(660,186,'return + rezultat','xs mono grn','middle');
  if(o.msg) out+=S.badge(380,338,o.msg,o.msgCls||'sv-fill-acc');
  return out+S.close;
}

function scSys(){
  var cod=[
'printf("salut\\n");',
'/* în spate: */',
'write(1, "salut\\n", 6);',
'/* wrapperul libc pune în registre:',
'   nr. syscall (__NR_write = 1),',
'   fd, adresa bufferului, lungimea',
'   … și execută instrucțiunea: */',
'syscall;   /* trap în kernel! */'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Drumul unui printf până la hardware',
    legenda:[{c:'acc',t:'activ'},{c:'blk',t:'kernel'}],
    pasi:[
      {titlu:'aplicația apelează printf — user mode', linii:[1],
       svg:sysSvg({hot:'app',msg:'totul rulează deocamdată în user mode'}),
       ce:'<code>printf</code> e o <b>funcție de bibliotecă</b> (libc): formatează textul în user space. Niciun privilegiu special până aici.',
       dece:'Distincția <b>library call vs system call</b> e întrebare de curs: printf/fwrite = funcții de bibliotecă (ieftine, user space, cu buffering); write = apel de sistem (scump, trece în kernel).'},
      {titlu:'libc pregătește apelul de sistem', linii:[3,4,5,6],
       svg:sysSvg({hot:'libc',s1:true}),
       ce:'Wrapper-ul <code>write()</code> din libc așază, în registrele convenite prin ABI, <b>numărul apelului</b> (__NR_write = 1) și argumentele (fd, buffer, lungime).',
       dece:'Kernelul nu primește „numele funcției” — primește un <b>număr</b> pe care îl caută în tabela de syscall-uri. De aceea orice limbaj poate face apeluri de sistem: convenția e la nivel de registre.'},
      {titlu:'instrucțiunea syscall = trap controlat', linii:[8],
       svg:sysSvg({kernel:true,hot:'disp',s2:true,msg:'CPU: salvează PC + flags, comută bitul de mod, sare la handlerul FIX'}),
       ce:'Instrucțiunea specială <code>syscall</code> face <b>trei lucruri atomic</b>: salvează starea (PC, flags), comută CPU în <b>kernel mode</b> (bit 0) și sare la o adresă <b>fixată de kernel</b> — nu una aleasă de program.',
       dece:'Aici e toată securitatea: programul <b>nu poate sări unde vrea</b> în kernel — poate doar „suna la ghișeu”. Intrarea în mod privilegiat și destinația saltului sunt controlate de hardware + kernel. Întrebare-cheie din banca de curs: „cum se face trecerea și cine o garantează?”'},
      {titlu:'dispecerul: tabela de syscall-uri', linii:[8],
       svg:sysSvg({kernel:true,hot:'sys',s3:true}),
       ce:'Handlerul citește numărul (1) și indexează <b>tabela de syscall-uri</b> → <code>sys_write</code>. Acolo se <b>validează totul</b>: fd-ul există? bufferul e chiar în spațiul procesului?',
       dece:'Kernelul nu are voie să aibă încredere în user space: un pointer greșit/ostil ar putea citi memoria altui proces. Validarea argumentelor e parte obligatorie a oricărui syscall.'},
      {titlu:'driverul scrie pe terminal', linii:[8],
       svg:sysSvg({kernel:true,hot:'drv',s4:true}),
       ce:'<code>sys_write</code> copiază octeții din bufferul user în kernel și îi predă <b>driverului tty</b>, care vorbește efectiv cu hardware-ul.',
       dece:'Doar kernel mode poate executa instrucțiunile privilegiate de I/O — de aceea „orice atingere de hardware” trece printr-un syscall. Dacă dispozitivul nu e gata, procesul poate fi <b>blocat</b> (WAITING) chiar aici.'},
      {titlu:'return: înapoi în user mode', linii:[1],
       svg:sysSvg({hot:'app',s5:true,msg:'rezultatul (6 = octeți scriși) ajunge în valoarea de retur'}),
       ce:'La final, CPU comută înapoi în <b>user mode</b>, restaurează starea salvată și execuția continuă cu instrucțiunea următoare; <code>write</code> întoarce 6.',
       dece:'Un apel de sistem = <b>două comutări de mod</b> + validări + eventuale copieri → de ordinul sutelor de ns, mult peste un call obișnuit. De-asta libc face <b>buffering</b> la printf: adună octeți și cheamă write rar. („De ce e printf mai rapid decât write?” — întrebare de curs.)'}
    ]
  };
}

PSO.register({
  id:'syscall', cat:'sistem', icon:'🖥️',
  titlu:'Apelul de sistem: user ↔ kernel',
  scurt:'Drumul unui printf: libc → trap → tabela de syscall-uri → driver — și de ce granița e de netrecut altfel.',
  desc:'Ce se întâmplă <b>exact</b> când programul tău are nevoie de kernel: pregătirea argumentelor în libc, instrucțiunea-trap care comută modul CPU, dispecerizarea prin tabela de syscall-uri, validarea și întoarcerea în user space.',
  ani:[],
  notaTag:'Curs',
  nota:'Secțiunea „software stack” din banca de întrebări a cursului trăiește aici: ce e un syscall și de ce e nevoie de el, user vs kernel mode, cine garantează trecerea, de ce accesul la hardware cere syscall, apeluri blocante vs neblocante, de ce libc face buffering.',
  scenarii:[
    {id:'sys', nume:'printf → write → kernel', build:scSys}
  ]
});
})();

/* ============================================================
   12) Semnale: SIGINT, handlere & SIG_DFL — subiectul 2022
   ============================================================ */
(function(){

/* timeline cu faze + dispoziția curentă a lui SIGINT */
function sigSvg(o){
  o=o||{};
  var fz=[
    {id:'setup',nume:'setup',      w:110},
    {id:'A',    nume:'faza_A()',   w:170},
    {id:'crit', nume:'exec_crit_func()', w:200},
    {id:'B',    nume:'faza_B()',   w:170}
  ];
  var out=S.open(760,330);
  out+=S.text(30,30,'execuția lui main(), în timp →','xs b mut');
  var x=30;
  fz.forEach(function(f){
    var hot=o.faza===f.id;
    out+='<g'+(hot?' class="sv-hot"':'')+'>';
    out+=S.rect(x,44,f.w,46,'sv-n '+(hot?'acc':''),9);
    out+=S.text(x+f.w/2,72,f.nume,'xs mono '+(hot?'b acc':'soft'),'middle');
    out+='</g>';
    f.x=x; x+=f.w+8;
  });
  /* banda cu dispoziția SIGINT pe fiecare fază */
  out+=S.text(30,124,'dispoziția lui SIGINT în fiecare fază:','xs b mut');
  var disp={setup:o.d0||'SIG_DFL', A:o.dA||'SIG_DFL', crit:o.dC||'handler', B:o.dB||'SIG_DFL'};
  fz.forEach(function(f){
    var d=disp[f.id], dfl=(d==='SIG_DFL');
    out+=S.rect(f.x,134,f.w,30,'sv-n '+(dfl?'':'aqu'),7);
    out+=S.text(f.x+f.w/2,154,d,'xs mono '+(dfl?'red':'aqu'),'middle');
  });
  /* Ctrl+C */
  if(o.ctrl){
    var fx=null;
    fz.forEach(function(f){ if(f.id===o.ctrl) fx=f.x+f.w/2; });
    if(fx!=null){
      out+=S.text(fx,208,'⌨️ Ctrl+C','sm b org','middle');
      out+=S.line(fx,214,fx,170,'org','org');
    }
  }
  if(o.efect){
    out+=S.badge(380,248,o.efect,o.efectCls||'sv-fill-red');
  }
  if(o.msg) out+=S.text(380,286,o.msg,'xs mut','middle');
  if(o.msg2) out+=S.text(380,308,o.msg2,'xs mut','middle');
  return out+S.close;
}

function scMec(){
  return {
    stageTitlu:'Ce e un semnal și cine îl trimite',
    pasi:[
      {titlu:'semnal = întrerupere software',
       svg:S.open(760,240)
         +S.node(40,40,190,60,'kernelul','Ctrl+C → SIGINT · erori → SIGSEGV','acc')
         +S.node(300,40,180,60,'alt proces','kill(pid, SIGTERM)','')
         +S.node(550,40,180,60,'procesul însuși','raise(), alarm()','')
         +'<path d="M135 100 C160 150,320 160,360 168" class="sv-l acc" marker-end="url(#ma-acc)"/>'
         +'<path d="M390 100 L390 164" class="sv-l" marker-end="url(#ma)"/>'
         +'<path d="M640 100 C620 150,470 160,430 168" class="sv-l" marker-end="url(#ma)"/>'
         +S.node(300,170,180,54,'procesul țintă','primește notificarea','run')
         +S.close,
       ce:'Un <b>semnal</b> e o notificare <b>asincronă</b> trimisă unui proces: de kernel (Ctrl+C → SIGINT, acces ilegal → SIGSEGV, copil terminat → SIGCHLD), de alt proces (<code>kill</code>) sau chiar de el însuși.',
       dece:'„Asincron” = poate sosi <b>oricând</b>, indiferent ce execută procesul — de aici toate subtilitățile: ce se execută la primire depinde de <b>dispoziția instalată în acel moment</b>.'},
      {titlu:'trei dispoziții posibile',
       svg:S.open(760,220)
         +S.node(40,40,210,60,'SIG_DFL','acțiunea implicită (SIGINT: terminare)','zmb')
         +S.node(280,40,210,60,'handler propriu','signal(SIGINT, functia_mea)','aqu')
         +S.node(520,40,210,60,'SIG_IGN','semnalul e ignorat','')
         +S.text(380,140,'signal(semnal, dispoziție) → întoarce dispoziția VECHE (ca s-o poți restaura)','sm soft','middle')
         +S.text(380,168,'excepții absolute: SIGKILL și SIGSTOP nu pot fi prinse, ignorate sau blocate','xs red','middle')
         +S.close,
       ce:'Pentru fiecare semnal, procesul poate avea: <b>acțiunea implicită</b> (SIG_DFL — la SIGINT: terminare), un <b>handler propriu</b>, sau <b>ignorare</b> (SIG_IGN). <code>signal()</code> instalează dispoziția și o <b>întoarce pe cea veche</b>.',
       dece:'Valoarea de retur a lui signal() e exact ce exploatează subiectul din 2022: salvezi dispoziția veche, o înlocuiești temporar, apoi o <b>restaurezi</b>. SIGKILL/SIGSTOP rămân mereu netratabile — altfel un proces ar fi de neomorât.'},
      {titlu:'când se execută handlerul?',
       svg:S.open(760,220)
         +S.rect(40,40,680,54,'sv-n deep',9)
         +S.text(60,72,'instrucțiuni…','xs mono mut')
         +S.badge(300,66,'sosește SIGINT','sv-fill-org')
         +S.text(430,72,'⇢ la revenirea în user mode: rulează handlerul','xs mono aqu')
         +S.text(660,72,'…continuă','xs mono mut')
         +S.text(380,140,'handlerul e „strecurat” în execuție; după el, procesul continuă DE UNDE A RĂMAS','sm soft','middle')
         +S.text(380,168,'de aceea în handler se apelează doar funcții async-signal-safe (nu printf/malloc în producție!)','xs mut','middle')
         +S.close,
       ce:'Semnalul e livrat când procesul <b>revine în user mode</b> (după un syscall / la următoarea planificare): execuția e întreruptă, rulează handlerul, apoi programul <b>continuă exact de unde a fost întrerupt</b>.',
       dece:'Handlerul se execută „în mijlocul” oricărei operații — dacă apelează funcții ne-reentrante (malloc, printf) care erau deja în execuție, structurile lor interne se pot corupe. Exemplu clasic din banca de curs: syslog/malloc în handler.'}
    ]
  };
}

function scSubiect(){
  var cod=[
'void handler(int sig){',
'    printf("nu acum!\\n");',
'}',
'',
'int main(void){',
'    void (*veche)(int);',
'    signal(SIGINT, SIG_DFL);',
'    faza_A();',
'',
'    veche = signal(SIGINT, handler);',
'    exec_crit_func();',
'',
'    signal(SIGINT, veche);',
'    faza_B();',
'}'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Subiectul 2022: efectul lui Ctrl+C depinde de MOMENT',
    legenda:[{c:'zmb',t:'SIG_DFL (terminare)'},{c:'aqu',t:'handler propriu'}],
    pasi:[
      {titlu:'harta dispozițiilor în timp', linii:[7,10,13],
       svg:sigSvg({msg:'banda de jos = ce dispoziție are SIGINT în fiecare fază a execuției'}),
       ce:'Programul schimbă dispoziția lui SIGINT de trei ori: <b>SIG_DFL</b> la început, <b>handler</b> pe durata funcției critice, apoi <b>înapoi la cea veche</b> (SIG_DFL, salvată în <code>veche</code>).',
       dece:'Subiectul din 2022 întreabă: „care este efectul apăsării Ctrl+C <b>în funcție de momentul apăsării</b>?” — răspunsul e chiar această bandă. Pașii următori apasă Ctrl+C în fiecare fază.'},
      {titlu:'Ctrl+C în faza_A → procesul MOARE', linii:[7,8],
       svg:sigSvg({faza:'A',ctrl:'A',efect:'SIG_DFL → procesul e TERMINAT',msg:'acțiunea implicită a lui SIGINT este terminarea procesului'}),
       ce:'În faza_A dispoziția e <b>SIG_DFL</b>: kernelul aplică acțiunea implicită a lui SIGINT — <b>terminarea procesului</b>. faza_A nu se mai termină, restul programului nu mai rulează.',
       dece:'SIG_DFL nu înseamnă „nimic” — înseamnă <b>acțiunea implicită a acelui semnal</b> (pentru SIGINT: terminare; pentru SIGCHLD: ignorare). Confuzia SIG_DFL/SIG_IGN e capcana nr. 1 la grilă.'},
      {titlu:'Ctrl+C în exec_crit_func → handlerul ne apără', linii:[10,11,1,2],
       svg:sigSvg({faza:'crit',ctrl:'crit',efect:'handlerul afișează „nu acum!” — execuția CONTINUĂ',efectCls:'sv-fill-grn',msg:'funcția critică nu e ucisă de Ctrl+C',msg2:'signal() a întors dispoziția veche → salvată în variabila „veche”'}),
       ce:'Pe durata funcției critice e instalat <b>handlerul</b>: la Ctrl+C rulează <code>handler()</code> (afișează „nu acum!”), apoi <code>exec_crit_func</code> <b>continuă de unde a rămas</b>. Procesul supraviețuiește.',
       dece:'Exact pentru asta a fost scris codul: funcția critică <b>nu trebuie întreruptă</b>. E și șablonul practic: protejezi o secțiune sensibilă instalând temporar un handler (sau SIG_IGN).',
       out:'nu acum!'},
      {titlu:'Ctrl+C în faza_B → moare din nou', linii:[13,14],
       svg:sigSvg({faza:'B',ctrl:'B',efect:'dispoziția restaurată = SIG_DFL → TERMINAT',msg:'signal(SIGINT, veche) a readus comportamentul inițial'}),
       ce:'<code>signal(SIGINT, veche)</code> a restaurat dispoziția salvată (SIG_DFL) → în faza_B, Ctrl+C <b>termină din nou procesul</b>.',
       dece:'Punctul de barem: să observi că <code>veche</code> ține valoarea întoarsă de signal() la instalarea handlerului — adică <b>SIG_DFL</b> — și că restaurarea o reactivează. Dacă programul ar fi omis restaurarea, faza_B ar fi rămas protejată de handler.'},
      {titlu:'rezumatul răspunsului de examen', linii:[],
       svg:S.open(760,200)
         +S.node(40,30,210,60,'Ctrl+C în faza_A','SIG_DFL → terminare','zmb')
         +S.node(280,30,210,60,'Ctrl+C în critică','handler → „nu acum!”, continuă','aqu')
         +S.node(520,30,210,60,'Ctrl+C în faza_B','SIG_DFL restaurat → terminare','zmb')
         +S.text(380,130,'efectul lui Ctrl+C = dispoziția instalată ÎN MOMENTUL livrării semnalului','sm b acc','middle')
         +S.text(380,158,'nu contează ce a fost instalat cândva — contează ce e instalat ACUM','xs mut','middle')
         +S.close,
       ce:'Cele trei răspunsuri, unul lângă altul: terminare / handler + continuare / terminare. Efectul depinde <b>doar</b> de dispoziția activă la momentul livrării.',
       dece:'Formularea câștigătoare la examen leagă fiecare interval de timp de dispoziția lui și de efect — exact structura acestui simulator.'}
    ]
  };
}

PSO.register({
  id:'semnale', cat:'sistem', icon:'⚡',
  titlu:'Semnale: SIGINT & handlere',
  scurt:'Cine trimite semnale, cele 3 dispoziții și subiectul 2022: efectul lui Ctrl+C în funcție de moment.',
  desc:'Semnalele sunt „întreruperile software” ale proceselor. Întâi mecanismul (cine trimite, SIG_DFL vs handler vs SIG_IGN, când rulează handlerul), apoi <b>problema din 2022</b> pas cu pas: același Ctrl+C, trei efecte diferite, în funcție de momentul apăsării.',
  ani:[2022],
  nota:'Subiectul din <b>2022</b>: cod cu signal(SIGINT, SIG_DFL), last = signal(SIGINT, handler), signal(SIGINT, last) — „care este efectul apăsării Ctrl+C în funcție de momentul apăsării? (răspuns multiplu)”. Simulatorul reproduce exact structura acelui program.',
  scenarii:[
    {id:'mecanism', nume:'mecanismul semnalelor',    build:scMec},
    {id:'subiect',  nume:'Ctrl+C în 3 momente (2022)', build:scSubiect}
  ]
});
})();
