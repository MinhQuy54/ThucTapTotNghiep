using dotnet_service.Data;
using dotnet_service.MyModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class userVoucherController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();
        private long GetUserIdFromToken()
        {
            var claim = User.FindFirst("user_id");
            if (claim == null) return 0;
            return long.TryParse(claim.Value, out long id) ? id : 0;
        }

        [HttpGet("GetUserVouchers")]
        public IActionResult GetUserVouchers()
        {
            try
            {
                var userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { message = "Vui lòng đăng nhập" });

                var now = DateTime.Now;

                var kq = db.ApiUservouchers
                    .Where(x => x.UserId == userId && (x.UsedAt == null || x.UsedAt <= DateTime.MinValue))
                    .Select(x => new UserVoucher
                    {
                        Id = x.Voucher.Id,
                        Code = x.Voucher.Code,
                        DiscountType = x.Voucher.DiscountType,
                        DiscountValue = x.Voucher.DiscountValue,
                        MinOrderValue = x.Voucher.MinOrderValue,
                        MaxDiscount = x.Voucher.MaxDiscount,
                        EndDate = x.Voucher.EndDate,
                        UserVoucherId = x.Id
                    })
                    .AsEnumerable()
                    .ToList();

                return Ok(kq);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}
