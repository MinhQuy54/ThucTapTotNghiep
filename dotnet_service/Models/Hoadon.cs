using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class Hoadon
    {
        public Hoadon()
        {
            Chitiethoadons = new HashSet<Chitiethoadon>();
        }

        public string Sohd { get; set; } = null!;
        public DateTime? Ngaylaphd { get; set; }
        public string? Tenkh { get; set; }

        public virtual ICollection<Chitiethoadon> Chitiethoadons { get; set; }
    }
}
