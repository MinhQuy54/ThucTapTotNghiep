using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiEntryformdetail
    {
        public long Id { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public long EntryFormId { get; set; }
        public long ProductId { get; set; }

        public virtual ApiEntryform EntryForm { get; set; } = null!;
        public virtual ApiProduct Product { get; set; } = null!;
    }
}
