using EMS.API.Data;
using EMS.API.Models;
using EMS.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMS.API.Repositories;

public class InvestorsRepository : IInvestorsRepository
{
    private readonly AppDbContext _db;

    public InvestorsRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<Investor>> GetAllWithAvailabilitiesAsync() => _db.Investors
        .Include(i => i.InvestorSectorAvailabilities)
        .AsNoTracking()
        .ToListAsync();

    public Task<bool> SectorExistsAsync(int sectorId) => _db.Sectors.AnyAsync(s => s.SectorId == sectorId);

    public async Task AddAsync(Investor investor)
    {
        _db.Investors.Add(investor);
        await _db.SaveChangesAsync();
    }

    public Task<Investor?> GetByIdWithAvailabilitiesAsync(int id) => _db.Investors
        .Include(i => i.InvestorSectorAvailabilities)
        .FirstOrDefaultAsync(i => i.InvestorId == id);

    public Task<Investor?> FindByIdAsync(int id) => _db.Investors.FindAsync(id).AsTask();

    public async Task RemoveDependenciesAsync(int investorId)
    {
        await _db.Reservations
            .Where(r => r.InvestorId == investorId)
            .ExecuteDeleteAsync();

        await _db.InvestorSectorAvailability
            .Where(a => a.InvestorId == investorId)
            .ExecuteDeleteAsync();
    }

    public void Remove(Investor investor) => _db.Investors.Remove(investor);

    public void RemoveAvailabilities(IEnumerable<InvestorSectorAvailability> availabilities) => _db.InvestorSectorAvailability.RemoveRange(availabilities);

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
