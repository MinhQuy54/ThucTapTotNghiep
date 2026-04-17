using System.Text.Json.Serialization;

namespace dotnet_service.MyModels
{
    // Class chứa dữ liệu Client gửi lên API của bạn
    public class CalculateFeeRequest
    {
        public int FromDistrictId { get; set; } = 1442; // Mặc định Quận 1
        public int ToDistrictId { get; set; } = 1454;   // Mặc định Quận 7
        public string ToWardCode { get; set; } = "21211"; // Mặc định Phường Tân Thuận Đông
        public int Weight { get; set; } = 1000;
    }
}