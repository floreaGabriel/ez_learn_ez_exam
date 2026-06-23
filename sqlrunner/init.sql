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
