using EMS.API.DTOs;
using EMS.API.Models;
using EMS.API.Repositories.Interfaces;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using System.Globalization;

namespace EMS.API.Services;

public class HotelsService : IHotelsService
{
    private readonly IHotelsRepository _repository;

    public HotelsService(IHotelsRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<HotelDetailsDto>> GetAllAsync()
    {
        var hotels = await _repository.GetAllWithDetailsAsync();
        return hotels.Select(MapHotel).ToList();
    }

    public async Task<ServiceResult<HotelDetailsDto>> GetByIdAsync(int id)
    {
        var hotel = await _repository.GetByIdWithDetailsAsync(id);
        if (hotel is null)
        {
            return ServiceResult<HotelDetailsDto>.NotFound("Hotel not found");
        }

        return ServiceResult<HotelDetailsDto>.Success(MapHotel(hotel));
    }

    public async Task<ServiceResult<Hotel>> CreateAsync(HotelDto dto)
    {
        var hotel = new Hotel
        {
            HotelName = dto.Name,
            Address = dto.Address,
        };

        await _repository.AddHotelAsync(hotel);
        return ServiceResult<Hotel>.Success(hotel);
    }

    public async Task<ServiceResult<ConferenceRoom>> AddRoomAsync(int hotelId, ConferenceRoomDto dto)
    {
        var exists = await _repository.HotelExistsAsync(hotelId);
        if (!exists)
        {
            return ServiceResult<ConferenceRoom>.NotFound("Hotel not found");
        }

        var room = new ConferenceRoom
        {
            HotelId = hotelId,
            RoomName = dto.RoomName,
        };

        await _repository.AddRoomAsync(room);
        return ServiceResult<ConferenceRoom>.Success(room);
    }

    public async Task<ServiceResult<RoomTimeSlot>> AddTimeSlotAsync(int roomId, TimeSlotDto dto)
    {
        var roomExists = await _repository.RoomExistsAsync(roomId);
        if (!roomExists)
        {
            return ServiceResult<RoomTimeSlot>.NotFound("Conference room not found");
        }

        if (!TryParseTime(dto.StartTime, out var start) || !TryParseTime(dto.EndTime, out var end))
        {
            return ServiceResult<RoomTimeSlot>.BadRequest("Time format must be HH:mm");
        }

        if (!TryParseDate(dto.SlotDate, out var slotDate))
        {
            return ServiceResult<RoomTimeSlot>.BadRequest("Date format must be yyyy-MM-dd");
        }

        var slot = new RoomTimeSlot
        {
            RoomId = roomId,
            SlotDate = slotDate,
            StartTime = start,
            EndTime = end,
            IsBooked = false,
        };

        await _repository.AddSlotAsync(slot);
        return ServiceResult<RoomTimeSlot>.Success(slot);
    }

    public async Task<ServiceResult<bool>> DeleteHotelAsync(int hotelId)
    {
        var hotel = await _repository.FindHotelAsync(hotelId);
        if (hotel is null)
        {
            return ServiceResult<bool>.NotFound("Hotel not found");
        }

        await _repository.RemoveHotelDependenciesAsync(hotelId);
        _repository.RemoveHotel(hotel);
        await _repository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<bool>> DeleteRoomAsync(int roomId)
    {
        var room = await _repository.FindRoomAsync(roomId);
        if (room is null)
        {
            return ServiceResult<bool>.NotFound("Conference room not found");
        }

        await _repository.RemoveRoomDependenciesAsync(roomId);
        _repository.RemoveRoom(room);
        await _repository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<bool>> DeleteSlotAsync(int slotId)
    {
        var slot = await _repository.FindSlotAsync(slotId);
        if (slot is null)
        {
            return ServiceResult<bool>.NotFound("Time slot not found");
        }

        await _repository.RemoveSlotDependenciesAsync(slotId);
        _repository.RemoveSlot(slot);
        await _repository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private static HotelDetailsDto MapHotel(Hotel h) => new()
    {
        HotelId = h.HotelId,
        HotelName = h.HotelName,
        Address = h.Address,
        Rooms = h.ConferenceRooms.Select(r => new ConferenceRoomDetailsDto
        {
            RoomId = r.RoomId,
            RoomName = r.RoomName,
            Slots = r.RoomTimeSlots.Select(s => new RoomTimeSlotDetailsDto
            {
                SlotId = s.SlotId,
                SlotDate = s.SlotDate.ToString("yyyy-MM-dd"),
                StartTime = s.StartTime.ToString("HH:mm"),
                EndTime = s.EndTime.ToString("HH:mm"),
                IsBooked = s.IsBooked,
            }).ToList(),
        }).ToList(),
    };

    private static bool TryParseTime(string input, out TimeOnly time)
    {
        return TimeOnly.TryParseExact(input, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
    }

    private static bool TryParseDate(string? input, out DateOnly date)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            date = DateOnly.FromDateTime(DateTime.Today);
            return true;
        }

        return DateOnly.TryParseExact(input, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }
}
