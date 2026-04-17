using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiCartitem
    {
        public long Id { get; set; }
        public int Quantity { get; set; }
        public long CartId { get; set; }
        public long ProductId { get; set; }

        public virtual ApiCart Cart { get; set; } = null!;
        public virtual ApiProduct Product { get; set; } = null!;
    }
}
