using EMS.API.Models;

namespace EMS.API.Repositories.Interfaces;

public interface IInvestorsRepository
{
    Task<List<Investor>> GetAllWithAvailabilitiesAsync();
    Task<bool> SectorExistsAsync(int sectorId);
    Task AddAsync(Investor investor);
    Task<Investor?> GetByIdWithAvailabilitiesAsync(int id);
    Task<Investor?> FindByIdAsync(int id);
    Task RemoveDependenciesAsync(int investorId);
    void Remove(Investor investor);
    void RemoveAvailabilities(IEnumerable<InvestorSectorAvailability> availabilities);
    Task SaveChangesAsync();
}
