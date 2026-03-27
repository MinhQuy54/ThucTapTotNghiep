using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiPayment
    {
        public long Id { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public string TransactionId { get; set; } = null!;
        public decimal Amount { get; set; }
        public int Status { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public long OrderId { get; set; }

        public virtual ApiOrder Order { get; set; } = null!;
    }
}
