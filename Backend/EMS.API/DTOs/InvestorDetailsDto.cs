namespace EMS.API.DTOs;

public class InvestorDetailsDto
{
    public int InvestorId { get; set; }
    public string InvestorName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public List<SectorAvailabilityDto> Availabilities { get; set; } = new();
}
