Hai să le iau pe rând, pentru că deși ambele se numesc „function..." și sună similar, sunt fenomene complet diferite: unul se rezolvă **la compilare** (nu lasă nicio urmă specială în memorie la runtime), celălalt se rezolvă **la execuție** (și are o structură de memorie dedicată).

## 1. Function Overloading (supraîncărcarea)

### Ce este la nivel de limbaj

Ai mai multe funcții cu **același nume** în **același scope**, dar cu **listă de parametri diferită** (număr diferit de parametri sau tipuri diferite):

```cpp
void f(int a);
void f(double a);
void f(int a, char b);
```

Tipul returnat **nu** contează pentru distincție — nu poți avea `int f(int)` și `double f(int)` ca overload-uri. Doar parametrii contează.

Compilatorul, la fiecare apel, face **overload resolution**: se uită la tipurile argumentelor, găsește cel mai bun candidat (eventual cu conversii implicite), și decide *exact* ce funcție se cheamă. Această decizie e luată **100% la compilare**.

### Ce se întâmplă în memorie — name mangling

Aici e cheia: în fișierul obiect (.o) și în executabil **nu există** un simbol numit „f". Compilatorul ia fiecare overload și îi **codifică tipurile parametrilor în numele simbolului** — procesul se numește *name mangling*.

Cu ABI-ul Itanium C++ (GCC/Clang pe Linux), cele trei funcții de mai sus devin trei simboluri distincte:

```
void f(int)        ->  _Z1fi
void f(double)     ->  _Z1fd
void f(int, char)  ->  _Z1fic
```

Descifrare: `_Z` = prefix care marchează un nume „mangled", `1f` = nume de 1 caracter „f", iar apoi codurile de tip: `i` = int, `d` = double, `c` = char. (MSVC folosește o schemă diferită, mai urâtă, dar ideea e identică.)

Deci pentru linker, cele trei sunt funcții **complet separate**, fără nicio legătură între ele. Numele comun „f" e o iluzie care există doar în codul tău sursă.

### Consecința la runtime: zero

La punctul de apel, compilatorul a ales deja simbolul exact, deci generează un **apel direct** (instrucțiunea `call` către o adresă fixă, cunoscută la link-time):

```asm
call _Z1fi          ; adresa e fixă, hardcodată
```

**Concluzie despre memorie pentru overloading:** nu există nicio structură suplimentară. Obiectele nu se măresc, nu există tabele, nu există indirectare. E pur și simplu naming la compilare. Costul la execuție este **nul** — un apel overloaded e la fel de rapid ca orice apel obișnuit, și poate fi inlined.

---

## 2. Function Overriding (suprascrierea)

### Ce este la nivel de limbaj

Aici intervine moștenirea. O clasă derivată oferă o **nouă implementare** pentru o funcție **`virtual`** declarată în clasa de bază, cu **exact aceeași semnătură**:

```cpp
class Base {
public:
    virtual void speak();   // virtual!
    virtual void walk();
    int x;
};

class Derived : public Base {
public:
    void speak() override;  // suprascrie Base::speak
    int y;
};
```

Scopul: ca atunci când ai un pointer/referință de tip `Base*` care arată de fapt spre un `Derived`, apelul `ptr->speak()` să cheme versiunea **din Derived**, nu cea din Base. Asta se numește *dynamic dispatch* / *late binding* și se decide **la execuție**, pentru că la compilare compilatorul de multe ori nu știe spre ce tip concret arată pointerul.

Cuvântul `virtual` este ce face diferența. Dacă funcția **nu** e `virtual`, ai *function hiding* (ascundere), nu overriding — și apelul se rezolvă static, după tipul pointerului, nu după obiectul real.

### Ce se întâmplă în memorie — vtable și vptr

Ca să poată decide la runtime, compilatorul construiește două structuri:

**a) vtable (virtual table)** — un tabel de pointeri la funcții, **câte unul per clasă** (nu per obiect). E o zonă statică, de obicei pusă în secțiunea read-only `.rodata` a executabilului. Conține adresele funcțiilor virtuale ale clasei, în ordine fixă (fiecare funcție virtuală primește un **slot** la un index fix).

**b) vptr (virtual pointer)** — un pointer ascuns, **câte unul per obiect**, adăugat automat de compilator de obicei chiar la **începutul obiectului (offset 0)**. El arată spre vtable-ul clasei reale a obiectului.

Deci un obiect cu funcții virtuale e mai mare cu dimensiunea unui pointer (8 bytes pe 64-bit) față de cum ar fi fără `virtual`.

Hai să-ți arăt layout-ul concret în memorie:Layout-ul unui obiect `Derived` și legătura lui cu vtable-ul:Cum se citește schema: obiectul `Derived` ocupă în memorie 16 bytes — primii 8 sunt `vptr`, apoi cei doi `int`-i (cu padding). `vptr` arată spre vtable-ul lui `Derived`, iar fiecare slot din vtable arată spre codul efectiv al funcției. Observă slotul `[0]`: pentru că `Derived` a suprascris `speak`, slotul arată spre `Derived::speak`, dar slotul `[1]` (`walk`, nesuprascris) arată în continuare spre `Base::walk`. **Asta e tot mecanismul.**

Pentru comparație, un obiect `Base` ar avea propriul lui vtable, unde slotul `[0]` arată spre `Base::speak`. Cheia este că **același index de slot înseamnă aceeași funcție logică** în ambele vtable-uri.

### Ce cod generează un apel virtual

Când scrii `ptr->speak()` cu `ptr` de tip `Base*`, compilatorul **nu știe** spre ce arată, deci nu poate genera un `call` direct. Generează ceva de genul (pseudo-asm x86-64, cu pointerul în `rdi`):

```asm
mov  rax, [rdi]        ; încarcă vptr (primii 8 bytes ai obiectului)
mov  rax, [rax + 0]    ; încarcă pointerul din slotul 0 (speak)
call rax               ; apel INDIRECT, prin registru
```

Pentru `walk()` ar fi `[rax + 8]` (slotul 1 = al doilea pointer, deci offset 8 bytes pe 64-bit). Indexul slotului (`+0`, `+8`) este **fix, decis la compilare** — singurul lucru necunoscut la compilare e *conținutul* vtable-ului, adică spre ce funcție arată efectiv slotul. De-aia se numește *dynamic dispatch*: structura e statică, ținta e dinamică.

Diferența față de un apel non-virtual sau overloaded, unde adresa e cunoscută:

```asm
call _ZN7Derived5speakEv   ; apel direct, adresă fixă
```

### Detaliu subtil: cine setează vptr și când

`vptr`-ul nu apare magic — e inițializat de **constructor**, și asta produce un comportament des întâlnit la interviuri:

1. La construirea unui `Derived`, rulează **întâi** constructorul lui `Base`. În acel moment, constructorul `Base` setează `vptr` să arate spre **vtable-ul lui Base**.
2. **Apoi** rulează constructorul lui `Derived`, care **suprascrie** `vptr` să arate spre vtable-ul lui `Derived`.

Consecința: dacă apelezi o funcție virtuală **din interiorul constructorului lui `Base`**, se cheamă versiunea din `Base`, nu cea suprascrisă din `Derived` — pentru că în acel moment `vptr` încă arată spre vtable-ul lui `Base`, iar partea `Derived` a obiectului nici nu e construită încă. Același lucru, în ordine inversă, se întâmplă în destructor.

### Mai e ceva în vtable

În practică, vtable-ul mai conține, înainte de pointerii la funcții (la offset-uri negative față de „punctul de adresare"), două lucruri folosite de compilator:
- un pointer la structura `type_info` a clasei — folosit de `dynamic_cast` și `typeid` (mecanismul RTTI);
- un `offset-to-top` — relevant la moștenirea multiplă, ca să se poată ajusta pointerul `this` când un obiect are mai multe sub-obiecte de bază (caz în care un obiect poate avea chiar **mai multe vptr-uri**).

---

## Rezumatul diferențelor în memorie

Punând cele două față în față, contrastul low-level e net:

Overloading-ul trăiește **exclusiv la compilare**. Nu modifică deloc layout-ul obiectelor, nu creează tabele, nu adaugă indirectare. Tot ce face e *name mangling* — transformă un nume comun în mai multe simboluri distincte, iar la apel se generează un `call` direct. Cost la runtime: **zero**. Poate fi și inlined.

Overriding-ul (virtual) trăiește **la execuție** și are un cost concret în memorie: fiecare obiect crește cu un pointer (`vptr`, 8 bytes), fiecare clasă polimorfică are un `vtable` în `.rodata`, iar fiecare apel virtual e o **dublă indirectare** (citește vptr → citește slotul → apel indirect prin registru). Asta înseamnă și că apelul de obicei **nu poate fi inlined** și e mai prost pentru branch predictor, deși în practică overhead-ul e mic.

O capcană de reținut, legată de memorie/semantică: dacă o clasă derivată declară o funcție cu **același nume** ca una din bază dar cu **altă semnătură**, nu faci overriding și nici overloading între clase — faci *name hiding*: numele din derivată ascunde **toate** overload-urile din bază (le poți readuce cu `using Base::nume;`). Iar `override` și `final` sunt verificări **la compilare** care nu costă nimic la runtime, dar te scapă de bug-uri (ex. dacă crezi că suprascrii dar semnătura nu se potrivește exact, `override` dă eroare de compilare).

Vrei să intru și mai adânc pe vreo zonă — de exemplu layout-ul exact la moștenire multiplă cu mai multe vptr-uri, sau cum arată concret simbolurile mangled generate de GCC pentru un exemplu compilat?