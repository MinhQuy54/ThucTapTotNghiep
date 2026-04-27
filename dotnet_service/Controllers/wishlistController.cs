using dotnet_service.Data;
using dotnet_service.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class wishlistController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();

        // Hàm lấy UserId từ Token đã có trong mẫu của bạn
        private long GetUserIdFromToken()
        {
            var claim = User.FindFirst("user_id");
            if (claim == null) return 0;
            return long.TryParse(claim.Value, out long id) ? id : 0;
        }

        [HttpGet("GetUserWishlist")]
        public async Task<IActionResult> GetUserWishlist()
        {
            // 1. Lấy UserId từ Token bằng hàm bạn đã viết
            long userId = GetUserIdFromToken();

            // 2. Kiểm tra nếu không tìm thấy User (Token không hợp lệ hoặc hết hạn)
            if (userId == 0)
            {
                return Unauthorized(new { message = "Bạn cần đăng nhập để xem danh sách yêu thích." });
            }

            // 3. Truy vấn danh sách Wishlist từ Database
            // Giả sử bảng Wishlist có UserId và Product (Navigation Property)
            var wishlist = await db.ApiWishlists
                .Where(w => w.UserId == userId)
                .Include(w => w.Product) // Load thông tin sản phẩm
                .Select(w => new {
                    Id = w.ProductId,
                    Name = w.Product.Name,
                    Price = w.Product.Price,
                    Unit = w.Product.Unit
                })
                .ToListAsync();

            return Ok(new { data = wishlist });
        }

        [HttpPost("Add")]
        public async Task<IActionResult> AddToWishlist([FromQuery] long productId)
        {
            long userId = GetUserIdFromToken();
            if (userId == 0) return Unauthorized(new { message = "Vui lòng đăng nhập." });

            // Kiểm tra xem sản phẩm đã tồn tại trong wishlist của user này chưa
            var exists = await db.ApiWishlists
                .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

            if (exists)
            {
                return BadRequest(new { message = "Sản phẩm này đã có trong danh sách yêu thích." });
            }

            // Tạo object mới dựa trên schema hình ảnh
            var wishlist = new ApiWishlist
            {
                UserId = userId,
                ProductId = productId,
                CreatedAt = DateTime.Now
            };

            db.ApiWishlists.Add(wishlist);
            await db.SaveChangesAsync();

            return Ok(new { message = "Đã thêm vào yêu thích thành công.", data = wishlist });
        }

        [HttpPost("Remove")]
        public async Task<IActionResult> RemoveFromWishlist([FromQuery] long productId)
        {
            long userId = GetUserIdFromToken();
            if (userId == 0) return Unauthorized(new { message = "Vui lòng đăng nhập." });

            var item = await db.ApiWishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (item == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm trong wishlist." });
            }

            db.ApiWishlists.Remove(item);
            await db.SaveChangesAsync();

            return Ok(new { message = "Đã xóa khỏi danh sách yêu thích." });
        }
    }
}
