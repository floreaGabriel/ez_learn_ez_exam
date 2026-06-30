/* ============================================================
   OOP C++ — Exerciții & quiz
   OOP_QUIZ    : grilă (single/multi), multe cu snippet + „prezice output-ul”
                 {id,tema,multi,enunt,cod?,optiuni[],corecte[idx],explicatie}
   OOP_CAPCANE : găsește bug-ul   {id,cod,intrebare,optiuni[],corect idx,explicatie}
   OOP_ORDER   : ordonează pașii  {id,sarcina,pasi[ în ordinea corectă ]}
   OOP_MATCH   : împerechere      {intro,perechi:[[termen,definiție],...]}
   ============================================================ */

const OOP_QUIZ = [
  { id:"q1", tema:"Pointeri & Referințe", multi:false,
    enunt:`Ce afișează secvența?`,
    cod:`int a = 10;
int& r = a;
int b = 20;
r = b;
std::cout << a;`,
    optiuni:["10","20","adresa lui b","eroare de compilare"], corecte:[1],
    explicatie:`<code>r</code> e alias pentru <code>a</code>; <code>r = b</code> copiază valoarea 20 în <code>a</code>.` },

  { id:"q2", tema:"Referințe", multi:false,
    enunt:`Care afirmație despre referințe este adevărată?`,
    optiuni:["Pot fi nullptr","Trebuie inițializate la declarare","Pot fi relegate la alt obiect","Au aritmetică precum pointerii"],
    corecte:[1], explicatie:`O referință e un alias: trebuie inițializată, nu poate fi nulă și nu poate fi relegată.` },

  { id:"q3", tema:"Name mangling", multi:false,
    enunt:`Cum se mangle-ază <code>void f(int, char)</code> (ABI Itanium)?`,
    optiuni:["_Z1fci","_Z1fic","_Zf1ic","_Z2fic"], corecte:[1],
    explicatie:`<code>_Z</code> + lungime+nume (<code>1f</code>) + codurile parametrilor în ordine: int=<code>i</code>, char=<code>c</code> → <code>_Z1fic</code>.` },

  { id:"q4", tema:"Overriding", multi:false,
    enunt:`Apelul unei funcții virtuale prin <code>Base*</code> spre un Derived se rezolvă...`,
    optiuni:["la compilare, prin overload resolution","la execuție, prin vtable / vptr","prin name mangling","niciodată"],
    corecte:[1], explicatie:`Dynamic dispatch: vptr → vtable → slot → apel indirect, decis la execuție.` },

  { id:"q5", tema:"Constructori", multi:false,
    enunt:`Ce afișează <code>Derived d;</code>?`,
    cod:`struct Base {
    Base() { f(); }
    virtual void f() { std::cout << "Base\\n"; }
};
struct Derived : Base {
    void f() override { std::cout << "Derived\\n"; }
};
Derived d;`,
    optiuni:["Derived","Base","nimic","comportament nedefinit"], corecte:[1],
    explicatie:`În ctor-ul Base, vptr arată încă spre vtable-ul Base → se cheamă <code>Base::f</code>.` },

  { id:"q6", tema:"Object slicing", multi:false,
    enunt:`Ce afișează apelul <code>process(d)</code>?`,
    cod:`struct Base { virtual void f(){ std::cout << "Base::f\\n"; } };
struct Derived : Base { void f() override { std::cout << "Derived::f\\n"; } };
void process(Base b){ b.f(); }
Derived d; process(d);`,
    optiuni:["Derived::f","Base::f","ambele","eroare de compilare"], corecte:[1],
    explicatie:`Trecerea prin valoare taie partea Derived (slicing); vptr-ul lui b devine al lui Base.` },

  { id:"q7", tema:"Move semantics", multi:false,
    enunt:`<code>std::move(obj)</code> ...`,
    optiuni:["mută imediat datele","este doar un cast la rvalue reference","eliberează memoria lui obj","apelează destructorul"],
    corecte:[1], explicatie:`Nu generează cod la runtime; doar permite alegerea move ctor-ului. Mutarea efectivă e în move ctor.` },

  { id:"q8", tema:"Move semantics", multi:false,
    enunt:`Ce constructor se cheamă?`,
    cod:`const Buffer c(3);
Buffer d = std::move(c);`,
    optiuni:["move constructor","copy constructor","niciunul (copy elision)","eroare de compilare"], corecte:[1],
    explicatie:`<code>std::move(c)</code> pe const produce <code>const Buffer&amp;&amp;</code>, care nu se leagă de move ctor → se alege copy ctor.` },

  { id:"q9", tema:"RVO / copy elision", multi:false,
    enunt:`Ce se afișează (Tracer cu print în ctor / copy / move)?`,
    cod:`struct Tracer {
    Tracer()              { std::cout << "ctor\\n"; }
    Tracer(const Tracer&) { std::cout << "copy\\n"; }
    Tracer(Tracer&&)      { std::cout << "move\\n"; }
};
Tracer make(){ return Tracer(); }
Tracer t = make();`,
    optiuni:["doar: ctor","ctor, apoi copy","ctor, apoi move","ctor de două ori"], corecte:[0],
    explicatie:`C++17: prvalue-ul returnat e construit direct în <code>t</code> (guaranteed copy elision) — niciun copy, niciun move.` },

  { id:"q10", tema:"Rule of 0/3/5", multi:true,
    enunt:`Dacă declari un <b>destructor</b> custom, ce <b>nu</b> se mai generează automat? (alege tot ce se aplică)`,
    optiuni:["copy constructor","move constructor","move assignment operator","constructorul implicit fără argumente"],
    corecte:[1,2], explicatie:`Un destructor custom suprimă generarea <b>move ctor</b> + <b>move assignment</b> (rămâi cu copy, deprecated). Constructorul implicit e suprimat doar de un <i>constructor</i> declarat de utilizator, nu de un destructor.` },

  { id:"q11", tema:"Template-uri", multi:false,
    enunt:`De ce definiția unui template trebuie să fie vizibilă (în header)?`,
    optiuni:["pentru viteză la runtime","fiecare translation unit are nevoie de corp ca să instanțieze","altfel încalcă ODR","ca să fie inline"],
    corecte:[1], explicatie:`La instanțiere, compilatorul fiecărui <code>.cpp</code> are nevoie de corpul complet; altfel → eroare de linker.` },

  { id:"q12", tema:"Template-uri", multi:false,
    enunt:`În <code>template&lt;class T&gt; void f(T&amp;&amp; x);</code>, <code>T&amp;&amp;</code> este...`,
    optiuni:["rvalue reference","forwarding (universal) reference","lvalue reference","eroare de sintaxă"],
    corecte:[1], explicatie:`Cu <code>T</code> <b>dedus</b>, <code>T&amp;&amp;</code> e forwarding reference (reference collapsing) — se leagă de lvalue și rvalue.` },

  { id:"q13", tema:"Template-uri", multi:false,
    enunt:`Cu <code>if constexpr</code>, ramura falsă pentru un anumit <code>T</code> ...`,
    optiuni:["se execută oricum","nici nu se compilează","doar dă warning","e mai lentă"],
    corecte:[1], explicatie:`Ramura nealeasă nu se instanțiază pentru acel <code>T</code> — zero cod mort în binar.` },

  { id:"q14", tema:"Template-uri", multi:false,
    enunt:`<code>Counter&lt;int&gt;::count</code> și <code>Counter&lt;double&gt;::count</code> sunt...`,
    optiuni:["aceeași variabilă","variabile separate, la adrese diferite","partajate între instanțieri","ilegale"],
    corecte:[1], explicatie:`Fiecare instanțiere a template-ului are propriii membri statici, în segmentul de date.` }
];

const OOP_CAPCANE = [
  { id:"c1",
    cod:`class Buffer {
    int* data_;
public:
    Buffer(size_t n) : data_(new int[n]) {}
    ~Buffer(){ delete[] data_; }
    // fără copy constructor
};
Buffer a(3);
Buffer b = a;`,
    intrebare:`Ce problemă ascunde acest cod?`,
    optiuni:["Lipsește un getter","Copy-ul implicit e shallow → ambele dețin aceeași zonă → double free","new[] e folosit greșit","Niciuna"],
    corect:1, explicatie:`Fără copy ctor, <code>b</code> copiază pointerul lui <code>a</code>; la distrugere, <code>delete[]</code> rulează de două ori pe aceeași zonă. (Rule of Three.)` },

  { id:"c2",
    cod:`int& maxim(int a, int b) {
    int m = (a > b) ? a : b;
    return m;
}`,
    intrebare:`Ce e în neregulă?`,
    optiuni:["Întoarce o referință spre o variabilă locală (dangling)","Lipsește const","Comparația e greșită","Niciuna"],
    corect:0, explicatie:`<code>m</code> e local; după <code>return</code>, cadrul de stivă dispare → referința atârnă (comportament nedefinit).` },

  { id:"c3",
    cod:`struct Base { ~Base(){} };              // ne-virtual
struct Derived : Base {
    int* buf = new int[100];
    ~Derived(){ delete[] buf; }
};
Base* p = new Derived;
delete p;`,
    intrebare:`Care e bug-ul?`,
    optiuni:["delete p e greșit sintactic","~Base ar trebui virtual; altfel ~Derived nu rulează → leak","new int[100] e greșit","Niciuna"],
    corect:1, explicatie:`Fără destructor virtual, <code>delete p</code> printr-un <code>Base*</code> cheamă doar <code>~Base()</code>; <code>buf</code> nu se eliberează.` },

  { id:"c4",
    cod:`Buffer make() {
    Buffer local(5);
    return std::move(local);
}`,
    intrebare:`De ce e <code>std::move</code> aici o greșeală?`,
    optiuni:["Dezactivează (N)RVO și forțează un move inutil","Provoacă double free","local devine const","Nu e o greșeală"],
    corect:0, explicatie:`<code>return std::move(local)</code> returnează o rvalue reference → împiedică copy elision-ul. Lasă pur și simplu <code>return local;</code>.` },

  { id:"c5",
    cod:`class X {
    int a_;
    int b_;
public:
    X(int v) : b_(v), a_(b_) {}
};`,
    intrebare:`Ce valoare primește <code>a_</code>?`,
    optiuni:["v","gunoi — a_ se inițializează primul (e declarat primul), când b_ n-are încă valoare","0","eroare de compilare"],
    corect:1, explicatie:`Ordinea de inițializare = ordinea <b>declarării</b> (a_ înaintea lui b_), NU ordinea din lista de inițializare.` },

  { id:"c6",
    cod:`struct Base {
    Base(){ init(); }
    virtual void init(){ std::cout << "Base\\n"; }
};
struct Derived : Base {
    void init() override { std::cout << "Derived\\n"; }
};
Derived d;`,
    intrebare:`Ce afișează și de ce?`,
    optiuni:["Derived — override-ul are prioritate","Base — în ctor-ul Base, vptr arată spre vtable-ul Base","nimic","comportament nedefinit"],
    corect:1, explicatie:`Apelul virtual din ctor-ul bazei nu ajunge la override; partea Derived nu există încă, deci vptr arată spre vtable-ul Base.` }
];

const OOP_ORDER = [
  { id:"o1",
    sarcina:`Pune în ordine secvența completă la <code>{ Derived d; }</code> — Derived moștenește Base și are membrul <code>Member m_</code>.`,
    pasi:["Base() (subobiectul bazei)","Member m_ (membru)","corp Derived()","corp ~Derived()","~Member m_","~Base()"] },

  { id:"o2",
    sarcina:`Pune în ordine pașii unui apel virtual <code>ptr-&gt;speak()</code>.`,
    pasi:["citește vptr (primii 8 octeți ai obiectului)","din vtable, ia pointerul din slotul funcției","apel indirect prin registru (call rax)"] }
];

const OOP_MATCH = {
  intro:`Potrivește fiecare termen cu definiția corectă.`,
  perechi:[
    ["lvalue",       "are nume / adresă; persistă după expresie"],
    ["rvalue",       "temporar; poate fi „furat” prin move"],
    ["deep copy",    "alocă o zonă nouă și copiază datele"],
    ["shallow copy", "copiază doar pointerul (aceeași zonă)"],
    ["vptr",         "pointer per-obiect spre vtable (la offset 0)"],
    ["vtable",       "tabel de funcții per-clasă, în .rodata"]
  ]
};

if (typeof window !== "undefined"){ window.OOP_QUIZ=OOP_QUIZ; window.OOP_CAPCANE=OOP_CAPCANE; window.OOP_ORDER=OOP_ORDER; window.OOP_MATCH=OOP_MATCH; }
if (typeof module !== "undefined") module.exports = { OOP_QUIZ, OOP_CAPCANE, OOP_ORDER, OOP_MATCH };
