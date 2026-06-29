// ============================================================
//  Harta României — 14 REGIUNI (grupuri de județe), DESENATE PESTE
//  imaginea reală `assets/romania_map.jpg` (700x500).
//  Clientul așază imaginea ca fundal (viewBox 0 0 700 500) și desenează
//  regiunile ca partiție Voronoi (centre + conturul țării), cu umplere
//  semi-transparentă ca să se vadă harta dedesubt + markere stil Triviador.
//  Centrele (cx,cy) sunt pe pozițiile reale ale grupurilor de județe.
//  Adiacența (neighbors) e definită EXPLICIT — corectă geografic.
// ============================================================
"use strict";

// imaginea de fundal (servită static de nginx la /assets/)
const IMG = { url: "assets/romania_map.jpg", w: 700, h: 500 };

// id, nume, centru (cx,cy în spațiul imaginii 700x500), valoare, județele acoperite
const REGIONS = [
  { id: "MAR",  nume: "Maramureș",          cx: 252, cy: 88,  val: 200 },  // Satu Mare, Maramureș
  { id: "BUCO", nume: "Bucovina",           cx: 420, cy: 92,  val: 200 },  // Suceava, Botoșani
  { id: "CRI",  nume: "Crișana",            cx: 150, cy: 162, val: 200 },  // Bihor, Sălaj, Arad-N
  { id: "TRN",  nume: "Transilvania Nord",  cx: 292, cy: 156, val: 200 },  // Bistrița, Cluj, Mureș
  { id: "MON",  nume: "Moldova Nord",       cx: 480, cy: 178, val: 200 },  // Iași, Neamț, Bacău
  { id: "BAN",  nume: "Banat",              cx: 108, cy: 300, val: 200 },  // Timiș, Caraș-Severin
  { id: "TRS",  nume: "Transilvania Sud",   cx: 255, cy: 256, val: 200 },  // Alba, Sibiu, Hunedoara, Brașov
  { id: "SEC",  nume: "Secuimea",           cx: 400, cy: 242, val: 200 },  // Harghita, Covasna
  { id: "MOS",  nume: "Moldova Sud",        cx: 548, cy: 240, val: 200 },  // Vaslui, Vrancea, Galați
  { id: "OLT",  nume: "Oltenia",            cx: 238, cy: 382, val: 200 },  // Mehedinți, Gorj, Vâlcea, Dolj, Olt
  { id: "MUN",  nume: "Muntenia",           cx: 360, cy: 365, val: 200 },  // Argeș, Dâmbovița, Prahova, Teleorman, Giurgiu
  { id: "BAR",  nume: "Bărăgan",            cx: 492, cy: 348, val: 250 },  // Buzău, Brăila, Ialomița, Călărași
  { id: "DOB",  nume: "Dobrogea",           cx: 612, cy: 372, val: 250 },  // Tulcea, Constanța
  { id: "BUC",  nume: "București",          cx: 416, cy: 398, val: 300 }   // Ilfov, București
];

// conturul (silueta) României, trasat peste imagine, sens orar din NV (700x500)
const BORDER = [
  [150, 58], [250, 40], [345, 45], [420, 55], [458, 42], [470, 76],
  [540, 116], [562, 182], [585, 240], [568, 278], [660, 288], [638, 350],
  [620, 405], [612, 444], [555, 460], [430, 460], [360, 470], [270, 455],
  [150, 430], [92, 378], [58, 318], [55, 262], [78, 205], [72, 148], [105, 92]
];

const NEIGHBORS = {
  MAR:  ["CRI", "TRN", "BUCO"],
  BUCO: ["MAR", "TRN", "MON"],
  CRI:  ["MAR", "TRN", "BAN"],
  TRN:  ["MAR", "CRI", "BUCO", "BAN", "TRS", "SEC", "MON"],
  MON:  ["BUCO", "TRN", "SEC", "MOS"],
  BAN:  ["CRI", "TRN", "TRS", "OLT"],
  TRS:  ["BAN", "TRN", "SEC", "OLT", "MUN"],
  SEC:  ["TRN", "TRS", "MON", "MOS", "MUN", "BAR"],
  MOS:  ["MON", "SEC", "BAR", "DOB"],
  OLT:  ["BAN", "TRS", "MUN"],
  MUN:  ["TRS", "SEC", "OLT", "BUC", "BAR"],
  BAR:  ["SEC", "MOS", "MUN", "BUC", "DOB"],
  DOB:  ["MOS", "BAR"],
  BUC:  ["MUN", "BAR"]
};

(function checkSymmetry(){
  for(const a of Object.keys(NEIGHBORS)){
    for(const b of NEIGHBORS[a]){
      if(!NEIGHBORS[b] || NEIGHBORS[b].indexOf(a) < 0)
        console.warn("adiacență asimetrică:", a, "->", b);
    }
  }
})();

function mapForClient(){
  return {
    img: IMG,
    border: BORDER,
    regions: REGIONS.map(rg => ({
      id: rg.id, nume: rg.nume, cx: rg.cx, cy: rg.cy, val: rg.val,
      neighbors: NEIGHBORS[rg.id] || []
    }))
  };
}

function regionIds(){ return REGIONS.map(r => r.id); }
function neighborsOf(id){ return NEIGHBORS[id] || []; }
function regionVal(id){ const r = REGIONS.find(x => x.id === id); return r ? r.val : 200; }

module.exports = { REGIONS, NEIGHBORS, BORDER, IMG, mapForClient, regionIds, neighborsOf, regionVal };
