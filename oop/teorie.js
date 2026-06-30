/* ============================================================
   OOP C++ — Teorie (12 capitole, dupa programa de facultate / TOGAN)
   Blocuri randate de index.html: h, h4, p, ul, code, note, cmp, table, diagram
   ============================================================ */
const OOP_TEORIE = [
{ id:"elemente-introductive", nume:"1 · Elemente introductive", blocks:[
  {t:"p", html:`Înainte de clase, C++ adaugă peste C câteva mecanisme de care depinde tot restul cursului: <b>parametri impliciți</b>, <b>supraîncărcarea funcțiilor</b>, <b>tipul referință</b> (<code>&amp;</code>), alocatorul <code>new</code>/<code>delete</code> și stream-urile <code>cin</code>/<code>cout</code>. La final fixăm cele trei concepte OOP: încapsulare, moștenire, polimorfism.`},

  {t:"h", html:`Funcții cu parametri impliciți`},
  {t:"p", html:`Un parametru poate primi o <b>valoare implicită</b>, folosită atunci când apelantul nu o transmite. Astfel, un singur antet acoperă mai multe forme de apel.`},
  {t:"code", cod:`float get_point_distance(int x = 0, int y = 0, int z = 0) {
    return (float) sqrt(x*x + y*y + z*z);
}

get_point_distance(1, 2, 3);   // distanța la (1,2,3)
get_point_distance(1, 2);      // distanța la (1,2,0)
get_point_distance(1);         // distanța la (1,0,0)
get_point_distance();          // distanța la (0,0,0)`},
  {t:"note", kind:"capcana", html:`Parametrii cu valoare implicită trebuie să fie <b>la finalul</b> listei. <code>float f(int x, int y = 0, int z)</code> e ilegal: după un parametru cu implicit nu mai poate urma unul fără. Atenție și la <b>ambiguități</b> la apel — mecanismul e comod, dar poate ascunde bug-uri greu de prins.`},

  {t:"h", html:`Funcții cu același nume (function overloading)`},
  {t:"p", html:`Putem avea mai multe funcții cu <b>același nume</b> dar cu <b>semnături diferite</b> (listă de parametri diferită). Compilatorul alege varianta potrivită după <b>tipurile argumentelor de la apel</b> — decizie luată integral la compilare. E prima formă de <b>polimorfism</b> din C++.`},
  {t:"cmp",
    left:{title:`În C: nume diferite`, html:`<pre class="code cpp" style="margin:0">int   add_int(int x, int y);
float add_float(float x, float y);
t_Complex add_complex(t_Complex, t_Complex);</pre><p style="margin-top:8px">Programatorul ține minte câte un nume pentru fiecare tip.</p>`},
    right:{title:`În C++: un singur nume`, html:`<pre class="code cpp" style="margin:0">int   add(int x, int y);
float add(float x, float y);
t_Complex add(t_Complex, t_Complex);</pre><p style="margin-top:8px">Același nume, comportament diferit după tipuri.</p>`}},
  {t:"note", kind:"info", html:`Tipul returnat <b>nu</b> face parte din semnătură: nu poți distinge două funcții doar prin tipul întors. Doar lista de parametri contează.`},

  {t:"h", html:`Tipul de date referință (<code>&amp;</code>)`},
  {t:"p", html:`O <b>referință</b> este un <b>alias</b> (un al doilea nume) pentru o variabilă care <b>există deja</b>. Reprezintă <b>aceeași zonă de memorie</b> ca variabila originală — <b>nu se alocă memorie suplimentară</b>. Se declară mereu către ceva deja alocat și se inițializează la declarare.`},
  {t:"code", cod:`int x = 5;
int& y = x;       // y este un alt nume pentru x
y++;              // modifică x prin alias
// acum x == 6

const int a = 10;
const int& b = a; // referință constantă: b++ ar fi eroare de compilare`},
  {t:"h4", html:`Transmiterea prin referință`},
  {t:"p", html:`Cea mai folosită utilizare: o funcție modifică direct argumentele apelantului, fără pointeri și fără copii.`},
  {t:"code", cod:`void schimba(int &x, int &y) {
    int z = x;
    x = y;
    y = z;
}

int a = 10, b = 20;
schimba(a, b);    // acum a == 20, b == 10`},
  {t:"note", kind:"nuanta", html:`Pentru obiecte mari, transmite prin <code>const&amp;</code>: eviți copierea (se trece doar adresa, ca la pointer) dar păstrezi protecția la modificare și lizibilitatea — <b>optimizare + protecție + lizibilitate</b>. Capcană clasică: nu întoarce o referință către o variabilă <b>locală</b> a funcției (dispare la return).`},

  {t:"joc", ref:"ref-valoare"},
  {t:"h", html:`Alocatorul <code>new</code> / <code>delete</code>`},
  {t:"p", html:`Echivalentul C++ pentru <code>malloc</code>/<code>free</code>. Spre deosebire de ele, <code>new</code>/<code>delete</code> sunt integrate cu restul limbajului: <b>apelează automat constructorii și destructorii</b> obiectelor și nu cer cast.`},
  {t:"cmp",
    left:{title:`C — malloc / free`, html:`<pre class="code cpp" style="margin:0">int *p1 = (int*) malloc(sizeof(int));
int *p2 = (int*) malloc(n * sizeof(int));
free(p1);
free(p2);</pre>`},
    right:{title:`C++ — new / delete`, html:`<pre class="code cpp" style="margin:0">int *p1 = new int;        // 1 întreg
int *p2 = new int[n];     // n întregi
delete   p1;
delete[] p2;              // [] pentru array</pre>`}},
  {t:"note", kind:"capcana", html:`Nu amesteca alocatoarele: <code>new</code> cu <code>free</code>, sau <code>malloc</code> cu <code>delete</code> = <b>crash</b>. Și nu uita <code>delete[]</code> (cu paranteze) pentru ce ai alocat cu <code>new[]</code>.`},

  {t:"h", html:`Stream-urile standard <code>cin</code> / <code>cout</code>`},
  {t:"p", html:`Intrare/ieșire în stil C++, din <code>&lt;iostream&gt;</code> (namespace <code>std</code>). Se folosesc operatorii de redirectare <code>&lt;&lt;</code> (ieșire) și <code>&gt;&gt;</code> (intrare); stream-urile se „adaptează" automat la tipul datelor.`},
  {t:"code", cod:`#include <iostream>
using namespace std;

int main() {
    int i;
    cout << "Introdu un întreg: ";
    cin >> i;
    cout << "Dublul lui este " << i * 2 << endl;
    return 0;
}`},
  {t:"note", kind:"info", html:`<code>cout</code> = ieșire standard, <code>cin</code> = intrare standard; mai există <code>cerr</code> (erori) și <code>clog</code> (jurnalizare). <code>endl</code> trece la linie nouă și golește bufferul.`},

  {t:"h", html:`Cele trei concepte OOP`},
  {t:"p", html:`Ideea centrală a OOP este <b>abstractizarea în scop de generalizare</b>: modelăm o entitate generală (ex. un „obiect de scris") din care particularizăm cazuri concrete (pix, stilou, pen electronic). Pe această idee stau trei concepte:`},
  {t:"ul", items:[
    `<b>Încapsulare</b> — grupăm <i>structura de date</i> și <i>comportamentul</i> într-un container (clasa) și ascundem detaliile interne; expunem doar o interfață publică.`,
    `<b>Moștenire</b> — <i>reutilizarea codului</i>: pe baza unor clase existente derivăm altele care păstrează structura și comportamentul inițial, la care adaugă sau modifică.`,
    `<b>Polimorfism</b> — comportament „diferit" în situații diferite. În C++ se obține prin: supraîncărcarea funcțiilor, moștenire + metode virtuale, și funcții/clase template.`
  ]},
  {t:"note", kind:"info", html:`Aceste trei concepte sunt firul roșu al întregului curs: încapsularea la cap. 2–4, moștenirea la 5–6, polimorfismul (virtual) la 7, iar template-urile la 9.`}
]},
{ id:"clase-obiecte", nume:"2 · Clase și obiecte", blocks:[
  {t:"p", html:`O <b>clasă</b> este un tip nou de date definit de utilizator (<i>user-defined datatype</i>), care grupează la un loc <b>structura de date</b> (câmpurile) și <b>comportamentul</b> (metodele) unei entități. Este pasul firesc după <code>struct</code>: în C aveam datele separate de funcțiile care le prelucrează „de la distanță"; în C++ le punem împreună într-un singur container. Firul roșu al capitolului este modelarea unui <b>vector geometric</b> (format din două puncte) și gestiunea unui <b>Student</b> în aplicația ATM.`},
  {t:"p", html:`Cursul construiește soluția progresiv, în 5 variante: de la patru variabile <code>int</code> separate &rarr; funcții care primesc cele patru valori &rarr; un <code>struct Vector</code> &rarr; abstractizare (<code>Vector</code> = 2 × <code>Point</code>) &rarr; în final <b>clasa</b>, care leagă datele de comportament.`},

  {t:"h", html:`De la struct la clasă`},
  {t:"p", html:`Pornim de la structuri și funcții libere care lucrează „de la distanță" cu datele. Problema rămasă: <b>datele sunt separate de comportament</b>; fiecare funcție de lucru cu entitatea nu îi aparține entității respective.`},
  {t:"code", cod:`struct Point {
      int x;
      int y;
};

struct Vector {
      Point Start;
      Point End;
};

void print_Vector (const Vector &V)   // const & = optimizare + protectie + lizibilitate
{
      cout << "\\nVector: ";
      cout << "(" << V.Start.x << ", " << V.Start.y << ")";
      cout << "  -->  ";
      cout << "(" << V.End.x << ", " << V.End.y << ")";
}`},
  {t:"note", kind:"info", html:`Transmiterea prin <b>referință constantă</b> (<code>const Vector &amp;V</code>) aduce simultan trei avantaje pe care cursul le subliniază: <b>optimizare</b> (nu se copiază structura), <b>protecție</b> (funcția nu poate modifica argumentul) și <b>lizibilitate</b>.`},
  {t:"ul", items:[
    `O entitate are mereu <b>două componente: structură (date) + comportament (funcționalitate)</b>.`,
    `Problema variantelor cu <code>struct</code>: datele sunt separate de comportament, iar funcțiile nu „aparțin" entității.`,
    `<b>Soluția C++ (OOP): folosirea claselor!</b>`,
  ]},

  {t:"h", html:`Declararea vs. implementarea clasei (operatorul ::)`},
  {t:"p", html:`Clasa <code>Point</code> poate fi scrisă <b>inline</b> (metodele definite direct în corpul clasei). Observă: în lipsa unui specificator, membrii sunt <b>privați</b> implicit — de aceea <code>x</code> și <code>y</code> nu sunt accesibili din afară, ci doar prin metodele <b>publice</b>.`},
  {t:"code", cod:`class Point {
      int x;            // implicit PRIVATE
      int y;

  public:
      void set_Point (int a, int b) {
        cout << "\\nInitializare punct cu coordonate noi: " << a << ", " << b << "...";
        x = a;
        y = b;
      }
      void print_Point () {
        cout << "(" << x << ", " << y << ")";
      }

      int get_x() const {return x;}
      int get_y() const {return y;}
};

void main ()
{
      Point P1, P2;            // declaram 2 Puncte
      P1.set_Point (1, 2);     // init P1
      P2.set_Point (-1, 18);   // init P2

      cout << "\\n";
      P1.print_Point();
      P2.print_Point();
}`},
  {t:"p", html:`Pentru clasa <code>Vector</code>, cursul separă <b>declarația</b> (ce metode există) de <b>implementare</b> (cum sunt scrise). La implementarea în afara clasei folosim <b>operatorul de scop</b> <code>::</code> (<i>scope access operator</i>), care spune cărei clase aparține metoda: <code>void Vector::print_Vector()</code>.`},
  {t:"code", cod:`/* Declaratia clasei */
class Vector {
      Point Start;
      Point End;

public:
      void set_Vector (int xStart, int yStart,  int xEnd, int yEnd);
      void set_Vector (const Point &pStart, const Point &pEnd);
      void print_Vector ();
};

/* Implementarea (definitia) clasei => este SEPARATA de declaratia clasei */
void Vector::set_Vector (int xStart, int yStart,  int xEnd, int yEnd)
{
      cout << "\\nInitializam vector...";
      Start.set_Point (xStart, yStart);
      End.set_Point (xEnd, yEnd);
}

void Vector::set_Vector (const Point &pStart, const Point &pEnd)
{
      cout << "\\nInitializam vector...";
      Start.set_Point ( pStart.get_x(), pStart.get_y() );
      End.set_Point ( pEnd.get_x(), pEnd.get_y() );
}

void Vector::print_Vector ()
{
      cout << "\\nVector: ";
      Start.print_Point ();
      cout << "  -->  ";
      End.print_Point ();
}`},
  {t:"cmp",
    left:{title:`Declarația`, html:`Stă în corpul clasei, între acolade. Spune <b>ce</b> metode și ce câmpuri are clasa (interfața). Doar semnături: <code>void print_Vector();</code>`},
    right:{title:`Implementarea (::)`, html:`Stă în afara clasei. Spune <b>cum</b> funcționează metoda. Numele e calificat cu clasa prin <code>::</code>: <code>void Vector::print_Vector() { ... }</code>`}
  },
  {t:"note", kind:"nuanta", html:`<b>Definiții-cheie (curs):</b> <i>Clasa</i> = tip nou definit în program care grupează mai multe informații (similar structurilor). <i>Numele clasei</i> = numele noului tip. <i>Membrii clasei</i> = datele (câmpurile) + funcțiile (comportamentul). O clasă modelează în general o singură entitate.`},

  {t:"h", html:`Instanțiere și obiecte`},
  {t:"p", html:`Variabilele de tip clasă se numesc <b>obiecte</b> (instanțe ale clasei). Putem avea 0, 1 sau mai multe instanțe (locale, globale, parametri). <b>Fiecare instanță are propriul spațiu de memorie și setul ei propriu de date.</b> Folosim clasa <code>Student</code> pentru a vedea cele cinci moduri de a obține (sau a rata) o instanță.`},
  {t:"code", cod:`class Student {
public:
      int      id;
      char     nume[256];
      float    medie;
      //...
};

void main ()
{
   Student S1;                 // S1: instanta pe STIVA (valoare)
   Student *S2 = new Student;  // S2: pointer la o instanta din HEAP (new)

   Student &S3 = S1;           // S3: REFERINTA (alias) la studentul S1
   Student &S4 = *S2;          // S4: referinta la obiectul adresat de S2

   Student *S5;                // S5: pointer NEINITIALIZAT - obiectul NU exista inca

   S1.id = 100;  S1.medie = 9.14;  strcpy (S1.nume, "Popescu Ionel");
   S2->id = 102; strcpy (S2->nume, "Vasile Mihai"); S2->medie = 8.21;
   S3.medie = 9.52;   // modifica de fapt S1 (alias)
   S4.medie = 9.01;   // modifica obiectul din heap

   S5->id = 103;                          // crash !!!
   S5->medie = 5.25;                      // crash !!!
   strcpy (S5->nume, "Ionescu Marian");   // crash !!!
}`},
  {t:"table", head:[`Sintaxă`,`Ce este`,`Unde stă obiectul`,`Acces`], rows:[
    [`Student S1;`,`Instanță prin valoare`,`Stivă (stack)`,`<code>S1.id</code>`],
    [`Student *S2 = new Student;`,`Pointer + obiect alocat`,`Heap`,`<code>S2-&gt;id</code>`],
    [`Student &amp;S3 = S1;`,`Referință (alias) la S1`,`Aceeași zonă ca S1`,`<code>S3.id</code>`],
    [`Student &amp;S4 = *S2;`,`Referință la obiectul lui S2`,`Aceeași zonă ca *S2`,`<code>S4.id</code>`],
    [`Student *S5;`,`Pointer neinițializat`,`Nicăieri (nealocat)`,`<code>S5-&gt;id</code> &rarr; crash`],
  ]},
  {t:"note", kind:"capcana", html:`<b>S5 = crash.</b> <code>Student *S5;</code> declară doar un pointer — <b>nu alocă încă niciun obiect</b>. Dereferențierea lui (<code>S5-&gt;id = 103;</code>) scrie la o adresă-gunoi &rarr; crash. Corect: întâi <code>S5 = new Student;</code>, apoi <code>S5-&gt;setId(103);</code>.`},
  {t:"note", kind:"nuanta", html:`O <b>referință</b> (S3, S4) <b>nu</b> creează un obiect nou și nu alocă memorie suplimentară: e un <i>alias</i> pentru un obiect existent. A modifica <code>S3</code> înseamnă a modifica <code>S1</code>.`},


  {t:"joc", ref:"instantiere"},
  {t:"h", html:`Membrii clasei: date + metode`},
  {t:"p", html:`<b>Membrii</b> unei clase = <b>datele membre</b> (câmpurile, structura) + <b>metodele</b> (funcțiile membre, comportamentul). Adăugăm la <code>Student</code> metode care lucrează cu datele, în loc să le atingem direct din exterior.`},
  {t:"code", cod:`class Student {
private:
      int    id;
      char   nume[256];
      float  medie;
public:
      void print ();
      void setId (int i);
      void setNume (char *n);
      void setMedie (float m);
      void update (int i, char *n, float m);
};

void Student::setId (int i)      { id = i; }
void Student::setNume (char *n)  { strcpy (nume, n); }
void Student::setMedie (float m) { medie = m; }

void Student::update (int i, char *n, float m) {
      setId (i);
      setNume (n);
      setMedie (m);
}

void Student::print () {
      cout << "\\nStudent: " << id << " " << nume << " " << medie;
}`},
  {t:"note", kind:"info", html:`<b>Metodele = niște „butoane" ale clasei.</b> Cursul folosește analogia: fiecare obiect (vec1, vec2) e o cutie cu butoane (<code>print</code>, <code>offset</code>). Când scrii <code>vec1.print()</code>, două întrebări primesc răspuns: <i>„Care cutie a fost apăsată?"</i> (obiectul <code>vec1</code>) și <i>„Care buton a fost apăsat?"</i> (metoda <code>print</code>).`},

  {t:"h", html:`Pointerul this`},
  {t:"p", html:`Fiecare metodă primește în mod <b>automat, implicit și transparent</b> un parametru ascuns: <b>adresa obiectului care a apelat-o</b>. Acest parametru este pointerul <code>this</code>. Așa „știe" <code>vec1.print()</code> că lucrează cu <code>vec1</code>, nu cu <code>vec2</code>. Putem folosi <code>this-&gt;</code> explicit, mai ales pentru a dezambigua un câmp de un parametru cu același nume.`},
  {t:"code", cod:`void Point::move (int off_x, int off_y) {
      this->x = this->x + off_x;
      this->y = this->y + off_y;
}

void Vector::set (const char *nume, int xs, int ys,  int xe, int ye) {
      cout << "\\nInitializam vectorul '" << nume << "'...";
      strncpy (this->nume, nume, sizeof(this->nume));  // this->nume = camp; nume = parametru
      start.set (xs, ys);
      end.set (xe, ye);
}`},
  {t:"note", kind:"nuanta", html:`La apelul <code>obj.metoda(args)</code>, compilatorul transmite <i>transparent</i> adresa lui <code>obj</code> ca <code>this</code>. Practic, <code>this</code> este motivul pentru care aceeași metodă, scrisă o singură dată, lucrează corect pe oricâte obiecte diferite.`},

  {t:"h", html:`Încapsulare: private / public și metode de acces`},
  {t:"p", html:`<b>Încapsularea înseamnă în principal ascunderea datelor în cadrul clasei.</b> Datele membre stau în zona <b>privată</b>; accesul din exterior se face <b>doar prin metode publice</b> (metode de acces). Astfel, orice modificare „din burta clasei" rămâne ascunsă pentru codul din afară.`},
  {t:"ul", items:[
    `<b>Partea privată</b> (<code>private:</code>): componente de uz strict intern; nu interacționează direct cu alte entități.`,
    `<b>Partea publică</b> (<code>public:</code>): interfața clasei, prin care alte entități interacționează cu ea.`,
    `Accesul la datele clasei se face <b>doar</b> prin metodele clasei (metode de acces get/set).`,
    `Recomandarea OOP: păstrează structura cât mai ascunsă; expune în exterior doar funcționalitățile, prin metode publice.`,
  ]},
  {t:"cmp",
    left:{title:`get (citire)`, html:`Întoarce valoarea unui câmp, de regulă marcat <code>const</code> (nu modifică obiectul):<br><code>int get_x() const { return x; }</code>`},
    right:{title:`set (scriere)`, html:`Validează și atribuie o valoare câmpului:<br><code>void set_Point(int a, int b) { x=a; y=b; }</code>`}
  },

  {t:"h", html:`Firul roșu Point / Vector (cu this și ::)`},
  {t:"p", html:`Punem totul la un loc: <code>Vector</code> folosește membri de tip <code>Point</code>, accesează membrii lor non-public doar prin metodele de acces <code>getx()</code>/<code>gety()</code>, iar metoda <code>add</code> întoarce o referință către un obiect alocat dinamic în heap.`},
  {t:"code", cod:`class Point {
      int x;
      int y;
public:
      void set(int a, int b) {            // metoda inline
        cout << "\\nInitializare punct cu coordonate noi: " << a << ", " << b << "...";
        x = a;  y = b;
      }
      void  print();
      void  move (int off_x, int off_y);
      int   getx() const {return x;}      // metoda de acces (get)
      int   gety() const {return y;}
};

void Point::move (int off_x, int off_y) {
      this->x = this->x + off_x;
      this->y = this->y + off_y;
}
void Point::print() {
      cout << "(" << x << ", " << y << ")";
}

class Vector {
      char  nume[32];   // numele vectorului
      Point start;      // originea
      Point end;        // destinatia

      void      align_to (Vector &V);     // metoda PRIVATA (uz intern)

public:
      void      set (const char *nume, int xs, int ys,  int xe, int ye);
      void      print ();
      void      move (int off_xs, int off_ys, int off_xe, int off_ye);
      Vector&   add (Vector &V);
};

void Vector::set(const char *nume, int xs, int ys,  int xe, int ye) {
      cout << "\\nInitializam vectorul '" << nume << "'...";
      strncpy (this->nume, nume, sizeof(this->nume));
      start.set (xs, ys);
      end.set (xe, ye);
}

void Vector::print() {
      cout << "\\nDesenam vectorul '" << nume << "': ";
      start.print ();
      cout << "  -->  ";
      end.print ();
}

Vector& Vector::add (Vector &V)
{
      Vector V1  = *this;
      Vector V2  = V;
      Vector *V3 = new Vector;   // rezultatul, alocat in heap

      char nume[32];
      sprintf (nume, "%s+%s", V1.nume, V2.nume);

      V2.align_to (V1);
      V3->set (nume, V1.start.getx(), V1.start.gety(),
               V1.end.getx() + V2.end.getx() - V2.start.getx(),
               V1.end.gety() + V2.end.gety() - V2.start.gety());

      return (*V3);
}`},
  {t:"note", kind:"capcana", html:`<code>Vector::add</code> întoarce o referință către un <code>Vector</code> <b>alocat cu <code>new</code> în heap</b>. Întrebarea cursului: <i>„cum facem <code>delete</code>?"</i> — cine și când eliberează acel obiect? Dacă nimeni nu apelează <code>delete</code>, apare un <b>memory leak</b>.`},
  {t:"ul", items:[
    `Folosirea pointerului <b>this</b>.`,
    `Folosirea operatorului de scop <b>::</b> (scope access operator).`,
    `Clasa <code>Vector</code> folosește membrii clasei <code>Point</code>.`,
    `Accesul la membrii non-public se face <b>numai</b> prin metode de acces publice (<code>getx()</code>, <code>gety()</code>).`,
    `Folosirea principiului de <b>încapsulare</b>.`,
  ]},
]},

{ id:"constructori-destructori", nume:"3 · Constructori și destructori", blocks:[
  {t:"p", html:`Un obiect trebuie să fie <b>valid din chiar momentul creării sale</b>. Pentru asta C++ oferă <b>constructori</b> (inițializare automată la naștere) și <b>destructori</b> (clean-up automat la dispariție). Continuăm cu firul roșu <code>Point</code>/<code>Vector</code> și urmărim atent ce se întâmplă cu memoria din heap.`},

  {t:"h", html:`Problema inițializării`},
  {t:"p", html:`Vrem ca structura de date a obiectului să fie inițializată <b>încă de la creare</b>, fără să mai chemăm manual un <code>set(...)</code>. Soluția: o metodă specială care rulează automat la instanțiere.`},
  {t:"code", cod:`class Vector {
      char  nume[32];
      Point start;
      Point end;
public:
      Vector ()                 // constructor: ruleaza automat la creare
      {
          strcpy (nume, "vector");
          start.set (0, 0);
          end.set (0, 0);
      }
      void  set (const char *nume, int xs, int ys,  int xe, int ye);
      void  print ();
};

void main ()
{
      Vector  V1;        // constructorul ruleaza aici, automat
      V1.print ();       // Vector: (0, 0)  -->  (0, 0)
}`},

  {t:"h", html:`Definiție și reguli ale constructorului`},
  {t:"ul", items:[
    `Sunt metode speciale, responsabile cu <b>inițializarea</b> obiectelor, apelate <b>automat (transparent)</b> de compilator la instanțiere.`,
    `Rulează <b>imediat după alocarea memoriei</b> necesare datelor obiectului.`,
    `Au în mod <b>obligatoriu același nume ca și clasa</b>: <code>Nume_Clasa(&lt;lista de parametri&gt;)</code>.`,
    `Pot avea parametri (nu este obligatoriu).`,
    `<b>Nu returnează absolut nimic — nici măcar <code>void</code></b>.`,
    `Pot exista <b>mai mulți</b> constructori într-o clasă; diferă prin lista de parametri.`,
    `La construcția unui obiect se execută <b>un singur</b> constructor, ales de compilator la <b>build time</b>, după contextul declarației.`,
  ]},
  {t:"note", kind:"capcana", html:`Constructorul <b>nu are tip de retur</b>. <code>void Point()</code> sau <code>int Point()</code> <b>nu</b> sunt constructori — sunt metode obișnuite. Numele trebuie să fie <b>exact</b> numele clasei, fără <code>void</code>/<code>int</code>/etc. în față.`},

  {t:"h", html:`Constructor implicit vs. constructor cu parametri`},
  {t:"p", html:`Constructorul <b>implicit (default)</b> nu are parametri; cel <b>explicit</b> are parametri. Pot co-exista; compilatorul alege la build-time în funcție de cum declari obiectul.`},
  {t:"code", cod:`class Vector {
      char  nume[32];
      Point start;
      Point end;
public:
      Vector ();                                                  // implicit
      Vector (const char *nume, int xs, int ys, int xe, int ye);  // explicit
      void  set (const char *nume, int xs, int ys, int xe, int ye);
      void  print ();
};

Vector::Vector ()                       // ales pentru:  Vector V1;
{
      cout << "\\nConstructor fara parametrii (implicit)";
      strcpy (nume, "V");
      start.set (0, 0);
      end.set (0, 0);
}

Vector::Vector (const char *nume, int xs, int ys, int xe, int ye)  // ales pentru: Vector V2("V2",1,2,2,4);
{
      cout << "\\nConstructor cu parametrii (explicit)";
      strncpy (this->nume, nume, sizeof(this->nume));
      start.set (xs, ys);
      end.set (xe, ye);
}

void main ()
{
      Vector  V1;                  // -> constructorul fara parametrii
      Vector  V2("V2",1,2,2,4);    // -> constructorul cu parametrii
}`},
  {t:"cmp",
    left:{title:`Constructor implicit (default)`, html:`Fără parametri: <code>Vector();</code>. Ales pentru declarații de forma <code>Vector V1;</code>.`},
    right:{title:`Constructor explicit`, html:`Cu parametri: <code>Vector(const char*, int, int, int, int);</code>. Ales pentru <code>Vector V2("V2",1,2,2,4);</code>.`}
  },

  {t:"h", html:`Problema constructorului implicit lipsă (garbage -858993460)`},
  {t:"p", html:`Adăugăm un constructor care primește două <code>Point</code>. Dar <code>Point</code> nu are niciun constructor scris explicit — deci câmpurile lui <code>P1</code>, <code>P2</code> nu sunt inițializate cu nimic util.`},
  {t:"code", cod:`Vector::Vector (const char *nume, const Point& start, const Point& end)
{
    cout << "\\nConstructor cu parametrii (explicit)";
    set (nume, start.getx(), start.gety(), end.getx(), end.gety());
}

void main ()
{
    Point P1, P2;              // Point nu are constructor care sa initializeze
    Vector V1 ("V1", P1, P2);  // -> primeste coordonate GUNOI
    V1.print ();
}`},
  {t:"note", kind:"capcana", html:`Output-ul afișează <code>-858993460</code> pentru fiecare coordonată. Această valoare este <code>0xCCCCCCCC</code> — tiparul cu care MSVC, în modul <b>Debug</b>, umple memoria <b>neinițializată</b>. E semnătura clasică „am uitat să inițializez". Cauza: <code>Point</code> are doar constructorul implicit generat de compilator, care <b>nu execută nimic</b> (<code>Point() { }</code>).`},
  {t:"p", html:`Soluția: scriem explicit un constructor în <code>Point</code> care inițializează câmpurile.`},
  {t:"code", cod:`class Point {
      int x;
      int y;
public:
      Point () {
            x = 0; y = 0;     // acum P1, P2 pornesc de la (0, 0)
      }
      //...
};`},
  {t:"note", kind:"nuanta", html:`<b>Regula constructorului default generat:</b> dacă <b>nu</b> scrii niciun constructor, compilatorul îți dă unul default (gol) la build-time. Dar dacă scrii <b>cel puțin unul</b> (implicit sau explicit), compilatorul <b>nu mai generează</b> constructorul default gol. Consecință: dacă declari doar <code>Point(int,int)</code>, atunci <code>Point P;</code> dă eroare de compilare (<code>C2512: no appropriate default constructor available</code>) — nu se mai pot crea obiecte fără valori inițiale.`},

  {t:"h", html:`Lista de inițializare și ordinea de apel`},
  {t:"p", html:`Pentru clasele <b>încuibărite (agregate)</b> — un <code>Vector</code> conține două <code>Point</code> — putem apela <b>explicit</b> constructorii membrilor prin <b>lista de inițializare</b> (sintaxa <code>: membru(val), ...</code> înainte de acolada constructorului).`},
  {t:"code", cod:`Point::Point ()           { cout << "\\nconstructor implicit in clasa Point "; x = 0; y = 0; }
Point::Point (int a, int b) { cout << "\\nconstructor explicit in clasa Point "; x = a; y = b; }

// Apel EXPLICIT al constructorilor claselor incuibarite, prin lista de initializare:
Vector::Vector (const char *nume, int xs, int ys, int xe, int ye)
                       : start (xs, ys), end (xe, ye)
{
      cout << "\\nConstructor cu parametrii (explicit) in clasa Vector";
      strncpy (this->nume, nume, sizeof(this->nume));
      // start.set(xs, ys);  // nu mai e necesar: se face prin constructorul lui Point
      // end.set(xe, ye);
}`},
  {t:"note", kind:"nuanta", html:`<b>Ordinea de apel (construcție):</b> mai întâi se construiesc <b>obiectele încuibărite</b> (<code>start</code>, apoi <code>end</code>), prin constructorii lor specifici; <b>în final</b> rulează corpul constructorului obiectului „mare" (<code>Vector</code>). Pe scurt: construcția pleacă <b>din interior spre exterior</b>.`},
  {t:"note", kind:"capcana", html:`Dacă o clasă încuibărită <b>nu are constructor implicit</b> (ai scris doar <code>Point(int,int)</code>), atunci <b>trebuie</b> să apelezi explicit constructorul cu parametri din lista de inițializare a clasei mari: <code>Vector::Vector() : start(0,0), end(0,0) { ... }</code>. Altfel apare aceeași eroare <code>C2512</code> la compilarea constructorului lui <code>Vector</code>.`},

  {t:"joc", ref:"ctor-membri-corp"},
  {t:"h", html:`Constructorul de copiere (shallow / bitwise copy)`},
  {t:"p", html:`Schimbăm <code>nume</code> din <code>char[32]</code> în <code>char *nume</code> (alocat dinamic). Acum apare o problemă subtilă la <b>clonarea</b> unui obiect: <code>Vector V2 = V1;</code>.`},
  {t:"code", cod:`class Vector {
      char  *nume;     // ACUM e pointer -> trebuie alocat
      Point start;
      Point end;
};

Vector::Vector (const char *nume, int xs, int ys, int xe, int ye)
                                  : start (xs, ys), end (xe, ye)
{
      this->nume = new char [strlen (nume) + 1];
      strcpy (this->nume, nume);
}

void main ()
{
      Vector V1 ("V1", 1, 2, 3, 4);
      Vector V2 = V1;   // clonare: in lipsa unui copy ctor explicit -> BITWISE COPY
      V2.print();
}`},
  {t:"note", kind:"capcana", html:`<b>Bitwise copy (shallow copy).</b> Constructorul de copiere <b>implicit (default)</b> copiază obiectul <b>bit-cu-bit</b>. Pentru <code>V2 = V1</code> asta înseamnă că se copiază și valoarea pointerului <code>nume</code> — deci <b>V1 și V2 împart aceeași zonă de memorie din heap</b>. Dacă unul o eliberează, celălalt rămâne cu un pointer invalid (și la destructor &rarr; dublă eliberare / crash).`},


  {t:"p", html:`Soluția: scriem un <b>constructor de copiere explicit</b> care face <b>deep copy</b> (alocă heap nou pentru <code>nume</code>). El îl anulează pe cel default și rulează la fiecare clonare.`},
  {t:"code", cod:`Vector (const Vector &V);     // declaratia constructorului de copiere

Vector::Vector (const Vector &V)
{
  cout << "\\nConstructor de copiere in clasa Vector";
  this->nume = new char [strlen (V.nume) + 1];   // heap NOU, separat
  strcpy (this->nume, V.nume);

  this->start.set (V.start.getx(), V.start.gety() );
  this->end.set (V.end.getx(), V.end.gety() );
}`},
  {t:"h4", html:`Când se apelează constructorul de copiere`},
  {t:"code", cod:`Vector V2 (V1);   // CLONARE -> copy ctor
Vector V3 = V1;   // CLONARE -> copy ctor (NU operatorul =)

// --- Cazuri care NU sunt copy ctor: ---
Vector V4;        // constructor implicit (NU copy ctor)
V4 = V1;          // bitwise-copy ASSIGN operator (NU copy ctor)

Vector &V5 = V1;  // doar o REFERINTA -> nu se creeaza obiect, niciun constructor`},
  {t:"table", head:[`Construcție`,`Ce se apelează`], rows:[
    [`Vector V2(V1);`,`Constructor de copiere`],
    [`Vector V3 = V1;`,`Constructor de copiere (la <b>declarare</b>)`],
    [`Vector V4; V4 = V1;`,`Constructor implicit, apoi <b>operator =</b> (assign), NU copy ctor`],
    [`Vector &amp;V5 = V1;`,`Niciun constructor (doar referință/alias)`],
    [`Obiect transmis prin <b>valoare</b>`,`Constructor de copiere (clonă pe stivă)`],
    [`Obiect returnat prin <b>valoare</b>`,`Constructor de copiere (clonă în frame-ul apelantului)`],
  ]},
  {t:"note", kind:"capcana", html:`Distincție de examen: <code>Vector V3 = V1;</code> (la <b>declarare</b>) apelează <b>constructorul de copiere</b>. În schimb <code>V4 = V1;</code> pe un obiect <b>deja existent</b> apelează <b>operatorul de atribuire</b> (bitwise-copy assign), <b>nu</b> constructorul de copiere.`},
  {t:"note", kind:"info", html:`<b>Transmitere/return prin valoare.</b> <code>bool compareVector(Vector V)</code> creează o clonă a argumentului pe stivă (copy ctor). <code>Vector makeCopy()</code> creează o clonă la return. Dacă schimbi semnătura în <code>Vector&amp; compareVector(Vector&amp; V)</code> sau întorci <code>Vector*</code>, <b>nu</b> se mai face copiere — se transmite referință/pointer.`},
  {t:"note", kind:"nuanta", html:`<b>Tipurile simple sunt și ele „clase".</b> În C++, <code>int x = 1;</code> sau <code>int x(2);</code>, <code>double y(2.5);</code> — toate apelează „constructorul de copiere (implicit) al clasei int / double". Tipurile de bază sunt tratate de compilator ca niște clase.`},

  {t:"joc", ref:"copy-shallow"},
  {t:"h", html:`Destructori (ordine inversă, LIFO)`},
  {t:"ul", items:[
    `Metodă specială apelată <b>automat la distrugerea</b> obiectului, chiar înainte ca el să dispară din memorie.`,
    `Numele: <code>~Nume_Clasa()</code>.`,
    `<b>Nu returnează nimic și nu primește parametri.</b>`,
    `Poate exista <b>un singur</b> destructor pe clasă.`,
    `De regulă se ocupă de <b>clean-up</b> (eliberează memoria alocată dinamic).`,
    `Există și un destructor implicit (gol) — nu e obligatoriu să-l scrii.`,
  ]},
  {t:"code", cod:`Vector::~Vector ()
{
  cout << "\\nDestructor in clasa Vector";
  if (nume != NULL)
     delete[] nume;          // elibereaza heap-ul alocat pentru nume
}`},
  {t:"note", kind:"capcana", html:`Prezența unui destructor care face <code>delete[] nume</code> face <b>absolut necesar</b> constructorul de copiere explicit (deep copy). Altfel, cu bitwise copy, V1 și V2 ar partaja același <code>nume</code>, iar cei doi destructori ar face <code>delete[]</code> pe <b>aceeași</b> zonă &rarr; dublă eliberare &rarr; <b>crash</b>.`},
  {t:"p", html:`Cursul afișează adresa <code>this</code> la construcție și la cleanup. Se vede clar <b>ordinea inversă (LIFO)</b>: ce se construiește ultimul, se distruge primul.`},
  {t:"code", cod:`// Constructie (ordinea declararii):
//   Constructor ... Vector (obiectul initializat: 0012FF14)   <- V1
//   Constructor de copiere ... Vector (obiectul initializat: 0012FEF8)  <- V2
//
// Distrugere (ordine INVERSA, LIFO):
//   Facem cleanup obiectului 0012FEF8   <- V2 distrus PRIMUL
//   Facem cleanup obiectului 0012FF14   <- V1 distrus AL DOILEA`},

  {t:"joc", ref:"dtor-lifo"},
  {t:"h", html:`new / delete vs. malloc / free`},
  {t:"p", html:`<b>new</b> alocă memorie în heap <b>și</b> apelează constructorul (obiectul se construiește corect). <b>delete</b> apelează destructorul (clean-up) <b>și apoi</b> eliberează memoria. <code>malloc</code>/<code>free</code> doar mută octeți — nu apelează constructori/destructori.`},
  {t:"code", cod:`Vector *pV1 = new Vector;                    // aloca + apel constructor implicit
Vector *pV2 = new Vector ("vec", 1, 2, 3, 4); // aloca + apel constructor explicit
Vector *pV3 = (Vector *) malloc (sizeof (Vector)); // doar memorie, FARA constructor

delete  pV1;     // apel destructor, apoi elibereaza memoria
free (pV3);      // doar elibereaza memoria, FARA destructor

Vector *pMulti = new Vector [10];   // apel constructor pentru FIECARE element

delete[] pMulti;   // apel destructor pentru FIECARE element
delete   pMulti;   // GRESIT: apeleaza destructorul doar pentru PRIMUL`},
  {t:"table", head:[`Operație`,`Memorie`,`Constructor / Destructor`], rows:[
    [`new T`,`alocă în heap`,`apelează <b>constructorul</b>`],
    [`delete p`,`eliberează`,`apelează <b>destructorul</b>`],
    [`new T[n]`,`alocă array`,`constructor pentru <b>fiecare</b> element`],
    [`delete[] p`,`eliberează array`,`destructor pentru <b>fiecare</b> element`],
    [`malloc / free`,`doar octeți`,`<b>nu</b> apelează nimic`],
  ]},
  {t:"note", kind:"capcana", html:`Pentru un array alocat cu <code>new T[n]</code> <b>trebuie</b> folosit <code>delete[] p</code>. Dacă scrii <code>delete p</code> (fără paranteze), destructorul rulează <b>doar pentru primul</b> element &rarr; pentru restul nu se face clean-up (leak / comportament nedefinit). Și nu amesteca alocatoarele: <code>new</code> cu <code>delete</code>, <code>malloc</code> cu <code>free</code> — apelurile încrucișate dau crash.`},

  {t:"h", html:`Sumar`},
  {t:"ul", items:[
    `Orice clasă are implicit un <b>constructor</b> (gol) și un <b>constructor de copiere</b> (bitwise-copy); are și un <b>destructor</b> (gol).`,
    `Tipurile de bază (<code>int</code>, <code>float</code>, <code>double</code>, <code>char</code>, ...) sunt considerate de compilator <b>clase</b>.`,
    `Constructorii pot avea parametri și <b>nu returnează nimic</b>; pot fi <b>mai mulți</b> pe clasă.`,
    `Destructorii nu au parametri, nu returnează nimic; există <b>un singur</b> destructor pe clasă.`,
    `Constructorul de copiere e necesar când copierea bitwise nu e suficientă — în special când clasa are <b>membri pointeri</b> alocați dinamic.`,
    `Obiecte încuibărite: <b>construcția pleacă din interior, cleanup-ul din exterior</b> (ordine inversă, LIFO).`,
    `Copy ctor se apelează și la <b>transmiterea prin valoare</b> a parametrilor și la <b>return prin valoare</b>.`,
    `<code>new</code>/<code>delete</code> vs. <code>malloc()</code>/<code>free()</code>: doar primele apelează constructori/destructori.`,
  ]},
]},
{ id:"statice-friend", nume:"4 · Metode statice. Friend", blocks:[
  {t:"p", html:`Acest capitol acoperă mecanisme care nu „aparțin" unui obiect anume, ci <b>clasei</b>: membri statici (partajați de toate instanțele), constructori/destructori <code>private</code> (folosiți pentru pattern-ul <b>Singleton</b>), relațiile <b>friend</b> (acces controlat la membrii privați) și funcțiile <b>inline</b>. Totul pleacă de la o distincție simplă: <code>struct</code> vs. <code>class</code>.`},

  {t:"h", html:`struct vs. class în C++`},
  {t:"p", html:`Singura diferență reală între <code>struct</code> și <code>class</code> în C++ este <b>accesibilitatea implicită</b> a membrilor (date și funcții membre):`},
  {t:"ul", items:[
    `La <code>struct</code>, membrii sunt implicit <b>public</b>.`,
    `La <code>class</code>, membrii sunt implicit <b>private</b>.`
  ]},
  {t:"cmp",
   left:{title:`struct Point { double x, y; };`, html:`echivalent cu <code>struct Point { <b>public:</b> double x, y; };</code> — membrii sunt <b>public</b> implicit.`},
   right:{title:`class Point { double x, y; };`, html:`echivalent cu <code>class Point { <b>private:</b> double x, y; };</code> — membrii sunt <b>private</b> implicit.`}
  },
  {t:"code", cod:`struct Point {           // Declaratia tipului Point (am folosit struct)
     int x;                  // membru public
     int y;                  // membru public
public:
     Point ();               // constructor implicit
     Point (int a, int b);   // constructor explicit
     void set(int a, int b);
     void print();
     void move (int off_x, int off_y);
     int getx() const {return x;}
     int gety() const {return y;}
};

Point::Point () {
     cout << "\\nConstructor implicit in clasa Point ";
     x = 0; y = 0;
}`},
  {t:"note", kind:"info", html:`În rest, <code>struct</code> și <code>class</code> se comportă identic: ambele pot avea constructori, destructori, metode, moștenire, membri <code>private</code>/<code>protected</code>/<code>public</code>. Diferența e doar <i>default</i>-ul accesului (și al moștenirii).`},

  {t:"h", html:`Membri statici`},
  {t:"p", html:`Pe lângă variabilele locale statice, globale statice și funcțiile statice (non-membre) din C, C++ adaugă <b>variabile membre statice</b> și <b>funcții membre statice</b> — adică membri care aparțin <b>clasei</b>, nu unui obiect.`},

  {t:"h4", html:`Variabila membră statică`},
  {t:"p", html:`O variabilă membră statică este <b>partajată de toate instanțele</b> clasei: există o singură copie a ei, indiferent câte obiecte se creează (sau chiar dacă nu se creează niciunul).`},
  {t:"code", cod:`class Vector {       // Declaratia clasei Vector
     //...
public:
     static int counter;  // var membra statica
};

int Get_ActiveVectorInstances () {
     cout << "\\nNumarul de instante (obiecte) active ale clasei Vector: ";
     cout << Vector::counter;
     return Vector::counter;
}

int Vector::counter;     // DEFINIRE in afara clasei (obligatorie)

void main () {
     Vector  V1 ("V1", 1, 2, 3, 4);
     Vector  V2 = V1;
     Vector *V3 = new Vector ();

     Get_ActiveVectorInstances ();   // afiseaza 3
     delete V3;
     Get_ActiveVectorInstances ();   // afiseaza 2
}`},
  {t:"ul", items:[
    `O variabilă membră statică <b>nu aparține niciunui obiect</b> — aparține clasei.`,
    `Există alocată chiar dacă nu s-a instanțiat niciun obiect.`,
    `Se accesează prin numele clasei și operatorul de scop: <code>Vector::counter</code>.`,
    `Este ca o variabilă globală, dar accesibilă doar prin intermediul clasei.`,
    `Poate fi <code>public</code> sau <code>private</code>, ca orice membru.`
  ]},
  {t:"note", kind:"capcana", html:`O variabilă membră statică este <b>obligatoriu să fie definită în afara clasei</b> (inițializarea e opțională): <code>int Vector::counter = 0;</code>. Dacă o omiți, primești <b>eroare de linker</b>, nu de compilator: <code>error LNK2001: unresolved external symbol "public: static int Vector::counter"</code>.`},

  {t:"h4", html:`Funcția membră statică`},
  {t:"p", html:`O funcție membră statică aparține clasei și <b>nu are <code>this</code></b> — nu acționează asupra datelor unui obiect anume.`},
  {t:"code", cod:`class Vector {
     //...
public:
     static int counter;        // var membru statica
     static int getCounter ();  // metoda statica
};

int Vector::getCounter () {
     return counter;
}

int Get_ActiveVectorInstances () {
     cout << "\\nNumarul de instante (obiecte) active ale clasei Vector: ";
     cout << Vector::getCounter();
     return Vector::getCounter();
}`},
  {t:"ul", items:[
    `Apelul se face cu numele clasei și operatorul de scop: <code>Vector::getCounter()</code>.`,
    `Practic e o funcție standalone, dar accesibilă doar prin intermediul clasei.`,
    `Poate fi <code>public</code> sau <code>private</code>.`,
    `Se poate apela și printr-un obiect: <code>V2.getCounter();</code> (dar tot fără <code>this</code>).`,
    `De regulă, metodele statice sunt cele care nu au nevoie de datele interne ale unui obiect.`
  ]},
  {t:"note", kind:"capcana", html:`O metodă statică <b>nu poate accesa membri non-statici</b> ai clasei (date sau metode care depind de un obiect), pentru că nu are <code>this</code>. Poate folosi doar membri statici.`},

  {t:"joc", ref:"static-partajat"},
  {t:"h", html:`Constructori și destructori private. Singleton`},
  {t:"p", html:`Dacă facem constructorul <code>private</code>, clasa nu mai poate fi instanțiată din exterior — controlăm cum se creează obiectele. Aplicația clasică e pattern-ul <b>Singleton</b>: o singură instanță, accesată printr-o metodă statică <code>GetInstance()</code>.`},
  {t:"code", cod:`class Singleton {
public:
     static Singleton& GetInstance ();
     int  GetVal () { return val; }
     //...
private:
     Singleton() : val(5) {        // constructor private
          cout << "\\nConstructor...";
     }
     int val;
     static Singleton *mpInstance;
};

Singleton* Singleton::mpInstance = NULL;

Singleton& Singleton::GetInstance() {
     if (mpInstance == NULL)
          mpInstance = new Singleton;
     return *mpInstance;
}

void main () {
//   Singleton  X;                  // eroare (de compilare)
//   Singleton* Y = new Singleton;  // eroare (de compilare)

     Singleton &Z = Singleton::GetInstance();  // OK
     cout << "Z.val = " << Z.GetVal();
}`},
  {t:"note", kind:"capcana", html:`Instanțierea directă (<code>Singleton X;</code> sau <code>new Singleton</code>) dă <b>eroare de compilare</b>: <code>error C2248: 'Singleton::Singleton' : cannot access private member declared in class 'Singleton'</code>.`},
  {t:"p", html:`Mai e o capcană subtilă: chiar dacă blochezi constructorul, <b>constructorul de copiere implicit este public</b>. Astfel <code>Singleton Z = Singleton::GetInstance();</code> ar „merge", dar creează o copie — distrugem unicitatea. Soluția: facem și constructorul de copiere <code>private</code>.`},
  {t:"code", cod:`class Singleton {
public:
     static Singleton& GetInstance ();
     //...
private:
     Singleton(int v = 5) : val(v) {            // constructor private
          cout << "\\nConstructor...";
     }
     Singleton(const Singleton &S) : val(S.val) // constructor de copiere private
     {
          cout << "\\nConstructor de copiere...";
     }
     int val;
     static Singleton *mpInstance;
};

void main () {
     Singleton Z = Singleton::GetInstance();  // Eroare de compilare (corect!)
}`},
  {t:"note", kind:"nuanta", html:`<code>Z</code> și <code>P</code> obținute din Singleton referă <b>aceeași instanță unică</b>. Dacă <code>GetInstancePtr(10)</code> setează <code>val=10</code>, atunci și <code>Z.GetVal()</code> devine 10 — pentru că e un singur obiect.`},
  {t:"p", html:`Ultima problemă: <b>cum distrugem</b> instanța? Cu destructor public, <code>delete &Z;</code> trece, dar <code>delete P;</code> poate da <b>crash la runtime</b> (dublă eliberare). Soluția corectă: destructor <code>private</code> + o metodă statică <code>DestroyInstance()</code>.`},
  {t:"code", cod:`class Singleton {
public:
     static Singleton& GetInstance ();
     static Singleton* GetInstancePtr (int v);
     static void       DestroyInstance ();
     int  GetVal () { return val; }
private:
     Singleton(int v = 5) : val(v) {}
     Singleton(const Singleton &S) : val(S.val) {}
     ~Singleton () {;}              // destructor private
     int val;
     static Singleton *mpInstance;
};

void Singleton::DestroyInstance () {
     if (mpInstance == NULL)
          return;
     delete mpInstance;
     mpInstance = NULL;
}

void main () {
     Singleton &Z = Singleton::GetInstance();        // OK, Z.val = 5
     Singleton* P = Singleton::GetInstancePtr (10);  // OK, P.val = 10, Z.val = 10

     // delete &Z;  // eroare de compilare (destructor private)
     // delete P;   // eroare de compilare

     Singleton::DestroyInstance ();  // OK, distruge instanta
     Singleton::DestroyInstance ();  // nu se intampla nimic (mpInstance = NULL)
}`},

  {t:"h", html:`Funcții și clase friend`},
  {t:"p", html:`Mecanismul <b>friend</b> oferă acces la datele și funcțiile membre <b>private</b> ale unei clase. Este <b>nerecomandat</b> în general, pentru că încalcă principiul <b>încapsulării</b> — dar e util când două clase lucrează foarte strâns, sau la supraîncărcarea unor operatori.`},
  {t:"code", cod:`class Point {
     int x;
     int y;
public:
     int getx() const {return x;}
     int gety() const {return y;}

     friend class Vector;   // Vector are acces la x, y private
};

// Acum in Vector putem accesa direct membrii privati ai lui Point:
Vector::Vector (const char *nume, const Point& start, const Point& end) {
     cout << "\\nInitializam vectorul '" << nume << "'...";
     this->set (nume, start.x, start.y, end.x, end.y);
}`},
  {t:"note", kind:"capcana", html:`Relația <b>friend nu este comutativă</b>: dacă <code>Point</code> îl declară prieten pe <code>Vector</code>, NU înseamnă că <code>Vector</code> îl are prieten pe <code>Point</code>. (Și nu se moștenește.)`},
  {t:"p", html:`Putem declara <code>friend</code> și doar o <b>funcție anume</b> (a unei clase sau o funcție standalone), nu neapărat o clasă întreagă:`},
  {t:"code", cod:`class Vector {
     //...
public:
     friend void Point::print ();
     friend void fc ();
};`},

  {t:"h", html:`Funcții inline`},
  {t:"p", html:`La o funcție <code>inline</code>, apelul se înlocuiește cu <b>codul obiect al funcției</b> (nu se mai face un apel real). Avantaj: viteză; dezavantaj: crește dimensiunea codului obiect, deci e recomandat doar pentru funcții <b>foarte scurte</b>.`},
  {t:"code", cod:`inline int compare (int a, int b) {
     if (a > b) return 1;
     if (a < b) return 0;
     if (a == b) return -1;
}

inline int max (int a, int b) {
     return (a > b) ? a : b;
}`},
],
},
{ id:"mostenire-1", nume:"5 · Moștenirea (1)", blocks:[
  {t:"p", html:`Moștenirea (derivarea claselor) este mecanismul prin care o clasă nouă preia structura și comportamentul alteia, adăugând sau specializând ce e nevoie. Capitolul pleacă de la un exemplu concret — gestionarea studenților — arată de ce moștenirea bate alternativele, apoi formalizează terminologia, constructorii derivați și <b>vizibilitatea membrilor la moștenire</b> (tabelul critic de examen).`},

  {t:"h", html:`Motivația: studenți buget vs. taxă`},
  {t:"p", html:`Avem o clasă <code>Student</code> (nume, listă de note, medie, <code>print()</code> etc.). În realitate există studenți la <b>buget</b> (au, de ex., un grad militar) și studenți cu <b>taxă</b> (au taxe achitate). Au mult cod comun, dar și diferențe. Cum modelăm?`},
  {t:"code", cod:`class Student {
     int   m_Id;
     char *m_Nume;
     int   m_Note[100];   // lista de note (prima valoare 0 => finalul listei)
public:
     Student (int id, char *nume, int note[]);
     Student (const char *stdinfo);   // init pe baza unui sir formatat

     void  setNume (const char *nume);
     float getMedie ();
     void  print ();
     void  addNota (int nota);
     void  modifyNota (int index, int nota);
};`},
  {t:"h4", html:`V1 — două clase total diferite`},
  {t:"p", html:`<code>StudentBuget</code> și <code>StudentTaxa</code>, complet separate. <b>Avantaj:</b> entități clar distincte. <b>Dezavantaj:</b> duplicare masivă — aprox. <b>80–90%</b> din cod e identic.`},
  {t:"h4", html:`V2 — o singură clasă cu câmp „tip"`},
  {t:"p", html:`O clasă <code>StudentAny</code> cu un câmp <code>m_Tip</code> (buget/taxă) și toate câmpurile ambelor. <b>Avantaj:</b> codul comun nu se duplică. <b>Dezavantaj:</b> amestecăm entitățile; pe termen lung devine greu de extins și de depanat.`},
  {t:"h4", html:`V3 — moștenirea (soluția corectă)`},
  {t:"p", html:`Din <code>Student</code> derivăm două clase specializate. E o <b>combinație a celor mai bune părți</b> din V1 și V2: codul comun stă o singură dată în bază (ca V2), iar entitățile rămân clar separate (ca V1).`},
  {t:"code", cod:`class StudentBuget : public Student {
     t_GRAD m_Grad;
public:
     StudentBuget(int id, char *nume, int note[], t_GRAD grad);
     StudentBuget(const char *stdinfo);
     void   setGrad (t_GRAD grad) {/*...*/}
     t_GRAD getGrad ()            {/*...*/}
};

class StudentTaxa : public Student {
     int m_TaxeAchitate[20];
public:
     StudentTaxa(int id, char *nume, int note[], int taxe[]);
     StudentTaxa(const char *stdinfo);
     void payTaxa (int val)   {/*...*/}
     int  getSumaAchitata()   {/*...*/}
};`},
  {t:"note", kind:"info", html:`Deși crește numărul de clase, rezultatul e mai eficient: distingem clar entitățile (avantajul V1) și nu duplicăm codul (avantajul V2).`},

  {t:"joc", ref:"de-ce-mostenire"},
  {t:"h", html:`Terminologie`},
  {t:"ul", items:[
    `<b>Clasa de bază</b> (din care se derivă): mai e numită clasă <i>părinte</i> sau <i>super-clasă</i>.`,
    `<b>Clasa derivată</b> (cea moștenită): mai e numită clasă <i>copil</i>, <i>sub-clasă</i> sau clasă <i>specializată</i>.`,
    `Dintr-o clasă de bază se pot face <b>una sau mai multe</b> derivări.`,
    `O clasă derivată poate fi la rândul ei derivată mai departe (clasă <i>nepot</i> față de bază).`
  ]},

  {t:"h", html:`Ce moștenește clasa derivată`},
  {t:"ul", items:[
    `Clasele derivate moștenesc <b>toți membrii</b> clasei de bază (structură + comportament), <b>mai puțin constructorii</b>.`,
    `Unul dintre constructorii bazei participă totuși la inițializarea obiectului derivat.`,
    `Metodele se moștenesc întocmai și implicit, dar pot fi <b>suprascrise</b> (method overriding): se redeclară și se reimplementează în derivată.`
  ]},
  {t:"note", kind:"capcana", html:`Constructorii <b>NU se moștenesc</b>. Dar la construirea obiectului derivat se apelează totuși un constructor al bazei (cel implicit, sau unul explicit din lista de inițializare).`},

  {t:"h", html:`Constructorii derivați`},
  {t:"p", html:`Constructorul derivatei apelează constructorul bazei în <b>lista de inițializare</b>. Restul metodelor (<code>print()</code>, <code>getMedie()</code> …) sunt moștenite direct.`},
  {t:"code", cod:`StudentBuget::StudentBuget (const char *stdinfo)
     : Student(stdinfo)        // apel explicit al constructorului bazei
{
     m_Grad = STD_FR;          // doar initializarile specifice
}

StudentTaxa::StudentTaxa (const char *stdinfo)
     : Student(stdinfo)
{
     m_TaxeAchitate[0] = 0;
}

void main () {
     Student      S  ("101,Ionescu Vasile,8,9,5,10,8,9");
     StudentBuget SB ("102,Popescu Ion,7,9,5,10,8,9,10,4");
     StudentTaxa  ST ("103,Vasilescu Bogdan,8,9,10,4");
     S.print ();  SB.print ();  ST.print ();
}`},

  {t:"h", html:`Suprascrierea metodei print()`},
  {t:"p", html:`Pentru un afișaj corect, clasele derivate <b>suprascriu</b> <code>print()</code>, adăugând informația specifică (ex. gradul):`},
  {t:"code", cod:`void StudentBuget::print() {
     std::cout << "id: " << m_Id;
     std::cout << "\\nnume: " << m_Nume;
     std::cout.precision (2);
     std::cout << "\\nmedie: " << std::fixed << this->getMedie () << std::endl;
     std::cout << "grad: " << this->getGradStr();
}`},

  {t:"h", html:`Regula private → protected`},
  {t:"p", html:`<code>print()</code> din derivată folosește <code>m_Id</code>, <code>m_Nume</code> — câmpuri ale bazei. Dar dacă în <code>Student</code> ele sunt <code>private</code>, derivata <b>nu le poate accesa</b>. Soluția: le declarăm <code>protected</code> în bază.`},
  {t:"code", cod:`class Student {
protected:                  // in loc de private
     int   m_Id;
     char *m_Nume;
     int   m_Note[100];
public:
     Student (int id, char *nume, int note[]);
     Student (const char *stdinfo);
};`},
  {t:"note", kind:"nuanta", html:`<code>protected</code> e ca <code>private</code> pentru exterior (lumea de afară tot nu vede), dar <b>diferă</b> prin faptul că oferă acces claselor copil la membrii bazei.`},

  {t:"h", html:`Refolosirea codului bazei`},
  {t:"p", html:`Nu trebuie să rescriem ce există deja în bază. <code>print()</code> din derivată poate <b>apela</b> <code>Student::print()</code> și apoi adăuga doar partea specifică:`},
  {t:"code", cod:`void StudentBuget::print() {
     Student::print();   // apel metoda print originala (din clasa de baza)
     std::cout << "grad: " << this->getGradStr();
}`},

  {t:"h", html:`Tipurile de derivare`},
  {t:"p", html:`Derivarea poate fi <b>public</b>, <b>private</b> sau <b>protected</b>. Ideea rămâne aceeași, dar se schimbă vizibilitatea membrilor moșteniți.`},
  {t:"code", cod:`class B { /*...*/ };

class D : public B    { /*...*/ };   // public derivation
class D : B           { /*...*/ };   // private derivation (implicit!)
class D : private B   { /*...*/ };   // private derivation
class D : protected B { /*...*/ };   // protected derivation`},
  {t:"note", kind:"capcana", html:`Dacă <b>nu specifici nimic</b> la <code>class</code> (ex. <code>class D : B</code>), derivarea este implicit <b>private</b>. (La <code>struct</code> implicitul ar fi public.)`},

  {t:"h", html:`TABEL — Vizibilitatea membrilor la moștenire (critic la examen)`},
  {t:"p", html:`Cum devine accesibil un membru în clasa derivată depinde de <b>specificatorul din bază</b> × <b>tipul derivării</b>:`},
  {t:"table",
   head:[`Tip derivare`, `În clasa de bază membrul este`, `În clasa derivată devine`],
   rows:[
     [`public`, `private`, `inaccesibil`],
     [`public`, `protected`, `protected`],
     [`public`, `public`, `public`],
     [`private`, `private`, `inaccesibil`],
     [`private`, `protected`, `private`],
     [`private`, `public`, `public`]
   ]},
  {t:"note", kind:"capcana", html:`Un membru <b>private</b> al bazei e <b>întotdeauna inaccesibil</b> în derivată, indiferent de tipul derivării. De aceea, ca să-l vezi în copil, trebuie să-l faci <code>protected</code> în bază.`},
  {t:"note", kind:"nuanta", html:`Tipul derivării <b>nu poate crește</b> vizibilitatea — doar o poate restrânge. La derivare <code>public</code>, membrii bazei își păstrează nivelul (protected rămâne protected, public rămâne public). La derivare <code>private</code>, membrii accesibili „coboară" spre <code>private</code> în derivată.`},
],
},
{ id:"mostenire-2", nume:"6 · Moștenirea (2)", blocks:[
  {t:"p", html:`Partea a doua despre moștenire: <b>ordinea</b> de apel a constructorilor și destructorilor (inclusiv pe lanțuri lungi), <b>conversiile de tip</b> între pointeri bază/derivat, distincția de design <b>is-a vs. has-a</b>, și <b>moștenirea multiplă</b> cu problema diamond și soluția <code>virtual</code>.`},

  {t:"h", html:`Ordinea de apel: constructori și destructori`},
  {t:"p", html:`La construirea unui obiect derivat se creează <b>un singur obiect</b>, dar se apelează ambii constructori, întotdeauna întâi <b>baza</b>, apoi derivata. La distrugere, ordinea e <b>inversă</b>.`},
  {t:"code", cod:`class Derivata : public Baza { /*...*/ };
// sau: class Derivata : private Baza { /*...*/ };

Derivata D;        // la definirea obiectului:
//   Baza()        -->  intai constructorul bazei
//   Derivata()    -->  apoi constructorul derivatei

// la distrugere (invers):
//   ~Derivata()
//   ~Baza()`},
  {t:"note", kind:"capcana", html:`Dacă baza <b>nu are constructor implicit</b> (fără parametri), trebuie să apelezi <b>explicit</b> un constructor cu parametri al bazei, în lista de inițializare a constructorului derivatei. Altfel — eroare de compilare.`},

  {t:"h4", html:`Lanț mai lung de derivări`},
  {t:"p", html:`Pentru un lanț de derivări, constructorii se apelează de la cea mai îndepărtată bază spre derivată; destructorii — invers.`},
  {t:"code", cod:`class D : public C;
class C : public A;
class A : public B;     // B este baza cea mai indepartata

D d;
// Constructori (baza --> derivat):  A(), B(), C(), D()
// Destructori  (invers):            ~D(), ~C(), ~B(), ~A()`},
  {t:"note", kind:"nuanta", html:`Fidel cursului: pentru <code>D:C, C:A, A:B</code>, baza finală e <b>B</b>, deci ordinea constructorilor e <code>A(), B(), C(), D()</code> — adică se urcă pe lanț de la bază spre derivat, iar B (baza lui A) se construiește înaintea restului lanțului A→C→D.`},

  {t:"joc", ref:"ierarhie-ctor"},
  {t:"h", html:`Conversii de tip între pointeri`},
  {t:"p", html:`Un pointer la derivat poate fi atribuit unui pointer la bază <b>automat și implicit</b>, dar <b>doar dacă derivarea e public</b>. Invers (bază → derivat) NU se face automat; forțarea cu cast e periculoasă.`},
  {t:"code", cod:`Student      S  ("101,Ionescu Vasile,8,9,5,10,8,9");
StudentBuget SB ("102,Popescu,7,9,5,10,8,9,10,4");
StudentTaxa  ST ("103,Vasilescu Bogdan,10,9,10,4");

Student      *pS  = &S;     // OK
StudentBuget *pSB = &SB;    // OK

// pSB = &S;    // EROARE de compilator (baza --> derivat nu e implicit)
// pSB = &ST;   // EROARE (clase "surori", fara relatie)

pS = &SB;       // OK (derivat --> baza, implicit)
pS->print();    // se apeleaza doar Student::print()

pSB = (StudentBuget *) &S;   // merge la compilare; cast fortat, nerecomandat!!!
pSB->print();                // rezultat NEDEFINIT (poate CRASH!)

pSB = (StudentBuget *) &ST;  // cast fortat intre "surori", nerecomandat!!!
pSB->print();                // rezultat NEDEFINIT (poate CRASH!)`},
  {t:"note", kind:"capcana", html:`Regula de aur: conversia <code>Derivat*&nbsp;&rarr;&nbsp;Baza*</code> e automată <b>doar la derivare public</b>; în orice alt caz — NU. Acest mecanism stă la baza <b>polimorfismului</b> (metode virtuale suprascrise).`},

  {t:"h", html:`Exemplul Vehicle / Car`},
  {t:"p", html:`<code>Car</code> derivă <code>public</code> din <code>Vehicle</code>; apelează constructorul bazei și suprascrie <code>getDesc()</code>. Există <b>un singur obiect</b> — nu un Car care „conține" un Vehicle, ci un Car care <b>este</b> un Vehicle.`},
  {t:"code", cod:`class Vehicle {
  protected:
     int    m_Year;
     string m_Color;
  public:
     Vehicle(const string &color, const int year)
          : m_Year(year), m_Color(color) {}
     const string getDesc() const {
          string str = m_Color;
          str += " from "; str += stringify(m_Year);
          return str;
     }
};

class Car : public Vehicle {        // Car mosteneste din Vehicle
     string m_Model;
     int    m_Power;
  public:
     Car(const string &color, const int year, const string &model, const int power)
          : Vehicle(color, year), m_Model(model), m_Power(power) {}

     const string getDesc () const {     // getDesc suprascris (overriding)
          string str = m_Model;
          str += " from ";   str += stringify(m_Year);
          str += " having "; str += m_Color; str += " color (power: ";
          str += stringify(m_Power); str += " kW)";
          return str;
     }
};

void main () {
     Car C ("Black", 2006, "Toyota Avensis", 100);
     cout << C.getDesc().c_str() << endl;
     // Toyota Avensis from 2006 having Black color (power: 100 kW)
}`},
  {t:"note", kind:"info", html:`Ca să se construiască un <code>Car</code>, mai întâi se construiește „partea Vehicle". Dacă nu apelezi explicit constructorul bazei, se cheamă constructorul implicit al ei — care trebuie să existe.`},

  {t:"h", html:`is-a vs. has-a (moștenire vs. compoziție)`},
  {t:"p", html:`Două moduri prin care o clasă depinde de alta. Moștenirea modelează <b>„is-a"</b> (este-un); compoziția modelează <b>„has-a"</b> (are-un). A le confunda e o eroare de design.`},
  {t:"cmp",
   left:{title:`is-a — moștenire`, html:`<code>Car</code> <b>este</b> un <code>Vehicle</code> &rarr; <code>class Car : public Vehicle</code>. Obiectul derivat poate fi tratat ca obiect de tip bază.`},
   right:{title:`has-a — compoziție`, html:`<code>Vehicle</code> <b>are</b> o culoare &rarr; câmp membru <code>string m_Color;</code>. NU derivăm Vehicle din <code>string</code>!`}
  },
  {t:"note", kind:"capcana", html:`Ar fi greșit ca <code>Vehicle</code> să derive din <code>string</code> doar fiindcă are o culoare: un Vehicle <b>are</b> o culoare, nu <b>este</b> o culoare. Relația „has-a" se implementează prin <b>date membre</b>, nu prin moștenire.`},

  {t:"h", html:`Moștenirea multiplă`},
  {t:"p", html:`O clasă poate moșteni din <b>două sau mai multe</b> clase de bază. C++ permite acest lucru; Java, de exemplu, <b>nu</b>.`},
  {t:"code", cod:`class A { /* ... */ };
class B { /* ... */ };
class C { /* ... */ };
class X : public A, private B, public C { /* ... */ };

// Makes Car inherit from Vehicle and InsuredItem
class Car : public Vehicle, public InsuredItem { /* ... */ };`},
  {t:"note", kind:"capcana", html:`Nu poți moșteni de <b>două ori direct</b> aceeași clasă: <code>class D : public B1, private B1 { };</code> &rarr; eroare. Dacă două baze au un membru cu același nume <code>x</code>, dezambiguizezi cu operatorul de scop: <code>A::x</code>, <code>B::x</code>.`},

  {t:"h4", html:`Problema diamond și moștenirea virtual`},
  {t:"p", html:`Dacă <code>B2</code> și <code>B3</code> derivă ambele din <code>L</code>, iar <code>D</code> derivă din ambele, atunci <code>D</code> conține <b>două instanțe distincte</b> ale lui <code>L</code> — accesul direct la <code>x</code> e ambiguu. Soluția: moștenire <code>virtual</code> a lui <code>L</code>, care lasă <b>o singură instanță</b> partajată.`},
  {t:"code", cod:`class L {              // indirect base class
 public:
     int x;
     L() : x(10) {}
};

class B2 : virtual public L { /* ... */ };
class B3 : virtual public L { /* ... */ };

class D : public B2, public B3 {     // valid
public:
     void f() {
          B2::x = 1;
          B3::x = 2;
          cout << B2::x;          // 2
          cout << endl << B3::x;  // 2
          cout << x;  // OK doar cu virtual; fara virtual -> eroare (ambiguitate)
     }
};

void main () {
     D d;
     d.f();   // B2::x = 2, B3::x = 2, x = 2  (o singura instanta!)
}`},
  {t:"cmp",
   left:{title:`Cu virtual`, html:`<b>o singură instanță</b> a lui <code>x</code>: <code>B2::x</code>, <code>B3::x</code> și <code>x</code> referă aceeași variabilă (toate devin 2). <code>cout &lt;&lt; x;</code> e valid.`},
   right:{title:`Fără virtual`, html:`<b>două instanțe distincte</b>: <code>B2::x = 1</code>, <code>B3::x = 2</code>. <code>cout &lt;&lt; x;</code> dă <b>eroare de ambiguitate</b> la compilare — trebuie operatorul de scop.`}
  },
  {t:"note", kind:"nuanta", html:`Exemplul <code>storable/transmitter/receiver/radio</code>: <code>storable *p = new radio; p-&gt;read();</code> afișează <code>read from storable...</code>, NU <code>radio::read()</code>. Pentru că <code>read()</code> <b>nu e virtual</b>: apelul se rezolvă <b>static</b>, după tipul pointerului (<code>storable*</code>). De aici motivația metodelor <b>virtuale</b> pentru polimorfism (capitolul următor).`},
],
},
{ id:"polimorfism", nume:"7 · Virtuale. Polimorfism. Abstracte", blocks:[
  {t:"p", html:`Acesta este capitolul-cheie al OOP: până acum o clasă derivată putea <b>suprascrie</b> (override) o metodă din bază, dar care versiune se execută la apel? Răspunsul depinde de un singur cuvânt: <code>virtual</code>. Fără el, alegerea se face după <b>tipul static</b> al pointerului/referinței (compile-time); cu el, după <b>tipul real</b> al obiectului (run-time). Acesta din urmă se numește <b>polimorfism</b> și este implementat prin mecanismul <i>v-table</i>.`},

  {t:"h", html:`Suprascrierea metodelor în clasa derivată`},
  {t:"p", html:`Reluăm exemplul fir-roșu <code>Vehicle</code>/<code>Car</code>. Metoda <code>getDesc()</code> din bază este <b>suprascrisă</b> (override) la nivelul derivatei <code>Car</code>: același nume, aceeași semnătură, dar implementare proprie care folosește și membrii specifici (<code>m_Model</code>, <code>m_Power</code>).`},
  {t:"code", cod:`#include <iostream>
using namespace std;

string stringify (int value)
{
    char pvalue[100];
    sprintf_s (pvalue, sizeof (pvalue), "%d", value);
    return string (pvalue);
}
/****************************************************************************/
class Vehicle
{
    protected:
        int     m_Year;
        string  m_Color;

    public :
        Vehicle( const string &color, const int year)
            : m_Year(year), m_Color(color)  {}

        const string getDesc() const {
            string str = m_Color;
            str += " from "; str += stringify(m_Year);

            return str;
        }

        const string &getColor() const {return m_Color;}
        const int getYear() const {return m_Year;}
        //...
};
/****************************************************************************/
class Car : public Vehicle
{
    string  m_Model;
    int     m_Power;
  public :
    Car(const string &color, const int year,
                const string &model, const int power)
        : Vehicle(color, year), m_Model(model), m_Power (power) {}

    const string &getModel() {return m_Model;}
    const int     getPower() {return m_Power;}


    const string getDesc () const {
        string str = m_Model;
        str += " from "; str += stringify(m_Year);
        str += " having "; str += m_Color; str += " color (power: ";
        str += stringify(m_Power);
        str += " kW)";

        return str;
    }
    //...
};
/****************************************************************************/
void main ()
{
    Car C ("Black", 2006, "Toyota Avensis", 100);
    cout << C.getDesc().c_str() << endl;

    cout << endl;
    Vehicle *p = &C;
    cout << p->getDesc().c_str() << endl;

}
/****************************************************************************/`},

  {t:"h", html:`Problema apelului fără <code>virtual</code>`},
  {t:"p", html:`Obiectul țintit este același (<code>C</code>, un <code>Car</code>), dar rezultatul diferă în funcție de tipul prin care îl accesăm:`},
  {t:"code", cod:`Toyota Avensis from 2006 having Black color (power: 100 kW)

Black from 2006`},
  {t:"ul", items:[
    `În cazul 1 obiectul <code>C</code> este de tip <code>Car</code> &rarr; compilatorul generează apel către <code>Car::getDesc()</code>.`,
    `În cazul 2 pointerul <code>p</code> este de tip <code>Vehicle*</code> &rarr; compilatorul generează apel către <code>Vehicle::getDesc()</code>, deși obiectul real este un <code>Car</code>.`,
  ]},
  {t:"note", kind:"capcana", html:`Fără <code>virtual</code>, apelul prin pointer/referință de bază execută versiunea din <b>tipul static</b> (tipul declarat al pointerului), NU versiunea obiectului real. Aceasta este capcana clasică de examen: <code>Vehicle* p = &C; p-&gt;getDesc();</code> dă <code>Vehicle::getDesc</code>, nu <code>Car::getDesc</code>.`},

  {t:"h", html:`Soluția: metode <code>virtual</code> și late binding`},
  {t:"p", html:`Declarăm metoda <code>virtual</code> la nivelul clasei de <b>bază</b>. Atât e suficient — în derivată suprascrierea rămâne virtuală automat.`},
  {t:"code", cod:`class Vehicle
{
  //...
  virtual const string getDesc() const {
    //...
  }
};`},
  {t:"p", html:`Acum apelul prin <code>Vehicle*</code> dispatchează la versiunea obiectului real, deci ambele linii afișează descrierea completă a mașinii:`},
  {t:"code", cod:`Toyota Avensis from 2006 having Black color (power: 100 kW)
Toyota Avensis from 2006 having Black color (power: 100 kW)`},
  {t:"note", kind:"info", html:`Observație cheie: indiferent prin ce tip de date (<code>Car</code> sau <code>Vehicle</code>) accesăm obiectul, se apelează metoda corectă, specifică exact pentru obiectul instanțiat. Aceasta este legarea <b>târzie</b> (late / dynamic / runtime binding), opusă legării <b>timpurii</b> (static / compile-time binding).`},

  {t:"h", html:`Comportament polimorfic: aceeași secvență, ieșire diferită`},
  {t:"p", html:`Adăugăm un al treilea tip, <code>Truck</code>, derivat tot din <code>Vehicle</code>. Aceeași linie de cod <code>pVehicle-&gt;getDesc()</code> produce ieșire diferită după ce obiect a fost alocat:`},
  {t:"code", cod:`class Car : public Vehicle
{
    //...
}

class Vehicle
{
    //...
}

class Truck : public Vehicle
{
    int m_Tonnage;
  public:
    Truck(const string &color, const int year, const int tonnage)
        : Vehicle(color, year), m_Tonnage (tonnage) {}

    const string getDesc () const {
            string str = "Truck";
            str += " from "; str += stringify(m_Year);
            str += " having "; str += " tonnage ";
            str += stringify(m_Tonnage);
            return str;
    }
    //...
};
/****************************************************************************/
void main ()
{
    Vehicle *pVehicle;
    bool flag;

    //...
    cin >> flag;
    if (flag == true)
        pVehicle = new Car ("Black", 2006, "Toyota Avensis", 100);
    else
        pVehicle = new Truck ("Green", 2009, 30);

    cout << pVehicle->getDesc().c_str() << endl;


    //...
    cin >> flag;
    if (flag == true)
        pVehicle = new Car ("Black", 2006, "Toyota Avensis", 100);
    else
        pVehicle = new Truck ("Green", 2009, 30);

    cout << pVehicle->getDesc().c_str() << endl;
}
/****************************************************************************/`},
  {t:"code", cod:`1
Toyota Avensis from 2006 having Black color (power: 100 kW)
0
Truck from 2009 having  tonnage 30`},
  {t:"ul", items:[
    `Cele două secvențe de cod executate sunt <b>identice</b>; diferă doar adresa pe care o conține <code>pVehicle</code>.`,
    `<b>Polimorfism</b> = „many shapes" = capabilitatea unui obiect de a avea mai multe tipuri. Dacă o funcție așteaptă un <code>Vehicle</code>, putem da un <code>Car</code> (un <code>Car</code> este în primul rând un <code>Vehicle</code>). Oriunde merge un <code>Vehicle*</code>, merge și un <code>Car*</code>.`,
  ]},

  {t:"h", html:`Metode virtuale: exemplul <code>Baza</code>/<code>Derivat</code> (F1 ne-virtual vs F2 virtual)`},
  {t:"p", html:`Acesta este exemplul canonic care izolează diferența. <code>F1</code> nu este virtuală, <code>F2</code> este. Urmărește ce se întâmplă prin pointer și prin referință de bază.`},
  {t:"code", cod:`/****************************************************************************/
class Baza {
    //...
public:
            void F1() { cout << "\\n F1 din clasa baza";}
    virtual void F2() { cout << "\\n F2 din clasa baza";}
    //...
};

class Derivat : public Baza {
    //...
public:
        void F1() { cout << "\\n F1 din clasa derivata";}
        void F2() { cout << "\\n F2 din clasa derivata";}
    //...
};
/****************************************************************************/
void main ()
{
    Baza  B, *pBaza;
    Derivat  D;

    pBaza = &B;
    pBaza->F1(); // executa Baza::F1
    pBaza->F2(); // executa Baza::F2
    cout << endl;

    pBaza = &D;
    pBaza->F1(); // executa Baza::F1
    pBaza->F2(); // executa Derivat::F2
    cout << endl;

    Baza &rBaza = D;
    rBaza.F1();  // executa Baza::F1
    rBaza.F2();  // executa Derivat::F2
    cout << endl;
}
/****************************************************************************/`},
  {t:"code", cod:`F1 din clasa baza
F2 din clasa baza

F1 din clasa baza
F2 din clasa derivata

F1 din clasa baza
F2 din clasa derivata`},
  {t:"note", kind:"nuanta", html:`Diferența o face exclusiv tipul metodei <code>F2</code> (virtuală în bază). Când <code>pBaza</code> pointează la <code>D</code>: <code>F1</code> (ne-virtuală) &rarr; legare statică la tipul pointerului &rarr; <code>Baza::F1</code>; <code>F2</code> (virtuală) &rarr; legare dinamică la obiectul real &rarr; <code>Derivat::F2</code>. <b>Referința</b> <code>Baza&amp;</code> se comportă identic cu pointerul: și ea dispatchează virtual la <code>Derivat::F2</code>.`},

  {t:"h", html:`Mecanismul v-table / vptr (cum funcționează „pe dedesubt")`},
  {t:"p", html:`Fiecare clasă care declară o metodă virtuală (și care nu era deja virtuală dintr-o bază de mai jos) <b>primește automat</b> de la compilator o tabelă de pointeri la funcții: <b>v-table</b> (în Visual Studio: <code>__vfptr</code> / <code>vftable</code>). Fiecare obiect polimorfic primește un câmp ascuns, <b>vptr</b>, care indică spre v-table-ul clasei sale reale. Un apel virtual = o <b>indirectare</b>: se citește <code>obiect.vptr</code>, se intră în v-table, se ia intrarea <code>[i]</code> și se sare la implementarea găsită acolo.`},
  {t:"ul", items:[
    `Adresa v-table este <b>constantă per clasă</b>: în debug, v-table <code>Baza</code> = <code>0x00417718</code>, v-table <code>Derivata</code> = <code>0x0041773c</code>.`,
    `Intrarea <code>[0x0]</code> pointează la implementarea lui <code>F2</code> care va fi efectiv apelată: <code>Baza::F2</code> = <code>0x0041114a</code>, <code>Derivat::F2</code> = <code>0x0041128f</code>.`,
    `Secvența 1 (<code>pBaza = &amp;B</code>): <code>__vfptr</code> al lui <code>pBaza</code> = v-table <code>Baza</code> &rarr; <code>[0]</code> = <code>Baza::F2</code>.`,
    `Secvența 2 (<code>pBaza = &amp;D</code>): <code>__vfptr</code> = v-table <code>Derivata</code> &rarr; <code>[0]</code> = <code>Derivat::F2</code>.`,
    `Secvența 3 (<code>Baza &amp;rBaza = D</code>): referința „vede" tot v-table-ul <code>Derivata</code> &rarr; <code>[0]</code> = <code>Derivat::F2</code>.`,
  ]},
  {t:"note", kind:"nuanta", html:`Dynamic binding înseamnă „urmărește <code>__vfptr</code>-ul <b>obiectului real</b>, nu tipul static al pointerului/referinței". De aceea costul unui apel virtual este o indirectare în plus față de un apel obișnuit.`},

  {t:"joc", ref:"vtable-dispatch"},
  {t:"h", html:`Destructor virtual — de ce e obligatoriu`},
  {t:"p", html:`Știm deja: constructorii și destructorii <b>nu se moștenesc</b>, dar la instanțierea unei derivate se apelează automat și constructorul/destructorul bazei. La un obiect normal ordinea este corectă:`},
  {t:"code", cod:`class Baza {
    //...
    Baza();
    ~Baza();
};

class Derivat: public Baza {
    //...
    Derivat();
    ~Derivat();
};

void main ()
{
    Derivat  D;
}`},
  {t:"code", cod:`Baza(), Derivat().... ~Derivat(), ~Baza()`},
  {t:"p", html:`Problema apare la <code>delete</code> printr-un pointer de <b>bază</b> către un obiect derivat alocat dinamic:`},
  {t:"code", cod:`void main ()
{
    Baza  *pB = new Derivat();    // instantierea unui obiect Derivat
    //...
    delete pB;                    // distrugerea obiectului Derivat
}`},
  {t:"code", cod:`Baza(), Derivat()....~Baza()`},
  {t:"ul", items:[
    `Pointerul <code>pB</code> este de tip <code>Baza*</code>, deci destructorul derivatei <b>nu mai este apelat</b> de compilator — rulează doar <code>~Baza()</code>.`,
    `Dezavantaj: nu se face distrugerea corectă/completă a obiectului (lipsește cleanup-ul componentei provenite din <code>Derivat</code>) &rarr; <b>memory leak</b> / comportament nedefinit.`,
  ]},
  {t:"p", html:`Soluția: destructorul clasei <code>Baza</code> trebuie să fie <code>virtual</code> (intră în v-table). Atunci <code>delete pB</code> dispatchează virtual și rulează <code>~Derivat()</code> apoi <code>~Baza()</code>.`},
  {t:"code", cod:`class Baza {
    //...
    Baza();
    virtual ~Baza();
};`},
  {t:"note", kind:"capcana", html:`Regulă de aur: orice clasă <b>de bază polimorfică</b> (care are măcar o metodă virtuală și e folosită prin <code>Baza*</code>) <b>trebuie</b> să aibă destructor virtual. <code>delete</code> prin <code>Baza*</code> fără <code>~virtual</code> = rulează doar <code>~Baza</code> &rarr; leak / UB.`},

  {t:"joc", ref:"dtor-virtual"},
  {t:"h", html:`Metode virtuale pure, clase abstracte, interfețe`},
  {t:"p", html:`O <b>metodă virtuală pură</b> este o metodă virtuală fără implementare, marcată cu <code>= 0</code>. Ea spune „derivata <i>trebuie</i> să mă implementeze".`},
  {t:"code", cod:`class Forma {            // clasa abstracta
public:
    virtual double arie() const = 0;   // metoda virtuala pura
    virtual ~Forma() {}                // destructor virtual
};

class Cerc : public Forma {
    double r;
public:
    Cerc(double r) : r(r) {}
    double arie() const { return 3.14159 * r * r; }   // suprascriere obligatorie
};`},
  {t:"ul", items:[
    `O clasă care are <b>cel puțin o</b> metodă virtuală pură este o <b>clasă abstractă</b>.`,
    `O clasă abstractă <b>nu poate fi instanțiată</b> direct (<code>Forma f;</code> este eroare de compilare), dar poate fi folosită ca tip pentru pointeri/referințe: <code>Forma* p = new Cerc(2);</code>.`,
    `Dacă o derivată nu suprascrie <b>toate</b> metodele pure moștenite, rămâne și ea abstractă.`,
    `O <b>clasă de tip interfață</b> = o clasă abstractă formată <b>numai</b> din metode virtuale pure (fără date, fără implementări) — contractul pur pe care derivatele îl respectă.`,
  ]},
  {t:"note", kind:"capcana", html:`<code>= 0</code> NU înseamnă „returnează 0" și nici „funcția e nulă/ștearsă" — este sintaxa specială pentru „virtuală pură". Confuzia cu <code>= delete</code> (cu totul altceva) e o capcană frecventă.`},
  {t:"note", kind:"info", html:`Polimorfismul are mai multe forme în C++: supraîncărcarea funcțiilor și operatorilor, metodele virtuale suprascrise în derivate, și template-urile (capitolul 9). Capitolul de față acoperă forma „dinamică" (run-time), prin v-table.`},
]},

{ id:"operatori", nume:"8 · Supraîncărcarea operatorilor", blocks:[
  {t:"p", html:`Supraîncărcarea operatorilor îți permite să <b>definești ce face un operator</b> (<code>+</code>, <code>=</code>, <code>&lt;&lt;</code> ...) pentru tipul tău de date. Nu inventezi operatori noi — extinzi operatorii standard (built-in) ca să lucreze cu operanzi definiți de utilizator (clase, structuri). Câștigul este pur de claritate: <code>a + b</code> e mult mai lizibil decât <code>a.Add(b)</code>.`},

  {t:"h", html:`Ce înseamnă și de ce`},
  {t:"ul", items:[
    `<b>Definiție:</b> extinderea unui operator pentru a lucra cu tipuri de operanzi definiți de utilizator. La nivelul unei clase/structuri, utilizatorul definește un operator care implementează o operație asupra obiectelor acelei clase.`,
    `Nu pot fi definiți (supraîncărcați) decât operatorii <b>standard</b> (built-in); nu poți crea operatori noi.`,
    `Este un caz particular de supraîncărcare: ca și funcțiile cu același nume dar parametri diferiți, operatorii pot avea operanzi și funcționalitate diferită.`,
  ]},

  {t:"h", html:`Exemplul <code>Complex</code>: <code>operator+</code> ca metodă`},
  {t:"p", html:`Definim adunarea a două numere complexe. Operatorul este o <b>metodă membru</b>: operandul stâng este <code>this</code>, operandul drept este parametrul.`},
  {t:"code", cod:`#include <iostream>
using namespace std;

class Complex {
public:
    Complex(double re,double im) :real(re),imag(im) {};
    void print() {printf ("(%lf, %lf)", real, imag);}

    Complex operator+ (const Complex& C);

private:
    double real;
    double imag;
};

Complex Complex::operator+ (const Complex& C)
{
    double result_real = real + C.real;
    double result_imaginary = imag + C.imag;
    return Complex(result_real, result_imaginary);
}
/****************************************************************************/
void main ()
{
  Complex a(1.2,1.3);
  Complex b(2.1,3);

  Complex c = a+b; //aici, operatorul + trebuie redefinit (supraincarcat)

  a.print();cout << " + "; b.print(); cout << " = "; c.print();
  cout << endl;
}
/****************************************************************************/`},
  {t:"code", cod:`(1.200000, 1.300000) + (2.100000, 3.000000) = (3.300000, 4.300000)
Press any key to continue . . .`},
  {t:"note", kind:"info", html:`Fără operator, am fi scris o metodă dedicată <code>Complex Add(const Complex&amp; C);</code> apelată ca <code>Complex c = a.Add(b);</code>. Funcțional identic — singura diferență e claritatea. <code>a + b</code> e mai intuitiv.`},

  {t:"joc", ref:"operator-plus"},
  {t:"h", html:`Variante cu liste de parametri diferite`},
  {t:"p", html:`Același operator poate fi supraîncărcat în mai multe variante, schimbând lista de parametri. Aici adăugăm <code>operator+(int)</code> pe lângă <code>operator+(const Complex&amp;)</code>.`},
  {t:"code", cod:`class Complex
{
public:
    Complex operator+ (const Complex& C);
    Complex operator+ (int k);
    //..
};

Complex Complex::operator+ (int k)
{
    double result_real = real + k;
    double result_imaginary = imag + k;
    return Complex(result_real, result_imaginary);
}
/****************************************************************************/
void main ()
{
    Complex a(1.2,1.3);

    Complex d = a + 2;
    d.print();
}
/****************************************************************************/`},

  {t:"h", html:`Cele 2 forme: metodă membru vs funcție friend`},
  {t:"p", html:`La nivelul unei clase (sau struct) operatorii pot fi supraîncărcați în 2 moduri. Diferența esențială apare la operandul stâng:`},
  {t:"cmp",
   left:{title:`Metodă membru`, html:`Operandul stâng este <b><code>this</code></b> (obiectul curent); operandul drept este parametrul.<br>Semnătură: <code>Complex operator+(const Complex&amp; C);</code><br>Apel: <code>a + b</code> &rarr; <code>a.operator+(b)</code>.<br><b>Limitare:</b> operandul stâng trebuie să fie un obiect al clasei — nu poate fi un <code>int</code> sau alt tip.`},
   right:{title:`Funcție friend (standalone)`, html:`Funcție liberă, declarată <code>friend</code> ca să acceseze membrii privați; <b>ambii</b> operanzi sunt parametri.<br>Semnătură: <code>friend Complex operator+(const Complex&amp; C1, const Complex&amp; C2);</code><br>Apel: <code>a + b</code> &rarr; <code>operator+(a, b)</code>.<br><b>Avantaj:</b> operandul stâng poate fi de orice tip (ex. <code>int</code>), deci permite <code>2 + a</code>.`}},
  {t:"code", cod:`class Complex
{
public:
    Complex(double re,double im):real(re),imag(im) {};
    void print() {printf ("(%lf, %lf)", real, imag);}

private:
    double real;
    double imag;

    friend Complex operator+(const Complex& C1, const Complex& C2);
    friend Complex operator+ (const Complex& C1, int k);
};

Complex operator+(const Complex& C1, const Complex& C2)
{
    double result_real = C1.real + C2.real;
    double result_imaginary = C1.imag + C2.imag;
    return Complex(result_real, result_imaginary);
}

Complex operator+ (const Complex& C1, int k)
{
    double result_real = C1.real + k;
    double result_imaginary = C1.imag + k;
    return Complex(result_real, result_imaginary);
}
/****************************************************************************/
void main ()
{
    Complex a(1.2,1.3);
    Complex b(2.1,3);

    Complex c = a + b;
    a.print();cout << " + "; b.print(); cout << " = "; c.print();

    Complex d = a + 2;
    d.print();
}
/****************************************************************************/`},

  {t:"h", html:`Comutativitate: <code>2 + a</code> necesită friend`},
  {t:"p", html:`Vrem să păstrăm proprietatea de comutativitate a lui <code>+</code>, deci să putem scrie și <code>2 + a</code> (cu <code>int</code> în stânga). Ca metodă membru e <b>imposibil</b>: operandul stâng <code>2</code> nu este obiect <code>Complex</code>, deci nu există <code>(2).operator+(a)</code>. Singura variantă este o funcție <b>friend</b> cu <code>int</code> ca prim parametru.`},
  {t:"code", cod:`/****************************************************************************/
class Complex
{
public:
    Complex operator+ (const Complex& C);
    Complex operator+ (int k);

    friend Complex operator+ (int k, const Complex& C1);
    //..
};


Complex operator+ (int k, const Complex& C1)
{
    double result_real = C1.real + k;
    double result_imaginary = C1.imag + k;
    return Complex(result_real, result_imaginary);
}`},
  {t:"code", cod:`/****************************************************************************/
void main ()
{
    Complex a(1.2,1.3);

    Complex d = 2 + a;
    d.print();
}

/****************************************************************************/`},
  {t:"note", kind:"capcana", html:`<code>a + 2</code> merge și ca metodă (<code>a.operator+(2)</code>), dar <code>2 + a</code> NU — pentru forma cu literalul în stânga ai nevoie obligatoriu de funcție <b>friend</b> <code>operator+(int, const Complex&amp;)</code>. Capcană tipică de examen pe tema comutativității.`},

  {t:"h", html:`Operatorul de asignare <code>=</code> și legătura cu copy ctor`},
  {t:"p", html:`Operatorul <code>=</code> suprascrie comportamentul de atribuire între obiecte deja existente. Idiomatic: verifică auto-asignarea (<code>this != &amp;C</code>), copiază membrii, returnează <code>*this</code> prin referință (ca să permită lanțuri <code>a = b = c</code>).`},
  {t:"code", cod:`class Complex
{
public:
    //..
    Complex& operator= (const Complex& C);
};

Complex& Complex::operator= (const Complex& C)
{
    if (this != &C)
    {
        this->real = C.real;
        this->imag = C.imag;
    }

    return *this;
}
/****************************************************************************/
void main ()
{
    Complex a(1.2,1.3);

    Complex c (0, 0);
    c = a;          //aici, este apelat operatorul = (cel supraincarcat)

    // ATENTIE !!
    Complex d = a; //aici, este invocat constructorul de copiere şi nu operatorul =

}
/****************************************************************************/`},
  {t:"note", kind:"capcana", html:`<b>Capcana cheie:</b> <code>Complex d = a;</code> NU apelează <code>operator=</code>, ci <b>constructorul de copiere</b>! Deși sintaxa folosește semnul <code>=</code>, este <i>inițializare la declarare</i> (obiectul <code>d</code> nu există încă). Doar <code>c = a;</code>, unde <code>c</code> exista deja, apelează operatorul de atribuire.`},
  {t:"note", kind:"nuanta", html:`Operatorul se putea declara și fără referință la tipul de return: <code>Complex operator=(const Complex&amp; C);</code>. Forma cu referință (<code>Complex&amp;</code>) e preferată pentru a permite înlănțuirea și a evita o copie inutilă a rezultatului.`},

  {t:"h", html:`Operatorii <code>&lt;&lt;</code> și <code>&gt;&gt;</code> (ieșire / intrare) ca friend`},
  {t:"p", html:`Pentru a folosi <code>cout &lt;&lt; a</code> și <code>cin &gt;&gt; b</code> cu tipul tău, supraîncarci <code>operator&lt;&lt;</code> și <code>operator&gt;&gt;</code>. Trebuie să fie funcții <b>friend</b> (operandul stâng este <code>ostream</code>/<code>istream</code>, nu obiectul tău), iar returnarea stream-ului prin referință permite înlănțuirea <code>cout &lt;&lt; a &lt;&lt; b</code>.`},
  {t:"code", cod:`class Complex
{
    //..
    friend ostream &operator<<(ostream &out, Complex c);    //output
    friend istream &operator>>(istream &in, Complex &c);    //input
};

ostream &operator<<(ostream &out, Complex c)    //output
{
        out<<"real part: "<<c.real << ", ";
        out<<"imag part: "<<c.imag<<"\\n";
        return out;
}

istream &operator>>(istream &in, Complex &c)    //input
{
        cout<<"enter real part:\\n";
        in>>c.real;
        cout<<"enter imag part: \\n";
        in>>c.imag;
        return in;
}
/****************************************************************************/
void main ()
{
    Complex a(1.2,1.3);
    Complex b(2.1,3);

    cout<<a<<b;

    cin>> b;
    cout << b;
}
/****************************************************************************/`},
  {t:"code", cod:`real part: 1.2, imag part: 1.3
real part: 2.1, imag part: 3
enter real part:
4.2
enter imag part:
5.2
real part: 4.2, imag part: 5.2
Press any key to continue . . .`},
  {t:"note", kind:"nuanta", html:`La <code>operator&gt;&gt;</code> obiectul citit se primește prin referință <b>ne-const</b> (<code>Complex &amp;c</code>) — trebuie modificat. La <code>operator&lt;&lt;</code> îl putem primi prin valoare sau const-ref (doar îl citim). Stream-ul se ia mereu prin referință și se returnează prin referință.`},

  {t:"h", html:`Reguli C++ privind supraîncărcarea operatorilor`},
  {t:"ul", items:[
    `Operatorii <code>=</code>, <code>&amp;</code> (adresare) și <code>,</code> (secvențiere) au implementări <b>implicite</b> pentru orice tip nou; pot fi totuși supraîncărcați. Orice alt operator trebuie declarat și definit explicit ca să fie aplicabil.`,
    `Aproape toți operatorii standard pot fi supraîncărcați.`,
    `Operatorii își păstrează întotdeauna <b>tipul</b> (unar/binar) și <b>precedența</b> — nu le poți schimba.`,
    `Operatorul de scop <code>::</code> și cel de selectare de membru <code>.</code> NU pot fi supraîncărcați.`,
    `Toți operatorii, cu <b>excepția</b> operatorului de atribuire <code>=</code>, se moștenesc.`,
  ]},
  {t:"table", head:[`Categorie`,`Operatori`],
   rows:[
     [`Aritmetici &amp; compuși`, `<code>+ - * /</code>&nbsp; <code>+= -= *= /=</code>&nbsp; <code>%</code> <code>%=</code>&nbsp; <code>++ --</code>`],
     [`Asignare &amp; comparare`, `<code>=</code>&nbsp; <code>== &lt; &gt; &lt;= &gt;= != </code>&nbsp; <code>! &amp;&amp; ||</code>`],
     [`Pe biți &amp; shift`, `<code>&lt;&lt; &gt;&gt;</code>&nbsp; <code>&lt;&lt;= &gt;&gt;=</code>&nbsp; <code>&amp; ^ |</code>&nbsp; <code>&amp;= ^= |=</code>&nbsp; <code>~</code>`],
     [`Speciali`, `<code>[]</code>&nbsp; <code>()</code>&nbsp; <code>,</code>&nbsp; <code>-&gt;*</code>&nbsp; <code>-&gt;</code>&nbsp; <code>new</code> <code>new[]</code>&nbsp; <code>delete</code> <code>delete[]</code>`],
     [`NESupraîncărcabili`, `<code>::</code> (scop)&nbsp;&nbsp; <code>.</code> (selectare membru)&nbsp;&nbsp; <code>.*</code>&nbsp;&nbsp; <code>?:</code>&nbsp;&nbsp; <code>sizeof</code>`],
   ]},
  {t:"note", kind:"capcana", html:`Întrebare frecventă de examen: „care operatori NU pot fi supraîncărcați?" Reține: <code>::</code>, <code>.</code>, <code>.*</code>, <code>?:</code> și <code>sizeof</code>. Toți ceilalți (inclusiv <code>[]</code>, <code>()</code>, <code>-&gt;</code>, <code>new</code>/<code>delete</code>) se pot supraîncărca.`},
]},

{ id:"template", nume:"9 · Funcții și clase template", blocks:[
  {t:"p", html:`Un <b>template</b> (șablon) definește o clasă de funcții sau de clase care rezolvă o problemă lucrând cu tipuri de date <b>nespecificate, generice</b>. Este o tehnică de reutilizare de cod („write once – use during multiple cases") și o altă formă de polimorfism, alături de supraîncărcare și metode virtuale.`},
  {t:"note", kind:"nuanta", html:`Ideea centrală: un template NU este cod, ci un <b>generator de cod</b>. Compilatorul nu compilează șablonul în sine; el <b>instanțiază</b> o variantă concretă pentru fiecare tip cu care e folosit efectiv. Un singur șablon &rarr; mai multe funcții/clase reale generate în secțiunea <code>.text</code>.`},

  {t:"h", html:`Problema I: funcția <code>maxim</code>`},
  {t:"p", html:`Vrem elementul maxim dintr-un vector — de <code>int</code>, <code>float</code>, <code>double</code>, <code>Complex</code>, <code>string</code>, <code>Student</code> etc. Soluția naivă: o funcție supraîncărcată pentru fiecare tip.`},
  {t:"code", cod:`int maxim (int V[], int n)
{
    int max = V[0];
    for (int i = 1; i < n; i++) {
        if (max < V[i])
            max = V[i];
    }

    return max;
}

float maxim (float V[], int n)
{
    float max = V[0];
    for (int i = 1; i < n; i++) {
        if (max < V[i])
            max = V[i];
    }

    return max;
}

double maxim (double V[], int n)
{
    double max = V[0];
    for (int i = 1; i < n; i++) {
        if (max < V[i])
            max = V[i];
    }

    return max;
}

void main ()
{
 int VI[] = {1, 5, 3, 7, 3};
 float VF[] = {(float)1.1, (float)5.1, (float)3.1, (float)4.1};
 double VD[] = {1.1, 5.2, 3.3, 7.4, 3.5, 9.6};
 //...

 cout << "maxim (VI): " << maxim (VI, sizeof(VI)/sizeof(int)) << endl;
 cout << "maxim (VF): " << maxim (VF, sizeof(VF)/sizeof(float)) << endl;
 cout << "maxim (VD): " << maxim (VD, sizeof(VD)/sizeof(double)) << endl;
 //...
}`},
  {t:"note", kind:"info", html:`Observație: funcțiile au secvențe de cod aproape <b>identice</b>. Diferă doar tipul de date cu care lucrează și tipul returnat. Exact aici intervine template-ul.`},
  {t:"p", html:`Soluția 2: o singură funcție template, parametrizată după tipul <code>T</code>:`},
  {t:"code", cod:`template <class T>
T maxim (T V[], int n)
{
    T max = V[0];
    for (int i = 1; i < n; i++) {
        if (max < V[i])
            max = V[i];
    }

    return max;
}

void main ()
{
 int VI[] = {1, 5, 3, 7, 3};
 float VF[] = {(float)1.1, (float)5.1, (float)3.1, (float)4.1};
 double VD[] = {1.1, 5.2, 3.3, 7.4, 3.5, 9.6};
 //...

 cout << "maxim (VI): " << maxim<int> (VI, sizeof (VI)/sizeof (int))<< endl;
 cout << "maxim (VF): " << maxim<float> (VF, sizeof (VF)/ sizeof (double)) << endl;
 cout << "maxim (VD): " << maxim<double> (VD, sizeof (VD)/ sizeof (double)) << endl;
}`},
  {t:"code", cod:`maxim (VI): 7
maxim (VF): 5.1
maxim (VD): 9.6
Press any key to continue . . .`},
  {t:"ul", items:[
    `Sintaxa <code>template &lt;class T&gt;</code> se poate înlocui echivalent cu <code>template &lt;typename T&gt;</code>.`,
    `Similar funcțiilor, se pot defini și <b>clase generice</b> (clase template) care conțin sau lucrează cu date membre generice.`,
  ]},

  {t:"h", html:`Template = generator de cod`},
  {t:"p", html:`Compilatorul tratează șablonul <code>maxim&lt;T&gt;</code> ca o rețetă. La fiecare utilizare cu un tip concret, generează o funcție reală separată în <code>.text</code>: <code>maxim&lt;int&gt;</code>, <code>maxim&lt;float&gt;</code>, <code>maxim&lt;double&gt;</code> sunt trei funcții distincte produse din același șablon.`},

  {t:"joc", ref:"template-instantiere"},
  {t:"h", html:`Problema II: clase Vector`},
  {t:"p", html:`Vrem o colecție de tip vector pentru orice tip. Fără template, scriem o clasă <code>VectorInt</code> completă, apoi o <b>clonăm</b> pentru fiecare tip (<code>VectorFloat</code>, <code>VectorComplex</code>, <code>VectorStudent</code> ...).`},
  {t:"code", cod:`class VectorInt {
    std::string  m_Name;
    int          m_Values[1000];
    int          m_Count;

public:
    VectorInt(const char *name, int V[], int n);
    void print();
    void addElem (int x);
    int& operator[] (int index);
    //...
};

VectorInt::VectorInt(const char *name, int V[], int n)
  : m_Name(name), m_Count(n)
{
    if (n > sizeof (m_Values)/sizeof (int))
        throw 1;

    for (int i = 0; i < n; i++)
        m_Values[i] = V[i];
}

void VectorInt::print ()
{
    cout << "Elem vectorului " << m_Name.c_str() << ":";
    for (int i = 0; i < m_Count; i++)
        cout << m_Values[i] << " ";
}

void VectorInt::addElem (int x)
{
    if (m_Count >= 1000)
        throw 2;

    m_Values[m_Count++] = x;
}

int& VectorInt::operator[] (int index)
{
    if (index >= m_Count)
        throw 3;

    return m_Values[index];
}`},
  {t:"code", cod:`try
  {
    VectorInt VA ("VectorA", VI, sizeof (VI)/ sizeof (int));
    //VectorInt VA ("VectorA", VI, 1001); /* genereaza excpetie int cu val 1 */
    VA.print();
    cout << endl;
    VA.addElem (9);
    VA.print();
    cout << endl;
    cout << "VA[2]: " << VA[2];
    cout << endl;
  }
  catch (int e)
  {
    cout << "Exceptie: " << e;
  }`},
  {t:"code", cod:`Elem vectorului VectorA:1 5 3 7 3
Elem vectorului VectorA:1 5 3 7 3 9
VA[2]: 3
Press any key to continue . . .`},
  {t:"p", html:`Pentru celelalte tipuri definim clase aproape identice — diferă doar tipul elementelor:`},
  {t:"code", cod:`class VectorFloat{
    float m_Values[1000];
    int m_Count;

public:
    VectorFloat (const char *name, float V[], int n);
    void print();
    void addElem (float x);
    float& operator[] (int index);
    //...
};

//...

class VectorComplex{
    Complex m_Values[1000];
    int m_Count;

public:
    VectorComplex(const char *name, Complex V[], int n);
    void print();
    void addElem (Complex x);
    Complex& operator[] (int index);
    //...
};
class VectorStudent{
    Student m_Values[1000];
    int m_Count;

public:
    VectorStudent(const char *name, Stundent V[], int n);
    void print();
    void addElem (Student x);
    Student& operator[] (int index);
    //...
};

//...`},
  {t:"note", kind:"info", html:`Rezultatul: cod <b>redundant</b>, greu de întreținut (o corecție trebuie făcută în fiecare clonă). Notă de fidelitate: în sursă apare scris <code>Stundent</code> (typo în original) la constructorul <code>VectorStudent</code>.`},

  {t:"h", html:`Soluția: clasa template <code>Vector&lt;T&gt;</code>`},
  {t:"p", html:`Definim o singură clasă generică <code>Vector</code> care memorează și prelucrează un vector de elemente de tip <code>T</code>, apoi o instanțiem pentru tipurile concrete. Metodele definite în afara clasei poartă și ele prefixul <code>template &lt;class T&gt;</code> și numele <code>Vector&lt;T&gt;::</code>.`},
  {t:"code", cod:`template <class T>
class Vector {
    std::string  m_Name;
    T            m_Values[1000];
    int          m_Count;

public:
    Vector(const char *name, T V[], int n);
    void print();
    void addElem (T x);
    T& operator[] (int index);
    //...
};

template <class T>
Vector<T>::Vector(const char *name, T V[], int n) : m_Name(name), m_Count(n)
{
    if (n > sizeof (m_Values)/sizeof (T))
        throw 1;

    for (int i = 0; i < n; i++)
        m_Values[i] = V[i];
}

template <class T>
void Vector<T>::print()
{
    cout << "Elem vectorului " << m_Name.c_str() << ":";
    for (int i = 0; i < m_Count; i++)
        cout << m_Values[i] << " ";
}

//...


void main ()
{
    int VI[] = {1, 5, 3, 7, 3};
    float VF[] = {(float)1.1, (float)5.1, (float)3.1, (float)4.1};
    double VD[] = {1.1, 5.2, 3.3, 7.4, 3.5, 9.6};
    //...

    try
    {
        Vector<int> VA ("VectorA", VI, sizeof (VI)/ sizeof (int));`},
  {t:"code", cod:`        VA.print();
        cout << endl;

        Vector<float> VB ("VectorB", VF, sizeof (VF)/ sizeof (float));
        VB.print();
        cout << endl;

        Vector<double> VC ("VectorC", VD, sizeof (VD)/ sizeof (double));
        VC.print();
        cout << endl;

    }
    catch (int e)
    {
        cout << "Exceptie: " << e;
    }
}`},
  {t:"code", cod:`Elem vectorului VectorA:1 5 3 7 3
Elem vectorului VectorB:1.1 5.1 3.1 4.1
Elem vectorului VectorC:1.1 5.2 3.3 7.4 3.5 9.6
Press any key to continue . . .`},

  {t:"h", html:`Instanțierea (lazy, per tip)`},
  {t:"ul", items:[
    `Generarea clasei <code>Vector</code> pentru <code>int</code> are loc <b>numai dacă</b> se face instanțierea unui <code>Vector&lt;int&gt;</code>.`,
    `Generarea funcției <code>maxim</code> pentru un tip se face <b>numai dacă</b> există cel puțin un apel al funcției template pentru acel tip.`,
    `Atenție: la instanțiere, tipul care ia locul lui <code>T</code> trebuie să suporte operațiile concrete în care e implicat <code>T</code> (sintaxa, operatorii din expresii etc.). Ex: <code>maxim</code> are nevoie de <code>operator&lt;</code>; <code>Vector::print</code> are nevoie de <code>operator&lt;&lt;</code>.`,
  ]},
  {t:"note", kind:"capcana", html:`Instanțierea este <b>leneșă</b> (lazy): un template care nu e folosit pentru un tip anume nu generează cod pentru acel tip. Consecință: o eroare „ascunsă" în template (ex. folosirea unui operator pe care <code>T</code> nu îl are) se manifestă abia la <b>instanțierea</b> pentru tipul respectiv, nu la definirea șablonului.`},

  {t:"h", html:`Observații finale`},
  {t:"ul", items:[
    `Template = tehnică de reutilizare de cod: <i>write once – use during multiple cases</i>.`,
    `Este o altă formă de polimorfism în C++, alături de supraîncărcarea funcțiilor și operatorilor și de mecanismul metodelor virtuale suprascrise în derivate.`,
    `Polimorfismul prin template este <b>static</b> (rezolvat la compilare, fără cost de v-table), spre deosebire de polimorfismul <b>dinamic</b> al metodelor virtuale (run-time).`,
  ]},
]},
{ id:"stl", nume:"10 · STL", blocks:[
  {t:"p", html:`<b>STL (Standard Template Library)</b> e o colecție de clase deja implementate care îți dau gratuit structuri de date, parcurgere și algoritmi. Trei piese se combină: <b>containere</b> (vector, list, map, set...), <b>iteratori</b> (parcurg containerul) și <b>algoritmi</b> (sort, reverse, binary_search...). Aproape totul e bazat pe <b>template-uri</b>, deci funcționează pentru orice tip de date.`},
  {t:"h", html:`Ce este STL`},
  {t:"ul", items:[
    `Colecție de clase de tip <b>container</b> (liste, vectori, map-uri, hash-map-uri, set-uri, queue-uri, stack-uri) plus clasa <code>string</code>.`,
    `Clasa <code>string</code>: alocare automată de spațiu, căutări, concatenări etc.`,
    `<b>Algoritmi</b> dedicați și optimizați: sortări, căutări, rotații, merge-uri, min/max.`,
    `Acum e inclus deja în standard (<b>C++ Standard Library</b>). Necesită namespace-ul <code>std</code>.`,
    `Clasele și funcțiile sunt în general bazate pe <b>template-uri</b>.`,
  ]},
  {t:"table", head:[`Container`, `La ce folosește`], rows:[
    [`vector&lt;T&gt;`, `Tablou cu alocare dinamică automată; acces prin index <code>[]</code>, <code>push_back</code>.`],
    [`list&lt;T&gt;`, `Listă dublu înlănțuită; inserări/ștergeri ieftine; <b>fără</b> indexare.`],
    [`map&lt;K,V&gt;`, `Dicționar cheie&nbsp;&rarr;&nbsp;valoare, implementat pe arbori (sortat după cheie).`],
    [`set&lt;T&gt;`, `Mulțime de elemente unice, sortată automat.`],
    [`string`, `Șir de caractere cu alocare automată, căutări, concatenări.`],
  ]},
  {t:"h", html:`Iteratori`},
  {t:"p", html:`Toate containerele (list, vector, map, set...) permit parcurgerea cu <b>iteratori</b>. Iteratorul e de fapt un <b>pointer</b> care parcurge elementele containerului. <code>begin()</code> dă iteratorul la primul element, <code>end()</code> dă iteratorul <b>după ultimul</b> (poziție santinelă, nu un element valid).`},
  {t:"ul", items:[
    `Declarare: <code>std::vector&lt;int&gt;::iterator it;</code>`,
    `Acces la element prin dereferențiere: <code>*it</code>.`,
    `Avans/recul: <code>it++</code>, <code>it--</code>.`,
  ]},
  {t:"note", kind:"capcana", html:`<code>end()</code> NU pointează spre ultimul element, ci spre poziția <b>de după</b> el. De aceea condiția de buclă e <code>it != container.end()</code>, nu <code>it &lt;= ...</code>. Dereferențierea lui <code>end()</code> e comportament nedefinit.`},
  {t:"code", cod:`for(it=iset.begin(); it != iset.end(); it++)
    cout << " " << *it;`},
  {t:"h", html:`set + binary_search`},
  {t:"p", html:`Un <code>set</code> e o mulțime: elementele sunt <b>unice</b> și <b>sortate automat</b>. Mai jos inserăm 5, 9, 1, 8, 3 dar la afișare ies ordonate. <code>binary_search</code> e un algoritm STL care cere un interval sortat — perfect pentru set.`},
  {t:"code", cod:`#include <iostream>
#include <set>
#include <algorithm>
using namespace std;

void main()
{
    set<int> iset;

    iset.insert(5);
    iset.insert(9);
    iset.insert(1);
    iset.insert(8);
    iset.insert(3);

    cout << "iset contine:";
    set<int>::iterator it;
    for(it=iset.begin(); it != iset.end(); it++)
        cout << " " << *it;

    cout << endl;
    cout << "Introduceti valoarea cautata: ";
    int searchFor;
    cin >> searchFor;

    if(binary_search(iset.begin(), iset.end(), searchFor))
        cout << "S-a gasit valoarea: " << searchFor << endl;
    else
        cout << "Nu s-a gasit valoarea: " << searchFor << endl;

    cout << endl;
}`},
  {t:"note", kind:"nuanta", html:`Deși valorile au fost inserate <code>5 9 1 8 3</code>, ies sortate: <code>1 3 5 8 9</code>. <code>std::set</code> sortează automat — de aceea <code>binary_search</code> (care cere interval sortat) e corect aici fără să sortezi manual.`},
  {t:"h", html:`Algoritmi: sort / rotate / reverse`},
  {t:"p", html:`Algoritmii STL lucrează pe <b>intervale</b> definite prin doi iteratori (sau pointeri): <code>[first, last)</code>. Pentru un tablou C de 7 elemente, intervalul e <code>a</code> ... <code>a+7</code>.`},
  {t:"code", cod:`#include <iostream>
#include <algorithm>
using namespace std;

void printArray(const int arr[], const int len)
{
    for(int i = 0; i < len; i++)
        cout << " " << arr[i];
    cout << endl;
}

void main()
{
    int a[] = {5, 7, 2, 1, 4, 3, 6};

    sort(a, a+7);
    printArray(a, 7);

    rotate(a,a+3,a+7); /* roteste la stanga intre a si a+7 (a+3 sa ajunga primul) */
    printArray(a, 7);

    reverse(a, a+7);
    printArray(a, 7);

    cout << endl;
}`},
  {t:"p", html:`Ieșire: <code>1 2 3 4 5 6 7</code> (după sort), apoi <code>4 5 6 7 1 2 3</code> (după rotate — <code>a+3</code> adică al 4-lea element ajunge primul), apoi <code>3 2 1 7 6 5 4</code> (după reverse).`},
  {t:"h", html:`Vector`},
  {t:"p", html:`<b>Vectorul</b> e echivalentul unui tablou C, dar cu memorie alocată <b>dinamic și automat</b>, la nevoie, fără intervenția ta. Permite acces prin index <code>[]</code>, <code>const_iterator</code> (parcurgere fără modificare) și <code>reverse_iterator</code> (parcurgere de la coadă cu <code>rbegin()</code>/<code>rend()</code>).`},
  {t:"code", cod:`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

void main() {
    vector<string> SS;
    SS.push_back("The number is 10");
    SS.push_back("The number is 20");
    SS.push_back("The number is 30");

    cout << "Loop by index:" << endl;
    for(int ii=0; ii < (int) SS.size(); ii++)
        cout << SS[ii] << endl;

    cout << endl << "Constant Iterator:" << endl;
    vector<string>::const_iterator cii;
    for(cii=SS.begin(); cii!=SS.end(); cii++)
        cout << *cii << endl;

    cout << endl << "Reverse Iterator:" << endl;
    vector<string>::reverse_iterator rii;
    for(rii=SS.rbegin(); rii!=SS.rend(); ++rii)
        cout << *rii << endl;

    cout << endl << "Sample Output:" << endl;
    cout << SS.size() << endl;
    cout << SS[2] << endl;

    swap(SS[0], SS[2]);
    cout << SS[2] << endl << endl;
}`},
  {t:"note", kind:"nuanta", html:`<code>swap(SS[0], SS[2])</code> interschimbă cele două elemente. După swap, <code>SS[2]</code> conține ce era în <code>SS[0]</code> ("The number is 10").`},
  {t:"p", html:`Instanțiere simplă cu numere întregi — <code>push_back</code> adaugă la coadă, <code>pop_back</code> scoate ultimul:`},
  {t:"code", cod:`#include <vector>
std::vector<int> int_list;
//...
int_list.push_back(1);
int tmp = int_list[0];      // tmp = 1
int_list.pop_back();        // int_list now empty`},
  {t:"h", html:`List`},
  {t:"p", html:`<code>list</code> e echivalentul unei <b>liste dublu înlănțuite</b>. Permite adăugare/ștergere de elemente, parcurgere prin iteratori, sortare, curățare (<code>clear</code>).`},
  {t:"note", kind:"capcana", html:`La <code>list</code> <b>NU</b> e permisă accesarea elementelor prin indexare (<code>list[i]</code> nu există). Trebuie să parcurgi cu iteratori. Asta e diferența cheie față de <code>vector</code>.`},
  {t:"code", cod:`#include <iostream>
#include <list>
using namespace std;

void main()
{
    std::list<int> int_list;
    int_list.push_back(1);
    int_list.push_back(2);
    int_list.push_back(3);
    cout << "Nr elemente din lista: " << int_list.size() << endl;

    for (std::list<int>::iterator it = int_list.begin(); it != int_list.end(); it++)
    {
        cout << *it << " ";
    }

    cout << endl;

    int_list.clear();
    cout << "Nr elemente din lista: " << int_list.size() << endl;
    cout << endl << endl;
}`},
  {t:"h", html:`Map`},
  {t:"p", html:`<code>map</code> e echivalentul unui <b>dicționar</b> (cheie&nbsp;&rarr;&nbsp;valoare), cu implementare bazată pe <b>arbori</b>. Accesezi/inserezi cu operatorul <code>[]</code> aplicat cheii.`},
  {t:"code", cod:`#include <map>
…
std::map<char, int> letter_to_int;
letter_to_int['a'] = 1;
letter_to_int['b'] = 2;
int pos = letter_to_int['a'] // pos = 1;`},
  {t:"note", kind:"info", html:`Recapitulare examen: STL = containere + string + iteratori + algoritmi (template-based), incluse în C++ Standard Library, necesită <code>std</code>. <code>set</code> sortează automat; <code>binary_search</code> cere interval sortat. Iteratorul = pointer (<code>*it</code>, <code>it++</code>, <code>it--</code>). <code>vector</code> = tablou cu alocare dinamică, permite <code>[]</code>. <code>list</code> = dublu înlănțuită, FĂRĂ indexare. <code>map</code> = dicționar pe arbori.`},
]},
{ id:"exceptii", nume:"12 · Mecanismul de excepții", blocks:[
  {t:"p", html:`Excepțiile sunt facilități C++ pentru tratarea cazurilor speciale la <b>run-time</b> (ex. erori critice). Ideea de bază: o componentă (ex. o bibliotecă) <b>detectează</b> eroarea dar nu știe ce să facă cu ea; alt modul (ex. programul principal) e mai în măsură să <b>decidă</b>. Excepțiile separă <b>detectarea</b> erorii de <b>tratarea</b> ei.`},
  {t:"h", html:`De ce excepții: throw / try / catch`},
  {t:"ul", items:[
    `Un segment de cod <b>aruncă</b> o excepție (<code>throw</code>); alt segment o <b>prinde</b> (<code>catch</code>).`,
    `<code>try</code> delimitează zona unde se face captarea excepțiilor.`,
    `<code>throw</code> generează excepția, furnizând o <b>valoare</b> (cu un tip concret).`,
    `<code>catch</code> identifică <b>tipul</b> excepției și definește handler-ul de tratare; la nivelul lui valoarea excepției e disponibilă.`,
    `La aruncare, stiva de apeluri e descărcată până la funcția care prinde excepția — mecanismul <b>stack unwinding</b>.`,
    `Dacă nu există catch potrivit, programul se încheie abrupt (<b>unhandled exception</b>).`,
  ]},
  {t:"code", cod:`#include <iostream>
using namespace std;

int main(void)
{
    char *p = NULL;
    cout << "Start" << endl;
    try
    {
        cout << "Inside try block" << endl;

        if (p == NULL)
            throw 100;  // aici "arunca" exceptie de tip int

        cout << "This will not execute";
    }
    catch (int i)
    {
        cout << "Caught an exception --value is: ";
        cout << i << endl;
    }

    cout << "End" << endl;
    return 0;
}`},
  {t:"p", html:`Ieșire: <code>Start</code> / <code>Inside try block</code> / <code>Caught an exception --value is: 100</code> / <code>End</code>. Linia <code>"This will not execute"</code> e sărită — după <code>throw</code> execuția sare direct în <code>catch</code>.`},
  {t:"note", kind:"capcana", html:`Excepțiile sunt <b>specifice pe tip</b>. Dacă arunci <code>throw 100</code> (un <code>int</code>) dar ai doar <code>catch (double d)</code>, NU există catch potrivit (<code>int</code>&nbsp;&ne;&nbsp;<code>double</code>, fără conversie) — excepția rămâne netratată și programul se închide abrupt. Tipul aruncat trebuie să fie identic cu tipul prins.`},
  {t:"h", html:`Propagarea: throw dintr-o funcție apelată în try`},
  {t:"p", html:`<code>throw</code> poate fi apelat și dintr-o funcție aflată pe stiva de apeluri pornită în interiorul blocului try. Atunci: execuția funcției se oprește, se iese din funcție, iar excepția se <b>propagă în sus</b> pe stivă până la primul <code>catch</code> potrivit ca tip.`},
  {t:"code", cod:`void my_func(int test)
{
    cout << "Inside my_func, test is:" << test << endl;
    if (test)
        throw test;
}

int main(void)
{
    cout << "Start: " << endl;
    try
    {
        cout << "Inside try block" << endl;

        my_func(1);

        my_func(2);

        my_func(0);
    }
    catch (int i)
    {
        cout << "Caught an exception. Value is: ";
        cout << i << endl;
    }
    cout << "End " << endl;
    return 0;
}`},
  {t:"note", kind:"capcana", html:`La primul apel <code>my_func(1)</code> se face <code>throw</code> → excepția propagă spre <code>catch</code> din <code>main</code>. Apelurile următoare <code>my_func(2)</code> și <code>my_func(0)</code> <b>NU se mai execută</b> deloc: throw-ul abandonează tot restul blocului try. Ieșire: <code>...test is:1</code> apoi <code>Caught... Value is: 1</code>, apoi <code>End</code>.`},
  {t:"joc", ref:"exceptii-unwinding"},
  {t:"h", html:`Diagrama: stack unwinding`},
  {t:"p", html:`La <code>throw</code> stiva de apeluri se <b>derulează</b> (unwinds) din vârf în jos: se ies din cadrele <code>f3</code>, <code>f2</code> până la cadrul care are <code>catch</code>-ul potrivit (<code>f1</code>). Pentru fiecare <b>obiect local</b> distrus pe drum se apelează <b>destructorul</b> lui.`},
  {t:"h", html:`catch(...) — prinde orice`},
  {t:"p", html:`Un bloc <code>catch (...)</code> (cu trei puncte) e handler-ul <b>implicit</b>: prinde <b>orice</b> tip de excepție care nu s-a potrivit cu un catch explicit. Poate exista un singur <code>catch(...)</code> per try și se pune ultimul.`},
  {t:"code", cod:`void my_func(int test)
{
    try
    {
        if (test==0) throw test;
        if (test==1) throw 'a';
        if (test==2) throw 4.5;
    }
    catch (char e)
    {
        cout << "Caught exception char: " << e << endl;
    }
    catch (...)
    {
        cout << "Caught default" << endl;
    }
}`},
  {t:"p", html:`<code>my_func(1)</code>&rarr;<code>'a'</code>&rarr;<code>catch(char)</code>; <code>my_func(2)</code>&rarr;<code>4.5</code> (double) și <code>my_func(0)</code>&rarr;<code>int</code> cad amândouă pe <code>catch(...)</code>.`},
  {t:"note", kind:"info", html:`Recomandare din curs: în <code>main</code> pune întotdeauna un <code>try ... catch (...)</code> generic. Motiv: dacă o excepție rămâne netratată, mecanismul de stack unwinding <b>nu e garantat</b> — destructorii s-ar putea să nu ruleze.`},
  {t:"h", html:`Re-throw: throw;`},
  {t:"p", html:`Un <code>catch</code> poate <b>retransmite</b> excepția mai departe după ce o tratează parțial, folosind <code>throw;</code> (fără operand). Excepția curentă e relansată și căutată mai sus pe stivă.`},
  {t:"code", cod:`void my_func (void)
{
    try
    {
        throw "hello";
    }
    catch (char *e)
    {
        cout << "Caught char * inside my_func: " << e << endl;
        throw;
    }
}

int main()
{
    cout << "Start: " << endl;
    try
    {
        my_func ();
    }
    catch (char *e)
    {
        cout << "Caught char * inside main: " << e << endl;
    }
    catch (...)
    {
        cout << "Caught default inside main" << endl;
    }

    cout << "End " << endl;
    return 0;
}`},
  {t:"p", html:`Excepția e prinsă întâi în <code>my_func</code> (afișează "...inside my_func: hello"), apoi <code>throw;</code> o trimite la <code>catch</code>-ul din <code>main</code> (afișează "...inside main: hello").`},
  {t:"note", kind:"nuanta", html:`<code>throw;</code> (gol) relansează <b>aceeași</b> excepție prinsă. Diferă de <code>throw e;</code> care ar putea crea o copie / poate pierde tipul dinamic. Folosește <code>throw;</code> simplu pentru re-throw fidel.`},
  {t:"h", html:`Clase de excepții proprii`},
  {t:"p", html:`Poți defini propriul tip de excepție ca o <b>clasă</b> (ex. <code>My_Exception</code> cu cod și mesaj). De obicei se prinde <b>prin referință</b> (<code>catch (My_Exception &e)</code>) ca să eviți copierea inutilă.`},
  {t:"code", cod:`class My_Exception
{
    int     m_Code;     // cod de eroare
    std::string m_Message;  // mesaj de eroare
public:
    My_Exception (int code = 0, const char *msg = "")
        : m_Code(code), m_Message (msg)
        {}

    std::string& message()  {return m_Message; }
    int     code()      {return m_Code; }
};

void my_func(int test)
{
    try
    {
        if (test==0) throw My_Exception (1001, "incorect value");
        if (test==1) throw 'a';
        if (test==2) throw 4.5;
    }
    catch (char)
    {
        cout << "Caught exception character " << endl;
    }
    catch (int)
    {
        cout << "Caught exception integer " << endl;
    }
    catch (double e)
    {
        cout << "Caught exception double: " << e << endl;
    }
    catch (My_Exception &e)
    {
        cout << "Caught exception My_Exception: ";
        cout << e.message().c_str() << " (code: " << e.code() << ") " << endl;
    }
}`},
  {t:"note", kind:"nuanta", html:`Dacă prinzi <code>catch (My_Exception e)</code> <b>prin valoare</b> (fără <code>&</code>), se creează o <b>clonă</b> a excepției (bitwise-copy sau prin copy-constructor). De aceea se preferă prinderea prin referință <code>&</code>. Observă și că la <code>catch (char)</code> / <code>catch (int)</code> valoarea lipsește — atunci nu mai poți folosi valoarea excepției în handler.`},
  {t:"note", kind:"info", html:`O excepție poate fi aruncată și pe <b>heap</b>: <code>throw new My_Exception(...)</code>. Atunci o prinzi cu un catch pe <b>pointer</b> (<code>catch (My_Exception *e)</code>) și trebuie să faci <code>delete e;</code> tu manual.`},
  {t:"h", html:`Ierarhia std::exception`},
  {t:"p", html:`Biblioteca standard definește în <code>&lt;exception&gt;</code> o ierarhie de clase de excepții, cu rădăcina <code>std::exception</code>. Din ea derivă <code>logic_error</code> (erori detectabile teoretic citind codul) și <code>runtime_error</code> (erori care apar doar la execuție), plus <code>bad_alloc</code>, <code>bad_cast</code> etc.`},
  {t:"table", head:[`Exception`, `Description`], rows:[
    [`std::exception`, `An exception and parent class of all the standard C++ exceptions.`],
    [`std::bad_alloc`, `This can be thrown by <b>new</b>.`],
    [`std::bad_cast`, `This can be thrown by <b>dynamic_cast</b>.`],
    [`std::bad_exception`, `This is useful device to handle unexpected exceptions in a C++ program`],
    [`std::bad_typeid`, `This can be thrown by <b>typeid</b>.`],
    [`std::logic_error`, `An exception that theoretically can be detected by reading the code.`],
    [`std::domain_error`, `This is an exception thrown when a mathematically invalid domain is used`],
    [`std::invalid_argument`, `This is thrown due to invalid arguments.`],
    [`std::length_error`, `This is thrown when a too big std::string is created`],
    [`std::out_of_range`, `This can be thrown by the at method from for example a std::vector and std::bitset&lt;&gt;::operator[].`],
    [`std::runtime_error`, `An exception that theoretically can not be detected by reading the code.`],
    [`std::overflow_error`, `This is thrown if a mathematical overflow occurs.`],
    [`std::range_error`, `This is occured when you try to store a value which is out of range.`],
    [`std::underflow_error`, `This is thrown if a mathematical underflow occurs.`],
  ]},
  {t:"note", kind:"info", html:`Concluzii examen: un <code>throw</code> e practic echivalent cu un <b>return multiplu</b> din mai multe funcții. La derularea stivei se distrug toate obiectele locale create între <code>try</code> și <code>throw</code>, apelând destructorul fiecăruia. Erorile din <b>constructor / destructor</b> se pot semnala <b>doar</b> prin excepții (aceste metode nu întorc status). NU există move/copy implicit pentru asta — se recomandă mereu folosirea mecanismului de excepții.`},
]},
{ id:"cpp11", nume:"13 · C++11", blocks:[
  {t:"p", html:`<b>C++11</b> (Septembrie 2011) e o revizie majoră peste C++03: lambda, <code>auto</code>/<code>decltype</code>, <code>nullptr</code>, inițializare uniformă <code>{ }</code>, delegarea constructorilor, referințe rvalue și <b>move semantics</b>. Stroustrup: „C++11 feels like a new language". Aici e <b>Modern C++</b>.`},
  {t:"h", html:`Expresii lambda`},
  {t:"p", html:`O <b>lambda</b> e o funcție anonimă (fără nume) scrisă <b>in-place</b>, local, în interiorul altei funcții. Sintaxa: <code>[capture list] (parameter list) {function body}</code>. Compilatorul deduce tipul de return din expresia de la <code>return</code> (void dacă nu există return).`},
  {t:"code", cod:`// aplicam expresia lambda definita in-place, pentru fiecare intreg din lista
for_each(int_list.begin(), int_list.end(), [](int i) {cout << ":" << i << ":"; });`},
  {t:"p", html:`O lambda poate fi salvată într-o variabilă cu <code>auto</code>, sau scrisă cu <b>trailing return type</b> (<code>-&gt; int</code>):`},
  {t:"code", cod:`auto func1 = [](int i) {cout << ":" << i << ":";};
func1(42);

// trailing return type: 3.14 + 2.7 = 5.84, trunchiat la int = 5
[](double x, double y) -> int {return x + y;} (3.14, 2.7);`},
  {t:"h4", html:`Captura: [=] valoare vs [&] referință`},
  {t:"p", html:`Lambda poate <b>captura</b> contextul (variabile locale/membre). <code>[x]</code> captură <b>prin valoare</b> (copie, nu modifică originalul); <code>[&x]</code> captură <b>prin referință</b> (poate modifica originalul). Formele globale: <code>[=]</code> tot prin valoare, <code>[&]</code> tot prin referință.`},
  {t:"code", cod:`char s[]="Hello World!";
int Uppercase = 0; // va fi modificat de lambda

for_each (s, s+sizeof(s), [&Uppercase] (char c) {
    if (isupper(c))
        Uppercase++;
});

cout << Uppercase << " uppercase letters in: " << s <<endl;`},
  {t:"note", kind:"capcana", html:`Fără <code>&</code> la captură (deci prin valoare), <code>Uppercase++</code> ar da <b>eroare de compilare</b>: variabila capturată prin valoare e <b>const</b> în corpul lambda. Ca să modifici originalul din afară, trebuie captură prin referință <code>[&Uppercase]</code>.`},
  {t:"h4", html:`Range-based for`},
  {t:"p", html:`C++11 adaugă forma simplificată de <code>for</code> peste o colecție. Cu <code>int&amp; x</code> sau <code>auto&amp; x</code> poți <b>modifica</b> elementele; cu <code>auto x</code> doar le citești (copie).`},
  {t:"code", cod:`int my_array[5] = {1, 2, 3, 4, 5};

for (int& x : my_array) {
    x *= 2;
}

for (auto& x : my_array) {
    x *= 2;
}

for (auto x : my_array)
    std::cout << x << " ";

std::cout << std::endl;`},
  {t:"note", kind:"nuanta", html:`Aici elementele sunt înmulțite cu 2 de <b>două</b> ori (două bucle cu referință), deci ×4 în total: ieșirea e <code>4 8 12 16 20</code>. A treia buclă folosește <code>auto x</code> (copie) — afișează fără să mai modifice.`},
  {t:"h", html:`auto și decltype`},
  {t:"p", html:`<code>auto</code> = deducerea automată a tipului din expresia de inițializare. Necesită <b>obligatoriu</b> o inițializare. <code>decltype(expr)</code> = preia tipul unei expresii ca să-l refolosești.`},
  {t:"code", cod:`auto x = 0;     // x este de tipul int deoarece 0 este o constanta int
auto c = 'a';       // char
auto d = 0.5;       // double
auto v = 14400000000000LL; // long long

typedef decltype (x) INT;   // INT este int
INT y;
y = 9;

decltype (v) t;     // t este long long
t = 1;`},
  {t:"note", kind:"capcana", html:`Deși pare că tipul se decide la execuție, <code>auto</code> și <code>decltype</code> sunt rezolvate de compilator la <b>build-time</b>, nu la runtime. <code>sizeof(y)</code> dă 4 (int), <code>sizeof(t)</code> dă 8 (long long) — fixate la compilare. Sensul lui <code>auto</code> e total diferit de cel moștenit din C.`},
  {t:"h", html:`nullptr (vs NULL)`},
  {t:"p", html:`În C++03, <code>NULL</code> era adesea <code>#define NULL 0</code> — o constantă întreagă. C++11 introduce <code>nullptr</code>, care e <b>exclusiv</b> un pointer nul. Recomandat oriunde în locul lui <code>NULL</code>, pentru a elimina ambiguități la overload.`},
  {t:"code", cod:`void f (int);
void f (foo *);

f (0);        // apeleaza f(int)
f (NULL);     // ambiguu / apeleaza f(int) — NULL e de fapt 0
f (nullptr);  // apeleaza f(foo*) clar

// echivalente:
X* ptr = nullptr;
X* ptr = NULL;
X* ptr = 0;`},
  {t:"note", kind:"capcana", html:`<code>f(NULL)</code> cheamă <code>f(int)</code> (nu <code>f(foo*)</code>) fiindcă <code>NULL</code> e literalmente <code>0</code>, un întreg. <code>f(nullptr)</code> cheamă fără ambiguitate varianta pe pointer — exact motivul pentru care există <code>nullptr</code>.`},
  {t:"h", html:`Inițializare uniformă { } și delegarea constructorilor`},
  {t:"p", html:`C++11 permite inițializarea cu acolade <code>{ }</code> (uniformă) și inițializarea in-class a membrilor. Containerele STL se pot inițializa direct, fără <code>push_back</code>.`},
  {t:"code", cod:`C c {0,0};                       // C++11, echivalent cu C c(0,0)
int* a = new int[3] { 1, 2, 0 }; // C++11

class D {
    int a = 7;                   // initializarea in-class a datelor membre
public:
    D ();
};

// initializare container fara push_back:
std::vector<string> vs = { "first", "second", "third"};`},
  {t:"p", html:`<b>Delegarea constructorilor</b>: un constructor poate apela alt constructor al aceleiași clase (în loc de cod duplicat sau o funcție <code>init</code> separată). Se formează un <b>lanț de delegare</b>.`},
  {t:"code", cod:`class A {
public:
    A(): A(0) { }

    A(int i): A(i, 0) { }

    A(int i, int j) {
        num1=i;
        num2=j;
        average=(num1+num2)/2;
    }

private:
    int num1;
    int num2;
    int average;
};`},
  {t:"note", kind:"nuanta", html:`Avantaj: un constructor delegat NU poate fi apelat accidental ca metodă obișnuită (problema cu funcția <code>init</code> separată). Atenție la <b>delegarea recursivă</b> (constructori care se cheamă în cerc) — nerecomandat.`},
  {t:"h", html:`Referințe rvalue: lvalue vs rvalue`},
  {t:"p", html:`<b>lvalue</b> = expresie cu <b>adresă</b> (poți aplica <code>&amp;</code>), persistă mai mult de o utilizare; de regulă un <i>nume</i>. <b>rvalue</b> = expresie <b>fără adresă</b>, temporară (obiect anonim, literal), nu persistă. Testul rapid: dacă poți lua adresa cu <code>&amp;</code>, e lvalue.`},
  {t:"cmp", left:{title:`lvalue`, html:`Are adresă (<code>&amp;a</code> e valid). Persistă. Poate sta în <b>stânga</b> sau dreapta lui <code>=</code>. De regulă: un nume.<br><code>int a = 42; a = b; &amp;a; // OK</code>`}, right:{title:`rvalue`, html:`NU are adresă (<code>&amp;(a*b)</code> e eroare). Temporar, nepersistent. Numai în <b>dreapta</b> lui <code>=</code>. Literali, obiecte temporare, return-uri.<br><code>int c = a * b; // a*b e rvalue</code>`}},
  {t:"p", html:`O <b>referință rvalue</b> se scrie <code>T&amp;&amp;</code> și leagă numai rvalue-uri. <code>std::move(x)</code> e o <b>conversie</b> necondiționată care transformă un lvalue într-o rvalue-reference (nu mută nimic singur). Astfel poți face overload <code>f(int&amp;)</code> vs <code>f(int&amp;&amp;)</code>:`},
  {t:"code", cod:`#include <iostream>

void f(int& i) { std::cout << "lvalue ref: " << i << "\\n"; }
void f(int&& i) { std::cout << "rvalue ref: " << i << "\\n"; }

int main()
{
    int i = 77;
    f(i);   // lvalue ref called
    f(99);  // rvalue ref called

    f(std::move(i));    // rvalue ref called

    return 0;
}`},
  {t:"note", kind:"capcana", html:`<code>std::move</code> NU mută date prin el însuși — e doar un <b>cast</b> la rvalue-reference. Mutarea efectivă se întâmplă în move-constructor / move-assignment, care sunt aleși de compilator <i>pentru că</i> argumentul a devenit rvalue. Atenție: un parametru formal cu nume (ex. <code>str</code> în <code>f(string&amp;&amp; str)</code>) e el însuși un <b>lvalue</b>.`},
  {t:"h", html:`Move semantics și move constructor`},
  {t:"p", html:`Copierea (deep-copy) la return / push_back e ineficientă: obiectul destinație clonează tot conținutul sursei, deși sursa (un temporar) e aruncată imediat după. <b>Move semantics</b> înlocuiește copierea cu <b>mutarea ownership-ului</b> resurselor („resource pilfering"): destinația <b>fură pointerul</b>, sursa rămâne goală.`},
  {t:"code", cod:`std::string foo = "foo-string";
std::string bar = "bar-string";
std::vector<std::string> myvector;

myvector.push_back (foo);           // copies
myvector.push_back (std::move(bar));     // moves
// dupa move, bar ramane valid dar cu valoare nedefinita (golit)`},
  {t:"p", html:`Pentru clasa <code>MemoryBuff</code> (ține un buffer pe heap prin <code>mpData</code>), <b>move constructor</b> primește <code>T&amp;&amp;</code>, fură pointerul în loc să copieze, apoi <b>golește sursa</b> (<code>nullptr</code> / 0) ca destructorul să nu elibereze de două ori aceeași memorie.`},
  {t:"code", cod:`MemoryBuff::MemoryBuff (MemoryBuff&& other)
    : mSize (0), mpData (nullptr)
{
    cout << "In move-constructor, this=0x" << this << ", muta resursele din other=0x"
        << &other << " (mSize = " << other.mSize << ")" << endl;

    // transfera ownership-ul asupra resurselor
    mpData = other.mpData;
    mSize = other.mSize;

    // foarte important: invalidarea resurselor din vechiul obiect (il pune intr-o stare "empty")
    other.mpData = nullptr; // invalideaza resursele din other (au fost mutate)
                // in acest fel, destructorul nu le dezaloca de doua ori
    other.mSize = 0;
}`},
  {t:"h4", html:`Diagrama: move „fură" pointerul`},
  {t:"p", html:`Două obiecte au pointeri spre buffere pe heap. La move, <b>dst</b> preia bufferul lui <b>src</b>, iar <b>src</b> e setat pe <code>nullptr</code> (nu mai deține nimic). NU se copiază bufferul — doar se mută pointerul.`},
  {t:"note", kind:"capcana", html:`NU există move-constructor <b>implicit</b> generat de compilator (spre deosebire de copy-constructor). Dacă nu-l implementezi, situațiile cu rvalue cad pe copy-constructor. Periculos: ai <b>move-constructor dar fără copy-constructor explicit</b> → clonarea lvalue folosește bitwise-copy → mai multe obiecte indică spre <b>același</b> buffer → <b>dublă dezalocare</b> / corupere heap (Debug Assertion Failed: <code>_BLOCK_TYPE_IS_VALID</code>).`},
  {t:"joc", ref:"move"},
  {t:"h", html:`Move assignment`},
  {t:"p", html:`La fel ca la constructor, operatorul de asignare poate avea o variantă <b>move</b> cu parametru <code>T&amp;&amp;</code>: verifică self-assignment, fură resursele, golește sursa.`},
  {t:"code", cod:`MemoryBuff& MemoryBuff::operator= (MemoryBuff&& other)
{
    cout << "In operator move-asignare, this=0x" << this << ", muta resursele din other=0x"
        << &other << " (mSize  = " << other.mSize << ")" << endl;

    if (this == &other)
        return *this;

    // transfera ownership-ul asupra resurselor
    mpData = other.mpData;
    mSize = other.mSize;

    // foarte important: invalidarea resurselor din vechiul obiect (il pune intr-o stare "empty")
    other.mpData = nullptr; // invalideaza resursele din other (au fost mutate)
                // in acest fel, destructorul nu le dezaloca de doua ori
    other.mSize = 0;

    return *this;
}`},
  {t:"note", kind:"info", html:`Recapitulare: <code>B = A;</code> cheamă <b>copy</b>-asignare (A e lvalue cu nume); <code>C = std::move(A);</code> cheamă <b>move</b>-asignare (A devine rvalue) și golește A. Spre deosebire de copy, variantele move NU au parametru <code>const</code> — pentru că sursa e modificată (golită). La distrugere, doar obiectele care încă dețin resurse (<code>mpData != nullptr</code>) fac <code>delete[]</code>.`},
]},

];
