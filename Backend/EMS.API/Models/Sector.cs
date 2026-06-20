namespace EMS.API.Models;

public class Sector
{
    public int SectorId { get; set; }
    public string SectorName { get; set; } = string.Empty;

    public ICollection<InvestorSectorAvailability> InvestorSectorAvailabilities { get; set; } = new List<InvestorSectorAvailability>();
    public ICollection<PresenterSectorAvailability> PresenterSectorAvailabilities { get; set; } = new List<PresenterSectorAvailability>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
