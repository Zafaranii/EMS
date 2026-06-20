using EMS.API.Data;
using EMS.API.Models;
using EMS.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMS.API.Repositories;

public class HotelsRepository : IHotelsRepository
{
    private readonly AppDbContext _db;

    public HotelsRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<Hotel>> GetAllWithDetailsAsync() => _db.Hotels
        .Include(h => h.ConferenceRooms)
        .ThenInclude(r => r.RoomTimeSlots)
        .AsNoTracking()
        .ToListAsync();

    public Task<Hotel?> GetByIdWithDetailsAsync(int id) => _db.Hotels
        .Include(h => h.ConferenceRooms)
        .ThenInclude(r => r.RoomTimeSlots)
        .AsNoTracking()
        .FirstOrDefaultAsync(h => h.HotelId == id);

    public Task<Hotel?> FindHotelAsync(int id) => _db.Hotels.FirstOrDefaultAsync(h => h.HotelId == id);

    public Task<ConferenceRoom?> FindRoomAsync(int roomId) => _db.ConferenceRooms.FirstOrDefaultAsync(r => r.RoomId == roomId);

    public Task<RoomTimeSlot?> FindSlotAsync(int slotId) => _db.RoomTimeSlots.FirstOrDefaultAsync(s => s.SlotId == slotId);

    public async Task AddHotelAsync(Hotel hotel)
    {
        _db.Hotels.Add(hotel);
        await _db.SaveChangesAsync();
    }

    public Task<bool> HotelExistsAsync(int id) => _db.Hotels.AnyAsync(h => h.HotelId == id);

    public Task<bool> RoomExistsAsync(int roomId) => _db.ConferenceRooms.AnyAsync(r => r.RoomId == roomId);

    public async Task AddRoomAsync(ConferenceRoom room)
    {
        _db.ConferenceRooms.Add(room);
        await _db.SaveChangesAsync();
    }

    public async Task AddSlotAsync(RoomTimeSlot slot)
    {
        _db.RoomTimeSlots.Add(slot);
        await _db.SaveChangesAsync();
    }

    public async Task RemoveHotelDependenciesAsync(int hotelId)
    {
        var roomIds = _db.ConferenceRooms
            .Where(r => r.HotelId == hotelId)
            .Select(r => r.RoomId);

        var slotIds = _db.RoomTimeSlots
            .Where(s => roomIds.Contains(s.RoomId))
            .Select(s => s.SlotId);

        await _db.Reservations
            .Where(r => slotIds.Contains(r.SlotId))
            .ExecuteDeleteAsync();

        await _db.RoomTimeSlots
            .Where(s => roomIds.Contains(s.RoomId))
            .ExecuteDeleteAsync();

        await _db.ConferenceRooms
            .Where(r => r.HotelId == hotelId)
            .ExecuteDeleteAsync();
    }

    public async Task RemoveRoomDependenciesAsync(int roomId)
    {
        var slotIds = _db.RoomTimeSlots
            .Where(s => s.RoomId == roomId)
            .Select(s => s.SlotId);

        await _db.Reservations
            .Where(r => slotIds.Contains(r.SlotId))
            .ExecuteDeleteAsync();

        await _db.RoomTimeSlots
            .Where(s => s.RoomId == roomId)
            .ExecuteDeleteAsync();
    }

    public Task RemoveSlotDependenciesAsync(int slotId) => _db.Reservations
        .Where(r => r.SlotId == slotId)
        .ExecuteDeleteAsync();

    public void RemoveHotel(Hotel hotel) => _db.Hotels.Remove(hotel);

    public void RemoveRoom(ConferenceRoom room) => _db.ConferenceRooms.Remove(room);

    public void RemoveSlot(RoomTimeSlot slot) => _db.RoomTimeSlots.Remove(slot);

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
