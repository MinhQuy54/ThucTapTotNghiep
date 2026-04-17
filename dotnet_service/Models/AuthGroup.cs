using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class AuthGroup
    {
        public AuthGroup()
        {
            ApiUserGroups = new HashSet<ApiUserGroup>();
            AuthGroupPermissions = new HashSet<AuthGroupPermission>();
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<ApiUserGroup> ApiUserGroups { get; set; }
        public virtual ICollection<AuthGroupPermission> AuthGroupPermissions { get; set; }
    }
}
