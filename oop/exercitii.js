/* ============================================================
   OOP C++ — Exerciții & quiz (mapat pe programa de facultate)
   OOP_QUIZ    : grilă (single/multi), multe cu snippet + „prezice output-ul”
                 {id,tema,multi,enunt,cod?,optiuni[],corecte[idx],explicatie}
   OOP_CAPCANE : găsește bug-ul   {id,cod,intrebare,optiuni[],corect idx,explicatie}
   OOP_ORDER   : ordonează pașii  {id,sarcina,pasi[ în ordinea corectă ]}
   OOP_MATCH   : împerechere      {intro,perechi:[[termen,definiție],...]}
   ============================================================ */

const OOP_QUIZ = [
  { id:"q1", tema:"1 · Introductiv", multi:false,
    enunt:`Care declarație de funcție este <b>ilegală</b>?`,
    optiuni:["void f(int x, int y = 0, int z = 0)","void f(int x = 1, int y, int z)","void f(int x, int y, int z = 1)","void f(int x = 1, int y = 2, int z = 3)"],
    corecte:[1], explicatie:`Parametrii cu valoare implicită trebuie să fie la finalul listei. <code>f(int x=1, int y, int z)</code> are un implicit urmat de parametri fără implicit → eroare.` },

  { id:"q2", tema:"1 · Referințe", multi:false,
    enunt:`Ce afișează secvența?`,
    cod:`int x = 5;
int& y = x;
y++;
std::cout << x;`,
    optiuni:["5","6","adresa lui x","eroare de compilare"], corecte:[1],
    explicatie:`<code>y</code> e un alias pentru <code>x</code> (aceeași zonă de memorie). <code>y++</code> incrementează chiar <code>x</code> → 6.` },

  { id:"q3", tema:"1 · new / delete", multi:false,
    enunt:`Cum eliberezi corect <code>int* p = new int[20];</code>?`,
    optiuni:["delete p;","delete[] p;","free(p);","nu trebuie eliberat"], corecte:[1],
    explicatie:`Memoria alocată cu <code>new[]</code> se eliberează cu <code>delete[]</code>. Amestecul <code>new</code>/<code>free</code> sau <code>delete</code> pe <code>new[]</code> = comportament nedefinit.` },

  { id:"q4", tema:"2 · Clase & obiecte", multi:false,
    enunt:`Ce reprezintă pointerul <code>this</code> într-o metodă?`,
    optiuni:["adresa clasei","adresa obiectului care a apelat metoda","o copie a obiectului","numele metodei"],
    corecte:[1], explicatie:`La fiecare apel de metodă, obiectul-gazdă este transmis automat (implicit) ca <code>this</code> — adresa obiectului care apelează.` },

  { id:"q5", tema:"2 · Instanțiere", multi:false,
    enunt:`Ce se întâmplă la <code>S5->setId(103);</code>?`,
    cod:`Student *S5;          // doar pointerul, neinițializat
S5->setId(103);`,
    optiuni:["se creează un Student nou","crash / comportament nedefinit","setId nu face nimic","eroare de compilare"],
    corecte:[1], explicatie:`<code>S5</code> nu arată spre niciun obiect valid (e o adresă-gunoi). Dereferențierea lui → UB/crash. Corect: întâi <code>S5 = new Student;</code>.` },

  { id:"q6", tema:"3 · Constructori", multi:true,
    enunt:`Care afirmații despre constructori sunt adevărate? (alege tot)`,
    optiuni:["Au același nume ca clasa","Întorc void","Nu întorc nimic (nici void)","Pot exista mai mulți, diferiți prin parametri"],
    corecte:[0,2,3], explicatie:`Constructorul are numele clasei, NU returnează nimic (nici void), și pot exista mai mulți (supraîncărcați după lista de parametri).` },

  { id:"q7", tema:"3 · Constructor implicit", multi:false,
    enunt:`Când scrii cel puțin un constructor cu parametri, ce se întâmplă cu constructorul implicit?`,
    optiuni:["rămâne disponibil automat","compilatorul NU îl mai generează","devine privat","devine virtual"],
    corecte:[1], explicatie:`Dacă declari orice constructor, compilatorul nu mai generează constructorul default fără parametri. <code>Clasa obj;</code> ar da eroare dacă nu îl declari explicit.` },

  { id:"q8", tema:"3 · Destructori", multi:false,
    enunt:`În ce ordine se distrug obiectele locale dintr-un bloc?`,
    cod:`{
    Vector V1;
    Vector V2;
}`,
    optiuni:["~V1 apoi ~V2","~V2 apoi ~V1","aleatoriu","doar ~V2"],
    corecte:[1], explicatie:`Ordine inversă creării (LIFO): ultimul construit (V2) se distruge primul, apoi V1.` },

  { id:"q9", tema:"4 · Membri statici", multi:false,
    enunt:`Un membru <code>static int n;</code> al unei clase este...`,
    optiuni:["câte unul pentru fiecare obiect","unul singur, partajat de toate obiectele","alocat pe stivă","inaccesibil din metode"],
    corecte:[1], explicatie:`Un membru static există o singură dată, partajat de toate instanțele clasei (nu aparține unui obiect anume).` },

  { id:"q10", tema:"4 · struct vs class", multi:false,
    enunt:`Care e singura diferență între <code>struct</code> și <code>class</code> în C++?`,
    optiuni:["struct nu poate avea metode","accesul implicit: public la struct, private la class","class nu poate fi moștenită","struct nu are constructori"],
    corecte:[1], explicatie:`Tehnic identice; diferă doar accesul implicit (și tipul implicit de moștenire): <code>public</code> la struct, <code>private</code> la class.` },

  { id:"q11", tema:"5 · Moștenire", multi:false,
    enunt:`Un membru <code>protected</code> al bazei este accesibil...`,
    optiuni:["doar din bază","din bază și din clasele derivate","din orice cod extern","doar prin friend"],
    corecte:[1], explicatie:`<code>protected</code> = ca <code>private</code> pentru exterior, dar accesibil din clasele derivate. De aceea baza expune câmpurile spre derivate ca protected, nu private.` },

  { id:"q12", tema:"6 · Ordinea pe ierarhie", multi:false,
    enunt:`Pentru <code>struct B : A</code>, la <code>B b;</code> ce ordine de construcție au constructorii?`,
    optiuni:["B() apoi A()","A() apoi B()","doar B()","aleatoriu"],
    corecte:[1], explicatie:`Construcția pornește de la bază spre derivată: întâi <code>A()</code> (subobiectul bază), apoi <code>B()</code>. Distrugerea e exact invers.` },

  { id:"q13", tema:"6 · Conversii", multi:false,
    enunt:`Atribuirea <code>Baza* p = new Derivat;</code> este permisă când derivarea e...`,
    optiuni:["privată","publică","protected","niciodată"],
    corecte:[1], explicatie:`Conversia implicită Derivat* → Baza* (upcast) e permisă doar la moștenire <b>publică</b> (relația „is-a”).` },

  { id:"q14", tema:"7 · Polimorfism", multi:false,
    enunt:`Ce afișează apelul <code>p->f();</code>?`,
    cod:`struct Baza    { virtual void f(){ std::cout<<"Baza"; } };
struct Derivat : Baza { void f() override { std::cout<<"Derivat"; } };

Baza *p = new Derivat;
p->f();`,
    optiuni:["Baza","Derivat","adresa","eroare"], corecte:[1],
    explicatie:`<code>f</code> e virtuală → late binding: apelul trece prin vptr → vtable-ul clasei reale (Derivat) → <code>Derivat::f</code>. Fără <code>virtual</code> s-ar fi afișat „Baza”.` },

  { id:"q15", tema:"7 · Destructor virtual", multi:false,
    enunt:`<code>delete p;</code> (p e <code>Baza*</code> spre un Derivat) cu destructor NE-virtual cheamă...`,
    optiuni:["~Derivat apoi ~Baza","doar ~Baza → posibil leak","doar ~Derivat","ambele de două ori"],
    corecte:[1], explicatie:`Fără destructor virtual se cheamă static doar <code>~Baza</code>; partea Derivat (și resursele ei) nu se distruge → memory leak / UB. De aceea baza polimorfică are <code>virtual ~Baza()</code>.` },

  { id:"q16", tema:"7 · Clase abstracte", multi:false,
    enunt:`O clasă cu o metodă virtuală pură (<code>virtual void f() = 0;</code>)...`,
    optiuni:["se poate instanția normal","NU poate fi instanțiată direct","nu poate avea alte metode","nu poate fi moștenită"],
    corecte:[1], explicatie:`O clasă cu cel puțin o metodă virtuală pură e <b>abstractă</b>: nu poți crea obiecte din ea, doar din clase derivate care implementează metoda.` },

  { id:"q17", tema:"8 · Operatori", multi:false,
    enunt:`Expresia <code>a + b</code> (a, b de tip Complex) este de fapt...`,
    optiuni:["a.operator+(b)","operator+(a, b, c)","a.add(b) automat","nedefinită"],
    corecte:[0], explicatie:`Ca metodă membru, <code>a + b</code> înseamnă <code>a.operator+(b)</code>: <code>a</code> e <code>this</code>, <code>b</code> e parametrul.` },

  { id:"q18", tema:"8 · Comutativitate", multi:false,
    enunt:`Pentru a permite <code>2 + a</code> (int + Complex), operatorul trebuie definit ca...`,
    optiuni:["metodă membru","funcție friend (sau liberă)","constructor","nu se poate"],
    corecte:[1], explicatie:`<code>2 + a</code> ar însemna <code>2.operator+(a)</code> — imposibil, int nu are metode. Soluția: o funcție <code>friend</code>/liberă <code>operator+(int, const Complex&)</code>.` },

  { id:"q19", tema:"9 · Template", multi:false,
    enunt:`Câte funcții generează compilatorul pentru <code>maxim&lt;T&gt;</code> dacă îl apelezi cu int, double și char?`,
    optiuni:["una singură, generică","trei, câte una per tip","niciuna până la link","depinde de runtime"],
    corecte:[1], explicatie:`Un template e un generator de cod: compilatorul <b>instanțiază</b> câte o funcție concretă per tip folosit → 3 funcții separate (int, double, char).` },

  { id:"q20", tema:"12 · Excepții", multi:false,
    enunt:`Ce se întâmplă cu obiectele locale când o excepție derulează stiva (stack unwinding)?`,
    optiuni:["se pierd fără curățare","li se apelează destructorii corect","devin globale","se copiază în catch"],
    corecte:[1], explicatie:`La stack unwinding, destructorii obiectelor locale din cadrele derulate se apelează corect — baza pentru RAII (resurse eliberate automat).` },

  { id:"q21", tema:"13 · Move", multi:false,
    enunt:`Ce face un move constructor corect cu sursa?`,
    optiuni:["copiază bufferul bit-cu-bit","fură pointerul și lasă sursa pe nullptr","șterge sursa imediat","aruncă excepție"],
    corecte:[1], explicatie:`Move „fură” resursa (copiază doar pointerul) și pune sursa pe <code>nullptr</code>, ca destructorul sursei să nu elibereze bufferul furat (evită double free).` },

  { id:"q22", tema:"13 · nullptr", multi:false,
    enunt:`De ce <code>nullptr</code> e preferat lui <code>NULL</code>?`,
    optiuni:["e mai scurt","are tip propriu (nu se confundă cu 0/int)","e mai rapid la runtime","NULL nu mai compilează"],
    corecte:[1], explicatie:`<code>NULL</code> e de obicei <code>0</code> (int) și creează ambiguități la supraîncărcare (<code>f(int)</code> vs <code>f(T*)</code>). <code>nullptr</code> are tipul dedicat <code>std::nullptr_t</code>.` }
];

const OOP_CAPCANE = [
  { id:"c1", tema:"Găsește capcana",
    intrebare:`Care e problema acestei clase?`,
    cod:`class Student {
    char *nume;
public:
    Student(const char* n){ nume = new char[strlen(n)+1]; strcpy(nume,n); }
    ~Student(){ delete[] nume; }
    // fără copy constructor
};
Student a("Pop");
Student b = a;`,
    optiuni:["nimic, e corect","copy implicit = shallow → ambele arată spre același buffer → double free","strcpy e greșit","lipsește un destructor"],
    corect:1, explicatie:`Copy-ul implicit copiază pointerul (shallow). La distrugere, <code>~Student</code> face <code>delete[]</code> de două ori pe aceeași adresă → double free. Soluție: copy constructor cu deep copy (Rule of Three).` },

  { id:"c2", tema:"Găsește capcana",
    intrebare:`De ce e periculos acest cod?`,
    cod:`struct Baza    { ~Baza(){} };           // destructor ne-virtual
struct Derivat : Baza { char* buf = new char[1024]; ~Derivat(){ delete[] buf; } };

Baza *p = new Derivat;
delete p;`,
    optiuni:["nimic","~Derivat nu se apelează → buf rămâne leak","new e greșit","p nu poate fi Baza*"],
    corect:1, explicatie:`Destructorul bazei nu e <code>virtual</code>, deci <code>delete p</code> cheamă doar <code>~Baza</code>; <code>~Derivat</code> (și <code>delete[] buf</code>) nu rulează → leak. Fix: <code>virtual ~Baza()</code>.` },

  { id:"c3", tema:"Găsește capcana",
    intrebare:`Ce e greșit la funcția <code>gresit</code>?`,
    cod:`int& gresit() {
    int x = 5;
    return x;
}
int& r = gresit();`,
    optiuni:["nimic","întoarce referință spre o variabilă locală distrusă → dangling","x ar trebui static","lipsește return type"],
    corect:1, explicatie:`<code>x</code> e local: la return, cadrul de stivă dispare. Referința/pointerul spre el rămâne „dangling” → comportament nedefinit.` },

  { id:"c4", tema:"Găsește capcana",
    intrebare:`Ce afișează și de ce e neașteptat?`,
    cod:`struct Baza    { void f(){ std::cout<<"Baza"; } };   // NU e virtual
struct Derivat : Baza { void f(){ std::cout<<"Derivat"; } };

Baza *p = new Derivat;
p->f();`,
    optiuni:["Derivat","Baza — pentru că f nu e virtual (early binding)","eroare","adresa"],
    corect:1, explicatie:`Fără <code>virtual</code>, apelul se rezolvă după <b>tipul static</b> al pointerului (Baza*) la compilare → <code>Baza::f</code>. Pentru polimorfism, <code>f</code> trebuie <code>virtual</code>.` },

  { id:"c5", tema:"Găsește capcana",
    intrebare:`De ce dă valori „gunoi” (-858993460)?`,
    cod:`class Point { int x, y;
public: int getx() const { return x; } };
class Vector { Point start, end; public: Vector(){ /* nu inițializează start/end */ } };

Vector V;   // start.x, end.x = gunoi`,
    optiuni:["new lipsește","Point nu are constructor care să inițializeze x,y → membri neinițializați","getx e greșit","V trebuie pe heap"],
    corect:1, explicatie:`<code>Point</code> nu are constructor care să pună x=y=0, iar <code>Vector()</code> nu îi inițializează → membrii rămân cu memoria neinițializată (0xCCCCCCCC în Debug). Fix: <code>Point(){ x=0; y=0; }</code>.` }
];

const OOP_ORDER = [
  { id:"o1", sarcina:`Ordonează ce se întâmplă la construirea unui <code>Vector</code> cu membri <code>Point start, end</code>:`,
    pasi:["se alocă memoria obiectului","se construiește membrul start (Point)","se construiește membrul end (Point)","rulează corpul constructorului Vector()"] },

  { id:"o2", sarcina:`Ordonează construcția și distrugerea pentru <code>struct B:A</code>, obiect <code>B b;</code> apoi ieșire din scope:`,
    pasi:["constructor A() (baza)","constructor B() (derivata)","destructor ~B() (derivata)","destructor ~A() (baza)"] },

  { id:"o3", sarcina:`Ordonează pașii unei excepții aruncate adânc și prinse sus:`,
    pasi:["f3() execută throw","execuția normală se oprește, începe căutarea catch","stack unwinding: destructorii obiectelor locale rulează","catch-ul potrivit din f1() prinde excepția"] },

  { id:"o4", sarcina:`Ordonează ce face un <code>delete p;</code> corect (destructor virtual) pe un Derivat printr-un Baza*:`,
    pasi:["se citește vptr → vtable","se apelează ~Derivat (eliberează resursele derivatei)","se apelează ~Baza (eliberează partea bazei)","se eliberează memoria obiectului"] }
];

const OOP_MATCH = {
  intro:`Potrivește fiecare concept cu definiția lui:`,
  perechi:[
    ["Încapsulare","gruparea datelor și a comportamentului într-o clasă, cu ascunderea detaliilor interne"],
    ["Moștenire","reutilizarea codului: o clasă derivată preia structura și comportamentul bazei"],
    ["Polimorfism","comportament diferit în situații diferite (overload, virtual, template)"],
    ["Constructor","metodă cu numele clasei, fără tip de retur, care inițializează obiectul"],
    ["Destructor","metodă ~Clasa() apelată automat la distrugerea obiectului (eliberare resurse)"],
    ["Metodă virtuală","metodă rezolvată la execuție prin vtable/vptr (late binding)"],
    ["Membru static","un singur membru, partajat de toate instanțele clasei"],
    ["friend","funcție/clasă care primește acces la membrii privați ai clasei"],
    ["Template","șablon din care compilatorul generează cod concret per tip"],
    ["std::move","cast care marchează un obiect ca rvalue, ca să se folosească move"]
  ]
};
