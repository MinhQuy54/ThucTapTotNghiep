using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiShippingaddress
    {
        public ApiShippingaddress()
        {
            ApiOrders = new HashSet<ApiOrder>();
        }

        public long Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string City { get; set; } = null!;
        public bool Default { get; set; }
        public DateTime CreatedAt { get; set; }
        public long UserId { get; set; }

        public virtual ApiUser User { get; set; } = null!;
        public virtual ICollection<ApiOrder> ApiOrders { get; set; }
    }
}
