using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiCategory
    {
        public ApiCategory()
        {
            ApiProducts = new HashSet<ApiProduct>();
        }

        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Image { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual ICollection<ApiProduct> ApiProducts { get; set; }
    }
}
