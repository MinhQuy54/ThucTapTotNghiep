namespace dotnet_service.MyModels
{
    public class UserVoucher
    {
        public long Id { get; set; }
        public string Code { get; set; }
        public string DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal MinOrderValue { get; set; }
        public decimal? MaxDiscount { get; set; }
        public DateTime EndDate { get; set; }
        public long UserVoucherId { get; set; }
    }
}
