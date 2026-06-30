/* ============================================================
   OOP C++ — Teorie (mat1–mat4)
   Model de blocuri pentru randorul din index.html:
     {t:"h"|"h4", html}            — titlu / subtitlu
     {t:"p", html}                 — paragraf (acceptă <b>,<i>,<code>; escapează <,> ca &lt;,&gt;)
     {t:"ul", items:[html,...]}    — listă
     {t:"code", cod}               — snippet C++ (backtick; escape-urile afișate ca \\n)
     {t:"note", kind:"capcana"|"nuanta"|"info", html}
     {t:"cmp", left:{title,html}, right:{title,html}}
     {t:"table", head:[...], rows:[[...]]}
     {t:"diagram", scene:{regions,steps:[{cells,aliases?}]}, cap}
   ============================================================ */
const OOP_TEORIE = [

/* ===================== Capitolul 1 ===================== */
{ id:"ptr-ref", nume:"1 · Pointeri & Referințe", blocks:[
  {t:"p", html:`Un <b>pointer</b> este o variabilă obișnuită care, în loc de un număr, conține o <b>adresă de memorie</b>. Ocupă el însuși spațiu (8 octeți pe 64-bit), are propria adresă și poate fi reasignat să arate spre altceva. O <b>referință</b> este un <b>alias</b> — un al doilea nume pentru un obiect care există deja: semantic nu e un obiect separat, nu poate fi nulă, trebuie inițializată la declarare și nu poate fi relegată ulterior.`},
  {t:"code", cod:`int a = 10;
int* p = &a;   // p primește adresa lui a; &p este DIFERIT de &a
int& r = a;    // r devine alt nume pentru a; &r este IDENTIC cu &a`},
  {t:"diagram", cap:`p ocupă propria celulă (0x2000) al cărei conținut e adresa lui a — de-aici săgeata. r nu are celulă proprie: e doar o etichetă lipită pe celula lui a.`,
   scene:{regions:["stack"], steps:[{cells:{stack:[
     {id:"a",label:"int a",val:"10",addr:"0x1000"},
     {id:"b",label:"int b",val:"20",addr:"0x1010"},
     {id:"p",label:"int* p",val:"0x1000",addr:"0x2000",points:"a"}
   ]}, aliases:[{name:"int& r",target:"a"}]}]}},
  {t:"h", html:`Reasignarea — diferența esențială`},
  {t:"code", cod:`int b = 20;
p = &b;   // OK: celula lui p conține acum adresa lui b
r = b;    // NU releagă r! Copiază valoarea lui b (20) ÎN a`},
  {t:"note", kind:"capcana", html:`Pentru pointer, <code>p = &amp;b</code> schimbă <i>conținutul celulei pointerului</i>. Pentru referință, <code>r = b</code> nu poate schimba spre ce arată <code>r</code> — copiază valoarea în obiectul referit. <b>O referință nu poate fi mutată niciodată</b> după inițializare.`},
  {t:"ul", items:[
    `un pointer poate fi <code>nullptr</code>; o referință validă nu poate fi nulă;`,
    `un pointer poate fi neinițializat; o referință <b>trebuie</b> inițializată la declarare;`,
    `există aritmetică de pointeri (<code>p+1</code>, <code>p++</code>) și pointeri la pointeri (<code>int**</code>); nu există aritmetică de referințe;`,
    `poți avea un array de pointeri, dar nu un array de referințe;`,
    `dereferențiezi un pointer cu <code>*p</code> / <code>p-&gt;m</code>; referința se folosește direct, ca obiectul însuși.`
  ]},
  {t:"note", kind:"nuanta", html:`Deși semantic referința nu e un obiect, compilatorul o implementează aproape întotdeauna ca un <b>pointer ascuns</b> (un membru-referință ocupă spațiu cât un pointer). Dar limbajul ascunde asta: <code>sizeof(r)</code> dă dimensiunea lui <code>a</code> (un int), nu 8. O referință locală e deseori eliminată complet de compilator.`},
  {t:"h", html:`Parametri: valoare / pointer / referință`},
  {t:"code", cod:`void inc_valoare(int x)  { x++; }      // copie; originalul rămâne neatins
void inc_pointer(int* x) { (*x)++; }   // adresă; trebuie dereferențiat
void inc_ref(int& x)     { x++; }      // alias; se scrie ca o variabilă normală

int a = 10;
inc_valoare(a);   // a == 10
inc_pointer(&a);  // a == 11
inc_ref(a);       // a == 12`},
  {t:"note", kind:"nuanta", html:`La nivel ABI, <code>inc_pointer</code> și <code>inc_ref</code> se compilează în <b>exact același cod mașină</b>: compilatorul pune adresa lui <code>a</code> într-un registru. Diferența e doar la nivel de sursă și de garanții.`},
  {t:"diagram", cap:`Ambele variante compilează identic: adresa lui a ajunge în registrul rdi. Pointerul cere dereferențiere explicită; referința nu — dar codul mașină e același.`,
   scene:{regions:["src","reg"], steps:[{cells:{
     src:[{id:"pp",label:"inc_pointer(int* x)",val:"apel: inc_pointer(&a)",points:"rdi"},
          {id:"rr",label:"inc_ref(int& x)",val:"apel: inc_ref(a)",points:"rdi"}],
     reg:[{id:"rdi",label:"rdi",val:"= &a (adresa lui a)"}]
   }}]}},
  {t:"p", html:`Cel mai folosit caz nu e modificarea, ci <b>evitarea copiilor mari</b> cu referință constantă:`},
  {t:"code", cod:`void afiseaza(const std::string& s);   // primește adresa (8 octeți), NU copiază string-ul`},
  {t:"note", kind:"info", html:`O referință <code>const</code> se poate lega și de <b>obiecte temporare</b> (rvalue), ex. <code>afiseaza("text")</code> — un pointer obișnuit nu poate. Regulă: obiecte mici → prin valoare; obiecte mari doar pentru citire → <code>const&amp;</code>; obiecte de modificat → <code>&amp;</code> (sau <code>*</code> dacă pot lipsi).`},
  {t:"h", html:`Return — capcana referinței care atârnă`},
  {t:"code", cod:`int& element(std::vector<int>& v, int i) { return v[i]; }  // OK: v trăiește în afara funcției
element(v, 0) = 42;                                       // se poate scrie în rezultat

int& gresit() {
    int x = 5;
    return x;        // PERICOL: x e distrus când funcția se termină
}                    // referința rămâne "dangling" -> comportament nedefinit`},
  {t:"note", kind:"capcana", html:`Nu întoarce niciodată o referință sau un pointer spre o variabilă <b>locală</b>: când funcția se termină, cadrul de stivă dispare și celula e eliberată. Aceeași capcană la <code>int* gresit(){ int x=5; return &amp;x; }</code>. (Animat în <b>Memorie vizuală → Dangling</b>.)`},
  {t:"h", html:`Categorii de valori (lvalue / rvalue)`},
  {t:"p", html:`Fiecare expresie are o <b>categorie de valoare</b>. Simplificat: un <b>lvalue</b> are identitate (un nume / o adresă) și persistă; un <b>rvalue</b> e temporar și poate fi „furat” prin move. Mai fin: <b>glvalue</b> = lvalue + xvalue; <b>rvalue</b> = prvalue + xvalue.`},
  {t:"table", head:[`Expresie`,`Categorie`,`De ce`], rows:[
    [`<code>x</code> (variabilă)`,`lvalue`,`are nume / adresă`],
    [`<code>x + 1</code>, <code>42</code>`,`prvalue`,`temporar, fără identitate`],
    [`<code>"text"</code>`,`lvalue`,`literal de tip array (are adresă)`],
    [`<code>std::move(x)</code>`,`xvalue`,`„pe cale să fie mutat”`],
    [`<code>f()</code> (return prin valoare)`,`prvalue`,`temporar`],
    [`<code>arr[i]</code>, <code>*p</code>, <code>++x</code>`,`lvalue`,`desemnează un obiect`],
    [`<code>x++</code>`,`prvalue`,`întoarce o copie`]
  ]},
  {t:"note", kind:"capcana", html:`<b>O rvalue reference cu nume este lvalue.</b> În <code>void f(T&amp;&amp; x)</code>, înăuntru <code>x</code> are nume → e lvalue; <code>g(x)</code> alege <b>copy</b>. Ca să muți mai departe, scrii <code>g(std::move(x))</code>. (Animat în <b>Scenarii → O rvalue reference cu nume este lvalue</b>.)`},
  {t:"note", kind:"nuanta", html:`<code>decltype(x)</code> dă tipul declarat; <code>decltype((x))</code> (cu paranteze) ține cont de categoria de valoare → dă o <b>referință</b> (ex. <code>int&amp;</code> pentru un lvalue).`},
  {t:"h4", html:`Reguli de legare`},
  {t:"table", head:[`Tip referință`,`Leagă`], rows:[
    [`<code>T&amp;</code> (lvalue ref non-const)`,`doar lvalue`],
    [`<code>const T&amp;</code>`,`orice: lvalue, rvalue, temporar`],
    [`<code>T&amp;&amp;</code> (rvalue ref)`,`doar rvalue — iar un <code>T&amp;&amp;</code> cu nume e lvalue!`]
  ]},
  {t:"note", kind:"info", html:`<b>Lifetime extension:</b> legarea <b>directă</b> a unui temporar de un <code>const T&amp;</code> (sau <code>T&amp;&amp;</code>) îi <b>prelungește viața</b> cât trăiește referința. DAR nu se aplică prin valoarea de retur a unei funcții (ex. <code>vec[0]</code>), nici printr-un <b>membru-referință</b> al unei clase → acolo obții dangling. (Animat în <b>Scenarii → Lifetime extension cu const&amp;</b>.)`},
  {t:"h", html:`Când folosești care`},
  {t:"cmp",
    left:{title:`Referință`, html:`<p>„Garantat acolo, doar alt nume.”</p><ul><li>obiectul există mereu, nu poate lipsi</li><li>sintaxă curată, fără <code>*</code>/<code>&amp;</code></li><li>obiecte mari pentru citire (<code>const&amp;</code>)</li></ul>`},
    right:{title:`Pointer`, html:`<p>„Poate fi acolo, poate fi reasignat.”</p><ul><li>argumentul poate lipsi (<code>nullptr</code>)</li><li>relegare spre obiecte diferite în timp</li><li>structuri de date (liste, arbori), aritmetică, ownership (preferă <code>unique_ptr</code>/<code>shared_ptr</code>)</li></ul>`}}
]},

/* ===================== Capitolul 2 ===================== */
{ id:"ctor-copy-move", nume:"2 · Constructori, Copy & Move", blocks:[
  {t:"p", html:`Un constructor nu „creează” obiectul în sensul alocării memoriei — aceasta e deja rezervată (pe stivă, heap sau în segmentul de date) <b>înainte</b> ca el să ruleze. Constructorul doar <b>inițializează</b> acea zonă: aduce obiectul dintr-o stare brută într-una validă conform invarianților clasei.`},
  {t:"code", cod:`class Buffer {
    size_t size_;
    int* data_;
public:
    Buffer(size_t n)
        : size_(n),               // lista de inițializare
          data_(new int[n]())     // alocare pe heap
    { /* corpul rulează DUPĂ ce membrii sunt inițializați */ }
    ~Buffer() { delete[] data_; }
};`},
  {t:"diagram", cap:`Obiectul b ocupă 16 octeți pe stivă (size_ + data_); datele propriu-zise sunt pe heap. Obiectul "deține" o resursă care trăiește în altă parte — aici e cheia problemelor de copy/move.`,
   scene:{regions:["stack","heap"], steps:[{cells:{
     stack:[{id:"s",label:"b.size_",val:"3",addr:"0x7ffe10"},{id:"d",label:"b.data_",val:"0x55a3f0",addr:"0x7ffe18",points:"blk"}],
     heap:[{id:"blk",label:"int[3]",val:"[0, 0, 0]",addr:"0x55a3f0"}]
   }}]}},
  {t:"h", html:`Listă de inițializare vs. atribuire în corp`},
  {t:"code", cod:`Buffer(size_t n) {
    size_ = n;            // ATRIBUIRE, nu inițializare
    data_ = new int[n];
}`},
  {t:"note", kind:"nuanta", html:`Membrii sunt <b>întotdeauna</b> inițializați înainte de a intra în corp. Dacă nu-i pui în lista de inițializare, sunt construiți cu constructorul implicit și apoi suprascriși prin atribuire — muncă dublă. Pentru un <code>const int</code> sau o referință, atribuirea în corp <b>nici nu compilează</b>.`},
  {t:"h", html:`Ordinea de inițializare a membrilor`},
  {t:"code", cod:`class X {
    int a_;
    int b_;
public:
    X(int v) : b_(v), a_(b_) {}   // a_ se inițializează PRIMUL (e declarat primul)!
};                                 // dar b_ încă n-are valoare -> a_ primește gunoi`},
  {t:"note", kind:"capcana", html:`Ordinea de inițializare este <b>ordinea declarării în clasă</b>, NU ordinea din lista de inițializare. Compilatorul cu <code>-Wall</code> avertizează. Întrebare frecventă la interviu.`},
  {t:"h", html:`Moștenire: layout și ordinea de construcție`},
  {t:"p", html:`Un obiect derivat <b>conține fizic</b> subobiectul bazei la începutul său (la moștenire simplă). De-aceea un <code>Base*</code> spre un <code>Derived</code> are aceeași adresă numerică — pointerul arată exact spre porțiunea Base, la offset 0.`},
  {t:"diagram", cap:`Subobiectul Base (vptr + x_) ocupă primii octeți; y_ (Derived) reutilizează padding-ul bazei (offset +12) -> sizeof(Derived) = 16 octeți.`,
   scene:{regions:["obj"], steps:[{cells:{obj:[
     {id:"v",label:"vptr  (Base)",val:"→ vtable Derived",addr:"+0"},
     {id:"x",label:"int x_  (Base)",val:"4 octeți",addr:"+8"},
     {id:"y",label:"int y_  (Derived)",val:"4 octeți",addr:"+12"}
   ]}}]}},
  {t:"p", html:`<b>Ordinea de construcție:</b> (1) subobiectul bazei; (2) membrii lui Derived, în ordinea declarării; (3) corpul constructorului Derived. <b>Distrugerea e exact invers</b>: corpul <code>~Derived</code>, membrii Derived, apoi <code>~Base</code> — nu poți distruge baza înainte de derivat. (Animat în <b>Scenarii → Ordinea de construcție și distrugere</b>.)`},
  {t:"h", html:`vptr în timpul construcției`},
  {t:"code", cod:`class Base {
public:
    Base() { f(); }                        // apelează Base::f(), NU Derived::f()
    virtual void f() { std::cout << "Base\\n"; }
};
class Derived : public Base {
public:
    void f() override { std::cout << "Derived\\n"; }
};
Derived d;   // afișează "Base"`},
  {t:"note", kind:"capcana", html:`În constructorul lui <code>Base</code>, <code>vptr</code> arată încă spre vtable-ul lui Base — partea Derived nici nu există. Un apel virtual din ctor cheamă versiunea din Base. vptr-ul se „upgradează” spre vtable-ul Derived abia după ce ctor-ul Base se termină. (Animat în <b>Scenarii → Apel virtual în constructor</b>.)`},
  {t:"h", html:`Destructor virtual`},
  {t:"code", cod:`Base* p = new Derived(1, 2);
delete p;   // dacă ~Base() NU e virtual -> doar ~Base() rulează -> UB / leak`},
  {t:"note", kind:"capcana", html:`Fără destructor virtual, <code>delete p</code> printr-un <code>Base*</code> cheamă doar <code>~Base()</code>; resursele părții Derived nu se eliberează. La moștenire polimorfică, destructorul bazei <b>trebuie</b> să fie <code>virtual</code>. (Animat în <b>Scenarii → Destructor virtual</b>.)`},
  {t:"h", html:`Copy constructor — deep vs shallow`},
  {t:"code", cod:`Buffer(const Buffer& other)
    : size_(other.size_),
      data_(new int[other.size_])           // alocare NOUĂ
{ std::copy(other.data_, other.data_ + size_, data_); }`},
  {t:"note", kind:"nuanta", html:`Semnătura e <code>const Buffer&amp;</code>, nu <code>Buffer</code>: prin valoare, pentru a construi parametrul ar trebui chemat... copy constructorul → <b>recursie infinită</b>. <code>const</code> permite copierea din temporare/const și promite că nu modifici sursa.`},
  {t:"diagram", cap:`Deep copy (corect): b primește o zonă heap NOUĂ, copiată element-cu-element. Două obiecte complet independente.`,
   scene:{regions:["stack","heap"], steps:[{cells:{
     stack:[{id:"a",label:"a.data_",val:"0x55a0",addr:"0x10",points:"blkA"},{id:"b",label:"b.data_",val:"0x77c0",addr:"0x20",points:"blkB"}],
     heap:[{id:"blkA",label:"int[3]  (a)",val:"[1, 2, 3]",addr:"0x55a0"},{id:"blkB",label:"int[3]  (b)",val:"[1, 2, 3]",addr:"0x77c0"}]
   }}]}},
  {t:"diagram", cap:`Shallow copy (implicit): ambii pointeri arată spre ACEEAȘI zonă -> la distrugere, delete[] de două ori -> double free.`,
   scene:{regions:["stack","heap"], steps:[{cells:{
     stack:[{id:"a",label:"a.data_",val:"0x55a0",addr:"0x10",points:"blk"},{id:"b",label:"b.data_",val:"0x55a0",addr:"0x20",points:"blk"}],
     heap:[{id:"blk",label:"int[3]",val:"[1, 2, 3]",addr:"0x55a0"}]
   }}]}},
  {t:"note", kind:"capcana", html:`Copy-ul implicit (generat de compilator) copiază <b>valoarea pointerului</b>, nu datele. De-aici <b>Rule of Three</b>: dacă ai nevoie de destructor custom (deții o resursă), aproape sigur ai nevoie și de copy constructor și de copy assignment. (Comutator în <b>Memorie vizuală → Copy shallow / deep</b>.)`},
  {t:"h", html:`Move constructor — „furtul” resursei`},
  {t:"code", cod:`Buffer(Buffer&& other) noexcept
    : size_(other.size_),
      data_(other.data_)        // FURĂM pointerul (nu alocăm nimic)
{
    other.data_ = nullptr;      // anulăm sursa
    other.size_ = 0;
}`},
  {t:"p", html:`<code>Buffer&amp;&amp;</code> e o <b>rvalue reference</b> — se leagă de temporare sau de lucruri marcate cu <code>std::move</code>. Move-ul e <b>O(1)</b> (mută o valoare de pointer + anulare), copy-ul e <b>O(n)</b>. Heap-ul nu se eliberează — doar își schimbă proprietarul.`},
  {t:"diagram", cap:`Înainte de move: a deține zona heap cu [1, 2, 3].`,
   scene:{regions:["stack","heap"], steps:[{cells:{
     stack:[{id:"a",label:"a.data_",val:"0x55a0",addr:"0x10",points:"blk"}],
     heap:[{id:"blk",label:"int[3]",val:"[1, 2, 3]",addr:"0x55a0"}]
   }}]}},
  {t:"diagram", cap:`După move: b a preluat pointerul; a a fost anulat (nullptr). Heap-ul nu s-a copiat — doar și-a schimbat proprietarul.`,
   scene:{regions:["stack","heap"], steps:[{cells:{
     stack:[{id:"a",label:"a.data_",val:"nullptr",addr:"0x10"},{id:"b",label:"b.data_",val:"0x55a0",addr:"0x20",points:"blk"}],
     heap:[{id:"blk",label:"int[3]",val:"[1, 2, 3]",addr:"0x55a0"}]
   }}]}},
  {t:"note", kind:"nuanta", html:`După move, sursa e într-o stare <b>validă dar nespecificată</b>: ai voie doar s-o reatribui, s-o distrugi sau să întrebi <code>size()</code> — nu să presupui ce conține. Bună practică: o lași explicit goală.`},
  {t:"h", html:`std::move nu mută nimic`},
  {t:"code", cod:`template <typename T>
constexpr std::remove_reference_t<T>&& move(T&& t) noexcept {
    return static_cast<std::remove_reference_t<T>&&>(t);   // doar un CAST
}`},
  {t:"note", kind:"capcana", html:`<code>std::move</code> e doar un <b>cast</b> la rvalue; nu generează cod la runtime. Mutarea efectivă se întâmplă în move ctor. Pe un obiect <b>const</b>, <code>std::move</code> produce un <code>const T&amp;&amp;</code> care nu se leagă de move ctor (cere <code>T&amp;&amp;</code> non-const) → se alege tăcut <b>copy ctor</b>. (Animat în <b>Scenarii → std::move este doar un cast</b>.)`},
  {t:"note", kind:"info", html:`<code>std::vector</code>, la realocare, <b>mută</b> elementele doar dacă move ctor e <code>noexcept</code>; altfel le <b>copiază</b> (garanția de excepție tare). Dacă uiți <code>noexcept</code> pe move, performanța vectorilor se prăbușește în tăcere.`},
  {t:"h", html:`Copy elision / RVO`},
  {t:"code", cod:`Buffer make() { return Buffer(5); }   // NU se cheamă nici copy, nici move
Buffer b = make();                    // obiectul e construit DIRECT în b`},
  {t:"note", kind:"capcana", html:`Din C++17, copy elision pentru temporarele returnate (prvalue) e <b>obligatoriu</b>. <b>Nu pune <code>std::move</code> pe return</b> (<code>return std::move(local);</code>): dezactivează elision-ul/NRVO și forțează un move inutil. Lasă pur și simplu <code>return local;</code>. (Animat în <b>Scenarii → RVO / copy elision</b>.)`},
  {t:"h", html:`Rule of 0 / 3 / 5`},
  {t:"ul", items:[
    `<b>Rule of 3</b> (pre-C++11): dacă definești unul dintre {destructor, copy ctor, copy assignment}, probabil le vrei pe toate trei.`,
    `<b>Rule of 5</b> (C++11+): adaugă move constructor și move assignment.`,
    `<b>Rule of 0</b> (ideal modern): nu defini niciunul — folosește tipuri care se ocupă singure de resurse (<code>std::vector</code>, <code>std::string</code>, <code>std::unique_ptr</code>).`
  ]},
  {t:"note", kind:"capcana", html:`Dacă declari un <b>destructor custom</b>, move ctor și move assignment <b>nu se mai generează automat</b> — rămâi doar cu copy. O clasă cu destructor manual dar fără move scris explicit va <b>copia</b> unde te-ai aștepta să mute → penalizare de performanță invizibilă.`},
  {t:"h", html:`Copy-and-swap & self-assignment`},
  {t:"code", cod:`Buffer& operator=(Buffer o) {   // primește prin VALOARE (copy/move făcut de compilator)
    swap(*this, o);             // schimbă conținutul cu copia locală
    return *this;               // vechiul conținut moare odată cu o
}`},
  {t:"note", kind:"nuanta", html:`Idiomul <b>copy-and-swap</b>: iei argumentul prin valoare, apoi faci <code>swap</code>. Rezolvă automat <b>self-assignment</b> (<code>a = a</code>) și e <b>exception-safe</b> (dacă copia eșuează, <code>*this</code> rămâne neatins). Un <code>operator=</code> naiv care face <code>delete[]</code> înainte de copiere se sparge la <code>a = a</code> (use-after-free). (Animat în <b>Scenarii → Self-assignment &amp; copy-and-swap</b>.)`},
  {t:"note", kind:"info", html:`<code>std::exchange</code> scrie move ctor-ul curat: <code>data_ = std::exchange(o.data_, nullptr);</code> — setează <code>o.data_ = nullptr</code> și întoarce vechea valoare, dintr-o singură linie.`},
  {t:"note", kind:"nuanta", html:`<b>Tipuri move-only:</b> unele tipuri se pot muta dar nu copia (copy = <code>=delete</code>): <code>std::unique_ptr</code>, <code>std::thread</code>, <code>std::fstream</code>. Garantează proprietate unică → fără double-free. (Animat în <b>Scenarii → Tip move-only (unique_ptr)</b>.)`},
  {t:"note", kind:"capcana", html:`<b>Use-after-move:</b> după <code>auto y = std::move(x);</code>, <code>x</code> e <b>valid dar nespecificat</b>. Poți să-l reatribui sau distrugi, dar a-i citi conținutul (ex. <code>x.size()</code>) e un <b>bug de logică</b>. (Animat în <b>Scenarii → Use-after-move</b>.)`},
  {t:"note", kind:"info", html:`<b>Sink parameter:</b> ca să accepți eficient și lvalue, și rvalue, ia argumentul <b>prin valoare</b> și mută-l în membru: <code>void set(std::string s){ name_ = std::move(s); }</code>. Lvalue → o copie + o mutare; rvalue → două mutări.`},
  {t:"h", html:`Object slicing`},
  {t:"code", cod:`void process(Base b) { b.f(); }   // primește prin VALOARE
Derived d(1, 2);
process(d);     // SLICING: doar partea Base e copiată, partea Derived e tăiată`},
  {t:"diagram", cap:`b a pierdut y_, iar vptr-ul lui devine al lui Base -> b.f() cheamă Base::f.`,
   scene:{regions:["stack"], steps:[{cells:{stack:[
     {id:"dv",label:"d.vptr",val:"→ vtable Derived",addr:"+0"},
     {id:"dx",label:"d.x_",val:"1",addr:"+8"},
     {id:"dy",label:"d.y_",val:"2",addr:"+12"},
     {id:"bv",label:"b.vptr",val:"→ vtable Base",addr:"+0"},
     {id:"bx",label:"b.x_",val:"1",addr:"+8"}
   ]}}]}},
  {t:"note", kind:"capcana", html:`Soluția: lucrează polimorfic prin <code>Base&amp;</code> sau <code>Base*</code>, niciodată prin valoare, când vrei comportament virtual. (Animat în <b>Scenarii → Object slicing</b>.)`}
]},

/* ===================== Capitolul 3 ===================== */
{ id:"overload-override", nume:"3 · Overloading vs Overriding", blocks:[
  {t:"p", html:`Deși ambele sună similar, sunt fenomene complet diferite: <b>overloading-ul</b> se rezolvă la <b>compilare</b> (nu lasă urmă în memorie la runtime), <b>overriding-ul</b> se rezolvă la <b>execuție</b> (și are o structură de memorie dedicată).`},
  {t:"h", html:`Function Overloading — la compilare`},
  {t:"p", html:`Mai multe funcții cu <b>același nume</b> în <b>același scope</b>, dar cu <b>listă de parametri diferită</b>. Tipul returnat NU contează pentru distincție. La fiecare apel, compilatorul face <b>overload resolution</b> și decide exact ce funcție se cheamă — 100% la compilare.`},
  {t:"code", cod:`void f(int a);
void f(double a);
void f(int a, char b);`},
  {t:"h", html:`Name mangling`},
  {t:"p", html:`În fișierul obiect <b>nu există</b> un simbol „f”. Compilatorul codifică tipurile parametrilor în numele simbolului (ABI Itanium pe GCC/Clang):`},
  {t:"table", head:[`Funcție`,`Simbol`], rows:[
    [`<code>void f(int)</code>`,`<code>_Z1fi</code>`],
    [`<code>void f(double)</code>`,`<code>_Z1fd</code>`],
    [`<code>void f(int, char)</code>`,`<code>_Z1fic</code>`]
  ]},
  {t:"note", kind:"info", html:`<code>_Z</code> = prefix „mangled”; <code>1f</code> = nume de 1 caracter „f”; apoi codurile de tip (<code>i</code>=int, <code>d</code>=double, <code>c</code>=char). Pentru linker, cele trei sunt funcții complet separate; numele comun e o iluzie din sursă. La apel se generează un <code>call</code> direct (adresă fixă). <b>Cost la runtime: zero</b>, poate fi inlined. (Decodor live în <b>Anatomie → Overload &amp; name mangling</b>.)`},
  {t:"h", html:`Function Overriding — la execuție`},
  {t:"code", cod:`class Base {
public:
    virtual void speak();   // virtual!
    virtual void walk();
};
class Derived : public Base {
public:
    void speak() override;  // suprascrie Base::speak
};`},
  {t:"p", html:`Scopul: un <code>Base*</code> care arată spre un <code>Derived</code>, la <code>ptr-&gt;speak()</code>, să cheme versiunea din Derived. Asta e <b>dynamic dispatch</b> / late binding, decis la <b>execuție</b>. Cuvântul <code>virtual</code> face diferența — fără el ai <i>function hiding</i>, nu overriding.`},
  {t:"h", html:`vtable & vptr`},
  {t:"ul", items:[
    `<b>vtable</b> — tabel de pointeri la funcții, <b>unul per clasă</b>, în secțiunea read-only <code>.rodata</code>. Fiecare funcție virtuală are un <b>slot</b> la index fix.`,
    `<b>vptr</b> — pointer ascuns, <b>unul per obiect</b>, adăugat de obicei la offset 0, care arată spre vtable-ul clasei reale. Obiectul crește cu 8 octeți.`
  ]},
  {t:"diagram", cap:`Slotul [0] (speak, suprascris) arată spre Derived::speak; slotul [1] (walk, nesuprascris) arată în continuare spre Base::walk. Același index = aceeași funcție logică în orice vtable.`,
   scene:{regions:["obj","rodata","text"], steps:[{cells:{
     obj:[{id:"vptr",label:"obiect.vptr  (+0)",val:"→ vtable Derived",points:"s0"},{id:"mem",label:"...membri..."}],
     rodata:[{id:"s0",label:"vtable [0] speak",val:"→ Derived::speak",addr:"0x4020",points:"fs"},{id:"s1",label:"vtable [1] walk",val:"→ Base::walk",addr:"0x4028",points:"fw"}],
     text:[{id:"fs",label:"Derived::speak",val:"<cod>",addr:"0x401000"},{id:"fw",label:"Base::walk",val:"<cod>",addr:"0x401080"}]
   }}]}},
  {t:"code", cod:`; ptr->speak() cu ptr de tip Base* (în rdi):
mov  rax, [rdi]       ; încarcă vptr (primii 8 octeți ai obiectului)
mov  rax, [rax + 0]   ; slotul 0 (speak)
call rax              ; apel INDIRECT prin registru`},
  {t:"note", kind:"nuanta", html:`Indexul slotului (<code>+0</code>, <code>+8</code>) e <b>fix, decis la compilare</b>; doar <i>conținutul</i> vtable-ului (ținta) e dinamic. De-aceea apelul virtual de obicei <b>nu poate fi inlined</b> și e o dublă indirectare. (Animat în <b>Anatomie → vtable &amp; dispatch virtual</b>.)`},
  {t:"note", kind:"nuanta", html:`Înainte de pointerii la funcții, vtable-ul mai conține un pointer la <code>type_info</code> (folosit de <code>dynamic_cast</code>/<code>typeid</code> — RTTI) și un <code>offset-to-top</code> (relevant la moștenire multiplă, unde un obiect poate avea chiar <b>mai multe vptr-uri</b>).`},
  {t:"cmp",
    left:{title:`Overloading`, html:`<ul><li>se rezolvă la <b>compilare</b></li><li><b>zero</b> structuri în memorie; obiectele nu cresc</li><li>name mangling → simboluri distincte</li><li><code>call</code> direct, poate fi inlined</li><li>cost la runtime: <b>zero</b></li></ul>`},
    right:{title:`Overriding (virtual)`, html:`<ul><li>se rezolvă la <b>execuție</b></li><li>fiecare obiect crește cu un <code>vptr</code> (8 octeți)</li><li>fiecare clasă polimorfică are un <code>vtable</code></li><li>dublă indirectare, de obicei <b>fără</b> inline</li><li>cost mic, dar real</li></ul>`}},
  {t:"h", html:`Name hiding`},
  {t:"note", kind:"capcana", html:`Dacă o clasă derivată declară o funcție cu <b>același nume</b> dar <b>altă semnătură</b> decât baza, nu faci nici overriding, nici overloading între clase — faci <b>name hiding</b>: numele din derivată ascunde <b>toate</b> overload-urile din bază (le readuci cu <code>using Base::nume;</code>). <code>override</code> și <code>final</code> sunt verificări la compilare, fără cost la runtime, care te scapă de bug-uri.`}
]},

/* ===================== Capitolul 4 ===================== */
{ id:"templates", nume:"4 · Template-uri", blocks:[
  {t:"p", html:`Un template <b>nu este cod</b> — e o <b>rețetă</b> pe care compilatorul o folosește ca să genereze cod. Până nu îl folosești cu tipuri concrete, nu există nimic în binar: niciun octet, niciun simbol.`},
  {t:"code", cod:`template <typename T>
T add(T a, T b) { return a + b; }

add(3, 5);        // instanțiază add<int>
add(2.0, 4.0);    // instanțiază add<double> — ALTĂ funcție`},
  {t:"diagram", cap:`Fiecare instanțiere e o funcție fizic distinctă, cu adresă proprie. De aici "code bloat": 20 de tipuri -> 20 de funcții.`,
   scene:{regions:["text"], steps:[{cells:{text:[
     {id:"i",label:"add<int>",val:"int add(int, int)",addr:"0x401000"},
     {id:"d",label:"add<double>",val:"double add(double, double)",addr:"0x401050"},
     {id:"c",label:"add<char>",val:"char add(char, char)",addr:"0x4010a0"}
   ]}}]}},
  {t:"note", kind:"info", html:`Contrast cu Java: acolo există <b>o singură</b> copie a codului (type erasure), cu cast-uri la runtime. În C++ e invers — fiecare tip primește cod specializat, optimizat. <b>Zero overhead la runtime</b>, cu prețul dimensiunii binarului și al timpului de compilare. (Interactiv în <b>Anatomie → Template = generator</b>.)`},
  {t:"h", html:`Instanțiere lazy, per-membru`},
  {t:"code", cod:`template <typename T>
class Box {
    T value_;
public:
    void print() { std::cout << value_; }   // cere operator<< pentru T
};
struct NoPrint {};
Box<NoPrint> b;      // OK! print() nu e instanțiat, deci nu se cere operator<<
// b.print();        // ABIA AICI ar da eroare de compilare`},
  {t:"note", kind:"nuanta", html:`Funcțiile membre ale unui class template sunt instanțiate <b>doar dacă sunt apelate</b>. <code>Box&lt;T&gt;</code> poate conține metode care nici n-ar compila pentru un anumit <code>T</code>, atâta timp cât nu le chemi. Layout-ul instanțiat nu are overhead ascuns — nici „type tag”, nici vtable din cauza template-ului.`},
  {t:"h", html:`De ce template-urile stau în header`},
  {t:"note", kind:"info", html:`Compilarea e per <b>translation unit</b>. Pentru a instanția <code>add&lt;int&gt;</code>, compilatorul fiecărui <code>.cpp</code> are nevoie de <b>corpul</b> template-ului. Dacă definiția e doar într-un <code>.cpp</code>, ceilalți nu o văd → eroare de linker. De-aceea definiția completă trebuie să fie vizibilă la punctul de instanțiere (în header).`},
  {t:"note", kind:"nuanta", html:`Dacă 5 fișiere instanțiază <code>add&lt;int&gt;</code>, fiecare emite o copie — aparent o violare ODR. Instanțierile sunt simboluri <b>weak/COMDAT</b>; linkerul păstrează una și le aruncă pe restul (COMDAT folding). De-aici timpul de compilare crescut; <code>extern template</code> evită munca redundantă.`},
  {t:"table", head:["Unitate de compilare","Simbol emis"], rows:[
    ["<code>add.o</code>","<code>add&lt;int&gt;</code>  [weak]"],
    ["<code>b.o</code>","<code>add&lt;int&gt;</code>  [weak]"],
    ["<code>c.o</code>","<code>add&lt;int&gt;</code>  [weak]"],
    ["<b>binar final</b>","<b><code>add&lt;int&gt;</code> — o singură copie</b> (COMDAT folding)"]
  ]},
  {t:"h", html:`Deducerea argumentelor`},
  {t:"code", cod:`template <typename T> void f(T x);    // prin valoare
const int ci = 5;
f(ci);    // T = int  (const de top-level dispare la copiere)

template <typename T> void g(T& x);
g(ci);    // T = const int

int arr[10];
f(arr);   // T = int*     (array decade în pointer — pierzi dimensiunea)
g(arr);   // T = int[10]  (referința păstrează tipul array complet)`},
  {t:"note", kind:"nuanta", html:`La parametru prin valoare, <code>const</code> de top-level și referințele „se topesc”. La parametru referință se păstrează. Array-ul <b>decade în pointer</b> prin valoare, dar nu prin referință — de-aceea poți deduce dimensiunea cu <code>template &lt;typename T, size_t N&gt; ... (T (&amp;arr)[N])</code>.`},
  {t:"h", html:`Forwarding references & perfect forwarding`},
  {t:"code", cod:`template <typename T> void f(T&& x);   // NU e rvalue ref -> forwarding reference!
int a = 5;
f(a);     // a e lvalue -> T = int&  -> param devine int&
f(5);     // 5 e rvalue -> T = int   -> param devine int&&`},
  {t:"note", kind:"capcana", html:`<code>T&amp;&amp;</code> cu <code>T</code> <b>dedus</b> nu e rvalue reference, ci <b>forwarding reference</b> (se leagă de orice), datorită <b>reference collapsing</b>: orice combinație cu un <code>&amp;</code> colapsează la <code>&amp;</code>; doar <code>&amp;&amp; + &amp;&amp;</code> rămâne <code>&amp;&amp;</code>.`},
  {t:"table", head:["Deducere (T = ...)","Tip parametru","Categorie"], rows:[
    ["<code>T = int&amp;</code>  →  <code>int&amp; &amp;&amp;</code>","<code>int&amp;</code>","lvalue"],
    ["<code>T = int</code>  →  <code>int &amp;&amp;</code>","<code>int&amp;&amp;</code>","rvalue"]
  ]},
  {t:"code", cod:`template <typename T>
void wrapper(T&& arg) {
    target(std::forward<T>(arg));   // păstrează categoria de valoare (lvalue/rvalue)
}`},
  {t:"note", kind:"nuanta", html:`<code>std::move</code> cast-uiește <b>necondiționat</b> la rvalue; <code>std::forward</code> <b>condiționat</b> — la rvalue doar dacă <code>T</code> indică o rvalue. Niciunul nu generează cod la runtime; ambele sunt cast-uri la compile-time.`},
  {t:"h", html:`Two-phase lookup: typename & template`},
  {t:"code", cod:`template <typename T>
void f() {
    typename T::value_type x;   // "value_type e un TIP, ai încredere"
    // T::value_type x;         // EROARE: implicit presupune o variabilă
}`},
  {t:"note", kind:"capcana", html:`Numele dependente de <code>T</code> se rezolvă abia la instanțiere (faza 2). <code>T::value_type</code> poate fi tip sau variabilă — implicit se presupune variabilă, deci trebuie <code>typename</code>. Analog, pentru template-uri membre dependente: <code>obj.template get&lt;int&gt;()</code>.`},
  {t:"h", html:`Specializare`},
  {t:"code", cod:`template <typename T> struct Printer { /* general */ };
template <> struct Printer<bool> { /* full specialization */ };

template <typename T> struct Box { /* general */ };
template <typename T> struct Box<T*> { /* partial: orice pointer */ };`},
  {t:"note", kind:"capcana", html:`<b>Funcțiile nu pot fi parțial specializate</b> — pentru ele folosești overloading sau, modern, <code>if constexpr</code> / concepte. Mulți confundă overloading-ul de funcții template cu „partial specialization” și greșesc.`},
  {t:"h", html:`SFINAE → Concepte (C++20)`},
  {t:"code", cod:`// SFINAE clasic:
template <typename T>
auto f(T t) -> decltype(t.size()) { return t.size(); }  // dispare dacă T n-are .size()
template <typename T> size_t f(T) { return 0; }          // fallback

// C++20, mult mai citibil:
template <typename T> concept HasSize = requires(T t) { t.size(); };
template <HasSize T> auto f(T t) { return t.size(); }`},
  {t:"note", kind:"info", html:`„Substitution Failure Is Not An Error”: o substituție invalidă elimină <b>tăcut</b> candidatul din lista de overload-uri, nu e eroare. Permite introspecție la compile-time. Conceptele fac același lucru, dar cu erori clare în loc de pereți de text.`},
  {t:"h", html:`if constexpr`},
  {t:"code", cod:`template <typename T>
void process(T x) {
    if constexpr (std::is_pointer_v<T>) std::cout << *x;   // compilat DOAR dacă T e pointer
    else                                std::cout << x;
}`},
  {t:"note", kind:"nuanta", html:`Cu <code>if constexpr</code>, ramura falsă <b>nici nu se compilează</b> pentru tipul respectiv (spre deosebire de <code>if</code> normal, unde ambele ramuri trebuie să compileze pentru orice <code>T</code>). În binar apare doar ramura aleasă — zero cod mort.`},
  {t:"h", html:`Variadic templates & membri statici`},
  {t:"code", cod:`template <typename... Args>
void print(Args... args) { (std::cout << ... << args); }   // fold expression (C++17)
print(1, "salut", 3.14);   // instanțiază print<int, const char*, double>`},
  {t:"p", html:`Membrii statici ai unui template sunt <b>per instanțiere</b>: <code>Counter&lt;int&gt;::count</code> și <code>Counter&lt;double&gt;::count</code> sunt variabile complet separate, la adrese diferite în segmentul de date.`},
  {t:"diagram", cap:`Fiecare instanțiere a template-ului își are propria copie a membrilor statici.`,
   scene:{regions:["data"], steps:[{cells:{data:[
     {id:"ci",label:"Counter<int>::count",val:"5",addr:"0x60a000"},
     {id:"cd",label:"Counter<double>::count",val:"99",addr:"0x60a004"}
   ]}}]}},
  {t:"note", kind:"info", html:`<b>CTAD</b> (C++17): <code>std::vector v{1, 2, 3};</code> deduce <code>vector&lt;int&gt;</code> fără să scrii tipul. Capcană: ori deduci toate argumentele, ori le specifici pe toate.`},
  {t:"h", html:`Model mental (sinteză)`},
  {t:"p", html:`Template-urile sunt <b>generare de cod la compile-time</b>. Un template nu ocupă memorie și nu există la runtime; la fiecare utilizare cu tipuri concrete, compilatorul instanțiază o copie specializată cu adresă proprie. <b>Performanță zero-overhead</b>, cu prețul <b>code bloat</b> și timp de compilare. Definițiile stau în headere fiindcă fiecare unitate de compilare are nevoie de rețeta completă; linkerul deduplichează prin simboluri weak/COMDAT.`}
]}

];

if (typeof window !== "undefined") window.OOP_TEORIE = OOP_TEORIE;
if (typeof module !== "undefined") module.exports = { OOP_TEORIE };
