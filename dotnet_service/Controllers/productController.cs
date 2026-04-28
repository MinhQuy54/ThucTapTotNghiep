using dotnet_service.Data;
using dotnet_service.Models;
using dotnet_service.MyModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace dotnet_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class productController : ControllerBase
    {
        private readonly veggie_dbContext db = new veggie_dbContext();

        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] ProductFilter filter)
        {
            try
            {
                var query = db.ApiProducts.AsNoTracking();

                if (filter.CategoryId.HasValue)
                {
                    query = query.Where(p => p.CategoryId == filter.CategoryId);
                }

                if (filter.MinPrice.HasValue)
                {
                    query = query.Where(p => p.Price >= filter.MinPrice);
                }
                if (filter.MaxPrice.HasValue)
                {
                    query = query.Where(p => p.Price <= filter.MaxPrice);
                }

                if (!string.IsNullOrEmpty(filter.Stock) && filter.Stock.ToLower() != "all")
                {
                    if (filter.Stock == "inStock")
                    {
                        query = query.Where(p => p.Stock > 0);
                    }
                    else if (filter.Stock == "outOfStock")
                    {
                        query = query.Where(p => p.Stock <= 0);
                    }
                }

                query = filter.Ordering switch
                {
                    "price" => query.OrderBy(p => p.Price),
                    "-price" => query.OrderByDescending(p => p.Price),
                    "-sold_count" => query.OrderByDescending(p => p.SoldCount),
                    "-average_rating" => query.OrderByDescending(p => p.AverageRating),
                    _ => query.OrderByDescending(p => p.Id)
                };

                var products = await query
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(p => new CProduct
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        Price = p.Price,
                        Stock = p.Stock,
                        Unit = p.Unit,
                        WeightGram = p.WeightGram,
                        CategoryId = p.CategoryId,
                        CategoryName = p.Category.Name,
                        // Chỉ tính số lượng bán từ đơn hàng đã thanh toán (status >= 1) và không bị hủy (status != 5)
                        Sold = p.ApiOrderitems.Where(oi => oi.Order.Status >= 1 && oi.Order.Status != 5).Sum(oi => oi.Quantity)
                    })
                    .ToListAsync();

                var totalItems = await query.CountAsync();

                return Ok(new
                {
                    TotalItems = totalItems,
                    Page = filter.Page,
                    Data = products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Đã có lỗi xảy ra!",
                    detail = ex.Message
                });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProductById(long id)
        {
            try
            {
                var product = await db.ApiProducts
                    .AsNoTracking()
                    .Where(p => p.Id == id)
                    .Select(p => new CProduct
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        Price = p.Price,
                        Stock = p.Stock,
                        Unit = p.Unit,
                        WeightGram = p.WeightGram,
                        CategoryId = p.CategoryId,
                        CategoryName = p.Category.Name,
                        // Chỉ tính số lượng bán từ đơn hàng đã thanh toán (status >= 1) và không bị hủy (status != 5)
                        Sold = p.ApiOrderitems.Where(oi => oi.Order.Status >= 1 && oi.Order.Status != 5).Sum(oi => oi.Quantity)
                    })
                    .FirstOrDefaultAsync();
                if (product == null)
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại!" });
                }
                return Ok(product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Đã có lỗi xảy ra!",
                    detail = ex.Message
                });
            }
        }
    }
}
