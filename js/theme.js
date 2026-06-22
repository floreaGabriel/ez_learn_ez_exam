// ============================================================
//  Theme engine — selector de teme (galerie modal)
//  - generează ~100 de teme complete din palete Color Hunt (palettes.js)
//    cu contrast garantat (text mereu lizibil) + --on-accent automat;
//  - păstrează temele de bază Dark / Light (valorile exacte ale aplicației);
//  - aplică tema pe :root prin custom properties inline și o propagă în
//    iframe-urile materiilor (retele/sda/sql) prin postMessage, cu alias-uri
//    pentru schema de variabile a modulului Rețele.
// ============================================================
"use strict";

/* ---------------- helperi de culoare ---------------- */
function _hex2rgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(function(x){return x+x;}).join(''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function _rgb2hex(r){ return '#'+r.map(function(v){ v=Math.round(Math.max(0,Math.min(255,v))); var s=v.toString(16); return s.length<2?'0'+s:s; }).join(''); }
function _rgb2hsl(rgb){ var r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h,s,l=(mx+mn)/2; if(mx===mn){h=s=0;} else { var d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn); switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;} h/=6;} return [h*360,s,l]; }
function _hsl2rgb(hsl){ var h=hsl[0]/360,s=hsl[1],l=hsl[2]; function f(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; } var r,g,b; if(s===0){r=g=b=l;} else { var q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q; r=f(p,q,h+1/3); g=f(p,q,h); b=f(p,q,h-1/3);} return [r*255,g*255,b*255]; }
function _relLum(rgb){ var a=rgb.map(function(v){ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]; }
function _lum(hex){ return _relLum(_hex2rgb(hex)); }
function _sat(hex){ return _rgb2hsl(_hex2rgb(hex))[1]; }
function _contrast(h1,h2){ var L1=_lum(h1),L2=_lum(h2); var hi=Math.max(L1,L2),lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }
function _withL(hex,l){ var hsl=_rgb2hsl(_hex2rgb(hex)); hsl[2]=Math.max(0,Math.min(1,l)); return _rgb2hex(_hsl2rgb(hsl)); }
function _withSL(hex,s,l){ var hsl=_rgb2hsl(_hex2rgb(hex)); if(s!=null)hsl[1]=Math.max(0,Math.min(1,s)); hsl[2]=Math.max(0,Math.min(1,l)); return _rgb2hex(_hsl2rgb(hsl)); }
function _mix(h1,h2,t){ var a=_hex2rgb(h1),b=_hex2rgb(h2); return _rgb2hex([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]); }
// ajustează luminozitatea unei culori până atinge contrastul țintă față de bg
function _ensure(fg,bg,target,dir){ var f=fg,g=0; while(_contrast(f,bg)<target && g++<60){ var l=_rgb2hsl(_hex2rgb(f))[2]+dir*0.025; if(l<=0||l>=1) break; f=_withL(f,l); } return f; }
function _onAccent(accent){ return _contrast('#15120e',accent) >= _contrast('#ffffff',accent) ? '#15120e' : '#ffffff'; }

/* semantice fixe (funcționale: corect/greșit/info + tokeni cod) per mod */
var _SEM_DARK  = { green:'#b8bb26', red:'#fb4934', blue:'#83a598', purple:'#d3869b', aqua:'#8ec07c' };
var _SEM_LIGHT = { green:'#5d7a1a', red:'#c23a2e', blue:'#1c7a96', purple:'#8f3f71', aqua:'#427b58' };

/* ---------------- generatorul de teme ---------------- */
function buildTheme(p){
  var mode=p.m, cols=p.c.slice();
  var byLum=cols.slice().sort(function(a,b){return _lum(a)-_lum(b);});
  var darkest=byLum[0], lightest=byLum[byLum.length-1];
  function vivid(h){ var hsl=_rgb2hsl(_hex2rgb(h)); return hsl[1]*(1-Math.abs(hsl[2]-0.55)*0.7); }
  var byVivid=cols.slice().sort(function(a,b){return vivid(b)-vivid(a);});
  var accent=byVivid[0], accent2=byVivid[1]||accent;
  if(accent2===accent){ var h=_rgb2hsl(_hex2rgb(accent)); accent2=_rgb2hex(_hsl2rgb([(h[0]+28)%360,h[1],Math.min(1,h[2]+(mode==='dark'?0.06:-0.06))])); }

  var bg;
  if(mode==='dark'){ bg=darkest; if(_lum(bg)>0.14) bg=_withL(bg,0.07); }
  else { bg=lightest; if(_lum(bg)<0.86) bg=_withSL(bg,Math.min(_sat(bg),0.18),0.95); }
  var bh=_rgb2hsl(_hex2rgb(bg));
  function surf(dL,maxS){ var s=Math.min(bh[1], maxS==null?(mode==='dark'?0.20:0.28):maxS); return _rgb2hex(_hsl2rgb([bh[0],s,Math.max(0,Math.min(1,bh[2]+dL))])); }

  var V={};
  if(mode==='dark'){
    V['--bg']=bg; V['--sidebar']=surf(-0.012); V['--topbar']=surf(0.012);
    V['--panel']=surf(0.035); V['--panel2']=surf(0.06);
    V['--line']=surf(0.10); V['--line2']=surf(0.15); V['--code-bg']=surf(-0.008);
  } else {
    V['--bg']=bg; V['--panel']=surf(0.03); V['--panel2']=surf(-0.03);
    V['--sidebar']=surf(-0.05); V['--topbar']=surf(-0.012);
    V['--line']=surf(-0.10); V['--line2']=surf(-0.16); V['--code-bg']=surf(-0.04);
  }

  // text
  var ink, dir = mode==='dark'?1:-1;
  if(mode==='dark') ink=_ensure(_mix('#ffffff',accent,0.10), bg, 7.5, 1);
  else              ink=_ensure(_withSL(accent,0.45,0.16), bg, 8.5, -1);
  V['--ink']=ink;
  V['--ink-soft']=_mix(ink,bg,0.16);
  V['--muted']=_ensure(_mix(ink,bg,0.45), bg, 3.0, dir);

  // accent (vizibil pe bg + text pe accent lizibil prin --on-accent)
  var acc=accent;
  if(mode==='dark' && _lum(acc)<0.42) acc=_withL(acc,0.55);
  if(mode==='light' && _lum(acc)>0.55) acc=_withL(acc,0.42);
  acc=_ensure(acc,bg,2.6,dir);
  var acc2=accent2; if(_contrast(acc2,bg)<2.2) acc2=_ensure(acc2,bg,2.6,dir);
  V['--accent']=acc; V['--accent-2']=acc2; V['--on-accent']=_onAccent(acc);

  // semantice
  var sem = mode==='dark'?_SEM_DARK:_SEM_LIGHT;
  V['--green']=sem.green; V['--red']=sem.red; V['--blue']=sem.blue; V['--purple']=sem.purple; V['--aqua']=sem.aqua;
  V['--code-ink']=ink;

  // alias-uri pentru modulul Rețele (altă schemă de nume)
  V['--bg2']=V['--panel']; V['--bg3']=V['--panel2']; V['--txt']=ink;
  V['--accent2']=acc2; V['--good']=sem.green; V['--bad']=sem.red; V['--warn']=acc2; V['--border']=V['--line2'];
  return V;
}

/* ---------------- temele de bază (valorile exacte ale aplicației) ---------------- */
var _DARK_BASE = {
  '--bg':'#1a1714','--sidebar':'#13110e','--panel':'#221e1a','--panel2':'#2a2521','--topbar':'#1d1916',
  '--ink':'#ece3d2','--ink-soft':'#d6cbb6','--muted':'#a8997f','--line':'#352f28','--line2':'#403930',
  '--accent':'#e9b143','--accent-2':'#d8843f','--blue':'#83a598','--green':'#b8bb26','--red':'#fb4934',
  '--purple':'#d3869b','--aqua':'#8ec07c','--code-bg':'#14110d','--code-ink':'#ece3d2','--on-accent':'#1a1714',
  '--bg2':'#221e1a','--bg3':'#2a2521','--txt':'#ece3d2','--accent2':'#d8843f','--good':'#b8bb26','--bad':'#fb4934','--warn':'#d8843f','--border':'#403930'
};
var _LIGHT_BASE = {
  '--bg':'#f3ecdd','--sidebar':'#ece2cd','--panel':'#fbf6ea','--panel2':'#f1e8d6','--topbar':'#f7f1e3',
  '--ink':'#2a2118','--ink-soft':'#4a3f30','--muted':'#8a7a5f','--line':'#ddd0b8','--line2':'#cdbf9f',
  '--accent':'#bf8b1d','--accent-2':'#c46a2a','--blue':'#076678','--green':'#79740e','--red':'#c23a2e',
  '--purple':'#8f3f71','--aqua':'#427b58','--code-bg':'#efe6d2','--code-ink':'#2a2118','--on-accent':'#1a1714',
  '--bg2':'#fbf6ea','--bg3':'#f1e8d6','--txt':'#2a2118','--accent2':'#c46a2a','--good':'#79740e','--bad':'#c23a2e','--warn':'#c46a2a','--border':'#cdbf9f'
};
var _KEYS = Object.keys(_DARK_BASE);

/* ---------------- registrul temelor ---------------- */
var THEMES = [
  { id:'dark',  name:'Dark',  mode:'dark',  custom:false, vars:_DARK_BASE },
  { id:'light', name:'Light', mode:'light', custom:false, vars:_LIGHT_BASE }
].concat(PALETTES.map(function(p,i){
  return { id:'t'+i, name:p.n, mode:p.m, custom:true, vars:buildTheme(p) };
}));

/* ---------------- aplicare + persistență + iframe-uri ---------------- */
var _current = THEMES[0];

function _saveTheme(t){
  try{
    localStorage.setItem('app-theme', t.id);
    localStorage.setItem('app-theme-mode', t.mode);
    localStorage.setItem('app-theme-vars', JSON.stringify(t.vars));
  }catch(e){}
}
function frameThemeMsg(){ return { type:'theme', theme:_current.mode, vars:_current.custom?_current.vars:null }; }
function sendToFrames(t){
  document.querySelectorAll('iframe.embed-frame').forEach(function(f){
    try{ f.contentWindow.postMessage({ type:'theme', theme:t.mode, vars:t.custom?t.vars:null }, '*'); }catch(e){}
  });
}
function _syncToggleBtn(mode){ var b=document.getElementById('themeToggle'); if(b) b.textContent = mode==='light' ? '☀️' : '🌙'; }

function applyThemeById(id){
  var t=null; for(var i=0;i<THEMES.length;i++){ if(THEMES[i].id===id){ t=THEMES[i]; break; } }
  if(!t) t=THEMES[0];
  var root=document.documentElement;
  root.dataset.theme=t.mode;
  _KEYS.forEach(function(k){ root.style.removeProperty(k); });
  for(var k in t.vars) root.style.setProperty(k, t.vars[k]);
  _current=t;
  _saveTheme(t);
  _syncToggleBtn(t.mode);
  sendToFrames(t);
  if(_modal) _renderGrid();
}
function currentTheme(){ return _current ? _current.mode : (document.documentElement.dataset.theme||'dark'); }
function toggleTheme(){ applyThemeById(currentTheme()==='light' ? 'dark' : 'light'); }

/* ---------------- galeria modal ---------------- */
var _modal=null, _grid=null, _search=null, _filter='all';

function _previewHTML(v){
  return '<div class="tm-prev" style="background:'+v['--bg']+'">'
    + '<div class="tm-prev-side" style="background:'+(v['--sidebar']||v['--panel'])+'">'
    +   '<span style="background:'+v['--accent']+'"></span><span style="background:'+v['--muted']+'"></span><span style="background:'+v['--muted']+'"></span>'
    + '</div>'
    + '<div class="tm-prev-main">'
    +   '<div class="tm-prev-top" style="background:'+(v['--topbar']||v['--panel'])+'"><i style="background:'+v['--accent']+'"></i></div>'
    +   '<div class="tm-prev-card" style="background:'+v['--panel']+';border-color:'+v['--line2']+'">'
    +     '<b style="background:'+v['--ink']+'"></b><b style="background:'+v['--muted']+'" class="sh"></b>'
    +     '<u style="background:'+v['--accent-2']+'"></u>'
    +   '</div>'
    + '</div></div>';
}
function _cardHTML(t){
  var active = t.id===_current.id;
  return '<button class="tm-card'+(active?' active':'')+'" data-id="'+t.id+'">'
    + _previewHTML(t.vars)
    + '<span class="tm-name">'+t.name+'</span>'
    + '<span class="tm-mode" title="'+(t.mode==='dark'?'temă închisă':'temă deschisă')+'">'+(t.mode==='dark'?'🌙':'☀️')+'</span>'
    + (active?'<span class="tm-check">✓</span>':'')
    + '</button>';
}
function _renderGrid(){
  if(!_grid) return;
  var q=(_search && _search.value || '').trim().toLowerCase();
  var list=THEMES.filter(function(t){ return (_filter==='all'||t.mode===_filter) && (!q||t.name.toLowerCase().indexOf(q)>=0); });
  _grid.innerHTML = list.length ? list.map(_cardHTML).join('') : '<div class="tm-empty">Nicio temă găsită pentru „'+q+'”.</div>';
  _grid.querySelectorAll('.tm-card').forEach(function(c){ c.onclick=function(){ applyThemeById(c.dataset.id); }; });
  var cnt=document.getElementById('tmCount'); if(cnt) cnt.textContent=list.length+' teme';
}
function _buildModal(){
  if(_modal) return;
  _modal=document.createElement('div');
  _modal.className='tm-overlay'; _modal.id='themeModal';
  _modal.innerHTML=''
    + '<div class="tm-dialog" role="dialog" aria-label="Selector de teme">'
    +   '<div class="tm-head">'
    +     '<div><div class="tm-title">🎨 Alege tema</div><div class="tm-sub" id="tmCount"></div></div>'
    +     '<button class="tm-x" id="tmClose" title="Închide (Esc)">✕</button>'
    +   '</div>'
    +   '<div class="tm-tools">'
    +     '<div class="tm-filters">'
    +       '<button class="tm-chip active" data-f="all">Toate</button>'
    +       '<button class="tm-chip" data-f="dark">🌙 Dark</button>'
    +       '<button class="tm-chip" data-f="light">☀️ Light</button>'
    +     '</div>'
    +     '<input class="tm-search" id="tmSearch" type="search" placeholder="🔍 Caută o temă...">'
    +   '</div>'
    +   '<div class="tm-grid" id="tmGrid"></div>'
    +   '<div class="tm-foot"><span class="tm-hint">Click pe o temă = aplicare instant. Se salvează automat.</span><button class="tm-done" id="tmDone">Gata</button></div>'
    + '</div>';
  document.body.appendChild(_modal);
  _grid=_modal.querySelector('#tmGrid');
  _search=_modal.querySelector('#tmSearch');
  _search.addEventListener('input', _renderGrid);
  _modal.querySelectorAll('.tm-chip').forEach(function(ch){
    ch.onclick=function(){ _filter=ch.dataset.f; _modal.querySelectorAll('.tm-chip').forEach(function(x){x.classList.remove('active');}); ch.classList.add('active'); _renderGrid(); };
  });
  _modal.querySelector('#tmClose').onclick=closeThemePicker;
  _modal.querySelector('#tmDone').onclick=closeThemePicker;
  _modal.addEventListener('click', function(e){ if(e.target===_modal) closeThemePicker(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && _modal && _modal.classList.contains('open')) closeThemePicker(); });
}
function openThemePicker(){ _buildModal(); _renderGrid(); _modal.classList.add('open'); document.body.style.overflow='hidden'; if(_search) setTimeout(function(){ _search.focus(); },50); }
function closeThemePicker(){ if(_modal) _modal.classList.remove('open'); document.body.style.overflow=''; }

/* ---------------- init ---------------- */
window.addEventListener('DOMContentLoaded', function(){
  var saved=null; try{ saved=localStorage.getItem('app-theme'); }catch(e){}
  applyThemeById(saved||'dark');
  _buildModal();
});
