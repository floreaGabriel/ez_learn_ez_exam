# Conținutul minijocurilor — schema fișierelor `content/*.yaml`

Un fișier per materie. Serverul le încarcă la pornire și **ține soluțiile la el**
(clientul primește doar enunțul, amestecat). Adaugi conținut nou fără să atingi codul.

Reguli generale:
- **Sursa obligatorie** la fiecare intrare: de unde vine faptul (banca
  `conquistador/questions/*.yaml` sau folderul de curs corespunzător).
  Nu se inventează fapte din afara surselor.
- Texte scurte (ideal ≤ 38 caractere pe element — apar în casete mici), diacritice
  corecte, fără HTML.
- `context` (opțional, oriunde): o frază afișată deasupra minijocului
  (ex. datele problemei pentru o ordonare care cere calcul).

```yaml
materie: retele          # = numele fișierului, fără .yaml
nume: "Rețele"
icon: "🌐"

# 1) FIRE — „Conectează firele”: potrivești stânga cu dreapta trăgând fire.
#    4–5 perechi / intrare. Valorile din dreapta trebuie să fie UNICE și
#    ne-ambigue (o singură potrivire corectă posibilă pentru fiecare).
fire:
  - titlu: "Port → Protocol"
    sursa: "questions/retele.yaml — porturi standard"
    stanga: "Port"                 # eticheta coloanei din stânga
    dreapta: "Protocol"            # eticheta coloanei din dreapta
    perechi:
      - ["80",  "HTTP"]
      - ["443", "HTTPS"]
      - ["22",  "SSH"]
      - ["53",  "DNS"]

# 2) ORDONARE — „Compilează codul”: aranjezi pașii în ordinea corectă (drag & drop).
#    4–6 pași / intrare, scriși AICI în ordinea corectă (serverul îi amestecă).
ordonare:
  - titlu: "Încapsularea datelor la emisie"
    sursa: "cursuri/retele_protocoale_noi — stiva TCP/IP"
    pasi: ["Date (Aplicație)", "Segment (Transport)", "Pachet (Rețea)", "Cadru (Legătură)", "Biți (Fizic)"]

# 3) CALIBRARE — slider oprit pe valoarea corectă. Din întrebările numerice ale băncii.
#    Numere ÎNTREGI; min < corect < max; corect să nu fie chiar la margine.
#    tol = abaterea acceptată (0 ⇒ serverul acceptă ±2% din interval).
calibrare:
  - intrebare: "Câți hoști utilizabili are un /26?"
    sursa: "questions/retele.yaml"
    min: 0
    max: 130
    corect: 62
    tol: 0
    unitate: "hoști"

# 4) STIVA — puzzle de stivă: elementele SOSESC în ordinea `sosire`; poți doar
#    push (ia următorul sosit) și pop (scoate vârful). Trebuie produsă exact
#    ordinea `iesire`. ATENȚIE: `iesire` trebuie să fie REALIZABILĂ cu o stivă!
#    (ex. din 1,2,3 nu poți obține 3,1,2)
stiva:
  - titlu: "Ordinea apelurilor de funcții"
    sursa: "cursuri/programare — stiva de apeluri"
    context: "main() cheamă f(), f() cheamă g()"
    sosire: ["main", "f", "g"]
    iesire: ["g", "f", "main"]

# 5) ARBORE — click pe nodurile unui arbore binar în ordinea parcurgerii cerute.
#    5–7 noduri, valori distincte. Serverul alege una din `parcurgeri`.
arbore:
  - titlu: "Parcurgeri de BST"
    sursa: "questions/sda.yaml — parcurgeri"
    rad: { v: 8, st: { v: 3, st: { v: 1 }, dr: { v: 6 } }, dr: { v: 10, dr: { v: 14 } } }
    parcurgeri: ["inordine", "preordine", "postordine"]

# 6) SORTARE — execuți O SINGURĂ trecere de bubble sort (compari vecinii de la
#    stânga la dreapta și interschimbi unde e nevoie). 5–6 valori, nesortate.
sortare:
  - titlu: "O trecere de bubble sort"
    sursa: "cursuri/SDA — metode de sortare"
    valori: [7, 2, 9, 4, 6]

# 7) STARI — diagrama de stări: etichetele tranzițiilor (amestecate) se trag pe
#    săgețile potrivite. 4–5 noduri, 4–6 tranziții, etichete UNICE.
stari:
  - titlu: "Stările unui proces"
    sursa: "questions/pso.yaml — stări + curs Procese"
    noduri: ["New", "Ready", "Running", "Waiting", "Terminated"]
    tranzitii:
      - { de: "New",     la: "Ready",      eticheta: "admitere în sistem" }
      - { de: "Ready",   la: "Running",    eticheta: "dispatch (planificator)" }
      - { de: "Running", la: "Ready",      eticheta: "expiră cuanta" }
      - { de: "Running", la: "Waiting",    eticheta: "cere I/O" }
      - { de: "Waiting",  la: "Ready",     eticheta: "I/O terminat" }
      - { de: "Running", la: "Terminated", eticheta: "exit()" }

# 8) SQL — completezi golurile (___) unei interogări trăgând fragmente.
#    Nr. de ___ == lungimea listei `goluri` (în ordinea golurilor).
#    `momeli` = distractori care NU sunt corecți în niciun gol.
sql:
  - titlu: "Filtrare și sortare"
    sursa: "questions/sql.yaml"
    sablon: "SELECT nume, ___ FROM angajati WHERE ___ > 3000 ORDER BY ___;"
    goluri: ["salariu", "salariu", "nume"]
    momeli: ["GROUP BY", "HAVING", "id"]
```

Tipurile recomandate per materie (orientativ):

| materie | fire | ordonare | calibrare | stiva | arbore | sortare | stari | sql |
|---|---|---|---|---|---|---|---|---|
| retele | 4 | 3 | 4 | – | – | – | opț. | – |
| arhitecturi | 3 | 3 | 4 | – | – | – | – | – |
| pso | 3 | 3 | 3 | 1 | – | – | 2 | – |
| programare-c | 4 | 2 | 4 | 1 | – | opț. | – | – |
| sda | 2 | 2 | 2 | 2 | 3 | 2 | – | – |
| oop-cpp | 4 | 3 | 2 | – | – | – | – | – |
| sql | 3 | 2 | 2 | – | – | – | – | 4 |
