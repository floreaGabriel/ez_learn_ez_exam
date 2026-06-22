// ============================================================
//  Subiecte Generate — modele de examen de licență
//  Construite în stilul subiectelor reale ATM (2017–2024) și pe
//  baza cursurilor. Fiecare model = 3 subiecte / 3 ore, cu barem.
//
//  Forma unui obiect:
//  {
//    id:        "model-1",            // unic, folosit în navigație
//    navTitlu:  "Model 1",            // eticheta scurtă din bara laterală
//    titlu:     "Model 1 — Examen...",// titlul complet
//    combo:     "Prog/OOP/SDA+Arh · Rețele · PSO",
//    rezumat:   "...",                // descriere pe card
//    html:      `...`                 // corpul subiectului (HTML)
//  }
//  Modelele sunt adăugate (push) din fișierele exam-1.js ... exam-5.js
// ============================================================
"use strict";
var SUBIECTE = [];
