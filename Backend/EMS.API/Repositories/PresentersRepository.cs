using EMS.API.Data;
using EMS.API.Models;
using EMS.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMS.API.Repositories;

public class PresentersRepository : IPresentersRepository
{
    private readonly AppDbContext _db;

    public PresentersRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<Presenter>> GetAllWithAvailabilitiesAsync() => _db.Presenters
        .Include(p => p.PresenterSectorAvailabilities)
        .AsNoTracking()
        .ToListAsync();

    public Task<bool> SectorExistsAsync(int sectorId) => _db.Sectors.AnyAsync(s => s.SectorId == sectorId);

    public async Task AddAsync(Presenter presenter)
    {
        _db.Presenters.Add(presenter);
        await _db.SaveChangesAsync();
    }

    public Task<Presenter?> GetByIdWithAvailabilitiesAsync(int id) => _db.Presenters
        .Include(p => p.PresenterSectorAvailabilities)
        .FirstOrDefaultAsync(p => p.PresenterId == id);

    public Task<Presenter?> FindByIdAsync(int id) => _db.Presenters.FindAsync(id).AsTask();

    public async Task RemoveDependenciesAsync(int presenterId)
    {
        await _db.Reservations
            .Where(r => r.PresenterId == presenterId)
            .ExecuteDeleteAsync();

        await _db.PresenterSectorAvailability
            .Where(a => a.PresenterId == presenterId)
            .ExecuteDeleteAsync();
    }

    public void Remove(Presenter presenter) => _db.Presenters.Remove(presenter);

    public void RemoveAvailabilities(IEnumerable<PresenterSectorAvailability> availabilities) => _db.PresenterSectorAvailability.RemoveRange(availabilities);

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
