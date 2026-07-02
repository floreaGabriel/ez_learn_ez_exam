/* ============================================================
   Simulator · Descriptori de fișiere — cele 3 tabele,
   dup2/redirectări, fork & cursorul partajat, pipe (2019)
   ============================================================ */
"use strict";

(function(){

/* ---------- desenul celor 3 tabele ----------
   o.procs: [{nume, y?, fds:[{fd, to, hot, dead}]}]
   o.ofs:   [{id, l1, l2, hot, dead}]        (open file table)
   o.inos:  [{id, txt, hot}]                 (tabela de inode-uri)
   o.ofTo:  {ofId: inoId}
   legăturile fd → of se dau prin fds[].to = ofId                  */
function fdt(o){
  o=o||{};
  var H=o.h||360;
  var out=S.open(760,H);
  out+=S.text(110,24,'tabela de fd (per proces)','xs b mut','middle');
  out+=S.text(390,24,'tabela fișierelor deschise (sistem)','xs b mut','middle');
  out+=S.text(660,24,'tabela de inode-uri','xs b mut','middle');

  var pos={}; /* id -> {x,y} pentru săgeți */

  /* procese + fd-uri */
  var py=40;
  (o.procs||[]).forEach(function(p){
    var rows=p.fds.length;
    out+=S.rect(20,py,190,26+rows*28,'sv-n ghost',10);
    out+=S.text(32,py+18,p.nume,'xs b mono acc');
    p.fds.forEach(function(f,i){
      var y=py+26+i*28;
      out+='<g'+(f.hot?' class="sv-hot"':'')+'>';
      out+=S.rect(32,y,166,22,'sv-n '+(f.dead?'dead':(f.hot?'acc':'')),5);
      out+=S.text(44,y+15,'fd '+f.fd,'xs mono b'+(f.dead?' mut':''));
      out+=S.text(100,y+15,f.lbl||'',(f.dead?'xs mono mut':'xs mono soft'));
      out+='</g>';
      if(f.to && !f.dead) pos['fd_'+(p.nume)+'_'+f.fd]={x:198,y:y+11,to:f.to,hot:f.hot};
    });
    py+=26+rows*28+16;
  });

  /* open file table */
  var oy=40;
  (o.ofs||[]).forEach(function(e){
    out+='<g'+(e.hot?' class="sv-hot"':'')+'>';
    out+=S.rect(300,oy,190,46,'sv-n '+(e.dead?'dead':(e.hot?'acc':'deep')),8);
    out+=S.text(312,oy+19,e.l1,'xs mono b'+(e.dead?' mut':''));
    out+=S.text(312,oy+36,e.l2||'','xs mono '+(e.dead?'mut':'soft'));
    out+='</g>';
    pos[e.id]={x:300,y:oy+23,xr:490,to:(o.ofTo||{})[e.id],hot:e.hot,dead:e.dead};
    oy+=58;
  });

  /* inode-uri */
  var iy=40;
  (o.inos||[]).forEach(function(n){
    out+='<g'+(n.hot?' class="sv-hot"':'')+'>';
    out+=S.rect(580,iy,164,40,'sv-n '+(n.hot?'acc':''),8);
    out+=S.text(592,iy+17,n.txt,'xs mono b');
    out+=S.text(592,iy+33,n.sub||'','xs mut');
    out+='</g>';
    pos[n.id]={x:580,y:iy+20};
    iy+=52;
  });

  /* săgeți fd -> of */
  for(var k in pos){
    if(k.indexOf('fd_')!==0) continue;
    var f=pos[k], t=pos[f.to];
    if(!t) continue;
    out+=S.curve(f.x,f.y,t.x,t.y,f.hot?'acc':'',f.hot?'acc':'');
  }
  /* săgeți of -> inode */
  (o.ofs||[]).forEach(function(e){
    var f=pos[e.id], t=pos[(o.ofTo||{})[e.id]];
    if(!f||!t||e.dead) return;
    out+=S.curve(f.xr,f.y,t.x,t.y,e.hot?'acc':'',e.hot?'acc':'');
  });

  if(o.msg) out+=S.badge(380,H-14,o.msg,o.msgCls||'sv-fill-acc');
  return out+S.close;
}

var TTY={id:'tty',txt:'tty (terminal)',sub:'dispozitiv caracter'};
function stdFds(extra,to){
  var f=[{fd:0,lbl:'stdin →',to:'oftty'},{fd:1,lbl:'stdout →',to:'oftty'},{fd:2,lbl:'stderr →',to:'oftty'}];
  return f.concat(extra||[]);
}
var OFTTY={id:'oftty',l1:'tty · count 3',l2:'moștenite de la shell'};

/* --- scenariul 1: open + read + cele 3 tabele --- */
function scOpen(){
  var cod=[
'int fd = open("a.txt", O_RDONLY);',
'char buf[10];',
'',
'read(fd, buf, 10);   /* cursor: 0 -> 10 */',
'',
'int fd2 = open("a.txt", O_RDONLY);',
'read(fd2, buf, 5);   /* alt cursor!    */',
'',
'close(fd);'].join('\n');
  var INO={id:'ino1',txt:'inode a.txt',sub:'2 KB pe disc'};
  return {
    cod:cod,
    stageTitlu:'Arhitectura pe 3 niveluri a descriptorilor',
    pasi:[
      {titlu:'punctul de plecare: 0, 1, 2', linii:[],
       svg:fdt({procs:[{nume:'proces · 4200',fds:stdFds()}],ofs:[OFTTY],inos:[TTY],ofTo:{oftty:'tty'},
                msg:'orice proces pornește cu stdin/stdout/stderr moștenite'}),
       ce:'Fiecare proces are o <b>tabelă de descriptori</b>; pozițiile 0, 1, 2 sunt deja ocupate: stdin, stdout, stderr — toate spre terminal.',
       dece:'Un „descriptor” e doar un <b>index</b> în această tabelă — un int mic. Tot ce e interesant (cursor, permisiuni, fișierul real) stă în celelalte două tabele.'},
      {titlu:'open() → fd 3 + intrare nouă', linii:[1],
       svg:fdt({procs:[{nume:'proces · 4200',fds:stdFds([{fd:3,lbl:'a.txt →',to:'of1',hot:true}])}],
                ofs:[OFTTY,{id:'of1',l1:'a.txt · O_RDONLY',l2:'cursor 0 · count 1',hot:true}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1'},
                msg:'se alege întotdeauna cel mai MIC fd liber → 3'}),
       ce:'<code>open()</code> face trei lucruri: găsește inode-ul lui a.txt, creează o intrare în <b>tabela fișierelor deschise</b> (cursor 0, mod, count 1) și pune în tabela procesului <b>cel mai mic fd liber</b>: 3.',
       dece:'Regula „cel mai mic fd liber” e cheia tuturor trucurilor cu redirectări (vezi scenariul dup2). Cele 3 niveluri separă: <b>ce vede procesul</b> / <b>starea deschiderii</b> / <b>fișierul însuși</b>.'},
      {titlu:'read() mută cursorul — dar unde?', linii:[4],
       svg:fdt({procs:[{nume:'proces · 4200',fds:stdFds([{fd:3,lbl:'a.txt →',to:'of1'}])}],
                ofs:[OFTTY,{id:'of1',l1:'a.txt · O_RDONLY',l2:'cursor 10 ← s-a mutat',hot:true}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1'}}),
       ce:'<code>read(fd, buf, 10)</code> citește 10 octeți și avansează <b>cursorul din tabela fișierelor deschise</b>: 0 → 10.',
       dece:'Cursorul NU stă nici în tabela de fd (e doar un index), nici în inode (fișierul n-are habar cine îl citește) — ci exact la mijloc. Întrebare de definiție din banca de curs.'},
      {titlu:'al doilea open() = alt cursor', linii:[6,7],
       svg:fdt({procs:[{nume:'proces · 4200',fds:stdFds([{fd:3,lbl:'a.txt →',to:'of1'},{fd:4,lbl:'a.txt →',to:'of2',hot:true}])}],
                ofs:[OFTTY,{id:'of1',l1:'a.txt · O_RDONLY',l2:'cursor 10 · count 1'},{id:'of2',l1:'a.txt · O_RDONLY',l2:'cursor 5 · count 1',hot:true}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1',of2:'ino1'},
                msg:'două deschideri = două intrări = cursoare INDEPENDENTE, același inode'}),
       ce:'Un nou <code>open("a.txt")</code> creează <b>altă intrare</b> (fd 4 → cursor propriu). După <code>read(fd2, buf, 5)</code>, cursorul lui e 5, al primului rămâne 10. Ambele arată spre <b>același inode</b>.',
       dece:'open de două ori ⇒ poziții de citire independente. Contrastează cu <b>dup2 / fork</b>, care <b>partajează</b> aceeași intrare, deci același cursor — diferența e subiect de grilă.'},
      {titlu:'close(fd) scade count-ul', linii:[9],
       svg:fdt({procs:[{nume:'proces · 4200',fds:stdFds([{fd:3,lbl:'închis ✕',dead:true},{fd:4,lbl:'a.txt →',to:'of2'}])}],
                ofs:[OFTTY,{id:'of1',l1:'a.txt (eliberată)',l2:'count 0 → dispare',dead:true},{id:'of2',l1:'a.txt · O_RDONLY',l2:'cursor 5 · count 1'}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of2:'ino1'},
                msg:'fd 3 devine liber — următorul open îl va refolosi'}),
       ce:'<code>close(fd)</code> golește poziția 3 din tabela procesului și scade <b>count</b>-ul intrării; ajuns la 0, intrarea se eliberează. fd 4 funcționează în continuare.',
       dece:'Count-ul există fiindcă <b>mai multe fd-uri pot arăta spre aceeași intrare</b> (după dup2/fork). Intrarea moare doar când ultimul fd care o folosește e închis.'}
    ]
  };
}

/* --- scenariul 2: dup2 și redirectarea --- */
function scDup(){
  var cod=[
'int fd = open("out.txt",',
'      O_WRONLY | O_CREAT, 0644);  /* fd 3 */',
'',
'dup2(fd, 1);    /* stdout -> out.txt */',
'close(fd);',
'',
'printf("salut\\n");  /* ajunge în FIȘIER */'].join('\n');
  var INO={id:'ino1',txt:'inode out.txt',sub:'creat acum'};
  return {
    cod:cod,
    stageTitlu:'dup2: așa funcționează „prog > out.txt”',
    pasi:[
      {titlu:'open → fd 3 spre out.txt', linii:[1,2],
       svg:fdt({procs:[{nume:'proces · 4200',fds:stdFds([{fd:3,lbl:'out.txt →',to:'of1',hot:true}])}],
                ofs:[OFTTY,{id:'of1',l1:'out.txt · O_WRONLY',l2:'cursor 0 · count 1',hot:true}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1'}}),
       ce:'Deschidem fișierul destinație: fd <b>3</b> → intrare nouă → inode-ul lui out.txt. Deocamdată stdout (fd 1) arată tot spre terminal.',
       dece:'Pregătirea redirectării: avem nevoie de o intrare de „fișier deschis” către care să mutăm stdout-ul.'},
      {titlu:'dup2(fd, 1): fd 1 devine copia lui fd 3', linii:[4],
       svg:fdt({procs:[{nume:'proces · 4200',fds:[{fd:0,lbl:'stdin →',to:'oftty'},{fd:1,lbl:'out.txt →',to:'of1',hot:true},{fd:2,lbl:'stderr →',to:'oftty'},{fd:3,lbl:'out.txt →',to:'of1'}]}],
                ofs:[{id:'oftty',l1:'tty · count 2',l2:'a pierdut stdout-ul'},{id:'of1',l1:'out.txt · O_WRONLY',l2:'cursor 0 · count 2',hot:true}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1'},
                msg:'dup2(a,b): închide b, apoi îl face să arate unde arată a'}),
       ce:'<code>dup2(3, 1)</code>: închide vechiul fd 1 și îl face să arate spre <b>aceeași intrare</b> ca fd 3 → count 2. Acum „stdout” înseamnă out.txt.',
       dece:'Nu se copiază nici fișierul, nici datele — doar <b>pointerul</b> din tabela de fd. Programul care scrie la fd 1 nici nu află că a fost redirectat.'},
      {titlu:'close(fd): rămâne doar fd 1', linii:[5],
       svg:fdt({procs:[{nume:'proces · 4200',fds:[{fd:0,lbl:'stdin →',to:'oftty'},{fd:1,lbl:'out.txt →',to:'of1'},{fd:2,lbl:'stderr →',to:'oftty'},{fd:3,lbl:'închis ✕',dead:true}]}],
                ofs:[{id:'oftty',l1:'tty · count 2',l2:''},{id:'of1',l1:'out.txt · O_WRONLY',l2:'cursor 0 · count 1'}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1'},
                msg:'igienă: fd-ul temporar se închide, redirectarea rămâne'}),
       ce:'Fd-ul temporar 3 se închide (count scade la 1). Redirectarea trăiește prin fd 1.',
       dece:'Șablonul standard: <code>open → dup2 → close</code>. La examen (2016: „fork, dup, execve”) shell-ul face exact asta între fork și exec pentru <code>&gt;</code>, <code>&lt;</code> și <code>|</code>.'},
      {titlu:'printf scrie… în fișier', linii:[7],
       svg:fdt({procs:[{nume:'proces · 4200',fds:[{fd:0,lbl:'stdin →',to:'oftty'},{fd:1,lbl:'out.txt →',to:'of1',hot:true},{fd:2,lbl:'stderr →',to:'oftty'}]}],
                ofs:[{id:'oftty',l1:'tty · count 2',l2:''},{id:'of1',l1:'out.txt · O_WRONLY',l2:'cursor 6 · count 1',hot:true}],
                inos:[TTY,INO],ofTo:{oftty:'tty',of1:'ino1'},
                msg:'nimic pe ecran: octeții au ajuns în out.txt'}),
       ce:'<code>printf</code> → <code>write(1, "salut\\n", 6)</code> → fd 1 → intrarea lui out.txt → cursorul ajunge la 6. Pe terminal: nimic.',
       dece:'Programul e „păcălit” la nivelul tabelei de fd — de aceea redirectarea funcționează pentru <b>orice</b> program, fără recompilare. stderr (fd 2) rămâne pe terminal: de-asta erorile se văd chiar când output-ul e redirectat.'}
    ]
  };
}

/* --- scenariul 3: fork partajează cursorul --- */
function scForkFd(){
  var cod=[
'int fd = open("a.txt", O_RDONLY);',
'',
'if(fork() == 0){',
'    read(fd, buf, 5);   /* copilul: 0..4 */',
'    exit(0);',
'}',
'wait(NULL);',
'read(fd, buf, 5);       /* părintele: 5..9 ! */'].join('\n');
  var INO={id:'ino1',txt:'inode a.txt',sub:'"ABCDEFGHIJ…"'};
  function doi(cursor,hotOf,hotP,hotC,msg){
    return fdt({procs:[
        {nume:'părinte · 4200',fds:[{fd:3,lbl:'a.txt →',to:'of1',hot:hotP}]},
        {nume:'copil · 4201',fds:[{fd:3,lbl:'a.txt →',to:'of1',hot:hotC}]}],
      ofs:[{id:'of1',l1:'a.txt · O_RDONLY',l2:'cursor '+cursor+' · count 2',hot:hotOf}],
      inos:[INO],ofTo:{of1:'ino1'},h:300,msg:msg});
  }
  return {
    cod:cod,
    stageTitlu:'După fork: două tabele de fd, UN singur cursor',
    pasi:[
      {titlu:'înainte de fork', linii:[1],
       svg:fdt({procs:[{nume:'părinte · 4200',fds:[{fd:3,lbl:'a.txt →',to:'of1',hot:true}]}],
                ofs:[{id:'of1',l1:'a.txt · O_RDONLY',l2:'cursor 0 · count 1',hot:true}],
                inos:[INO],ofTo:{of1:'ino1'},h:300}),
       ce:'Părintele deschide a.txt: fd 3, cursor 0, count 1. (Am ascuns fd 0/1/2 ca să vedem esențialul.)',
       dece:'Întrebarea care urmează: la fork, ce anume se copiază din această schemă — și ce se partajează?'},
      {titlu:'fork(): tabela se COPIAZĂ, intrarea se PARTAJEAZĂ', linii:[3],
       svg:doi(0,true,false,false,'count crește la 2: două fd-uri, aceeași intrare'),
       ce:'Copilul primește o <b>copie a tabelei de fd</b>: are și el fd 3. Dar ambele fd 3 arată spre <b>aceeași intrare</b> din tabela fișierelor deschise → count 2, <b>un singur cursor</b>.',
       dece:'Exact ca la dup2, doar că între procese. Consecința practică e la pasul următor — și e capcana preferată a subiectelor cu fork + read.'},
      {titlu:'copilul citește 5 octeți', linii:[4],
       svg:doi(5,true,false,true,'copilul a primit octeții 0..4 (ABCDE)'),
       ce:'Copilul citește 5 octeți (pozițiile 0–4) → cursorul <b>comun</b> avansează la 5.',
       dece:'Cursorul e în intrarea partajată, nu în tabela copilului — deci mișcarea lui se va vedea și din părinte.'},
      {titlu:'părintele citește… de la 5!', linii:[7,8],
       svg:doi(10,true,true,false,'părintele primește FGHIJ, nu ABCDE'),
       ce:'După <code>wait()</code>, părintele citește 5 octeți și primește pozițiile <b>5–9</b> (FGHIJ) — <b>nu</b> începutul fișierului!',
       dece:'Răspunsul de examen: după fork, descriptorii moșteniți <b>partajează cursorul</b>; citirile celor două procese se „continuă” una pe alta. Dacă fiecare ar fi făcut <code>open()</code> propriu, ar fi avut cursoare separate și ar fi citit ambii ABCDE.'}
    ]
  };
}

/* --- scenariul 4: pipe — schema din subiectul 2019 --- */
function pipeSvg(o){
  o=o||{};
  var out=S.open(760,320);
  /* părinte */
  function proc(x,nume,fds,hot){
    var o2='<g'+(hot?' class="sv-hot"':'')+'>';
    o2+=S.rect(x,50,200,150,'sv-n ghost',12);
    o2+=S.text(x+100,74,nume,'sm b mono','middle');
    fds.forEach(function(f,i){
      var y=88+i*34;
      o2+=S.rect(x+16,y,168,26,'sv-n '+(f.dead?'dead':(f.hot?'acc':'')),6);
      o2+=S.text(x+28,y+17,f.t,'xs mono'+(f.dead?' mut':''));
    });
    return o2+'</g>';
  }
  out+=proc(20,'părinte · 4200',o.pfds||[],o.hotP);
  out+=proc(540,'copil · 4201',o.cfds||[],o.hotC);
  /* pipe-ul în kernel */
  out+='<g'+(o.hotPipe?' class="sv-hot"':'')+'>';
  out+=S.rect(280,96,200,64,'sv-n '+(o.hotPipe?'acc':'deep'),12);
  out+=S.text(380,118,'PIPE (buffer FIFO în kernel)','xs b '+(o.hotPipe?'acc':'mut'),'middle');
  out+=S.text(380,142,o.bufer!=null?('„'+o.bufer+'”'):'— gol —','sm mono grn','middle');
  out+='</g>';
  /* săgețile de date */
  if(o.sagW) out+=S.curve(220,120,280,120,'acc','acc')+S.text(250,108,'write','xs mono acc','middle');
  if(o.sagR) out+=S.curve(480,132,540,132,'acc','acc')+S.text(510,120,'read','xs mono acc','middle');
  out+=S.text(380,226,'fd[0] = capătul de CITIRE   ·   fd[1] = capătul de SCRIERE','xs mut','middle');
  if(o.msg) out+=S.badge(380,262,o.msg,o.msgCls||'sv-fill-acc');
  if(o.msg2) out+=S.text(380,300,o.msg2,'xs mut','middle');
  return out+S.close;
}
function scPipe(){
  var cod=[
'int fd[2];',
'pipe(fd);   /* fd[0]=citire, fd[1]=scriere */',
'',
'if(fork() == 0){         /* copilul   */',
'    close(fd[1]);        /* nu scrie  */',
'    read(fd[0], buf, 64);',
'    exit(0);',
'}',
'close(fd[0]);            /* părintele */',
'write(fd[1], "salut", 5);',
'close(fd[1]);            /* => EOF    */',
'wait(NULL);'].join('\n');
  return {
    cod:cod,
    stageTitlu:'Pipe anonim părinte → copil (subiectul din 2019)',
    pasi:[
      {titlu:'pipe(fd) creează canalul', linii:[1,2],
       svg:pipeSvg({pfds:[{t:'fd[0]=3 · citire'},{t:'fd[1]=4 · scriere'}],cfds:[],hotPipe:true,
                    msg2:'un pipe = buffer unidirecțional în kernel (tipic 64 KB)'}),
       ce:'<code>pipe(fd)</code> creează un <b>buffer FIFO în kernel</b> și două fd-uri în procesul curent: <code>fd[0]</code> pentru citire, <code>fd[1]</code> pentru scriere.',
       dece:'Pipe-ul e <b>unidirecțional</b>: octeții intră pe capătul de scriere și ies, în aceeași ordine, pe cel de citire. Pentru dialog în ambele sensuri → <b>două</b> pipe-uri (nota subiectului din 2019).'},
      {titlu:'fork(): ambele procese au ambele capete', linii:[4],
       svg:pipeSvg({pfds:[{t:'fd[0]=3 · citire'},{t:'fd[1]=4 · scriere'}],cfds:[{t:'fd[0]=3 · citire'},{t:'fd[1]=4 · scriere'}],
                    msg:'4 descriptori spre același pipe — deocamdată'}),
       ce:'La fork, copilul moștenește tabela de fd → acum <b>ambele</b> procese au <b>ambele</b> capete ale aceluiași pipe.',
       dece:'De-asta pipe-ul anonim merge <b>doar între procese înrudite</b>: singura cale de a ajunge la el e moștenirea descriptorilor. Pentru procese străine există FIFO-uri numite (mkfifo).'},
      {titlu:'fiecare închide capătul nefolosit', linii:[5,9],
       svg:pipeSvg({pfds:[{t:'fd[0] închis ✕',dead:true},{t:'fd[1]=4 · scriere',hot:true}],
                    cfds:[{t:'fd[0]=3 · citire',hot:true},{t:'fd[1] închis ✕',dead:true}],
                    msg:'părintele doar scrie; copilul doar citește'}),
       ce:'Convenția obligatorie: părintele închide capătul de citire, copilul pe cel de scriere. Rămâne un canal curat părinte → copil.',
       dece:'Nu e doar igienă! Dacă copilul ar păstra <code>fd[1]</code> deschis, la terminarea părintelui <code>read()</code>-ul lui <b>n-ar întoarce niciodată EOF</b> (kernelul vede că „încă ar putea scrie cineva” — chiar el). Punct de barem la subiectul din 2019.'},
      {titlu:'write(fd[1], "salut", 5)', linii:[10],
       svg:pipeSvg({pfds:[{t:'fd[0] închis ✕',dead:true},{t:'fd[1]=4 · scriere',hot:true}],
                    cfds:[{t:'fd[0]=3 · citire'},{t:'fd[1] închis ✕',dead:true}],
                    bufer:'salut',sagW:true,hotPipe:true}),
       ce:'Părintele scrie 5 octeți; ei stau în bufferul din kernel până îi ridică cineva.',
       dece:'Semantica de blocare: <code>write</code> pe pipe <b>plin</b> blochează scriitorul; <code>read</code> pe pipe <b>gol</b> blochează cititorul. Pipe-ul sincronizează „gratis” — e un producător–consumator gata făcut.'},
      {titlu:'copilul citește', linii:[6],
       svg:pipeSvg({pfds:[{t:'fd[0] închis ✕',dead:true},{t:'fd[1]=4 · scriere'}],
                    cfds:[{t:'fd[0]=3 · citire',hot:true},{t:'fd[1] închis ✕',dead:true}],
                    bufer:'',sagR:true,msg:'read întoarce 5 octeți: „salut”'}),
       ce:'<code>read(fd[0], buf, 64)</code> scoate octeții din buffer, în ordinea scrierii (FIFO): copilul primește „salut”.',
       dece:'read pe pipe întoarce <b>ce există</b> (aici 5 octeți, deși s-au cerut 64) — nu așteaptă umplerea bufferului. Detaliu care apare în analizele de cod de la examen.'},
      {titlu:'close(fd[1]) în părinte → EOF la copil', linii:[11],
       svg:pipeSvg({pfds:[{t:'fd[0] închis ✕',dead:true},{t:'fd[1] închis ✕',dead:true}],
                    cfds:[{t:'fd[0]=3 · citire',hot:true},{t:'fd[1] închis ✕',dead:true}],
                    bufer:'',msg:'read() → 0 = EOF: „nu va mai veni nimic”',msgCls:'sv-fill-org'}),
       ce:'Când <b>ultimul</b> capăt de scriere se închide, următorul <code>read</code> pe pipe gol întoarce <b>0</b> (EOF) — copilul știe că s-a terminat transmisia.',
       dece:'Așa se termină curat orice consumator de pipe (inclusiv <code>cat | grep</code> din shell: grep primește EOF când cat își închide stdout-ul). Invers, scrierea într-un pipe fără cititori → semnalul <b>SIGPIPE</b>.'},
      {titlu:'schema cerută la examen', linii:[],
       svg:S.open(760,240)
         +S.node(40,40,180,54,'PĂRINTE','write(fd1[1]) · read(fd2[0])','acc')
         +S.node(540,40,180,54,'COPIL','read(fd1[0]) · write(fd2[1])','acc')
         +S.rect(280,36,200,28,'sv-n deep',9)+S.text(380,54,'pipe 1 →','xs mono grn','middle')
         +S.rect(280,72,200,28,'sv-n deep',9)+S.text(380,90,'← pipe 2','xs mono blu','middle')
         +S.line(220,50,280,50,'grn','grn')+S.line(480,50,540,50,'grn','grn')
         +S.line(280,86,220,86,'blu','blu')+S.line(540,86,480,86,'blu','blu')
         +S.text(380,140,'dialog bidirecțional = DOUĂ pipe-uri anonime','sm b acc','middle')
         +S.text(380,166,'fiecare proces închide capetele pe care nu le folosește','xs mut','middle')
         +S.text(380,190,'(cu un singur pipe, un proces și-ar putea citi propriul mesaj)','xs mut','middle')
         +S.close,
       ce:'Subiectul din 2019 cerea „schimbul de mesaje între 2 procese cu o <b>pereche</b> de pipe-uri anonime + o schemă”: pipe 1 pentru părinte→copil, pipe 2 pentru copil→părinte.',
       dece:'Cu un singur pipe, ambele procese ar citi din același buffer și un proces și-ar putea „fura” propriul mesaj. Două canale unidirecționale = protocol curat. Aceasta e schema de desenat pe foaie.'}
    ]
  };
}

PSO.register({
  id:'fd', cat:'fisiere', icon:'🗂️',
  titlu:'Descriptori de fișiere & pipe',
  scurt:'Cele 3 tabele (fd → fișiere deschise → inode), dup2/redirectări, cursorul partajat la fork și pipe-ul din 2019.',
  desc:'Ce se întâmplă de fapt la <code>open / dup2 / fork / pipe</code>: cele <b>trei tabele</b> pe care stă întregul I/O UNIX, animate apel cu apel — unde stă cursorul, ce partajează fork-ul, cum funcționează <code>prog &gt; out.txt</code> și schema completă de pipe cerută la examen.',
  ani:[2004,2014,2016,2019],
  nota:'În <b>2019</b>: „schimb de mesaje între 2 procese cu o pereche de pipe-uri anonime — explicați printr-o schemă și scrieți aplicația C”. În <b>2016</b>: „fork, dup, execve”. În <b>2004</b>: structura pipe și apelurile aferente + In-core Inode.',
  scenarii:[
    {id:'open',  nume:'open & cele 3 tabele',  build:scOpen},
    {id:'dup',   nume:'dup2 & redirectarea',   build:scDup},
    {id:'forkfd',nume:'fork & cursorul comun', build:scForkFd},
    {id:'pipe',  nume:'pipe (subiect 2019)',   build:scPipe}
  ]
});
})();
