# PSO Trainer 🧠 — aplicație de pregătire pentru licență

Aplicație web (HTML + CSS + JavaScript, **fără backend**) pentru materia **Programarea Sistemelor de Operare**. Acoperă: procese, fork/exec/wait, fire de execuție (threads), semafoare, mutex, spinlock, bariere, variabile condiție, planificare (FCFS/SJF/SRTF/Round-Robin/priorități), semnale și zonele de memorie.

## Cum o pornești

**Varianta 1 — dublu-click:** deschide `index.html` direct în browser.

**Varianta 2 — server local (recomandat, ca să se încarce și imaginile PNG):**
```bash
cd app
python3 -m http.server 8000
# apoi deschide http://localhost:8000
```

## Ce conține

- **Concepte** — 13 lecții, organizate pe categorii, cu diagrame, tabele, exemple de cod C (cu evidențiere de sintaxă) și „capcane de examen".
- **Teste examen** — 28 de întrebări (23 grile cu verificare instant + explicații, 5 probleme deschise cu rezolvare model). Întrebările provin din **subiecte reale ATM 2020–2024** plus grile conceptuale în același stil. Poți filtra pe temă, amesteca întrebările și vezi scorul.

## Structură

```
app/
├── index.html              # pagina principală
├── css/styles.css          # stiluri
├── js/
│   ├── app.js              # navigare + randare concepte + highlighter cod
│   ├── quiz.js             # motorul de teste
│   └── data/
│       ├── concepte.js     # conținutul lecțiilor (+ diagrame SVG inline)
│       └── intrebari.js    # banca de întrebări
├── diagrams/               # surse editabile draw.io (.drawio / XML)
│   ├── stari-proces.drawio
│   └── zone-memorie.drawio
└── assets/                 # diagrame exportate în PNG din draw.io
    ├── stari-proces.png
    └── zone-memorie.png
```

## Diagrame

- Majoritatea diagramelor sunt **SVG inline** (responsive, fără dependențe).
- Două diagrame-cheie (stările proceselor, zonele de memorie) sunt făcute în **draw.io** — sursele XML sunt în `diagrams/`, iar exportul PNG în `assets/`.

Pentru a re-exporta din draw.io după ce editezi un `.drawio`:
```bash
/Applications/draw.io.app/Contents/MacOS/draw.io --export --format png --scale 2 \
  --output assets/stari-proces.png diagrams/stari-proces.drawio
```

## Cum adaugi întrebări sau lecții

- O **întrebare grilă** nouă în `js/data/intrebari.js`:
  ```js
  { id:"q-nou", tema:"Procese", an:"2024", tip:"grila", multi:false,
    enunt:"...", cod:"... (optional)", optiuni:["A","B","C","D"],
    corecte:[2], explicatie:"..." }
  ```
  `multi:true` + `corecte:[0,2]` pentru răspuns multiplu.
- O **problemă deschisă**: `tip:"deschis"` cu câmpul `raspuns:"...rezolvare..."`.
- O **lecție** nouă în `js/data/concepte.js`: obiect cu `id, cat, titlu, rezumat, html`.

## Surse

Conținut extras din cursurile PSO (ATM): cursul 3 (procese), 7 (fire de execuție), 8 (sincronizare), 4.1 (planificarea execuției), și din subiectele de examen 2020–2024.
