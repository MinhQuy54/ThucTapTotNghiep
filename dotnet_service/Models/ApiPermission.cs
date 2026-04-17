using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiPermission
    {
        public ApiPermission()
        {
            ApiRolepermissions = new HashSet<ApiRolepermission>();
        }

        public long Id { get; set; }
        public string? Code { get; set; }
        public string Name { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public virtual ICollection<ApiRolepermission> ApiRolepermissions { get; set; }
    }
}
