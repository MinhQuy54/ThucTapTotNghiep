using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class SocialaccountSocialapp
    {
        public SocialaccountSocialapp()
        {
            SocialaccountSocialappSites = new HashSet<SocialaccountSocialappSite>();
            SocialaccountSocialtokens = new HashSet<SocialaccountSocialtoken>();
        }

        public int Id { get; set; }
        public string Provider { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string ClientId { get; set; } = null!;
        public string Secret { get; set; } = null!;
        public string Key { get; set; } = null!;
        public string ProviderId { get; set; } = null!;
        public string Settings { get; set; } = null!;

        public virtual ICollection<SocialaccountSocialappSite> SocialaccountSocialappSites { get; set; }
        public virtual ICollection<SocialaccountSocialtoken> SocialaccountSocialtokens { get; set; }
    }
}
