using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class AccountEmailaddress
    {
        public AccountEmailaddress()
        {
            AccountEmailconfirmations = new HashSet<AccountEmailconfirmation>();
        }

        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public bool Verified { get; set; }
        public bool Primary { get; set; }
        public long UserId { get; set; }

        public virtual ApiUser User { get; set; } = null!;
        public virtual ICollection<AccountEmailconfirmation> AccountEmailconfirmations { get; set; }
    }
}
