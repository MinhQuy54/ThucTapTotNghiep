using dotnet_service.Data;
using dotnet_service.Models;
using dotnet_service.MyModels;
using dotnet_service.Services.Momo;
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
    [Authorize]
    public class checkoutController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();
        private readonly IMomoService momoService;

        public checkoutController(IMomoService momoService)
        {
            this.momoService = momoService;
        }

        private long GetUserIdFromToken()
        {
            var claim = User.FindFirst("user_id");
            if (claim == null) return 0;
            return long.TryParse(claim.Value, out long id) ? id : 0;
        }

        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] CheckoutRequest request)
        {
            try
            {
                // Validate request
                if (request == null)
                    return BadRequest(new { error = "Request body không hợp lệ" });

                if (request.AddressId <= 0)
                    return BadRequest(new { error = "AddressId phải > 0" });

                if (request.ShippingFee < 0)
                    return BadRequest(new { error = "ShippingFee không hợp lệ" });

                if (string.IsNullOrEmpty(request.PaymentMethod))
                    return BadRequest(new { error = "PaymentMethod không được để trống" });

                long userId = GetUserIdFromToken();
                if (userId == 0) return Unauthorized(new { error = "Hết phiên đăng nhập" });

                // Validate address
                var address = await db.ApiShippingaddresses.FirstOrDefaultAsync(
                    a => a.Id == request.AddressId && a.UserId == userId);
                if (address == null) return BadRequest(new { error = "Địa chỉ không hợp lệ" });

                // Get cart
                var cart = await db.ApiCarts.FirstOrDefaultAsync(
                    c => c.UserId == userId && c.Status == "Active");
                if (cart == null) return BadRequest(new { error = "Giỏ hàng trống" });

                var cartItems = await db.ApiCartitems
                    .Where(c => c.CartId == cart.Id)
                    .Include(c => c.Product)
                    .ToListAsync();

                if (cartItems.Count == 0) return BadRequest(new { error = "Giỏ hàng trống" });

                // Calculate total
                decimal subtotal = cartItems.Sum(c => c.Quantity * c.Product.Price);
                decimal totalAmount = subtotal + request.ShippingFee;

                // Create order
                var order = new ApiOrder
                {
                    UserId = userId,
                    ShippingAddressId = request.AddressId,
                    TotalPrice = totalAmount,
                    Status = request.PaymentMethod == "MOMO" ? 0 : 1, // 0: pending, 1: confirmed
                    CreatedAt = DateTime.UtcNow
                };

                await db.ApiOrders.AddAsync(order);
                await db.SaveChangesAsync();

                // Add order items
                foreach (var item in cartItems)
                {
                    var orderItem = new ApiOrderitem
                    {
                        OrderId = order.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Product.Price
                    };
                    await db.ApiOrderitems.AddAsync(orderItem);
                }

                // Clear cart
                db.ApiCartitems.RemoveRange(cartItems);
                cart.Status = "Completed";
                db.ApiCarts.Update(cart);

                await db.SaveChangesAsync();

                // Handle payment
                if (request.PaymentMethod == "MOMO")
                {
                    if (momoService == null)
                    {
                        return BadRequest(new { error = "MOMO service không khả dụng" });
                    }

                    var momoResponse = await momoService.CreatePaymentAsync(order);

                    if (momoResponse?.PayUrl != null)
                    {
                        return Ok(new
                        {
                            orderId = order.Id,
                            payUrl = momoResponse.PayUrl,
                            message = "Chuyển hướng thanh toán MOMO"
                        });
                    }
                    else
                    {
                        return BadRequest(new { error = "MOMO error: " + momoResponse?.Message });
                    }
                }
                else // COD
                {
                    return Ok(new
                    {
                        orderId = order.Id,
                        message = "Tạo đơn hàng COD thành công"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi: " + ex.Message });
            }
        }

        [HttpGet("payment-callback")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentCallback()
        {
            try
            {
                var response = momoService.PaymentExecuteAsync(Request.Query);
                var requestOrderId = Request.Query["orderId"].ToString();
                
                if (string.IsNullOrEmpty(requestOrderId))
                    return Redirect("http://localhost:8080/checkout.html?error=invalid_momo_request");

                var parts = requestOrderId.Split('_');
                if (parts.Length > 0 && long.TryParse(parts[0], out long orderId))
                {
                    var order = await db.ApiOrders.FindAsync(orderId);
                    if (order != null)
                    {
                        var resultCode = Request.Query["resultCode"].ToString();
                        if (resultCode == "0")
                        {
                            order.Status = 1; // 1: confirmed/paid
                            await db.SaveChangesAsync();
                            return Redirect($"http://localhost:8080/success.html?orderId={orderId}");
                        }
                        else
                        {
                            return Redirect($"http://localhost:8080/checkout.html?error=payment_failed_{resultCode}");
                        }
                    }
                }
                return Redirect("http://localhost:8080/checkout.html?error=order_not_found");
            }
            catch (Exception)
            {
                return Redirect("http://localhost:8080/checkout.html?error=exception");
            }
        }
    }
}