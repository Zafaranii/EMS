USE EMS_DB;
GO

INSERT INTO dbo.Sectors (SectorName)
SELECT v.SectorName
FROM (VALUES
    (N'Finance'),
    (N'IT'),
    (N'Restaurants'),
    (N'Real Estate'),
    (N'Retail'),
    (N'Healthcare')
) AS v(SectorName)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Sectors s WHERE s.SectorName = v.SectorName
);
GO

-- Full reservation test samples (idempotent)
DECLARE @HotelId INT = (SELECT TOP 1 HotelId FROM dbo.Hotels ORDER BY HotelId);

IF @HotelId IS NULL
BEGIN
    INSERT INTO dbo.Hotels (HotelName, Address)
    VALUES (N'Aurora Grand Hotel', N'Downtown - Sample Address');

    SET @HotelId = SCOPE_IDENTITY();
END
GO

DECLARE @HotelId INT = (SELECT TOP 1 HotelId FROM dbo.Hotels ORDER BY HotelId);

IF NOT EXISTS (
    SELECT 1 FROM dbo.ConferenceRooms WHERE HotelId = @HotelId AND RoomName = N'Main Room'
)
BEGIN
    INSERT INTO dbo.ConferenceRooms (HotelId, RoomName)
    VALUES (@HotelId, N'Main Room');
END

IF NOT EXISTS (
    SELECT 1 FROM dbo.ConferenceRooms WHERE HotelId = @HotelId AND RoomName = N'Sky Room'
)
BEGIN
    INSERT INTO dbo.ConferenceRooms (HotelId, RoomName)
    VALUES (@HotelId, N'Sky Room');
END
GO

DECLARE @Today DATE = CONVERT(DATE, GETDATE());

;WITH SampleSlots AS (
    SELECT RoomId, DATEADD(DAY, d.DayOffset, @Today) AS SlotDate, t.StartTime, t.EndTime
    FROM dbo.ConferenceRooms r
    CROSS JOIN (VALUES (0), (1), (2), (3), (4)) d(DayOffset)
    CROSS JOIN (VALUES
        (CAST('10:00' AS TIME), CAST('11:00' AS TIME)),
        (CAST('11:00' AS TIME), CAST('12:00' AS TIME)),
        (CAST('12:00' AS TIME), CAST('13:00' AS TIME))
    ) t(StartTime, EndTime)
    WHERE r.RoomName IN (N'Main Room', N'Sky Room')
)
INSERT INTO dbo.RoomTimeSlots (RoomId, SlotDate, StartTime, EndTime, IsBooked)
SELECT s.RoomId, s.SlotDate, s.StartTime, s.EndTime, 0
FROM SampleSlots s
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.RoomTimeSlots x
    WHERE x.RoomId = s.RoomId
      AND x.SlotDate = s.SlotDate
      AND x.StartTime = s.StartTime
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Investors WHERE InvestorName = N'Sample Investor A')
BEGIN
    INSERT INTO dbo.Investors (InvestorName, Mobile)
    VALUES (N'Sample Investor A', N'0100000001');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Investors WHERE InvestorName = N'Sample Investor B')
BEGIN
    INSERT INTO dbo.Investors (InvestorName, Mobile)
    VALUES (N'Sample Investor B', N'0100000002');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Presenters WHERE PresenterName = N'Sample Presenter A')
BEGIN
    INSERT INTO dbo.Presenters (PresenterName, Mobile)
    VALUES (N'Sample Presenter A', N'0200000001');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Presenters WHERE PresenterName = N'Sample Presenter B')
BEGIN
    INSERT INTO dbo.Presenters (PresenterName, Mobile)
    VALUES (N'Sample Presenter B', N'0200000002');
END
GO

DECLARE @FinanceId INT = (SELECT TOP 1 SectorId FROM dbo.Sectors WHERE SectorName = N'Finance');
DECLARE @ITId INT = (SELECT TOP 1 SectorId FROM dbo.Sectors WHERE SectorName = N'IT');

DECLARE @InvA INT = (SELECT InvestorId FROM dbo.Investors WHERE InvestorName = N'Sample Investor A');
DECLARE @InvB INT = (SELECT InvestorId FROM dbo.Investors WHERE InvestorName = N'Sample Investor B');
DECLARE @PreA INT = (SELECT PresenterId FROM dbo.Presenters WHERE PresenterName = N'Sample Presenter A');
DECLARE @PreB INT = (SELECT PresenterId FROM dbo.Presenters WHERE PresenterName = N'Sample Presenter B');

DECLARE @Today DATE = CONVERT(DATE, GETDATE());

IF NOT EXISTS (SELECT 1 FROM dbo.InvestorSectorAvailability WHERE InvestorId = @InvA AND SectorId = @FinanceId AND AvailableDate = @Today AND StartTime = '10:00' AND EndTime = '13:00')
BEGIN
    INSERT INTO dbo.InvestorSectorAvailability (InvestorId, SectorId, AvailableDate, StartTime, EndTime)
    VALUES (@InvA, @FinanceId, @Today, '10:00', '13:00');
END

IF NOT EXISTS (SELECT 1 FROM dbo.InvestorSectorAvailability WHERE InvestorId = @InvB AND SectorId = @ITId AND AvailableDate = @Today AND StartTime = '10:00' AND EndTime = '13:00')
BEGIN
    INSERT INTO dbo.InvestorSectorAvailability (InvestorId, SectorId, AvailableDate, StartTime, EndTime)
    VALUES (@InvB, @ITId, @Today, '10:00', '13:00');
END

IF NOT EXISTS (SELECT 1 FROM dbo.PresenterSectorAvailability WHERE PresenterId = @PreA AND SectorId = @FinanceId AND AvailableDate = @Today AND StartTime = '10:00' AND EndTime = '13:00')
BEGIN
    INSERT INTO dbo.PresenterSectorAvailability (PresenterId, SectorId, AvailableDate, StartTime, EndTime)
    VALUES (@PreA, @FinanceId, @Today, '10:00', '13:00');
END

IF NOT EXISTS (SELECT 1 FROM dbo.PresenterSectorAvailability WHERE PresenterId = @PreB AND SectorId = @ITId AND AvailableDate = @Today AND StartTime = '10:00' AND EndTime = '13:00')
BEGIN
    INSERT INTO dbo.PresenterSectorAvailability (PresenterId, SectorId, AvailableDate, StartTime, EndTime)
    VALUES (@PreB, @ITId, @Today, '10:00', '13:00');
END
GO

DECLARE @FinanceId INT = (SELECT TOP 1 SectorId FROM dbo.Sectors WHERE SectorName = N'Finance');
DECLARE @ITId INT = (SELECT TOP 1 SectorId FROM dbo.Sectors WHERE SectorName = N'IT');

DECLARE @InvA INT = (SELECT InvestorId FROM dbo.Investors WHERE InvestorName = N'Sample Investor A');
DECLARE @InvB INT = (SELECT InvestorId FROM dbo.Investors WHERE InvestorName = N'Sample Investor B');
DECLARE @PreA INT = (SELECT PresenterId FROM dbo.Presenters WHERE PresenterName = N'Sample Presenter A');
DECLARE @PreB INT = (SELECT PresenterId FROM dbo.Presenters WHERE PresenterName = N'Sample Presenter B');

DECLARE @SlotFinance INT = (
    SELECT TOP 1 rts.SlotId
    FROM dbo.RoomTimeSlots rts
    JOIN dbo.ConferenceRooms cr ON cr.RoomId = rts.RoomId
    WHERE cr.RoomName = N'Main Room'
      AND rts.SlotDate = CONVERT(DATE, GETDATE())
      AND rts.StartTime = '10:00'
      AND rts.IsBooked = 0
    ORDER BY rts.SlotId
);

DECLARE @SlotIT INT = (
    SELECT TOP 1 rts.SlotId
    FROM dbo.RoomTimeSlots rts
    JOIN dbo.ConferenceRooms cr ON cr.RoomId = rts.RoomId
    WHERE cr.RoomName = N'Sky Room'
      AND rts.SlotDate = CONVERT(DATE, GETDATE())
      AND rts.StartTime = '11:00'
      AND rts.IsBooked = 0
    ORDER BY rts.SlotId
);

DECLARE @Result INT;

IF @SlotFinance IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Reservations WHERE SlotId = @SlotFinance)
BEGIN
    EXEC dbo.sp_ConfirmReservation
        @InvestorId = @InvA,
        @PresenterId = @PreA,
        @SlotId = @SlotFinance,
        @SectorId = @FinanceId,
        @Result = @Result OUTPUT;
END

IF @SlotIT IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Reservations WHERE SlotId = @SlotIT)
BEGIN
    EXEC dbo.sp_ConfirmReservation
        @InvestorId = @InvB,
        @PresenterId = @PreB,
        @SlotId = @SlotIT,
        @SectorId = @ITId,
        @Result = @Result OUTPUT;
END
GO
