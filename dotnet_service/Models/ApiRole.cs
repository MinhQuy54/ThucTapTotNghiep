using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiRole
    {
        public ApiRole()
        {
            ApiRolepermissions = new HashSet<ApiRolepermission>();
            ApiUsers = new HashSet<ApiUser>();
        }

        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public virtual ICollection<ApiRolepermission> ApiRolepermissions { get; set; }
        public virtual ICollection<ApiUser> ApiUsers { get; set; }
    }
}
