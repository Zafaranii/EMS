namespace EMS.API.Models;

public class RoomTimeSlot
{
    public int SlotId { get; set; }
    public int RoomId { get; set; }
    public DateOnly SlotDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsBooked { get; set; }

    public ConferenceRoom? ConferenceRoom { get; set; }
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
