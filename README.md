# Licență Trainer 🎓 — aplicație de pregătire pentru examenul de licență

Aplicație web (HTML + CSS + JavaScript, **fără backend, fără instalare**) pentru pregătirea examenului de licență. Conține mai multe materii: **PSO**, **Rețele** și **SDA**.

---

## 🚀 Pornire rapidă

**Cel mai simplu — dublu-click:** deschide `index.html` în browser. Atât.

**Recomandat — server local** (ca să meargă tot: imagini, iframe-uri, video YouTube):
```bash
cd app
python3 -m http.server 8000
```
Apoi deschide în browser: **http://localhost:8000**

> De ce server local? Materiile Rețele și SDA se încarcă în `iframe`, iar unele browsere (mai ales Chrome) blochează încărcarea lor sau redarea video atunci când deschizi fișierul direct prin `file://`. Pe un server local totul funcționează curat.

---

## 📥 Cum obții aplicația (pentru cineva care vrea s-o folosească)

1. **Copiază folderul `app/`** întreg (cu tot ce e în el) pe calculatorul tău — prin clonare git, copiere pe stick, descărcare ZIP etc.
2. Asigură-te că ai **un browser modern** (Chrome, Edge, Firefox sau Safari). Nu trebuie instalat nimic altceva.
3. Pentru server local ai nevoie de **Python 3** (preinstalat pe macOS/Linux). Verifici cu `python3 --version`.
   - Nu ai Python? Mergi pe varianta dublu-click, sau folosește orice alt server static (`npx serve`, extensia *Live Server* din VS Code etc.).
4. Pornește aplicația cu una din variantele de mai sus și începe de la **Dashboard → alege o materie**.

---

## 📚 Ce conține

La pornire vezi un **dashboard** cu materiile disponibile. Din bara din stânga poți **extinde** materia care te interesează și sări direct la o secțiune. În dreapta sus ai un buton **dark/light** care schimbă tema în toată aplicația (inclusiv în materiile încărcate în iframe).

| Materie | Conținut |
|---|---|
| **PSO** 🧠 | Procese, fork/exec/wait, fire de execuție, semafoare/mutex/bariere, planificare, semnale, memorie. 13 lecții + 28 întrebări de examen (grile cu verificare instant și probleme deschise cu rezolvare). |
| **Rețele** 🌐 | Headere Ethernet / IP / TCP / UDP / ARP / DHCP — diagrame interactive, drag & drop, completare câmpuri, analiză de pachete (hexdump) și quiz. |
| **SDA** 🧮 | Complexitate, liste/stive, arbori BST și AVL, grafuri și Dijkstra, tabele hash, sortări și tehnici (Divide et Impera, Backtracking, Greedy) + 8 exerciții rezolvate în stil examen. |

---

## 🗂️ Structură

```
app/
├── index.html              # shell-ul aplicației (dashboard + sidebar + temă)
├── css/styles.css          # stiluri + tema dark/light la nivel de aplicație
├── js/
│   ├── app.js              # registrul de materii (MATERII), navigare, temă
│   ├── quiz.js             # motorul de teste (PSO)
│   └── data/
│       ├── concepte.js     # lecțiile PSO (+ diagrame SVG inline)
│       └── intrebari.js    # banca de întrebări PSO
├── retele/index.html       # materia Rețele (pagină proprie, încărcată în iframe)
├── sda/index.html          # materia SDA (pagină proprie, încărcată în iframe)
├── diagrams/               # surse editabile draw.io (PSO)
└── assets/                 # diagrame PNG exportate (PSO)
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

