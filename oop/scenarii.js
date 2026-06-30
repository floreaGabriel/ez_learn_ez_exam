/* ============================================================
   OOP C++ — Joculețe (scenarii animate, ciclul de viață)
   Model „hartă de memorie" identic cu engine-ul din index.html:
     scene = { id, nume, rezumat, cod, output?, regions:[...], steps:[...] }
     step  = { title, note(html), out?, cells:{ regiune:[celulă...] }, aliases? }
     celulă= { id, label, val, addr?, points?, hot?, dead? }
   Mapat pe programa de facultate (TOGAN). Fiecare joc explică pas cu pas
   ce se întâmplă în memorie la un concept important.
   ============================================================ */
const OOP_SCENARII = [

  /* 1) Instanțiere: stack vs heap vs pointer neinițializat (Cap 2) */
  {
    id:"instantiere",
    nume:"Instanțiere: ce se creează în memorie",
    rezumat:"Pe stivă (obiect direct), pe heap (cu new, prin pointer), prin referință (alias) — și de ce un pointer neinițializat dă crash.",
    cod:
`Student  S1;                 // obiect direct, pe STIVĂ
Student *S2 = new Student;   // obiect în HEAP, S2 ține adresa
Student &S3 = S1;            // referință: alt nume pentru S1
Student *S5;                 // pointer NEINIȚIALIZAT — nu există obiect!

S5->setId(103);             // crash: dereferențiezi o adresă-gunoi`,
    output:"",
    regions:["stack","heap"],
    steps:[
      { title:"1. Student S1; — pe stivă",
        note:"Declararea unui obiect <b>direct</b> îi alocă spațiu în cadrul de stivă al funcției. <code>S1</code> <b>este</b> obiectul; trăiește până la sfârșitul scope-ului.",
        cells:{ stack:[ {id:"s1", label:"Student S1", val:"obiect (id,nume,medie)", addr:"0x7ffe10", hot:true} ], heap:[] } },
      { title:"2. new Student — pe heap",
        note:"<code>new</code> alocă obiectul în <b>heap</b> și întoarce adresa lui. <code>S2</code> e doar un <b>pointer</b> pe stivă care reține acea adresă.",
        cells:{ stack:[ {id:"s1", label:"Student S1", val:"obiect", addr:"0x7ffe10"},
                        {id:"s2", label:"Student* S2", val:"0x1a40", addr:"0x7ffe18", points:"h1", hot:true} ],
                heap:[ {id:"h1", label:"Student (heap)", val:"obiect", addr:"0x1a40", hot:true} ] } },
      { title:"3. Student& S3 = S1; — alias",
        note:"O <b>referință</b> nu creează obiect nou și nu ocupă spațiu propriu: <code>S3</code> e doar un al doilea nume pentru <code>S1</code>.",
        cells:{ stack:[ {id:"s1", label:"Student S1", val:"obiect", addr:"0x7ffe10", hot:true},
                        {id:"s2", label:"Student* S2", val:"0x1a40", addr:"0x7ffe18", points:"h1"} ],
                heap:[ {id:"h1", label:"Student (heap)", val:"obiect", addr:"0x1a40"} ] },
        aliases:[{name:"Student& S3", target:"s1"}] },
      { title:"4. Student* S5; — pointer gol",
        note:"Am declarat <b>doar pointerul</b>, nu și obiectul. <code>S5</code> conține o valoare-gunoi: <b>nu arată spre niciun Student valid</b>.",
        cells:{ stack:[ {id:"s1", label:"Student S1", val:"obiect", addr:"0x7ffe10"},
                        {id:"s2", label:"Student* S2", val:"0x1a40", addr:"0x7ffe18", points:"h1"},
                        {id:"s5", label:"Student* S5", val:"?? gunoi", addr:"0x7ffe20", points:"VOID", hot:true} ],
                heap:[ {id:"h1", label:"Student (heap)", val:"obiect", addr:"0x1a40"} ] } },
      { title:"5. S5->setId(103); — CRASH",
        note:"Dereferențiezi o adresă-gunoi → <b>comportament nedefinit</b> (de regulă crash). Corect: întâi <code>S5 = new Student;</code>, abia apoi <code>S5-&gt;...</code>.",
        cells:{ stack:[ {id:"s1", label:"Student S1", val:"obiect", addr:"0x7ffe10"},
                        {id:"s2", label:"Student* S2", val:"0x1a40", addr:"0x7ffe18", points:"h1"},
                        {id:"s5", label:"Student* S5", val:"?? gunoi", addr:"0x7ffe20", points:"VOID", dead:true, hot:true} ],
                heap:[ {id:"h1", label:"Student (heap)", val:"obiect", addr:"0x1a40"} ] } }
    ]
  },

  /* 2) Ordinea constructorilor: membri întâi, corpul la final (Cap 3) */
  {
    id:"ctor-membri-corp",
    nume:"Constructor: membrii întâi, corpul la final",
    rezumat:"La construirea unui Vector, întâi se construiesc membrii (Point start, Point end), abia apoi rulează corpul constructorului Vector.",
    cod:
`class Vector {
    Point start;     // membru 1
    Point end;       // membru 2
public:
    Vector() {       // corpul rulează DUPĂ ce start și end există deja
        cout << "Constructor Vector\\n";
    }
};

Vector V1;`,
    output:"Initializare punct: 0,0\nInitializare punct: 0,0\nConstructor Vector",
    regions:["obj"],
    steps:[
      { title:"1. Se alocă memoria obiectului",
        note:"Întâi se rezervă spațiul pentru tot obiectul <code>V1</code> (start + end + restul), <b>neinițializat</b> încă.",
        cells:{ obj:[ {id:"st", label:"Point start", val:"neinițializat"},
                      {id:"en", label:"Point end", val:"neinițializat"},
                      {id:"bd", label:"corp Vector()", val:"încă nu a rulat"} ] } },
      { title:"2. Se construiește membrul start", out:"Initializare punct: 0,0",
        note:"Membrii se construiesc <b>în ordinea declarării în clasă</b>. Întâi <code>start</code>: i se apelează constructorul <code>Point()</code>.",
        cells:{ obj:[ {id:"st", label:"Point start", val:"(0, 0)", hot:true},
                      {id:"en", label:"Point end", val:"neinițializat"},
                      {id:"bd", label:"corp Vector()", val:"încă nu a rulat"} ] } },
      { title:"3. Se construiește membrul end", out:"Initializare punct: 0,0",
        note:"Apoi <code>end</code>, tot cu <code>Point()</code>. Ordinea e dată de declarare, NU de lista de inițializare.",
        cells:{ obj:[ {id:"st", label:"Point start", val:"(0, 0)"},
                      {id:"en", label:"Point end", val:"(0, 0)", hot:true},
                      {id:"bd", label:"corp Vector()", val:"încă nu a rulat"} ] } },
      { title:"4. Rulează corpul Vector()", out:"Constructor Vector",
        note:"Abia acum, cu toți membrii deja construiți, rulează <b>corpul</b> constructorului. Obiectul e complet.",
        cells:{ obj:[ {id:"st", label:"Point start", val:"(0, 0)"},
                      {id:"en", label:"Point end", val:"(0, 0)"},
                      {id:"bd", label:"corp Vector()", val:"gata", hot:true} ] } }
    ]
  },

  /* 3) Copy constructor shallow — capcana pointerului (Cap 3) */
  {
    id:"copy-shallow",
    nume:"Constructorul de copiere: shallow vs deep",
    rezumat:"Copy-ul implicit copiază bit cu bit. Dacă un membru e pointer, ambele obiecte ajung să arate spre ACELAȘI buffer — capcană la distrugere.",
    cod:
`class Student {
    char *nume;      // resursă alocată cu new
public:
    Student(const char* n) { nume = new char[strlen(n)+1]; strcpy(nume, n); }
    // FĂRĂ copy constructor definit => compilatorul îl generează: copiere bit-cu-bit
};

Student a("Popescu");
Student b = a;       // copy constructor implicit (shallow)`,
    output:"",
    regions:["stack","heap"],
    steps:[
      { title:"1. Student a(\"Popescu\")",
        note:"Constructorul alocă în heap un buffer pentru nume și pune adresa în <code>a.nume</code>.",
        cells:{ stack:[ {id:"a", label:"Student a", val:"nume → 0x30", addr:"0x7ffe00", points:"buf1", hot:true} ],
                heap:[ {id:"buf1", label:"char[8]", val:"\"Popescu\"", addr:"0x30"} ] } },
      { title:"2. Student b = a; (shallow)",
        note:"Copy-ul implicit copiază <b>valoarea</b> lui <code>a.nume</code> — adică <b>adresa</b> 0x30. Nu se alocă buffer nou: <code>b.nume</code> ajunge spre <b>același</b> buffer.",
        cells:{ stack:[ {id:"a", label:"Student a", val:"nume → 0x30", addr:"0x7ffe00", points:"buf1"},
                        {id:"b", label:"Student b", val:"nume → 0x30", addr:"0x7ffe10", points:"buf1", hot:true} ],
                heap:[ {id:"buf1", label:"char[8]", val:"\"Popescu\"", addr:"0x30", hot:true} ] } },
      { title:"3. Capcana: dublă eliberare",
        note:"Când se distrug ambele obiecte, fiecare destructor face <code>delete[] nume</code> pe <b>aceeași</b> adresă → <b>double free</b> (crash). Iar o modificare prin <code>a</code> se vede și în <code>b</code>.",
        cells:{ stack:[ {id:"a", label:"Student a", val:"nume → 0x30", addr:"0x7ffe00", points:"buf1", dead:true},
                        {id:"b", label:"Student b", val:"nume → 0x30", addr:"0x7ffe10", points:"buf1", dead:true} ],
                heap:[ {id:"buf1", label:"char[8]", val:"eliberat de 2 ori!", addr:"0x30", dead:true, hot:true} ] } },
      { title:"4. Soluția: deep copy",
        note:"Definești un <b>copy constructor</b> care alocă buffer propriu și copiază conținutul: <code>nume = new char[...]; strcpy(nume, alt.nume);</code>. Acum fiecare obiect are resursa lui.",
        cells:{ stack:[ {id:"a", label:"Student a", val:"nume → 0x30", addr:"0x7ffe00", points:"buf1"},
                        {id:"b", label:"Student b", val:"nume → 0x50", addr:"0x7ffe10", points:"buf2", hot:true} ],
                heap:[ {id:"buf1", label:"char[8]", val:"\"Popescu\"", addr:"0x30"},
                       {id:"buf2", label:"char[8]", val:"\"Popescu\"", addr:"0x50", hot:true} ] } }
    ]
  },

  /* 4) Destrucție în ordine inversă LIFO (Cap 3) */
  {
    id:"dtor-lifo",
    nume:"Distrugere în ordine inversă (LIFO)",
    rezumat:"Obiectele locale se distrug în ordinea inversă creării lor — ca o stivă: ultimul construit, primul distrus.",
    cod:
`{
    Vector V1("V1");    // construit primul
    Vector V2("V2");    // construit al doilea
}   // la } se distrug: întâi ~V2, apoi ~V1`,
    output:"Constructor V1\nConstructor V2\n~V2\n~V1",
    regions:["stack"],
    steps:[
      { title:"1. Vector V1", out:"Constructor V1",
        note:"Se construiește <code>V1</code> și se pune pe stivă.",
        cells:{ stack:[ {id:"v1", label:"Vector V1", val:"construit", addr:"0x7ffe20", hot:true} ] } },
      { title:"2. Vector V2", out:"Constructor V2",
        note:"Se construiește <code>V2</code>, deasupra lui V1 pe stivă.",
        cells:{ stack:[ {id:"v1", label:"Vector V1", val:"construit", addr:"0x7ffe20"},
                        {id:"v2", label:"Vector V2", val:"construit", addr:"0x7ffe30", hot:true} ] } },
      { title:"3. } → se distruge V2", out:"~V2",
        note:"La ieșirea din scope, <b>ultimul construit se distruge primul</b>: rulează <code>~V2</code>.",
        cells:{ stack:[ {id:"v1", label:"Vector V1", val:"construit", addr:"0x7ffe20"},
                        {id:"v2", label:"Vector V2", val:"distrus", addr:"0x7ffe30", dead:true, hot:true} ] } },
      { title:"4. apoi se distruge V1", out:"~V1",
        note:"Apoi <code>~V1</code>. Ordinea de distrugere e exact inversul ordinii de construcție (Last In, First Out).",
        cells:{ stack:[ {id:"v1", label:"Vector V1", val:"distrus", addr:"0x7ffe20", dead:true, hot:true},
                        {id:"v2", label:"Vector V2", val:"distrus", addr:"0x7ffe30", dead:true} ] } }
    ]
  },

  /* 5) Ordinea de construcție/distrugere pe ierarhie (Cap 6) */
  {
    id:"ierarhie-ctor",
    nume:"Moștenire: ordinea pe ierarhie (Bază → Derivată)",
    rezumat:"Pe un lanț de moștenire A→B→C→D, constructorii rulează de la bază spre derivată; destructorii, exact invers.",
    cod:
`struct A { A(){cout<<"A()\\n";}  ~A(){cout<<"~A()\\n";} };
struct B : A { B(){cout<<"B()\\n";}  ~B(){cout<<"~B()\\n";} };
struct C : B { C(){cout<<"C()\\n";}  ~C(){cout<<"~C()\\n";} };
struct D : C { D(){cout<<"D()\\n";}  ~D(){cout<<"~D()\\n";} };

{ D d; }   // construcție A..D, apoi distrugere ~D..~A`,
    output:"A()\nB()\nC()\nD()\n~D()\n~C()\n~B()\n~A()",
    regions:["obj"],
    steps:[
      { title:"1. Constructorul A (baza)", out:"A()",
        note:"Construcția pornește de la <b>cea mai de sus bază</b>. Subobiectul <code>A</code> ocupă fizic primii octeți.",
        cells:{ obj:[ {id:"a", label:"A", val:"construit", hot:true} ] } },
      { title:"2. Constructorul B", out:"B()",
        note:"Apoi nivelul următor, <code>B</code> — care se putea baza pe <code>A</code> deja gata.",
        cells:{ obj:[ {id:"a", label:"A", val:"construit"}, {id:"b", label:"B", val:"construit", hot:true} ] } },
      { title:"3. Constructorul C", out:"C()",
        note:"Apoi <code>C</code>.",
        cells:{ obj:[ {id:"a", label:"A", val:"construit"}, {id:"b", label:"B", val:"construit"},
                      {id:"c", label:"C", val:"construit", hot:true} ] } },
      { title:"4. Constructorul D (derivata)", out:"D()",
        note:"La final, derivata cea mai de jos, <code>D</code>. Obiectul e complet.",
        cells:{ obj:[ {id:"a", label:"A", val:"construit"}, {id:"b", label:"B", val:"construit"},
                      {id:"c", label:"C", val:"construit"}, {id:"d", label:"D", val:"construit", hot:true} ] } },
      { title:"5. Distrugere: ~D primul", out:"~D()",
        note:"La distrugere ordinea se inversează: pleacă <b>de la derivată spre bază</b>. Întâi <code>~D</code>.",
        cells:{ obj:[ {id:"a", label:"A", val:"construit"}, {id:"b", label:"B", val:"construit"},
                      {id:"c", label:"C", val:"construit"}, {id:"d", label:"D", val:"distrus", dead:true, hot:true} ] } },
      { title:"6. ~C, ~B, ~A", out:"~C()",
        note:"Apoi <code>~C</code>, <code>~B</code> și ultimul <code>~A</code> — baza moare ultima, fiindcă derivatele se puteau baza pe ea.",
        cells:{ obj:[ {id:"a", label:"A", val:"se distruge ultimul", hot:true}, {id:"b", label:"B", val:"distrus", dead:true},
                      {id:"c", label:"C", val:"distrus", dead:true}, {id:"d", label:"D", val:"distrus", dead:true} ] } }
    ]
  },

  /* 6) Dispatch virtual prin vtable (Cap 7) */
  {
    id:"vtable-dispatch",
    nume:"Polimorfism: apelul virtual prin vtable",
    rezumat:"Printr-un Baza*, apelul unei metode virtuale e rezolvat la execuție: vptr → vtable-ul clasei reale → adresa metodei suprascrise.",
    cod:
`struct Baza    { virtual void f() { cout << "Baza::f\\n"; } };
struct Derivat : Baza { void f() override { cout << "Derivat::f\\n"; } };

Baza *p = new Derivat;   // tip static Baza*, obiect real Derivat
p->f();                  // afișează "Derivat::f" — late binding`,
    output:"Derivat::f",
    regions:["heap","rodata"],
    steps:[
      { title:"1. new Derivat — obiect cu vptr",
        note:"Orice clasă cu metode virtuale primește un <b>vptr</b> ascuns. Constructorul lui Derivat îl setează spre <b>vtable-ul lui Derivat</b>.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"vptr → vtable Derivat", addr:"0x1a40", points:"vtD", hot:true} ],
                rodata:[ {id:"vtB", label:"vtable Baza [0] f", val:"&Baza::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derivat [0] f", val:"&Derivat::f", addr:"0x4040"} ] } },
      { title:"2. Baza* p = &obiect",
        note:"<code>p</code> are tipul static <code>Baza*</code>, dar arată spre un obiect real <code>Derivat</code>. Tipul pointerului NU schimbă vptr-ul din obiect.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"vptr → vtable Derivat", addr:"0x1a40", points:"vtD"} ],
                rodata:[ {id:"vtB", label:"vtable Baza [0] f", val:"&Baza::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derivat [0] f", val:"&Derivat::f", addr:"0x4040"} ] } },
      { title:"3. p->f(): se citește vptr",
        note:"Apelul virtual nu sare direct la o adresă fixă. Întâi citește <b>vptr</b> din obiect → ajunge la <b>vtable-ul lui Derivat</b>.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"vptr → vtable Derivat", addr:"0x1a40", points:"vtD", hot:true} ],
                rodata:[ {id:"vtB", label:"vtable Baza [0] f", val:"&Baza::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derivat [0] f", val:"&Derivat::f", addr:"0x4040", hot:true} ] } },
      { title:"4. slot[0] → &Derivat::f", out:"Derivat::f",
        note:"Din vtable se ia slot-ul lui <code>f</code>: <code>&amp;Derivat::f</code>. Se execută versiunea din clasa <b>reală</b>, nu cea din tipul pointerului. Asta e <b>late binding</b>.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"vptr → vtable Derivat", addr:"0x1a40", points:"vtD"} ],
                rodata:[ {id:"vtB", label:"vtable Baza [0] f", val:"&Baza::f", addr:"0x4020"},
                         {id:"vtD", label:"vtable Derivat [0] f", val:"&Derivat::f → APELAT", addr:"0x4040", hot:true} ] } }
    ]
  },

  /* 7) Destructor virtual — de ce e obligatoriu (Cap 7) */
  {
    id:"dtor-virtual",
    nume:"De ce destructorul trebuie să fie virtual",
    rezumat:"delete printr-un Baza* fără destructor virtual cheamă doar ~Baza — partea Derivat rămâne nedistrusă (leak / UB).",
    cod:
`struct Baza    { ~Baza()    { cout << "~Baza\\n"; } };          // NU e virtual!
struct Derivat : Baza {
    char *buf = new char[1024];
    ~Derivat() { delete[] buf; cout << "~Derivat\\n"; }
};

Baza *p = new Derivat;
delete p;     // cheamă DOAR ~Baza → buf-ul lui Derivat se pierde (leak)`,
    output:"~Baza",
    regions:["heap"],
    steps:[
      { title:"1. new Derivat",
        note:"Obiectul Derivat conține și un buffer alocat cu <code>new[]</code>, eliberat în <code>~Derivat</code>.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"buf → 0x90", addr:"0x1a40", points:"buf"},
                       {id:"buf", label:"char[1024]", val:"alocat", addr:"0x90"} ] } },
      { title:"2. delete p; (p e Baza*)",
        note:"Pentru că <code>~Baza</code> <b>nu e virtual</b>, compilatorul cheamă static doar destructorul tipului pointerului: <code>~Baza</code>.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"~Baza rulează", addr:"0x1a40", points:"buf", hot:true},
                       {id:"buf", label:"char[1024]", val:"alocat", addr:"0x90"} ] } },
      { title:"3. ~Derivat NU rulează → leak", out:"~Baza",
        note:"<code>~Derivat</code> nu e apelat, deci <code>delete[] buf</code> nu se execută: bufferul de 1024 octeți rămâne pierdut. Comportament nedefinit la distrugere parțială.",
        cells:{ heap:[ {id:"obj", label:"parte Baza distrusă", val:"~Baza only", addr:"0x1a40", points:"buf", dead:true},
                       {id:"buf", label:"char[1024]", val:"LEAK — nedealocat", addr:"0x90", dead:true, hot:true} ] } },
      { title:"4. Soluția: virtual ~Baza()",
        note:"Declarând <code>virtual ~Baza()</code>, <code>delete p</code> trece prin vtable și cheamă întâi <code>~Derivat</code> (eliberează buf) apoi <code>~Baza</code>. Regulă: <b>orice clasă de bază polimorfică are destructor virtual</b>.",
        cells:{ heap:[ {id:"obj", label:"obiect Derivat", val:"~Derivat apoi ~Baza", addr:"0x1a40", hot:true} ] } }
    ]
  },

  /* 8) Supraîncărcarea operatorului + (Cap 8) */
  {
    id:"operator-plus",
    nume:"Supraîncărcarea operatorului +",
    rezumat:"c = a + b este de fapt apelul a.operator+(b) — funcția returnează un obiect nou cu suma.",
    cod:
`class Complex {
    float re, im;
public:
    Complex(float r=0, float i=0) : re(r), im(i) {}
    Complex operator+(const Complex& alt) const {
        return Complex(re + alt.re, im + alt.im);
    }
};

Complex a(1, 2), b(3, 4);
Complex c = a + b;          // <=> a.operator+(b)`,
    output:"",
    regions:["stack"],
    steps:[
      { title:"1. a(1,2) și b(3,4)",
        note:"Două obiecte Complex pe stivă, fiecare cu <code>re</code> și <code>im</code>.",
        cells:{ stack:[ {id:"a", label:"Complex a", val:"re=1, im=2", hot:true},
                        {id:"b", label:"Complex b", val:"re=3, im=4", hot:true} ] } },
      { title:"2. a + b → a.operator+(b)",
        note:"Compilatorul traduce <code>a + b</code> în apelul metodei <code>a.operator+(b)</code>: <code>a</code> e obiectul-gazdă (<code>this</code>), <code>b</code> e parametrul.",
        cells:{ stack:[ {id:"a", label:"Complex a (this)", val:"re=1, im=2", hot:true},
                        {id:"b", label:"Complex b (param)", val:"re=3, im=4", hot:true} ] } },
      { title:"3. Se calculează suma",
        note:"În corp: <code>re + alt.re</code> = 1+3 = 4, <code>im + alt.im</code> = 2+4 = 6. Se construiește un <b>obiect temporar</b> cu rezultatul.",
        cells:{ stack:[ {id:"a", label:"Complex a", val:"re=1, im=2"},
                        {id:"b", label:"Complex b", val:"re=3, im=4"},
                        {id:"t", label:"Complex (temporar)", val:"re=4, im=6", hot:true} ] } },
      { title:"4. c primește rezultatul",
        note:"Obiectul întors inițializează <code>c</code>. Operatorii sunt funcții obișnuite, doar cu o sintaxă specială de apel.",
        cells:{ stack:[ {id:"a", label:"Complex a", val:"re=1, im=2"},
                        {id:"b", label:"Complex b", val:"re=3, im=4"},
                        {id:"c", label:"Complex c", val:"re=4, im=6", hot:true} ] } }
    ]
  },

  /* 9) Template = generator de cod (Cap 9) */
  {
    id:"template-instantiere",
    nume:"Template = generator de cod",
    rezumat:"Un template nu e cod, ci un șablon. Compilatorul generează câte o funcție concretă pentru fiecare tip cu care îl folosești.",
    cod:
`template <class T>
T maxim(T a, T b) { return (a > b) ? a : b; }

maxim(3, 5);        // instanțiază maxim<int>
maxim(2.7, 1.1);    // instanțiază maxim<double>
maxim('a', 'z');    // instanțiază maxim<char>`,
    output:"",
    regions:["text"],
    steps:[
      { title:"1. Șablonul (nu generează cod)",
        note:"<code>template&lt;class T&gt; maxim</code> e doar o <b>rețetă</b>. Atât timp cât nu e folosit, nu apare nicio funcție în binar.",
        cells:{ text:[ {id:"tpl", label:"template maxim<T>", val:"șablon — nicio instanțiere", hot:true} ] } },
      { title:"2. maxim(3,5) → maxim<int>",
        note:"La primul apel cu <code>int</code>, compilatorul <b>instanțiază</b> o funcție concretă <code>maxim&lt;int&gt;</code> și o pune în secțiunea de cod.",
        cells:{ text:[ {id:"tpl", label:"template maxim<T>", val:"șablon"},
                       {id:"i", label:"maxim<int>(int,int)", val:"cod generat", hot:true} ] } },
      { title:"3. maxim(2.7,1.1) → maxim<double>",
        note:"Pentru <code>double</code> se generează o <b>altă</b> funcție, complet separată. Pentru linker sunt simboluri distincte.",
        cells:{ text:[ {id:"tpl", label:"template maxim<T>", val:"șablon"},
                       {id:"i", label:"maxim<int>(int,int)", val:"cod generat"},
                       {id:"d", label:"maxim<double>(double,double)", val:"cod generat", hot:true} ] } },
      { title:"4. maxim('a','z') → maxim<char>",
        note:"Și pentru <code>char</code>. Concluzie: <b>un șablon → multiple instanțieri</b>, câte una per tip folosit. De-aici și de ce template-urile stau în header.",
        cells:{ text:[ {id:"tpl", label:"template maxim<T>", val:"șablon"},
                       {id:"i", label:"maxim<int>", val:"cod generat"},
                       {id:"d", label:"maxim<double>", val:"cod generat"},
                       {id:"c", label:"maxim<char>(char,char)", val:"cod generat", hot:true} ] } }
    ]
  },

  /* 10) Excepții: throw → stack unwinding → catch (Cap 12) */
  {
    id:"exceptii-unwinding",
    nume:"Excepții: throw, stack unwinding, catch",
    rezumat:"O excepție aruncată în adânc derulează stiva în sus (apelând destructorii obiectelor locale) până găsește un catch potrivit.",
    cod:
`void f3() { throw runtime_error("eroare!"); }   // aruncă
void f2() { Resursa r; f3(); }                  // r se distruge la unwinding
void f1() {
    try { f2(); }
    catch (exception& e) { cout << e.what(); }  // prinde aici
}`,
    output:"eroare!",
    regions:["stack"],
    steps:[
      { title:"1. f1 → f2 → f3 (stiva crește)",
        note:"<code>f1</code> apelează <code>f2</code>, care apelează <code>f3</code>. Cadrele se stivuiesc. <code>f2</code> are un obiect local <code>r</code>.",
        cells:{ stack:[ {id:"f1", label:"f1() — try", val:"așteaptă"},
                        {id:"f2", label:"f2() — Resursa r", val:"r construit"},
                        {id:"f3", label:"f3()", val:"rulează", hot:true} ] } },
      { title:"2. throw în f3", out:"",
        note:"<code>f3</code> aruncă o excepție. Execuția normală se oprește; începe căutarea unui <code>catch</code> potrivit, în sus pe stivă.",
        cells:{ stack:[ {id:"f1", label:"f1() — try", val:"așteaptă"},
                        {id:"f2", label:"f2() — Resursa r", val:"r construit"},
                        {id:"f3", label:"f3() — THROW", val:"excepție aruncată", dead:true, hot:true} ] } },
      { title:"3. Stack unwinding: ~Resursa",
        note:"Pe măsură ce se derulează cadrele (<b>stack unwinding</b>), obiectele locale se distrug corect: <code>~Resursa</code> pentru <code>r</code> din f2. (De-aici importanța destructorilor — RAII.)",
        cells:{ stack:[ {id:"f1", label:"f1() — try", val:"așteaptă"},
                        {id:"f2", label:"f2() — ~Resursa", val:"r distrus", dead:true, hot:true},
                        {id:"f3", label:"f3()", val:"derulat", dead:true} ] } },
      { title:"4. catch în f1", out:"eroare!",
        note:"<code>f1</code> are un <code>catch(exception&amp;)</code> care se potrivește → excepția e prinsă, se afișează mesajul și programul continuă normal.",
        cells:{ stack:[ {id:"f1", label:"f1() — catch", val:"excepție prinsă", hot:true},
                        {id:"f2", label:"f2()", val:"derulat", dead:true},
                        {id:"f3", label:"f3()", val:"derulat", dead:true} ] } }
    ]
  },

  /* 11) Move semantics — furtul resursei (Cap 13) */
  {
    id:"move",
    nume:"Move semantics: furtul resursei",
    rezumat:"Move constructor nu copiază bufferul, ci îi fură pointerul; sursa rămâne goală (nullptr). Rapid și fără alocare nouă.",
    cod:
`class MemoryBuff {
    char *buf;
public:
    MemoryBuff(MemoryBuff&& alt) {   // move constructor
        buf = alt.buf;               // FURĂ pointerul
        alt.buf = nullptr;           // sursa rămâne goală
    }
};

MemoryBuff a(1024);
MemoryBuff b = std::move(a);   // mută a în b`,
    output:"",
    regions:["stack","heap"],
    steps:[
      { title:"1. MemoryBuff a(1024)",
        note:"<code>a</code> deține un buffer în heap; <code>a.buf</code> ține adresa lui.",
        cells:{ stack:[ {id:"a", label:"MemoryBuff a", val:"buf → 0x80", addr:"0x7ffe00", points:"buf1", hot:true} ],
                heap:[ {id:"buf1", label:"char[1024]", val:"date", addr:"0x80"} ] } },
      { title:"2. std::move(a) marchează a ca „de furat”",
        note:"<code>std::move</code> NU mută nimic singur — doar transformă <code>a</code> într-un rvalue, ca să se aleagă <b>move constructor</b>-ul în loc de copy.",
        cells:{ stack:[ {id:"a", label:"MemoryBuff a (rvalue)", val:"buf → 0x80", addr:"0x7ffe00", points:"buf1", hot:true} ],
                heap:[ {id:"buf1", label:"char[1024]", val:"date", addr:"0x80"} ] } },
      { title:"3. b fură pointerul",
        note:"Move constructor copiază doar <b>adresa</b> în <code>b.buf</code> — fără alocare nouă, fără copiat 1024 octeți. Acum <code>b</code> deține bufferul.",
        cells:{ stack:[ {id:"a", label:"MemoryBuff a", val:"buf → 0x80", addr:"0x7ffe00", points:"buf1"},
                        {id:"b", label:"MemoryBuff b", val:"buf → 0x80", addr:"0x7ffe10", points:"buf1", hot:true} ],
                heap:[ {id:"buf1", label:"char[1024]", val:"date", addr:"0x80", hot:true} ] } },
      { title:"4. a.buf = nullptr (sursa golită)",
        note:"Sursa <code>a</code> e lăsată într-o stare validă-dar-goală (<code>nullptr</code>), ca destructorul ei să nu elibereze bufferul furat. Un singur proprietar = fără double free.",
        cells:{ stack:[ {id:"a", label:"MemoryBuff a", val:"buf → nullptr", addr:"0x7ffe00", points:"VOID", hot:true},
                        {id:"b", label:"MemoryBuff b", val:"buf → 0x80", addr:"0x7ffe10", points:"buf1"} ],
                heap:[ {id:"buf1", label:"char[1024]", val:"date (al lui b)", addr:"0x80"} ] } }
    ]
  }

];
