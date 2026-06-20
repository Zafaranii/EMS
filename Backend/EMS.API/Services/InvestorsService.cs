using EMS.API.DTOs;
using EMS.API.Models;
using EMS.API.Repositories.Interfaces;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using System.Globalization;

namespace EMS.API.Services;

public class InvestorsService : IInvestorsService
{
    private readonly IInvestorsRepository _repository;

    public InvestorsService(IInvestorsRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<InvestorDetailsDto>> GetAllAsync()
    {
        var investors = await _repository.GetAllWithAvailabilitiesAsync();
        return investors.Select(MapInvestor).ToList();
    }

    public async Task<ServiceResult<InvestorDetailsDto>> CreateAsync(InvestorDto dto)
    {
        var validation = await ValidateDtoAsync(dto);
        if (validation is not null) return validation;

        var investor = new Investor
        {
            InvestorName = dto.InvestorName,
            Mobile = dto.Mobile,
            InvestorSectorAvailabilities = dto.Availabilities.Select(a =>
            {
                TryParseTime(a.StartTime, out var start);
                TryParseTime(a.EndTime, out var end);
                TryParseDate(a.AvailableDate, out var date);
                return new InvestorSectorAvailability
                {
                    SectorId = a.SectorId,
                    AvailableDate = date,
                    StartTime = start,
                    EndTime = end,
                };
            }).ToList(),
        };

        await _repository.AddAsync(investor);
        return ServiceResult<InvestorDetailsDto>.Success(MapInvestor(investor));
    }

    public async Task<ServiceResult<InvestorDetailsDto>> UpdateAsync(int id, InvestorDto dto)
    {
        var validation = await ValidateDtoAsync(dto);
        if (validation is not null) return validation;

        var investor = await _repository.GetByIdWithAvailabilitiesAsync(id);
        if (investor is null)
        {
            return ServiceResult<InvestorDetailsDto>.NotFound("Investor not found");
        }

        investor.InvestorName = dto.InvestorName.Trim();
        investor.Mobile = dto.Mobile.Trim();

        _repository.RemoveAvailabilities(investor.InvestorSectorAvailabilities);
        investor.InvestorSectorAvailabilities = dto.Availabilities.Select(a =>
        {
            TryParseTime(a.StartTime, out var start);
            TryParseTime(a.EndTime, out var end);
            TryParseDate(a.AvailableDate, out var date);
            return new InvestorSectorAvailability
            {
                SectorId = a.SectorId,
                AvailableDate = date,
                StartTime = start,
                EndTime = end,
            };
        }).ToList();

        await _repository.SaveChangesAsync();
        return ServiceResult<InvestorDetailsDto>.Success(MapInvestor(investor));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(int id)
    {
        var investor = await _repository.FindByIdAsync(id);
        if (investor is null)
        {
            return ServiceResult<bool>.NotFound("Investor not found");
        }

        await _repository.RemoveDependenciesAsync(id);
        _repository.Remove(investor);
        await _repository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private async Task<ServiceResult<InvestorDetailsDto>?> ValidateDtoAsync(InvestorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.InvestorName))
        {
            return ServiceResult<InvestorDetailsDto>.BadRequest("InvestorName is required");
        }

        if (string.IsNullOrWhiteSpace(dto.Mobile))
        {
            return ServiceResult<InvestorDetailsDto>.BadRequest("Mobile is required");
        }

        if (dto.Availabilities is null || dto.Availabilities.Count == 0)
        {
            return ServiceResult<InvestorDetailsDto>.BadRequest("At least one availability is required");
        }

        foreach (var item in dto.Availabilities)
        {
            if (!await _repository.SectorExistsAsync(item.SectorId))
            {
                return ServiceResult<InvestorDetailsDto>.BadRequest($"Invalid SectorId: {item.SectorId}");
            }

            if (string.IsNullOrWhiteSpace(item.AvailableDate))
            {
                return ServiceResult<InvestorDetailsDto>.BadRequest("AvailableDate is required");
            }

            if (!TryParseDate(item.AvailableDate, out _))
            {
                return ServiceResult<InvestorDetailsDto>.BadRequest("AvailableDate format must be yyyy-MM-dd");
            }

            if (!TryParseTime(item.StartTime, out var start) || !TryParseTime(item.EndTime, out var end))
            {
                return ServiceResult<InvestorDetailsDto>.BadRequest("Time format must be HH:mm");
            }

            if (start >= end)
            {
                return ServiceResult<InvestorDetailsDto>.BadRequest("StartTime must be before EndTime");
            }
        }

        dto.InvestorName = dto.InvestorName.Trim();
        dto.Mobile = dto.Mobile.Trim();
        return null;
    }

    private static InvestorDetailsDto MapInvestor(Investor i) => new()
    {
        InvestorId = i.InvestorId,
        InvestorName = string.IsNullOrWhiteSpace(i.InvestorName) ? $"Investor {i.InvestorId}" : i.InvestorName,
        Mobile = i.Mobile,
        Availabilities = i.InvestorSectorAvailabilities.Select(a => new SectorAvailabilityDto
        {
            SectorId = a.SectorId,
            AvailableDate = a.AvailableDate.ToString("yyyy-MM-dd"),
            StartTime = a.StartTime.ToString("HH:mm"),
            EndTime = a.EndTime.ToString("HH:mm"),
        }).ToList(),
    };

    private static bool TryParseTime(string input, out TimeOnly time)
    {
        return TimeOnly.TryParseExact(input, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
    }

    private static bool TryParseDate(string input, out DateOnly date)
    {
        return DateOnly.TryParseExact(input, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }
}
