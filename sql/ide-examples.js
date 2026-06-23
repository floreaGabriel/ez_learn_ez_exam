// ============================================================
//  SQL IDE — interogări-exemplu per scenariu (dialect SQLite).
//  Toate testate că rulează pe seed-urile din scenarii.js.
//  Format: { id_scenariu: [ [eticheta, sql], ... ] }
// ============================================================
"use strict";

const SQL_IDE_EXAMPLES = {
  biblioteca: [
    ["Toți cititorii", `SELECT * FROM Cititori;`],
    ["a) Nume care începe cu „Pop”", `SELECT Prenume FROM Cititori
WHERE Nume LIKE 'Pop%';`],
    ["b) Volume pierdute (IS NOT NULL)", `SELECT Cod_Bare FROM Volume
WHERE Pierdut IS NOT NULL;`],
    ["c) Facultatea cu cei mai mulți cititori", `SELECT Facultate, COUNT(*) AS Nr
FROM Cititori
GROUP BY Facultate
ORDER BY Nr DESC
LIMIT 1;`],
    ["d) Împrumuturi onorate de la „Automatica”", `SELECT Imprumuturi.*
FROM Imprumuturi
JOIN Cititori ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor
WHERE Cititori.Facultate = 'Automatica' AND Imprumuturi.Stare = 'R';`],
    ["e) Nr. împrumuturi / cititor (descrescător)", `SELECT Nume, Prenume, COUNT(Id_Imprumut) AS Nr
FROM Cititori
JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor
GROUP BY Imprumuturi.Id_Cititor, Nume, Prenume
ORDER BY Nr DESC;`],
    ["f) Onorate oct. 2021, prima cifră a codului nenulă", `SELECT COUNT(*) AS Nr
FROM Imprumuturi
JOIN Volume ON Imprumuturi.Id_Imprumut = Volume.Id_Imprumut
WHERE Imprumuturi.Stare = 'R'
  AND Imprumuturi.Data >= '2021-10-01' AND Imprumuturi.Data < '2021-11-01'
  AND substr(Volume.Cod_Bare, 1, 1) BETWEEN '1' AND '9';`],
    ["g) ≥3 împrumuturi în aceeași lună", `SELECT DISTINCT Nume, Prenume
FROM Cititori
JOIN Imprumuturi ON Cititori.Id_Cititor = Imprumuturi.Id_Cititor
GROUP BY Imprumuturi.Id_Cititor, strftime('%Y-%m', Data), Nume, Prenume
HAVING COUNT(*) >= 3;`],
    ["i) Volume „orfane” (NOT EXISTS)", `SELECT Cod_Bare FROM Volume V
WHERE NOT EXISTS (SELECT 1 FROM Imprumuturi I WHERE I.Id_Imprumut = V.Id_Imprumut);`]
  ],
  clinica: [
    ["Toți pacienții", `SELECT * FROM Pacienti;`],
    ["a) Nume care conține „ana”", `SELECT Prenume FROM Pacienti WHERE Nume LIKE '%ana%';`],
    ["b) Rețete onorate", `SELECT Cod_Reteta FROM Retete WHERE Onorata IS NOT NULL;`],
    ["d) Programări efectuate din „Cluj-Napoca”", `SELECT Programari.*
FROM Programari
JOIN Pacienti ON Pacienti.Id_Pacient = Programari.Id_Pacient
WHERE Pacienti.Oras = 'Cluj-Napoca' AND Programari.Stare = 'E';`],
    ["f) Martie 2021, ultima cifră a codului pară", `SELECT COUNT(*) AS Nr
FROM Programari
JOIN Retete ON Programari.Id_Programare = Retete.Id_Programare
WHERE Programari.Stare = 'E'
  AND Programari.Data >= '2021-03-01' AND Programari.Data < '2021-04-01'
  AND substr(Retete.Cod_Reteta, length(Retete.Cod_Reteta), 1) IN ('0','2','4','6','8');`],
    ["g) ≥2 programări în aceeași zi", `SELECT DISTINCT Nume, Prenume
FROM Pacienti
JOIN Programari ON Pacienti.Id_Pacient = Programari.Id_Pacient
GROUP BY Programari.Id_Pacient, date(Data), Nume, Prenume
HAVING COUNT(*) >= 2;`]
  ],
  magazin: [
    ["Toate liniile de comandă", `SELECT * FROM Produse_Comandate;`],
    ["a) Nume în „escu” sau „eanu”", `SELECT Prenume FROM Clienti
WHERE Nume LIKE '%escu' OR Nume LIKE '%eanu';`],
    ["b) Produse returnate", `SELECT Cod_Produs FROM Produse_Comandate WHERE Returnat IS NOT NULL;`],
    ["e) Valoarea totală comandată / client (SUM)", `SELECT Nume, Prenume, SUM(Pret_Unitar * Cantitate) AS Valoare
FROM Clienti
JOIN Comenzi ON Clienti.Id_Client = Comenzi.Id_Client
JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda
GROUP BY Comenzi.Id_Client, Nume, Prenume
ORDER BY Valoare DESC;`],
    ["f) Nov. 2021, preț 100–500, poziția 2 = „7”", `SELECT COUNT(*) AS Nr
FROM Comenzi
JOIN Produse_Comandate ON Comenzi.Id_Comanda = Produse_Comandate.Id_Comanda
WHERE Comenzi.Stare = 'L'
  AND Comenzi.Data >= '2021-11-01' AND Comenzi.Data < '2021-12-01'
  AND Pret_Unitar BETWEEN 100 AND 500
  AND substr(Cod_Produs, 2, 1) = '7';`]
  ],
  aeriana: [
    ["Toți pasagerii", `SELECT * FROM Pasageri;`],
    ["a) Nume de 5 litere, termină în „u”", `SELECT Prenume FROM Pasageri
WHERE length(Nume) = 5 AND Nume LIKE '%u';`],
    ["c) Țara/țările cu cei mai mulți (cu egalități)", `SELECT Tara FROM Pasageri
GROUP BY Tara
HAVING COUNT(*) = (SELECT MAX(c) FROM (SELECT COUNT(*) c FROM Pasageri GROUP BY Tara));`],
    ["e) Bilete valide / pasager (COUNT filtrat)", `SELECT Nume, Prenume, COUNT(Bilete.Id_Bilet) AS Nr_Valide
FROM Pasageri
JOIN Rezervari ON Pasageri.Id_Pasager = Rezervari.Id_Pasager
JOIN Bilete ON Rezervari.Id_Rezervare = Bilete.Id_Rezervare
WHERE Bilete.Anulat IS NULL
GROUP BY Rezervari.Id_Pasager, Nume, Prenume
ORDER BY Nr_Valide DESC;`],
    ["i) Fără nicio rezervare anulată (NOT EXISTS)", `SELECT Nume, Prenume FROM Pasageri P
WHERE NOT EXISTS (SELECT 1 FROM Rezervari R WHERE R.Id_Pasager = P.Id_Pasager AND R.Stare = 'X');`]
  ],
  service: [
    ["Toate piesele montate", `SELECT * FROM Piese_Montate;`],
    ["a) Nume care începe cu A–M", `SELECT Prenume FROM Clienti
WHERE upper(substr(Nume, 1, 1)) BETWEEN 'A' AND 'M';`],
    ["e) ≥2 comenzi finalizate (WHERE→GROUP BY→HAVING)", `SELECT Nume, Prenume, COUNT(*) AS Nr
FROM Clienti
JOIN Comenzi_Service ON Clienti.Id_Client = Comenzi_Service.Id_Client
WHERE Comenzi_Service.Stare = 'F'
GROUP BY Comenzi_Service.Id_Client, Nume, Prenume
HAVING COUNT(*) >= 2
ORDER BY Nr DESC;`],
    ["j) Clienți cu TOATE comenzile finalizate", `SELECT Nume, Prenume FROM Clienti C
WHERE EXISTS (SELECT 1 FROM Comenzi_Service S WHERE S.Id_Client = C.Id_Client)
  AND NOT EXISTS (SELECT 1 FROM Comenzi_Service S
                  WHERE S.Id_Client = C.Id_Client AND (S.Stare IS NULL OR S.Stare = 'R'));`],
    ["k) Piese reclamate în perioada de garanție", `SELECT Cod_Piesa FROM Piese_Montate
WHERE Reclamata IS NOT NULL
  AND Reclamata BETWEEN Garantie_De_La AND Garantie_Pana_La;`]
  ],
  hotel: [
    ["Toți oaspeții", `SELECT * FROM Oaspeti;`],
    ["a) Nume care începe cu „Pop”", `SELECT Prenume FROM Oaspeti WHERE Nume LIKE 'Pop%';`],
    ["b) Facturi achitate", `SELECT Cod_Factura FROM Facturi WHERE Achitata IS NOT NULL;`],
    ["e) Nr. rezervări / oaspete", `SELECT Nume, Prenume, COUNT(Id_Rezervare) AS Nr
FROM Oaspeti JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete
GROUP BY Rezervari.Id_Oaspete, Nume, Prenume ORDER BY Nr DESC;`],
    ["f) Facturi cazate nov. 2021, cod cu prima cifră nenulă", `SELECT COUNT(*) AS Nr
FROM Rezervari JOIN Facturi ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare
WHERE Rezervari.Stare = 'C'
  AND Facturi.Emisa_La >= '2021-11-01' AND Facturi.Emisa_La < '2021-12-01'
  AND substr(Facturi.Cod_Factura, 1, 1) BETWEEN '1' AND '9';`],
    ["g) ≥2 rezervări în aceeași lună", `SELECT DISTINCT Nume, Prenume
FROM Oaspeti JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete
GROUP BY Rezervari.Id_Oaspete, strftime('%Y-%m', Data), Nume, Prenume
HAVING COUNT(*) >= 2;`],
    ["h) Facturi neachitate scadente înainte de 31.12.2021", `SELECT Nume, Prenume, Cod_Factura
FROM Oaspeti
JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete
JOIN Facturi   ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare
WHERE Facturi.Achitata IS NULL AND Facturi.Scadenta < '2021-12-31';`],
    ["j) LEFT JOIN — toți oaspeții + nr. facturi (inclusiv 0)", `SELECT Nume, Prenume, COUNT(Facturi.Id_Factura) AS Nr_Facturi
FROM Oaspeti
LEFT JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete
LEFT JOIN Facturi   ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare
GROUP BY Oaspeti.Id_Oaspete, Nume, Prenume ORDER BY Nr_Facturi DESC;`],
    ["k) FULL OUTER JOIN — rezervare ↔ factură", `SELECT Rezervari.Id_Rezervare, Facturi.Cod_Factura
FROM Rezervari FULL OUTER JOIN Facturi ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare;`],
    ["l) HAVING SUM — total facturat ≥ 1000", `SELECT Nume, Prenume, SUM(Total) AS Total_Facturat
FROM Oaspeti
JOIN Rezervari ON Oaspeti.Id_Oaspete = Rezervari.Id_Oaspete
JOIN Facturi   ON Rezervari.Id_Rezervare = Facturi.Id_Rezervare
GROUP BY Oaspeti.Id_Oaspete, Nume, Prenume HAVING SUM(Total) >= 1000 ORDER BY Total_Facturat DESC;`]
  ],
  banca: [
    ["Toți clienții", `SELECT * FROM Clienti;`],
    ["a) Nume care se termină în „escu”", `SELECT Prenume FROM Clienti WHERE Nume LIKE '%escu';`],
    ["b) Tranzacții stornate", `SELECT Cod_Tranzactie FROM Tranzactii WHERE Stornata IS NOT NULL;`],
    ["e) Nr. tranzacții / client", `SELECT Nume, Prenume, COUNT(Tranzactii.Id_Tranzactie) AS Nr
FROM Clienti
JOIN Conturi    ON Clienti.Id_Client = Conturi.Id_Client
JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont
GROUP BY Conturi.Id_Client, Nume, Prenume ORDER BY Nr DESC;`],
    ["f) Tranzacții cont activ oct. 2021, ultima cifră pară", `SELECT COUNT(*) AS Nr
FROM Conturi JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont
WHERE Conturi.Stare = 'A'
  AND Tranzactii.Data >= '2021-10-01' AND Tranzactii.Data < '2021-11-01'
  AND substr(Cod_Tranzactie, length(Cod_Tranzactie), 1) IN ('0','2','4','6','8');`],
    ["j) LEFT JOIN — toate conturile + nr. tranzacții", `SELECT Conturi.Id_Cont, COUNT(Tranzactii.Id_Tranzactie) AS Nr
FROM Conturi LEFT JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont
GROUP BY Conturi.Id_Cont ORDER BY Nr DESC;`],
    ["k) RIGHT JOIN — toate tranzacțiile + clientul", `SELECT Clienti.Nume, Tranzactii.Cod_Tranzactie
FROM Clienti
JOIN Conturi ON Clienti.Id_Client = Conturi.Id_Client
RIGHT JOIN Tranzactii ON Conturi.Id_Cont = Tranzactii.Id_Cont;`],
    ["l) HAVING SUM — total nestornat > 5000", `SELECT Id_Cont, SUM(Suma) AS Total
FROM Tranzactii WHERE Stornata IS NULL
GROUP BY Id_Cont HAVING SUM(Suma) > 5000 ORDER BY Total DESC;`]
  ],
  asigurari: [
    ["Toți asigurații", `SELECT * FROM Asigurati;`],
    ["a) Nume care conține „an”", `SELECT Prenume FROM Asigurati WHERE Nume LIKE '%an%';`],
    ["b) Daune plătite", `SELECT Cod_Dosar FROM Daune WHERE Platita IS NOT NULL;`],
    ["f) Daune poliță validă iulie 2021, poziția 2 = „7”", `SELECT COUNT(*) AS Nr
FROM Polite JOIN Daune ON Polite.Id_Polita = Daune.Id_Polita
WHERE Polite.Stare = 'V'
  AND Daune.Data_Deschidere >= '2021-07-01' AND Daune.Data_Deschidere < '2021-08-01'
  AND substr(Daune.Cod_Dosar, 2, 1) = '7';`],
    ["j) LEFT JOIN — toți asigurații + nr. daune", `SELECT Nume, Prenume, COUNT(Daune.Id_Dauna) AS Nr_Daune
FROM Asigurati
LEFT JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat
LEFT JOIN Daune  ON Polite.Id_Polita = Daune.Id_Polita
GROUP BY Asigurati.Id_Asigurat, Nume, Prenume ORDER BY Nr_Daune DESC;`],
    ["k) FULL OUTER JOIN — poliță ↔ daună", `SELECT Polite.Id_Polita, Daune.Cod_Dosar
FROM Polite FULL OUTER JOIN Daune ON Polite.Id_Polita = Daune.Id_Polita;`],
    ["l) HAVING SUM — valoare daune > 10000", `SELECT Nume, Prenume, SUM(Valoare) AS Total
FROM Asigurati
JOIN Polite ON Asigurati.Id_Asigurat = Polite.Id_Asigurat
JOIN Daune  ON Polite.Id_Polita = Daune.Id_Polita
GROUP BY Asigurati.Id_Asigurat, Nume, Prenume HAVING SUM(Valoare) > 10000 ORDER BY Total DESC;`]
  ],
  curierat: [
    ["Toate coletele", `SELECT * FROM Colete;`],
    ["a) Nume care începe cu A–M", `SELECT Prenume FROM Expeditori WHERE upper(substr(Nume,1,1)) BETWEEN 'A' AND 'M';`],
    ["b) Livrări eșuate", `SELECT Cod_AWB FROM Livrari WHERE Esuata IS NOT NULL;`],
    ["f) Livrări colet livrat martie 2021, prima cifră nenulă", `SELECT COUNT(*) AS Nr
FROM Colete JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet
WHERE Colete.Stare = 'L'
  AND Livrari.Data_Iesire >= '2021-03-01' AND Livrari.Data_Iesire < '2021-04-01'
  AND substr(Livrari.Cod_AWB, 1, 1) BETWEEN '1' AND '9';`],
    ["j) LEFT JOIN — toate coletele + nr. livrări", `SELECT Colete.Id_Colet, COUNT(Livrari.Id_Livrare) AS Nr
FROM Colete LEFT JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet
GROUP BY Colete.Id_Colet ORDER BY Nr DESC;`],
    ["k) RIGHT JOIN — toate livrările + coletul", `SELECT Colete.Id_Colet, Livrari.Cod_AWB
FROM Colete RIGHT JOIN Livrari ON Colete.Id_Colet = Livrari.Id_Colet;`],
    ["l) HAVING COUNT — colete cu ≥2 livrări eșuate", `SELECT Id_Colet, COUNT(*) AS Nr_Esuate
FROM Livrari WHERE Esuata IS NOT NULL
GROUP BY Id_Colet HAVING COUNT(*) >= 2 ORDER BY Nr_Esuate DESC;`]
  ],
  universitate: [
    ["Toți studenții", `SELECT * FROM Studenti;`],
    ["a) Nume în „escu” sau „eanu”", `SELECT Prenume FROM Studenti WHERE Nume LIKE '%escu' OR Nume LIKE '%eanu';`],
    ["e) Media notelor / student", `SELECT Nume, Prenume, ROUND(AVG(Nota),2) AS Media
FROM Studenti
JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student
JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere
GROUP BY Inscrieri.Id_Student, Nume, Prenume ORDER BY Media DESC;`],
    ["i) Fără nicio înscriere absentă (NOT EXISTS)", `SELECT Nume, Prenume FROM Studenti S
WHERE NOT EXISTS (SELECT 1 FROM Inscrieri I WHERE I.Id_Student = S.Id_Student AND I.Stare = 'A');`],
    ["j) LEFT JOIN — toți studenții + nr. note", `SELECT Nume, Prenume, COUNT(Note.Id_Nota) AS Nr_Note
FROM Studenti
LEFT JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student
LEFT JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere
GROUP BY Studenti.Id_Student, Nume, Prenume ORDER BY Nr_Note DESC;`],
    ["k) FULL OUTER JOIN — înscriere ↔ notă", `SELECT Inscrieri.Id_Inscriere, Note.Cod_Disciplina
FROM Inscrieri FULL OUTER JOIN Note ON Inscrieri.Id_Inscriere = Note.Id_Inscriere;`],
    ["l) HAVING AVG — media ≥ 8", `SELECT Nume, Prenume, ROUND(AVG(Nota),2) AS Media
FROM Studenti
JOIN Inscrieri ON Studenti.Id_Student = Inscrieri.Id_Student
JOIN Note      ON Inscrieri.Id_Inscriere = Note.Id_Inscriere
GROUP BY Inscrieri.Id_Student, Nume, Prenume HAVING AVG(Nota) >= 8 ORDER BY Media DESC;`]
  ]
};
