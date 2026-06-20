using System.Text.Json.Serialization;

namespace EMS.API.DTOs;

public class SectorAvailabilityDto
{
    [JsonPropertyName("sectorId")]
    public int SectorId { get; set; }
    
    [JsonPropertyName("availableDate")]
    public string AvailableDate { get; set; } = string.Empty;
    
    [JsonPropertyName("startTime")]
    public string StartTime { get; set; } = string.Empty;
    
    [JsonPropertyName("endTime")]
    public string EndTime { get; set; } = string.Empty;
}
