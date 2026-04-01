using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiProduct
    {
        public ApiProduct()
        {
            ApiCartitems = new HashSet<ApiCartitem>();
            ApiOrderitems = new HashSet<ApiOrderitem>();
            ApiProductimages = new HashSet<ApiProductimage>();
            ApiReviews = new HashSet<ApiReview>();
            ApiWishlists = new HashSet<ApiWishlist>();
        }

        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int Status { get; set; }
        public string Unit { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public long CategoryId { get; set; }

        public virtual ApiCategory Category { get; set; } = null!;
        public virtual ICollection<ApiCartitem> ApiCartitems { get; set; }
        public virtual ICollection<ApiOrderitem> ApiOrderitems { get; set; }
        public virtual ICollection<ApiProductimage> ApiProductimages { get; set; }
        public virtual ICollection<ApiReview> ApiReviews { get; set; }
        public virtual ICollection<ApiWishlist> ApiWishlists { get; set; }
    }
}
