using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class AuthPermission
    {
        public AuthPermission()
        {
            ApiUserUserPermissions = new HashSet<ApiUserUserPermission>();
            AuthGroupPermissions = new HashSet<AuthGroupPermission>();
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int ContentTypeId { get; set; }
        public string Codename { get; set; } = null!;

        public virtual DjangoContentType ContentType { get; set; } = null!;
        public virtual ICollection<ApiUserUserPermission> ApiUserUserPermissions { get; set; }
        public virtual ICollection<AuthGroupPermission> AuthGroupPermissions { get; set; }
    }
}
