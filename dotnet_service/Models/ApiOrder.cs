using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiOrder
    {
        public ApiOrder()
        {
            ApiOrderitems = new HashSet<ApiOrderitem>();
            ApiOrderstatushistories = new HashSet<ApiOrderstatushistory>();
            ApiPayments = new HashSet<ApiPayment>();
            ApiPointhistories = new HashSet<ApiPointhistory>();
        }

        public long Id { get; set; }
        public decimal TotalPrice { get; set; }
        public int PointsUsed { get; set; }
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public long? ShippingAddressId { get; set; }
        public long UserId { get; set; }

        public virtual ApiShippingaddress? ShippingAddress { get; set; }
        public virtual ApiUser User { get; set; } = null!;
        public virtual ICollection<ApiOrderitem> ApiOrderitems { get; set; }
        public virtual ICollection<ApiOrderstatushistory> ApiOrderstatushistories { get; set; }
        public virtual ICollection<ApiPayment> ApiPayments { get; set; }
        public virtual ICollection<ApiPointhistory> ApiPointhistories { get; set; }
    }
}
