using dotnet_service.Data;
using dotnet_service.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class reviewController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();

        private long GetUserIdFromToken()
        {
            var claim = User.FindFirst("user_id");
            if (claim == null) return 0;
            return long.TryParse(claim.Value, out long id) ? id : 0;
        }

        // GET: api/review/{productId}  - Lấy danh sách đánh giá của sản phẩm
        [HttpGet("{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviews(long productId)
        {
            try
            {
                var reviews = await db.ApiReviews
                    .Where(r => r.ProductId == productId)
                    .Include(r => r.User)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        rating = r.Rating,
                        comment = r.Comment,
                        createdAt = r.CreatedAt,
                        user = new
                        {
                            id = r.User.Id,
                            username = r.User.Username,
                            avatar = r.User.Avatar
                        }
                    })
                    .ToListAsync();

                var avgRating = reviews.Count > 0 ? reviews.Average(r => r.rating) : 0;

                return Ok(new
                {
                    data = reviews,
                    total = reviews.Count,
                    avgRating = Math.Round(avgRating, 1)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/review  - Thêm đánh giá mới
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddReview([FromBody] ReviewRequest req)
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { message = "Vui lòng đăng nhập." });

                if (req.Rating < 1 || req.Rating > 5)
                    return BadRequest(new { message = "Rating phải từ 1 đến 5." });

                if (string.IsNullOrWhiteSpace(req.Comment))
                    return BadRequest(new { message = "Nội dung bình luận không được để trống." });

                // Kiểm tra user có mua sản phẩm này chưa
                // Status: 1=Confirmed, 2=Confirmed (shipped), 3=Shipping, 4=Delivered, 5=Cancelled
                // Cho phép bình luận nếu đơn hàng đã thanh toán/xác nhận (status >= 1) và không bị hủy (status != 5)
                var hasPurchased = await db.ApiOrderitems
                    .AnyAsync(oi => oi.ProductId == req.ProductId && 
                              oi.Order.UserId == userId && 
                              oi.Order.Status >= 1 && 
                              oi.Order.Status != 5);

                if (!hasPurchased)
                    return BadRequest(new { message = "Bạn chỉ có thể đánh giá sản phẩm mà bạn đã mua." });

                // Kiểm tra đã review chưa
                var existed = await db.ApiReviews
                    .AnyAsync(r => r.ProductId == req.ProductId && r.UserId == userId);

                if (existed)
                    return BadRequest(new { message = "Bạn đã đánh giá sản phẩm này rồi." });

                var review = new ApiReview
                {
                    ProductId = req.ProductId,
                    UserId = userId,
                    Rating = req.Rating,
                    Comment = req.Comment.Trim(),
                    CreatedAt = DateTime.Now
                };

                db.ApiReviews.Add(review);
                await db.SaveChangesAsync();

                // Load user info để trả về
                var user = await db.ApiUsers.FindAsync(userId);

                return Ok(new
                {
                    message = "Đánh giá thành công!",
                    data = new
                    {
                        id = review.Id,
                        rating = review.Rating,
                        comment = review.Comment,
                        createdAt = review.CreatedAt,
                        user = new
                        {
                            id = user!.Id,
                            username = user.Username,
                            avatar = user.Avatar
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/review/{id}  - Sửa đánh giá (chỉ sửa của mình)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> EditReview(long id, [FromBody] ReviewRequest req)
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized();

                var review = await db.ApiReviews.FindAsync(id);
                if (review == null) return NotFound(new { message = "Không tìm thấy đánh giá." });
                if (review.UserId != userId) return Forbid();

                if (req.Rating < 1 || req.Rating > 5)
                    return BadRequest(new { message = "Rating phải từ 1 đến 5." });

                if (string.IsNullOrWhiteSpace(req.Comment))
                    return BadRequest(new { message = "Nội dung bình luận không được để trống." });

                review.Rating = req.Rating;
                review.Comment = req.Comment.Trim();

                await db.SaveChangesAsync();

                return Ok(new { message = "Đã cập nhật đánh giá." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/review/{id}  - Xóa đánh giá (chỉ xóa của mình)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(long id)
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized();

                var review = await db.ApiReviews.FindAsync(id);
                if (review == null) return NotFound(new { message = "Không tìm thấy đánh giá." });
                if (review.UserId != userId) return Forbid();

                db.ApiReviews.Remove(review);
                await db.SaveChangesAsync();

                return Ok(new { message = "Đã xóa đánh giá." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class ReviewRequest
    {
        public long ProductId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
