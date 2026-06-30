// ============================================================
//  Conquistador — mascote (personaje SVG desenate, alese de jucători)
//  window.ConqMascots.svg(id, size) -> markup SVG inline
//  window.ConqMascots.LIST -> [{id, nume}]
// ============================================================
(function(){
  "use strict";
  function face(){
    return '<circle cx="31" cy="43" r="7" fill="#fff"/><circle cx="49" cy="43" r="7" fill="#fff"/>'
      + '<circle cx="32.5" cy="44" r="3.4" fill="#2a2118"/><circle cx="47.5" cy="44" r="3.4" fill="#2a2118"/>'
      + '<circle cx="33.8" cy="42.6" r="1.2" fill="#fff"/><circle cx="48.8" cy="42.6" r="1.2" fill="#fff"/>'
      + '<circle cx="22.5" cy="51" r="3.4" fill="#ff8fa3" opacity=".55"/><circle cx="57.5" cy="51" r="3.4" fill="#ff8fa3" opacity=".55"/>'
      + '<path d="M34 53 Q40 58 46 53" fill="none" stroke="#2a2118" stroke-width="2" stroke-linecap="round"/>';
  }
  var M = {
    fox:
      '<path d="M18 30 L24 9 L34 31 Z" fill="#ef8c43"/><path d="M21 27 L25 15 L30 28 Z" fill="#ffdcc0"/>'
      + '<path d="M62 30 L56 9 L46 31 Z" fill="#ef8c43"/><path d="M59 27 L55 15 L50 28 Z" fill="#ffdcc0"/>'
      + '<circle cx="40" cy="44" r="25" fill="#ef8c43"/>'
      + '<path d="M40 44 Q22 50 28 64 Q40 70 52 64 Q58 50 40 44 Z" fill="#fff6ee"/>'
      + face() + '<circle cx="40" cy="50" r="2.8" fill="#2a2118"/>',
    bear:
      '<circle cx="22" cy="24" r="9" fill="#9c6b48"/><circle cx="22" cy="24" r="4.5" fill="#c89878"/>'
      + '<circle cx="58" cy="24" r="9" fill="#9c6b48"/><circle cx="58" cy="24" r="4.5" fill="#c89878"/>'
      + '<circle cx="40" cy="44" r="25" fill="#a9744f"/>'
      + '<ellipse cx="40" cy="52" rx="12" ry="9" fill="#e6cdb6"/>'
      + face() + '<ellipse cx="40" cy="49" rx="3.2" ry="2.4" fill="#2a2118"/>',
    cat:
      '<path d="M19 31 L22 11 L36 28 Z" fill="#8b93a3"/><path d="M61 31 L58 11 L44 28 Z" fill="#8b93a3"/>'
      + '<path d="M23 28 L25 17 L33 27 Z" fill="#ff8fa3" opacity=".7"/><path d="M57 28 L55 17 L47 27 Z" fill="#ff8fa3" opacity=".7"/>'
      + '<circle cx="40" cy="44" r="25" fill="#8b93a3"/>' + face()
      + '<circle cx="40" cy="49" r="2.2" fill="#ff8fa3"/>'
      + '<path d="M14 47h12M14 51h12M54 47h12M54 51h12" stroke="#fff" stroke-width="1.3" opacity=".7"/>',
    frog:
      '<circle cx="28" cy="22" r="11" fill="#5cb85c"/><circle cx="52" cy="22" r="11" fill="#5cb85c"/>'
      + '<circle cx="28" cy="21" r="5.5" fill="#fff"/><circle cx="52" cy="21" r="5.5" fill="#fff"/>'
      + '<circle cx="28" cy="22" r="2.8" fill="#2a2118"/><circle cx="52" cy="22" r="2.8" fill="#2a2118"/>'
      + '<ellipse cx="40" cy="48" rx="26" ry="22" fill="#5cb85c"/>'
      + '<circle cx="30" cy="54" r="3" fill="#ff8fa3" opacity=".5"/><circle cx="50" cy="54" r="3" fill="#ff8fa3" opacity=".5"/>'
      + '<path d="M28 56 Q40 64 52 56" fill="none" stroke="#2a5a2a" stroke-width="2.4" stroke-linecap="round"/>',
    panda:
      '<circle cx="22" cy="23" r="9" fill="#2a2118"/><circle cx="58" cy="23" r="9" fill="#2a2118"/>'
      + '<circle cx="40" cy="44" r="25" fill="#f3f1ec"/>'
      + '<ellipse cx="30" cy="42" rx="7" ry="9" fill="#2a2118" transform="rotate(-18 30 42)"/>'
      + '<ellipse cx="50" cy="42" rx="7" ry="9" fill="#2a2118" transform="rotate(18 50 42)"/>'
      + '<circle cx="31" cy="43" r="3.2" fill="#fff"/><circle cx="49" cy="43" r="3.2" fill="#fff"/>'
      + '<circle cx="40" cy="50" r="2.6" fill="#2a2118"/>'
      + '<path d="M35 54 Q40 58 45 54" fill="none" stroke="#2a2118" stroke-width="2" stroke-linecap="round"/>',
    owl:
      '<path d="M20 26 L26 14 L33 27 Z" fill="#2c8983"/><path d="M60 26 L54 14 L47 27 Z" fill="#2c8983"/>'
      + '<circle cx="40" cy="44" r="25" fill="#3aa6a0"/>'
      + '<circle cx="31" cy="42" r="10" fill="#fff"/><circle cx="49" cy="42" r="10" fill="#fff"/>'
      + '<circle cx="31" cy="42" r="4.6" fill="#2a2118"/><circle cx="49" cy="42" r="4.6" fill="#2a2118"/>'
      + '<circle cx="32.6" cy="40.4" r="1.6" fill="#fff"/><circle cx="50.6" cy="40.4" r="1.6" fill="#fff"/>'
      + '<path d="M36 50 L40 56 L44 50 Z" fill="#f4b942"/>'
      + '<path d="M22 60 Q40 66 58 60" fill="none" stroke="#2c8983" stroke-width="3" stroke-linecap="round"/>',
    robot:
      '<rect x="38.5" y="8" width="3" height="9" fill="#9aa6b8"/><circle cx="40" cy="7" r="3.5" fill="#f4b942"/>'
      + '<rect x="16" y="22" width="48" height="42" rx="11" fill="#7a8aa0"/>'
      + '<rect x="22" y="34" width="36" height="18" rx="6" fill="#26303f"/>'
      + '<circle cx="32" cy="43" r="4.8" fill="#5ad1e6"/><circle cx="48" cy="43" r="4.8" fill="#5ad1e6"/>'
      + '<circle cx="33.4" cy="41.6" r="1.4" fill="#fff"/><circle cx="49.4" cy="41.6" r="1.4" fill="#fff"/>'
      + '<rect x="34" y="57" width="12" height="3" rx="1.5" fill="#26303f"/>',
    dragon:
      '<path d="M22 26 L18 8 L32 24 Z" fill="#7d4fb0"/><path d="M58 26 L62 8 L48 24 Z" fill="#7d4fb0"/>'
      + '<circle cx="40" cy="44" r="25" fill="#a06cd5"/>'
      + '<path d="M40 20 L43 14 L46 20 L49 14 L52 21" fill="none" stroke="#7d4fb0" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<ellipse cx="40" cy="53" rx="11" ry="8" fill="#c8a6e8"/>'
      + '<circle cx="36" cy="52" r="1.7" fill="#5a3a86"/><circle cx="44" cy="52" r="1.7" fill="#5a3a86"/>'
      + face()
  };
  var LIST = [
    { id: "fox", nume: "Vulpe" }, { id: "bear", nume: "Urs" }, { id: "cat", nume: "Pisică" },
    { id: "frog", nume: "Broască" }, { id: "panda", nume: "Panda" }, { id: "owl", nume: "Bufniță" },
    { id: "robot", nume: "Robot" }, { id: "dragon", nume: "Dragon" }
  ];
  function svg(id, size){
    var inner = M[id] || M.fox; size = size || 56;
    return '<svg class="conq-mascot-svg" viewBox="0 0 80 80" width="' + size + '" height="' + size + '">' + inner + '</svg>';
  }
  window.ConqMascots = { LIST: LIST, svg: svg, has: function(id){ return !!M[id]; }, DEFAULT: "fox" };
})();
