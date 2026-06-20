using EMS.API.DTOs;
using EMS.API.Services.Common;
using EMS.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PresentersController : ControllerBase
{
    private readonly IPresentersService _service;

    public PresentersController(IPresentersService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PresenterDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ToActionResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PresenterDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
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
