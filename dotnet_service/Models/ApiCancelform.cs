using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiCancelform
    {
        public long Id { get; set; }
        public int Quantity { get; set; }
        public string Reason { get; set; } = null!;
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public long CreatedUserId { get; set; }
        public long ProductId { get; set; }

        public virtual ApiUser CreatedUser { get; set; } = null!;
        public virtual ApiProduct Product { get; set; } = null!;
    }
}
