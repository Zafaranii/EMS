using EMS.API.DTOs;
using EMS.API.Models;
using EMS.API.Repositories.Interfaces;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using System.Globalization;

namespace EMS.API.Services;

public class PresentersService : IPresentersService
{
    private readonly IPresentersRepository _repository;

    public PresentersService(IPresentersRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PresenterDetailsDto>> GetAllAsync()
    {
        var presenters = await _repository.GetAllWithAvailabilitiesAsync();
        return presenters.Select(MapPresenter).ToList();
    }

    public async Task<ServiceResult<PresenterDetailsDto>> CreateAsync(PresenterDto dto)
    {
        var validation = await ValidateDtoAsync(dto);
        if (validation is not null) return validation;

        var presenter = new Presenter
        {
            PresenterName = dto.PresenterName,
            Mobile = dto.Mobile,
            PresenterSectorAvailabilities = dto.Availabilities.Select(a =>
            {
                TryParseTime(a.StartTime, out var start);
                TryParseTime(a.EndTime, out var end);
                TryParseDate(a.AvailableDate, out var date);
                return new PresenterSectorAvailability
                {
                    SectorId = a.SectorId,
                    AvailableDate = date,
                    StartTime = start,
                    EndTime = end,
                };
            }).ToList(),
        };

        await _repository.AddAsync(presenter);
        return ServiceResult<PresenterDetailsDto>.Success(MapPresenter(presenter));
    }

    public async Task<ServiceResult<PresenterDetailsDto>> UpdateAsync(int id, PresenterDto dto)
    {
        var validation = await ValidateDtoAsync(dto);
        if (validation is not null) return validation;

        var presenter = await _repository.GetByIdWithAvailabilitiesAsync(id);
        if (presenter is null)
        {
            return ServiceResult<PresenterDetailsDto>.NotFound("Presenter not found");
        }

        presenter.PresenterName = dto.PresenterName.Trim();
        presenter.Mobile = dto.Mobile.Trim();

        _repository.RemoveAvailabilities(presenter.PresenterSectorAvailabilities);
        presenter.PresenterSectorAvailabilities = dto.Availabilities.Select(a =>
        {
            TryParseTime(a.StartTime, out var start);
            TryParseTime(a.EndTime, out var end);
            TryParseDate(a.AvailableDate, out var date);
            return new PresenterSectorAvailability
            {
                SectorId = a.SectorId,
                AvailableDate = date,
                StartTime = start,
                EndTime = end,
            };
        }).ToList();

        await _repository.SaveChangesAsync();
        return ServiceResult<PresenterDetailsDto>.Success(MapPresenter(presenter));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(int id)
    {
        var presenter = await _repository.FindByIdAsync(id);
        if (presenter is null)
        {
            return ServiceResult<bool>.NotFound("Presenter not found");
        }

        await _repository.RemoveDependenciesAsync(id);
        _repository.Remove(presenter);
        await _repository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private async Task<ServiceResult<PresenterDetailsDto>?> ValidateDtoAsync(PresenterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PresenterName))
        {
            return ServiceResult<PresenterDetailsDto>.BadRequest("PresenterName is required");
        }

        if (string.IsNullOrWhiteSpace(dto.Mobile))
        {
            return ServiceResult<PresenterDetailsDto>.BadRequest("Mobile is required");
        }

        if (dto.Availabilities is null || dto.Availabilities.Count == 0)
        {
            return ServiceResult<PresenterDetailsDto>.BadRequest("At least one availability is required");
        }

        foreach (var item in dto.Availabilities)
        {
            if (!await _repository.SectorExistsAsync(item.SectorId))
            {
                return ServiceResult<PresenterDetailsDto>.BadRequest($"Invalid SectorId: {item.SectorId}");
            }

            if (string.IsNullOrWhiteSpace(item.AvailableDate))
            {
                return ServiceResult<PresenterDetailsDto>.BadRequest("AvailableDate is required");
            }

            if (!TryParseDate(item.AvailableDate, out _))
            {
                return ServiceResult<PresenterDetailsDto>.BadRequest("AvailableDate format must be yyyy-MM-dd");
            }

            if (!TryParseTime(item.StartTime, out var start) || !TryParseTime(item.EndTime, out var end))
            {
                return ServiceResult<PresenterDetailsDto>.BadRequest("Time format must be HH:mm");
            }

            if (start >= end)
            {
                return ServiceResult<PresenterDetailsDto>.BadRequest("StartTime must be before EndTime");
            }
        }

        dto.PresenterName = dto.PresenterName.Trim();
        dto.Mobile = dto.Mobile.Trim();
        return null;
    }

    private static PresenterDetailsDto MapPresenter(Presenter p) => new()
    {
        PresenterId = p.PresenterId,
        PresenterName = string.IsNullOrWhiteSpace(p.PresenterName) ? $"Presenter {p.PresenterId}" : p.PresenterName,
        Mobile = p.Mobile,
        Availabilities = p.PresenterSectorAvailabilities.Select(a => new SectorAvailabilityDto
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
