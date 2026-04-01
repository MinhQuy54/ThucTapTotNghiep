using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiNotification
    {
        public long Id { get; set; }
        public string Type { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public long UserId { get; set; }

        public virtual ApiUser User { get; set; } = null!;
    }
}
