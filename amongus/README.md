# Among Us CS 🛸 — joc multiplayer cu temă de informatică

Clonă „Among Us” în browser, integrată în Licență Trainer: 4–8 jucători pe o
stație-laborator 2D (vedere de sus), 1–2 **impostori** contra echipajului.
Taskurile echipajului sunt **minijocuri interactive** construite exclusiv din
materialele de examen (băncile Conquistador + cursuri): conectezi porturi de
protocoale, ordonezi etapele compilării, parcurgi arbori binari, repari
interogări SQL, calibrezi măști de subrețea…

Construit pe același tipar ca serviciul Conquistador:

- **Server**: un singur proces **Node.js + `ws`** (`server.js`), **autoritar** —
  poziții, coliziuni, roluri, soluțiile minijocurilor, kill/vot/sabotaj, totul
  se decide pe server. Stare **doar în RAM** (camerele dispar când pleacă toți).
- **Client**: `public/` — HTML + **Canvas 2D** + JavaScript vanilla, fără
  framework-uri și fără build step. E servit chiar de serviciul Node, deci
  clientul și serverul pleacă mereu împreună, din aceeași imagine.
- **Anti-cheat**: cine e impostor nu se trimite niciodată echipajului; soluțiile
  nu pleacă spre client; snapshot-urile sunt filtrate per destinatar (cei vii
  văd doar raza lor de vizibilitate — nici cu DevTools nu vezi prin pereți).

Protocolul de mesaje e documentat în [PROTOCOL.md](PROTOCOL.md).

## Structura

```
amongus/
├── server.js            # tot serverul: lobby, simulare 20Hz, taskuri, ședințe, vot
├── content/             # conținutul minijocurilor, per materie (SOLUȚIILE stau aici!)
│   ├── _SCHEMA.md       #   formatul fișierelor + regulile per tip de minijoc
│   ├── retele.yaml      #   derivate din conquistador/questions/*.yaml + cursuri
│   ├── pso.yaml         #   (arhitecturi, programare-c, oop-cpp, sda, sql la fel)
│   └── …
├── public/              # clientul (servit de server.js pe /amongus/)
│   ├── index.html       #   ecrane (meniu/lobby/joc) + tot CSS-ul
│   ├── map.js           #   geometria hărții — PARTAJATĂ server+client (coliziuni)
│   ├── retea.js         #   WebSocket + sesiune + reconectare automată
│   ├── joc.js           #   randarea Canvas (hartă, boți, fog), input, predicție
│   ├── minijocuri.js    #   cele 8 minijocuri de task (DOM/SVG în modal)
│   ├── sunete.js        #   efectele din /audio/ (kill, meeting, sabotaj…)
│   └── ui.js            #   lobby, HUD, ședințe/vot, chat, rutarea mesajelor
├── package.json         # dependențe: ws + js-yaml
└── Dockerfile           # imagine node:22-alpine, port 3003, healthcheck /health
```

## Cum rulez local

```bash
cd amongus
npm install
node server.js            # ascultă pe :3003
```

Deschide `http://localhost:3003/` în mai multe taburi/ferestre (minim 4 jucători;
pentru teste rapide poți coborî pragul: `MIN_PLAYERS=2 node server.js`).
Sunetele vin din `/audio/` al site-ului static, deci local rulează fără sunet —
totul celălalt merge identic.

Timerele și regulile se pot ajusta din variabile de mediu (valori în ms):
`T_DISCUTIE`, `T_VOT`, `KILL_CD`, `SABOTAJ_MS`, `FIX_MS`, `TASKS_PER_PLAYER`,
`MIN_PLAYERS`, `URGENTE` … (vezi începutul lui `server.js`).

## Deploy (Docker + nginx, ca la Conquistador)

CI-ul construiește imaginea `ghcr.io/floreagabriel/ez_learn_ez_exam_amongus`
la orice push care atinge `amongus/`. Pe Raspberry Pi, adaugă serviciul în
`docker-compose` lângă `conquistador`:

```yaml
  amongus:
    image: ghcr.io/floreagabriel/ez_learn_ez_exam_amongus:latest
    container_name: amongus
    restart: unless-stopped
    # fără porturi publicate: nginx îl accesează prin rețeaua compose
```

`nginx.conf` (deja inclus în acest repo) proxează `location /amongus/` către
`amongus:3003` cu upgrade de WebSocket. Watchtower actualizează imaginea la fel
ca pe celelalte servicii.

## Integrarea în aplicația-gazdă

- intrare nouă în bara laterală: **„🛸 Among Us CS”** (`js/app.js`,
  `showAmongUs()`), încărcată în iframe din `/amongus/`;
- tema dark/light se sincronizează prin `postMessage {type:"theme"}` — clientul
  respectă contractul embed al aplicației (aceleași variabile CSS).

## Cum adaugi conținut nou la minijocuri

Editezi `content/<materie>.yaml` (formatul complet în `content/_SCHEMA.md`) și
repornești serviciul. Regula de aur: fiecare intrare are câmpul `sursa` și
provine din băncile de întrebări sau din cursuri — nu se inventează fapte.
Intrările care nu trec validarea de la pornire sunt sărite cu un avertisment în
log (`docker logs amongus`), nu dărâmă serverul.

## Gameplay pe scurt

- **Lobby**: creezi cameră → primești un cod de 4 litere → colegii intră cu el.
  Gazda alege **materiile partidei (max 3)** și numărul de impostori; fiecare
  își alege culoarea; start când toți sunt gata (min. 4).
- **Echipaj**: mergi (WASD/săgeți; pe telefon joystick virtual) la stațiile cu
  „!”, rezolvi minijocul (E sau butonul „Folosește”). Bara globală crește;
  la 100% echipajul câștigă.
- **Impostor**: kill cu cooldown (K), **sabotaj** „supraîncălzire kernel”
  (echipajul are 45s să repare în Kernel Core, altfel impostorii câștigă),
  listă de taskuri de fațadă ca să pară că muncește.
- **Ședințe**: raportezi un cadavru (R) sau apeși butonul de urgență din
  Cafeteria → discuție cu **chat text** → vot → cel votat e ejectat (se afișează
  dacă era impostor). Morții devin fantome: se plimbă, **taskurile lor încă
  contează**, au chat separat.
- **Reconectare grațioasă**: dacă îți pică netul, la revenire intri automat
  înapoi în partidă, cu rolul și taskurile tale.

## Limitări & TODO (asumate)

- **Voice chat în ședință** — neimplementat (stretch goal din speც). Schelet
  gândit: WebRTC audio peer-to-peer, cu serverul WS existent folosit doar
  pentru signaling (offer/answer/ICE în mesaje noi `rtc-*`), activ doar în faza
  de ședință. Chatul text acoperă funcționalitatea până atunci.
- **Vents** pentru impostor — neimplementate (opționale în spec).
- Fantomele merg prin coridoare ca toți ceilalți (nu trec prin pereți).
