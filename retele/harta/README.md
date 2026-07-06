# Rețelistan 🗺️ — lume 2D explorabilă de teorie (Rețele)

Un joc top-down (stil Pokémon/Zelda) integrat ca **tab în materia Rețele**:
te plimbi cu un mic pachet de date printr-o hartă împărțită în regiuni, iar în
fiecare regiune teoria unui curs „prinde viață" prin puncte de interes care se
deschid **în straturi progresive**: rezumat → explicație completă → diagramă →
**💡 de examen**. Nu e un drill cu grile — e cursul, făcut explorabil.

## Fișiere

| Fișier | Rol |
|---|---|
| `theory.js` | **Doar date**: `window.RETELISTAN_THEORY` — regiuni, puncte de teorie, întrebări de recapitulare. Generat din cursuri + notițe + rezolvări și verificat contra surselor. |
| `game.js` | Motorul: game loop (rAF), hartă pe tile-uri, personaj + coliziuni, cameră, minimap, HUD, panouri de teorie, recapitulări, diagrame SVG, progres în `localStorage`, sincronizare temă. |
| integrare | `retele/index.html` (tab `harta` + `<section id="page-harta">` + includerea celor două scripturi) și `js/app.js` (intrarea `{id:"harta"}` în `sectiuni`). |

Fără backend, fără build, fără dependențe externe — HTML + CSS + JS vanilla,
100% client-side. Progresul stă în `localStorage` (cheia `retelistan-v1`).

## Harta = cursurile

Drumul prin hartă urmează drumul unui pachet prin stiva de rețea (fizic →
aplicație). Poarta spre regiunea următoare se deschide după **recapitularea**
(3 întrebări, minim 2 corecte) de la „paznicul" 🛡️ al regiunii curente.

| Regiune | Sursa conținutului | Ce înveți |
|---|---|---|
| 🏡 Satul Intro | `intro.pdf`, `Overview Protcom.pdf`, `Introducere in Retele 2025.pdf` | ce e o rețea, comutare, OSI vs TCP/IP, încapsulare |
| 🌊 Câmpia Semnalelor | `Transmisii de Date 2026.pdf` | semnale, modulație (ASK/FSK/PSK), codări (NRZ/Manchester), medii |
| 🏙️ Orașul LAN | `LAN Course 2026.pdf`, `ethernet.md`, `arp.md` | cadrul Ethernet, MAC, CSMA/CD, switch, VLAN, ARP |
| ⛰️ Munții IP | `ip.pdf`, `ipv4_header_explained.md` | antetul IPv4, adresare, subnetizare/VLSM, fragmentare |
| 🚦 Răscrucea Routing | `routing.pdf` | tabele de rutare, longest prefix match, protocoale |
| ⚓ Portul Transport | `tcp_udp.pdf`, `tcp.md` | TCP vs UDP, antete, handshake în 3 pași, flaguri, porturi |
| 📚 Biblioteca Aplicații | `dns.pdf`, `apps.pdf`, `sockets.pdf` | DNS, DHCP (DORA), HTTP, porturi, socket-uri |
| 📡 Turnul Wireless (ramură din LAN) | `Wireless Communications 2026.pdf` | 802.11, CSMA/CA, stația ascunsă, RTS/CTS |

Secțiunile „💡 De examen" vin din `materii/retele/rezolvari/` (2022–2024) și
din scanarea subiectelor din `Subiecte/` (2000–2024).

## Online — jucătorii se văd între ei 🌐

Pe site, jocul are **prezență online**: la prima intrare îți alegi un nume
(2–14 caractere, salvat în browser), iar toți cei care explorează Rețelistanul
în acel moment se văd unii pe alții pe hartă — siluete colorate cu numele
deasupra, puncte pe minimap și contorul 👥 din HUD (click pe el = schimbi
numele / intri online). **Progresul rămâne local** — pe fir se trimit doar
numele, poziția, avatarul (2 indici) și, la nevoie, indexul unui emoji/frază.

Partea de server e serviciul **`retelistan/`** (Node + WebSocket, port 3004,
proxat de nginx la `/retelistan/ws`) — stare 100% în memorie, fără bază de
date. Dacă serverul nu răspunde (ex. deschizi aplicația local, fără docker),
jocul merge normal, offline, și reîncearcă discret conexiunea.

## Controale

- **Desktop:** WASD / săgeți — mișcare · **Shift** — fugă · **E / Space / Enter** —
  interacțiune · **J** — jurnal · **I** — inventar · **R** — emoji/mesaje ·
  **Esc** — închide panoul.
- **Telefon:** joystick virtual (stânga-jos) + buton **E** (dreapta-jos) +
  butonul **🙂** (jos-centru) pentru emoji/mesaje.
- **❓** din HUD redeschide ecranul „cum se joacă"; **📖** deschide jurnalul
  (faptele-cheie colectate, insigne, reset progres); **🎒** deschide inventarul
  (materiale, unelte, cunoștințe, avatar); **🔊** comută efectele sonore;
  **🎵** comută muzica de fundal.

## Crafting, poduri și insule 🛠️

Peste explorarea de teorie e o mică buclă de **crafting** — un strat bonus care
**nu** blochează drumul principal (porțile rămân deschise de recapitulări):

- **Materiale** 🪵🔩🪨🔌⚙️ pică prima dată când citești un punct de teorie și, mai
  ales, când treci recapitularea unui paznic (răsplată de „challenge": bani + piese).
- La **bancul de lucru 🛠️** (în satul Intro) combini materialele în unelte după
  rețete: **🔨 Ciocan** (refolosibil) → **🧰 Kit de pod** → **🏮 Felinar** (de
  vânzare) → **🎓 Diplomă de Rețelist** (doar după ce ai citit TOATĂ teoria).
- **Podurile stricate 🚧** (peste apă, în Câmpia Semnalelor și Portul Transport)
  se repară cu un Kit de pod — poți face kitul pe loc, la pod, dacă ai materialele.
  Dincolo te așteaptă o **insulă secretă 🎁** cu bani, piese rare și o faptă-cheie
  în plus.
- La **negustor 🏪** (tot în sat) vinzi ce-ți prisosește și cumperi ce-ți lipsește —
  supapa care ține economia fără blocaje.

Datele stau în secțiunea „2b" din `game.js` (`RESURSE`, `RETETE`, `INSULE`), iar
logica în modulul `Craft`; totul e persistat în `localStorage` (`inventar`,
`unelte`, `bani`, `poduri`, `insule`). Insulele/podurile sunt **date-driven** —
adaugi o intrare în `INSULE` (moat + insulă + dale de pod) și `construiesteInsule()`
le sapă singur în hartă.

## Social: emoji, mesaje, avatar

Butonul **🙂** (sau tasta **R**) deschide o paletă cu **8 emoji** + **8 fraze**
gata făcute („Salut!", „Baftă!", „GG!"…). Ce trimiți apare ca bulă deasupra
capului tău și, dacă ești online, deasupra capului tău la ceilalți jucători.
Paleta e **fixă și indexată** — pe fir circulă doar un index (0–15), deci serverul
nu vede niciodată text arbitrar (fără moderare, fără injecții).

Din **🎒 → 🎨** (sau din modalul de nume 🌐) îți alegi **avatarul**: una din 8
culori + un accesoriu (🎓🧢👑🎩🌸⭐). Se salvează separat de progres
(`localStorage: retelistan-avatar`) și se vede la toți cei online. Tot de acolo ai
și **logout** („🚪 Ieși offline") — te deconectează și uită numele salvat.

## Cum adaug conținut nou (fără să ating motorul)

În `theory.js`, la regiunea dorită, adaugă în `puncte`:

```js
{
  "id": "slug-unic",
  "titlu": "Titlul punctului",
  "tip": "terminal",              // terminal | npc | totem | cufar (doar aspectul)
  "rezumat": "1–2 fraze.",
  "detaliu": "Explicația completă. **bold**, `mono`, liste cu \"- \", paragrafe cu linie goală.",
  "diagrama": null,                // sau o cheie din game.js → Diagrame.DATE (ex. "ipv4-header")
  "examen": null,                  // sau "2024: ce s-a cerut…"
  "faptaCheie": "O propoziție memorabilă, colecționabilă.",
  "sursa": "fisier.pdf p.X–Y"
}
```

Jocul plasează punctul automat pe hartă (sloturi predefinite per regiune) —
nu trebuie coordonate. Pentru o **diagramă nouă**, adaugă o intrare în `DATE`
din `game.js` (secțiunea 17) folosind unul dintre renderele existente:
`biti` (antete pe 32 de biți), `octeti` (cadre pe octeți), `secv` (diagrame de
secvență), `stiva`, `nest` (încapsulare), `unda` (forme de undă), `flux`
(flowchart), `topo`, `tabel` sau `compus` (combinații).

## Detalii tehnice (pe scurt)

- **Temă:** nicio culoare hardcodată pe canvas — totul se derivă din variabilele
  CSS ale gazdei (`--bg`, `--panel`, `--accent`…), recitite la schimbarea temei
  (MutationObserver pe `data-theme`/`style`); UI-ul DOM folosește direct `var(...)`.
- **Performanță:** bucla rAF pornește doar când `#page-harta` e `.active` și
  fila e vizibilă (MutationObserver + `visibilitychange`); se desenează numai
  intervalul de tile-uri vizibil; jocul stă pe **pauză** cât un panou e deschis.
- **Responsive:** canvas-ul urmărește containerul (ResizeObserver, DPR-aware).
- **Progres:** `localStorage` → puncte citite, fapte-cheie, recapitulări trecute,
  porți deschise, poziția pe hartă, sunet on/off. „Resetează progresul" e în 📖.
