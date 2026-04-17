using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiEntryform
    {
        public ApiEntryform()
        {
            ApiEntryformdetails = new HashSet<ApiEntryformdetail>();
        }

        public long Id { get; set; }
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
        public DateOnly Date { get; set; }
        public long CreatedUserId { get; set; }
        public long SupplierId { get; set; }

        public virtual ApiUser CreatedUser { get; set; } = null!;
        public virtual ApiSupplier Supplier { get; set; } = null!;
        public virtual ICollection<ApiEntryformdetail> ApiEntryformdetails { get; set; }
    }
}
