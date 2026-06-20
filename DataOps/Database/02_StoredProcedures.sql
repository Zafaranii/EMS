USE EMS_DB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetMatchingPresenters
    @SectorId INT,
    @SlotDate DATE,
    @StartTime TIME,
    @EndTime TIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        p.PresenterId,
        p.PresenterName,
        p.Mobile
    FROM dbo.Presenters p
    INNER JOIN dbo.PresenterSectorAvailability psa
        ON psa.PresenterId = p.PresenterId
    WHERE psa.SectorId = @SectorId
            AND psa.AvailableDate = @SlotDate
      AND psa.StartTime <= @StartTime
      AND psa.EndTime >= @EndTime
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.Reservations r
          INNER JOIN dbo.RoomTimeSlots rts ON rts.SlotId = r.SlotId
          WHERE r.PresenterId = p.PresenterId
        AND rts.SlotDate = @SlotDate
            AND rts.StartTime = @StartTime
      )
    ORDER BY p.PresenterName;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetAvailableRooms
    @SlotDate DATE,
    @StartTime TIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        rts.SlotId,
        rts.SlotDate,
        rts.StartTime,
        rts.EndTime,
        cr.RoomName,
        h.HotelId,
        h.HotelName
    FROM dbo.RoomTimeSlots rts
    INNER JOIN dbo.ConferenceRooms cr ON cr.RoomId = rts.RoomId
    INNER JOIN dbo.Hotels h ON h.HotelId = cr.HotelId
    WHERE rts.IsBooked = 0
            AND rts.SlotDate = @SlotDate
      AND rts.StartTime = @StartTime
    ORDER BY h.HotelName, cr.RoomName;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_ConfirmReservation
    @InvestorId INT,
    @PresenterId INT,
    @SlotId INT,
    @SectorId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @SlotStart TIME;
    DECLARE @SlotEnd TIME;
    DECLARE @SlotDate DATE;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @SlotDate = rts.SlotDate,
            @SlotStart = rts.StartTime,
            @SlotEnd = rts.EndTime
        FROM dbo.RoomTimeSlots rts WITH (UPDLOCK)
        WHERE rts.SlotId = @SlotId
          AND rts.IsBooked = 0;

        IF @SlotStart IS NULL OR @SlotEnd IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            SET @Result = 0;
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.PresenterSectorAvailability psa
            WHERE psa.PresenterId = @PresenterId
              AND psa.SectorId = @SectorId
              AND psa.AvailableDate = @SlotDate
              AND psa.StartTime <= @SlotStart
              AND psa.EndTime >= @SlotEnd
        )
        BEGIN
            ROLLBACK TRANSACTION;
            SET @Result = 4;
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.InvestorSectorAvailability isa
            WHERE isa.InvestorId = @InvestorId
              AND isa.SectorId = @SectorId
              AND isa.AvailableDate = @SlotDate
              AND isa.StartTime <= @SlotStart
              AND isa.EndTime >= @SlotEnd
        )
        BEGIN
            ROLLBACK TRANSACTION;
            SET @Result = 5;
            RETURN;
        END

        IF EXISTS (
            SELECT 1
            FROM dbo.Reservations r
            INNER JOIN dbo.RoomTimeSlots rts ON rts.SlotId = r.SlotId
            WHERE r.PresenterId = @PresenterId
                            AND rts.SlotDate = @SlotDate
              AND rts.StartTime = @SlotStart
        )
        BEGIN
            ROLLBACK TRANSACTION;
            SET @Result = 2;
            RETURN;
        END

        IF EXISTS (
            SELECT 1
            FROM dbo.Reservations r
            INNER JOIN dbo.RoomTimeSlots rts ON rts.SlotId = r.SlotId
            WHERE r.InvestorId = @InvestorId
              AND rts.SlotDate = @SlotDate
              AND rts.StartTime = @SlotStart
        )
        BEGIN
            ROLLBACK TRANSACTION;
            SET @Result = 3;
            RETURN;
        END

        INSERT INTO dbo.Reservations (InvestorId, PresenterId, SlotId, SectorId)
        VALUES (@InvestorId, @PresenterId, @SlotId, @SectorId);

        UPDATE dbo.RoomTimeSlots
        SET IsBooked = 1
        WHERE SlotId = @SlotId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        SET @Result = 0;
    END CATCH
END
GO
