using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiContact
    {
        public long Id { get; set; }
        public string FullName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsReply { get; set; }
    }
}
