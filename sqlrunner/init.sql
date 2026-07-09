-- ============================================================
--  SQL Trainer — schema + date "Scenarii Rezolvate" (T-SQL / SQL Server)
--  Rulat o singura data de serviciul `sqlrunner` (ca `sa`) la prima pornire,
--  pe Azure SQL Edge (motor SQL Server, compatibil ARM64 / Raspberry Pi).
--
--  Fiecare scenariu = o BAZA DE DATE separata. Tabelele sunt in schema `dbo`,
--  deci interogarile din examen merg DIRECT, fara prefix:  SELECT * FROM Cititori
--  (numele necalificate se rezolva in schema implicita `dbo` a userului).
--
--  `{{READONLY_PASSWORD}}` e inlocuit de sqlrunner cu parola reala (din env).
--  Loginul `readonly` primeste DOAR rolul `db_datareader` in fiecare baza =>
--  poate SELECT, dar NU INSERT / UPDATE / DELETE / DDL (impus de motor).
--  Batch-urile sunt separate prin linii care contin doar `GO`.
-- ============================================================

-- ===================== 1. Creeaza bazele de date =====================
IF DB_ID('biblioteca') IS NULL CREATE DATABASE biblioteca;
GO
IF DB_ID('clinica') IS NULL CREATE DATABASE clinica;
GO
IF DB_ID('magazin') IS NULL CREATE DATABASE magazin;
GO
IF DB_ID('aeriana') IS NULL CREATE DATABASE aeriana;
GO
IF DB_ID('service') IS NULL CREATE DATABASE service;
GO
IF DB_ID('hotel') IS NULL CREATE DATABASE hotel;
GO
IF DB_ID('banca') IS NULL CREATE DATABASE banca;
GO
IF DB_ID('asigurari') IS NULL CREATE DATABASE asigurari;
GO
IF DB_ID('curierat') IS NULL CREATE DATABASE curierat;
GO
IF DB_ID('universitate') IS NULL CREATE DATABASE universitate;
GO
IF DB_ID('biblioteca_carti') IS NULL CREATE DATABASE biblioteca_carti;
GO
IF DB_ID('gsm') IS NULL CREATE DATABASE gsm;
GO

-- ===================== 2. Login read-only (la nivel de server) =====================
IF SUSER_ID('readonly') IS NULL
    CREATE LOGIN readonly WITH PASSWORD = '{{READONLY_PASSWORD}}', CHECK_POLICY = OFF;
GO

-- ============================================================
--  BIBLIOTECA
-- ============================================================
USE biblioteca;
CREATE TABLE Cititori (
    Id_Cititor INT PRIMARY KEY,
    Nume       VARCHAR(50) NOT NULL,
    Prenume    VARCHAR(50) NOT NULL,
    Facultate  VARCHAR(50) NOT NULL
);
CREATE TABLE Imprumuturi (
    Id_Imprumut INT PRIMARY KEY,
    Id_Cititor  INT NOT NULL,
    Data        DATETIME NOT NULL,
    Stare       CHAR(1) NULL,                 -- NULL / 'R' / 'A'
    FOREIGN KEY (Id_Cititor) REFERENCES Cititori(Id_Cititor)
);
CREATE TABLE Volume (
    Id_Volum         INT PRIMARY KEY,
    Id_Imprumut      INT NOT NULL,
    Cod_Bare         VARCHAR(10) NOT NULL,
    Disponibil_De_La DATETIME NOT NULL,
    Termen_Returnare DATETIME NOT NULL,
    Pierdut          DATETIME NULL,           -- NULL = integru
    FOREIGN KEY (Id_Imprumut) REFERENCES Imprumuturi(Id_Imprumut)
);
INSERT INTO Cititori VALUES
 (1,'Popescu','Andrei','Automatica'),
 (2,'Pop','Maria','Automatica'),
 (3,'Ionescu','Vlad','Electronica'),
 (4,'Popa','Elena','Automatica'),
 (5,'Georgescu','Radu','Mecanica');
INSERT INTO Imprumuturi VALUES
 (10,1,'2021-10-03','R'),
 (11,1,'2021-10-19','R'),
 (12,1,'2021-10-28','R'),     -- Popescu: 3 imprumuturi in oct. 2021 -> cerinta g
 (13,2,'2021-09-15','R'),
 (14,3,'2021-10-10',NULL),    -- in procesare
 (15,4,'2021-11-02','A'),     -- anulat
 (16,1,'2021-05-04','R');
INSERT INTO Volume VALUES
 (100,10,'1234567890','2021-10-03','2021-10-31',NULL),
 (101,11,'0567812345','2021-10-19','2021-11-19',NULL),   -- prima cifra 0 -> exclus la f
 (102,12,'9001234567','2021-10-28','2021-11-28',NULL),
 (103,13,'7777000011','2021-09-15','2021-10-15','2021-10-20'),  -- pierdut
 (104,16,'2222333344','2021-05-04','2021-11-29',NULL);
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  CLINICA
-- ============================================================
USE clinica;
CREATE TABLE Pacienti (
    Id_Pacient INT PRIMARY KEY,
    Nume    VARCHAR(50) NOT NULL,
    Prenume VARCHAR(50) NOT NULL,
    Oras    VARCHAR(50) NOT NULL
);
CREATE TABLE Programari (
    Id_Programare INT PRIMARY KEY,
    Id_Pacient    INT NOT NULL,
    Data          DATETIME NOT NULL,
    Stare         CHAR(1) NULL,              -- NULL / 'E' / 'A'
    FOREIGN KEY (Id_Pacient) REFERENCES Pacienti(Id_Pacient)
);
CREATE TABLE Retete (
    Id_Reteta        INT PRIMARY KEY,
    Id_Programare    INT NOT NULL,
    Cod_Reteta       VARCHAR(10) NOT NULL,
    Valabila_De_La   DATETIME NOT NULL,
    Valabila_Pana_La DATETIME NOT NULL,
    Onorata          DATETIME NULL,          -- NULL = neridicata
    FOREIGN KEY (Id_Programare) REFERENCES Programari(Id_Programare)
);
INSERT INTO Pacienti VALUES
 (1,'Anastasiu','Ioana','Cluj-Napoca'),
 (2,'Stana','Mihai','Cluj-Napoca'),
 (3,'Catana','Ana','Bucuresti'),
 (4,'Popescu','Dan','Cluj-Napoca');
INSERT INTO Programari VALUES
 (10,1,'2021-03-05 09:00','E'),
 (11,1,'2021-03-05 15:30','E'),   -- 2 in aceeasi zi -> cerinta g
 (12,2,'2021-03-20 10:00','E'),
 (13,2,'2021-04-20 10:00','A'),
 (14,3,'2021-03-31 18:00','E'),   -- 31 martie, prins de intervalul corect
 (15,4,'2021-02-11 08:00',NULL);
INSERT INTO Retete VALUES
 (100,10,'AB123450','2021-03-05','2021-09-05','2021-03-10'),  -- ultima cifra 0 (para), onorata
 (101,11,'AB123457','2021-03-05','2021-09-05',NULL),          -- ultima cifra 7 (impara)
 (102,12,'CD000012','2021-03-20','2021-11-30',NULL),          -- ultima cifra 2 (para), neonorata
 (103,14,'EF555558','2021-03-31','2022-03-31',NULL);          -- ultima cifra 8 (para)
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  MAGAZIN
-- ============================================================
USE magazin;
CREATE TABLE Clienti (
    Id_Client INT PRIMARY KEY,
    Nume    VARCHAR(50) NOT NULL,
    Prenume VARCHAR(50) NOT NULL,
    Oras    VARCHAR(50) NOT NULL
);
CREATE TABLE Comenzi (
    Id_Comanda INT PRIMARY KEY,
    Id_Client  INT NOT NULL,
    Data       DATETIME NOT NULL,
    Stare      CHAR(1) NULL,                  -- NULL / 'L' / 'A'
    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)
);
CREATE TABLE Produse_Comandate (
    Id_Linie    INT PRIMARY KEY,
    Id_Comanda  INT NOT NULL,
    Cod_Produs  VARCHAR(10) NOT NULL,
    Pret_Unitar DECIMAL(10,2) NOT NULL,
    Cantitate   INT NOT NULL,
    Returnat    DATETIME NULL,                -- NULL = nereturnat
    FOREIGN KEY (Id_Comanda) REFERENCES Comenzi(Id_Comanda)
);
INSERT INTO Clienti VALUES
 (1,'Ionescu','Bogdan','Iasi'),
 (2,'Munteanu','Carmen','Iasi'),
 (3,'Dinu','Vlad','Cluj-Napoca'),
 (4,'Stoica','Ana','Iasi');
INSERT INTO Comenzi VALUES
 (10,1,'2021-11-04','L'),
 (11,1,'2021-11-22','L'),     -- 2 comenzi nov 2021 -> cerinta g
 (12,2,'2021-07-15','L'),
 (13,3,'2021-11-10','A'),
 (14,4,'2021-11-30','L'),     -- 30 nov, prins de interval
 (15,1,'2021-05-01','L');
INSERT INTO Produse_Comandate VALUES
 (100,10,'A7B12',250.00,2,NULL),          -- pozitia 2 = '7', pret 250 in [100,500], nereturnat
 (101,11,'X9Y00',600.00,1,'2021-11-25'),  -- pret 600 > 500 -> exclus la f; returnat
 (102,12,'Q7ZZ1',120.00,3,NULL),          -- comanda iul -> exclus la f
 (103,14,'B7C44',500.00,1,NULL),          -- pozitia 2 = '7', pret 500 (capat inclus), nereturnat
 (104,15,'M2N33',90.00,5,NULL);
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  AERIANA
-- ============================================================
USE aeriana;
CREATE TABLE Pasageri (
    Id_Pasager INT PRIMARY KEY,
    Nume    VARCHAR(50) NOT NULL,
    Prenume VARCHAR(50) NOT NULL,
    Tara    VARCHAR(50) NOT NULL
);
CREATE TABLE Rezervari (
    Id_Rezervare INT PRIMARY KEY,
    Id_Pasager   INT NOT NULL,
    Data         DATETIME NOT NULL,
    Stare        CHAR(1) NULL,               -- NULL / 'C' / 'X'
    FOREIGN KEY (Id_Pasager) REFERENCES Pasageri(Id_Pasager)
);
CREATE TABLE Bilete (
    Id_Bilet        INT PRIMARY KEY,
    Id_Rezervare    INT NOT NULL,
    Cod_Bilet       VARCHAR(10) NOT NULL,
    Valabil_De_La   DATETIME NOT NULL,
    Valabil_Pana_La DATETIME NOT NULL,
    Anulat          DATETIME NULL,           -- NULL = valid
    FOREIGN KEY (Id_Rezervare) REFERENCES Rezervari(Id_Rezervare)
);
INSERT INTO Pasageri VALUES
 (1,'Stanu','Mihai','Romania'),     -- 5 litere, termina in u
 (2,'Radu','Ioana','Romania'),      -- 4 litere -> NU la a)
 (3,'Lupascu','Dan','Germania'),
 (4,'Marcu','Elena','Romania');     -- 5 litere, termina in u
INSERT INTO Rezervari VALUES
 (10,1,'2021-07-02','C'),
 (11,1,'2021-07-09','C'),
 (12,1,'2021-09-14','C'),     -- Stanu: 3 rezervari in 2021 -> cerinta g
 (13,2,'2021-07-20','X'),     -- Radu are o rezervare anulata -> exclus la i)
 (14,3,'2021-07-25','C'),
 (15,4,'2021-01-05',NULL);
INSERT INTO Bilete VALUES
 (100,10,'AB7C13XY','2021-07-02','2021-12-01',NULL),  -- pozitia 5 = '1' (impar), neanulat, expira < 31.12
 (101,11,'ABCD2EFG','2021-07-09','2022-07-09',NULL),  -- pozitia 5 = '2' (par) -> exclus la f
 (102,12,'ZZZZ9000','2021-09-14','2022-01-01','2021-10-01'),  -- anulat
 (103,14,'QWER5TYU','2021-07-25','2022-07-25',NULL),  -- pozitia 5 = '5' (impar)
 (104,15,'1111X222','2021-01-05','2021-06-30',NULL);
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  SERVICE AUTO (capstone)
-- ============================================================
USE service;
CREATE TABLE Clienti (
    Id_Client  INT PRIMARY KEY,
    Nume       VARCHAR(50) NOT NULL,
    Prenume    VARCHAR(50) NOT NULL,
    Localitate VARCHAR(50) NOT NULL
);
CREATE TABLE Comenzi_Service (
    Id_Comanda INT PRIMARY KEY,
    Id_Client  INT NOT NULL,
    Data       DATETIME NOT NULL,
    Stare      CHAR(1) NULL,                 -- NULL / 'F' / 'R'
    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)
);
CREATE TABLE Piese_Montate (
    Id_Piesa         INT PRIMARY KEY,
    Id_Comanda       INT NOT NULL,
    Cod_Piesa        VARCHAR(10) NOT NULL,
    Garantie_De_La   DATETIME NOT NULL,
    Garantie_Pana_La DATETIME NOT NULL,
    Reclamata        DATETIME NULL,          -- NULL = nereclamata
    FOREIGN KEY (Id_Comanda) REFERENCES Comenzi_Service(Id_Comanda)
);
INSERT INTO Clienti VALUES
 (1,'Barbu','Cristian','Brasov'),      -- B in [A-M]
 (2,'Marin','Otilia','Brasov'),        -- M in [A-M]
 (3,'Nedelcu','Paul','Sibiu'),         -- N NU e in [A-M]
 (4,'Popa','Sanda','Brasov');          -- P NU e in [A-M]
INSERT INTO Comenzi_Service VALUES
 (10,1,'2021-02-03','F'),
 (11,1,'2021-02-25','F'),     -- Barbu: 2 'F' (e) si 2 in feb (g)
 (12,2,'2021-05-10','F'),
 (13,2,'2021-06-01',NULL),    -- Marin are o comanda in lucru -> exclus la j)
 (14,4,'2021-03-15','R'),
 (15,1,'2021-08-09','F');     -- Barbu: total 3 comenzi 'F'
INSERT INTO Piese_Montate VALUES
 (100,10,'OEM00731','2021-02-03','2021-08-03',NULL),          -- garantie expira <31.12, nereclamata
 (101,11,'OEM00990','2021-02-25','2022-02-25','2021-05-01'),  -- reclamata in garantie (k)
 (102,12,'BSX12000','2021-05-10','2021-11-10',NULL),          -- garantie expirata <31.12, nereclamata
 (103,15,'OEM55500','2021-08-09','2023-08-09',NULL);          -- garantie NU expira pana 31.12 -> exclus la f
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  HOTEL
-- ============================================================
USE hotel;
CREATE TABLE Oaspeti (
    Id_Oaspete INT PRIMARY KEY,
    Nume    VARCHAR(50) NOT NULL,
    Prenume VARCHAR(50) NOT NULL,
    Oras    VARCHAR(50) NOT NULL
);
CREATE TABLE Rezervari (
    Id_Rezervare INT PRIMARY KEY,
    Id_Oaspete   INT NOT NULL,
    Data         DATETIME NOT NULL,
    Stare        CHAR(1) NULL,               -- NULL / 'C' / 'A'
    FOREIGN KEY (Id_Oaspete) REFERENCES Oaspeti(Id_Oaspete)
);
CREATE TABLE Facturi (
    Id_Factura   INT PRIMARY KEY,
    Id_Rezervare INT NOT NULL,
    Cod_Factura  VARCHAR(10) NOT NULL,
    Emisa_La     DATETIME NOT NULL,
    Scadenta     DATETIME NOT NULL,
    Total        DECIMAL(10,2) NOT NULL,
    Achitata     DATETIME NULL,              -- NULL = neachitata
    FOREIGN KEY (Id_Rezervare) REFERENCES Rezervari(Id_Rezervare)
);
INSERT INTO Oaspeti VALUES
 (1,'Popescu','Andrei','Brasov'),
 (2,'Pop','Maria','Brasov'),
 (3,'Ionescu','Vlad','Cluj-Napoca'),
 (4,'Popa','Elena','Brasov'),
 (5,'Georgescu','Radu','Sibiu');      -- fara rezervari -> apare la j) cu 0
INSERT INTO Rezervari VALUES
 (10,1,'2021-11-03','C'),
 (11,1,'2021-11-19','C'),
 (12,1,'2021-11-28','C'),    -- Popescu: 3 rezervari in nov 2021 -> g)
 (13,2,'2021-09-15','C'),
 (14,3,'2021-11-10',NULL),   -- in asteptare
 (15,4,'2021-12-02','A'),    -- anulata
 (16,1,'2021-05-04','C');
INSERT INTO Facturi VALUES
 (100,10,'1234500001','2021-11-03','2021-11-30',450.00,'2021-11-10'),  -- achitata
 (101,11,'0567800002','2021-11-19','2021-12-19',300.00,NULL),          -- prima cifra 0 -> exclus la f; neachitata
 (102,12,'9001200003','2021-11-28','2021-12-28',620.00,NULL),          -- neachitata
 (103,13,'7777000004','2021-09-15','2021-10-15',180.00,'2021-09-20'),
 (104,16,'2222330005','2021-05-04','2021-11-29',520.00,NULL);          -- neachitata, scadenta < 31.12
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  BANCA
-- ============================================================
USE banca;
CREATE TABLE Clienti (
    Id_Client INT PRIMARY KEY,
    Nume      VARCHAR(50) NOT NULL,
    Prenume   VARCHAR(50) NOT NULL,
    Sucursala VARCHAR(50) NOT NULL
);
CREATE TABLE Conturi (
    Id_Cont         INT PRIMARY KEY,
    Id_Client       INT NOT NULL,
    Data_Deschidere DATETIME NOT NULL,
    Stare           CHAR(1) NULL,            -- NULL / 'A' / 'I'
    FOREIGN KEY (Id_Client) REFERENCES Clienti(Id_Client)
);
CREATE TABLE Tranzactii (
    Id_Tranzactie  INT PRIMARY KEY,
    Id_Cont        INT NOT NULL,
    Cod_Tranzactie VARCHAR(10) NOT NULL,
    Data           DATETIME NOT NULL,
    Suma           DECIMAL(12,2) NOT NULL,
    Stornata       DATETIME NULL,            -- NULL = valida
    FOREIGN KEY (Id_Cont) REFERENCES Conturi(Id_Cont)
);
INSERT INTO Clienti VALUES
 (1,'Ionescu','Bogdan','Cluj-Napoca'),
 (2,'Popescu','Carmen','Cluj-Napoca'),
 (3,'Dinu','Vlad','Iasi'),
 (4,'Stoica','Ana','Cluj-Napoca');
INSERT INTO Conturi VALUES
 (10,1,'2021-03-04','A'),
 (11,1,'2021-03-22','A'),    -- Ionescu: 2 conturi in martie -> g)
 (12,2,'2021-07-15','A'),
 (13,3,'2021-10-01',NULL),   -- in procesare
 (14,4,'2021-05-09','I'),    -- inchis
 (15,1,'2021-09-01','A');    -- cont fara tranzactii -> apare la j) cu 0
INSERT INTO Tranzactii VALUES
 (100,10,'TX1234560','2021-09-03',3200.00,NULL),
 (101,11,'TX0567892','2021-10-19',1500.00,NULL),  -- octombrie, ultima cifra 2 (para)
 (102,12,'TX9001234','2021-10-28', 800.00,'2021-10-30'),  -- stornata
 (103,10,'TX7777008','2021-10-10',6000.00,NULL),  -- octombrie, ultima cifra 8 (para)
 (104,14,'TX2222333','2021-05-04', 120.00,NULL);
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  ASIGURARI AUTO
-- ============================================================
USE asigurari;
CREATE TABLE Asigurati (
    Id_Asigurat INT PRIMARY KEY,
    Nume    VARCHAR(50) NOT NULL,
    Prenume VARCHAR(50) NOT NULL,
    Judet   VARCHAR(50) NOT NULL
);
CREATE TABLE Polite (
    Id_Polita    INT PRIMARY KEY,
    Id_Asigurat  INT NOT NULL,
    Data_Emitere DATETIME NOT NULL,
    Stare        CHAR(1) NULL,               -- NULL / 'V' / 'R'
    FOREIGN KEY (Id_Asigurat) REFERENCES Asigurati(Id_Asigurat)
);
CREATE TABLE Daune (
    Id_Dauna           INT PRIMARY KEY,
    Id_Polita          INT NOT NULL,
    Cod_Dosar          VARCHAR(10) NOT NULL,
    Data_Deschidere    DATETIME NOT NULL,
    Termen_Solutionare DATETIME NOT NULL,
    Valoare            DECIMAL(10,2) NOT NULL,
    Platita            DATETIME NULL,         -- NULL = neplatita
    FOREIGN KEY (Id_Polita) REFERENCES Polite(Id_Polita)
);
INSERT INTO Asigurati VALUES
 (1,'Stanciu','Mihai','Cluj'),
 (2,'Manea','Otilia','Cluj'),
 (3,'Radu','Paul','Sibiu'),
 (4,'Albu','Sanda','Cluj');     -- fara polite -> j) cu 0
INSERT INTO Polite VALUES
 (10,1,'2021-07-03','V'),
 (11,1,'2021-09-25','V'),    -- Stanciu: 2 polite in 2021 -> g)
 (12,2,'2021-07-10','V'),
 (13,3,'2021-06-01',NULL),   -- draft
 (14,2,'2021-08-15','R');    -- reziliata
INSERT INTO Daune VALUES
 (100,10,'D17AB0001','2021-07-03','2021-11-03', 8000.00,'2021-08-01'),  -- pozitia 2 = '7', platita
 (101,11,'D27CD0002','2021-09-25','2021-12-25', 4500.00,NULL),          -- neplatita, termen < 31.12
 (102,12,'D70EF0003','2021-07-15','2021-10-15', 3000.00,NULL),          -- pozitia 2 != '7'
 (103,10,'D17GH0004','2021-07-20','2021-09-20', 2500.00,NULL);          -- pozitia 2 = '7'
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  CURIERAT
-- ============================================================
USE curierat;
CREATE TABLE Expeditori (
    Id_Expeditor INT PRIMARY KEY,
    Nume    VARCHAR(50) NOT NULL,
    Prenume VARCHAR(50) NOT NULL,
    Oras    VARCHAR(50) NOT NULL
);
CREATE TABLE Colete (
    Id_Colet      INT PRIMARY KEY,
    Id_Expeditor  INT NOT NULL,
    Data_Preluare DATETIME NOT NULL,
    Stare         CHAR(1) NULL,              -- NULL / 'L' / 'R'
    FOREIGN KEY (Id_Expeditor) REFERENCES Expeditori(Id_Expeditor)
);
CREATE TABLE Livrari (
    Id_Livrare     INT PRIMARY KEY,
    Id_Colet       INT NOT NULL,
    Cod_AWB        VARCHAR(10) NOT NULL,
    Data_Iesire    DATETIME NOT NULL,
    Termen_Livrare DATETIME NOT NULL,
    Cost           DECIMAL(8,2) NOT NULL,
    Esuata         DATETIME NULL,            -- NULL = livrare reusita
    FOREIGN KEY (Id_Colet) REFERENCES Colete(Id_Colet)
);
INSERT INTO Expeditori VALUES
 (1,'Barbu','Cristian','Timisoara'),    -- B in [A-M]
 (2,'Marin','Otilia','Timisoara'),      -- M in [A-M]
 (3,'Nedelcu','Paul','Arad'),           -- N nu e in [A-M]
 (4,'Olaru','Sanda','Timisoara');       -- fara colete -> j) cu 0
INSERT INTO Colete VALUES
 (10,1,'2021-03-03','L'),
 (11,1,'2021-03-19','L'),
 (12,1,'2021-03-28','L'),    -- Barbu: 3 colete in martie -> g)
 (13,2,'2021-05-15','L'),
 (14,3,'2021-03-10',NULL),   -- in tranzit
 (15,1,'2021-08-09','R');    -- returnat
INSERT INTO Livrari VALUES
 (100,10,'1234560001','2021-03-03','2021-03-06', 19.50,NULL),   -- prima cifra 1, reusita
 (101,11,'0567800002','2021-03-19','2021-03-22', 24.00,'2021-03-21'),  -- prima cifra 0 -> exclus la f; esuata
 (102,11,'2345600003','2021-03-20','2021-03-23', 24.00,'2021-03-22'),  -- a 2-a livrare esuata pe coletul 11 -> l)
 (103,12,'9001200004','2021-03-28','2021-03-30', 30.00,NULL),   -- prima cifra 9, reusita
 (104,13,'7777000005','2021-05-15','2021-05-18', 15.00,NULL);
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  UNIVERSITATE
-- ============================================================
USE universitate;
CREATE TABLE Studenti (
    Id_Student INT PRIMARY KEY,
    Nume      VARCHAR(50) NOT NULL,
    Prenume   VARCHAR(50) NOT NULL,
    Facultate VARCHAR(50) NOT NULL
);
CREATE TABLE Inscrieri (
    Id_Inscriere INT PRIMARY KEY,
    Id_Student   INT NOT NULL,
    Data         DATETIME NOT NULL,
    Stare        CHAR(1) NULL,               -- NULL / 'P' / 'A'
    FOREIGN KEY (Id_Student) REFERENCES Studenti(Id_Student)
);
CREATE TABLE Note (
    Id_Nota        INT PRIMARY KEY,
    Id_Inscriere   INT NOT NULL,
    Cod_Disciplina VARCHAR(10) NOT NULL,
    Data_Examen    DATETIME NOT NULL,
    Valabila_Pana  DATETIME NOT NULL,
    Nota           DECIMAL(4,2) NOT NULL,
    Contestata     DATETIME NULL,            -- NULL = necontestata
    FOREIGN KEY (Id_Inscriere) REFERENCES Inscrieri(Id_Inscriere)
);
INSERT INTO Studenti VALUES
 (1,'Popescu','Andrei','Automatica'),
 (2,'Munteanu','Maria','Automatica'),
 (3,'Ionescu','Vlad','Electronica'),
 (4,'Georgescu','Radu','Mecanica');   -- fara inscrieri -> j) cu 0; i) il include
INSERT INTO Inscrieri VALUES
 (10,1,'2021-06-03','P'),
 (11,1,'2021-06-19','P'),
 (12,1,'2021-09-14','P'),    -- Popescu: 3 inscrieri in 2021 -> g)
 (13,2,'2021-06-15','P'),
 (14,3,'2021-06-10','A'),    -- absent -> Ionescu exclus la i)
 (15,1,'2021-01-05',NULL);
INSERT INTO Note VALUES
 (100,10,'CS101','2021-06-03','2021-12-01', 9.50,NULL),   -- ultima cifra 1 (impar), necontestata, expira < 31.12
 (101,11,'CS102','2021-06-19','2022-06-19', 7.00,NULL),   -- ultima cifra 2 (par) -> exclus la f
 (102,12,'MA205','2021-09-14','2022-01-01', 8.50,'2021-10-01'),  -- contestata
 (103,13,'CS103','2021-06-15','2021-11-30', 6.00,NULL);
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  BIBLIOTECA_CARTI  (Subiect BD sept. 2022 — Abonati / Carti / Imprumuturi)
--  Model N—N: un abonat imprumuta mai multe carti, o carte e imprumutata de
--  mai multi abonati; tabela `Imprumuturi` face legatura si tine datele.
--  Regula: DataReturnareAsteptata = DataImprumut + 14 zile (2 saptamani).
--  In subiect PK-urile sunt IDENTITY(1,1) si DataReturnareAsteptata e pusa de
--  un trigger; aici (doar SELECT) punem valorile direct in seed.
-- ============================================================
USE biblioteca_carti;
CREATE TABLE Abonati (
    IdAbonat     INT PRIMARY KEY,
    Nume         VARCHAR(100) NOT NULL,
    Prenume      VARCHAR(100) NOT NULL,
    DataAdaugare DATETIME NOT NULL,
    Telefon      VARCHAR(10) NULL,
    DataNasterii DATETIME NULL
);
CREATE TABLE Carti (
    IdCarte      INT PRIMARY KEY,
    Titlu        VARCHAR(150) NOT NULL,
    Autor        VARCHAR(70)  NOT NULL,
    ISBN         VARCHAR(20)  NOT NULL,
    DataAparitiei DATETIME    NOT NULL
);
CREATE TABLE Imprumuturi (
    IdImprumut             INT PRIMARY KEY,
    IdAbonat               INT NOT NULL,
    IdCarte                INT NOT NULL,
    DataImprumut           DATETIME NOT NULL,
    DataReturnareAsteptata DATETIME NOT NULL,   -- = DataImprumut + 14 zile
    DataReturnareReala     DATETIME NULL,       -- NULL = inca nereturnata
    FOREIGN KEY (IdAbonat) REFERENCES Abonati(IdAbonat),
    FOREIGN KEY (IdCarte)  REFERENCES Carti(IdCarte)
);
INSERT INTO Abonati VALUES
 (1,'Popescu','Andrei','2021-05-10','0721000001','1998-03-14'),   -- ...escu -> a)
 (2,'Ionescu','Maria','2021-06-01','0721000002','1999-07-22'),    -- ...escu -> a)
 (3,'Pop','Vlad','2021-07-15','0721000003','2000-01-05'),
 (4,'Georgescu','Elena','2021-08-20','0721000004','1997-11-30'),  -- ...escu -> a)
 (5,'Marin','Radu','2022-01-02','0721000005','2001-02-18');       -- fara imprumuturi -> e) cu 0
INSERT INTO Carti VALUES
 (1,'Amintiri din copilarie','Ion Creanga','9789730000011','2022-11-05'),   -- aparuta in nov. -> f)
 (2,'Morometii','Marin Preda','9789730000028','2020-03-01'),
 (3,'Enigma Otiliei','George Calinescu','9789730000035','2022-11-20'),      -- aparuta in nov. -> f)
 (4,'Ion','Liviu Rebreanu','9789730000042','2019-05-01'),
 (5,'Baltagul','Mihail Sadoveanu','9789730000059','2021-09-10');
INSERT INTO Imprumuturi VALUES
 (10,1,1,'2022-01-10','2022-01-24','2022-01-20'),   -- returnat la timp
 (11,1,1,'2022-02-01','2022-02-15','2022-03-01'),   -- reala > asteptata -> nereturnat la timp -> d)
 (12,1,3,'2022-09-05','2022-09-19',NULL),           -- activ, expira < 25.09.2022 -> h); nereturnat -> b), d)
 (13,2,1,'2022-03-10','2022-03-24','2022-03-22'),   -- la timp
 (14,2,5,'2022-05-01','2022-05-15','2022-05-10'),   -- la timp; abonat 2 -> 2 imprum. in 2022 -> g)
 (15,2,1,'2021-11-01','2021-11-15',NULL),           -- activ expirat -> b), d), h)
 (16,3,2,'2022-06-01','2022-06-15','2022-06-10'),   -- la timp
 (17,4,4,'2023-01-05','2023-01-19',NULL);           -- activ nereturnat -> b), d) (nu h: expira in 2023)
-- carte 1 are 4 imprumuturi (10,11,13,15) = cea mai imprumutata -> c) da 4
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO

-- ============================================================
--  OPERATOR GSM (Abonati / Solicitari / Cartele) — Subiectul III
-- ============================================================
USE gsm;
CREATE TABLE Abonati (
    Identificator INT PRIMARY KEY,
    Nume          VARCHAR(50) NOT NULL,
    Prenume       VARCHAR(50) NOT NULL,
    Localitate    VARCHAR(50) NOT NULL
);
CREATE TABLE Solicitari (
    Identificator INT PRIMARY KEY,
    ID_Abonat     INT NOT NULL,
    Data          DATETIME NOT NULL,
    Stare         CHAR(1) NULL,               -- NULL / 'R' / 'X'
    FOREIGN KEY (ID_Abonat) REFERENCES Abonati(Identificator)
);
CREATE TABLE Cartele (
    Identificator    INT PRIMARY KEY,
    ID_Solicitare    INT NOT NULL,
    Numar_Telefon    VARCHAR(10) NOT NULL,
    Valabila_De_La   DATETIME NOT NULL,
    Valabila_Pana_La DATETIME NOT NULL,
    Blocata          DATETIME NULL,           -- NULL = se poate folosi
    FOREIGN KEY (ID_Solicitare) REFERENCES Solicitari(Identificator)
);
INSERT INTO Abonati VALUES
 (1,'Popescu','Andrei','Bucuresti'),
 (2,'Ionescu','Maria','Bucuresti'),
 (3,'Pop','Vlad','Cluj-Napoca'),
 (4,'Popa','Elena','Bucuresti'),
 (5,'Georgescu','Radu','Iasi');
INSERT INTO Solicitari VALUES
 (10,1,'2021-01-05','R'),
 (11,1,'2021-01-19','R'),
 (12,1,'2021-06-28','R'),     -- Popescu: 3 solicitari in 2021 -> cerinta g
 (13,2,'2021-01-10','R'),
 (14,2,'2021-03-15',NULL),    -- in procesare; Ionescu -> 2 in 2021 (g)
 (15,3,'2021-01-20','R'),
 (16,4,'2021-02-02','X'),     -- anulata
 (17,5,'2021-01-08','R');
INSERT INTO Cartele VALUES
 (100,10,'0721000001','2021-01-05','2021-12-01',NULL),           -- a 4-a cifra 1; expira <31.12, nebloc -> h
 (101,11,'0720500002','2021-01-19','2022-06-19','2021-08-01'),   -- a 4-a cifra 0 -> exclus la f; BLOCATA -> b
 (102,12,'0745000003','2021-06-28','2022-06-28',NULL),           -- solicitare in iunie -> exclus la f
 (103,13,'0733000004','2021-01-10','2021-11-30',NULL),           -- a 4-a cifra 3; expira <31.12, nebloc -> h
 (104,15,'0722000005','2021-01-20','2022-01-20','2021-09-15'),   -- a 4-a cifra 2 (f) dar BLOCATA -> b
 (105,17,'0728000006','2021-01-08','2022-01-08',NULL);           -- a 4-a cifra 8; expira in 2022 -> nu h
CREATE USER readonly FOR LOGIN readonly;
ALTER ROLE db_datareader ADD MEMBER readonly;
GO
