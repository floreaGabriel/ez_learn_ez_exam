// ============================================================
//  CONCEPTE PSO — conținut extins din cursurile PSO (ATM)
//  cursul 3 (procese), 7 (fire), 8 (sincronizare), 4.1 (planificare)
// ============================================================

const CONCEPTE = [
// ------------------------------------------------------------
{
  id:"intro", cat:"Sistem de operare",
  titlu:"Sistemul de operare — kernel, moduri, apeluri de sistem",
  rezumat:"Ce e un SO, kernel vs user mode, system calls, întreruperi, monolitic vs microkernel.",
  html:`
<h2>Ce este un sistem de operare</h2>
<p>Un <b>sistem de operare (SO)</b> este un set de programe care <b>mediază</b> între aplicații și hardware. Strict tehnic, <b>nucleul (kernel-ul) este sistemul de operare</b>.</p>
<table class="tbl">
<tr><th>Vedere</th><th>SO este…</th></tr>
<tr><td><b>top-down</b></td><td>o <b>extensie a mașinii fizice</b> — oferă o mașină abstractă, ușor de programat</td></tr>
<tr><td><b>bottom-up</b></td><td>un <b>gestionar al resurselor</b> — împarte CPU, RAM, I/O între procese</td></tr>
</table>
<p>Rolul SO se rezumă la <b>MEDIERE = Portabilitate + Multiplexare + Securitate</b>.</p>

<h2>Kernel space vs User space</h2>
<p>Arhitectura software e stratificată. Granița dintre <b>user space</b> și <b>kernel space</b> e exact la nivelul <b>apelurilor de sistem (syscall API)</b>:</p>
${svgKernel()}

<table class="tbl">
<tr><th></th><th>User mode</th><th>Kernel mode</th></tr>
<tr><td><b>Privilegiu</b></td><td>redus, acces restricționat</td><td>complet (HW, memorie, I/O)</td></tr>
<tr><td><b>Acces</b></td><td>doar spațiul propriu de memorie</td><td>tot sistemul</td></tr>
<tr><td><b>La eroare</b></td><td>cade doar acel program</td><td>poate compromite tot sistemul</td></tr>
<tr><td><b>Cum se obține</b></td><td>revenire din apel de sistem</td><td>apel de sistem / trap / întrerupere</td></tr>
</table>
<p>Tehnic, comutarea înseamnă schimbarea nivelului de privilegiu al procesorului — de la <b>Ring 3</b> (user) la <b>Ring 0</b> (kernel), gestionat prin <b>mode bit / CPL</b>.</p>

<h2>Apeluri de sistem (system calls)</h2>
<p>Interfața <b>controlată</b> prin care aplicațiile cer servicii SO-ului (I/O, alocare memorie, creare procese). Programele din user-space <b>nu pot</b> accesa direct hardware-ul.</p>
<pre class="code">fwrite()  ->  write()  ->  [ syscall API / trap ]  ->  sys_write()  ->  kernel</pre>
<p>Fluxul unui apel de sistem: cod user → funcție de bibliotecă → instrucțiunea <b>trap/syscall</b> (ex. <code>INT 0x80</code> pe x86) → CPU trece în kernel mode → kernelul execută → revine în user mode cu rezultatul. Are <b>overhead</b> (salvare/restaurare regiștri, invalidare TLB/pipeline).</p>

<h2>Monolitic vs Microkernel</h2>
<table class="tbl">
<tr><th></th><th>Monolitic</th><th>Microkernel</th></tr>
<tr><td><b>Ce e în kernel</b></td><td>tot (VFS, FS, scheduler, drivere, VM)</td><td>doar IPC, memorie virtuală, planificare</td></tr>
<tr><td><b>Restul</b></td><td>—</td><td>servere în user mode (FS, drivere)</td></tr>
<tr><td><b>Performanță</b></td><td>eficient (cod coeziv)</td><td>mai lent (comunicare prin IPC)</td></tr>
<tr><td><b>TCB / securitate</b></td><td>TCB mare → suprafață de atac mare</td><td>TCB redus → mai sigur, modular</td></tr>
</table>
<p class="muted">Exemple: Linux, WindowsNT = monolitice (cu module); arhitecturi tip microkernel = MINIX. macOS/iOS = XNU (hibrid).</p>

<div class="tip"><b>La examen:</b> reține granița <b>user/kernel = syscall API</b>, faptul că o eroare în user mode cade doar acel proces (izolare), iar în kernel mode poate pica tot sistemul, și diferența monolitic (TCB mare) vs microkernel (TCB mic).</div>
`
},
// ------------------------------------------------------------
{
  id:"procese", cat:"Procese",
  titlu:"Procese — definiție, PCB, ciclu de viață",
  rezumat:"Ce este un proces, ce conține PCB-ul, cum se naște și moare un proces.",
  html:`
<h2>Ce este un proces</h2>
<p>Un <b>proces</b> este o instanță a unui program <b>în execuție</b>. Atenție la distincție: <b>programul</b> este un fișier pasiv pe disc (cod + date inițiale), iar <b>procesul</b> este entitatea activă care rulează, cu propriul spațiu de memorie, regiștri, stivă și resurse. Din același program pot exista <b>mai multe procese</b> simultan (ex. două ferestre de terminal).</p>
<p>Rolul proceselor este de a permite <b>partajarea resurselor</b> sistemului între utilizatori și aplicații, asigurând trei proprietăți esențiale:</p>
<ul>
<li><b>Izolare</b> — un proces nu poate accesa memoria, fișierele sau socket-urile altui proces.</li>
<li><b>Securitate</b> — fiecare proces rulează cu anumite privilegii.</li>
<li><b>Echitate</b> — planificatorul împarte corect timpul de procesor.</li>
</ul>

<div class="callout">
<b>Cum multiplexează SO resursele:</b>
<ul>
<li><b>CPU</b> → multiplexare în timp (planificare, schimbări de context)</li>
<li><b>Memorie</b> → fiecare proces are un <b>spațiu de adrese virtual</b> izolat</li>
<li><b>I/O</b> → cozi de așteptare, accesate prin <b>descriptori de fișier</b></li>
</ul>
</div>

<h3>Tabela de descriptori de fișier</h3>
<p>Fiecare proces are o tabelă proprie de descriptori — un vector de pointeri către fișiere/socket-uri/dispozitive deschise. Descriptorii standard, deschiși automat:</p>
<table class="tbl">
<tr><th>Descriptor</th><th>Nume</th><th>Folosire</th></tr>
<tr><td>0</td><td><code>stdin</code></td><td>intrare standard (tastatură)</td></tr>
<tr><td>1</td><td><code>stdout</code></td><td>ieșire standard (ecran)</td></tr>
<tr><td>2</td><td><code>stderr</code></td><td>ieșire de erori</td></tr>
<tr><td>3, 4, …</td><td>—</td><td>fișiere/socket-uri deschise ulterior</td></tr>
</table>

<h2>PCB — Process Control Block</h2>
<p>La nivelul SO, un proces este reprezentat printr-o <b>structură de date</b> numită <b>PCB</b> (în Linux: <code>task_struct</code>). Toate PCB-urile formează <b>tabela de procese</b>, indexată după PID. PCB-ul este <b>alocat la creare</b> și <b>eliberat</b> abia după ce procesul părinte preia statusul de terminare al copilului.</p>

${svgPCB()}

<p>Conținutul tipic al unui PCB (vizibil parțial cu <code>ps -ef</code>):</p>
<ul>
<li><b>PID</b> (process identifier) + <b>PPID</b> (parent PID)</li>
<li><b>starea</b> procesului — new, ready, running, waiting, terminated</li>
<li><b>Program Counter</b> și conținutul <b>regiștrilor</b> CPU (contextul)</li>
<li>informații de <b>planificare</b> — cuanta de timp, prioritate, afinitate de procesor</li>
<li>utilizator, grup, <b>privilegii</b></li>
<li>info IPC — semnale, cozi de mesaje, fișiere deschise</li>
<li>pointeri către resurse — tabela de pagini, segmente de memorie alocate</li>
<li>informații de contabilizare a resurselor consumate</li>
</ul>

<h2>Tipuri de procese</h2>
<table class="tbl">
<tr><th>Tip</th><th>Caracteristică</th><th>Exemplu</th></tr>
<tr><td><b>CPU bound</b></td><td>rulează des pe procesor (calcule intense)</td><td>compresie, randare</td></tr>
<tr><td><b>I/O bound</b></td><td>se blochează des pe I/O, rulează rar</td><td>shell, browser</td></tr>
<tr><td><b>Interactiv (foreground)</b></td><td>interacționează cu utilizatorul</td><td>editor de text</td></tr>
<tr><td><b>Neinteractiv (batch/daemon)</b></td><td>rulează în fundal, fără interacțiune</td><td>servicii, cron</td></tr>
</table>

<h2>Ierarhia de procese</h2>
<p>Un proces poate avea <b>mai mulți copii</b>, dar <b>un singur părinte</b>. În Unix, procesul <b>init</b> (PID 1) este în vârful ierarhiei — creat la boot, el pornește restul proceselor de sistem. Vizualizare: comanda <code>pstree</code>.</p>

<h2>Terminarea execuției</h2>
<table class="tbl">
<tr><th>Încheiere (decizia procesului)</th><th>Terminare (decizia SO)</th></tr>
<tr><td>a ajuns la finalul programului</td><td>la cererea altui proces (<code>kill</code>)</td></tr>
<tr><td>a apelat <code>exit()</code></td><td>operație nevalidă (segmentation fault)</td></tr>
<tr><td colspan="2">În ambele cazuri SO trimite un <b>semnal</b> (Unix) sau o <b>excepție</b> (Windows).</td></tr>
</table>
<p>Apelul intern <code>do_exit()</code> eliberează memoria, descriptorii și scoate procesul din cozile de așteptare, apoi trimite <b>SIGCHLD</b> părintelui. Până ce părintele preia statusul, procesul rămâne în starea <b>zombie</b> (ocupă doar <code>task_struct</code> + PID).</p>

<div class="tip"><b>La examen:</b> reține tripleta <code>fork()</code> → <code>exec()</code> → <code>wait()</code> (crearea, încărcarea unui nou program, sincronizarea), plus distincția orfan vs zombie — sunt printre cele mai întâlnite subiecte.</div>
`
},
// ------------------------------------------------------------
{
  id:"stari", cat:"Procese",
  titlu:"Stările unui proces & schimbarea de context",
  rezumat:"new, ready, running, waiting, terminated — tranziții, context switch, overhead.",
  html:`
<h2>Cele 5 stări</h2>
<table class="tbl">
<tr><th>Stare</th><th>Semnificație</th></tr>
<tr><td><b>new</b></td><td>procesul tocmai a fost creat, nu e încă admis în coada de ready</td></tr>
<tr><td><b>ready</b> (gata)</td><td>poate rula, dar așteaptă să se elibereze un procesor</td></tr>
<tr><td><b>running</b> (rulare)</td><td>rulează efectiv pe un procesor</td></tr>
<tr><td><b>waiting / blocked</b></td><td>a făcut o operație blocantă (I/O, <code>wait</code>, <code>sleep</code>) și nu poate rula</td></tr>
<tr><td><b>terminated</b></td><td>și-a încheiat execuția</td></tr>
</table>

<h2>Diagrama de tranziții</h2>
<figure class="diagram"><img src="assets/stari-proces.png" alt="Stările unui proces" style="max-width:100%"><figcaption class="muted" style="margin-top:8px">Sursă editabilă: <code>diagrams/stari-proces.drawio</code></figcaption></figure>

<p>Tranzițiile esențiale și ce le declanșează:</p>
<table class="tbl">
<tr><th>Tranziție</th><th>Cauză</th></tr>
<tr><td><b>new → ready</b></td><td><i>admitted</i> — procesul e admis în sistem</td></tr>
<tr><td><b>ready → running</b></td><td><i>scheduler dispatch</i> — s-a eliberat un procesor și procesul e primul în coadă</td></tr>
<tr><td><b>running → ready</b></td><td><i>interrupt</i> — i-a expirat cuanta SAU a apărut un proces mai prioritar</td></tr>
<tr><td><b>running → waiting</b></td><td>operație <b>blocantă</b>: <code>read</code>, <code>write</code>, <code>wait</code>, <code>sleep</code></td></tr>
<tr><td><b>waiting → ready</b></td><td>evenimentul așteptat s-a produs (I/O completion, semnal)</td></tr>
<tr><td><b>running → terminated</b></td><td><code>exit</code> sau terminare forțată</td></tr>
</table>
<div class="warn"><b>Atenție:</b> nu există tranziția <b>waiting → running</b> directă! Un proces deblocat trece întâi prin <b>ready</b> și abia apoi e planificat pe procesor.</div>

<h2>Schimbarea de context (context switch)</h2>
<p>Operația prin care procesorul trece de la un proces la altul:</p>
<ol>
<li>se <b>salvează</b> contextul procesului curent (regiștri, PC) în PCB-ul lui;</li>
<li>se <b>încarcă</b> contextul noului proces din PCB-ul său;</li>
<li>se comută în user-mode și se face salt la noul Program Counter.</li>
</ol>

<div class="callout">
<b>Context switch = overhead (timp pierdut)!</b>
<ul>
<li>mai multe schimbări de context → mai mult overhead, dar <b>interactivitate</b> mai bună</li>
<li>mai puține schimbări de context → mai puțin overhead, dar interactivitate redusă</li>
</ul>
Acesta e compromisul fundamental pe care îl reglează <b>cuanta</b> de timp (vezi Planificare).
</div>

<h2>Multitasking</h2>
<p>SO comută rapid procesele pe procesoare. După expirarea <b>cuantei</b> (time slice, de ordinul milisecundelor), procesul curent e scos de pe procesor. Comutarea atât de rapidă dă <b>impresia</b> de execuție simultană, deși pe un singur nucleu rulează un singur proces la un moment dat.</p>

<div class="tip"><b>La examen (2023 I.5):</b> ca să garantezi o schimbare de context, caută o operație <b>blocantă</b> — de ex. <code>sleep()</code> duce procesul în <b>blocked</b> și cedează CPU-ul. Fără operații blocante, pe un singur nucleu fără preempțiune, ai putea avea <b>zero</b> schimbări de context.</div>
`
},
// ------------------------------------------------------------
{
  id:"fork", cat:"Procese",
  titlu:"fork() — crearea proceselor",
  rezumat:"Ce returnează fork(), cum se dublează procesul, fork bomb, Copy-On-Write.",
  html:`
<h2>Apelul fork()</h2>
<p><code>fork()</code> creează un proces nou (<b>copil</b>) care este o <b>clonă aproape identică</b> a părintelui: primește <b>duplicate</b> ale codului, datelor, stivei, heap-ului și descriptorilor de fișier. După apel, <b>ambele</b> procese continuă execuția <b>din același punct</b> (linia de după <code>fork()</code>), independent, concurând pentru resurse.</p>

${svgFork()}

<h2>Ce returnează fork()</h2>
<p>Esența: <code>fork()</code> <b>returnează de două ori</b> — o dată în părinte, o dată în copil — cu valori diferite, ca să poți distinge cine ești:</p>
<table class="tbl">
<tr><th>Valoare returnată</th><th>Unde</th><th>Semnificație</th></tr>
<tr><td><code>0</code></td><td>în <b>copil</b></td><td>fork a reușit, ești copilul</td></tr>
<tr><td><code>&gt; 0</code> (PID copil)</td><td>în <b>părinte</b></td><td>fork a reușit, ai primit PID-ul copilului</td></tr>
<tr><td><code>&lt; 0</code> (-1)</td><td>în <b>părinte</b></td><td>eroare (copilul NU a fost creat; ex. limită de procese)</td></tr>
</table>

<pre class="code" data-lang="c">pid_t pid = fork();
if (pid &lt; 0) {
    perror("fork");              // EROARE
} else if (pid == 0) {
    printf("Sunt copilul, PID=%d, parinte=%d\n", getpid(), getppid());
} else {
    printf("Sunt parintele, copilul are PID=%d\n", pid);
}</pre>

<div class="warn"><b>Capcană:</b> după <code>fork()</code>, <b>nu se știe cine rulează primul</b> — părintele sau copilul. Ordinea depinde de planificator și nu este deterministă.</div>

<h2>Variabilele sunt copiate, nu partajate</h2>
<p>Copilul primește o <b>copie</b> a memoriei părintelui. Modificările făcute de copil <b>nu</b> se văd în părinte și invers — au spații de adrese separate.</p>
<pre class="code" data-lang="c">int x = 5;
if (fork() == 0) {
    x = 100;                     // doar in copil
    printf("copil: x=%d\n", x);  // 100
} else {
    wait(NULL);
    printf("parinte: x=%d\n", x);// 5 (neschimbat!)
}</pre>
<p class="muted">Acesta e exact mecanismul testat în examenul 2022 (P1): copilul face <code>i=i+2</code> doar în copia lui.</p>

<h2>"fork bomb" — creștere exponențială</h2>
<p>Dacă <b>toate</b> procesele forkează în buclă (fără gardă), numărul lor se dublează la fiecare iterație:</p>
<pre class="code" data-lang="c">for (i = 0; i &lt; 3; i++) {
    fork();        // si copiii forkeaza la urmatoarea iteratie
}</pre>
<p>Evoluția numărului de procese: 1 → 2 → 4 → 8. Deci <b>2³ = 8 procese</b> în total → <b>7 copii</b>. Cu o gardă <code>if(pid&gt;0)</code> (doar părintele forkează) → exact <b>3 copii</b>.</p>
<table class="tbl">
<tr><th>Iterație</th><th>Procese existente care forkează</th><th>Total după</th></tr>
<tr><td>start</td><td>—</td><td>1</td></tr>
<tr><td>i=0</td><td>1</td><td>2</td></tr>
<tr><td>i=1</td><td>2</td><td>4</td></tr>
<tr><td>i=2</td><td>4</td><td>8</td></tr>
</table>

<h2>Copy-On-Write (COW)</h2>
<p>Duplicarea totală a memoriei la fiecare <code>fork()</code> ar fi ineficientă, mai ales dacă urmează imediat un <code>exec()</code> (care oricum rescrie tot). Soluția: <b>Copy-On-Write</b>.</p>
<ul>
<li>La <code>fork()</code>, părintele și copilul <b>partajează</b> aceleași pagini fizice, marcate <b>read-only</b>.</li>
<li>Pagina se <b>copiază efectiv abia când unul dintre procese încearcă să scrie</b> în ea.</li>
<li>Dacă urmează <code>exec()</code>, paginile nici nu se mai copiază — se alocă altele pentru noul program.</li>
</ul>

<div class="tip"><b>Implementare Linux:</b> <code>fork()</code>, <code>vfork()</code> și <code>clone()</code> ajung toate la apelul de sistem <code>do_fork()</code> → <code>copy_process()</code>, care duplică <code>task_struct</code>, alocă un PID nou (<code>alloc_pid()</code>) și, în funcție de parametri, copiază sau partajează resursele.</div>
`
},
// ------------------------------------------------------------
{
  id:"exec-wait", cat:"Procese",
  titlu:"exec(), wait() și orfan vs zombie",
  rezumat:"Încărcarea unui nou program, sincronizarea cu copilul, procese orfane/zombie.",
  html:`
<h2>exec() — încărcarea unui nou program</h2>
<p>Familia <code>exec</code> (<code>execl</code>, <code>execv</code>, <code>execlp</code>, <code>execvp</code>…) <b>înlocuiește complet imaginea</b> procesului curent (cod, date, heap, stivă) cu un nou executabil. Dacă reușește, <b>nu mai returnează</b> — codul de după <code>exec</code> nu se mai execută niciodată.</p>

<pre class="code" data-lang="c">pid = fork();
if (pid == 0) {                       // COPIL
    execl("/bin/ls", "ls", "-l", NULL);
    perror("execl");                  // se executa DOAR daca exec a esuat
    printf("nu se afiseaza\n");       // linie moarta daca exec reuseste
} else {                              // PARINTE
    wait(&amp;status);
}</pre>

<table class="tbl">
<tr><th>Variantă</th><th>Mnemonic</th><th>Argumente</th></tr>
<tr><td><code>execl</code></td><td><b>l</b> = list</td><td>argumente ca listă: <code>execl(cale, arg0, arg1, NULL)</code></td></tr>
<tr><td><code>execv</code></td><td><b>v</b> = vector</td><td>argumente ca vector: <code>execv(cale, argv)</code></td></tr>
<tr><td><code>execlp</code>/<code>execvp</code></td><td><b>p</b> = PATH</td><td>caută executabilul în variabila PATH</td></tr>
</table>

<div class="callout"><b>De ce fork + exec separat?</b> Pentru că între ele copilul își poate face <b>configurări proprii</b> (redirectări cu <code>dup2</code>, închidere de descriptori) <b>fără a afecta părintele</b>. Așa funcționează un <b>shell</b>: face <code>fork()</code>, copilul configurează I/O și apoi <code>exec()</code> comanda, iar părintele (shell-ul) face <code>wait()</code>.</div>

<h3>Studiu de caz: redirectarea ieșirii (dup2)</h3>
<pre class="code" data-lang="c">if (fork() == 0) {
    int fd = open("a.txt", O_WRONLY|O_CREAT|O_TRUNC, 0644);
    dup2(fd, STDOUT_FILENO);           // stdout -&gt; fisier
    execl("/bin/ls", "ls", NULL);      // iesirea lui ls merge in a.txt
}</pre>

<h2>wait() — așteptarea copilului</h2>
<p><code>wait(&amp;status)</code> este un <b>apel blocant</b>: părintele se oprește până când <b>un</b> copil se termină. Părintele se deblochează la primirea semnalului <b>SIGCHLD</b>. <code>status</code> conține codul de ieșire al copilului (în shell: variabila <code>$?</code>).</p>
<ul>
<li><code>wait(&amp;status)</code> — așteaptă <b>orice</b> copil.</li>
<li><code>waitpid(pid, &amp;status, 0)</code> — așteaptă un <b>anumit</b> copil.</li>
</ul>
<div class="warn"><b>Important:</b> dacă părintele a creat <b>N copii</b>, trebuie să facă <b>N apeluri</b> <code>wait()</code> ca să-i „culeagă" pe toți (altfel rămân zombie). Vezi examenul 2024 cu dublu <code>wait(NULL)</code>.</div>

<h2>Orfan vs Zombie — capcana clasică</h2>
${svgOrphanZombie()}

<table class="tbl">
<tr><th></th><th>Proces ORFAN</th><th>Proces ZOMBIE</th></tr>
<tr><td><b>Cauză</b></td><td>părintele s-a terminat <b>înaintea</b> copilului</td><td>copilul s-a terminat, dar părintele <b>nu a făcut wait()</b></td></tr>
<tr><td><b>Ce se întâmplă</b></td><td>copilul e <b>adoptat de init</b> (PID 1) → <code>getppid()</code> devine 1</td><td>rămân info reziduale (<code>task_struct</code> + PID) pentru părinte</td></tr>
<tr><td><b>Stare</b></td><td>rulează normal, doar și-a schimbat părintele</td><td>terminat, dar „nemort" — ocupă o intrare în tabela de procese</td></tr>
<tr><td><b>Problemă</b></td><td>niciuna gravă (init face cleanup automat)</td><td>dacă persistă, ocupă resurse degeaba</td></tr>
</table>
<p class="muted">Dacă un proces zombie rămâne și orfan (părintele moare fără să-l aștepte), e adoptat de init, care face <code>wait()</code> și îl curăță.</p>

<div class="tip"><b>La examen (2023 I.5):</b> dacă în copil ai <code>sleep(10)</code> și părintele iese repede, copilul devine <b>orfan</b> → la <code>getppid()</code> primește <b>1</b>, NU PID-ul părintelui mort. NU e zombie (zombie ar fi invers: copilul moare primul, părintele nu-l așteaptă).</div>
`
},
// ------------------------------------------------------------
{
  id:"memorie", cat:"Memorie",
  titlu:"Zonele de memorie ale unui proces",
  rezumat:"text, rodata, data, bss, heap, stack — unde merge fiecare variabilă și ce permisiuni are.",
  html:`
<h2>Spațiul de adrese virtual</h2>
<p>Fiecare proces are un <b>spațiu de adrese virtual</b> propriu, care îi dă impresia că folosește singur toată memoria. SO și hardware-ul (MMU) traduc adresele virtuale în adrese fizice și asigură <b>izolarea</b>. Iată zonele, de la adrese mari spre adrese mici:</p>

<figure class="diagram"><img src="assets/zone-memorie.png" alt="Zonele de memorie ale unui proces" style="max-width:100%"><figcaption class="muted" style="margin-top:8px">Sursă editabilă: <code>diagrams/zone-memorie.drawio</code></figcaption></figure>

<h2>Regula de decizie — unde ajunge o variabilă</h2>
<div class="callout">
<b>Pasul 1: ce durată de viață are? (storage duration)</b>
<ul>
<li><b>automatică</b> (locală, fără <code>static</code>) → <b>STIVĂ (stack)</b></li>
<li><b>statică</b> (globală SAU locală cu <code>static</code>) → <b>.data / .bss / .rodata</b></li>
<li><b>dinamică</b> (<code>malloc</code>, <code>new</code>) → <b>HEAP</b></li>
</ul>
<b>Pasul 2 (doar pentru cele cu durată statică): e const? e inițializată ≠ 0?</b>
<ul>
<li><b>const</b> → <b>.rodata</b> (read-only)</li>
<li>inițializată cu valoare <b>≠ 0</b> → <b>.data</b></li>
<li><b>= 0</b> sau neinițializată → <b>.bss</b></li>
</ul>
</div>

<h2>Permisiuni (protecția paginilor)</h2>
<table class="tbl">
<tr><th>Zonă</th><th>R</th><th>W</th><th>X</th><th>Conține</th></tr>
<tr><td>.text</td><td>✓</td><td>✗</td><td>✓</td><td>cod executabil</td></tr>
<tr><td>.rodata</td><td>✓</td><td>✗</td><td>✗</td><td>const globale, literali string</td></tr>
<tr><td>.data</td><td>✓</td><td>✓</td><td>✗</td><td>globale/statice inițializate ≠ 0</td></tr>
<tr><td>.bss</td><td>✓</td><td>✓</td><td>✗</td><td>globale/statice = 0 / neinițializate</td></tr>
<tr><td>heap</td><td>✓</td><td>✓</td><td>✗</td><td>alocări dinamice (<code>malloc</code>)</td></tr>
<tr><td>stack</td><td>✓</td><td>✓</td><td>✗</td><td>variabile locale, parametri, adrese de retur</td></tr>
</table>
<p><b>W^X (write XOR execute):</b> o pagină e ori scriabilă, ori executabilă, niciodată ambele — protecție împotriva injectării de cod. De-asta <code>.text</code> e read-only, iar datele non-executabile.</p>

<h2>Exemplu complet adnotat</h2>
<pre class="code" data-lang="c">int a = 4;            // .data  (global init != 0)
int contor;           // .bss   (global = 0 implicit)
const int LIM = 100;  // .rodata (global const)

int main() {
    char c[100];          // stiva (local)
    const int d = 31;     // stiva (local, desi const!)
    static int e = 19;    // .data (static init != 0)
    static int z;         // .bss  (static = 0)
    char *p = malloc(50); // p -&gt; stiva ; cei 50 octeti -&gt; heap
    printf("%s", c);      // "%s" literal -&gt; .rodata
}</pre>

<h2>Capcane frecvente (examen 2023 I.3)</h2>
<table class="tbl">
<tr><th>Element</th><th>Zonă</th><th>De ce</th></tr>
<tr><td><code>const int d</code> (local)</td><td><b>stivă</b></td><td>local → stivă, chiar dacă e const (const e impus de compilator, nu de hardware)</td></tr>
<tr><td><code>static int e=19</code></td><td><b>.data</b></td><td>static → durată statică, init ≠0 → .data</td></tr>
<tr><td>literal <code>"%s"</code></td><td><b>.rodata</b></td><td>literalii sunt read-only → scrierea în ei dă segfault</td></tr>
<tr><td><code>p</code> de la malloc</td><td><b>stivă</b></td><td>pointerul e local; doar zona alocată e pe heap</td></tr>
</table>

<div class="tip"><b>Memotehnic:</b> întâi <b>durata</b> (stack / static / heap), apoi — doar pentru static — <b>const?</b> și <b>init ≠ 0?</b>. Cu aceste 2 întrebări răspunzi corect la orice variantă.</div>
`
},
// ------------------------------------------------------------
{
  id:"gestiune-memorie", cat:"Memorie",
  titlu:"Gestiunea memoriei — paginare & segmentare",
  rezumat:"Adrese logice/fizice, MMU, fragmentare, first/best/worst-fit, segmentare, paginare.",
  html:`
<h2>Adrese logice (virtuale) vs fizice</h2>
<p>Procesorul generează <b>adrese logice (virtuale)</b>; unitatea de memorie folosește <b>adrese fizice</b>. Traducerea logic → fizic se face la <b>run-time</b> de către <b>MMU (Memory Management Unit)</b>. Programele din user-space lucrează <b>doar cu adrese virtuale</b>.</p>
<div class="callout"><b>Magistrala de adrese:</b> cu o magistrală de N biți se pot accesa maxim <b>2<sup>N</sup> octeți</b>. Ex: 32 biți → 4 GB spațiu adresabil.</div>

<h3>Exemplu: relocation register (MMU simplu)</h3>
<pre class="code">adresă logică = 346,  relocation register = 14000
adresă fizică = 14000 + 346 = 14346</pre>

<h2>Protecția cu base & limit</h2>
<p>Fiecare proces are o zonă contiguă delimitată de doi regiștri: <b>base</b> (adresa de start) și <b>limit</b> (dimensiunea). Verificarea fiecărui acces:</p>
<pre class="code">if (base &lt;= adresa &lt; base + limit)  -&gt; acces permis
else                                -&gt; trap to OS (addressing error)</pre>

<h2>Fragmentarea</h2>
<table class="tbl">
<tr><th>Tip</th><th>Descriere</th><th>Apare la</th></tr>
<tr><td><b>Externă</b></td><td>spațiu liber <b>între</b> blocuri alocate — există loc, dar nu e contiguu</td><td>alocare contiguă, segmentare</td></tr>
<tr><td><b>Internă</b></td><td>spațiu nefolosit <b>în interiorul</b> blocului alocat</td><td>paginare (~1/2 pagină în medie)</td></tr>
</table>

<h3>Algoritmi de alocare (partiții variabile)</h3>
<table class="tbl">
<tr><th>Algoritm</th><th>Alege…</th></tr>
<tr><td><b>first-fit</b></td><td>primul bloc liber suficient de mare (cel mai rapid)</td></tr>
<tr><td><b>best-fit</b></td><td>cel mai mic bloc suficient de mare (bun pt spațiu)</td></tr>
<tr><td><b>worst-fit</b></td><td>cel mai mare bloc (cel mai slab)</td></tr>
</table>
<p class="muted">first-fit și best-fit &gt; worst-fit; first-fit e cel mai rapid.</p>

<h2>Segmentare</h2>
<p>Memoria virtuală e împărțită în <b>segmente</b> de dimensiune <b>variabilă</b> (cod, date, heap, stivă), fiecare cu <b>bază</b> și <b>limită</b>. Adresa = <code>&lt;segment, offset&gt;</code>.</p>
${svgSegment()}
<pre class="code">// Traducere: segment s, offset d ; segment table[s] = (limit, base)
if (d &lt; limit)  -&gt; adresa fizică = base + d
else            -&gt; trap (addressing error)
// Ex: segment 2 (limit=400, base=4300), offset=53 -&gt; 4300+53 = 4353</pre>
<p><b>Dezavantaj:</b> segmentele variabile → <b>fragmentare externă</b>, swap dificil.</p>

<h2>Paginare</h2>
<p>Memoria e împărțită în unități de <b>dimensiune fixă</b> (în general <b>4 KB</b>): <b>pagini</b> virtuale (pages) și <b>cadre</b> fizice (frames). Tabela de pagini (una per proces) mapează pagini → cadre. <b>Alocare fizică non-contiguă</b> → fără fragmentare externă, dar cu fragmentare internă.</p>

${svgPaging()}

<h3>Traducerea adresei: page number + offset</h3>
<p>O adresă logică = <code>(p, d)</code>: <b>p</b> = numărul paginii (index în tabelă), <b>d</b> = offset în pagină. Tabela dă cadrul <b>f</b> → adresa fizică = <code>(f, d)</code>.</p>
<div class="callout">
<b>Dimensiunea paginii din biții de offset:</b> dacă offset-ul e pe <b>n</b> biți → pagina are <b>2<sup>n</sup></b> octeți.<br>
Ex: offset pe 12 biți (IA-32) → pagină de 2<sup>12</sup> = <b>4 KB</b>.
</div>
<pre class="code">// Adresa pe m biti, pagina de 2^n octeti:
page number = m - n biti (superiori)
page offset = n biti (inferiori)</pre>

<h3>Dimensiunea tabelei de pagini</h3>
<pre class="code">Spatiu 32 biti, pagina 4 KB (12 biti offset):
nr. intrari = 2^32 / 2^12 = 2^20 = ~1 milion
×4 octeti/intrare = 4 MB doar pentru tabela!
Solutie: paginare IERARHICA (p1=10 | p2=10 | d=12 biti)</pre>

<h2>TLB (Translation Lookaside Buffer)</h2>
<p>Paginarea cere <b>2 accese</b> la memorie (tabela de pagini + datele). Soluția: <b>TLB</b> = cache hardware rapid și mic (zeci–mii de intrări) pentru cele mai recente traduceri pagină→cadru.</p>
<ul>
<li><b>TLB hit</b> → obții direct cadrul (rapid)</li>
<li><b>TLB miss</b> → cauți în tabela de pagini din memorie (lent)</li>
<li>la schimbarea de context se face <b>flush</b> pe TLB (mai puțin partea de kernel)</li>
</ul>

<div class="tip"><b>La examen:</b> exersează (1) traducerea adresei cu relocation register, (2) calculul dimensiunii paginii din biții de offset, (3) traducerea cu segment table (base+offset dacă offset&lt;limit), (4) first-fit pe o listă de blocuri.</div>
`
},
// ------------------------------------------------------------
{
  id:"memorie-virtuala", cat:"Memorie",
  titlu:"Memoria virtuală — demand paging, page fault",
  rezumat:"Demand paging, page fault (minor/major), Copy-on-Write, swap, înlocuire pagini, thrashing.",
  html:`
<h2>De ce memorie virtuală</h2>
<p>Memoria virtuală decuplează spațiul de adrese al procesului de memoria fizică. Avantaje: fiecare proces are propriul spațiu izolat; se poate folosi <b>mai multă memorie decât există fizic</b>; mai puține operații I/O la încărcare; programatorul nu gestionează memoria fizică (o face MMU/SO).</p>

<h2>Demand paging (paginare la cerere)</h2>
<p>În loc să încarci tot programul la lansare, încarci doar un <b>set minim</b> de pagini, iar restul <b>la nevoie</b> (lazy). O alocare cu <code>mmap</code> alocă doar pagini <b>virtuale</b>; cadrele fizice se alocă <b>abia la primul acces</b>, în <b>page fault handler</b>.</p>

<h2>Page fault</h2>
<p>Când un proces accesează o pagină care nu e mapată în memoria fizică, MMU generează o <b>excepție (page fault)</b>, iar SO rulează <b>page-fault handler-ul</b>.</p>
${svgPageFault()}
<table class="tbl">
<tr><th>Tip</th><th>Situație</th><th>Tratare</th></tr>
<tr><td><b>minor</b></td><td>cadrul e deja în memorie (bibliotecă/pagină partajată), lipsește doar maparea</td><td><b>rapidă</b> — doar se face maparea</td></tr>
<tr><td><b>major</b></td><td>pagina nu e în RAM, trebuie adusă de pe disc (swap/demand)</td><td><b>lentă</b> — acces la disc</td></tr>
</table>
<div class="warn"><b>Page fault ≠ Segmentation fault!</b> Page fault e o excepție <b>normală, tratabilă</b> (aduce pagina și reia instrucțiunea). <b>SIGSEGV</b> (segfault) e un acces <b>ilegal</b>: în afara zonelor alocate (gaură) sau fără permisiunea cerută (ex. scriere pe pagină read-only).</div>

<h2>Copy-on-Write (COW) la fork()</h2>
<p>La <code>fork()</code>, părintele și copilul <b>partajează</b> paginile, marcate <b>read-only</b>. La <b>prima scriere</b> se generează un page fault → se creează o <b>copie</b> a paginii (read-write) pentru cel care a scris, iar originalul rămâne read-only pentru celălalt. Astfel se evită copierea inutilă.</p>

<h2>Înlocuirea paginilor</h2>
<p>Când memoria fizică e plină și e nevoie de un cadru, se alege o <b>pagină-victimă</b> pe care o evacuezi (swap out). Biți auxiliari: <b>M (modified/dirty)</b> — pagina a fost scrisă, trebuie salvată pe disc; <b>R (referenced)</b> — pagina a fost accesată recent.</p>
<table class="tbl">
<tr><th>Algoritm</th><th>Idee</th></tr>
<tr><td><b>FIFO</b></td><td>înlocuiește cea mai veche pagină (prima intrată)</td></tr>
<tr><td><b>Second Chance</b></td><td>FIFO + bit R: dacă R=1, dă „a doua șansă" (R=0, mută la coadă); dacă R=0, o înlocuiește</td></tr>
<tr><td><b>LRU</b></td><td>înlocuiește pagina folosită cel mai demult (Least Recently Used)</td></tr>
<tr><td><b>Optimal (OPT)</b></td><td>înlocuiește pagina care va fi referită <b>cel mai târziu</b> (ideal teoretic)</td></tr>
</table>

<h3>Exemplu FIFO (3 cadre)</h3>
<pre class="code">Sir referinte: 1 2 3 4 1 2 5
[1]      -> fault (1)
[1 2]    -> fault (1 2)
[1 2 3]  -> fault (1 2 3)
[2 3 4]  -> fault, scot 1   (2 3 4)
[3 4 1]  -> fault, scot 2   (3 4 1)
[4 1 2]  -> fault, scot 3   (4 1 2)
[1 2 5]  -> fault, scot 4   (1 2 5)
Total: 7 page fault-uri</pre>

<h2>Thrashing</h2>
<p>Când sistemul e supraîncărcat, au loc <b>înlocuiri foarte frecvente</b> de pagini (swap in/out continuu). Procesorul petrece mai mult timp tratând page fault-uri decât executând cod util → <b>performanța se prăbușește</b>. Analog cu cache thrashing.</p>

<div class="tip"><b>La examen:</b> exersează simularea <b>FIFO</b> și <b>Second Chance</b> pe un șir de referințe (numără page fault-urile), și reține diferența <b>page fault</b> (normal, tratabil) vs <b>segfault</b> (ilegal).</div>
`
},
// ------------------------------------------------------------
{
  id:"fire", cat:"Fire de execuție",
  titlu:"Fire de execuție (threads) — proces vs thread",
  rezumat:"Ce se partajează, ce e privat, API-ul pthreads, avantaje/dezavantaje.",
  html:`
<h2>Ce este un fir de execuție</h2>
<p>Un <b>thread (fir de execuție)</b> = un flux de instrucțiuni care se execută secvențial <b>în interiorul unui proces</b>. Un proces poate avea unul sau mai multe fire care rulează în paralel și <b>partajează resursele</b> procesului. Inițial, orice proces are <b>un singur fir</b> (firul principal).</p>
<p>Firele sunt gestionate de kernel similar cu procesele (au un <i>thread control block</i>), sunt identificate prin <b>thread ID</b> și sunt <b>planificate individual</b>. În Linux, <code>getpid()</code> întoarce de fapt <b>TGID</b> (thread group ID), comun tuturor firelor procesului.</p>

<h2>Ce se partajează vs ce e privat</h2>
${svgThreads()}

<table class="tbl">
<tr><th>PARTAJAT (comun tuturor firelor)</th><th>PRIVAT (propriu fiecărui fir)</th></tr>
<tr><td>codul (.text)</td><td><b>stiva (stack)</b></td></tr>
<tr><td>variabilele globale (.data, .bss)</td><td>regiștrii</td></tr>
<tr><td>heap-ul</td><td>program counter</td></tr>
<tr><td>fișierele deschise</td><td>starea (running/ready/blocked)</td></tr>
<tr><td>spațiul de adrese</td><td>masca de semnale</td></tr>
<tr><td>lista și modul de tratare a semnalelor</td><td>Thread Local Storage (TLS)</td></tr>
</table>

<div class="callout"><b>Memotehnic:</b> <i>Procesele grupează resurse, firele abstractizează execuția.</i> Variabilele <b>locale</b> sunt sigure (fiecare fir are stiva lui); variabilele <b>globale</b> și heap-ul sunt periculoase (partajate → necesită sincronizare, altfel apar race conditions).</div>

<h2>API POSIX pthreads</h2>
<p>Header <code>#include &lt;pthread.h&gt;</code>, compilare cu <code>-lpthread</code>.</p>
<table class="tbl">
<tr><th>Funcție</th><th>Rol</th></tr>
<tr><td><code>pthread_create(&amp;tid, attr, func, arg)</code></td><td>creează un fir nou care execută <code>func(arg)</code></td></tr>
<tr><td><code>pthread_join(tid, &amp;ret)</code></td><td>așteaptă terminarea unui fir (ca <code>wait</code> pt procese)</td></tr>
<tr><td><code>pthread_exit(ret)</code></td><td>termină firul curent, returnând <code>ret</code></td></tr>
<tr><td><code>pthread_self()</code></td><td>întoarce ID-ul firului curent</td></tr>
<tr><td><code>pthread_cancel(tid)</code></td><td>termină forțat un alt fir</td></tr>
</table>

<pre class="code" data-lang="c">#include &lt;pthread.h&gt;

void *worker(void *arg) {
    long id = (long)arg;
    printf("firul %ld ruleaza\n", id);
    return NULL;
}

int main() {
    pthread_t t[3];
    for (long i = 0; i &lt; 3; i++)
        pthread_create(&amp;t[i], NULL, worker, (void *)i);
    for (int i = 0; i &lt; 3; i++)
        pthread_join(t[i], NULL);     // asteapta toate firele
    return 0;
}</pre>

<h2>Avantaje vs dezavantaje (fire vs procese)</h2>
<table class="tbl">
<tr><th>Avantaje fire</th><th>Dezavantaje fire</th></tr>
<tr><td>creare/distrugere mai rapidă decât procesele</td><td>dacă un fir crapă violent → cade <b>tot</b> procesul</td></tr>
<tr><td>schimbare de context mai ieftină</td><td>fără protecție implicită la datele partajate</td></tr>
<tr><td>partajare facilă de informație (memorie comună)</td><td>probleme de sincronizare (race conditions)</td></tr>
<tr><td>economie de resurse</td><td>prea multe fire scad performanța</td></tr>
</table>

<div class="tip"><b>Observații cheie pentru examen:</b>
<ul>
<li>Dacă un fir apelează <code>exit()</code> → se termină <b>TOATE</b> firele procesului. (Pentru a termina doar firul curent: <code>pthread_exit()</code>.)</li>
<li>Un <b>semnal</b> e tratat de <b>primul fir</b> care se execută.</li>
<li>La <code>exec()</code> dintr-un fir → se înlocuiește <b>tot</b> procesul (toate firele dispar).</li>
</ul>
</div>
`
},
// ------------------------------------------------------------
{
  id:"semnale", cat:"Semnale",
  titlu:"Semnale — signal(), SIGINT, handlere",
  rezumat:"Tratarea semnalelor, SIG_DFL/SIG_IGN, salvarea și restaurarea handlerelor.",
  html:`
<h2>Ce este un semnal</h2>
<p>Un <b>semnal</b> este o <b>notificare asincronă</b> trimisă unui proces de către SO sau de alt proces, pentru a-l anunța de un eveniment. La primirea unui semnal, procesul poate: să-l <b>ignore</b>, să ruleze acțiunea <b>implicită</b>, sau să ruleze un <b>handler</b> propriu.</p>

<table class="tbl">
<tr><th>Semnal</th><th>Sens</th><th>Acțiune implicită</th></tr>
<tr><td><code>SIGINT</code></td><td>întrerupere de la tastatură (<b>Ctrl+C</b>)</td><td>termină procesul</td></tr>
<tr><td><code>SIGTERM</code></td><td>cerere politicoasă de oprire</td><td>termină procesul</td></tr>
<tr><td><code>SIGKILL</code></td><td>oprire forțată</td><td>termină — <b>nu poate fi prins/ignorat</b></td></tr>
<tr><td><code>SIGSTOP</code></td><td>suspendare</td><td>oprește — <b>nu poate fi prins/ignorat</b></td></tr>
<tr><td><code>SIGCHLD</code></td><td>un copil s-a terminat</td><td>ignorat (dar deblochează <code>wait</code>)</td></tr>
<tr><td><code>SIGSEGV</code></td><td>acces nevalid la memorie</td><td>termină (segfault)</td></tr>
</table>

<h2>signal() — instalarea unei reacții</h2>
<p><code>signal(semnal, handler)</code> face <b>două</b> lucruri: (1) <b>setează</b> noul handler pentru semnal și (2) <b>returnează handlerul anterior</b>. Tocmai de aceea poți <b>salva și restaura</b> o configurație.</p>

<table class="tbl">
<tr><th>Al 2-lea argument</th><th>Efect la primirea semnalului</th></tr>
<tr><td>numele unei funcții</td><td>rulează <b>handlerul tău</b> (prototip <code>void f(int sig)</code>)</td></tr>
<tr><td><code>SIG_DFL</code></td><td>acțiunea <b>implicită</b> (pt. SIGINT = termină procesul)</td></tr>
<tr><td><code>SIG_IGN</code></td><td><b>ignoră</b> semnalul (nu se întâmplă nimic)</td></tr>
</table>

<h3>Handler propriu</h3>
<pre class="code" data-lang="c">#include &lt;signal.h&gt;
volatile sig_atomic_t flag = 0;

void handler(int sig) {          // prototip obligatoriu: void f(int)
    flag = 1;                    // setezi un flag, eviti operatii complexe
}

int main() {
    signal(SIGINT, handler);     // Ctrl+C ruleaza handler, NU mai opreste
    while (!flag) { /* lucru */ }
    printf("am primit SIGINT, ies curat\n");
}</pre>

<h2>Tiparul "protejează secțiunea critică"</h2>
${svgSignal()}

<pre class="code" data-lang="c">last = signal(SIGINT, handler);  // dezarmez Ctrl+C; SALVEZ ce era inainte
// ... cod critic neintreruptibil ...
signal(SIGINT, last);            // REARMEZ Ctrl+C la cum era</pre>

<div class="callout">
<b>De ce <code>last</code> ajunge <code>SIG_DFL</code>?</b> Dacă înainte ai făcut <code>signal(SIGINT, SIG_DFL)</code>, atunci la <code>last = signal(SIGINT, handler)</code> valoarea returnată (handlerul vechi) este chiar <code>SIG_DFL</code>. Restaurând <code>last</code>, Ctrl+C redevine fatal. <code>last</code> e un <b>pointer la funcție</b> care reține adresa handlerului — poate fi <code>SIG_DFL</code>, <code>SIG_IGN</code>, sau adresa unei funcții reale.
</div>

<div class="tip"><b>Întrebarea-test (examen 2022 I.5):</b> „în acest moment, la ce e legat SIGINT — <code>SIG_DFL</code>, <code>handler</code> sau <code>SIG_IGN</code>?" — de acolo deduci instant dacă Ctrl+C omoară procesul, rulează handlerul, sau e ignorat.</div>
`
},
// ------------------------------------------------------------
{
  id:"race", cat:"Sincronizare",
  titlu:"Secțiune critică & condiții de cursă",
  rezumat:"De ce i++ nu e atomic, race conditions, TOCTOU, atomicitate.",
  html:`
<h2>Problema partajării</h2>
<p>Când mai multe fire/procese accesează <b>aceleași date</b>, partajarea facilă aduce două probleme grave: <b>nedeterminism</b> în execuție și <b>date inconsistente/corupte</b>. Cu cât structurile de date sunt mai mari, cu atât crește riscul.</p>

<h2>De ce <code>i++</code> NU este atomic</h2>
<p>Operația aparent simplă <code>i++</code> se traduce în <b>3 instrucțiuni</b> separate:</p>
<pre class="code" data-lang="asm">move   X, REG     ; 1. citeste i in registru
inc    REG        ; 2. +1
move   REG, X     ; 3. scrie inapoi in memorie</pre>
<p>Dacă două fire execută acești 3 pași <b>întrețesut</b> (interleaved), ambele pot citi 7, ambele scriu 8 — în loc de 9. Aceasta este o <b>condiție de cursă (race condition)</b>.</p>

${svgRace()}

<h2>Tipuri de condiții de cursă</h2>
<table class="tbl">
<tr><th>Tip</th><th>Descriere</th></tr>
<tr><td><b>Interleaved access</b></td><td>acces întrețesut la aceeași dată (ex. <code>i++</code> din 2 fire)</td></tr>
<tr><td><b>TOCTOU</b></td><td>time-of-check to time-of-use: verifici o condiție, dar starea se schimbă înainte de folosire</td></tr>
<tr><td><b>Ordering</b></td><td>ordine greșită read/write (ex. producător-consumator)</td></tr>
</table>

<h3>Exemplu TOCTOU (vulnerabilitate de securitate)</h3>
<pre class="code" data-lang="c">// Victima:
if (access("file", W_OK) != 0) exit(1);  // VERIFIC permisiunile
fd = open("file", O_WRONLY);              // FOLOSESC (prea tarziu!)
// Atacatorul, intre cele 2 linii:
// symlink("/etc/passwd", "file");        // schimba "file"</pre>
<p>Între verificare și folosire, atacatorul schimbă fișierul → se scrie în <code>/etc/passwd</code>. Soluția: operații <b>atomice</b> (verifică-și-folosește indivizibil).</p>

<h2>Secțiunea critică</h2>
<p>Porțiunea de cod care accesează resursa partajată. Structura corectă:</p>
<pre class="code" data-lang="c">do {
    /* entry section    -- obtine LOCK */
    /* critical section -- partea protejata */
    /* exit section     -- elibereaza LOCK */
    /* remainder section */
} while (TRUE);</pre>

<h2>Atomicitate</h2>
<p>Soluția fundamentală: <b>operații atomice</b> — instrucțiuni care se execută <b>fără întrerupere</b>. SO oferă variabile și operații atomice:</p>
<pre class="code" data-lang="c">atomic_t counter;
atomic_set(&amp;counter, 5);     // counter = 5
atomic_add(10, &amp;counter);    // += 10, ATOMIC
atomic_inc(&amp;counter);        // += 1,  ATOMIC
int v = atomic_read(&amp;counter);</pre>

<div class="tip"><b>Compare-And-Swap (CAS):</b> operație atomică ce <b>verifică ȘI actualizează</b> într-un singur pas — previne TOCTOU. Conceptual: <code>if (val == asteptat) val = nou;</code> totul indivizibil. Stă la baza spinlock-urilor.</div>
`
},
// ------------------------------------------------------------
{
  id:"mutex", cat:"Sincronizare",
  titlu:"Mutex & Spinlock",
  rezumat:"Acces exclusiv: lock/unlock, blocant vs busy-wait, când folosești fiecare.",
  html:`
<h2>Mutex</h2>
<p>Un <b>mutex</b> (mutual exclusion) este o primitivă de <b>acces exclusiv</b>: cât timp un fir îl deține (lock), niciun alt fir nu poate intra în secțiunea critică. Are <b>2 operații atomice</b>: <b>lock</b> (acquire) și <b>unlock</b> (release).</p>
<p>Este <b>blocant</b>: un fir care cere un mutex deja ocupat este pus la <b>somn (sleep)</b> într-o coadă de așteptare și nu consumă CPU până la eliberare.</p>

<pre class="code" data-lang="c">pthread_mutex_t mutex;
pthread_mutex_init(&amp;mutex, NULL);

void *worker(void *arg) {
    pthread_mutex_lock(&amp;mutex);     // intru in sectiunea critica
    contor++;                       // cod protejat
    pthread_mutex_unlock(&amp;mutex);   // ies
    return NULL;
}</pre>
<p>Operațiile posibile pe un mutex: inițializare, distrugere, ocupare (lock), încercare neblocantă (<code>trylock</code>), eliberare (unlock).</p>

<h2>Spinlock</h2>
<p>Un <b>spinlock</b> face <b>busy-waiting</b>: firul „învârte" într-o buclă verificând lacătul (bazat pe CAS), <b>fără să cedeze CPU-ul</b>. Eficient doar pentru <b>secțiuni critice foarte scurte</b>, unde costul unui context switch ar fi mai mare decât așteptarea activă.</p>
<pre class="code" data-lang="c">// conceptual
acquire() { while (!available) ; /* busy wait */ available = false; }
release() { available = true; }</pre>

<h2>Spinlock vs Mutex</h2>
<table class="tbl">
<tr><th></th><th>Spinlock</th><th>Mutex</th></tr>
<tr><td><b>Așteptare</b></td><td>busy-waiting (consumă CPU)</td><td>blocant (sleep, cedează CPU)</td></tr>
<tr><td><b>Structură</b></td><td>simplu, fără coadă</td><td>are coadă de așteptare</td></tr>
<tr><td><b>Potrivit pentru</b></td><td>regiuni critice <b>scurte</b></td><td>regiuni critice <b>mari</b> sau cu blocare</td></tr>
</table>

<div class="callout"><b>Mutex vs semafor binar:</b> mutexul are conceptul de <b>proprietate</b> (cine a făcut lock <b>trebuie</b> să facă unlock) și e dedicat exclusiv excluderii mutuale. Semaforul binar e doar un contor 0/1, fără proprietate, și poate fi folosit și pentru <b>semnalizare/ordonare</b> între fire.</div>

<div class="tip"><b>Granularitatea blocării:</b>
<ul>
<li>secțiuni critice <b>mici</b> → puțin cod serializat, dar overhead mare de lock/unlock</li>
<li>secțiuni critice <b>mari</b> → overhead mic de locking, dar se serializează mult cod (lentoare)</li>
</ul>
Ideal: protejezi <b>cât mai puțin</b>, dar suficient pentru corectitudine.</div>
`
},
// ------------------------------------------------------------
{
  id:"semafoare", cat:"Sincronizare",
  titlu:"Semafoare — wait/post, binar vs numărător",
  rezumat:"Inițializare, cum cresc/scad, P/V (down/up), blocare la 0, exemplu rezolvat.",
  html:`
<h2>Ce este un semafor</h2>
<p>Un <b>semafor</b> este un <b>întreg ≥ 0</b> + o <b>coadă de fire blocate</b>, pe care se fac doar 2 operații, ambele <b>atomice</b>. Este o <b>generalizare a mutexului</b> — reține numărul de „permise" disponibile. Inventate de Dijkstra (de aici notația P/V).</p>

<table class="tbl">
<tr><th>Operație</th><th>Alte nume</th><th>Efect asupra valorii</th></tr>
<tr><td><code>sem_wait(s)</code></td><td><b>P</b>, down, acquire</td><td><b>scade</b> cu 1 (dacă poate)</td></tr>
<tr><td><code>sem_post(s)</code></td><td><b>V</b>, up, release, signal</td><td><b>crește</b> cu 1 (mereu)</td></tr>
</table>

${svgSemaphore()}

<h2>Regula de aur</h2>
<div class="callout">
<b>wait / P / down (scade):</b>
<ul>
<li>dacă <b>s &gt; 0</b> → scade s cu 1 și continuă imediat</li>
<li>dacă <b>s == 0</b> → <b>se BLOCHEAZĂ</b> (valoarea nu poate deveni negativă) până cineva face <code>post</code></li>
</ul>
<b>post / V / up (crește):</b>
<ul>
<li>mereu reușește; dacă există fire blocate în coadă → <b>deblochează unul</b>; altfel crește s cu 1</li>
</ul>
<b>Valoarea unui semafor nu poate scădea niciodată sub 0.</b>
</div>

<h2>Inițializare</h2>
<pre class="code" data-lang="c">sem_t s;
sem_init(&amp;s, pshared, valoare_initiala);
// pshared = 0  -&gt; intre firele ACELUIASI proces
// pshared != 0 -&gt; intre PROCESE (necesita memorie partajata, vezi mmap)</pre>

<h2>Cele 3 tipare</h2>
<table class="tbl">
<tr><th>Tipar</th><th>Valoare inițială</th><th>Folosire</th></tr>
<tr><td><b>Mutex / excludere mutuală</b> (binar)</td><td><b>1</b></td><td><code>wait</code> la intrare, <code>post</code> la ieșire</td></tr>
<tr><td><b>Sincronizare / "așteaptă semnal"</b></td><td><b>0</b></td><td>cineva face <code>post</code> ca altcineva să poată trece de <code>wait</code></td></tr>
<tr><td><b>Numărător</b> (N resurse)</td><td><b>N</b></td><td>permite N accesuri simultane (ex. pool de conexiuni)</td></tr>
</table>

<h2>Exemplu rezolvat: două fire alternând (examen 2023 I.2)</h2>
<p>Thread A tipărește „1" apoi „2"; Thread B tipărește „3" apoi „4". <code>s1=1, s2=0</code>.</p>
<pre class="code" data-lang="c">// Thread A              // Thread B
wait(s1); printf("1");   wait(s2); printf("3");
post(s2); wait(s1);      post(s1); wait(s2);
printf("2"); post(s2);   printf("4"); post(s1);</pre>
<table class="tbl">
<tr><th>Pas</th><th>Cine rulează</th><th>s1</th><th>s2</th><th>Ieșire</th></tr>
<tr><td>0</td><td>B: wait(s2) → blocat</td><td>1</td><td>0</td><td></td></tr>
<tr><td>1</td><td>A: wait(s1) ok, "1", post(s2)</td><td>0</td><td>1</td><td>1</td></tr>
<tr><td>2</td><td>A: wait(s1) → blocat</td><td>0</td><td>1</td><td></td></tr>
<tr><td>3</td><td>B: deblocat, "3", post(s1)</td><td>1</td><td>0</td><td>13</td></tr>
<tr><td>4</td><td>A: deblocat, "2", post(s2)</td><td>0</td><td>1</td><td>132</td></tr>
<tr><td>5</td><td>B: deblocat, "4", post(s1)</td><td>1</td><td>0</td><td>1324</td></tr>
</table>
<p>Ordinea e <b>forțată</b> de semafoare → <b>1-3-2-4</b> repetat. Singurul rezultat posibil.</p>

<h2>Cum rezolvi orice problemă de tip "ce șir poate fi afișat"</h2>
<ol>
<li>Scrie valoarea inițială a fiecărui semafor.</li>
<li>Identifică cine se <b>blochează primul</b> (cine face <code>wait</code> pe un 0).</li>
<li>Urmărește: fiecare <code>printf</code> + <code>post</code> deblochează pe cine? (cine e forțat să ruleze).</li>
<li>Fă un <b>tabel</b> cu valorile semafoarelor după fiecare operație — ca cel de mai sus.</li>
</ol>
`
},
// ------------------------------------------------------------
{
  id:"condvar-bariere", cat:"Sincronizare",
  titlu:"Variabile condiție & Bariere",
  rezumat:"Așteptarea unei condiții logice; sincronizarea a N fire la un punct.",
  html:`
<h2>Variabile condiție (condition variables)</h2>
<p>Permit unui fir să se <b>blocheze în așteptarea unui semnal</b> de la alt fir — adică până când o <b>condiție logică (predicat)</b> devine adevărată. Se folosesc <b>întotdeauna împreună cu un mutex</b>, care protejează verificarea predicatului.</p>

<pre class="code" data-lang="c">pthread_cond_t  cond;
pthread_mutex_t mutex;

/* Firul care asteapta: */
pthread_mutex_lock(&amp;mutex);
while (conditia_nu_e_satisfacuta)
    pthread_cond_wait(&amp;cond, &amp;mutex);   /* elibereaza mutex + se blocheaza */
pthread_mutex_unlock(&amp;mutex);

/* Firul care semnaleaza: */
pthread_mutex_lock(&amp;mutex);
/* schimba valoarea variabilei */
if (conditia_e_satisfacuta)
    pthread_cond_signal(&amp;cond);         /* trezeste un fir care asteapta */
pthread_mutex_unlock(&amp;mutex);</pre>

<table class="tbl">
<tr><th>Funcție</th><th>Rol</th></tr>
<tr><td><code>pthread_cond_wait(&amp;c, &amp;m)</code></td><td>eliberează mutexul ȘI blochează firul; la trezire re-ocupă mutexul</td></tr>
<tr><td><code>pthread_cond_signal(&amp;c)</code></td><td>trezește <b>un</b> fir care așteaptă</td></tr>
<tr><td><code>pthread_cond_broadcast(&amp;c)</code></td><td>trezește <b>toate</b> firele care așteaptă</td></tr>
</table>

<div class="warn"><b>De ce <code>while</code> și nu <code>if</code>?</b> Pentru a te proteja de <b>treziri false</b> (spurious wakeups) și de cazul în care condiția redevine falsă între semnalizare și reluare. La trezire, re-verifici predicatul în buclă.</div>

<h2>Bariere (barriers)</h2>
<p>O <b>barieră</b> sincronizează un grup de <b>N fire</b>: când un fir ajunge la barieră, <b>nu poate trece până când TOATE celelalte fire au ajuns</b> și ele. Când ajunge <b>ultimul</b>, toate sunt eliberate simultan și pot continua.</p>

${svgBarrier()}

<div class="callout"><b>Mecanism:</b> fiecare fir face un <code>SignalAndWait</code> și rămâne în starea <b>Blocked</b> până ce ultimul fir ajunge la barieră — apoi toate sunt deblocate odată și concurează din nou pentru execuție.</div>

<pre class="code" data-lang="c">pthread_barrier_t b;
pthread_barrier_init(&amp;b, NULL, N);   // N = numarul de fire

void *worker(void *arg) {
    faza1();
    pthread_barrier_wait(&amp;b);         // asteapta toate firele
    faza2();                          // incepe doar cand TOATE au terminat faza1
}</pre>

<div class="tip"><b>Diferența de bază:</b>
<ul>
<li><b>mutex / semafor</b> = acces exclusiv / semnalizare punctuală între fire;</li>
<li><b>variabilă condiție</b> = aștept până când un predicat devine adevărat;</li>
<li><b>barieră</b> = punct de <b>întâlnire</b> pentru N fire (sincronizare de fază, ex. calcul paralel pe etape).</li>
</ul>
</div>
`
},
// ------------------------------------------------------------
{
  id:"deadlock", cat:"Sincronizare",
  titlu:"Deadlock (interblocare) & condițiile Coffman",
  rezumat:"Când 2+ procese se blochează reciproc; cele 4 condiții necesare; prevenire.",
  html:`
<h2>Ce este un deadlock</h2>
<p>Un <b>deadlock (interblocare)</b> apare când două sau mai multe procese/fire se blochează <b>reciproc</b>, fiecare așteptând o resursă deținută de celălalt — și niciunul nu mai poate avansa.</p>

<pre class="code" data-lang="c">// Fir 1                    // Fir 2
lock(A);                    lock(B);
lock(B);  // asteapta B     lock(A);  // asteapta A
// ...                      // ...     -&gt; DEADLOCK</pre>
<p>Firul 1 deține A și vrea B; firul 2 deține B și vrea A. Ambele așteaptă la infinit.</p>

<h2>Cele 4 condiții Coffman (necesare simultan)</h2>
<p>Un deadlock poate apărea <b>doar dacă toate cele 4</b> sunt îndeplinite în același timp:</p>
<table class="tbl">
<tr><th>Condiție</th><th>Descriere</th></tr>
<tr><td><b>1. Excludere mutuală</b></td><td>resursa poate fi deținută de un singur proces la un moment dat</td></tr>
<tr><td><b>2. Hold and wait</b></td><td>un proces deține o resursă și așteaptă alta (fără să o elibereze pe prima)</td></tr>
<tr><td><b>3. No preemption</b></td><td>resursa nu poate fi luată cu forța — doar eliberată voluntar</td></tr>
<tr><td><b>4. Circular wait</b></td><td>există un <b>lanț circular</b>: P1 așteaptă P2, P2 așteaptă … Pn, Pn așteaptă P1</td></tr>
</table>

<h2>Strategii de tratare</h2>
<table class="tbl">
<tr><th>Strategie</th><th>Idee</th></tr>
<tr><td><b>Prevenire</b></td><td>elimini una din cele 4 condiții. Cea mai practică: spargi <b>circular wait</b> impunând o <b>ordine globală</b> de ocupare a lacătelor (toți iau A înainte de B).</td></tr>
<tr><td><b>Evitare</b></td><td>algoritmi (ex. <b>bancherul</b>) care acordă resurse doar dacă sistemul rămâne în stare „sigură".</td></tr>
<tr><td><b>Detecție + recuperare</b></td><td>lași deadlock-ul să apară, îl detectezi (graf de așteptare) și omori/repornești un proces.</td></tr>
<tr><td><b>Ignorare</b></td><td>„algoritmul struțului" — multe SO presupun că deadlock-urile sunt rare.</td></tr>
</table>

<div class="tip"><b>Soluție practică (ordonarea lacătelor):</b> dacă toate firele ocupă mutex-urile <b>în aceeași ordine</b> (ex. mereu A apoi B, niciodată B apoi A), <b>circular wait</b> devine imposibil → fără deadlock.</div>

<div class="warn"><b>Înrudite (de la semafoare):</b> <b>starvation</b> (înfometare) — un fir nu primește niciodată resursa pentru că alții au mereu prioritate; <b>recursive/self deadlock</b> — un fir încearcă să ocupe de două ori același mutex ne-reentrant.</div>
`
},
// ------------------------------------------------------------
{
  id:"prodcons", cat:"Sincronizare",
  titlu:"Producător–Consumator (bounded buffer)",
  rezumat:"Problema clasică de ordonare, rezolvată cu 3 semafoare.",
  html:`
<h2>Problema</h2>
<p>Unul sau mai mulți <b>producători</b> pun elemente într-un buffer de capacitate fixă; unul sau mai mulți <b>consumatori</b> le scot. Trebuie să:</p>
<ul>
<li>nu lăsăm producătorul să scrie în buffer <b>plin</b>;</li>
<li>nu lăsăm consumatorul să citească din buffer <b>gol</b>;</li>
<li>protejăm buffer-ul de acces concurent (excludere mutuală).</li>
</ul>
<p>Este o problemă de <b>ordonare</b> (read-after-write) + excludere mutuală.</p>

<h2>Soluția cu 3 semafoare</h2>
<table class="tbl">
<tr><th>Semafor</th><th>Init</th><th>Rol</th></tr>
<tr><td><code>empty</code></td><td><b>N</b></td><td>câte locuri <b>libere</b> sunt în buffer</td></tr>
<tr><td><code>full</code></td><td><b>0</b></td><td>câte locuri <b>ocupate</b> sunt</td></tr>
<tr><td><code>mutex</code></td><td><b>1</b></td><td>acces exclusiv la buffer</td></tr>
</table>

<pre class="code" data-lang="c">// PRODUCATOR                  // CONSUMATOR
while (1) {                    while (1) {
    item = produce();              wait(full);    // astept un element
    wait(empty);  // loc liber?    wait(mutex);
    wait(mutex);                   item = scoate();
    pune(item);                    post(mutex);
    post(mutex);                   post(empty);   // am eliberat un loc
    post(full);   // +1 ocupat     consume(item);
}                             }</pre>

<div class="callout">
<b>Cum funcționează:</b>
<ul>
<li>Producătorul face <code>wait(empty)</code>: dacă buffer-ul e plin (empty=0), se blochează.</li>
<li>Consumatorul face <code>wait(full)</code>: dacă buffer-ul e gol (full=0), se blochează.</li>
<li><code>empty</code> și <code>full</code> sunt complementare: <code>empty + full = N</code> mereu.</li>
</ul>
</div>

<div class="warn"><b>Ordinea contează!</b> Întotdeauna <code>wait(empty/full)</code> <b>înainte</b> de <code>wait(mutex)</code>. Dacă inversezi (<code>mutex</code> întâi), un producător blocat pe buffer plin ar ține mutexul ocupat → niciun consumator nu mai poate scoate → <b>deadlock</b>.</div>
`
},
// ------------------------------------------------------------
{
  id:"ipc", cat:"IPC",
  titlu:"IPC & memorie partajată (mmap, pipe)",
  rezumat:"Cum comunică procesele izolate: memorie partajată, pipe, semafoare inter-proces.",
  html:`
<h2>De ce IPC</h2>
<p>Procesele au spații de adrese <b>izolate</b> — nu pot accesa direct memoria altuia. Pentru a coopera au nevoie de mecanisme de <b>comunicare inter-proces (IPC)</b>.</p>

<table class="tbl">
<tr><th>Mecanism</th><th>Descriere</th></tr>
<tr><td><b>Memorie partajată</b> (<code>mmap</code>, <code>shm</code>)</td><td>o zonă de memorie comună, vizibilă mai multor procese — cel mai rapid</td></tr>
<tr><td><b>Pipe</b> (<code>|</code>, <code>pipe()</code>)</td><td>canal unidirecțional de octeți (ex. <code>ls | grep</code>)</td></tr>
<tr><td><b>Cozi de mesaje</b></td><td>mesaje structurate trimise/primite</td></tr>
<tr><td><b>Socket-uri</b></td><td>comunicare locală sau în rețea</td></tr>
<tr><td><b>Semnale</b></td><td>notificări asincrone (vezi tema Semnale)</td></tr>
</table>

<h2>Memorie partajată cu mmap</h2>
<p><code>mmap</code> mapează o zonă de memorie care poate fi <b>partajată între procese</b> (<code>MAP_SHARED</code>). Combinat cu <code>fork()</code>, copiii moștenesc maparea și văd <b>aceeași</b> memorie fizică — modificările unuia se văd la ceilalți.</p>

<pre class="code" data-lang="c">void *p = mmap(NULL, sizeof(sem_t),
               PROT_READ | PROT_WRITE,
               MAP_ANONYMOUS | MAP_SHARED, -1, 0);
sem_t *sem = p;
sem_init(sem, 1, MAX_LOAD);   // pshared=1 -&gt; semafor INTER-PROCES
pid = fork();                 // copilul vede acelasi semafor</pre>

<div class="callout"><b>De ce e nevoie de mmap aici (examen 2024):</b> un semafor obișnuit (variabilă globală) ar fi <b>duplicat</b> de <code>fork()</code> → fiecare proces ar avea copia lui și sincronizarea inter-proces nu ar funcționa. <code>mmap(MAP_SHARED)</code> + <code>sem_init(..., pshared=1, ...)</code> pun semaforul în memorie <b>cu adevărat comună</b>.</div>

<h2>Pipe — exemplu de shell</h2>
<p>Operatorul <code>|</code> conectează stdout-ul unui proces la stdin-ul altuia printr-un pipe:</p>
<pre class="code" data-lang="c">int fd[2];
pipe(fd);                      // fd[0]=citire, fd[1]=scriere
if (fork() == 0) {
    dup2(fd[1], STDOUT_FILENO);// scriu in pipe
    execl("/bin/ls", "ls", NULL);
} else {
    dup2(fd[0], STDIN_FILENO); // citesc din pipe
    execl("/bin/grep", "grep", ".c", NULL);
}</pre>

<div class="tip"><b>Legătură cu firele:</b> firele <b>nu</b> au nevoie de IPC pentru a partaja date (au deja memorie comună — globale, heap). IPC e necesar între <b>procese</b> diferite, care sunt izolate.</div>
`
},
// ------------------------------------------------------------
{
  id:"pipe", cat:"IPC",
  titlu:"Pipe-uri anonime — comunicare tată-fiu",
  rezumat:"Canal unidirecțional între procese înrudite; pereche de pipe-uri pentru dialog bidirecțional; redirectare cu dup2.",
  html:`
<h2>Ce este un pipe anonim</h2>
<p>Un <b>pipe</b> este un canal de comunicație <b>unidirecțional</b> în memorie (un buffer <b>FIFO</b> gestionat de kernel) între procese <b>înrudite</b> (tată–fiu). Se creează cu apelul de sistem <code>pipe()</code>:</p>
<pre class="code" data-lang="c">int fd[2];
pipe(fd);   // fd[0] = capat de CITIRE, fd[1] = capat de SCRIERE</pre>
<p>Ce scrii în <code>fd[1]</code> poți citi din <code>fd[0]</code>. Un pipe = <b>un singur sens</b>.</p>
<pre class="code">   scrie                       citeste
  --------&gt;  fd[1] [#######] fd[0]  --------&gt;
                 (kernel buffer FIFO)</pre>

<h2>De ce avem nevoie de DOUĂ pipe-uri</h2>
<p>Un pipe e unidirecțional. Pentru un <b>dialog bidirecțional</b> (tata trimite fiului <b>și</b> fiul răspunde tatălui) folosim o <b>pereche de pipe-uri</b>, câte unul pe fiecare sens:</p>
<ul>
<li><b>pipe 1:</b> tată → fiu (<code>p2c</code> — parent to child)</li>
<li><b>pipe 2:</b> fiu → tată (<code>c2p</code> — child to parent)</li>
</ul>

<h2>Schema comunicării</h2>
<pre class="code">                 pipe1 (tata -&gt; fiu)
  +---------+   p2c[1] [####] p2c[0]   +---------+
  |  TATA   |---- scrie ---&gt;  -- citeste --&gt;|  FIU    |
  | (parent)|                              | (child) |
  |         |&lt;-- citeste --   &lt;-- scrie ----|         |
  +---------+   c2p[0] [####] c2p[1]   +---------+
                 pipe2 (fiu -&gt; tata)

Tata pastreaza: p2c[1] (scriere) + c2p[0] (citire)  -&gt; inchide p2c[0], c2p[1]
Fiul pastreaza: p2c[0] (citire)  + c2p[1] (scriere)  -&gt; inchide p2c[1], c2p[0]</pre>

<h2>Rolul lui fork() și regula close()</h2>
<p><code>fork()</code> duplică procesul, iar copilul moștenește <b>copii ale descriptorilor</b> deschiși. Deci după <code>fork()</code> <b>ambele</b> procese au toate cele 4 capete deschise.</p>
<div class="callout"><b>Regula de aur:</b> fiecare proces <b>închide capetele pe care nu le folosește</b> (<code>close()</code>). E obligatoriu pentru:
<ul>
<li>a nu risipi descriptori;</li>
<li>ca <code>read()</code> să detecteze corect <b>EOF</b> — cititorul primește EOF doar când <b>toate</b> capetele de scriere ale pipe-ului sunt închise. Altfel apare <b>blocaj (deadlock)</b>.</li>
</ul></div>

<h2>Aplicație completă în C (read / write)</h2>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;unistd.h&gt;      // pipe, fork, read, write, close
#include &lt;string.h&gt;
#include &lt;sys/wait.h&gt;    // wait

int main() {
    int p2c[2];   // pipe TATA -&gt; FIU
    int c2p[2];   // pipe FIU  -&gt; TATA

    pipe(p2c);    // cream cele DOUA pipe-uri anonime (INAINTE de fork!)
    pipe(c2p);

    pid_t pid = fork();        // duplicam procesul

    if (pid &gt; 0) {
        // ===== PROCESUL TATA =====
        close(p2c[0]);         // tata NU citeste din pipe1
        close(c2p[1]);         // tata NU scrie in pipe2

        char *mesaj = "Salut, fiule!";
        char raspuns[100];

        write(p2c[1], mesaj, strlen(mesaj) + 1);   // trimite fiului
        printf("[TATA] am trimis: %s\n", mesaj);

        read(c2p[0], raspuns, sizeof(raspuns));    // citeste raspunsul
        printf("[TATA] am primit: %s\n", raspuns);

        close(p2c[1]); close(c2p[0]);
        wait(NULL);            // asteapta fiul (evita proces zombie)
    } else {
        // ===== PROCESUL FIU =====
        close(p2c[1]);         // fiul NU scrie in pipe1
        close(c2p[0]);         // fiul NU citeste din pipe2

        char buf[100], raspuns[100];

        read(p2c[0], buf, sizeof(buf));            // citeste de la tata
        sprintf(raspuns, "Am primit '%s', multumesc!", buf);
        write(c2p[1], raspuns, strlen(raspuns) + 1); // raspunde tatalui

        close(p2c[0]); close(c2p[1]);
        exit(0);
    }
    return 0;
}</pre>
<p class="muted">Rezultat: <code>[TATA] am trimis: Salut, fiule!</code> urmat de <code>[TATA] am primit: Am primit 'Salut, fiule!', multumesc!</code></p>

<h2>Variantă cu stdin/stdout (dup2)</h2>
<p>Enunțul cere adesea „funcții de I/O specifice <b>standard input/output</b>". Atunci redirectezi capetele pipe-ului peste <code>stdin</code>/<code>stdout</code> cu <code>dup2()</code> și folosești <code>printf</code>/<code>scanf</code>/<code>fgets</code>:</p>
<pre class="code" data-lang="c">// ---- in PROCESUL FIU, inainte de comunicare ----
dup2(p2c[0], STDIN_FILENO);   // stdin-ul fiului = citire de la tata
dup2(c2p[1], STDOUT_FILENO);  // stdout-ul fiului = scriere catre tata

char buf[100];
fgets(buf, sizeof(buf), stdin);      // CITESTE din pipe ca din stdin
printf("Fiul a primit: %s", buf);    // SCRIE in pipe ca in stdout
fflush(stdout);                      // OBLIGATORIU (vezi mai jos)</pre>
<div class="tip">⚠️ Când <code>stdout</code> e un <b>pipe</b> (nu terminal), <code>printf</code> e <b>buffer-at</b> — datele nu pleacă până nu faci <code>fflush(stdout)</code>. Uiți <code>fflush</code> → tata pare „blocat" la <code>read</code>. La <code>read</code>/<code>write</code> directe problema nu există.</div>

<h2>Greșeli frecvente</h2>
<table class="tbl">
<tr><th>Greșeala</th><th>Consecința</th></tr>
<tr><td>Nu închizi capetele nefolosite</td><td><code>read</code> nu primește EOF → <b>deadlock</b></td></tr>
<tr><td>Un singur pipe pentru ambele sensuri</td><td>mesajele se amestecă / procesul își citește propriul mesaj</td></tr>
<tr><td><code>dup2</code> fără <code>fflush(stdout)</code></td><td>tata se blochează la <code>read</code></td></tr>
<tr><td>Lipsește <code>wait()</code> în tată</td><td>proces <b>zombie</b></td></tr>
<tr><td><code>pipe()</code> apelat <b>după</b> <code>fork()</code></td><td>procesele au pipe-uri diferite → nu comunică</td></tr>
</table>

<div class="tip"><b>La examen:</b> pipe = canal <b>unidirecțional</b> (<code>fd[0]</code> citire, <code>fd[1]</code> scriere); pentru dialog bidirecțional ai nevoie de <b>2 pipe-uri</b>; <code>pipe()</code> se face <b>înainte</b> de <code>fork()</code>; fiecare proces <b>închide</b> capetele nefolosite; <code>wait()</code> în tată evită zombie. <span class="muted">Vezi și conceptul <b>IPC</b> și exemplul shell <code>ls | grep</code>.</span></div>
`
},
// ------------------------------------------------------------
{
  id:"fisiere", cat:"Sistem de fișiere",
  titlu:"Sistemul de fișiere — descriptori, inode, dentry",
  rezumat:"File descriptors (0/1/2), inode, dentry, dup/dup2, buffered vs system I/O.",
  html:`
<h2>Fișier deschis vs fișier pe disc</h2>
<p>Un <b>fișier pe disc</b> este static și referit prin <b>nume</b>. Un <b>fișier deschis</b> este dinamic și referit printr-un <b>handle / descriptor</b>. Deschiderea (<code>open</code>/<code>fopen</code>) creează instanța în memorie și întoarce descriptorul.</p>

<h2>Descriptori de fișier — tabela (FDT)</h2>
<p>Fiecare proces are o <b>tabelă de descriptori (FDT)</b> — un vector indexat. Primii 3 sunt deschiși automat:</p>
${svgFDT()}
<table class="tbl">
<tr><th>fd</th><th>Nume</th><th>Implicit</th></tr>
<tr><td>0</td><td><code>stdin</code></td><td>tastatura</td></tr>
<tr><td>1</td><td><code>stdout</code></td><td>ecranul</td></tr>
<tr><td>2</td><td><code>stderr</code></td><td>ecranul (erori)</td></tr>
<tr><td>3, 4, …</td><td>—</td><td>fișiere deschise ulterior</td></tr>
</table>

<div class="callout"><b>Exercițiu clasic „de ce 3?":</b> primul <code>fopen</code> întoarce fd = <b>3</b>, al doilea fd = <b>4</b>. De ce nu 0? Pentru că <b>0, 1, 2 sunt deja ocupați</b> (stdin/stdout/stderr). <code>open</code> întoarce mereu <b>cel mai mic descriptor liber</b>. Dacă faci <code>fclose</code> pe fd 3, următorul <code>fopen</code> reia <b>fd = 3</b>.</div>

<h2>Apeluri de sistem (POSIX)</h2>
<table class="tbl">
<tr><th>Apel</th><th>Rol</th></tr>
<tr><td><code>open(cale, flags)</code></td><td>deschide/creează, întoarce un fd</td></tr>
<tr><td><code>read(fd, buf, n)</code></td><td>citește n octeți, avansează cursorul</td></tr>
<tr><td><code>write(fd, buf, n)</code></td><td>scrie n octeți, avansează cursorul</td></tr>
<tr><td><code>lseek(fd, off, whence)</code></td><td>mută cursorul (SEEK_SET/CUR/END)</td></tr>
<tr><td><code>close(fd)</code></td><td>închide, eliberează descriptorul</td></tr>
<tr><td><code>dup</code> / <code>dup2</code></td><td>duplică un descriptor (redirectări)</td></tr>
</table>
<p><b>Cursorul de fișier</b> NU e partajat între procese (fiecare are al lui), DAR <b>este partajat între firele</b> aceluiași proces.</p>

<h2>Redirectări cu dup / dup2</h2>
<p>Pentru a redirecta <code>stdout</code> într-un fișier (<code>echo "x" &gt; f.txt</code>):</p>
<pre class="code" data-lang="c">// Varianta cu dup:           // Varianta cu dup2 (recomandata):
fd = open("f.txt", O_WRONLY); fd = open("f.txt", O_WRONLY);
close(STDOUT_FILENO);         dup2(fd, STDOUT_FILENO);
dup(fd);   // ia fd 1 liber   close(fd);
close(fd);</pre>
<div class="callout"><b>dup vs dup2 — care e mai sigur?</b> <code>dup2(old, new)</code> e mai sigur: specifică <b>explicit</b> descriptorul țintă. <code>dup</code> depinde de „primul descriptor liber" (trebuie să închizi întâi STDOUT) → fragil, expus la race conditions.</div>

<h2>inode și dentry</h2>
<table class="tbl">
<tr><th>Structură</th><th>Conține</th></tr>
<tr><td><b>inode</b> (1 per fișier)</td><td>metadatele: owner, timpi (acces/modificare), permisiuni, tip fișier, pointeri către blocurile de date — <b>NU și numele!</b></td></tr>
<tr><td><b>dentry</b> (directory entry)</td><td>o pereche <b>{ nume fișier, număr de inode }</b> — face legătura nume → inode</td></tr>
</table>
<p>Un <b>director</b> este o colecție de dentry-uri. Numele fișierului trăiește în <b>dentry</b> (în directorul părinte), nu în inode — de aceea un inode poate avea mai multe nume (hard links).</p>

<h3>Exemplu: numărul de dentry-uri (examen 2020)</h3>
<pre class="code">Un director rădăcină, 5 subdirectoare, fiecare cu 5 fișiere.
Intrari cu nume: 5 (subdir) + 25 (fisiere)      = 30
Intrari "."   : cate una per director (6 dir)   =  6
Intrari ".."  : cate una per subdirector (5)    =  5
                                          Total = 41 dentry-uri</pre>

<h2>Buffered I/O vs System I/O</h2>
<table class="tbl">
<tr><th>Buffered I/O (ANSI C: fread/fwrite/printf)</th><th>System I/O (POSIX: read/write)</th></tr>
<tr><td>buffering în <b>user space</b> (libc)</td><td>direct la kernel, fără buffering</td></tr>
<tr><td>mai puține apeluri de sistem</td><td>overhead de apel de sistem la fiecare op</td></tr>
<tr><td>datele se trimit la <code>fflush</code>, <code>fclose</code>, <code>\\n</code> (line buffered) sau buffer plin</td><td>transmitere imediată (sincron)</td></tr>
</table>

<div class="tip"><b>La examen:</b> reține <b>0/1/2 = stdin/stdout/stderr</b> (de aceea <code>open</code> începe de la 3), <b>dentry = {nume, inode}</b>, inode-ul NU conține numele, și că <b>dup2</b> e varianta sigură de redirectare.</div>
`
},
// ------------------------------------------------------------
{
  id:"planificare", cat:"Planificare",
  titlu:"Planificare — FCFS, SJF, SRTF",
  rezumat:"Algoritmi batch, metrici (turnaround, waiting), diagrame Gantt, calcule MTT.",
  html:`
<h2>Planificatorul (scheduler)</h2>
<p>Decide <b>cine</b> rulează și <b>cât</b>. Este apelat când procesul curent (RUNNING):</p>
<ol>
<li>se termină (moare);</li>
<li>se <b>blochează</b> pe o operație (apel de sistem) — <b>voluntar</b>;</li>
<li>cedează slotul cu <code>yield()</code> — <b>voluntar</b>;</li>
<li>îi <b>expiră cuanta</b> (întrerupere de ceas) — <b>involuntar / preemptiv</b>;</li>
<li>apare un proces READY mai prioritar — <b>involuntar / preemptiv</b>.</li>
</ol>

<table class="tbl">
<tr><th>Cooperativ (nepreemptiv)</th><th>Preemptiv</th></tr>
<tr><td>procesul cedează voluntar (yield)</td><td>procesul e întrerupt (expiră cuanta)</td></tr>
<tr><td>interactivitate scăzută, implementare simplă</td><td>interactivitate sporită, necesită sincronizare</td></tr>
</table>

<h2>Metrici (timpi de planificare)</h2>
<table class="tbl">
<tr><th>Metric</th><th>Definiție</th></tr>
<tr><td><b>Waiting time</b> (așteptare)</td><td>timp petrecut în coada READY</td></tr>
<tr><td><b>Turnaround time</b></td><td>de la sosire (arrival) până la finalizare (finish)</td></tr>
<tr><td><b>Response time</b></td><td>de la sosire până la <b>prima</b> rulare/ieșire</td></tr>
<tr><td><b>Throughput</b></td><td>nr. procese terminate / unitate de timp</td></tr>
<tr><td><b>Utilizare CPU</b></td><td>procent de timp în care procesorul lucrează (practic 40–90%)</td></tr>
</table>
<p class="muted">Când toate procesele sosesc la t=0: <b>turnaround = momentul de finish</b>. La sosiri diferite: turnaround = finish − arrival.</p>
<p>Obiective contradictorii: timp de așteptare mic → sistem <b>interactiv</b>; turnaround mic → sistem <b>productiv</b>. În general nu poți avea ambele simultan la maxim.</p>

<h2>FCFS — First Come First Served</h2>
<p>În ordinea sosirii (nepreemptiv). Simplu, dar suferă de <b>efectul de convoi</b>: un proces CPU-bound lung blochează procesele scurte din spate.</p>
<pre class="code">J1,J2,J3 sosesc la t=0 cu timpii 24, 3, 3
Ordine J1,J2,J3:  TT = 24, 27, 30  -&gt; MTT = (24+27+30)/3 = 27
Ordine J2,J3,J1:  TT =  3,  6, 30  -&gt; MTT = (3+6+30)/3  = 13  (mai bine!)</pre>

<h2>SJF — Shortest Job First</h2>
<p>Se rulează jobul <b>cel mai scurt</b> primul (nepreemptiv). Minimizează timpul mediu de așteptare, dar necesită cunoașterea/estimarea duratei.</p>
<pre class="code">Timpii [12, 20, 8, 4]:
FCFS: J1,J2,J3,J4 -&gt; TT = 12,32,40,44 -&gt; MTT = 32
SJF:  J4,J3,J1,J2 -&gt; TT =  4,12,24,44 -&gt; MTT = 21  (optim nepreemptiv)</pre>

<h2>SRTF — Shortest Remaining Time First</h2>
<p>Versiunea <b>preemptivă</b> a SJF: dacă sosește un job cu timp rămas mai mic decât al celui curent, îl <b>întrerupe</b>. Obține un MTT și mai mic, cu prețul mai multor schimbări de context.</p>
<pre class="code">Sosiri la [0,1,2,3], timpi [8,4,9,5]:
SRTF -&gt; MTT = 13   |   SJF nepreemptiv -&gt; MTT = 14.25</pre>

<div class="tip"><b>Ierarhia MTT:</b> SRTF ≤ SJF ≤ FCFS (pentru aceleași date). SJF e optim între nepreemptivi; SRTF îl bate fiind preemptiv. Round-Robin (tema următoare) prioritizează <b>interactivitatea</b>, nu MTT-ul minim.</div>
`
},
// ------------------------------------------------------------
{
  id:"round-robin", cat:"Planificare",
  titlu:"Round-Robin & Round-Robin pe priorități",
  rezumat:"Cuanta, rotația, prioritatea decide ordinea — tipul de problemă din examen.",
  html:`
<h2>Round-Robin (RR)</h2>
<p>Este <b>FCFS preemptiv cu cuantă</b>: fiecare proces primește o felie fixă de timp (<b>cuanta</b>); la expirare e preemptat și pus la <b>coada</b> cozii de READY. Garantează că niciun proces nu „înfometează".</p>
<table class="tbl">
<tr><th>Cuantă mare</th><th>Cuantă mică</th></tr>
<tr><td>productivitate ridicată</td><td>interactivitate sporită</td></tr>
<tr><td>interactivitate redusă (procesele scurte așteaptă)</td><td>productivitate redusă (timp pierdut în schimbări de context)</td></tr>
</table>
<p>Caz extrem: cuantă → ∞ devine FCFS; cuantă foarte mică → overhead enorm de context switch.</p>

<h2>Round-Robin pe priorități (tipul din examen!)</h2>
<div class="callout">
<b>Prioritatea decide ORDINEA în tur; cuanta decide CÂT rulează fiecare.</b>
<ul>
<li>Procesele <b>gata</b> se servesc în <b>ordinea priorității</b> (descrescător), fiecare câte o cuantă.</li>
<li>După un tur complet, se <b>reia</b> turul cu procesele rămase, tot în ordinea priorității.</li>
<li>Un proces <b>iese din rotație</b> imediat ce timpul lui rămas ajunge la 0 (poate consuma și mai puțin decât o cuantă întreagă în ultimul pas).</li>
</ul>
</div>

<h2>Exemplu rezolvat complet (examen 2023 I.4)</h2>
<p>P1..P5, timpi <b>14, 3, 10, 8, 17</b>; priorități <b>5, 3, 1, 4, 2</b> (5 = max); cuanta = 3.<br>
Ordine de prioritate: <b>P1(5) &gt; P4(4) &gt; P2(3) &gt; P5(2) &gt; P3(1)</b>.</p>

${svgGantt()}

<table class="tbl">
<tr><th>Tur</th><th>Execuție (timp rămas după)</th></tr>
<tr><td>1</td><td>P1(11) P4(5) P2(<b>0✓</b>) P5(14) P3(7)</td></tr>
<tr><td>2</td><td>P1(8) P4(2) P5(11) P3(4) &nbsp;<span class="muted">(P2 a ieșit)</span></td></tr>
<tr><td>3</td><td>P1(5) P4(<b>0✓</b>) P5(8) P3(1)</td></tr>
<tr><td>4</td><td>P1(2) P5(5) P3(<b>0✓</b>) &nbsp;<span class="muted">(P4 a ieșit)</span></td></tr>
<tr><td>5</td><td>P1(<b>0✓</b>) P5(2)</td></tr>
<tr><td>6</td><td>P5(<b>0✓</b>)</td></tr>
</table>

<p><b>Secvența:</b> <code>P1 P4 P2 P5 P3 | P1 P4 P5 P3 | P1 P4 P5 P3 | P1 P5 P3 | P1 P5 | P5</code></p>

<h2>Trucuri de eliminare rapidă a variantelor</h2>
<ol>
<li>Primul tur respectă mereu ordinea priorității: <code>P1 P4 P2 P5 P3</code>.</li>
<li><b>P2 are 3s = exact o cuantă</b> → apare o <b>singură</b> dată. Orice variantă care repetă P2 după turul 1 e <b>greșită</b>.</li>
<li>În turul 2, P2 a dispărut → ordinea corectă devine <code>P1 P4 P5 P3</code>.</li>
<li>Ultimul care termină e procesul cel mai lung rămas (aici <b>P5</b>, 17s) → toate variantele se termină cu P5.</li>
</ol>
<p class="muted">Verificare: suma cuantelor executate = suma timpilor = 14+3+10+8+17 = 52s.</p>
`
}
];

// ============================================================
//  DIAGRAME SVG (reutilizabile)
// ============================================================
function svgPCB(){return `<div class="diagram"><svg viewBox="0 0 360 240" role="img" aria-label="PCB">
<rect x="100" y="10" width="160" height="220" rx="8" fill="#221e1a" stroke="#e9b143" stroke-width="2"/>
<rect x="100" y="10" width="160" height="30" rx="8" fill="#e9b143"/>
<text x="180" y="30" text-anchor="middle" fill="#1a1714" font-size="13" font-weight="bold">PCB (task_struct)</text>
${['PID / PPID','State','Program Counter','Registers','Priority','Address space','Open files'].map((t,i)=>`<text x="180" y="${64+i*25}" text-anchor="middle" font-size="12" fill="#ece3d2">${t}</text><line x1="110" y1="${74+i*25}" x2="250" y2="${74+i*25}" stroke="#352f28"/>`).join('')}
</svg></div>`}

function svgFork(){return `<div class="diagram"><svg viewBox="0 0 480 180" role="img" aria-label="fork">
<defs><marker id="af" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#e9b143"/></marker></defs>
<rect x="20" y="70" width="120" height="40" rx="6" fill="#2a2118" stroke="#83a598" stroke-width="2"/>
<text x="80" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="#83a598">PĂRINTE</text>
<text x="80" y="60" text-anchor="middle" font-size="11" fill="#ece3d2">pid = fork()</text>
<line x1="140" y1="80" x2="300" y2="40" stroke="#e9b143" marker-end="url(#af)"/>
<line x1="140" y1="100" x2="300" y2="140" stroke="#e9b143" marker-end="url(#af)"/>
<rect x="305" y="22" width="165" height="38" rx="6" fill="#2a2118" stroke="#83a598" stroke-width="2"/>
<text x="387" y="46" text-anchor="middle" font-size="11" fill="#83a598">părinte: pid = PID copil (&gt;0)</text>
<rect x="305" y="120" width="165" height="38" rx="6" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/>
<text x="387" y="144" text-anchor="middle" font-size="11" fill="#b8bb26">copil: pid = 0</text>
</svg></div>`}

function svgOrphanZombie(){return `<div class="diagram"><svg viewBox="0 0 500 150" role="img" aria-label="orfan vs zombie">
<text x="125" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#d8843f">ORFAN</text>
<rect x="40" y="30" width="90" height="30" rx="5" fill="#2a1a16" stroke="#fb4934"/><text x="85" y="50" text-anchor="middle" font-size="10" fill="#ece3d2">părinte †</text>
<rect x="135" y="80" width="100" height="30" rx="5" fill="#1f2616" stroke="#b8bb26"/><text x="185" y="100" text-anchor="middle" font-size="10" fill="#ece3d2">copil (rulează)</text>
<text x="185" y="135" text-anchor="middle" font-size="9" fill="#a8997f">adoptat de init (PPID=1)</text>
<line x1="375" y1="14" x2="375" y2="135" stroke="#352f28"/>
<text x="380" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#d3869b">ZOMBIE</text>
<rect x="300" y="30" width="100" height="30" rx="5" fill="#1f2616" stroke="#b8bb26"/><text x="350" y="50" text-anchor="middle" font-size="10" fill="#ece3d2">părinte (rulează)</text>
<rect x="405" y="80" width="90" height="30" rx="5" fill="#241a26" stroke="#d3869b"/><text x="450" y="100" text-anchor="middle" font-size="10" fill="#ece3d2">copil † (zombie)</text>
<text x="440" y="135" text-anchor="middle" font-size="9" fill="#a8997f">fără wait()</text>
</svg></div>`}

function svgThreads(){return `<div class="diagram"><svg viewBox="0 0 440 220" role="img" aria-label="proces cu fire">
<rect x="15" y="10" width="410" height="200" rx="10" fill="#221e1a" stroke="#e9b143" stroke-width="2"/>
<text x="220" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#e9b143">PROCES (partajat: cod, date globale, heap, fișiere)</text>
<rect x="35" y="45" width="370" height="38" rx="5" fill="#1f2616" stroke="#b8bb26"/><text x="220" y="69" text-anchor="middle" font-size="11" fill="#b8bb26">.text / .data / .bss / heap / descriptori — COMUN</text>
${[0,1,2].map(i=>`<rect x="${35+i*125}" y="98" width="110" height="100" rx="6" fill="#2a2118" stroke="#83a598"/><text x="${90+i*125}" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="#83a598">Thread ${i+1}</text><text x="${90+i*125}" y="140" text-anchor="middle" font-size="9" fill="#ece3d2">stivă</text><text x="${90+i*125}" y="157" text-anchor="middle" font-size="9" fill="#ece3d2">regiștri</text><text x="${90+i*125}" y="174" text-anchor="middle" font-size="9" fill="#ece3d2">PC</text><text x="${90+i*125}" y="191" text-anchor="middle" font-size="9" fill="#a8997f">PRIVAT</text>`).join('')}
</svg></div>`}

function svgSignal(){return `<div class="diagram"><svg viewBox="0 0 480 130" role="img" aria-label="signal">
<rect x="10" y="50" width="135" height="34" rx="5" fill="#1f2616" stroke="#b8bb26"/><text x="77" y="71" text-anchor="middle" font-size="10" fill="#ece3d2">SIGINT → SIG_DFL</text>
<text x="77" y="40" text-anchor="middle" font-size="9" fill="#a8997f">Ctrl+C OMOARĂ</text>
<rect x="175" y="50" width="130" height="34" rx="5" fill="#2e2515" stroke="#e9b143"/><text x="240" y="71" text-anchor="middle" font-size="10" fill="#ece3d2">SIGINT → handler</text>
<text x="240" y="40" text-anchor="middle" font-size="9" fill="#a8997f">→ do_nothing</text>
<rect x="335" y="50" width="135" height="34" rx="5" fill="#1f2616" stroke="#b8bb26"/><text x="402" y="71" text-anchor="middle" font-size="10" fill="#ece3d2">SIGINT → last(=DFL)</text>
<text x="402" y="40" text-anchor="middle" font-size="9" fill="#a8997f">OMOARĂ iar</text>
<text x="160" y="104" font-size="9" fill="#e9b143">last=signal(.,handler)</text>
<text x="312" y="104" font-size="9" fill="#e9b143">signal(.,last)</text>
</svg></div>`}

function svgRace(){return `<div class="diagram"><svg viewBox="0 0 460 165" role="img" aria-label="race condition">
<text x="115" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#83a598">Thread A</text>
<text x="345" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#d8843f">Thread B</text>
<line x1="230" y1="25" x2="230" y2="160" stroke="#352f28"/>
${[['citește i=7','',0],['','citește i=7',1],['i=7+1=8','',2],['','i=7+1=8',3],['scrie i=8','',4],['','scrie i=8',5]].map((r,i)=>`<text x="115" y="${44+i*18}" text-anchor="middle" font-size="10" fill="#83a598">${r[0]}</text><text x="345" y="${44+i*18}" text-anchor="middle" font-size="10" fill="#d8843f">${r[1]}</text>`).join('')}
<text x="230" y="158" text-anchor="middle" font-size="11" font-weight="bold" fill="#fb4934">rezultat 8 (greșit, trebuia 9!)</text>
</svg></div>`}

function svgSemaphore(){return `<div class="diagram"><svg viewBox="0 0 460 120" role="img" aria-label="semafor">
<defs><marker id="as" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#a8997f"/></marker></defs>
<rect x="180" y="30" width="100" height="50" rx="8" fill="#221e1a" stroke="#e9b143" stroke-width="2"/>
<text x="230" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#ece3d2">semafor</text>
<text x="230" y="68" text-anchor="middle" font-size="13" font-weight="bold" fill="#e9b143">valoare ≥ 0</text>
<line x1="120" y1="55" x2="178" y2="55" stroke="#b8bb26" stroke-width="2" marker-end="url(#as)"/>
<text x="95" y="40" text-anchor="middle" font-size="11" fill="#b8bb26">post (V)</text>
<text x="95" y="72" text-anchor="middle" font-size="10" fill="#b8bb26">+1</text>
<line x1="282" y1="55" x2="345" y2="55" stroke="#fb4934" stroke-width="2" marker-end="url(#as)"/>
<text x="380" y="40" text-anchor="middle" font-size="11" fill="#fb4934">wait (P)</text>
<text x="385" y="72" text-anchor="middle" font-size="10" fill="#fb4934">−1 (blochează la 0)</text>
</svg></div>`}

function svgBarrier(){return `<div class="diagram"><svg viewBox="0 0 440 150" role="img" aria-label="bariera">
<defs><marker id="ab" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#83a598"/></marker></defs>
<line x1="220" y1="10" x2="220" y2="140" stroke="#fb4934" stroke-width="3" stroke-dasharray="6 4"/>
<text x="220" y="148" text-anchor="middle" font-size="10" fill="#fb4934">BARIERĂ</text>
${[0,1,2].map(i=>`<rect x="40" y="${20+i*36}" width="90" height="26" rx="5" fill="#2a2118" stroke="#83a598"/><text x="85" y="${37+i*36}" text-anchor="middle" font-size="10" fill="#ece3d2">Fir ${i+1}</text><line x1="130" y1="${33+i*36}" x2="${i==2?215:175}" y2="${33+i*36}" stroke="#83a598" marker-end="url(#ab)"/>`).join('')}
<rect x="300" y="56" width="115" height="30" rx="5" fill="#1f2616" stroke="#b8bb26"/><text x="357" y="76" text-anchor="middle" font-size="10" fill="#b8bb26">toate eliberate</text>
<text x="150" y="14" font-size="9" fill="#a8997f">blocate până ajunge ultimul</text>
</svg></div>`}

function svgGantt(){const seq=[['P1',3],['P4',3],['P2',3],['P5',3],['P3',3],['P1',3],['P4',3],['P5',3],['P3',3],['P1',3],['P4',2],['P5',3],['P3',3],['P1',3],['P5',3],['P3',1],['P1',2],['P5',3],['P5',2]];
const col={P1:'#83a598',P2:'#b8bb26',P3:'#d8843f',P4:'#d3869b',P5:'#fb4934'};
let x=10;const SCALE=8.1;
return `<div class="diagram"><svg viewBox="0 0 ${10+52*SCALE+20} 90" role="img" aria-label="gantt">
${seq.map(s=>{const w=s[1]*SCALE;const r=`<rect x="${x}" y="20" width="${w}" height="36" fill="${col[s[0]]}" stroke="#1a1714"/><text x="${x+w/2}" y="42" text-anchor="middle" font-size="9" fill="#1a1714" font-weight="bold">${s[0]}</text>`;x+=w;return r}).join('')}
<text x="10" y="72" font-size="9" fill="#a8997f">t=0</text>
<text x="${x-14}" y="72" font-size="9" fill="#a8997f">t=52</text>
</svg></div>`}

function svgKernel(){return `<div class="diagram"><svg viewBox="0 0 420 220" role="img" aria-label="kernel user space">
<rect x="60" y="10" width="300" height="34" rx="6" fill="#2a2118" stroke="#83a598"/><text x="210" y="32" text-anchor="middle" font-size="11" fill="#83a598">Aplicații (user mode, Ring 3)</text>
<rect x="60" y="50" width="300" height="30" rx="6" fill="#221e1a" stroke="#a8997f"/><text x="210" y="69" text-anchor="middle" font-size="10" fill="#ece3d2">biblioteci (libc) — fwrite, write</text>
<rect x="40" y="92" width="340" height="26" rx="4" fill="#2e2515" stroke="#e9b143" stroke-width="2"/><text x="210" y="109" text-anchor="middle" font-size="11" font-weight="bold" fill="#e9b143">— syscall API (trap) —</text>
<rect x="60" y="128" width="300" height="34" rx="6" fill="#1f2616" stroke="#b8bb26"/><text x="210" y="150" text-anchor="middle" font-size="11" fill="#b8bb26">KERNEL (kernel mode, Ring 0)</text>
<rect x="60" y="168" width="300" height="30" rx="6" fill="#2a1a16" stroke="#fb4934"/><text x="210" y="187" text-anchor="middle" font-size="10" fill="#ece3d2">drivere → Hardware (ISA)</text>
</svg></div>`}

function svgSegment(){return `<div class="diagram"><svg viewBox="0 0 440 150" role="img" aria-label="segmentare">
<defs><marker id="ag" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#e9b143"/></marker></defs>
<rect x="15" y="55" width="110" height="40" rx="6" fill="#2a2118" stroke="#83a598"/><text x="70" y="80" text-anchor="middle" font-size="11" fill="#ece3d2">&lt;s=2, d=53&gt;</text>
<rect x="165" y="20" width="120" height="110" rx="6" fill="#221e1a" stroke="#e9b143"/><text x="225" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#e9b143">segment table</text>
<text x="225" y="60" text-anchor="middle" font-size="9" fill="#a8997f">s=2: limit=400</text>
<text x="225" y="78" text-anchor="middle" font-size="9" fill="#a8997f">base=4300</text>
<text x="225" y="104" text-anchor="middle" font-size="9" fill="#ece3d2">53 &lt; 400 ✓</text>
<line x1="125" y1="75" x2="163" y2="75" stroke="#e9b143" marker-end="url(#ag)"/>
<rect x="320" y="55" width="105" height="40" rx="6" fill="#1f2616" stroke="#b8bb26"/><text x="372" y="73" text-anchor="middle" font-size="10" fill="#b8bb26">fizic =</text><text x="372" y="88" text-anchor="middle" font-size="10" fill="#b8bb26">4300+53=4353</text>
<line x1="285" y1="75" x2="318" y2="75" stroke="#e9b143" marker-end="url(#ag)"/>
</svg></div>`}

function svgPaging(){return `<div class="diagram"><svg viewBox="0 0 440 160" role="img" aria-label="paginare">
<defs><marker id="ap" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#e9b143"/></marker></defs>
<rect x="15" y="60" width="120" height="36" rx="6" fill="#2a2118" stroke="#83a598"/><text x="75" y="76" text-anchor="middle" font-size="10" fill="#ece3d2">logic (p, d)</text><text x="75" y="90" text-anchor="middle" font-size="9" fill="#a8997f">p=index, d=offset</text>
<rect x="175" y="20" width="110" height="120" rx="6" fill="#221e1a" stroke="#e9b143"/><text x="230" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#e9b143">tabela pagini</text>
${[0,1,2,3].map((p,i)=>`<text x="230" y="${58+i*20}" text-anchor="middle" font-size="9" fill="#a8997f">pag ${p} → cadru ${[1,4,3,7][i]}</text>`).join('')}
<line x1="135" y1="78" x2="173" y2="78" stroke="#e9b143" marker-end="url(#ap)"/>
<rect x="320" y="60" width="105" height="36" rx="6" fill="#1f2616" stroke="#b8bb26"/><text x="372" y="82" text-anchor="middle" font-size="10" fill="#b8bb26">fizic (f, d)</text>
<line x1="285" y1="78" x2="318" y2="78" stroke="#e9b143" marker-end="url(#ap)"/>
</svg></div>`}

function svgPageFault(){return `<div class="diagram"><svg viewBox="0 0 460 150" role="img" aria-label="page fault">
<defs><marker id="apf" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#e9b143"/></marker></defs>
${[['1. acces pagină','#83a598',10],['2. trap (invalidă)','#fb4934',128],['3. caut pe disc','#a8997f',246],['4. aduc în cadru','#b8bb26',364]].map(s=>`<rect x="${s[2]}" y="40" width="86" height="44" rx="6" fill="#221e1a" stroke="${s[1]}"/><text x="${s[2]+43}" y="66" text-anchor="middle" font-size="9" fill="#ece3d2">${s[0]}</text>`).join('')}
${[96,214,332].map(x=>`<line x1="${x}" y1="62" x2="${x+30}" y2="62" stroke="#e9b143" marker-end="url(#apf)"/>`).join('')}
<text x="230" y="110" text-anchor="middle" font-size="9" fill="#a8997f">5. actualizez tabela → 6. reiau instrucțiunea</text>
</svg></div>`}

function svgFDT(){return `<div class="diagram"><svg viewBox="0 0 360 200" role="img" aria-label="tabela descriptori">
<rect x="80" y="10" width="200" height="180" rx="8" fill="#221e1a" stroke="#e9b143" stroke-width="2"/>
<rect x="80" y="10" width="200" height="28" rx="8" fill="#e9b143"/><text x="180" y="29" text-anchor="middle" font-size="11" font-weight="bold" fill="#1a1714">Tabela descriptori (FDT)</text>
${[['0','stdin','#fb4934'],['1','stdout','#b8bb26'],['2','stderr','#d8843f'],['3','fis1.txt','#83a598'],['4','fis2.txt','#83a598']].map((r,i)=>`<text x="105" y="${62+i*28}" text-anchor="middle" font-size="12" font-weight="bold" fill="${r[2]}">${r[0]}</text><text x="200" y="${62+i*28}" text-anchor="middle" font-size="11" fill="#ece3d2">${r[1]}</text><line x1="90" y1="${72+i*28}" x2="270" y2="${72+i*28}" stroke="#352f28"/>`).join('')}
</svg></div>`}
