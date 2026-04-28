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

                // 1. Lấy danh sách ID các voucher mà user này ĐÃ dùng
                var usedVoucherIds = db.ApiUservouchers
                    .Where(x => x.UserId == userId && x.UsedAt != null && x.UsedAt > DateTime.MinValue)
                    .Select(x => x.VoucherId)
                    .ToList();

                // 2. Lấy tất cả các voucher đang hoạt động, còn số lượng, trong hạn sử dụng 
                //    và user này CHƯA dùng (hoặc chưa có bản ghi dùng)
                var availableVouchers = db.ApiVouchers
                    .Where(v => v.IsActive 
                             && v.Quantity > 0 
                             && v.StartDate <= now 
                             && v.EndDate >= now
                             && !usedVoucherIds.Contains(v.Id))
                    .Select(v => new UserVoucher
                    {
                        Id = v.Id,
                        Code = v.Code,
                        DiscountType = v.DiscountType,
                        DiscountValue = v.DiscountValue,
                        MinOrderValue = v.MinOrderValue,
                        MaxDiscount = v.MaxDiscount,
                        EndDate = v.EndDate,
                        UserVoucherId = 0 // Đây là voucher chung chưa gán
                    })
                    .ToList();

                return Ok(availableVouchers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}
