using EMS.API.Models;

namespace EMS.API.Repositories.Interfaces;

public interface IHotelsRepository
{
    Task<List<Hotel>> GetAllWithDetailsAsync();
    Task<Hotel?> GetByIdWithDetailsAsync(int id);
    Task<Hotel?> FindHotelAsync(int id);
    Task<ConferenceRoom?> FindRoomAsync(int roomId);
    Task<RoomTimeSlot?> FindSlotAsync(int slotId);
    Task AddHotelAsync(Hotel hotel);
    Task<bool> HotelExistsAsync(int id);
    Task<bool> RoomExistsAsync(int roomId);
    Task AddRoomAsync(ConferenceRoom room);
    Task AddSlotAsync(RoomTimeSlot slot);
    Task RemoveHotelDependenciesAsync(int hotelId);
    Task RemoveRoomDependenciesAsync(int roomId);
    Task RemoveSlotDependenciesAsync(int slotId);
    void RemoveHotel(Hotel hotel);
    void RemoveRoom(ConferenceRoom room);
    void RemoveSlot(RoomTimeSlot slot);
    Task SaveChangesAsync();
}
