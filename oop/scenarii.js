/* ============================================================
   OOP C++ — Scenarii animate (ciclul de viață)
   Același model „hartă de memorie" ca MEM_DEMOS, plus:
     step.out  -> linie afișată în consola de output (cumulativ)
   scene.output -> outputul final al programului (referință).
   ============================================================ */
const OOP_SCENARII = [

  /* 1) Ordinea de construcție / distrugere -------------------- */
  {
    id:"ctor-dtor",
    nume:"Ordinea de construcție și distrugere",
    rezumat:"Baza se construiește prima, apoi membrii (în ordinea declarării), apoi corpul. Distrugerea e exact invers.",
    cod:
`struct Base    { Base(){std::cout<<"Base()\\n";}    ~Base(){std::cout<<"~Base()\\n";} };
struct Member  { Member(){std::cout<<"Member()\\n";} ~Member(){std::cout<<"~Member()\\n";} };

struct Derived : Base {
    Member m_;                       // membru
    Derived(){ std::cout<<"Derived()\\n"; }
    ~Derived(){ std::cout<<"~Derived()\\n"; }
};

{ Derived d; }   // construcție, apoi distrugere la finalul scope-ului`,
    output:"Base()\nMember()\nDerived()\n~Derived()\n~Member()\n~Base()",
    regions:["obj"],
    steps:[
      { title:"1. Subobiectul Base", out:"Base()",
        note:"Mai întâi rulează constructorul bazei. Subobiectul <b>Base</b> ocupă fizic primii octeți ai lui Derived.",
        cells:{ obj:[ {id:"base", label:"Base", val:"construit", hot:true} ] } },
      { title:"2. Membrii (ordinea declarării)", out:"Member()",
        note:"Apoi membrii lui Derived, în <b>ordinea declarării în clasă</b> (nu ordinea din lista de inițializare).",
        cells:{ obj:[ {id:"base", label:"Base", val:"construit"}, {id:"m", label:"Member m_", val:"construit", hot:true} ] } },
      { title:"3. Corpul Derived()", out:"Derived()",
        note:"Abia la final rulează corpul constructorului Derived. Obiectul e complet.",
        cells:{ obj:[ {id:"base", label:"Base", val:"construit"}, {id:"m", label:"Member m_", val:"construit"}, {id:"body", label:"Derived (corp)", val:"gata", hot:true} ] } },
      { title:"4. ~Derived() — corp", out:"~Derived()",
        note:"La ieșirea din scope, distrugerea pornește invers: întâi corpul destructorului Derived.",
        cells:{ obj:[ {id:"base", label:"Base", val:"construit"}, {id:"m", label:"Member m_", val:"construit"}, {id:"body", label:"Derived (corp)", val:"distrus", dead:true, hot:true} ] } },
      { title:"5. Membrul m_", out:"~Member()",
        note:"Apoi se distrug membrii lui Derived, în ordine inversă declarării.",
        cells:{ obj:[ {id:"base", label:"Base", val:"construit"}, {id:"m", label:"Member m_", val:"distrus", dead:true, hot:true} ] } },
      { title:"6. Subobiectul Base", out:"~Base()",
        note:"Ultimul se distruge subobiectul Base. Logic: derivata se putea baza pe el, deci el moare ultimul.",
        cells:{ obj:[ {id:"base", label:"Base", val:"distrus", dead:true, hot:true} ] } }
    ]
  },

  /* 2) Apel virtual în constructor (vptr) --------------------- */
  {
    id:"vptr-ctor",
    nume:"Apel virtual în constructor",
    rezumat:"În timpul constructorului bazei, vptr arată încă spre vtable-ul bazei — un apel virtual cheamă versiunea din bază, nu override-ul.",
    cod:
`struct Base {
    Base() { f(); }                              // apel virtual din constructor
    virtual void f() { std::cout << "Base\\n"; }
};
struct Derived : Base {
    void f() override { std::cout << "Derived\\n"; }
};

Derived d;   // afișează "Base"`,
    output:"Base",
    regions:["stack","rodata"],
    steps:[
      { title:"Intră Base()",
        note:"La construirea lui Derived rulează întâi Base(). Constructorul Base setează <b>vptr</b> spre vtable-ul lui <b>Base</b> — partea Derived a obiectului nici nu există încă.",
        cells:{ stack:[ {id:"vptr", label:"d.vptr", val:"→ vtable Base", addr:"+0", points:"vtB", hot:true} ],
                rodata:[ {id:"vtB", label:"vtable Base [0] f", val:"&Base::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derived [0] f", val:"&Derived::f", addr:"0x4040"} ] } },
      { title:"f() din corpul Base()", out:"Base",
        note:"Dispatch-ul virtual citește vptr → vtable Base → slot[0] = <code>&Base::f</code>. Se afișează <b>Base</b>, deși obiectul final e un Derived.",
        cells:{ stack:[ {id:"vptr", label:"d.vptr", val:"→ vtable Base", addr:"+0", points:"vtB", hot:true} ],
                rodata:[ {id:"vtB", label:"vtable Base [0] f", val:"&Base::f", addr:"0x4020", hot:true},
                         {id:"vtD", label:"vtable Derived [0] f", val:"&Derived::f", addr:"0x4040"} ] } },
      { title:"Base() s-a terminat → Derived()",
        note:"Abia după ce Base() se încheie, constructorul Derived <b>suprascrie vptr</b> spre vtable-ul lui Derived.",
        cells:{ stack:[ {id:"vptr", label:"d.vptr", val:"→ vtable Derived", addr:"+0", points:"vtD", hot:true} ],
                rodata:[ {id:"vtB", label:"vtable Base [0] f", val:"&Base::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derived [0] f", val:"&Derived::f", addr:"0x4040", hot:true} ] } },
      { title:"Obiect complet",
        note:"De acum <code>d.f()</code> ar afișa „Derived”. Dar apelul din constructor a fost rezolvat deja, ca Base. Aceeași logică, inversă, se aplică în destructor.",
        cells:{ stack:[ {id:"vptr", label:"d.vptr", val:"→ vtable Derived", addr:"+0", points:"vtD"} ],
                rodata:[ {id:"vtB", label:"vtable Base [0] f", val:"&Base::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derived [0] f", val:"&Derived::f", addr:"0x4040"} ] } }
    ]
  },

  /* 3) Object slicing ----------------------------------------- */
  {
    id:"slicing",
    nume:"Object slicing",
    rezumat:"Trecerea unui Derived prin valoare într-un parametru Base copiază doar subobiectul Base — partea derivată și comportamentul virtual se pierd.",
    cod:
`struct Base    { int x_=1; virtual void f(){ std::cout<<"Base::f\\n"; } };
struct Derived : Base { int y_=2; void f() override { std::cout<<"Derived::f\\n"; } };

void process(Base b) { b.f(); }   // primește prin VALOARE

Derived d;
process(d);     // SLICING`,
    output:"Base::f",
    regions:["stack"],
    steps:[
      { title:"Derived d;",
        note:"Obiectul complet: vptr spre vtable Derived, plus x_ și y_.",
        cells:{ stack:[
          {id:"dv", label:"d.vptr", val:"→ vtable Derived", addr:"+0", hot:true},
          {id:"dx", label:"d.x_", val:"1", addr:"+8"},
          {id:"dy", label:"d.y_", val:"2", addr:"+12"}
        ] } },
      { title:"process(Base b) — copiere prin valoare",
        note:"Copy constructorul lui <b>Base</b> copiază doar subobiectul Base. <b>y_ este tăiat</b>, iar vptr-ul lui b devine al lui Base (b e literalmente mai mic).",
        cells:{ stack:[
          {id:"dv", label:"d.vptr", val:"→ vtable Derived", addr:"+0"},
          {id:"dx", label:"d.x_", val:"1", addr:"+8"},
          {id:"dy", label:"d.y_", val:"2", addr:"+12"},
          {id:"bv", label:"b.vptr", val:"→ vtable Base", addr:"+0", hot:true},
          {id:"bx", label:"b.x_", val:"1", addr:"+8", hot:true}
        ] } },
      { title:"b.f();", out:"Base::f",
        note:"Dispatch prin vptr-ul lui b → vtable Base → <code>Base::f</code>. Soluția: lucrează polimorfic prin <b>Base&amp;</b> sau <b>Base*</b>, niciodată prin valoare.",
        cells:{ stack:[
          {id:"dv", label:"d.vptr", val:"→ vtable Derived", addr:"+0"},
          {id:"dx", label:"d.x_", val:"1", addr:"+8"},
          {id:"dy", label:"d.y_", val:"2", addr:"+12"},
          {id:"bv", label:"b.vptr", val:"→ vtable Base", addr:"+0", hot:true},
          {id:"bx", label:"b.x_", val:"1", addr:"+8"}
        ] } }
    ]
  },

  /* 4) Destructor virtual ------------------------------------- */
  {
    id:"virtual-dtor",
    nume:"Destructor virtual — de ce e obligatoriu",
    rezumat:"delete printr-un Base* fără destructor virtual cheamă doar ~Base(): partea derivată (și resursele ei) nu se eliberează.",
    cod:
`struct Base    { ~Base(){} };                 // NU e virtual!
struct Derived : Base {
    int* buf = new int[100];                  // resursă
    ~Derived(){ delete[] buf; }
};

Base* p = new Derived;
delete p;     // ~Base NEvirtual -> doar ~Base() rulează`,
    output:"(memory leak: buf-ul de 100 int nu se eliberează)",
    regions:["stack","heap"],
    steps:[
      { title:"Base* p = new Derived;",
        note:"Obiectul Derived e pe heap; membrul <code>buf</code> alocă o a doua zonă heap. <code>p</code> e un Base* care arată spre el.",
        cells:{ stack:[ {id:"p", label:"Base* p", val:"0x9000", addr:"0x7ffe10", points:"obj"} ],
                heap:[ {id:"obj", label:"Derived (Base + buf)", val:"buf=0x9100", addr:"0x9000", points:"buf"},
                       {id:"buf", label:"int[100]", val:"...", addr:"0x9100"} ] } },
      { title:"delete p;  (~Base NEvirtual)",
        note:"<code>delete p</code> cheamă doar <b>~Base()</b> (dispatch static, după tipul pointerului). <b>~Derived() nu rulează</b>, deci <code>delete[] buf</code> nu se face niciodată.",
        cells:{ stack:[ {id:"p", label:"Base* p", val:"0x9000", addr:"0x7ffe10", points:"obj"} ],
                heap:[ {id:"obj", label:"Derived (eliberat parțial)", val:"~Base() doar", addr:"0x9000", dead:true},
                       {id:"buf", label:"int[100]  ← LEAK", val:"NEEliberat", addr:"0x9100", hot:true} ] } },
      { title:"Remediu: virtual ~Base()",
        note:"Cu <code>virtual ~Base()</code>, dispatch-ul prin vtable găsește <b>~Derived()</b> → <code>delete[] buf</code>, apoi ~Base(). Lanțul rulează corect, totul se eliberează.",
        cells:{ stack:[ {id:"p", label:"Base* p", val:"(șters)", addr:"0x7ffe10"} ],
                heap:[ {id:"obj", label:"Derived", val:"eliberat", addr:"0x9000", dead:true},
                       {id:"buf", label:"int[100]", val:"eliberat", addr:"0x9100", dead:true, hot:true} ] } }
    ]
  },

  /* 5) std::move este doar un cast ---------------------------- */
  {
    id:"stdmove-cast",
    nume:"std::move este doar un cast",
    rezumat:"std::move nu mută nimic — e un static_cast la rvalue. Pe un obiect const nu se leagă de move ctor, așa că se cheamă tăcut copy ctor.",
    cod:
`// echivalent conceptual:
template<class T> T&& move(T& t){ return static_cast<T&&>(t); }

Buffer a(3);
Buffer b = std::move(a);   // move ctor -> a devine goală

const Buffer c(3);
Buffer d = std::move(c);   // c e const -> COPY ctor, c rămâne intactă`,
    output:"(a: goală după move) · (c: intactă, copiată)",
    regions:["stack","heap"],
    steps:[
      { title:"Stare inițială",
        note:"a și c (const) dețin fiecare câte o zonă heap.",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"0x55a0", addr:"0x10", points:"blkA"},
                        {id:"c", label:"const c.data_", val:"0x77c0", addr:"0x20", points:"blkC"} ],
                heap:[ {id:"blkA", label:"int[3]  (a)", val:"[1,2,3]", addr:"0x55a0"},
                       {id:"blkC", label:"int[3]  (c)", val:"[9,9,9]", addr:"0x77c0"} ] } },
      { title:"Buffer b = std::move(a);",
        note:"<code>std::move(a)</code> = cast la <code>Buffer&amp;&amp;</code> → se alege <b>move ctor</b>: b fură pointerul, a devine goală. Niciun new.",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"nullptr", addr:"0x10", hot:true},
                        {id:"b", label:"b.data_", val:"0x55a0", addr:"0x18", points:"blkA", hot:true},
                        {id:"c", label:"const c.data_", val:"0x77c0", addr:"0x20", points:"blkC"} ],
                heap:[ {id:"blkA", label:"int[3]", val:"[1,2,3]", addr:"0x55a0"},
                       {id:"blkC", label:"int[3]  (c)", val:"[9,9,9]", addr:"0x77c0"} ] } },
      { title:"Buffer d = std::move(c);  (capcană)",
        note:"<code>std::move(c)</code> produce <code>const Buffer&amp;&amp;</code>, care NU se leagă de move ctor (cere <code>Buffer&amp;&amp;</code> non-const). Se alege <b>copy ctor</b>: d primește o copie nouă, iar c rămâne intactă. std::move pe const e tăcut inutil.",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"nullptr", addr:"0x10"},
                        {id:"b", label:"b.data_", val:"0x55a0", addr:"0x18", points:"blkA"},
                        {id:"c", label:"const c.data_", val:"0x77c0", addr:"0x20", points:"blkC"},
                        {id:"d", label:"d.data_", val:"0x8a40", addr:"0x28", points:"blkD", hot:true} ],
                heap:[ {id:"blkA", label:"int[3]", val:"[1,2,3]", addr:"0x55a0"},
                       {id:"blkC", label:"int[3]  (c)", val:"[9,9,9]", addr:"0x77c0"},
                       {id:"blkD", label:"int[3]  (copie d)", val:"[9,9,9]", addr:"0x8a40", hot:true} ] } }
    ]
  },

  /* 6) RVO / copy elision ------------------------------------- */
  {
    id:"rvo",
    nume:"RVO / copy elision",
    rezumat:"Din C++17, un prvalue returnat se construiește direct în destinație — nu se cheamă nici copy, nici move constructor.",
    cod:
`struct Tracer {
    Tracer()              { std::cout << "ctor\\n"; }
    Tracer(const Tracer&) { std::cout << "copy\\n"; }
    Tracer(Tracer&&)      { std::cout << "move\\n"; }
};

Tracer make() { return Tracer(); }   // prvalue
Tracer t = make();                    // construit DIRECT în t`,
    output:"ctor",
    regions:["stack"],
    steps:[
      { title:"Tracer t = make();",
        note:"Naiv te-ai aștepta: construiește temporar în make(), apoi îl copiază/mută în t. <b>Greșit din C++17.</b>",
        cells:{ stack:[ {id:"t", label:"Tracer t", val:"(locul final)", addr:"0x7ffe10", hot:true} ] } },
      { title:"Tracer() rulează direct în t", out:"ctor",
        note:"Compilatorul construiește prvalue-ul <b>direct</b> în locația finală t (guaranteed copy elision). Se afișează doar <b>ctor</b> — niciun copy, niciun move.",
        cells:{ stack:[ {id:"t", label:"Tracer t", val:"construit pe loc", addr:"0x7ffe10", hot:true} ] } },
      { title:"Capcană: nu pune std::move pe return",
        note:"<code>return std::move(local);</code> dezactivează elision-ul (returnezi o rvalue reference, nu obiectul) și forțează un <b>move</b> inutil. Lasă pur și simplu <code>return local;</code>.",
        cells:{ stack:[ {id:"t", label:"Tracer t", val:"construit pe loc", addr:"0x7ffe10"} ] } }
    ]
  },

  /* ===== Extindere: value categories · copy vs move · referințe ===== */

  /* 7) O rvalue reference cu nume este lvalue ------------------ */
  {
    id:"named-rvalue-lvalue",
    nume:"O rvalue reference cu nume este lvalue",
    rezumat:"Înăuntrul funcției, un parametru Buffer&& are NUME → este lvalue; un apel simplu alege COPY. Abia std::move îl re-cast la rvalue → MOVE.",
    cod:
`void sink(Buffer&& x) {       // x este rvalue reference, DAR are nume
    Buffer a = x;             // x e LVALUE -> COPY (alocare nouă)
    Buffer b = std::move(x);  // re-cast la rvalue -> MOVE (fură buffer-ul lui x)
}
sink(Buffer(3));`,
    output:"a = copie nouă · b = a furat buffer-ul lui x · x = golit",
    regions:["stack","heap"],
    steps:[
      { title:"sink(Buffer(3))",
        note:"Temporarul <code>Buffer(3)</code> se leagă de parametrul rvalue-reference <code>x</code>. Dar înăuntru, <code>x</code> are nume → categoria lui devine <b>lvalue</b>.",
        cells:{ stack:[ {id:"x", label:"Buffer&& x", val:"0x55a0", addr:"0x10", points:"blkX"} ],
                heap:[ {id:"blkX", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"} ] } },
      { title:"Buffer a = x;  (x e lvalue → COPY)", out:"copy",
        note:"<code>x</code> e lvalue → overload resolution alege <b>copy ctor</b>: alocare nouă + copiere element-cu-element. Buffer-ul lui x rămâne intact.",
        cells:{ stack:[ {id:"x", label:"Buffer&& x", val:"0x55a0", addr:"0x10", points:"blkX"},
                        {id:"a", label:"a.data_", val:"0x77c0", addr:"0x18", points:"blkA", hot:true} ],
                heap:[ {id:"blkX", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"},
                       {id:"blkA", label:"int[3]  (copie)", val:"[1, 2, 3]", addr:"0x77c0", hot:true} ] } },
      { title:"Buffer b = std::move(x);  (→ MOVE)", out:"move",
        note:"<code>std::move(x)</code> re-cast la rvalue → <b>move ctor</b>: b fură pointerul lui x; x devine gol. Niciun new.",
        cells:{ stack:[ {id:"x", label:"Buffer&& x", val:"nullptr", addr:"0x10", hot:true},
                        {id:"a", label:"a.data_", val:"0x77c0", addr:"0x18", points:"blkA"},
                        {id:"b", label:"b.data_", val:"0x55a0", addr:"0x20", points:"blkX", hot:true} ],
                heap:[ {id:"blkX", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"},
                       {id:"blkA", label:"int[3]  (copie)", val:"[1, 2, 3]", addr:"0x77c0"} ] } }
    ]
  },

  /* 8) push_back: copy vs move -------------------------------- */
  {
    id:"push-copy-move",
    nume:"push_back: copy vs move",
    rezumat:"v.push_back(b) copiază (b e lvalue); v.push_back(std::move(b)) mută (fură buffer-ul lui b).",
    cod:
`std::vector<Buffer> v;
v.reserve(2);               // capacitate rezervată (fără realocare)
Buffer b(3);
v.push_back(b);             // b e lvalue -> COPY (alocare nouă)
v.push_back(std::move(b));  // rvalue -> MOVE (fură, b golit)`,
    output:"v[0] = copie a lui b · v[1] = mutat din b · b = golit",
    regions:["stack","heap"],
    steps:[
      { title:"Buffer b(3);",
        note:"b deține zona cu [1, 2, 3].",
        cells:{ stack:[ {id:"b", label:"b.data_", val:"0x55a0", addr:"0x10", points:"blkB"} ],
                heap:[ {id:"blkB", label:"int[3]  (b)", val:"[1, 2, 3]", addr:"0x55a0"} ] } },
      { title:"v.push_back(b);  (lvalue → COPY)", out:"copy",
        note:"<code>b</code> e lvalue → <b>copy ctor</b>: v[0] primește o zonă NOUĂ, copiată. b rămâne intact.",
        cells:{ stack:[ {id:"b", label:"b.data_", val:"0x55a0", addr:"0x10", points:"blkB"},
                        {id:"v0", label:"v[0].data_", val:"0x6100", addr:"vector", points:"blk0", hot:true} ],
                heap:[ {id:"blkB", label:"int[3]  (b)", val:"[1, 2, 3]", addr:"0x55a0"},
                       {id:"blk0", label:"int[3]  (copie)", val:"[1, 2, 3]", addr:"0x6100", hot:true} ] } },
      { title:"v.push_back(std::move(b));  (rvalue → MOVE)", out:"move",
        note:"<code>std::move(b)</code> → <b>move ctor</b>: v[1] fură buffer-ul original al lui b; b devine gol. Niciun new.",
        cells:{ stack:[ {id:"b", label:"b.data_", val:"nullptr", addr:"0x10", hot:true},
                        {id:"v0", label:"v[0].data_", val:"0x6100", addr:"vector", points:"blk0"},
                        {id:"v1", label:"v[1].data_", val:"0x55a0", addr:"vector", points:"blkB", hot:true} ],
                heap:[ {id:"blkB", label:"int[3]  (mutat din b)", val:"[1, 2, 3]", addr:"0x55a0"},
                       {id:"blk0", label:"int[3]  (copie)", val:"[1, 2, 3]", addr:"0x6100"} ] } }
    ]
  },

  /* 9) Self-assignment & copy-and-swap ------------------------ */
  {
    id:"self-assign",
    nume:"Self-assignment & copy-and-swap",
    rezumat:"Un operator= naiv care eliberează înainte de copiere se sparge la a = a (use-after-free). Copy-and-swap îl rezolvă.",
    cod:
`// operator= NAIV (periculos):
Buffer& operator=(const Buffer& o) {
    delete[] data_;                              // 1) eliberează ce avem
    data_ = new int[o.size_];                    // 2) alocă
    std::copy(o.data_, o.data_ + o.size_, data_);// 3) copiază din o
    return *this;
}
a = a;   // self-assignment: o ESTE a !`,
    output:"operator= naiv: use-after-free la a = a; copy-and-swap îl rezolvă",
    regions:["stack","heap"],
    steps:[
      { title:"a = a;  (o și *this sunt același obiect)",
        note:"La self-assignment, parametrul <code>o</code> este chiar <code>a</code>: ambele arată spre același buffer.",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"0x55a0", addr:"0x10", points:"blk"} ],
                heap:[ {id:"blk", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"} ] } },
      { title:"delete[] data_;",
        note:"Eliberăm propriul buffer. Dar <code>o</code> (= a) arată tot spre el → sursa de copiere e acum ELIBERATĂ.",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"0x55a0", addr:"0x10", points:"blk"} ],
                heap:[ {id:"blk", label:"int[3]", val:"(eliberat)", addr:"0x55a0", dead:true, hot:true} ] } },
      { title:"new + std::copy din o  → use-after-free",
        note:"Copierea citește din <code>o.data_</code> = zona deja eliberată → <b>comportament nedefinit</b> (date corupte / crash).",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"0x8a40", addr:"0x10", points:"blkNew", hot:true} ],
                heap:[ {id:"blk", label:"int[3]", val:"(eliberat)", addr:"0x55a0", dead:true},
                       {id:"blkNew", label:"int[3]", val:"[gunoi]", addr:"0x8a40", hot:true} ] } },
      { title:"Remediu: copy-and-swap",
        note:"<code>Buffer&amp; operator=(Buffer o){ swap(*this, o); return *this; }</code> — primești prin valoare (copy/move făcut de compilator), apoi swap. Self-assignment devine inofensiv și e exception-safe.",
        cells:{ stack:[ {id:"a", label:"a.data_", val:"0x55a0", addr:"0x10", points:"blk2"} ],
                heap:[ {id:"blk2", label:"int[3]  (intact)", val:"[1, 2, 3]", addr:"0x55a0"} ] } }
    ]
  },

  /* 10) Tip move-only (unique_ptr) ---------------------------- */
  {
    id:"move-only",
    nume:"Tip move-only (unique_ptr)",
    rezumat:"unique_ptr se poate muta dar nu copia: mutarea transferă proprietatea, copy = eroare de compilare.",
    cod:
`std::unique_ptr<Widget> a = std::make_unique<Widget>();
std::unique_ptr<Widget> b = std::move(a);  // transfer de proprietate
// std::unique_ptr<Widget> c = a;           // EROARE: copy ctor = delete`,
    output:"a -> b: proprietate transferată; copy interzis",
    regions:["stack","heap"],
    steps:[
      { title:"make_unique<Widget>()",
        note:"a deține obiectul Widget de pe heap.",
        cells:{ stack:[ {id:"a", label:"unique_ptr a", val:"0x9000", addr:"0x10", points:"w"} ],
                heap:[ {id:"w", label:"Widget", val:"{ ... }", addr:"0x9000"} ] } },
      { title:"b = std::move(a);  (transfer)",
        note:"unique_ptr e <b>move-only</b>: mutarea transferă pointerul. a devine <code>nullptr</code>, b devine proprietarul. O singură proprietate → fără double-delete.",
        cells:{ stack:[ {id:"a", label:"unique_ptr a", val:"nullptr", addr:"0x10", hot:true},
                        {id:"b", label:"unique_ptr b", val:"0x9000", addr:"0x18", points:"w", hot:true} ],
                heap:[ {id:"w", label:"Widget", val:"{ ... }", addr:"0x9000"} ] } },
      { title:"copy interzis",
        note:"<code>unique_ptr c = a;</code> <b>nu compilează</b> — copy ctor-ul e <code>=delete</code>. Asta previne două pointere care ar elibera același obiect.",
        cells:{ stack:[ {id:"a", label:"unique_ptr a", val:"nullptr", addr:"0x10"},
                        {id:"b", label:"unique_ptr b", val:"0x9000", addr:"0x18", points:"w"} ],
                heap:[ {id:"w", label:"Widget", val:"{ ... }", addr:"0x9000"} ] } }
    ]
  },

  /* 11) Use-after-move ---------------------------------------- */
  {
    id:"use-after-move",
    nume:"Use-after-move",
    rezumat:"După std::move, sursa e validă dar nespecificată; a-i citi conținutul e un bug de logică.",
    cod:
`std::string s1 = "salut";
std::string s2 = std::move(s1);   // s2 preia conținutul
std::cout << s1;                  // s1 e valid dar NESPECIFICAT (tipic gol)`,
    output:"s2 = salut · s1 = (tipic gol, dar nespecificat)",
    regions:["stack","heap"],
    steps:[
      { title:"std::string s1 = salut;",
        note:"s1 deține bufferul cu textul.",
        cells:{ stack:[ {id:"s1", label:"string s1", val:"-> text", addr:"0x10", points:"buf"} ],
                heap:[ {id:"buf", label:"char[6]", val:"salut", addr:"0x55a0"} ] } },
      { title:"std::string s2 = std::move(s1);",
        note:"Move ctor: s2 preia bufferul lui s1. s1 rămâne <b>valid dar gol</b> (stare moved-from, tipic goală).",
        cells:{ stack:[ {id:"s1", label:"string s1", val:"(gol — moved-from)", addr:"0x10", hot:true},
                        {id:"s2", label:"string s2", val:"-> text", addr:"0x18", points:"buf", hot:true} ],
                heap:[ {id:"buf", label:"char[6]", val:"salut", addr:"0x55a0"} ] } },
      { title:"std::cout << s1;",
        note:"Legal (s1 e valid), dar valoarea e <b>nespecificată</b> de standard (tipic gol). A te baza pe conținutul lui s1 după move = <b>bug de logică</b>.",
        cells:{ stack:[ {id:"s1", label:"string s1", val:"(nespecificat)", addr:"0x10", hot:true},
                        {id:"s2", label:"string s2", val:"-> text", addr:"0x18", points:"buf"} ],
                heap:[ {id:"buf", label:"char[6]", val:"salut", addr:"0x55a0"} ] } }
    ]
  },

  /* 12) Lifetime extension cu const& -------------------------- */
  {
    id:"lifetime-ext",
    nume:"Lifetime extension cu const&",
    rezumat:"const& legat DIRECT de un temporar îi prelungește viața; dar nu prin valoarea de retur a unei funcții (ex. vec[0]) → dangling.",
    cod:
`const Buffer& r = makeBuffer();        // OK: viața temporarului e EXTINSĂ cât trăiește r

const int& bad = std::vector<int>{1,2,3}[0];  // NU se extinde: vectorul moare
std::cout << bad;                              // dangling -> UB`,
    output:"r: temporar prelungit (OK) · bad: dangling (UB)",
    regions:["stack"],
    steps:[
      { title:"const Buffer& r = makeBuffer();",
        note:"Legarea <b>directă</b> a unui temporar de un <code>const&amp;</code> îi <b>prelungește viața</b> cât trăiește r. r e un alias valid.",
        cells:{ stack:[ {id:"tmp", label:"Buffer temporar", val:"[1, 2, 3]", addr:"0x7ffe40", hot:true} ] },
        aliases:[ {name:"const Buffer& r", target:"tmp"} ] },
      { title:"const int& bad = vector{1,2,3}[0];",
        note:"Aici <code>bad</code> NU se leagă direct de temporar, ci de rezultatul lui <code>operator[]</code> (un subobiect). Viața vectorului <b>nu</b> se extinde.",
        cells:{ stack:[ {id:"tmp", label:"Buffer temporar", val:"[1, 2, 3]", addr:"0x7ffe40"},
                        {id:"vec", label:"vector temporar", val:"[1, 2, 3]", addr:"0x7ffe60", hot:true},
                        {id:"bad", label:"const int& bad", val:"-> vec[0]", addr:"0x7ffe80", points:"vec", hot:true} ] },
        aliases:[ {name:"const Buffer& r", target:"tmp"} ] },
      { title:"Vectorul temporar moare",
        note:"La finalul expresiei, vectorul temporar e distrus. <code>bad</code> arată spre o celulă eliberată — este <b>dangling</b>.",
        cells:{ stack:[ {id:"tmp", label:"Buffer temporar", val:"[1, 2, 3]", addr:"0x7ffe40"},
                        {id:"vec", label:"vector temporar", val:"(eliberat)", addr:"0x7ffe60", dead:true, hot:true},
                        {id:"bad", label:"const int& bad", val:"-> vec[0]", addr:"0x7ffe80", points:"vec"} ] },
        aliases:[ {name:"const Buffer& r", target:"tmp"} ] },
      { title:"std::cout << bad;",
        note:"Citirea prin <code>bad</code> accesează memorie eliberată → <b>comportament nedefinit</b>. (r rămâne valid — temporarul lui a fost prelungit corect.)",
        cells:{ stack:[ {id:"tmp", label:"Buffer temporar", val:"[1, 2, 3]", addr:"0x7ffe40"},
                        {id:"bad", label:"const int& bad", val:"-> ???", addr:"0x7ffe80", points:"VOID", hot:true} ] },
        aliases:[ {name:"const Buffer& r", target:"tmp"} ] }
    ]
  }
];

if (typeof window !== "undefined") window.OOP_SCENARII = OOP_SCENARII;
if (typeof module !== "undefined") module.exports = { OOP_SCENARII };
