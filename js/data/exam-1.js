// ============================================================
//  Model 1 — Prog/OOP/SDA + Arhitecturi · Rețele · PSO
// ============================================================
SUBIECTE.push({
  id: "model-1",
  navTitlu: "Model 1",
  titlu: "Model 1 — Examen de licență",
  combo: "Prog/OOP/SDA + Arhitecturi · Rețele · PSO",
  rezumat: "Secvențe C/C++ (pointeri, polimorfism, operații pe biți), AVL și o problemă de cache cu mapare directă; VLSM + traseu ARP/DNS/TCP; PSO în format 2024 (cod concurent + 6 întrebări).",
  html: `
<div class="exam-meta">
  <span class="info">⏱️ Timp: <b>3 ore</b></span>
  <span class="info">📋 <b>3 subiecte</b>, fiecare <b>10 puncte</b> (1 din oficiu)</span>
  <span class="info">✍️ Se răspunde la toate subiectele</span>
</div>
<p class="muted">Combinație: <b>Programare C / OOP C++ / SDA + o problemă de Arhitecturi</b> · <b>Rețele &amp; protocoale</b> · <b>PSO</b>. Fiecare subiect are rezolvarea ascunsă — încearcă întâi singur, apoi verifică.</p>

<!-- ============================ SUBIECTUL I ============================ -->
<h2>Subiectul I — Programare, OOP, SDA și Arhitecturi <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (1.5p) Precizați și justificați ce afișează programul. Dacă există o eroare, explicați cauza și propuneți o corecție care nu schimbă logica, apoi dați rezultatul final. (Se consideră toate antetele incluse.)</p>
<pre class="code" data-lang="c">void aloca(int *p, int n){
    p = (int*)malloc(n * sizeof(int));      /* alocare */
    for(int i = 0; i &lt; n; i++) p[i] = i * i;
}
int main(void){
    int *v = NULL;
    aloca(v, 5);
    printf("%d\\n", v[2]);
    return 0;
}</pre>

<p class="subq">b) (1.5p) Ce afișează secvența? Justificați prin tipul legării (statică vs dinamică).</p>
<pre class="code" data-lang="cpp">class Baza {
public:
    void afis(){ cout &lt;&lt; "Baza "; }
    virtual void info(){ cout &lt;&lt; "info-Baza "; }
};
class Deriv : public Baza {
public:
    void afis(){ cout &lt;&lt; "Deriv "; }
    void info() override { cout &lt;&lt; "info-Deriv "; }
};
int main(){
    Baza *p = new Deriv();
    p-&gt;afis();
    p-&gt;info();
}</pre>

<p class="subq">c) (1p) Ce afișează? Lucrați pe biți și exprimați rezultatele în hexazecimal.</p>
<pre class="code" data-lang="c">int n = 2025;
printf("%X %X %X\\n", n ^ 0x3F, n &amp; 0x3F, n | 0x3F);</pre>

<p class="subq">d) (2.5p) Se inserează, în această ordine, cheile <b>10, 20, 30, 40, 50, 25</b> într-un <b>arbore AVL</b> inițial vid. Precizați, după fiecare inserare care produce dezechilibru, tipul de rotație efectuată și desenați arborele AVL final.</p>

<p class="subq">e) (2.5p) Un sistem are memoria principală de <b>1 GB</b> și o memorie <b>cache cu mapare directă</b> de <b>64 KB</b>, cu blocuri (linii) de <b>32 octeți</b>. Adresarea se face la nivel de octet.</p>
<ul>
<li>Câți biți are adresa fizică? Determinați împărțirea ei în câmpurile <b>tag</b> / <b>index de linie</b> / <b>deplasament în bloc</b>.</li>
<li>Câte linii are cache-ul și ce dimensiune are directorul de taguri (overhead-ul de metadate, cu bit de validare)?</li>
<li>Pentru adresa fizică <code>0x2ABC1234</code>, dați tag-ul, indexul de linie și deplasamentul.</li>
</ul>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul I</summary>
<div class="rez-body">
<h4>a) Eroare: pointer transmis prin valoare</h4>
<p>Funcția primește o <b>copie</b> a pointerului <code>p</code>. <code>malloc</code> îi atribuie copiei o adresă nouă, dar <code>v</code> din <code>main</code> rămâne <b>NULL</b>. La <code>v[2]</code> se dereferențiază NULL → <b>comportament nedefinit / segmentation fault</b> (nu afișează nimic util). Memoria alocată se și pierde (memory leak).</p>
<p><b>Corecție</b> (pointer la pointer, fără a schimba logica):</p>
<pre class="code" data-lang="c">void aloca(int **p, int n){
    *p = (int*)malloc(n * sizeof(int));
    for(int i = 0; i &lt; n; i++) (*p)[i] = i * i;
}
/* apel: */ aloca(&amp;v, 5);</pre>
<p>După corecție: <code>v[i] = i*i</code>, deci <code>v[2] = 4</code>. <b>Se afișează 4.</b></p>

<h4>b) Legare statică vs dinamică</h4>
<p><code>afis()</code> nu este virtuală → <b>legare statică</b> după tipul pointerului (<code>Baza*</code>) → se apelează <code>Baza::afis</code>. <code>info()</code> este virtuală → <b>legare dinamică</b> după tipul real al obiectului (<code>Deriv</code>) → <code>Deriv::info</code>.</p>
<p>Se afișează: <code>Baza info-Deriv</code></p>

<h4>c) Operații pe biți</h4>
<p><code>2025 = 0x7E9</code>, <code>0x3F = 0011 1111b</code> (ultimii 6 biți).</p>
<table class="tbl"><tr><th>Operație</th><th>Calcul</th><th>Rezultat (hex)</th></tr>
<tr><td><code>n ^ 0x3F</code></td><td>inversează ultimii 6 biți</td><td><code>0x7D6</code></td></tr>
<tr><td><code>n &amp; 0x3F</code></td><td>păstrează ultimii 6 biți</td><td><code>0x29</code></td></tr>
<tr><td><code>n | 0x3F</code></td><td>setează ultimii 6 biți</td><td><code>0x7FF</code></td></tr></table>
<p>Se afișează: <code>7D6 29 7FF</code></p>

<h4>d) Arbore AVL</h4>
<ul>
<li><b>10, 20</b> → echilibrat.</li>
<li><b>30</b>: lanț 10–20–30 spre dreapta → dezechilibru <b>RR</b> la 10 → <b>rotație simplă stânga</b> la 10 ⇒ rădăcină 20 (fii 10 și 30).</li>
<li><b>40</b> → se inserează la dreapta lui 30; arbore încă echilibrat.</li>
<li><b>50</b>: lanț 30–40–50 → dezechilibru <b>RR</b> la 30 → <b>rotație simplă stânga</b> la 30 ⇒ subarbore 40 (fii 30 și 50); arbore: 20(10, 40(30,50)).</li>
<li><b>25</b>: se inserează în 40→30→stânga; nodul 20 devine dezechilibrat (factor −2), cazul <b>RL</b> (dreapta-stânga) → <b>rotație dublă</b> (dreapta la 40, apoi stânga la 20).</li>
</ul>
<p><b>Arborele AVL final:</b></p>
<div class="diagram"><svg viewBox="0 0 420 200" role="img" aria-label="AVL final">
<line x1="210" y1="33" x2="113" y2="90" stroke="#83a598" stroke-width="2"/>
<line x1="210" y1="33" x2="307" y2="90" stroke="#83a598" stroke-width="2"/>
<line x1="110" y1="100" x2="64" y2="156" stroke="#83a598" stroke-width="2"/>
<line x1="110" y1="100" x2="156" y2="156" stroke="#83a598" stroke-width="2"/>
<line x1="310" y1="100" x2="356" y2="156" stroke="#83a598" stroke-width="2"/>
<g font-size="14" font-weight="bold" text-anchor="middle">
<circle cx="210" cy="30" r="20" fill="#2e2515" stroke="#e9b143" stroke-width="2"/><text x="210" y="35" fill="#ece3d2">30</text>
<circle cx="110" cy="95" r="20" fill="#2a2118" stroke="#83a598" stroke-width="2"/><text x="110" y="100" fill="#ece3d2">20</text>
<circle cx="310" cy="95" r="20" fill="#2a2118" stroke="#83a598" stroke-width="2"/><text x="310" y="100" fill="#ece3d2">40</text>
<circle cx="60" cy="161" r="20" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/><text x="60" y="166" fill="#ece3d2">10</text>
<circle cx="160" cy="161" r="20" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/><text x="160" y="166" fill="#ece3d2">25</text>
<circle cx="360" cy="161" r="20" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/><text x="360" y="166" fill="#ece3d2">50</text>
</g>
</svg></div>

<h4>e) Cache cu mapare directă</h4>
<ul>
<li>Memorie 1 GB = 2³⁰ octeți → <b>adresă fizică pe 30 de biți</b>.</li>
<li>Bloc 32 = 2⁵ octeți → <b>deplasament = 5 biți</b>.</li>
<li>Nr. linii = 64 KB / 32 = 2¹⁶ / 2⁵ = 2¹¹ = <b>2048 linii</b> → <b>index linie = 11 biți</b>.</li>
<li>Tag = 30 − 11 − 5 = <b>14 biți</b>.</li>
</ul>
<table class="tbl"><tr><th>Tag</th><th>Index linie</th><th>Deplasament</th></tr>
<tr><td>14 biți</td><td>11 biți</td><td>5 biți</td></tr></table>
<p>Director de taguri = 2048 × (14 tag + 1 valid) = 2048 × 15 = <b>30720 biți = 3840 octeți (3.75 KB)</b>.</p>
<p>Pentru <code>0x2ABC1234</code> (în binar, ultimii 30 de biți): deplasament = biții [4:0] = <code>0x14 = 20</code>; index linie = biții [15:5] = <code>0x91 = 145</code>; tag = biții [29:16] = <code>0x2ABC</code>.</p>
<p class="barem">Barem: a) 1.5p · b) 1.5p · c) 1p · d) 2.5p (rotații 1.5p + arbore final 1p) · e) 2.5p (împărțire biți 1p + dimensiuni 0.75p + decodare adresă 0.75p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL II ============================ -->
<h2>Subiectul II — Rețele și protocoale <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (4p) O firmă a primit blocul <b>192.168.10.0/24</b> și trebuie să creeze 4 subrețele (VLSM) pentru: <b>A</b> = 100 stații, <b>B</b> = 50 stații, <b>C</b> = 25 stații, <b>D</b> = 2 stații (legătură punct-la-punct). Alocați subrețelele în ordinea descrescătoare a necesarului și completați pentru fiecare: adresa de rețea + prefix, masca, intervalul de adrese utilizabile și adresa de broadcast.</p>

<p class="subq">b) (3.5p) Un laptop (<code>192.168.1.10</code>, MAC <code>AA:AA:AA</code>) accesează pentru prima dată <code>http://www.exemplu.ro</code>. Toate cache-urile (ARP, DNS) sunt goale. Topologia:</p>
<div class="diagram"><svg viewBox="0 0 660 180" role="img" aria-label="topologie retea">
<rect x="10" y="62" width="120" height="52" rx="6" fill="#2a2118" stroke="#83a598" stroke-width="2"/>
<text x="70" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#83a598">Laptop</text>
<text x="70" y="95" text-anchor="middle" font-size="9" fill="#ece3d2">192.168.1.10</text>
<text x="70" y="108" text-anchor="middle" font-size="9" fill="#a8997f">MAC AA:AA:AA</text>
<line x1="130" y1="88" x2="168" y2="88" stroke="#a8997f" stroke-width="2"/>
<rect x="170" y="68" width="70" height="40" rx="6" fill="#221e1a" stroke="#a8997f"/>
<text x="205" y="92" text-anchor="middle" font-size="10" fill="#ece3d2">Switch</text>
<line x1="240" y1="88" x2="278" y2="88" stroke="#a8997f" stroke-width="2"/>
<rect x="280" y="58" width="130" height="60" rx="6" fill="#2e2515" stroke="#e9b143" stroke-width="2"/>
<text x="345" y="76" text-anchor="middle" font-size="11" font-weight="bold" fill="#e9b143">Router / GW</text>
<text x="345" y="91" text-anchor="middle" font-size="9" fill="#ece3d2">192.168.1.1</text>
<text x="345" y="104" text-anchor="middle" font-size="9" fill="#a8997f">MAC RR:RR:RR</text>
<line x1="410" y1="88" x2="448" y2="88" stroke="#a8997f" stroke-width="2"/>
<ellipse cx="498" cy="88" rx="48" ry="30" fill="#221e1a" stroke="#83a598" stroke-dasharray="4 3"/>
<text x="498" y="92" text-anchor="middle" font-size="10" fill="#83a598">Internet</text>
<line x1="546" y1="74" x2="572" y2="46" stroke="#a8997f" stroke-width="2"/>
<line x1="546" y1="100" x2="572" y2="128" stroke="#a8997f" stroke-width="2"/>
<rect x="556" y="22" width="98" height="40" rx="6" fill="#1f2616" stroke="#b8bb26"/>
<text x="605" y="40" text-anchor="middle" font-size="10" font-weight="bold" fill="#b8bb26">DNS</text>
<text x="605" y="54" text-anchor="middle" font-size="9" fill="#ece3d2">8.8.8.8</text>
<rect x="546" y="118" width="114" height="44" rx="6" fill="#241a26" stroke="#d3869b"/>
<text x="603" y="136" text-anchor="middle" font-size="10" font-weight="bold" fill="#d3869b">www.exemplu.ro</text>
<text x="603" y="150" text-anchor="middle" font-size="9" fill="#ece3d2">203.0.113.20</text>
</svg></div>
<p>Completați tabelul cu primele 6 cadre/pachete care părăsesc laptopul sau ajung la el (MAC sursă/destinație, IP sursă/destinație, port / detaliu):</p>
<table class="tbl">
<tr><th>#</th><th>Protocol / acțiune</th><th>MAC sursă</th><th>MAC dest.</th><th>IP sursă</th><th>IP dest.</th><th>Port / detaliu</th></tr>
<tr><td>1</td><td>ARP Request</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">—</td><td class="fillcell">—</td><td class="fillcell">…</td></tr>
<tr><td>2</td><td>ARP Reply</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">—</td><td class="fillcell">—</td><td class="fillcell">…</td></tr>
<tr><td>3</td><td>DNS Query</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
<tr><td>4</td><td>DNS Response</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
<tr><td>5</td><td>TCP SYN</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
<tr><td>6</td><td>TCP SYN-ACK</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
</table>

<p class="subq">c) (1.5p) Răspundeți scurt: (i) ce porturi standard folosesc HTTP, HTTPS, SSH, DNS? (ii) ce este handshake-ul TCP în 3 pași? (iii) enumerați 4 protocoale care folosesc UDP la transport.</p>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul II</summary>
<div class="rez-body">
<h4>a) Alocare VLSM (din 192.168.10.0/24)</h4>
<table class="tbl">
<tr><th>Subrețea</th><th>Stații</th><th>Rețea / prefix</th><th>Mască</th><th>Interval utilizabil</th><th>Broadcast</th></tr>
<tr><td>A</td><td>100</td><td>192.168.10.0/25</td><td>255.255.255.128</td><td>.1 – .126</td><td>192.168.10.127</td></tr>
<tr><td>B</td><td>50</td><td>192.168.10.128/26</td><td>255.255.255.192</td><td>.129 – .190</td><td>192.168.10.191</td></tr>
<tr><td>C</td><td>25</td><td>192.168.10.192/27</td><td>255.255.255.224</td><td>.193 – .222</td><td>192.168.10.223</td></tr>
<tr><td>D</td><td>2</td><td>192.168.10.224/30</td><td>255.255.255.252</td><td>.225 – .226</td><td>192.168.10.227</td></tr>
</table>
<p>Regula: 100 stații → 2⁷−2 = 126 (/25); 50 → 2⁶−2 = 62 (/26); 25 → 2⁵−2 = 30 (/27); 2 → 2²−2 = 2 (/30).</p>

<h4>b) Traseu ARP → DNS → TCP</h4>
<table class="tbl">
<tr><th>#</th><th>Protocol</th><th>MAC sursă</th><th>MAC dest.</th><th>IP sursă</th><th>IP dest.</th><th>Detaliu</th></tr>
<tr><td>1</td><td>ARP Request</td><td>AA:AA:AA</td><td>FF:FF:FF (broadcast)</td><td>—</td><td>—</td><td>„Cine are 192.168.1.1?”</td></tr>
<tr><td>2</td><td>ARP Reply</td><td>RR:RR:RR</td><td>AA:AA:AA</td><td>—</td><td>—</td><td>„192.168.1.1 = RR:RR:RR”</td></tr>
<tr><td>3</td><td>DNS Query</td><td>AA:AA:AA</td><td>RR:RR:RR</td><td>192.168.1.10</td><td>8.8.8.8</td><td>UDP port 53, „A? www.exemplu.ro”</td></tr>
<tr><td>4</td><td>DNS Response</td><td>RR:RR:RR</td><td>AA:AA:AA</td><td>8.8.8.8</td><td>192.168.1.10</td><td>UDP 53, „= 203.0.113.20”</td></tr>
<tr><td>5</td><td>TCP SYN</td><td>AA:AA:AA</td><td>RR:RR:RR</td><td>192.168.1.10</td><td>203.0.113.20</td><td>port dest. 80, flag SYN</td></tr>
<tr><td>6</td><td>TCP SYN-ACK</td><td>RR:RR:RR</td><td>AA:AA:AA</td><td>203.0.113.20</td><td>192.168.1.10</td><td>port sursă 80, SYN+ACK</td></tr>
</table>
<div class="tip"><b>Ideea cheie:</b> pentru destinații din afara rețelei locale (8.8.8.8, 203.0.113.20), MAC-ul destinație este al <b>routerului</b> (RR:RR:RR), nu al serverului — nivelul 2 ajunge doar până la următorul hop; IP-ul rămâne cel al destinației finale.</div>

<h4>c) Teorie</h4>
<p>(i) HTTP = <b>80/TCP</b>, HTTPS = <b>443/TCP</b>, SSH = <b>22/TCP</b>, DNS = <b>53</b> (UDP pentru interogări, TCP pentru transfer de zonă). (ii) Handshake-ul TCP: <b>SYN</b> (client→server) → <b>SYN-ACK</b> (server→client) → <b>ACK</b> (client→server), care stabilește numerele de secvență inițiale și deschide conexiunea. (iii) Peste UDP: <b>DNS, DHCP, TFTP, SNMP</b> (și RTP, VoIP).</p>
<p class="barem">Barem: a) 4p (1p/subrețea) · b) 3.5p (≈0.6p/rând) · c) 1.5p · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL III ============================ -->
<h2>Subiectul III — PSO (Programarea Sistemelor de Operare) <span class="subiect-pts">10 puncte</span></h2>

<p>Se consideră un server care procesează comenzi. Pentru redundanță și eficiență, creează procese lucrătoare suplimentare, fiecare lansând câte un fir de execuție per comandă. Numărul de comenzi servite simultan este limitat printr-un semafor POSIX aflat în memorie partajată.</p>
<pre class="code" data-lang="c"> 1  #include &lt;stdio.h&gt;
 2  #include &lt;stdlib.h&gt;
 3  #include &lt;unistd.h&gt;
 4  #include &lt;sys/wait.h&gt;
 5  #include &lt;sys/mman.h&gt;
 6  #include &lt;semaphore.h&gt;
 7  #include &lt;pthread.h&gt;
 8
 9  #define LIMITA       6     /* comenzi servite de fiecare proces */
10  #define MAX_SIMULTAN 3     /* comenzi servite in paralel        */
11
12  sem_t *sem;                            /* semafor partajat */
13  pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
14  int comenzi_servite = 0;
15
16  void proceseaza(long id){
17      sleep(1);                          /* simuleaza prelucrarea */
18  }
19
20  void *fir_comanda(void *arg){
21      long id = (long)arg;
22      proceseaza(id);
23      pthread_mutex_lock(&amp;mutex);
24      comenzi_servite++;
25      printf("Firul %ld (proces %d) a servit comanda %d\\n",
26             id, getpid(), comenzi_servite);
27      pthread_mutex_unlock(&amp;mutex);
28      sem_post(sem);                     /* elibereaza un slot */
29      return NULL;
30  }
31
32  int main(void){
33      sem = mmap(NULL, sizeof(sem_t), PROT_READ | PROT_WRITE,
34                 MAP_SHARED | MAP_ANONYMOUS, -1, 0);
35      sem_init(sem, 1, MAX_SIMULTAN);
36
37      pid_t pid = fork();
38      if(pid != 0) pid = fork();         /* inca un proces lucrator */
39
40      pthread_t fire[LIMITA];
41      long i;
42      for(i = 0; i &lt; LIMITA; i++){
43          sem_wait(sem);                 /* ocupa un slot liber */
44          pthread_create(&amp;fire[i], NULL, fir_comanda, (void*)i);
45      }
46      for(long k = 0; k &lt; LIMITA; k++)
47          pthread_join(fire[k], NULL);
48
49      if(pid != 0)                       /* doar parintele */
50          while(wait(NULL) &gt; 0);
51      return 0;
52  }</pre>

<p class="subq">Răspundeți, justificat:</p>
<ol>
<li>Câte procese rulează în total acest cod (liniile 37–38)? Ce rol are garda <code>if(pid != 0)</code>?</li>
<li>Care este rolul semaforului <code>sem</code> (inițializat cu <code>MAX_SIMULTAN</code>)? Explicați perechea <code>sem_wait</code> / <code>sem_post</code>.</li>
<li>De ce este alocat semaforul prin <code>mmap</code> cu <code>MAP_SHARED | MAP_ANONYMOUS</code> (liniile 33–35)? Ce mecanism al SO se obține? Ce s-ar întâmpla cu un simplu <code>sem_t sem;</code> global?</li>
<li>De ce este folosit mutex-ul în <code>fir_comanda</code> (liniile 23–27)? Sincronizează el și firele din procese diferite? Ce observați despre variabila <code>comenzi_servite</code>?</li>
<li>Ce efect are ștergerea liniei 28 (<code>sem_post(sem)</code>)?</li>
<li>La două execuții consecutive, ordinea și numerele afișate de linia 25 diferă. Explicați de ce și dați două execuții posibile (A și B).</li>
</ol>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul III</summary>
<div class="rez-body">
<h4>1. Numărul de procese</h4>
<p><b>3 procese.</b> <code>fork()</code> (37) creează copilul C1. În <b>părinte</b>, <code>pid</code> = PID-ul lui C1 (≠ 0), deci execută al doilea <code>fork()</code> (38) → creează C2. În <b>C1</b>, <code>pid == 0</code>, garda îl oprește să mai facă fork. Total: <b>părinte + C1 + C2</b>. Fără gardă (un <code>pid = fork()</code> necondiționat), C1 ar fork-ui și el → 4 procese. Garda asigură exact 2 procese lucrătoare suplimentare.</p>
<h4>2. Semaforul numărător</h4>
<p>Limitează la <b>3</b> numărul de comenzi prelucrate <b>simultan</b> (resursă cu 3 unități). <code>sem_wait</code> (43) decrementează contorul și <b>blochează</b> firul/procesul dacă e 0 → „ocupă” un slot înainte de a porni firul. <code>sem_post</code> (28) incrementează contorul → „eliberează” slotul după ce comanda s-a terminat, deblocând un solicitant care aștepta.</p>
<h4>3. Memorie partajată</h4>
<p><code>mmap</code> cu <code>MAP_SHARED | MAP_ANONYMOUS</code> alocă o zonă de <b>memorie partajată anonimă</b>, moștenită de procesele copil după <code>fork</code> → toate cele 3 procese văd <b>același</b> semafor (de aceea și <code>sem_init(..., pshared=1, ...)</code>). Mecanism = <b>memorie partajată între procese (IPC)</b>. Cu un <code>sem_t sem;</code> global, fork-ul ar copia variabila → fiecare proces ar avea propriul semafor cu 3 sloturi → s-ar permite până la 3×3 = 9 comenzi simultane, anulând limita.</p>
<h4>4. Mutex-ul și domeniul lui</h4>
<p>Protejează <b>secțiunea critică</b> <code>comenzi_servite++</code> + <code>printf</code> de accesul concurent al firelor din <b>același proces</b> (altfel: race condition la incrementare și mesaje întrețesute). <b>NU</b> sincronizează firele din procese diferite: <code>mutex</code> și <code>comenzi_servite</code> sunt variabile globale obișnuite, copiate de fork → fiecare proces are propriul mutex și propriul contor. Deci <code>comenzi_servite</code> numără <b>per proces</b> (fiecare ajunge la 6), nu în total. Sincronizarea inter-proces se face doar prin semaforul partajat.</p>
<h4>5. Ștergerea liniei 28</h4>
<p>Sloturile nu se mai eliberează niciodată. După ce primele 3 fire ocupă cele 3 sloturi, următorul <code>sem_wait</code> găsește contorul 0 și se <b>blochează permanent</b> → programul se blochează (înfometare): fiecare proces pornește doar 3 fire și rămâne agățat în <code>sem_wait</code>, fără să ajungă la <code>pthread_join</code>.</p>
<h4>6. Nedeterminism</h4>
<p>Planificarea proceselor și a firelor de către SO este <b>nedeterministă</b> (preempțiune, momentul în care fiecare obține slotul prin <code>sem_wait</code>, întârzierile de <code>sleep</code>). În plus, <code>getpid()</code> diferă de la rulare la rulare. Deci atât ordinea liniilor, cât și împerecherea fir↔număr variază. Exemple (PID-uri ilustrative):</p>
<table class="tbl"><tr><th>Execuția A</th><th>Execuția B</th></tr>
<tr><td>Firul 0 (proces 5012) a servit comanda 1<br>Firul 0 (proces 5013) a servit comanda 1<br>Firul 1 (proces 5012) a servit comanda 2<br>Firul 0 (proces 5014) a servit comanda 1<br>…</td>
<td>Firul 0 (proces 7720) a servit comanda 1<br>Firul 1 (proces 7720) a servit comanda 2<br>Firul 0 (proces 7721) a servit comanda 1<br>Firul 2 (proces 7720) a servit comanda 3<br>…</td></tr></table>
<p class="barem">Barem: câte 1.5p pentru întrebările 1–6 (= 9p) + 1p din oficiu. Se punctează justificarea, nu doar răspunsul.</p>
</div>
</details>
`
});
