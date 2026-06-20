namespace EMS.API.DTOs;

public class PresenterDetailsDto
{
    public int PresenterId { get; set; }
    public string PresenterName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public List<SectorAvailabilityDto> Availabilities { get; set; } = new();
}
