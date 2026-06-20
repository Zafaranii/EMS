using System.Text.Json.Serialization;

namespace EMS.API.DTOs;

public class PresenterDto
{
    [JsonPropertyName("presenterName")]
    public string PresenterName { get; set; } = string.Empty;
    
    [JsonPropertyName("mobile")]
    public string Mobile { get; set; } = string.Empty;
    
    [JsonPropertyName("availabilities")]
    public List<SectorAvailabilityDto> Availabilities { get; set; } = new();
}
