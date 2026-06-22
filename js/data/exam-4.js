// ============================================================
//  Model 4 — Prog/OOP/SDA + Arhitecturi · Rețele · Baze de date
// ============================================================
SUBIECTE.push({
  id: "model-4",
  navTitlu: "Model 4",
  titlu: "Model 4 — Examen de licență",
  combo: "Prog/OOP/SDA + Arhitecturi · Rețele · Baze de date",
  rezumat: "Aritmetică de pointeri, supraîncărcarea operatorilor în C++, operații pe biți, heap binar de maxim și o problemă de localitate/cache miss; VLSM /24 + învățarea tabelei CAM a unui switch + longest-prefix-match; 9 interogări T-SQL (SELECT, JOIN, GROUP BY, subcereri, UPDATE).",
  html: `
<div class="exam-meta">
  <span class="info">⏱️ Timp: <b>3 ore</b></span>
  <span class="info">📋 <b>3 subiecte</b>, fiecare <b>10 puncte</b> (1 din oficiu)</span>
  <span class="info">✍️ Se răspunde la toate subiectele</span>
</div>
<p class="muted">Combinație: <b>Programare C / OOP C++ / SDA + o problemă de Arhitecturi</b> · <b>Rețele &amp; protocoale</b> · <b>Baze de date</b>. Fiecare subiect are rezolvarea ascunsă — încearcă întâi singur, apoi verifică.</p>

<!-- ============================ SUBIECTUL I ============================ -->
<h2>Subiectul I — Programare, OOP, SDA și Arhitecturi <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (1.5p) Precizați și justificați ce afișează programul. Explicați cum funcționează aritmetica de pointeri. (Se consideră toate antetele incluse.)</p>
<pre class="code" data-lang="c">int v[5] = {10, 20, 30, 40, 50};
int *p = v + 2;
printf("%d %d %d\\n", *p, *(p+1), p[-1]);</pre>

<p class="subq">b) (1.5p) Scrieți, pentru clasa <code>Complex</code>, operatorul <code>+</code> (ca metodă) și operatorul de inserare în flux <code>&lt;&lt;</code> (ca funcție prietenă), astfel încât programul din <code>main</code> să afișeze suma celor două numere complexe. Apoi precizați ce se afișează.</p>
<pre class="code" data-lang="cpp">class Complex {
    double re, im;
public:
    Complex(double re = 0, double im = 0) : re(re), im(im) {}
    // TODO: operator+   (metoda)
    // TODO: friend operator&lt;&lt;
};
int main(){
    Complex a(1, 2), b(3, 4);
    cout &lt;&lt; a + b;
}</pre>

<p class="subq">c) (1p) Ce afișează? Lucrați pe biți și exprimați rezultatele în hexazecimal.</p>
<pre class="code" data-lang="c">unsigned char a = 0xA5;
printf("%X %X %X\\n", a ^ 0x3C, a &amp; 0x3C, a | 0x3C);</pre>

<p class="subq">d) (2.5p) Se inserează, în această ordine, cheile <b>20, 15, 30, 10, 40</b> într-un <b>heap binar de maxim</b> (max-heap) inițial vid, reprezentat ca tablou. Arătați tabloul după fiecare inserare (cu cernerea în sus / sift-up acolo unde e cazul), apoi desenați arborele final și dați tabloul final.</p>

<p class="subq">e) (2.5p) Arhitecturi — localitate și ratări de cache. O matrice <code>int A[256][256]</code> (<code>int</code> = 4 octeți) este stocată <b>pe linii</b> (row-major). Un cache cu mapare directă are blocuri de <b>64 octeți</b> (deci 16 <code>int</code>-uri pe bloc). Comparați numărul de ratări (cache miss) pentru cele două variante de parcurgere:</p>
<pre class="code" data-lang="c">/* S1: parcurgere pe linii */
for(int i = 0; i &lt; 256; i++)
    for(int j = 0; j &lt; 256; j++)
        s += A[i][j];

/* S2: parcurgere pe coloane */
for(int j = 0; j &lt; 256; j++)
    for(int i = 0; i &lt; 256; i++)
        s += A[i][j];</pre>
<ul>
<li>Câte elemente are matricea? Câte ratări produce S1 și câte S2? Care e raportul?</li>
<li>Explicați, în termeni de <b>localitate spațială</b>, de ce diferă.</li>
</ul>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul I</summary>
<div class="rez-body">
<h4>a) Aritmetica de pointeri</h4>
<p><code>p = v + 2</code> indică spre <code>v[2]</code>. Aritmetica de pointeri se scalează cu <code>sizeof(int)</code>: <code>p+1</code> adună <b>4 octeți</b> (un <code>int</code>), nu un octet, deci ajunge la <code>v[3]</code>; iar <code>p[-1]</code> ≡ <code>*(p-1)</code> = <code>v[1]</code>.</p>
<table class="tbl"><tr><th>Expresie</th><th>Element</th><th>Valoare</th></tr>
<tr><td><code>*p</code></td><td><code>v[2]</code></td><td>30</td></tr>
<tr><td><code>*(p+1)</code></td><td><code>v[3]</code></td><td>40</td></tr>
<tr><td><code>p[-1]</code></td><td><code>v[1]</code></td><td>20</td></tr></table>
<p>Se afișează: <code>30 40 20</code></p>

<h4>b) Supraîncărcarea operatorilor</h4>
<p>Operatorul <code>+</code> ca <b>metodă</b> primește <b>un singur</b> argument explicit (operandul drept); operandul stâng este <code>*this</code>. Operatorul <code>&lt;&lt;</code> nu poate fi metodă a clasei <code>Complex</code> (operandul stâng e <code>ostream</code>), deci se declară funcție <b>prietenă</b>.</p>
<pre class="code" data-lang="cpp">class Complex {
    double re, im;
public:
    Complex(double re = 0, double im = 0) : re(re), im(im) {}

    Complex operator+(const Complex&amp; alt) const {
        return Complex(re + alt.re, im + alt.im);
    }
    friend ostream&amp; operator&lt;&lt;(ostream&amp; out, const Complex&amp; c){
        out &lt;&lt; c.re &lt;&lt; "+" &lt;&lt; c.im &lt;&lt; "i";
        return out;
    }
};</pre>
<p>Pentru <code>a(1,2)</code> și <code>b(3,4)</code>: <code>a + b = Complex(4, 6)</code>. Se afișează: <code>4+6i</code></p>

<h4>c) Operații pe biți</h4>
<p><code>0xA5 = 1010 0101b</code>, <code>0x3C = 0011 1100b</code>.</p>
<table class="tbl"><tr><th>Operație</th><th>Calcul (binar)</th><th>Rezultat (hex)</th></tr>
<tr><td><code>a ^ 0x3C</code></td><td>1001 1001</td><td><code>0x99</code></td></tr>
<tr><td><code>a &amp; 0x3C</code></td><td>0010 0100</td><td><code>0x24</code></td></tr>
<tr><td><code>a | 0x3C</code></td><td>1011 1101</td><td><code>0xBD</code></td></tr></table>
<p>Se afișează: <code>99 24 BD</code></p>

<h4>d) Heap binar de maxim</h4>
<p>Într-un max-heap, fiecare părinte ≥ copii. Indici (de la 0): copilul i are părintele <code>(i−1)/2</code>. La inserare se adaugă la final și se face <b>cernere în sus</b> (sift-up) cât timp e mai mare decât părintele.</p>
<table class="tbl"><tr><th>Inserare</th><th>Tablou rezultat</th><th>Observație</th></tr>
<tr><td><b>20</b></td><td><code>[20]</code></td><td>rădăcina</td></tr>
<tr><td><b>15</b></td><td><code>[20, 15]</code></td><td>15 &lt; 20 → rămâne</td></tr>
<tr><td><b>30</b></td><td><code>[30, 15, 20]</code></td><td>30 &gt; 20 → sift-up, urcă la rădăcină</td></tr>
<tr><td><b>10</b></td><td><code>[30, 15, 20, 10]</code></td><td>10 &lt; 15 → rămâne</td></tr>
<tr><td><b>40</b></td><td><code>[40, 30, 20, 10, 15]</code></td><td>40 &gt; 15, apoi 40 &gt; 30 → urcă de două ori la rădăcină</td></tr></table>
<p><b>Tabloul final:</b> <code>[40, 30, 20, 10, 15]</code>.</p>
<p><b>Arborele final:</b></p>
<div class="diagram"><svg viewBox="0 0 420 200" role="img" aria-label="max-heap final">
<line x1="210" y1="33" x2="113" y2="90" stroke="#83a598" stroke-width="2"/>
<line x1="210" y1="33" x2="307" y2="90" stroke="#83a598" stroke-width="2"/>
<line x1="110" y1="100" x2="64" y2="156" stroke="#83a598" stroke-width="2"/>
<line x1="110" y1="100" x2="156" y2="156" stroke="#83a598" stroke-width="2"/>
<g font-size="14" font-weight="bold" text-anchor="middle">
<circle cx="210" cy="30" r="20" fill="#2e2515" stroke="#e9b143" stroke-width="2"/><text x="210" y="35" fill="#ece3d2">40</text>
<circle cx="110" cy="95" r="20" fill="#2a2118" stroke="#83a598" stroke-width="2"/><text x="110" y="100" fill="#ece3d2">30</text>
<circle cx="310" cy="95" r="20" fill="#2a2118" stroke="#83a598" stroke-width="2"/><text x="310" y="100" fill="#ece3d2">20</text>
<circle cx="60" cy="161" r="20" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/><text x="60" y="166" fill="#ece3d2">10</text>
<circle cx="160" cy="161" r="20" fill="#1f2616" stroke="#b8bb26" stroke-width="2"/><text x="160" y="166" fill="#ece3d2">15</text>
</g>
</svg></div>

<h4>e) Localitate și ratări de cache</h4>
<p>Matricea are <b>256 × 256 = 65536</b> elemente. Un bloc de 64 octeți conține <b>16 int-uri</b> consecutive din memorie. Cum stocarea e pe linii, cele 16 elemente dintr-un bloc sunt 16 elemente consecutive de pe aceeași <b>linie</b> a matricei.</p>
<table class="tbl"><tr><th>Variantă</th><th>Acces</th><th>Ratări</th><th>Justificare</th></tr>
<tr><td><b>S1</b> (pe linii)</td><td>consecutiv în memorie</td><td><code>65536 / 16 = <b>4096</b></code></td><td>doar prima accesare din fiecare bloc ratează; următoarele 15 sunt hit-uri</td></tr>
<tr><td><b>S2</b> (pe coloane)</td><td>la pas de 256 int-uri</td><td><b>65536</b> (fiecare acces)</td><td>elemente la 256·4 = 1024 octeți distanță → blocuri diferite, evacuate înainte de refolosire</td></tr></table>
<p>Raport S2/S1 = 65536 / 4096 = <b>16×</b> mai multe ratări.</p>
<div class="tip"><b>Localitate spațială:</b> S1 o <b>exploatează</b> — accesele consecutive cad în același bloc deja adus în cache, deci se „amortizează” un miss pe 16 accesări. S2 o <b>distruge</b> — sare de la o linie la alta (pas mare), fiecare acces atinge un bloc nou care nu va mai fi refolosit înainte de a fi evacuat, deci ratează de fiecare dată.</div>
<p class="barem">Barem: a) 1.5p · b) 1.5p (operator+ 0.75p + operator&lt;&lt; 0.75p) · c) 1p · d) 2.5p (pași 1.5p + arbore/tablou final 1p) · e) 2.5p (nr. ratări S1/S2 1.5p + explicație localitate 1p) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL II ============================ -->
<h2>Subiectul II — Rețele și protocoale <span class="subiect-pts">10 puncte</span></h2>

<p class="subq">a) (3.5p) Din blocul <b>172.16.10.0/24</b>, alocați (VLSM, în ordine descrescătoare) subrețele pentru 4 departamente cu necesarul: <b>A</b> = 60 stații, <b>B</b> = 30 stații, <b>C</b> = 12 stații, <b>D</b> = 6 stații. Pentru fiecare dați: adresa de rețea + prefix, masca și adresa de broadcast.</p>

<p class="subq">b) (3p) Un switch de nivel 2 are 4 porturi și o tabelă CAM (MAC) inițial goală. Sosesc, în ordine, trei cadre. Pentru fiecare cadru precizați ce <b>învață</b> switch-ul (src → port) și <b>decizia de comutare</b> (FLOOD către toate celelalte porturi dacă destinația e necunoscută, sau forward către portul specific dacă e cunoscută). Completați tabelul (versiunea goală urmează).</p>
<table class="tbl">
<tr><th>Cadru</th><th>Sursă (port)</th><th>Destinație</th></tr>
<tr><td>F1</td><td>MAC-A (port 1)</td><td>MAC-B</td></tr>
<tr><td>F2</td><td>MAC-C (port 3)</td><td>MAC-A</td></tr>
<tr><td>F3</td><td>MAC-B (port 2)</td><td>MAC-C</td></tr>
</table>
<table class="tbl">
<tr><th>Cadru</th><th>Învață (src → port)</th><th>Destinație cunoscută?</th><th>Decizie de comutare</th></tr>
<tr><td>F1</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
<tr><td>F2</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
<tr><td>F3</td><td class="fillcell">…</td><td class="fillcell">…</td><td class="fillcell">…</td></tr>
</table>

<p class="subq">c) (2.5p) Longest-prefix-match. Se dă tabela de rutare de mai jos. Pentru fiecare destinație precizați prin ce interfață se trimite pachetul și justificați.</p>
<table class="tbl">
<tr><th>Prefix</th><th>Interfață</th></tr>
<tr><td>192.168.0.0/16</td><td>if0</td></tr>
<tr><td>192.168.1.0/24</td><td>if1</td></tr>
<tr><td>192.168.1.128/25</td><td>if2</td></tr>
<tr><td>0.0.0.0/0 (default)</td><td>if3</td></tr>
</table>
<p>Destinații: <code>192.168.1.130</code>, <code>192.168.1.10</code>, <code>192.168.5.5</code>, <code>10.0.0.1</code>.</p>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul II</summary>
<div class="rez-body">
<h4>a) Alocare VLSM (din 172.16.10.0/24)</h4>
<p>Pentru fiecare necesar găsim cel mai mic prefix cu 2ⁿ−2 ≥ stații: 60 → /26 (62 utilizabile); 30 → /27 (30 utilizabile); 12 → /28 (14 utilizabile); 6 → /29 (6 utilizabile). Se alocă în continuare, descrescător.</p>
<table class="tbl">
<tr><th>Dept.</th><th>Stații</th><th>Rețea / prefix</th><th>Mască</th><th>Broadcast</th></tr>
<tr><td>A</td><td>60</td><td>172.16.10.0/26</td><td>255.255.255.192</td><td>172.16.10.63</td></tr>
<tr><td>B</td><td>30</td><td>172.16.10.64/27</td><td>255.255.255.224</td><td>172.16.10.95</td></tr>
<tr><td>C</td><td>12</td><td>172.16.10.96/28</td><td>255.255.255.240</td><td>172.16.10.111</td></tr>
<tr><td>D</td><td>6</td><td>172.16.10.112/29</td><td>255.255.255.248</td><td>172.16.10.119</td></tr>
</table>

<h4>b) Învățarea tabelei CAM</h4>
<table class="tbl">
<tr><th>Cadru</th><th>Învață (src → port)</th><th>Destinație cunoscută?</th><th>Decizie de comutare</th></tr>
<tr><td>F1</td><td>MAC-A → 1</td><td>MAC-B necunoscut</td><td><b>FLOOD</b> către porturile 2, 3, 4</td></tr>
<tr><td>F2</td><td>MAC-C → 3</td><td>MAC-A cunoscut (port 1)</td><td>forward doar către <b>portul 1</b></td></tr>
<tr><td>F3</td><td>MAC-B → 2</td><td>MAC-C cunoscut (port 3)</td><td>forward doar către <b>portul 3</b></td></tr>
</table>
<p>Evoluția tabelei CAM:</p>
<table class="tbl">
<tr><th>După cadru</th><th>Intrări CAM</th></tr>
<tr><td>F1</td><td>A→1</td></tr>
<tr><td>F2</td><td>A→1, C→3</td></tr>
<tr><td>F3</td><td>A→1, C→3, B→2</td></tr>
</table>
<div class="tip"><b>Ideea cheie:</b> switch-ul învață mereu adresa <b>sursă</b> (de pe ce port a venit cadrul) și ia decizia pe baza adresei <b>destinație</b>. Destinație necunoscută ⇒ inundare (flood) pe toate porturile mai puțin cel de intrare; destinație cunoscută ⇒ comutare unicast pe portul memorat.</div>

<h4>c) Longest-prefix-match</h4>
<p>Regula: dintre toate prefixele care „se potrivesc” cu destinația, câștigă cel mai <b>specific</b> (prefixul cel mai lung).</p>
<table class="tbl">
<tr><th>Destinație</th><th>Prefixe care se potrivesc</th><th>Cel mai lung</th><th>Interfață</th></tr>
<tr><td>192.168.1.130</td><td>/16, /24, /25</td><td>/25 (192.168.1.128/25 acoperă .128–.255)</td><td><b>if2</b></td></tr>
<tr><td>192.168.1.10</td><td>/16, /24</td><td>/24 (nu intră în /25 care începe la .128)</td><td><b>if1</b></td></tr>
<tr><td>192.168.5.5</td><td>/16</td><td>/16</td><td><b>if0</b></td></tr>
<tr><td>10.0.0.1</td><td>doar default /0</td><td>/0</td><td><b>if3</b></td></tr>
</table>
<p class="barem">Barem: a) 3.5p (≈0.85p/subrețea) · b) 3p (1p/cadru) · c) 2.5p (≈0.6p/destinație) · 1p din oficiu.</p>
</div>
</details>

<!-- ============================ SUBIECTUL III ============================ -->
<h2>Subiectul III — Baze de date <span class="subiect-pts">10 puncte</span></h2>

<p>Se consideră următoarea schemă relațională (SQL Server / T-SQL). Cheile primare sunt subliniate logic prin <code>PK</code>, cheile străine prin <code>FK</code>.</p>
<div class="callout">
<table class="tbl">
<tr><th>Tabel</th><th>Coloane</th></tr>
<tr><td><b>Clienti</b></td><td><code>IDClient</code> (PK), <code>Nume</code>, <code>Oras</code>, <code>Email</code></td></tr>
<tr><td><b>Produse</b></td><td><code>IDProdus</code> (PK), <code>Denumire</code>, <code>Categorie</code>, <code>Pret</code>, <code>Stoc</code></td></tr>
<tr><td><b>Comenzi</b></td><td><code>IDComanda</code> (PK), <code>IDClient</code> (FK), <code>DataComanda</code>, <code>Status</code></td></tr>
<tr><td><b>DetaliiComanda</b></td><td><code>IDComanda</code> (FK), <code>IDProdus</code> (FK), <code>Cantitate</code></td></tr>
</table>
</div>

<p class="subq">a) (1p) Produsele din categoria <code>'Laptop'</code> cu preț peste 3000, ordonate crescător după preț.</p>
<p class="subq">b) (1p) Numărul de clienți din fiecare oraș.</p>
<p class="subq">c) (1p) Comenzile din anul 2025, împreună cu numele clientului.</p>
<p class="subq">d) (1.25p) Valoarea totală a fiecărei comenzi (suma <code>Cantitate × Pret</code>).</p>
<p class="subq">e) (1.25p) Top 5 clienți după totalul cheltuit.</p>
<p class="subq">f) (1p) Produsele care nu au fost comandate niciodată.</p>
<p class="subq">g) (1.25p) Clienții cu cel puțin 2 comenzi cu status <code>'Livrata'</code>.</p>
<p class="subq">h) (1p) Măriți cu 10% prețul produselor din categoria <code>'Accesorii'</code> (UPDATE).</p>
<p class="subq">i) (1p) Categoria cu cele mai multe bucăți vândute.</p>

<details class="rezolvare"><summary>Arată rezolvarea / baremul — Subiectul III</summary>
<div class="rez-body">
<h4>a) Filtrare + sortare</h4>
<pre class="code" data-lang="sql">SELECT * FROM Produse
WHERE Categorie = 'Laptop' AND Pret &gt; 3000
ORDER BY Pret ASC;</pre>

<h4>b) Agregare pe grup (COUNT + GROUP BY)</h4>
<pre class="code" data-lang="sql">SELECT Oras, COUNT(*) AS NrClienti
FROM Clienti
GROUP BY Oras;</pre>

<h4>c) JOIN + filtru pe an</h4>
<pre class="code" data-lang="sql">SELECT co.IDComanda, cl.Nume, co.DataComanda
FROM Comenzi co
JOIN Clienti cl ON co.IDClient = cl.IDClient
WHERE YEAR(co.DataComanda) = 2025;</pre>

<h4>d) Valoarea fiecărei comenzi</h4>
<pre class="code" data-lang="sql">SELECT d.IDComanda, SUM(d.Cantitate * p.Pret) AS Valoare
FROM DetaliiComanda d
JOIN Produse p ON d.IDProdus = p.IDProdus
GROUP BY d.IDComanda;</pre>

<h4>e) Top 5 clienți după total cheltuit</h4>
<pre class="code" data-lang="sql">SELECT TOP 5 cl.Nume, SUM(d.Cantitate * p.Pret) AS TotalCheltuit
FROM Clienti cl
JOIN Comenzi co ON cl.IDClient = co.IDClient
JOIN DetaliiComanda d ON co.IDComanda = d.IDComanda
JOIN Produse p ON d.IDProdus = p.IDProdus
GROUP BY cl.Nume
ORDER BY TotalCheltuit DESC;</pre>

<h4>f) Produse niciodată comandate (subcerere / NOT IN)</h4>
<pre class="code" data-lang="sql">SELECT Denumire FROM Produse
WHERE IDProdus NOT IN (SELECT IDProdus FROM DetaliiComanda);</pre>

<h4>g) Clienți cu ≥ 2 comenzi livrate (HAVING)</h4>
<pre class="code" data-lang="sql">SELECT cl.Nume
FROM Clienti cl
JOIN Comenzi co ON cl.IDClient = co.IDClient
WHERE co.Status = 'Livrata'
GROUP BY cl.Nume
HAVING COUNT(*) &gt;= 2;</pre>

<h4>h) Actualizare preț (UPDATE)</h4>
<pre class="code" data-lang="sql">UPDATE Produse
SET Pret = Pret * 1.10
WHERE Categorie = 'Accesorii';</pre>

<h4>i) Categoria cu cele mai multe bucăți vândute</h4>
<pre class="code" data-lang="sql">SELECT TOP 1 p.Categorie, SUM(d.Cantitate) AS TotalVandut
FROM DetaliiComanda d
JOIN Produse p ON d.IDProdus = p.IDProdus
GROUP BY p.Categorie
ORDER BY TotalVandut DESC;</pre>

<div class="tip"><b>De reținut:</b> <code>WHERE</code> filtrează rândurile <b>înainte</b> de grupare, <code>HAVING</code> filtrează grupurile <b>după</b> agregare. <code>TOP n … ORDER BY</code> este forma SQL Server pentru „primele n” (echivalent <code>LIMIT</code> în alte dialecte). Subcererea cu <code>NOT IN</code> rezolvă „cele care nu apar nicăieri” (anti-join).</div>
<p class="barem">Barem: a) 1p · b) 1p · c) 1p · d) 1.25p · e) 1.25p · f) 1p · g) 1.25p · h) 1p · i) 1p (total 9p) · 1p din oficiu.</p>
</div>
</details>
`
});
