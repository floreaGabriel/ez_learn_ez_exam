-- ============================================================
--  Sablon SANDBOX "Casa de bilete" — mod exersare (scriere).
--  Rulat de server.js (ca `sa`) intr-o baza NOUA per sesiune de browser
--  (sbx_bilete_<sid>). Fara USE / CREATE DATABASE aici. Tine schema/seed-ul
--  IDENTIC cu blocul "BILETE" din init.sql.
-- ============================================================
CREATE TABLE Spectacole (
    Id_Spectacol       INT PRIMARY KEY,
    Titlu              VARCHAR(50) NOT NULL,
    Data               DATETIME NOT NULL,
    Capacitate         INT NOT NULL,
    Locuri_Disponibile INT NOT NULL,
    Pret               DECIMAL(10,2) NOT NULL
);
CREATE TABLE Vanzari (
    Id_Vanzare   INT IDENTITY(1,1) PRIMARY KEY,
    Id_Spectacol INT NOT NULL,
    Cumparator   VARCHAR(50) NOT NULL,
    Nr_Bilete    INT NOT NULL,
    Data         DATETIME NOT NULL,
    Anulata      DATETIME NULL,               -- NULL = valida
    FOREIGN KEY (Id_Spectacol) REFERENCES Spectacole(Id_Spectacol)
);
CREATE TABLE JurnalStoc (
    Id_Jurnal    INT IDENTITY(1,1) PRIMARY KEY,
    Id_Spectacol INT NOT NULL,
    Modificare   INT NOT NULL,                -- -N vanzare / +N anulare / 0 refuz
    Explicatie   VARCHAR(200) NOT NULL,
    Data         DATETIME NOT NULL,
    FOREIGN KEY (Id_Spectacol) REFERENCES Spectacole(Id_Spectacol)
);
INSERT INTO Spectacole VALUES
 (1,'Hamlet',        '2026-08-20',50,50, 60.00),
 (2,'Rigoletto',     '2026-09-05',30,30,120.00),
 (3,'Stand-up Night','2026-07-25', 2, 2, 80.00);
CREATE USER sandbox FOR LOGIN sandbox;
ALTER ROLE db_datareader ADD MEMBER sandbox;
ALTER ROLE db_datawriter ADD MEMBER sandbox;
ALTER ROLE db_ddladmin  ADD MEMBER sandbox;
GRANT EXECUTE ON SCHEMA::dbo TO sandbox;
GRANT VIEW DEFINITION TO sandbox;
GO

CREATE TRIGGER tr_Vanzari_Stoc
ON Vanzari
AFTER INSERT
AS
BEGIN
    IF @@ROWCOUNT = 0 RETURN;
    SET NOCOUNT ON;
    UPDATE S SET Locuri_Disponibile = S.Locuri_Disponibile - X.Total
    FROM Spectacole AS S
         JOIN (SELECT Id_Spectacol, SUM(Nr_Bilete) AS Total
               FROM Inserted GROUP BY Id_Spectacol) AS X
           ON S.Id_Spectacol = X.Id_Spectacol;
    INSERT INTO JurnalStoc(Id_Spectacol, Modificare, Explicatie, Data)
    SELECT Id_Spectacol, -Nr_Bilete, 'Vanzare: ' + Cumparator, GETDATE()
    FROM Inserted;
    IF EXISTS (SELECT * FROM Spectacole AS S
               JOIN Inserted AS I ON S.Id_Spectacol = I.Id_Spectacol
               WHERE S.Locuri_Disponibile < 0)
        THROW 50003, 'Locuri insuficiente pentru spectacol.', 0;
END
GO

CREATE TRIGGER tr_Vanzari_Anulare
ON Vanzari
AFTER UPDATE
AS
BEGIN
    IF @@ROWCOUNT = 0 RETURN;
    SET NOCOUNT ON;
    UPDATE S SET Locuri_Disponibile = S.Locuri_Disponibile + I.Nr_Bilete
    FROM Spectacole AS S
         JOIN Inserted AS I ON S.Id_Spectacol = I.Id_Spectacol
         JOIN Deleted  AS D ON D.Id_Vanzare   = I.Id_Vanzare
    WHERE D.Anulata IS NULL AND I.Anulata IS NOT NULL;
    INSERT INTO JurnalStoc(Id_Spectacol, Modificare, Explicatie, Data)
    SELECT I.Id_Spectacol, I.Nr_Bilete, 'Anulare vanzare: ' + I.Cumparator, GETDATE()
    FROM Inserted AS I
         JOIN Deleted AS D ON D.Id_Vanzare = I.Id_Vanzare
    WHERE D.Anulata IS NULL AND I.Anulata IS NOT NULL;
END
GO

CREATE PROC pr_VindeBilete
    @IdSpectacol AS INT,
    @Cumparator  AS VARCHAR(50),
    @NrBilete    AS INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRAN;
            INSERT INTO Vanzari(Id_Spectacol, Cumparator, Nr_Bilete, Data, Anulata)
            VALUES(@IdSpectacol, @Cumparator, @NrBilete, GETDATE(), NULL);
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        INSERT INTO JurnalStoc(Id_Spectacol, Modificare, Explicatie, Data)
        VALUES(@IdSpectacol, 0, 'REFUZAT (' + @Cumparator + '): ' + ERROR_MESSAGE(), GETDATE());
    END CATCH
END
GO

-- povestea initiala (aceeasi ca in baza principala)
EXEC dbo.pr_VindeBilete @IdSpectacol = 1, @Cumparator = 'Popescu Andrei', @NrBilete = 2;
EXEC dbo.pr_VindeBilete @IdSpectacol = 1, @Cumparator = 'Ionescu Maria',  @NrBilete = 3;
EXEC dbo.pr_VindeBilete @IdSpectacol = 2, @Cumparator = 'Pop Vlad',       @NrBilete = 1;
EXEC dbo.pr_VindeBilete @IdSpectacol = 3, @Cumparator = 'Popa Elena',     @NrBilete = 2;
EXEC dbo.pr_VindeBilete @IdSpectacol = 3, @Cumparator = 'Georgescu Radu', @NrBilete = 1;  -- refuzat
UPDATE dbo.Vanzari SET Anulata = GETDATE() WHERE Id_Vanzare = 2;                          -- anulare
GO
