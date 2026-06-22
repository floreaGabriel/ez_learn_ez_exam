// ============================================================
//  SQL Trainer — cele 5 scenarii rezolvate (Subiectul III, stil ATM 2021)
//  Sursă: SQL_PRACTICE/ (bibliotecă, clinică, magazin, companie aeriană, service auto)
//  Fiecare scenariu: 3 tabele 1—N—N, 2 câmpuri NULL cu semantică, 9 cerințe (a–i)
//  cu rezolvare completă (dialect Access/Jet + echivalent ANSI/SQL Server + capcane).
// ============================================================
"use strict";

const SQL_SCENARII = [
// ============================== 1. BIBLIOTECĂ ==============================
{
  id:"biblioteca", nume:"Bibliotecă universitară", icon:"📚",
  nivel:"Calibrat 1:1 pe Subiectul III / 2021. Dacă stăpânești această problemă, ai acoperit integral tiparul examenului.",
  rezumat:"Prefix LIKE, grupare pe lună, integritate referențială — nivelul exact al examenului.",
  intro:"Fie tabelele <code>Cititori</code>, <code>Imprumuturi</code> și <code>Volume</code>, în care sunt păstrate informații despre cititorii unei biblioteci universitare, cererile de împrumut și volumele (exemplarele fizice) eliberate.",
  tabele:[
    {nume:"Cititori", campuri:[
      ["Id_Cititor (PK)","nu","int"],["Nume","nu","varchar(50)"],
      ["Prenume","nu","varchar(50)"],["Facultate","nu","varchar(50)"]]},
    {nume:"Imprumuturi", campuri:[
      ["Id_Imprumut (PK)","nu","int"],["Id_Cititor (FK)","nu","int"],
      ["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Volume", campuri:[
      ["Id_Volum (PK)","nu","int"],["Id_Imprumut (FK)","nu","int"],
      ["Cod_Bare","nu","varchar(10)"],["Disponibil_De_La","nu","datetime"],
      ["Termen_Returnare","nu","datetime"],["Pierdut","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei cereri de împrumut are valoarea <code>null</code> la creare, <code>R</code> după ce volumele au fost eliberate cititorului (cerere onorată), sau <code>A</code> dacă cererea a fost anulată înainte de ridicare.",
    "Câmpul <code>Pierdut</code> are valoarea <code>null</code> dacă volumul este integru (poate fi folosit/returnat), sau conține <b>data</b> la care volumul a fost declarat pierdut."
  ],
  relatii:"<code>Cititori 1—N Imprumuturi 1—N Volume</code>. Un cititor face mai multe cereri; o cerere onorată produce unul sau mai multe volume eliberate. Cele două câmpuri cu <code>null</code> (<code>Stare</code>, <code>Pierdut</code>) concentrează majoritatea „capcanelor”.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> cititorilor al căror <b>nume începe</b> cu „Pop”.",
     sql:"SELECT Prenume FROM Cititori WHERE Nume LIKE 'Pop*';",
     ansi:"SELECT Prenume FROM Cititori WHERE Nume LIKE 'Pop%';",
     note:"<b>Explicație:</b> <code>*</code> = orice șir (inclusiv vid) <b>după</b> prefixul „Pop”. Aici cerem un <b>prefix</b>, deci wildcard-ul stă la <b>dreapta</b>. <b>Capcană:</b> <code>'Pop*'</code> prinde „Popescu”, „Popa”, „Pop”, „Popovici”; pentru exact „Pop” folosești <code>WHERE Nume = 'Pop'</code>."},
    {lit:"b", enunt:"Afișează <b>codurile de bare</b> ale volumelor declarate <b>pierdute</b>.",
     sql:"SELECT Cod_Bare FROM Volume WHERE Pierdut IS NOT NULL;",
     note:"<b>Explicație:</b> <code>Pierdut = null</code> înseamnă „integru”, deci un volum <b>pierdut</b> are o <b>dată</b> în câmp → <code>IS NOT NULL</code>. <b>Capcană clasică:</b> nu se scrie <code>Pierdut &lt;&gt; null</code> (comparația cu <code>null</code> dă mereu <code>UNKNOWN</code>). Obligatoriu <code>IS [NOT] NULL</code>."},
    {lit:"c", enunt:"Afișează <b>facultatea</b> cu cel mai mare număr de cititori.",
     sql:"SELECT TOP 1 Facultate FROM Cititori\nGROUP BY Facultate\nORDER BY Count(*) DESC;",
     ansi:"-- MySQL/PostgreSQL:\nSELECT Facultate FROM Cititori GROUP BY Facultate ORDER BY COUNT(*) DESC LIMIT 1;",
     note:"<b>Explicație:</b> grupăm pe facultate, numărăm cititorii, ordonăm descrescător, luăm prima. <b>Capcană (egalitate la maxim):</b> dacă două facultăți au același maxim, <code>TOP 1</code> întoarce <b>una singură</b> (nedeterminist). Pentru toate egalitățile: <code>TOP 1 WITH TIES</code> sau <code>HAVING COUNT(*) = (SELECT MAX(...))</code> — vezi Problema 4c."},
    {lit:"d", enunt:"Afișează <b>împrumuturile onorate</b> făcute de cititorii de la facultatea „Automatică”.",
     sql:"SELECT Imprumuturi.* FROM Imprumuturi\nINNER JOIN Cititori ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nWHERE Cititori.Facultate = 'Automatica' AND Imprumuturi.Stare = 'R';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> leagă fiecare împrumut de cititor; filtrăm pe facultate și pe starea <code>'R'</code> (onorat). <b>Atenție la NULL:</b> <code>Stare = 'R'</code> exclude automat cererile <code>NULL</code> (în procesare) și <code>'A'</code> (anulate) — exact ce vrem."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de împrumuturi</b> per cititor, descrescător.",
     sql:"SELECT Nume, Prenume, Count(Id_Imprumut) AS Nr_Imprumuturi\nFROM Cititori\nINNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nGROUP BY Imprumuturi.Id_Cititor, Nume, Prenume\nORDER BY Count(Id_Imprumut) DESC;",
     note:"<b>De ce <code>Id_Cititor</code> în <code>GROUP BY</code>:</b> ca să distingem doi cititori <b>omonimi</b>. <code>Nume, Prenume</code> apar în <code>GROUP BY</code> doar ca să poată fi afișate (orice coloană neagregată din <code>SELECT</code> trebuie să fie în <code>GROUP BY</code>). <b>Observație:</b> cu <code>INNER JOIN</code>, cititorii fără niciun împrumut nu apar; pentru „0 împrumuturi” treci la <code>LEFT JOIN</code>."},
    {lit:"f", enunt:"Afișează <b>numărul de împrumuturi onorate</b> din 01.10.2021–31.10.2021 pentru care <b>prima cifră</b> a codului de bare al unui volum asociat este <b>nenulă</b>.",
     sql:"SELECT Count(*) FROM Imprumuturi\nINNER JOIN Volume ON Imprumuturi.Id_Imprumut = Volume.Id_Imprumut\nWHERE Imprumuturi.Stare = 'R'\n  AND (Imprumuturi.Data >= #2021-10-01# AND Imprumuturi.Data < #2021-11-01#)\n  AND Volume.Cod_Bare LIKE '[1-9]*';",
     ansi:"... AND Cod_Bare LIKE '[1-9]%'   -- SQL Server\n-- portabil 100%:\n... AND SUBSTRING(Cod_Bare, 1, 1) BETWEEN '1' AND '9'",
     note:"<b>Pe bucăți:</b> <code>Stare = 'R'</code> (onorate); <code>Data &gt;= #2021-10-01# AND Data &lt; #2021-11-01#</code> — am evitat intenționat <code>BETWEEN ... #2021-10-31#</code>, care ar rata orele din 31 oct. de după 00:00:00; <code>Cod_Bare LIKE '[1-9]*'</code> → prima cifră ∈ {1..9} (nenulă), restul liber."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> cititorilor cu <b>minimum trei împrumuturi în aceeași lună</b> (fiecare o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Cititori\nINNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nGROUP BY Imprumuturi.Id_Cititor, Year(Data), Month(Data), Nume, Prenume\nHAVING Count(*) >= 3;",
     note:"<b>Explicație:</b> gruparea pe <code>Id_Cititor, Year(Data), Month(Data)</code> creează câte o grupă per (cititor, lună-din-an). Includem <code>Year</code> <b>și</b> <code>Month</code>, altfel „aceeași lună” din ani diferiți s-ar contopi greșit. <code>HAVING Count(*) &gt;= 3</code> + <code>DISTINCT</code> (un cititor care îndeplinește condiția în mai multe luni ar apărea altfel de mai multe ori)."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codurile de bare</b> ale cititorilor cu cel puțin un volum <b>nepierdut</b> al cărui <b>termen de returnare</b> e înainte de 30 noiembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Bare\nFROM (Cititori\n     INNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor)\n     INNER JOIN Volume      ON Imprumuturi.Id_Imprumut = Volume.Id_Imprumut\nWHERE Volume.Pierdut IS NULL\n  AND Volume.Termen_Returnare < #2021-11-30#;",
     ansi:"FROM Cititori\nINNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nINNER JOIN Volume      ON Imprumuturi.Id_Imprumut = Volume.Id_Imprumut\nWHERE Volume.Pierdut IS NULL AND Volume.Termen_Returnare < '2021-11-30';",
     note:"<b>Explicație:</b> dublu <code>INNER JOIN</code> pe lanțul <code>Cititori → Imprumuturi → Volume</code>; <code>Pierdut IS NULL</code> = nepierdut, <code>Termen_Returnare &lt; #2021-11-30#</code> = scadent înainte. <b>Capcană de sintaxă Access:</b> la 2+ join-uri, Access cere <b>paranteze</b> în jurul join-urilor imbricate; SQL Server/MySQL nu le cer."},
    {lit:"i", enunt:"Afișează <b>codurile de bare</b> pentru volumele <b>„orfane”</b> (volume pentru care a fost ștearsă cererea de împrumut corespunzătoare).",
     sql:"SELECT Cod_Bare FROM Volume\nWHERE Id_Imprumut NOT IN (SELECT Id_Imprumut FROM Imprumuturi);",
     ansi:"-- NOT EXISTS (preferată):\nSELECT Cod_Bare FROM Volume V\nWHERE NOT EXISTS (SELECT 1 FROM Imprumuturi I WHERE I.Id_Imprumut = V.Id_Imprumut);\n\n-- LEFT JOIN ... IS NULL:\nSELECT V.Cod_Bare FROM Volume V\nLEFT JOIN Imprumuturi I ON V.Id_Imprumut = I.Id_Imprumut\nWHERE I.Id_Imprumut IS NULL;",
     note:"<b>Raționament (proiectare):</b> <code>Volume.Id_Imprumut</code> e FK obligatoriu (<code>null = nu</code>); integritatea referențială <b>nu permite</b> volume orfane în acest design. Interogarea de mai sus rezolvă cerința <i>dacă</i> BD ar permite orfani. <b>Capcană <code>NOT IN</code> + <code>NULL</code>:</b> dacă subinterogarea poate conține <code>NULL</code>, <code>NOT IN</code> întoarce vid → preferă <code>NOT EXISTS</code> sau <code>LEFT JOIN ... IS NULL</code>."}
  ],
  anexa:"CREATE TABLE Cititori (\n    Id_Cititor INT PRIMARY KEY,\n    Nume       VARCHAR(50) NOT NULL,\n    Prenume    VARCHAR(50) NOT NULL,\n    Facultate  VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Imprumuturi (\n    Id_Imprumut INT PRIMARY KEY,\n    Id_Cititor  INT NOT NULL,\n    Data        DATETIME NOT NULL,\n    Stare       CHAR(1) NULL,                 -- NULL / 'R' / 'A'\n    FOREIGN KEY (Id_Cititor) REFERENCES Cititori(Id_Cititor)\n);\n\nCREATE TABLE Volume (\n    Id_Volum         INT PRIMARY KEY,\n    Id_Imprumut      INT NOT NULL,\n    Cod_Bare         VARCHAR(10) NOT NULL,\n    Disponibil_De_La DATETIME NOT NULL,\n    Termen_Returnare DATETIME NOT NULL,\n    Pierdut          DATETIME NULL,           -- NULL = integru\n    FOREIGN KEY (Id_Imprumut) REFERENCES Imprumuturi(Id_Imprumut)\n);\n\nINSERT INTO Cititori VALUES\n (1,'Popescu','Andrei','Automatica'),\n (2,'Pop','Maria','Automatica'),\n (3,'Ionescu','Vlad','Electronica'),\n (4,'Popa','Elena','Automatica'),\n (5,'Georgescu','Radu','Mecanica');\n\nINSERT INTO Imprumuturi VALUES\n (10,1,'2021-10-03','R'),\n (11,1,'2021-10-19','R'),\n (12,1,'2021-10-28','R'),     -- Popescu: 3 imprumuturi in oct. 2021 -> cerinta g\n (13,2,'2021-09-15','R'),\n (14,3,'2021-10-10',NULL),    -- in procesare\n (15,4,'2021-11-02','A'),     -- anulat\n (16,1,'2021-05-04','R');\n\nINSERT INTO Volume VALUES\n (100,10,'1234567890','2021-10-03','2021-10-31',NULL),\n (101,11,'0567812345','2021-10-19','2021-11-19',NULL),   -- prima cifra 0 -> exclus la f\n (102,12,'9001234567','2021-10-28','2021-11-28',NULL),\n (103,13,'7777000011','2021-09-15','2021-10-15','2021-10-20'),  -- pierdut\n (104,16,'2222333344','2021-05-04','2021-11-29',NULL);"
},

// ============================== 2. CLINICĂ MEDICALĂ ==============================
{
  id:"clinica", nume:"Clinică medicală", icon:"🩺",
  nivel:"Examen. Tehnici noi: LIKE '*...*' (conține), grupare pe zi calendaristică, clase de cifre pare, COUNT filtrat.",
  rezumat:"„Conține” cu LIKE, grupare pe zi (CAST AS date), clasă de cifre pare [02468].",
  intro:"Fie tabelele <code>Pacienti</code>, <code>Programari</code> și <code>Retete</code>, în care sunt păstrate informații despre pacienții unei clinici medicale, programările la consultație și rețetele emise.",
  tabele:[
    {nume:"Pacienti", campuri:[
      ["Id_Pacient (PK)","nu","int"],["Nume","nu","varchar(50)"],
      ["Prenume","nu","varchar(50)"],["Oras","nu","varchar(50)"]]},
    {nume:"Programari", campuri:[
      ["Id_Programare (PK)","nu","int"],["Id_Pacient (FK)","nu","int"],
      ["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Retete", campuri:[
      ["Id_Reteta (PK)","nu","int"],["Id_Programare (FK)","nu","int"],
      ["Cod_Reteta","nu","varchar(10)"],["Valabila_De_La","nu","datetime"],
      ["Valabila_Pana_La","nu","datetime"],["Onorata","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei programări are valoarea <code>null</code> la creare (planificată), <code>E</code> după ce consultația a fost <b>efectuată</b> (s-a emis rețetă), sau <code>A</code> dacă a fost <b>anulată</b>.",
    "Câmpul <code>Onorata</code> are valoarea <code>null</code> dacă rețeta nu a fost încă ridicată de la farmacie, sau conține <b>data</b> la care a fost onorată (ridicată)."
  ],
  relatii:"<code>Pacienti 1—N Programari 1—N Retete</code>. Un pacient are mai multe programări; o programare efectuată poate genera una sau mai multe rețete.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> pacienților al căror <b>nume conține</b> secvența „ana” (oriunde).",
     sql:"SELECT Prenume FROM Pacienti WHERE Nume LIKE '*ana*';",
     ansi:"SELECT Prenume FROM Pacienti WHERE Nume LIKE '%ana%';",
     note:"<b>Explicație:</b> <code>*</code> de <b>ambele</b> părți = „conține oriunde”. Prinde „M<b>ana</b>stireanu”, „St<b>ana</b>”, „<b>Ana</b>stasiu”. <b>Cele 3 forme:</b> <code>'ana*'</code> = începe cu; <code>'*ana'</code> = se termină cu; <code>'*ana*'</code> = conține."},
    {lit:"b", enunt:"Afișează <b>codurile rețetelor</b> deja <b>onorate</b> (ridicate de la farmacie).",
     sql:"SELECT Cod_Reteta FROM Retete WHERE Onorata IS NOT NULL;",
     note:"<b>Explicație:</b> <code>Onorata = null</code> ⇒ „neridicată”; deci o rețetă <b>onorată</b> are o <b>dată</b> → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>orașul</b> cu cel mai mare număr de pacienți.",
     sql:"SELECT TOP 1 Oras FROM Pacienti\nGROUP BY Oras\nORDER BY Count(*) DESC;",
     ansi:"-- MySQL/Postgres:\n... ORDER BY COUNT(*) DESC LIMIT 1;",
     note:"<b>Explicație:</b> grupare pe oraș + numărare + ordonare descrescătoare, prima înregistrare."},
    {lit:"d", enunt:"Afișează <b>programările efectuate</b> ale pacienților din „Cluj-Napoca”.",
     sql:"SELECT Programari.* FROM Programari\nINNER JOIN Pacienti ON Pacienti.Id_Pacient = Programari.Id_Pacient\nWHERE Pacienti.Oras = 'Cluj-Napoca' AND Programari.Stare = 'E';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru pe oraș + <code>Stare = 'E'</code> (efectuată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de programări</b> per pacient, descrescător.",
     sql:"SELECT Nume, Prenume, Count(Id_Programare) AS Nr_Programari\nFROM Pacienti\nINNER JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient\nGROUP BY Programari.Id_Pacient, Nume, Prenume\nORDER BY Count(Id_Programare) DESC;",
     note:"<b>Explicație:</b> grupare pe pacient + numărare + ordonare. <code>Id_Pacient</code> în <code>GROUP BY</code> separă omonimii."},
    {lit:"f", enunt:"Afișează <b>numărul de programări efectuate</b> din 01.03.2021–31.03.2021 pentru care <b>ultima cifră</b> a codului rețetei e <b>pară</b>.",
     sql:"SELECT Count(*) FROM Programari\nINNER JOIN Retete ON Programari.Id_Programare = Retete.Id_Programare\nWHERE Programari.Stare = 'E'\n  AND (Programari.Data >= #2021-03-01# AND Programari.Data < #2021-04-01#)\n  AND Retete.Cod_Reteta LIKE '*[02468]';",
     ansi:"... AND CAST(RIGHT(Cod_Reteta, 1) AS INT) % 2 = 0\n-- sau:  RIGHT(Cod_Reteta,1) IN ('0','2','4','6','8')",
     note:"<b>Explicație:</b> <code>Stare = 'E'</code>; interval martie 2021 robust (<code>&gt;= 01.03</code> și <code>&lt; 01.04</code>); <code>Cod_Reteta LIKE '*[02468]'</code> → <code>*</code> = orice început, iar <code>[02468]</code> impune ca <b>ultimul</b> caracter să fie cifră pară. <b>Capcană:</b> în Access ai putea folosi și <code>Mid(Cod_Reteta, Len(Cod_Reteta), 1)</code>, dar <code>[02468]</code> e mai elegant."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> pacienților cu <b>minimum două programări în aceeași zi</b> (fiecare o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Pacienti\nINNER JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient\nGROUP BY Programari.Id_Pacient, Year(Data), Month(Data), Day(Data), Nume, Prenume\nHAVING Count(*) >= 2;",
     ansi:"SELECT DISTINCT Nume, Prenume\nFROM Pacienti P JOIN Programari Pr ON P.Id_Pacient = Pr.Id_Pacient\nGROUP BY Pr.Id_Pacient, CAST(Pr.Data AS date), Nume, Prenume\nHAVING COUNT(*) >= 2;",
     note:"<b>Explicație:</b> „aceeași zi” = aceeași combinație (an, lună, zi) — grupăm pe toate trei, nu doar pe <code>Day</code>, ca să nu contopim 15 martie cu 15 aprilie. <b>Capcană:</b> dacă ai grupa pe <code>Data</code> brut (cu oră), două programări din aceeași zi la <b>ore diferite</b> ar cădea în grupe diferite → trunchiezi la zi."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codurile rețetelor</b> pacienților cu cel puțin o rețetă <b>neonorată</b> care <b>expiră înainte</b> de 31 decembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Reteta\nFROM (Pacienti\n     INNER JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient)\n     INNER JOIN Retete     ON Programari.Id_Programare = Retete.Id_Programare\nWHERE Retete.Onorata IS NULL\n  AND Retete.Valabila_Pana_La < #2021-12-31#;",
     note:"<b>Explicație:</b> lanț <code>Pacienti → Programari → Retete</code>; <code>Onorata IS NULL</code> = neonorată, <code>Valabila_Pana_La &lt; #2021-12-31#</code> = expiră înainte. Parantezele sunt obligatorii în Access."},
    {lit:"i", enunt:"Afișează <b>codurile rețetelor „orfane”</b> (rețete pentru care a fost ștearsă programarea corespunzătoare).",
     sql:"SELECT Cod_Reteta FROM Retete R\nWHERE NOT EXISTS (SELECT 1 FROM Programari P WHERE P.Id_Programare = R.Id_Programare);",
     ansi:"SELECT R.Cod_Reteta FROM Retete R\nLEFT JOIN Programari P ON R.Id_Programare = P.Id_Programare\nWHERE P.Id_Programare IS NULL;",
     note:"<b>Raționament:</b> <code>Retete.Id_Programare</code> e FK obligatoriu → integritatea referențială nu permite rețete fără programare. <b>De ce <code>NOT EXISTS</code> și nu <code>NOT IN</code>:</b> dacă subinterogarea ar putea conține <code>NULL</code>, <code>NOT IN</code> întoarce rezultat <b>vid</b>; <code>NOT EXISTS</code> se comportă corect indiferent de <code>NULL</code>-uri."}
  ],
  anexa:"CREATE TABLE Pacienti (\n    Id_Pacient INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Oras    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Programari (\n    Id_Programare INT PRIMARY KEY,\n    Id_Pacient    INT NOT NULL,\n    Data          DATETIME NOT NULL,\n    Stare         CHAR(1) NULL,              -- NULL / 'E' / 'A'\n    FOREIGN KEY (Id_Pacient) REFERENCES Pacienti(Id_Pacient)\n);\n\nCREATE TABLE Retete (\n    Id_Reteta        INT PRIMARY KEY,\n    Id_Programare    INT NOT NULL,\n    Cod_Reteta       VARCHAR(10) NOT NULL,\n    Valabila_De_La   DATETIME NOT NULL,\n    Valabila_Pana_La DATETIME NOT NULL,\n    Onorata          DATETIME NULL,          -- NULL = neridicata\n    FOREIGN KEY (Id_Programare) REFERENCES Programari(Id_Programare)\n);\n\nINSERT INTO Pacienti VALUES\n (1,'Anastasiu','Ioana','Cluj-Napoca'),\n (2,'Stana','Mihai','Cluj-Napoca'),\n (3,'Catana','Ana','Bucuresti'),\n (4,'Popescu','Dan','Cluj-Napoca');\n\nINSERT INTO Programari VALUES\n (10,1,'2021-03-05 09:00','E'),\n (11,1,'2021-03-05 15:30','E'),   -- 2 in aceeasi zi -> cerinta g\n (12,2,'2021-03-20 10:00','E'),\n (13,2,'2021-04-20 10:00','A'),\n (14,3,'2021-03-31 18:00','E'),   -- 31 martie, prins de intervalul corect\n (15,4,'2021-02-11 08:00',NULL);\n\nINSERT INTO Retete VALUES\n (100,10,'AB123450','2021-03-05','2021-09-05','2021-03-10'),  -- ultima cifra 0 (para), onorata\n (101,11,'AB123457','2021-03-05','2021-09-05',NULL),          -- ultima cifra 7 (impara)\n (102,12,'CD000012','2021-03-20','2021-11-30',NULL),          -- ultima cifra 2 (para), neonorata\n (103,14,'EF555558','2021-03-31','2022-03-31',NULL);          -- ultima cifra 8 (para)"
},

// ============================== 3. MAGAZIN ONLINE ==============================
{
  id:"magazin", nume:"Magazin online", icon:"🛒",
  nivel:"Examen+. Tehnici noi: agregare numerică SUM/AVG cu expresii, BETWEEN numeric, OR de LIKE, COUNT cu filtre combinate.",
  rezumat:"SUM(Pret*Cant) pe lanț triplu, BETWEEN numeric, OR de sufixe LIKE.",
  intro:"Fie tabelele <code>Clienti</code>, <code>Comenzi</code> și <code>Produse_Comandate</code>, în care sunt păstrate informații despre clienții unui magazin online, comenzile plasate și liniile de comandă (produsele dintr-o comandă).",
  tabele:[
    {nume:"Clienti", campuri:[
      ["Id_Client (PK)","nu","int"],["Nume","nu","varchar(50)"],
      ["Prenume","nu","varchar(50)"],["Oras","nu","varchar(50)"]]},
    {nume:"Comenzi", campuri:[
      ["Id_Comanda (PK)","nu","int"],["Id_Client (FK)","nu","int"],
      ["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Produse_Comandate", campuri:[
      ["Id_Linie (PK)","nu","int"],["Id_Comanda (FK)","nu","int"],
      ["Cod_Produs","nu","varchar(10)"],["Pret_Unitar","nu","decimal(10,2)"],
      ["Cantitate","nu","int"],["Returnat","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei comenzi are valoarea <code>null</code> la plasare (în așteptare), <code>L</code> după ce comanda a fost <b>livrată</b>, sau <code>A</code> dacă a fost <b>anulată</b>.",
    "Câmpul <code>Returnat</code> are valoarea <code>null</code> dacă produsul <b>nu</b> a fost returnat, sau conține <b>data</b> returnării.",
    "Valoarea unei linii de comandă = <code>Pret_Unitar * Cantitate</code>."
  ],
  relatii:"<code>Clienti 1—N Comenzi 1—N Produse_Comandate</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> clienților al căror nume se termină în „escu” <b>sau</b> în „eanu”.",
     sql:"SELECT Prenume FROM Clienti\nWHERE Nume LIKE '*escu' OR Nume LIKE '*eanu';",
     ansi:"SELECT Prenume FROM Clienti WHERE Nume LIKE '%escu' OR Nume LIKE '%eanu';",
     note:"<b>Explicație:</b> două potriviri de <b>sufix</b> unite prin <code>OR</code>. Prinde „Popescu”, „Ionescu”, dar și „Munteanu”, „Olteanu”. <b>Capcană de precedență:</b> dacă adaugi alt filtru, pune <code>OR</code>-ul în paranteze: <code>WHERE Oras='Iasi' AND (Nume LIKE '*escu' OR Nume LIKE '*eanu')</code>. Fără paranteze, <code>AND</code> are prioritate și schimbă logica."},
    {lit:"b", enunt:"Afișează <b>codurile produselor</b> care au fost <b>returnate</b>.",
     sql:"SELECT Cod_Produs FROM Produse_Comandate WHERE Returnat IS NOT NULL;",
     note:"<b>Explicație:</b> produs returnat ⇒ are <b>data</b> returnării → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>orașul</b> cu cel mai mare număr de clienți.",
     sql:"SELECT TOP 1 Oras FROM Clienti\nGROUP BY Oras\nORDER BY Count(*) DESC;",
     note:"<b>Explicație:</b> grupare pe oraș + ordonare descrescătoare + prima înregistrare."},
    {lit:"d", enunt:"Afișează <b>comenzile livrate</b> ale clienților din „Iași”.",
     sql:"SELECT Comenzi.* FROM Comenzi\nINNER JOIN Clienti ON Clienti.Id_Client = Comenzi.Id_Client\nWHERE Clienti.Oras = 'Iasi' AND Comenzi.Stare = 'L';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru oraș + <code>Stare = 'L'</code> (livrată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>valoarea totală comandată</b> de fiecare client (suma <code>Pret_Unitar * Cantitate</code> pe toate liniile sale), descrescător.",
     sql:"SELECT Nume, Prenume, Sum(Pret_Unitar * Cantitate) AS Valoare_Totala\nFROM (Clienti\n     INNER JOIN Comenzi           ON Clienti.Id_Client = Comenzi.Id_Client)\n     INNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda\nGROUP BY Comenzi.Id_Client, Nume, Prenume\nORDER BY Sum(Pret_Unitar * Cantitate) DESC;",
     note:"<b>Escaladare:</b> aici nu mai numărăm rânduri, ci <b>însumăm o expresie</b> (<code>Pret_Unitar * Cantitate</code>) — agregare numerică reală pe lanț <b>triplu</b>. <b>Capcană:</b> pentru doar comenzile livrate, adaugi <code>WHERE Comenzi.Stare = 'L'</code> înainte de <code>GROUP BY</code>. <b>NULL la SUM:</b> <code>SUM</code> ignoră <code>NULL</code>-urile."},
    {lit:"f", enunt:"Afișează <b>numărul de produse din comenzi livrate</b> din 01.11.2021–30.11.2021, cu <b>preț unitar între 100 și 500 lei</b> și al căror cod are cifra „7” pe <b>poziția a doua</b>.",
     sql:"SELECT Count(*) FROM Comenzi\nINNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda\nWHERE Comenzi.Stare = 'L'\n  AND (Comenzi.Data >= #2021-11-01# AND Comenzi.Data < #2021-12-01#)\n  AND Produse_Comandate.Pret_Unitar BETWEEN 100 AND 500\n  AND Produse_Comandate.Cod_Produs LIKE '?7*';",
     ansi:"... AND Cod_Produs LIKE '_7%'    -- '_' = un caracter, '%' = orice sir\n-- portabil: SUBSTRING(Cod_Produs, 2, 1) = '7'",
     note:"<b>Pe filtre:</b> <code>Stare = 'L'</code>; interval noiembrie 2021 robust; <code>Pret_Unitar BETWEEN 100 AND 500</code> — pe <b>numere</b> <code>BETWEEN</code> e inclusiv la ambele capete și <b>nu</b> are capcana „orei” (ca la datetime); <code>Cod_Produs LIKE '?7*'</code> → <code>?</code> = exact un caracter (poziția 1), <code>7</code> = poziția 2 fixată, <code>*</code> = restul liber."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> clienților cu <b>minimum două comenzi în aceeași lună a aceluiași an</b> (un client o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Clienti\nINNER JOIN Comenzi ON Clienti.Id_Client = Comenzi.Id_Client\nGROUP BY Comenzi.Id_Client, Year(Data), Month(Data), Nume, Prenume\nHAVING Count(*) >= 2;",
     note:"<b>Explicație:</b> grupare pe (client, an, lună); <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>. Includem <b>și</b> <code>Year</code>, <b>și</b> <code>Month</code>, ca să nu confundăm noiembrie 2020 cu noiembrie 2021."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul produsului</b> clienților cu cel puțin un produs <b>nereturnat</b> dintr-o comandă <b>livrată după</b> 30 iunie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Produs\nFROM (Clienti\n     INNER JOIN Comenzi           ON Clienti.Id_Client = Comenzi.Id_Client)\n     INNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda\nWHERE Produse_Comandate.Returnat IS NULL\n  AND Comenzi.Stare = 'L'\n  AND Comenzi.Data > #2021-06-30#;",
     note:"<b>Explicație:</b> trei filtre simultane pe lanțul triplu: produs <b>nereturnat</b> (<code>IS NULL</code>), comandă <b>livrată</b> (<code>Stare='L'</code>), plasată <b>după</b> 30 iunie 2021 (<code>Data &gt; #2021-06-30#</code>)."},
    {lit:"i", enunt:"Afișează <b>codurile produselor „orfane”</b> (produse pentru care a fost ștearsă comanda corespunzătoare).",
     sql:"SELECT P.Cod_Produs\nFROM Produse_Comandate P\nLEFT JOIN Comenzi C ON P.Id_Comanda = C.Id_Comanda\nWHERE C.Id_Comanda IS NULL;",
     note:"<b>Raționament:</b> <code>Produse_Comandate.Id_Comanda</code> e FK obligatoriu → integritatea referențială interzice produse fără comandă. <b>Explicație:</b> <code>LEFT JOIN</code> păstrează <b>toate</b> liniile; unde nu există comandă potrivită, coloanele lui <code>C</code> ies <code>NULL</code>; filtrul <code>C.Id_Comanda IS NULL</code> izolează orfanii. Echivalent cu <code>NOT EXISTS</code>; evită <code>NOT IN</code> din cauza capcanei cu <code>NULL</code>."}
  ],
  anexa:"CREATE TABLE Clienti (\n    Id_Client INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Oras    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Comenzi (\n    Id_Comanda INT PRIMARY KEY,\n    Id_Client  INT NOT NULL,\n    Data       DATETIME NOT NULL,\n    Stare      CHAR(1) NULL,                  -- NULL / 'L' / 'A'\n    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)\n);\n\nCREATE TABLE Produse_Comandate (\n    Id_Linie    INT PRIMARY KEY,\n    Id_Comanda  INT NOT NULL,\n    Cod_Produs  VARCHAR(10) NOT NULL,\n    Pret_Unitar DECIMAL(10,2) NOT NULL,\n    Cantitate   INT NOT NULL,\n    Returnat    DATETIME NULL,                -- NULL = nereturnat\n    FOREIGN KEY (Id_Comanda) REFERENCES Comenzi(Id_Comanda)\n);\n\nINSERT INTO Clienti VALUES\n (1,'Ionescu','Bogdan','Iasi'),\n (2,'Munteanu','Carmen','Iasi'),\n (3,'Dinu','Vlad','Cluj-Napoca'),\n (4,'Stoica','Ana','Iasi');\n\nINSERT INTO Comenzi VALUES\n (10,1,'2021-11-04','L'),\n (11,1,'2021-11-22','L'),     -- 2 comenzi nov 2021 -> cerinta g\n (12,2,'2021-07-15','L'),\n (13,3,'2021-11-10','A'),\n (14,4,'2021-11-30','L'),     -- 30 nov, prins de interval\n (15,1,'2021-05-01','L');\n\nINSERT INTO Produse_Comandate VALUES\n (100,10,'A7B12','250.00',2,NULL),          -- pozitia 2 = '7', pret 250 in [100,500], nereturnat\n (101,11,'X9Y00','600.00',1,'2021-11-25'),  -- pret 600 > 500 -> exclus la f; returnat\n (102,12,'Q7ZZ1','120.00',3,NULL),          -- comanda iul -> exclus la f\n (103,14,'B7C44','500.00',1,NULL),          -- pozitia 2 = '7', pret 500 (capat inclus), nereturnat\n (104,15,'M2N33','90.00', 5,NULL);"
},

// ============================== 4. COMPANIE AERIANĂ ==============================
{
  id:"aeriana", nume:"Companie aeriană", icon:"✈️",
  nivel:"Examen++. Tehnici noi: LIKE cu lungime fixă ('????u'), egalități la maxim (MAX), COUNT filtrat, subinterogare corelată cu EXISTS.",
  rezumat:"Lungime fixă cu '????u', maxim cu egalități (HAVING = MAX), NOT EXISTS corelat.",
  intro:"Fie tabelele <code>Pasageri</code>, <code>Rezervari</code> și <code>Bilete</code>, în care sunt păstrate informații despre pasagerii unei companii aeriene, rezervările făcute și biletele emise.",
  tabele:[
    {nume:"Pasageri", campuri:[
      ["Id_Pasager (PK)","nu","int"],["Nume","nu","varchar(50)"],
      ["Prenume","nu","varchar(50)"],["Tara","nu","varchar(50)"]]},
    {nume:"Rezervari", campuri:[
      ["Id_Rezervare (PK)","nu","int"],["Id_Pasager (FK)","nu","int"],
      ["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Bilete", campuri:[
      ["Id_Bilet (PK)","nu","int"],["Id_Rezervare (FK)","nu","int"],
      ["Cod_Bilet","nu","varchar(10)"],["Valabil_De_La","nu","datetime"],
      ["Valabil_Pana_La","nu","datetime"],["Anulat","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei rezervări are valoarea <code>null</code> la creare (neconfirmată), <code>C</code> după <b>confirmare</b> (bilet emis), sau <code>X</code> dacă a fost <b>anulată</b>.",
    "Câmpul <code>Anulat</code> al unui bilet are valoarea <code>null</code> dacă biletul este <b>valid</b>, sau conține <b>data</b> la care a fost anulat."
  ],
  relatii:"<code>Pasageri 1—N Rezervari 1—N Bilete</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> pasagerilor al căror <b>nume are exact 5 litere</b> și se <b>termină în „u”</b>.",
     sql:"SELECT Prenume FROM Pasageri WHERE Nume LIKE '????u';",
     ansi:"SELECT Prenume FROM Pasageri WHERE Nume LIKE '____u';   -- patru underscore + u\n-- portabil: WHERE LEN(Nume) = 5 AND RIGHT(Nume,1) = 'u'",
     note:"<b>Explicație:</b> fiecare <code>?</code> impune <b>exact un</b> caracter. Patru <code>?</code> + litera <code>u</code> = șir de <b>fix 5</b> caractere terminat în „u”. „Radu” (4) → nu; „Stanu” (5) → da. <b>Capcană:</b> <code>?</code>/<code>_</code> = exact un caracter, spre deosebire de <code>*</code>/<code>%</code> (orice șir, inclusiv vid) — pe asta ne bazăm ca să fixăm lungimea."},
    {lit:"b", enunt:"Afișează <b>codurile biletelor</b> care au fost <b>anulate</b>.",
     sql:"SELECT Cod_Bilet FROM Bilete WHERE Anulat IS NOT NULL;",
     note:"<b>Explicație:</b> bilet anulat ⇒ are <b>data</b> anulării → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>țara (sau țările)</b> cu cel mai mare număr de pasageri, <b>inclusiv în caz de egalitate</b>.",
     sql:"SELECT Tara FROM Pasageri\nGROUP BY Tara\nHAVING Count(*) = (\n    SELECT Max(Nr) FROM (\n        SELECT Count(*) AS Nr FROM Pasageri GROUP BY Tara\n    ) AS T\n);",
     ansi:"SELECT TOP 1 WITH TIES Tara FROM Pasageri\nGROUP BY Tara ORDER BY COUNT(*) DESC;",
     note:"<b>Escaladare reală față de „TOP 1”:</b> problemele 1–3 foloseau <code>TOP 1 ... ORDER BY COUNT DESC</code>, care întoarce <b>o singură</b> țară chiar la egalitate. Aici: subinterogarea calculează nr. de pasageri per țară, <code>MAX(Nr)</code> găsește maximul, iar <code>HAVING Count(*) = max</code> păstrează <b>toate</b> țările care îl ating. <code>WITH TIES</code> include automat egalitățile."},
    {lit:"d", enunt:"Afișează <b>rezervările confirmate</b> ale pasagerilor din „Romania”.",
     sql:"SELECT Rezervari.* FROM Rezervari\nINNER JOIN Pasageri ON Pasageri.Id_Pasager = Rezervari.Id_Pasager\nWHERE Pasageri.Tara = 'Romania' AND Rezervari.Stare = 'C';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru țară + <code>Stare = 'C'</code> (confirmată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de bilete valide</b> (neanulate) per pasager, descrescător; doar pasagerii cu cel puțin un bilet valid.",
     sql:"SELECT Nume, Prenume, Count(Bilete.Id_Bilet) AS Nr_Bilete_Valide\nFROM (Pasageri\n     INNER JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager)\n     INNER JOIN Bilete    ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare\nWHERE Bilete.Anulat IS NULL\nGROUP BY Rezervari.Id_Pasager, Nume, Prenume\nORDER BY Count(Bilete.Id_Bilet) DESC;",
     ansi:"-- numarare conditionala (pastreaza si pasagerii cu 0):\n... COUNT(CASE WHEN Bilete.Anulat IS NULL THEN 1 END) AS Nr_Bilete_Valide ...",
     note:"<b>Escaladare — <code>COUNT</code> filtrat:</b> numărăm <b>doar</b> biletele cu <code>Anulat IS NULL</code>. Filtrul stă în <code>WHERE</code> (înainte de agregare); <code>INNER JOIN</code> + acel <code>WHERE</code> garantează doar pasagerii cu cel puțin un bilet valid. Varianta <code>COUNT(CASE WHEN ... )</code> păstrează și pasagerii cu 0 valide."},
    {lit:"f", enunt:"Afișează <b>numărul de bilete valabile</b> emise din 01.07.2021–31.07.2021 pentru care <b>a cincea cifră</b> a codului e <b>impară</b>.",
     sql:"SELECT Count(*) FROM Rezervari\nINNER JOIN Bilete ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare\nWHERE Bilete.Anulat IS NULL\n  AND (Rezervari.Data >= #2021-07-01# AND Rezervari.Data < #2021-08-01#)\n  AND Bilete.Cod_Bilet LIKE '????[13579]*';",
     ansi:"-- portabil:\n... AND SUBSTRING(Cod_Bilet, 5, 1) IN ('1','3','5','7','9')",
     note:"<b>Explicație:</b> <code>Anulat IS NULL</code> (valabil); interval iulie 2021 robust; <code>Cod_Bilet LIKE '????[13579]*'</code> → patru <code>?</code> consumă exact primele 4 caractere, <code>[13579]</code> cere ca al <b>5-lea</b> să fie cifră impară, <code>*</code> = restul liber."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> pasagerilor cu <b>minimum trei rezervări în același an</b> (un pasager o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Pasageri\nINNER JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager\nGROUP BY Rezervari.Id_Pasager, Year(Data), Nume, Prenume\nHAVING Count(*) >= 3;",
     note:"<b>Explicație:</b> grupare pe (pasager, an); <code>HAVING &gt;= 3</code> + <code>DISTINCT</code> (un pasager care îndeplinește condiția în mai mulți ani apare o singură dată)."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul biletului</b> pasagerilor cu cel puțin un bilet <b>neanulat</b> care <b>expiră înainte</b> de 31 decembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Bilet\nFROM (Pasageri\n     INNER JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager)\n     INNER JOIN Bilete    ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare\nWHERE Bilete.Anulat IS NULL\n  AND Bilete.Valabil_Pana_La < #2021-12-31#;",
     note:"<b>Explicație:</b> lanț <code>Pasageri → Rezervari → Bilete</code>; <code>Anulat IS NULL</code> = neanulat, <code>Valabil_Pana_La &lt; #2021-12-31#</code> = expiră înainte. Parantezele Access obligatorii la 2+ join-uri."},
    {lit:"i", enunt:"Afișează <b>numele și prenumele</b> pasagerilor care <b>nu au nicio rezervare anulată</b> (<code>Stare = 'X'</code>).",
     sql:"SELECT Nume, Prenume FROM Pasageri P\nWHERE NOT EXISTS (\n    SELECT 1 FROM Rezervari R\n    WHERE R.Id_Pasager = P.Id_Pasager AND R.Stare = 'X'\n);",
     note:"<b>Subinterogare corelată:</b> pentru fiecare pasager, subinterogarea caută o rezervare anulată a <b>acelui</b> pasager (corelarea <code>R.Id_Pasager = P.Id_Pasager</code>); <code>NOT EXISTS</code> păstrează pasagerii pentru care nu s-a găsit niciuna. <b>Dublă negație:</b> include și pasagerii fără nicio rezervare — pentru „are rezervări, dar niciuna anulată” adaugi un <code>EXISTS</code> suplimentar. <b>De ce nu <code>Stare &lt;&gt; 'X'</code> într-un JOIN:</b> un pasager cu o rezervare <code>'C'</code> și una <code>'X'</code> ar apărea totuși prin cea <code>'C'</code> — greșit."}
  ],
  anexa:"CREATE TABLE Pasageri (\n    Id_Pasager INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Tara    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Rezervari (\n    Id_Rezervare INT PRIMARY KEY,\n    Id_Pasager   INT NOT NULL,\n    Data         DATETIME NOT NULL,\n    Stare        CHAR(1) NULL,               -- NULL / 'C' / 'X'\n    FOREIGN KEY (Id_Pasager) REFERENCES Pasageri(Id_Pasager)\n);\n\nCREATE TABLE Bilete (\n    Id_Bilet        INT PRIMARY KEY,\n    Id_Rezervare    INT NOT NULL,\n    Cod_Bilet       VARCHAR(10) NOT NULL,\n    Valabil_De_La   DATETIME NOT NULL,\n    Valabil_Pana_La DATETIME NOT NULL,\n    Anulat          DATETIME NULL,           -- NULL = valid\n    FOREIGN KEY (Id_Rezervare) REFERENCES Rezervari(Id_Rezervare)\n);\n\nINSERT INTO Pasageri VALUES\n (1,'Stanu','Mihai','Romania'),     -- 5 litere, termina in u\n (2,'Radu','Ioana','Romania'),      -- 4 litere -> NU la a)\n (3,'Lupascu','Dan','Germania'),\n (4,'Marcu','Elena','Romania');     -- 5 litere, termina in u\n\nINSERT INTO Rezervari VALUES\n (10,1,'2021-07-02','C'),\n (11,1,'2021-07-09','C'),\n (12,1,'2021-09-14','C'),     -- Stanu: 3 rezervari in 2021 -> cerinta g\n (13,2,'2021-07-20','X'),     -- Radu are o rezervare anulata -> exclus la i)\n (14,3,'2021-07-25','C'),\n (15,4,'2021-01-05',NULL);\n\nINSERT INTO Bilete VALUES\n (100,10,'AB7C13XY','2021-07-02','2021-12-01',NULL),  -- pozitia 5 = '1' (impar), neanulat, expira < 31.12\n (101,11,'ABCD2EFG','2021-07-09','2022-07-09',NULL),  -- pozitia 5 = '2' (par) -> exclus la f\n (102,12,'ZZZZ9000','2021-09-14','2022-01-01','2021-10-01'),  -- anulat\n (103,14,'QWER5TYU','2021-07-25','2022-07-25',NULL),  -- pozitia 5 = '5' (impar)\n (104,15,'1111X222','2021-01-05','2021-06-30',NULL);"
},

// ============================== 5. SERVICE AUTO (capstone) ==============================
{
  id:"service", nume:"Service auto (capstone)", icon:"🔧",
  nivel:"Examen+++ (recapitulare). Reunește toate tehnicile: clasă la început '[A-M]*', WHERE→GROUP BY→HAVING→ORDER BY, comparație între coloane, dublă negație, cele trei moduri de a găsi orfanii.",
  rezumat:"Sinteza întregului set: clasă [A-M] la început, dublă negație „toate/niciuna”, BETWEEN între coloane.",
  intro:"Fie tabelele <code>Clienti</code>, <code>Comenzi_Service</code> și <code>Piese_Montate</code>, în care sunt păstrate informații despre clienții unui service auto, comenzile de reparație și piesele montate (cu garanție).",
  tabele:[
    {nume:"Clienti", campuri:[
      ["Id_Client (PK)","nu","int"],["Nume","nu","varchar(50)"],
      ["Prenume","nu","varchar(50)"],["Localitate","nu","varchar(50)"]]},
    {nume:"Comenzi_Service", campuri:[
      ["Id_Comanda (PK)","nu","int"],["Id_Client (FK)","nu","int"],
      ["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Piese_Montate", campuri:[
      ["Id_Piesa (PK)","nu","int"],["Id_Comanda (FK)","nu","int"],
      ["Cod_Piesa","nu","varchar(10)"],["Garantie_De_La","nu","datetime"],
      ["Garantie_Pana_La","nu","datetime"],["Reclamata","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei comenzi de service are valoarea <code>null</code> la primire (în lucru), <code>F</code> după ce reparația a fost <b>finalizată</b>, sau <code>R</code> dacă comanda a fost <b>refuzată</b>.",
    "Câmpul <code>Reclamata</code> are valoarea <code>null</code> dacă piesa <b>nu</b> a fost reclamată, sau conține <b>data</b> la care clientul a făcut reclamația."
  ],
  relatii:"<code>Clienti 1—N Comenzi_Service 1—N Piese_Montate</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> clienților al căror <b>nume începe cu o literă din intervalul A–M</b>.",
     sql:"SELECT Prenume FROM Clienti WHERE Nume LIKE '[A-M]*';",
     ansi:"-- SQL Server identic: LIKE '[A-M]%'\n-- MySQL: WHERE Nume REGEXP '^[A-M]'  sau  WHERE LEFT(Nume,1) BETWEEN 'A' AND 'M'",
     note:"<b>Explicație:</b> <code>[A-M]</code> = clasă de caractere — <b>primul</b> caracter trebuie să fie o literă între A și M; <code>*</code> = restul liber. Prinde „Barbu”, „Marin”, dar nu „Nedelcu” sau „Popa”. <b>Capcană (portabilitate):</b> MySQL nu suportă <code>[A-M]</code> în <code>LIKE</code>; atenție la <b>collation</b> pentru diacritice."},
    {lit:"b", enunt:"Afișează <b>codurile pieselor</b> care au fost <b>reclamate</b>.",
     sql:"SELECT Cod_Piesa FROM Piese_Montate WHERE Reclamata IS NOT NULL;",
     note:"<b>Explicație:</b> piesă reclamată ⇒ are <b>data</b> reclamației → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>localitatea (sau localitățile)</b> cu cel mai mare număr de clienți, <b>inclusiv la egalitate</b>.",
     sql:"SELECT Localitate FROM Clienti\nGROUP BY Localitate\nHAVING Count(*) = (\n    SELECT Max(Nr) FROM (SELECT Count(*) AS Nr FROM Clienti GROUP BY Localitate) AS T\n);",
     note:"<b>Explicație:</b> ca la 4c — subinterogarea găsește numărul maxim de clienți pe o localitate, iar <code>HAVING</code> întoarce <b>toate</b> localitățile care îl ating (corect și la egalitate, spre deosebire de <code>TOP 1</code>)."},
    {lit:"d", enunt:"Afișează <b>comenzile finalizate</b> ale clienților din „Brașov”.",
     sql:"SELECT Comenzi_Service.* FROM Comenzi_Service\nINNER JOIN Clienti ON Clienti.Id_Client = Comenzi_Service.Id_Client\nWHERE Clienti.Localitate = 'Brasov' AND Comenzi_Service.Stare = 'F';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru localitate + <code>Stare = 'F'</code> (finalizată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de comenzi finalizate</b> ale clienților cu <b>cel puțin două</b>, descrescător.",
     sql:"SELECT Nume, Prenume, Count(*) AS Nr_Finalizate\nFROM Clienti\nINNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client\nWHERE Comenzi_Service.Stare = 'F'\nGROUP BY Comenzi_Service.Id_Client, Nume, Prenume\nHAVING Count(*) >= 2\nORDER BY Count(*) DESC;",
     note:"<b>Rețeta canonică <code>WHERE → GROUP BY → HAVING → ORDER BY</code>:</b> <code>WHERE</code> filtrează rândurile înainte de grupare (doar <code>'F'</code>), <code>GROUP BY</code> pe client, <code>HAVING</code> filtrează grupele (≥2), <code>ORDER BY</code> sortează. <b>Capcană:</b> condiția pe stare merge în <code>WHERE</code> (despre rânduri), cea pe număr în <code>HAVING</code> (despre grupe) — <code>WHERE Count(*)&gt;=2</code> e eroare de sintaxă."},
    {lit:"f", enunt:"Afișează <b>numărul de piese montate</b> pe comenzi <b>finalizate</b> în anul <b>2021</b>, cu <b>garanția expirată</b> (înainte de 31.12.2021) și care <b>nu</b> au fost reclamate.",
     sql:"SELECT Count(*) FROM Comenzi_Service\nINNER JOIN Piese_Montate ON Comenzi_Service.Id_Comanda = Piese_Montate.Id_Comanda\nWHERE Comenzi_Service.Stare = 'F'\n  AND Year(Comenzi_Service.Data) = 2021\n  AND Piese_Montate.Garantie_Pana_La < #2021-12-31#\n  AND Piese_Montate.Reclamata IS NULL;",
     note:"<b>Explicație:</b> patru condiții — comandă <b>finalizată</b>, din anul <b>2021</b> (<code>Year(Data)=2021</code>, alternativ <code>&gt;= #2021-01-01# AND &lt; #2022-01-01#</code>), garanție <b>expirată</b> (<code>Garantie_Pana_La &lt; #2021-12-31#</code>) și piesă <b>nereclamată</b> (<code>Reclamata IS NULL</code>)."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> clienților cu <b>minimum două comenzi în aceeași lună</b> (un client o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Clienti\nINNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client\nGROUP BY Comenzi_Service.Id_Client, Year(Data), Month(Data), Nume, Prenume\nHAVING Count(*) >= 2;",
     note:"<b>Explicație:</b> grupare pe (client, an, lună); <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul piesei</b> clienților cu cel puțin o piesă <b>nereclamată</b> a cărei <b>garanție expiră înainte</b> de 31 decembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Piesa\nFROM (Clienti\n     INNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client)\n     INNER JOIN Piese_Montate   ON Comenzi_Service.Id_Comanda = Piese_Montate.Id_Comanda\nWHERE Piese_Montate.Reclamata IS NULL\n  AND Piese_Montate.Garantie_Pana_La < #2021-12-31#;",
     note:"<b>Explicație:</b> lanț <code>Clienti → Comenzi_Service → Piese_Montate</code>; <code>Reclamata IS NULL</code> = nereclamată, <code>Garantie_Pana_La &lt; #2021-12-31#</code> = expiră înainte. Paranteze Access obligatorii."},
    {lit:"i", enunt:"Afișează <b>codurile pieselor „orfane”</b> — și discută cele <b>trei soluții echivalente</b>.",
     sql:"-- (1) NOT IN — cea mai citita, dar FRAGILA la NULL\nSELECT Cod_Piesa FROM Piese_Montate\nWHERE Id_Comanda NOT IN (SELECT Id_Comanda FROM Comenzi_Service);\n\n-- (2) NOT EXISTS — robusta, recomandata\nSELECT Cod_Piesa FROM Piese_Montate P\nWHERE NOT EXISTS (SELECT 1 FROM Comenzi_Service C WHERE C.Id_Comanda = P.Id_Comanda);\n\n-- (3) LEFT JOIN ... IS NULL — robusta, foarte vizuala\nSELECT P.Cod_Piesa FROM Piese_Montate P\nLEFT JOIN Comenzi_Service C ON P.Id_Comanda = C.Id_Comanda\nWHERE C.Id_Comanda IS NULL;",
     note:"<b>Raționament:</b> <code>Piese_Montate.Id_Comanda</code> e FK obligatoriu → nu există orfani în acest design. <b>Comparație (de reținut):</b> (1) <code>NOT IN</code> se „strică” dacă subinterogarea poate întoarce vreun <code>NULL</code> → rezultat <b>vid</b>; sigură doar pe coloane <code>NOT NULL</code>. (2) <code>NOT EXISTS</code> tratează corect <code>NULL</code>-urile și e de regulă optimizată identic cu (3). (3) <code>LEFT JOIN ... IS NULL</code> („anti-join”) e cea mai intuitivă vizual și la fel de robustă."},
    {lit:"j", enunt:"<b>(bonus)</b> Afișează <b>numele și prenumele</b> clienților ale căror comenzi sunt <b>toate finalizate</b> (nicio comandă în lucru sau refuzată), dintre cei cu cel puțin o comandă.",
     sql:"SELECT Nume, Prenume FROM Clienti C\nWHERE EXISTS (SELECT 1 FROM Comenzi_Service S WHERE S.Id_Client = C.Id_Client)\n  AND NOT EXISTS (\n        SELECT 1 FROM Comenzi_Service S\n        WHERE S.Id_Client = C.Id_Client\n          AND (S.Stare IS NULL OR S.Stare = 'R')   -- macar o comanda ne-finalizata\n  );",
     note:"<b>Cuantificatorul „toate” = „nu există niciuna care nu”:</b> „toate comenzile sunt <code>'F'</code>” ⇒ „<b>nu există</b> o comandă în lucru (<code>NULL</code>) <b>sau</b> refuzată (<code>'R'</code>)”. Primul <code>EXISTS</code> elimină clienții fără nicio comandă (care altfel ar trece „vacuos”). <b>Capcană NULL:</b> scriem explicit <code>S.Stare IS NULL OR S.Stare = 'R'</code>; un simplu <code>S.Stare &lt;&gt; 'F'</code> ar rata comenzile cu <code>Stare IS NULL</code> (<code>NULL &lt;&gt; 'F'</code> dă <code>UNKNOWN</code>)."},
    {lit:"k", enunt:"<b>(bonus)</b> Afișează <b>codurile pieselor reclamate în perioada de garanție</b> (data reclamației între <code>Garantie_De_La</code> și <code>Garantie_Pana_La</code>).",
     sql:"SELECT Cod_Piesa FROM Piese_Montate\nWHERE Reclamata IS NOT NULL\n  AND Reclamata BETWEEN Garantie_De_La AND Garantie_Pana_La;",
     note:"<b>Comparație între coloane (nu cu constante):</b> condiția compară trei <b>coloane</b> ale aceluiași rând — <code>Reclamata</code> trebuie să cadă între <code>Garantie_De_La</code> și <code>Garantie_Pana_La</code>. Întâi <code>Reclamata IS NOT NULL</code> (altfel <code>BETWEEN</code> cu <code>NULL</code> dă <code>UNKNOWN</code>). Echivalent: <code>Reclamata &gt;= Garantie_De_La AND Reclamata &lt;= Garantie_Pana_La</code>."}
  ],
  anexa:"CREATE TABLE Clienti (\n    Id_Client  INT PRIMARY KEY,\n    Nume       VARCHAR(50) NOT NULL,\n    Prenume    VARCHAR(50) NOT NULL,\n    Localitate VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Comenzi_Service (\n    Id_Comanda INT PRIMARY KEY,\n    Id_Client  INT NOT NULL,\n    Data       DATETIME NOT NULL,\n    Stare      CHAR(1) NULL,                 -- NULL / 'F' / 'R'\n    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)\n);\n\nCREATE TABLE Piese_Montate (\n    Id_Piesa         INT PRIMARY KEY,\n    Id_Comanda       INT NOT NULL,\n    Cod_Piesa        VARCHAR(10) NOT NULL,\n    Garantie_De_La   DATETIME NOT NULL,\n    Garantie_Pana_La DATETIME NOT NULL,\n    Reclamata        DATETIME NULL,          -- NULL = nereclamata\n    FOREIGN KEY (Id_Comanda) REFERENCES Comenzi_Service(Id_Comanda)\n);\n\nINSERT INTO Clienti VALUES\n (1,'Barbu','Cristian','Brasov'),      -- B in [A-M]\n (2,'Marin','Otilia','Brasov'),        -- M in [A-M]\n (3,'Nedelcu','Paul','Sibiu'),         -- N NU e in [A-M]\n (4,'Popa','Sanda','Brasov');          -- P NU e in [A-M]\n\nINSERT INTO Comenzi_Service VALUES\n (10,1,'2021-02-03','F'),\n (11,1,'2021-02-25','F'),     -- Barbu: 2 'F' (e) si 2 in feb (g)\n (12,2,'2021-05-10','F'),\n (13,2,'2021-06-01',NULL),    -- Marin are o comanda in lucru -> exclus la j)\n (14,4,'2021-03-15','R'),\n (15,1,'2021-08-09','F');     -- Barbu: total 3 comenzi 'F'\n\nINSERT INTO Piese_Montate VALUES\n (100,10,'OEM00731','2021-02-03','2021-08-03',NULL),          -- garantie expira <31.12, nereclamata\n (101,11,'OEM00990','2021-02-25','2022-02-25','2021-05-01'),  -- reclamata in garantie (k)\n (102,12,'BSX12000','2021-05-10','2021-11-10',NULL),          -- garantie expirata <31.12, nereclamata\n (103,15,'OEM55500','2021-08-09','2023-08-09',NULL);          -- garantie NU expira pana 31.12 -> exclus la f"
}
];
