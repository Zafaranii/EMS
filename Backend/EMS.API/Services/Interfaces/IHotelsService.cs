using EMS.API.DTOs;
using EMS.API.Models;
using EMS.API.Services.Common;

namespace EMS.API.Services.Interfaces;

public interface IHotelsService
{
    Task<List<HotelDetailsDto>> GetAllAsync();
    Task<ServiceResult<HotelDetailsDto>> GetByIdAsync(int id);
    Task<ServiceResult<Hotel>> CreateAsync(HotelDto dto);
    Task<ServiceResult<ConferenceRoom>> AddRoomAsync(int hotelId, ConferenceRoomDto dto);
    Task<ServiceResult<RoomTimeSlot>> AddTimeSlotAsync(int roomId, TimeSlotDto dto);
    Task<ServiceResult<bool>> DeleteHotelAsync(int hotelId);
    Task<ServiceResult<bool>> DeleteRoomAsync(int roomId);
    Task<ServiceResult<bool>> DeleteSlotAsync(int slotId);
}
