-- Migration: Add AvailableDate column to InvestorSectorAvailability and PresenterSectorAvailability
-- Date: 2026-06-20
-- Purpose: Track which date each availability is for (not just time of day)

USE EMS_DB;
GO

-- Add AvailableDate column to InvestorSectorAvailability
ALTER TABLE dbo.InvestorSectorAvailability
ADD AvailableDate DATE NOT NULL DEFAULT (CAST(GETDATE() AS DATE));

-- Add AvailableDate column to PresenterSectorAvailability
ALTER TABLE dbo.PresenterSectorAvailability
ADD AvailableDate DATE NOT NULL DEFAULT (CAST(GETDATE() AS DATE));

-- Update unique constraint to include the date (ensures no duplicate time slots on same date)
ALTER TABLE dbo.InvestorSectorAvailability
DROP CONSTRAINT UQ_InvestorSectorAvailability;

ALTER TABLE dbo.InvestorSectorAvailability
ADD CONSTRAINT UQ_InvestorSectorAvailability
UNIQUE (InvestorId, SectorId, AvailableDate, StartTime, EndTime);

-- Update unique constraint for Presenter
ALTER TABLE dbo.PresenterSectorAvailability
DROP CONSTRAINT UQ_PresenterSectorAvailability;

ALTER TABLE dbo.PresenterSectorAvailability
ADD CONSTRAINT UQ_PresenterSectorAvailability
UNIQUE (PresenterId, SectorId, AvailableDate, StartTime, EndTime);

-- Create indexes for date-based queries
CREATE INDEX IX_InvestorAvailability_DateRange
    ON dbo.InvestorSectorAvailability(AvailableDate, InvestorId, StartTime, EndTime);

CREATE INDEX IX_PresenterAvailability_DateRange
    ON dbo.PresenterSectorAvailability(AvailableDate, PresenterId, StartTime, EndTime);

GO
