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

        private async Task UpdateProductSoldCount(long orderId)
        {
            var orderItems = await db.ApiOrderitems.Where(oi => oi.OrderId == orderId).ToListAsync();
            foreach (var item in orderItems)
            {
                var product = await db.ApiProducts.FindAsync(item.ProductId);
                if (product != null)
                {
                    var count = await db.ApiOrderitems
                        .Where(oi => oi.ProductId == product.Id && oi.Order.Status >= 1 && oi.Order.Status != 5)
                        .SumAsync(oi => oi.Quantity);
                    product.SoldCount = count;
                    db.ApiProducts.Update(product);
                }
            }
            await db.SaveChangesAsync();
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
                ApiUservoucher? userVoucherToMark = null;

                // Áp dụng voucher nếu có
                if (!string.IsNullOrEmpty(request.VoucherCode))
                {
                    var now = DateTime.Now;
                    var userVoucher = await db.ApiUservouchers
                        .Include(uv => uv.Voucher)
                        .Where(uv => uv.UserId == userId
                            && uv.Voucher.Code == request.VoucherCode
                            && (uv.UsedAt == null || uv.UsedAt <= DateTime.MinValue)
                            && uv.Voucher.EndDate >= now)
                        .FirstOrDefaultAsync();

                    if (userVoucher == null)
                        return BadRequest(new { error = "Voucher không hợp lệ hoặc đã được sử dụng." });

                    var voucher = userVoucher.Voucher;

                    if (subtotal < voucher.MinOrderValue)
                        return BadRequest(new { error = $"Đơn hàng phải tối thiểu {voucher.MinOrderValue.ToString("N0")}đ để sử dụng voucher này." });

                    if (voucher.DiscountType == "percentage")
                    {
                        discount = subtotal * voucher.DiscountValue / 100;
                        if (voucher.MaxDiscount.HasValue && discount > voucher.MaxDiscount.Value)
                            discount = voucher.MaxDiscount.Value;
                    }
                    else
                    {
                        discount = voucher.DiscountValue;
                    }

                    userVoucherToMark = userVoucher;
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
                    if (item.Product.Stock < item.Quantity)
                    {
                        return BadRequest(new { error = $"Sản phẩm '{item.Product.Name}' chỉ còn {item.Product.Stock} sản phẩm trong kho." });
                    }

                    var orderItem = new ApiOrderitem
                    {
                        OrderId = order.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Product.Price
                    };
                    await db.ApiOrderitems.AddAsync(orderItem);

                    // Trừ số lượng tồn kho
                    item.Product.Stock -= item.Quantity;
                    db.ApiProducts.Update(item.Product);
                }

                // Đánh dấu voucher đã dùng
                if (userVoucherToMark != null)
                {
                    userVoucherToMark.UsedAt = DateTime.Now;
                    db.ApiUservouchers.Update(userVoucherToMark);
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
                    await UpdateProductSoldCount(order.Id);
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
                                await UpdateProductSoldCount(orderId);
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