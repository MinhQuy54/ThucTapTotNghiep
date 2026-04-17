using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class DjangoSite
    {
        public DjangoSite()
        {
            SocialaccountSocialappSites = new HashSet<SocialaccountSocialappSite>();
        }

        public int Id { get; set; }
        public string Domain { get; set; } = null!;
        public string Name { get; set; } = null!;

        public virtual ICollection<SocialaccountSocialappSite> SocialaccountSocialappSites { get; set; }
    }
}
