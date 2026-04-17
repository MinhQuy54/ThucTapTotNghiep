using dotnet_service.Data;
using dotnet_service.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class shippingAddressController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();

        private long GetUserIdFromToken()
        {
            var claim = User.FindFirst("user_id");
            if (claim == null) return 0;
            return long.TryParse(claim.Value, out long id) ? id : 0;
        }

        [HttpGet("user-addresses")]
        public async Task<IActionResult> GetUserAddresses()
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0)
                {
                    return Unauthorized(new { message = "Bạn cần đăng nhập để thực hiện thao tác này." });
                }

                var addresses = await db.ApiShippingaddresses
                    .Where(a => a.UserId == userId)
                    .ToListAsync();

                return Ok(addresses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
            }
        }
    }
}
