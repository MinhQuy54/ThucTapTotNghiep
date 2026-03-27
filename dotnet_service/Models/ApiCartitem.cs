using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiCartitem
    {
        public long Id { get; set; }
        public int Quantity { get; set; }
        public long ProductId { get; set; }
        public long UserId { get; set; }

        public virtual ApiProduct Product { get; set; } = null!;
        public virtual ApiUser User { get; set; } = null!;
    }
}
