Excelent, templates sunt fix zona unde intuiția despre „ce se întâmplă în memorie" trebuie reformulată complet — pentru că **un template nu există la runtime și nu ocupă memorie ca atare**. Hai să construim modelul mental corect de la zero.

## 1. Ce este de fapt un template — un generator de cod, nu cod

Cea mai importantă idee, care răstoarnă tot: un template **nu este cod**. Este o **rețetă pe care compilatorul o folosește ca să genereze cod**. Până nu îl folosești cu tipuri concrete, nu există nimic în binar — niciun byte de cod mașină, niciun simbol, nimic.

```cpp
template <typename T>
T add(T a, T b) { return a + b; }
```

Acest `add` **nu produce nicio funcție** în fișierul obiect. Compilatorul îl ține minte ca pe un șablon. Abia când scrii:

```cpp
add(3, 5);        // T = int
add(2.0, 4.0);    // T = double
```

compilatorul **instanțiază** (generează) două funcții complet separate, ca și cum ai fi scris de mână:

```cpp
int    add(int a, int b)       { return a + b; }   // o funcție reală în binar
double add(double a, double b) { return a + b; }   // ALTĂ funcție reală în binar
```

Asta se numește **instanțiere de template** și este un proces 100% la **compile-time**. La runtime nu există „template-uri" — există doar funcțiile concrete generate, fiecare cu propria ei adresă în segmentul de cod.

### Ce înseamnă asta în memorie / în binar

```
SEGMENTUL DE COD (.text) al executabilului
┌────────────────────────────────────┐
│ add<int>:      <cod mașină>  @0x401000  │
│ add<double>:   <cod mașină>  @0x401050  │
│ ... orice altă instanțiere ...          │
└────────────────────────────────────┘
```

Fiecare instanțiere e o funcție fizic distinctă, cu adresă proprie. `&add<int> != &add<double>` — sunt funcții diferite, nu „aceeași funcție cu un parametru de tip". De aici vine fenomenul de **code bloat**: dacă instanțiezi `add` cu 20 de tipuri, ai 20 de funcții în binar. Asta e prețul performanței (zero overhead la runtime, totul rezolvat static).

Contrast util pentru interviu: la generics din Java, există **o singură** copie a codului (type erasure), iar tipul se decide la runtime cu cast-uri și boxing. În C++ e invers — fiecare tip primește propriul cod specializat, optimizat de compilator pentru exact acel tip. Zero cost la runtime, cost la dimensiunea binarului și la timpul de compilare.

## 2. Class templates — instanțiere lazy, per-membru

```cpp
template <typename T>
class Box {
    T value_;
public:
    Box(T v) : value_(v) {}
    T get() const { return value_; }
    void rarely_used() { /* cod care nu compilează pentru unele T */ }
};
```

Când scrii `Box<int> b(5);`, compilatorul generează clasa `Box<int>` ca un tip complet nou și separat. `Box<int>` și `Box<double>` sunt **tipuri complet diferite**, fără nicio relație de moștenire între ele, chiar dacă provin din același template.

Nuanță foarte tricky de interviu: **funcțiile membre ale unui class template sunt instanțiate doar dacă sunt efectiv apelate** (instanțiere lazy / on-demand). Asta înseamnă că `rarely_used()` poate conține cod care nici n-ar compila pentru un anumit `T`, și totuși `Box<T>` va funcționa perfect — atâta timp cât nu chemi `rarely_used()`.

```cpp
template <typename T>
class Box {
    T value_;
public:
    void print() { std::cout << value_; }   // cere operator<< pentru T
};

struct NoPrint {};
Box<NoPrint> b;      // OK! print() nu e instanțiat, deci nu se cere operator
// b.print();        // ABIA AICI ar da eroare de compilare
```

În memorie: pentru `Box<NoPrint>` se generează doar layout-ul (un `NoPrint` în el) și constructorii folosiți. `print()` pur și simplu nu apare în binar dacă nu-l chemi.

### Layout în memorie

`Box<int>` are exact layout-ul:
```
┌──────────┐
│ value_   │  <- un int, 4 bytes
└──────────┘
```
Niciun overhead ascuns. Template-ul nu adaugă nimic în obiect — nu există „type tag", nu există vtable din cauza template-ului. Obiectul instanțiat e la fel de slab ca și cum ai fi scris clasa de mână cu `int`. Singura informație de tip e cunoscută de compilator, nu stocată în obiect.

## 3. Problema compilării separate — de ce template-urile stau în header

Aceasta e una dintre cele mai frecvente întrebări „de ce" la interviu. Hai să o disecăm prin prisma a ce vede compilatorul.

Compilarea în C++ e per **translation unit** (fișier .cpp + headerele incluse). Fiecare .cpp se compilează independent în propriul fișier obiect, fără să știe nimic despre celelalte. Linker-ul le unește la final.

Dacă pui **definiția** unui template doar într-un .cpp:

```cpp
// add.cpp
template <typename T> T add(T a, T b) { return a + b; }

// main.cpp
template <typename T> T add(T a, T b);   // doar declarația
int main() { add(3, 5); }                // linker error!
```

Când compilatorul procesează `main.cpp`, vede apelul `add(3, 5)` și vrea să instanțieze `add<int>`. Dar **nu are corpul** — corpul e în `add.cpp`, pe care compilatorul lui `main.cpp` nu-l vede. Nu poate genera codul. Pune o referință nerezolvată în fișierul obiect, sperând că linker-ul o va găsi. Dar `add.cpp` n-a instanțiat niciodată `add<int>` (nimeni nu l-a cerut acolo), deci simbolul nu există nicăieri → **eroare de linker**.

De-aceea **definiția completă a template-ului trebuie să fie vizibilă la punctul de instanțiere** — adică în header, inclusă în fiecare .cpp care îl folosește. Compilatorul fiecărui .cpp are nevoie de rețetă completă ca să gătească.

### Și atunci ce se întâmplă cu ODR? (nuanță avansată)

Dacă header-ul cu template e inclus în 5 fișiere .cpp și toate folosesc `add<int>`, atunci toate 5 fișierele obiect conțin câte o copie a lui `add<int>`. Asta ar trebui să violeze One Definition Rule (un singur corp per funcție în program). Cum nu crapă linker-ul cu „multiple definition"?

Soluția: instanțierile de template sunt emise ca **simboluri weak / COMDAT**. Linker-ul știe că sunt instanțieri de template, le tratează ca „inline", și la final **alege una singură și le aruncă pe celelalte** (COMDAT folding). Așa că în binarul final ai o singură `add<int>`, deși fiecare unitate de compilare a produs câte una.

```
add.o:   add<int>  [weak]  ──┐
b.o:     add<int>  [weak]  ──┼──► linker păstrează UNA, dă drop la restul
c.o:     add<int>  [weak]  ──┘
                              ──► binar final: add<int> apare O SINGURĂ DATĂ
```

Asta e și motivul pentru care timpul de compilare crește: fiecare .cpp re-instanțiază și re-compilează aceleași template-uri, abia apoi linker-ul deduplichează. De-aici și tehnici ca `extern template` (vezi mai jos) ca să eviți munca redundantă.

### `extern template` — controlul instanțierii (avansat)

```cpp
// în header
extern template class std::vector<int>;   // "nu instanția aici, e definit altundeva"

// într-UN singur .cpp
template class std::vector<int>;           // instanțiere explicită, aici și doar aici
```

Asta spune fiecărui .cpp „nu te obosi să instanțiezi `vector<int>`, va exista deja", iar într-un singur loc forțezi instanțierea. Reduce code bloat și timp de compilare pe proiecte mari. Întrebare bună de senior.

## 4. Deducerea argumentelor de template (template argument deduction)

Când chemi o funcție template fără să specifici tipul, compilatorul îl **deduce** din argumente. Regulile sunt subtile și sunt o sursă infinită de capcane.

```cpp
template <typename T> void f(T x);
f(5);          // T = int
f(5.0);        // T = double
```

Capcană fundamentală: **deducerea ignoră referința și const-ul de pe parametru atunci când parametrul e prin valoare** — top-level const și referințele „se topesc":

```cpp
template <typename T> void f(T x);        // prin valoare
const int ci = 5;
int& r = ...;
f(ci);    // T = int  (const dispare — copiezi, deci copia nu trebuie să fie const)
f(r);     // T = int  (referința dispare)
```

Dar cu parametru referință se păstrează:

```cpp
template <typename T> void g(T& x);
const int ci = 5;
g(ci);    // T = const int  -> x e const int&
```

### Array și pointer decay — capcană clasică

```cpp
template <typename T> void f(T x);
template <typename T> void g(T& x);

int arr[10];
f(arr);   // T = int*       (array decade în pointer — pierzi dimensiunea!)
g(arr);   // T = int[10]    (referința păstrează tipul array complet, cu dimensiune)
```

Cu `g`, poți chiar deduce dimensiunea:

```cpp
template <typename T, size_t N>
size_t size(T (&arr)[N]) { return N; }   // N = 10 dedus la compile-time
```

Asta nu costă nimic la runtime — `N` e o constantă cunoscută la compilare, „injectată" în cod.

## 5. Forwarding references și perfect forwarding (zona grea)

Aici e probabil cel mai înțeles greșit subiect. Atenție la diferența vizuală minusculă dar semantică uriașă:

```cpp
template <typename T> void f(T&& x);    // ASTA NU e rvalue reference!
                                        // E "forwarding reference" (universal reference)
```

Când `T&&` apare cu un `T` care **se deduce**, nu mai e rvalue reference — e o **forwarding reference**, care se poate lega și de lvalue, și de rvalue. Mecanismul din spate e **reference collapsing**:

```
T = int&    ->  int& &&   colapsează la  int&    (lvalue)
T = int     ->  int &&    rămâne          int&&   (rvalue)
```

Regula: orice combinație care conține un `&` colapsează la `&`. Doar `&& + &&` rămâne `&&`.

```cpp
template <typename T> void f(T&& x);
int a = 5;
f(a);     // a e lvalue -> T = int&  -> parametrul devine int& (lvalue ref)
f(5);     // 5 e rvalue -> T = int   -> parametrul devine int&& (rvalue ref)
```

`std::forward` folosește exact asta ca să **păstreze categoria de valoare** când pasezi mai departe (perfect forwarding):

```cpp
template <typename T>
void wrapper(T&& arg) {
    target(std::forward<T>(arg));   // dacă arg a venit ca rvalue, pleacă ca rvalue;
                                    // dacă a venit ca lvalue, pleacă ca lvalue
}
```

Diferența `std::move` vs `std::forward` (întrebare clasică): `std::move` cast-uiește **necondiționat** la rvalue. `std::forward` cast-uiește **condiționat** — la rvalue doar dacă `T` indică o rvalue, altfel lasă lvalue. Niciunul nu generează cod la runtime; ambele sunt doar cast-uri la compile-time.

## 6. Two-phase lookup și `typename` / `template` pe nume dependente

Compilatorul procesează un template în **două faze**:
- **Faza 1** (la definiție): verifică sintaxa și numele care **nu** depind de parametrii template (non-dependent names).
- **Faza 2** (la instanțiere): rezolvă numele care depind de `T` (dependent names), când `T` e cunoscut.

Consecința celebră — keyword-ul `typename`:

```cpp
template <typename T>
void f() {
    T::value_type x;        // EROARE de compilare în faza 1!
}
```

Problema: `T::value_type` poate fi un **tip** sau o **variabilă statică** — compilatorul nu știe în faza 1, fiindcă nu cunoaște `T`. Implicit, presupune că e o **variabilă**, deci `T::value_type x;` îl confuzează (pare o expresie incompletă). Trebuie să-i spui explicit că e un tip:

```cpp
typename T::value_type x;   // "value_type e un TIP, ai încredere"
```

Analog, pentru template-uri membre dependente ai nevoie de keyword-ul `template`:

```cpp
template <typename T>
void f(T obj) {
    obj.template get<int>();    // fără "template", < se interpretează ca operator mai-mic
}
```

Astea sunt fix genul de erori care apar doar la instanțiere și care prind oamenii nepregătiți la interviu.

## 7. Specializare — full și partial

Poți oferi implementări alternative pentru tipuri specifice.

**Full specialization** (toți parametrii fixați):

```cpp
template <typename T> struct Printer { void print() { std::cout << "general"; } };

template <>                                   // specializare completă
struct Printer<bool> { void print() { std::cout << "bool special"; } };
```

În memorie/binar: `Printer<bool>` folosește codul specializat, `Printer<orice altceva>` folosește template-ul general. Sunt tipuri separate cu cod separat, alegerea se face la compile-time.

**Partial specialization** (doar pentru class templates, NU pentru funcții):

```cpp
template <typename T> struct Box { /* general */ };
template <typename T> struct Box<T*> { /* specializat pentru orice pointer */ };
template <typename T> struct Box<T[]> { /* specializat pentru array */ };
```

Capcană de interviu: **funcțiile nu pot fi parțial specializate**. Pentru funcții folosești overloading sau, modern, `if constexpr` / concepte. Mulți confundă overloading-ul de funcții template cu „partial specialization" și greșesc.

## 8. SFINAE — „Substitution Failure Is Not An Error"

Când compilatorul încearcă să deducă/substituie tipuri pentru un overload template și substituția produce un tip invalid, **nu e o eroare** — pur și simplu acel candidat e eliminat tăcut din lista de overload-uri, și se încearcă altul.

```cpp
template <typename T>
auto f(T t) -> decltype(t.size()) {     // dacă T n-are .size(), candidatul DISPARE
    return t.size();
}
template <typename T>
size_t f(T t) { return 0; }              // fallback

f(std::vector<int>{});   // alege primul (are .size())
f(42);                   // primul eșuează la substituție (int n-are .size()) -> alege fallback
```

Asta permite „introspectie" la compile-time — alegerea implementării în funcție de capacitățile tipului. Modern, în C++20, acest mecanism greoi e înlocuit de **concepte**, mult mai citibile:

```cpp
template <typename T>
concept HasSize = requires(T t) { t.size(); };

template <HasSize T> auto f(T t) { return t.size(); }
template <typename T> auto f(T t) { return 0; }
```

Tot la compile-time se decide, dar erorile sunt clare în loc de pereți de text cu „no matching function".

## 9. `if constexpr` — ramificare la compile-time

```cpp
template <typename T>
void process(T x) {
    if constexpr (std::is_pointer_v<T>) {
        std::cout << *x;          // compilat DOAR dacă T e pointer
    } else {
        std::cout << x;           // compilat DOAR dacă T NU e pointer
    }
}
```

Diferența vitală față de `if` normal: cu `if constexpr`, **ramura falsă nici nu se compilează** pentru tipul respectiv. Cu `if` obișnuit, ambele ramuri trebuie să compileze pentru orice `T`, ceea ce ar pica (`*x` pe un int nu compilează). În binar apare doar ramura aleasă — zero cod mort, zero ramificare la runtime.

## 10. Variadic templates — parameter packs

```cpp
template <typename... Args>          // pachet de tipuri
void print(Args... args) {           // pachet de valori
    (std::cout << ... << args);      // fold expression (C++17)
}
print(1, "salut", 3.14);             // instanțiază print<int, const char*, double>
```

Cum funcționează în memorie/binar: pentru fiecare combinație distinctă de tipuri, se generează o funcție separată. `print(1, 2)` și `print(1, "x")` produc două funcții diferite în binar. Expansiunea pachetului (`args...`) se desfășoară la compile-time în cod liniar — nu există „buclă peste argumente" la runtime; compilatorul scrie efectiv fiecare `std::cout <<` pe rând.

Recursivitatea clasică (pre-fold):

```cpp
void print() {}                       // caz de bază
template <typename First, typename... Rest>
void print(First f, Rest... rest) {
    std::cout << f << " ";
    print(rest...);                   // se "decojește" câte un argument
}
```

Fiecare nivel de recursie e o **funcție separată instanțiată**: `print<int,char,double>`, apoi `print<char,double>`, apoi `print<double>`, apoi `print<>`. Patru funcții distincte în binar pentru un singur apel cu 3 argumente. Iar code bloat-ul de aici.

## 11. Membri statici ai template-urilor — fiecare instanțiere are ai săi

Nuanță subtilă în memorie:

```cpp
template <typename T>
struct Counter {
    static int count;
};
template <typename T> int Counter<T>::count = 0;

Counter<int>::count = 5;
Counter<double>::count = 99;
```

`Counter<int>::count` și `Counter<double>::count` sunt **două variabile complet separate** în segmentul de date, la adrese diferite. Fiecare instanțiere a template-ului își are propria copie a membrilor statici. Are sens: sunt tipuri diferite.

```
SEGMENT DE DATE (.data/.bss)
┌─────────────────────────────┐
│ Counter<int>::count    = 5   │  @0x60a000
│ Counter<double>::count = 99  │  @0x60a004
└─────────────────────────────┘
```

## 12. CTAD — Class Template Argument Deduction (C++17)

```cpp
std::vector v{1, 2, 3};      // deduce std::vector<int> fără să scrii <int>
std::pair p{1, 2.0};         // std::pair<int, double>
```

Înainte de C++17 erai obligat să scrii tipurile la clase template (doar funcțiile deduceau). CTAD aduce deducerea și la clase. Tot la compile-time, zero cost runtime. Capcană: CTAD nu funcționează parțial — ori deduci toate argumentele, ori le specifici pe toate.

## 13. Sinteza modelului mental pentru interviu

Pune-o așa, dacă te întreabă „cum funcționează template-urile în memorie":

Template-urile sunt un mecanism de **generare de cod la compile-time**. Un template nu ocupă memorie și nu există la runtime. La fiecare utilizare cu tipuri concrete, compilatorul **instanțiază** o copie specializată — funcție sau clasă reală, cu adresă proprie în binar. Tipuri diferite produc instanțieri complet separate și necorelate. Asta dă **performanță zero-overhead** (totul rezolvat static, optimizat pe tip) cu prețul **code bloat** și **timp de compilare** crescut. Definițiile trăiesc în headere fiindcă fiecare unitate de compilare are nevoie de rețetă completă ca să instanțieze, iar linker-ul deduplichează copiile identice prin simboluri weak/COMDAT.

---

Vrei să continui cu zona cu adevărat avansată — **template metaprogramming** concret (calcule la compile-time, type traits scrise de mână, recursie pe tipuri), sau cu **CRTP** (Curiously Recurring Template Pattern) și polimorfism static vs dinamic în memorie (vtable vs zero overhead)? Ambele apar des la interviuri grele de C++ senior.