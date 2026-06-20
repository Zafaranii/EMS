namespace EMS.API.Models;

public class ConferenceRoom
{
    public int RoomId { get; set; }
    public int HotelId { get; set; }
    public string RoomName { get; set; } = string.Empty;

    public Hotel? Hotel { get; set; }
    public ICollection<RoomTimeSlot> RoomTimeSlots { get; set; } = new List<RoomTimeSlot>();
}
