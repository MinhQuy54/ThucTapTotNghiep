using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using dotnet_service.MyModels;

namespace dotnet_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GhnShippingController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GhnShippingController(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        [HttpPost("calculate-fee")]
        public async Task<IActionResult> CalculateFee([FromBody] CalculateFeeRequest request)
        {
            var apiToken = _configuration["GHN_Config:ApiToken"];
            var shopId = _configuration["GHN_Config:ShopId"];
            var ghnApiUrl = _configuration["GHN_Config:ApiUrl"];

            if (string.IsNullOrEmpty(apiToken) || string.IsNullOrEmpty(shopId))
            {
                return StatusCode(500, new { Message = "Chưa cấu hình API Token hoặc Shop ID của GHN trong appsettings." });
            }

            var payload = new
            {
                service_type_id = 2,
                coupon = (string)null,
                from_district_id = request.FromDistrictId,
                to_district_id = request.ToDistrictId,
                to_ward_code = request.ToWardCode,
                weight = request.Weight
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Token", apiToken);
            _httpClient.DefaultRequestHeaders.Add("ShopId", shopId);

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(ghnApiUrl, content);
                var responseData = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var jsonResult = JsonSerializer.Deserialize<object>(responseData);
                    return Ok(jsonResult); 
                }
                
                return BadRequest(new 
                { 
                    Message = "GHN từ chối yêu cầu.", 
                    GhnError = JsonSerializer.Deserialize<object>(responseData) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống khi gọi GHN API", Error = ex.Message });
            }
        }
    }
}