using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiOrderitem
    {
        public long Id { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public long OrderId { get; set; }
        public long ProductId { get; set; }

        public virtual ApiOrder Order { get; set; } = null!;
        public virtual ApiProduct Product { get; set; } = null!;
    }
}
