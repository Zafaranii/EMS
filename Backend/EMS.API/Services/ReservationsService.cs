using EMS.API.DTOs;
using EMS.API.Repositories.Interfaces;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using System.Globalization;

namespace EMS.API.Services;

public class ReservationsService : IReservationsService
{
    private readonly IReservationsRepository _repository;

    public ReservationsService(IReservationsRepository repository)
    {
        _repository = repository;
    }

    public async Task<ServiceResult<List<MatchingPresenterDto>>> GetMatchingPresentersAsync(int sectorId, string startTime, string endTime, string? slotDate)
    {
        if (!TryParseTime(startTime, out var start) || !TryParseTime(endTime, out var end))
        {
            return ServiceResult<List<MatchingPresenterDto>>.BadRequest("Time format must be HH:mm");
        }

        if (!TryParseDate(slotDate, out var date))
        {
            return ServiceResult<List<MatchingPresenterDto>>.BadRequest("Date format must be yyyy-MM-dd");
        }

        var rows = await _repository.GetMatchingPresentersAsync(sectorId, date, start, end);
        return ServiceResult<List<MatchingPresenterDto>>.Success(rows);
    }

    public async Task<ServiceResult<List<AvailableRoomDto>>> GetAvailableRoomsAsync(string startTime, string? slotDate)
    {
        if (!TryParseTime(startTime, out var start))
        {
            return ServiceResult<List<AvailableRoomDto>>.BadRequest("Time format must be HH:mm");
        }

        if (!TryParseDate(slotDate, out var date))
        {
            return ServiceResult<List<AvailableRoomDto>>.BadRequest("Date format must be yyyy-MM-dd");
        }

        var rows = await _repository.GetAvailableRoomsAsync(date, start);
        return ServiceResult<List<AvailableRoomDto>>.Success(rows);
    }

    public async Task<ServiceResult<string>> ConfirmAsync(ConfirmReservationDto dto)
    {
        var result = await _repository.ConfirmReservationAsync(dto);

        if (result == 1)
        {
            return ServiceResult<string>.Success("Reservation confirmed");
        }

        if (result == 2)
        {
            return ServiceResult<string>.Conflict("Presenter is already reserved for this time slot");
        }

        if (result == 3)
        {
            return ServiceResult<string>.Conflict("Investor is already reserved for this time slot");
        }

        if (result == 4)
        {
            return ServiceResult<string>.Conflict("Presenter is not available for the selected sector/time/date");
        }

        if (result == 5)
        {
            return ServiceResult<string>.Conflict("Investor is not available for the selected sector/time/date");
        }

        return ServiceResult<string>.Conflict("Slot no longer available");
    }

    public async Task<List<ReservationReportDto>> GetAllAsync()
    {
        return await _repository.GetReservationReportAsync();
    }

    public async Task<ServiceResult<List<InvestorBookedTimeDto>>> GetInvestorBookedTimesAsync(int investorId, string? slotDate)
    {
        if (investorId <= 0)
        {
            return ServiceResult<List<InvestorBookedTimeDto>>.BadRequest("InvestorId must be a positive integer");
        }

        if (!TryParseDate(slotDate, out var date))
        {
            return ServiceResult<List<InvestorBookedTimeDto>>.BadRequest("Date format must be yyyy-MM-dd");
        }

        var bookedTimes = await _repository.GetInvestorBookedTimesAsync(investorId, date);
        return ServiceResult<List<InvestorBookedTimeDto>>.Success(bookedTimes);
    }

    private static bool TryParseTime(string input, out TimeOnly time)
    {
        return TimeOnly.TryParseExact(input, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
    }

    private static bool TryParseDate(string? input, out DateOnly date)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            date = default;
            return false;
        }

        return DateOnly.TryParseExact(input, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }
}
