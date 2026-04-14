namespace dotnet_service.MyModels
{
    public class CProduct
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int Status { get; set; }
        public string Unit { get; set; } = null!;
        public int WeightGram { get; set; }
        public long CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
    }
}
