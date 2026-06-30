/* ============================================================
   OOP C++ — Memorie vizuală
   Model unificat „hartă de memorie" (scene + pași).
   Fiecare pas declară starea COMPLETĂ a celulelor (nu diff-uri),
   ca să fie ușor de autorat și de redat corect.

   cell: { id, label, val?, addr?, hot?, dead?, points? }
     - points: id-ul unei alte celule  -> se desenează săgeată (pointer)
     - points:"VOID"                    -> săgeată „atârnând" (dangling)
   aliases: [ { name, target } ]  -> etichetă-alias lipită pe celula țintă
   regions: subset din MAP_REGIONS, în ordinea de afișare.
   ============================================================ */
const MEM_DEMOS = [

  /* 1) Pointer vs Referință ---------------------------------- */
  {
    id:"ptr-ref",
    nume:"Pointer vs Referință",
    rezumat:"Un pointer este o celulă proprie ce conține o adresă. O referință este doar un al doilea nume (alias) pentru o celulă existentă.",
    cod:
`int a = 10;     // a la 0x1000
int b = 20;     // b la 0x1010
int* p = &a;    // p are propria celulă, conține adresa lui a
int& r = a;     // r = alias pentru a  (&r este IDENTIC cu &a)

p = &b;         // celula lui p devine adresa lui b -> p arată spre b
r = b;          // NU releagă r; copiază valoarea lui b ÎN a`,
    regions:["stack"],
    steps:[
      { title:"Declarații",
        note:"<b>a</b> și <b>b</b> sunt variabile obișnuite. <b>p</b> ocupă propria celulă (0x2000) al cărei conținut este adresa lui a — de-aici săgeata. <b>r</b> nu apare ca o celulă separată: e doar o etichetă lipită pe celula lui a.",
        cells:{ stack:[
          {id:"a", label:"int a",  val:"10",     addr:"0x1000", hot:true},
          {id:"b", label:"int b",  val:"20",     addr:"0x1010"},
          {id:"p", label:"int* p", val:"0x1000", addr:"0x2000", points:"a", hot:true}
        ]},
        aliases:[ {name:"int& r", target:"a"} ]
      },
      { title:"p = &b;",
        note:"Se modifică <b>conținutul celulei lui p</b> (0x2000): acum ține adresa lui b, deci p arată spre b. a și b rămân neatinse.",
        cells:{ stack:[
          {id:"a", label:"int a",  val:"10",     addr:"0x1000"},
          {id:"b", label:"int b",  val:"20",     addr:"0x1010"},
          {id:"p", label:"int* p", val:"0x1010", addr:"0x2000", points:"b", hot:true}
        ]},
        aliases:[ {name:"int& r", target:"a"} ]
      },
      { title:"r = b;",
        note:"<b>r</b> este bătut în cuie pe a din momentul inițializării. <code>r = b</code> nu poate reașeza alias-ul — copiază valoarea lui b (20) <b>în a</b>. Acum a == 20. O referință nu poate fi mutată niciodată.",
        cells:{ stack:[
          {id:"a", label:"int a",  val:"20",     addr:"0x1000", hot:true},
          {id:"b", label:"int b",  val:"20",     addr:"0x1010"},
          {id:"p", label:"int* p", val:"0x1010", addr:"0x2000", points:"b"}
        ]},
        aliases:[ {name:"int& r", target:"a"} ]
      }
    ]
  },

  /* 2) Obiect pe stivă, resursă pe heap ----------------------- */
  {
    id:"stack-heap",
    nume:"Obiect pe stivă, resursă pe heap",
    rezumat:"Constructorul nu alocă obiectul — memoria lui e deja rezervată. El doar inițializează, eventual cerând o resursă pe heap.",
    cod:
`class Buffer {
    size_t size_;
    int*   data_;                 // pointer spre heap
public:
    Buffer(size_t n)
      : size_(n),                 // listă de inițializare
        data_(new int[n]()) {}    // alocare + zeroizare pe heap
    ~Buffer() { delete[] data_; }
};

Buffer b(3);   // b pe stivă, datele pe heap`,
    regions:["stack","heap"],
    steps:[
      { title:"Cadru de stivă alocat",
        note:"Memoria obiectului <b>b</b> (16 octeți: size_ + data_) este rezervată pe stivă <b>înainte</b> să ruleze constructorul. Conținutul e deocamdată nedefinit.",
        cells:{ stack:[
          {id:"size", label:"b.size_", val:"?", addr:"0x7ffe10"},
          {id:"data", label:"b.data_", val:"?", addr:"0x7ffe18"}
        ], heap:[] }
      },
      { title:"Listă de inițializare",
        note:"<code>size_(3)</code> apoi <code>data_(new int[3]())</code>: se alocă 12 octeți pe heap, zeroizați, iar data_ primește adresa lor. Obiectul de pe stivă „deține” o resursă care trăiește în altă parte.",
        cells:{ stack:[
          {id:"size", label:"b.size_", val:"3",        addr:"0x7ffe10", hot:true},
          {id:"data", label:"b.data_", val:"0x55a3f0", addr:"0x7ffe18", hot:true, points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[0, 0, 0]", addr:"0x55a3f0", hot:true}
        ] }
      },
      { title:"Corpul constructorului",
        note:"Corpul rulează <b>după</b> ce membrii sunt deja inițializați. Aici e cheia problemelor de copy/move: b deține un pointer spre o zonă heap separată.",
        cells:{ stack:[
          {id:"size", label:"b.size_", val:"3",        addr:"0x7ffe10"},
          {id:"data", label:"b.data_", val:"0x55a3f0", addr:"0x7ffe18", points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[0, 0, 0]", addr:"0x55a3f0"}
        ] }
      }
    ]
  },

  /* 3a) Shallow copy (periculos) ------------------------------ */
  {
    id:"copy-shallow",
    nume:"Copy SHALLOW (implicit — periculos)",
    rezumat:"Fără copy constructor scris, compilatorul copiază membru-cu-membru. Pentru pointeri asta înseamnă copierea adresei, nu a datelor → două obiecte spre aceeași zonă.",
    cod:
`// Nu am scris copy constructor -> copie membru-cu-membru
Buffer a(3);     // a.data_ -> heap [1,2,3]
Buffer b = a;    // b.data_ = a.data_   (ACELAȘI pointer!)

// la ieșirea din scope: ~Buffer pentru b, apoi pentru a
//   delete[] de DOUĂ ori pe aceeași zonă -> DOUBLE FREE`,
    regions:["stack","heap"],
    steps:[
      { title:"Buffer a(3);",
        note:"a deține zona heap cu [1,2,3].",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"}
        ] }
      },
      { title:"Buffer b = a;  (shallow)",
        note:"Copy-ul implicit copiază <b>valoarea pointerului</b>. Acum <b>ambii</b> pointeri (a.data_ și b.data_) arată spre ACEEAȘI zonă de heap.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blk"},
          {id:"b", label:"b.data_", val:"0x55a0", addr:"0x7ffe20", points:"blk", hot:true}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0", hot:true}
        ] }
      },
      { title:"~Buffer() pentru b",
        note:"Destructorul lui b face <code>delete[]</code> pe zonă. Memoria este eliberată — dar a.data_ încă arată spre ea.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blk"},
          {id:"b", label:"b.data_", val:"0x55a0", addr:"0x7ffe20", dead:true, points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"(eliberat)", addr:"0x55a0", dead:true, hot:true}
        ] }
      },
      { title:"~Buffer() pentru a",
        note:"a face din nou <code>delete[]</code> pe aceeași zonă deja eliberată → <b>DOUBLE FREE</b>: crash sau corupere de heap. De-aici Rule of Three.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", dead:true, points:"blk", hot:true}
        ], heap:[
          {id:"blk", label:"int[3]", val:"(eliberat)", addr:"0x55a0", dead:true}
        ] }
      }
    ]
  },

  /* 3b) Deep copy (corect) ------------------------------------ */
  {
    id:"copy-deep",
    nume:"Copy DEEP (corect)",
    rezumat:"Copy constructorul scris de mână alocă o zonă nouă și copiază elementele → două obiecte complet independente.",
    cod:
`Buffer(const Buffer& o)
  : size_(o.size_),
    data_(new int[o.size_]) {                 // alocare NOUĂ
    std::copy(o.data_, o.data_ + size_, data_);
}

Buffer a(3);     // heap A [1,2,3]
Buffer b = a;    // heap B [1,2,3]  (zonă SEPARATĂ)`,
    regions:["stack","heap"],
    steps:[
      { title:"Buffer a(3);",
        note:"a deține zona A.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blkA"}
        ], heap:[
          {id:"blkA", label:"int[3]  (A)", val:"[1, 2, 3]", addr:"0x55a0"}
        ] }
      },
      { title:"Buffer b = a;  (deep)",
        note:"Se alocă o <b>zonă nouă</b> (B) și se copiază element-cu-element. b.data_ arată spre B, nu spre A. Două zone independente.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blkA"},
          {id:"b", label:"b.data_", val:"0x77c0", addr:"0x7ffe20", points:"blkB", hot:true}
        ], heap:[
          {id:"blkA", label:"int[3]  (A)", val:"[1, 2, 3]", addr:"0x55a0"},
          {id:"blkB", label:"int[3]  (B)", val:"[1, 2, 3]", addr:"0x77c0", hot:true}
        ] }
      },
      { title:"Distrugere",
        note:"Modificarea lui b nu afectează a. La ieșirea din scope fiecare obiect eliberează <b>propria</b> zonă: fără double free, fără leak.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", dead:true, points:"blkA"},
          {id:"b", label:"b.data_", val:"0x77c0", addr:"0x7ffe20", dead:true, points:"blkB"}
        ], heap:[
          {id:"blkA", label:"int[3]  (A)", val:"(eliberat)", addr:"0x55a0", dead:true, hot:true},
          {id:"blkB", label:"int[3]  (B)", val:"(eliberat)", addr:"0x77c0", dead:true, hot:true}
        ] }
      }
    ]
  },

  /* 4) Move ---------------------------------------------------- */
  {
    id:"move",
    nume:"Move — furtul resursei",
    rezumat:"Move-ul nu copiază datele: transferă pointerul din sursă în destinație și lasă sursa goală. O(1) în loc de O(n).",
    cod:
`Buffer(Buffer&& o) noexcept
  : size_(o.size_),
    data_(o.data_) {     // FURĂM pointerul (niciun new)
    o.data_ = nullptr;   // anulăm sursa
    o.size_ = 0;
}

Buffer a(3);              // heap [1,2,3]
Buffer b = std::move(a);  // mută: O(1)`,
    regions:["stack","heap"],
    steps:[
      { title:"Înainte de move",
        note:"a deține zona cu [1,2,3]. <code>std::move(a)</code> nu mută nimic — e doar un cast care permite alegerea move constructorului.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"}
        ] }
      },
      { title:"Furăm pointerul",
        note:"b.data_ primește valoarea pointerului lui a. Momentan <b>ambii</b> arată spre [1,2,3]. Niciun <code>new</code>, nicio copiere element-cu-element.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"0x55a0", addr:"0x7ffe10", points:"blk"},
          {id:"b", label:"b.data_", val:"0x55a0", addr:"0x7ffe20", points:"blk", hot:true}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0", hot:true}
        ] }
      },
      { title:"Anulăm sursa",
        note:"<code>o.data_ = nullptr</code>: a devine validă dar goală. b este acum unicul proprietar al zonei heap. Heap-ul NU s-a eliberat — doar și-a schimbat proprietarul.",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"nullptr", addr:"0x7ffe10", hot:true},
          {id:"b", label:"b.data_", val:"0x55a0",  addr:"0x7ffe20", points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"[1, 2, 3]", addr:"0x55a0"}
        ] }
      },
      { title:"Distrugere",
        note:"<code>delete[] nullptr</code> (a) este legal și no-op. b eliberează corect zona. Fără double free, fără leak. De-aceea move-ul e O(1) iar copy-ul O(n).",
        cells:{ stack:[
          {id:"a", label:"a.data_", val:"nullptr", addr:"0x7ffe10", dead:true},
          {id:"b", label:"b.data_", val:"0x55a0",  addr:"0x7ffe20", dead:true, points:"blk"}
        ], heap:[
          {id:"blk", label:"int[3]", val:"(eliberat)", addr:"0x55a0", dead:true, hot:true}
        ] }
      }
    ]
  },

  /* 5) Dangling reference ------------------------------------- */
  {
    id:"dangling",
    nume:"Dangling — referință spre o variabilă locală",
    rezumat:"Nu întoarce niciodată o referință (sau pointer) spre o variabilă locală: cadrul de stivă dispare și referința rămâne atârnând.",
    cod:
`int& gresit() {
    int x = 5;       // x trăiește în cadrul de stivă al funcției
    return x;        // întoarce un alias spre x
}                    // cadrul dispare -> x nu mai există

int& r = gresit();
std::cout << r;      // citire dintr-o celulă eliberată -> UB`,
    regions:["stack"],
    steps:[
      { title:"În interiorul gresit()",
        note:"Cadrul de stivă al funcției <code>gresit()</code> conține variabila locală <b>x = 5</b>.",
        cells:{ stack:[
          {id:"frame", label:"gresit() → int x", val:"5", addr:"0x7ffe40", hot:true}
        ] }
      },
      { title:"return x;",
        note:"Se întoarce o <b>referință</b> (alias) spre x. Apelantul o leagă de <code>r</code>.",
        cells:{ stack:[
          {id:"frame", label:"gresit() → int x", val:"5", addr:"0x7ffe40"},
          {id:"r",     label:"int& r (apelant)", val:"alias", addr:"0x7ffe60", points:"frame", hot:true}
        ] }
      },
      { title:"Funcția se termină",
        note:"Cadrul lui gresit() este desfăcut: <b>x nu mai există</b>. Referința <code>r</code> arată spre o celulă eliberată — este <b>dangling</b>.",
        cells:{ stack:[
          {id:"frame", label:"(cadru eliberat)", val:"???", addr:"0x7ffe40", dead:true, hot:true},
          {id:"r",     label:"int& r (apelant)", val:"alias", addr:"0x7ffe60", points:"frame"}
        ] }
      },
      { title:"std::cout << r;",
        note:"Citirea prin <code>r</code> accesează memorie eliberată → <b>comportament nedefinit</b> (poate afișa 5, gunoi, sau crash). Aceeași capcană există cu <code>int* gresit(){ int x=5; return &x; }</code>.",
        cells:{ stack:[
          {id:"r", label:"int& r (apelant)", val:"alias", addr:"0x7ffe60", points:"VOID", hot:true}
        ] }
      }
    ]
  }
];

if (typeof window !== "undefined") window.MEM_DEMOS = MEM_DEMOS;
if (typeof module !== "undefined") module.exports = { MEM_DEMOS };
