using dotnet_service.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HoadonController : ControllerBase
    {
        private static hoadonContext db = new hoadonContext();
        [HttpGet]
        public IActionResult GetHoadon()
        {
            try
            {
                var data = db.Hoadons.ToList();
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
