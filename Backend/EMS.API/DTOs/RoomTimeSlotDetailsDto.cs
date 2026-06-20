namespace EMS.API.DTOs;

public class RoomTimeSlotDetailsDto
{
    public int SlotId { get; set; }
    public string SlotDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsBooked { get; set; }
}
