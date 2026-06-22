// ============================================================
//  Model 2 — Prog/OOP/SDA + Arhitecturi · Rețele · PSO
// ============================================================
SUBIECTE.push({
  id: "model-2",
  navTitlu: "Model 2",
  titlu: "Model 2 — Examen de licență",
  combo: "Prog/OOP/SDA + Arhitecturi · Rețele · PSO",
  rezumat: "realloc/use-after-free, clasă abstractă, recursivitate (numărare biți), Big-O; adresare real-mode + timp mediu de acces; VLSM /21 + fragmentare IP + SEQ/ACK; PSO producător-consumator (format 2024).",
  html: `
<div class="exam-meta">
  <span class="info">⏱️ Timp: <b>3 ore</b></span>
  <span class="info">📋 <b>3 subiecte</b>, fiecare <b>10 puncte</b> (1 din oficiu)</span>
  <span class="info">✍️ Se răspunde la toate subiectele</span>
</div>
<p class="muted">Combinație: <b>Programare C / OOP C++ / SDA + o problemă de Arhitecturi</b> · <b>Rețele &amp; protocoale</b> · <b>PSO</b>.</p>

<!-- ============================ SUBIECTUL I ============================ -->
<h2>Subiectul I — Programare, OOP, SDA și Arhitecturi <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (1.5p) Precizați rezultatul. Dacă există erori, explicați cauza și propuneți o corecție care nu schimbă logica.</p>
<pre class="code" data-lang="c">char *s = (char*)malloc(10);
strcpy(s, "examen");
char *t = (char*)realloc(s, 20);
strcat(t, " licenta");
free(s);
free(t);
printf("%s\\n", t);</pre>

<p class="subq">b) (1.5p) Ce se întâmplă la compilare/execuție? Corectați și dați rezultatul.</p>
<pre class="code" data-lang="cpp">class Forma {
public:
    virtual double arie() = 0;          // metoda pur virtuala
    void descrie(){ cout &lt;&lt; "arie=" &lt;&lt; arie() &lt;&lt; "\\n"; }
};
class Cerc : public Forma {
    double r;
public:
    Cerc(double r) : r(r) {}
    double arie() override { return 3.14159 * r * r; }
};
int main(){
    Forma f;                 // (1)
    Cerc c(2.0);
    Forma *p = &amp;c;
    p-&gt;descrie();            // (2)
}</pre>

<p class="subq">c) (1p) Ce valoare returnează <code>f(2025)</code>? Ce calculează, de fapt, funcția?</p>
<pre class="code" data-lang="c">int f(int n){
    if(n == 0) return 0;
    return (n % 2) + f(n / 2);
}</pre>

<p class="subq">d) (2.5p) Răspundeți cu Adevărat/Fals și justificați fiecare afirmație. Apoi determinați complexitatea fragmentului.</p>
<ul>
<li>(i) <code>n² ∈ O(2ⁿ)</code></li>
<li>(ii) <code>2^(n+1) ∈ Θ(2ⁿ)</code></li>
<li>(iii) <code>n³ + 5n ∈ Θ(n² + 500n)</code></li>
<li>(iv) <code>log₂ n ∈ O(√n)</code></li>
</ul>
<pre class="code" data-lang="c">for(int i = n; i &gt; 0; i = i / 2)
    for(int j = 0; j &lt; n; j++)
        x++;</pre>

<p class="subq">e) (2.5p) Arhitecturi — mod real (8086) și ierarhia de memorie.</p>
<ul>
<li>Convertiți adresele logice <code>SEG:OFF</code> în adrese fizice (20 biți): <code>1A2B:019A</code>, <code>3911:0200</code>, <code>2591:10B5</code>, <code>1100:ABCD</code>.</li>
<li>Care dintre adresele fizice <code>1235A</code>, <code>53535</code>, <code>21700</code>, <code>ABCD0</code> pot fi <b>începutul</b> unui segment în mod real? Justificați.</li>
<li>Un cache are timpul de acces <b>T₁ = 10 ns</b> și rata de hit <b>H₁ = 0.9</b>; memoria principală are <b>T₂ = 100 ns</b>. Calculați timpul mediu de acces pentru interconectare <b>paralelă</b> și <b>secvențială</b>.</li>
</ul>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul I</summary>
<div class="rez-body">
<h4>a) realloc + use-after-free + double free</h4>
<p>După <code>realloc(s, 20)</code>, zona poate fi <b>mutată</b>: <code>s</code> devine pointer <b>invalid</b>; valid este doar <code>t</code>. Apoi <code>free(s)</code> eliberează o zonă deja invalidă, iar <code>free(t)</code> o eliberează din nou → <b>double free</b> (dacă nu s-a mutat, <code>s == t</code> ⇒ tot double free). În plus, <code>printf</code> folosește <code>t</code> <b>după</b> <code>free</code> → use-after-free.</p>
<p><b>Corecție:</b> nu mai folosi/elibera <code>s</code> după realloc; afișează înainte de a elibera; un singur <code>free</code>:</p>
<pre class="code" data-lang="c">char *t = (char*)realloc(s, 20);   /* s nu se mai foloseste */
strcat(t, " licenta");
printf("%s\\n", t);                /* "examen licenta" */
free(t);</pre>
<p>Rezultat după corecție: <code>examen licenta</code></p>

<h4>b) Clasă abstractă</h4>
<p>Linia (1) <code>Forma f;</code> dă <b>eroare de compilare</b>: <code>Forma</code> are o metodă pur virtuală (<code>arie() = 0</code>) → este <b>clasă abstractă</b> și nu poate fi instanțiată. Se elimină linia. Apoi <code>p-&gt;descrie()</code> apelează, prin legare dinamică, <code>Cerc::arie()</code> = 3.14159·2² = <b>12.56636</b>.</p>
<p>Se afișează: <code>arie=12.5664</code></p>

<h4>c) Recursivitate</h4>
<p><code>f</code> adună cifrele binare ale lui <code>n</code> (<code>n%2</code> = ultimul bit, <code>n/2</code> = deplasare la dreapta) → numără <b>biții de 1</b> (popcount). <code>2025 = 11111101001₂</code> are <b>8</b> biți de 1, deci <code>f(2025) = 8</code>.</p>

<h4>d) Big-O + complexitate</h4>
<p>(i) <b>Adevărat</b> — orice polinom este dominat de exponențială. (ii) <b>Adevărat</b> — <code>2^(n+1) = 2·2ⁿ</code>, factor constant. (iii) <b>Fals</b> — partea stângă e Θ(n³), dreapta Θ(n²). (iv) <b>Adevărat</b> — logaritmul crește mai lent decât √n.</p>
<p>Fragment: bucla exterioară se înjumătățește → <b>log₂ n</b> iterații; cea interioară → <b>n</b>. Complexitate: <b>Θ(n·log n)</b>.</p>

<h4>e) Arhitecturi</h4>
<p>Adresă fizică = <code>SEG · 16 + OFF</code> (SEG·10H + OFF):</p>
<table class="tbl"><tr><th>Logică</th><th>Calcul</th><th>Fizică</th></tr>
<tr><td>1A2B:019A</td><td>1A2B0 + 19A</td><td><code>1A44A</code></td></tr>
<tr><td>3911:0200</td><td>39110 + 200</td><td><code>39310</code></td></tr>
<tr><td>2591:10B5</td><td>25910 + 10B5</td><td><code>269C5</code></td></tr>
<tr><td>1100:ABCD</td><td>11000 + ABCD</td><td><code>1BBCD</code></td></tr></table>
<p>Început de segment ⇔ adresa fizică este multiplu de 16 (ultima cifră hex = 0): <b>21700</b> ✓ și <b>ABCD0</b> ✓; <b>1235A</b> ✗ (termină în A), <b>53535</b> ✗ (termină în 5).</p>
<p>Timp mediu de acces:</p>
<ul>
<li><b>Paralel</b> (cache și RAM pornesc simultan): T = H₁·T₁ + (1−H₁)·T₂ = 0.9·10 + 0.1·100 = <b>19 ns</b>.</li>
<li><b>Secvențial</b> (RAM se accesează doar după ratarea cache-ului): T = H₁·T₁ + (1−H₁)·(T₁+T₂) = 0.9·10 + 0.1·110 = <b>20 ns</b>.</li>
</ul>
<p class="barem">Barem: a) 1.5p · b) 1.5p · c) 1p · d) 2.5p (4×0.4p + complexitate 0.9p) · e) 2.5p (conversii 1p + segment 0.5p + Tmed 1p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL II ============================ -->
<h2>Subiectul II — Rețele și protocoale <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (3.5p) Un router are blocul <b>13.2.80.0/21</b> și trei subrețele cu necesarul: <b>X</b> = 1000 stații, <b>Y</b> = 500 stații, <b>Z</b> = 500 stații. Alocați (VLSM, descrescător) și dați pentru fiecare: adresa de rețea/prefix, masca și adresa de broadcast.</p>

<p class="subq">b) (3p) Un datagram IP cu <b>4000 octeți de date</b> (peste antetul IP) traversează o legătură cu <b>MTU = 1500</b> octeți (antet IP = 20 octeți). Determinați câte fragmente rezultă și, pentru fiecare, lungimea datelor, valoarea câmpului <b>Fragment Offset</b> (în unități de 8 octeți) și flag-ul <b>MF</b>. Ce câmpuri din antetul IP controlează fragmentarea?</p>

<p class="subq">c) (2.5p) (i) Gazda A trimite un segment TCP cu <code>SEQ = 1500</code> ce transportă <b>600 octeți</b> de date. Ce valoare <code>ACK</code> va întoarce B? (ii) Pentru un pachet RTP cu <b>160 octeți</b> de payload audio (G.711), calculați overhead-ul total (RTP+UDP+IP+Ethernet) și eficiența transmisiei.</p>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul II</summary>
<div class="rez-body">
<h4>a) VLSM din 13.2.80.0/21</h4>
<p>Blocul /21 acoperă 13.2.80.0 – 13.2.87.255 (2¹¹ = 2048 adrese).</p>
<table class="tbl"><tr><th>Subrețea</th><th>Stații</th><th>Rețea / prefix</th><th>Mască</th><th>Broadcast</th></tr>
<tr><td>X</td><td>1000</td><td>13.2.80.0/22</td><td>255.255.252.0</td><td>13.2.83.255</td></tr>
<tr><td>Y</td><td>500</td><td>13.2.84.0/23</td><td>255.255.254.0</td><td>13.2.85.255</td></tr>
<tr><td>Z</td><td>500</td><td>13.2.86.0/23</td><td>255.255.254.0</td><td>13.2.87.255</td></tr></table>
<p>1000 → /22 (2¹⁰−2 = 1022 utilizabile); 500 → /23 (510 utilizabile) de două ori.</p>

<h4>b) Fragmentare IP</h4>
<p>Payload maxim per fragment = (1500 − 20) = 1480, multiplu de 8 → 1480 OK. 4000 = 1480 + 1480 + 1040.</p>
<table class="tbl"><tr><th>Fragment</th><th>Date (octeți)</th><th>Fragment Offset (×8)</th><th>MF</th><th>Total IP</th></tr>
<tr><td>1</td><td>1480</td><td>0</td><td>1</td><td>1500</td></tr>
<tr><td>2</td><td>1480</td><td>185</td><td>1</td><td>1500</td></tr>
<tr><td>3</td><td>1040</td><td>370</td><td>0</td><td>1060</td></tr></table>
<p>Offset: 1480/8 = 185; 2960/8 = 370. Câmpurile de control: <b>Identification</b> (același pentru toate fragmentele), <b>Flags</b> (bitul <b>DF</b> = don't fragment, bitul <b>MF</b> = more fragments) și <b>Fragment Offset</b>.</p>

<h4>c) TCP și overhead RTP</h4>
<p>(i) ACK = SEQ + nr. octeți = 1500 + 600 = <b>2100</b> (următorul octet așteptat).</p>
<p>(ii) Overhead = RTP 12 + UDP 8 + IP 20 + Ethernet 18 = <b>58 octeți</b>. Cadru total = 160 + 58 = 218 octeți. Eficiență = 160/218 ≈ <b>73.4%</b>.</p>
<p class="barem">Barem: a) 3.5p · b) 3p (fragmente 2p + câmpuri 1p) · c) 2.5p (i 1p + ii 1.5p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL III ============================ -->
<h2>Subiectul III — PSO (Programarea Sistemelor de Operare) <span class="subiect-pts">10 puncte</span></h2>

<p>Un producător și un consumator comunică printr-un buffer circular partajat, sincronizat cu trei semafoare POSIX.</p>
<pre class="code" data-lang="c"> 1  #include &lt;stdio.h&gt;
 2  #include &lt;stdlib.h&gt;
 3  #include &lt;unistd.h&gt;
 4  #include &lt;sys/mman.h&gt;
 5  #include &lt;sys/wait.h&gt;
 6  #include &lt;semaphore.h&gt;
 7
 8  #define N 4        /* dimensiunea bufferului circular */
 9  #define M 8        /* numarul total de articole       */
10
11  typedef struct {
12      int   buf[N];
13      int   in, out;
14      sem_t gol;     /* sloturi libere  */
15      sem_t plin;    /* sloturi ocupate */
16      sem_t mutex;   /* excludere mutuala */
17  } Coada;
18
19  int main(void){
20      Coada *q = mmap(NULL, sizeof(Coada), PROT_READ|PROT_WRITE,
21                      MAP_SHARED|MAP_ANONYMOUS, -1, 0);
22      q-&gt;in = q-&gt;out = 0;
23      sem_init(&amp;q-&gt;gol,   1, N);
24      sem_init(&amp;q-&gt;plin,  1, 0);
25      sem_init(&amp;q-&gt;mutex, 1, 1);
26
27      if(fork() == 0){                 /* PRODUCATOR */
28          for(int i = 1; i &lt;= M; i++){
29              sem_wait(&amp;q-&gt;gol);
30              sem_wait(&amp;q-&gt;mutex);
31              q-&gt;buf[q-&gt;in] = i;
32              q-&gt;in = (q-&gt;in + 1) % N;
33              sem_post(&amp;q-&gt;mutex);
34              sem_post(&amp;q-&gt;plin);
35          }
36          exit(0);
37      }
38      if(fork() == 0){                 /* CONSUMATOR */
39          for(int i = 1; i &lt;= M; i++){
40              sem_wait(&amp;q-&gt;plin);
41              sem_wait(&amp;q-&gt;mutex);
42              int x = q-&gt;buf[q-&gt;out];
43              q-&gt;out = (q-&gt;out + 1) % N;
44              sem_post(&amp;q-&gt;mutex);
45              sem_post(&amp;q-&gt;gol);
46              printf("consumat: %d\\n", x);
47          }
48          exit(0);
49      }
50      wait(NULL); wait(NULL);
51      return 0;
52  }</pre>

<p class="subq">Răspundeți, justificat:</p>
<ol>
<li>Câte procese se creează în total (liniile 27 și 38)? De ce <code>exit(0)</code> de la linia 36 este esențial?</li>
<li>Care este rolul fiecărui semafor (<code>gol</code>, <code>plin</code>, <code>mutex</code>) și de ce sunt inițializate cu N, 0, respectiv 1?</li>
<li>De ce <code>sem_wait(&amp;q-&gt;gol)</code> se face <b>înaintea</b> lui <code>sem_wait(&amp;q-&gt;mutex)</code> (liniile 29–30)? Ce s-ar întâmpla dacă s-ar inversa?</li>
<li>De ce trebuie ca structura <code>Coada</code> (cu tot cu semafoare) să fie în memorie partajată (<code>mmap</code>)? Ce rol are al doilea argument <code>1</code> din <code>sem_init</code>?</li>
<li>Ce s-ar întâmpla dacă s-ar elimina semafoarele <code>gol</code> și <code>plin</code> (rămânând doar <code>mutex</code>)?</li>
<li>Ce afișează consumatorul și în ce ordine sunt valorile? Este ordinea garantată?</li>
</ol>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul III</summary>
<div class="rez-body">
<h4>1. Numărul de procese</h4>
<p><b>3 procese:</b> părinte + producător + consumator. Primul <code>fork</code> (27) creează producătorul (copil), care execută bucla și apoi <code>exit(0)</code> (36). Părintele (fork ≠ 0) sare peste blocul producător, ajunge la al doilea <code>fork</code> (38) și creează consumatorul. <code>exit(0)</code> de la linia 36 este esențial: fără el, <b>producătorul ar ajunge și el la linia 38</b> și ar mai crea un proces (al doilea „consumator”) → 4 procese și comportament greșit.</p>
<h4>2. Cele trei semafoare</h4>
<p><code>gol</code> = numărul de <b>sloturi libere</b> (inițial N = bufferul e gol) — blochează producătorul când bufferul e plin. <code>plin</code> = numărul de <b>sloturi ocupate</b> (inițial 0) — blochează consumatorul când bufferul e gol. <code>mutex</code> = semafor binar (inițial 1) pentru <b>excludere mutuală</b> la accesul indicilor/bufferului.</p>
<h4>3. Ordinea sem_wait</h4>
<p>Întâi semaforul de resursă (<code>gol</code>), apoi <code>mutex</code>. Dacă s-ar inversa și bufferul e plin, producătorul ar lua <code>mutex</code> și apoi s-ar bloca pe <code>gol</code> <b>ținând mutex-ul</b>; consumatorul nu ar mai putea intra (e blocat pe mutex) pentru a elibera un slot → <b>deadlock</b> (interblocare).</p>
<h4>4. Memorie partajată</h4>
<p>Producătorul și consumatorul sunt <b>procese diferite</b>; bufferul, indicii și semafoarele trebuie să fie aceeași copie pentru ambele → <code>mmap</code> cu <code>MAP_SHARED|MAP_ANONYMOUS</code>. Al doilea argument <code>1</code> (<code>pshared</code>) din <code>sem_init</code> spune că semaforul e <b>partajat între procese</b>, nu doar între firele unui proces. Fără partajare, fiecare proces ar avea propria copie → sincronizarea nu ar funcționa.</p>
<h4>5. Fără gol/plin</h4>
<p>Dispare controlul plin/gol: producătorul ar <b>suprascrie</b> articole neconsumate când bufferul e plin (lost updates), iar consumatorul ar citi <b>sloturi goale</b> / date vechi când bufferul e gol. Mutex-ul singur asigură doar accesul exclusiv, nu și condiția „producă înainte de a consuma”.</p>
<h4>6. Ce se afișează</h4>
<p>Se afișează <code>consumat: 1</code> … <code>consumat: 8</code>. Valorile sunt în <b>ordine crescătoare 1..8</b> (coadă FIFO + semafoarele forțează ca fiecare articol să fie produs înainte de a fi consumat). Momentul exact al afișării față de producător este nedeterminist, dar <b>ordinea valorilor este garantată</b>.</p>
<p class="barem">Barem: câte 1.5p pentru întrebările 1–6 (= 9p) + 1p din oficiu.</p>
</div>
</details>
`
});
