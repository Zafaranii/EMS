using EMS.API.DTOs;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly IHotelsService _service;

    public HotelsController(IHotelsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HotelDto dto)
    {
        var result = await _service.CreateAsync(dto);
        if (result.Type != ServiceResultType.Success)
        {
            return ToActionResult(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.HotelId }, result.Data);
    }

    [HttpPost("{id:int}/rooms")]
    public async Task<IActionResult> AddRoom(int id, [FromBody] ConferenceRoomDto dto)
    {
        var result = await _service.AddRoomAsync(id, dto);
        return ToActionResult(result);
    }

    [HttpPost("rooms/{roomId:int}/slots")]
    public async Task<IActionResult> AddTimeSlot(int roomId, [FromBody] TimeSlotDto dto)
    {
        var result = await _service.AddTimeSlotAsync(roomId, dto);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteHotel(int id)
    {
        var result = await _service.DeleteHotelAsync(id);
        if (result.Type == ServiceResultType.Success)
        {
            return NoContent();
        }

        return ToActionResult(result);
    }

    [HttpDelete("rooms/{roomId:int}")]
    public async Task<IActionResult> DeleteRoom(int roomId)
    {
        var result = await _service.DeleteRoomAsync(roomId);
        if (result.Type == ServiceResultType.Success)
        {
            return NoContent();
        }

        return ToActionResult(result);
    }

    [HttpDelete("slots/{slotId:int}")]
    public async Task<IActionResult> DeleteSlot(int slotId)
    {
        var result = await _service.DeleteSlotAsync(slotId);
        if (result.Type == ServiceResultType.Success)
        {
            return NoContent();
        }

        return ToActionResult(result);
    }

    private IActionResult ToActionResult<T>(ServiceResult<T> result)
    {
        if (result.Type == ServiceResultType.Success)
        {
            return Ok(result.Data);
        }

        if (result.Type == ServiceResultType.NotFound)
        {
            return NotFound(new { message = result.Message });
        }

        if (result.Type == ServiceResultType.Conflict)
        {
            return Conflict(new { message = result.Message });
        }

        return BadRequest(new { message = result.Message });
    }
}
