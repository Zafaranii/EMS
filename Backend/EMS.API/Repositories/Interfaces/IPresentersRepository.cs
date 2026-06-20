using EMS.API.Models;

namespace EMS.API.Repositories.Interfaces;

public interface IPresentersRepository
{
    Task<List<Presenter>> GetAllWithAvailabilitiesAsync();
    Task<bool> SectorExistsAsync(int sectorId);
    Task AddAsync(Presenter presenter);
    Task<Presenter?> GetByIdWithAvailabilitiesAsync(int id);
    Task<Presenter?> FindByIdAsync(int id);
    Task RemoveDependenciesAsync(int presenterId);
    void Remove(Presenter presenter);
    void RemoveAvailabilities(IEnumerable<PresenterSectorAvailability> availabilities);
    Task SaveChangesAsync();
}
