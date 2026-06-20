using EMS.API.DTOs;

namespace EMS.API.Repositories.Interfaces;

public interface ISectorsRepository
{
    Task<List<SectorDto>> GetAllAsync();
}
