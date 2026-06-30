// ============================================================
//  Harta EUROPEI — ~30 de țări ca regiuni, DESENATE PESTE imaginea reală
//  `assets/europa_map.png` (894x612). Spre deosebire de România, AICI NU
//  există `border` (conturul continentului e prea complex + insule), deci
//  clientul desenează markere cu disc de proprietar peste imagine (nu Voronoi).
//  Centrele (cx,cy) sunt pozițiile țărilor pe imagine. Adiacența e EXPLICITĂ
//  (uscat + câteva legături maritime, ca să nu existe regiuni izolate).
// ============================================================
"use strict";

const IMG = { url: "assets/europa_map.png", w: 894, h: 612 };

const REGIONS = [
  { id: "ISL", nume: "Islanda",          cx: 70,  cy: 70,  val: 200 },
  { id: "IRL", nume: "Irlanda",          cx: 95,  cy: 185, val: 200 },
  { id: "GBR", nume: "Marea Britanie",   cx: 150, cy: 185, val: 250 },
  { id: "POR", nume: "Portugalia",       cx: 120, cy: 320, val: 200 },
  { id: "ESP", nume: "Spania",           cx: 175, cy: 315, val: 250 },
  { id: "FRA", nume: "Franța",           cx: 225, cy: 245, val: 250 },
  { id: "BEL", nume: "Belgia",           cx: 245, cy: 225, val: 200 },
  { id: "NLD", nume: "Olanda",           cx: 255, cy: 205, val: 200 },
  { id: "DEU", nume: "Germania",         cx: 300, cy: 222, val: 300 },
  { id: "CHE", nume: "Elveția",          cx: 270, cy: 270, val: 200 },
  { id: "ITA", nume: "Italia",           cx: 320, cy: 320, val: 250 },
  { id: "DNK", nume: "Danemarca",        cx: 290, cy: 172, val: 200 },
  { id: "NOR", nume: "Norvegia",         cx: 275, cy: 125, val: 200 },
  { id: "SWE", nume: "Suedia",           cx: 332, cy: 130, val: 200 },
  { id: "FIN", nume: "Finlanda",         cx: 420, cy: 110, val: 200 },
  { id: "POL", nume: "Polonia",          cx: 370, cy: 210, val: 250 },
  { id: "CZE", nume: "Cehia",            cx: 322, cy: 235, val: 200 },
  { id: "AUT", nume: "Austria",          cx: 338, cy: 258, val: 200 },
  { id: "HUN", nume: "Ungaria",          cx: 382, cy: 262, val: 200 },
  { id: "ROU", nume: "România",          cx: 450, cy: 288, val: 250 },
  { id: "BGR", nume: "Bulgaria",         cx: 445, cy: 322, val: 200 },
  { id: "GRC", nume: "Grecia",           cx: 420, cy: 372, val: 200 },
  { id: "SRB", nume: "Serbia",           cx: 397, cy: 298, val: 200 },
  { id: "HRV", nume: "Croația",          cx: 352, cy: 282, val: 200 },
  { id: "UKR", nume: "Ucraina",          cx: 515, cy: 232, val: 250 },
  { id: "BLR", nume: "Belarus",          cx: 472, cy: 195, val: 200 },
  { id: "BAL", nume: "Țările Baltice",   cx: 432, cy: 162, val: 200 },
  { id: "SVK", nume: "Slovacia",         cx: 365, cy: 248, val: 200 },
  { id: "MDA", nume: "Moldova",          cx: 502, cy: 272, val: 200 },
  { id: "RUS", nume: "Rusia (vest)",     cx: 630, cy: 165, val: 300 }
];

const NEIGHBORS = {
  ISL: ["IRL", "NOR", "GBR"],
  IRL: ["ISL", "GBR"],
  GBR: ["IRL", "ISL", "FRA", "BEL", "NLD", "NOR"],
  POR: ["ESP"],
  ESP: ["POR", "FRA"],
  FRA: ["ESP", "GBR", "BEL", "DEU", "CHE", "ITA"],
  BEL: ["FRA", "NLD", "DEU", "GBR"],
  NLD: ["BEL", "DEU", "GBR"],
  DEU: ["FRA", "BEL", "NLD", "DNK", "POL", "CZE", "AUT", "CHE"],
  CHE: ["FRA", "DEU", "AUT", "ITA"],
  ITA: ["FRA", "CHE", "AUT", "HRV", "GRC"],
  DNK: ["DEU", "NOR", "SWE"],
  NOR: ["SWE", "DNK", "ISL", "GBR", "FIN"],
  SWE: ["NOR", "DNK", "FIN", "BAL"],
  FIN: ["SWE", "NOR", "RUS", "BAL"],
  POL: ["DEU", "CZE", "SVK", "UKR", "BLR", "BAL"],
  CZE: ["DEU", "POL", "SVK", "AUT"],
  AUT: ["DEU", "CZE", "SVK", "HUN", "ITA", "CHE"],
  HUN: ["AUT", "SVK", "UKR", "ROU", "SRB", "HRV"],
  ROU: ["HUN", "UKR", "MDA", "BGR", "SRB"],
  BGR: ["ROU", "SRB", "GRC"],
  GRC: ["BGR", "ITA", "SRB"],
  SRB: ["HUN", "ROU", "BGR", "HRV", "GRC"],
  HRV: ["ITA", "HUN", "SRB"],
  UKR: ["POL", "SVK", "HUN", "ROU", "MDA", "BLR", "RUS"],
  BLR: ["POL", "BAL", "UKR", "RUS"],
  BAL: ["POL", "SWE", "FIN", "BLR", "RUS"],
  SVK: ["POL", "CZE", "AUT", "HUN", "UKR"],
  MDA: ["ROU", "UKR"],
  RUS: ["FIN", "BAL", "BLR", "UKR"]
};

(function checkSymmetry(){
  for(const a of Object.keys(NEIGHBORS)){
    for(const b of NEIGHBORS[a]){
      if(!NEIGHBORS[b] || NEIGHBORS[b].indexOf(a) < 0)
        console.warn("EUROPA adiacență asimetrică:", a, "->", b);
    }
  }
})();

function mapForClient(){
  return {
    img: IMG,
    // FĂRĂ border => clientul desenează markere cu disc, nu Voronoi
    regions: REGIONS.map(rg => ({
      id: rg.id, nume: rg.nume, cx: rg.cx, cy: rg.cy, val: rg.val,
      neighbors: NEIGHBORS[rg.id] || []
    }))
  };
}
function regionIds(){ return REGIONS.map(r => r.id); }
function neighborsOf(id){ return NEIGHBORS[id] || []; }
function regionVal(id){ const r = REGIONS.find(x => x.id === id); return r ? r.val : 200; }

module.exports = { REGIONS, NEIGHBORS, IMG, mapForClient, regionIds, neighborsOf, regionVal };
