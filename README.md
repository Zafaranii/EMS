# EMS — Event Management System

> A full-stack web application that manages conference room bookings between **investors** and **presenters**, matching them by shared sector interests, time availability, and hotel room availability.

---

## Table of Contents

- [What is EMS?](#what-is-ems)
- [How a Reservation Works](#how-a-reservation-works)
- [Pages & Features](#pages--features)
  - [Home](#home)
  - [Hotels](#hotels)
  - [Investors](#investors)
  - [Presenters](#presenters)
  - [Reservation Wizard](#reservation-wizard)
  - [Report](#report)
- [Business Rules](#business-rules)
- [Data Import — SSIS Package](#data-import--ssis-package)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)

---

## What is EMS?

EMS is a conference booking platform designed for events where **presenters** (representing companies) meet with **investors** to pitch their business. Every meeting takes place inside a **conference room** at a **hotel**, lasts exactly **one hour**, and can only be booked when all three parties — investor, presenter, and room — are free at the same time and share the same sector of interest.

---

## How a Reservation Works

The reservation flow follows a strict matching process to ensure every booking is valid:

```
1. Select Investor
      ↓
2. Choose Sector → Pick Date → Pick Available Time Slot
      ↓  (only dates/times where investor has availability + free rooms are shown)
3. Pick a Presenter
      ↓  (only presenters who share the sector and are free at that time appear)
4. Pick a Room & Confirm
      ↓  (only unbooked rooms at that hotel/date/time are shown)
5. Booking Confirmed ✓
```

Once confirmed, the system **marks the investor, presenter, and room as occupied** for that time so no double-booking can occur.

---

## Pages & Features

### Home

The landing page with quick links to:
- Start a new reservation
- Access the admin panel (Hotels, Investors, Presenters)

---

### Hotels

Manage all hotel and conference room information.

**What you can do:**
- Add a new hotel (name + address)
- Add conference rooms to each hotel
- Add time slots to each conference room (e.g., 1PM–4PM creates individual 1-hour slots: 1–2PM, 2–3PM, 3–4PM automatically)
- Delete hotels, rooms, or individual time slots — deletions are permanent and cascade properly

**Key behaviours:**
- Time slots are stored as individual 1-hour blocks in the database
- Deleting a room removes all its slots and any reservations tied to those slots
- Deleting a hotel removes all its rooms, slots, and related reservations

---

### Investors

Manage investor profiles and their sector availability windows.

**What you can do:**
- Add investors with name and mobile number
- Define which sectors an investor is interested in, and the date + start time for each session
  - End time is automatically set to 1 hour after the selected start time
- Filter and search investors by name, mobile, or sector
- Delete investors (also removes their reservations automatically)

**Example:**
> Investor "CIB" is available in the **Finance** sector on June 21 starting at **1PM** (system sets end to 2PM).

---

### Presenters

Manage presenter profiles in exactly the same way as investors.

**What you can do:**
- Add presenters with name and mobile
- Define sector availability with date and start time (end time is auto +1 hour)
- Filter and search by name, mobile, or sector
- Delete presenters (also removes their reservations automatically)

**Example:**
> Presenter "Oltob" is available in **Restaurants** on June 21 starting at **1PM**.

---

### Reservation Wizard

The core feature of EMS — a 4-step booking flow that intelligently matches investor + presenter + room.

#### Step 1 — Select Investor
Browse the full investor list. Use the search bar to filter by name or sector. Click to select.

#### Step 2 — Choose Sector, Date & Time
- **Sector toggles** appear based on what the selected investor is interested in
- The **date picker** highlights available days in green (investor has availability + free rooms exist) and unavailable days in red
- **Time slots** appear after picking a date — only hours that overlap with the investor's availability window AND have at least one free room are shown

#### Step 3 — Pick a Presenter
Only presenters who:
- Share the same sector
- Are available on the same date and time
- Have not already been booked at that slot

…appear in this list.

#### Step 4 — Confirm Room
Only hotel rooms that:
- Have a free time slot on the selected date and hour
- Have not been booked by anyone else

…are shown. Select a room and confirm to lock the booking.

**After confirmation:** A success screen shows the full booking summary (investor, presenter, sector, hotel, room, date, and time).

---

### Report

A read-only view of all confirmed reservations, showing:
- Investor name
- Presenter name
- Sector
- Hotel and conference room
- Date and time of the meeting
- Booking timestamp

> The report is also available as an **SSRS report** connected directly to the SQL Server database for printable/exportable output.

---

## Business Rules

| Rule | Details |
|------|---------|
| Meeting duration | Always exactly **1 hour** |
| Matching condition | Investor and presenter must share the **same sector** and be free at the **same date and time** |
| No double-booking | An investor, presenter, or room can only have one booking per time slot |
| Cascade delete | Deleting an investor, presenter, hotel, room, or slot removes all related reservations |
| Time slot creation | Entering a range (e.g., 1PM–4PM) auto-creates individual 1-hour slots |
| Availability entry | Only a start time is needed; end time is auto-calculated as +1 hour |

---

## Data Import — SSIS Package

Hotels can be imported in bulk using the included **SSIS (SQL Server Integration Services) package**.

**How it works:**
- The package reads multiple CSV files from a configured folder at once
- Each CSV file contains one hotel record per line
- All hotels are inserted into the database automatically
- Useful for seeding large numbers of hotels without using the UI

**CSV format:**
```
HotelName,Address
Hilton Cairo,123 Nile Street
Four Seasons,456 Downtown Blvd
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17+ (Standalone Components, Signals) |
| Styling | SCSS with Angular Material |
| Backend | ASP.NET Core (.NET 10) — REST API |
| Database | SQL Server (EMS_DB) |
| ORM | Entity Framework Core |
| Matching Logic | SQL Stored Procedures |
| Reporting | SSRS (SQL Server Reporting Services) |
| Data Import | SSIS (SQL Server Integration Services) |

---

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- SQL Server (local or remote)
- Angular CLI (`npm install -g @angular/cli`)

### 1 — Database Setup

Run the SQL scripts in order from `DataOps/Database/`:

```sql
-- 1. Create tables
01_CreateTables.sql

-- 2. Create stored procedures
02_StoredProcedures.sql

-- 3. Seed base data (6 sectors)
03_SeedData.sql
```

### 2 — Backend

```bash
cd Backend/EMS.API
dotnet run
# API runs at: http://localhost:5000
```

Update the connection string in `appsettings.Development.json` to point to your SQL Server instance.

### 3 — Frontend

```bash
cd frontend/redesign
npm install
npm start
# App runs at: http://localhost:4200
```

---

## Demo

> 📹 Videos demonstrating the full reservation flow and admin panel are included with this submission.
  > https://youtu.be/p5DRJxGDoeA
  > https://youtu.be/VBbfGV_c9MA
