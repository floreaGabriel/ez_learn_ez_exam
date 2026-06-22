// ============================================================
//  Model 3 — Prog/OOP/SDA + Arhitecturi · Baze de date · PSO
// ============================================================
SUBIECTE.push({
  id: "model-3",
  navTitlu: "Model 3",
  titlu: "Model 3 — Examen de licență",
  combo: "Prog/OOP/SDA + Arhitecturi · Baze de date · PSO",
  rezumat: "Pointer dangling (return &local), ordinea constructor/destructor cu moștenire + compunere, aritmetică pe char, numărare noduri BST în interval și cache 4-way set-associative; 8 interogări T-SQL pe o bibliotecă; PSO cu sold partajat și semafor binar (format 2024 + 6 întrebări).",
  html: `
<div class="exam-meta">
  <span class="info">⏱️ Timp: <b>3 ore</b></span>
  <span class="info">📋 <b>3 subiecte</b>, fiecare <b>10 puncte</b> (1 din oficiu)</span>
  <span class="info">✍️ Se răspunde la toate subiectele</span>
</div>
<p class="muted">Combinație: <b>Programare C / OOP C++ / SDA + o problemă de Arhitecturi</b> · <b>Baze de date (T-SQL)</b> · <b>PSO</b>. Fiecare subiect are rezolvarea ascunsă — încearcă întâi singur, apoi verifică.</p>

<!-- ============================ SUBIECTUL I ============================ -->
<h2>Subiectul I — Programare, OOP, SDA și Arhitecturi <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (1.5p) Precizați ce afișează programul. Dacă există o eroare, explicați cauza și propuneți o corecție care nu schimbă logica, apoi dați rezultatul final. (Se consideră toate antetele incluse.)</p>
<pre class="code" data-lang="c">int* maxim(int a, int b){
    int r = a &gt; b ? a : b;
    return &amp;r;
}
int main(void){
    int *p = maxim(3, 7);
    printf("%d", *p);
    return 0;
}</pre>

<p class="subq">b) (1.5p) Ce afișează secvența? Justificați ordinea apelurilor de constructor și destructor.</p>
<pre class="code" data-lang="cpp">class Motor {
public:
    Motor(){ cout &lt;&lt; "Motor "; }
    ~Motor(){ cout &lt;&lt; "~Motor "; }
};
class Vehicul {
public:
    Vehicul(){ cout &lt;&lt; "Vehicul "; }
    ~Vehicul(){ cout &lt;&lt; "~Vehicul "; }
};
class Masina : public Vehicul {
    Motor m;
public:
    Masina(){ cout &lt;&lt; "Masina "; }
    ~Masina(){ cout &lt;&lt; "~Masina "; }
};
int main(){
    { Masina x; }
}</pre>

<p class="subq">c) (1p) Ce afișează? Justificați prin codul ASCII.</p>
<pre class="code" data-lang="c">char c = 'A' + 5;
printf("%c %d\\n", c, c);</pre>

<p class="subq">d) (2.5p) SDA — Scrieți o funcție C care numără nodurile unui <b>arbore binar de căutare</b> (BST) a căror cheie se află în intervalul <code>[min, max]</code> și arătați cum se apelează. Tipul nodului:</p>
<pre class="code" data-lang="c">typedef struct Nod{
    int cheie;
    struct Nod *st, *dr;
} Nod;</pre>

<p class="subq">e) (2.5p) Arhitecturi — Un sistem are memoria principală de <b>4 GB</b> și o memorie <b>cache cu mapare set-asociativă pe 4 căi (4-way)</b> de <b>32 KB</b>, cu blocuri (linii) de <b>64 octeți</b>. Adresarea se face la nivel de octet.</p>
<ul>
<li>Câți biți are adresa fizică? Determinați împărțirea ei în câmpurile <b>tag</b> / <b>index de set</b> / <b>deplasament în bloc</b>.</li>
<li>Câte linii și câte seturi are cache-ul? Câte comparatoare sunt necesare?</li>
<li>În ce set se mapează blocul de memorie cu numărul <b>1000</b>?</li>
</ul>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul I</summary>
<div class="rez-body">
<h4>a) Pointer dangling (adresa unei variabile locale)</h4>
<p>Funcția <code>maxim</code> returnează <code>&amp;r</code>, adresa variabilei <b>locale</b> <code>r</code>. Aceasta trăiește pe <b>stivă</b> și este distrusă la ieșirea din funcție → <code>p</code> devine un <b>pointer suspendat (dangling)</b>; dereferențierea lui <code>*p</code> este <b>comportament nedefinit</b> (poate afișa o valoare oarecare, poate da crash).</p>
<p><b>Corecție</b> (se returnează valoarea, nu adresa — logica „maximul a două numere” rămâne):</p>
<pre class="code" data-lang="c">int maxim(int a, int b){
    int r = a &gt; b ? a : b;
    return r;                /* se returneaza valoarea */
}
int main(void){
    int p = maxim(3, 7);
    printf("%d", p);
    return 0;
}</pre>
<p>După corecție: <code>maxim(3, 7) = 7</code>. <b>Se afișează 7.</b> (Alternativ: <code>r</code> ca variabilă <code>static</code> sau alocată pe heap.)</p>

<h4>b) Ordinea constructor / destructor (moștenire + compunere)</h4>
<p>La construirea unui obiect <code>Masina</code>, ordinea este: întâi <b>clasa de bază</b> (<code>Vehicul</code>), apoi <b>membrii</b> în ordinea declarării (<code>Motor m</code>), apoi <b>corpul constructorului</b> clasei derivate (<code>Masina</code>) → <code>Vehicul Motor Masina</code>.</p>
<p>La distrugere, ordinea este <b>exact inversă</b>: corpul derivatei (<code>~Masina</code>), apoi membrii (<code>~Motor</code>), apoi baza (<code>~Vehicul</code>) → <code>~Masina ~Motor ~Vehicul</code>. Obiectul <code>x</code> este distrus la ieșirea din blocul <code>{ }</code>.</p>
<p>Se afișează: <code>Vehicul Motor Masina ~Masina ~Motor ~Vehicul</code></p>

<h4>c) Aritmetică pe char</h4>
<p>Literalul <code>'A'</code> are codul ASCII <b>65</b>; <code>'A' + 5 = 70</code>, care este codul lui <code>'F'</code>. Cu <code>%c</code> se afișează caracterul, cu <code>%d</code> valoarea numerică.</p>
<p>Se afișează: <code>F 70</code></p>

<h4>d) Numărarea nodurilor BST din interval</h4>
<p>Se folosește proprietatea BST pentru a <b>tăia (prune)</b> subarbori care nu pot conține chei valide:</p>
<pre class="code" data-lang="c">int count_interval(Nod *r, int min, int max){
    if(r == NULL) return 0;
    if(r-&gt;cheie &lt; min)  return count_interval(r-&gt;dr, min, max);
    if(r-&gt;cheie &gt; max)  return count_interval(r-&gt;st, min, max);
    return 1 + count_interval(r-&gt;st, min, max)
             + count_interval(r-&gt;dr, min, max);
}</pre>
<p><b>Apel</b> (numără cheile din <code>[10, 50]</code>):</p>
<pre class="code" data-lang="c">printf("%d\\n", count_interval(radacina, 10, 50));</pre>
<div class="tip"><b>Tăierea BST:</b> dacă cheia nodului <code>&lt; min</code>, toate cheile din subarborele <b>stâng</b> sunt și mai mici → căutăm doar în <b>dreapta</b>. Dacă cheia <code>&gt; max</code>, subarborele <b>drept</b> e tot prea mare → căutăm doar în <b>stânga</b>. Altfel nodul e în interval (îl numărăm) și explorăm ambii subarbori.</div>
<p>Complexitate: <b>O(n)</b> în cazul cel mai defavorabil (interval acoperind tot arborele), dar mult mai bună când tăierea elimină subarbori întregi.</p>

<h4>e) Cache set-asociativ pe 4 căi</h4>
<ul>
<li>Memorie 4 GB = 2³² octeți → <b>adresă fizică pe 32 de biți</b>.</li>
<li>Bloc 64 = 2⁶ octeți → <b>deplasament = 6 biți</b>.</li>
<li>Nr. linii = 32 KB / 64 = 2¹⁵ / 2⁶ = 2⁹ = <b>512 linii</b>.</li>
<li>Nr. seturi = 512 / 4 = 2⁷ = <b>128 seturi</b> → <b>index de set = 7 biți</b>.</li>
<li>Tag = 32 − 7 − 6 = <b>19 biți</b>.</li>
</ul>
<table class="tbl"><tr><th>Tag</th><th>Index set</th><th>Deplasament</th></tr>
<tr><td>19 biți</td><td>7 biți</td><td>6 biți</td></tr></table>
<p>Sunt necesare <b>4 comparatoare</b> (câte unul pentru fiecare cale), care compară în paralel tag-ul de 19 biți cu cele 4 taguri din setul selectat.</p>
<p>Un bloc cu numărul <code>j</code> se mapează în setul <code>j mod 128</code>; în interiorul setului poate ocupa oricare dintre cele 4 linii (înlocuire de ex. <b>LRU</b>). Pentru blocul <b>1000</b>: <code>1000 mod 128 = 104</code> → <b>setul 104</b>.</p>
<p class="barem">Barem: a) 1.5p · b) 1.5p · c) 1p · d) 2.5p (funcție 1.75p + apel + explicație tăiere 0.75p) · e) 2.5p (împărțire biți 1p + seturi/comparatoare 1p + mapare bloc 0.5p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL II ============================ -->
<h2>Subiectul II — Baze de date <span class="subiect-pts">10 puncte</span></h2>

<p>Se consideră schema relațională (dialect <b>T-SQL / SQL Server</b>):</p>
<div class="callout">
<table class="tbl">
<tr><th>Tabel</th><th>Coloane (PK / FK)</th></tr>
<tr><td><b>Carti</b></td><td><code>IDCarte</code> (PK), <code>Titlu</code>, <code>Autor</code>, <code>AnAparitie</code>, <code>Domeniu</code>, <code>NrExemplare</code></td></tr>
<tr><td><b>Cititori</b></td><td><code>IDCititor</code> (PK), <code>Nume</code>, <code>Prenume</code>, <code>DataInscriere</code>, <code>Oras</code></td></tr>
<tr><td><b>Imprumuturi</b></td><td><code>IDImprumut</code> (PK), <code>IDCarte</code> (FK → Carti), <code>IDCititor</code> (FK → Cititori), <code>DataImprumut</code>, <code>DataReturnare</code> (NULL dacă nereturnată)</td></tr>
</table>
</div>
<p>Scrieți următoarele interogări SQL:</p>

<p class="subq">a) (1p) Cărțile din domeniul <code>'Informatica'</code> apărute după 2015, ordonate descrescător după an.</p>
<p class="subq">b) (1p) Câți cititori sunt din <code>'Cluj-Napoca'</code>.</p>
<p class="subq">c) (1.25p) Titlul cărții și cititorul (nume, prenume) pentru cărțile împrumutate și <b>nereturnate</b>.</p>
<p class="subq">d) (1.25p) Pentru fiecare domeniu, numărul de titluri și totalul de exemplare.</p>
<p class="subq">e) (1.25p) Cititorii care au făcut <b>cel puțin 3</b> împrumuturi.</p>
<p class="subq">f) (1.25p) Primele 3 cele mai împrumutate cărți (titlu + număr de împrumuturi).</p>
<p class="subq">g) (1p) Cărțile care nu au fost <b>niciodată</b> împrumutate.</p>
<p class="subq">h) (1p) Numele cititorilor care au împrumutat cartea cu titlul <code>'Sisteme de operare'</code>.</p>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul II</summary>
<div class="rez-body">
<h4>a) Domeniul 'Informatica' după 2015, descrescător după an</h4>
<pre class="code" data-lang="sql">SELECT *
FROM Carti
WHERE Domeniu = 'Informatica' AND AnAparitie &gt; 2015
ORDER BY AnAparitie DESC;</pre>

<h4>b) Număr cititori din 'Cluj-Napoca'</h4>
<pre class="code" data-lang="sql">SELECT COUNT(*)
FROM Cititori
WHERE Oras = 'Cluj-Napoca';</pre>

<h4>c) Cărți împrumutate și nereturnate (titlu + cititor)</h4>
<pre class="code" data-lang="sql">SELECT c.Titlu, ct.Nume, ct.Prenume
FROM Imprumuturi i
JOIN Carti    c  ON i.IDCarte   = c.IDCarte
JOIN Cititori ct ON i.IDCititor = ct.IDCititor
WHERE i.DataReturnare IS NULL;</pre>

<h4>d) Pe domeniu: număr de titluri și total exemplare</h4>
<pre class="code" data-lang="sql">SELECT Domeniu,
       COUNT(*)        AS NrTitluri,
       SUM(NrExemplare) AS TotalExemplare
FROM Carti
GROUP BY Domeniu;</pre>

<h4>e) Cititori cu cel puțin 3 împrumuturi</h4>
<pre class="code" data-lang="sql">SELECT ct.Nume, ct.Prenume, COUNT(*) AS NrImprumuturi
FROM Imprumuturi i
JOIN Cititori ct ON i.IDCititor = ct.IDCititor
GROUP BY i.IDCititor, ct.Nume, ct.Prenume
HAVING COUNT(*) &gt;= 3;</pre>
<div class="tip"><b>Atenție:</b> condiția de agregare se pune în <code>HAVING</code> (după <code>GROUP BY</code>), nu în <code>WHERE</code>.</div>

<h4>f) Primele 3 cele mai împrumutate cărți</h4>
<pre class="code" data-lang="sql">SELECT TOP 3 c.Titlu, COUNT(*) AS NrImprumuturi
FROM Imprumuturi i
JOIN Carti c ON i.IDCarte = c.IDCarte
GROUP BY c.Titlu
ORDER BY COUNT(*) DESC;</pre>

<h4>g) Cărți niciodată împrumutate</h4>
<pre class="code" data-lang="sql">SELECT Titlu
FROM Carti
WHERE IDCarte NOT IN (SELECT IDCarte FROM Imprumuturi);</pre>

<h4>h) Cititorii cărții 'Sisteme de operare'</h4>
<pre class="code" data-lang="sql">SELECT DISTINCT ct.Nume, ct.Prenume
FROM Imprumuturi i
JOIN Carti    c  ON i.IDCarte   = c.IDCarte
JOIN Cititori ct ON i.IDCititor = ct.IDCititor
WHERE c.Titlu = 'Sisteme de operare';</pre>
<p class="barem">Barem: a) 1p · b) 1p · c) 1.25p · d) 1.25p · e) 1.25p · f) 1.25p · g) 1p · h) 1p (total 9p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL III ============================ -->
<h2>Subiectul III — PSO (Programarea Sistemelor de Operare) <span class="subiect-pts">10 puncte</span></h2>

<p>Trei procese actualizează un sold partajat, sincronizat cu un semafor binar aflat în memorie partajată.</p>
<pre class="code" data-lang="c"> 1  #include &lt;stdio.h&gt;
 2  #include &lt;stdlib.h&gt;
 3  #include &lt;unistd.h&gt;
 4  #include &lt;sys/wait.h&gt;
 5  #include &lt;sys/mman.h&gt;
 6  #include &lt;semaphore.h&gt;
 7
 8  #define N       1000    /* depuneri per proces */
 9  #define PROCESE 3
10
11  int   *sold;            /* sold partajat   */
12  sem_t *mutex;           /* semafor binar   */
13
14  void depune(int suma){
15      sem_wait(mutex);
16      int tmp = *sold;        /* citeste  */
17      tmp = tmp + suma;       /* modifica */
18      *sold = tmp;            /* scrie    */
19      sem_post(mutex);
20  }
21
22  int main(void){
23      sold  = mmap(NULL, sizeof(int),   PROT_READ|PROT_WRITE,
24                   MAP_SHARED|MAP_ANONYMOUS, -1, 0);
25      mutex = mmap(NULL, sizeof(sem_t), PROT_READ|PROT_WRITE,
26                   MAP_SHARED|MAP_ANONYMOUS, -1, 0);
27      *sold = 0;
28      sem_init(mutex, 1, 1);
29
30      for(int p = 0; p &lt; PROCESE; p++)
31          if(fork() == 0){
32              for(int i = 0; i &lt; N; i++) depune(10);
33              exit(0);
34          }
35      for(int p = 0; p &lt; PROCESE; p++) wait(NULL);
36
37      printf("sold final = %d\\n", *sold);
38      return 0;
39  }</pre>

<p class="subq">Răspundeți, justificat:</p>
<ol>
<li>Câte procese se creează în bucla 30–34?</li>
<li>Ce afișează linia 37 și de ce este rezultatul garantat?</li>
<li>De ce sunt <code>sold</code> și <code>mutex</code> în memorie partajată (<code>mmap</code>)? Ce s-ar întâmpla cu un <code>int sold;</code> global obișnuit?</li>
<li>Ce s-ar întâmpla dacă s-ar elimina <code>sem_wait</code> / <code>sem_post</code> (liniile 15, 19)?</li>
<li>Care este rolul lui <code>exit(0)</code> de la linia 33?</li>
<li>Cum diferă rezultatul cu și fără mutex la două execuții consecutive?</li>
</ol>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul III</summary>
<div class="rez-body">
<h4>1. Numărul de procese create</h4>
<p>Bucla creează <b>3 procese copil</b>. Părintele execută <code>fork()</code> de 3 ori (câte o iterație); fiecare copil are <code>fork() == 0</code>, execută blocul (bucla de depuneri) și apoi <code>exit(0)</code>, deci nu mai continuă bucla. În total rulează <b>părinte + 3 copii = 4 procese</b>.</p>
<h4>2. Ce afișează linia 37</h4>
<p><code>sold final = <b>30000</b></code>. Fiecare dintre cele 3 procese face 1000 de depuneri a câte 10 → 3 × 1000 × 10 = <b>30000</b>. Rezultatul este <b>garantat</b> deoarece funcția <code>depune</code> este protejată de semaforul binar (<code>mutex</code>): operația <b>citește–modifică–scrie</b> (liniile 16–18) devine <b>atomică</b>, deci nu se pierde nicio actualizare.</p>
<h4>3. De ce memorie partajată</h4>
<p><code>fork()</code> copiază variabilele globale (copy-on-write) → fără <code>mmap</code>, cu un simplu <code>int sold;</code> global, <b>fiecare proces ar avea propria copie</b> a soldului. Modificările făcute de copii nu s-ar vedea în părinte, iar linia 37 ar afișa <b>0</b>. <code>mmap</code> cu <code>MAP_SHARED | MAP_ANONYMOUS</code> creează o zonă de <b>memorie partajată anonimă</b>, moștenită după fork, astfel încât toate procesele văd <b>același</b> sold și <b>același</b> semafor.</p>
<h4>4. Fără sem_wait / sem_post</h4>
<p>Apare o <b>condiție de cursă (race condition)</b>: secțiunea citește–modifică–scrie (16–18) se întrețese între procese → <b>actualizări pierdute (lost updates)</b>. Soldul final devine <b>&lt; 30000</b> și are o valoare <b>nedeterministă</b> la fiecare rulare.</p>
<h4>5. Rolul lui exit(0) (linia 33)</h4>
<p>Împiedică copilul să continue bucla <code>for</code> a părintelui (linia 30) și să creeze la rândul lui alte procese (efect de tip <b>fork bomb</b> / procese în plus). Cu <code>exit(0)</code>, fiecare copil își termină depunerile și se oprește; doar părintele continuă bucla de fork.</p>
<h4>6. Cu și fără mutex (două execuții)</h4>
<p><b>CU mutex:</b> rezultatul este <b>determinist</b> — la orice rulare se afișează <code>sold final = 30000</code>.</p>
<p><b>FĂRĂ mutex:</b> valori <b>diferite</b>, toate <b>&lt; 30000</b>, din cauza întrețeserii (lost updates) — nedeterminist:</p>
<table class="tbl"><tr><th>Execuția A (fără mutex)</th><th>Execuția B (fără mutex)</th></tr>
<tr><td><code>sold final = 21450</code></td><td><code>sold final = 18030</code></td></tr></table>
<p class="barem">Barem: câte 1.5p pentru întrebările 1–6 (= 9p) + 1p din oficiu. Se punctează justificarea, nu doar răspunsul.</p>
</div>
</details>
`
});
