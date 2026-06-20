namespace EMS.API.DTOs;

public class AvailableRoomDto
{
    public int SlotId { get; set; }
    public string SlotDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
}
