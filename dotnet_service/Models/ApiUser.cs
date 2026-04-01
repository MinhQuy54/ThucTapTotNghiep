using System;
using System.Collections.Generic;

namespace dotnet_service.Models
{
    public partial class ApiUser
    {
        public ApiUser()
        {
            ApiCartitems = new HashSet<ApiCartitem>();
            ApiNotifications = new HashSet<ApiNotification>();
            ApiOrders = new HashSet<ApiOrder>();
            ApiReviews = new HashSet<ApiReview>();
            ApiShippingaddresses = new HashSet<ApiShippingaddress>();
            ApiUserGroups = new HashSet<ApiUserGroup>();
            ApiUserUserPermissions = new HashSet<ApiUserUserPermission>();
            ApiWishlists = new HashSet<ApiWishlist>();
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
        public long? RoleId { get; set; }

        public virtual ApiRole? Role { get; set; }
        public virtual ICollection<ApiCartitem> ApiCartitems { get; set; }
        public virtual ICollection<ApiNotification> ApiNotifications { get; set; }
        public virtual ICollection<ApiOrder> ApiOrders { get; set; }
        public virtual ICollection<ApiReview> ApiReviews { get; set; }
        public virtual ICollection<ApiShippingaddress> ApiShippingaddresses { get; set; }
        public virtual ICollection<ApiUserGroup> ApiUserGroups { get; set; }
        public virtual ICollection<ApiUserUserPermission> ApiUserUserPermissions { get; set; }
        public virtual ICollection<ApiWishlist> ApiWishlists { get; set; }
    }
}
