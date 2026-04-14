using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiUserUserPermission
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public int PermissionId { get; set; }

        public virtual AuthPermission Permission { get; set; } = null!;
        public virtual ApiUser User { get; set; } = null!;
    }
}
