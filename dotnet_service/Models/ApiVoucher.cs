using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiVoucher
    {
        public ApiVoucher()
        {
            ApiUservouchers = new HashSet<ApiUservoucher>();
        }

        public long Id { get; set; }
        public string Code { get; set; } = null!;
        public string DiscountType { get; set; } = null!;
        public decimal DiscountValue { get; set; }
        public decimal MinOrderValue { get; set; }
        public decimal? MaxDiscount { get; set; }
        public int Quantity { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }

        public virtual ICollection<ApiUservoucher> ApiUservouchers { get; set; }
    }
}
