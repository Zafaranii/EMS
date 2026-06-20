namespace EMS.API.Models;

public class Presenter
{
    public int PresenterId { get; set; }
    public string PresenterName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;

    public ICollection<PresenterSectorAvailability> PresenterSectorAvailabilities { get; set; } = new List<PresenterSectorAvailability>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
