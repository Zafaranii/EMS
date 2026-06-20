using EMS.API.DTOs;
using EMS.API.Services.Common;

namespace EMS.API.Services.Interfaces;

public interface IInvestorsService
{
    Task<List<InvestorDetailsDto>> GetAllAsync();
    Task<ServiceResult<InvestorDetailsDto>> CreateAsync(InvestorDto dto);
    Task<ServiceResult<InvestorDetailsDto>> UpdateAsync(int id, InvestorDto dto);
    Task<ServiceResult<bool>> DeleteAsync(int id);
}
