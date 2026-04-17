using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiCart
    {
        public ApiCart()
        {
            ApiCartitems = new HashSet<ApiCartitem>();
        }

        public long Id { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public long UserId { get; set; }

        public virtual ApiUser User { get; set; } = null!;
        public virtual ICollection<ApiCartitem> ApiCartitems { get; set; }
    }
}
