using EMS.API.Data;
using EMS.API.DTOs;
using EMS.API.Repositories.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace EMS.API.Repositories;

public class ReservationsRepository : IReservationsRepository
{
    private readonly AppDbContext _db;
    private readonly string _connectionString;

    public ReservationsRepository(AppDbContext db)
    {
        _db = db;
        _connectionString = _db.Database.GetConnectionString()
            ?? throw new InvalidOperationException("Database connection string is not configured.");
    }

    public async Task<List<MatchingPresenterDto>> GetMatchingPresentersAsync(int sectorId, DateOnly slotDate, TimeOnly startTime, TimeOnly endTime)
    {
        var rows = new List<MatchingPresenterDto>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand("dbo.sp_GetMatchingPresenters", conn)
        {
            CommandType = CommandType.StoredProcedure,
        };

        cmd.Parameters.AddWithValue("@SectorId", sectorId);
        cmd.Parameters.Add(new SqlParameter("@SlotDate", SqlDbType.Date)
        {
            Value = slotDate.ToDateTime(TimeOnly.MinValue),
        });
        cmd.Parameters.AddWithValue("@StartTime", startTime.ToTimeSpan());
        cmd.Parameters.AddWithValue("@EndTime", endTime.ToTimeSpan());

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            rows.Add(new MatchingPresenterDto
            {
                PresenterId = reader.GetInt32(reader.GetOrdinal("PresenterId")),
                PresenterName = reader.GetString(reader.GetOrdinal("PresenterName")),
                Mobile = reader.GetString(reader.GetOrdinal("Mobile")),
            });
        }

        return rows;
    }

    public async Task<List<AvailableRoomDto>> GetAvailableRoomsAsync(DateOnly slotDate, TimeOnly startTime)
    {
        var rows = new List<AvailableRoomDto>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand("dbo.sp_GetAvailableRooms", conn)
        {
            CommandType = CommandType.StoredProcedure,
        };

        cmd.Parameters.Add(new SqlParameter("@SlotDate", SqlDbType.Date)
        {
            Value = slotDate.ToDateTime(TimeOnly.MinValue),
        });
        cmd.Parameters.AddWithValue("@StartTime", startTime.ToTimeSpan());

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var startDb = (TimeSpan)reader["StartTime"];
            var endDb = (TimeSpan)reader["EndTime"];

            rows.Add(new AvailableRoomDto
            {
                SlotId = reader.GetInt32(reader.GetOrdinal("SlotId")),
                SlotDate = DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("SlotDate"))).ToString("yyyy-MM-dd"),
                StartTime = startDb.ToString(@"hh\:mm"),
                EndTime = endDb.ToString(@"hh\:mm"),
                RoomName = reader.GetString(reader.GetOrdinal("RoomName")),
                HotelId = reader.GetInt32(reader.GetOrdinal("HotelId")),
                HotelName = reader.GetString(reader.GetOrdinal("HotelName")),
            });
        }

        return rows;
    }

    public async Task<int> ConfirmReservationAsync(ConfirmReservationDto dto)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand("dbo.sp_ConfirmReservation", conn)
        {
            CommandType = CommandType.StoredProcedure,
        };

        cmd.Parameters.AddWithValue("@InvestorId", dto.InvestorId);
        cmd.Parameters.AddWithValue("@PresenterId", dto.PresenterId);
        cmd.Parameters.AddWithValue("@SlotId", dto.SlotId);
        cmd.Parameters.AddWithValue("@SectorId", dto.SectorId);

        var resultParam = new SqlParameter("@Result", SqlDbType.Int)
        {
            Direction = ParameterDirection.Output,
        };
        cmd.Parameters.Add(resultParam);

        await cmd.ExecuteNonQueryAsync();
        return (resultParam.Value is int val) ? val : 0;
    }

    public async Task<List<ReservationReportDto>> GetReservationReportAsync()
    {
        return await (
            from r in _db.Reservations.AsNoTracking()
            join i in _db.Investors.AsNoTracking() on r.InvestorId equals i.InvestorId
            join p in _db.Presenters.AsNoTracking() on r.PresenterId equals p.PresenterId
            join s in _db.Sectors.AsNoTracking() on r.SectorId equals s.SectorId
            join slot in _db.RoomTimeSlots.AsNoTracking() on r.SlotId equals slot.SlotId
            join room in _db.ConferenceRooms.AsNoTracking() on slot.RoomId equals room.RoomId
            join h in _db.Hotels.AsNoTracking() on room.HotelId equals h.HotelId
            orderby r.BookedAt descending
            select new ReservationReportDto
            {
                InvestorName = i.InvestorName,
                PresenterName = p.PresenterName,
                HotelName = h.HotelName,
                RoomName = room.RoomName,
                SectorName = s.SectorName,
                SlotDate = slot.SlotDate.ToString("yyyy-MM-dd"),
                StartTime = slot.StartTime.ToString("HH:mm"),
                EndTime = slot.EndTime.ToString("HH:mm"),
                BookedAt = r.BookedAt,
            }
        ).ToListAsync();
    }

    public async Task<List<InvestorBookedTimeDto>> GetInvestorBookedTimesAsync(int investorId, DateOnly slotDate)
    {
        return await (
            from r in _db.Reservations.AsNoTracking()
            join slot in _db.RoomTimeSlots.AsNoTracking() on r.SlotId equals slot.SlotId
            where r.InvestorId == investorId && slot.SlotDate == slotDate
            orderby slot.StartTime
            select new InvestorBookedTimeDto
            {
                StartTime = slot.StartTime.ToString("HH:mm"),
                EndTime = slot.EndTime.ToString("HH:mm"),
            }
        ).ToListAsync();
    }
}
