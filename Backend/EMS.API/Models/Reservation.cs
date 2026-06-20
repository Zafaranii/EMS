namespace EMS.API.Models;

public class Reservation
{
    public int ReservationId { get; set; }
    public int InvestorId { get; set; }
    public int PresenterId { get; set; }
    public int SlotId { get; set; }
    public int SectorId { get; set; }
    public DateTime BookedAt { get; set; }

    public Investor? Investor { get; set; }
    public Presenter? Presenter { get; set; }
    public RoomTimeSlot? Slot { get; set; }
    public Sector? Sector { get; set; }
}
