/* ============================================================
   OOP C++ — Anatomie obiect (structura statică a tipurilor)
   - layouts : layout-ul în memorie (vptr / membri / padding / sizeof)
   - dispatch: animația apelului virtual (dubla indirectare)
   - mangling: tabel de coduri de tip + exemple (ABI Itanium)
   - templates: instanțiere = generare de cod (.text / .data)
   ============================================================ */
const ANATOMY = {

  layouts:[
    {
      id:"base", nume:"Base (polimorfică)",
      cod:`class Base {
    int x_;
public:
    virtual void f();
};`,
      sizeofTxt:"16 octeți  =  vptr (8) + int x_ (4) + padding (4)",
      note:"O clasă cu funcții virtuale primește un <b>vptr</b> ascuns la offset 0. De-aceea obiectul e mai mare cu un pointer (8 octeți pe 64-bit) decât fără <code>virtual</code>.",
      scene:{ regions:["obj"], steps:[ { title:"Layout Base",
        cells:{ obj:[
          {id:"v", label:"vptr", val:"→ vtable Base", addr:"+0", hot:true},
          {id:"x", label:"int x_", val:"4 octeți", addr:"+8"},
          {id:"p", label:"(padding)", val:"4 octeți", addr:"+12", dead:true}
        ] } } ] }
    },
    {
      id:"derived", nume:"Derived : public Base",
      cod:`class Derived : public Base {
    int y_;
public:
    void f() override;
};`,
      sizeofTxt:"16 octeți  =  vptr (8) + int x_ (4) + int y_ (4)  — y_ reutilizează padding-ul bazei",
      note:"Subobiectul <b>Base</b> ocupă fizic primii octeți. De-aceea un <code>Base*</code> spre un Derived are aceeași adresă numerică (la moștenire simplă) — arată exact spre porțiunea Base, la offset 0. Membrul <code>y_</code> al lui Derived <b>reutilizează padding-ul</b> de la finalul bazei (tail-padding reuse, ABI Itanium), deci se așază la offset <b>+12</b> și <code>sizeof(Derived)</code> rămâne <b>16 octeți</b>.",
      scene:{ regions:["obj"], steps:[ { title:"Layout Derived",
        cells:{ obj:[
          {id:"v",  label:"vptr  (Base)", val:"→ vtable Derived", addr:"+0", hot:true},
          {id:"x",  label:"int x_  (Base)", val:"4 octeți", addr:"+8"},
          {id:"y",  label:"int y_  (Derived)", val:"4 octeți  (reutilizează padding-ul bazei)", addr:"+12", hot:true}
        ] } } ] }
    }
  ],

  dispatch:{
    cod:`Base* ptr = /* arată spre un Derived */;
ptr->speak();    // apel virtual -> dublă indirectare`,
    note:"Compilatorul nu știe spre ce tip arată ptr, deci nu poate genera un <code>call</code> direct. Indexul slotului (+0) e fix, decis la compilare; doar <b>ținta</b> slotului e dinamică.",
    scene:{ regions:["stack","heap","rodata","text"], steps:[
      { title:"ptr->speak()",
        note:"<code>ptr</code> (în registrul rdi) arată spre obiect. Primii 8 octeți ai obiectului sunt <b>vptr</b>, care arată spre vtable-ul clasei reale.",
        cells:{ stack:[ {id:"ptr", label:"Base* ptr", val:"rdi = 0x9000", addr:"rdi", points:"vptr", hot:true} ],
                heap:[ {id:"vptr", label:"obiect.vptr  (+0)", val:"→ vtable", addr:"0x9000", points:"s0"},
                       {id:"mem",  label:"...membri...", val:"", addr:"0x9008"} ],
                rodata:[ {id:"s0", label:"vtable [0] speak", val:"→ Derived::speak", addr:"0x4020", points:"fs"},
                         {id:"s1", label:"vtable [1] walk",  val:"→ Base::walk",     addr:"0x4028", points:"fw"} ],
                text:[ {id:"fs", label:"Derived::speak", val:"<cod>", addr:"0x401000"},
                       {id:"fw", label:"Base::walk",     val:"<cod>", addr:"0x401080"} ] } },
      { title:"mov rax, [rdi]",
        note:"<code>mov rax, [rdi]</code> — încarcă <b>vptr</b> (primii 8 octeți ai obiectului) în rax. <b>Prima indirectare.</b>",
        cells:{ stack:[ {id:"ptr", label:"Base* ptr", val:"rdi = 0x9000", addr:"rdi", points:"vptr", hot:true} ],
                heap:[ {id:"vptr", label:"obiect.vptr  (+0)", val:"→ vtable", addr:"0x9000", points:"s0", hot:true},
                       {id:"mem",  label:"...membri...", val:"", addr:"0x9008"} ],
                rodata:[ {id:"s0", label:"vtable [0] speak", val:"→ Derived::speak", addr:"0x4020", points:"fs"},
                         {id:"s1", label:"vtable [1] walk",  val:"→ Base::walk",     addr:"0x4028", points:"fw"} ],
                text:[ {id:"fs", label:"Derived::speak", val:"<cod>", addr:"0x401000"},
                       {id:"fw", label:"Base::walk",     val:"<cod>", addr:"0x401080"} ] } },
      { title:"mov rax, [rax + 0]",
        note:"<code>mov rax, [rax + 0]</code> — citește pointerul din <b>slotul 0</b> (speak). <b>A doua indirectare.</b> Offset-ul +0 e fix (compile-time); pentru walk ar fi +8.",
        cells:{ stack:[ {id:"ptr", label:"Base* ptr", val:"rdi = 0x9000", addr:"rdi", points:"vptr"} ],
                heap:[ {id:"vptr", label:"obiect.vptr  (+0)", val:"→ vtable", addr:"0x9000", points:"s0"},
                       {id:"mem",  label:"...membri...", val:"", addr:"0x9008"} ],
                rodata:[ {id:"s0", label:"vtable [0] speak", val:"→ Derived::speak", addr:"0x4020", points:"fs", hot:true},
                         {id:"s1", label:"vtable [1] walk",  val:"→ Base::walk",     addr:"0x4028", points:"fw"} ],
                text:[ {id:"fs", label:"Derived::speak", val:"<cod>", addr:"0x401000", hot:true},
                       {id:"fw", label:"Base::walk",     val:"<cod>", addr:"0x401080"} ] } },
      { title:"call rax",
        note:"<code>call rax</code> — apel <b>indirect</b> prin registru. Pentru un Derived, slotul 0 arată spre <code>Derived::speak</code>. Un apel non-virtual ar fi <code>call adresă-fixă</code> (cunoscută la link-time, poate fi inlined).",
        cells:{ stack:[ {id:"ptr", label:"Base* ptr", val:"rdi = 0x9000", addr:"rdi", points:"vptr"} ],
                heap:[ {id:"vptr", label:"obiect.vptr  (+0)", val:"→ vtable", addr:"0x9000", points:"s0"},
                       {id:"mem",  label:"...membri...", val:"", addr:"0x9008"} ],
                rodata:[ {id:"s0", label:"vtable [0] speak", val:"→ Derived::speak", addr:"0x4020", points:"fs"},
                         {id:"s1", label:"vtable [1] walk",  val:"→ Base::walk",     addr:"0x4028", points:"fw"} ],
                text:[ {id:"fs", label:"Derived::speak  (apelat)", val:"<cod>", addr:"0x401000", hot:true},
                       {id:"fw", label:"Base::walk",     val:"<cod>", addr:"0x401080"} ] } }
    ] }
  },

  mangling:{
    intro:"Overloading-ul nu lasă urme la runtime: compilatorul codifică tipurile parametrilor în numele simbolului (<b>name mangling</b>). Cele trei funcții devin trei simboluri distincte — numele comun e o iluzie din codul sursă.",
    types:[
      ["void","v"], ["bool","b"], ["char","c"], ["short","s"], ["int","i"],
      ["unsigned int","j"], ["long","l"], ["unsigned long","m"],
      ["float","f"], ["double","d"],
      ["T*","P + tip"], ["const T","K + tip"], ["T&","R + tip"], ["T&&","O + tip"]
    ],
    examples:[
      { sig:"void f(int)",            mangled:"_Z1fi" },
      { sig:"void f(double)",         mangled:"_Z1fd" },
      { sig:"void f(int, char)",      mangled:"_Z1fic" },
      { sig:"void g(const char*)",    mangled:"_Z1gPKc" },
      { sig:"int sum(int, int, int)", mangled:"_Z3sumiii" }
    ]
  },

  templates:{
    intro:"Un template nu e cod — e o rețetă. Nu ocupă niciun octet în binar până nu îl folosești. La fiecare utilizare cu tipuri concrete, compilatorul <b>instanțiază</b> o funcție/clasă reală, cu adresă proprie. De aici <b>code bloat</b>.",
    defs:`template<class T> T add(T a, T b){ return a + b; }
template<class T> struct Box { T v; };
template<class T> struct Counter { static int count; };`,
    items:[
      { label:"add<int>",    kind:"fn",     sym:"_Z3addIiET_S0_S0_", addr:"0x401000", desc:"int add(int, int)" },
      { label:"add<double>", kind:"fn",     sym:"_Z3addIdET_S0_S0_", addr:"0x401040", desc:"double add(double, double)" },
      { label:"add<char>",   kind:"fn",     sym:"_Z3addIcET_S0_S0_", addr:"0x401080", desc:"char add(char, char)" },
      { label:"Box<int>",    kind:"class",  sym:"Box<int>",          desc:"tip nou · layout: int v (4 octeți)" },
      { label:"Box<string>", kind:"class",  sym:"Box<std::string>",  desc:"tip nou · layout: std::string v (32 octeți)" },
      { label:"Counter<int>",    kind:"static", sym:"Counter<int>::count",    addr:"0x60a000", desc:"static int = 0" },
      { label:"Counter<double>", kind:"static", sym:"Counter<double>::count", addr:"0x60a004", desc:"static int = 0" }
    ],
    note:"Instanțiază de mai multe ori același tip: linkerul vede simboluri <b>weak/COMDAT</b> și păstrează o singură copie (COMDAT folding) — de-aceea binarul final nu se umflă cu duplicate, deși fiecare unitate de compilare a produs câte una. Membrii statici sunt însă <b>per instanțiere</b>: <code>Counter&lt;int&gt;::count</code> și <code>Counter&lt;double&gt;::count</code> sunt variabile diferite, la adrese diferite."
  }
};

if (typeof window !== "undefined") window.ANATOMY = ANATOMY;
if (typeof module !== "undefined") module.exports = { ANATOMY };
