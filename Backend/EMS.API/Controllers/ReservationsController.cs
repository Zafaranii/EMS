using EMS.API.DTOs;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationsService _service;

    public ReservationsController(IReservationsService service)
    {
        _service = service;
    }

    [HttpGet("match-presenters")]
    public async Task<IActionResult> GetMatchingPresenters([FromQuery] int sectorId, [FromQuery] string startTime, [FromQuery] string endTime, [FromQuery] string? slotDate = null)
    {
        var result = await _service.GetMatchingPresentersAsync(sectorId, startTime, endTime, slotDate);
        return ToActionResult(result);
    }

    [HttpGet("available-rooms")]
    public async Task<IActionResult> GetAvailableRooms([FromQuery] string startTime, [FromQuery] string? slotDate = null)
    {
        var result = await _service.GetAvailableRoomsAsync(startTime, slotDate);
        return ToActionResult(result);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmReservationDto dto)
    {
        var result = await _service.ConfirmAsync(dto);
        if (result.Type == ServiceResultType.Success)
        {
            return Ok(new { message = result.Data });
        }

        if (result.Type == ServiceResultType.Conflict)
        {
            return Conflict(new { message = result.Message });
        }

        return BadRequest(new { message = result.Message });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var report = await _service.GetAllAsync();
        return Ok(report);
    }

    [HttpGet("investor-booked-times")]
    public async Task<IActionResult> GetInvestorBookedTimes([FromQuery] int investorId, [FromQuery] string? slotDate = null)
    {
        var result = await _service.GetInvestorBookedTimesAsync(investorId, slotDate);
        return ToActionResult(result);
    }

    private IActionResult ToActionResult<T>(ServiceResult<T> result)
    {
        if (result.Type == ServiceResultType.Success)
        {
            return Ok(result.Data);
        }

        if (result.Type == ServiceResultType.Conflict)
        {
            return Conflict(new { message = result.Message });
        }

        return BadRequest(new { message = result.Message });
    }
}
