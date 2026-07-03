// ============================================================
//  Among Us CS — sunetele jocului
//  ------------------------------------------------------------
//  Efectele stau în /audio/ (imaginea statică a site-ului, servită de
//  nginx pe același origin). Dacă lipsesc (ex. rulare locală doar cu
//  serviciul Node), jocul merge mai departe fără sunet — erorile de
//  încărcare sunt înghițite.
//  Browserele cer un gest al utilizatorului înainte de audio: deblocăm
//  la primul pointerdown/keydown.
// ============================================================
(function(){
  "use strict";

  var BAZA = "/audio/";
  var DEF = {
    reveal:   { f: "among_us_role_reveal_suspect.mp3",    vol: 0.6 },
    kill:     { f: "among_us_kill_sound_effect.mp3",      vol: 0.7 },
    report:   { f: "among_us_reporting_dead_body.mp3",    vol: 0.7 },
    urgenta:  { f: "among_us_emergency_meeting_call.mp3", vol: 0.7 },
    meeting:  { f: "among_us_emergency_meeting.mp3",      vol: 0.6 },
    task:     { f: "among_us_task_complete.mp3",          vol: 0.6 },
    sabotaj:  { f: "among_us_sabotage_sound.mp3",         vol: 0.55 },
    reparat:  { f: "among_us_fixing_lights.mp3",          vol: 0.6 },
    usa:      { f: "among_us_doors_opening.mp3",          vol: 0.45 },
    usaInchisa: { f: "among_us_doors_closing.mp3",        vol: 0.45 },
    click:    { f: "among_us_ui_click.mp3",               vol: 0.35, taie: 350 },
    pasi:     { f: "among_us_walking_on_metal.mp3",       vol: 0.16, loop: true }
  };

  var cache = {};       // nume -> HTMLAudioElement
  var unlocked = false;
  var activ = true;     // toggle 🔊 din UI

  function elem(nume){
    var d = DEF[nume];
    if(!d) return null;
    if(!cache[nume]){
      var a = new Audio(BAZA + d.f);
      a.preload = "auto";
      a.volume = d.vol;
      if(d.loop) a.loop = true;
      a.addEventListener("error", function(){ cache[nume] = null; });   // lipsă => tăcere
      cache[nume] = a;
    }
    return cache[nume];
  }

  function play(nume){
    if(!activ || !unlocked) return;
    var a = elem(nume);
    if(!a) return;
    try{
      a.currentTime = 0;
      var p = a.play();
      if(p && p.catch) p.catch(function(){});
      var d = DEF[nume];
      if(d.taie){ setTimeout(function(){ try{ if(!a.paused && !d.loop) a.pause(); }catch(e){} }, d.taie); }
    }catch(e){}
  }

  // bucla de pași: pornită/oprită de randare, după starea de mișcare proprie
  var pasiPornit = false;
  function pasi(on){
    if(on === pasiPornit) return;
    pasiPornit = on;
    var a = elem("pasi");
    if(!a) return;
    try{
      if(on && activ && unlocked){ var p = a.play(); if(p && p.catch) p.catch(function(){}); }
      else a.pause();
    }catch(e){}
  }

  function unlock(){
    if(unlocked) return;
    unlocked = true;
    // „amorsăm” elementele ca browserul să le accepte după gest
    for(var k in DEF) elem(k);
  }
  window.addEventListener("pointerdown", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });

  window.SFX = {
    play: play,
    pasi: pasi,
    get activ(){ return activ; },
    toggle: function(){ activ = !activ; if(!activ) pasi(false); return activ; }
  };
})();
