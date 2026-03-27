using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiProductimage
    {
        public long Id { get; set; }
        public string Image { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public long ProductId { get; set; }

        public virtual ApiProduct Product { get; set; } = null!;
    }
}
