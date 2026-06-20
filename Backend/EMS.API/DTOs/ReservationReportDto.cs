namespace EMS.API.DTOs;

public class ReservationReportDto
{
    public string InvestorName { get; set; } = string.Empty;
    public string PresenterName { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string SectorName { get; set; } = string.Empty;
    public string SlotDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public DateTime BookedAt { get; set; }
}
