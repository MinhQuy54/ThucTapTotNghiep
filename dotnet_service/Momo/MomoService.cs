using dotnet_service.Models;
using dotnet_service.Momo;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using RestSharp;
using System.Security.Cryptography;
using System.Text;

namespace dotnet_service.Services.Momo
{
    public class MomoService : IMomoService
    {
        private readonly IOptions<MomoOptionModel> _options;

        public MomoService(IOptions<MomoOptionModel> options)
        {
            _options = options;
        }

        public async Task<MomoCreatePaymentResponseModel> CreatePaymentAsync(ApiOrder order)
        {
            var requestId = Guid.NewGuid().ToString();
            var orderId = order.Id.ToString() + "_" + DateTime.UtcNow.Ticks.ToString();
            var orderInfo = "Thanh toan don hang " + order.Id; // Bỏ dấu tiếng Việt để tránh lỗi format

            string amountString = ((long)order.TotalPrice).ToString(); // Chuỗi để băm chữ ký
            long amountNumber = (long)order.TotalPrice; // Số để gửi JSON

            string rawData =
                $"accessKey={_options.Value.AccessKey}&" +
                $"amount={amountString}&" +
                $"extraData=&" +
                $"ipnUrl={_options.Value.NotifyUrl}&" +
                $"orderId={orderId}&" +
                $"orderInfo={orderInfo}&" +
                $"partnerCode={_options.Value.PartnerCode}&" +
                $"redirectUrl={_options.Value.ReturnUrl}&" +
                $"requestId={requestId}&" +
                $"requestType={_options.Value.RequestType}";

            var signature = ComputeHmacSha256(rawData, _options.Value.SecretKey);

            var client = new RestClient(_options.Value.MomoApiUrl);
            var request = new RestRequest("", Method.Post);

            var requestData = new
            {
                partnerCode = _options.Value.PartnerCode,
                requestId = requestId,
                amount = amountNumber, // ĐÃ SỬA: Phải là số (long)
                orderId = orderId,
                orderInfo = orderInfo,
                redirectUrl = _options.Value.ReturnUrl,
                ipnUrl = _options.Value.NotifyUrl,
                requestType = _options.Value.RequestType,
                extraData = "",
                signature = signature,
                lang = "vi"
            };

            request.AddJsonBody(requestData);
            var response = await client.ExecuteAsync(request);

            return JsonConvert.DeserializeObject<MomoCreatePaymentResponseModel>(response.Content);
        }

        // Hàm xử lý dữ liệu khi MoMo trả về sau thanh toán
        public MomoExecuteResponseModel PaymentExecuteAsync(IQueryCollection collection)
        {
            return new MomoExecuteResponseModel()
            {
                OrderId = collection["orderId"],
                Amount = collection["amount"],
                OrderInfo = collection["orderInfo"]
            };
        }

        // Hàm băm mật mã HMACSHA256
        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            using (var hmacsha256 = new HMACSHA256(keyBytes))
            {
                var hashBytes = hmacsha256.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }
    }
}