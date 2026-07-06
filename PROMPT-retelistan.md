# Prompt pentru Fable — „Rețelistan" (lume 2D explorabilă de teorie · Rețele)

> Copiază tot ce e mai jos (de la „Vreau să construiești...") și dă-i-l lui Fable ca prompt.
> Contextul de sus (acest paragraf) NU face parte din prompt — e doar pentru tine.
> Scopul jocului: să înlocuiască „cele 10 PDF-uri" cu **un singur loc, viu și explorabil**, unde teoria de la Rețele prinde viață. NU e un drill cu grile — e o hartă prin care te plimbi cu un personaj și, pe măsură ce explorezi, teoria se deschide și se expandează în straturi.

---

Vreau să construiești un **joc 2D explorabil în browser** numit **„Rețelistan"** — o hartă top-down (vedere de sus, stil Pokémon/Zelda) prin care miști un personaj, iar în fiecare regiune înveți **teoria** de la materia **Rețele și protocoale**. Jocul se integrează într-o aplicație web existentă de pregătire pentru examenul de licență („Licență Trainer").

Ideea centrală: **transformă cursurile PDF în teorie interactivă, într-un singur loc.** Nu vreau grile țintite (aplicația are deja destule) — vreau o experiență de tip „mergi într-o mapă, ajungi la un obiect/NPC/terminal, apeși o tastă și teoria se deschide și se expandează progresiv (rezumat → detaliu → diagramă → «💡 de examen»)". Fiecare regiune a hărții = o temă din cursuri.

## Context tehnic OBLIGATORIU (respectă-l — nu inventa alt stack)

Aplicația-gazdă e scrisă în **HTML + CSS + JavaScript vanilla, fără niciun framework și fără build step**. Materia „Rețele" este o **pagină embed** (`materii/app/retele/index.html`) încărcată în `iframe` de shell-ul aplicației.

- **Frontend: HTML5 Canvas 2D + JavaScript vanilla.** NU folosi React/Vue/Phaser/librării grele. Canvas 2D + `requestAnimationFrame` pentru game loop e suficient și corect pentru un joc top-down cu un personaj care se plimbă. Fără bundler, fără npm, fără build.
- **FĂRĂ backend.** Jocul e 100% client-side (single-player, explorare de teorie). Progresul (zone vizitate, % citit, „fapte-cheie" colectate) se salvează în `localStorage`. Nu adăuga niciun server Node — spre deosebire de „Among Us CS"/„Conquistador", ăsta NU e multiplayer.
- Codul să fie curat, comentat în română, ușor de citit de niște studenți.
- Font-uri deja disponibile în aplicație: **Inter** (text) + **JetBrains Mono** (mono/valori). Folosește-le.

## Integrare în aplicație — EXACT cum se leagă (respectă tiparul existent)

Materia „Rețele" e înregistrată în `materii/app/js/app.js`, în array-ul `MATERII`, ca:
```js
{
  id:"retele", nume:"Rețele", icon:"🌐",
  tip:"embed", src:"retele/index.html",
  sectiuni:[
    {id:"ref", nume:"Învață", icon:"📘"},
    {id:"osi", nume:"OSI & TCP/IP", icon:"📚"},
    /* ... restul tab-urilor ... */
    {id:"exercitii", nume:"Exerciții examen", icon:"📝"}
  ]
}
```
Pagina embed (`retele/index.html`) funcționează pe tab-uri: butoane `<button data-tab="...">` într-un `<nav id="tabs">`, pagini `<section class="page" id="page-...">` care se comută cu funcția `activateTab(tab)`, plus rutare prin `location.hash`.

**Integrează jocul ca un TAB NOU în materia Rețele** (fără iframe imbricat, ca să meargă tema fără plumbing nou):

1. În `js/app.js`, adaugă în `sectiuni` (materia `retele`) o intrare nouă, ex.:
   `{id:"harta", nume:"Rețelistan 🗺️", icon:"🎮"}`.
2. În `retele/index.html`:
   - adaugă butonul de tab: `<button data-tab="harta">🎮 Rețelistan</button>` în `<nav id="tabs">`;
   - adaugă pagina: `<section class="page" id="page-harta"> ... <canvas id="worldCanvas"></canvas> ... </section>`;
   - include, la finalul body-ului, **două fișiere noi**: `retele/harta/theory.js` (conținutul de teorie, ca date) și `retele/harta/game.js` (logica jocului). Ține codul separat de fișierul existent — NU umfla `retele/index.html` cu mii de linii; pune logica în `retele/harta/game.js`.
3. Jocul trebuie să se **pornească/oprească** corect când tab-ul devine activ/inactiv (pornește `requestAnimationFrame`-ul doar când `#page-harta` e `.active`; oprește-l când pleacă, ca să nu consume resurse degeaba). Poți asculta comutarea de tab (`activateTab` / `hashchange`) sau observa clasa `.active` pe `#page-harta`.

### Temă (dark/light) — OBLIGATORIU

Aplicația-gazdă controlează tema și o trimite paginii embed prin `postMessage`. Pagina `retele/index.html` are deja:
```js
window.addEventListener('message', function(e){
  const d = e.data || {};
  if(d.type==='theme' && d.theme){ setTheme(d.theme); applyThemeVars(d.vars); }
  else if(d.type==='tab' && d.tab) activateTab(d.tab);
});
```
Jocul trebuie să **respecte tema curentă**: NU hardcoda culori în Canvas. Citește culorile din variabilele CSS ale documentului (ex. `getComputedStyle(document.documentElement).getPropertyValue('--bg')`, `--panel`, `--txt`, `--muted`, `--accent`, `--accent2`, `--good`, `--bad`, `--border`) și re-citește-le când se schimbă tema, apoi redesenează harta. Paleta implicită (gruvbox cald) e definită în `:root` din `retele/index.html`:
`--bg`, `--bg2`, `--bg3`, `--panel`, `--txt`, `--muted`, `--border`, `--accent`, `--accent2`, `--good`, `--bad`, `--warn`. Folosește aceste tokenuri și pentru UI-ul jocului (panouri de teorie, minimap, HUD), ca totul să se schimbe automat la dark/light.

## Gameplay — cum vreau să se joace

### Personajul și mișcarea
- Un personaj mic (sprite desenat pe Canvas — un „bob" simpatic, sau un pachet de date antropomorf) pe care îl miști cu **WASD / săgeți**. Adaugă și **controale touch** (un mic joystick / d-pad pe ecran) ca să meargă și pe telefon, fiindcă aplicația e responsive.
- Coliziuni cu pereții/obstacolele. Camera (viewport) urmărește personajul. Mișcare fluidă (interpolare), nu „pe casete" bruște.
- Un **minimap** în colț și un HUD discret (zona curentă, % teorie citită, fapte-cheie colectate).

### Harta = regiuni de teorie
Împarte lumea în **regiuni tematice**, fiecare legată de un curs real (vezi tabelul din „Sursa conținutului"). O regiune e o zonă vizual distinctă (culoare/tematică/decor) cu:
- un **panou de intrare** (portal/semn) care spune ce înveți acolo;
- mai multe **puncte de interes** (terminale 💻 / NPC-uri 🧑‍🏫 / totemuri 📡 / cufere 📦) — fiecare deschide o bucată de teorie;
- opțional un mic **„boss de recapitulare"** la ieșire: 2–3 întrebări rapide care confirmă că ai reținut ideile-cheie din regiune (deblochează regiunea următoare / o insignă).

Legăturile dintre regiuni (poteci/coridoare/poduri) pot urma logica stivei de rețea (de la „semnal fizic" spre „aplicație"), ca drumul prin hartă să reflecte drumul unui pachet prin niveluri.

### Interacțiunea cu teoria — „se expandează", exact ce vreau
Când personajul e lângă un punct de interes, apare un prompt („apasă **E** / atinge") și se deschide un **panou de teorie** peste joc. Panoul prezintă teoria **în straturi progresive**, ca să nu te copleșească:
1. **Rezumat** (1–2 fraze, ideea în esență);
2. **Detaliu** (explicația completă, cu termeni-cheie evidențiați);
3. **Diagramă / vizual** (desenată în SVG/Canvas — ex. antetul IPv4 pe câmpuri, handshake-ul TCP în 3 pași, stiva OSI, o schemă de adresare);
4. **💡 De examen** (ce a picat efectiv la examen pe tema asta — cârlig direct spre subiecte).

Utilizatorul apasă „Continuă / Mai mult" ca să extindă fiecare strat (accordion / dezvăluire treptată). La final, punctul se marchează „✔ citit" și se adaugă o **„faptă-cheie"** în colecția lui (un fel de jurnal/„pokedex de concepte" pe care îl poate răsfoi oricând). Progresul se salvează în `localStorage`.

Ton: prietenos, clar, „viu" — ca și cum un coleg bun îți explică, nu ca un PDF sec. Dar **fără să inventezi** (vezi mai jos): reformulează și structurează conținutul din cursuri, nu adăuga fapte din afară.

## Sursa conținutului (OBLIGATORIU — numai din materialele mele)

Toată teoria (definiții, câmpuri, valori, porturi, pași de algoritm, diagrame) trebuie să provină **exclusiv** din materialele mele. **Nu inventa fapte, definiții sau valori din afara acestor surse.**

1. **Cursurile de Rețele** (PDF), în `examen_licenta/cursuri/retele_protocoale_noi/` — calea relativă din aplicație: `../../cursuri/retele_protocoale_noi/`. Fișiere:
   - `intro.pdf`, `Introducere in Retele 2025.pdf`, `Overview Protcom.pdf` — noțiuni de bază, modele OSI/TCP-IP;
   - `Transmisii de Date 2026.pdf` — semnale, modulație, codări, biți/octeți, medii;
   - `LAN Course 2026.pdf` — Ethernet, CSMA/CD, switch, MAC, cadru, VLAN;
   - `ip.pdf` — adresare IPv4, subnetizare, fragmentare, antetul IP;
   - `routing.pdf` — rutare, tabele, protocoale;
   - `tcp_udp.pdf` — TCP vs UDP, handshake, flaguri, porturi;
   - `dns.pdf`, `apps.pdf`, `sockets.pdf` — DNS, protocoale de aplicație (HTTP/DHCP/…), socket-uri;
   - `Wireless Communications 2026.pdf` — 802.11, CSMA/CA.
2. **Notițele deja curate** din `examen_licenta/materii/retele/notite/` (`arp.md`, `ethernet.md`, `ipv4_header_explained.md`, `tcp.md`) — refolosește-le, sunt deja verificate.
3. **Rezolvările de subiecte** din `examen_licenta/materii/retele/rezolvari/` (`subiect_2022.md`, `subiect_2023.md`, `subiect_2024.md`) și **subiectele din anii trecuți** din `examen_licenta/Subiecte/` (foldere pe ani) — folosește-le ca să scrii secțiunea **„💡 De examen"** a fiecărei teme (ce s-a cerut efectiv) și să calibrezi ce e important.

### Maparea regiunilor pe cursuri (așa vreau harta)

| Regiune (nume în joc) | Curs sursă | Ce înveți acolo |
|---|---|---|
| 🏡 Satul Intro | `intro.pdf`, `Overview Protcom.pdf` | ce e o rețea, terminologie, modelele OSI vs TCP/IP |
| 🌊 Câmpia Semnalelor | `Transmisii de Date 2026.pdf` | semnal, modulație, codări, cum se trimit biții în octeți, medii |
| 🏙️ Orașul LAN | `LAN Course 2026.pdf`, `ethernet.md`, `arp.md` | Ethernet, cadru, MAC, CSMA/CD, switch, VLAN, ARP |
| ⛰️ Munții IP | `ip.pdf`, `ipv4_header_explained.md` | antet IPv4, adresare, subnetizare/VLSM, fragmentare |
| 🚦 Răscrucea Routing | `routing.pdf` | rutare, tabele de rutare, protocoale de rutare |
| ⚓ Portul Transport | `tcp_udp.pdf`, `tcp.md` | TCP vs UDP, handshake în 3 pași, flaguri, porturi |
| 📚 Biblioteca Aplicații | `dns.pdf`, `apps.pdf`, `sockets.pdf` | DNS, HTTP/DHCP/TFTP/SNMP, porturi, socket-uri |
| 📡 Turnul Wireless | `Wireless Communications 2026.pdf` | 802.11, CSMA/CA, particularități wireless |

### Formatul conținutului (pune-l în date, nu în cod)

Ține teoria **separat de logica jocului**, într-un fișier de date `retele/harta/theory.js`, ca să pot adăuga/edita ușor conținut fără să ating motorul jocului. Structură sugerată:
```js
window.RETELISTAN_THEORY = {
  regiuni: [
    {
      id: "ip",
      nume: "Munții IP",
      icon: "⛰️",
      sursa: "ip.pdf / ipv4_header_explained.md",
      puncte: [
        {
          id: "antet-ipv4",
          titlu: "Antetul IPv4",
          rezumat: "Antetul IP poartă adresele sursă/destinație și controlul fragmentării.",
          detaliu: "Explicație clară a câmpurilor... (reformulare din curs, fără fapte noi)",
          diagrama: "ipv4-header",      // cheie către un desen Canvas/SVG definit în game.js
          examen: "2024: câmpurile de fragmentare (Identification, DF/MF, Fragment Offset) — vezi subiect_2024.md",
          faptaCheie: "Fragment Offset se măsoară în unități de 8 octeți."
        }
        // ... alte puncte
      ],
      recap: [ /* 2-3 întrebări scurte de confirmare, cu răspuns + explicație */ ]
    }
    // ... alte regiuni
  ]
};
```
Diagramele importante (antet IPv4/TCP/Ethernet pe câmpuri, handshake TCP în 3 pași, stiva OSI cu 7 niveluri, o schemă de adresare/subnetizare) desenează-le clar, cu etichete și dimensiuni pe biți/octeți — acestea sunt exact lucrurile care se cer la examen.

## Cerințe de UX / calitate
- **Responsive**: merge pe desktop (tastatură) și pe telefon (touch/joystick). Canvas-ul se redimensionează la containerul din `#page-harta`.
- **Temabil**: toate culorile din variabilele CSV ale gazdei; redesenează la schimbarea temei (dark/light).
- **Progres persistent** în `localStorage` (zone vizitate, puncte citite, fapte-cheie, insigne). Buton „resetează progresul".
- **Accesibil și clar**: text lizibil, contrast bun, panourile de teorie se pot închide cu `Esc` / buton, jocul se pune pe pauză când un panou e deschis.
- **Fără dependențe externe**: totul local (Canvas + JS vanilla). Fără CDN-uri grele; font-urile Inter/JetBrains Mono sunt deja încărcate de aplicație.
- **Performanță**: game loop oprit când tab-ul nu e activ; desen eficient (nu redesena tot la 60fps dacă nu e nevoie).
- Feedback minimal plăcut (mic sunet/animație la „punct citit", la „faptă-cheie colectată", la deblocare regiune) — nice to have, opțional.

## Ce vreau să livrezi
1. **`retele/harta/game.js`** — motorul jocului (game loop, hartă/tilemap, personaj + mișcare + coliziuni, cameră, minimap, puncte de interes, panoul de teorie cu straturi progresive, HUD, progres în `localStorage`, sincronizare temă). Comentat în română.
2. **`retele/harta/theory.js`** — tot conținutul de teorie ca date (structurat pe regiuni/puncte), extras din cursuri/notițe/rezolvări, **fără fapte inventate**.
3. **Integrarea**: modificările în `js/app.js` (intrarea nouă în `sectiuni`) și în `retele/index.html` (butonul de tab `data-tab="harta"`, `<section id="page-harta">` cu `<canvas>`, includerea celor două fișiere JS), plus pornirea/oprirea corectă a game loop-ului la comutarea tab-ului.
4. Un scurt **README** (`retele/harta/README.md`) cu: ce regiuni acoperă, de unde vine conținutul (mapare pe cursuri), cum adaug conținut nou în `theory.js`, și controalele.

Începe prin a-mi propune: (a) structura de fișiere, (b) lista regiunilor cu punctele de teorie pe care le vei extrage din fiecare curs, și (c) cum arată bucla de joc + panoul de teorie. Apoi implementează pas cu pas. Scrie cod care rulează, comentat în română, și **respectă întocmai** integrarea și tema descrise mai sus.
