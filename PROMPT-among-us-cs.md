# Prompt pentru Fable — „Among Us: Computer Science"

> Copiază tot ce e mai jos (de la „Vreau să construiești...") și dă-i-l lui Fable ca prompt.
> Contextul de sus (acest paragraf) NU face parte din prompt — e doar pentru tine.

---

Vreau să construiești un joc multiplayer online în browser, o clonă „Among Us" cu temă de informatică (Computer Science), care să se integreze într-o aplicație web existentă de pregătire pentru examenul de licență.

## Context tehnic OBLIGATORIU (respectă-l — nu inventa alt stack)

Aplicația-gazdă e scrisă în **HTML + CSS + JavaScript vanilla, fără niciun framework și fără build step**. Are deja un joc multiplayer numit „Conquistador" construit așa:

- **Backend:** un singur serviciu **Node.js + WebSocket** (librăria `ws`). Fără bază de date — starea camerelor trăiește **doar în memorie** (efemeră: când se termină partida sau pleacă toți, camera dispare).
- **Frontend:** JavaScript vanilla, servit static.
- **Deploy:** container Docker, iar **`nginx` proxează o cale (ex. `/game/`) către serviciul Node**, cu upgrade de WebSocket.
- **Anti-cheat:** informația sensibilă (cine e impostor, soluțiile) stă **pe server** și NU pleacă niciodată către client înainte de momentul potrivit.

Construiește „Among Us CS" în **exact același tipar**:
- **Frontend: HTML5 Canvas + JavaScript vanilla. NU folosi React/Vue/Phaser/librării grele.** Canvas 2D simplu e suficient și corect pentru un joc top-down cu jucători care se plimbă. Poți folosi `requestAnimationFrame` pentru game loop. Fără bundler, fără npm pe frontend.
- **Backend: Node.js + `ws`**, serviciu separat (ex. pe portul 3003), stare doar în RAM, gândit să fie proxat de nginx pe o cale nouă (ex. `/amongus/`).
- Codul să fie curat, comentat în română, ușor de citit de niște studenți.

## Rolul serverului vs. clientului (foarte important pentru anti-cheat)

Serverul e **autoritar**: el deține adevărul despre poziții, cine e impostor, ce taskuri sunt făcute, cine e mort. Clientul doar:
1. trimite input (direcția de mișcare, „interact", „kill", „report", vot),
2. randează starea primită de la server.

**Cine e impostorul NU se trimite niciodată către clienții inocenți.** Fiecare client primește doar ce are voie să știe.

## Gameplay — vreau să fie ca Among Us

**8 jucători** într-o cameră (cu un lobby: creezi cameră, primești un cod, ceilalți intră cu codul — la fel ca la Conquistador). Din cei 8: **2 impostori** (configurabil 1–2), restul **echipaj (crewmates)**.

**Alegerea materiilor (la crearea camerei):** cel care creează camera alege **din ce materii se joacă partida — maximum 3 materii** dintr-o listă (checkbox/toggle). Materiile disponibile sunt exact cele de mai jos (secțiunea „Materii & sursa conținutului"). Alegerea e vizibilă în lobby pentru toți cei care intră cu codul. **TOATE minijocurile de task din acea partidă trebuie să fie DOAR din materiile selectate** — dacă s-au ales „Rețele" + „SDA", nu apar taskuri de SQL sau OOP. Repartizează taskurile echilibrat între materiile alese.

### Mapa și mișcarea
- O mapă 2D top-down (vedere de sus), stil navă/laborator de informatică. Fă **cel puțin 4–6 camere** legate prin coridoare (ex.: „Server Room", „Compiler Lab", „Network Ops", „Database Vault", „Cafeteria", „Kernel Core").
- Fiecare jucător e un personaj mic („bob" colorat, ca în Among Us) care **se plimbă liber** cu WASD / săgeți. Coliziuni cu pereții.
- Camera (viewport) urmărește jucătorul; opțional „fog of war" / rază de vizibilitate limitată.
- Prin cameră sunt împrăștiate **stații de task** (pătrate marcate). Când ești lângă una și apeși „Use", se deschide minijocul acelui task.

### Taskuri = MINIJOCURI cu temă de informatică (NU grile!)
Foarte important: taskurile **nu** trebuie să fie întrebări cu variante. Trebuie să fie **mini-joculețe interactive** inventate, cu temă CS, exact în spiritul taskurilor din Among Us (unești fire, calibrezi, etc.). Fă cel puțin **6–8 tipuri** diferite, de exemplu:

1. **„Conectează firele"** — în stânga o coloană (ex. `Port`), în dreapta altă coloană (ex. `Protocol`); tragi cu mouse-ul un fir de la stânga la dreapta ca să faci potrivirea corectă (ex. `80 → HTTP`, `443 → HTTPS`, `22 → SSH`, `53 → DNS`). Firele au culori; task rezolvat când toate perechile sunt corecte.
2. **„Compilează codul"** — reordonează prin drag & drop niște linii de pseudocod/pași de compilare în ordinea corectă (ex. etapele: analiză lexicală → sintactică → semantică → generare cod).
3. **„Rezolvă adresa"** — bară de calibrare stil radar: potrivești o mască de subrețea / calculezi câți hoști încap (interacțiune de tip slider care trebuie oprit în zona verde).
4. **„Golește stiva / coada"** — apeși `pop`/`push` (sau `enqueue`/`dequeue`) în ordinea cerută ca să golești o structură de date animată.
5. **„Parcurge arborele"** — click pe nodurile unui arbore binar în ordinea unei parcurgeri cerute (inorder/preorder/postorder).
6. **„Sortează pachetele"** — un pas de bubble/insertion sort: tragi elementele ca să faci o singură trecere corectă.
7. **„Diagrama de proces"** — potrivești tranzițiile stărilor unui proces (Ready → Running → Blocked) trăgând săgeți.
8. **„Query SQL"** — bagi coloana lipsă / potrivești `JOIN`-ul dintr-un query dat prin drag & drop de fragmente.

Fiecare crewmate primește o **listă de taskuri** de făcut (ex. 4–5). O **bară de progres globală** a echipajului crește pe măsură ce taskurile se termină pe TOT serverul. Taskurile pot avea variații/parametri random ca să nu fie mereu identice.

### Impostorul
- **Kill:** impostorul are un buton de „Kill" activ când e aproape de un crewmate, cu **cooldown** (ex. 25–35s). Victima devine „cadavru" (rămâne pe mapă).
- Impostorul **nu poate** face taskuri real (dar are un „fake task" ca să pară că muncește).
- Opțional stretch: **sabotaj** (ex. „pică rețeaua", „supraîncălzire kernel") care forțează echipajul să alerge într-o cameră să repare printr-un minijoc, altfel pierd.
- Opțional stretch: **vents** (guri de aerisire) prin care impostorul se teleportează.

### Ședințe & Vot (ca în Among Us)
- Oricine găsește un cadavru poate apăsa **„Report"**; există și un buton **„Emergency Meeting"** în „Cafeteria".
- La ședință, jocul se oprește și se deschide **ecranul de vot**: toți jucătorii vii, avatar + nume, plus un buton **„Skip vote"**. Ai un **timer de discuție** urmat de un **timer de vot**.
- Se numără voturile; cel cu cele mai multe voturi e **ejectat** (dacă nu iese „Skip"/egalitate). La ejecție se poate afișa „X era / nu era impostor" (configurabil).
- Morții nu votează (dar pot continua să facă taskuri ca fantome — opțional).

### Chat & (opțional) Voice în timpul ședinței
- **Text chat**: în timpul ședinței, un panou de chat unde jucătorii vii discută. Ușor de făcut peste WebSocket-ul existent — mesajele trec prin server, serverul le retransmite tuturor. Morții au chat separat (sau deloc).
- **Voice chat (OPȚIONAL / stretch goal, marchează-l clar ca opțional):** implementează-l cu **WebRTC** (audio peer-to-peer între jucători), folosind serverul WebSocket doar pentru **signaling** (schimb de oferte/ICE). Activ **doar în timpul ședinței**, mut în rest. Dacă e prea complex, lasă doar text chat și pune un stub/TODO pentru voice — să nu blocheze restul jocului.

### Condiții de câștig
- **Echipajul câștigă** dacă: (a) termină toate taskurile, SAU (b) sunt ejectați/eliminați toți impostorii.
- **Impostorii câștigă** dacă: numărul de impostori ≥ numărul de crewmates vii (sau un sabotaj critic nereparat, dacă implementezi sabotaj).

## Materii & sursa conținutului (OBLIGATORIU — nu inventa conținut din afară)

Conținutul minijocurilor (perechile de potrivit, pașii de ordonat, valorile, enunțurile) trebuie să provină **exclusiv** din materialele mele de examen. **Nu inventa fapte, definiții sau valori din afara acestor surse** — dacă ai nevoie de conținut, ia-l din:

1. **Cursurile** (PDF/PPTX), în folderul `../../cursuri/` relativ la aplicație (calea absolută: `examen_licenta/cursuri/`). Un subfolder per materie.
2. **Subiectele de examen din anii trecuți**, în `examen_licenta/Subiecte/` (foldere pe ani, 2000–2024; PDF-uri, imagini, docx). Folosește-le ca să înțelegi **ce se cere de fapt la examen** și să calibrezi dificultatea și temele minijocurilor.
3. **Băncile de întrebări pe care le-am făcut deja** pentru jocul Conquistador: `conquistador/questions/*.yaml`. **Refolosește-le acolo unde sunt relevante** — sunt deja verificate și în format curat.

### Materiile disponibile (astea sunt opțiunile din selector) și de unde iei conținutul

| Materie (în selector) | Bancă existentă (refolosește) | Folder de curs (sursă) |
|---|---|---|
| Arhitectura sistemelor de calcul | `conquistador/questions/arhitecturi.yaml` | `cursuri/Arhitecturi/` |
| Programare C | `conquistador/questions/programare-c.yaml` | `cursuri/programare/` |
| OOP / C++ | `conquistador/questions/oop-cpp.yaml` | `cursuri/programare_oop_c++/` |
| PSO (sisteme de operare) | `conquistador/questions/pso.yaml` | `cursuri/PSO-NOI/` |
| Rețele | `conquistador/questions/retele.yaml` | `cursuri/retele_protocoale_noi/` |
| SDA (structuri de date) | `conquistador/questions/sda.yaml` | `cursuri/SDA/` |
| SQL / Baze de date | `conquistador/questions/sql.yaml` | `cursuri/BD/` |

### Formatul băncilor existente (ca să le poți citi/reutiliza)

Fișierele `conquistador/questions/*.yaml` au forma:
```yaml
topic: retele
nume: "Rețele de calculatoare"
intrebari:
  - tip: grila            # sau numeric_exact / numeric_aprox
    dificultate: licenta
    enunt: "..."
    variante: ["A", "B", "C", "D"]
    corect: 3             # indexul răspunsului corect (de la 0)
    explicatie: "..."     # se arată DUPĂ răspuns (rol educativ)
```

### Cum transformi conținutul în minijocuri (nu în grile!)
Nu afișa întrebările ca grile. **Extrage din ele materialul** și transformă-l în minijocuri interactive. Exemple:
- O grilă de Rețele despre porturi/protocoale → minijocul **„conectează firele"** (`80→HTTP`, `443→HTTPS`, `22→SSH`).
- O întrebare de SDA despre parcurgeri de arbore → minijocul **„parcurge arborele"** (click pe noduri în ordinea corectă).
- O întrebare de PSO despre stările unui proces → minijocul **„diagrama de proces"** (potrivești tranzițiile).
- O întrebare de SQL despre `JOIN`/`GROUP BY` → minijocul **„query SQL"** (drag & drop de fragmente).
- Perechile corecte / ordinea corectă / valoarea corectă le iei din câmpul `corect` + `explicatie` al băncii, sau din curs/subiecte.

Dacă pentru o materie aleasă nu ai destul material în bancă pentru un tip de minijoc, extrage perechi/pași suplimentari **din cursul corespunzător** — dar rămâi în interiorul acelor surse. Ideal: pune conținutul minijocurilor tot în fișiere de date (YAML/JSON) pe server, grupate pe materie, ca să pot adăuga ușor conținut nou fără să modific logica.

## Cerințe de UX / calitate
- Lobby cu cod de cameră, **selector de materii (max 3) pentru cel care creează camera**, listă live de jucători, buton „Ready", alegere de culoare/nume, start când toți sunt gata (min. ~4 jucători, până la 8). Materiile alese se văd în lobby.
- **Reconectare grațioasă** dacă pică netul câteva secunde (ca la Conquistador).
- UI curat, temabil (aplicația-gazdă are teme dark/light aplicate prin variabile CSS și mesaje `postMessage` — respectă asta dacă jocul e încărcat în iframe).
- Robust la deconectări: dacă pleacă un jucător, jocul continuă corect.
- Sunet/feedback vizual minimal (kill, task done, meeting) — nice to have.

## Ce vreau să livrezi
1. **Serverul** Node.js + `ws` (un fișier `server.js` bine comentat + `package.json`), autoritar, stare în RAM, gata de proxat prin nginx pe `/amongus/`.
2. **Clientul**: `index.html` + JS vanilla + Canvas (game loop, randare mapă/jucători, minijocurile de task, ecranul de vot, chat).
3. Protocol WebSocket clar documentat (ce mesaje trimite clientul, ce trimite serverul).
4. Un scurt README cu cum rulez local (`node server.js`) și cum se leagă în Docker/nginx, în același stil ca serviciul Conquistador existent.
5. Instrucțiuni de integrare ca „materie/joc" nou în aplicația-gazdă (o intrare nouă, încărcată în iframe, sincronizată cu tema).

Începe prin a-mi propune structura de fișiere și protocolul de mesaje, apoi implementează pas cu pas. Scrie cod care rulează, comentat în română.
