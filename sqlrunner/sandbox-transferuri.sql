-- ============================================================
--  Sablon SANDBOX "Transferuri bancare" — mod exersare (scriere).
--  Rulat de server.js (ca `sa`) intr-o baza NOUA per sesiune de browser
--  (sbx_transferuri_<sid>). Fara USE / CREATE DATABASE aici — serverul
--  conecteaza direct la baza tinta. Tine schema/seed-ul IDENTIC cu blocul
--  "TRANSFERURI" din init.sql (aceeasi poveste a datelor).
-- ============================================================
CREATE TABLE Conturi (
    Id_Cont INT PRIMARY KEY,
    Titular VARCHAR(50) NOT NULL,
    IBAN    VARCHAR(24) NOT NULL,
    Sold    DECIMAL(10,2) NOT NULL
);
CREATE TABLE Transferuri (
    Id_Transfer   INT IDENTITY(1,1) PRIMARY KEY,
    Id_Cont_Sursa INT NOT NULL,
    Id_Cont_Dest  INT NOT NULL,
    Suma          DECIMAL(10,2) NOT NULL,
    Data          DATETIME NOT NULL,
    Stare         CHAR(1) NOT NULL,           -- 'F' = finalizat / 'E' = esuat
    Motiv         VARCHAR(200) NULL           -- NULL = reusit
);
CREATE TABLE AuditSolduri (
    Id_Audit   INT IDENTITY(1,1) PRIMARY KEY,
    Id_Cont    INT NOT NULL,
    Sold_Vechi DECIMAL(10,2) NOT NULL,
    Sold_Nou   DECIMAL(10,2) NOT NULL,
    Data       DATETIME NOT NULL,
    FOREIGN KEY (Id_Cont) REFERENCES Conturi(Id_Cont)
);
INSERT INTO Conturi VALUES
 (1,'Popescu Andrei','RO49TRNF0000000000000001',1000.00),
 (2,'Ionescu Maria', 'RO49TRNF0000000000000002', 500.00),
 (3,'Pop Vlad',      'RO49TRNF0000000000000003', 750.00);
CREATE USER sandbox FOR LOGIN sandbox;
ALTER ROLE db_datareader ADD MEMBER sandbox;
ALTER ROLE db_datawriter ADD MEMBER sandbox;
ALTER ROLE db_ddladmin  ADD MEMBER sandbox;
GRANT EXECUTE ON SCHEMA::dbo TO sandbox;     -- poate EXEC procedurile (si pe ale lui)
GRANT VIEW DEFINITION TO sandbox;            -- OBJECT_DEFINITION() functioneaza
GO

CREATE TRIGGER tr_Conturi_Audit
ON Conturi
AFTER UPDATE
AS
BEGIN
    IF @@ROWCOUNT = 0 RETURN;
    SET NOCOUNT ON;
    INSERT INTO AuditSolduri(Id_Cont, Sold_Vechi, Sold_Nou, Data)
    SELECT D.Id_Cont, D.Sold, I.Sold, GETDATE()
    FROM Deleted AS D
         JOIN Inserted AS I ON D.Id_Cont = I.Id_Cont
    WHERE D.Sold <> I.Sold;
END
GO

CREATE PROC pr_Transfera
    @IdSursa AS INT,
    @IdDest  AS INT,
    @Suma    AS DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRAN;
            IF NOT EXISTS (SELECT * FROM Conturi WHERE Id_Cont = @IdSursa)
               OR NOT EXISTS (SELECT * FROM Conturi WHERE Id_Cont = @IdDest)
                THROW 50001, 'Cont inexistent.', 0;
            DECLARE @Sold AS DECIMAL(10,2);
            SET @Sold = (SELECT Sold FROM Conturi WHERE Id_Cont = @IdSursa);
            IF @Sold < @Suma
                THROW 50002, 'Fonduri insuficiente in contul sursa.', 0;
            UPDATE Conturi SET Sold = Sold - @Suma WHERE Id_Cont = @IdSursa;
            UPDATE Conturi SET Sold = Sold + @Suma WHERE Id_Cont = @IdDest;
            INSERT INTO Transferuri(Id_Cont_Sursa, Id_Cont_Dest, Suma, Data, Stare, Motiv)
            VALUES(@IdSursa, @IdDest, @Suma, GETDATE(), 'F', NULL);
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        INSERT INTO Transferuri(Id_Cont_Sursa, Id_Cont_Dest, Suma, Data, Stare, Motiv)
        VALUES(@IdSursa, @IdDest, @Suma, GETDATE(), 'E', ERROR_MESSAGE());
    END CATCH
END
GO

CREATE PROC pr_SoldCont
    @IdCont AS INT,
    @Sold   AS DECIMAL(10,2) = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Sold = (SELECT Sold FROM Conturi WHERE Id_Cont = @IdCont);
    RETURN;
END
GO

-- povestea initiala (aceeasi ca in baza principala)
EXEC dbo.pr_Transfera @IdSursa = 1, @IdDest = 2, @Suma = 300;   -- reusit
EXEC dbo.pr_Transfera @IdSursa = 3, @IdDest = 1, @Suma = 150;   -- reusit
EXEC dbo.pr_Transfera @IdSursa = 2, @IdDest = 3, @Suma = 2000;  -- esueaza: fonduri insuficiente
EXEC dbo.pr_Transfera @IdSursa = 1, @IdDest = 9, @Suma = 50;    -- esueaza: cont inexistent
GO
