namespace EMS.API.DTOs;

public class TimeSlotDto
{
    public string? SlotDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}
