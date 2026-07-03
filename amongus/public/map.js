// ============================================================
//  Among Us CS — harta (geometrie partajată server + client)
//  ------------------------------------------------------------
//  UN SINGUR fișier descrie lumea: podelele (dreptunghiuri călcabile),
//  camerele tematice, stațiile de task, butonul de urgență și punctul
//  de reparat sabotajul. Serverul îl folosește pentru coliziuni și
//  validări de distanță (autoritar); clientul, pentru randare și
//  predicția mișcării proprii. Orice zonă din afara podelelor = perete.
//
//  Convenție: axele în pixeli de lume, originea sus-stânga.
// ============================================================
(function(root, factory){
  if(typeof module !== "undefined" && module.exports) module.exports = factory(); // Node (server)
  else root.AMAP = factory();                                                     // browser (client)
})(typeof self !== "undefined" ? self : this, function(){
  "use strict";

  var W = 2560, H = 1440;      // dimensiunea lumii
  var R = 16;                  // raza „bob”-ului (jucătorului)

  // vitezele / razele de interacțiune — folosite IDENTIC de server (validare)
  // și de client (doar pentru feedback vizual; serverul rămâne autoritatea)
  var SPEED    = 170;          // px / secundă
  var VISION   = 340;          // raza de vizibilitate (fog of war)
  var KILL_R   = 70;           // cât de aproape trebuie să fie impostorul
  var USE_R    = 70;           // raza de interacțiune cu o stație / buton
  var REPORT_R = 90;           // raza de raportare a unui cadavru

  // ---------- podelele (tot ce e călcabil) ----------
  // Camerele au "room"; coridoarele nu. Dreptunghiurile vecine se SUPRAPUN
  // puțin (≥20px) la treceri, ca testul de „punct în reuniune” să nu se
  // împiedice de muchii.
  var FLOORS = [
    // camere tematice
    { x: 1030, y:  520, w: 500, h: 400, room: "cafeteria" },
    { x: 1080, y:   80, w: 400, h: 280, room: "kernel"    },
    { x:  160, y:  120, w: 560, h: 360, room: "server"    },
    { x: 1840, y:  120, w: 560, h: 360, room: "compiler"  },
    { x:  160, y:  960, w: 560, h: 360, room: "network"   },
    { x: 1840, y:  960, w: 560, h: 360, room: "database"  },
    { x: 1080, y: 1080, w: 400, h: 280, room: "memory"    },
    // coridoare
    { x: 1230, y:  340, w: 100, h: 200 },   // Cafeteria ↔ Kernel Core
    { x: 1230, y:  900, w: 100, h: 200 },   // Cafeteria ↔ Memory Bay
    { x:  640, y:  670, w: 410, h: 100 },   // vest, orizontal (spre Cafeteria)
    { x:  640, y:  460, w: 100, h: 520 },   // vest, vertical (Server ↔ Network)
    { x: 1510, y:  670, w: 410, h: 100 },   // est, orizontal (spre Cafeteria)
    { x: 1820, y:  460, w: 100, h: 520 }    // est, vertical (Compiler ↔ Database)
  ];

  var ROOM_NAMES = {
    cafeteria: "Cafeteria",
    kernel:    "Kernel Core",
    server:    "Server Room",
    compiler:  "Compiler Lab",
    network:   "Network Ops",
    database:  "Database Vault",
    memory:    "Memory Bay"
  };

  // ---------- stațiile de task ----------
  // Terminale generice: CE minijoc rulează la fiecare decide serverul când
  // împarte taskurile (doar din materiile alese în lobby).
  var STATIONS = [
    { id: "st_caf",   x: 1100, y:  590, room: "cafeteria" },
    { id: "st_ker",   x: 1160, y:  300, room: "kernel"    },
    { id: "st_srv1",  x:  260, y:  200, room: "server"    },
    { id: "st_srv2",  x:  620, y:  420, room: "server"    },
    { id: "st_cmp1",  x: 1940, y:  200, room: "compiler"  },
    { id: "st_cmp2",  x: 2300, y:  420, room: "compiler"  },
    { id: "st_net1",  x:  260, y: 1040, room: "network"   },
    { id: "st_net2",  x:  620, y: 1280, room: "network"   },
    { id: "st_db1",   x: 1940, y: 1040, room: "database"  },
    { id: "st_db2",   x: 2300, y: 1280, room: "database"  },
    { id: "st_mem1",  x: 1160, y: 1160, room: "memory"    },
    { id: "st_mem2",  x: 1400, y: 1300, room: "memory"    },
    { id: "st_cor_w", x:  690, y:  550, room: null        },
    { id: "st_cor_e", x: 1870, y:  890, room: null        }
  ];

  // butonul de ședință de urgență (masa din Cafeteria)
  var BUTTON = { x: 1280, y: 700 };
  // punctul unde se repară sabotajul „supraîncălzire kernel”
  var FIX_KERNEL = { x: 1280, y: 160 };
  // cercul de (re)spawn — mijlocul Cafeteriei
  var SPAWN = { x: 1280, y: 780, r: 90 };

  // ---------- teste de geometrie ----------
  function inFloor(px, py){
    for(var i = 0; i < FLOORS.length; i++){
      var f = FLOORS[i];
      if(px >= f.x && px <= f.x + f.w && py >= f.y && py <= f.y + f.h) return true;
    }
    return false;
  }

  // Poate sta un jucător (cerc de rază R) cu centrul în (x,y)?
  // Aproximăm cercul prin 8 puncte pe contur — fiecare punct poate cădea în
  // ALT dreptunghi de podea (reuniunea contează), deci trecerile merg lin.
  var D = 0.7071 * R;
  function canStand(x, y){
    return inFloor(x - R, y) && inFloor(x + R, y) &&
           inFloor(x, y - R) && inFloor(x, y + R) &&
           inFloor(x - D, y - D) && inFloor(x + D, y - D) &&
           inFloor(x - D, y + D) && inFloor(x + D, y + D);
  }

  // în ce cameră e punctul (null pe coridoare / în pereți)
  function roomAt(px, py){
    for(var i = 0; i < FLOORS.length; i++){
      var f = FLOORS[i];
      if(f.room && px >= f.x && px <= f.x + f.w && py >= f.y && py <= f.y + f.h) return f.room;
    }
    return null;
  }

  function dist(ax, ay, bx, by){ var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }

  // UN SINGUR loc pentru integrarea mișcării — folosit de server (autoritar)
  // și de predicția clientului, ca cele două să nu divergă niciodată.
  // Axă cu axă (alunecare pe pereți) + „ajutor de colț”: dacă o axă e blocată
  // fix pe muchia unei uși, alunecăm puțin pe cealaltă axă ca să nu ne
  // înțepenim în colțurile concave dintre două podele.
  function misca(x, y, dx, dy, pasLen){
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var sx = (dx / len) * pasLen, sy = (dy / len) * pasLen;
    if(sx){
      var nx = x + sx;
      if(canStand(nx, y)) x = nx;
      else if(!sy){
        if(canStand(nx, y + Math.abs(sx))){ x = nx; y += Math.abs(sx); }
        else if(canStand(nx, y - Math.abs(sx))){ x = nx; y -= Math.abs(sx); }
      }
    }
    if(sy){
      var ny = y + sy;
      if(canStand(x, ny)) y = ny;
      else if(!sx){
        if(canStand(x + Math.abs(sy), ny)){ y = ny; x += Math.abs(sy); }
        else if(canStand(x - Math.abs(sy), ny)){ y = ny; x -= Math.abs(sy); }
      }
    }
    return [x, y];
  }

  return {
    W: W, H: H, R: R,
    SPEED: SPEED, VISION: VISION, KILL_R: KILL_R, USE_R: USE_R, REPORT_R: REPORT_R,
    FLOORS: FLOORS, ROOM_NAMES: ROOM_NAMES, STATIONS: STATIONS,
    BUTTON: BUTTON, FIX_KERNEL: FIX_KERNEL, SPAWN: SPAWN,
    inFloor: inFloor, canStand: canStand, roomAt: roomAt, dist: dist, misca: misca
  };
});
