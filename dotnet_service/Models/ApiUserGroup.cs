using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiUserGroup
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public int GroupId { get; set; }

        public virtual AuthGroup Group { get; set; } = null!;
        public virtual ApiUser User { get; set; } = null!;
    }
}
