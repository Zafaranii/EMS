namespace EMS.API.Models;

public class Investor
{
    public int InvestorId { get; set; }
    public string InvestorName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;

    public ICollection<InvestorSectorAvailability> InvestorSectorAvailabilities { get; set; } = new List<InvestorSectorAvailability>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
