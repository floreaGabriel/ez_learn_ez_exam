// ============================================================
//  Model 5 — Prog/OOP/SDA + Arhitecturi · Rețele · PSO
// ============================================================
SUBIECTE.push({
  id: "model-5",
  navTitlu: "Model 5",
  titlu: "Model 5 — Examen de licență",
  combo: "Prog/OOP/SDA + Arhitecturi · Rețele · PSO",
  rezumat: "Pointeri și intervale de caractere, șablonul Singleton, operații pe biți, Dijkstra pe graf ponderat și o problemă de arhitecturi (predicție de salt + pipeline); adresare IP /28 + decodare hexdump Ethernet/IPv4 + teorie; PSO în format 2024 (sumă vectorială cu fire + zone de memorie).",
  html: `
<div class="exam-meta">
  <span class="info">⏱️ Timp: <b>3 ore</b></span>
  <span class="info">📋 <b>3 subiecte</b>, fiecare <b>10 puncte</b> (1 din oficiu)</span>
  <span class="info">✍️ Se răspunde la toate subiectele</span>
</div>
<p class="muted">Combinație: <b>Programare C / OOP C++ / SDA + o problemă de Arhitecturi</b> · <b>Rețele &amp; protocoale</b> · <b>PSO</b>. Fiecare subiect are rezolvarea ascunsă — încearcă întâi singur, apoi verifică.</p>

<!-- ============================ SUBIECTUL I ============================ -->
<h2>Subiectul I — Programare, OOP, SDA și Arhitecturi <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (1.5p) Ce afișează programul? Justificați pe baza codurilor ASCII. (Se consideră toate antetele incluse.)</p>
<pre class="code" data-lang="c">char s[] = "LICENTA";
char *p = s;
while(*p){ if(*p &gt;= 'A' &amp;&amp; *p &lt;= 'M') *p += 32; p++; }
printf("%s\\n", s);</pre>

<p class="subq">b) (1.5p) Explicați șablonul <b>Singleton</b> ilustrat mai jos: de ce este constructorul privat și ce afișează programul? Justificați.</p>
<pre class="code" data-lang="cpp">class Config {
    static Config* instanta;
    int valoare;
    Config(){ valoare = 0; }            // constructor privat
public:
    static Config* getInstance(){
        if(instanta == NULL) instanta = new Config();
        return instanta;
    }
    void set(int v){ valoare = v; }
    int get(){ return valoare; }
};
Config* Config::instanta = NULL;
int main(){
    Config::getInstance()-&gt;set(42);
    cout &lt;&lt; Config::getInstance()-&gt;get();
}</pre>

<p class="subq">c) (1p) Ce afișează? Lucrați pe biți și exprimați rezultatele în hexazecimal.</p>
<pre class="code" data-lang="c">int n = 0xB7;
printf("%X %X %X\\n", n &lt;&lt; 1, n &gt;&gt; 2, n &amp; 0x0F);</pre>

<p class="subq">d) (2.5p) Se dă graful neorientat ponderat de mai jos (5 noduri A, B, C, D, E). Aplicând <b>algoritmul lui Dijkstra</b> din nodul sursă <b>A</b>, determinați distanța minimă de la A la fiecare nod și <b>drumul minim</b> de la A la E. Muchii: A-B=5, A-C=2, C-B=1, C-D=7, B-D=3, B-E=6, D-E=2.</p>
<div class="diagram"><svg viewBox="0 0 460 240" role="img" aria-label="graf ponderat Dijkstra">
<line x1="70" y1="120" x2="220" y2="50" stroke="#83a598" stroke-width="2"/>
<line x1="70" y1="120" x2="220" y2="190" stroke="#83a598" stroke-width="2"/>
<line x1="220" y1="50" x2="220" y2="190" stroke="#83a598" stroke-width="2"/>
<line x1="220" y1="50" x2="360" y2="120" stroke="#83a598" stroke-width="2"/>
<line x1="220" y1="190" x2="360" y2="120" stroke="#83a598" stroke-width="2"/>
<line x1="220" y1="50" x2="430" y2="50" stroke="#83a598" stroke-width="2"/>
<line x1="360" y1="120" x2="430" y2="50" stroke="#83a598" stroke-width="2"/>
<g font-size="12" font-weight="bold" text-anchor="middle">
<rect x="138" y="76" width="20" height="16" rx="3" fill="#1a1714"/><text x="148" y="89" fill="#e9b143">5</text>
<rect x="138" y="148" width="20" height="16" rx="3" fill="#1a1714"/><text x="148" y="161" fill="#e9b143">2</text>
<rect x="210" y="112" width="20" height="16" rx="3" fill="#1a1714"/><text x="220" y="125" fill="#e9b143">1</text>
<rect x="280" y="76" width="20" height="16" rx="3" fill="#1a1714"/><text x="290" y="89" fill="#e9b143">7</text>
<rect x="280" y="148" width="20" height="16" rx="3" fill="#1a1714"/><text x="290" y="161" fill="#e9b143">3</text>
<rect x="315" y="40" width="20" height="16" rx="3" fill="#1a1714"/><text x="325" y="53" fill="#e9b143">6</text>
<rect x="385" y="76" width="20" height="16" rx="3" fill="#1a1714"/><text x="395" y="89" fill="#e9b143">2</text>
</g>
<g font-size="14" font-weight="bold" text-anchor="middle">
<circle cx="70" cy="120" r="20" fill="#2e2515" stroke="#e9b143" stroke-width="2"/><text x="70" y="125" fill="#ece3d2">A</text>
<circle cx="220" cy="50" r="20" fill="#2a2118" stroke="#83a598" stroke-width="2"/><text x="220" y="55" fill="#ece3d2">B</text>
<circle cx="220" cy="190" r="20" fill="#2a2118" stroke="#83a598" stroke-width="2"/><text x="220" y="195" fill="#ece3d2">C</text>
<circle cx="360" cy="120" r="20" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/><text x="360" y="125" fill="#ece3d2">D</text>
<circle cx="430" cy="50" r="20" fill="#241a26" stroke="#d3869b" stroke-width="2"/><text x="430" y="55" fill="#ece3d2">E</text>
</g>
</svg></div>

<p class="subq">e) (2.5p) <b>Arhitecturi de calculatoare.</b></p>
<ul>
<li><b>Partea 1 (1.25p) — predicție de salt cu numărător saturat pe 2 biți.</b> Stările sunt: <code>00</code> = puternic „nu se ia”, <code>01</code> = slab „nu se ia”, <code>10</code> = slab „se ia”, <code>11</code> = puternic „se ia”. Predicția este <i>nu se ia</i> în stările 00/01 și <i>se ia</i> în 10/11. La rezultatul real <b>T</b> (se ia) contorul crește cu 1 (saturat la 11), iar la <b>NT</b> (nu se ia) scade cu 1 (saturat la 00). Pornind din starea <code>00</code>, pentru secvența de rezultate <b>T, T, T, T, NT</b>, numărați câte predicții greșite apar.</li>
<li><b>Partea 2 (1.25p) — pipeline cu 5 etaje</b> (IF, ID, EX, MEM, WB). Numărul de cicli pentru N instrucțiuni: <b>fără</b> pipeline = N×5; <b>cu</b> pipeline = N + (5−1) = N+4. Calculați numărul de cicli și accelerarea (speedup) pentru <b>N = 5</b> și <b>N = 100</b> și determinați limita asimptotică a accelerării când N → ∞.</li>
</ul>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul I</summary>
<div class="rez-body">
<h4>a) Pointeri + intervale de caractere</h4>
<p>Programul parcurge șirul cu pointerul <code>p</code>. Pentru fiecare caracter din intervalul <code>'A'..'M'</code> adună 32, transformându-l în literă mică (<code>litera_mică = litera_mare + 32</code> în ASCII). Caracterele din afara intervalului rămân neschimbate.</p>
<table class="tbl"><tr><th>Caracter</th><th>Cod ASCII</th><th>În interval 'A'(65)..'M'(77)?</th><th>Rezultat</th></tr>
<tr><td>L (76)</td><td>76</td><td>da</td><td><code>l</code> (108)</td></tr>
<tr><td>I (73)</td><td>73</td><td>da</td><td><code>i</code> (105)</td></tr>
<tr><td>C (67)</td><td>67</td><td>da</td><td><code>c</code> (99)</td></tr>
<tr><td>E (69)</td><td>69</td><td>da</td><td><code>e</code> (101)</td></tr>
<tr><td>N (78)</td><td>78</td><td>nu (78 &gt; 77)</td><td><code>N</code> (rămâne)</td></tr>
<tr><td>T (84)</td><td>84</td><td>nu (84 &gt; 77)</td><td><code>T</code> (rămâne)</td></tr>
<tr><td>A (65)</td><td>65</td><td>da</td><td><code>a</code> (97)</td></tr></table>
<p>Se afișează: <code>liceNTa</code></p>

<h4>b) Șablonul Singleton</h4>
<p><b>Singleton</b> garantează că o clasă are o <b>singură instanță</b>, oferind un punct global de acces la ea. Mecanismul: un pointer <code>static</code> către instanță (<code>instanta</code>) și o metodă statică <code>getInstance()</code> care creează instanța doar la prima apelare, iar apoi returnează mereu <b>aceeași</b> instanță.</p>
<p><b>De ce este constructorul privat:</b> pentru a împiedica orice cod din afara clasei să creeze obiecte <code>Config</code> direct (cu <code>new Config()</code> sau pe stivă). Astfel singura cale de a obține o instanță este prin <code>getInstance()</code>, care controlează unicitatea.</p>
<p>În <code>main</code>, primul <code>getInstance()</code> creează instanța și apelează <code>set(42)</code>; al doilea <code>getInstance()</code> returnează <b>aceeași</b> instanță, deci <code>get()</code> citește valoarea 42 setată anterior.</p>
<p>Se afișează: <code>42</code></p>

<h4>c) Operații pe biți și deplasări</h4>
<p><code>0xB7 = 183</code> (în binar <code>1011 0111</code>).</p>
<table class="tbl"><tr><th>Operație</th><th>Calcul</th><th>Rezultat (hex)</th></tr>
<tr><td><code>n &lt;&lt; 1</code></td><td>183 × 2 = 366</td><td><code>0x16E</code></td></tr>
<tr><td><code>n &gt;&gt; 2</code></td><td>183 ÷ 4 = 45</td><td><code>0x2D</code></td></tr>
<tr><td><code>n &amp; 0x0F</code></td><td>păstrează ultimii 4 biți (<code>0111</code>)</td><td><code>0x7</code></td></tr></table>
<p>Se afișează: <code>16E 2D 7</code></p>

<h4>d) Algoritmul lui Dijkstra (sursă A)</h4>
<p><b>Relaxarea muchiilor:</b> se pornește cu distanța 0 la sursă și ∞ la rest. La fiecare pas se extrage nodul nevizitat cu distanța minimă, se „fixează” și se încearcă să se îmbunătățească (relaxeze) distanțele vecinilor: dacă <code>dist[u] + w(u,v) &lt; dist[v]</code>, se actualizează <code>dist[v]</code> și predecesorul lui v devine u.</p>
<ul>
<li>Fixăm <b>A</b> (0). Relaxăm: C = 2, B = 5.</li>
<li>Cel mai mic nefixat = <b>C</b> (2). Prin C: B = min(5, 2+1) = <b>3</b>, D = 2+7 = 9.</li>
<li>Cel mai mic = <b>B</b> (3). Prin B: D = min(9, 3+3) = <b>6</b>, E = 3+6 = 9.</li>
<li>Cel mai mic = <b>D</b> (6). Prin D: E = min(9, 6+2) = <b>8</b>.</li>
<li>Ultimul = <b>E</b> (8). Gata.</li>
</ul>
<table class="tbl"><tr><th>Nod</th><th>Distanță de la A</th><th>Predecesor</th></tr>
<tr><td>A</td><td>0</td><td>—</td></tr>
<tr><td>C</td><td>2</td><td>A</td></tr>
<tr><td>B</td><td>3</td><td>C</td></tr>
<tr><td>D</td><td>6</td><td>B</td></tr>
<tr><td>E</td><td>8</td><td>D</td></tr></table>
<p><b>Drumul minim de la A la E:</b> reconstituit din predecesori (E←D←B←C←A) → <code>A → C → B → D → E</code>, cu cost <b>2 + 1 + 3 + 2 = 8</b>.</p>

<h4>e) Arhitecturi</h4>
<p><b>Partea 1 — predictor pe 2 biți.</b> Pornim din starea 00, secvența reală T, T, T, T, NT:</p>
<table class="tbl"><tr><th>Stare curentă</th><th>Predicție</th><th>Rezultat real</th><th>Verdict</th><th>Stare următoare</th></tr>
<tr><td>00</td><td>NU se ia</td><td>T</td><td><b>greșit</b></td><td>01</td></tr>
<tr><td>01</td><td>NU se ia</td><td>T</td><td><b>greșit</b></td><td>10</td></tr>
<tr><td>10</td><td>se ia</td><td>T</td><td>corect</td><td>11</td></tr>
<tr><td>11</td><td>se ia</td><td>T</td><td>corect</td><td>11</td></tr>
<tr><td>11</td><td>se ia</td><td>NT</td><td><b>greșit</b></td><td>10</td></tr></table>
<p><b>Total: 3 predicții greșite</b> (predictorul are nevoie de 2 pași ca să „învețe” că saltul se ia, apoi greșește o singură dată la schimbarea în NT, fără să comute imediat din zona „se ia”).</p>
<p><b>Partea 2 — pipeline cu 5 etaje.</b> Cicli fără pipeline = N×5; cicli cu pipeline = N+4; accelerare = (N×5)/(N+4).</p>
<table class="tbl"><tr><th>N</th><th>Fără pipeline (N×5)</th><th>Cu pipeline (N+4)</th><th>Accelerare</th></tr>
<tr><td>5</td><td>25</td><td>9</td><td>25/9 ≈ <b>2.78</b></td></tr>
<tr><td>100</td><td>500</td><td>104</td><td>500/104 ≈ <b>4.81</b></td></tr></table>
<p>Limita asimptotică: când N → ∞, accelerarea (5N)/(N+4) → <b>5</b> = numărul de etaje. Pe măsură ce numărul de instrucțiuni crește, costul de „umplere” a pipeline-ului (cei 4 cicli suplimentari) devine neglijabil.</p>
<p class="barem">Barem: a) 1.5p · b) 1.5p · c) 1p · d) 2.5p (distanțe + predecesori 1.5p + drumul minim la E 1p) · e) 2.5p (predicție de salt 1.25p + pipeline 1.25p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL II ============================ -->
<h2>Subiectul II — Rețele și protocoale <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (3p) Se dă IP-ul <b>107.85.20.3</b> cu masca <b>/28</b>. Determinați: clasa adresei, adresa de rețea, adresa de broadcast, masca în format zecimal, numărul de stații utilizabile și intervalul utilizabil. Apoi: câte subrețele <b>/28</b> încap într-un <b>/24</b> și care este incrementul (saltul) între subrețele?</p>

<p class="subq">b) (3.5p) Se dă începutul unui cadru <b>Ethernet</b> care încapsulează <b>IPv4</b>. Hexdump (octeți):</p>
<pre class="code" data-lang="text">AA BB CC DD EE FF 11 22 33 44 55 66 08 00 45 00
00 54 1C 46 40 00 40 01 B1 E6 C0 A8 01 0A C0 A8
01 01 08 00 ...</pre>
<p>Extrageți: MAC destinație, MAC sursă, EtherType, versiunea IP + lungimea antetului IP, protocolul de nivel 4, IP sursă și IP destinație. Completați un tabel câmp → valoare.</p>

<p class="subq">c) (2.5p) Răspundeți scurt: (i) explicați mecanismul <b>CSMA/CD</b>; (ii) ce este un <b>Gratuitous ARP</b> și dați 2 utilizări; (iii) enumerați 4 protocoale care folosesc <b>UDP</b> la transport.</p>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul II</summary>
<div class="rez-body">
<h4>a) Adresare IP — 107.85.20.3/28</h4>
<ul>
<li><b>Clasa adresei:</b> primul octet 107 ∈ 1–126 → <b>clasă A</b>.</li>
<li><b>Masca /28</b> = 28 biți de 1 → ultimul octet <code>1111 0000</code> → <b>255.255.255.240</b>.</li>
<li><b>Dimensiunea blocului</b> = 2^(32−28) = 16 adrese; al patrulea octet variază în blocuri de 16: …0–15, 16–31, … <code>20.3</code> ∈ blocul 0–15.</li>
<li><b>Adresă de rețea:</b> <code>107.85.20.0</code>.</li>
<li><b>Adresă de broadcast:</b> <code>107.85.20.15</code>.</li>
<li><b>Stații utilizabile:</b> 2^4 − 2 = <b>14</b>.</li>
<li><b>Interval utilizabil:</b> <code>107.85.20.1 – 107.85.20.14</code>.</li>
</ul>
<p><b>Subrețele /28 într-un /24:</b> 2^(28−24) = <b>16</b> subrețele; <b>increment</b> = 256/16 = <b>16</b> (rețelele sunt .0, .16, .32, …, .240).</p>

<h4>b) Decodare hexdump Ethernet/IPv4</h4>
<p>Cadrul Ethernet: primii 6 octeți = MAC destinație, următorii 6 = MAC sursă, apoi 2 octeți EtherType, apoi antetul IP.</p>
<table class="tbl"><tr><th>Câmp</th><th>Octeți (hex)</th><th>Valoare</th></tr>
<tr><td>MAC destinație</td><td>AA BB CC DD EE FF</td><td><code>AA:BB:CC:DD:EE:FF</code></td></tr>
<tr><td>MAC sursă</td><td>11 22 33 44 55 66</td><td><code>11:22:33:44:55:66</code></td></tr>
<tr><td>EtherType</td><td>08 00</td><td><code>0x0800</code> → IPv4</td></tr>
<tr><td>Versiune / IHL</td><td>45</td><td>versiune <b>4</b>, IHL = <b>5</b> (×4 = 20 octeți antet)</td></tr>
<tr><td>Protocol (L4)</td><td>01</td><td><b>ICMP</b></td></tr>
<tr><td>IP sursă</td><td>C0 A8 01 0A</td><td><code>192.168.1.10</code></td></tr>
<tr><td>IP destinație</td><td>C0 A8 01 01</td><td><code>192.168.1.1</code></td></tr></table>
<div class="tip"><b>Observație:</b> octetul de protocol <code>01</code> indică <b>ICMP</b>, iar primii octeți ai payload-ului ICMP, <code>08 00</code>, înseamnă tip 8 = <b>Echo Request</b> (un „ping” de la 192.168.1.10 către 192.168.1.1).</div>

<h4>c) Teorie</h4>
<p>(i) <b>CSMA/CD</b> (Carrier Sense Multiple Access with Collision Detection): stația <b>ascultă purtătoarea</b> (carrier sense) și transmite doar dacă mediul e liber; în timpul transmisiei <b>detectează coliziuni</b>; la coliziune trimite un semnal de jam, oprește transmisia și reia după un interval calculat printr-un algoritm de <b>backoff exponențial</b> (timp aleator crescător). Folosit în Ethernet clasic pe mediu partajat (half-duplex).</p>
<p>(ii) <b>Gratuitous ARP</b> = un mesaj ARP (request sau reply) în care o stație anunță propria pereche IP↔MAC, fără ca cineva să fi întrebat. Utilizări: <b>detectarea conflictelor de IP</b> (dacă altă stație răspunde, IP-ul e deja folosit) și <b>actualizarea cache-urilor ARP</b> ale vecinilor după un failover / schimbare de adresă MAC (de exemplu la preluarea unui IP virtual).</p>
<p>(iii) Peste UDP: <b>DNS, DHCP, TFTP, SNMP</b> (și RTP / VoIP).</p>
<p class="barem">Barem: a) 3p · b) 3.5p (≈0.5p/câmp) · c) 2.5p · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL III ============================ -->
<h2>Subiectul III — PSO (Programarea Sistemelor de Operare) <span class="subiect-pts">10 puncte</span></h2>

<p>Un program calculează suma unui vector folosind mai multe fire de execuție, fiecare însumând o porțiune; sumele parțiale se combină sub protecția unui mutex.</p>
<pre class="code" data-lang="c"> 1  #include &lt;stdio.h&gt;
 2  #include &lt;stdlib.h&gt;
 3  #include &lt;pthread.h&gt;
 4
 5  #define NTHREADS 4
 6  #define SIZE     1000000
 7
 8  long suma_totala = 0;                  /* globala */
 9  pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
10  int *v;                                /* pointer global */
11
12  void *lucru(void *arg){
13      long id    = (long)arg;
14      long start = id * (SIZE / NTHREADS);
15      long stop  = start + (SIZE / NTHREADS);
16      long partial = 0;                  /* locala */
17      for(long i = start; i &lt; stop; i++) partial += v[i];
18      pthread_mutex_lock(&amp;mutex);
19      suma_totala += partial;
20      pthread_mutex_unlock(&amp;mutex);
21      return NULL;
22  }
23
24  int main(void){
25      static int initializat = 0;        /* statica */
26      v = malloc(SIZE * sizeof(int));
27      for(int i = 0; i &lt; SIZE; i++) v[i] = 1;
28      pthread_t t[NTHREADS];
29      for(long k = 0; k &lt; NTHREADS; k++)
30          pthread_create(&amp;t[k], NULL, lucru, (void*)k);
31      for(int k = 0; k &lt; NTHREADS; k++)
32          pthread_join(t[k], NULL);
33      printf("suma = %ld\\n", suma_totala);
34      return 0;
35  }</pre>

<p class="subq">Răspundeți, justificat:</p>
<ol>
<li>Câte fire de execuție rulează în total (inclusiv firul principal)?</li>
<li>Ce afișează linia 33 și de ce este rezultatul corect?</li>
<li>De ce este nevoie de mutex la liniile 18–20, dar NU în bucla de la linia 17?</li>
<li>Ce s-ar întâmpla dacă s-ar elimina mutex-ul (liniile 18, 20)?</li>
<li>Precizați segmentul de memorie în care se află fiecare element: <code>suma_totala</code> (l.8), <code>mutex</code> (l.9), pointerul <code>v</code> (l.10), zona alocată de <code>malloc</code> (l.26), <code>partial</code> (l.16), <code>initializat</code> (l.25), șirul "suma = %ld" (l.33), codul funcțiilor.</li>
<li>Care segmente sunt PARTAJATE între fire și care sunt PRIVATE fiecărui fir?</li>
</ol>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul III</summary>
<div class="rez-body">
<h4>1. Numărul de fire</h4>
<p><b>5 fire în total:</b> 4 fire lucrătoare (create în bucla de la liniile 29–30) + <b>firul principal</b> (<code>main</code>). Firul principal le creează cu <code>pthread_create</code> și apoi le așteaptă cu <code>pthread_join</code> (liniile 31–32) înainte de a afișa rezultatul.</p>
<h4>2. Ce afișează linia 33</h4>
<p>Vectorul are SIZE = 1.000.000 de elemente, toate egale cu 1, deci suma = SIZE × 1 = <code>suma = 1000000</code>. Rezultatul este <b>corect</b> pentru că fiecare fir adună o porțiune <b>disjunctă</b> din vector în variabila locală <code>partial</code> (porțiunile <code>[start, stop)</code> nu se suprapun), iar combinarea finală <code>suma_totala += partial</code> este protejată de mutex, deci nu se pierd actualizări.</p>
<h4>3. De ce mutex la 18–20 și NU la 17</h4>
<p><code>partial</code> este o variabilă <b>locală</b> fiecărui fir (pe stiva proprie) → în bucla de la linia 17 nu există interferență între fire, deci nu e nevoie de sincronizare. În schimb <code>suma_totala</code> este <b>partajată</b> de toate firele → liniile 18–20 formează o <b>secțiune critică</b> care trebuie protejată. Avantaj de performanță: agregarea se face mai întâi local (rapid, fără lock), iar fiecare fir intră o <b>singură dată</b> în secțiunea critică (nu un lock la fiecare element).</p>
<h4>4. Fără mutex</h4>
<p>Apare o <b>condiție de cursă</b> (race condition) pe <code>suma_totala += partial</code>: operația citește-adună-scrie nu este atomică, deci două fire pot citi aceeași valoare veche și suprascrie unul rezultatul celuilalt → <b>actualizări pierdute</b>. Rezultatul ar fi în general <b>mai mic decât 1000000</b>, diferit și <b>nedeterminist</b> la fiecare rulare.</p>
<h4>5. Zone de memorie</h4>
<table class="tbl"><tr><th>Element</th><th>Segment</th></tr>
<tr><td><code>suma_totala</code> (globală inițializată cu 0)</td><td><b>.bss</b></td></tr>
<tr><td><code>mutex</code> (globală inițializată cu o structură nenulă)</td><td><b>.data</b></td></tr>
<tr><td><code>v</code> (pointer global, implicit NULL)</td><td><b>.bss</b></td></tr>
<tr><td>zona alocată de <code>malloc</code> (l.26)</td><td><b>heap</b></td></tr>
<tr><td><code>partial</code> / <code>id</code> / <code>start</code> / <code>stop</code> (locale)</td><td><b>stivă</b> (a fiecărui fir)</td></tr>
<tr><td><code>initializat</code> (static, 0)</td><td><b>.bss</b></td></tr>
<tr><td>șirul "suma = %ld" (literal)</td><td><b>.rodata</b></td></tr>
<tr><td>codul funcțiilor <code>lucru</code>, <code>main</code></td><td><b>.text</b></td></tr></table>
<p>Notă: globalele inițializate cu <b>zero</b> (sau implicit zero) merg în <b>.bss</b>; cele inițializate cu o valoare <b>nenulă</b> merg în <b>.data</b>.</p>
<h4>6. Segmente partajate vs private</h4>
<p><b>Partajate</b> între toate firele: <b>.text, .data, .bss și heap</b> — toate firele din proces văd aceeași memorie globală și aceeași zonă heap (de aceea trebuie sincronizat accesul la <code>suma_totala</code>).</p>
<p><b>Private</b> fiecărui fir: <b>stiva proprie</b> și <b>regiștrii / PC</b>. Prin urmare variabilele locale <code>partial</code>, <code>id</code>, <code>start</code>, <code>stop</code> sunt distincte (câte o copie per fir), motiv pentru care nu e nevoie de mutex pentru ele.</p>
<p class="barem">Barem: câte 1.5p pentru întrebările 1–6 (= 9p) + 1p din oficiu. Se punctează justificarea, nu doar răspunsul.</p>
</div>
</details>
`
});
