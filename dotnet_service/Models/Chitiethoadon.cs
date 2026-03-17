using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class Chitiethoadon
    {
        public string Sohd { get; set; } = null!;
        public string Mahang { get; set; } = null!;
        public double? Dongia { get; set; }
        public int? Soluong { get; set; }

        public virtual Hanghoa MahangNavigation { get; set; } = null!;
        public virtual Hoadon SohdNavigation { get; set; } = null!;
    }
}
