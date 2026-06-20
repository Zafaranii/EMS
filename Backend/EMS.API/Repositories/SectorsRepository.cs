using EMS.API.Data;
using EMS.API.DTOs;
using EMS.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMS.API.Repositories;

public class SectorsRepository : ISectorsRepository
{
    private readonly AppDbContext _db;

    public SectorsRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<SectorDto>> GetAllAsync() => _db.Sectors
        .AsNoTracking()
        .Select(s => new SectorDto
        {
            SectorId = s.SectorId,
            SectorName = s.SectorName,
        })
        .ToListAsync();
}
