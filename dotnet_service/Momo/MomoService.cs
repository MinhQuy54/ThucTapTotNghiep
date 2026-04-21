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
            // Rút ngắn orderId - Momo yêu cầu <= 40 ký tự
            var orderId = $"ORD{order.Id}_{DateTime.Now.Ticks % 1000000}";
            var orderInfo = $"Thanh toan don hang {order.Id}";

            // Chuyển về dạng số nguyên và loại bỏ decimals nếu có
            long amountNumber = (long)Math.Ceiling(order.TotalPrice);
            
            if (amountNumber <= 0)
            {
                return new MomoCreatePaymentResponseModel
                {
                    ResultCode = -1,
                    Message = "Invalid amount"
                };
            }

            string amountString = amountNumber.ToString();

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
                amount = amountNumber,
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

            return JsonConvert.DeserializeObject<MomoCreatePaymentResponseModel>(response.Content) ?? 
                   new MomoCreatePaymentResponseModel 
                   { 
                       ResultCode = -1, 
                       Message = "Empty response from Momo" 
                   };
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