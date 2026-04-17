using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiPointhistory
    {
        public long Id { get; set; }
        public int Points { get; set; }
        public string ActionType { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public long? OrderId { get; set; }
        public long UserId { get; set; }

        public virtual ApiOrder? Order { get; set; }
        public virtual ApiUser User { get; set; } = null!;
    }
}
