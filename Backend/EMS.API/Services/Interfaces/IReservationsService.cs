using EMS.API.DTOs;
using EMS.API.Services.Common;

namespace EMS.API.Services.Interfaces;

public interface IReservationsService
{
    Task<ServiceResult<List<MatchingPresenterDto>>> GetMatchingPresentersAsync(int sectorId, string startTime, string endTime, string? slotDate);
    Task<ServiceResult<List<AvailableRoomDto>>> GetAvailableRoomsAsync(string startTime, string? slotDate);
    Task<ServiceResult<string>> ConfirmAsync(ConfirmReservationDto dto);
    Task<List<ReservationReportDto>> GetAllAsync();
    Task<ServiceResult<List<InvestorBookedTimeDto>>> GetInvestorBookedTimesAsync(int investorId, string? slotDate);
}
