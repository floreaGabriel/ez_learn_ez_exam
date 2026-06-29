// ============================================================
//  Conquistador — motor de sunet (Web Audio API)
//  Sunete sintetizate în browser (fără fișiere, fără copyright, offline):
//  selecție, bătălie, cucerire, pierdere teritoriu, victorie + muzică de
//  fundal pe buclă. Buton de mut, stare salvată în localStorage.
//  AudioContext-ul pornește la prima interacțiune (cerință a browserelor).
// ============================================================
(function(){
  "use strict";
  var ctx = null, master = null;
  var muted = false;
  try{ muted = localStorage.getItem("conq-muted") === "1"; }catch(e){}

  function ensure(){
    if(ctx) return ctx;
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    }catch(e){ ctx = null; }
    return ctx;
  }
  function now(){ return ctx.currentTime; }

  // ---- primitive ----
  function tone(freq, t0, dur, type, peak){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.25, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sweep(f1, f2, t0, dur, type, peak){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sawtooth";
    o.frequency.setValueAtTime(f1, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.22, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, peak, lp){
    var n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for(var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var g = ctx.createGain(); g.gain.value = peak || 0.3;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp || 1800;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur);
  }

  // ---- efecte ----
  var FX = {
    click: function(t){ tone(660, t, 0.06, "square", 0.12); },
    select: function(t){ tone(540, t, 0.09, "triangle", 0.2); tone(810, t + 0.05, 0.1, "triangle", 0.18); },
    place: function(t){ [392, 523, 659].forEach(function(f, i){ tone(f, t + i * 0.06, 0.3, "triangle", 0.2); }); },
    question: function(t){ tone(880, t, 0.18, "sine", 0.18); tone(1175, t + 0.09, 0.22, "sine", 0.15); },
    battle: function(t){ noise(t, 0.18, 0.35, 1200); sweep(180, 90, t, 0.35, "sawtooth", 0.22); tone(110, t, 0.3, "square", 0.18); },
    correct: function(t){ [659, 988].forEach(function(f, i){ tone(f, t + i * 0.07, 0.22, "sine", 0.2); }); },
    conquer: function(t){ [523, 659, 784, 1047].forEach(function(f, i){ tone(f, t + i * 0.08, 0.32, "triangle", 0.22); }); noise(t + 0.32, 0.25, 0.12, 4000); },
    lose: function(t){ [523, 440, 349, 262].forEach(function(f, i){ tone(f, t + i * 0.1, 0.3, "sawtooth", 0.18); }); },
    win: function(t){ [523, 659, 784, 1047, 1319].forEach(function(f, i){ tone(f, t + i * 0.12, 0.5, "triangle", 0.24); }); [392, 523].forEach(function(f, i){ tone(f, t + 0.1 + i * 0.12, 0.6, "sine", 0.16); }); },
    reveal: function(t){ tone(784, t, 0.16, "sine", 0.16); }
  };

  function play(name){
    if(muted) return;
    if(!ensure()) return;
    if(ctx.state === "suspended") ctx.resume();
    var fn = FX[name]; if(fn) try{ fn(now() + 0.01); }catch(e){}
  }

  // ---- muzică de fundal: două piese MP3 reale, pe loop, cu crossfade ----
  //   "adventure" = fundal general al jocului
  //   "questions" = în timpul întrebărilor (modalul de întrebare e activ)
  var MUSIC_VOL = 0.42;
  var TRACK_URL = { adventure: "audio/bg-adventure.mp3", questions: "audio/bg-questions.mp3" };
  var els = {};            // name -> HTMLAudioElement
  var wantTrack = null;    // ce piesă ar trebui să cânte acum (null = niciuna)

  function trackEl(name){
    if(els[name]) return els[name];
    var a = new Audio(TRACK_URL[name]);
    a.loop = true; a.preload = "auto"; a.volume = 0;
    els[name] = a; return a;
  }
  function ramp(a, to, ms, pauseEnd){
    if(a._ramp){ clearInterval(a._ramp); a._ramp = null; }
    var from = a.volume, t0 = Date.now();
    a._ramp = setInterval(function(){
      var k = Math.min(1, (Date.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if(k >= 1){ clearInterval(a._ramp); a._ramp = null; if(pauseEnd && to === 0){ try{ a.pause(); }catch(e){} } }
    }, 40);
  }
  function applyMusic(){
    if(!wantTrack){ Object.keys(els).forEach(function(n){ ramp(els[n], 0, 400, true); }); return; }
    Object.keys(TRACK_URL).forEach(function(n){
      var a = trackEl(n);
      if(n === wantTrack && !muted){ try{ var p = a.play(); if(p && p.catch) p.catch(function(){}); }catch(e){} ramp(a, MUSIC_VOL, 700, false); }
      else { ramp(a, 0, 450, true); }
    });
  }
  // alege „scena" muzicală (general vs întrebări). Pornește muzica la prima apelare.
  function scene(name){ wantTrack = (name === "questions") ? "questions" : "adventure"; applyMusic(); }
  function startMusic(){ scene("adventure"); }
  function stopMusic(){ wantTrack = null; applyMusic(); }

  function setMuted(m){
    muted = !!m;
    try{ localStorage.setItem("conq-muted", muted ? "1" : "0"); }catch(e){}
    if(master) master.gain.value = muted ? 0 : 0.9;   // efectele (WebAudio)
    applyMusic();                                     // muzica (HTMLAudio)
  }
  function toggle(){ setMuted(!muted); return muted; }
  function isMuted(){ return muted; }

  window.ConqAudio = { play: play, scene: scene, startMusic: startMusic, stopMusic: stopMusic, setMuted: setMuted, toggle: toggle, isMuted: isMuted };
})();
