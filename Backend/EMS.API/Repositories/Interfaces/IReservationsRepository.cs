using EMS.API.DTOs;

namespace EMS.API.Repositories.Interfaces;

public interface IReservationsRepository
{
    Task<List<MatchingPresenterDto>> GetMatchingPresentersAsync(int sectorId, DateOnly slotDate, TimeOnly startTime, TimeOnly endTime);
    Task<List<AvailableRoomDto>> GetAvailableRoomsAsync(DateOnly slotDate, TimeOnly startTime);
    Task<int> ConfirmReservationAsync(ConfirmReservationDto dto);
    Task<List<ReservationReportDto>> GetReservationReportAsync();
    Task<List<InvestorBookedTimeDto>> GetInvestorBookedTimesAsync(int investorId, DateOnly slotDate);
}
