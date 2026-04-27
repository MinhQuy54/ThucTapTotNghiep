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
                decimal discount = 0;
                ApiVoucher? voucherToMark = null;

                // Áp dụng voucher nếu có
                if (!string.IsNullOrEmpty(request.VoucherCode))
                {
                    var now = DateTime.Now;
                    
                    // 1. Kiểm tra xem user đã dùng voucher này chưa
                    var hasUsed = await db.ApiUservouchers.AnyAsync(uv => 
                        uv.UserId == userId && uv.Voucher.Code == request.VoucherCode && uv.UsedAt != null && uv.UsedAt > DateTime.MinValue);
                    
                    if (hasUsed)
                        return BadRequest(new { error = "Bạn đã sử dụng voucher này rồi." });

                    // 2. Kiểm tra tính hợp lệ của voucher trong bảng ApiVouchers
                    var voucher = await db.ApiVouchers.FirstOrDefaultAsync(v => 
                        v.Code == request.VoucherCode && v.IsActive && v.Quantity > 0 && v.StartDate <= now && v.EndDate >= now);

                    if (voucher == null)
                        return BadRequest(new { error = "Voucher không hợp lệ, đã hết hạn hoặc hết số lượng." });

                    if (subtotal < voucher.MinOrderValue)
                        return BadRequest(new { error = $"Đơn hàng phải tối thiểu {voucher.MinOrderValue.ToString("N0")}đ để sử dụng voucher này." });

                    if (voucher.DiscountType == "percentage" || voucher.DiscountType == "percent")
                    {
                        discount = subtotal * voucher.DiscountValue / 100;
                        if (voucher.MaxDiscount.HasValue && discount > voucher.MaxDiscount.Value)
                            discount = voucher.MaxDiscount.Value;
                    }
                    else
                    {
                        discount = voucher.DiscountValue;
                    }

                    voucherToMark = voucher;
                }

                decimal totalAmount = subtotal + request.ShippingFee - discount;
                if (totalAmount < 0) totalAmount = 0;

                // Create order
                var order = new ApiOrder
                {
                    UserId = userId,
                    ShippingAddressId = request.AddressId,
                    TotalPrice = totalAmount,
                    Status = request.PaymentMethod == "MOMO" ? 0 : 1,
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

                // Đánh dấu voucher đã dùng
                if (voucherToMark != null)
                {
                    voucherToMark.Quantity -= 1;
                    db.ApiVouchers.Update(voucherToMark);

                    var uv = new ApiUservoucher {
                        UserId = userId,
                        VoucherId = voucherToMark.Id,
                        UsedAt = DateTime.Now
                    };
                    await db.ApiUservouchers.AddAsync(uv);
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

                    // Kiểm tra response từ Momo
                    if (momoResponse == null)
                    {
                        return BadRequest(new { error = "Lỗi kết nối Momo: Response null" });
                    }

                    // Momo trả về ResultCode = 0 là thành công
                    if (momoResponse.ResultCode != 0)
                    {
                        var errorMsg = momoResponse.Message ?? "Lỗi thanh toán Momo";
                        var localMsg = momoResponse.LocalMessage ?? "";
                        return BadRequest(new { 
                            error = $"Momo error ({momoResponse.ResultCode}): {errorMsg}",
                            detail = localMsg
                        });
                    }

                    if (string.IsNullOrEmpty(momoResponse.PayUrl))
                    {
                        return BadRequest(new { error = "MOMO error: Không nhận được PayUrl" });
                    }

                    return Ok(new
                    {
                        orderId = order.Id,
                        payUrl = momoResponse.PayUrl,
                        message = "Chuyển hướng thanh toán MOMO"
                    });
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
                if (parts.Length > 0)
                {
                    string idString = parts[0]; 
                    
                    if (idString.StartsWith("ORD", StringComparison.OrdinalIgnoreCase))
                    {
                        idString = idString.Substring(3); 
                    }

                    if (long.TryParse(idString, out long orderId))
                    {
                        var order = await db.ApiOrders.FindAsync(orderId);
                        if (order != null)
                        {
                            var resultCode = Request.Query["resultCode"].ToString();
                            if (resultCode == "0")
                            {
                                order.Status = 1; 
                                await db.SaveChangesAsync();
                                return Redirect($"http://localhost:8080/success.html?orderId={orderId}");
                            }
                            else
                            {
                                return Redirect($"http://localhost:8080/checkout.html?error=payment_failed_{resultCode}");
                            }
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