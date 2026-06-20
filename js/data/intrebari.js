// ============================================================
//  BANCĂ DE ÎNTREBĂRI PSO
//  - "grila": grilă cu una sau mai multe variante corecte
//  - "deschis": problemă deschisă cu rezolvare model (self-check)
//  Sursă: subiecte reale ATM (2020-2024) + grile conceptuale în stil examen
// ============================================================

const INTREBARI = [

// ---------- PROCESE / FORK ----------
{
  id:"q-fork-ret", tema:"Procese", an:"concept", tip:"grila", multi:false,
  enunt:"Ce valoare returnează <code>fork()</code> în interiorul procesului COPIL?",
  optiuni:["PID-ul copilului","0","PID-ul părintelui","-1"],
  corecte:[1],
  explicatie:"În copil, <code>fork()</code> returnează <b>0</b>. În părinte returnează PID-ul copilului (&gt;0), iar la eroare -1."
},
{
  id:"q-fork-count", tema:"Procese", an:"concept", tip:"grila", multi:false,
  enunt:"Câte procese COPIL se creează dacă bucla rulează fără gardă (fiecare proces forkează la fiecare iterație)?",
  cod:"for(i=0; i<3; i++){\n    pid = fork();   // fara if(pid>0)\n}",
  optiuni:["3 copii","7 copii","8 copii","2 copii"],
  corecte:[1],
  explicatie:"Numărul de procese se dublează la fiecare iterație: 1→2→4→8. Total 2³ = <b>8 procese</b>, deci <b>7 copii</b>. Cu <code>if(pid>0)</code> ar fi exact 3 copii."
},
{
  id:"q-2022-1-1", tema:"Procese", an:"2022", tip:"grila", multi:false,
  enunt:"Care este rezultatul execuției? (procesul copil modifică <code>i</code> în propria copie, părintele își păstrează <code>i</code>)",
  cod:'for (i = 0; i < 3; i++) {\n    if (fork() == 0) {\n        i = i+2;\n        printf("copil i=%d   ", i);\n        exit(1);\n    } else {\n        wait(NULL);\n        printf("parinte i=%d\\n", i);\n    }\n}',
  optiuni:[
    "copil i=2 parinte i=0 / copil i=3 parinte i=1 / copil i=4 parinte i=2",
    "copil i=2 parinte i=0 / copil i=3 parinte i=0 / copil i=4 parinte i=0",
    "copil i=2 parinte i=0 / copil i=2 parinte i=1 / copil i=2 parinte i=2",
    "copil i=2 parinte i=2 / copil i=3 parinte i=3 / copil i=4 parinte i=4"
  ],
  corecte:[0],
  explicatie:"Copilul face <code>i=i+2</code> în <b>copia lui</b> de memorie → tipărește 2,3,4. Părintele NU e afectat → tipărește 0,1,2. <code>wait(NULL)</code> forțează copilul să termine primul. (Examen 2022, Subiectul I, P1.1 — răspuns a)"
},
{
  id:"q-2022-1-2", tema:"Procese", an:"2022", tip:"grila", multi:false,
  enunt:"Se observă că procesul copil își încheie mereu execuția înaintea părintelui. Care linie garantează acest lucru?",
  cod:" 8:     exit(1);\n 9: } else {\n10:     wait(NULL);\n11:     printf(\"parinte i=%d\\n\", i);",
  optiuni:["linia 5: if(fork()==0)","linia 8: exit(1)","linia 10: wait(NULL)","linia 11: printf"],
  corecte:[2],
  explicatie:"<code>wait(NULL)</code> (linia 10) blochează părintele până când copilul se termină → copilul afișează mereu primul. (Examen 2022 P1.2 — răspuns c)"
},
{
  id:"q-2022-1-3", tema:"Procese", an:"2022", tip:"grila", multi:false,
  enunt:"Câte procese vor fi create în total (inclusiv procesul inițial)? Copilul face <code>exit(1)</code> imediat, deci nu mai continuă bucla.",
  optiuni:["4","2","6","8"],
  corecte:[0],
  explicatie:"Părintele forkează o dată la fiecare din cele 3 iterații → 3 copii. Fiecare copil face <code>exit(1)</code> imediat (nu mai forkează). Total = 1 părinte + 3 copii = <b>4</b>. (Examen 2022 P1.3 — răspuns a)"
},

// ---------- MEMORIE ----------
{
  id:"q-mem-localconst", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"În ce zonă de memorie se află o variabilă <b>locală</b> declarată <code>const int d = 31;</code>?",
  optiuni:[".rodata (read-only)","stivă (stack)",".data","heap"],
  corecte:[1],
  explicatie:"O variabilă <b>locală</b> stă pe <b>stivă</b>, chiar dacă e <code>const</code>. <code>const</code> e impus de compilator, nu de hardware. Doar durata <b>statică</b> (globală/static) duce o const în .rodata."
},
{
  id:"q-mem-literal", tema:"Memorie", an:"2023", tip:"grila", multi:false,
  enunt:"În ce zonă este stocat literalul string <code>\"%s\"</code> și ce permisiuni are?",
  optiuni:[".data, RW",".rodata, doar R",".text, R+X","stivă, RW"],
  corecte:[1],
  explicatie:"Literalii string sunt în <b>.rodata</b> (read-only). De aceea scrierea într-un literal (<code>char *p=\"x\"; p[0]='Y';</code>) dă segmentation fault. (Examen 2023 I.3)"
},
{
  id:"q-mem-static", tema:"Memorie", an:"2023", tip:"grila", multi:false,
  enunt:"O variabilă locală <code>static int e = 19;</code> este stocată în:",
  optiuni:["stivă",".bss",".data","heap"],
  corecte:[2],
  explicatie:"<code>static</code> îi dă durată <b>statică</b> (trăiește tot programul). Fiind inițializată cu o valoare <b>≠ 0</b>, merge în <b>.data</b> (RW). Dacă era =0, mergea în .bss."
},

// ---------- ORFAN / ZOMBIE ----------
{
  id:"q-orphan", tema:"Procese", an:"2023", tip:"grila", multi:false,
  enunt:"Un copil face <code>sleep(10)</code>, iar părintele se termină imediat. Ce returnează <code>getppid()</code> în copil după sleep?",
  optiuni:["PID-ul părintelui (mort)","1 (init/systemd)","0","-1"],
  corecte:[1],
  explicatie:"Părintele a murit în timpul sleep → copilul devine <b>orfan</b> și e adoptat de <b>init (PID 1)</b>. Deci <code>getppid()</code> = 1. Nu e zombie (părintele a murit primul). (Examen 2023 I.5)"
},
{
  id:"q-zombie", tema:"Procese", an:"concept", tip:"grila", multi:false,
  enunt:"Când devine un proces ZOMBIE?",
  optiuni:[
    "când părintele moare înaintea lui",
    "când s-a terminat, dar părintele nu a făcut wait()",
    "când face sleep()",
    "când consumă prea mult CPU"
  ],
  corecte:[1],
  explicatie:"Un <b>zombie</b> este un proces terminat al cărui părinte <b>nu a preluat statusul</b> (nu a făcut <code>wait()</code>). Rămân info reziduale (task_struct + PID). Dacă părintele moare primul → e <b>orfan</b>, nu zombie."
},

// ---------- FIRE ----------
{
  id:"q-thread-private", tema:"Fire", an:"concept", tip:"grila", multi:true,
  enunt:"Care dintre următoarele resurse sunt <b>PRIVATE</b> fiecărui fir de execuție? (selecție multiplă)",
  optiuni:["stiva (stack)","variabilele globale","regiștrii și PC","heap-ul"],
  corecte:[0,2],
  explicatie:"Fiecare fir are <b>stiva</b>, <b>regiștrii</b> și <b>program counter</b> proprii. Variabilele globale și heap-ul sunt <b>partajate</b> între fire (de aceea apar race conditions)."
},
{
  id:"q-thread-exit", tema:"Fire", an:"concept", tip:"grila", multi:false,
  enunt:"Ce se întâmplă dacă un singur fir dintr-un proces apelează <code>exit()</code>?",
  optiuni:[
    "se termină doar firul respectiv",
    "se termină TOATE firele procesului",
    "se creează un proces zombie",
    "celelalte fire continuă neafectate"
  ],
  corecte:[1],
  explicatie:"<code>exit()</code> are efect <b>per proces</b> → se termină <b>toate</b> firele. Pentru a termina doar firul curent se folosește <code>pthread_exit()</code>."
},

// ---------- SEMNALE ----------
{
  id:"q-sig-dfl", tema:"Semnale", an:"2022", tip:"grila", multi:false,
  enunt:"După <code>signal(SIGINT, SIG_DFL)</code>, ce face apăsarea Ctrl+C?",
  optiuni:[
    "rulează un handler",
    "este ignorată complet",
    "termină procesul (comportament implicit)",
    "trimite procesul în background"
  ],
  corecte:[2],
  explicatie:"<code>SIG_DFL</code> = acțiunea <b>implicită</b>, care pentru SIGINT înseamnă <b>terminarea</b> procesului. (Examen 2022 I.5)"
},
{
  id:"q-sig-ign", tema:"Semnale", an:"concept", tip:"grila", multi:false,
  enunt:"Ce face <code>signal(SIGINT, SIG_IGN)</code>?",
  optiuni:[
    "termină procesul la Ctrl+C",
    "ignoră Ctrl+C (nu se întâmplă nimic)",
    "rulează handlerul implicit",
    "blochează toate semnalele"
  ],
  corecte:[1],
  explicatie:"<code>SIG_IGN</code> face ca semnalul să fie <b>ignorat</b> — Ctrl+C nu mai are niciun efect. (Notă: SIGKILL și SIGSTOP nu pot fi ignorate.)"
},
{
  id:"q-sig-return", tema:"Semnale", an:"2022", tip:"grila", multi:false,
  enunt:"Ce returnează apelul <code>last = signal(SIGINT, handler)</code> în variabila <code>last</code>?",
  optiuni:[
    "handlerul ANTERIOR (cel dinainte de apel)",
    "noul handler (handler)",
    "întotdeauna SIG_DFL",
    "0 la succes"
  ],
  corecte:[0],
  explicatie:"<code>signal()</code> setează noul handler ȘI <b>returnează handlerul anterior</b>. De aceea se poate salva în <code>last</code> și restaura ulterior cu <code>signal(SIGINT, last)</code>. (Examen 2022 I.5)"
},

// ---------- SINCRONIZARE / SEMAFOARE ----------
{
  id:"q-sem-mutex", tema:"Sincronizare", an:"2020", tip:"grila", multi:false,
  enunt:"Cum se folosește corect un semafor pentru protecția unei secțiuni critice (excludere mutuală)?",
  optiuni:[
    "Init 0; intri după down; ieși prin up",
    "Init 0; intri după up; ieși după down",
    "Init 1; intri după down (wait); ieși prin up (post)",
    "Init 1; intri după up; ieși după down"
  ],
  corecte:[2],
  explicatie:"Pentru excludere mutuală: inițializezi cu <b>1</b>, faci <b>down/wait</b> la intrare (iei cheia) și <b>up/post</b> la ieșire (o pui înapoi). (Examen 2020 I.1 — răspuns c)"
},
{
  id:"q-sem-zero", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"Ce se întâmplă când un fir face <code>sem_wait(s)</code> pe un semafor cu valoarea 0?",
  optiuni:[
    "valoarea devine -1",
    "firul se blochează până cineva face sem_post",
    "apelul eșuează cu eroare",
    "valoarea devine 1"
  ],
  corecte:[1],
  explicatie:"Valoarea unui semafor <b>nu poate scădea sub 0</b>. La 0, <code>sem_wait</code> (P/down) <b>blochează</b> firul în coadă până când un <code>sem_post</code> (V/up) îl deblochează."
},
{
  id:"q-2023-i2", tema:"Sincronizare", an:"2023", tip:"grila", multi:false,
  enunt:"Thread A: <code>wait(s1) '1' post(s2) wait(s1) '2' post(s2)</code>. Thread B: <code>wait(s2) '3' post(s1) wait(s2) '4' post(s1)</code>. Init <code>s1=1, s2=0</code>. Ce șir se tipărește?",
  optiuni:["1324 (repetat: 13241324...)","1234","13421342...","ordine aleatoare"],
  corecte:[0],
  explicatie:"B se blochează imediat (s2=0). A: '1', post(s2). B deblocat: '3', post(s1). A: '2', post(s2). B: '4'... → ordinea forțată <b>1-3-2-4</b> repetat. (Examen 2023 I.2 — răspuns a/b)"
},
{
  id:"q-2022-i2", tema:"Sincronizare", an:"2022", tip:"grila", multi:false,
  enunt:"Semafoare Dijkstra: Proces A tipărește '1' apoi '2', Proces B tipărește '3' apoi '4'. <code>sem_1=1, sem_2=0</code>, structură down/up identică cu problema clasică. Ce șir poate apărea la ieșire?",
  optiuni:["1234","13241324...","13421342...","ordine nedeterministă"],
  corecte:[1],
  explicatie:"Aceeași logică ca în 2023: ordinea e forțată de semafoare la <b>1-3-2-4</b> repetat → <b>13241324...</b> (varianta d) '1324' este primul ciclu). (Examen 2022 I.2)"
},

// ---------- PLANIFICARE ----------
{
  id:"q-2023-i4", tema:"Planificare", an:"2023", tip:"grila", multi:false,
  enunt:"P1..P5, timpi 14,3,10,8,17; priorități 5,3,1,4,2 (5=max); cuanta=3, RR pe priorități. Care e prima rundă de execuție?",
  optiuni:["P1,P4,P2,P5,P3","P1,P2,P3,P4,P5","P3,P5,P2,P4,P1","P5,P4,P3,P2,P1"],
  corecte:[0],
  explicatie:"În RR pe priorități, ordinea în tur e dată de prioritate descrescătoare: P1(5),P4(4),P2(3),P5(2),P3(1) → <b>P1,P4,P2,P5,P3</b>. Secvența completă duce la varianta c din examen. (Examen 2023 I.4)"
},
{
  id:"q-rr-p2", tema:"Planificare", an:"2023", tip:"grila", multi:false,
  enunt:"În aceeași problemă (cuanta=3), P2 are timp de execuție 3s. De câte ori apare P2 în toată secvența?",
  optiuni:["o singură dată","de 2 ori","de 3 ori","de 5 ori"],
  corecte:[0],
  explicatie:"P2 = 3s = exact o cuantă → e servit complet în <b>primul tur</b> și apoi dispare. Orice variantă care repetă P2 după turul 1 este greșită — truc de eliminare rapidă."
},
{
  id:"q-sched-ctx", tema:"Planificare", an:"concept", tip:"grila", multi:false,
  enunt:"Ce tranziție de stare provoacă <code>sleep()</code>, garantând o schimbare de context?",
  optiuni:[
    "running → ready",
    "running → blocked (waiting)",
    "ready → running",
    "niciuna, sleep nu cedează CPU"
  ],
  corecte:[1],
  explicatie:"<code>sleep()</code> este o operație <b>blocantă</b> → procesul trece din <b>running în blocked/waiting</b> și cedează CPU-ul → schimbare de context garantată. (Util la 2023 I.5)"
},
{
  id:"q-sched-algo", tema:"Planificare", an:"concept", tip:"grila", multi:false,
  enunt:"Care algoritm de planificare este <b>versiunea preemptivă a SJF</b>?",
  optiuni:["FCFS","Round-Robin","SRTF (Shortest Remaining Time First)","planificare pe priorități"],
  corecte:[2],
  explicatie:"<b>SRTF</b> este SJF preemptiv: dacă sosește un job mai scurt decât timpul rămas al celui curent, îl întrerupe. Obține un timp mediu de așteptare și mai mic decât SJF."
},

// ---------- DEADLOCK ----------
{
  id:"q-coffman", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"Care dintre următoarele NU este una dintre cele 4 condiții Coffman necesare pentru deadlock?",
  optiuni:["Excludere mutuală","Hold and wait","Circular wait","Preempțiunea resurselor"],
  corecte:[3],
  explicatie:"Cele 4 condiții sunt: excludere mutuală, hold and wait, <b>no preemption</b> (NU se pot lua resursele cu forța) și circular wait. <b>Preempțiunea</b> ar fi exact opusul — dacă ai putea prelua resursele, deadlock-ul s-ar rupe."
},
{
  id:"q-deadlock-fix", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"Care e cea mai practică metodă de a preveni deadlock-ul când mai multe fire iau aceleași 2 mutex-uri A și B?",
  optiuni:[
    "fiecare fir ocupă lacătele într-o ordine globală fixă (mereu A apoi B)",
    "fiecare fir ia lacătele în ordine inversă",
    "se folosesc spinlock-uri în loc de mutex",
    "se mărește cuanta de timp"
  ],
  corecte:[0],
  explicatie:"Impunând o <b>ordine globală</b> de ocupare (toți iau A înainte de B), spargi condiția de <b>circular wait</b> → deadlock-ul devine imposibil. Dacă firele iau lacătele în ordini diferite, apare exact ciclul care duce la deadlock."
},
// ---------- PRODUCATOR-CONSUMATOR ----------
{
  id:"q-prodcons-init", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"În problema producător-consumator cu buffer de capacitate N, cum se inițializează semafoarele <code>empty</code>, <code>full</code> și <code>mutex</code>?",
  optiuni:[
    "empty=N, full=0, mutex=1",
    "empty=0, full=N, mutex=1",
    "empty=N, full=N, mutex=0",
    "empty=1, full=1, mutex=N"
  ],
  corecte:[0],
  explicatie:"<code>empty=N</code> (toate locurile libere la început), <code>full=0</code> (niciun element), <code>mutex=1</code> (acces exclusiv). Mereu <code>empty+full=N</code>."
},
{
  id:"q-prodcons-order", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"De ce trebuie ca producătorul să facă <code>wait(empty)</code> ÎNAINTE de <code>wait(mutex)</code>, nu invers?",
  optiuni:[
    "pentru viteză",
    "altfel, un producător blocat pe buffer plin ar ține mutexul → deadlock",
    "nu contează ordinea",
    "ca să consume mai puțină memorie"
  ],
  corecte:[1],
  explicatie:"Dacă ai face <code>wait(mutex)</code> întâi și buffer-ul e plin, producătorul se blochează pe <code>wait(empty)</code> <b>ținând mutexul</b> → niciun consumator nu mai poate intra să scoată un element → <b>deadlock</b>."
},
// ---------- IPC ----------
{
  id:"q-mmap", tema:"IPC", an:"2024", tip:"grila", multi:false,
  enunt:"De ce este alocat semaforul prin <code>mmap(..., MAP_SHARED, ...)</code> într-o aplicație care folosește <code>fork()</code>?",
  optiuni:[
    "pentru a aloca mai rapid memoria",
    "ca semaforul să fie în memorie partajată, vizibil în toate procesele după fork",
    "pentru că semafoarele nu pot fi variabile globale",
    "pentru a evita zombie-urile"
  ],
  corecte:[1],
  explicatie:"<code>fork()</code> ar <b>duplica</b> un semafor obișnuit → fiecare proces ar avea copia lui și sincronizarea inter-proces nu ar funcționa. <code>mmap(MAP_SHARED)</code> + <code>sem_init(pshared=1)</code> pun semaforul în memorie cu adevărat comună. (Examen 2024)"
},
// ---------- MUTEX / CONDVAR ----------
{
  id:"q-mutex-sem", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"Care e diferența principală dintre un mutex și un semafor binar?",
  optiuni:[
    "mutexul are conceptul de proprietate (cine face lock trebuie să facă unlock)",
    "semaforul binar e mai rapid întotdeauna",
    "mutexul poate lua valori mai mari ca 1",
    "nu există nicio diferență"
  ],
  corecte:[0],
  explicatie:"Mutexul are <b>proprietate</b> (ownership) — firul care l-a blocat trebuie să-l deblocheze, e dedicat excluderii mutuale. Semaforul binar e doar un contor 0/1, fără proprietate, și poate fi folosit și pentru semnalizare/ordonare între fire."
},
{
  id:"q-condvar-while", tema:"Sincronizare", an:"concept", tip:"grila", multi:false,
  enunt:"De ce se verifică predicatul cu <code>while</code> (nu <code>if</code>) înainte de <code>pthread_cond_wait</code>?",
  optiuni:[
    "din obișnuință, e echivalent cu if",
    "pentru a te proteja de treziri false (spurious wakeups) și re-verifica condiția",
    "pentru că if nu compilează acolo",
    "ca să rulezi handlerul de mai multe ori"
  ],
  corecte:[1],
  explicatie:"La trezire, condiția ar putea fi încă falsă (treziri false sau alt fir a schimbat starea). Bucla <code>while</code> re-verifică predicatul după fiecare trezire, garantând corectitudinea."
},

// ---------- SISTEM DE OPERARE ----------
{
  id:"q-syscall-boundary", tema:"Sistem de operare", an:"concept", tip:"grila", multi:false,
  enunt:"La ce nivel se află granița dintre user space și kernel space?",
  optiuni:["la nivelul bibliotecii libc","la nivelul apelurilor de sistem (syscall API)","la nivelul driverelor","la nivelul hardware-ului"],
  corecte:[1],
  explicatie:"Granița user/kernel e exact la <b>syscall API</b>. Aplicațiile (user mode) cer servicii kernelului prin apeluri de sistem, care fac tranziția în kernel mode (trap)."
},
{
  id:"q-usermode-error", tema:"Sistem de operare", an:"concept", tip:"grila", multi:false,
  enunt:"Ce se întâmplă când un program din user mode face o eroare gravă, față de o eroare în kernel mode?",
  optiuni:[
    "user mode: cade doar acel program; kernel mode: poate pica tot sistemul",
    "ambele pică tot sistemul",
    "user mode pică sistemul, kernel mode nu",
    "niciuna nu are efect"
  ],
  corecte:[0],
  explicatie:"În <b>user mode</b> procesele sunt izolate → cade doar programul respectiv. În <b>kernel mode</b> nu există izolare → un defect poate compromite tot sistemul (TCB)."
},
{
  id:"q-microkernel", tema:"Sistem de operare", an:"concept", tip:"grila", multi:false,
  enunt:"Care e un avantaj al unui microkernel față de un kernel monolitic?",
  optiuni:[
    "este mai rapid",
    "are TCB (Trusted Computing Base) mai mic → mai sigur și modular",
    "are tot codul în kernel mode",
    "nu folosește IPC"
  ],
  corecte:[1],
  explicatie:"Microkernelul ține în kernel doar IPC, memorie virtuală și planificare; restul (FS, drivere) rulează ca servere în user mode → <b>TCB redus</b>, modular. Dezavantaj: mai lent (comunicare prin IPC). Monoliticul e eficient dar cu TCB mare."
},

// ---------- GESTIUNEA MEMORIEI ----------
{
  id:"q-mmu-reloc", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"O adresă logică 346, cu relocation register 14000. Care e adresa fizică?",
  optiuni:["346","14000","14346","13654"],
  corecte:[2],
  explicatie:"MMU adună relocation register la adresa logică: 14000 + 346 = <b>14346</b>."
},
{
  id:"q-page-size", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Dacă offset-ul în pagină este reprezentat pe 12 biți, ce dimensiune are pagina?",
  optiuni:["12 octeți","2 KB","4 KB","12 KB"],
  corecte:[2],
  explicatie:"Dimensiunea paginii = 2<sup>(biți de offset)</sup> = 2<sup>12</sup> = <b>4096 octeți = 4 KB</b>. (IA-32 folosește exact 12 biți de offset.)"
},
{
  id:"q-segment-trans", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Segment table: segmentul 2 are limit=400, base=4300. Acces la &lt;segment=2, offset=53&gt;. Adresa fizică?",
  optiuni:["4353","4247","453","trap (eroare)"],
  corecte:[0],
  explicatie:"Cum 53 &lt; 400 (offset &lt; limit), accesul e valid → adresa fizică = base + offset = 4300 + 53 = <b>4353</b>."
},
{
  id:"q-segment-trap", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Segment table: segmentul 1 are limit=400, base=6300. Acces la &lt;segment=1, offset=500&gt;. Ce se întâmplă?",
  optiuni:["adresa fizică 6800","adresa fizică 6300","trap — addressing error","adresa fizică 500"],
  corecte:[2],
  explicatie:"500 ≥ 400 (offset ≥ limit) → acces în afara segmentului → <b>trap (addressing error)</b>. Verificarea offset &lt; limit eșuează."
},
{
  id:"q-fragmentare", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Ce tip de fragmentare apare la PAGINARE?",
  optiuni:[
    "fragmentare externă (spațiu între blocuri)",
    "fragmentare internă (~1/2 pagină în medie)",
    "ambele tipuri",
    "niciun fel de fragmentare"
  ],
  corecte:[1],
  explicatie:"Paginarea folosește pagini de dimensiune fixă → <b>fără fragmentare externă</b>, dar cu <b>fragmentare internă</b> (ultima pagină a unui proces e rar plină complet, ~1/2 pagină risipită în medie). Segmentarea, în schimb, suferă de fragmentare externă."
},
{
  id:"q-firstfit", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"First-fit. Procese: P1=90, P2=50, P3=30, P4=40. Blocuri libere (în ordine): 20, 100, 40, 200, 10. Care proces NU poate fi alocat?",
  optiuni:["P1","P2","P3","P4"],
  corecte:[3],
  explicatie:"P1(90)→bloc 100, P2(50)→bloc 200, P3(30)→bloc 40. Rămân blocurile 20 și 10, ambele prea mici pentru <b>P4(40)</b> → P4 rămâne nealocat."
},

// ---------- MEMORIA VIRTUALĂ ----------
{
  id:"q-pf-vs-segv", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Care e diferența dintre un page fault și un segmentation fault (SIGSEGV)?",
  optiuni:[
    "sunt același lucru",
    "page fault e o excepție normală tratabilă; segfault e un acces ilegal",
    "page fault omoară procesul; segfault e tratabil",
    "ambele aduc pagina de pe disc"
  ],
  corecte:[1],
  explicatie:"<b>Page fault</b> = excepție normală: SO aduce pagina lipsă și reia instrucțiunea. <b>Segfault (SIGSEGV)</b> = acces ilegal (în afara zonelor alocate sau fără permisiune) → procesul e terminat."
},
{
  id:"q-pf-minor-major", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Care page fault e tratat RAPID (fără acces la disc)?",
  optiuni:[
    "major — pagina trebuie adusă din swap",
    "minor — cadrul e deja în memorie, lipsește doar maparea",
    "ambele necesită acces la disc",
    "niciunul"
  ],
  corecte:[1],
  explicatie:"<b>Minor page fault</b>: cadrul e deja în RAM (ex. bibliotecă partajată) — se face doar maparea, rapid. <b>Major</b>: pagina trebuie adusă de pe disc (swap/demand) — lent."
},
{
  id:"q-cow-when", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"La fork() cu Copy-on-Write, când se copiază efectiv o pagină partajată?",
  optiuni:[
    "imediat la fork()",
    "la prima SCRIERE în pagină (printr-un page fault)",
    "niciodată",
    "la apelul exec()"
  ],
  corecte:[1],
  explicatie:"Paginile sunt partajate read-only după fork. La <b>prima scriere</b>, un page fault declanșează crearea unei copii read-write pentru procesul care scrie. Citirile nu copiază nimic."
},
{
  id:"q-fifo-faults", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Algoritm FIFO, 3 cadre, șir de referințe: 1 2 3 4 1 2 5. Câte page fault-uri?",
  cod:"[1]      fault\n[1 2]    fault\n[1 2 3]  fault\n[2 3 4]  fault (scot 1)\n[3 4 1]  fault (scot 2)\n[4 1 2]  fault (scot 3)\n[1 2 5]  fault (scot 4)",
  optiuni:["3","5","7","4"],
  corecte:[2],
  explicatie:"Toate cele 7 referințe produc fault (niciuna nu mai e în cadre la momentul accesului) → <b>7 page fault-uri</b>. FIFO înlocuiește mereu pagina cea mai veche."
},
{
  id:"q-mmap-alloc", tema:"Memorie", an:"concept", tip:"grila", multi:false,
  enunt:"Ce alocă efectiv un apel <code>mmap</code> în demand paging?",
  optiuni:[
    "doar pagini virtuale; cadrele fizice se alocă la primul acces",
    "imediat toate cadrele fizice",
    "doar memorie pe disc",
    "nimic, e o operație fără efect"
  ],
  corecte:[0],
  explicatie:"<code>mmap</code> alocă doar <b>pagini virtuale</b> (lazy). Cadrul fizic se alocă <b>abia la primul acces</b>, în page-fault handler (demand paging)."
},

// ---------- SISTEM DE FIȘIERE ----------
{
  id:"q-fd-3", tema:"Sistem de fișiere", an:"concept", tip:"grila", multi:false,
  enunt:"Într-un program proaspăt pornit, primul <code>fopen</code> reușit întoarce descriptorul fd = ?",
  optiuni:["0","1","3","depinde aleatoriu"],
  corecte:[2],
  explicatie:"Descriptorii <b>0, 1, 2</b> sunt deja ocupați (stdin/stdout/stderr). <code>open</code> întoarce mereu cel mai mic descriptor liber → primul <code>fopen</code> primește <b>3</b>, al doilea 4."
},
{
  id:"q-fd-reuse", tema:"Sistem de fișiere", an:"concept", tip:"grila", multi:false,
  enunt:"Deschizi un fișier (fd=3), îl închizi cu <code>fclose</code>, apoi deschizi alt fișier. Ce descriptor primește al doilea?",
  optiuni:["4","3","5","2"],
  corecte:[1],
  explicatie:"După <code>fclose</code>, descriptorul 3 se eliberează. <code>open</code> alege cel mai mic descriptor liber → din nou <b>3</b>."
},
{
  id:"q-dup2", tema:"Sistem de fișiere", an:"concept", tip:"grila", multi:false,
  enunt:"De ce este <code>dup2(fd, STDOUT_FILENO)</code> mai sigur decât varianta cu <code>dup</code> pentru redirectare?",
  optiuni:[
    "e mai rapid",
    "specifică explicit descriptorul țintă, fără să depindă de 'primul descriptor liber'",
    "nu închide fișierul",
    "funcționează doar cu pipe-uri"
  ],
  corecte:[1],
  explicatie:"<code>dup2</code> indică <b>explicit</b> descriptorul țintă (ex. 1). <code>dup</code> depinde de a închide întâi STDOUT ca să prindă descriptorul 1 liber → fragil, expus la race conditions."
},
{
  id:"q-dentry", tema:"Sistem de fișiere", an:"concept", tip:"grila", multi:false,
  enunt:"Ce conține o intrare de director (dentry)?",
  optiuni:[
    "numele fișierului + numărul de inode",
    "tot conținutul fișierului",
    "permisiunile și timestamp-urile",
    "blocurile de date"
  ],
  corecte:[0],
  explicatie:"Un <b>dentry</b> = pereche <b>{ nume fișier, număr de inode }</b> — face legătura nume → inode. Metadatele (owner, timpi, permisiuni, tip) sunt în <b>inode</b>, NU în dentry."
},
{
  id:"q-inode-name", tema:"Sistem de fișiere", an:"concept", tip:"grila", multi:false,
  enunt:"Ce NU conține un inode?",
  optiuni:["owner-ul","permisiunile","numele fișierului","pointerii către blocurile de date"],
  corecte:[2],
  explicatie:"Inode-ul conține metadate (owner, timpi, permisiuni, tip, pointeri la blocuri) DAR <b>nu și numele</b> — numele e în dentry. De aceea un inode poate avea mai multe nume (hard links)."
},
{
  id:"q-cursor", tema:"Sistem de fișiere", an:"concept", tip:"grila", multi:false,
  enunt:"Cursorul de fișier (file offset) este partajat…",
  optiuni:[
    "între procese diferite care deschid fișierul",
    "între firele aceluiași proces, dar NU între procese",
    "niciodată",
    "doar pe Windows"
  ],
  corecte:[1],
  explicatie:"Cursorul NU e partajat între <b>procese</b> (fiecare are cursorul lui), DAR <b>este partajat între firele</b> aceluiași proces (au aceeași tabelă de descriptori)."
},

// ============================================================
//  PROBLEME DESCHISE (self-check cu rezolvare model)
// ============================================================
{
  id:"d-2023-i1", tema:"Procese", an:"2023", tip:"deschis",
  enunt:"Pentru codul de mai jos: (a) Ce face <code>fork()</code>? (b) Ce valori poate returna? (c) Câte procese copil se creează dacă elimini <code>if(pid>0)</code>?",
  cod:'int main() {\n    int i; int pid=1;\n    for(i=0;i<3;i++){\n        if (pid>0)\n            pid=fork();\n    }\n    printf("proces %d cu parinte %d\\n",getpid(),getppid());\n    while(1){}\n}',
  raspuns:"<b>a)</b> <code>fork()</code> creează un proces copil — o clonă a părintelui (cod, date, stivă, descriptori duplicate). După apel ambele procese continuă din același punct.<br><br><b>b)</b> Returnează <b>0</b> în copil, <b>PID-ul copilului (&gt;0)</b> în părinte, <b>-1</b> la eroare.<br><br><b>c)</b> Fără <code>if(pid&gt;0)</code>, fiecare proces forkează la fiecare iterație → 2³ = 8 procese → <b>7 copii</b>. Cu gardă, doar părintele forkează → exact <b>3 copii</b>."
},
{
  id:"d-2023-i3", tema:"Memorie", an:"2023", tip:"deschis",
  enunt:"Precizează zona de memorie și permisiunile pentru fiecare element:",
  cod:'int a = 4;\nconst b = 23;\nint main() {\n    char c[100];\n    const int d = 31;\n    static int e = 19;\n    scanf("%s", c);\n    printf("%s: %d\\n", c, a+b+d+e);\n}',
  raspuns:"<b>a)</b> <code>a</code> → <b>.data</b>, RW (global init ≠0)<br><b>b)</b> <code>b</code> → <b>.rodata</b>, R (global const)<br><b>c)</b> <code>c</code> → <b>stivă</b>, RW (local)<br><b>d)</b> <code>d</code> → <b>stivă</b>, RW (local, deși const!)<br><b>e)</b> <code>e</code> → <b>.data</b>, RW (static init ≠0)<br><b>f)</b> <code>\"%s\"</code> → <b>.rodata</b>, R (literal)<br><b>g)</b> cod main → <b>.text</b>, R+X"
},
{
  id:"d-2023-i5e", tema:"Procese", an:"2023", tip:"deschis",
  enunt:"Sistem cu un singur nucleu. Descrie o planificare a celor 2 procese (părinte + copil cu <code>sleep(10)</code>) cu cel puțin 2 schimbări de context, indicând stările (running/ready/blocked).",
  raspuns:"<b>Părinte:</b> running → (termină) — execută printf-uri și iese.<br><b>Copil:</b> ready → running (printf) → <b>blocked</b> (sleep 10) → ready → running (printf final) → terminat.<br><br><b>Schimbări de context:</b><br>① copilul intră în <code>sleep</code> → se blochează → CPU trece la părinte (sau invers).<br>② copilul se trezește după 10s → CPU revine la copil.<br><br>Cheia: <code>sleep(10)</code> forțează starea <b>blocked</b>, garantând schimbările de context. Bonus: părintele moare în timpul sleep → copilul devine orfan (PPID=1)."
},
{
  id:"d-2022-i5", tema:"Semnale", an:"2022", tip:"deschis",
  enunt:"Cod cu protecția unei secțiuni critice. Ce face Ctrl+C: (1) imediat după lansare; (2) în timpul <code>do_something_important()</code>; (3) după ce <code>exec_crit_func()</code> s-a terminat?",
  cod:'void handler(){ do_nothing(); }\nvoid exec_crit_func(){\n    do_something_important();\n    signal(SIGINT, last);\n}\nint main(){\n    signal(SIGINT, SIG_DFL);\n    while(1){\n        read(0, opt, 10);\n        if(strcmp(opt, ":i")){\n            last = signal(SIGINT, handler);\n            exec_crit_func();\n        }\n    }\n}',
  raspuns:"<b>(1) Imediat după lansare:</b> SIGINT e pe <code>SIG_DFL</code> → Ctrl+C <b>TERMINĂ</b> procesul.<br><br><b>(2) În timpul funcției critice:</b> tocmai s-a făcut <code>signal(SIGINT, handler)</code> → Ctrl+C rulează <code>handler()</code> care nu face nimic → procesul <b>CONTINUĂ</b> (secțiune protejată).<br><br><b>(3) După <code>exec_crit_func()</code>:</b> funcția a restaurat <code>signal(SIGINT, last)</code>, iar <code>last = SIG_DFL</code> → Ctrl+C <b>TERMINĂ</b> din nou procesul.<br><br>Tipar clasic: dezarmezi Ctrl+C înainte de secțiunea critică (salvând handlerul vechi în <code>last</code>) și îl rearmezi după."
},
{
  id:"d-2024-ii", tema:"Sincronizare", an:"2024", tip:"deschis",
  enunt:"Server cu 2 procese care lansează câte un fir per cerere. Folosește un semafor partajat prin <code>mmap</code>, un mutex și <code>fork</code>. Întrebări cheie: rolul semaforului, rolul mutexului, de ce <code>mmap</code>, de ce 2× <code>wait(NULL)</code>.",
  cod:'void *p = mmap(NULL, sizeof(sem_t), PROT_READ|PROT_WRITE,\n               MAP_ANONYMOUS|MAP_SHARED, -1, 0);\nmy_sem = p;\nsem_init(my_sem, 1, MAX_LOAD);   // MAX_LOAD = 5\npthread_mutex_init(&mutex, NULL);\npid = fork();\nif (pid != 0) pid = fork();      // -> 2 procese copil\n...\nsem_wait(my_sem);  pthread_create(...);   // in copii\n...\nwait(NULL); wait(NULL);          // in parinte',
  raspuns:"<b>Semaforul <code>my_sem</code> (init MAX_LOAD=5):</b> semafor <b>numărător</b> care limitează numărul de cereri/fire servite simultan la 5 (deservire limitată). Fiecare fir face <code>sem_wait</code> înainte să pornească.<br><br><b>Mutexul:</b> protejează secțiunea critică din <code>thread_function</code> (incrementarea lui <code>response++</code> și log-ul) — fără el, firele ar avea <b>race condition</b> pe variabila partajată.<br><br><b>mmap (MAP_SHARED|MAP_ANONYMOUS):</b> alocă semaforul în <b>memorie partajată între procese</b> (nu doar între fire). Fără asta, fiecare proces ar avea propria copie a semaforului după <code>fork</code>, iar limitarea globală nu ar funcționa. <code>pshared=1</code> la <code>sem_init</code> confirmă partajarea inter-proces.<br><br><b>2× <code>wait(NULL)</code>:</b> părintele a creat <b>2 procese copil</b> (prin dublul fork) → trebuie să aștepte ambele ca să nu rămână zombie. Eliminând un <code>wait</code>, un copil ar putea deveni zombie.<br><br><b>De ce rezultate diferite la rulări repetate (A vs B):</b> firele și procesele sunt planificate <b>nedeterminist</b> → ordinea afișărilor și intercalarea diferă de la o rulare la alta."
},
{
  id:"d-2020-dentry", tema:"Sistem de fișiere", an:"2020", tip:"deschis",
  enunt:"Un sistem de fișiere are un director rădăcină, 5 subdirectoare, iar fiecare subdirector conține 5 fișiere. Câte dentry-uri (directory entries) are sistemul de fișiere? (Examen 2020)",
  raspuns:"Un <b>dentry</b> = o intrare {nume, inode} dintr-un director. Numărăm:<br><br><b>Intrări cu nume propriu:</b> 5 subdirectoare + (5×5) = 25 fișiere = <b>30</b><br><b>Intrări „.\"</b> (fiecare director se referă la sine): 1 rădăcină + 5 subdir = <b>6</b><br><b>Intrări „..\"</b> (fiecare subdirector se referă la părinte; rădăcina nu are părinte separat): <b>5</b><br><br><b>Total = 30 + 6 + 5 = 41 dentry-uri.</b> (Răspuns barem: 41)<br><br><i>Idee cheie:</i> fișierele NU au dentry propriu pentru ele însele — sunt referite prin dentry-ul din directorul părinte; doar directoarele au „.\" și „..\"."
},
{
  id:"d-paging-trans", tema:"Memorie", an:"concept", tip:"deschis",
  enunt:"Un sistem are spațiu de adrese pe 16 biți și pagini de 256 octeți. (a) Câți biți are offset-ul? (b) Câți biți are numărul paginii? (c) Câte intrări are tabela de pagini? (d) Dacă adresa logică 0x1A2B are pagina mapată la cadrul 0x0C, care e adresa fizică?",
  raspuns:"<b>a)</b> Pagină de 256 = 2<sup>8</sup> octeți → offset pe <b>8 biți</b>.<br><b>b)</b> Adresa 16 biți − 8 biți offset = <b>8 biți</b> pentru numărul paginii.<br><b>c)</b> 2<sup>8</sup> = <b>256 intrări</b> în tabela de pagini.<br><b>d)</b> Adresa 0x1A2B: octetul superior = pagina 0x1A, offset = 0x2B. Pagina 0x1A → cadrul 0x0C. Adresa fizică = cadru × dim_pagină + offset = 0x0C × 256 + 0x2B = 0x0C2B = <b>3115 (zecimal)</b>. (Pe scurt: înlocuiești biții de pagină cu biții de cadru, păstrând offset-ul: 0x0C2B.)"
}
];
