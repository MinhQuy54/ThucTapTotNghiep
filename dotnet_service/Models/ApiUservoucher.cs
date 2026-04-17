using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiUservoucher
    {
        public long Id { get; set; }
        public DateTime UsedAt { get; set; }
        public long UserId { get; set; }
        public long VoucherId { get; set; }

        public virtual ApiUser User { get; set; } = null!;
        public virtual ApiVoucher Voucher { get; set; } = null!;
    }
}
