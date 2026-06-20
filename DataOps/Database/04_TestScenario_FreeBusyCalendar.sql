USE EMS_DB;
GO

/*
  Deterministic test scenario for calendar day coloring in Reservation step 2.

  Expected after running:
  - FREE date  : has at least one real bookable slot (green)
  - BUSY date  : has slot at the same time window but already booked (red)
  - NO-SLOT date: investor has availability but no room slot exists (red)

  Data entities created/used:
  - Investor : QA Investor FreeBusy
  - Presenter: QA Presenter FreeBusy
  - Hotel    : QA Calendar Hotel
  - Room     : QA Room A
  - Sector   : Finance
  - Time window: 06:00-07:00 (isolated from normal sample slots)
*/

DECLARE @FinanceId INT;
DECLARE @InvestorId INT;
DECLARE @PresenterId INT;
DECLARE @BlockInvestorId INT;
DECLARE @BlockPresenterId INT;
DECLARE @HotelId INT;
DECLARE @RoomId INT;

DECLARE @FreeDate DATE = DATEADD(DAY, 1, CONVERT(DATE, GETDATE()));
DECLARE @BusyDate DATE = DATEADD(DAY, 2, CONVERT(DATE, GETDATE()));
DECLARE @NoSlotDate DATE = DATEADD(DAY, 3, CONVERT(DATE, GETDATE()));

-- 1) Ensure core reference rows exist.
IF NOT EXISTS (SELECT 1 FROM dbo.Sectors WHERE SectorName = N'Finance')
BEGIN
    INSERT INTO dbo.Sectors (SectorName) VALUES (N'Finance');
END
SELECT @FinanceId = SectorId FROM dbo.Sectors WHERE SectorName = N'Finance';

IF NOT EXISTS (SELECT 1 FROM dbo.Investors WHERE InvestorName = N'QA Investor FreeBusy')
BEGIN
    INSERT INTO dbo.Investors (InvestorName, Mobile) VALUES (N'QA Investor FreeBusy', N'0109000001');
END
SELECT @InvestorId = InvestorId FROM dbo.Investors WHERE InvestorName = N'QA Investor FreeBusy';

IF NOT EXISTS (SELECT 1 FROM dbo.Presenters WHERE PresenterName = N'QA Presenter FreeBusy')
BEGIN
    INSERT INTO dbo.Presenters (PresenterName, Mobile) VALUES (N'QA Presenter FreeBusy', N'0209000001');
END
SELECT @PresenterId = PresenterId FROM dbo.Presenters WHERE PresenterName = N'QA Presenter FreeBusy';

IF NOT EXISTS (SELECT 1 FROM dbo.Investors WHERE InvestorName = N'QA Investor BusyBlock')
BEGIN
    INSERT INTO dbo.Investors (InvestorName, Mobile) VALUES (N'QA Investor BusyBlock', N'0109000002');
END
SELECT @BlockInvestorId = InvestorId FROM dbo.Investors WHERE InvestorName = N'QA Investor BusyBlock';

IF NOT EXISTS (SELECT 1 FROM dbo.Presenters WHERE PresenterName = N'QA Presenter BusyBlock')
BEGIN
    INSERT INTO dbo.Presenters (PresenterName, Mobile) VALUES (N'QA Presenter BusyBlock', N'0209000002');
END
SELECT @BlockPresenterId = PresenterId FROM dbo.Presenters WHERE PresenterName = N'QA Presenter BusyBlock';

IF NOT EXISTS (SELECT 1 FROM dbo.Hotels WHERE HotelName = N'QA Calendar Hotel')
BEGIN
    INSERT INTO dbo.Hotels (HotelName, Address)
    VALUES (N'QA Calendar Hotel', N'QA Address');
END
SELECT @HotelId = HotelId FROM dbo.Hotels WHERE HotelName = N'QA Calendar Hotel';

IF NOT EXISTS (SELECT 1 FROM dbo.ConferenceRooms WHERE HotelId = @HotelId AND RoomName = N'QA Room A')
BEGIN
    INSERT INTO dbo.ConferenceRooms (HotelId, RoomName)
    VALUES (@HotelId, N'QA Room A');
END
SELECT @RoomId = RoomId FROM dbo.ConferenceRooms WHERE HotelId = @HotelId AND RoomName = N'QA Room A';

-- 2) Reset scenario rows so script is idempotent.
DELETE r
FROM dbo.Reservations r
INNER JOIN dbo.RoomTimeSlots s ON s.SlotId = r.SlotId
WHERE s.RoomId = @RoomId
  AND s.SlotDate IN (@FreeDate, @BusyDate, @NoSlotDate)
  AND s.StartTime = '06:00';

DELETE FROM dbo.RoomTimeSlots
WHERE RoomId = @RoomId
  AND SlotDate IN (@FreeDate, @BusyDate, @NoSlotDate)
  AND StartTime = '06:00';

DELETE FROM dbo.InvestorSectorAvailability
WHERE InvestorId IN (@InvestorId, @BlockInvestorId)
  AND SectorId = @FinanceId
  AND AvailableDate IN (@FreeDate, @BusyDate, @NoSlotDate)
  AND StartTime = '06:00'
  AND EndTime = '07:00';

DELETE FROM dbo.PresenterSectorAvailability
WHERE PresenterId IN (@PresenterId, @BlockPresenterId)
  AND SectorId = @FinanceId
  AND AvailableDate IN (@FreeDate, @BusyDate, @NoSlotDate)
  AND StartTime = '06:00'
  AND EndTime = '07:00';

-- 3) Investor availability on all 3 dates (same sector/time window).
INSERT INTO dbo.InvestorSectorAvailability (InvestorId, SectorId, AvailableDate, StartTime, EndTime)
VALUES
(@InvestorId, @FinanceId, @FreeDate,   '06:00', '07:00'),
(@InvestorId, @FinanceId, @BusyDate,   '06:00', '07:00'),
(@InvestorId, @FinanceId, @NoSlotDate, '06:00', '07:00');

-- 4) Presenter availability.
-- Main presenter available on free date only (for happy path booking test).
INSERT INTO dbo.PresenterSectorAvailability (PresenterId, SectorId, AvailableDate, StartTime, EndTime)
VALUES
(@PresenterId, @FinanceId, @FreeDate, '06:00', '07:00');

-- Blocker presenter/investor available on busy date to create a real booking.
INSERT INTO dbo.PresenterSectorAvailability (PresenterId, SectorId, AvailableDate, StartTime, EndTime)
VALUES
(@BlockPresenterId, @FinanceId, @BusyDate, '06:00', '07:00');

INSERT INTO dbo.InvestorSectorAvailability (InvestorId, SectorId, AvailableDate, StartTime, EndTime)
VALUES
(@BlockInvestorId, @FinanceId, @BusyDate, '06:00', '07:00');

-- 5) Create room slots.
-- Free date: unbooked slot exists.
INSERT INTO dbo.RoomTimeSlots (RoomId, SlotDate, StartTime, EndTime, IsBooked)
VALUES (@RoomId, @FreeDate, '06:00', '07:00', 0);

-- Busy date: slot exists, then booked by a valid reservation.
INSERT INTO dbo.RoomTimeSlots (RoomId, SlotDate, StartTime, EndTime, IsBooked)
VALUES (@RoomId, @BusyDate, '06:00', '07:00', 0);

DECLARE @BusySlotId INT = (
    SELECT TOP 1 SlotId
    FROM dbo.RoomTimeSlots
    WHERE RoomId = @RoomId
      AND SlotDate = @BusyDate
      AND StartTime = '06:00'
    ORDER BY SlotId DESC
);

DECLARE @Result INT;
EXEC dbo.sp_ConfirmReservation
    @InvestorId = @BlockInvestorId,
    @PresenterId = @BlockPresenterId,
    @SlotId = @BusySlotId,
    @SectorId = @FinanceId,
    @Result = @Result OUTPUT;

-- Safety net if SP did not flip IsBooked due to any unexpected condition.
UPDATE dbo.RoomTimeSlots
SET IsBooked = 1
WHERE SlotId = @BusySlotId;

-- 6) Output summary for quick verification in SQL.
SELECT
    @FreeDate AS FreeDate,
    @BusyDate AS BusyDate,
    @NoSlotDate AS NoSlotDate,
    @InvestorId AS TestInvestorId,
    @PresenterId AS TestPresenterId,
    @Result AS BusyDateBookingResult;

SELECT
    s.SlotDate,
    s.StartTime,
    s.EndTime,
    s.IsBooked,
    r.ReservationId
FROM dbo.RoomTimeSlots s
LEFT JOIN dbo.Reservations r ON r.SlotId = s.SlotId
WHERE s.RoomId = @RoomId
  AND s.SlotDate IN (@FreeDate, @BusyDate, @NoSlotDate)
  AND s.StartTime = '06:00'
ORDER BY s.SlotDate;
GO
