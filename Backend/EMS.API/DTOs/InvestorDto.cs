using System.Text.Json.Serialization;

namespace EMS.API.DTOs;

public class InvestorDto
{
    [JsonPropertyName("investorName")]
    public string InvestorName { get; set; } = string.Empty;
    
    [JsonPropertyName("mobile")]
    public string Mobile { get; set; } = string.Empty;
    
    [JsonPropertyName("availabilities")]
    public List<SectorAvailabilityDto> Availabilities { get; set; } = new();
}
