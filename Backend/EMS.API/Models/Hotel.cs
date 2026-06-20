namespace EMS.API.Models;

public class Hotel
{
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public ICollection<ConferenceRoom> ConferenceRooms { get; set; } = new List<ConferenceRoom>();
}
