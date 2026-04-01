using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiOrderstatushistory
    {
        public long Id { get; set; }
        public int Status { get; set; }
        public DateTime ChangedAt { get; set; }
        public string Note { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public long OrderId { get; set; }

        public virtual ApiOrder Order { get; set; } = null!;
    }
}
