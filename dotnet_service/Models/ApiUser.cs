using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiUser
    {
        public ApiUser()
        {
            AccountEmailaddresses = new HashSet<AccountEmailaddress>();
            ApiCancelforms = new HashSet<ApiCancelform>();
            ApiCarts = new HashSet<ApiCart>();
            ApiEntryforms = new HashSet<ApiEntryform>();
            ApiNotifications = new HashSet<ApiNotification>();
            ApiOrders = new HashSet<ApiOrder>();
            ApiPointhistories = new HashSet<ApiPointhistory>();
            ApiReviews = new HashSet<ApiReview>();
            ApiShippingaddresses = new HashSet<ApiShippingaddress>();
            ApiUserGroups = new HashSet<ApiUserGroup>();
            ApiUserUserPermissions = new HashSet<ApiUserUserPermission>();
            ApiUservouchers = new HashSet<ApiUservoucher>();
            ApiWishlists = new HashSet<ApiWishlist>();
            DjangoAdminLogs = new HashSet<DjangoAdminLog>();
            SocialaccountSocialaccounts = new HashSet<SocialaccountSocialaccount>();
        }

        public long Id { get; set; }
        public string Password { get; set; } = null!;
        public DateTime? LastLogin { get; set; }
        public bool IsSuperuser { get; set; }
        public string Username { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public bool IsStaff { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateJoined { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Avatar { get; set; }
        public string? Address { get; set; }
        public string? GoogleId { get; set; }
        public string? ActivationToken { get; set; }
        public string? ResetToken { get; set; }
        public string Email { get; set; } = null!;
        public int RewardPoints { get; set; }
        public long? RoleId { get; set; }

        public virtual ApiRole? Role { get; set; }
        public virtual ICollection<AccountEmailaddress> AccountEmailaddresses { get; set; }
        public virtual ICollection<ApiCancelform> ApiCancelforms { get; set; }
        public virtual ICollection<ApiCart> ApiCarts { get; set; }
        public virtual ICollection<ApiEntryform> ApiEntryforms { get; set; }
        public virtual ICollection<ApiNotification> ApiNotifications { get; set; }
        public virtual ICollection<ApiOrder> ApiOrders { get; set; }
        public virtual ICollection<ApiPointhistory> ApiPointhistories { get; set; }
        public virtual ICollection<ApiReview> ApiReviews { get; set; }
        public virtual ICollection<ApiShippingaddress> ApiShippingaddresses { get; set; }
        public virtual ICollection<ApiUserGroup> ApiUserGroups { get; set; }
        public virtual ICollection<ApiUserUserPermission> ApiUserUserPermissions { get; set; }
        public virtual ICollection<ApiUservoucher> ApiUservouchers { get; set; }
        public virtual ICollection<ApiWishlist> ApiWishlists { get; set; }
        public virtual ICollection<DjangoAdminLog> DjangoAdminLogs { get; set; }
        public virtual ICollection<SocialaccountSocialaccount> SocialaccountSocialaccounts { get; set; }
    }
}
