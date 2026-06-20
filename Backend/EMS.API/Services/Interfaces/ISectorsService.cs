using EMS.API.DTOs;

namespace EMS.API.Services.Interfaces;

public interface ISectorsService
{
    Task<List<SectorDto>> GetAllAsync();
}
