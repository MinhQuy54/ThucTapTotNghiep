using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiRolepermission
    {
        public long Id { get; set; }
        public long PermissionId { get; set; }
        public long RoleId { get; set; }

        public virtual ApiPermission Permission { get; set; } = null!;
        public virtual ApiRole Role { get; set; } = null!;
    }
}
