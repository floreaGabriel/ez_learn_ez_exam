// ============================================================
//  SQL Trainer — datele celor 4 jocuri
//  SQL_QUIZ    : grilă (concepte + capcane)
//  SQL_BUILD   : construiește interogarea (ordonează clauzele)
//  SQL_CAPCANE : găsește capcana (alege fix-ul corect)
//  SQL_MATCH   : potrivește Access ↔ ANSI
//  Sursă: SQL_PRACTICE/00_README.md + cele 5 probleme.
// ============================================================
"use strict";

// ---------- 1) QUIZ grilă ----------
const SQL_QUIZ = [
  {id:"q1", tema:"NULL", tip:"grila", multi:false,
   enunt:"Care interogare afișează corect volumele <b>pierdute</b> (câmpul <code>Pierdut</code> conține o dată dacă volumul e pierdut)?",
   optiuni:["WHERE Pierdut &lt;&gt; null","WHERE Pierdut IS NOT NULL","WHERE Pierdut = null","WHERE NOT Pierdut = null"],
   corecte:[1],
   explicatie:"Comparația cu <code>null</code> prin <code>=</code>/<code>&lt;&gt;</code> dă mereu <code>UNKNOWN</code> (0 rânduri). Pentru „are valoare” se scrie obligatoriu <code>IS NOT NULL</code>."},

  {id:"q2", tema:"LIKE", tip:"grila", multi:false,
   enunt:"În dialectul <b>Access/Jet</b>, ce înseamnă <code>Nume LIKE 'Pop*'</code>?",
   optiuni:["Nume egal cu „Pop”","Nume care se termină cu „Pop”","Nume care începe cu „Pop”","Nume care conține „Pop” oriunde"],
   corecte:[2],
   explicatie:"<code>*</code> (Access) = orice șir, inclusiv vid, <b>după</b> prefix. Deci „începe cu Pop”: Popescu, Popa, Pop. Echivalent ANSI: <code>LIKE 'Pop%'</code>."},

  {id:"q3", tema:"LIKE", tip:"grila", multi:false,
   enunt:"Cum scrii „<b>conține</b> secvența «ana» oriunde în nume” în Access?",
   optiuni:["LIKE 'ana'","LIKE 'ana*'","LIKE '*ana'","LIKE '*ana*'"],
   corecte:[3],
   explicatie:"<code>*</code> de ambele părți = „conține”. <code>'ana*'</code> = începe cu; <code>'*ana'</code> = se termină cu; <code>'*ana*'</code> = conține."},

  {id:"q4", tema:"LIKE", tip:"grila", multi:false,
   enunt:"Ce potrivește <code>Nume LIKE '????u'</code> în Access?",
   optiuni:["Nume care se termină în „u”, de orice lungime","Nume de exact 5 caractere terminat în „u”","Nume de exact 4 caractere","Nume care încep cu „u”"],
   corecte:[1],
   explicatie:"Fiecare <code>?</code> = <b>exact un</b> caracter. Patru <code>?</code> + „u” = șir de fix 5 caractere, ultimul „u”. Echivalent ANSI: <code>'____u'</code>."},

  {id:"q5", tema:"GROUP BY", tip:"grila", multi:false,
   enunt:"Unde pui condiția „grupul are <b>cel puțin 3</b> rânduri”?",
   optiuni:["În WHERE: <code>WHERE Count(*) &gt;= 3</code>","În HAVING: <code>HAVING Count(*) &gt;= 3</code>","În ORDER BY","În SELECT"],
   corecte:[1],
   explicatie:"<code>WHERE</code> filtrează <b>rânduri</b> (înainte de agregare), <code>HAVING</code> filtrează <b>grupe</b> (după agregare). <code>WHERE Count(*)</code> e eroare de sintaxă."},

  {id:"q6", tema:"GROUP BY", tip:"grila", multi:false,
   enunt:"Care e ordinea logică <b>corectă</b> a clauzelor?",
   optiuni:["SELECT → WHERE → GROUP BY → HAVING → ORDER BY","WHERE → SELECT → ORDER BY → GROUP BY","HAVING → WHERE → GROUP BY → SELECT","GROUP BY → WHERE → HAVING → ORDER BY"],
   corecte:[0],
   explicatie:"Rețeta canonică: <code>SELECT ... FROM ... [JOIN] WHERE ... GROUP BY ... HAVING ... ORDER BY ...</code>. <code>WHERE</code> înainte de grupare, <code>HAVING</code> după."},

  {id:"q7", tema:"Date", tip:"grila", multi:false,
   enunt:"De ce e riscant <code>Data BETWEEN #2021-10-01# AND #2021-10-31#</code> pe un câmp <code>datetime</code>?",
   optiuni:["BETWEEN nu funcționează pe date","Ratează înregistrările din 31 oct. de după ora 00:00:00","Include și luna noiembrie","Nu e suportat în Access"],
   corecte:[1],
   explicatie:"<code>#2021-10-31#</code> = <code>2021-10-31 00:00:00</code>, deci orele de după miezul nopții pe 31 sunt pierdute. Robust: <code>Data &gt;= #2021-10-01# AND Data &lt; #2021-11-01#</code>."},

  {id:"q8", tema:"NULL", tip:"grila", multi:false,
   enunt:"De ce poate <code>NOT IN (subinterogare)</code> să întoarcă rezultat <b>vid</b> pe neașteptate?",
   optiuni:["Dacă subinterogarea întoarce prea multe rânduri","Dacă subinterogarea poate conține un <code>NULL</code>","Dacă tabela e goală","NOT IN nu e suportat de SQL Server"],
   corecte:[1],
   explicatie:"Cu un <code>NULL</code> în listă, <code>NOT IN</code> devine <code>UNKNOWN</code> pentru toate rândurile → 0 rezultate. Soluții robuste: <code>NOT EXISTS</code> sau <code>LEFT JOIN ... IS NULL</code>."},

  {id:"q9", tema:"Maxim", tip:"grila", multi:false,
   enunt:"Vrei <b>toate</b> țările aflate la egalitate pe primul loc ca număr de pasageri. Ce NU funcționează?",
   optiuni:["<code>TOP 1 ... ORDER BY COUNT(*) DESC</code>","<code>TOP 1 WITH TIES ... ORDER BY COUNT(*) DESC</code>","<code>HAVING Count(*) = (SELECT MAX(Nr) ...)</code>","Subinterogare cu MAX pe numărări"],
   corecte:[0],
   explicatie:"<code>TOP 1</code> simplu întoarce <b>o singură</b> țară chiar la egalitate (nedeterminist). Pentru egalități: <code>TOP 1 WITH TIES</code> sau <code>HAVING Count(*) = MAX</code>."},

  {id:"q10", tema:"JOIN", tip:"grila", multi:true,
   enunt:"Care afirmații despre „pasager fără nicio rezervare anulată” sunt corecte? (răspuns multiplu)",
   optiuni:["<code>NOT EXISTS</code> corelat rezolvă corect cuantificatorul „niciuna”","Un <code>JOIN</code> pe <code>Stare &lt;&gt; 'X'</code> poate da fals-pozitivi","<code>NOT EXISTS</code> include și pasagerii fără nicio rezervare","Trebuie folosit obligatoriu <code>TOP 1</code>"],
   corecte:[0,1,2],
   explicatie:"Un pasager cu o rezervare <code>'C'</code> și una <code>'X'</code> ar apărea prin join-ul pe <code>'C'</code> (greșit). <code>NOT EXISTS</code> e corect, dar include și pasagerii fără nicio rezervare (dublă negație)."},

  {id:"q11", tema:"Date", tip:"grila", multi:false,
   enunt:"Cum scrii literalul de dată în <b>Access/Jet</b> față de SQL Server?",
   optiuni:["Access: <code>'2021-01-31'</code> · SQL Server: <code>#2021-01-31#</code>","Access: <code>#2021-01-31#</code> · SQL Server: <code>'2021-01-31'</code>","Identic în ambele","Access nu suportă literali de dată"],
   corecte:[1],
   explicatie:"Access/Jet folosește <code>#...#</code>, iar ANSI/SQL Server folosește <code>'...'</code> (sau <code>DATE '...'</code>)."},

  {id:"q12", tema:"GROUP BY", tip:"grila", multi:false,
   enunt:"„Aceeași zi calendaristică” pentru un câmp <code>datetime</code> cu oră — cum grupezi corect?",
   optiuni:["<code>GROUP BY Data</code> (brut)","<code>GROUP BY Year(Data), Month(Data), Day(Data)</code> sau <code>CAST(Data AS date)</code>","<code>GROUP BY Day(Data)</code> doar","Nu se poate grupa pe dată"],
   corecte:[1],
   explicatie:"Pe <code>Data</code> brut, două înregistrări din aceeași zi la ore diferite cad în grupe diferite. Trunchiezi la zi (Year+Month+Day sau <code>CAST AS date</code>). Doar <code>Day</code> ar contopi 15 mar. cu 15 apr."}
];

// ---------- 2) CONSTRUIEȘTE INTEROGAREA (ordonează clauzele) ----------
// fiecare task: clauze[] în ordine corectă; jocul le amestecă și ceri reordonarea.
const SQL_BUILD = [
  {id:"b1", sarcina:"Împrumuturile onorate (<code>Stare='R'</code>) ale cititorilor de la facultatea „Automatică”.",
   clauze:[
     "SELECT Imprumuturi.*",
     "FROM Imprumuturi",
     "INNER JOIN Cititori ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor",
     "WHERE Cititori.Facultate = 'Automatica' AND Imprumuturi.Stare = 'R'"
   ]},
  {id:"b2", sarcina:"Nume, prenume și numărul de împrumuturi per cititor, descrescător.",
   clauze:[
     "SELECT Nume, Prenume, Count(Id_Imprumut) AS Nr",
     "FROM Cititori",
     "INNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor",
     "GROUP BY Imprumuturi.Id_Cititor, Nume, Prenume",
     "ORDER BY Count(Id_Imprumut) DESC"
   ]},
  {id:"b3", sarcina:"Clienți cu ≥2 comenzi finalizate (<code>'F'</code>), descrescător — rețeta WHERE→GROUP BY→HAVING→ORDER BY.",
   clauze:[
     "SELECT Nume, Prenume, Count(*) AS Nr",
     "FROM Clienti INNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client",
     "WHERE Comenzi_Service.Stare = 'F'",
     "GROUP BY Comenzi_Service.Id_Client, Nume, Prenume",
     "HAVING Count(*) >= 2",
     "ORDER BY Count(*) DESC"
   ]},
  {id:"b4", sarcina:"Valoarea totală comandată per client (SUM pe lanț triplu), descrescător.",
   clauze:[
     "SELECT Nume, Prenume, Sum(Pret_Unitar * Cantitate) AS Valoare",
     "FROM (Clienti INNER JOIN Comenzi ON Clienti.Id_Client = Comenzi.Id_Client)",
     "INNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda",
     "GROUP BY Comenzi.Id_Client, Nume, Prenume",
     "ORDER BY Sum(Pret_Unitar * Cantitate) DESC"
   ]},
  {id:"b5", sarcina:"Țările cu cel mai mare număr de pasageri, inclusiv la egalitate.",
   clauze:[
     "SELECT Tara",
     "FROM Pasageri",
     "GROUP BY Tara",
     "HAVING Count(*) = (SELECT Max(Nr) FROM (SELECT Count(*) AS Nr FROM Pasageri GROUP BY Tara) AS T)"
   ]}
];

// ---------- 3) GĂSEȘTE CAPCANA (alege fix-ul corect) ----------
const SQL_CAPCANE = [
  {id:"c1",
   gresit:"SELECT Cod_Bare FROM Volume\nWHERE Pierdut <> null;",
   intrebare:"Interogarea ar trebui să listeze volumele pierdute, dar întoarce mereu 0 rânduri. Care e fix-ul corect?",
   optiuni:["WHERE Pierdut IS NOT NULL","WHERE Pierdut != null","WHERE Pierdut NOT NULL","WHERE NOT (Pierdut = null)"],
   corect:0,
   explicatie:"Orice comparație cu <code>null</code> prin operatori (<code>&lt;&gt;</code>, <code>!=</code>, <code>=</code>) dă <code>UNKNOWN</code>. Corect: <code>IS NOT NULL</code>."},

  {id:"c2",
   gresit:"SELECT Count(*) FROM Imprumuturi\nWHERE Data BETWEEN #2021-10-01# AND #2021-10-31#;",
   intrebare:"Vrei toate împrumuturile din octombrie 2021, dar lipsesc unele de pe 31 oct. Cum corectezi intervalul?",
   optiuni:["WHERE Data >= #2021-10-01# AND Data < #2021-11-01#","WHERE Data BETWEEN #2021-10-01# AND #2021-10-32#","WHERE Year(Data)=2021","WHERE Data <= #2021-10-31#"],
   corect:0,
   explicatie:"<code>#2021-10-31#</code> = ora 00:00:00, deci ratează orele de pe 31 oct. Robust: limită inferioară inclusivă, superioară exclusivă pe prima zi a lunii următoare."},

  {id:"c3",
   gresit:"SELECT Cod_Bare FROM Volume\nWHERE Id_Imprumut NOT IN (SELECT Id_Imprumut FROM Imprumuturi);",
   intrebare:"Subinterogarea poate conține <code>NULL</code> și interogarea iese vidă. Care variantă e robustă?",
   optiuni:["NOT EXISTS (SELECT 1 FROM Imprumuturi I WHERE I.Id_Imprumut = V.Id_Imprumut)","NOT IN cu DISTINCT","IN în loc de NOT IN","Adaugi TOP 1"],
   corect:0,
   explicatie:"Cu un <code>NULL</code> în listă, <code>NOT IN</code> devine <code>UNKNOWN</code> → 0 rezultate. <code>NOT EXISTS</code> (sau <code>LEFT JOIN ... IS NULL</code>) tratează corect <code>NULL</code>-urile."},

  {id:"c4",
   gresit:"SELECT Nume FROM Clienti\nINNER JOIN Comenzi_Service ON ...\nWHERE Count(*) >= 2\nGROUP BY Id_Client, Nume;",
   intrebare:"Interogarea dă eroare de sintaxă. Unde trebuie mutată condiția pe numărare?",
   optiuni:["În HAVING, după GROUP BY: <code>HAVING Count(*) >= 2</code>","Rămâne în WHERE","În SELECT","În ORDER BY"],
   corect:0,
   explicatie:"Funcțiile de agregare nu se pot folosi în <code>WHERE</code> (evaluat înainte de grupare). Condiția pe grup merge în <code>HAVING</code>, după <code>GROUP BY</code>."},

  {id:"c5",
   gresit:"-- clienti cu TOATE comenzile finalizate:\nNOT EXISTS (SELECT 1 FROM Comenzi_Service S\n            WHERE S.Id_Client = C.Id_Client AND S.Stare <> 'F');",
   intrebare:"Condiția ratează comenzile cu <code>Stare IS NULL</code> (în lucru). Cum o scrii corect?",
   optiuni:["AND (S.Stare IS NULL OR S.Stare = 'R')","AND S.Stare <> 'F'","AND S.Stare = 'F'","AND S.Stare NOT IN ('F')"],
   corect:0,
   explicatie:"<code>NULL &lt;&gt; 'F'</code> dă <code>UNKNOWN</code>, nu <code>TRUE</code>, deci comenzile în lucru (NULL) scapă. Le prinzi explicit: <code>S.Stare IS NULL OR S.Stare = 'R'</code>."},

  {id:"c6",
   gresit:"SELECT Prenume FROM Clienti\nWHERE Oras = 'Iasi' AND Nume LIKE '*escu' OR Nume LIKE '*eanu';",
   intrebare:"Filtrul pe oraș „se pierde” pentru numele în „eanu”. Care e cauza/fix-ul?",
   optiuni:["Lipsesc paranteze: <code>... AND (Nume LIKE '*escu' OR Nume LIKE '*eanu')</code>","Trebuie două WHERE","OR nu e suportat în Access","Trebuie UNION"],
   corect:0,
   explicatie:"<code>AND</code> are prioritate față de <code>OR</code>, deci condiția devine „(Iasi ȘI escu) SAU eanu”. Pune <code>OR</code>-ul în paranteze ca să se aplice ambelor sufixe împreună cu filtrul de oraș."}
];

// ---------- 4) POTRIVEȘTE Access ↔ ANSI ----------
const SQL_MATCH = [
  {access:"*",            ansi:"%",                       nota:"„orice șir” în LIKE"},
  {access:"?",            ansi:"_",                       nota:"„exact un caracter” în LIKE"},
  {access:"#2021-01-31#", ansi:"'2021-01-31'",            nota:"literal de dată"},
  {access:"Year(Data)",   ansi:"EXTRACT(YEAR FROM Data)", nota:"anul dintr-o dată"},
  {access:"Mid(s, n, 1)", ansi:"SUBSTRING(s, n, 1)",      nota:"al n-lea caracter"},
  {access:"&",            ansi:"CONCAT()",                nota:"concatenare de șiruri"},
  {access:"TOP n",        ansi:"LIMIT n",                 nota:"primele n rânduri (MySQL/Postgres)"}
];
