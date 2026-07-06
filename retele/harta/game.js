/* ============================================================================
   RETELISTAN — lume 2D explorabilă de teorie pentru materia „Rețele"
   ----------------------------------------------------------------------------
   Motorul jocului: hartă pe tile-uri, personaj cu mișcare fluidă și coliziuni,
   cameră, minimap, puncte de interes care deschid panouri de teorie în straturi
   progresive, „boss de recapitulare" per regiune, progres în localStorage,
   temă sincronizată cu aplicația-gazdă (variabile CSS), controale touch.

   Conținutul de teorie vine SEPARAT, din retele/harta/theory.js
   (window.RETELISTAN_THEORY) — aici e doar motorul + diagramele.

   Fără dependențe externe. Canvas 2D + requestAnimationFrame. Cod vanilla.
   ============================================================================ */
(function () {
  'use strict';

  /* ══════════════════════════ 1. CONSTANTE ═══════════════════════════════ */

  const TILE = 32;                 // dimensiunea unui tile, în px logici
  const LUME_W = 110;              // lățimea lumii, în tile-uri
  const LUME_H = 80;               // înălțimea lumii, în tile-uri
  const VITEZA = 150;              // viteza de mers, px/s
  const VITEZA_FUGA = 235;         // viteza cu Shift ținut apăsat
  const RAZA_INTERACT = 52;        // distanța (px) de la care poți interacționa
  const STORAGE_KEY = 'retelistan-v1';

  // tipuri de teren (stratul de jos)
  const T = { IARBA: 0, DRUM: 1, APA: 2, NISIP: 3, PODEA: 4, SALBATIC: 5 };
  // tipuri de obstacole (stratul solid; 0 = liber)
  const S = { LIBER: 0, COPAC: 1, STANCA: 2, CLADIRE: 3, ZID: 4, POARTA: 5, TURN: 6, LADA: 7, CASA: 8, RAFT: 9, POD: 10, BANC: 11, TARABA: 12 };

  /* ═════════════════ 2. AȘEZAREA REGIUNILOR PE HARTĂ ══════════════════════
     Drumul prin hartă urmează drumul unui pachet prin stiva de rețea:
     Intro → Semnale (fizic) → LAN (legătură) → IP (rețea) → Routing →
     Transport → Aplicații, cu Turnul Wireless ca ramură din Orașul LAN,
     accesibilă printr-o trecătoare pe marginea de est a hărții.           */

  const ASEZARE = [
    // rect = [x0, y0, x1, y1) în tile-uri; deblocat = id-ul regiunii al cărei
    // boss trebuie trecut ca să se deschidă poarta spre regiunea asta
    { id: 'intro',     rect: [4, 56, 34, 76],   deblocat: null,        culoare: 'good'   },
    { id: 'semnale',   rect: [38, 56, 68, 76],  deblocat: 'intro',     culoare: 'aqua'   },
    { id: 'lan',       rect: [72, 56, 102, 76], deblocat: 'semnale',   culoare: 'muted'  },
    { id: 'ip',        rect: [72, 30, 102, 52], deblocat: 'lan',       culoare: 'stone'  },
    { id: 'routing',   rect: [38, 30, 68, 52],  deblocat: 'ip',        culoare: 'warn'   },
    { id: 'transport', rect: [4, 30, 34, 52],   deblocat: 'routing',   culoare: 'blue'   },
    { id: 'aplicatii', rect: [4, 4, 34, 26],    deblocat: 'transport', culoare: 'purple' },
    { id: 'wireless',  rect: [72, 4, 102, 26],  deblocat: 'lan',       culoare: 'accent2'},
  ];

  // porțile dintre regiuni: tiles = lista de tile-uri care se deschid,
  // pazitorDe = regiunea al cărei boss ține poarta închisă
  const PORTI = [
    { id: 'g-semnale',   spre: 'semnale',   pazitorDe: 'intro',     tiles: [[36, 64], [36, 65], [36, 66]] },
    { id: 'g-lan',       spre: 'lan',       pazitorDe: 'semnale',   tiles: [[70, 64], [70, 65], [70, 66]] },
    { id: 'g-ip',        spre: 'ip',        pazitorDe: 'lan',       tiles: [[85, 54], [86, 54], [87, 54]] },
    { id: 'g-routing',   spre: 'routing',   pazitorDe: 'ip',        tiles: [[70, 39], [70, 40], [70, 41]] },
    { id: 'g-transport', spre: 'transport', pazitorDe: 'routing',   tiles: [[36, 39], [36, 40], [36, 41]] },
    { id: 'g-aplicatii', spre: 'aplicatii', pazitorDe: 'transport', tiles: [[17, 28], [18, 28], [19, 28]] },
    { id: 'g-wireless',  spre: 'wireless',  pazitorDe: 'lan',       tiles: [[103, 60], [103, 61], [103, 62]] },
  ];

  // coridoarele de drum dintre regiuni (stripes de tile DRUM prin „sălbăticie")
  const CORIDOARE = [
    { x0: 30, y0: 64, x1: 42, y1: 67 },    // intro → semnale
    { x0: 64, y0: 64, x1: 76, y1: 67 },    // semnale → lan
    { x0: 85, y0: 50, x1: 88, y1: 60 },    // lan → ip (vertical)
    { x0: 64, y0: 39, x1: 76, y1: 42 },    // ip → routing
    { x0: 30, y0: 39, x1: 42, y1: 42 },    // routing → transport
    { x0: 17, y0: 24, x1: 20, y1: 34 },    // transport → aplicații (vertical)
    { x0: 98, y0: 60, x1: 109, y1: 63 },   // lan → trecătoare
    { x0: 104, y0: 14, x1: 108, y1: 63 },  // trecătoarea de est (vertical)
    { x0: 98, y0: 14, x1: 109, y1: 17 },   // trecătoare → wireless
  ];

  // pozițiile „bosșilor" de recapitulare și ale panourilor de intrare (semne),
  // în tile-uri absolute; sloturi = poziții relative (fracții din rect) pentru
  // punctele de teorie ale regiunii
  const PLASARE = {
    intro:     { spawn: [12, 66], semn: [9, 64],   boss: [31, 65] },
    semnale:   { semn: [41, 65],  boss: [65, 65] },
    lan:       { semn: [75, 65],  boss: [86, 58] },
    ip:        { semn: [86, 49],  boss: [75, 40] },
    routing:   { semn: [64, 40],  boss: [41, 40] },
    transport: { semn: [31, 40],  boss: [18, 33] },
    aplicatii: { semn: [18, 23],  boss: [19, 12] },
    wireless:  { semn: [99, 16],  boss: [82, 9]  },
  };
  const SLOTURI = [
    [0.18, 0.32], [0.48, 0.18], [0.80, 0.30], [0.22, 0.68],
    [0.52, 0.52], [0.82, 0.66], [0.42, 0.84],
  ];

  /* ═══════════ 2b. SOCIAL, CRAFTING & INSULE (date) ═══════════════════════
     Paletele sociale și de avatar sunt FIXE și indexate: clientul trimite doar
     indici către server (server.js), care nu vede niciodată text arbitrar.   */

  // emoji + fraze gata făcute — index-ul (0..15) e tot ce circulă pe fir.
  // Ordinea trebuie să rămână sincronă cu NR_EMOTE din server.js.
  const EMOTE = [
    { e: '👋' }, { e: '😂' }, { e: '❤️' }, { e: '👍' },
    { e: '🎉' }, { e: '😮' }, { e: '🤔' }, { e: '🔥' },
    { e: '👋', t: 'Salut!' },   { e: '🍀', t: 'Baftă!' },
    { e: '🙏', t: 'Mersi!' },   { e: '🏆', t: 'GG!' },
    { e: '📍', t: 'Aici!' },    { e: '🆘', t: 'Ajutor?' },
    { e: '👀', t: 'Frumos!' },  { e: '⌛', t: 'Un moment…' },
  ];

  // avatar: 8 culori (hue) + 7 accesorii (primul = fără). Sincron cu server.js.
  const AVATAR_CULORI = [40, 8, 205, 150, 275, 100, 330, 24]; // hue-uri HSL
  const AVATAR_ACCESORII = ['', '🎓', '🧢', '👑', '🎩', '🌸', '⭐'];

  // resurse (materii prime) strânse din teorie/recapitulări; pret = valoarea la negustor
  const RESURSE = {
    lemn:   { emoji: '🪵', nume: 'Lemn',   pret: 3 },
    cuie:   { emoji: '🔩', nume: 'Cuie',   pret: 2 },
    piatra: { emoji: '🪨', nume: 'Piatră', pret: 3 },
    cablu:  { emoji: '🔌', nume: 'Cablu',  pret: 5 },
    piesa:  { emoji: '⚙️', nume: 'Piesă',  pret: 8 },
  };
  const RES_ORDINE = ['lemn', 'cuie', 'piatra', 'cablu', 'piesa'];

  // rețete: cost = resurse consumate; necesita = unelte pe care trebuie să le AI
  // (nu se consumă); refolosibil = unealta rămâne după folosire.
  const RETETE = [
    { id: 'ciocan', emoji: '🔨', nume: 'Ciocan', refolosibil: true,
      desc: 'Unealta de bază, refolosibilă. Îți trebuie ca să construiești orice altceva.',
      cost: { lemn: 2, piesa: 1 }, necesita: [] },
    { id: 'kitpod', emoji: '🧰', nume: 'Kit de pod',
      desc: 'Scânduri și cuie. Repară un pod stricat — se consumă la reparație.',
      cost: { lemn: 3, cuie: 4 }, necesita: ['ciocan'] },
    { id: 'felinar', emoji: '🏮', nume: 'Felinar', refolosibil: true,
      desc: 'Un obiect frumos de vânzare — sau doar de colecție. Valorează bine la negustor.',
      cost: { piatra: 3, cablu: 2, piesa: 1 }, necesita: ['ciocan'], valoare: 40 },
    { id: 'diploma', emoji: '🎓', nume: 'Diplomă de Rețelist', refolosibil: true,
      desc: 'Se poate face DOAR după ce ai citit toată teoria din Rețelistan. Dovada că ai străbătut toată stiva.',
      cost: { piesa: 3, cablu: 5 }, necesita: ['ciocan'], cunostinteTot: true },
  ];

  // podurile bonus + insulele lor secrete (nu blochează drumul principal —
  // sunt scurtături/comori peste apă, deblocate reparând podul cu un kit).
  // Toate tile-urile sunt carve-uite de construiesteInsule() → apă, dale de
  // pod și pământ de insulă; singura trecere e podul.
  const INSULE = [
    {
      id: 'i-semnale', nume: 'Ostrovul Undelor', reg: 'semnale',
      apa: [[57, 69, 66, 76]],            // moat [x0,y0,x1,y1)
      insula: [60, 71, 63, 74],           // pământ (grass)
      pod: [[57, 72], [58, 72], [59, 72]],// dale de pod (se repară)
      podPoi: [56, 72],                   // POI-ul de reparare (mal, walkable)
      cufar: [61, 72],                    // comoara
      loot: { bani: 30, resurse: { piesa: 1, piatra: 3 } },
      fapta: 'Ostrovul Undelor: orice mediu se traversează dacă îi construiești puntea — modulația e podul dintre biți și semnalul fizic.',
    },
    {
      id: 'i-port', nume: 'Insula Ecoului', reg: 'transport',
      apa: [[13, 50, 23, 54]],
      insula: [13, 54, 23, 61],
      pod: [[17, 50], [18, 50], [17, 51], [18, 51], [17, 52], [18, 52], [17, 53], [18, 53]],
      podPoi: [17, 49],
      cufar: [18, 57],
      loot: { bani: 45, resurse: { piesa: 2, cablu: 3 } },
      fapta: 'Insula Ecoului: un pod stricat se reface cu uneltele potrivite — exact ca o retransmisie TCP care recuperează un segment pierdut peste ape tulburi.',
    },
  ];

  /* ══════════════════════ 3. UNELTE MICI (utilitare) ══════════════════════ */

  // hash determinist pe coordonate — pentru decor „aleator" dar stabil
  function hash2(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177 | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);

  // hash determinist pe un string — pentru drop-uri „aleatoare" dar stabile
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // escape pentru orice text care ajunge în HTML
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* mini-markdown → HTML sigur: **bold**, `cod`, liste cu "- ", paragrafe */
  function miniMd(text) {
    const blocs = String(text || '').split(/\n\s*\n/);
    return blocs.map(b => {
      const linii = b.split('\n');
      const eLista = linii.every(l => /^\s*-\s+/.test(l) || !l.trim());
      const fmt = s => esc(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      if (eLista) {
        return '<ul>' + linii.filter(l => l.trim())
          .map(l => '<li>' + fmt(l.replace(/^\s*-\s+/, '')) + '</li>').join('') + '</ul>';
      }
      return '<p>' + linii.map(fmt).join('<br>') + '</p>';
    }).join('');
  }

  /* ─── culori: citim variabilele CSS ale gazdei și derivăm paleta jocului ── */

  function parseCuloare(str) {
    str = String(str || '').trim();
    let m = str.match(/^#([0-9a-f]{3})$/i);
    if (m) return [parseInt(m[1][0], 16) * 17, parseInt(m[1][1], 16) * 17, parseInt(m[1][2], 16) * 17];
    m = str.match(/^#([0-9a-f]{6})/i);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    m = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    return null;
  }
  const rgb = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  const amesteca = (a, b, t) => [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];

  let PAL = null; // paleta curentă, derivată din tema gazdei

  function citestePaleta() {
    const cs = getComputedStyle(document.documentElement);
    const v = (nume, fallback) => parseCuloare(cs.getPropertyValue(nume)) || parseCuloare(fallback);
    const bg     = v('--bg', '#1a1714');
    const bg3    = v('--bg3', '#2a2521');
    const panel  = v('--panel', '#221e1a');
    const txt    = v('--txt', '#ece3d2');
    const muted  = v('--muted', '#a8997f');
    const border = v('--border', '#352f28');
    const accent = v('--accent', '#e9b143');
    const accent2= v('--accent2', '#d8843f');
    const good   = v('--good', '#b8bb26');
    const bad    = v('--bad', '#fb4934');
    const warn   = v('--warn', '#e9b143');
    // gazda poate trimite și --blue/--aqua/--purple prin postMessage; altfel
    // folosim nuanțe gruvbox care se potrivesc cu estetica aplicației
    const blue   = v('--blue', '#458588');
    const aqua   = v('--aqua', '#689d6a');
    const purple = v('--purple', '#b16286');
    const eLight = document.documentElement.dataset.theme === 'light';
    // teren: fiecare culoare de regiune amestecată spre fundal, ca să rămână
    // lizibilă și în dark și în light
    const sol = (c, t) => rgb(amesteca(c, bg, t == null ? 0.72 : t));
    const baza = {
      bg, bg3, panel, txt, muted, border, accent, accent2, good, bad, warn, blue, aqua, purple,
      eLight,
      css: {
        bg: rgb(bg), bg3: rgb(bg3), panel: rgb(panel), txt: rgb(txt), muted: rgb(muted),
        border: rgb(border), accent: rgb(accent), accent2: rgb(accent2), good: rgb(good),
        bad: rgb(bad), warn: rgb(warn), blue: rgb(blue), aqua: rgb(aqua), purple: rgb(purple),
      },
      teren: {
        stone: null, // completat mai jos
      },
    };
    // culorile de sol per „culoare de regiune" (cheile din ASEZARE)
    baza.teren = {
      good:    sol(good),   aqua: sol(aqua),  muted: sol(muted, 0.8),
      stone:   sol(amesteca(muted, txt, 0.25), 0.8),
      warn:    sol(warn),   blue: sol(blue),  purple: sol(purple), accent2: sol(accent2),
      drum:    rgb(amesteca(warn, bg, eLight ? 0.55 : 0.62)),
      drumBord:rgb(amesteca(warn, bg, eLight ? 0.4 : 0.5)),
      apa:     rgb(amesteca(blue, bg, 0.35)),
      apa2:    rgb(amesteca(blue, bg, 0.48)),
      nisip:   rgb(amesteca(warn, bg, eLight ? 0.35 : 0.55)),
      salbatic:rgb(amesteca(good, bg, 0.85)),
      copac:   rgb(amesteca(good, bg, 0.35)),
      copac2:  rgb(amesteca(good, bg, 0.2)),
      trunchi: rgb(amesteca(accent2, bg, 0.4)),
      stanca:  rgb(amesteca(muted, bg, 0.45)),
      zid:     rgb(amesteca(muted, bg, 0.55)),
      varf:    rgb(amesteca(txt, bg, 0.15)),
    };
    PAL = baza;
  }

  /* ═══════════════════════ 4. PROGRES (localStorage) ══════════════════════ */

  const Progres = {
    date: {
      pos: null, citite: {}, boss: {}, vizitate: {}, fapte: [], sunet: true, muzica: true, ajutorVazut: false,
      // economie: inventar de resurse, unelte făurite, bani, poduri reparate, insule golite
      inventar: {}, unelte: {}, bani: 0, poduri: {}, insule: {},
    },
    incarca() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) Object.assign(this.date, JSON.parse(raw));
      } catch (e) { /* localStorage indisponibil — jucăm fără persistență */ }
      // salvările vechi n-au câmpurile de economie — le completăm ca să nu crape
      for (const k of ['inventar', 'unelte', 'poduri', 'insule'])
        if (!this.date[k] || typeof this.date[k] !== 'object') this.date[k] = {};
      if (typeof this.date.bani !== 'number') this.date.bani = 0;
      if (typeof this.date.muzica !== 'boolean') this.date.muzica = true;
    },
    salveaza() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.date)); } catch (e) {}
    },
    reset() {
      this.date = {
        pos: null, citite: {}, boss: {}, vizitate: {}, fapte: [],
        sunet: this.date.sunet, muzica: this.date.muzica, ajutorVazut: true,
        inventar: {}, unelte: {}, bani: 0, poduri: {}, insule: {},
      };
      this.salveaza();
    },
    eCitit(rid, pid) { return !!this.date.citite[rid + '/' + pid]; },
    marcheazaCitit(rid, pid) {
      const k = rid + '/' + pid;
      if (this.date.citite[k]) return false;
      this.date.citite[k] = true;
      this.date.fapte.push(k);
      this.salveaza();
      return true;
    },
    bossTrecut(rid) { return (this.date.boss[rid] || 0) >= 2; },
    scorBoss(rid) { return this.date.boss[rid] || 0; },
    seteazaBoss(rid, scor) {
      if (scor > (this.date.boss[rid] || 0)) { this.date.boss[rid] = scor; this.salveaza(); }
    },

    /* ── economie (resurse, unelte, bani) ── */
    resursa(id) { return this.date.inventar[id] || 0; },
    adaugaResursa(id, n) { this.date.inventar[id] = this.resursa(id) + n; this.salveaza(); },
    scoateResursa(id, n) { this.date.inventar[id] = Math.max(0, this.resursa(id) - n); this.salveaza(); },
    areUnealta(id) { return (this.date.unelte[id] || 0) > 0; },
    nrUnealta(id) { return this.date.unelte[id] || 0; },
    adaugaUnealta(id, n) { this.date.unelte[id] = this.nrUnealta(id) + (n || 1); this.salveaza(); },
    scoateUnealta(id, n) { this.date.unelte[id] = Math.max(0, this.nrUnealta(id) - (n || 1)); this.salveaza(); },
    adaugaBani(n) { this.date.bani = Math.max(0, (this.date.bani || 0) + n); this.salveaza(); },
    podReparat(id) { return !!this.date.poduri[id]; },
    reparaPod(id) { this.date.poduri[id] = true; this.salveaza(); },
    insulaGolita(id) { return !!this.date.insule[id]; },
    goleaInsula(id) { this.date.insule[id] = true; this.salveaza(); },
  };

  /* ═══════════════════ 4b. CRAFTING & DROP-URI (logică) ═══════════════════ */

  const Craft = {
    reteta(id) { return RETETE.find(r => r.id === id); },

    // ce cade când citești prima dată un punct de teorie — determinist, dar variat.
    // materialele de construcție (lemn/cuie) sunt dese; piatra/cablul rare; piesa
    // foarte rară (vine mai ales din recapitulări). Așa, teoria unei regiuni
    // finanțează sigur un ciocan + un kit de pod.
    dropCitit(regId, pid) {
      const h = hashStr(regId + '/' + pid);
      const COMUNE = ['lemn', 'lemn', 'lemn', 'cuie', 'cuie', 'cuie', 'cuie', 'piatra', 'cablu'];
      const L = COMUNE.length;
      const out = {};
      const add = (id, n) => { out[id] = (out[id] || 0) + n; };
      add(COMUNE[h % L], 1 + (h % 2));            // 1–2
      add(COMUNE[(h >>> 4) % L], 1);
      add(COMUNE[(h >>> 9) % L], 1);
      if ((h % 100) < 12) add('piesa', 1);        // piesa e rară
      return out;
    },

    aplicaDrop(drop) {
      for (const id in drop) Progres.adaugaResursa(id, drop[id]);
    },

    // se poate face rețeta? {ok, lipsa:[texte]}
    poate(reteta) {
      const lipsa = [];
      for (const id in reteta.cost)
        if (Progres.resursa(id) < reteta.cost[id])
          lipsa.push((RESURSE[id].emoji) + ' ' + RESURSE[id].nume + ' ×' + (reteta.cost[id] - Progres.resursa(id)));
      for (const u of (reteta.necesita || []))
        if (!Progres.areUnealta(u)) { const r = this.reteta(u); lipsa.push('unealta ' + (r ? r.emoji + ' ' + r.nume : u)); }
      if (reteta.cunostinteTot && Progres.date.fapte.length < Joc.totalPuncte)
        lipsa.push('toată teoria citită (' + Progres.date.fapte.length + '/' + Joc.totalPuncte + ')');
      return { ok: lipsa.length === 0, lipsa };
    },

    // consumă costul și adaugă unealta rezultată; întoarce true la reușită
    faurente(reteta) {
      if (!this.poate(reteta).ok) return false;
      for (const id in reteta.cost) Progres.scoateResursa(id, reteta.cost[id]);
      Progres.adaugaUnealta(reteta.id, 1);
      return true;
    },
  };

  // formatare umană a unui drop / cost: „🪵 Lemn ×2, 🔩 Cuie ×1, 💰 20"
  function textDrop(drop) {
    return Object.keys(drop).map(id => {
      if (id === 'bani') return '💰 ' + drop[id];
      const r = RESURSE[id];
      return r ? (r.emoji + ' ' + r.nume + ' ×' + drop[id]) : (id + ' ×' + drop[id]);
    }).join(', ');
  }

  /* ═══════════════════════════ 5. SUNET (WebAudio) ════════════════════════ */

  const Sunet = {
    ctx: null,
    activ() { return Progres.date.sunet; },
    porneste() {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    // o notă scurtă, sintetizată — fără fișiere audio externe
    nota(frecv, cand, durata, vol, tip) {
      if (!this.ctx || !this.activ()) return;
      const t = this.ctx.currentTime + (cand || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = tip || 'sine';
      osc.frequency.value = frecv;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (durata || 0.12));
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + (durata || 0.12) + 0.05);
    },
    citit()    { this.porneste(); this.nota(660, 0, 0.09); this.nota(880, 0.07, 0.12); },
    fapta()    { this.porneste(); this.nota(523, 0, 0.1); this.nota(659, 0.08, 0.1); this.nota(784, 0.16, 0.16); },
    deblocare(){ this.porneste(); this.nota(392, 0, 0.12); this.nota(523, 0.1, 0.12); this.nota(659, 0.2, 0.12); this.nota(784, 0.3, 0.22); },
    corect()   { this.porneste(); this.nota(660, 0, 0.08); this.nota(990, 0.06, 0.1); },
    gresit()   { this.porneste(); this.nota(196, 0, 0.18, 0.1, 'square'); },
    craft()    { this.porneste(); this.nota(300, 0, 0.06, 0.12, 'square'); this.nota(300, 0.09, 0.06, 0.12, 'square'); this.nota(500, 0.2, 0.14); },
    bani()     { this.porneste(); this.nota(880, 0, 0.06); this.nota(1175, 0.05, 0.08); },
    emote()    { this.porneste(); this.nota(700, 0, 0.05, 0.08); this.nota(900, 0.05, 0.07, 0.08); },
    pas()      { /* fără sunet de pași — ar obosi */ },
  };

  /* ─── muzica de fundal (fișier .mp3, în loop, buton 🎵 separat de efecte) ─── */
  const Muzica = {
    el: null, gata: false,
    activa() { return Progres.date.muzica; },
    creeaza() {
      if (this.el) return;
      try {
        const a = new Audio('/audio/retelistan_audio.mp3');
        a.loop = true; a.volume = 0.32; a.preload = 'none';
        a.addEventListener('error', () => { this.gata = false; }); // fișier lipsă (ex. local) — ignorăm
        this.el = a;
      } catch (e) { this.el = null; }
    },
    // pornim doar după un gest al utilizatorului (politica de autoplay)
    incearca() {
      if (!this.activa() || !Joc.pornit) return;
      this.creeaza();
      if (!this.el || document.hidden) return;
      const p = this.el.play();
      if (p && p.catch) p.catch(() => {}); // blocat de autoplay — reîncercăm la următorul gest
    },
    opreste() { if (this.el) { try { this.el.pause(); } catch (e) {} } },
    comuta() {
      Progres.date.muzica = !Progres.date.muzica;
      Progres.salveaza();
      if (Progres.date.muzica) this.incearca(); else this.opreste();
      return Progres.date.muzica;
    },
  };

  /* ══════════════════════════ 6. STAREA JOCULUI ═══════════════════════════ */

  const Joc = {
    pornit: false,        // rulează bucla rAF?
    initializat: false,   // s-a construit lumea?
    pauza: false,         // panou deschis → jocul stă pe loc
    rafId: 0,
    timp: 0,              // timp total (s), pentru animații
    ultimT: 0,
    dirty: true,          // mai trebuie redesenat cadrul curent?

    canvas: null, ctx: null,
    latime: 0, inaltime: 0, dpr: 1,

    sol: null,            // Uint8Array LUME_W*LUME_H — terenul
    solid: null,          // Uint8Array — obstacole
    decor: [],            // obiecte decorative desenate y-sortat
    poi: [],              // punctele de interes (teorie + semne + boși + crafting)
    portiTiles: {},       // "x,y" -> poarta (pt. desen și coliziune)
    poduriTiles: {},      // "x,y" -> podul bonus (rupt sau reparat)

    jucator: { x: 0, y: 0, vx: 0, vy: 0, dir: 'jos', faza: 0, misca: false, bula: null },
    cam: { x: 0, y: 0 },
    regiuneCurenta: null,
    poiAproape: null,
    particule: [],

    teorie: null,         // window.RETELISTAN_THEORY
    regiuni: {},          // id -> datele regiunii din theory.js
    totalPuncte: 0,
  };

  /* ══════════════════════ 7. CONSTRUCȚIA LUMII ════════════════════════════ */

  function inRect(r, x, y) { return x >= r[0] && x < r[2] && y >= r[1] && y < r[3]; }

  function construiesteLumea() {
    Joc.sol = new Uint8Array(LUME_W * LUME_H).fill(T.SALBATIC);
    Joc.solid = new Uint8Array(LUME_W * LUME_H).fill(S.COPAC); // sălbăticia e plină de pădure
    Joc.decor = [];
    Joc.poi = [];
    Joc.portiTiles = {};
    Joc.poduriTiles = {};

    const idx = (x, y) => y * LUME_W + x;

    // 1) sălbăticia: copaci deși, cu stânci presărate (doar decor — totul solid)
    for (let y = 0; y < LUME_H; y++)
      for (let x = 0; x < LUME_W; x++)
        if (hash2(x, y) < 0.12) Joc.solid[idx(x, y)] = S.STANCA;

    // 2) regiunile: teren propriu, fără obstacole (le adăugăm apoi controlat)
    for (const reg of ASEZARE) {
      const [x0, y0, x1, y1] = reg.rect;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          Joc.sol[idx(x, y)] = T.IARBA;
          Joc.solid[idx(x, y)] = S.LIBER;
        }
    }

    // 3) coridoarele dintre regiuni: drum + liber
    for (const c of CORIDOARE)
      for (let y = c.y0; y < c.y1; y++)
        for (let x = c.x0; x < c.x1; x++) {
          if (x < 0 || y < 0 || x >= LUME_W || y >= LUME_H) continue;
          Joc.sol[idx(x, y)] = T.DRUM;
          Joc.solid[idx(x, y)] = S.LIBER;
        }

    // 4) porțile: tile-uri solide cât timp bossul „paznic" nu e trecut
    for (const p of PORTI)
      for (const [x, y] of p.tiles) {
        Joc.portiTiles[x + ',' + y] = p;
        if (!Progres.bossTrecut(p.pazitorDe)) Joc.solid[idx(x, y)] = S.POARTA;
        else { Joc.sol[idx(x, y)] = T.DRUM; Joc.solid[idx(x, y)] = S.LIBER; }
      }

    // 5) amenajarea fiecărei regiuni (apă, drumuri interioare, decor tematic)
    for (const reg of ASEZARE) amenajeazaRegiunea(reg);

    // 5.5) insulele bonus + podurile lor (peste apă, în sălbăticie) — DUPĂ
    // amenajare, ca să suprascrie iazurile/decorul de dedesubt
    construiesteInsule();

    // 6) punctele de interes din teorie + semnele + boșii + crafting
    plaseazaPoi();

    // 7) curățăm obstacolele din jurul fiecărui POI (să nu blocheze accesul)
    for (const p of Joc.poi) elibereaza(p.tx, p.ty, 1);
  }

  /* insulele bonus: apă (moat) + pământ + dale de pod. Podurile rupte sunt
     singura trecere; se repară cu un 🧰 Kit de pod. Nu blochează drumul
     principal — sunt scurtături spre comori și fapte-cheie în plus. */
  function construiesteInsule() {
    const idx = (x, y) => y * LUME_W + x;
    const pune = (x, y, sol, solid) => {
      if (x < 0 || y < 0 || x >= LUME_W || y >= LUME_H) return;
      Joc.sol[idx(x, y)] = sol; Joc.solid[idx(x, y)] = solid;
    };
    for (const ins of INSULE) {
      // apă (impasabilă)
      for (const [x0, y0, x1, y1] of ins.apa)
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) pune(x, y, T.APA, S.ZID);
      // pământul insulei (grass, liber) + niște flori
      const [ix0, iy0, ix1, iy1] = ins.insula;
      for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) {
        pune(x, y, T.IARBA, S.LIBER);
        if (hash2(x * 5 + 2, y * 9 + 4) < 0.14)
          Joc.decor.push({ tx: x, ty: y, tip: 'floare', varianta: (x + y) % 3, reg: ins.reg });
      }
      // dalele de pod: rupte (apă sub ele) până la reparare
      const reparat = Progres.podReparat(ins.id);
      for (const [x, y] of ins.pod) {
        Joc.poduriTiles[x + ',' + y] = ins;
        if (reparat) pune(x, y, T.PODEA, S.LIBER);
        else pune(x, y, T.APA, S.POD);   // S.POD = rupt, impasabil, dar protejat de elibereaza (terenul e APA)
      }
    }
  }

  // eliberează un pătrat (rază r) în jurul unui tile — pentru POI-uri;
  // nu umblă la porți, sălbăticie sau apă
  function elibereaza(tx, ty, r) {
    for (let y = ty - r; y <= ty + r; y++)
      for (let x = tx - r; x <= tx + r; x++) {
        if (x < 0 || y < 0 || x >= LUME_W || y >= LUME_H) continue;
        const i = y * LUME_W + x;
        if (Joc.solid[i] !== S.POARTA && Joc.sol[i] !== T.SALBATIC && Joc.sol[i] !== T.APA)
          Joc.solid[i] = S.LIBER;
      }
    Joc.decor = Joc.decor.filter(d => Math.abs(d.tx - tx) > r || Math.abs(d.ty - ty) > r);
  }

  /* decorul tematic al fiecărei regiuni — desenat procedural, determinist */
  function amenajeazaRegiunea(reg) {
    const [x0, y0, x1, y1] = reg.rect;
    const idx = (x, y) => y * LUME_W + x;
    const solidPune = (x, y, tip) => { if (x >= x0 && x < x1 && y >= y0 && y < y1) Joc.solid[idx(x, y)] = tip; };
    const decorPune = (tx, ty, tip, extra) => Joc.decor.push(Object.assign({ tx, ty, tip, reg: reg.id }, extra || {}));

    // presărăm decor ușor peste tot (flori/pietricele — nu blochează)
    for (let y = y0 + 1; y < y1 - 1; y++)
      for (let x = x0 + 1; x < x1 - 1; x++) {
        const h = hash2(x * 7 + 3, y * 13 + 1);
        if (h < 0.035) decorPune(x, y, 'floare', { varianta: Math.floor(h * 1000) % 3 });
      }

    switch (reg.id) {
      case 'intro': { // sat: căsuțe și copaci prietenoși
        for (const [hx, hy] of [[8, 59], [20, 59], [24, 71], [14, 72]]) {
          solidPune(hx, hy, S.CASA); solidPune(hx + 1, hy, S.CASA);
          decorPune(hx, hy, 'casa');
        }
        for (let i = 0; i < 14; i++) {
          const x = x0 + 1 + Math.floor(hash2(i, 77) * (x1 - x0 - 2));
          const y = y0 + 1 + Math.floor(hash2(i, 131) * (y1 - y0 - 2));
          if (!Joc.solid[idx(x, y)]) { solidPune(x, y, S.COPAC); decorPune(x, y, 'copac'); }
        }
        break;
      }
      case 'semnale': { // câmpie deschisă cu antene și un iaz
        for (let y = 70; y < 74; y++) for (let x = 58; x < 65; x++) {
          Joc.sol[idx(x, y)] = T.APA; Joc.solid[idx(x, y)] = S.ZID; // apa nu se traversează
        }
        for (const [ax, ay] of [[44, 60], [52, 68], [61, 59]]) {
          solidPune(ax, ay, S.TURN); decorPune(ax, ay, 'antena');
        }
        break;
      }
      case 'lan': { // oraș: blocuri și străzi
        for (let y = 60; y < 74; y += 5) for (let x = x0 + 1; x < x1 - 1; x++) Joc.sol[idx(x, y)] = T.DRUM;
        for (let x = 76; x < x1; x += 7) for (let y = y0 + 1; y < y1 - 1; y++) Joc.sol[idx(x, y)] = T.DRUM;
        for (const [bx, by] of [[78, 57], [91, 57], [92, 61], [78, 66], [92, 66], [78, 71], [98, 71]]) {
          for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) solidPune(bx + dx, by + dy, S.CLADIRE);
          decorPune(bx, by, 'bloc', { h: 2 });
        }
        break;
      }
      case 'ip': { // munți: creste stâncoase cu vârfuri albe
        for (let i = 0; i < 26; i++) {
          const x = x0 + 1 + Math.floor(hash2(i * 3, 501) * (x1 - x0 - 2));
          const y = y0 + 1 + Math.floor(hash2(i * 3, 733) * (y1 - y0 - 2));
          if (!Joc.solid[idx(x, y)]) {
            solidPune(x, y, S.STANCA);
            decorPune(x, y, hash2(x, y * 2) < 0.5 ? 'varf' : 'stanca');
          }
        }
        break;
      }
      case 'routing': { // răscruce: drumuri care se încrucișează + indicatoare
        const cx = Math.floor((x0 + x1) / 2), cy = Math.floor((y0 + y1) / 2);
        for (let x = x0; x < x1; x++) for (let d = -1; d <= 1; d++) Joc.sol[idx(x, cy + d)] = T.DRUM;
        for (let y = y0; y < y1; y++) for (let d = -1; d <= 1; d++) Joc.sol[idx(cx + d, y)] = T.DRUM;
        for (const [sx, sy] of [[cx - 6, cy - 6], [cx + 6, cy + 5], [cx - 8, cy + 4], [cx + 8, cy - 5]])
          decorPune(sx, sy, 'indicator');
        break;
      }
      case 'transport': { // port: apă în sud, doc de scânduri, lăzi
        for (let y = 47; y < 52; y++) for (let x = x0; x < x1; x++) {
          Joc.sol[idx(x, y)] = T.APA; Joc.solid[idx(x, y)] = S.ZID;
        }
        for (let y = 44; y < 47; y++) for (let x = x0; x < x1; x++) Joc.sol[idx(x, y)] = T.NISIP;
        for (let y = 47; y < 50; y++) for (let x = 16; x < 21; x++) { // docul intră în apă
          Joc.sol[idx(x, y)] = T.PODEA; Joc.solid[idx(x, y)] = S.LIBER;
        }
        for (const [lx, ly] of [[7, 45], [8, 45], [26, 45], [27, 46]]) {
          solidPune(lx, ly, S.LADA); decorPune(lx, ly, 'lada');
        }
        break;
      }
      case 'aplicatii': { // bibliotecă: o clădire mare + rafturi
        for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 7; dx++) solidPune(15 + dx, 6 + dy, S.CLADIRE);
        decorPune(15, 6, 'biblioteca', { w: 7, h: 3 });
        for (const [rx, ry] of [[7, 13], [7, 17], [29, 14], [29, 19]]) {
          solidPune(rx, ry, S.RAFT); decorPune(rx, ry, 'raft');
        }
        break;
      }
      case 'wireless': { // turnul: antenă mare centrală, stânci
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) solidPune(84 + dx, 12 + dy, S.TURN);
        decorPune(84, 12, 'turn-mare');
        for (let i = 0; i < 10; i++) {
          const x = x0 + 1 + Math.floor(hash2(i * 5, 901) * (x1 - x0 - 2));
          const y = y0 + 1 + Math.floor(hash2(i * 5, 907) * (y1 - y0 - 2));
          if (!Joc.solid[idx(x, y)]) { solidPune(x, y, S.STANCA); decorPune(x, y, 'stanca'); }
        }
        break;
      }
    }
  }

  /* POI-urile: puncte de teorie (din theory.js) + semnul și bossul regiunii */
  function plaseazaPoi() {
    Joc.totalPuncte = 0;
    for (const reg of ASEZARE) {
      const date = Joc.regiuni[reg.id];
      const plas = PLASARE[reg.id] || {};
      const [x0, y0, x1, y1] = reg.rect;

      // semnul de intrare (panoul regiunii)
      if (plas.semn) Joc.poi.push({
        fel: 'semn', regId: reg.id, tx: plas.semn[0], ty: plas.semn[1],
        x: (plas.semn[0] + 0.5) * TILE, y: (plas.semn[1] + 0.5) * TILE,
      });
      // bossul de recapitulare
      if (plas.boss && date && date.recap && date.recap.length) Joc.poi.push({
        fel: 'boss', regId: reg.id, tx: plas.boss[0], ty: plas.boss[1],
        x: (plas.boss[0] + 0.5) * TILE, y: (plas.boss[1] + 0.5) * TILE,
      });
      // punctele de teorie
      if (date && date.puncte) date.puncte.forEach((punct, i) => {
        const s = SLOTURI[i % SLOTURI.length];
        const tx = Math.round(x0 + 2 + s[0] * (x1 - x0 - 4));
        const ty = Math.round(y0 + 2 + s[1] * (y1 - y0 - 4));
        Joc.poi.push({
          fel: 'punct', regId: reg.id, punct, tx, ty,
          x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE,
          faza: hash2(tx, ty) * 6.28,
        });
        Joc.totalPuncte++;
      });
    }

    // atelierul din sat: banc de lucru (crafting) + negustor (magazin)
    const poiTile = (fel, tx, ty, extra) => Joc.poi.push(Object.assign(
      { fel, tx, ty, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }, extra || {}));
    poiTile('banc', 26, 66);
    poiTile('negustor', 16, 60);

    // podurile bonus + comorile de pe insule
    for (const ins of INSULE) {
      poiTile('pod', ins.podPoi[0], ins.podPoi[1], { insId: ins.id });
      poiTile('cufar', ins.cufar[0], ins.cufar[1], { insId: ins.id, faza: hash2(ins.cufar[0], ins.cufar[1]) * 6.28 });
    }
  }

  /* ═══════════════════ 8. COLIZIUNI + MIȘCARE + CAMERĂ ════════════════════ */

  function eSolid(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= LUME_W || ty >= LUME_H) return true;
    return Joc.solid[ty * LUME_W + tx] !== S.LIBER;
  }

  // dreptunghiul de coliziune al jucătorului: mic, la picioare (stil top-down)
  function loveste(px, py) {
    const w = 9, h = 6;
    return eSolid(px - w, py) || eSolid(px + w, py) ||
           eSolid(px - w, py + h) || eSolid(px + w, py + h) ||
           eSolid(px - w, py - h) || eSolid(px + w, py - h);
  }

  function actualizeazaJucator(dt) {
    const j = Joc.jucator;
    const int = Input.directie();          // {x,y} normalizat, [-1..1]
    const viteza = Input.fuga ? VITEZA_FUGA : VITEZA;

    // accelerare/frânare lină — mișcare fluidă, nu „pe casete"
    const tinta = { x: int.x * viteza, y: int.y * viteza };
    const acc = 12;
    j.vx = lerp(j.vx, tinta.x, clamp(acc * dt, 0, 1));
    j.vy = lerp(j.vy, tinta.y, clamp(acc * dt, 0, 1));
    if (Math.abs(j.vx) < 2) j.vx = 0;
    if (Math.abs(j.vy) < 2) j.vy = 0;

    // mișcare pe axe separate → alunecă frumos pe lângă pereți
    const nx = j.x + j.vx * dt;
    if (!loveste(nx, j.y)) j.x = nx; else j.vx = 0;
    const ny = j.y + j.vy * dt;
    if (!loveste(j.x, ny)) j.y = ny; else j.vy = 0;

    j.misca = (j.vx !== 0 || j.vy !== 0);
    if (j.misca) {
      j.faza += dt * (Input.fuga ? 13 : 9);
      if (Math.abs(j.vx) > Math.abs(j.vy)) j.dir = j.vx > 0 ? 'dreapta' : 'stanga';
      else j.dir = j.vy > 0 ? 'jos' : 'sus';
      Joc.dirty = true;
    }

    // în ce regiune suntem? (pentru HUD + bannerul de intrare)
    const tx = Math.floor(j.x / TILE), ty = Math.floor(j.y / TILE);
    let reg = null;
    for (const r of ASEZARE) if (inRect(r.rect, tx, ty)) { reg = r.id; break; }
    if (reg && reg !== Joc.regiuneCurenta) {
      Joc.regiuneCurenta = reg;
      const prima = !Progres.date.vizitate[reg];
      Progres.date.vizitate[reg] = true; Progres.salveaza();
      UI.banner(reg, prima);
      UI.actualizeazaHud();
      Minimap.deseneaza();
    }

    // cel mai apropiat POI cu care putem interacționa
    let aproape = null, cel = RAZA_INTERACT * RAZA_INTERACT;
    for (const p of Joc.poi) {
      const d = dist2(j.x, j.y, p.x, p.y);
      if (d < cel) { cel = d; aproape = p; }
    }
    if (aproape !== Joc.poiAproape) { Joc.poiAproape = aproape; Joc.dirty = true; }
  }

  function actualizeazaCamera(dt) {
    const vw = Joc.latime, vh = Joc.inaltime;
    const tx = clamp(Joc.jucator.x - vw / 2, 0, LUME_W * TILE - vw);
    const ty = clamp(Joc.jucator.y - vh / 2, 0, LUME_H * TILE - vh);
    const f = clamp(dt * 6, 0, 1);
    const ox = Joc.cam.x, oy = Joc.cam.y;
    Joc.cam.x = lerp(Joc.cam.x, tx, f);
    Joc.cam.y = lerp(Joc.cam.y, ty, f);
    if (Math.abs(Joc.cam.x - ox) > 0.1 || Math.abs(Joc.cam.y - oy) > 0.1) Joc.dirty = true;
  }

  /* ═══════════════════════════ 9. INPUT ═══════════════════════════════════ */

  const Input = {
    taste: {}, fuga: false,
    joy: { activ: false, dx: 0, dy: 0 },   // joystick-ul de pe touch

    directie() {
      let x = 0, y = 0;
      if (this.taste.ArrowLeft || this.taste.KeyA) x -= 1;
      if (this.taste.ArrowRight || this.taste.KeyD) x += 1;
      if (this.taste.ArrowUp || this.taste.KeyW) y -= 1;
      if (this.taste.ArrowDown || this.taste.KeyS) y += 1;
      if (this.joy.activ) { x += this.joy.dx; y += this.joy.dy; }
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      return { x, y };
    },

    prinde() {
      window.addEventListener('keydown', e => {
        if (!Joc.pornit) return;
        // panourile își gestionează singure tastele (Esc etc.)
        if (UI.panouDeschis()) {
          if (e.code === 'Escape') { UI.inchidePanou(); e.preventDefault(); }
          return;
        }
        // paleta de emoji e deschisă → Esc o închide
        if (UI.emoteDeschis() && e.code === 'Escape') { UI.inchideEmote(); e.preventDefault(); return; }
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code))
          e.preventDefault(); // să nu deruleze pagina
        this.taste[e.code] = true;
        this.fuga = e.shiftKey;
        if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') interactioneaza();
        if (e.code === 'KeyJ') UI.deschideJurnal();
        if (e.code === 'KeyI') UI.deschideInventar();
        if (e.code === 'KeyR') UI.comutaEmote();
      });
      window.addEventListener('keyup', e => {
        this.taste[e.code] = false;
        this.fuga = e.shiftKey;
      });
      window.addEventListener('blur', () => { this.taste = {}; this.fuga = false; });
    },
  };

  /* interacțiunea cu POI-ul din apropiere (tasta E / butonul de pe touch) */
  function interactioneaza() {
    const p = Joc.poiAproape;
    if (!p || UI.panouDeschis()) return;
    Sunet.porneste();
    if (p.fel === 'punct') UI.deschideTeorie(p);
    else if (p.fel === 'semn') UI.deschideSemn(p.regId);
    else if (p.fel === 'boss') UI.deschideRecap(p.regId);
    else if (p.fel === 'banc') UI.deschideCrafting();
    else if (p.fel === 'negustor') UI.deschideShop();
    else if (p.fel === 'pod') UI.deschidePod(p);
    else if (p.fel === 'cufar') UI.deschideCufar(p);
  }

  /* deschide porțile păzite de bossul regiunii rid (după recapitulare) */
  function deschidePorti(rid) {
    let deschis = [];
    for (const p of PORTI) {
      if (p.pazitorDe !== rid) continue;
      for (const [x, y] of p.tiles) {
        Joc.solid[y * LUME_W + x] = S.LIBER;
        Joc.sol[y * LUME_W + x] = T.DRUM;
        // scântei la poartă
        for (let i = 0; i < 8; i++) Particule.adauga((x + 0.5) * TILE, (y + 0.5) * TILE, 'deblocare');
      }
      deschis.push(p.spre);
    }
    if (deschis.length) {
      Sunet.deblocare();
      const nume = deschis.map(id => { const r = Joc.regiuni[id]; return r ? (r.icon + ' ' + r.nume) : id; }).join(' și ');
      UI.toast('🔓 Drumul s-a deschis spre ' + nume + '!');
      Minimap.deseneaza();
    }
    Joc.dirty = true;
  }

  /* ══════════════════════════ 10. PARTICULE ═══════════════════════════════ */

  const Particule = {
    adauga(x, y, fel) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 70;
      Joc.particule.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        viata: 0.7 + Math.random() * 0.5, fel,
      });
    },
    explozie(x, y, fel, n) { for (let i = 0; i < (n || 14); i++) this.adauga(x, y, fel); },
    actualizeaza(dt) {
      if (!Joc.particule.length) return;
      for (const p of Joc.particule) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 160 * dt; p.viata -= dt;
      }
      Joc.particule = Joc.particule.filter(p => p.viata > 0);
      Joc.dirty = true;
    },
  };

  /* ═══════════════════════════ 11. DESEN (Canvas) ═════════════════════════ */

  // ce emoji are fiecare tip de punct de teorie
  const EMOJI_POI = { terminal: '💻', npc: '🧑‍🏫', totem: '📡', cufar: '📦' };

  function deseneaza() {
    const ctx = Joc.ctx;
    if (!ctx || !PAL) return;
    const cam = Joc.cam, t = Joc.timp;

    ctx.save();
    ctx.clearRect(0, 0, Joc.latime, Joc.inaltime);
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

    // intervalul de tile-uri vizibile — desenăm doar ce se vede
    const tx0 = clamp(Math.floor(cam.x / TILE) - 1, 0, LUME_W - 1);
    const ty0 = clamp(Math.floor(cam.y / TILE) - 1, 0, LUME_H - 1);
    const tx1 = clamp(Math.ceil((cam.x + Joc.latime) / TILE) + 1, 0, LUME_W);
    const ty1 = clamp(Math.ceil((cam.y + Joc.inaltime) / TILE) + 1, 0, LUME_H);

    /* ── stratul de sol ── */
    for (let y = ty0; y < ty1; y++) {
      for (let x = tx0; x < tx1; x++) {
        const s = Joc.sol[y * LUME_W + x];
        const px = x * TILE, py = y * TILE;
        let c;
        if (s === T.IARBA) {
          // culoarea regiunii din care face parte tile-ul
          let reg = null;
          for (const r of ASEZARE) if (inRect(r.rect, x, y)) { reg = r; break; }
          c = reg ? PAL.teren[reg.culoare] : PAL.teren.salbatic;
        }
        else if (s === T.DRUM) c = PAL.teren.drum;
        else if (s === T.APA) c = (Math.floor(t * 1.4 + (x + y) * 0.7) % 2) ? PAL.teren.apa : PAL.teren.apa2;
        else if (s === T.NISIP) c = PAL.teren.nisip;
        else if (s === T.PODEA) c = PAL.teren.trunchi;
        else c = PAL.teren.salbatic;
        ctx.fillStyle = c;
        ctx.fillRect(px, py, TILE, TILE);
        // textură discretă: un „fir de iarbă"/pietricică pe unele tile-uri
        const h = hash2(x, y);
        if (s === T.IARBA && h < 0.3) {
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fillRect(px + (h * 97 % 1) * 24 + 3, py + (h * 53 % 1) * 24 + 3, 3, 3);
        }
        if (s === T.DRUM) {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          if ((x + y) % 2) ctx.fillRect(px, py, TILE, TILE);
        }
        if (s === T.APA && h < 0.25) { // sclipiri pe apă
          ctx.fillStyle = 'rgba(255,255,255,' + (0.06 + 0.05 * Math.sin(t * 2 + x * 3 + y)) + ')';
          ctx.fillRect(px + 6, py + 10 + Math.sin(t + x) * 3, 12, 2);
        }
      }
    }

    /* ── umbra regiunilor blocate (nu au fost deblocate încă) ── */
    for (const reg of ASEZARE) {
      if (!reg.deblocat || Progres.bossTrecut(reg.deblocat)) continue;
      const [x0, y0, x1, y1] = reg.rect;
      if (x1 * TILE < cam.x || x0 * TILE > cam.x + Joc.latime) continue;
      ctx.fillStyle = PAL.eLight ? 'rgba(80,60,30,0.18)' : 'rgba(0,0,0,0.32)';
      ctx.fillRect(x0 * TILE, y0 * TILE, (x1 - x0) * TILE, (y1 - y0) * TILE);
    }

    /* ── podurile bonus: scânduri întregi (reparat) sau rupte, cu goluri ── */
    for (const cheie in Joc.poduriTiles) {
      const [x, y] = cheie.split(',').map(Number);
      if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue;
      deseneazaPod(ctx, x, y, Progres.podReparat(Joc.poduriTiles[cheie].id), t);
    }

    /* ── obiectele y-sortate: decor + POI + jucător (efect de adâncime) ── */
    const obiecte = [];
    for (const d of Joc.decor) {
      if (d.tx < tx0 - 2 || d.tx > tx1 + 2 || d.ty < ty0 - 2 || d.ty > ty1 + 4) continue;
      obiecte.push({ y: (d.ty + 1) * TILE, fel: 'decor', d });
    }
    // copacii/stâncile din sălbăticie și obstacolele fără decor explicit
    for (let y = ty0; y < ty1; y++)
      for (let x = tx0; x < tx1; x++) {
        const s = Joc.solid[y * LUME_W + x];
        if (s === S.COPAC && Joc.sol[y * LUME_W + x] === T.SALBATIC)
          obiecte.push({ y: (y + 1) * TILE, fel: 'decor', d: { tx: x, ty: y, tip: 'copac', salbatic: true } });
        else if (s === S.STANCA && Joc.sol[y * LUME_W + x] === T.SALBATIC)
          obiecte.push({ y: (y + 1) * TILE, fel: 'decor', d: { tx: x, ty: y, tip: 'stanca' } });
      }
    for (const p of Joc.poi) obiecte.push({ y: p.y + 10, fel: 'poi', p });
    for (const a of Multiplayer.alti.values()) obiecte.push({ y: a.y + 12, fel: 'alt', a });
    obiecte.push({ y: Joc.jucator.y + 12, fel: 'jucator' });
    obiecte.sort((a, b) => a.y - b.y);

    for (const o of obiecte) {
      if (o.fel === 'decor') deseneazaDecor(ctx, o.d, t);
      else if (o.fel === 'poi') deseneazaPoi(ctx, o.p, t);
      else if (o.fel === 'alt') deseneazaAlt(ctx, o.a, t);
      else deseneazaJucator(ctx, t);
    }
    // numele nostru, deasupra capului — doar când suntem online
    if (Multiplayer.conectat)
      deseneazaEticheta(ctx, Joc.jucator.x, Joc.jucator.y - 40, Multiplayer.nume, true);

    /* ── porțile închise ── */
    for (const cheie in Joc.portiTiles) {
      const [x, y] = cheie.split(',').map(Number);
      if (Joc.solid[y * LUME_W + x] !== S.POARTA) continue;
      if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue;
      const px = x * TILE, py = y * TILE;
      ctx.fillStyle = PAL.teren.trunchi;
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = PAL.css.border; ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 6 + i * 8, py + 4, 3, TILE - 8);
    }
    // un lacăt pe tile-ul din mijloc al fiecărei porți închise
    for (const po of PORTI) {
      if (Progres.bossTrecut(po.pazitorDe)) continue;
      const [mx, my] = po.tiles[Math.floor(po.tiles.length / 2)];
      if (mx < tx0 || mx > tx1 || my < ty0 || my > ty1) continue;
      ctx.font = '16px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', (mx + 0.5) * TILE, (my + 0.68) * TILE);
    }

    /* ── particule ── */
    for (const p of Joc.particule) {
      ctx.globalAlpha = clamp(p.viata, 0, 1);
      ctx.fillStyle = p.fel === 'deblocare' ? PAL.css.accent : (p.fel === 'fapta' ? PAL.css.good : PAL.css.accent2);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    /* ── bula de interacțiune deasupra POI-ului apropiat ── */
    if (Joc.poiAproape && !UI.panouDeschis()) deseneazaBula(ctx, Joc.poiAproape);

    /* ── bulele de emoji/fraze (deasupra tuturor) ── */
    const acum = Joc.timp;
    for (const a of Multiplayer.alti.values())
      if (a.bula && a.bula.until > acum) deseneazaEmote(ctx, a.x, a.y - 34, a.bula.k);
    if (Joc.jucator.bula && Joc.jucator.bula.until > acum)
      deseneazaEmote(ctx, Joc.jucator.x, Joc.jucator.y - 38, Joc.jucator.bula.k);

    ctx.restore();
  }

  /* o bulă de emoji/frază deasupra unui personaj (dispare singură) */
  function deseneazaEmote(ctx, x, y, k) {
    const em = EMOTE[k]; if (!em) return;
    const txt = em.t || '';
    ctx.font = '600 12px Inter,sans-serif';
    const wTxt = txt ? ctx.measureText(txt).width : 0;
    const w = 22 + wTxt + (txt ? 6 : 0);
    const bx = x - w / 2, by = y - 24;
    ctx.fillStyle = PAL.css.panel;
    ctx.strokeStyle = PAL.css.accent; ctx.lineWidth = 1.5;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, w, 22, 11); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(bx, by, w, 22); ctx.strokeRect(bx, by, w, 22); }
    // codița bulei
    ctx.beginPath();
    ctx.moveTo(x - 4, by + 22); ctx.lineTo(x + 4, by + 22); ctx.lineTo(x, by + 28);
    ctx.closePath(); ctx.fillStyle = PAL.css.panel; ctx.fill();
    // conținut: emoji (+ text)
    ctx.font = '14px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    ctx.textAlign = txt ? 'left' : 'center';
    ctx.fillStyle = PAL.css.txt;
    ctx.fillText(em.e, txt ? bx + 8 : x, by + 15);
    if (txt) {
      ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText(txt, bx + 26, by + 15);
    }
  }

  /* un element de decor tematic */
  function deseneazaDecor(ctx, d, t) {
    const px = d.tx * TILE, py = d.ty * TILE;
    switch (d.tip) {
      case 'copac': {
        ctx.fillStyle = PAL.teren.trunchi;
        ctx.fillRect(px + 13, py + 14, 6, 14);
        ctx.fillStyle = d.salbatic ? PAL.teren.copac2 : PAL.teren.copac;
        ctx.beginPath(); ctx.arc(px + 16, py + 8, 12, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.arc(px + 12, py + 4, 5, 0, 7); ctx.fill();
        break;
      }
      case 'stanca': {
        ctx.fillStyle = PAL.teren.stanca;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 26); ctx.lineTo(px + 10, py + 10); ctx.lineTo(px + 20, py + 8);
        ctx.lineTo(px + 28, py + 24); ctx.closePath(); ctx.fill();
        break;
      }
      case 'varf': { // munte cu vârf alb
        ctx.fillStyle = PAL.teren.stanca;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 30); ctx.lineTo(px + 16, py - 6); ctx.lineTo(px + 30, py + 30);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.teren.varf;
        ctx.beginPath();
        ctx.moveTo(px + 11, py + 7); ctx.lineTo(px + 16, py - 6); ctx.lineTo(px + 21, py + 7);
        ctx.lineTo(px + 17, py + 10); ctx.lineTo(px + 14, py + 8); ctx.closePath(); ctx.fill();
        break;
      }
      case 'casa': {
        ctx.fillStyle = PAL.css.panel;
        ctx.fillRect(px + 2, py + 8, TILE * 2 - 4, 22);
        ctx.fillStyle = PAL.css.accent2;
        ctx.beginPath();
        ctx.moveTo(px - 2, py + 10); ctx.lineTo(px + TILE, py - 8); ctx.lineTo(px + TILE * 2 + 2, py + 10);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.teren.trunchi; ctx.fillRect(px + 12, py + 16, 10, 14);
        ctx.fillStyle = PAL.css.accent; ctx.fillRect(px + 36, py + 14, 8, 8);
        break;
      }
      case 'bloc': { // clădire de oraș
        ctx.fillStyle = PAL.teren.zid;
        ctx.fillRect(px + 1, py - 10, TILE * 2 - 2, TILE * 2 + 8);
        ctx.fillStyle = PAL.css.accent;
        for (let fy = 0; fy < 3; fy++) for (let fx = 0; fx < 3; fx++)
          if (hash2(d.tx + fx, d.ty + fy) < 0.6) ctx.fillRect(px + 6 + fx * 18, py - 4 + fy * 16, 8, 8);
        break;
      }
      case 'biblioteca': { // clădirea mare din Biblioteca Aplicații
        const w = TILE * (d.w || 7), h = TILE * (d.h || 3);
        ctx.fillStyle = PAL.css.panel; ctx.fillRect(px, py - 14, w, h + 14);
        ctx.fillStyle = PAL.css.purple; ctx.fillRect(px, py - 22, w, 12);
        ctx.fillStyle = PAL.css.txt;
        ctx.font = 'bold 13px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('BIBLIOTECA APLICAȚIILOR', px + w / 2, py - 13);
        ctx.fillStyle = PAL.teren.trunchi;
        ctx.fillRect(px + w / 2 - 12, py + h - 26, 24, 26);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = PAL.css.accent;
          ctx.fillRect(px + 14 + i * 48, py + 2, 12, 16);
        }
        break;
      }
      case 'raft': {
        ctx.fillStyle = PAL.teren.trunchi; ctx.fillRect(px + 2, py + 2, 28, 26);
        const carti = [PAL.css.accent, PAL.css.good, PAL.css.blue, PAL.css.bad, PAL.css.purple];
        for (let i = 0; i < 5; i++) { ctx.fillStyle = carti[i]; ctx.fillRect(px + 4 + i * 5, py + 6, 4, 9); }
        for (let i = 0; i < 5; i++) { ctx.fillStyle = carti[(i + 2) % 5]; ctx.fillRect(px + 4 + i * 5, py + 17, 4, 9); }
        break;
      }
      case 'antena': {
        ctx.strokeStyle = PAL.css.muted; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px + 16, py + 30); ctx.lineTo(px + 16, py - 6); ctx.stroke();
        ctx.lineWidth = 1.5;
        // undele emise, animate
        for (let i = 1; i <= 2; i++) {
          const r = 6 + i * 6 + (t * 10 % 6);
          ctx.strokeStyle = 'rgba(' + PAL.aqua.join(',') + ',' + (0.7 - r / 30) + ')';
          ctx.beginPath(); ctx.arc(px + 16, py - 6, r, -2.4, -0.7); ctx.stroke();
        }
        ctx.fillStyle = PAL.css.accent;
        ctx.beginPath(); ctx.arc(px + 16, py - 6, 3, 0, 7); ctx.fill();
        break;
      }
      case 'turn-mare': { // turnul wireless — mare, cu inele animate
        ctx.strokeStyle = PAL.css.muted; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 62); ctx.lineTo(px + 32, py - 26);
        ctx.moveTo(px + 56, py + 62); ctx.lineTo(px + 32, py - 26);
        ctx.moveTo(px + 14, py + 36); ctx.lineTo(px + 50, py + 36);
        ctx.moveTo(px + 20, py + 10); ctx.lineTo(px + 44, py + 10);
        ctx.stroke();
        ctx.fillStyle = PAL.css.bad;
        ctx.beginPath(); ctx.arc(px + 32, py - 26, 4 + Math.sin(t * 3) * 1.2, 0, 7); ctx.fill();
        for (let i = 1; i <= 3; i++) {
          const r = 10 + i * 9 + (t * 14 % 9);
          ctx.strokeStyle = 'rgba(' + PAL.accent2.join(',') + ',' + Math.max(0, 0.8 - r / 45) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px + 32, py - 26, r, -Math.PI, 0); ctx.stroke();
        }
        break;
      }
      case 'lada': {
        ctx.fillStyle = PAL.teren.trunchi; ctx.fillRect(px + 4, py + 6, 24, 22);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 6, 24, 22);
        ctx.beginPath(); ctx.moveTo(px + 4, py + 6); ctx.lineTo(px + 28, py + 28);
        ctx.moveTo(px + 28, py + 6); ctx.lineTo(px + 4, py + 28); ctx.stroke();
        break;
      }
      case 'indicator': { // indicator rutier la răscruce
        ctx.fillStyle = PAL.teren.trunchi; ctx.fillRect(px + 14, py + 4, 4, 26);
        ctx.fillStyle = PAL.css.warn;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 4); ctx.lineTo(px + 26, py + 4); ctx.lineTo(px + 30, py + 9);
        ctx.lineTo(px + 26, py + 14); ctx.lineTo(px + 4, py + 14); ctx.closePath(); ctx.fill();
        break;
      }
      case 'floare': {
        const cul = [PAL.css.accent, PAL.css.bad, PAL.css.purple][d.varianta || 0];
        ctx.fillStyle = cul;
        ctx.beginPath(); ctx.arc(px + 10 + (d.varianta || 0) * 5, py + 18, 2.5, 0, 7); ctx.fill();
        break;
      }
    }
  }

  /* un punct de interes: piedestal + emoji care „plutește" */
  function deseneazaPoi(ctx, p, t) {
    const aproape = p === Joc.poiAproape;
    const bob = p.fel === 'punct' ? Math.sin(t * 2.2 + (p.faza || 0)) * 3 : 0;

    // umbră
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 10, 4, 0, 0, 7); ctx.fill();

    if (p.fel === 'semn') { // panou de lemn cu iconul regiunii
      ctx.fillStyle = PAL.teren.trunchi; ctx.fillRect(p.x - 2, p.y - 8, 4, 18);
      ctx.fillStyle = PAL.css.panel;
      ctx.fillRect(p.x - 15, p.y - 26, 30, 20);
      ctx.strokeStyle = aproape ? PAL.css.accent : PAL.css.border; ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 15, p.y - 26, 30, 20);
      const reg = Joc.regiuni[p.regId];
      ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(reg ? reg.icon : 'ℹ️', p.x, p.y - 11);
      return;
    }

    if (p.fel === 'boss') { // paznicul recapitulării
      const trecut = Progres.bossTrecut(p.regId);
      ctx.fillStyle = trecut ? PAL.css.good : PAL.css.accent2;
      ctx.beginPath(); ctx.arc(p.x, p.y - 6, 13, 0, 7); ctx.fill();
      ctx.strokeStyle = aproape ? PAL.css.accent : PAL.css.border; ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '15px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(trecut ? '🏅' : '🛡️', p.x, p.y - 1);
      return;
    }

    if (p.fel === 'banc' || p.fel === 'negustor') { // atelier: masă de lemn cu iconul de sus
      const e = p.fel === 'banc' ? '🛠️' : '🏪';
      const cul = p.fel === 'banc' ? PAL.css.accent2 : PAL.css.purple;
      // tejgheaua
      ctx.fillStyle = PAL.teren.trunchi;
      ctx.fillRect(p.x - 15, p.y - 10, 30, 16);
      ctx.fillStyle = cul; ctx.fillRect(p.x - 15, p.y - 12, 30, 5);
      ctx.strokeStyle = aproape ? PAL.css.accent : PAL.css.border; ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 15, p.y - 12, 30, 18);
      // baldachin/emblemă
      ctx.font = '15px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(e, p.x, p.y - 15 + Math.sin(t * 2 + p.x) * 1.5);
      if (aproape) {
        ctx.strokeStyle = 'rgba(' + PAL.accent.join(',') + ',0.4)';
        ctx.beginPath(); ctx.arc(p.x, p.y - 4, 22 + Math.sin(t * 4) * 2, 0, 7); ctx.stroke();
      }
      return;
    }

    if (p.fel === 'pod') { // indicator de pod (reparat sau de reparat)
      const ins = INSULE.find(i => i.id === p.insId);
      const reparat = ins && Progres.podReparat(ins.id);
      ctx.fillStyle = PAL.teren.trunchi; ctx.fillRect(p.x - 2, p.y - 6, 4, 16);
      ctx.fillStyle = PAL.css.panel;
      ctx.fillRect(p.x - 14, p.y - 24, 28, 18);
      ctx.strokeStyle = aproape ? PAL.css.accent : (reparat ? PAL.css.good : PAL.css.warn);
      ctx.lineWidth = 2; ctx.strokeRect(p.x - 14, p.y - 24, 28, 18);
      ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(reparat ? '🌉' : '🚧', p.x, p.y - 10);
      return;
    }

    if (p.fel === 'cufar') { // comoara de pe insulă
      const golit = Progres.insulaGolita(p.insId);
      const bob2 = golit ? 0 : Math.sin(t * 2.6 + (p.faza || 0)) * 2;
      ctx.font = '20px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; ctx.textAlign = 'center';
      ctx.globalAlpha = golit ? 0.5 : 1;
      ctx.fillText(golit ? '📭' : '🎁', p.x, p.y - 2 + bob2);
      ctx.globalAlpha = 1;
      if (aproape && !golit) {
        ctx.strokeStyle = 'rgba(' + PAL.accent.join(',') + ',0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y - 6, 16 + Math.sin(t * 4) * 2, 0, 7); ctx.stroke();
      }
      return;
    }

    // punct de teorie
    const citit = Progres.eCitit(p.regId, p.punct.id);
    ctx.fillStyle = citit ? PAL.css.bg3 : PAL.css.panel;
    ctx.strokeStyle = aproape ? PAL.css.accent : (citit ? PAL.css.border : PAL.css.accent2);
    ctx.lineWidth = 2;
    const py = p.y - 8 + bob;
    ctx.beginPath();
    ctx.arc(p.x, py, 12, 0, 7); ctx.fill(); ctx.stroke();
    if (aproape) { // aură când suntem în rază
      ctx.strokeStyle = 'rgba(' + PAL.accent.join(',') + ',0.4)';
      ctx.beginPath(); ctx.arc(p.x, py, 16 + Math.sin(t * 4) * 2, 0, 7); ctx.stroke();
    }
    ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = citit ? 0.55 : 1;
    ctx.fillText(EMOJI_POI[p.punct.tip] || '📄', p.x, py + 5);
    ctx.globalAlpha = 1;
    if (citit) {
      ctx.fillStyle = PAL.css.good;
      ctx.beginPath(); ctx.arc(p.x + 9, py - 9, 6, 0, 7); ctx.fill();
      ctx.fillStyle = PAL.eLight ? '#fff' : PAL.css.bg;
      ctx.font = 'bold 8px Inter,sans-serif';
      ctx.fillText('✓', p.x + 9, py - 6);
    }
  }

  /* culorile corpului derivate din indexul de culoare al avatarului */
  function culoriAvatar(c) {
    const hue = AVATAR_CULORI[c] != null ? AVATAR_CULORI[c] : AVATAR_CULORI[0];
    return {
      corp:  'hsl(' + hue + ',60%,' + (PAL.eLight ? 46 : 58) + '%)',
      dunga: 'hsl(' + hue + ',60%,' + (PAL.eLight ? 33 : 41) + '%)',
    };
  }
  /* accesoriul (pălărie/emoji) așezat pe capul unui personaj */
  function deseneazaAccesoriu(ctx, x, yTop, h) {
    const e = AVATAR_ACCESORII[h || 0];
    if (!e) return;
    ctx.font = '14px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e, x, yTop);
  }

  /* personajul: un pachet de date antropomorf, simpatic */
  function deseneazaJucator(ctx, t) {
    const j = Joc.jucator;
    const av = Multiplayer.avatar;
    const cul = culoriAvatar(av.c);
    const bob = j.misca ? Math.abs(Math.sin(j.faza)) * 2.5 : Math.sin(t * 1.8) * 1;
    const px = j.x, py = j.y - bob;

    // umbră
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(px, j.y + 10, 11, 4.5, 0, 0, 7); ctx.fill();

    // piciorușe
    ctx.fillStyle = PAL.css.bg3;
    const pas = j.misca ? Math.sin(j.faza) * 4 : 0;
    ctx.fillRect(px - 7, j.y + 4 + pas * 0.4, 5, 5);
    ctx.fillRect(px + 2, j.y + 4 - pas * 0.4, 5, 5);

    // corpul — un „pachet" cu dungă de antet, în culoarea aleasă
    const w = 22, h = 24;
    ctx.fillStyle = cul.corp;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(px - w / 2, py - h + 4, w, h, 6); ctx.fill(); ctx.stroke();
    } else { ctx.fillRect(px - w / 2, py - h + 4, w, h); ctx.strokeRect(px - w / 2, py - h + 4, w, h); }
    // dunga de antet (partea de sus a pachetului)
    ctx.fillStyle = cul.dunga;
    ctx.fillRect(px - w / 2 + 2, py - h + 6, w - 4, 6);

    // antena cu beculeț
    ctx.strokeStyle = cul.dunga; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py - h + 4); ctx.lineTo(px, py - h - 4); ctx.stroke();
    ctx.fillStyle = PAL.css.good;
    ctx.beginPath(); ctx.arc(px, py - h - 6, 2.5 + Math.sin(t * 5) * 0.7, 0, 7); ctx.fill();

    // ochii — se uită în direcția de mers
    const ox = j.dir === 'stanga' ? -3 : j.dir === 'dreapta' ? 3 : 0;
    const oy = j.dir === 'sus' ? -2 : j.dir === 'jos' ? 1 : 0;
    if (j.dir !== 'sus') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px - 5 + ox, py - 8 + oy, 3.4, 0, 7); ctx.arc(px + 5 + ox, py - 8 + oy, 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2118';
      ctx.beginPath(); ctx.arc(px - 5 + ox * 1.4, py - 8 + oy * 1.4, 1.7, 0, 7); ctx.arc(px + 5 + ox * 1.4, py - 8 + oy * 1.4, 1.7, 0, 7); ctx.fill();
      // guriță
      ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(px + ox, py - 2 + oy, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    // accesoriul, deasupra capului
    deseneazaAccesoriu(ctx, px, py - h - 1, av.h);
  }

  /* un pod bonus: dale de scânduri (reparat) sau rupte cu goluri (de reparat) */
  function deseneazaPod(ctx, x, y, reparat, t) {
    const px = x * TILE, py = y * TILE;
    // stâlpii/umbra sub pod
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(px + 2, py + TILE - 5, TILE - 4, 4);
    if (reparat) {
      // scânduri întregi, orizontale
      ctx.fillStyle = PAL.teren.trunchi;
      ctx.fillRect(px + 1, py + 3, TILE - 2, TILE - 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px + 1, py + 6 + i * 7); ctx.lineTo(px + TILE - 1, py + 6 + i * 7); ctx.stroke(); }
      ctx.strokeStyle = PAL.css.accent2; ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 1, py + 3, TILE - 2, TILE - 6);
    } else {
      // scânduri sparte: câteva bucăți, cu goluri (apa se vede printre ele)
      ctx.fillStyle = PAL.teren.apa2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + 0.04 * Math.sin(t * 2 + x + y)) + ')';
      ctx.fillRect(px + 4, py + 8 + Math.sin(t + x) * 2, TILE - 8, 2);
      ctx.fillStyle = PAL.teren.trunchi;
      const h = hash2(x, y);
      if (h < 0.7) ctx.fillRect(px + 1, py + 4, TILE - 2, 6);          // o scândură sus
      if (h > 0.35) ctx.fillRect(px + 1, py + TILE - 11, TILE * (0.5 + h * 0.4), 6); // una parțială jos
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 4, TILE - 2, 6);
    }
  }

  /* bula „apasă E" deasupra POI-ului din rază */
  function deseneazaBula(ctx, p) {
    const eTouch = UI.eTouch;
    let text;
    if (p.fel === 'punct') text = Progres.eCitit(p.regId, p.punct.id) ? 'Recitește' : 'Deschide';
    else if (p.fel === 'boss') text = Progres.bossTrecut(p.regId) ? 'Re-încearcă recapitularea' : 'Recapitulare';
    else if (p.fel === 'banc') text = 'Banc de lucru';
    else if (p.fel === 'negustor') text = 'Negustor';
    else if (p.fel === 'pod') text = Progres.podReparat(p.insId) ? 'Treci podul' : 'Repară podul';
    else if (p.fel === 'cufar') text = Progres.insulaGolita(p.insId) ? 'Cufăr gol' : 'Deschide cufărul';
    else text = 'Citește';
    const eticheta = (eTouch ? '👆 ' : 'E · ') + text;
    ctx.font = '600 12px Inter,sans-serif';
    const w = ctx.measureText(eticheta).width + 18;
    const bx = p.x - w / 2, by = p.y - 46;
    ctx.fillStyle = PAL.css.panel;
    ctx.strokeStyle = PAL.css.accent; ctx.lineWidth = 1.5;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, w, 22, 8); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(bx, by, w, 22); ctx.strokeRect(bx, by, w, 22); }
    ctx.beginPath();
    ctx.moveTo(p.x - 4, by + 22); ctx.lineTo(p.x + 4, by + 22); ctx.lineTo(p.x, by + 27);
    ctx.closePath(); ctx.fillStyle = PAL.css.accent; ctx.fill();
    ctx.fillStyle = PAL.css.txt; ctx.textAlign = 'center';
    ctx.fillText(eticheta, p.x, by + 15);
  }

  /* ═══════════════════════════ 12. MINIMAP ════════════════════════════════ */

  const Minimap = {
    canvas: null, ctx: null, scara: 1.6,

    creeaza(parinte) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'rt-minimap';
      this.canvas.width = LUME_W * this.scara;
      this.canvas.height = LUME_H * this.scara;
      parinte.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    },

    // fundalul minimap-ului (regiunile) — redesenat doar la schimbări
    deseneaza() {
      if (!this.ctx || !PAL) return;
      const c = this.ctx, s = this.scara;
      c.fillStyle = PAL.css.bg;
      c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (const reg of ASEZARE) {
        const blocat = reg.deblocat && !Progres.bossTrecut(reg.deblocat);
        const [x0, y0, x1, y1] = reg.rect;
        c.fillStyle = PAL.teren[reg.culoare];
        c.globalAlpha = blocat ? 0.3 : 1;
        c.fillRect(x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s);
        c.globalAlpha = 1;
      }
      for (const co of CORIDOARE) {
        c.fillStyle = PAL.teren.drum;
        c.fillRect(co.x0 * s, co.y0 * s, (co.x1 - co.x0) * s, (co.y1 - co.y0) * s);
      }
      // POI-urile: puncte aurii necitite / verzi citite
      for (const p of Joc.poi) {
        if (p.fel !== 'punct') continue;
        const reg = ASEZARE.find(r => r.id === p.regId);
        if (reg && reg.deblocat && !Progres.bossTrecut(reg.deblocat)) continue;
        c.fillStyle = Progres.eCitit(p.regId, p.punct.id) ? PAL.css.good : PAL.css.accent;
        c.fillRect(p.tx * s - 1, p.ty * s - 1, 3, 3);
      }
    },

    // stratul de deasupra (jucătorul) — ieftin, la fiecare cadru relevant
    cadru() {
      if (!this.ctx) return;
      this.deseneazaJucatorDot();
    },
    deseneazaJucatorDot() {
      // redesenăm fundalul rar; punctul jucătorului îl desenăm peste o copie?
      // Simplu și suficient: un mic „ping" desenat direct — minimap-ul întreg
      // se redesenează la intervale (progres/temă/regiune), iar punctul se
      // desenează la fiecare cadru peste el, cu compensare prin redesen periodic.
    },
  };

  /* ═══════════════════════ 13. BUCLA JOCULUI ══════════════════════════════ */

  function cadru(acum) {
    if (!Joc.pornit) return;
    Joc.rafId = requestAnimationFrame(cadru);

    const dt = Math.min(0.05, (acum - Joc.ultimT) / 1000 || 0.016);
    Joc.ultimT = acum;
    Joc.timp += dt;

    if (!Joc.pauza) {
      actualizeazaJucator(dt);
      actualizeazaCamera(dt);
      Particule.actualizeaza(dt);
      Multiplayer.tick(dt);          // pozițiile celorlalți + trimiterea alei noastre
      // animațiile ambientale (apă, POI-uri care plutesc, antene) cer redesen
      // continuu doar dacă sunt vizibile — pentru simplitate, redesenăm cât
      // timp jocul e activ și nepauzat; când e pauzat, doar la "dirty".
      Joc.dirty = true;
    }

    if (Joc.dirty) {
      deseneaza();
      deseneazaMinimapJucator();
      Joc.dirty = false;
    }
  }

  // desenăm punctul jucătorului pe minimap (peste fundalul cache-uit)
  let minimapTick = 0;
  function deseneazaMinimapJucator() {
    if (!Minimap.ctx) return;
    // redesenăm fundalul la fiecare ~30 de cadre ca să „ștergem" urma punctului
    if (++minimapTick % 30 === 0) Minimap.deseneaza();
    const s = Minimap.scara;
    const c = Minimap.ctx;
    // ceilalți jucători online — puncte colorate
    for (const a of Multiplayer.alti.values()) {
      c.fillStyle = 'hsl(' + a.hue + ',60%,55%)';
      c.beginPath(); c.arc(a.x / TILE * s, a.y / TILE * s, 2, 0, 7); c.fill();
    }
    c.fillStyle = PAL.css.txt;
    c.beginPath();
    c.arc(Joc.jucator.x / TILE * s, Joc.jucator.y / TILE * s, 2.5, 0, 7);
    c.fill();
    c.strokeStyle = PAL.css.bg; c.lineWidth = 1; c.stroke();
  }

  function porneste() {
    if (Joc.pornit) return;
    if (!Joc.initializat) initializeaza();
    if (!Joc.initializat) return; // teoria nu e încărcată — mesaj deja afișat
    Joc.pornit = true;
    Joc.ultimT = performance.now();
    Joc.dirty = true;
    Joc.rafId = requestAnimationFrame(cadru);
    Multiplayer.conecteaza(); // prezența online (dacă serverul există; altfel offline)
    Muzica.incearca();        // muzica de fundal (pornește la primul gest)
  }
  function opreste() {
    if (!Joc.pornit) return;
    Joc.pornit = false;
    cancelAnimationFrame(Joc.rafId);
    Muzica.opreste();           // oprim muzica cât timp nu suntem în joc
    Multiplayer.deconecteaza(); // dispari de pe hartă cât timp nu ești în joc
    // salvăm poziția la ieșire
    Progres.date.pos = { x: Joc.jucator.x, y: Joc.jucator.y };
    Progres.salveaza();
  }

  /* ══════════════════ 14. DIMENSIONARE + CICLU DE VIAȚĂ ═══════════════════ */

  function redimensioneaza() {
    const stage = document.getElementById('rtStage');
    if (!stage || !Joc.canvas) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    Joc.latime = Math.max(280, rect.width);
    Joc.inaltime = Math.max(240, rect.height);
    Joc.dpr = dpr;
    Joc.canvas.width = Math.round(Joc.latime * dpr);
    Joc.canvas.height = Math.round(Joc.inaltime * dpr);
    Joc.canvas.style.width = Joc.latime + 'px';
    Joc.canvas.style.height = Joc.inaltime + 'px';
    Joc.ctx = Joc.canvas.getContext('2d');
    Joc.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Joc.ctx.imageSmoothingEnabled = false;
    Joc.dirty = true;
    if (Joc.pornit === false && Joc.initializat) deseneaza();
  }

  /* ═══════════════ 14b. PREZENȚA ONLINE (multiplayer ușor) ════════════════
     Jocul e single-player la conținut (progresul e local), dar jucătorii se
     VĂD unii pe alții pe hartă, în timp real: la intrare îți alegi un nume,
     serverul de prezență (serviciul „retelistan", WebSocket la /retelistan/ws)
     difuzează numele + pozițiile tuturor. Dacă serverul nu răspunde (ex. rulezi
     local, fără docker), jocul merge normal, offline — nimic nu se strică.  */

  const DIR_IDX = ['jos', 'sus', 'stanga', 'dreapta'];

  const Multiplayer = {
    ws: null, conectat: false, id: 0, nume: '',
    avatar: { c: 0, h: 0 }, // avatarul propriu (index de culoare + accesoriu)
    alti: new Map(),        // id -> {id,nume,x,y,tx,ty,dir,misca,reg,hue,av,bula}
    oprit: false,           // deconectare intenționată (tab părăsit)
    intrebat: false,        // am arătat deja modalul de nume în sesiunea asta?
    primul: true,           // primul instantaneu (fără toasturi de „a intrat")
    reconectari: 0, timer: 0, _acum: 0, ultim: null,

    poateOnline() {
      return typeof WebSocket !== 'undefined' && typeof location !== 'undefined' &&
        /^https?:$/.test(location.protocol);
    },
    numeSalvat() {
      try { return localStorage.getItem('retelistan-nume') || ''; } catch (e) { return ''; }
    },
    // avatarul e identitate (ca numele) — stă în cheia lui, separat de progres,
    // ca să nu se piardă la „resetează progresul"
    incarcaAvatar() {
      try {
        const raw = localStorage.getItem('retelistan-avatar');
        if (raw) { const a = JSON.parse(raw); this.avatar = this.curataAvatar(a.c, a.h); }
      } catch (e) {}
      return this.avatar;
    },
    curataAvatar(c, h) {
      const n = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max) ? v : 0;
      return { c: n(c, AVATAR_CULORI.length - 1), h: n(h, AVATAR_ACCESORII.length - 1) };
    },
    salveazaAvatar(c, h) {
      this.avatar = this.curataAvatar(c, h);
      try { localStorage.setItem('retelistan-avatar', JSON.stringify(this.avatar)); } catch (e) {}
      // dacă suntem online, anunțăm imediat noul aspect
      if (this.ws && this.ws.readyState === 1)
        try { this.ws.send(JSON.stringify({ t: 'av', c: this.avatar.c, h: this.avatar.h })); } catch (e) {}
      Joc.dirty = true;
    },
    // trimite un emoji/frază (index în EMOTE) și arată bula deasupra propriului cap
    trimiteEmote(k) {
      if (!EMOTE[k]) return;
      Joc.jucator.bula = { k, until: Joc.timp + 3.6 };
      Joc.dirty = true;
      Sunet.emote();
      if (this.ws && this.ws.readyState === 1)
        try { this.ws.send(JSON.stringify({ t: 'e', k })); } catch (e) {}
    },
    // aceeași curățare ca pe server (server.js → curataNume) — altfel un nume
    // care „trece" în modal ar fi respins de server la fiecare reconectare
    curataNumeLocal(v) {
      return String(v || '')
        .replace(/[\u0000-\u001F\u007F<>&"'`\\]/g, '')
        .replace(/\p{Cf}/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 14);
    },
    salveazaNume(v) {
      v = this.curataNumeLocal(v);
      try { localStorage.setItem('retelistan-nume', v); } catch (e) {}
      this.nume = v;
    },

    conecteaza() {
      if (!this.poateOnline() || this.ws || !Joc.pornit) { this.actualizeazaChip(); return; }
      this.oprit = false;
      const nume = this.numeSalvat();
      if (!nume) {
        // n-avem nume: îl cerem o singură dată pe sesiune (fără să insistăm)
        if (this.intrebat) { this.actualizeazaChip(); return; }
        if (UI.panouDeschis()) { setTimeout(() => this.conecteaza(), 1200); return; } // așteptăm să se închidă „cum se joacă"
        this.intrebat = true;
        UI.deschideNume(() => this.conecteaza());
        return;
      }
      this.nume = nume;
      const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/retelistan/ws';
      let ws;
      try { ws = new WebSocket(url); } catch (e) { this.actualizeazaChip(); return; }
      this.ws = ws;
      // toate handler-ele ignoră evenimentele unei conexiuni vechi (this.ws s-a
      // schimbat între timp) — altfel onclose-ul întârziat al vechiului socket
      // ar strica starea conexiunii noi (ex. la schimbarea numelui)
      ws.onopen = () => {
        if (this.ws !== ws) return;
        try { ws.send(JSON.stringify({ t: 'j', nume: this.nume, c: this.avatar.c, h: this.avatar.h })); } catch (e) {}
      };
      ws.onmessage = (ev) => {
        if (this.ws !== ws) return;
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.t === 'ok') {
          this.id = m.id; this.conectat = true; this.reconectari = 0; this.primul = true;
          this.ultim = null;
          // poziția pleacă IMEDIAT (nu așteptăm tick-ul — poate jocul e pe pauză),
          // altfel ceilalți nu ne văd până la prima mișcare
          try {
            ws.send(JSON.stringify({
              t: 'p', x: Math.round(Joc.jucator.x), y: Math.round(Joc.jucator.y),
              d: Joc.jucator.dir, m: 0, r: Joc.regiuneCurenta || '',
            }));
          } catch (e) {}
          UI.toast('🌐 Ești online ca <strong>' + esc(this.nume) + '</strong>');
          this.actualizeazaChip();
        } else if (m.t === 's' && Array.isArray(m.j)) this.laStare(m.j);
        else if (m.t === 'em') this.laEmote(m.id, m.k);
      };
      ws.onerror = () => { /* onclose vine oricum */ };
      ws.onclose = (ev) => {
        if (this.ws !== ws) return; // conexiune veche — nu ne mai privește
        const eraConectat = this.conectat;
        this.curata();
        if (this.oprit) return;
        // coduri fatale: nu reîncercăm în buclă cu aceleași date respinse
        if (ev && (ev.code === 4003 || ev.code === 4404)) {
          try { localStorage.removeItem('retelistan-nume'); } catch (e) {}
          this.nume = ''; this.intrebat = false;
          if (ev.code === 4003) UI.toast('🌐 Serverul a respins numele — apasă 🌐 din colț ca să alegi altul');
          return;
        }
        if (eraConectat) UI.toast('🌐 Conexiunea online s-a pierdut — reîncerc…');
        // reconectare cu backoff, doar cât timp jocul rulează
        const pauzaMs = Math.min(30000, 2000 * Math.pow(2, this.reconectari++));
        clearTimeout(this.timer);
        this.timer = setTimeout(() => { if (Joc.pornit) this.conecteaza(); }, pauzaMs);
      };
      this.actualizeazaChip();
    },

    deconecteaza() {
      this.oprit = true;
      clearTimeout(this.timer);
      if (this.ws) { try { this.ws.close(1000); } catch (e) {} }
      this.curata();
    },

    curata() {
      this.ws = null; this.conectat = false; this.id = 0;
      this.alti = new Map();
      this.actualizeazaChip();
      Joc.dirty = true;
    },

    /* logout explicit: ieși offline și uită numele salvat (nu se mai
       reconectează automat până nu reintri prin chip-ul 🌐) */
    logout() {
      this.deconecteaza();
      try { localStorage.removeItem('retelistan-nume'); } catch (e) {}
      this.nume = ''; this.intrebat = true;
      this.actualizeazaChip();
    },

    /* instantaneul de la server: [[id,nume,x,y,dir,misca,reg,avc,avh], ...] */
    laStare(lista) {
      const eraPrimul = this.primul; this.primul = false;
      const vechi = this.alti, noi = new Map();
      for (const rand of lista) {
        const [id, nume, x, y, dir, misca, reg, avc, avh] = rand;
        if (id === this.id) continue;
        let a = vechi.get(id);
        if (!a) {
          a = { id, x, y, tx: x, ty: y, hue: (id * 137) % 360, bula: null };
          if (!eraPrimul && vechi.size <= 12) UI.toast('🟢 <strong>' + esc(nume) + '</strong> a intrat în Rețelistan');
        }
        a.nume = nume; a.tx = x; a.ty = y;
        a.dir = DIR_IDX[dir] || 'jos'; a.misca = !!misca; a.reg = reg;
        a.av = { c: avc | 0, h: avh | 0 };
        if (Math.hypot(a.tx - a.x, a.ty - a.y) > 300) { a.x = a.tx; a.y = a.ty; } // „teleport" — nu interpolăm
        noi.set(id, a);
      }
      if (!eraPrimul && vechi.size <= 12)
        for (const [id, a] of vechi) if (!noi.has(id)) UI.toast('⚪ ' + esc(a.nume) + ' a plecat');
      this.alti = noi;
      this.actualizeazaChip();
      Joc.dirty = true;
    },

    /* emoji/frază venit de la alt jucător (id, index k) → bulă deasupra lui */
    laEmote(id, k) {
      const a = this.alti.get(id);
      if (!a || !EMOTE[k]) return;
      a.bula = { k, until: Joc.timp + 3.6 };
      Joc.dirty = true;
    },

    /* apelat din bucla jocului: interpolare + trimiterea propriei poziții */
    tick(dt) {
      if (!this.conectat) return;
      for (const a of this.alti.values()) {
        const f = clamp(dt * 10, 0, 1);
        a.x += (a.tx - a.x) * f;
        a.y += (a.ty - a.y) * f;
        if (Math.abs(a.tx - a.x) + Math.abs(a.ty - a.y) > 0.5) Joc.dirty = true;
      }
      this._acum += dt;
      const j = Joc.jucator;
      const schimbat = !this.ultim || Math.abs(j.x - this.ultim.x) > 1 || Math.abs(j.y - this.ultim.y) > 1 ||
        j.dir !== this.ultim.dir || j.misca !== this.ultim.misca;
      if ((schimbat && this._acum >= 0.1) || this._acum >= 2) { // max ~10 mesaje/s + heartbeat la 2s
        this._acum = 0;
        this.ultim = { x: j.x, y: j.y, dir: j.dir, misca: j.misca };
        if (this.ws && this.ws.readyState === 1) {
          try {
            this.ws.send(JSON.stringify({
              t: 'p', x: Math.round(j.x), y: Math.round(j.y),
              d: j.dir, m: j.misca ? 1 : 0, r: Joc.regiuneCurenta || '',
            }));
          } catch (e) {}
        }
      }
    },

    actualizeazaChip() {
      const b = document.getElementById('rtOnlineChip');
      if (!b) return;
      if (!this.poateOnline()) { b.style.display = 'none'; return; }
      b.style.display = '';
      if (this.conectat) {
        b.textContent = '👥 ' + (this.alti.size + 1);
        b.title = 'Online ca „' + this.nume + '" — click ca să schimbi numele';
      } else {
        b.textContent = '🌐 offline';
        b.title = 'Click ca să intri online';
      }
    },
  };

  /* eticheta cu numele, desenată deasupra unui personaj */
  function deseneazaEticheta(ctx, x, y, text, eEu) {
    ctx.font = '600 10px Inter,sans-serif';
    const w = ctx.measureText(text).width + 12;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = PAL.css.panel;
    ctx.strokeStyle = eEu ? PAL.css.accent : PAL.css.border;
    ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - w / 2, y - 8, w, 15, 7); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(x - w / 2, y - 8, w, 15); ctx.strokeRect(x - w / 2, y - 8, w, 15); }
    ctx.fillStyle = PAL.css.txt;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 3);
    ctx.globalAlpha = 1;
  }

  /* un alt jucător: același pachet simpatic, dar cu avatarul lui + nume */
  function deseneazaAlt(ctx, a, t) {
    const bob = a.misca ? Math.abs(Math.sin(t * 9 + a.id)) * 2.5 : Math.sin(t * 1.8 + a.id) * 1;
    const px = a.x, py = a.y - bob;
    const cul = a.av ? culoriAvatar(a.av.c) : {
      corp: 'hsl(' + a.hue + ',52%,' + (PAL.eLight ? 44 : 58) + '%)',
      dunga: 'hsl(' + a.hue + ',52%,' + (PAL.eLight ? 32 : 40) + '%)',
    };

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(px, a.y + 10, 10, 4, 0, 0, 7); ctx.fill();

    ctx.fillStyle = PAL.css.bg3;
    const pas = a.misca ? Math.sin(t * 9 + a.id) * 4 : 0;
    ctx.fillRect(px - 6, a.y + 4 + pas * 0.4, 5, 5);
    ctx.fillRect(px + 1, a.y + 4 - pas * 0.4, 5, 5);

    const w = 20, h = 22;
    ctx.fillStyle = cul.corp;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.6;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px - w / 2, py - h + 4, w, h, 6); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(px - w / 2, py - h + 4, w, h); ctx.strokeRect(px - w / 2, py - h + 4, w, h); }
    ctx.fillStyle = cul.dunga;
    ctx.fillRect(px - w / 2 + 2, py - h + 6, w - 4, 5);

    const ox = a.dir === 'stanga' ? -3 : a.dir === 'dreapta' ? 3 : 0;
    const oy = a.dir === 'sus' ? -2 : a.dir === 'jos' ? 1 : 0;
    if (a.dir !== 'sus') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px - 4 + ox, py - 8 + oy, 3, 0, 7); ctx.arc(px + 4 + ox, py - 8 + oy, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2118';
      ctx.beginPath(); ctx.arc(px - 4 + ox * 1.4, py - 8 + oy * 1.4, 1.5, 0, 7); ctx.arc(px + 4 + ox * 1.4, py - 8 + oy * 1.4, 1.5, 0, 7); ctx.fill();
    }
    if (a.av) deseneazaAccesoriu(ctx, px, py - h + 3, a.av.h);
    deseneazaEticheta(ctx, px, py - h - 8, a.nume, false);
  }

  /* ══════════════════════ 15. INTERFAȚA (DOM peste canvas) ════════════════ */

  const UI = {
    radacina: null, overlay: null, panou: null, hud: null, toasturi: null,
    bannerEl: null, eTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
    _bannerTimer: 0,

    construieste() {
      const pagina = document.getElementById('page-harta');
      if (!pagina) return false;
      injecteazaStiluri();

      const root = document.createElement('div');
      root.className = 'rt-root';
      root.innerHTML =
        '<div class="rt-stage" id="rtStage">' +
          // canvasul e deja în pagină (cerut de integrare) — îl mutăm aici
        '</div>';
      // canvasul definit în index.html
      const canvas = document.getElementById('worldCanvas');
      pagina.appendChild(root);
      const stage = root.querySelector('#rtStage');
      if (canvas) stage.appendChild(canvas);
      else { const c = document.createElement('canvas'); c.id = 'worldCanvas'; stage.appendChild(c); }
      Joc.canvas = document.getElementById('worldCanvas');
      Joc.canvas.setAttribute('tabindex', '0');
      Joc.canvas.setAttribute('aria-label', 'Harta Rețelistan — folosește săgețile sau WASD ca să te miști');

      // HUD
      this.hud = document.createElement('div');
      this.hud.className = 'rt-hud';
      this.hud.innerHTML =
        '<div class="rt-hud-st">' +
          '<div class="rt-chip" id="rtRegChip">🗺️ Rețelistan</div>' +
          '<div class="rt-chip rt-chip-mic" id="rtProgChip">📜 0/0</div>' +
          '<div class="rt-chip rt-chip-mic rt-chip-bani" id="rtBaniChip" title="Bani">💰 0</div>' +
          '<button class="rt-btn rt-online" id="rtOnlineChip" style="display:none">🌐</button>' +
        '</div>' +
        '<div class="rt-hud-dr">' +
          '<button class="rt-btn" id="rtBtnInventar" title="Inventar & avatar (I)">🎒</button>' +
          '<button class="rt-btn" id="rtBtnJurnal" title="Jurnal (J)">📖</button>' +
          '<button class="rt-btn" id="rtBtnAjutor" title="Cum se joacă">❓</button>' +
          '<button class="rt-btn" id="rtBtnSunet" title="Efecte sonore">🔊</button>' +
          '<button class="rt-btn" id="rtBtnMuzica" title="Muzică">🎵</button>' +
        '</div>';
      stage.appendChild(this.hud);
      Minimap.creeaza(stage);

      // butonul plutitor de emoji/fraze (jos-centru) — desktop și telefon
      const emoteBtn = document.createElement('button');
      emoteBtn.className = 'rt-emote-btn';
      emoteBtn.id = 'rtEmoteBtn';
      emoteBtn.title = 'Emoji & mesaje (R)';
      emoteBtn.textContent = '🙂';
      emoteBtn.onclick = () => this.comutaEmote();
      stage.appendChild(emoteBtn);

      // bannerul de intrare în regiune
      this.bannerEl = document.createElement('div');
      this.bannerEl.className = 'rt-banner';
      stage.appendChild(this.bannerEl);

      // toasturi
      this.toasturi = document.createElement('div');
      this.toasturi.className = 'rt-toasts';
      stage.appendChild(this.toasturi);

      // overlay-ul pentru panouri
      this.overlay = document.createElement('div');
      this.overlay.className = 'rt-overlay';
      this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.inchidePanou(); });
      stage.appendChild(this.overlay);

      // controale touch
      if (this.eTouch) this.construiesteTouch(stage);

      // butoane
      this.hud.querySelector('#rtBtnInventar').onclick = () => this.deschideInventar();
      this.hud.querySelector('#rtBtnJurnal').onclick = () => this.deschideJurnal();
      this.hud.querySelector('#rtBtnAjutor').onclick = () => this.deschideAjutor();
      const btnSunet = this.hud.querySelector('#rtBtnSunet');
      const setSunet = () => { btnSunet.textContent = Progres.date.sunet ? '🔊' : '🔇'; };
      setSunet();
      btnSunet.onclick = () => { Progres.date.sunet = !Progres.date.sunet; Progres.salveaza(); setSunet(); };
      const btnMuzica = this.hud.querySelector('#rtBtnMuzica');
      const setMuzica = () => { btnMuzica.textContent = Progres.date.muzica ? '🎵' : '🎶'; btnMuzica.classList.toggle('rt-btn-off', !Progres.date.muzica); };
      setMuzica();
      btnMuzica.onclick = () => { Muzica.comuta(); setMuzica(); };
      // chip-ul online: intră online / schimbă numele
      this.hud.querySelector('#rtOnlineChip').onclick = () => {
        if (Multiplayer.conectat) this.deschideNume(() => { Multiplayer.deconecteaza(); Multiplayer.conecteaza(); });
        else { Multiplayer.intrebat = false; Multiplayer.conecteaza(); }
      };

      this.radacina = root;
      return true;
    },

    construiesteTouch(stage) {
      // joystick virtual (stânga-jos)
      const joy = document.createElement('div');
      joy.className = 'rt-joy';
      joy.innerHTML = '<div class="rt-joy-cap"></div>';
      stage.appendChild(joy);
      const cap = joy.firstChild;
      let idPointer = null, cx = 0, cy = 0;
      const RAZA = 42;
      joy.addEventListener('pointerdown', e => {
        idPointer = e.pointerId; joy.setPointerCapture(idPointer);
        const r = joy.getBoundingClientRect();
        cx = r.left + r.width / 2; cy = r.top + r.height / 2;
        misca(e);
      });
      const misca = e => {
        if (e.pointerId !== idPointer) return;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const m = Math.hypot(dx, dy);
        if (m > RAZA) { dx = dx / m * RAZA; dy = dy / m * RAZA; }
        cap.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        Input.joy.activ = true;
        Input.joy.dx = dx / RAZA; Input.joy.dy = dy / RAZA;
        // zonă moartă
        if (Math.hypot(Input.joy.dx, Input.joy.dy) < 0.2) { Input.joy.dx = 0; Input.joy.dy = 0; }
      };
      const gata = e => {
        if (e.pointerId !== idPointer) return;
        idPointer = null;
        cap.style.transform = '';
        Input.joy.activ = false; Input.joy.dx = 0; Input.joy.dy = 0;
      };
      joy.addEventListener('pointermove', misca);
      joy.addEventListener('pointerup', gata);
      joy.addEventListener('pointercancel', gata);

      // butonul de acțiune (dreapta-jos)
      const btn = document.createElement('button');
      btn.className = 'rt-act';
      btn.textContent = 'E';
      btn.addEventListener('pointerdown', e => { e.preventDefault(); interactioneaza(); });
      stage.appendChild(btn);
    },

    /* ── HUD ── */
    actualizeazaHud() {
      const reg = Joc.regiuni[Joc.regiuneCurenta];
      const chip = document.getElementById('rtRegChip');
      if (chip) chip.textContent = reg ? (reg.icon + ' ' + reg.nume) : '🗺️ Rețelistan';
      const prog = document.getElementById('rtProgChip');
      const citite = Object.keys(Progres.date.citite).length;
      const pct = Joc.totalPuncte ? Math.round(citite / Joc.totalPuncte * 100) : 0;
      if (prog) prog.textContent = '📜 ' + citite + '/' + Joc.totalPuncte + ' · ' + pct + '%';
      const bani = document.getElementById('rtBaniChip');
      if (bani) bani.textContent = '💰 ' + (Progres.date.bani || 0);
    },

    banner(regId, prima) {
      const reg = Joc.regiuni[regId];
      const asez = ASEZARE.find(r => r.id === regId);
      if (!reg || !this.bannerEl) return;
      this.bannerEl.innerHTML =
        '<div class="rt-banner-icon">' + esc(reg.icon) + '</div>' +
        '<div><div class="rt-banner-nume">' + esc(reg.nume) + '</div>' +
        '<div class="rt-banner-sub">' + esc(prima ? (reg.descriere || '') : 'Bine ai revenit!') + '</div></div>';
      this.bannerEl.classList.add('vizibil');
      clearTimeout(this._bannerTimer);
      this._bannerTimer = setTimeout(() => this.bannerEl.classList.remove('vizibil'), prima ? 4200 : 2200);
    },

    toast(html) {
      const el = document.createElement('div');
      el.className = 'rt-toast';
      el.innerHTML = html;
      this.toasturi.appendChild(el);
      requestAnimationFrame(() => el.classList.add('vizibil'));
      setTimeout(() => { el.classList.remove('vizibil'); setTimeout(() => el.remove(), 400); }, 3400);
    },

    /* ── panouri (modal peste joc; jocul stă pe pauză) ── */
    panouDeschis() { return this.overlay && this.overlay.classList.contains('vizibil'); },

    aratapanou(html, clasa) {
      this.inchideEmote(); // paleta de emoji nu stă peste un modal
      this.overlay.innerHTML = '<div class="rt-panou ' + (clasa || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
      this.overlay.classList.add('vizibil');
      this.panou = this.overlay.firstChild;
      Joc.pauza = true;
      Input.taste = {}; // să nu rămână blocată vreo direcție
      const x = this.panou.querySelector('.rt-inchide');
      if (x) x.onclick = () => this.inchidePanou();
      return this.panou;
    },

    inchidePanou() {
      if (!this.panouDeschis()) return;
      this.overlay.classList.remove('vizibil');
      this.overlay.innerHTML = '';
      this.panou = null;
      Joc.pauza = false;
      Joc.dirty = true;
      if (Joc.canvas) Joc.canvas.focus({ preventScroll: true });
    },

    /* ── panoul de teorie, cu straturi progresive ── */
    deschideTeorie(poi) {
      const p = poi.punct, reg = Joc.regiuni[poi.regId];
      const citit = Progres.eCitit(poi.regId, p.id);
      const straturi = [];
      straturi.push({ id: 'detaliu', buton: '📖 Continuă — explicația completă', html: '<div class="rt-strat-corp rt-detaliu">' + miniMd(p.detaliu) + '</div>' });
      if (p.diagrama && Diagrame.exista(p.diagrama))
        straturi.push({ id: 'diagrama', buton: '📊 Arată diagrama', html: '<div class="rt-strat-corp rt-diagrama" data-diagrama="' + esc(p.diagrama) + '"></div>' });
      if (p.examen)
        straturi.push({ id: 'examen', buton: '💡 Cum pică la examen', html: '<div class="rt-strat-corp rt-examen"><div class="rt-examen-titlu">💡 De examen</div>' + miniMd(p.examen) + '</div>' });

      let html =
        '<div class="rt-panou-cap">' +
          '<div class="rt-panou-emoji">' + esc(EMOJI_POI[p.tip] || '📄') + '</div>' +
          '<div class="rt-panou-titluri"><h3>' + esc(p.titlu) + '</h3>' +
          '<div class="rt-panou-sub">' + esc(reg ? reg.icon + ' ' + reg.nume : '') + (p.sursa ? ' · <span class="rt-sursa">' + esc(p.sursa) + '</span>' : '') + '</div></div>' +
          '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
        '</div>' +
        '<div class="rt-panou-corp">' +
          '<div class="rt-rezumat">' + miniMd(p.rezumat) + '</div>' +
          '<div id="rtStraturi"></div>' +
        '</div>' +
        '<div class="rt-panou-jos">' +
          (citit
            ? '<div class="rt-fapta-afisata">📜 <em>' + esc(p.faptaCheie || '') + '</em></div>'
            : '<button class="rt-done" id="rtDone" disabled title="Deschide toate straturile mai întâi">✔ Am înțeles — colectează fapta-cheie</button>') +
        '</div>';

      const panou = this.aratapanou(html, 'rt-panou-teorie');
      const cont = panou.querySelector('#rtStraturi');
      const btnDone = panou.querySelector('#rtDone');
      let dezvaluite = 0;

      // dezvăluire progresivă: fiecare buton deschide stratul următor
      const arataUrmatorul = () => {
        if (dezvaluite >= straturi.length) return;
        const s = straturi[dezvaluite];
        const btn = document.createElement('button');
        btn.className = 'rt-more';
        btn.innerHTML = s.buton;
        btn.onclick = () => {
          btn.remove();
          const div = document.createElement('div');
          div.className = 'rt-strat';
          div.innerHTML = s.html;
          cont.appendChild(div);
          const dg = div.querySelector('[data-diagrama]');
          if (dg) dg.appendChild(Diagrame.construieste(dg.dataset.diagrama));
          requestAnimationFrame(() => div.classList.add('vizibil'));
          dezvaluite++;
          arataUrmatorul();
          if (dezvaluite >= straturi.length && btnDone) {
            btnDone.disabled = false;
            btnDone.title = '';
          }
          div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        cont.appendChild(btn);
      };
      arataUrmatorul();

      if (btnDone) btnDone.onclick = () => {
        const nou = Progres.marcheazaCitit(poi.regId, p.id);
        // recompensă în materiale — doar prima dată când citești punctul
        const drop = nou ? Craft.dropCitit(poi.regId, p.id) : null;
        if (drop) Craft.aplicaDrop(drop);
        this.inchidePanou();
        if (nou) {
          Sunet.citit(); Sunet.fapta();
          Particule.explozie(poi.x, poi.y - 8, 'fapta', 16);
          this.toast('📜 <strong>Faptă-cheie colectată:</strong> ' + esc(p.faptaCheie || p.titlu));
          if (drop) this.toast('🎒 Ai primit ' + textDrop(drop));
          this.actualizeazaHud();
          Minimap.deseneaza();
          this.verificaRegiuneCompleta(poi.regId);
        }
      };
    },

    verificaRegiuneCompleta(regId) {
      const reg = Joc.regiuni[regId];
      if (!reg || !reg.puncte) return;
      const toate = reg.puncte.every(p => Progres.eCitit(regId, p.id));
      if (toate) this.toast('🌟 Ai citit toată teoria din <strong>' + esc(reg.nume) + '</strong>! Caută paznicul 🛡️ pentru recapitulare.');
    },

    /* ── semnul regiunii (panoul de intrare) ── */
    deschideSemn(regId) {
      const reg = Joc.regiuni[regId];
      const asez = ASEZARE.find(r => r.id === regId);
      if (!reg) return;
      const citite = (reg.puncte || []).filter(p => Progres.eCitit(regId, p.id)).length;
      const total = (reg.puncte || []).length;
      const listaPuncte = (reg.puncte || []).map(p =>
        '<li class="' + (Progres.eCitit(regId, p.id) ? 'gata' : '') + '">' +
        (Progres.eCitit(regId, p.id) ? '✔' : '○') + ' ' + esc(p.titlu) + '</li>').join('');
      this.aratapanou(
        '<div class="rt-panou-cap">' +
          '<div class="rt-panou-emoji">' + esc(reg.icon) + '</div>' +
          '<div class="rt-panou-titluri"><h3>' + esc(reg.nume) + '</h3>' +
          '<div class="rt-panou-sub">Sursă: <span class="rt-sursa">' + esc(reg.sursa || '') + '</span></div></div>' +
          '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
        '</div>' +
        '<div class="rt-panou-corp">' +
          '<p class="rt-descriere">' + esc(reg.descriere || '') + '</p>' +
          '<div class="rt-bara"><div class="rt-bara-plin" style="width:' + (total ? citite / total * 100 : 0) + '%"></div></div>' +
          '<p class="rt-mut">' + citite + '/' + total + ' puncte de teorie citite</p>' +
          '<ul class="rt-lista-puncte">' + listaPuncte + '</ul>' +
        '</div>', 'rt-panou-semn');
    },

    /* ── recapitularea („bossul") ── */
    deschideRecap(regId) {
      const reg = Joc.regiuni[regId];
      if (!reg || !reg.recap || !reg.recap.length) return;
      const intrebari = reg.recap;
      const trecut = Progres.bossTrecut(regId);
      const panou = this.aratapanou(
        '<div class="rt-panou-cap">' +
          '<div class="rt-panou-emoji">🛡️</div>' +
          '<div class="rt-panou-titluri"><h3>Recapitulare — ' + esc(reg.nume) + '</h3>' +
          '<div class="rt-panou-sub">' + intrebari.length + ' întrebări · răspunde corect la cel puțin 2 ca să deschizi drumul</div></div>' +
          '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
        '</div>' +
        '<div class="rt-panou-corp" id="rtRecapCorp"></div>', 'rt-panou-recap');

      const corp = panou.querySelector('#rtRecapCorp');
      let i = 0, scor = 0;

      const arataIntro = () => {
        corp.innerHTML =
          '<p class="rt-descriere">' + (trecut
            ? 'Ai trecut deja recapitularea asta (' + Progres.scorBoss(regId) + '/' + intrebari.length + '). O poți reface oricând pentru scor perfect. 🏅'
            : 'Paznicul vrea să vadă că ai reținut ideile-cheie din <strong>' + esc(reg.nume) + '</strong>. Fără grabă — dacă greșești, poți reveni oricând.') + '</p>' +
          '<button class="rt-done" id="rtStart">⚔️ Începe recapitularea</button>';
        corp.querySelector('#rtStart').onclick = arataIntrebarea;
      };

      const arataIntrebarea = () => {
        const q = intrebari[i];
        const punctePr = intrebari.map((_, k) =>
          '<span class="rt-punct-pr ' + (k < i ? 'facut' : k === i ? 'acum' : '') + '"></span>').join('');
        corp.innerHTML =
          '<div class="rt-recap-prog">' + punctePr + '</div>' +
          '<div class="rt-intrebare">' + esc(q.intrebare) + '</div>' +
          '<div class="rt-variante">' + q.variante.map((v, k) =>
            '<button class="rt-varianta" data-k="' + k + '">' + esc(v) + '</button>').join('') + '</div>' +
          '<div class="rt-explicatie" id="rtExpl"></div>';
        corp.querySelectorAll('.rt-varianta').forEach(btn => {
          btn.onclick = () => {
            const k = +btn.dataset.k;
            const corect = k === q.corect;
            if (corect) { scor++; Sunet.corect(); } else Sunet.gresit();
            corp.querySelectorAll('.rt-varianta').forEach((b, kk) => {
              b.disabled = true;
              if (kk === q.corect) b.classList.add('corect');
              else if (kk === k) b.classList.add('gresit');
            });
            const expl = corp.querySelector('#rtExpl');
            expl.innerHTML = (corect ? '✅ <strong>Corect!</strong> ' : '❌ <strong>Nu chiar.</strong> ') + esc(q.explicatie || '');
            expl.classList.add('vizibil');
            const mai = document.createElement('button');
            mai.className = 'rt-done';
            mai.textContent = i + 1 < intrebari.length ? 'Următoarea întrebare →' : 'Vezi rezultatul';
            mai.onclick = () => { i++; i < intrebari.length ? arataIntrebarea() : arataRezultat(); };
            expl.after(mai);
          };
        });
      };

      const arataRezultat = () => {
        const trecutAcum = scor >= 2;
        const dejaEra = Progres.bossTrecut(regId);
        Progres.seteazaBoss(regId, scor);
        let mesaj, bonus = null;
        if (trecutAcum && !dejaEra) {
          mesaj = '🎉 <strong>Ai trecut!</strong> Poarta se deschide.';
          deschidePorti(regId);
          // răsplată de challenge — o singură dată, la prima trecere a paznicului
          bonus = { bani: 20 + scor * 5, piesa: 2 };
          Progres.adaugaBani(bonus.bani);
          Progres.adaugaResursa('piesa', bonus.piesa);
          Sunet.bani();
        } else if (trecutAcum) {
          mesaj = scor === intrebari.length ? '🏅 Scor perfect!' : '👍 Bine! Poarta rămâne deschisă.';
        } else {
          mesaj = '💪 Mai citește punctele din regiune și încearcă din nou — paznicul e răbdător.';
        }
        corp.innerHTML =
          '<div class="rt-rezultat">' +
            '<div class="rt-rezultat-scor">' + scor + '/' + intrebari.length + '</div>' +
            '<p>' + mesaj + '</p>' +
            (bonus ? '<p class="rt-recompensa">🎁 Răsplată: ' + esc(textDrop(bonus)) + '</p>' : '') +
            (regId === 'aplicatii' && trecutAcum
              ? '<p class="rt-final">🏆 <strong>Ai străbătut tot Rețelistanul!</strong> De la semnal la aplicație — exact drumul unui pachet. Jurnalul (📖) îți păstrează toate faptele-cheie pentru recapitulare.</p>' : '') +
            '<button class="rt-done" id="rtGata">Continuă explorarea</button>' +
          '</div>';
        corp.querySelector('#rtGata').onclick = () => this.inchidePanou();
        this.actualizeazaHud();
      };

      arataIntro();
    },

    /* ── jurnalul: fapte-cheie colectate + insigne + setări ── */
    deschideJurnal() {
      if (this.panouDeschis()) this.inchidePanou();
      const citite = Object.keys(Progres.date.citite).length;
      const pct = Joc.totalPuncte ? Math.round(citite / Joc.totalPuncte * 100) : 0;

      let sectiuni = '';
      for (const asez of ASEZARE) {
        const reg = Joc.regiuni[asez.id];
        if (!reg) continue;
        const puncte = reg.puncte || [];
        const nCitite = puncte.filter(p => Progres.eCitit(asez.id, p.id)).length;
        const boss = Progres.bossTrecut(asez.id);
        const blocat = asez.deblocat && !Progres.bossTrecut(asez.deblocat);
        const fapte = puncte.map(p => {
          const c = Progres.eCitit(asez.id, p.id);
          return '<li class="' + (c ? 'gata' : 'ascuns') + '">' +
            (c ? '📜 ' + esc(p.faptaCheie || p.titlu) : '🔒 <span class="rt-mut">' + esc(p.titlu) + ' — necitit</span>') + '</li>';
        }).join('');
        sectiuni +=
          '<details class="rt-jurnal-reg"' + (asez.id === Joc.regiuneCurenta ? ' open' : '') + '>' +
            '<summary>' + esc(reg.icon + ' ' + reg.nume) +
              '<span class="rt-jurnal-meta">' + (blocat ? '🔒' : nCitite + '/' + puncte.length + (boss ? ' · 🏅' : '')) + '</span>' +
            '</summary>' +
            (blocat ? '<p class="rt-mut">Regiune încă neexplorată — deschide drumul până aici.</p>'
                    : '<ul class="rt-jurnal-fapte">' + fapte + '</ul>') +
          '</details>';
      }

      const panou = this.aratapanou(
        '<div class="rt-panou-cap">' +
          '<div class="rt-panou-emoji">📖</div>' +
          '<div class="rt-panou-titluri"><h3>Jurnalul de concepte</h3>' +
          '<div class="rt-panou-sub">' + citite + '/' + Joc.totalPuncte + ' fapte-cheie · ' + pct + '% din teorie</div></div>' +
          '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
        '</div>' +
        '<div class="rt-panou-corp">' + sectiuni +
          '<div class="rt-jurnal-setari">' +
            '<button class="rt-btn-sec" id="rtReset">🗑️ Resetează progresul</button>' +
          '</div>' +
        '</div>', 'rt-panou-jurnal');

      panou.querySelector('#rtReset').onclick = () => {
        if (!confirm('Sigur ștergi tot progresul din Rețelistan? (teoria citită, faptele-cheie, porțile deschise)')) return;
        Progres.reset();
        this.inchidePanou();
        Joc.initializat = false;
        initializeaza();
        this.toast('Progres resetat. Explorare plăcută de la zero! 🌱');
      };
    },

    /* ── modalul de nume pentru prezența online ── */
    deschideNume(dupa) {
      if (this.panouDeschis()) this.inchidePanou();
      const curent = Multiplayer.numeSalvat();
      const panou = this.aratapanou(
        '<div class="rt-panou-cap">' +
          '<div class="rt-panou-emoji">🌐</div>' +
          '<div class="rt-panou-titluri"><h3>Joacă online</h3>' +
          '<div class="rt-panou-sub">ceilalți te văd pe hartă, cu numele tău</div></div>' +
          '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
        '</div>' +
        '<div class="rt-panou-corp">' +
          '<p class="rt-descriere">Alege un nume — toți cei care explorează Rețelistanul acum o să te vadă plimbându-te pe hartă (și tu pe ei). Progresul tău rămâne doar al tău.</p>' +
          '<input class="rt-nume-input" id="rtNume" maxlength="14" placeholder="ex. Gabi" value="' + esc(curent) + '" autocomplete="off">' +
          '<p class="rt-mut">2–14 caractere · se salvează în browserul tău</p>' +
          '<button class="rt-done" id="rtNumeOk">🌐 ' + (Multiplayer.conectat ? 'Salvează numele' : 'Intră online') + '</button>' +
          '<button class="rt-btn-sec" id="rtNumeAvatar" style="display:block;width:100%;margin-top:8px">🎨 Schimbă avatarul</button>' +
          (curent || Multiplayer.conectat
            ? '<button class="rt-btn-sec rt-danger" id="rtLogout" style="display:block;width:100%;margin-top:8px">🚪 Ieși offline (logout)</button>'
            : '<button class="rt-btn-sec" id="rtNumeNu" style="display:block;width:100%;margin-top:8px">Joacă offline</button>') +
        '</div>', 'rt-panou-nume');
      const input = panou.querySelector('#rtNume');
      setTimeout(() => { input.focus(); input.select(); }, 50);
      const ok = () => {
        // aceeași curățare ca pe server — ce trece aici e garantat acceptat acolo
        const v = Multiplayer.curataNumeLocal(input.value);
        if (v.length < 2) { input.classList.add('rau'); input.focus(); return; }
        Multiplayer.salveazaNume(v);
        this.inchidePanou();
        if (dupa) dupa();
      };
      panou.querySelector('#rtNumeOk').onclick = ok;
      panou.querySelector('#rtNumeAvatar').onclick = () => this.deschideAvatar(() => this.deschideNume(dupa));
      const btnNu = panou.querySelector('#rtNumeNu');
      if (btnNu) btnNu.onclick = () => this.inchidePanou();
      const btnLogout = panou.querySelector('#rtLogout');
      if (btnLogout) btnLogout.onclick = () => {
        Multiplayer.logout();
        this.inchidePanou();
        this.toast('🚪 Ai ieșit offline. Nu te mai vede nimeni pe hartă.');
      };
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { ok(); e.preventDefault(); }
        if (e.key !== 'Escape') e.stopPropagation(); // să nu miște personajul cât scrii
      });
    },

    /* ── ecranul „cum se joacă" ── */
    deschideAjutor() {
      if (this.panouDeschis()) this.inchidePanou();
      this.aratapanou(
        '<div class="rt-panou-cap">' +
          '<div class="rt-panou-emoji">🗺️</div>' +
          '<div class="rt-panou-titluri"><h3>Bine ai venit în Rețelistan!</h3>' +
          '<div class="rt-panou-sub">teoria de la Rețele, ca o lume explorabilă</div></div>' +
          '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
        '</div>' +
        '<div class="rt-panou-corp rt-ajutor">' +
          '<p>Fiecare regiune ține teoria unui curs. Plimbă-te, deschide punctele de interes și strânge <strong>fapte-cheie</strong>. La ieșirea din regiune, un paznic 🛡️ îți pune 3 întrebări — treci recapitularea și drumul se deschide mai departe.</p>' +
          '<p>Pe drum strângi <strong>materiale</strong> 🪵🔩⚙️ din teorie și recapitulări. La <strong>bancul de lucru 🛠️</strong> din sat le combini în unelte, repari <strong>poduri 🚧</strong> stricate și treci pe insule secrete cu comori 🎁. La <strong>negustor 🏪</strong> vinzi ce-ți prisosește și cumperi ce-ți lipsește.</p>' +
          '<ul class="rt-ajutor-lista">' +
            (this.eTouch
              ? '<li>🕹️ <strong>Joystick</strong> — mișcare · <strong>E</strong> — interacționează · <strong>🙂</strong> — emoji/mesaje</li>'
              : '<li>⌨️ <strong>WASD / săgeți</strong> — mișcare · <strong>Shift</strong> — fugi</li>' +
                '<li>⚡ <strong>E / Space</strong> — interacționează · <strong>J</strong> — jurnal · <strong>I</strong> — inventar · <strong>R</strong> — emoji · <strong>Esc</strong> — închide</li>') +
            '<li>💻 🧑‍🏫 📡 📦 — puncte de teorie (rezumat → detaliu → diagramă → 💡 de examen) + materiale</li>' +
            '<li>🛡️ — recapitularea care deschide poarta următoare (+ răsplată)</li>' +
            '<li>🛠️ banc de lucru · 🏪 negustor · 🚧 pod de reparat · 🎒 inventar & avatar</li>' +
            '<li>🙂 — trimite emoji și mesaje celorlalți jucători online</li>' +
          '</ul>' +
          '<p class="rt-mut">Drumul prin hartă urmează drumul unui pachet prin stiva de rețea: de la semnalul fizic până la aplicație. Progresul se salvează automat în browser.</p>' +
          '<button class="rt-done" id="rtHaide">Hai la drum! 🎒</button>' +
        '</div>', 'rt-panou-ajutor');
      const b = this.overlay.querySelector('#rtHaide');
      if (b) b.onclick = () => { Progres.date.ajutorVazut = true; Progres.salveaza(); this.inchidePanou(); };
    },

    /* antetul comun al panourilor */
    capPanou(emoji, titlu, sub) {
      return '<div class="rt-panou-cap">' +
        '<div class="rt-panou-emoji">' + esc(emoji) + '</div>' +
        '<div class="rt-panou-titluri"><h3>' + esc(titlu) + '</h3>' +
        '<div class="rt-panou-sub">' + esc(sub || '') + '</div></div>' +
        '<button class="rt-inchide" title="Închide (Esc)">✕</button>' +
      '</div>';
    },

    /* ── bancul de lucru: crafting ── */
    deschideCrafting() {
      const randRet = (r) => {
        const stare = Craft.poate(r);
        const are = Progres.nrUnealta(r.id);
        const cost = Object.keys(r.cost).map(id =>
          '<span class="rt-cost' + (Progres.resursa(id) < r.cost[id] ? ' rt-cost-lipsa' : '') + '">' +
          RESURSE[id].emoji + ' ' + r.cost[id] + '</span>').join('');
        const nec = (r.necesita || []).map(u => {
          const rr = Craft.reteta(u);
          return '<span class="rt-cost' + (Progres.areUnealta(u) ? '' : ' rt-cost-lipsa') + '" title="unealtă necesară">' +
            (rr ? rr.emoji : '') + '</span>';
        }).join('');
        const cun = r.cunostinteTot
          ? '<span class="rt-cost' + (Progres.date.fapte.length >= Joc.totalPuncte ? '' : ' rt-cost-lipsa') + '" title="cunoștințe necesare">🧠 toată teoria</span>'
          : '';
        return '<div class="rt-reteta">' +
          '<div class="rt-reteta-emoji">' + r.emoji + '</div>' +
          '<div class="rt-reteta-info">' +
            '<div class="rt-reteta-nume">' + esc(r.nume) + (are ? ' <span class="rt-mut">×' + are + '</span>' : '') + '</div>' +
            '<div class="rt-reteta-desc">' + esc(r.desc) + '</div>' +
            '<div class="rt-reteta-cost">' + cost + nec + cun + '</div>' +
          '</div>' +
          '<button class="rt-craft-btn" data-id="' + r.id + '"' + (stare.ok ? '' : ' disabled') + '>Fă</button>' +
        '</div>';
      };
      const panou = this.aratapanou(
        this.capPanou('🛠️', 'Banc de lucru', 'combină materiale în unelte') +
        '<div class="rt-panou-corp">' +
          '<p class="rt-mut rt-inv-rezumat" id="rtCraftInv"></p>' +
          '<div id="rtCraftLista"></div>' +
        '</div>', 'rt-panou-craft');
      const refresh = () => {
        panou.querySelector('#rtCraftInv').innerHTML = this.rezumatResurse();
        panou.querySelector('#rtCraftLista').innerHTML = RETETE.map(randRet).join('');
        panou.querySelectorAll('.rt-craft-btn').forEach(bt => bt.onclick = () => {
          const r = Craft.reteta(bt.dataset.id);
          if (Craft.faurente(r)) {
            Sunet.craft();
            this.toast('🔨 Ai făurit ' + r.emoji + ' <strong>' + esc(r.nume) + '</strong>!');
            this.actualizeazaHud();
            refresh();
          }
        });
      };
      refresh();
    },

    /* ── negustorul: vinzi/cumperi resurse ── */
    deschideShop() {
      const pretCumpara = id => Math.ceil(RESURSE[id].pret * 1.7);
      const randRes = id => {
        const r = RESURSE[id], n = Progres.resursa(id);
        return '<div class="rt-shop-rand">' +
          '<div class="rt-shop-nume">' + r.emoji + ' ' + esc(r.nume) + ' <span class="rt-mut">×' + n + '</span></div>' +
          '<button class="rt-shop-b rt-shop-cump" data-buy="' + id + '">Cumpără <b>💰' + pretCumpara(id) + '</b></button>' +
          '<button class="rt-shop-b rt-shop-vinde" data-sell="' + id + '"' + (n > 0 ? '' : ' disabled') + '>Vinde <b>💰' + r.pret + '</b></button>' +
        '</div>';
      };
      // unelte cu valoare de vânzare (ex. felinar)
      const vandabile = RETETE.filter(r => r.valoare && Progres.nrUnealta(r.id) > 0);
      const randUnealta = r => '<div class="rt-shop-rand">' +
        '<div class="rt-shop-nume">' + r.emoji + ' ' + esc(r.nume) + ' <span class="rt-mut">×' + Progres.nrUnealta(r.id) + '</span></div>' +
        '<div></div>' +
        '<button class="rt-shop-b rt-shop-vinde" data-sellu="' + r.id + '">Vinde <b>💰' + r.valoare + '</b></button>' +
      '</div>';
      const panou = this.aratapanou(
        this.capPanou('🏪', 'Negustorul din sat', 'vinde ce-ți prisosește, cumpără ce-ți lipsește') +
        '<div class="rt-panou-corp">' +
          '<p class="rt-shop-bani" id="rtShopBani"></p>' +
          '<div id="rtShopLista"></div>' +
        '</div>', 'rt-panou-shop');
      const refresh = () => {
        panou.querySelector('#rtShopBani').innerHTML = '💰 Ai <strong>' + Progres.date.bani + '</strong> bani';
        const vand = RETETE.filter(r => r.valoare && Progres.nrUnealta(r.id) > 0);
        panou.querySelector('#rtShopLista').innerHTML =
          '<div class="rt-shop-titlu">Materiale</div>' + RES_ORDINE.map(randRes).join('') +
          (vand.length ? '<div class="rt-shop-titlu">Obiecte de vânzare</div>' + vand.map(randUnealta).join('') : '');
        panou.querySelectorAll('[data-buy]').forEach(bt => bt.onclick = () => {
          const id = bt.dataset.buy, cost = pretCumpara(id);
          if (Progres.date.bani < cost) { this.toast('💸 N-ai destui bani pentru ' + RESURSE[id].nume + '.'); return; }
          Progres.adaugaBani(-cost); Progres.adaugaResursa(id, 1); Sunet.bani();
          this.actualizeazaHud(); refresh();
        });
        panou.querySelectorAll('[data-sell]').forEach(bt => bt.onclick = () => {
          const id = bt.dataset.sell;
          if (Progres.resursa(id) <= 0) return;
          Progres.scoateResursa(id, 1); Progres.adaugaBani(RESURSE[id].pret); Sunet.bani();
          this.actualizeazaHud(); refresh();
        });
        panou.querySelectorAll('[data-sellu]').forEach(bt => bt.onclick = () => {
          const r = Craft.reteta(bt.dataset.sellu);
          if (Progres.nrUnealta(r.id) <= 0) return;
          Progres.scoateUnealta(r.id, 1); Progres.adaugaBani(r.valoare); Sunet.bani();
          this.actualizeazaHud(); refresh();
        });
      };
      refresh();
    },

    /* ── podul bonus: reparație (cu kit gata sau făurit pe loc) ── */
    reparaPodul(ins) {
      Progres.reparaPod(ins.id);
      for (const [x, y] of ins.pod) {
        Joc.sol[y * LUME_W + x] = T.PODEA; Joc.solid[y * LUME_W + x] = S.LIBER;
        for (let i = 0; i < 6; i++) Particule.adauga((x + 0.5) * TILE, (y + 0.5) * TILE, 'deblocare');
      }
      Sunet.deblocare(); Minimap.deseneaza(); Joc.dirty = true;
    },
    deschidePod(poi) {
      const ins = INSULE.find(i => i.id === poi.insId);
      if (!ins) return;
      const kit = Craft.reteta('kitpod');
      const arata = () => {
        const reparat = Progres.podReparat(ins.id);
        let corp, actiune = '';
        if (reparat) {
          corp = '<p class="rt-descriere">🌉 Podul e reparat. Treci liniștit spre <strong>' + esc(ins.nume) + '</strong> — te așteaptă o comoară.</p>';
        } else if (Progres.areUnealta('kitpod')) {
          corp = '<p class="rt-descriere">🚧 Podul spre <strong>' + esc(ins.nume) + '</strong> e stricat. Ai un 🧰 <strong>Kit de pod</strong> — perfect ca să-l repari.</p>';
          actiune = '<button class="rt-done" id="rtRepara">🔨 Repară podul <span class="rt-mut">(folosește 🧰 Kit de pod)</span></button>';
        } else {
          const stare = Craft.poate(kit);
          const cost = Object.keys(kit.cost).map(id =>
            '<span class="rt-cost' + (Progres.resursa(id) < kit.cost[id] ? ' rt-cost-lipsa' : '') + '">' + RESURSE[id].emoji + ' ' + kit.cost[id] + '</span>').join('');
          const nec = Progres.areUnealta('ciocan') ? '' : '<span class="rt-cost rt-cost-lipsa">🔨 ciocan</span>';
          corp = '<p class="rt-descriere">🚧 Podul e stricat. Îți trebuie un 🧰 <strong>Kit de pod</strong> ca să-l repari.</p>' +
            '<div class="rt-reteta-cost" style="justify-content:center;margin:10px 0">' + cost + nec + '</div>';
          if (stare.ok) actiune = '<button class="rt-done" id="rtCraftRep">🧰 Fă un Kit de pod și repară</button>';
          else actiune = '<p class="rt-mut" style="text-align:center">Îți mai trebuie: ' + esc(stare.lipsa.join(', ')) +
            '.<br>Fă-ți un 🔨 ciocan și un 🧰 kit la <strong>bancul de lucru 🛠️</strong> din sat (sau cumpără materiale de la 🏪).</p>';
        }
        const panou = this.aratapanou(
          this.capPanou(Progres.podReparat(ins.id) ? '🌉' : '🚧', 'Podul spre ' + ins.nume, 'scurtătură peste apă spre o insulă secretă') +
          '<div class="rt-panou-corp">' + corp + actiune + '</div>', 'rt-panou-pod');
        const rep = panou.querySelector('#rtRepara');
        if (rep) rep.onclick = () => {
          Progres.scoateUnealta('kitpod', 1);
          this.reparaPodul(ins); this.inchidePanou();
          this.toast('🌉 Ai reparat podul spre <strong>' + esc(ins.nume) + '</strong>! Treci și caută comoara 🎁.');
        };
        const cr = panou.querySelector('#rtCraftRep');
        if (cr) cr.onclick = () => {
          if (!Craft.faurente(kit)) return;      // consumă materialele, dă kitul
          Progres.scoateUnealta('kitpod', 1);    // …pe care îl folosim imediat
          this.reparaPodul(ins); this.actualizeazaHud(); this.inchidePanou();
          this.toast('🌉 Ai făurit un kit și ai reparat podul spre <strong>' + esc(ins.nume) + '</strong>!');
        };
      };
      arata();
    },

    /* ── comoara de pe insulă ── */
    deschideCufar(poi) {
      const ins = INSULE.find(i => i.id === poi.insId);
      if (!ins) return;
      const golit = Progres.insulaGolita(ins.id);
      if (!golit) {
        Progres.goleaInsula(ins.id);
        const loot = ins.loot || {};
        if (loot.bani) Progres.adaugaBani(loot.bani);
        for (const id in (loot.resurse || {})) Progres.adaugaResursa(id, loot.resurse[id]);
        Sunet.bani(); Sunet.fapta();
        Particule.explozie(poi.x, poi.y - 8, 'fapta', 20);
        this.actualizeazaHud();
      }
      const loot = ins.loot || {};
      const primite = Object.assign({}, loot.resurse || {});
      if (loot.bani) primite.bani = loot.bani;
      this.aratapanou(
        this.capPanou(golit ? '📭' : '🎁', ins.nume, golit ? 'comoara a fost deja luată' : 'comoară descoperită!') +
        '<div class="rt-panou-corp">' +
          (golit
            ? '<p class="rt-descriere">Cufărul de pe <strong>' + esc(ins.nume) + '</strong> e gol — ai luat deja tot.</p>'
            : '<p class="rt-descriere">🎉 Ai găsit: <strong>' + esc(textDrop(primite)) + '</strong></p>') +
          '<div class="rt-fapta-afisata">📜 <em>' + esc(ins.fapta) + '</em></div>' +
        '</div>', 'rt-panou-cufar');
    },

    /* ── inventarul: resurse, unelte, bani, cunoștințe, avatar ── */
    rezumatResurse() {
      return RES_ORDINE.map(id => RESURSE[id].emoji + ' ' + Progres.resursa(id)).join('  ·  ') +
        '  ·  💰 ' + (Progres.date.bani || 0);
    },
    deschideInventar() {
      if (this.panouDeschis()) this.inchidePanou();
      const res = RES_ORDINE.map(id =>
        '<div class="rt-inv-cell"><div class="rt-inv-emoji">' + RESURSE[id].emoji + '</div>' +
        '<div class="rt-inv-nr">' + Progres.resursa(id) + '</div>' +
        '<div class="rt-inv-nume">' + esc(RESURSE[id].nume) + '</div></div>').join('');
      const unelte = RETETE.filter(r => Progres.nrUnealta(r.id) > 0);
      const unelteHtml = unelte.length
        ? unelte.map(r => '<div class="rt-inv-cell"><div class="rt-inv-emoji">' + r.emoji + '</div>' +
            '<div class="rt-inv-nr">' + Progres.nrUnealta(r.id) + '</div>' +
            '<div class="rt-inv-nume">' + esc(r.nume) + '</div></div>').join('')
        : '<p class="rt-mut">Încă n-ai făurit nimic. Adună materiale și mergi la bancul de lucru 🛠️ din sat.</p>';
      const cun = Progres.date.fapte.length;
      const av = Multiplayer.avatar;
      // secțiunea Online: status + intră/schimbă nume + logout (doar dacă online e posibil)
      const areNume = !!Multiplayer.numeSalvat();
      const online = Multiplayer.poateOnline()
        ? '<div class="rt-inv-titlu">Online</div>' +
          '<div class="rt-inv-online">' +
            '<p class="rt-mut">' + (Multiplayer.conectat
              ? '🟢 Ești online ca <strong>' + esc(Multiplayer.nume) + '</strong>'
              : '⚪ Ești offline') + '</p>' +
            '<button class="rt-btn-sec" id="rtInvNume">🌐 ' + (Multiplayer.conectat ? 'Schimbă numele' : 'Intră online') + '</button>' +
            ((Multiplayer.conectat || areNume)
              ? '<button class="rt-btn-sec rt-danger" id="rtInvLogout">🚪 Ieși offline (logout)</button>' : '') +
          '</div>'
        : '';
      this.aratapanou(
        this.capPanou('🎒', 'Inventarul tău', 'materiale, unelte, cunoștințe, avatar și cont') +
        '<div class="rt-panou-corp">' +
          '<p class="rt-shop-bani">💰 <strong>' + (Progres.date.bani || 0) + '</strong> bani · 🧠 <strong>' + cun + '/' + Joc.totalPuncte + '</strong> cunoștințe dobândite</p>' +
          '<div class="rt-inv-titlu">Materiale</div>' +
          '<div class="rt-inv-grid">' + res + '</div>' +
          '<div class="rt-inv-titlu">Unelte & obiecte</div>' +
          '<div class="rt-inv-grid">' + unelteHtml + '</div>' +
          '<div class="rt-inv-titlu">Avatarul tău</div>' +
          '<div class="rt-inv-avatar">' +
            '<div class="rt-av-preview" style="background:hsl(' + AVATAR_CULORI[av.c] + ',60%,52%)"><span>' + (AVATAR_ACCESORII[av.h] || '') + '</span></div>' +
            '<button class="rt-btn-sec" id="rtInvAvatar">🎨 Personalizează avatarul</button>' +
          '</div>' +
          online +
        '</div>', 'rt-panou-inventar');
      const b = this.overlay.querySelector('#rtInvAvatar');
      if (b) b.onclick = () => this.deschideAvatar(() => this.deschideInventar());
      const bn = this.overlay.querySelector('#rtInvNume');
      if (bn) bn.onclick = () => this.deschideNume(() => {
        if (Multiplayer.conectat) { Multiplayer.deconecteaza(); Multiplayer.conecteaza(); }
        else { Multiplayer.intrebat = false; Multiplayer.conecteaza(); }
      });
      const bl = this.overlay.querySelector('#rtInvLogout');
      if (bl) bl.onclick = () => {
        Multiplayer.logout();
        this.toast('🚪 Ai ieșit offline. Nu te mai vede nimeni pe hartă.');
        this.deschideInventar();
      };
    },

    /* ── personalizarea avatarului (culoare + accesoriu) ── */
    deschideAvatar(dupa) {
      if (this.panouDeschis()) this.inchidePanou();
      let c = Multiplayer.avatar.c, h = Multiplayer.avatar.h;
      const culori = AVATAR_CULORI.map((hue, i) =>
        '<button class="rt-av-cul' + (i === c ? ' sel' : '') + '" data-c="' + i + '" style="background:hsl(' + hue + ',60%,52%)"></button>').join('');
      const acces = AVATAR_ACCESORII.map((e, i) =>
        '<button class="rt-av-acc' + (i === h ? ' sel' : '') + '" data-h="' + i + '">' + (e || '∅') + '</button>').join('');
      const panou = this.aratapanou(
        this.capPanou('🎨', 'Avatarul tău', 'culoare + accesoriu — te văd toți online') +
        '<div class="rt-panou-corp">' +
          '<div class="rt-av-preview-mare" id="rtAvPrev"></div>' +
          '<div class="rt-inv-titlu">Culoare</div>' +
          '<div class="rt-av-culori">' + culori + '</div>' +
          '<div class="rt-inv-titlu">Accesoriu</div>' +
          '<div class="rt-av-acces">' + acces + '</div>' +
          '<button class="rt-done" id="rtAvOk">✔ Salvează</button>' +
        '</div>', 'rt-panou-avatar');
      const prev = panou.querySelector('#rtAvPrev');
      const randPrev = () => {
        prev.style.background = 'hsl(' + AVATAR_CULORI[c] + ',60%,52%)';
        prev.innerHTML = '<span>' + (AVATAR_ACCESORII[h] || '') + '</span>';
      };
      randPrev();
      panou.querySelectorAll('.rt-av-cul').forEach(bt => bt.onclick = () => {
        c = +bt.dataset.c;
        panou.querySelectorAll('.rt-av-cul').forEach(x => x.classList.toggle('sel', x === bt));
        randPrev();
      });
      panou.querySelectorAll('.rt-av-acc').forEach(bt => bt.onclick = () => {
        h = +bt.dataset.h;
        panou.querySelectorAll('.rt-av-acc').forEach(x => x.classList.toggle('sel', x === bt));
        randPrev();
      });
      panou.querySelector('#rtAvOk').onclick = () => {
        Multiplayer.salveazaAvatar(c, h);
        this.inchidePanou();
        this.toast('🎨 Avatar salvat!');
        if (dupa) dupa();
      };
    },

    /* ── paleta de emoji/fraze (nu pune jocul pe pauză) ── */
    emoteDeschis() { return this._emotePal && this._emotePal.classList.contains('vizibil'); },
    comutaEmote() {
      if (this.panouDeschis()) return;
      if (this.emoteDeschis()) { this.inchideEmote(); return; }
      this.deschideEmote();
    },
    deschideEmote() {
      const stage = document.getElementById('rtStage');
      if (!stage) return;
      if (!this._emotePal) {
        const pal = document.createElement('div');
        pal.className = 'rt-emote-pal';
        let h = '<div class="rt-emote-grid">';
        EMOTE.forEach((em, k) => { if (!em.t) h += '<button class="rt-emote-cell" data-k="' + k + '">' + em.e + '</button>'; });
        h += '</div><div class="rt-emote-fraze">';
        EMOTE.forEach((em, k) => { if (em.t) h += '<button class="rt-emote-fraza" data-k="' + k + '">' + em.e + ' ' + esc(em.t) + '</button>'; });
        h += '</div>';
        pal.innerHTML = h;
        pal.addEventListener('click', e => {
          const bt = e.target.closest('[data-k]');
          if (!bt) return;
          Multiplayer.trimiteEmote(+bt.dataset.k);
          this.inchideEmote();
        });
        stage.appendChild(pal);
        this._emotePal = pal;
      }
      this._emotePal.classList.add('vizibil');
      // închide la click în afara paletei (și nu pe butonul 🙂)
      this._emoteAfara = (e) => {
        if (this._emotePal.contains(e.target) || e.target.id === 'rtEmoteBtn') return;
        this.inchideEmote();
      };
      setTimeout(() => document.addEventListener('pointerdown', this._emoteAfara), 0);
    },
    inchideEmote() {
      if (this._emotePal) this._emotePal.classList.remove('vizibil');
      if (this._emoteAfara) { document.removeEventListener('pointerdown', this._emoteAfara); this._emoteAfara = null; }
    },
  };

  /* ══════════════════════════ 16. STILURI (injectate) ═════════════════════ */

  function injecteazaStiluri() {
    if (document.getElementById('rt-stiluri')) return;
    const s = document.createElement('style');
    s.id = 'rt-stiluri';
    s.textContent = `
/* ——— Rețelistan: stiluri injectate de game.js (folosesc tokenurile temei) ——— */
.rt-root{margin-top:14px}
.rt-stage{position:relative;width:100%;height:clamp(420px,68vh,720px);border:1px solid var(--border);
  border-radius:14px;overflow:hidden;background:var(--bg2);box-shadow:var(--shadow);
  user-select:none;-webkit-user-select:none;touch-action:none}
.rt-stage canvas#worldCanvas{position:absolute;inset:0;display:block;outline:none}
.rt-hud{position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;
  align-items:flex-start;pointer-events:none;z-index:5;gap:8px}
.rt-hud-st,.rt-hud-dr{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.rt-chip{background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--border);
  color:var(--txt);border-radius:10px;padding:6px 12px;font-weight:700;font-size:.85rem;backdrop-filter:blur(4px)}
.rt-chip-mic{font-weight:600;font-size:.78rem;color:var(--muted)}
.rt-btn{pointer-events:auto;background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--border);
  color:var(--txt);width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:1rem;transition:.15s}
.rt-btn:hover{transform:translateY(-1px);border-color:var(--accent)}
.rt-minimap{position:absolute;right:10px;top:54px;width:176px;height:128px;border:1px solid var(--border);
  border-radius:10px;background:var(--bg);opacity:.92;z-index:4;pointer-events:none}
.rt-banner{position:absolute;top:16%;left:50%;transform:translate(-50%,-12px);display:flex;gap:12px;align-items:center;
  background:color-mix(in srgb,var(--panel) 94%,transparent);border:1px solid var(--accent);border-radius:14px;
  padding:12px 20px;opacity:0;transition:.45s cubic-bezier(.2,.9,.3,1.2);pointer-events:none;z-index:6;max-width:82%}
.rt-banner.vizibil{opacity:1;transform:translate(-50%,0)}
.rt-banner-icon{font-size:1.9rem}
.rt-banner-nume{font-weight:800;font-size:1.05rem}
.rt-banner-sub{color:var(--muted);font-size:.82rem;max-width:420px}
.rt-toasts{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;
  gap:8px;align-items:center;z-index:7;pointer-events:none;width:min(92%,560px)}
.rt-toast{background:color-mix(in srgb,var(--panel) 95%,transparent);border:1px solid var(--border);
  border-left:3px solid var(--accent);border-radius:10px;padding:9px 14px;font-size:.85rem;color:var(--txt);
  opacity:0;transform:translateY(8px);transition:.35s;max-width:100%}
.rt-toast.vizibil{opacity:1;transform:none}
.rt-overlay{position:absolute;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;
  justify-content:center;z-index:10;padding:14px;backdrop-filter:blur(2px)}
.rt-overlay.vizibil{display:flex;animation:rtFade .2s ease}
@keyframes rtFade{from{opacity:0}to{opacity:1}}
.rt-panou{background:var(--panel);border:1px solid var(--border);border-radius:16px;width:min(660px,100%);
  max-height:94%;display:flex;flex-direction:column;box-shadow:var(--shadow);animation:rtPop .25s cubic-bezier(.2,.9,.3,1.15)}
@keyframes rtPop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
.rt-panou-cap{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border)}
.rt-panou-emoji{font-size:1.7rem;line-height:1}
.rt-panou-titluri{flex:1;min-width:0}
.rt-panou-titluri h3{margin:0;font-size:1.05rem}
.rt-panou-sub{color:var(--muted);font-size:.78rem;margin-top:2px}
.rt-sursa{font-family:"JetBrains Mono",monospace;font-size:.72rem}
.rt-inchide{background:var(--bg3);border:1px solid var(--border);color:var(--muted);width:30px;height:30px;
  border-radius:8px;cursor:pointer;font-size:.85rem;flex:none}
.rt-inchide:hover{color:var(--txt);border-color:var(--accent)}
.rt-panou-corp{padding:16px;overflow-y:auto;flex:1;min-height:0}
.rt-panou-corp p{margin:.4em 0}
.rt-rezumat{font-size:1rem;line-height:1.55;background:var(--bg3);border-radius:10px;padding:12px 14px;
  border-left:3px solid var(--accent)}
.rt-rezumat p{margin:0}
.rt-more{display:block;margin:12px auto 0;background:var(--bg3);border:1px dashed var(--accent);color:var(--txt);
  padding:9px 18px;border-radius:10px;cursor:pointer;font-weight:600;font-size:.86rem;transition:.15s}
.rt-more:hover{background:color-mix(in srgb,var(--accent) 14%,var(--bg3));transform:translateY(-1px)}
.rt-strat{opacity:0;transform:translateY(6px);transition:.3s;margin-top:12px}
.rt-strat.vizibil{opacity:1;transform:none}
.rt-strat-corp{font-size:.92rem;line-height:1.6}
.rt-strat-corp code{background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:1px 5px;
  font-family:"JetBrains Mono",monospace;font-size:.82em}
.rt-strat-corp ul{margin:.4em 0;padding-left:1.3em}
.rt-diagrama{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px;overflow-x:auto}
.rt-diagrama svg{display:block;margin:0 auto;max-width:100%;height:auto}
.rt-diagrama .rt-diag-titlu{text-align:center;font-weight:700;font-size:.85rem;margin:2px 0 8px}
.rt-diagrama .rt-diag-nota{text-align:center;color:var(--muted);font-size:.75rem;margin-top:6px}
.rt-examen{background:color-mix(in srgb,var(--warn) 9%,var(--bg2));border:1px solid color-mix(in srgb,var(--warn) 45%,var(--border));
  border-radius:10px;padding:12px 14px}
.rt-examen-titlu{font-weight:800;font-size:.82rem;margin-bottom:6px;color:var(--warn)}
.rt-panou-jos{padding:12px 16px;border-top:1px solid var(--border)}
.rt-done{display:block;width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));
  border:none;color:#1a1714;font-weight:800;padding:11px 16px;border-radius:10px;cursor:pointer;
  font-size:.92rem;transition:.15s;margin-top:10px}
.rt-done:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.06)}
.rt-done:disabled{opacity:.45;cursor:not-allowed}
.rt-fapta-afisata{background:var(--bg3);border-radius:10px;padding:10px 14px;font-size:.88rem}
.rt-descriere{font-size:.95rem;line-height:1.55}
.rt-mut{color:var(--muted);font-size:.8rem}
.rt-bara{height:8px;background:var(--bg3);border-radius:99px;overflow:hidden;margin:10px 0 4px}
.rt-bara-plin{height:100%;background:linear-gradient(90deg,var(--accent),var(--good));border-radius:99px;transition:.4s}
.rt-lista-puncte{list-style:none;padding:0;margin:.6em 0;font-size:.88rem}
.rt-lista-puncte li{padding:4px 0;color:var(--muted)}
.rt-lista-puncte li.gata{color:var(--txt)}
.rt-recap-prog{display:flex;gap:6px;justify-content:center;margin-bottom:14px}
.rt-punct-pr{width:10px;height:10px;border-radius:50%;background:var(--bg3);border:1px solid var(--border)}
.rt-punct-pr.facut{background:var(--good);border-color:var(--good)}
.rt-punct-pr.acum{background:var(--accent);border-color:var(--accent);transform:scale(1.2)}
.rt-intrebare{font-size:1rem;font-weight:700;line-height:1.5;margin-bottom:12px}
.rt-variante{display:flex;flex-direction:column;gap:8px}
.rt-varianta{text-align:left;background:var(--bg3);border:1px solid var(--border);color:var(--txt);
  padding:10px 14px;border-radius:10px;cursor:pointer;font-size:.9rem;transition:.15s;line-height:1.4}
.rt-varianta:hover:not(:disabled){border-color:var(--accent);transform:translateX(2px)}
.rt-varianta.corect{border-color:var(--good);background:color-mix(in srgb,var(--good) 14%,var(--bg3));font-weight:700}
.rt-varianta.gresit{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--bg3))}
.rt-varianta:disabled{cursor:default;opacity:.9}
.rt-explicatie{display:none;margin-top:12px;background:var(--bg2);border:1px solid var(--border);
  border-radius:10px;padding:10px 14px;font-size:.86rem;line-height:1.5}
.rt-explicatie.vizibil{display:block;animation:rtFade .25s}
.rt-rezultat{text-align:center}
.rt-rezultat-scor{font-size:2.6rem;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--accent2));
  -webkit-background-clip:text;background-clip:text;color:transparent;margin:6px 0}
.rt-final{background:color-mix(in srgb,var(--accent) 10%,var(--bg2));border-radius:10px;padding:12px}
.rt-jurnal-reg{border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--bg2)}
.rt-jurnal-reg summary{cursor:pointer;padding:10px 14px;font-weight:700;font-size:.9rem;display:flex;
  justify-content:space-between;align-items:center;list-style:none}
.rt-jurnal-reg summary::-webkit-details-marker{display:none}
.rt-jurnal-meta{color:var(--muted);font-weight:600;font-size:.78rem}
.rt-jurnal-fapte{list-style:none;margin:0;padding:0 14px 10px}
.rt-jurnal-fapte li{padding:5px 0;font-size:.84rem;line-height:1.45;border-top:1px dashed var(--border)}
.rt-jurnal-fapte li.ascuns{color:var(--muted)}
.rt-jurnal-reg>p{padding:0 14px 10px}
.rt-jurnal-setari{margin-top:14px;text-align:center}
.rt-btn-sec{background:var(--bg3);border:1px solid var(--border);color:var(--muted);padding:8px 14px;
  border-radius:10px;cursor:pointer;font-size:.82rem}
.rt-btn-sec:hover{color:var(--bad);border-color:var(--bad)}
.rt-ajutor-lista{list-style:none;padding:0;margin:.6em 0}
.rt-ajutor-lista li{padding:6px 0;font-size:.88rem;border-bottom:1px dashed var(--border)}
.rt-online{width:auto;padding:0 12px;font-size:.78rem;font-weight:700}
.rt-nume-input{display:block;width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);
  color:var(--txt);border-radius:10px;padding:11px 14px;font-size:1rem;font-family:inherit;margin:6px 0 2px}
.rt-nume-input:focus{outline:none;border-color:var(--accent)}
.rt-nume-input.rau{border-color:var(--bad);animation:rtScutura .3s}
@keyframes rtScutura{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.rt-joy{position:absolute;left:18px;bottom:18px;width:104px;height:104px;border-radius:50%;z-index:8;
  background:color-mix(in srgb,var(--panel) 55%,transparent);border:1px solid var(--border);touch-action:none}
.rt-joy-cap{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
  background:color-mix(in srgb,var(--accent) 75%,var(--panel));border:2px solid var(--border);pointer-events:none}
.rt-act{position:absolute;right:20px;bottom:26px;width:64px;height:64px;border-radius:50%;z-index:8;
  background:color-mix(in srgb,var(--accent) 85%,transparent);border:2px solid var(--border);color:#1a1714;
  font-weight:900;font-size:1.3rem;touch-action:none}
.rt-tab-diag{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;justify-content:center}
.rt-chip-bani{color:var(--accent)}
.rt-btn-off{opacity:.5}
.rt-btn-sec.rt-danger{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 45%,var(--border))}
.rt-btn-sec.rt-danger:hover{background:color-mix(in srgb,var(--bad) 14%,var(--bg3))}
.rt-recompensa{text-align:center;color:var(--accent);font-weight:600;margin:.4em 0}
/* butonul + paleta de emoji/fraze */
.rt-emote-btn{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:9;width:46px;height:46px;
  border-radius:50%;background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--border);
  color:var(--txt);font-size:1.35rem;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;
  box-shadow:0 3px 10px rgba(0,0,0,.28)}
.rt-emote-btn:hover{border-color:var(--accent);transform:translateX(-50%) translateY(-2px)}
.rt-emote-pal{position:absolute;left:50%;bottom:70px;transform:translateX(-50%) translateY(8px);z-index:9;
  width:min(320px,90%);background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:10px;
  box-shadow:0 8px 26px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .16s,transform .16s}
.rt-emote-pal.vizibil{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.rt-emote-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}
.rt-emote-cell{aspect-ratio:1;border:1px solid var(--border);background:var(--bg3);border-radius:10px;font-size:1.4rem;
  cursor:pointer;line-height:1}
.rt-emote-cell:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,var(--bg3))}
.rt-emote-fraze{display:flex;flex-wrap:wrap;gap:6px}
.rt-emote-fraza{border:1px solid var(--border);background:var(--bg3);color:var(--txt);border-radius:20px;
  padding:6px 11px;font-size:.82rem;font-family:inherit;cursor:pointer}
.rt-emote-fraza:hover{border-color:var(--accent);color:var(--accent)}
/* rețete de crafting */
.rt-inv-rezumat{text-align:center;font-size:.82rem;margin:0 0 10px}
.rt-reteta{display:flex;align-items:center;gap:12px;padding:11px;border:1px solid var(--border);border-radius:12px;
  margin-bottom:9px;background:var(--bg3)}
.rt-reteta-emoji{font-size:1.8rem;line-height:1;flex:0 0 auto}
.rt-reteta-info{flex:1;min-width:0}
.rt-reteta-nume{font-weight:700;font-size:.94rem}
.rt-reteta-desc{color:var(--muted);font-size:.8rem;line-height:1.35;margin:2px 0 5px}
.rt-reteta-cost{display:flex;flex-wrap:wrap;gap:5px}
.rt-cost{font-size:.78rem;background:var(--panel);border:1px solid var(--border);border-radius:7px;padding:2px 7px}
.rt-cost-lipsa{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,var(--border))}
.rt-craft-btn{flex:0 0 auto;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:#1a1714;
  font-weight:800;padding:9px 15px;border-radius:10px;cursor:pointer}
.rt-craft-btn:hover:not(:disabled){filter:brightness(1.07)}
.rt-craft-btn:disabled{opacity:.4;cursor:not-allowed;background:var(--bg3);color:var(--muted)}
/* negustor */
.rt-shop-bani{text-align:center;font-size:.95rem;margin:0 0 10px}
.rt-shop-titlu{font-weight:700;color:var(--muted);font-size:.76rem;text-transform:uppercase;letter-spacing:.04em;
  margin:12px 0 6px}
.rt-shop-rand{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center;padding:6px 0;
  border-top:1px dashed var(--border)}
.rt-shop-nume{font-size:.9rem}
.rt-shop-b{border:1px solid var(--border);background:var(--bg3);color:var(--txt);border-radius:9px;padding:6px 10px;
  font-size:.78rem;font-family:inherit;cursor:pointer;white-space:nowrap}
.rt-shop-b b{color:var(--accent)}
.rt-shop-cump:hover{border-color:var(--good)}
.rt-shop-vinde:hover:not(:disabled){border-color:var(--accent)}
.rt-shop-b:disabled{opacity:.4;cursor:not-allowed}
/* inventar */
.rt-inv-titlu{font-weight:700;color:var(--muted);font-size:.76rem;text-transform:uppercase;letter-spacing:.04em;
  margin:14px 0 7px}
.rt-inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px}
.rt-inv-cell{background:var(--bg3);border:1px solid var(--border);border-radius:11px;padding:9px 4px;text-align:center}
.rt-inv-emoji{font-size:1.6rem;line-height:1}
.rt-inv-nr{font-weight:800;font-size:1.05rem;margin-top:2px}
.rt-inv-nume{color:var(--muted);font-size:.72rem}
.rt-inv-avatar{display:flex;align-items:center;gap:14px;margin-top:6px}
.rt-inv-online{display:flex;flex-direction:column;gap:8px}
.rt-inv-online p{margin:0 0 2px}
.rt-inv-online .rt-btn-sec{width:100%;text-align:center}
.rt-av-preview{width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  font-size:1.5rem;border:2px solid rgba(0,0,0,.3);flex:0 0 auto}
/* avatar */
.rt-av-preview-mare{width:84px;height:84px;border-radius:16px;margin:0 auto 10px;display:flex;align-items:center;
  justify-content:center;font-size:2.4rem;border:2px solid rgba(0,0,0,.3)}
.rt-av-culori{display:flex;flex-wrap:wrap;gap:9px;justify-content:center}
.rt-av-cul{width:36px;height:36px;border-radius:50%;border:3px solid transparent;cursor:pointer}
.rt-av-cul.sel{border-color:var(--txt);box-shadow:0 0 0 2px var(--panel) inset}
.rt-av-acces{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.rt-av-acc{width:42px;height:42px;border-radius:10px;border:1px solid var(--border);background:var(--bg3);
  font-size:1.35rem;cursor:pointer;color:var(--muted)}
.rt-av-acc.sel{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,var(--bg3))}
@media (max-width:640px){
  .rt-minimap{width:120px;height:88px;top:50px}
  .rt-stage{height:clamp(380px,72vh,640px)}
  .rt-chip{font-size:.76rem;padding:5px 9px}
  .rt-emote-btn{bottom:84px}
  .rt-emote-pal{bottom:138px;width:min(300px,84%)}
}
`;
    document.head.appendChild(s);
  }

  /* ══════════════════════ 17. DIAGRAME (SVG, temabile) ════════════════════
     Diagramele importante de examen: antete pe câmpuri cu dimensiuni pe biți,
     handshake-uri, stiva OSI, forme de undă, scheme de adresare. Culorile vin
     din variabilele CSS ale temei (style="fill:var(--accent)" etc.), deci se
     schimbă automat la dark/light. theory.js referă diagramele prin cheie.  */

  const Diagrame = (function () {
    const CULORI = ['--accent', '--good', '--blue', '--purple', '--aqua', '--accent2', '--warn'];
    let idUnic = 0;

    const FONT = 'Inter,sans-serif';
    const MONO = '"JetBrains Mono",monospace';
    const txt = (x, y, s, marime, optiuni) => {
      const o = optiuni || {};
      return '<text x="' + x + '" y="' + y + '" font-family="' + (o.mono ? MONO : FONT) + '" font-size="' + marime +
        '" text-anchor="' + (o.ancora || 'middle') + '"' + (o.bold ? ' font-weight="700"' : '') +
        ' style="fill:var(' + (o.cul || '--txt') + ')">' + esc(s) + '</text>';
    };

    /* ── antet pe biți: rânduri de câte 32 de biți ── */
    function bitcamp(d) {
      const W = 660, mX = 26, sc = (W - mX * 2) / 32, rH = 46;
      let subNote = [];
      let h = 30 + d.randuri.length * rH + 6;
      let s = '';
      // rigla de biți
      for (let b = 0; b <= 32; b += 4)
        s += txt(mX + b * sc, 14, b === 32 ? '31' : b, 9, { cul: '--muted', mono: true });
      s += '<line x1="' + mX + '" y1="18" x2="' + (W - mX) + '" y2="18" style="stroke:var(--border)"/>';
      d.randuri.forEach((rand, ri) => {
        let bit = 0;
        const y = 26 + ri * rH;
        rand.forEach((c, ci) => {
          const x = mX + bit * sc, w = c.b * sc;
          const cul = c.cul || CULORI[(ri + ci) % CULORI.length];
          s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="36" rx="4" style="fill:var(' + cul +
            ');fill-opacity:.2;stroke:var(' + cul + ')"' + (c.punctat ? ' stroke-dasharray="5 4"' : '') + '/>';
          const nume = c.n, mic = w < 84;
          s += txt(x + w / 2, y + (mic ? 16 : 17), nume, mic ? 8.5 : 10.5, { bold: true });
          s += txt(x + w / 2, y + 30, c.b + (c.b === 1 ? ' bit' : ' biți'), 8, { cul: '--muted', mono: true });
          if (c.sub) subNote.push(txt(x + w / 2, y + 44, c.sub, 8, { cul: '--muted', mono: true }));
          bit += c.b;
        });
      });
      return svgWrap(W, h, s + subNote.join(''));
    }

    /* ── cadru pe octeți (Ethernet & co.) ── */
    function bytecamp(d) {
      let W = 24;
      d.campuri.forEach(c => W += c.w + 4);
      const H = 84;
      let s = '', x = 12;
      d.campuri.forEach((c, i) => {
        const cul = c.cul || CULORI[i % CULORI.length];
        s += '<rect x="' + x + '" y="22" width="' + c.w + '" height="38" rx="5" style="fill:var(' + cul +
          ');fill-opacity:.2;stroke:var(' + cul + ')"' + (c.punctat ? ' stroke-dasharray="5 4"' : '') + '/>';
        s += txt(x + c.w / 2, 44, c.n, c.w < 64 ? 9 : 10.5, { bold: true });
        if (c.oct) s += txt(x + c.w / 2, 74, c.oct + ' oct.', 9, { cul: '--muted', mono: true });
        if (c.bit) s += txt(x + c.w / 2, 74, c.bit, 9, { cul: '--muted', mono: true });
        x += c.w + 4;
      });
      return svgWrap(Math.max(W, 320), H, s);
    }

    /* ── diagramă de secvență (handshake-uri, DNS, DHCP, socket-uri) ── */
    function secventa(d) {
      const W = 660, n = d.actori.length;
      const ax = d.actori.map((_, i) => 100 + i * (W - 200) / Math.max(1, n - 1));
      const y0 = 62;
      let y = y0;
      const inaltimi = d.pasi.map(p => p.nota ? 34 : p.self != null ? 46 : 52);
      const H = y0 + inaltimi.reduce((a, b) => a + b, 0) + 16;
      const mk = 'sag' + (++idUnic);
      let s = '<defs><marker id="' + mk + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker></defs>';
      // actorii + liniile de viață
      d.actori.forEach((a, i) => {
        s += '<rect x="' + (ax[i] - 74) + '" y="8" width="148" height="30" rx="8" style="fill:var(--bg3);stroke:var(--border)"/>';
        s += txt(ax[i], 28, a, 11.5, { bold: true });
        s += '<line x1="' + ax[i] + '" y1="40" x2="' + ax[i] + '" y2="' + (H - 8) + '" style="stroke:var(--border)" stroke-dasharray="4 4"/>';
      });
      d.pasi.forEach((p, i) => {
        const hh = inaltimi[i];
        if (p.nota) { // notă centrată, pe toată lățimea
          s += '<rect x="60" y="' + (y + 4) + '" width="' + (W - 120) + '" height="24" rx="7" style="fill:var(--warn);fill-opacity:.1;stroke:var(--warn);stroke-opacity:.4"/>';
          s += txt(W / 2, y + 20, p.nota, 10, { cul: '--muted' });
        } else if (p.self != null) { // acțiune locală pe o linie de viață
          const x = ax[p.self];
          s += '<rect x="' + (x - 120) + '" y="' + (y + 6) + '" width="240" height="30" rx="8" style="fill:var(--bg3);stroke:var(--accent);stroke-opacity:.6"/>';
          s += txt(x, y + 25, p.t, 10.5, { mono: true });
        } else {
          const x1 = ax[p.de], x2 = ax[p.la];
          const ymid = y + 22;
          s += '<line x1="' + x1 + '" y1="' + ymid + '" x2="' + x2 + '" y2="' + ymid +
            '" style="stroke:var(--accent)" stroke-width="1.8" marker-end="url(#' + mk + ')"' +
            (p.punctat ? ' stroke-dasharray="6 4"' : '') + '/>';
          s += txt((x1 + x2) / 2, ymid - 7, p.t, 11.5, { bold: true });
          if (p.sub) s += txt((x1 + x2) / 2, ymid + 15, p.sub, 9.5, { cul: '--muted', mono: true });
        }
        y += hh;
      });
      return svgWrap(W, H, s);
    }

    /* ── stive de niveluri (OSI, OSI vs TCP/IP) ── */
    function stiva(d) {
      const W = 660, rH = 42, gap = 6;
      const H = 40 + Math.max(...d.coloane.map(c => c.boxes.reduce((a, b) => a + (b.span || 1), 0))) * (rH + gap);
      let s = '';
      const colW = 218;
      const cx = d.coloane.length === 1 ? [120] : [80, 372];
      d.coloane.forEach((col, ci) => {
        const x = cx[ci];
        s += txt(x + colW / 2, 22, col.titlu, 12, { bold: true, cul: '--accent' });
        let y = 34;
        col.boxes.forEach((b, bi) => {
          const span = b.span || 1;
          const bh = span * rH + (span - 1) * gap;
          const cul = b.cul || CULORI[bi % CULORI.length];
          s += '<rect x="' + x + '" y="' + y + '" width="' + colW + '" height="' + bh + '" rx="8" style="fill:var(' + cul + ');fill-opacity:.18;stroke:var(' + cul + ')"/>';
          s += txt(x + colW / 2, y + bh / 2 + (b.sub ? -2 : 4), b.t, 12, { bold: true });
          if (b.sub) s += txt(x + colW / 2, y + bh / 2 + 14, b.sub, 9, { cul: '--muted' });
          if (b.nr) s += txt(x - 14, y + bh / 2 + 4, b.nr, 11, { cul: '--muted', mono: true });
          if (b.pdu) s += txt(x + colW + 46, y + bh / 2 + 4, b.pdu, 10, { cul: '--muted', mono: true });
          y += bh + gap;
        });
      });
      if (d.coloane.length === 2) { // linii de corespondență între coloane
        s += '<line x1="' + (cx[0] + colW + 6) + '" y1="34" x2="' + (cx[1] - 6) + '" y2="34" style="stroke:var(--border)" stroke-dasharray="3 4"/>';
      }
      return svgWrap(W, H, s);
    }

    /* ── încapsularea: straturi care „împachetează" datele ── */
    function nest(d) {
      const W = 660, rH = 40, gap = 14;
      const H = 16 + d.randuri.length * (rH + gap);
      let s = '';
      d.randuri.forEach((rand, ri) => {
        const y = 8 + ri * (rH + gap);
        let totW = 0; rand.seg.forEach(sg => totW += sg.w);
        let x = (W - 110 - totW) / 2;
        rand.seg.forEach(sg => {
          s += '<rect x="' + x + '" y="' + y + '" width="' + sg.w + '" height="' + rH + '" rx="6" style="fill:var(' + sg.c + ');fill-opacity:.22;stroke:var(' + sg.c + ')"/>';
          s += txt(x + sg.w / 2, y + rH / 2 + 4, sg.t, sg.w < 76 ? 8.5 : 10.5, { bold: true });
          x += sg.w;
        });
        s += txt(W - 52, y + rH / 2 + 4, rand.lab, 11, { cul: '--accent', bold: true });
        if (ri < d.randuri.length - 1)
          s += txt(60, y + rH + 11, '▼', 9, { cul: '--muted' });
      });
      return svgWrap(W, H, s);
    }

    /* ── forme de undă: codări de linie și modulații ── */
    function unda(d) {
      const W = 660, x0 = 96, bw = (W - x0 - 20) / d.biti.length, rH = 74;
      const H = 34 + d.serii.length * rH;
      let s = '';
      // biții, sus
      d.biti.forEach((b, i) => s += txt(x0 + i * bw + bw / 2, 18, b, 12, { mono: true, bold: true, cul: '--accent' }));
      // grila verticală
      for (let i = 0; i <= d.biti.length; i++)
        s += '<line x1="' + (x0 + i * bw) + '" y1="24" x2="' + (x0 + i * bw) + '" y2="' + (H - 6) + '" style="stroke:var(--border);stroke-opacity:.6" stroke-dasharray="3 4"/>';

      d.serii.forEach((serie, si) => {
        const yc = 34 + si * rH + rH / 2, A = 22;
        s += txt(10, yc + 4, serie.nume, 10.5, { ancora: 'start', bold: true });
        let path = '';
        if (serie.tip === 'nrz' || serie.tip === 'manchester') {
          const pts = [];
          d.biti.forEach((b, i) => {
            const x = x0 + i * bw, sus = yc - A, jos = yc + A;
            if (serie.tip === 'nrz') { // 1 = nivel sus, 0 = nivel jos
              const y = b === '1' ? sus : jos;
              pts.push([x, y], [x + bw, y]);
            } else { // Manchester (IEEE 802.3): 0 = sus→jos, 1 = jos→sus, tranziție la mijloc
              const [a, bb] = b === '1' ? [jos, sus] : [sus, jos];
              pts.push([x, a], [x + bw / 2, a], [x + bw / 2, bb], [x + bw, bb]);
            }
          });
          path = 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
        } else { // modulații pe purtătoare sinusoidală
          const seg = [];
          d.biti.forEach((b, i) => {
            const unu = b === '1';
            for (let px = 0; px <= bw; px += 2) {
              const x = x0 + i * bw + px, f = px / bw;
              let y;
              if (serie.tip === 'ask') y = yc - Math.sin(f * Math.PI * 4) * (unu ? A : A * 0.25);
              else if (serie.tip === 'fsk') y = yc - Math.sin(f * Math.PI * (unu ? 8 : 3)) * A * 0.85;
              else y = yc - Math.sin(f * Math.PI * 4 + (unu ? 0 : Math.PI)) * A * 0.85; // psk
              seg.push((seg.length ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1));
            }
          });
          path = seg.join(' ');
        }
        s += '<path d="' + path + '" fill="none" style="stroke:var(--' + (['good', 'blue', 'purple'][si % 3]) + ')" stroke-width="2.2"/>';
        s += '<line x1="' + x0 + '" y1="' + yc + '" x2="' + (W - 20) + '" y2="' + yc + '" style="stroke:var(--border);stroke-opacity:.5"/>';
      });
      return svgWrap(W, H, s);
    }

    /* ── flowchart (CSMA/CD, CSMA/CA) — noduri poziționate manual ── */
    function flux(d) {
      const mk = 'sagf' + (++idUnic);
      let s = '<defs><marker id="' + mk + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker></defs>';
      // muchiile (sub noduri)
      d.muchii.forEach(m => {
        const pts = m.puncte;
        let path = 'M' + pts.map(p => p.join(',')).join(' L');
        s += '<path d="' + path + '" fill="none" style="stroke:var(--muted)" stroke-width="1.6" marker-end="url(#' + mk + ')"/>';
        if (m.lab) {
          const cul = m.lab === 'DA' ? '--good' : m.lab === 'NU' ? '--bad' : '--muted';
          s += '<rect x="' + (m.lx - 15) + '" y="' + (m.ly - 10) + '" width="30" height="16" rx="8" style="fill:var(--panel);stroke:var(' + cul + ')"/>';
          s += txt(m.lx, m.ly + 2, m.lab, 9, { bold: true, cul });
        }
      });
      // nodurile
      d.noduri.forEach(n => {
        const cul = n.tip === 'ok' ? '--good' : n.tip === 'dec' ? '--warn' : n.tip === 'start' ? '--accent' : '--border';
        if (n.tip === 'dec') { // romb
          const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
          s += '<polygon points="' + cx + ',' + n.y + ' ' + (n.x + n.w) + ',' + cy + ' ' + cx + ',' + (n.y + n.h) + ' ' + n.x + ',' + cy +
            '" style="fill:var(--warn);fill-opacity:.14;stroke:var(--warn)"/>';
        } else {
          s += '<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="9" style="fill:var(' + cul +
            ');fill-opacity:' + (n.tip ? '.16' : '.08') + ';stroke:var(' + cul + ')"/>';
        }
        const linii = n.t.split('\n');
        linii.forEach((l, li) => {
          s += txt(n.x + n.w / 2, n.y + n.h / 2 + 4 + (li - (linii.length - 1) / 2) * 13, l, 10, { bold: n.tip === 'dec' || n.tip === 'start' });
        });
      });
      return svgWrap(d.W || 660, d.H, s);
    }

    /* ── topologie mică (hidden node, switch learning) ── */
    function topo(d) {
      let s = '';
      (d.cercuri || []).forEach(c => {
        s += '<circle cx="' + c.x + '" cy="' + c.y + '" r="' + c.r + '" style="fill:var(' + c.c + ');fill-opacity:.08;stroke:var(' + c.c + ');stroke-opacity:.5" stroke-dasharray="6 5"/>';
      });
      (d.muchii || []).forEach(m => {
        const a = d.noduri[m.a], b = d.noduri[m.b];
        s += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" style="stroke:var(--muted)" stroke-width="1.6"/>';
        if (m.lab) s += txt((a.x + b.x) / 2 + (m.dx || 0), (a.y + b.y) / 2 - 6 + (m.dy || 0), m.lab, 9.5, { cul: '--muted', mono: true });
      });
      d.noduri.forEach(n => {
        s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="24" style="fill:var(--bg3);stroke:var(' + (n.c || '--border') + ')" stroke-width="1.8"/>';
        s += '<text x="' + n.x + '" y="' + (n.y + 7) + '" font-size="20" text-anchor="middle">' + n.emoji + '</text>';
        s += txt(n.x, n.y + 42, n.t, 10.5, { bold: true });
        if (n.sub) s += txt(n.x, n.y + 56, n.sub, 9, { cul: '--muted', mono: true });
      });
      return svgWrap(d.W || 660, d.H || 240, s);
    }

    /* ── tabel HTML (rutare, clase de adrese, subnetizare, fragmentare) ── */
    function tabel(d) {
      const div = document.createElement('div');
      div.className = 'rt-tabel-wrap';
      let h = '<table class="rt-tabel"><thead><tr>' +
        d.coloane.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
      d.randuri.forEach(r => {
        const ev = r._ev;
        h += '<tr' + (ev ? ' class="ev"' : '') + '>' +
          r.filter((_, i) => typeof r[i] !== 'object' || i < d.coloane.length).slice(0, d.coloane.length)
            .map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>';
      });
      h += '</tbody></table>';
      div.innerHTML = h;
      return div;
    }

    function svgWrap(w, h, inauntru) {
      const div = document.createElement('div');
      div.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img">' + inauntru + '</svg>';
      return div;
    }

    /* ═══ datele diagramelor — exact lucrurile care se cer la examen ═══ */
    const DATE = {
      /* — Munții IP — */
      'ipv4-header': { titlu: 'Antetul IPv4 — câmp cu câmp (fiecare rând = 32 de biți)', tip: 'biti',
        nota: 'Antet standard: 20 de octeți (IHL = 5 cuvinte de 32b). Câmpurile de fragmentare: Identification + Flags (DF/MF) + Fragment Offset.',
        randuri: [
          [{ n: 'Versiune', b: 4 }, { n: 'IHL', b: 4 }, { n: 'ToS / DSCP', b: 8 }, { n: 'Lungime totală', b: 16 }],
          [{ n: 'Identification', b: 16 }, { n: 'Flags', b: 3, sub: 'R · DF · MF' }, { n: 'Fragment Offset', b: 13 }],
          [{ n: 'TTL', b: 8 }, { n: 'Protocol', b: 8 }, { n: 'Header Checksum', b: 16 }],
          [{ n: 'Adresa IP sursă', b: 32, cul: '--accent' }],
          [{ n: 'Adresa IP destinație', b: 32, cul: '--accent2' }],
          [{ n: 'Opțiuni (0–40 octeți, opțional) + padding', b: 32, punctat: true, cul: '--warn' }],
        ] },
      'tcp-header': { titlu: 'Antetul TCP', tip: 'biti',
        nota: 'Antet de bază: 20 de octeți (Offset = 5). Flagurile de conexiune: SYN, ACK, FIN, RST + PSH, URG.',
        randuri: [
          [{ n: 'Port sursă', b: 16 }, { n: 'Port destinație', b: 16 }],
          [{ n: 'Număr de secvență (Sequence Number)', b: 32, cul: '--good' }],
          [{ n: 'Număr de confirmare (Acknowledgment Number)', b: 32, cul: '--blue' }],
          [{ n: 'Offset', b: 4 }, { n: 'Rezervat', b: 6 }, { n: 'Flaguri', b: 6, sub: 'URG·ACK·PSH·RST·SYN·FIN' }, { n: 'Window', b: 16 }],
          [{ n: 'Checksum', b: 16 }, { n: 'Urgent Pointer', b: 16 }],
          [{ n: 'Opțiuni (variabil, ex. MSS)', b: 32, punctat: true, cul: '--warn' }],
        ] },
      'udp-header': { titlu: 'Antetul UDP — doar 8 octeți', tip: 'biti',
        nota: 'Fără conexiune, fără confirmări, fără control de flux — doar porturi + lungime + checksum.',
        randuri: [
          [{ n: 'Port sursă', b: 16 }, { n: 'Port destinație', b: 16 }],
          [{ n: 'Lungime', b: 16, cul: '--aqua' }, { n: 'Checksum', b: 16, cul: '--purple' }],
        ] },
      'ethernet-frame': { titlu: 'Cadrul Ethernet', tip: 'octeti',
        nota: 'Cadrul (fără preambul + SFD): minim 64, maxim 1518 octeți. Sub 64 → „runt"; minimul garantează detectarea coliziunilor în CSMA/CD.',
        campuri: [
          { n: 'Preambul', oct: '7', w: 76 }, { n: 'SFD', oct: '1', w: 42 },
          { n: 'MAC destinație', oct: '6', w: 104 }, { n: 'MAC sursă', oct: '6', w: 96 },
          { n: 'EtherType', oct: '2', w: 70 }, { n: 'Date (payload)', oct: '46–1500', w: 140, punctat: true },
          { n: 'FCS (CRC)', oct: '4', w: 66 },
        ] },
      'vlan-tag': { titlu: 'Tagul VLAN 802.1Q — 4 octeți inserați după MAC sursă', tip: 'octeti',
        nota: 'TPID = 0x8100 anunță prezența tagului; VID (12 biți) identifică VLAN-ul cadrului.',
        campuri: [
          { n: 'MAC dest', oct: '6', w: 76 }, { n: 'MAC sursă', oct: '6', w: 76 },
          { n: 'TPID 0x8100', oct: '2', w: 84, cul: '--accent' }, { n: 'PCP', bit: '3 biți', w: 46, cul: '--accent' },
          { n: 'DEI', bit: '1 bit', w: 42, cul: '--accent' }, { n: 'VID', bit: '12 biți', w: 60, cul: '--accent' },
          { n: 'EtherType', oct: '2', w: 70 }, { n: 'Date…', oct: '', w: 56, punctat: true },
        ] },

      /* — Orașul LAN — */
      'arp-flow': { titlu: 'ARP — de la IP la MAC', tip: 'secv',
        actori: ['Stația A', 'Stația B'],
        pasi: [
          { de: 0, la: 1, t: 'ARP Request — broadcast', sub: 'la FF:FF:FF:FF:FF:FF — „cine are IP-ul lui B?"', punctat: true },
          { de: 1, la: 0, t: 'ARP Reply — unicast', sub: '„eu — MAC-ul meu e …" (direct către A)' },
          { nota: 'A salvează perechea IP ↔ MAC în cache-ul ARP; cererile următoare nu mai ies pe fir' },
        ] },
      'csma-cd': { titlu: 'CSMA/CD — accesul la mediu în Ethernetul clasic', tip: 'flux', H: 434,
        nota: 'După a n-a coliziune: K ales aleator din [0, 2ⁿ−1], așteaptă K·slot_time (n plafonat la 10, abandon după 16 încercări).',
        noduri: [
          { x: 210, y: 8,   w: 240, h: 34, t: 'Cadru de transmis', tip: 'start' },
          { x: 210, y: 66,  w: 240, h: 34, t: 'Ascultă mediul (carrier sense)' },
          { x: 230, y: 124, w: 200, h: 48, t: 'Mediul e liber?', tip: 'dec' },
          { x: 480, y: 128, w: 158, h: 40, t: 'Așteaptă să se\nelibereze' },
          { x: 190, y: 196, w: 280, h: 34, t: 'Transmite și continuă să asculte' },
          { x: 230, y: 254, w: 200, h: 48, t: 'Coliziune detectată?', tip: 'dec' },
          { x: 30,  y: 322, w: 180, h: 38, t: '✅ Transmisie reușită', tip: 'ok' },
          { x: 330, y: 322, w: 240, h: 34, t: 'Trimite JAM (32 de biți)' },
          { x: 300, y: 382, w: 300, h: 40, t: 'Backoff exponențial binar:\nașteaptă K · slot_time' },
        ],
        muchii: [
          { puncte: [[330, 42], [330, 64]] },
          { puncte: [[330, 100], [330, 122]] },
          { puncte: [[430, 148], [478, 148]], lab: 'NU', lx: 452, ly: 138 },
          { puncte: [[559, 128], [559, 83], [452, 83]] },
          { puncte: [[330, 172], [330, 194]], lab: 'DA', lx: 348, ly: 184 },
          { puncte: [[330, 230], [330, 252]] },
          { puncte: [[230, 278], [120, 278], [120, 320]], lab: 'NU', lx: 176, ly: 268 },
          { puncte: [[430, 278], [450, 278], [450, 320]], lab: 'DA', lx: 452, ly: 268 },
          { puncte: [[450, 356], [450, 380]] },
          { puncte: [[298, 402], [16, 402], [16, 83], [208, 83]] },
        ] },
      'switch-learning': { titlu: 'Cum învață switch-ul adresele MAC', tip: 'compus',
        blocuri: [
          { tip: 'topo', H: 232,
            noduri: [
              { x: 330, y: 90,  emoji: '🔀', t: 'Switch', c: '--accent' },
              { x: 90,  y: 90,  emoji: '💻', t: 'A', sub: 'MAC …:0A' },
              { x: 330, y: 168, emoji: '💻', t: 'B', sub: 'MAC …:0B' },
              { x: 570, y: 90,  emoji: '💻', t: 'C', sub: 'MAC …:0C' },
            ],
            muchii: [
              { a: 0, b: 1, lab: 'port 1', dy: -4 }, { a: 0, b: 2, lab: 'port 2', dx: 44, dy: 8 }, { a: 0, b: 3, lab: 'port 3', dy: -4 },
            ] },
          { tip: 'tabel', coloane: ['Adresă MAC', 'Port', 'Cum a aflat-o'],
            randuri: [
              ['…:0A', '1', 'a văzut-o ca MAC sursă pe portul 1'],
              ['…:0B', '2', 'a văzut-o ca MAC sursă pe portul 2'],
              ['…:0C', '3', 'a văzut-o ca MAC sursă pe portul 3'],
            ] },
        ],
        nota: 'Destinație necunoscută sau broadcast → flooding: cadrul iese pe toate porturile, mai puțin cel pe care a intrat.' },

      /* — Satul Intro — */
      'osi-stack': { titlu: 'Stiva OSI — 7 niveluri și PDU-urile lor', tip: 'stiva',
        coloane: [{ titlu: 'Modelul OSI', boxes: [
          { t: 'Aplicație',        nr: '7', pdu: 'date' },
          { t: 'Prezentare',       nr: '6', pdu: 'date' },
          { t: 'Sesiune',          nr: '5', pdu: 'date' },
          { t: 'Transport',        nr: '4', pdu: 'segment' },
          { t: 'Rețea',            nr: '3', pdu: 'pachet' },
          { t: 'Legătură de date', nr: '2', pdu: 'cadru' },
          { t: 'Fizic',            nr: '1', pdu: 'biți' },
        ] }] },
      'osi-vs-tcpip': { titlu: 'OSI vs TCP/IP — cum se mapează nivelurile', tip: 'stiva',
        coloane: [
          { titlu: 'OSI (7 niveluri)', boxes: [
            { t: 'Aplicație', nr: '7' }, { t: 'Prezentare', nr: '6' }, { t: 'Sesiune', nr: '5' },
            { t: 'Transport', nr: '4' }, { t: 'Rețea', nr: '3' }, { t: 'Legătură de date', nr: '2' }, { t: 'Fizic', nr: '1' },
          ] },
          { titlu: 'TCP/IP (4 niveluri)', boxes: [
            { t: 'Aplicație', span: 3, cul: '--accent', sub: 'HTTP, DNS, SMTP…' },
            { t: 'Transport', span: 1, cul: '--good', sub: 'TCP, UDP' },
            { t: 'Internet', span: 1, cul: '--blue', sub: 'IP, ICMP' },
            { t: 'Acces la rețea', span: 2, cul: '--purple', sub: 'Ethernet, Wi-Fi' },
          ] },
        ] },
      'incapsulare': { titlu: 'Încapsularea — fiecare nivel adaugă antetul lui', tip: 'nest',
        nota: 'La recepție se întâmplă exact invers: decapsulare, nivel cu nivel.',
        randuri: [
          { lab: 'Date',    seg: [{ t: 'Date (aplicație)', c: '--accent', w: 220 }] },
          { lab: 'Segment', seg: [{ t: 'Antet TCP', c: '--good', w: 92 }, { t: 'Date', c: '--accent', w: 220 }] },
          { lab: 'Pachet',  seg: [{ t: 'Antet IP', c: '--blue', w: 88 }, { t: 'Antet TCP', c: '--good', w: 92 }, { t: 'Date', c: '--accent', w: 220 }] },
          { lab: 'Cadru',   seg: [{ t: 'Antet Eth.', c: '--purple', w: 90 }, { t: 'Antet IP', c: '--blue', w: 88 }, { t: 'Antet TCP', c: '--good', w: 92 }, { t: 'Date', c: '--accent', w: 160 }, { t: 'FCS', c: '--purple', w: 52 }] },
          { lab: 'Biți',    seg: [{ t: '0101110101001101…', c: '--warn', w: 482 }] },
        ] },

      /* — Portul Transport — */
      'tcp-handshake': { titlu: 'Stabilirea conexiunii TCP — handshake în 3 pași', tip: 'secv',
        actori: ['Client', 'Server'],
        pasi: [
          { de: 0, la: 1, t: '1 · SYN', sub: 'seq = x  („vreau conexiune, pornesc de la x")' },
          { de: 1, la: 0, t: '2 · SYN + ACK', sub: 'seq = y, ack = x+1  („ok, eu pornesc de la y")' },
          { de: 0, la: 1, t: '3 · ACK', sub: 'ack = y+1  („confirmat!")' },
          { nota: 'Conexiune stabilită — ambele părți și-au sincronizat numerele de secvență' },
        ] },
      'tcp-inchidere': { titlu: 'Închiderea conexiunii TCP — 4 pași', tip: 'secv',
        actori: ['A (cine închide)', 'B'],
        pasi: [
          { de: 0, la: 1, t: '1 · FIN', sub: '„eu am terminat de trimis"' },
          { de: 1, la: 0, t: '2 · ACK', sub: 'B confirmă' },
          { nota: 'half-close: B mai poate trimite date; A încă primește' },
          { de: 1, la: 0, t: '3 · FIN', sub: '„am terminat și eu"' },
          { de: 0, la: 1, t: '4 · ACK', sub: 'A confirmă — conexiunea e închisă' },
        ] },

      /* — Biblioteca Aplicații — */
      'dns-rezolvare': { titlu: 'Rezolvarea unui nume DNS', tip: 'secv',
        nota: 'Client ↔ resolver: interogare recursivă. Resolver ↔ serverele DNS: interogări iterative. DNS folosește portul 53.',
        actori: ['Client', 'Resolver local', 'Serverele DNS'],
        pasi: [
          { de: 0, la: 1, t: 'Interogare recursivă', sub: '„ce IP are www.exemplu.ro?"' },
          { de: 1, la: 2, t: '→ serverul rădăcină', sub: 'răspuns: „întreabă TLD-ul .ro"', punctat: true },
          { de: 1, la: 2, t: '→ serverul TLD .ro', sub: 'răspuns: „întreabă serverul autoritativ"', punctat: true },
          { de: 1, la: 2, t: '→ serverul autoritativ', sub: 'răspuns: înregistrarea A (adresa IP)', punctat: true },
          { de: 1, la: 0, t: 'Răspunsul final', sub: 'IP-ul cerut + păstrat în cache cât zice TTL-ul' },
        ] },
      'dhcp-dora': { titlu: 'DHCP — cum primește o stație adresă IP (D·O·R·A)', tip: 'secv',
        nota: 'UDP: serverul ascultă pe portul 67, clientul pe 68. Adresa e „închiriată" (lease) pe timp limitat.',
        actori: ['Client (fără IP)', 'Server DHCP'],
        pasi: [
          { de: 0, la: 1, t: '1 · DISCOVER', sub: 'broadcast — „există vreun server DHCP?"', punctat: true },
          { de: 1, la: 0, t: '2 · OFFER', sub: '„îți propun adresa X"' },
          { de: 0, la: 1, t: '3 · REQUEST', sub: 'broadcast — „o vreau pe X"', punctat: true },
          { de: 1, la: 0, t: '4 · ACK', sub: 'IP + mască + gateway + DNS + durata lease-ului' },
        ] },
      'socket-flow': { titlu: 'Socket-uri TCP — apelurile pe server și pe client', tip: 'secv',
        actori: ['Server', 'Client'],
        pasi: [
          { self: 0, t: 'socket() → bind() → listen()' },
          { self: 1, t: 'socket()' },
          { de: 1, la: 0, t: 'connect()', sub: 'pornește handshake-ul TCP în 3 pași' },
          { self: 0, t: 'accept() → socket nou pt. client' },
          { de: 1, la: 0, t: 'send() / write()', sub: 'serverul citește cu recv() / read()' },
          { de: 0, la: 1, t: 'send() / write()', sub: 'clientul citește cu recv() / read()' },
          { nota: 'la final, ambele părți apelează close()' },
        ] },
      'http-schimb': { titlu: 'HTTP — cerere și răspuns', tip: 'secv',
        nota: 'HTTP e un protocol text de tip cerere–răspuns, transportat peste TCP (portul 80).',
        actori: ['Browser (client)', 'Server web'],
        pasi: [
          { de: 0, la: 1, t: 'GET /pagina HTTP/1.1', sub: 'Host: www.exemplu.ro + alte antete' },
          { de: 1, la: 0, t: 'HTTP/1.1 200 OK', sub: 'antete de răspuns + conținutul (HTML)' },
        ] },

      /* — Câmpia Semnalelor — */
      'modulatii': { titlu: 'Modulația unei purtătoare sinusoidale', tip: 'unda',
        nota: 'ASK — variezi amplitudinea; FSK — variezi frecvența; PSK — variezi faza (aici: salt de fază la bitul 0).',
        biti: ['1', '0', '1'],
        serii: [
          { nume: 'ASK (amplitudine)', tip: 'ask' },
          { nume: 'FSK (frecvență)', tip: 'fsk' },
          { nume: 'PSK (fază)', tip: 'psk' },
        ] },
      'codari': { titlu: 'Codări de linie: NRZ vs Manchester', tip: 'unda',
        nota: 'NRZ: nivelul ține tot bitul (1 = sus, 0 = jos). Manchester: tranziție OBLIGATORIE la mijlocul fiecărui bit (convenția IEEE 802.3: 1 = jos→sus, 0 = sus→jos) — receptorul își extrage ceasul din tranziții.',
        biti: ['1', '0', '1', '1', '0', '0', '1', '0'],
        serii: [
          { nume: 'NRZ', tip: 'nrz' },
          { nume: 'Manchester', tip: 'manchester' },
        ] },

      /* — Turnul Wireless — */
      'csma-ca': { titlu: 'CSMA/CA — evitarea coliziunilor în Wi-Fi (802.11)', tip: 'flux', H: 470,
        nota: 'Pe radio nu poți asculta în timp ce transmiți → coliziunile se EVITĂ (CA), nu se detectează (CD). Opțional, RTS/CTS rezervă mediul înainte de cadrele mari.',
        noduri: [
          { x: 210, y: 8,   w: 240, h: 34, t: 'Cadru de transmis', tip: 'start' },
          { x: 210, y: 64,  w: 240, h: 34, t: 'Ascultă mediul' },
          { x: 230, y: 120, w: 200, h: 48, t: 'Mediul e liber?', tip: 'dec' },
          { x: 480, y: 124, w: 158, h: 40, t: 'Amână + backoff\naleator' },
          { x: 190, y: 192, w: 280, h: 34, t: 'Așteaptă intervalul IFS' },
          { x: 176, y: 248, w: 308, h: 34, t: 'Transmite cadrul ÎNTREG' },
          { x: 190, y: 304, w: 280, h: 34, t: 'Așteaptă ACK de la receptor' },
          { x: 230, y: 360, w: 200, h: 48, t: 'A venit ACK-ul?', tip: 'dec' },
          { x: 40,  y: 424, w: 190, h: 38, t: '✅ Transmisie reușită', tip: 'ok' },
          { x: 350, y: 424, w: 250, h: 38, t: 'Backoff + reîncearcă' },
        ],
        muchii: [
          { puncte: [[330, 42], [330, 62]] },
          { puncte: [[330, 98], [330, 118]] },
          { puncte: [[430, 144], [478, 144]], lab: 'NU', lx: 452, ly: 134 },
          { puncte: [[559, 124], [559, 81], [452, 81]] },
          { puncte: [[330, 168], [330, 190]], lab: 'DA', lx: 348, ly: 180 },
          { puncte: [[330, 226], [330, 246]] },
          { puncte: [[330, 282], [330, 302]] },
          { puncte: [[330, 338], [330, 358]] },
          { puncte: [[230, 384], [135, 384], [135, 422]], lab: 'DA', lx: 186, ly: 374 },
          { puncte: [[430, 384], [475, 384], [475, 422]], lab: 'NU', lx: 452, ly: 374 },
          { puncte: [[602, 443], [640, 443], [640, 81], [452, 81]] },
        ] },
      'hidden-node': { titlu: 'Problema stației ascunse (hidden node)', tip: 'topo', H: 260,
        nota: 'A și C aud doar AP-ul, nu și una pe alta → „mediul pare liber" pentru amândouă → transmit simultan → coliziune la AP. Soluția: RTS/CTS — AP-ul anunță cine are voie să transmită.',
        cercuri: [
          { x: 180, y: 120, r: 165, c: '--good' },
          { x: 480, y: 120, r: 165, c: '--purple' },
        ],
        noduri: [
          { x: 180, y: 120, emoji: '💻', t: 'Stația A', c: '--good' },
          { x: 330, y: 120, emoji: '📶', t: 'AP', sub: 'le aude pe amândouă', c: '--accent' },
          { x: 480, y: 120, emoji: '💻', t: 'Stația C', c: '--purple' },
        ],
        muchii: [ { a: 0, b: 1 }, { a: 1, b: 2 } ] },

      /* — Răscrucea Routing + Munții IP (scheme) — */
      'routing-tabel': { titlu: 'Tabela de rutare + longest prefix match', tip: 'compus',
        blocuri: [
          { tip: 'tabel',
            coloane: ['Rețea destinație', 'Prefix / mască', 'Next hop', 'Interfață'],
            randuri: [
              ['192.168.1.0', '/24', '— (livrare directă)', 'eth0'],
              Object.assign(['192.168.1.128', '/26', '— (livrare directă)', 'eth1'], { _ev: true }),
              ['10.0.0.0', '/8', '192.168.1.1', 'eth0'],
              ['0.0.0.0', '/0  (ruta implicită)', '192.168.1.254', 'eth0'],
            ] },
        ],
        nota: 'Pentru destinația 192.168.1.130 se potrivesc și /24 și /26 — câștigă prefixul cel mai lung (/26, rândul evidențiat). Dacă nimic nu se potrivește, se folosește ruta implicită 0.0.0.0/0.' },
      'adresare-clase': { titlu: 'Clasele de adrese IPv4', tip: 'compus',
        blocuri: [
          { tip: 'tabel',
            coloane: ['Clasă', 'Primul octet', 'Structură (R = rețea, G = gazdă)', 'Folosire'],
            randuri: [
              ['A', '1 – 126', 'R.G.G.G  (8 biți rețea)', 'rețele foarte mari'],
              ['B', '128 – 191', 'R.R.G.G  (16 biți rețea)', 'rețele medii'],
              ['C', '192 – 223', 'R.R.R.G  (24 biți rețea)', 'rețele mici'],
              ['D', '224 – 239', '—', 'multicast'],
              ['E', '240 – 255', '—', 'experimental'],
            ] },
        ],
        nota: '127.x.x.x = loopback. Adrese private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Azi se folosește CIDR (prefix explicit), nu clasele.' },
      'subnet-schema': { titlu: 'Subnetizare: 192.168.1.0/24 → 4 subrețele /26', tip: 'compus',
        blocuri: [
          { tip: 'tabel',
            coloane: ['Subrețea', 'Adresă de rețea', 'Gazde utilizabile', 'Broadcast'],
            randuri: [
              ['S1', '192.168.1.0/26', '.1 – .62', '192.168.1.63'],
              ['S2', '192.168.1.64/26', '.65 – .126', '192.168.1.127'],
              ['S3', '192.168.1.128/26', '.129 – .190', '192.168.1.191'],
              ['S4', '192.168.1.192/26', '.193 – .254', '192.168.1.255'],
            ] },
        ],
        nota: 'Împrumutăm 2 biți de gazdă → 2² = 4 subrețele; rămân 6 biți de gazdă → 2⁶ − 2 = 62 de gazde pe subrețea (scădem adresa de rețea și broadcast-ul).' },
      'fragmentare': { titlu: 'Fragmentarea IP — exemplu: datagramă de 4000 de octeți, MTU 1500', tip: 'compus',
        blocuri: [
          { tip: 'tabel',
            coloane: ['Fragment', 'Octeți de date', 'Fragment Offset', 'Flag MF'],
            randuri: [
              ['#1', '1480', '0', '1 (mai urmează)'],
              ['#2', '1480', '185  (=1480/8)', '1 (mai urmează)'],
              ['#3', '1020', '370  (=2960/8)', '0 (ultimul)'],
            ] },
        ],
        nota: 'Datagrama originală: 20 antet + 3980 date. În fiecare fragment încap 1480 de octeți de date (1500 − 20). Offset-ul se măsoară în UNITĂȚI DE 8 OCTEȚI; toate fragmentele au același Identification, iar reasamblarea se face doar la destinație.' },
    };

    return {
      exista: cheie => !!DATE[cheie],
      construieste(cheie) {
        const d = DATE[cheie];
        const wrap = document.createElement('div');
        if (!d) { wrap.textContent = '(diagrama „' + cheie + '" nu există)'; return wrap; }
        if (d.titlu) {
          const t = document.createElement('div');
          t.className = 'rt-diag-titlu'; t.textContent = d.titlu;
          wrap.appendChild(t);
        }
        const blocuri = d.tip === 'compus' ? d.blocuri : [d];
        for (const b of blocuri) {
          let el = null;
          if (b.tip === 'biti') el = bitcamp(b);
          else if (b.tip === 'octeti') el = bytecamp(b);
          else if (b.tip === 'secv') el = secventa(b);
          else if (b.tip === 'stiva') el = stiva(b);
          else if (b.tip === 'nest') el = nest(b);
          else if (b.tip === 'unda') el = unda(b);
          else if (b.tip === 'flux') el = flux(b);
          else if (b.tip === 'topo') el = topo(b);
          else if (b.tip === 'tabel') el = tabel(b);
          if (el) wrap.appendChild(el);
        }
        if (d.nota) {
          const n = document.createElement('div');
          n.className = 'rt-diag-nota'; n.textContent = d.nota;
          wrap.appendChild(n);
        }
        return wrap;
      },
    };
  })();

  /* stiluri suplimentare pentru tabelele din diagrame */
  function injecteazaStiluriTabel() {
    if (document.getElementById('rt-stiluri-tabel')) return;
    const s = document.createElement('style');
    s.id = 'rt-stiluri-tabel';
    s.textContent = `
.rt-tabel-wrap{overflow-x:auto;margin:8px 0}
.rt-tabel{border-collapse:collapse;margin:0 auto;font-size:.82rem;min-width:70%}
.rt-tabel th{background:var(--bg3);color:var(--txt);text-align:left;padding:7px 12px;border:1px solid var(--border);font-size:.76rem}
.rt-tabel td{padding:7px 12px;border:1px solid var(--border);font-family:"JetBrains Mono",monospace;font-size:.78rem}
.rt-tabel tr.ev td{background:color-mix(in srgb,var(--accent) 16%,transparent);font-weight:700}
`;
    document.head.appendChild(s);
  }

  /* ══════════════════════ 18. INIȚIALIZARE + CICLU DE VIAȚĂ ═══════════════ */

  function initializeaza() {
    Joc.teorie = window.RETELISTAN_THEORY || null;
    Joc.regiuni = {};
    if (Joc.teorie && Array.isArray(Joc.teorie.regiuni))
      for (const r of Joc.teorie.regiuni) Joc.regiuni[r.id] = r;

    const stage = document.getElementById('rtStage');
    if (!Joc.teorie || !Object.keys(Joc.regiuni).length) {
      if (stage) stage.insertAdjacentHTML('beforeend',
        '<div class="rt-chip" style="position:absolute;inset:auto 0 45% 0;margin:auto;width:max-content">⚠️ Nu am găsit teoria (harta/theory.js). Verifică includerea fișierului.</div>');
      return;
    }

    citestePaleta();
    injecteazaStiluriTabel();
    construiesteLumea();
    redimensioneaza();

    // poziția jucătorului: cea salvată sau spawn-ul din sat
    const spawn = PLASARE.intro.spawn;
    const pos = Progres.date.pos;
    Joc.jucator.x = pos ? pos.x : (spawn[0] + 0.5) * TILE;
    Joc.jucator.y = pos ? pos.y : (spawn[1] + 0.5) * TILE;
    // dacă poziția salvată a nimerit într-un obstacol (harta s-a schimbat), înapoi la spawn
    if (loveste(Joc.jucator.x, Joc.jucator.y)) {
      Joc.jucator.x = (spawn[0] + 0.5) * TILE;
      Joc.jucator.y = (spawn[1] + 0.5) * TILE;
    }
    // camera direct pe jucător, fără alunecare inițială
    Joc.cam.x = clamp(Joc.jucator.x - Joc.latime / 2, 0, LUME_W * TILE - Joc.latime);
    Joc.cam.y = clamp(Joc.jucator.y - Joc.inaltime / 2, 0, LUME_H * TILE - Joc.inaltime);

    Joc.regiuneCurenta = null;
    Joc.poiAproape = null;
    Joc.particule = [];
    Minimap.deseneaza();
    UI.actualizeazaHud();
    Joc.initializat = true;
    Joc.dirty = true;

    // prima vizită: ecranul „cum se joacă"
    if (!Progres.date.ajutorVazut) UI.deschideAjutor();
  }

  /* pornim/oprim jocul când tab-ul „harta" devine activ/inactiv — observăm
     clasa .active pe secțiune (activateTab o comută), plus vizibilitatea filei */
  function leagaCicluDeViata() {
    const pagina = document.getElementById('page-harta');
    if (!pagina) return;

    const eActiva = () => pagina.classList.contains('active') && !document.hidden;
    const decide = () => { eActiva() ? porneste() : opreste(); };

    new MutationObserver(decide).observe(pagina, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', decide);

    // tema se poate schimba oricând (postMessage din gazdă → setTheme/applyThemeVars
    // umblă la data-theme și la style-ul rădăcinii) → recitim paleta și redesenăm
    new MutationObserver(() => {
      if (!Joc.initializat) return;
      citestePaleta();
      Minimap.deseneaza();
      Joc.dirty = true;
      if (!Joc.pornit) deseneaza(); // redesenăm și când jocul e oprit (tab vizibil altundeva)
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

    // canvas-ul urmărește dimensiunea containerului (responsive)
    if (window.ResizeObserver) {
      const stage = document.getElementById('rtStage');
      if (stage) new ResizeObserver(() => { if (Joc.initializat) redimensioneaza(); }).observe(stage);
    } else {
      window.addEventListener('resize', () => { if (Joc.initializat) redimensioneaza(); });
    }

    decide(); // dacă pagina se încarcă direct pe #harta
  }

  /* ═══════════════════════════════ 19. BOOT ═══════════════════════════════ */

  function boot() {
    const pagina = document.getElementById('page-harta');
    if (!pagina) return; // secțiunea nu există — nu facem nimic
    Progres.incarca();
    Multiplayer.incarcaAvatar();
    if (!UI.construieste()) return;
    Input.prinde();
    // clic pe canvas → focus pentru tastatură (utile în iframe-ul embed)
    Joc.canvas.addEventListener('pointerdown', () => Joc.canvas.focus({ preventScroll: true }));
    // muzica de fundal poate porni doar după un gest (politica de autoplay) —
    // la orice apăsare, reîncercăm (funcția se auto-protejează dacă e deja pornită)
    const startMuzica = () => Muzica.incearca();
    window.addEventListener('pointerdown', startMuzica);
    window.addEventListener('keydown', startMuzica);
    citestePaleta();
    leagaCicluDeViata();
  }

  // expus doar pentru teste/depanare (jocul nu-l folosește)
  window.RETELISTAN_DEBUG = { Joc, ASEZARE, PORTI, PLASARE, Progres, Multiplayer, construiesteLumea, T, S, TILE, LUME_W, LUME_H,
    Craft, RETETE, RESURSE, INSULE, EMOTE, AVATAR_CULORI, AVATAR_ACCESORII };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();




