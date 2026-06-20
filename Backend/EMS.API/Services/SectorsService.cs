using EMS.API.DTOs;
using EMS.API.Repositories.Interfaces;
using EMS.API.Services.Interfaces;

namespace EMS.API.Services;

public class SectorsService : ISectorsService
{
    private readonly ISectorsRepository _repository;

    public SectorsService(ISectorsRepository repository)
    {
        _repository = repository;
    }

    public Task<List<SectorDto>> GetAllAsync() => _repository.GetAllAsync();
}
