namespace EMS.API.Models;

public class InvestorSectorAvailability
{
    public int Id { get; set; }
    public int InvestorId { get; set; }
    public int SectorId { get; set; }
    public DateOnly AvailableDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public Investor? Investor { get; set; }
    public Sector? Sector { get; set; }
}
