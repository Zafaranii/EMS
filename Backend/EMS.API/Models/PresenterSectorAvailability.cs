namespace EMS.API.Models;

public class PresenterSectorAvailability
{
    public int Id { get; set; }
    public int PresenterId { get; set; }
    public int SectorId { get; set; }
    public DateOnly AvailableDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public Presenter? Presenter { get; set; }
    public Sector? Sector { get; set; }
}
