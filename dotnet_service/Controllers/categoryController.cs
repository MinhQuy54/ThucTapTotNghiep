using dotnet_service.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class categoryController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var kq = db.ApiCategories.Select(x => new
                {
                    Id = x.Id,
                    Name = x.Name,
                    Description = x.Description,
                    Image = x.Image
                });

                return Ok(kq);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
