namespace dotnet_service.MyModels
{
    public class ProductFilter
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 9;
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? Ordering { get; set; }
    }
}
