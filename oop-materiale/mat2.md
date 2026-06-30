Bun. Hai să le luăm pe rând, în profunzime, cu accent pe ce se întâmplă în memorie și pe capcanele care chiar apar la interviuri grele. O să folosesc o clasă fir-roșu (`Buffer`) care deține memorie pe heap, fiindcă acolo se văd cel mai clar diferențele.

## 1. Constructorul — ce e și ce face în memorie

Un constructor nu „creează" obiectul în sensul alocării memoriei. Memoria obiectului este deja rezervată (pe stivă, pe heap sau în segmentul de date) **înainte** ca corpul constructorului să ruleze. Constructorul doar **inițializează** acea zonă deja existentă: aduce obiectul dintr-o stare brută (bytes nedefiniți) într-o stare validă conform invarianților clasei.

```cpp
class Buffer {
    size_t size_;
    int* data_;          // pointer către heap
public:
    Buffer(size_t n)
        : size_(n),                    // lista de inițializare
          data_(new int[n]())          // alocare pe heap
    {
        // corpul rulează DUPĂ ce membrii sunt deja inițializați
    }
    ~Buffer() { delete[] data_; }
};
```

Ce se întâmplă în memorie la `Buffer b(3);` declarat local:

```
STIVĂ (stack frame al funcției)
┌──────────────────────────┐
│ b.size_ = 3              │   <- 8 bytes (size_t)
│ b.data_ = 0x55a3f0      │   <- 8 bytes (pointer)
└──────────────────────────┘
                │
                ▼
HEAP
┌──────────────────────────┐
│ [0][0][0]                │   <- new int[3](), 12 bytes
└──────────────────────────┘
```

Obiectul `b` în sine ocupă 16 bytes pe stivă (size_ + data_). Datele propriu-zise sunt pe heap. **Aici e cheia tuturor problemelor cu copy/move:** obiectul de pe stivă „deține" o resursă care trăiește în altă parte.

### Lista de inițializare vs. atribuire în corp — nuanță de interviu

```cpp
Buffer(size_t n) {
    size_ = n;          // ASTA E ATRIBUIRE, nu inițializare
    data_ = new int[n];
}
```

Diferența contează enorm pentru membri care sunt `const`, referințe, sau obiecte fără constructor implicit. Membrii sunt **întotdeauna** inițializați înainte de a intra în corp. Dacă nu-i pui în lista de inițializare, ei sunt construiți cu constructorul lor implicit, iar apoi tu îi **suprascrii** prin atribuire în corp — deci faci muncă dublă. Pentru un `const int` sau o referință, atribuirea în corp nici nu compilează, fiindcă nu poți reasigna ceva ce e deja construit ca `const`.

O capcană clasică: **ordinea de inițializare a membrilor e ordinea declarării în clasă, NU ordinea din lista de inițializare.**

```cpp
class X {
    int a_;
    int b_;
public:
    X(int v) : b_(v), a_(b_) {}   // CAPCANĂ: a_ se inițializează PRIMUL (e declarat primul)
                                   // dar b_ încă nu are valoare validă -> a_ primeste gunoi
};
```

Compilatorul cu `-Wall` te avertizează aici. La interviu se întreabă des.

## 2. Moștenirea — layout în memorie și ordinea de construcție

La moștenire, un obiect derivat **conține fizic** subobiectul bazei la începutul său (în cazul simplu, fără moștenire virtuală).

```cpp
class Base {
    int x_;
public:
    Base(int x) : x_(x) {}
    virtual ~Base() {}
    virtual void f() {}
};

class Derived : public Base {
    int y_;
public:
    Derived(int x, int y) : Base(x), y_(y) {}
    void f() override {}
};
```

Layout-ul unui `Derived` în memorie:

```
┌─────────────────────────────┐  <- adresa obiectului Derived
│ vptr  -> vtable a lui Derived│   subobiectul Base
│ x_                          │
├─────────────────────────────┤
│ y_                          │   partea proprie Derived
└─────────────────────────────┘
```

Subobiectul `Base` e literalmente primii bytes. De-aia un `Base*` care arată spre un `Derived` are aceeași adresă numerică (la moștenire simplă) — pointerul arată exact spre porțiunea Base, care e la offset 0.

**Ordinea de construcție** (foarte întrebată):
1. Mai întâi subobiectul bazei (`Base(x)`)
2. Apoi membrii lui Derived, în ordinea declarării (`y_`)
3. Apoi corpul constructorului `Derived`

**Distrugerea e exact invers:** corpul destructorului `Derived`, apoi membrii lui Derived, apoi destructorul `Base`. Logic: nu poți distruge baza înainte de derivat, fiindcă derivatul s-ar putea baza pe ea.

### vptr și apeluri virtuale în timpul construcției — nuanță foarte tricky

În timpul construcției lui `Base`, `vptr`-ul arată spre vtable-ul lui **Base**, nu al lui Derived. Adică dacă apelezi o funcție virtuală din constructorul lui Base, se cheamă versiunea din Base, nu override-ul din Derived — chiar dacă obiectul final e un Derived.

```cpp
class Base {
public:
    Base() { f(); }            // apelează Base::f(), NU Derived::f()
    virtual void f() { std::cout << "Base\n"; }
};
class Derived : public Base {
public:
    void f() override { std::cout << "Derived\n"; }
};

Derived d;   // afișează "Base"
```

Motivul în memorie: când rulează constructorul lui Base, partea Derived a obiectului nici nu există încă (e bytes neinițializați), deci limbajul refuză să apeleze metode care ar putea atinge membri Derived neconstruiți. vptr-ul se „upgradează" spre vtable-ul Derived abia după ce constructorul Base se termină.

### Destructor virtual — de ce e obligatoriu la moștenire polimorfică

```cpp
Base* p = new Derived(1, 2);
delete p;   // dacă ~Base() NU e virtual -> COMPORTAMENT NEDEFINIT
```

Dacă `~Base` nu e virtual, `delete p` cheamă doar `~Base()`, nu și `~Derived()`. Membrii lui Derived (ex. un buffer alocat) nu se eliberează → memory leak, plus distrugere parțială. Cu destructor virtual, dispatch-ul prin vtable găsește `~Derived()` și lanțul rulează corect.

## 3. Copy constructor — copiere și problema shallow vs. deep

Copy constructorul creează un obiect nou ca o copie a altuia existent.

```cpp
Buffer(const Buffer& other)
    : size_(other.size_),
      data_(new int[other.size_])     // alocare NOUĂ pe heap
{
    std::copy(other.data_, other.data_ + size_, data_);
}
```

De ce semnătura e `const Buffer&` și nu `Buffer`:
- Dacă ar primi prin valoare (`Buffer other`), pentru a-l construi pe `other` ar trebui... să cheme copy constructorul → **recursie infinită**. Imposibil de compilat de fapt.
- `const` ca să poți copia și din obiecte temporare/const și ca promisiune că nu modifici sursa.

### Ce se întâmplă în memorie — copy corect (deep)

Avem `Buffer a(3); Buffer b = a;`

```
ÎNAINTE de copy:                DUPĂ deep copy:

a.data_ ──► HEAP [1][2][3]      a.data_ ──► HEAP [1][2][3]
                                b.data_ ──► HEAP [1][2][3]   (zonă SEPARATĂ, copie nouă)
```

Două obiecte independente, fiecare cu heap-ul lui. Modificarea lui `b` nu afectează `a`.

### Capcana shallow copy (copy-ul implicit generat de compilator)

Dacă **nu** scrii copy constructor, compilatorul generează unul care copiază membru cu membru. Pentru pointeri, asta înseamnă copierea **valorii pointerului**, nu a ce arată el spre:

```
a.data_ ──┐
          ├──► HEAP [1][2][3]    AMBELE arată spre ACEEAȘI zonă!
b.data_ ──┘
```

Consecințe catastrofale:
- Modifici prin `b`, se schimbă și pentru `a`.
- La distrugere: `~Buffer()` rulează pentru `b` → `delete[] data_`. Apoi rulează pentru `a` → `delete[]` pe **același** pointer deja eliberat → **double free**, crash sau corupere de heap.

Asta e motivul „Rule of Three": dacă ai nevoie de destructor custom (fiindcă deții o resursă), atunci aproape sigur ai nevoie și de copy constructor și de copy assignment operator.

## 4. Move constructor — „furtul" resursei

Ideea move-ului: în loc să copiezi datele de pe heap (scump), pur și simplu **transferă proprietatea pointerului** din sursă în destinație, și lași sursa într-o stare validă dar goală. E ieftin: doar copiezi câteva valori și anulezi sursa.

```cpp
Buffer(Buffer&& other) noexcept
    : size_(other.size_),
      data_(other.data_)        // FURĂM pointerul (nu alocăm nimic nou)
{
    other.data_ = nullptr;      // anulăm sursa ca să nu facă delete[] pe ce-am furat
    other.size_ = 0;
}
```

`Buffer&&` este o **rvalue reference** — se leagă de obiecte temporare sau de lucruri marcate explicit ca „nu-mi mai pasă de ele" (prin `std::move`).

### Ce se întâmplă în memorie — move

Pornim de la `Buffer a(3);` cu `a.data_` spre `[1][2][3]`. Facem `Buffer b = std::move(a);`

```
ÎNAINTE:
a.data_ ──► HEAP [1][2][3]
b: nu există încă

PAS 1 — copiem pointerul în b:
a.data_ ──► HEAP [1][2][3]
b.data_ ──► (acelaşi)   ── momentan ambele arată spre [1][2][3]

PAS 2 — anulăm sursa (other.data_ = nullptr):
a.data_ = nullptr        (a e gol, dar valid)
b.data_ ──► HEAP [1][2][3]   (b e acum proprietarul)
```

Niciun `new`, niciun `copy` element-cu-element. Doar mutarea unei valori de pointer + o anulare. De-aia move-ul e O(1) iar copy-ul e O(n).

Crucial: **nu se eliberează heap-ul.** Aceeași zonă de heap continuă să existe, doar că acum „aparține" lui `b`. Când `a` se distruge, `delete[] nullptr` e o operație legală și no-op. Când `b` se distruge, eliberează corect heap-ul. Fără double free, fără leak.

### Starea „moved-from" — nuanță de interviu

După move, `a` e într-o stare validă dar nespecificată. Standardul garantează doar că poți face pe el operații fără precondiții: să-l reatribui, să-l distrugi, să întrebi `size()`. **Nu** ai voie să presupui ce conține. În exemplul nostru am ales explicit să-l facem gol (`nullptr`, `size_ = 0`), ceea ce e o practică bună.

## 5. std::move — nu mută nimic

Aceasta e probabil cea mai des greșit înțeleasă chestie la interviu. **`std::move` nu mută nimic, nu generează niciun cod la runtime.** Este pur și simplu un **cast** care transformă un lvalue într-o rvalue reference (`static_cast<T&&>`). El doar **îi spune compilatorului „tratează asta ca pe ceva ce poate fi furat"**, ceea ce face ca rezoluția de overload să aleagă move constructorul în loc de copy constructorul.

```cpp
// echivalent conceptual:
template <typename T>
constexpr std::remove_reference_t<T>&& move(T&& t) noexcept {
    return static_cast<std::remove_reference_t<T>&&>(t);
}
```

Mutarea efectivă (furtul pointerului) se întâmplă **în move constructor/move assignment**, nu în `std::move`. `std::move` e doar „permisiunea".

Consecințe practice:

```cpp
Buffer a(3);
Buffer b = std::move(a);    // se cheamă move ctor, a devine gol

Buffer c(3);
const Buffer cc(3);
Buffer d = std::move(cc);   // CAPCANĂ: cc e const -> nu poate fi furat
                            // se cheamă COPY ctor, nu move. cc rămâne intact.
```

Pe un obiect `const`, `std::move` produce un `const T&&`, care nu se poate lega de move constructorul (acela cere `T&&` non-const), așa că se alege copy constructorul. Deci `std::move` pe const e tăcut inutil. Capcană tipică de interviu.

Altă subtilitate:

```cpp
std::string s = "salut";
foo(std::move(s));     // dacă foo ia prin valoare/rvalue, s POATE deveni gol
std::cout << s;        // s ar putea fi "" acum — depinde dacă foo chiar a mutat
```

`std::move` în sine nu golește pe `s`. Golirea se întâmplă doar dacă cineva chiar consumă acea rvalue printr-un move.

## 6. De ce `noexcept` la move constructor este critic

Asta e o întrebare „de senior". `std::vector`, când își mărește capacitatea, mută elementele vechi în noul buffer. Dar are o garanție de excepție tare: dacă o realocare eșuează la jumătate, vectorul trebuie să rămână neschimbat. Move-ul modifică sursele (le golește), deci dacă un move ar arunca excepție la jumătatea relocării, vectorul ar rămâne corupt și irecuperabil — copy-ul, în schimb, lasă sursele intacte.

De aceea `vector` folosește un truc: **mută elementele doar dacă move constructorul e `noexcept`; altfel le copiază** (mai lent, dar sigur). Verificarea se face cu `std::move_if_noexcept`.

```cpp
Buffer(Buffer&& o) noexcept { ... }   // vector va MUTA la realocare — rapid
Buffer(Buffer&& o)          { ... }   // vector va COPIA la realocare — lent!
```

Practic: dacă uiți `noexcept` pe move constructor, performanța vectorilor de obiecte mutabile se prăbușește în tăcere. Foarte apreciat la interviu dacă menționezi asta.

## 7. Copy elision / RVO — când nici copy nici move nu se întâmplă

```cpp
Buffer make() {
    return Buffer(5);     // NU se cheamă nici copy, nici move ctor
}
Buffer b = make();        // obiectul e construit DIRECT în b
```

Compilatorul construiește obiectul temporar direct în locația finală, sărind peste orice copiere/mutare. Din C++17 acest „guaranteed copy elision" e obligatoriu pentru temporare returnate prin valoare (prvalue). Pentru NRVO (named return value optimization — `return numeObiect;`) e permis dar nu garantat.

Capcană legată: **nu pune `std::move` pe return**.

```cpp
Buffer make() {
    Buffer local(5);
    return std::move(local);   // GREȘIT: dezactivează NRVO!
                               // forțezi un move în loc de elision (zero cost)
}
```

`std::move` pe valoarea de return împiedică compilatorul să facă elision, fiindcă acum returnezi o rvalue reference, nu obiectul în sine. Ajungi cu un move garantat în loc de nimic. Lasă pur și simplu `return local;` — compilatorul face ce trebuie.

## 8. Rule of 0 / 3 / 5 — sinteza

**Rule of 3** (pre-C++11): dacă definești unul dintre {destructor, copy constructor, copy assignment}, probabil le vrei pe toate trei — pentru că definirea unuia semnalează că gestionezi manual o resursă.

**Rule of 5** (C++11+): adaugă move constructor și move assignment.

**Rule of 0** (idealul modern): nu defini niciunul. Folosește tipuri care se ocupă singure de resurse (`std::vector`, `std::string`, `std::unique_ptr`) și lasă compilatorul să genereze totul corect. Clasa noastră `Buffer` ar trebui, ideal, să fie doar un `std::vector<int>` și gata — fără copy/move/destructor scris de mână.

Nuanță: dacă declari un destructor custom, **move constructorul și move assignment NU se mai generează automat**. Vei rămâne doar cu copy (care încă se generează pentru compatibilitate, deși e deprecated). Deci o clasă cu destructor manual dar fără move scris explicit va **copia** unde te-ai aștepta să mute — penalizare de performanță invizibilă. Capcană foarte bună de interviu.

## 9. Object slicing — capcana clasică a moștenirii cu valoare

```cpp
void process(Base b) { b.f(); }   // primește prin VALOARE

Derived d(1, 2);
process(d);     // SLICING: doar partea Base e copiată, partea Derived e tăiată
```

Când copiezi un `Derived` într-un `Base` prin valoare, copy constructorul lui `Base` copiază doar subobiectul Base. Partea `y_` dispare, iar vptr-ul devine al lui Base. Apelul `b.f()` cheamă `Base::f()`, nu override-ul. În memorie, `b` e pur și simplu mai mic — nu are loc pentru partea Derived.

Soluția: lucrează polimorfic prin **referință sau pointer** (`Base&`, `Base*`), niciodată prin valoare, când vrei comportament virtual.

---

Vrei să intru și pe **move assignment operator** cu idiomul copy-and-swap și gestiunea self-assignment, sau pe layout-ul în memorie la **moștenire multiplă/virtuală** (unde vptr-urile și offset-urile devin cu adevărat nasoale)? Astea două sunt următoarele zone „grele" tipice la interviuri serioase.