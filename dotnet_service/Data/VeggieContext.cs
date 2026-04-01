using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using dotnet_service.Models;

namespace dotnet_service.Data
{
    public partial class VeggieContext : DbContext
    {
        public VeggieContext()
        {
        }

        public VeggieContext(DbContextOptions<VeggieContext> options)
            : base(options)
        {
        }

        public virtual DbSet<ApiCartitem> ApiCartitems { get; set; } = null!;
        public virtual DbSet<ApiCategory> ApiCategories { get; set; } = null!;
        public virtual DbSet<ApiContact> ApiContacts { get; set; } = null!;
        public virtual DbSet<ApiNotification> ApiNotifications { get; set; } = null!;
        public virtual DbSet<ApiOrder> ApiOrders { get; set; } = null!;
        public virtual DbSet<ApiOrderitem> ApiOrderitems { get; set; } = null!;
        public virtual DbSet<ApiOrderstatushistory> ApiOrderstatushistories { get; set; } = null!;
        public virtual DbSet<ApiPayment> ApiPayments { get; set; } = null!;
        public virtual DbSet<ApiPermission> ApiPermissions { get; set; } = null!;
        public virtual DbSet<ApiProduct> ApiProducts { get; set; } = null!;
        public virtual DbSet<ApiProductimage> ApiProductimages { get; set; } = null!;
        public virtual DbSet<ApiReview> ApiReviews { get; set; } = null!;
        public virtual DbSet<ApiRole> ApiRoles { get; set; } = null!;
        public virtual DbSet<ApiRolepermission> ApiRolepermissions { get; set; } = null!;
        public virtual DbSet<ApiShippingaddress> ApiShippingaddresses { get; set; } = null!;
        public virtual DbSet<ApiUser> ApiUsers { get; set; } = null!;
        public virtual DbSet<ApiUserGroup> ApiUserGroups { get; set; } = null!;
        public virtual DbSet<ApiUserUserPermission> ApiUserUserPermissions { get; set; } = null!;
        public virtual DbSet<ApiWishlist> ApiWishlists { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseMySql("server=mysql_db;database=veggie_db;uid=root", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.45-mysql"));
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.UseCollation("utf8mb4_0900_ai_ci")
                .HasCharSet("utf8mb4");

            modelBuilder.Entity<ApiCartitem>(entity =>
            {
                entity.ToTable("api_cartitem");

                entity.HasIndex(e => e.ProductId, "api_cartitem_product_id_4699c5ae_fk_api_product_id");

                entity.HasIndex(e => e.UserId, "api_cartitem_user_id_ae7d9bf2_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiCartitems)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cartitem_product_id_4699c5ae_fk_api_product_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiCartitems)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cartitem_user_id_ae7d9bf2_fk_api_user_id");
            });

            modelBuilder.Entity<ApiCategory>(entity =>
            {
                entity.ToTable("api_category");

                entity.HasIndex(e => e.Slug, "slug")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Description).HasColumnName("description");

                entity.Property(e => e.Image)
                    .HasMaxLength(100)
                    .HasColumnName("image");

                entity.Property(e => e.Name)
                    .HasMaxLength(200)
                    .HasColumnName("name");

                entity.Property(e => e.Slug)
                    .HasMaxLength(50)
                    .HasColumnName("slug");

                entity.Property(e => e.UpdatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("updated_at");
            });

            modelBuilder.Entity<ApiContact>(entity =>
            {
                entity.ToTable("api_contact");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Email)
                    .HasMaxLength(254)
                    .HasColumnName("email");

                entity.Property(e => e.FullName)
                    .HasMaxLength(200)
                    .HasColumnName("full_name");

                entity.Property(e => e.IsReply).HasColumnName("is_reply");

                entity.Property(e => e.Message).HasColumnName("message");

                entity.Property(e => e.PhoneNumber)
                    .HasMaxLength(15)
                    .HasColumnName("phone_number");
            });

            modelBuilder.Entity<ApiNotification>(entity =>
            {
                entity.ToTable("api_notification");

                entity.HasIndex(e => e.UserId, "api_notification_user_id_6cede59e_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.IsRead).HasColumnName("is_read");

                entity.Property(e => e.Message).HasColumnName("message");

                entity.Property(e => e.Type)
                    .HasMaxLength(100)
                    .HasColumnName("type");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiNotifications)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_notification_user_id_6cede59e_fk_api_user_id");
            });

            modelBuilder.Entity<ApiOrder>(entity =>
            {
                entity.ToTable("api_order");

                entity.HasIndex(e => e.ShippingAddressId, "api_order_shipping_address_id_b571e7d4_fk_api_shippingaddress_id");

                entity.HasIndex(e => e.UserId, "api_order_user_id_52781ff0_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.ShippingAddressId).HasColumnName("shipping_address_id");

                entity.Property(e => e.Status).HasColumnName("status");

                entity.Property(e => e.TotalPrice)
                    .HasPrecision(12, 2)
                    .HasColumnName("total_price");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.ShippingAddress)
                    .WithMany(p => p.ApiOrders)
                    .HasForeignKey(d => d.ShippingAddressId)
                    .HasConstraintName("api_order_shipping_address_id_b571e7d4_fk_api_shippingaddress_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiOrders)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_order_user_id_52781ff0_fk_api_user_id");
            });

            modelBuilder.Entity<ApiOrderitem>(entity =>
            {
                entity.ToTable("api_orderitem");

                entity.HasIndex(e => e.OrderId, "api_orderitem_order_id_f9c0afc0_fk_api_order_id");

                entity.HasIndex(e => e.ProductId, "api_orderitem_product_id_afd9cdd0_fk_api_product_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.Price)
                    .HasPrecision(12, 2)
                    .HasColumnName("price");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.ApiOrderitems)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_orderitem_order_id_f9c0afc0_fk_api_order_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiOrderitems)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_orderitem_product_id_afd9cdd0_fk_api_product_id");
            });

            modelBuilder.Entity<ApiOrderstatushistory>(entity =>
            {
                entity.ToTable("api_orderstatushistory");

                entity.HasIndex(e => e.OrderId, "api_orderstatushistory_order_id_7af0bfce_fk_api_order_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ChangedAt)
                    .HasMaxLength(6)
                    .HasColumnName("changed_at");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Note).HasColumnName("note");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.Status).HasColumnName("status");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.ApiOrderstatushistories)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_orderstatushistory_order_id_7af0bfce_fk_api_order_id");
            });

            modelBuilder.Entity<ApiPayment>(entity =>
            {
                entity.ToTable("api_payment");

                entity.HasIndex(e => e.OrderId, "api_payment_order_id_7b6d4bf5_fk_api_order_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Amount)
                    .HasPrecision(12, 2)
                    .HasColumnName("amount");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.PaidAt)
                    .HasMaxLength(6)
                    .HasColumnName("paid_at");

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(100)
                    .HasColumnName("payment_method");

                entity.Property(e => e.Status).HasColumnName("status");

                entity.Property(e => e.TransactionId)
                    .HasMaxLength(255)
                    .HasColumnName("transaction_id");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.ApiPayments)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_payment_order_id_7b6d4bf5_fk_api_order_id");
            });

            modelBuilder.Entity<ApiPermission>(entity =>
            {
                entity.ToTable("api_permission");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Name)
                    .HasMaxLength(100)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<ApiProduct>(entity =>
            {
                entity.ToTable("api_product");

                entity.HasIndex(e => e.CategoryId, "api_product_category_id_a2b9d1e7_fk_api_category_id");

                entity.HasIndex(e => e.Slug, "slug")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CategoryId).HasColumnName("category_id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Description).HasColumnName("description");

                entity.Property(e => e.Name)
                    .HasMaxLength(400)
                    .HasColumnName("name");

                entity.Property(e => e.Price)
                    .HasPrecision(12, 2)
                    .HasColumnName("price");

                entity.Property(e => e.Slug)
                    .HasMaxLength(50)
                    .HasColumnName("slug");

                entity.Property(e => e.Status).HasColumnName("status");

                entity.Property(e => e.Stock).HasColumnName("stock");

                entity.Property(e => e.Unit)
                    .HasMaxLength(50)
                    .HasColumnName("unit");

                entity.Property(e => e.UpdatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("updated_at");

                entity.HasOne(d => d.Category)
                    .WithMany(p => p.ApiProducts)
                    .HasForeignKey(d => d.CategoryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_product_category_id_a2b9d1e7_fk_api_category_id");
            });

            modelBuilder.Entity<ApiProductimage>(entity =>
            {
                entity.ToTable("api_productimage");

                entity.HasIndex(e => e.ProductId, "api_productimage_product_id_5020b937_fk_api_product_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Image)
                    .HasMaxLength(100)
                    .HasColumnName("image");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiProductimages)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_productimage_product_id_5020b937_fk_api_product_id");
            });

            modelBuilder.Entity<ApiReview>(entity =>
            {
                entity.ToTable("api_review");

                entity.HasIndex(e => e.ProductId, "api_review_product_id_78d61c8d_fk_api_product_id");

                entity.HasIndex(e => e.UserId, "api_review_user_id_8bf97ad4_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Comment).HasColumnName("comment");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Rating).HasColumnName("rating");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiReviews)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_review_product_id_78d61c8d_fk_api_product_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiReviews)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_review_user_id_8bf97ad4_fk_api_user_id");
            });

            modelBuilder.Entity<ApiRole>(entity =>
            {
                entity.ToTable("api_role");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Name)
                    .HasMaxLength(100)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<ApiRolepermission>(entity =>
            {
                entity.ToTable("api_rolepermission");

                entity.HasIndex(e => e.PermissionId, "api_rolepermission_permission_id_48db50a2_fk_api_permission_id");

                entity.HasIndex(e => e.RoleId, "api_rolepermission_role_id_a5d996fc_fk_api_role_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.PermissionId).HasColumnName("permission_id");

                entity.Property(e => e.RoleId).HasColumnName("role_id");

                entity.HasOne(d => d.Permission)
                    .WithMany(p => p.ApiRolepermissions)
                    .HasForeignKey(d => d.PermissionId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_rolepermission_permission_id_48db50a2_fk_api_permission_id");

                entity.HasOne(d => d.Role)
                    .WithMany(p => p.ApiRolepermissions)
                    .HasForeignKey(d => d.RoleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_rolepermission_role_id_a5d996fc_fk_api_role_id");
            });

            modelBuilder.Entity<ApiShippingaddress>(entity =>
            {
                entity.ToTable("api_shippingaddress");

                entity.HasIndex(e => e.UserId, "api_shippingaddress_user_id_aab6f3a7_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Address).HasColumnName("address");

                entity.Property(e => e.City)
                    .HasMaxLength(100)
                    .HasColumnName("city");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Default).HasColumnName("default");

                entity.Property(e => e.FullName)
                    .HasMaxLength(200)
                    .HasColumnName("full_name");

                entity.Property(e => e.Phone)
                    .HasMaxLength(15)
                    .HasColumnName("phone");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiShippingaddresses)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_shippingaddress_user_id_aab6f3a7_fk_api_user_id");
            });

            modelBuilder.Entity<ApiUser>(entity =>
            {
                entity.ToTable("api_user");

                entity.HasIndex(e => e.RoleId, "api_user_role_id_0b60389b_fk_api_role_id");

                entity.HasIndex(e => e.Email, "email")
                    .IsUnique();

                entity.HasIndex(e => e.Username, "username")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ActivationToken)
                    .HasMaxLength(255)
                    .HasColumnName("activation_token");

                entity.Property(e => e.Address).HasColumnName("address");

                entity.Property(e => e.Avatar)
                    .HasMaxLength(100)
                    .HasColumnName("avatar");

                entity.Property(e => e.DateJoined)
                    .HasMaxLength(6)
                    .HasColumnName("date_joined");

                entity.Property(e => e.Email)
                    .HasMaxLength(254)
                    .HasColumnName("email");

                entity.Property(e => e.FirstName)
                    .HasMaxLength(150)
                    .HasColumnName("first_name");

                entity.Property(e => e.GoogleId)
                    .HasMaxLength(255)
                    .HasColumnName("google_id");

                entity.Property(e => e.IsActive).HasColumnName("is_active");

                entity.Property(e => e.IsStaff).HasColumnName("is_staff");

                entity.Property(e => e.IsSuperuser).HasColumnName("is_superuser");

                entity.Property(e => e.LastLogin)
                    .HasMaxLength(6)
                    .HasColumnName("last_login");

                entity.Property(e => e.LastName)
                    .HasMaxLength(150)
                    .HasColumnName("last_name");

                entity.Property(e => e.Password)
                    .HasMaxLength(128)
                    .HasColumnName("password");

                entity.Property(e => e.PhoneNumber)
                    .HasMaxLength(15)
                    .HasColumnName("phone_number");

                entity.Property(e => e.ResetToken)
                    .HasMaxLength(255)
                    .HasColumnName("reset_token");

                entity.Property(e => e.RoleId).HasColumnName("role_id");

                entity.Property(e => e.Username)
                    .HasMaxLength(150)
                    .HasColumnName("username");

                entity.HasOne(d => d.Role)
                    .WithMany(p => p.ApiUsers)
                    .HasForeignKey(d => d.RoleId)
                    .HasConstraintName("api_user_role_id_0b60389b_fk_api_role_id");
            });

            modelBuilder.Entity<ApiUserGroup>(entity =>
            {
                entity.ToTable("api_user_groups");

                entity.HasIndex(e => e.GroupId, "api_user_groups_group_id_3af85785_fk_auth_group_id");

                entity.HasIndex(e => new { e.UserId, e.GroupId }, "api_user_groups_user_id_group_id_9c7ddfb5_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.GroupId).HasColumnName("group_id");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiUserGroups)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_user_groups_user_id_a5ff39fa_fk_api_user_id");
            });

            modelBuilder.Entity<ApiUserUserPermission>(entity =>
            {
                entity.ToTable("api_user_user_permissions");

                entity.HasIndex(e => e.PermissionId, "api_user_user_permis_permission_id_305b7fea_fk_auth_perm");

                entity.HasIndex(e => new { e.UserId, e.PermissionId }, "api_user_user_permissions_user_id_permission_id_a06dd704_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.PermissionId).HasColumnName("permission_id");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiUserUserPermissions)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_user_user_permissions_user_id_f3945d65_fk_api_user_id");
            });

            modelBuilder.Entity<ApiWishlist>(entity =>
            {
                entity.ToTable("api_wishlist");

                entity.HasIndex(e => e.ProductId, "api_wishlist_product_id_14d3d351_fk_api_product_id");

                entity.HasIndex(e => e.UserId, "api_wishlist_user_id_798e25cf_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiWishlists)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_wishlist_product_id_14d3d351_fk_api_product_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiWishlists)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_wishlist_user_id_798e25cf_fk_api_user_id");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
