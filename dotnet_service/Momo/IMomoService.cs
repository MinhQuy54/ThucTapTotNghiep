using dotnet_service.Models;
using dotnet_service.Momo;

namespace dotnet_service.Services.Momo
{
    public interface IMomoService
    {
        Task<MomoCreatePaymentResponseModel> CreatePaymentAsync(ApiOrder order);
        MomoExecuteResponseModel PaymentExecuteAsync(IQueryCollection collection);
    }
}