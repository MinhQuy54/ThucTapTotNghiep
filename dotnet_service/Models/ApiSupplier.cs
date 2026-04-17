using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiSupplier
    {
        public ApiSupplier()
        {
            ApiEntryforms = new HashSet<ApiEntryform>();
        }

        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Phone { get; set; } = null!;

        public virtual ICollection<ApiEntryform> ApiEntryforms { get; set; }
    }
}
