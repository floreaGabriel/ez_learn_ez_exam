# Licență Trainer 🎓 — aplicație de pregătire pentru examenul de licență

Aplicație web (HTML + CSS + JavaScript, **fără backend**) pentru pregătirea examenului de licență. Conține mai multe materii: **PSO**, **Rețele** și **SDA**.

---

## 🌐 Aplicația live

Aplicația este găzduită pe un **Raspberry Pi 5** și expusă public la:

### 👉 https://pi5.komodo-castor.ts.net/

Deschide link-ul în orice browser modern (Chrome, Edge, Firefox, Safari) — nu trebuie instalat sau pornit nimic. Începe de la **Dashboard → alege o materie**.

---

## 📚 Ce conține

La intrare vezi un **dashboard** cu materiile disponibile. Din bara din stânga poți **extinde** materia care te interesează și sări direct la o secțiune. În dreapta sus ai un buton **dark/light** care schimbă tema în toată aplicația (inclusiv în materiile încărcate în iframe).

| Materie | Conținut |
|---|---|
| **PSO** 🧠 | Procese, fork/exec/wait, fire de execuție, semafoare/mutex/bariere, planificare, semnale, memorie, IPC (inclusiv pipe-uri). Lecții + întrebări de examen (grile cu verificare instant și probleme deschise cu rezolvare). |
| **Rețele** 🌐 | Headere Ethernet / IP / TCP / UDP / ARP / DHCP — diagrame interactive, drag & drop, completare câmpuri, analiză de pachete (hexdump) și quiz. |
| **SDA** 🧮 | Complexitate, liste/stive, arbori BST și AVL, grafuri și Dijkstra, tabele hash, sortări și tehnici (Divide et Impera, Backtracking, Greedy) + exerciții rezolvate în stil examen. |

De asemenea, secțiunea **🎬 Materiale Video** adună clipuri YouTube selectate pentru conceptele cheie din fiecare materie.

---

## 🗂️ Structură

```
app/
├── index.html              # shell-ul aplicației (dashboard + sidebar + temă)
├── css/styles.css          # stiluri + tema dark/light la nivel de aplicație
├── js/
│   ├── app.js              # registrul de materii (MATERII), navigare, temă, video
│   ├── quiz.js             # motorul de teste (PSO)
│   └── data/
│       ├── concepte.js     # lecțiile PSO (+ diagrame SVG inline)
│       └── intrebari.js    # banca de întrebări PSO
├── pso/                    # laboratorul de simulatoare PSO (embed în materia nativă)
│   ├── index.html          # shell + motorul de pași (Player) + helperii SVG + rutare hash
│   └── sims/*.js           # simulatoarele, grupate pe subsisteme (PSO.register)
├── retele/index.html       # materia Rețele (pagină proprie, încărcată în iframe)
├── sda/index.html          # materia SDA (pagină proprie, încărcată în iframe)
├── amongus/                # joc multiplayer „Among Us CS” (serviciu Node separat)
│   ├── server.js           # server autoritar (WebSocket) — vezi amongus/README.md
│   ├── content/*.yaml      # conținutul minijocurilor per materie (cu soluțiile!)
│   └── public/             # clientul Canvas, servit de serviciu pe /amongus/
├── diagrams/               # surse editabile draw.io (PSO)
├── assets/                 # diagrame PNG exportate (PSO)
├── Dockerfile              # imagine nginx pentru deploy (folosită pe Raspberry Pi 5)
└── nginx.conf              # configurarea serverului web
```

**Două tipuri de materii:**
- `tip:"native"` — folosește motorul intern (concepte + teste). Ex: PSO.
- `tip:"embed"` — pagină HTML proprie, self-contained, încărcată în iframe și sincronizată cu aplicația (temă + navigare prin `postMessage`). Ex: Rețele, SDA.

---

## ➕ Cum adaugi o materie nouă

Editează `MATERII` din `js/app.js`. Pentru o materie de tip `embed`:
```js
{
  id:"noua", nume:"Materie nouă", icon:"📦",
  sub:"Subtitlu", descriere:"Apare pe card în dashboard.",
  tip:"embed", src:"noua/index.html",
  sectiuni:[
    { id:"sectiune1", nume:"Secțiunea 1", icon:"📘" },
    { id:"sectiune2", nume:"Secțiunea 2", icon:"📝" }
  ]
}
```
Apoi creează `app/noua/index.html`. Ca să se sincronizeze tema și navigarea, pagina trebuie să:
- aibă o funcție `activateTab(id)` care arată secțiunea cerută;
- asculte mesajele de la aplicația gazdă:
  ```js
  window.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === 'theme' && d.theme) setTheme(d.theme);
    else if (d.type === 'tab' && d.tab) activateTab(d.tab);
  });
  ```
Vezi `sda/index.html` ca model.

### Întrebări / lecții PSO
- Întrebare grilă în `js/data/intrebari.js`:
  ```js
  { id:"q-nou", tema:"Procese", an:"2024", tip:"grila", multi:false,
    enunt:"...", optiuni:["A","B","C","D"], corecte:[2], explicatie:"..." }
  ```
  `multi:true` + `corecte:[0,2]` pentru răspuns multiplu; `tip:"deschis"` + `raspuns:"..."` pentru problemă cu rezolvare.
- Lecție nouă în `js/data/concepte.js`: obiect cu `id, cat, titlu, rezumat, html`.
- Clip video atașat unei lecții: adaugă în `CONCEPT_VIDEOS` din `js/app.js` (cheia = `id`-ul lecției).

### Simulatoarele PSO (`pso/`)

Laboratorul de simulatoare vizuale („🎮 Simulatoare” din navigația PSO) e o pagină embed
(`pso/index.html`) încărcată în iframe de `showSimLab()` din `js/app.js`, cu rutare pe hash:
`#jocuri` (grila) sau `#sim/<id>[/<scenariu>]` (deep-link, folosit și de butoanele din lecții).

- **Simulator nou:** adaugă un fișier în `pso/sims/` (sau extinde unul existent) care apelează
  `PSO.register({id, cat, icon, titlu, scurt, desc, ani, scenarii})`. Un scenariu întoarce din
  `build()` fie `{cod?, pasi:[{svg, linii?, ce, dece, out?}]}` (player liniar cu pași), fie
  `{custom: root => {...}}` pentru interfețe libere (vezi Gantt / exploratorul de întrețeseri).
  SVG-urile se scriu cu helperii `S.*` și clasele `sv-*` (temabile prin variabile CSS).
- **Buton „deschide simulatorul” într-o lecție:** adaugă intrarea în `CONCEPT_SIMS`
  din `js/app.js` (cheia = `id`-ul lecției, `s` = `sim` sau `sim/scenariu`).
- Cache: `Dockerfile` adaugă `?v=<git-sha>` pe `sims/*.js`, iar orice `index.html` e
  `no-cache` în `nginx.conf` — modificările ajung la useri la primul refresh după deploy.

### Subiectele PSO protejate cu parolă (`pso/subiecte.html`)

Secțiunea „🔐 Subiecte examen” din navigația PSO. Conținutul (10 variante în formatul
2024) stă **criptat AES-GCM-256** în `pso/subiecte-secret.enc.js`; cheia se derivă din
parolă (PBKDF2), deblocarea are loc în browser, iar parola poate fi ținută minte per
stație (localStorage). Sursa în clar + scriptul de (re)criptare/schimbare de parolă
NU sunt în acest repo — vezi `materii/pso/subiecte-secrete/` (README acolo).

### Subiectele C & C++ protejate cu parolă (`oop/subiecte.html`)

Secțiunea „🔐 Subiecte examen” de sub OOP C++. 12 variante generate (6 Programare C +
6 OOP/C++) în stilul Subiectului III de la examenele 2019–2024: coduri scurte cu
capcanele reale de examen, întrebările „se compilează? / ce afișează? / justificați”,
rezolvări detaliate și barem. **Fiecare cod, fiecare ieșire și fiecare corectare au
fost verificate prin compilare și rulare reală** (gcc/g++) înainte de criptare.
Conținutul stă criptat AES-GCM-256 în `oop/subiecte-secret.enc.js` (aceeași parolă ca
la subiectele PSO); sursa în clar + pipeline-ul de verificare/criptare NU sunt în acest
repo — vezi `materii/oop/subiecte-secrete/` (README acolo).

### Among Us CS (`amongus/`) 🛸

Joc multiplayer „Among Us” cu temă de informatică: 4–8 jucători, 1–2 impostori,
hartă 2D cu 7 camere, iar taskurile echipajului sunt **minijocuri din materiile
de licență** (gazda camerei alege max 3 materii; conținutul vine din băncile
Conquistador + cursuri). Kill, cadavre, raport, ședințe cu chat + vot, sabotaj
de kernel, fantome care fac taskuri în continuare, reconectare grațioasă.

Rulează ca **serviciu Node separat** (aceeași rețetă ca `conquistador/`): imagine
proprie în GHCR, nginx proxează `/amongus/` cu upgrade WebSocket, serverul e
autoritar (rolurile și soluțiile minijocurilor nu ajung niciodată la client).
Detalii, protocol și cum se adaugă conținut: `amongus/README.md` + `amongus/PROTOCOL.md`.
