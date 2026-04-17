using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class SocialaccountSocialaccount
    {
        public SocialaccountSocialaccount()
        {
            SocialaccountSocialtokens = new HashSet<SocialaccountSocialtoken>();
        }

        public int Id { get; set; }
        public string Provider { get; set; } = null!;
        public string Uid { get; set; } = null!;
        public DateTime LastLogin { get; set; }
        public DateTime DateJoined { get; set; }
        public string ExtraData { get; set; } = null!;
        public long UserId { get; set; }

        public virtual ApiUser User { get; set; } = null!;
        public virtual ICollection<SocialaccountSocialtoken> SocialaccountSocialtokens { get; set; }
    }
}
