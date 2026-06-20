IF DB_ID('EMS_DB') IS NULL
BEGIN
    CREATE DATABASE EMS_DB;
END
GO

USE EMS_DB;
GO

IF OBJECT_ID('dbo.Reservations', 'U') IS NOT NULL DROP TABLE dbo.Reservations;
IF OBJECT_ID('dbo.PresenterSectorAvailability', 'U') IS NOT NULL DROP TABLE dbo.PresenterSectorAvailability;
IF OBJECT_ID('dbo.Presenters', 'U') IS NOT NULL DROP TABLE dbo.Presenters;
IF OBJECT_ID('dbo.InvestorSectorAvailability', 'U') IS NOT NULL DROP TABLE dbo.InvestorSectorAvailability;
IF OBJECT_ID('dbo.Investors', 'U') IS NOT NULL DROP TABLE dbo.Investors;
IF OBJECT_ID('dbo.Sectors', 'U') IS NOT NULL DROP TABLE dbo.Sectors;
IF OBJECT_ID('dbo.RoomTimeSlots', 'U') IS NOT NULL DROP TABLE dbo.RoomTimeSlots;
IF OBJECT_ID('dbo.ConferenceRooms', 'U') IS NOT NULL DROP TABLE dbo.ConferenceRooms;
IF OBJECT_ID('dbo.HotelImportErrors', 'U') IS NOT NULL DROP TABLE dbo.HotelImportErrors;
IF OBJECT_ID('dbo.Hotels', 'U') IS NOT NULL DROP TABLE dbo.Hotels;
GO

CREATE TABLE dbo.Hotels (
    HotelId INT IDENTITY(1,1) NOT NULL,
    HotelName NVARCHAR(200) NOT NULL,
    Address NVARCHAR(300) NOT NULL,
    CONSTRAINT PK_Hotels PRIMARY KEY (HotelId)
);
GO

CREATE TABLE dbo.ConferenceRooms (
    RoomId INT IDENTITY(1,1) NOT NULL,
    HotelId INT NOT NULL,
    RoomName NVARCHAR(150) NOT NULL,
    CONSTRAINT PK_ConferenceRooms PRIMARY KEY (RoomId),
    CONSTRAINT FK_ConferenceRooms_Hotels
        FOREIGN KEY (HotelId) REFERENCES dbo.Hotels(HotelId) ON DELETE CASCADE,
    CONSTRAINT UQ_Rooms_Hotel_RoomName
        UNIQUE (HotelId, RoomName)
);
GO

CREATE TABLE dbo.RoomTimeSlots (
    SlotId INT IDENTITY(1,1) NOT NULL,
    RoomId INT NOT NULL,
    SlotDate DATE NOT NULL CONSTRAINT DF_RoomTimeSlots_SlotDate DEFAULT (CONVERT(DATE, GETDATE())),
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsBooked BIT NOT NULL CONSTRAINT DF_RoomTimeSlots_IsBooked DEFAULT (0),
    CONSTRAINT PK_RoomTimeSlots PRIMARY KEY (SlotId),
    CONSTRAINT FK_RoomTimeSlots_ConferenceRooms
        FOREIGN KEY (RoomId) REFERENCES dbo.ConferenceRooms(RoomId) ON DELETE CASCADE,
    CONSTRAINT UQ_RoomTimeSlots_RoomDateStart
        UNIQUE (RoomId, SlotDate, StartTime),
    CONSTRAINT CHK_Time_RoomSlots
        CHECK (DATEDIFF(MINUTE, StartTime, EndTime) = 60)
);
GO

CREATE TABLE dbo.Sectors (
    SectorId INT IDENTITY(1,1) NOT NULL,
    SectorName NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_Sectors PRIMARY KEY (SectorId),
    CONSTRAINT UQ_Sectors_SectorName UNIQUE (SectorName)
);
GO

CREATE TABLE dbo.Investors (
    InvestorId INT IDENTITY(1,1) NOT NULL,
    InvestorName NVARCHAR(200) NOT NULL,
    Mobile NVARCHAR(30) NOT NULL,
    CONSTRAINT PK_Investors PRIMARY KEY (InvestorId)
);
GO

CREATE TABLE dbo.InvestorSectorAvailability (
    Id INT IDENTITY(1,1) NOT NULL,
    InvestorId INT NOT NULL,
    SectorId INT NOT NULL,
    AvailableDate DATE NOT NULL DEFAULT (CAST(GETDATE() AS DATE)),
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    CONSTRAINT PK_InvestorSectorAvailability PRIMARY KEY (Id),
    CONSTRAINT FK_InvestorSectorAvailability_Investors
        FOREIGN KEY (InvestorId) REFERENCES dbo.Investors(InvestorId) ON DELETE CASCADE,
    CONSTRAINT FK_InvestorSectorAvailability_Sectors
        FOREIGN KEY (SectorId) REFERENCES dbo.Sectors(SectorId) ON DELETE CASCADE,
    CONSTRAINT CHK_Time_InvestorSectorAvailability
        CHECK (StartTime < EndTime),
    CONSTRAINT UQ_InvestorSectorAvailability
        UNIQUE (InvestorId, SectorId, AvailableDate, StartTime, EndTime)
);
GO

CREATE TABLE dbo.Presenters (
    PresenterId INT IDENTITY(1,1) NOT NULL,
    PresenterName NVARCHAR(200) NOT NULL,
    Mobile NVARCHAR(30) NOT NULL,
    CONSTRAINT PK_Presenters PRIMARY KEY (PresenterId)
);
GO

CREATE TABLE dbo.PresenterSectorAvailability (
    Id INT IDENTITY(1,1) NOT NULL,
    PresenterId INT NOT NULL,
    SectorId INT NOT NULL,
    AvailableDate DATE NOT NULL DEFAULT (CAST(GETDATE() AS DATE)),
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    CONSTRAINT PK_PresenterSectorAvailability PRIMARY KEY (Id),
    CONSTRAINT FK_PresenterSectorAvailability_Presenters
        FOREIGN KEY (PresenterId) REFERENCES dbo.Presenters(PresenterId) ON DELETE CASCADE,
    CONSTRAINT FK_PresenterSectorAvailability_Sectors
        FOREIGN KEY (SectorId) REFERENCES dbo.Sectors(SectorId) ON DELETE CASCADE,
    CONSTRAINT CHK_Time_PresenterSectorAvailability
        CHECK (StartTime < EndTime),
    CONSTRAINT UQ_PresenterSectorAvailability
        UNIQUE (PresenterId, SectorId, AvailableDate, StartTime, EndTime)
);
GO

CREATE TABLE dbo.Reservations (
    ReservationId INT IDENTITY(1,1) NOT NULL,
    InvestorId INT NOT NULL,
    PresenterId INT NOT NULL,
    SlotId INT NOT NULL,
    SectorId INT NOT NULL,
    BookedAt DATETIME NOT NULL CONSTRAINT DF_Reservations_BookedAt DEFAULT (GETDATE()),
    CONSTRAINT PK_Reservations PRIMARY KEY (ReservationId),
    CONSTRAINT FK_Reservations_Investors
        FOREIGN KEY (InvestorId) REFERENCES dbo.Investors(InvestorId),
    CONSTRAINT FK_Reservations_Presenters
        FOREIGN KEY (PresenterId) REFERENCES dbo.Presenters(PresenterId),
    CONSTRAINT FK_Reservations_RoomTimeSlots
        FOREIGN KEY (SlotId) REFERENCES dbo.RoomTimeSlots(SlotId),
    CONSTRAINT FK_Reservations_Sectors
        FOREIGN KEY (SectorId) REFERENCES dbo.Sectors(SectorId),
    CONSTRAINT UQ_Reservation_Slot UNIQUE (SlotId)
);
GO

CREATE INDEX IX_RoomSlots_RoomId_IsBooked
    ON dbo.RoomTimeSlots(RoomId, SlotDate, IsBooked, StartTime);
GO

CREATE INDEX IX_InvSec
    ON dbo.InvestorSectorAvailability(InvestorId, SectorId);
GO

CREATE INDEX IX_InvSec_Sector_Time
    ON dbo.InvestorSectorAvailability(SectorId, StartTime, EndTime);
GO

CREATE INDEX IX_PresSec
    ON dbo.PresenterSectorAvailability(PresenterId, SectorId);
GO

CREATE INDEX IX_PresSec_Sector_Time
    ON dbo.PresenterSectorAvailability(SectorId, StartTime, EndTime);
GO

CREATE TABLE dbo.HotelImportErrors (
    ErrorId INT IDENTITY(1,1) NOT NULL,
    FileName NVARCHAR(260) NULL,
    RowData NVARCHAR(500) NULL,
    ErrorDesc NVARCHAR(500) NULL,
    ImportedAt DATETIME NOT NULL CONSTRAINT DF_HotelImportErrors_ImportedAt DEFAULT (GETDATE()),
    CONSTRAINT PK_HotelImportErrors PRIMARY KEY (ErrorId)
);
GO
