namespace dotnet_service.MyModels
{
    public class CheckoutRequest
    {
        public long AddressId { get; set; }
        public decimal ShippingFee { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public string? VoucherCode { get; set; }
    }
}
