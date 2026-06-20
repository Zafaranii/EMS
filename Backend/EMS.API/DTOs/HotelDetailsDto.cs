namespace EMS.API.DTOs;

public class HotelDetailsDto
{
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public List<ConferenceRoomDetailsDto> Rooms { get; set; } = new();
}
