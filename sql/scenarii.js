// ============================================================
//  SQL Trainer — cele 5 scenarii rezolvate (Subiectul III, stil ATM 2021)
//  Sursă: SQL_PRACTICE/ (bibliotecă, clinică, magazin, companie aeriană, service auto)
//  Fiecare scenariu: 3 tabele 1—N—N, 2 câmpuri NULL cu semantică, 9 cerințe (a–i)
//  cu rezolvare completă în SQL Server / T-SQL (ca în laboratoare) + capcane.
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
     sql:"SELECT Prenume FROM Cititori WHERE Nume LIKE 'Pop%';",
     note:"<b>Explicație:</b> <code>%</code> = orice șir (inclusiv vid) <b>după</b> prefixul „Pop”. Aici cerem un <b>prefix</b>, deci wildcard-ul stă la <b>dreapta</b>. <b>Capcană:</b> <code>'Pop%'</code> prinde „Popescu”, „Popa”, „Pop”, „Popovici”; pentru exact „Pop” folosești <code>WHERE Nume = 'Pop'</code>."},
    {lit:"b", enunt:"Afișează <b>codurile de bare</b> ale volumelor declarate <b>pierdute</b>.",
     sql:"SELECT Cod_Bare FROM Volume WHERE Pierdut IS NOT NULL;",
     note:"<b>Explicație:</b> <code>Pierdut = null</code> înseamnă „integru”, deci un volum <b>pierdut</b> are o <b>dată</b> în câmp → <code>IS NOT NULL</code>. <b>Capcană clasică:</b> nu se scrie <code>Pierdut &lt;&gt; null</code> (comparația cu <code>null</code> dă mereu <code>UNKNOWN</code>). Obligatoriu <code>IS [NOT] NULL</code>."},
    {lit:"c", enunt:"Afișează <b>facultatea</b> cu cel mai mare număr de cititori.",
     sql:"SELECT TOP (1) Facultate FROM Cititori\nGROUP BY Facultate\nORDER BY COUNT(*) DESC;",
     note:"<b>Explicație:</b> grupăm pe facultate, numărăm cititorii, ordonăm descrescător, luăm prima. <b>Capcană (egalitate la maxim):</b> dacă două facultăți au același maxim, <code>TOP 1</code> întoarce <b>una singură</b> (nedeterminist). Pentru toate egalitățile: <code>TOP 1 WITH TIES</code> sau <code>HAVING COUNT(*) = (SELECT MAX(...))</code> — vezi Problema 4c."},
    {lit:"d", enunt:"Afișează <b>împrumuturile onorate</b> făcute de cititorii de la facultatea „Automatică”.",
     sql:"SELECT Imprumuturi.* FROM Imprumuturi\nINNER JOIN Cititori ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nWHERE Cititori.Facultate = 'Automatica' AND Imprumuturi.Stare = 'R';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> leagă fiecare împrumut de cititor; filtrăm pe facultate și pe starea <code>'R'</code> (onorat). <b>Atenție la NULL:</b> <code>Stare = 'R'</code> exclude automat cererile <code>NULL</code> (în procesare) și <code>'A'</code> (anulate) — exact ce vrem."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de împrumuturi</b> per cititor, descrescător.",
     sql:"SELECT Nume, Prenume, COUNT(Id_Imprumut) AS Nr_Imprumuturi\nFROM Cititori\nINNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nGROUP BY Imprumuturi.Id_Cititor, Nume, Prenume\nORDER BY COUNT(Id_Imprumut) DESC;",
     note:"<b>De ce <code>Id_Cititor</code> în <code>GROUP BY</code>:</b> ca să distingem doi cititori <b>omonimi</b>. <code>Nume, Prenume</code> apar în <code>GROUP BY</code> doar ca să poată fi afișate (orice coloană neagregată din <code>SELECT</code> trebuie să fie în <code>GROUP BY</code>). <b>Observație:</b> cu <code>INNER JOIN</code>, cititorii fără niciun împrumut nu apar; pentru „0 împrumuturi” treci la <code>LEFT JOIN</code>."},
    {lit:"f", enunt:"Afișează <b>numărul de împrumuturi onorate</b> din 01.10.2021–31.10.2021 pentru care <b>prima cifră</b> a codului de bare al unui volum asociat este <b>nenulă</b>.",
     sql:"SELECT COUNT(*) FROM Imprumuturi\nINNER JOIN Volume ON Imprumuturi.Id_Imprumut = Volume.Id_Imprumut\nWHERE Imprumuturi.Stare = 'R'\n  AND (Imprumuturi.Data >= '2021-10-01' AND Imprumuturi.Data < '2021-11-01')\n  AND Volume.Cod_Bare LIKE '[1-9]%';",
     note:"<b>Pe bucăți:</b> <code>Stare = 'R'</code> (onorate); <code>Data &gt;= '2021-10-01' AND Data &lt; '2021-11-01'</code> — am evitat intenționat <code>BETWEEN ... '2021-10-31'</code>, care ar rata orele din 31 oct. de după 00:00:00; <code>Cod_Bare LIKE '[1-9]%'</code> → prima cifră ∈ {1..9} (nenulă), restul liber."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> cititorilor cu <b>minimum trei împrumuturi în aceeași lună</b> (fiecare o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Cititori\nINNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\nGROUP BY Imprumuturi.Id_Cititor, YEAR(Data), MONTH(Data), Nume, Prenume\nHAVING COUNT(*) >= 3;",
     note:"<b>Explicație:</b> gruparea pe <code>Id_Cititor, YEAR(Data), MONTH(Data)</code> creează câte o grupă per (cititor, lună-din-an). Includem <code>YEAR</code> <b>și</b> <code>MONTH</code>, altfel „aceeași lună” din ani diferiți s-ar contopi greșit. <code>HAVING COUNT(*) &gt;= 3</code> + <code>DISTINCT</code> (un cititor care îndeplinește condiția în mai multe luni ar apărea altfel de mai multe ori)."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codurile de bare</b> ale cititorilor cu cel puțin un volum <b>nepierdut</b> al cărui <b>termen de returnare</b> e înainte de 30 noiembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Bare\nFROM Cititori\n     INNER JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor\n     INNER JOIN Volume      ON Imprumuturi.Id_Imprumut = Volume.Id_Imprumut\nWHERE Volume.Pierdut IS NULL\n  AND Volume.Termen_Returnare < '2021-11-30';",
     note:"<b>Explicație:</b> dublu <code>INNER JOIN</code> pe lanțul <code>Cititori → Imprumuturi → Volume</code>; <code>Pierdut IS NULL</code> = nepierdut, <code>Termen_Returnare &lt; '2021-11-30'</code> = scadent înainte. <b>Înlănțuirea JOIN-urilor:</b> în SQL Server scrii direct mai multe <code>INNER JOIN</code> unul după altul (fără paranteze); fiecare <code>ON</code> leagă perechea de tabele imediat anterioară."},
    {lit:"i", enunt:"Afișează <b>codurile de bare</b> pentru volumele <b>„orfane”</b> (volume pentru care a fost ștearsă cererea de împrumut corespunzătoare).",
     sql:"SELECT Cod_Bare FROM Volume\nWHERE Id_Imprumut NOT IN (SELECT Id_Imprumut FROM Imprumuturi);",
     note:"<b>Raționament (proiectare):</b> <code>Volume.Id_Imprumut</code> e FK obligatoriu (<code>null = nu</code>); integritatea referențială <b>nu permite</b> volume orfane în acest design. Interogarea de mai sus rezolvă cerința <i>dacă</i> BD ar permite orfani. <b>Capcană <code>NOT IN</code> + <code>NULL</code>:</b> dacă subinterogarea poate conține <code>NULL</code>, <code>NOT IN</code> întoarce vid → preferă <code>NOT EXISTS</code> sau <code>LEFT JOIN ... IS NULL</code>."}
  ],
  anexa:"CREATE TABLE Cititori (\n    Id_Cititor INT PRIMARY KEY,\n    Nume       VARCHAR(50) NOT NULL,\n    Prenume    VARCHAR(50) NOT NULL,\n    Facultate  VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Imprumuturi (\n    Id_Imprumut INT PRIMARY KEY,\n    Id_Cititor  INT NOT NULL,\n    Data        DATETIME NOT NULL,\n    Stare       CHAR(1) NULL,                 -- NULL / 'R' / 'A'\n    FOREIGN KEY (Id_Cititor) REFERENCES Cititori(Id_Cititor)\n);\n\nCREATE TABLE Volume (\n    Id_Volum         INT PRIMARY KEY,\n    Id_Imprumut      INT NOT NULL,\n    Cod_Bare         VARCHAR(10) NOT NULL,\n    Disponibil_De_La DATETIME NOT NULL,\n    Termen_Returnare DATETIME NOT NULL,\n    Pierdut          DATETIME NULL,           -- NULL = integru\n    FOREIGN KEY (Id_Imprumut) REFERENCES Imprumuturi(Id_Imprumut)\n);\n\nINSERT INTO Cititori VALUES\n (1,'Popescu','Andrei','Automatica'),\n (2,'Pop','Maria','Automatica'),\n (3,'Ionescu','Vlad','Electronica'),\n (4,'Popa','Elena','Automatica'),\n (5,'Georgescu','Radu','Mecanica');\n\nINSERT INTO Imprumuturi VALUES\n (10,1,'2021-10-03','R'),\n (11,1,'2021-10-19','R'),\n (12,1,'2021-10-28','R'),     -- Popescu: 3 imprumuturi in oct. 2021 -> cerinta g\n (13,2,'2021-09-15','R'),\n (14,3,'2021-10-10',NULL),    -- in procesare\n (15,4,'2021-11-02','A'),     -- anulat\n (16,1,'2021-05-04','R');\n\nINSERT INTO Volume VALUES\n (100,10,'1234567890','2021-10-03','2021-10-31',NULL),\n (101,11,'0567812345','2021-10-19','2021-11-19',NULL),   -- prima cifra 0 -> exclus la f\n (102,12,'9001234567','2021-10-28','2021-11-28',NULL),\n (103,13,'7777000011','2021-09-15','2021-10-15','2021-10-20'),  -- pierdut\n (104,16,'2222333344','2021-05-04','2021-11-29',NULL);"
},

// ============================== 2. CLINICĂ MEDICALĂ ==============================
{
  id:"clinica", nume:"Clinică medicală", icon:"🩺",
  nivel:"Examen. Tehnici noi: LIKE '%...%' (conține), grupare pe zi calendaristică, clase de cifre pare, COUNT filtrat.",
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
     sql:"SELECT Prenume FROM Pacienti WHERE Nume LIKE '%ana%';",
     note:"<b>Explicație:</b> <code>%</code> de <b>ambele</b> părți = „conține oriunde”. Prinde „M<b>ana</b>stireanu”, „St<b>ana</b>”, „<b>Ana</b>stasiu”. <b>Cele 3 forme:</b> <code>'ana%'</code> = începe cu; <code>'%ana'</code> = se termină cu; <code>'%ana%'</code> = conține."},
    {lit:"b", enunt:"Afișează <b>codurile rețetelor</b> deja <b>onorate</b> (ridicate de la farmacie).",
     sql:"SELECT Cod_Reteta FROM Retete WHERE Onorata IS NOT NULL;",
     note:"<b>Explicație:</b> <code>Onorata = null</code> ⇒ „neridicată”; deci o rețetă <b>onorată</b> are o <b>dată</b> → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>orașul</b> cu cel mai mare număr de pacienți.",
     sql:"SELECT TOP (1) Oras FROM Pacienti\nGROUP BY Oras\nORDER BY COUNT(*) DESC;",
     note:"<b>Explicație:</b> grupare pe oraș + numărare + ordonare descrescătoare, prima înregistrare."},
    {lit:"d", enunt:"Afișează <b>programările efectuate</b> ale pacienților din „Cluj-Napoca”.",
     sql:"SELECT Programari.* FROM Programari\nINNER JOIN Pacienti ON Pacienti.Id_Pacient = Programari.Id_Pacient\nWHERE Pacienti.Oras = 'Cluj-Napoca' AND Programari.Stare = 'E';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru pe oraș + <code>Stare = 'E'</code> (efectuată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de programări</b> per pacient, descrescător.",
     sql:"SELECT Nume, Prenume, COUNT(Id_Programare) AS Nr_Programari\nFROM Pacienti\nINNER JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient\nGROUP BY Programari.Id_Pacient, Nume, Prenume\nORDER BY COUNT(Id_Programare) DESC;",
     note:"<b>Explicație:</b> grupare pe pacient + numărare + ordonare. <code>Id_Pacient</code> în <code>GROUP BY</code> separă omonimii."},
    {lit:"f", enunt:"Afișează <b>numărul de programări efectuate</b> din 01.03.2021–31.03.2021 pentru care <b>ultima cifră</b> a codului rețetei e <b>pară</b>.",
     sql:"SELECT COUNT(*) FROM Programari\nINNER JOIN Retete ON Programari.Id_Programare = Retete.Id_Programare\nWHERE Programari.Stare = 'E'\n  AND (Programari.Data >= '2021-03-01' AND Programari.Data < '2021-04-01')\n  AND Retete.Cod_Reteta LIKE '%[02468]';",
     note:"<b>Explicație:</b> <code>Stare = 'E'</code>; interval martie 2021 robust (<code>&gt;= 01.03</code> și <code>&lt; 01.04</code>); <code>Cod_Reteta LIKE '%[02468]'</code> → <code>%</code> = orice început, iar <code>[02468]</code> impune ca <b>ultimul</b> caracter să fie cifră pară. <b>Alternativ:</b> <code>RIGHT(Cod_Reteta, 1) IN ('0','2','4','6','8')</code> (funcția <code>RIGHT</code> din T-SQL), dar clasa <code>[02468]</code> e mai compactă."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> pacienților cu <b>minimum două programări în aceeași zi</b> (fiecare o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Pacienti\nINNER JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient\nGROUP BY Programari.Id_Pacient, YEAR(Data), MONTH(Data), DAY(Data), Nume, Prenume\nHAVING COUNT(*) >= 2;",
     note:"<b>Explicație:</b> „aceeași zi” = aceeași combinație (an, lună, zi) — grupăm pe toate trei, nu doar pe <code>Day</code>, ca să nu contopim 15 martie cu 15 aprilie. <b>Capcană:</b> dacă ai grupa pe <code>Data</code> brut (cu oră), două programări din aceeași zi la <b>ore diferite</b> ar cădea în grupe diferite → trunchiezi la zi."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codurile rețetelor</b> pacienților cu cel puțin o rețetă <b>neonorată</b> care <b>expiră înainte</b> de 31 decembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Reteta\nFROM Pacienti\n     INNER JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient\n     INNER JOIN Retete     ON Programari.Id_Programare = Retete.Id_Programare\nWHERE Retete.Onorata IS NULL\n  AND Retete.Valabila_Pana_La < '2021-12-31';",
     note:"<b>Explicație:</b> lanț <code>Pacienti → Programari → Retete</code>; <code>Onorata IS NULL</code> = neonorată, <code>Valabila_Pana_La &lt; '2021-12-31'</code> = expiră înainte. În SQL Server înlănțuiești direct cele două <code>INNER JOIN</code>, fără paranteze."},
    {lit:"i", enunt:"Afișează <b>codurile rețetelor „orfane”</b> (rețete pentru care a fost ștearsă programarea corespunzătoare).",
     sql:"SELECT Cod_Reteta FROM Retete R\nWHERE NOT EXISTS (SELECT 1 FROM Programari P WHERE P.Id_Programare = R.Id_Programare);",
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
     sql:"SELECT Prenume FROM Clienti\nWHERE Nume LIKE '%escu' OR Nume LIKE '%eanu';",
     note:"<b>Explicație:</b> două potriviri de <b>sufix</b> unite prin <code>OR</code>. Prinde „Popescu”, „Ionescu”, dar și „Munteanu”, „Olteanu”. <b>Capcană de precedență:</b> dacă adaugi alt filtru, pune <code>OR</code>-ul în paranteze: <code>WHERE Oras='Iasi' AND (Nume LIKE '%escu' OR Nume LIKE '%eanu')</code>. Fără paranteze, <code>AND</code> are prioritate și schimbă logica."},
    {lit:"b", enunt:"Afișează <b>codurile produselor</b> care au fost <b>returnate</b>.",
     sql:"SELECT Cod_Produs FROM Produse_Comandate WHERE Returnat IS NOT NULL;",
     note:"<b>Explicație:</b> produs returnat ⇒ are <b>data</b> returnării → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>orașul</b> cu cel mai mare număr de clienți.",
     sql:"SELECT TOP (1) Oras FROM Clienti\nGROUP BY Oras\nORDER BY COUNT(*) DESC;",
     note:"<b>Explicație:</b> grupare pe oraș + ordonare descrescătoare + prima înregistrare."},
    {lit:"d", enunt:"Afișează <b>comenzile livrate</b> ale clienților din „Iași”.",
     sql:"SELECT Comenzi.* FROM Comenzi\nINNER JOIN Clienti ON Clienti.Id_Client = Comenzi.Id_Client\nWHERE Clienti.Oras = 'Iasi' AND Comenzi.Stare = 'L';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru oraș + <code>Stare = 'L'</code> (livrată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>valoarea totală comandată</b> de fiecare client (suma <code>Pret_Unitar * Cantitate</code> pe toate liniile sale), descrescător.",
     sql:"SELECT Nume, Prenume, SUM(Pret_Unitar * Cantitate) AS Valoare_Totala\nFROM Clienti\n     INNER JOIN Comenzi           ON Clienti.Id_Client = Comenzi.Id_Client\n     INNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda\nGROUP BY Comenzi.Id_Client, Nume, Prenume\nORDER BY SUM(Pret_Unitar * Cantitate) DESC;",
     note:"<b>Escaladare:</b> aici nu mai numărăm rânduri, ci <b>însumăm o expresie</b> (<code>Pret_Unitar * Cantitate</code>) — agregare numerică reală pe lanț <b>triplu</b>. <b>Capcană:</b> pentru doar comenzile livrate, adaugi <code>WHERE Comenzi.Stare = 'L'</code> înainte de <code>GROUP BY</code>. <b>NULL la SUM:</b> <code>SUM</code> ignoră <code>NULL</code>-urile."},
    {lit:"f", enunt:"Afișează <b>numărul de produse din comenzi livrate</b> din 01.11.2021–30.11.2021, cu <b>preț unitar între 100 și 500 lei</b> și al căror cod are cifra „7” pe <b>poziția a doua</b>.",
     sql:"SELECT COUNT(*) FROM Comenzi\nINNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda\nWHERE Comenzi.Stare = 'L'\n  AND (Comenzi.Data >= '2021-11-01' AND Comenzi.Data < '2021-12-01')\n  AND Produse_Comandate.Pret_Unitar BETWEEN 100 AND 500\n  AND Produse_Comandate.Cod_Produs LIKE '_7%';",
     note:"<b>Pe filtre:</b> <code>Stare = 'L'</code>; interval noiembrie 2021 robust; <code>Pret_Unitar BETWEEN 100 AND 500</code> — pe <b>numere</b> <code>BETWEEN</code> e inclusiv la ambele capete și <b>nu</b> are capcana „orei” (ca la datetime); <code>Cod_Produs LIKE '_7%'</code> → <code>_</code> = exact un caracter (poziția 1), <code>7</code> = poziția 2 fixată, <code>%</code> = restul liber."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> clienților cu <b>minimum două comenzi în aceeași lună a aceluiași an</b> (un client o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Clienti\nINNER JOIN Comenzi ON Clienti.Id_Client = Comenzi.Id_Client\nGROUP BY Comenzi.Id_Client, YEAR(Data), MONTH(Data), Nume, Prenume\nHAVING COUNT(*) >= 2;",
     note:"<b>Explicație:</b> grupare pe (client, an, lună); <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>. Includem <b>și</b> <code>YEAR</code>, <b>și</b> <code>MONTH</code>, ca să nu confundăm noiembrie 2020 cu noiembrie 2021."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul produsului</b> clienților cu cel puțin un produs <b>nereturnat</b> dintr-o comandă <b>livrată după</b> 30 iunie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Produs\nFROM Clienti\n     INNER JOIN Comenzi           ON Clienti.Id_Client = Comenzi.Id_Client\n     INNER JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda\nWHERE Produse_Comandate.Returnat IS NULL\n  AND Comenzi.Stare = 'L'\n  AND Comenzi.Data > '2021-06-30';",
     note:"<b>Explicație:</b> trei filtre simultane pe lanțul triplu: produs <b>nereturnat</b> (<code>IS NULL</code>), comandă <b>livrată</b> (<code>Stare='L'</code>), plasată <b>după</b> 30 iunie 2021 (<code>Data &gt; '2021-06-30'</code>)."},
    {lit:"i", enunt:"Afișează <b>codurile produselor „orfane”</b> (produse pentru care a fost ștearsă comanda corespunzătoare).",
     sql:"SELECT P.Cod_Produs\nFROM Produse_Comandate P\nLEFT JOIN Comenzi C ON P.Id_Comanda = C.Id_Comanda\nWHERE C.Id_Comanda IS NULL;",
     note:"<b>Raționament:</b> <code>Produse_Comandate.Id_Comanda</code> e FK obligatoriu → integritatea referențială interzice produse fără comandă. <b>Explicație:</b> <code>LEFT JOIN</code> păstrează <b>toate</b> liniile; unde nu există comandă potrivită, coloanele lui <code>C</code> ies <code>NULL</code>; filtrul <code>C.Id_Comanda IS NULL</code> izolează orfanii. Echivalent cu <code>NOT EXISTS</code>; evită <code>NOT IN</code> din cauza capcanei cu <code>NULL</code>."}
  ],
  anexa:"CREATE TABLE Clienti (\n    Id_Client INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Oras    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Comenzi (\n    Id_Comanda INT PRIMARY KEY,\n    Id_Client  INT NOT NULL,\n    Data       DATETIME NOT NULL,\n    Stare      CHAR(1) NULL,                  -- NULL / 'L' / 'A'\n    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)\n);\n\nCREATE TABLE Produse_Comandate (\n    Id_Linie    INT PRIMARY KEY,\n    Id_Comanda  INT NOT NULL,\n    Cod_Produs  VARCHAR(10) NOT NULL,\n    Pret_Unitar DECIMAL(10,2) NOT NULL,\n    Cantitate   INT NOT NULL,\n    Returnat    DATETIME NULL,                -- NULL = nereturnat\n    FOREIGN KEY (Id_Comanda) REFERENCES Comenzi(Id_Comanda)\n);\n\nINSERT INTO Clienti VALUES\n (1,'Ionescu','Bogdan','Iasi'),\n (2,'Munteanu','Carmen','Iasi'),\n (3,'Dinu','Vlad','Cluj-Napoca'),\n (4,'Stoica','Ana','Iasi');\n\nINSERT INTO Comenzi VALUES\n (10,1,'2021-11-04','L'),\n (11,1,'2021-11-22','L'),     -- 2 comenzi nov 2021 -> cerinta g\n (12,2,'2021-07-15','L'),\n (13,3,'2021-11-10','A'),\n (14,4,'2021-11-30','L'),     -- 30 nov, prins de interval\n (15,1,'2021-05-01','L');\n\nINSERT INTO Produse_Comandate VALUES\n (100,10,'A7B12','250.00',2,NULL),          -- pozitia 2 = '7', pret 250 in [100,500], nereturnat\n (101,11,'X9Y00','600.00',1,'2021-11-25'),  -- pret 600 > 500 -> exclus la f; returnat\n (102,12,'Q7ZZ1','120.00',3,NULL),          -- comanda iul -> exclus la f\n (103,14,'B7C44','500.00',1,NULL),          -- pozitia 2 = '7', pret 500 (capat inclus), nereturnat\n (104,15,'M2N33','90.00', 5,NULL);"
},

// ============================== 4. COMPANIE AERIANĂ ==============================
{
  id:"aeriana", nume:"Companie aeriană", icon:"✈️",
  nivel:"Examen++. Tehnici noi: LIKE cu lungime fixă ('____u'), egalități la maxim (MAX), COUNT filtrat, subinterogare corelată cu EXISTS.",
  rezumat:"Lungime fixă cu '____u', maxim cu egalități (HAVING = MAX), NOT EXISTS corelat.",
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
     sql:"SELECT Prenume FROM Pasageri WHERE Nume LIKE '____u';",
     note:"<b>Explicație:</b> fiecare <code>_</code> impune <b>exact un</b> caracter. Patru <code>_</code> + litera <code>u</code> = șir de <b>fix 5</b> caractere terminat în „u”. „Radu” (4) → nu; „Stanu” (5) → da. <b>Reține:</b> <code>_</code> = exact un caracter, spre deosebire de <code>%</code> (orice șir, inclusiv vid) — pe asta ne bazăm ca să fixăm lungimea."},
    {lit:"b", enunt:"Afișează <b>codurile biletelor</b> care au fost <b>anulate</b>.",
     sql:"SELECT Cod_Bilet FROM Bilete WHERE Anulat IS NOT NULL;",
     note:"<b>Explicație:</b> bilet anulat ⇒ are <b>data</b> anulării → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>țara (sau țările)</b> cu cel mai mare număr de pasageri, <b>inclusiv în caz de egalitate</b>.",
     sql:"SELECT Tara FROM Pasageri\nGROUP BY Tara\nHAVING COUNT(*) = (\n    SELECT MAX(Nr) FROM \n        SELECT COUNT(*) AS Nr FROM Pasageri GROUP BY Tara\n    ) AS T\n);",
     note:"<b>Escaladare reală față de „TOP 1”:</b> problemele 1–3 foloseau <code>TOP 1 ... ORDER BY COUNT DESC</code>, care întoarce <b>o singură</b> țară chiar la egalitate. Aici: subinterogarea calculează nr. de pasageri per țară, <code>MAX(Nr)</code> găsește maximul, iar <code>HAVING COUNT(*) = max</code> păstrează <b>toate</b> țările care îl ating. <code>WITH TIES</code> include automat egalitățile."},
    {lit:"d", enunt:"Afișează <b>rezervările confirmate</b> ale pasagerilor din „Romania”.",
     sql:"SELECT Rezervari.* FROM Rezervari\nINNER JOIN Pasageri ON Pasageri.Id_Pasager = Rezervari.Id_Pasager\nWHERE Pasageri.Tara = 'Romania' AND Rezervari.Stare = 'C';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru țară + <code>Stare = 'C'</code> (confirmată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de bilete valide</b> (neanulate) per pasager, descrescător; doar pasagerii cu cel puțin un bilet valid.",
     sql:"SELECT Nume, Prenume, COUNT(Bilete.Id_Bilet) AS Nr_Bilete_Valide\nFROM Pasageri\n     INNER JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager\n     INNER JOIN Bilete    ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare\nWHERE Bilete.Anulat IS NULL\nGROUP BY Rezervari.Id_Pasager, Nume, Prenume\nORDER BY COUNT(Bilete.Id_Bilet) DESC;",
     note:"<b>Escaladare — <code>COUNT</code> filtrat:</b> numărăm <b>doar</b> biletele cu <code>Anulat IS NULL</code>. Filtrul stă în <code>WHERE</code> (înainte de agregare); <code>INNER JOIN</code> + acel <code>WHERE</code> garantează doar pasagerii cu cel puțin un bilet valid. Varianta <code>COUNT(CASE WHEN ... )</code> păstrează și pasagerii cu 0 valide."},
    {lit:"f", enunt:"Afișează <b>numărul de bilete valabile</b> emise din 01.07.2021–31.07.2021 pentru care <b>a cincea cifră</b> a codului e <b>impară</b>.",
     sql:"SELECT COUNT(*) FROM Rezervari\nINNER JOIN Bilete ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare\nWHERE Bilete.Anulat IS NULL\n  AND (Rezervari.Data >= '2021-07-01' AND Rezervari.Data < '2021-08-01')\n  AND Bilete.Cod_Bilet LIKE '____[13579]%';",
     note:"<b>Explicație:</b> <code>Anulat IS NULL</code> (valabil); interval iulie 2021 robust; <code>Cod_Bilet LIKE '____[13579]%'</code> → patru <code>_</code> consumă exact primele 4 caractere, <code>[13579]</code> cere ca al <b>5-lea</b> să fie cifră impară, <code>%</code> = restul liber."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> pasagerilor cu <b>minimum trei rezervări în același an</b> (un pasager o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Pasageri\nINNER JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager\nGROUP BY Rezervari.Id_Pasager, YEAR(Data), Nume, Prenume\nHAVING COUNT(*) >= 3;",
     note:"<b>Explicație:</b> grupare pe (pasager, an); <code>HAVING &gt;= 3</code> + <code>DISTINCT</code> (un pasager care îndeplinește condiția în mai mulți ani apare o singură dată)."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul biletului</b> pasagerilor cu cel puțin un bilet <b>neanulat</b> care <b>expiră înainte</b> de 31 decembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Bilet\nFROM Pasageri\n     INNER JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager\n     INNER JOIN Bilete    ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare\nWHERE Bilete.Anulat IS NULL\n  AND Bilete.Valabil_Pana_La < '2021-12-31';",
     note:"<b>Explicație:</b> lanț <code>Pasageri → Rezervari → Bilete</code>; <code>Anulat IS NULL</code> = neanulat, <code>Valabil_Pana_La &lt; '2021-12-31'</code> = expiră înainte. În SQL Server cele două <code>INNER JOIN</code> se înlănțuie direct, fără paranteze."},
    {lit:"i", enunt:"Afișează <b>numele și prenumele</b> pasagerilor care <b>nu au nicio rezervare anulată</b> (<code>Stare = 'X'</code>).",
     sql:"SELECT Nume, Prenume FROM Pasageri P\nWHERE NOT EXISTS (\n    SELECT 1 FROM Rezervari R\n    WHERE R.Id_Pasager = P.Id_Pasager AND R.Stare = 'X'\n);",
     note:"<b>Subinterogare corelată:</b> pentru fiecare pasager, subinterogarea caută o rezervare anulată a <b>acelui</b> pasager (corelarea <code>R.Id_Pasager = P.Id_Pasager</code>); <code>NOT EXISTS</code> păstrează pasagerii pentru care nu s-a găsit niciuna. <b>Dublă negație:</b> include și pasagerii fără nicio rezervare — pentru „are rezervări, dar niciuna anulată” adaugi un <code>EXISTS</code> suplimentar. <b>De ce nu <code>Stare &lt;&gt; 'X'</code> într-un JOIN:</b> un pasager cu o rezervare <code>'C'</code> și una <code>'X'</code> ar apărea totuși prin cea <code>'C'</code> — greșit."}
  ],
  anexa:"CREATE TABLE Pasageri (\n    Id_Pasager INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Tara    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Rezervari (\n    Id_Rezervare INT PRIMARY KEY,\n    Id_Pasager   INT NOT NULL,\n    Data         DATETIME NOT NULL,\n    Stare        CHAR(1) NULL,               -- NULL / 'C' / 'X'\n    FOREIGN KEY (Id_Pasager) REFERENCES Pasageri(Id_Pasager)\n);\n\nCREATE TABLE Bilete (\n    Id_Bilet        INT PRIMARY KEY,\n    Id_Rezervare    INT NOT NULL,\n    Cod_Bilet       VARCHAR(10) NOT NULL,\n    Valabil_De_La   DATETIME NOT NULL,\n    Valabil_Pana_La DATETIME NOT NULL,\n    Anulat          DATETIME NULL,           -- NULL = valid\n    FOREIGN KEY (Id_Rezervare) REFERENCES Rezervari(Id_Rezervare)\n);\n\nINSERT INTO Pasageri VALUES\n (1,'Stanu','Mihai','Romania'),     -- 5 litere, termina in u\n (2,'Radu','Ioana','Romania'),      -- 4 litere -> NU la a)\n (3,'Lupascu','Dan','Germania'),\n (4,'Marcu','Elena','Romania');     -- 5 litere, termina in u\n\nINSERT INTO Rezervari VALUES\n (10,1,'2021-07-02','C'),\n (11,1,'2021-07-09','C'),\n (12,1,'2021-09-14','C'),     -- Stanu: 3 rezervari in 2021 -> cerinta g\n (13,2,'2021-07-20','X'),     -- Radu are o rezervare anulata -> exclus la i)\n (14,3,'2021-07-25','C'),\n (15,4,'2021-01-05',NULL);\n\nINSERT INTO Bilete VALUES\n (100,10,'AB7C13XY','2021-07-02','2021-12-01',NULL),  -- pozitia 5 = '1' (impar), neanulat, expira < 31.12\n (101,11,'ABCD2EFG','2021-07-09','2022-07-09',NULL),  -- pozitia 5 = '2' (par) -> exclus la f\n (102,12,'ZZZZ9000','2021-09-14','2022-01-01','2021-10-01'),  -- anulat\n (103,14,'QWER5TYU','2021-07-25','2022-07-25',NULL),  -- pozitia 5 = '5' (impar)\n (104,15,'1111X222','2021-01-05','2021-06-30',NULL);"
},

// ============================== 5. SERVICE AUTO (capstone) ==============================
{
  id:"service", nume:"Service auto (capstone)", icon:"🔧",
  nivel:"Examen+++ (recapitulare). Reunește toate tehnicile: clasă la început '[A-M]%', WHERE→GROUP BY→HAVING→ORDER BY, comparație între coloane, dublă negație, cele trei moduri de a găsi orfanii.",
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
     sql:"SELECT Prenume FROM Clienti WHERE Nume LIKE '[A-M]%';",
     note:"<b>Explicație:</b> <code>[A-M]</code> = clasă de caractere — <b>primul</b> caracter trebuie să fie o literă între A și M; <code>%</code> = restul liber. Prinde „Barbu”, „Marin”, dar nu „Nedelcu” sau „Popa”. <b>Notă:</b> clasele <code>[..]</code> în <code>LIKE</code> sunt o facilitate specifică <b>SQL Server</b>; atenție la <b>collation</b> pentru ordonarea literelor și diacritice."},
    {lit:"b", enunt:"Afișează <b>codurile pieselor</b> care au fost <b>reclamate</b>.",
     sql:"SELECT Cod_Piesa FROM Piese_Montate WHERE Reclamata IS NOT NULL;",
     note:"<b>Explicație:</b> piesă reclamată ⇒ are <b>data</b> reclamației → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>localitatea (sau localitățile)</b> cu cel mai mare număr de clienți, <b>inclusiv la egalitate</b>.",
     sql:"SELECT Localitate FROM Clienti\nGROUP BY Localitate\nHAVING COUNT(*) = (\n    SELECT MAX(Nr) FROM SELECT COUNT(*) AS Nr FROM Clienti GROUP BY Localitate) AS T\n);",
     note:"<b>Explicație:</b> ca la 4c — subinterogarea găsește numărul maxim de clienți pe o localitate, iar <code>HAVING</code> întoarce <b>toate</b> localitățile care îl ating (corect și la egalitate, spre deosebire de <code>TOP 1</code>)."},
    {lit:"d", enunt:"Afișează <b>comenzile finalizate</b> ale clienților din „Brașov”.",
     sql:"SELECT Comenzi_Service.* FROM Comenzi_Service\nINNER JOIN Clienti ON Clienti.Id_Client = Comenzi_Service.Id_Client\nWHERE Clienti.Localitate = 'Brasov' AND Comenzi_Service.Stare = 'F';",
     note:"<b>Explicație:</b> <code>INNER JOIN</code> + filtru localitate + <code>Stare = 'F'</code> (finalizată)."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de comenzi finalizate</b> ale clienților cu <b>cel puțin două</b>, descrescător.",
     sql:"SELECT Nume, Prenume, COUNT(*) AS Nr_Finalizate\nFROM Clienti\nINNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client\nWHERE Comenzi_Service.Stare = 'F'\nGROUP BY Comenzi_Service.Id_Client, Nume, Prenume\nHAVING COUNT(*) >= 2\nORDER BY COUNT(*) DESC;",
     note:"<b>Rețeta canonică <code>WHERE → GROUP BY → HAVING → ORDER BY</code>:</b> <code>WHERE</code> filtrează rândurile înainte de grupare (doar <code>'F'</code>), <code>GROUP BY</code> pe client, <code>HAVING</code> filtrează grupele (≥2), <code>ORDER BY</code> sortează. <b>Capcană:</b> condiția pe stare merge în <code>WHERE</code> (despre rânduri), cea pe număr în <code>HAVING</code> (despre grupe) — <code>WHERE COUNT(*)&gt;=2</code> e eroare de sintaxă."},
    {lit:"f", enunt:"Afișează <b>numărul de piese montate</b> pe comenzi <b>finalizate</b> în anul <b>2021</b>, cu <b>garanția expirată</b> (înainte de 31.12.2021) și care <b>nu</b> au fost reclamate.",
     sql:"SELECT COUNT(*) FROM Comenzi_Service\nINNER JOIN Piese_Montate ON Comenzi_Service.Id_Comanda = Piese_Montate.Id_Comanda\nWHERE Comenzi_Service.Stare = 'F'\n  AND YEAR(Comenzi_Service.Data) = 2021\n  AND Piese_Montate.Garantie_Pana_La < '2021-12-31'\n  AND Piese_Montate.Reclamata IS NULL;",
     note:"<b>Explicație:</b> patru condiții — comandă <b>finalizată</b>, din anul <b>2021</b> (<code>YEAR(Data)=2021</code>, alternativ <code>&gt;= '2021-01-01' AND &lt; '2022-01-01'</code>), garanție <b>expirată</b> (<code>Garantie_Pana_La &lt; '2021-12-31'</code>) și piesă <b>nereclamată</b> (<code>Reclamata IS NULL</code>)."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> clienților cu <b>minimum două comenzi în aceeași lună</b> (un client o singură dată).",
     sql:"SELECT DISTINCT Nume, Prenume FROM Clienti\nINNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client\nGROUP BY Comenzi_Service.Id_Client, YEAR(Data), MONTH(Data), Nume, Prenume\nHAVING COUNT(*) >= 2;",
     note:"<b>Explicație:</b> grupare pe (client, an, lună); <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul piesei</b> clienților cu cel puțin o piesă <b>nereclamată</b> a cărei <b>garanție expiră înainte</b> de 31 decembrie 2021.",
     sql:"SELECT Nume, Prenume, Cod_Piesa\nFROM Clienti\n     INNER JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client\n     INNER JOIN Piese_Montate   ON Comenzi_Service.Id_Comanda = Piese_Montate.Id_Comanda\nWHERE Piese_Montate.Reclamata IS NULL\n  AND Piese_Montate.Garantie_Pana_La < '2021-12-31';",
     note:"<b>Explicație:</b> lanț <code>Clienti → Comenzi_Service → Piese_Montate</code>; <code>Reclamata IS NULL</code> = nereclamată, <code>Garantie_Pana_La &lt; '2021-12-31'</code> = expiră înainte. În SQL Server cele două <code>INNER JOIN</code> se înlănțuie direct, fără paranteze."},
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
},

// ============================== 6. HOTEL ==============================
{
  id:"hotel", nume:"Hotel", icon:"🏨",
  nivel:"Examen. Reia tiparul pe lanțul Oaspeți → Rezervări → Facturi și adaugă JOIN-uri externe (LEFT/FULL) și HAVING cu SUM.",
  rezumat:"Rezervări și facturi de hotel; include LEFT JOIN, FULL OUTER JOIN și HAVING SUM.",
  intro:"Fie tabelele <code>Oaspeti</code>, <code>Rezervari</code> și <code>Facturi</code>, în care sunt păstrate informații despre oaspeții unui hotel, rezervările făcute și facturile emise.",
  tabele:[
    {nume:"Oaspeti", campuri:[["Id_Oaspete (PK)","nu","int"],["Nume","nu","varchar(50)"],["Prenume","nu","varchar(50)"],["Oras","nu","varchar(50)"]]},
    {nume:"Rezervari", campuri:[["Id_Rezervare (PK)","nu","int"],["Id_Oaspete (FK)","nu","int"],["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Facturi", campuri:[["Id_Factura (PK)","nu","int"],["Id_Rezervare (FK)","nu","int"],["Cod_Factura","nu","varchar(10)"],["Emisa_La","nu","datetime"],["Scadenta","nu","datetime"],["Total","nu","decimal(10,2)"],["Achitata","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei rezervări are valoarea <code>null</code> la creare, <code>C</code> după check-in (cazat), sau <code>A</code> dacă a fost <b>anulată</b>.",
    "Câmpul <code>Achitata</code> are valoarea <code>null</code> dacă factura <b>nu</b> a fost plătită, sau conține <b>data</b> plății."
  ],
  relatii:"<code>Oaspeti 1—N Rezervari 1—N Facturi</code>. Un oaspete face mai multe rezervări; o rezervare onorată produce una sau mai multe facturi.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> oaspeților al căror <b>nume începe</b> cu „Pop”.", sql:"SELECT Prenume FROM Oaspeti WHERE Nume LIKE 'Pop%';", note:"<code>%</code> = orice șir (inclusiv vid) după prefix."},
    {lit:"b", enunt:"Afișează <b>codurile facturilor</b> deja <b>achitate</b>.", sql:"SELECT Cod_Factura FROM Facturi WHERE Achitata IS NOT NULL;", note:"<code>Achitata = null</code> ⇒ neachitată; achitată ⇒ are dată → <code>IS NOT NULL</code> (nu <code>&lt;&gt; null</code>)."},
    {lit:"c", enunt:"Afișează <b>orașul</b> cu cei mai mulți oaspeți.", sql:"SELECT TOP (1) Oras FROM Oaspeti\nGROUP BY Oras\nORDER BY COUNT(*) DESC;", note:"grupare + ordonare descrescătoare, prima înregistrare."},
    {lit:"d", enunt:"Afișează <b>rezervările cazate</b> (<code>Stare='C'</code>) ale oaspeților din „Brașov”.", sql:"SELECT Rezervari.* FROM Rezervari\nINNER JOIN Oaspeti ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete\nWHERE Oaspeti.Oras = 'Brasov' AND Rezervari.Stare = 'C';", note:"<code>INNER JOIN</code> + filtru oraș + stare; <code>'C'</code> exclude automat <code>NULL</code> și <code>'A'</code>."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de rezervări</b> per oaspete, descrescător.", sql:"SELECT Nume, Prenume, COUNT(Id_Rezervare) AS Nr\nFROM Oaspeti\nINNER JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete\nGROUP BY Rezervari.Id_Oaspete, Nume, Prenume\nORDER BY COUNT(Id_Rezervare) DESC;", note:"<code>Id_Oaspete</code> în <code>GROUP BY</code> separă omonimii; <code>INNER JOIN</code> exclude oaspeții fără rezervări."},
    {lit:"f", enunt:"Afișează <b>numărul de facturi</b> ale rezervărilor cazate, emise în <b>noiembrie 2021</b>, al căror cod începe cu o <b>cifră nenulă</b>.", sql:"SELECT COUNT(*) FROM Rezervari\nINNER JOIN Facturi ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare\nWHERE Rezervari.Stare = 'C'\n  AND (Facturi.Emisa_La >= '2021-11-01' AND Facturi.Emisa_La < '2021-12-01')\n  AND Facturi.Cod_Factura LIKE '[1-9]%';", note:"interval de date sigur (<code>&gt;= 01.11 AND &lt; 01.12</code>) + clasa <code>[1-9]</code> pe prima poziție."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> oaspeților cu <b>minimum două rezervări în aceeași lună</b> (o singură dată).", sql:"SELECT DISTINCT Nume, Prenume FROM Oaspeti\nINNER JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete\nGROUP BY Rezervari.Id_Oaspete, YEAR(Data), MONTH(Data), Nume, Prenume\nHAVING COUNT(*) >= 2;", note:"grupare pe (oaspete, an, lună); <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul facturii</b> oaspeților cu cel puțin o factură <b>neachitată</b> <b>scadentă înainte</b> de 31 decembrie 2021.", sql:"SELECT Nume, Prenume, Cod_Factura\nFROM Oaspeti\n     INNER JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete\n     INNER JOIN Facturi   ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare\nWHERE Facturi.Achitata IS NULL\n  AND Facturi.Scadenta < '2021-12-31';", note:"dublu <code>INNER JOIN</code> + <code>IS NULL</code> + comparație de date. În SQL Server înlănțuiești direct mai multe JOIN-uri, fără paranteze."},
    {lit:"i", enunt:"Afișează <b>codurile facturilor „orfane”</b> (facturi pentru care a fost ștearsă rezervarea).", sql:"SELECT Cod_Factura FROM Facturi F\nWHERE NOT EXISTS (SELECT 1 FROM Rezervari R WHERE R.Id_Rezervare = F.Id_Rezervare);", note:"FK obligatoriu → fără orfani în acest design. <code>NOT EXISTS</code> e robust la <code>NULL</code> (spre deosebire de <code>NOT IN</code>)."},
    {lit:"j", enunt:"<b>(LEFT JOIN)</b> Afișează <b>toți</b> oaspeții și <b>numărul lor de facturi</b>, <b>inclusiv</b> cei fără nicio factură (apar cu 0).", sql:"SELECT Nume, Prenume, COUNT(Facturi.Id_Factura) AS Nr_Facturi\nFROM Oaspeti\n     LEFT JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete\n     LEFT JOIN Facturi   ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare\nGROUP BY Oaspeti.Id_Oaspete, Nume, Prenume\nORDER BY Nr_Facturi DESC;", note:"<b>LEFT JOIN</b> păstrează oaspeții fără facturi; <code>COUNT(Facturi.Id_Factura)</code> nu numără <code>NULL</code>-urile → <b>0</b> pentru ei. Cu <code>INNER JOIN</code> ar dispărea."},
    {lit:"k", enunt:"<b>(FULL OUTER JOIN)</b> Afișează corespondența completă <b>rezervare ↔ factură</b>, inclusiv rezervările fără factură și (ipotetic) facturile fără rezervare.", sql:"SELECT Rezervari.Id_Rezervare, Facturi.Cod_Factura\nFROM Rezervari\nFULL OUTER JOIN Facturi ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare;", note:"<b>FULL OUTER JOIN</b> = toate rândurile din ambele tabele, cu <code>NULL</code> unde nu există corespondent. SQL Server îl suportă; Access îl simulează prin <code>UNION</code> de <code>LEFT</code> + <code>RIGHT</code>."},
    {lit:"l", enunt:"<b>(HAVING + SUM)</b> Afișează <b>numele, prenumele</b> și <b>totalul facturat</b> al oaspeților cu <b>total ≥ 1000</b>.", sql:"SELECT Nume, Prenume, SUM(Total) AS Total_Facturat\nFROM Oaspeti\n     INNER JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete\n     INNER JOIN Facturi   ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare\nGROUP BY Oaspeti.Id_Oaspete, Nume, Prenume\nHAVING SUM(Total) >= 1000\nORDER BY Total_Facturat DESC;", note:"<code>HAVING</code> filtrează <b>grupele</b> după agregare (<code>SUM</code>); <code>WHERE</code> nu poate folosi funcții de agregare."}
  ],
  anexa:"CREATE TABLE Oaspeti (\n    Id_Oaspete INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Oras    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Rezervari (\n    Id_Rezervare INT PRIMARY KEY,\n    Id_Oaspete   INT NOT NULL,\n    Data         DATETIME NOT NULL,\n    Stare        CHAR(1) NULL,               -- NULL / 'C' / 'A'\n    FOREIGN KEY (Id_Oaspete) REFERENCES Oaspeti(Id_Oaspete)\n);\n\nCREATE TABLE Facturi (\n    Id_Factura   INT PRIMARY KEY,\n    Id_Rezervare INT NOT NULL,\n    Cod_Factura  VARCHAR(10) NOT NULL,\n    Emisa_La     DATETIME NOT NULL,\n    Scadenta     DATETIME NOT NULL,\n    Total        DECIMAL(10,2) NOT NULL,\n    Achitata     DATETIME NULL,              -- NULL = neachitata\n    FOREIGN KEY (Id_Rezervare) REFERENCES Rezervari(Id_Rezervare)\n);\n\nINSERT INTO Oaspeti VALUES\n (1,'Popescu','Andrei','Brasov'),\n (2,'Pop','Maria','Brasov'),\n (3,'Ionescu','Vlad','Cluj-Napoca'),\n (4,'Popa','Elena','Brasov'),\n (5,'Georgescu','Radu','Sibiu');      -- fara rezervari -> apare la j) cu 0\n\nINSERT INTO Rezervari VALUES\n (10,1,'2021-11-03','C'),\n (11,1,'2021-11-19','C'),\n (12,1,'2021-11-28','C'),    -- Popescu: 3 rezervari in nov 2021 -> g)\n (13,2,'2021-09-15','C'),\n (14,3,'2021-11-10',NULL),   -- in asteptare\n (15,4,'2021-12-02','A'),    -- anulata\n (16,1,'2021-05-04','C');\n\nINSERT INTO Facturi VALUES\n (100,10,'1234500001','2021-11-03','2021-11-30',450.00,'2021-11-10'),  -- achitata\n (101,11,'0567800002','2021-11-19','2021-12-19',300.00,NULL),          -- prima cifra 0 -> exclus la f; neachitata\n (102,12,'9001200003','2021-11-28','2021-12-28',620.00,NULL),          -- neachitata\n (103,13,'7777000004','2021-09-15','2021-10-15',180.00,'2021-09-20'),\n (104,16,'2222330005','2021-05-04','2021-11-29',520.00,NULL);          -- neachitata, scadenta < 31.12"
},

// ============================== 7. BANCĂ ==============================
{
  id:"banca", nume:"Bancă", icon:"🏦",
  nivel:"Examen. Lanțul Clienți → Conturi → Tranzacții; include RIGHT JOIN, LEFT JOIN și HAVING cu SUM pe sume de bani.",
  rezumat:"Conturi și tranzacții bancare; RIGHT/LEFT JOIN, storno (IS NULL), HAVING SUM.",
  intro:"Fie tabelele <code>Clienti</code>, <code>Conturi</code> și <code>Tranzactii</code>, în care sunt păstrate informații despre clienții unei bănci, conturile deschise și tranzacțiile efectuate.",
  tabele:[
    {nume:"Clienti", campuri:[["Id_Client (PK)","nu","int"],["Nume","nu","varchar(50)"],["Prenume","nu","varchar(50)"],["Sucursala","nu","varchar(50)"]]},
    {nume:"Conturi", campuri:[["Id_Cont (PK)","nu","int"],["Id_Client (FK)","nu","int"],["Data_Deschidere","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Tranzactii", campuri:[["Id_Tranzactie (PK)","nu","int"],["Id_Cont (FK)","nu","int"],["Cod_Tranzactie","nu","varchar(10)"],["Data","nu","datetime"],["Suma","nu","decimal(12,2)"],["Stornata","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unui cont are valoarea <code>null</code> la deschidere (în procesare), <code>A</code> dacă e <b>activ</b>, sau <code>I</code> dacă a fost <b>închis</b>.",
    "Câmpul <code>Stornata</code> are valoarea <code>null</code> dacă tranzacția e validă, sau conține <b>data</b> stornării (anulării)."
  ],
  relatii:"<code>Clienti 1—N Conturi 1—N Tranzactii</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> clienților al căror nume se termină în „escu”.", sql:"SELECT Prenume FROM Clienti WHERE Nume LIKE '%escu';", note:"sufix: <code>*</code>/<code>%</code> la stânga."},
    {lit:"b", enunt:"Afișează <b>codurile tranzacțiilor</b> care au fost <b>stornate</b>.", sql:"SELECT Cod_Tranzactie FROM Tranzactii WHERE Stornata IS NOT NULL;", note:"stornată ⇒ are <b>dată</b> → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>sucursala</b> cu cei mai mulți clienți.", sql:"SELECT TOP (1) Sucursala FROM Clienti\nGROUP BY Sucursala\nORDER BY COUNT(*) DESC;", note:"grupare + ordonare + prima."},
    {lit:"d", enunt:"Afișează <b>conturile active</b> (<code>Stare='A'</code>) ale clienților din „Cluj-Napoca”.", sql:"SELECT Conturi.* FROM Conturi\nINNER JOIN Clienti ON Clienti.Id_Client = Conturi.Id_Client\nWHERE Clienti.Sucursala = 'Cluj-Napoca' AND Conturi.Stare = 'A';", note:"<code>INNER JOIN</code> + filtre."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de tranzacții</b> per client, descrescător.", sql:"SELECT Nume, Prenume, COUNT(Tranzactii.Id_Tranzactie) AS Nr\nFROM Clienti\n     INNER JOIN Conturi    ON Clienti.Id_Client = Conturi.Id_Client\n     INNER JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont\nGROUP BY Conturi.Id_Client, Nume, Prenume\nORDER BY Nr DESC;", note:"lanț triplu + agregare."},
    {lit:"f", enunt:"Afișează <b>numărul de tranzacții</b> ale conturilor active, efectuate în <b>octombrie 2021</b>, cu <b>ultima cifră</b> a codului <b>pară</b>.", sql:"SELECT COUNT(*) FROM Conturi\nINNER JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont\nWHERE Conturi.Stare = 'A'\n  AND (Tranzactii.Data >= '2021-10-01' AND Tranzactii.Data < '2021-11-01')\n  AND Tranzactii.Cod_Tranzactie LIKE '%[02468]';", note:"<code>*[02468]</code> = ultimul caracter cifră pară."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> clienților cu <b>minimum două conturi deschise în aceeași lună</b> (o singură dată).", sql:"SELECT DISTINCT Nume, Prenume FROM Clienti\nINNER JOIN Conturi ON Clienti.Id_Client = Conturi.Id_Client\nGROUP BY Conturi.Id_Client, YEAR(Data_Deschidere), MONTH(Data_Deschidere), Nume, Prenume\nHAVING COUNT(*) >= 2;", note:"grupare pe (client, an, lună) + <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul tranzacției</b> clienților cu cel puțin o tranzacție <b>nestornată</b> efectuată <b>înainte</b> de 1 octombrie 2021.", sql:"SELECT Nume, Prenume, Cod_Tranzactie\nFROM Clienti\n     INNER JOIN Conturi    ON Clienti.Id_Client = Conturi.Id_Client\n     INNER JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont\nWHERE Tranzactii.Stornata IS NULL\n  AND Tranzactii.Data < '2021-10-01';", note:"dublu <code>JOIN</code> + <code>IS NULL</code> + comparație de date."},
    {lit:"i", enunt:"Afișează <b>codurile tranzacțiilor „orfane”</b> (tranzacții pentru care a fost șters contul).", sql:"SELECT Cod_Tranzactie FROM Tranzactii T\nWHERE NOT EXISTS (SELECT 1 FROM Conturi C WHERE C.Id_Cont = T.Id_Cont);", note:"integritate referențială → fără orfani; <code>NOT EXISTS</code> robust."},
    {lit:"j", enunt:"<b>(LEFT JOIN)</b> Afișează <b>toate</b> conturile și <b>numărul lor de tranzacții</b>, <b>inclusiv</b> conturile fără nicio tranzacție (0).", sql:"SELECT Conturi.Id_Cont, COUNT(Tranzactii.Id_Tranzactie) AS Nr\nFROM Conturi\nLEFT JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont\nGROUP BY Conturi.Id_Cont\nORDER BY Nr DESC;", note:"<b>LEFT JOIN</b> + <code>COUNT</code> pe coloana din dreapta → 0 pentru conturile fără tranzacții."},
    {lit:"k", enunt:"<b>(RIGHT JOIN)</b> Afișează <b>toate tranzacțiile</b> și clientul aferent (chiar dacă, ipotetic, contul ar lipsi).", sql:"SELECT Clienti.Nume, Tranzactii.Cod_Tranzactie\nFROM Clienti\nINNER JOIN Conturi ON Clienti.Id_Client = Conturi.Id_Client\nRIGHT JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont;", note:"<b>RIGHT JOIN</b> păstrează <b>toate</b> rândurile din tabela din dreapta (Tranzactii), chiar dacă lanțul din stânga nu are corespondent. Access nu are <code>RIGHT JOIN</code> standard — se rescrie ca <code>LEFT JOIN</code> inversând tabelele."},
    {lit:"l", enunt:"<b>(HAVING + SUM)</b> Afișează <b>conturile</b> al căror <b>total tranzacții nestornate</b> depășește <b>5000</b>.", sql:"SELECT Id_Cont, SUM(Suma) AS Total\nFROM Tranzactii\nWHERE Stornata IS NULL\nGROUP BY Id_Cont\nHAVING SUM(Suma) > 5000\nORDER BY Total DESC;", note:"<code>WHERE</code> filtrează rândurile (nestornate) <b>înainte</b> de agregare; <code>HAVING</code> filtrează grupele după <code>SUM</code>."}
  ],
  anexa:"CREATE TABLE Clienti (\n    Id_Client INT PRIMARY KEY,\n    Nume      VARCHAR(50) NOT NULL,\n    Prenume   VARCHAR(50) NOT NULL,\n    Sucursala VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Conturi (\n    Id_Cont         INT PRIMARY KEY,\n    Id_Client       INT NOT NULL,\n    Data_Deschidere DATETIME NOT NULL,\n    Stare           CHAR(1) NULL,            -- NULL / 'A' / 'I'\n    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)\n);\n\nCREATE TABLE Tranzactii (\n    Id_Tranzactie  INT PRIMARY KEY,\n    Id_Cont        INT NOT NULL,\n    Cod_Tranzactie VARCHAR(10) NOT NULL,\n    Data           DATETIME NOT NULL,\n    Suma           DECIMAL(12,2) NOT NULL,\n    Stornata       DATETIME NULL,            -- NULL = valida\n    FOREIGN KEY (Id_Cont) REFERENCES Conturi(Id_Cont)\n);\n\nINSERT INTO Clienti VALUES\n (1,'Ionescu','Bogdan','Cluj-Napoca'),\n (2,'Popescu','Carmen','Cluj-Napoca'),\n (3,'Dinu','Vlad','Iasi'),\n (4,'Stoica','Ana','Cluj-Napoca');\n\nINSERT INTO Conturi VALUES\n (10,1,'2021-03-04','A'),\n (11,1,'2021-03-22','A'),    -- Ionescu: 2 conturi in martie -> g)\n (12,2,'2021-07-15','A'),\n (13,3,'2021-10-01',NULL),   -- in procesare\n (14,4,'2021-05-09','I'),    -- inchis\n (15,1,'2021-09-01','A');    -- cont fara tranzactii -> apare la j) cu 0\n\nINSERT INTO Tranzactii VALUES\n (100,10,'TX1234560','2021-09-03',3200.00,NULL),\n (101,11,'TX0567892','2021-10-19',1500.00,NULL),  -- octombrie, ultima cifra 2 (para)\n (102,12,'TX9001234','2021-10-28', 800.00,'2021-10-30'),  -- stornata; ultima cifra 4 dar cont 'A' -> daca nestornata ar conta\n (103,10,'TX7777008','2021-10-10',6000.00,NULL),  -- octombrie, ultima cifra 8 (para)\n (104,14,'TX2222333','2021-05-04', 120.00,NULL);"
},

// ============================== 8. ASIGURĂRI AUTO ==============================
{
  id:"asigurari", nume:"Asigurări auto", icon:"🚗",
  nivel:"Examen. Lanțul Asigurați → Polițe → Daune; include LEFT/FULL JOIN, HAVING cu SUM și comparație de date.",
  rezumat:"Polițe și daune auto; daune neplătite (IS NULL), LEFT/FULL JOIN, HAVING SUM.",
  intro:"Fie tabelele <code>Asigurati</code>, <code>Polite</code> și <code>Daune</code>, în care sunt păstrate informații despre asigurații unei firme de asigurări auto, polițele emise și daunele deschise.",
  tabele:[
    {nume:"Asigurati", campuri:[["Id_Asigurat (PK)","nu","int"],["Nume","nu","varchar(50)"],["Prenume","nu","varchar(50)"],["Judet","nu","varchar(50)"]]},
    {nume:"Polite", campuri:[["Id_Polita (PK)","nu","int"],["Id_Asigurat (FK)","nu","int"],["Data_Emitere","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Daune", campuri:[["Id_Dauna (PK)","nu","int"],["Id_Polita (FK)","nu","int"],["Cod_Dosar","nu","varchar(10)"],["Data_Deschidere","nu","datetime"],["Termen_Solutionare","nu","datetime"],["Valoare","nu","decimal(10,2)"],["Platita","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei polițe are valoarea <code>null</code> la creare (draft), <code>V</code> dacă e <b>validă</b>, sau <code>R</code> dacă a fost <b>reziliată</b>.",
    "Câmpul <code>Platita</code> are valoarea <code>null</code> dacă dauna <b>nu</b> a fost plătită, sau conține <b>data</b> plății."
  ],
  relatii:"<code>Asigurati 1—N Polite 1—N Daune</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> asiguraților al căror <b>nume conține</b> „an”.", sql:"SELECT Prenume FROM Asigurati WHERE Nume LIKE '%an%';", note:"<code>*..*</code> = „conține”."},
    {lit:"b", enunt:"Afișează <b>codurile de dosar</b> ale daunelor <b>plătite</b>.", sql:"SELECT Cod_Dosar FROM Daune WHERE Platita IS NOT NULL;", note:"plătită ⇒ are <b>dată</b> → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>județul</b> cu cei mai mulți asigurați.", sql:"SELECT TOP (1) Judet FROM Asigurati\nGROUP BY Judet\nORDER BY COUNT(*) DESC;", note:"grupare + ordonare + prima."},
    {lit:"d", enunt:"Afișează <b>polițele valide</b> (<code>Stare='V'</code>) ale asiguraților din „Cluj”.", sql:"SELECT Polite.* FROM Polite\nINNER JOIN Asigurati ON Asigurati.Id_Asigurat = Polite.Id_Asigurat\nWHERE Asigurati.Judet = 'Cluj' AND Polite.Stare = 'V';", note:"<code>INNER JOIN</code> + filtre."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de polițe</b> per asigurat, descrescător.", sql:"SELECT Nume, Prenume, COUNT(Id_Polita) AS Nr\nFROM Asigurati\nINNER JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat\nGROUP BY Polite.Id_Asigurat, Nume, Prenume\nORDER BY Nr DESC;", note:"agregare + ordonare."},
    {lit:"f", enunt:"Afișează <b>numărul de daune</b> ale polițelor valide, deschise în <b>iulie 2021</b>, cu <b>a doua cifră</b> a codului „7”.", sql:"SELECT COUNT(*) FROM Polite\nINNER JOIN Daune ON Polite.Id_Polita = Daune.Id_Polita\nWHERE Polite.Stare = 'V'\n  AND (Daune.Data_Deschidere >= '2021-07-01' AND Daune.Data_Deschidere < '2021-08-01')\n  AND Daune.Cod_Dosar LIKE '_7%';", note:"<code>?7*</code> = al doilea caracter „7”."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> asiguraților cu <b>minimum două polițe în același an</b> (o singură dată).", sql:"SELECT DISTINCT Nume, Prenume FROM Asigurati\nINNER JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat\nGROUP BY Polite.Id_Asigurat, YEAR(Data_Emitere), Nume, Prenume\nHAVING COUNT(*) >= 2;", note:"grupare pe (asigurat, an) + <code>HAVING &gt;= 2</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul de dosar</b> ale asiguraților cu cel puțin o daună <b>neplătită</b> al cărei <b>termen</b> e <b>înainte</b> de 31 decembrie 2021.", sql:"SELECT Nume, Prenume, Cod_Dosar\nFROM Asigurati\n     INNER JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat\n     INNER JOIN Daune  ON Polite.Id_Polita = Daune.Id_Polita\nWHERE Daune.Platita IS NULL\n  AND Daune.Termen_Solutionare < '2021-12-31';", note:"dublu <code>JOIN</code> + <code>IS NULL</code> + comparație de date."},
    {lit:"i", enunt:"Afișează <b>codurile de dosar „orfane”</b> (daune pentru care a fost ștearsă polița).", sql:"SELECT Cod_Dosar FROM Daune D\nLEFT JOIN Polite P ON D.Id_Polita = P.Id_Polita\nWHERE P.Id_Polita IS NULL;", note:"<code>LEFT JOIN ... IS NULL</code> (anti-join) izolează orfanii; FK obligatoriu → în practică niciunul."},
    {lit:"j", enunt:"<b>(LEFT JOIN)</b> Afișează <b>toți</b> asigurații și <b>numărul lor de daune</b>, <b>inclusiv</b> cei fără nicio daună (0).", sql:"SELECT Nume, Prenume, COUNT(Daune.Id_Dauna) AS Nr_Daune\nFROM Asigurati\n     LEFT JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat\n     LEFT JOIN Daune  ON Polite.Id_Polita = Daune.Id_Polita\nGROUP BY Asigurati.Id_Asigurat, Nume, Prenume\nORDER BY Nr_Daune DESC;", note:"<b>LEFT JOIN</b> păstrează asigurații fără daune; <code>COUNT</code> pe coloana din dreapta → 0."},
    {lit:"k", enunt:"<b>(FULL OUTER JOIN)</b> Afișează corespondența <b>poliță ↔ daună</b>, inclusiv polițele fără daune.", sql:"SELECT Polite.Id_Polita, Daune.Cod_Dosar\nFROM Polite\nFULL OUTER JOIN Daune ON Polite.Id_Polita = Daune.Id_Polita;", note:"<b>FULL OUTER JOIN</b> arată ambele părți; polițele fără daună au <code>Cod_Dosar = NULL</code>."},
    {lit:"l", enunt:"<b>(HAVING + SUM)</b> Afișează <b>asigurații</b> a căror <b>valoare totală a daunelor</b> depășește <b>10000</b>.", sql:"SELECT Nume, Prenume, SUM(Valoare) AS Total_Daune\nFROM Asigurati\n     INNER JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat\n     INNER JOIN Daune  ON Polite.Id_Polita = Daune.Id_Polita\nGROUP BY Asigurati.Id_Asigurat, Nume, Prenume\nHAVING SUM(Valoare) > 10000\nORDER BY Total_Daune DESC;", note:"<code>HAVING</code> pe <code>SUM(Valoare)</code> — agregat, deci nu poate sta în <code>WHERE</code>."}
  ],
  anexa:"CREATE TABLE Asigurati (\n    Id_Asigurat INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Judet   VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Polite (\n    Id_Polita    INT PRIMARY KEY,\n    Id_Asigurat  INT NOT NULL,\n    Data_Emitere DATETIME NOT NULL,\n    Stare        CHAR(1) NULL,               -- NULL / 'V' / 'R'\n    FOREIGN KEY (Id_Asigurat) REFERENCES Asigurati(Id_Asigurat)\n);\n\nCREATE TABLE Daune (\n    Id_Dauna           INT PRIMARY KEY,\n    Id_Polita          INT NOT NULL,\n    Cod_Dosar          VARCHAR(10) NOT NULL,\n    Data_Deschidere    DATETIME NOT NULL,\n    Termen_Solutionare DATETIME NOT NULL,\n    Valoare            DECIMAL(10,2) NOT NULL,\n    Platita            DATETIME NULL,         -- NULL = neplatita\n    FOREIGN KEY (Id_Polita) REFERENCES Polite(Id_Polita)\n);\n\nINSERT INTO Asigurati VALUES\n (1,'Stanciu','Mihai','Cluj'),\n (2,'Manea','Otilia','Cluj'),\n (3,'Radu','Paul','Sibiu'),\n (4,'Albu','Sanda','Cluj');     -- fara polite -> j) cu 0\n\nINSERT INTO Polite VALUES\n (10,1,'2021-07-03','V'),\n (11,1,'2021-09-25','V'),    -- Stanciu: 2 polite in 2021 -> g)\n (12,2,'2021-07-10','V'),\n (13,3,'2021-06-01',NULL),   -- draft\n (14,2,'2021-08-15','R');    -- reziliata\n\nINSERT INTO Daune VALUES\n (100,10,'D17AB0001','2021-07-03','2021-11-03', 8000.00,'2021-08-01'),  -- pozitia 2 = '7', platita\n (101,11,'D27CD0002','2021-09-25','2021-12-25', 4500.00,NULL),          -- neplatita, termen < 31.12\n (102,12,'D70EF0003','2021-07-15','2021-10-15', 3000.00,NULL),          -- pozitia 2 != '7' (e '0')\n (103,10,'D17GH0004','2021-07-20','2021-09-20', 2500.00,NULL);          -- pozitia 2 = '7'"
},

// ============================== 9. CURIERAT ==============================
{
  id:"curierat", nume:"Curierat", icon:"📦",
  nivel:"Examen. Lanțul Expeditori → Colete → Livrări; include LEFT/RIGHT JOIN, HAVING cu COUNT și clasă de caractere.",
  rezumat:"Colete și livrări; livrări eșuate (IS NOT NULL), LEFT/RIGHT JOIN, HAVING COUNT.",
  intro:"Fie tabelele <code>Expeditori</code>, <code>Colete</code> și <code>Livrari</code>, în care sunt păstrate informații despre expeditorii unei firme de curierat, coletele preluate și încercările de livrare.",
  tabele:[
    {nume:"Expeditori", campuri:[["Id_Expeditor (PK)","nu","int"],["Nume","nu","varchar(50)"],["Prenume","nu","varchar(50)"],["Oras","nu","varchar(50)"]]},
    {nume:"Colete", campuri:[["Id_Colet (PK)","nu","int"],["Id_Expeditor (FK)","nu","int"],["Data_Preluare","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Livrari", campuri:[["Id_Livrare (PK)","nu","int"],["Id_Colet (FK)","nu","int"],["Cod_AWB","nu","varchar(10)"],["Data_Iesire","nu","datetime"],["Termen_Livrare","nu","datetime"],["Cost","nu","decimal(8,2)"],["Esuata","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unui colet are valoarea <code>null</code> la preluare, <code>L</code> dacă a fost <b>livrat</b>, sau <code>R</code> dacă a fost <b>returnat</b>.",
    "Câmpul <code>Esuata</code> are valoarea <code>null</code> dacă livrarea a reușit, sau conține <b>data</b> la care a eșuat."
  ],
  relatii:"<code>Expeditori 1—N Colete 1—N Livrari</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> expeditorilor al căror <b>nume începe</b> cu o literă din intervalul A–M.", sql:"SELECT Prenume FROM Expeditori WHERE Nume LIKE '[A-M]%';", note:"clasă de caractere <code>[A-M]</code> pe prima poziție."},
    {lit:"b", enunt:"Afișează <b>codurile AWB</b> ale livrărilor care au <b>eșuat</b>.", sql:"SELECT Cod_AWB FROM Livrari WHERE Esuata IS NOT NULL;", note:"eșuată ⇒ are <b>dată</b> → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>orașul</b> cu cei mai mulți expeditori.", sql:"SELECT TOP (1) Oras FROM Expeditori\nGROUP BY Oras\nORDER BY COUNT(*) DESC;", note:"grupare + ordonare + prima."},
    {lit:"d", enunt:"Afișează <b>coletele livrate</b> (<code>Stare='L'</code>) ale expeditorilor din „Timișoara”.", sql:"SELECT Colete.* FROM Colete\nINNER JOIN Expeditori ON Expeditori.Id_Expeditor = Colete.Id_Expeditor\nWHERE Expeditori.Oras = 'Timisoara' AND Colete.Stare = 'L';", note:"<code>INNER JOIN</code> + filtre."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de colete</b> per expeditor, descrescător.", sql:"SELECT Nume, Prenume, COUNT(Id_Colet) AS Nr\nFROM Expeditori\nINNER JOIN Colete ON Expeditori.Id_Expeditor = Colete.Id_Expeditor\nGROUP BY Colete.Id_Expeditor, Nume, Prenume\nORDER BY Nr DESC;", note:"agregare + ordonare."},
    {lit:"f", enunt:"Afișează <b>numărul de livrări</b> ale coletelor livrate, ieșite în <b>martie 2021</b>, cu <b>prima cifră</b> a AWB-ului nenulă.", sql:"SELECT COUNT(*) FROM Colete\nINNER JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet\nWHERE Colete.Stare = 'L'\n  AND (Livrari.Data_Iesire >= '2021-03-01' AND Livrari.Data_Iesire < '2021-04-01')\n  AND Livrari.Cod_AWB LIKE '[1-9]%';", note:"interval de date sigur + clasă <code>[1-9]</code> pe prima poziție."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> expeditorilor cu <b>minimum trei colete în aceeași lună</b> (o singură dată).", sql:"SELECT DISTINCT Nume, Prenume FROM Expeditori\nINNER JOIN Colete ON Expeditori.Id_Expeditor = Colete.Id_Expeditor\nGROUP BY Colete.Id_Expeditor, YEAR(Data_Preluare), MONTH(Data_Preluare), Nume, Prenume\nHAVING COUNT(*) >= 3;", note:"grupare pe (expeditor, an, lună) + <code>HAVING &gt;= 3</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul AWB</b> expeditorilor cu cel puțin o livrare <b>reușită</b> al cărei <b>termen</b> e <b>înainte</b> de 30 noiembrie 2021.", sql:"SELECT Nume, Prenume, Cod_AWB\nFROM Expeditori\n     INNER JOIN Colete  ON Expeditori.Id_Expeditor = Colete.Id_Expeditor\n     INNER JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet\nWHERE Livrari.Esuata IS NULL\n  AND Livrari.Termen_Livrare < '2021-11-30';", note:"dublu <code>JOIN</code> + <code>IS NULL</code> (reușită) + comparație de date."},
    {lit:"i", enunt:"Afișează <b>codurile AWB „orfane”</b> (livrări pentru care a fost șters coletul).", sql:"SELECT Cod_AWB FROM Livrari L\nWHERE L.Id_Colet NOT IN (SELECT Id_Colet FROM Colete);", note:"<code>NOT IN</code> e fragil la <code>NULL</code>; preferă <code>NOT EXISTS</code>."},
    {lit:"j", enunt:"<b>(LEFT JOIN)</b> Afișează <b>toate</b> coletele și <b>numărul lor de livrări</b>, <b>inclusiv</b> coletele fără nicio livrare (0).", sql:"SELECT Colete.Id_Colet, COUNT(Livrari.Id_Livrare) AS Nr_Livrari\nFROM Colete\nLEFT JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet\nGROUP BY Colete.Id_Colet\nORDER BY Nr_Livrari DESC;", note:"<b>LEFT JOIN</b> + <code>COUNT</code> pe dreapta → 0 pentru coletele fără livrare."},
    {lit:"k", enunt:"<b>(RIGHT JOIN)</b> Afișează <b>toate livrările</b> și coletul aferent (chiar dacă, ipotetic, coletul ar lipsi).", sql:"SELECT Colete.Id_Colet, Livrari.Cod_AWB\nFROM Colete\nRIGHT JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet;", note:"<b>RIGHT JOIN</b> păstrează toate livrările; echivalent cu <code>Livrari LEFT JOIN Colete</code>."},
    {lit:"l", enunt:"<b>(HAVING + COUNT)</b> Afișează <b>coletele</b> care au avut <b>cel puțin 2 livrări eșuate</b>.", sql:"SELECT Id_Colet, COUNT(*) AS Nr_Esuate\nFROM Livrari\nWHERE Esuata IS NOT NULL\nGROUP BY Id_Colet\nHAVING COUNT(*) >= 2\nORDER BY Nr_Esuate DESC;", note:"<code>WHERE Esuata IS NOT NULL</code> (rânduri) → <code>GROUP BY</code> → <code>HAVING COUNT(*) &gt;= 2</code> (grupe)."}
  ],
  anexa:"CREATE TABLE Expeditori (\n    Id_Expeditor INT PRIMARY KEY,\n    Nume    VARCHAR(50) NOT NULL,\n    Prenume VARCHAR(50) NOT NULL,\n    Oras    VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Colete (\n    Id_Colet     INT PRIMARY KEY,\n    Id_Expeditor INT NOT NULL,\n    Data_Preluare DATETIME NOT NULL,\n    Stare        CHAR(1) NULL,               -- NULL / 'L' / 'R'\n    FOREIGN KEY (Id_Expeditor) REFERENCES Expeditori(Id_Expeditor)\n);\n\nCREATE TABLE Livrari (\n    Id_Livrare     INT PRIMARY KEY,\n    Id_Colet       INT NOT NULL,\n    Cod_AWB        VARCHAR(10) NOT NULL,\n    Data_Iesire    DATETIME NOT NULL,\n    Termen_Livrare DATETIME NOT NULL,\n    Cost           DECIMAL(8,2) NOT NULL,\n    Esuata         DATETIME NULL,            -- NULL = livrare reusita\n    FOREIGN KEY (Id_Colet) REFERENCES Colete(Id_Colet)\n);\n\nINSERT INTO Expeditori VALUES\n (1,'Barbu','Cristian','Timisoara'),    -- B in [A-M]\n (2,'Marin','Otilia','Timisoara'),      -- M in [A-M]\n (3,'Nedelcu','Paul','Arad'),           -- N nu e in [A-M]\n (4,'Olaru','Sanda','Timisoara');       -- O nu e in [A-M]; fara colete -> j) cu 0\n\nINSERT INTO Colete VALUES\n (10,1,'2021-03-03','L'),\n (11,1,'2021-03-19','L'),\n (12,1,'2021-03-28','L'),    -- Barbu: 3 colete in martie -> g)\n (13,2,'2021-05-15','L'),\n (14,3,'2021-03-10',NULL),   -- in tranzit\n (15,1,'2021-08-09','R');    -- returnat\n\nINSERT INTO Livrari VALUES\n (100,10,'1234560001','2021-03-03','2021-03-06', 19.50,NULL),   -- prima cifra 1, reusita\n (101,11,'0567800002','2021-03-19','2021-03-22', 24.00,'2021-03-21'),  -- prima cifra 0 -> exclus la f; esuata\n (102,11,'2345600003','2021-03-20','2021-03-23', 24.00,'2021-03-22'),  -- a 2-a livrare esuata pe coletul 11 -> l)\n (103,12,'9001200004','2021-03-28','2021-03-30', 30.00,NULL),   -- prima cifra 9, reusita\n (104,13,'7777000005','2021-05-15','2021-05-18', 15.00,NULL);"
},

// ============================== 10. UNIVERSITATE ==============================
{
  id:"universitate", nume:"Universitate", icon:"🎓",
  nivel:"Examen+. Lanțul Studenți → Înscrieri → Note; include LEFT/FULL JOIN, HAVING cu AVG și dublă negație.",
  rezumat:"Înscrieri la examen și note; contestații (IS NULL), LEFT/FULL JOIN, HAVING AVG.",
  intro:"Fie tabelele <code>Studenti</code>, <code>Inscrieri</code> și <code>Note</code>, în care sunt păstrate informații despre studenții unei facultăți, înscrierile la examene și notele obținute.",
  tabele:[
    {nume:"Studenti", campuri:[["Id_Student (PK)","nu","int"],["Nume","nu","varchar(50)"],["Prenume","nu","varchar(50)"],["Facultate","nu","varchar(50)"]]},
    {nume:"Inscrieri", campuri:[["Id_Inscriere (PK)","nu","int"],["Id_Student (FK)","nu","int"],["Data","nu","datetime"],["Stare","da","char(1)"]]},
    {nume:"Note", campuri:[["Id_Nota (PK)","nu","int"],["Id_Inscriere (FK)","nu","int"],["Cod_Disciplina","nu","varchar(10)"],["Data_Examen","nu","datetime"],["Valabila_Pana","nu","datetime"],["Nota","nu","decimal(4,2)"],["Contestata","da","datetime"]]}
  ],
  observatii:[
    "Câmpul <code>Stare</code> al unei înscrieri are valoarea <code>null</code> la înscriere, <code>P</code> dacă studentul a fost <b>prezent</b>, sau <code>A</code> dacă a fost <b>absent</b>.",
    "Câmpul <code>Contestata</code> are valoarea <code>null</code> dacă nota nu a fost contestată, sau conține <b>data</b> contestației."
  ],
  relatii:"<code>Studenti 1—N Inscrieri 1—N Note</code>.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> studenților al căror nume se termină în „escu” <b>sau</b> „eanu”.", sql:"SELECT Prenume FROM Studenti\nWHERE Nume LIKE '%escu' OR Nume LIKE '%eanu';", note:"două sufixe unite prin <code>OR</code> (atenție la paranteze cu alte filtre)."},
    {lit:"b", enunt:"Afișează <b>codurile disciplinelor</b> ale notelor <b>contestate</b>.", sql:"SELECT Cod_Disciplina FROM Note WHERE Contestata IS NOT NULL;", note:"contestată ⇒ are <b>dată</b> → <code>IS NOT NULL</code>."},
    {lit:"c", enunt:"Afișează <b>facultatea</b> cu cei mai mulți studenți.", sql:"SELECT TOP (1) Facultate FROM Studenti\nGROUP BY Facultate\nORDER BY COUNT(*) DESC;", note:"grupare + ordonare + prima."},
    {lit:"d", enunt:"Afișează <b>înscrierile cu prezență</b> (<code>Stare='P'</code>) ale studenților de la „Automatică”.", sql:"SELECT Inscrieri.* FROM Inscrieri\nINNER JOIN Studenti ON Studenti.Id_Student = Inscrieri.Id_Student\nWHERE Studenti.Facultate = 'Automatica' AND Inscrieri.Stare = 'P';", note:"<code>INNER JOIN</code> + filtre."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>media notelor</b> per student, descrescător.", sql:"SELECT Nume, Prenume, AVG(Nota) AS Media\nFROM Studenti\n     INNER JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student\n     INNER JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere\nGROUP BY Inscrieri.Id_Student, Nume, Prenume\nORDER BY Media DESC;", note:"agregare numerică reală: <code>AVG(Nota)</code> pe lanț triplu."},
    {lit:"f", enunt:"Afișează <b>numărul de note</b> de la înscrieri cu prezență, date în <b>iunie 2021</b>, cu <b>ultima cifră</b> a codului <b>impară</b>.", sql:"SELECT COUNT(*) FROM Inscrieri\nINNER JOIN Note ON Inscrieri.Id_Inscriere = Note.Id_Inscriere\nWHERE Inscrieri.Stare = 'P'\n  AND (Note.Data_Examen >= '2021-06-01' AND Note.Data_Examen < '2021-07-01')\n  AND Note.Cod_Disciplina LIKE '%[13579]';", note:"<code>*[13579]</code> = ultimul caracter cifră impară."},
    {lit:"g", enunt:"Afișează <b>numele și prenumele</b> studenților cu <b>minimum trei înscrieri în același an</b> (o singură dată).", sql:"SELECT DISTINCT Nume, Prenume FROM Studenti\nINNER JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student\nGROUP BY Inscrieri.Id_Student, YEAR(Data), Nume, Prenume\nHAVING COUNT(*) >= 3;", note:"grupare pe (student, an) + <code>HAVING &gt;= 3</code> + <code>DISTINCT</code>."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și codul disciplinei</b> studenților cu cel puțin o notă <b>necontestată</b> care <b>expiră înainte</b> de 31 decembrie 2021.", sql:"SELECT Nume, Prenume, Cod_Disciplina\nFROM Studenti\n     INNER JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student\n     INNER JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere\nWHERE Note.Contestata IS NULL\n  AND Note.Valabila_Pana < '2021-12-31';", note:"dublu <code>JOIN</code> + <code>IS NULL</code> + comparație de date."},
    {lit:"i", enunt:"Afișează <b>numele și prenumele</b> studenților care <b>nu au nicio înscriere absentă</b> (<code>Stare='A'</code>).", sql:"SELECT Nume, Prenume FROM Studenti S\nWHERE NOT EXISTS (SELECT 1 FROM Inscrieri I WHERE I.Id_Student = S.Id_Student AND I.Stare = 'A');", note:"<b>NOT EXISTS</b> corelat — cuantificatorul „niciuna”. Include și studenții fără nicio înscriere (dublă negație)."},
    {lit:"j", enunt:"<b>(LEFT JOIN)</b> Afișează <b>toți</b> studenții și <b>numărul lor de note</b>, <b>inclusiv</b> cei fără nicio notă (0).", sql:"SELECT Nume, Prenume, COUNT(Note.Id_Nota) AS Nr_Note\nFROM Studenti\n     LEFT JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student\n     LEFT JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere\nGROUP BY Studenti.Id_Student, Nume, Prenume\nORDER BY Nr_Note DESC;", note:"<b>LEFT JOIN</b> păstrează studenții fără note; <code>COUNT</code> pe dreapta → 0."},
    {lit:"k", enunt:"<b>(FULL OUTER JOIN)</b> Afișează corespondența <b>înscriere ↔ notă</b>, inclusiv înscrierile fără notă.", sql:"SELECT Inscrieri.Id_Inscriere, Note.Cod_Disciplina\nFROM Inscrieri\nFULL OUTER JOIN Note ON Inscrieri.Id_Inscriere = Note.Id_Inscriere;", note:"<b>FULL OUTER JOIN</b>: înscrierile fără notă au <code>Cod_Disciplina = NULL</code>."},
    {lit:"l", enunt:"<b>(HAVING + AVG)</b> Afișează <b>numele, prenumele</b> și <b>media</b> studenților cu <b>media ≥ 8</b>.", sql:"SELECT Nume, Prenume, AVG(Nota) AS Media\nFROM Studenti\n     INNER JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student\n     INNER JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere\nGROUP BY Inscrieri.Id_Student, Nume, Prenume\nHAVING AVG(Nota) >= 8\nORDER BY Media DESC;", note:"<code>HAVING AVG(Nota) &gt;= 8</code> — condiție pe medie (agregat), nu pe rânduri individuale."}
  ],
  anexa:"CREATE TABLE Studenti (\n    Id_Student INT PRIMARY KEY,\n    Nume      VARCHAR(50) NOT NULL,\n    Prenume   VARCHAR(50) NOT NULL,\n    Facultate VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE Inscrieri (\n    Id_Inscriere INT PRIMARY KEY,\n    Id_Student   INT NOT NULL,\n    Data         DATETIME NOT NULL,\n    Stare        CHAR(1) NULL,               -- NULL / 'P' / 'A'\n    FOREIGN KEY (Id_Student) REFERENCES Studenti(Id_Student)\n);\n\nCREATE TABLE Note (\n    Id_Nota        INT PRIMARY KEY,\n    Id_Inscriere   INT NOT NULL,\n    Cod_Disciplina VARCHAR(10) NOT NULL,\n    Data_Examen    DATETIME NOT NULL,\n    Valabila_Pana  DATETIME NOT NULL,\n    Nota           DECIMAL(4,2) NOT NULL,\n    Contestata     DATETIME NULL,            -- NULL = necontestata\n    FOREIGN KEY (Id_Inscriere) REFERENCES Inscrieri(Id_Inscriere)\n);\n\nINSERT INTO Studenti VALUES\n (1,'Popescu','Andrei','Automatica'),\n (2,'Munteanu','Maria','Automatica'),\n (3,'Ionescu','Vlad','Electronica'),\n (4,'Georgescu','Radu','Mecanica');   -- fara inscrieri -> j) cu 0; i) il include\n\nINSERT INTO Inscrieri VALUES\n (10,1,'2021-06-03','P'),\n (11,1,'2021-06-19','P'),\n (12,1,'2021-09-14','P'),    -- Popescu: 3 inscrieri in 2021 -> g)\n (13,2,'2021-06-15','P'),\n (14,3,'2021-06-10','A'),    -- absent -> Ionescu exclus la i)\n (15,1,'2021-01-05',NULL);\n\nINSERT INTO Note VALUES\n (100,10,'CS101','2021-06-03','2021-12-01', 9.50,NULL),   -- ultima cifra 1 (impar), necontestata, expira < 31.12\n (101,11,'CS102','2021-06-19','2022-06-19', 7.00,NULL),   -- ultima cifra 2 (par) -> exclus la f\n (102,12,'MA205','2021-09-14','2022-01-01', 8.50,'2021-10-01'),  -- contestata\n (103,13,'CS103','2021-06-15','2021-11-30', 6.00,NULL);"
},

// ============================== 11. BIBLIOTECĂ — ÎMPRUMUT CĂRȚI (Subiect BD sept. 2022) ==============================
{
  id:"biblioteca_carti", nume:"Bibliotecă (împrumut cărți)", icon:"📖",
  nivel:"Examen — Subiectul „Baze de date” septembrie 2022. Model N—N (abonat ↔ carte), lucru intensiv cu date calendaristice și cu „returnat / nereturnat la timp”.",
  rezumat:"Sufix LIKE '%escu', relație N—N prin tabela de împrumuturi, comparații între date (întârziere, expirare), grupare pe an, TOP 1 pe număr de împrumuturi.",
  intro:"Fie tabelele <code>Abonati</code>, <code>Carti</code> și <code>Imprumuturi</code>, în care o bibliotecă ține evidența abonaților, a cărților și a împrumuturilor. La un împrumut se rețin abonatul, cartea și data împrumutului; abonații trebuie să returneze cărțile în maximum <b>două săptămâni</b> de la împrumut.",
  tabele:[
    {nume:"Abonati", campuri:[
      ["IdAbonat (PK)","nu","int"],["Nume","nu","varchar(100)"],
      ["Prenume","nu","varchar(100)"],["DataAdaugare","nu","datetime"],
      ["Telefon","da","varchar(10)"],["DataNasterii","da","datetime"]]},
    {nume:"Carti", campuri:[
      ["IdCarte (PK)","nu","int"],["Titlu","nu","varchar(150)"],
      ["Autor","nu","varchar(70)"],["ISBN","nu","varchar(20)"],
      ["DataAparitiei","nu","datetime"]]},
    {nume:"Imprumuturi", campuri:[
      ["IdImprumut (PK)","nu","int"],["IdAbonat (FK)","nu","int"],
      ["IdCarte (FK)","nu","int"],["DataImprumut","nu","datetime"],
      ["DataReturnareAsteptata","nu","datetime"],["DataReturnareReala","da","datetime"]]}
  ],
  observatii:[
    "<code>DataReturnareAsteptata</code> se completează automat (în examen, printr-un <i>trigger</i>) ca <code>DataImprumut + 14 zile</code> (două săptămâni).",
    "<code>DataReturnareReala</code> are valoarea <code>null</code> cât timp cartea <b>nu a fost încă returnată</b> (împrumut activ), sau conține <b>data</b> la care a fost efectiv returnată.",
    "O carte este <b>returnată la timp</b> dacă <code>DataReturnareReala &lt;= DataReturnareAsteptata</code>. Este <b>nereturnată la timp</b> dacă <code>DataReturnareReala &gt; DataReturnareAsteptata</code>, sau dacă <code>DataReturnareReala</code> e <code>null</code> și data curentă a depășit deja <code>DataReturnareAsteptata</code>."
  ],
  relatii:"<code>Abonati 1—N Imprumuturi N—1 Carti</code>. <code>Imprumuturi</code> este tabela de legătură a relației <b>N—N</b> dintre abonați și cărți (un abonat împrumută mai multe cărți, o carte e împrumutată de mai mulți abonați) și ține datele împrumutului. Câmpul cu <code>null</code> cu semantică (<code>DataReturnareReala</code>) concentrează majoritatea capcanelor.",
  cerinte:[
    {lit:"a", enunt:"Afișează <b>prenumele</b> abonaților al căror nume are ultimele 4 litere „escu”.",
     sql:"SELECT Prenume FROM Abonati WHERE Nume LIKE '%escu';",
     note:"<b>Explicație:</b> „ultimele 4 litere = escu” înseamnă <b>sufix</b>, deci wildcard-ul <code>%</code> stă la <b>stânga</b>: <code>'%escu'</code>. <b>Capcană:</b> <code>'escu%'</code> ar cere <b>început</b> cu „escu” (greșit); iar <code>'%escu%'</code> ar prinde și „Esculescu” în mijloc — pentru sufix exact ține wildcard-ul doar în față."},
    {lit:"b", enunt:"Afișează <b>titlurile</b> cărților care <b>nu sunt încă returnate</b> (împrumut activ sau cu termenul depășit, dar cartea nereturnată — <code>DataReturnareReala</code> necompletată).",
     sql:"SELECT DISTINCT C.Titlu\nFROM Carti C\nINNER JOIN Imprumuturi I ON I.IdCarte = C.IdCarte\nWHERE I.DataReturnareReala IS NULL;",
     note:"<b>Explicație:</b> „nereturnată” = <code>DataReturnareReala IS NULL</code>, indiferent dacă termenul a trecut sau nu. <b>Capcană NULL:</b> nu se scrie <code>DataReturnareReala = null</code> (dă mereu <code>UNKNOWN</code>) — obligatoriu <code>IS NULL</code>. <code>DISTINCT</code> elimină titlurile duplicate când aceeași carte e nereturnată în mai multe împrumuturi."},
    {lit:"c", enunt:"Afișează <b>numărul de împrumuturi</b> pentru cartea cu <b>cel mai mare număr de împrumuturi</b>.",
     sql:"SELECT TOP (1) COUNT(*) AS Nr_Imprumuturi\nFROM Imprumuturi\nGROUP BY IdCarte\nORDER BY COUNT(*) DESC;",
     note:"<b>Explicație:</b> grupăm pe <code>IdCarte</code>, numărăm împrumuturile fiecărei cărți, ordonăm descrescător și luăm prima valoare. <b>Capcană (egalitate la maxim):</b> dacă două cărți au același maxim, <code>TOP 1</code> întoarce o singură valoare (aceeași oricum). Pentru <b>cartea</b> (nu doar numărul) adaugă <code>IdCarte</code> în <code>SELECT</code>; pentru toate cărțile la maxim folosește <code>TOP 1 WITH TIES</code>."},
    {lit:"d", enunt:"Afișează, pentru împrumuturile cu cărți <b>nereturnate la timp</b>: numele, prenumele, telefonul abonatului, titlul cărții, data împrumutului, data de returnare așteptată și data de returnare reală.",
     sql:"SELECT A.Nume, A.Prenume, A.Telefon, C.Titlu,\n       I.DataImprumut, I.DataReturnareAsteptata, I.DataReturnareReala\nFROM Imprumuturi I\nINNER JOIN Abonati A ON A.IdAbonat = I.IdAbonat\nINNER JOIN Carti   C ON C.IdCarte  = I.IdCarte\nWHERE I.DataReturnareReala > I.DataReturnareAsteptata\n   OR (I.DataReturnareReala IS NULL AND GETDATE() > I.DataReturnareAsteptata);",
     note:"<b>Cele două cazuri de „nereturnat la timp”:</b> (1) returnată, dar târziu → <code>DataReturnareReala &gt; DataReturnareAsteptata</code>; (2) încă neîntoarsă și termenul a trecut → <code>DataReturnareReala IS NULL AND GETDATE() &gt; DataReturnareAsteptata</code>. <b>Capcană:</b> nu uita paranteza în jurul celui de-al doilea caz — altfel <code>OR</code>/<code>AND</code> se leagă greșit; <code>GETDATE()</code> = data curentă a serverului."},
    {lit:"e", enunt:"Afișează <b>numele, prenumele</b> și <b>numărul de împrumuturi</b> efectuate de fiecare abonat, ordonate descrescător după număr.",
     sql:"SELECT A.Nume, A.Prenume, COUNT(I.IdImprumut) AS Nr_Imprumuturi\nFROM Abonati A\nLEFT JOIN Imprumuturi I ON I.IdAbonat = A.IdAbonat\nGROUP BY A.IdAbonat, A.Nume, A.Prenume\nORDER BY Nr_Imprumuturi DESC;",
     note:"<b>De ce LEFT JOIN:</b> „fiecare abonat” include și abonații <b>fără niciun împrumut</b> (ar dispărea cu <code>INNER JOIN</code>). <code>COUNT(I.IdImprumut)</code> numără doar rândurile reale din partea dreaptă → <b>0</b> pentru cei fără împrumuturi (spre deosebire de <code>COUNT(*)</code>, care ar da 1). <code>IdAbonat</code> în <code>GROUP BY</code> distinge abonații omonimi."},
    {lit:"f", enunt:"Afișează <b>titlul și autorul</b> cărții, <b>numele și prenumele</b> abonatului și <b>data împrumutului</b>, pentru împrumuturile emise în perioada 01.01.2022 – 31.12.2022 la care <b>luna apariției cărții este noiembrie</b>.",
     sql:"SELECT C.Titlu, C.Autor, A.Nume, A.Prenume, I.DataImprumut\nFROM Imprumuturi I\nINNER JOIN Carti   C ON C.IdCarte  = I.IdCarte\nINNER JOIN Abonati A ON A.IdAbonat = I.IdAbonat\nWHERE I.DataImprumut >= '2022-01-01' AND I.DataImprumut < '2023-01-01'\n  AND MONTH(C.DataAparitiei) = 11;",
     note:"<b>Pe bucăți:</b> interval pe anul 2022 scris ca <code>&gt;= '2022-01-01' AND &lt; '2023-01-01'</code> (evită <code>BETWEEN ... '2022-12-31'</code>, care ratează orele din 31 dec. de după miezul nopții); <code>MONTH(DataAparitiei) = 11</code> pentru luna noiembrie, indiferent de an. Dublu <code>INNER JOIN</code> pe lanțul <code>Imprumuturi → Carti</code> și <code>Imprumuturi → Abonati</code>."},
    {lit:"g", enunt:"Afișează <b>id-ul abonaților</b> și <b>numărul de împrumuturi</b> pentru abonații care au făcut <b>minimum două împrumuturi în același an</b> (un abonat apare o singură dată).",
     sql:"SELECT IdAbonat, COUNT(*) AS Nr_Imprumuturi\nFROM Imprumuturi\nGROUP BY IdAbonat, YEAR(DataImprumut)\nHAVING COUNT(*) >= 2;",
     note:"<b>Explicație:</b> gruparea pe <code>(IdAbonat, YEAR(DataImprumut))</code> creează câte o grupă per (abonat, an); <code>HAVING COUNT(*) &gt;= 2</code> păstrează doar anii cu ≥ 2 împrumuturi. <b>Capcană „o singură dată”:</b> dacă un abonat îndeplinește condiția în <b>doi ani diferiți</b> ar apărea de două ori — dacă enunțul cere strict o apariție, învelește într-o subinterogare și fă <code>SELECT IdAbonat, SUM(...)</code> pe abonat."},
    {lit:"h", enunt:"Afișează <b>numele, prenumele și numerele de telefon</b> ale abonaților care au cel puțin un <b>împrumut activ</b> care <b>expiră înainte</b> de 25 septembrie 2022.",
     sql:"SELECT DISTINCT A.Nume, A.Prenume, A.Telefon\nFROM Abonati A\nINNER JOIN Imprumuturi I ON I.IdAbonat = A.IdAbonat\nWHERE I.DataReturnareReala IS NULL\n  AND I.DataReturnareAsteptata < '2022-09-25';",
     note:"<b>Explicație:</b> „împrumut activ” = încă nereturnat → <code>DataReturnareReala IS NULL</code>; „expiră înainte de 25.09.2022” → <code>DataReturnareAsteptata &lt; '2022-09-25'</code>. <code>DISTINCT</code> pentru „cel puțin unul” (un abonat cu mai multe împrumuturi active ar apărea de mai multe ori). <b>Capcană:</b> fără <code>DataReturnareReala IS NULL</code> ai număra și împrumuturi deja returnate."}
  ],
  anexa:"CREATE TABLE Abonati (\n    IdAbonat     INT PRIMARY KEY,\n    Nume         VARCHAR(100) NOT NULL,\n    Prenume      VARCHAR(100) NOT NULL,\n    DataAdaugare DATETIME NOT NULL,\n    Telefon      VARCHAR(10) NULL,\n    DataNasterii DATETIME NULL\n);\n\nCREATE TABLE Carti (\n    IdCarte       INT PRIMARY KEY,\n    Titlu         VARCHAR(150) NOT NULL,\n    Autor         VARCHAR(70)  NOT NULL,\n    ISBN          VARCHAR(20)  NOT NULL,\n    DataAparitiei DATETIME     NOT NULL\n);\n\nCREATE TABLE Imprumuturi (\n    IdImprumut             INT PRIMARY KEY,\n    IdAbonat               INT NOT NULL,\n    IdCarte                INT NOT NULL,\n    DataImprumut           DATETIME NOT NULL,\n    DataReturnareAsteptata DATETIME NOT NULL,   -- = DataImprumut + 14 zile\n    DataReturnareReala     DATETIME NULL,       -- NULL = inca nereturnata\n    FOREIGN KEY (IdAbonat) REFERENCES Abonati(IdAbonat),\n    FOREIGN KEY (IdCarte)  REFERENCES Carti(IdCarte)\n);\n\nINSERT INTO Abonati VALUES\n (1,'Popescu','Andrei','2021-05-10','0721000001','1998-03-14'),\n (2,'Ionescu','Maria','2021-06-01','0721000002','1999-07-22'),\n (3,'Pop','Vlad','2021-07-15','0721000003','2000-01-05'),\n (4,'Georgescu','Elena','2021-08-20','0721000004','1997-11-30'),\n (5,'Marin','Radu','2022-01-02','0721000005','2001-02-18');   -- fara imprumuturi -> e) cu 0\n\nINSERT INTO Carti VALUES\n (1,'Amintiri din copilarie','Ion Creanga','9789730000011','2022-11-05'),\n (2,'Morometii','Marin Preda','9789730000028','2020-03-01'),\n (3,'Enigma Otiliei','George Calinescu','9789730000035','2022-11-20'),\n (4,'Ion','Liviu Rebreanu','9789730000042','2019-05-01'),\n (5,'Baltagul','Mihail Sadoveanu','9789730000059','2021-09-10');\n\nINSERT INTO Imprumuturi VALUES\n (10,1,1,'2022-01-10','2022-01-24','2022-01-20'),   -- returnat la timp\n (11,1,1,'2022-02-01','2022-02-15','2022-03-01'),   -- reala > asteptata -> nereturnat la timp (d)\n (12,1,3,'2022-09-05','2022-09-19',NULL),           -- activ, expira < 25.09.2022 (h); nereturnat (b,d)\n (13,2,1,'2022-03-10','2022-03-24','2022-03-22'),   -- la timp\n (14,2,5,'2022-05-01','2022-05-15','2022-05-10'),   -- la timp; abonat 2 -> 2 imprum. in 2022 (g)\n (15,2,1,'2021-11-01','2021-11-15',NULL),           -- activ expirat (b,d,h)\n (16,3,2,'2022-06-01','2022-06-15','2022-06-10'),   -- la timp\n (17,4,4,'2023-01-05','2023-01-19',NULL);           -- activ nereturnat (b,d), nu h (expira in 2023)"
}
];
