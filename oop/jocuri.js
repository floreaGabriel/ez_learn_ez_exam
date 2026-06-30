/* ============================================================
   OOP C++ — Joculețe inline (conceptuale)
   Format: JOCURI[ref] = { titlu, cod, pasi:[ {linii:[1-based], ce, dece} ] }
     - cod: template literal; un "\n" dintr-un string C++ se scrie "\\n".
     - linii: numerele liniilor (1-based) evidențiate la pasul respectiv.
     - ce / dece: html scurt (escapează < ca &lt;). „Ce se întâmplă" + „De ce".
   Sunt introduse inline în lecție, la conceptul lor, prin {t:"joc", ref:"..."}.
   ============================================================ */
const JOCURI = {

  /* Cap.1 — referință vs valoare */
  "ref-valoare": {
    titlu:"Valoare vs. referință: cine se modifică?",
    cod:
`void inc_valoare(int x) { x++; }   // primește o copie
void inc_ref(int& x)    { x++; }   // primește un alias

int a = 10;
inc_valoare(a);   // a rămâne 10
inc_ref(a);       // a devine 11`,
    pasi:[
      {linii:[1,5], ce:`<code>inc_valoare</code> primește o <b>copie</b> a lui <code>a</code> și incrementează doar copia.`,
        dece:`Transmiterea prin valoare lucrează pe o variabilă locală separată — originalul nu e atins.`},
      {linii:[5], ce:`După apel, <code>a</code> este tot <b>10</b>.`,
        dece:`Copia a dispărut la ieșirea din funcție; <code>a</code> n-a aflat niciodată de ea.`},
      {linii:[2,6], ce:`<code>inc_ref</code> primește un <b>alias</b> al lui <code>a</code>; <code>x++</code> incrementează chiar <code>a</code>.`,
        dece:`O referință e <b>aceeași zonă de memorie</b> ca variabila originală.`},
      {linii:[6], ce:`După apel, <code>a</code> este <b>11</b>.`,
        dece:`Modificările făcute prin referință se văd direct în original. De-aici și „transmiterea prin referință".`}
    ]
  },

  /* Cap.2 — instanțiere */
  "instantiere": {
    titlu:"Instanțiere: ce se creează de fapt?",
    cod:
`Student  S1;                 // obiect direct, pe stivă
Student *S2 = new Student;   // obiect nou, S2 ține adresa lui
Student &S3 = S1;            // alt nume pentru S1
Student *S5;                 // pointer NEINIȚIALIZAT

S5->setId(103);             // CRASH`,
    pasi:[
      {linii:[1], ce:`<code>S1</code> este un obiect <code>Student</code> complet, creat <b>direct</b>.`,
        dece:`Declararea unui obiect îi alocă imediat spațiu; trăiește până la sfârșitul blocului.`},
      {linii:[2], ce:`<code>new Student</code> creează un obiect nou; <code>S2</code> este doar un <b>pointer</b> care reține adresa lui.`,
        dece:`<code>new</code> întoarce o adresă; obiectul trăiește până la <code>delete</code>, indiferent de scope.`},
      {linii:[3], ce:`<code>S3</code> nu e obiect nou — e un <b>al doilea nume</b> pentru <code>S1</code>.`,
        dece:`O referință e un alias: nu ocupă spațiu propriu și trebuie legată de ceva ce există deja.`},
      {linii:[4], ce:`<code>S5</code> e <b>doar pointerul</b>, fără obiect în spate; conține o adresă-gunoi.`,
        dece:`Declararea unui pointer NU creează și obiectul — trebuie <code>new</code> explicit.`},
      {linii:[6], ce:`<code>S5-&gt;setId(...)</code> dereferențiază o adresă invalidă → <b>crash</b>.`,
        dece:`Corect ar fi întâi <code>S5 = new Student;</code>, abia apoi <code>S5-&gt;...</code>.`}
    ]
  },

  /* Cap.3 — ordinea constructorului */
  "ctor-membri-corp": {
    titlu:"În ce ordine se apelează la construcție?",
    cod:
`class Vector {
    Point start;     // membru 1
    Point end;       // membru 2
public:
    Vector() {       // corpul rulează DUPĂ membri
        cout << "Constructor Vector\\n";
    }
};

Vector V1;`,
    pasi:[
      {linii:[10], ce:`Ceri un <code>Vector V1</code>.`,
        dece:`Întâi se rezervă memoria pentru tot obiectul, încă neinițializat.`},
      {linii:[2], ce:`Se construiește membrul <code>start</code>, apelând <code>Point()</code>.`,
        dece:`Membrii se construiesc <b>înaintea</b> corpului, în <b>ordinea declarării</b> în clasă.`},
      {linii:[3], ce:`Apoi membrul <code>end</code>, tot cu <code>Point()</code>.`,
        dece:`Ordinea e dată de declararea în clasă, NU de ordinea din lista de inițializare.`},
      {linii:[5,6,7], ce:`Abia acum rulează <b>corpul</b> constructorului <code>Vector()</code>.`,
        dece:`Când corpul rulează, toți membrii sunt deja construiți și gata de folosit.`}
    ]
  },

  /* Cap.3 — copy shallow */
  "copy-shallow": {
    titlu:"Copierea implicită: de ce dă crash?",
    cod:
`class Student {
    char *nume;
public:
    Student(const char* n) { nume = new char[strlen(n)+1]; strcpy(nume, n); }
    // fără copy constructor => compilatorul generează unul: copiere bit-cu-bit
};

Student a("Pop");
Student b = a;       // copy implicit (shallow)`,
    pasi:[
      {linii:[8], ce:`<code>a</code> alocă un buffer și îi reține adresa în <code>a.nume</code>.`,
        dece:`Constructorul face o copie proprie a textului (deep) — resursă a lui <code>a</code>.`},
      {linii:[9], ce:`Copy-ul implicit copiază <b>valoarea</b> lui <code>a.nume</code> — adică <b>adresa</b>, nu textul.`,
        dece:`Copierea bit-cu-bit: <code>b.nume</code> ajunge spre <b>același</b> buffer ca <code>a.nume</code>.`},
      {linii:[2,4], ce:`Ambele obiecte cred că dețin bufferul. La distrugere, fiecare face <code>delete[]</code> pe aceeași adresă → <b>double free</b>.`,
        dece:`Soluția: un <b>copy constructor</b> care alocă buffer nou și copiază conținutul (deep copy) — Rule of Three.`}
    ]
  },

  /* Cap.3 — distrugere LIFO */
  "dtor-lifo": {
    titlu:"Distrugerea: în ce ordine?",
    cod:
`{
    Vector V1("V1");    // construit primul
    Vector V2("V2");    // construit al doilea
}   // la } : se distrug invers`,
    pasi:[
      {linii:[2], ce:`Se construiește <code>V1</code>.`, dece:`Obiectele locale se așază în ordinea declarării.`},
      {linii:[3], ce:`Se construiește <code>V2</code>, după <code>V1</code>.`, dece:`Acum sunt două obiecte vii în bloc.`},
      {linii:[4], ce:`La <code>}</code> se distruge întâi <code>V2</code> (<code>~V2</code>).`,
        dece:`Ordine inversă (<b>LIFO</b>): ultimul construit este primul distrus.`},
      {linii:[4], ce:`Apoi se distruge <code>V1</code> (<code>~V1</code>).`,
        dece:`Distrugerea respectă mereu inversul ordinii de construcție.`}
    ]
  },

  /* Cap.6 — ordinea pe ierarhie */
  "ierarhie-ctor": {
    titlu:"Moștenire: ordinea pe ierarhie",
    cod:
`struct A     { A(){cout<<"A()\\n";}  ~A(){cout<<"~A()\\n";} };
struct B : A { B(){cout<<"B()\\n";}  ~B(){cout<<"~B()\\n";} };
struct C : B { C(){cout<<"C()\\n";}  ~C(){cout<<"~C()\\n";} };
struct D : C { D(){cout<<"D()\\n";}  ~D(){cout<<"~D()\\n";} };

{ D d; }`,
    pasi:[
      {linii:[1], ce:`La <code>D d;</code> pornește construcția de la cea mai de sus bază: <code>A()</code>.`,
        dece:`Derivata se poate baza pe bază, deci baza se construiește prima.`},
      {linii:[2], ce:`Apoi <code>B()</code>.`, dece:`Se urcă nivel cu nivel pe ierarhie.`},
      {linii:[3], ce:`Apoi <code>C()</code>.`, dece:`Fiecare nivel se bazează pe cele de sub el, deja gata.`},
      {linii:[4], ce:`La final <code>D()</code> — obiectul e complet.`,
        dece:`Ordinea de construcție: <b>bază → derivată</b>.`},
      {linii:[6], ce:`La ieșirea din bloc, întâi <code>~D()</code>.`,
        dece:`Distrugerea e exact inversul: <b>derivată → bază</b>.`},
      {linii:[1], ce:`Apoi <code>~C()</code>, <code>~B()</code> și ultimul <code>~A()</code>.`,
        dece:`Baza moare ultima, fiindcă derivatele se bazau pe ea.`}
    ]
  },

  /* Cap.7 — dispatch virtual */
  "vtable-dispatch": {
    titlu:"Apelul virtual: care f() se cheamă?",
    cod:
`struct Baza            { virtual void f(){ cout<<"Baza::f\\n"; } };
struct Derivat : Baza  { void f() override { cout<<"Derivat::f\\n"; } };

Baza *p = new Derivat;   // tip static Baza*, obiect real Derivat
p->f();`,
    pasi:[
      {linii:[4], ce:`<code>p</code> are tipul <code>Baza*</code>, dar obiectul real din spate e un <code>Derivat</code>.`,
        dece:`Tipul pointerului nu schimbă ce obiect este de fapt.`},
      {linii:[5], ce:`<code>f</code> e <b>virtuală</b> → apelul NU se decide după tipul pointerului.`,
        dece:`Se caută <code>f</code> în tabela virtuală a clasei <b>reale</b> a obiectului (late binding).`},
      {linii:[2,5], ce:`Tabela lui <code>Derivat</code> trimite <code>f</code> la <code>Derivat::f</code> → se afișează „Derivat::f".`,
        dece:`Fără <code>virtual</code>, s-ar fi apelat <code>Baza::f</code> (după tipul static al pointerului).`}
    ]
  },

  /* Cap.7 — destructor virtual */
  "dtor-virtual": {
    titlu:"De ce trebuie destructorul virtual?",
    cod:
`struct Baza            { ~Baza(){ cout<<"~Baza\\n"; } };        // NU e virtual
struct Derivat : Baza  { char *buf = new char[1024];
                         ~Derivat(){ delete[] buf; } };

Baza *p = new Derivat;
delete p;`,
    pasi:[
      {linii:[2,3], ce:`<code>Derivat</code> deține un buffer, eliberat în <code>~Derivat</code>.`,
        dece:`Dacă <code>~Derivat</code> nu rulează, bufferul nu se eliberează.`},
      {linii:[1,6], ce:`<code>~Baza</code> nu e virtual → <code>delete p</code> cheamă static doar <code>~Baza</code>.`,
        dece:`Compilatorul folosește tipul pointerului (<code>Baza*</code>), nu obiectul real.`},
      {linii:[3], ce:`<code>~Derivat</code> nu se apelează → <code>delete[] buf</code> nu rulează → <b>leak</b>.`,
        dece:`Distrugere parțială = resurse pierdute / comportament nedefinit.`},
      {linii:[1], ce:`Fix: <code>virtual ~Baza()</code>. Atunci <code>delete p</code> cheamă <code>~Derivat</code> apoi <code>~Baza</code>.`,
        dece:`Regulă: orice clasă de bază polimorfică are <b>destructor virtual</b>.`}
    ]
  },

  /* Cap.8 — operator+ */
  "operator-plus": {
    titlu:"a + b — ce se apelează?",
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
Complex c = a + b;`,
    pasi:[
      {linii:[10], ce:`Două obiecte: <code>a = (1, 2)</code> și <code>b = (3, 4)</code>.`,
        dece:`Complex e un tip propriu; <code>+</code> nu știe din start ce înseamnă pentru el.`},
      {linii:[11,5], ce:`<code>a + b</code> înseamnă apelul <code>a.operator+(b)</code>.`,
        dece:`<code>a</code> e obiectul-gazdă (<code>this</code>), <code>b</code> e parametrul.`},
      {linii:[6], ce:`În corp: <code>re+alt.re = 4</code>, <code>im+alt.im = 6</code> → se construiește <code>Complex(4, 6)</code>.`,
        dece:`Operatorul e o funcție obișnuită care întoarce un obiect nou.`},
      {linii:[11], ce:`Rezultatul inițializează <code>c = (4, 6)</code>.`,
        dece:`Sintaxa cu <code>+</code> e doar „zahăr"; dedesubt e un apel de metodă normal.`}
    ]
  },

  /* Cap.9 — template = generator */
  "template-instantiere": {
    titlu:"Template = generator de cod",
    cod:
`template <class T>
T maxim(T a, T b) { return (a > b) ? a : b; }

maxim(3, 5);        // -> maxim<int>
maxim(2.7, 1.1);    // -> maxim<double>
maxim('a', 'z');    // -> maxim<char>`,
    pasi:[
      {linii:[1,2], ce:`<code>maxim&lt;T&gt;</code> e un <b>șablon</b>, nu cod gata. Singur, nu produce nimic în binar.`,
        dece:`Un template e o rețetă de generare, parametrizată pe tip.`},
      {linii:[4], ce:`Primul apel cu <code>int</code> → compilatorul <b>generează</b> funcția concretă <code>maxim&lt;int&gt;</code>.`,
        dece:`Instanțiere: o copie reală a codului, specializată pe acel tip.`},
      {linii:[5], ce:`Pentru <code>double</code> se generează <b>o altă</b> funcție, complet separată.`,
        dece:`Pentru linker, sunt simboluri distincte — nu au nicio legătură între ele.`},
      {linii:[6], ce:`Și pentru <code>char</code>. Un șablon → mai multe instanțieri, una per tip folosit.`,
        dece:`De aceea template-urile stau în header: compilatorul trebuie să vadă corpul la fiecare instanțiere.`}
    ]
  },

  /* Cap.12 — excepții */
  "exceptii-unwinding": {
    titlu:"throw → stack unwinding → catch",
    cod:
`void f3() { throw runtime_error("eroare!"); }
void f2() { Resursa r; f3(); }
void f1() {
    try { f2(); }
    catch (exception& e) { cout << e.what(); }
}`,
    pasi:[
      {linii:[3,4], ce:`<code>f1</code> cheamă <code>f2</code> (în <code>try</code>), iar <code>f2</code> cheamă <code>f3</code>.`,
        dece:`<code>f2</code> are un obiect local <code>r</code>.`},
      {linii:[1], ce:`<code>f3</code> aruncă o excepție.`,
        dece:`Execuția normală se oprește; se caută un <code>catch</code> potrivit, în sus pe stivă.`},
      {linii:[2], ce:`La derularea cadrelor (<b>stack unwinding</b>), <code>r</code> se distruge corect.`,
        dece:`De-aici RAII: resursele locale se eliberează automat chiar și la excepții.`},
      {linii:[5], ce:`<code>catch</code>-ul din <code>f1</code> se potrivește → prinde excepția, afișează mesajul.`,
        dece:`După <code>catch</code>, programul continuă normal.`}
    ]
  },

  /* Cap.13 — move */
  "move": {
    titlu:"Move: furtul resursei",
    cod:
`class MemoryBuff {
    char *buf;
public:
    MemoryBuff(MemoryBuff&& alt) {   // move constructor
        buf = alt.buf;               // fură pointerul
        alt.buf = nullptr;           // sursa rămâne goală
    }
};

MemoryBuff a(1024);
MemoryBuff b = std::move(a);`,
    pasi:[
      {linii:[10], ce:`<code>a</code> deține un buffer de 1024 octeți.`,
        dece:`A copia tot bufferul ar fi scump.`},
      {linii:[11], ce:`<code>std::move(a)</code> nu mută nimic singur — doar marchează <code>a</code> ca <b>rvalue</b>.`,
        dece:`Așa se alege <b>move constructor</b>-ul în loc de cel de copiere.`},
      {linii:[5], ce:`Move copiază doar <b>adresa</b> (fură pointerul) — fără alocare, fără copiat octeții.`,
        dece:`Transferi <b>proprietatea</b> resursei, nu conținutul ei. Foarte rapid.`},
      {linii:[6], ce:`<code>alt.buf = nullptr</code>: sursa rămâne validă, dar goală.`,
        dece:`Ca destructorul lui <code>a</code> să nu elibereze bufferul devenit al lui <code>b</code> (fără double free).`}
    ]
  },

  /* Cap.4 — membru static partajat */
  "static-partajat": {
    titlu:"Membru static: o singură copie comună",
    cod:
`class Contor {
public:
    static int n;     // o SINGURĂ copie, comună tuturor
    Contor() { n++; }
};
int Contor::n = 0;    // definire (o singură dată)

Contor a, b, c;`,
    pasi:[
      {linii:[3], ce:`<code>n</code> e <b>static</b>: există o singură dată, partajat de toate obiectele.`,
        dece:`Nu aparține unui obiect anume, ci <b>clasei</b>.`},
      {linii:[6], ce:`Membrul static se definește o dată, în afara clasei.`,
        dece:`Declarația din clasă spune doar că există; definiția îi dă spațiu și valoare.`},
      {linii:[8], ce:`<code>a</code> → <code>n=1</code>, <code>b</code> → <code>n=2</code>, <code>c</code> → <code>n=3</code>.`,
        dece:`Fiecare constructor incrementează <b>același</b> <code>n</code> comun.`},
      {linii:[3], ce:`<code>a.n</code>, <code>b.n</code>, <code>c.n</code> citesc toate valoarea 3.`,
        dece:`Un membru static = stare comună a clasei, nu per-instanță (ex. „câte obiecte există").`}
    ]
  },

  /* Cap.5 — de ce moștenire */
  "de-ce-mostenire": {
    titlu:"De ce moștenire? Reutilizarea codului",
    cod:
`class Student {                          // ce au TOȚI studenții
    char nume[64];
    float medie;
public:
    void print();
};

class StudentBuget : public Student {    // preia tot din Student
    float bursa;                         // adaugă doar ce e specific
};`,
    pasi:[
      {linii:[1,2,3,5], ce:`<code>Student</code> conține ce e <b>comun</b>: nume, medie, <code>print()</code>.`,
        dece:`Punem o singură dată codul folosit de toți.`},
      {linii:[8], ce:`<code>StudentBuget : public Student</code> <b>preia tot</b> din <code>Student</code>.`,
        dece:`Moștenire = reutilizarea codului bazei, fără să-l copiezi.`},
      {linii:[9], ce:`Adaugă doar ce e specific: <code>bursa</code>.`,
        dece:`Eviți duplicarea — o clasă „taxă" ar refolosi exact aceeași bază.`}
    ]
  }

};
