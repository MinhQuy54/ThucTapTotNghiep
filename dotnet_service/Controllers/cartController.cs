using dotnet_service.Data;
using dotnet_service.Models;
using dotnet_service.MyModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class cartController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();

        private long GetUserIdFromToken()
        {
            var claim = User.FindFirst("user_id");
            if (claim == null) return 0;
            return long.TryParse(claim.Value, out long id) ? id : 0;
        }

        private async Task<ApiCart> GetOrCreateActiveCartAsync(long userId)
        {
            var cart = await db.ApiCarts
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");

            if (cart == null)
            {
                cart = new ApiCart
                {
                    UserId = userId,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                await db.ApiCarts.AddAsync(cart);
                await db.SaveChangesAsync();
            }

            return cart;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { error = "Hết phiên đăng nhập" });

                var cart = await GetOrCreateActiveCartAsync(userId);

                var cartItems = await db.ApiCartitems
                    .Where(c => c.CartId == cart.Id)
                    .Include(c => c.Product)
                    .ThenInclude(p => p.ApiProductimages)
                    .Select(c => new
                    {
                        id = c.Id,
                        quantity = c.Quantity,
                        product = new
                        {
                            id = c.ProductId,
                            name = c.Product.Name,
                            price = c.Product.Price,
                            weightgram = c.Product.WeightGram,
                            images = c.Product.ApiProductimages.Select(img => new
                            {
                                image = img.Image
                            }).ToList()
                        }
                    })
                    .ToListAsync();

                return Ok(cartItems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] CartRequest request)
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { error = "Hết phiên đăng nhập" });

                var cart = await GetOrCreateActiveCartAsync(userId);

                var productExists = await db.ApiProducts.AnyAsync(p => p.Id == request.product_id);
                if (!productExists) return NotFound(new { error = "Sản phẩm không tồn tại" });

                var existingItem = await db.ApiCartitems
                    .FirstOrDefaultAsync(c => c.CartId == cart.Id && c.ProductId == request.product_id);

                if (existingItem != null)
                {
                    existingItem.Quantity += request.quantity;
                    db.ApiCartitems.Update(existingItem);
                }
                else
                {
                    await db.ApiCartitems.AddAsync(new ApiCartitem
                    {
                        CartId = cart.Id,
                        ProductId = request.product_id,
                        Quantity = request.quantity
                    });
                }

                await db.SaveChangesAsync();
                return Ok(new { message = "Thêm vào giỏ hàng thành công", cartId = cart.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi SQL: " + ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveFromCart(long id)
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { error = "Hết phiên đăng nhập" });

                var cart = await db.ApiCarts.FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");
                if (cart == null) return NotFound(new { error = "Không tìm thấy giỏ hàng" });

                var cartItem = await db.ApiCartitems
                    .FirstOrDefaultAsync(c => c.Id == id && c.CartId == cart.Id);

                if (cartItem == null) return NotFound(new { error = "Không tìm thấy mục này" });

                db.ApiCartitems.Remove(cartItem);
                await db.SaveChangesAsync();

                return Ok(new { message = "Đã xóa sản phẩm thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi khi xóa: " + ex.Message });
            }
        }

        [HttpPut("{cartItemId}")]
        public async Task<IActionResult> UpdateQuantity(int cartItemId, [FromBody] CartUpdateDto dto)
        {
            try
            {
                if (dto.Quantity < 1) return BadRequest(new { message = "Số lượng phải >= 1" });

                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { error = "Hết phiên đăng nhập" });

                var cart = await db.ApiCarts.FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");
                if (cart == null) return NotFound(new { message = "Không tìm thấy giỏ hàng" });

                var cartItem = await db.ApiCartitems
                    .FirstOrDefaultAsync(c => c.Id == cartItemId && c.CartId == cart.Id);

                if (cartItem == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

                cartItem.Quantity = dto.Quantity;
                await db.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công", quantity = cartItem.Quantity });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearAllCart()
        {
            try
            {
                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { error = "Hết phiên đăng nhập" });

                var cart = await db.ApiCarts.FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");
                if (cart == null) return Ok(new { message = "Giỏ hàng trống" });

                var userCartItems = await db.ApiCartitems
                    .Where(c => c.CartId == cart.Id)
                    .ToListAsync();

                if (userCartItems.Any())
                {
                    db.ApiCartitems.RemoveRange(userCartItems);
                    await db.SaveChangesAsync();
                }

                return Ok(new { message = "Đã xóa toàn bộ giỏ hàng" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }
    }
}