using EMS.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SectorsController : ControllerBase
{
    private readonly ISectorsService _service;

    public SectorsController(ISectorsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sectors = await _service.GetAllAsync();
        return Ok(sectors);
    }
}
