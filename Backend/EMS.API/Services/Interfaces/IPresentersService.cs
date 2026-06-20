using EMS.API.DTOs;
using EMS.API.Services.Common;

namespace EMS.API.Services.Interfaces;

public interface IPresentersService
{
    Task<List<PresenterDetailsDto>> GetAllAsync();
    Task<ServiceResult<PresenterDetailsDto>> CreateAsync(PresenterDto dto);
    Task<ServiceResult<PresenterDetailsDto>> UpdateAsync(int id, PresenterDto dto);
    Task<ServiceResult<bool>> DeleteAsync(int id);
}
