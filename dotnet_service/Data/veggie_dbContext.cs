using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using dotnet_service.Models;

namespace dotnet_service.Data
{
    public partial class veggie_dbContext : DbContext
    {
        public veggie_dbContext()
        {
        }

        public veggie_dbContext(DbContextOptions<veggie_dbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<AccountEmailaddress> AccountEmailaddresses { get; set; } = null!;
        public virtual DbSet<AccountEmailconfirmation> AccountEmailconfirmations { get; set; } = null!;
        public virtual DbSet<ApiCancelform> ApiCancelforms { get; set; } = null!;
        public virtual DbSet<ApiCart> ApiCarts { get; set; } = null!;
        public virtual DbSet<ApiCartitem> ApiCartitems { get; set; } = null!;
        public virtual DbSet<ApiCategory> ApiCategories { get; set; } = null!;
        public virtual DbSet<ApiContact> ApiContacts { get; set; } = null!;
        public virtual DbSet<ApiEntryform> ApiEntryforms { get; set; } = null!;
        public virtual DbSet<ApiEntryformdetail> ApiEntryformdetails { get; set; } = null!;
        public virtual DbSet<ApiNotification> ApiNotifications { get; set; } = null!;
        public virtual DbSet<ApiOrder> ApiOrders { get; set; } = null!;
        public virtual DbSet<ApiOrderitem> ApiOrderitems { get; set; } = null!;
        public virtual DbSet<ApiOrderstatushistory> ApiOrderstatushistories { get; set; } = null!;
        public virtual DbSet<ApiPayment> ApiPayments { get; set; } = null!;
        public virtual DbSet<ApiPermission> ApiPermissions { get; set; } = null!;
        public virtual DbSet<ApiPointhistory> ApiPointhistories { get; set; } = null!;
        public virtual DbSet<ApiProduct> ApiProducts { get; set; } = null!;
        public virtual DbSet<ApiProductimage> ApiProductimages { get; set; } = null!;
        public virtual DbSet<ApiReview> ApiReviews { get; set; } = null!;
        public virtual DbSet<ApiRole> ApiRoles { get; set; } = null!;
        public virtual DbSet<ApiRolepermission> ApiRolepermissions { get; set; } = null!;
        public virtual DbSet<ApiShippingaddress> ApiShippingaddresses { get; set; } = null!;
        public virtual DbSet<ApiSupplier> ApiSuppliers { get; set; } = null!;
        public virtual DbSet<ApiUser> ApiUsers { get; set; } = null!;
        public virtual DbSet<ApiUserGroup> ApiUserGroups { get; set; } = null!;
        public virtual DbSet<ApiUserUserPermission> ApiUserUserPermissions { get; set; } = null!;
        public virtual DbSet<ApiUservoucher> ApiUservouchers { get; set; } = null!;
        public virtual DbSet<ApiVoucher> ApiVouchers { get; set; } = null!;
        public virtual DbSet<ApiWishlist> ApiWishlists { get; set; } = null!;
        public virtual DbSet<AuthGroup> AuthGroups { get; set; } = null!;
        public virtual DbSet<AuthGroupPermission> AuthGroupPermissions { get; set; } = null!;
        public virtual DbSet<AuthPermission> AuthPermissions { get; set; } = null!;
        public virtual DbSet<DjangoAdminLog> DjangoAdminLogs { get; set; } = null!;
        public virtual DbSet<DjangoContentType> DjangoContentTypes { get; set; } = null!;
        public virtual DbSet<DjangoMigration> DjangoMigrations { get; set; } = null!;
        public virtual DbSet<DjangoSession> DjangoSessions { get; set; } = null!;
        public virtual DbSet<DjangoSite> DjangoSites { get; set; } = null!;
        public virtual DbSet<SocialaccountSocialaccount> SocialaccountSocialaccounts { get; set; } = null!;
        public virtual DbSet<SocialaccountSocialapp> SocialaccountSocialapps { get; set; } = null!;
        public virtual DbSet<SocialaccountSocialappSite> SocialaccountSocialappSites { get; set; } = null!;
        public virtual DbSet<SocialaccountSocialtoken> SocialaccountSocialtokens { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseMySql("server=mysql_db;port=3306;database=veggie_db;user=root", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.45-mysql"));
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.UseCollation("utf8mb4_0900_ai_ci")
                .HasCharSet("utf8mb4");

            modelBuilder.Entity<AccountEmailaddress>(entity =>
            {
                entity.ToTable("account_emailaddress");

                entity.HasIndex(e => e.Email, "account_emailaddress_email_03be32b2");

                entity.HasIndex(e => new { e.UserId, e.Email }, "account_emailaddress_user_id_email_987c8728_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Email)
                    .HasMaxLength(254)
                    .HasColumnName("email");

                entity.Property(e => e.Primary).HasColumnName("primary");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.Property(e => e.Verified).HasColumnName("verified");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.AccountEmailaddresses)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("account_emailaddress_user_id_2c513194_fk_api_user_id");
            });

            modelBuilder.Entity<AccountEmailconfirmation>(entity =>
            {
                entity.ToTable("account_emailconfirmation");

                entity.HasIndex(e => e.EmailAddressId, "account_emailconfirm_email_address_id_5b7f8c58_fk_account_e");

                entity.HasIndex(e => e.Key, "key")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Created)
                    .HasMaxLength(6)
                    .HasColumnName("created");

                entity.Property(e => e.EmailAddressId).HasColumnName("email_address_id");

                entity.Property(e => e.Key)
                    .HasMaxLength(64)
                    .HasColumnName("key");

                entity.Property(e => e.Sent)
                    .HasMaxLength(6)
                    .HasColumnName("sent");

                entity.HasOne(d => d.EmailAddress)
                    .WithMany(p => p.AccountEmailconfirmations)
                    .HasForeignKey(d => d.EmailAddressId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("account_emailconfirm_email_address_id_5b7f8c58_fk_account_e");
            });

            modelBuilder.Entity<ApiCancelform>(entity =>
            {
                entity.ToTable("api_cancelform");

                entity.HasIndex(e => e.CreatedUserId, "api_cancelform_created_user_id_25d7e957_fk_api_user_id");

                entity.HasIndex(e => e.ProductId, "api_cancelform_product_id_1a8acf57_fk_api_product_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.CreatedUserId).HasColumnName("created_user_id");

                entity.Property(e => e.Note).HasColumnName("note");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.Property(e => e.Reason)
                    .HasMaxLength(50)
                    .HasColumnName("reason");

                entity.HasOne(d => d.CreatedUser)
                    .WithMany(p => p.ApiCancelforms)
                    .HasForeignKey(d => d.CreatedUserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cancelform_created_user_id_25d7e957_fk_api_user_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiCancelforms)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cancelform_product_id_1a8acf57_fk_api_product_id");
            });

            modelBuilder.Entity<ApiCart>(entity =>
            {
                entity.ToTable("api_cart");

                entity.HasIndex(e => e.UserId, "api_cart_user_id_79972181_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasColumnName("status");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiCarts)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cart_user_id_79972181_fk_api_user_id");
            });

            modelBuilder.Entity<ApiCartitem>(entity =>
            {
                entity.ToTable("api_cartitem");

                entity.HasIndex(e => e.CartId, "api_cartitem_cart_id_26c2013b_fk_api_cart_id");

                entity.HasIndex(e => e.ProductId, "api_cartitem_product_id_4699c5ae_fk_api_product_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CartId).HasColumnName("cart_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.HasOne(d => d.Cart)
                    .WithMany(p => p.ApiCartitems)
                    .HasForeignKey(d => d.CartId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cartitem_cart_id_26c2013b_fk_api_cart_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiCartitems)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_cartitem_product_id_4699c5ae_fk_api_product_id");
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

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

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

                entity.Property(e => e.ReplyContent).HasColumnName("reply_content");
            });

            modelBuilder.Entity<ApiEntryform>(entity =>
            {
                entity.ToTable("api_entryform");

                entity.HasIndex(e => e.CreatedUserId, "api_entryform_created_user_id_2d8af901_fk_api_user_id");

                entity.HasIndex(e => e.SupplierId, "api_entryform_supplier_id_35637038_fk_api_supplier_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.CreatedUserId).HasColumnName("created_user_id");

                entity.Property(e => e.Date).HasColumnName("date");

                entity.Property(e => e.Note).HasColumnName("note");

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasColumnName("status");

                entity.Property(e => e.SupplierId).HasColumnName("supplier_id");

                entity.HasOne(d => d.CreatedUser)
                    .WithMany(p => p.ApiEntryforms)
                    .HasForeignKey(d => d.CreatedUserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_entryform_created_user_id_2d8af901_fk_api_user_id");

                entity.HasOne(d => d.Supplier)
                    .WithMany(p => p.ApiEntryforms)
                    .HasForeignKey(d => d.SupplierId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_entryform_supplier_id_35637038_fk_api_supplier_id");
            });

            modelBuilder.Entity<ApiEntryformdetail>(entity =>
            {
                entity.ToTable("api_entryformdetail");

                entity.HasIndex(e => e.EntryFormId, "api_entryformdetail_entry_form_id_65530eea_fk_api_entryform_id");

                entity.HasIndex(e => e.ProductId, "api_entryformdetail_product_id_f9498c96_fk_api_product_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.EntryFormId).HasColumnName("entry_form_id");

                entity.Property(e => e.Price)
                    .HasPrecision(12, 2)
                    .HasColumnName("price");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.HasOne(d => d.EntryForm)
                    .WithMany(p => p.ApiEntryformdetails)
                    .HasForeignKey(d => d.EntryFormId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_entryformdetail_entry_form_id_65530eea_fk_api_entryform_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ApiEntryformdetails)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_entryformdetail_product_id_f9498c96_fk_api_product_id");
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

                entity.Property(e => e.PointsUsed).HasColumnName("points_used");

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

                entity.HasIndex(e => e.Code, "code")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Code)
                    .HasMaxLength(100)
                    .HasColumnName("code");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Name)
                    .HasMaxLength(100)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<ApiPointhistory>(entity =>
            {
                entity.ToTable("api_pointhistory");

                entity.HasIndex(e => e.OrderId, "api_pointhistory_order_id_9f9443d8_fk_api_order_id");

                entity.HasIndex(e => e.UserId, "api_pointhistory_user_id_3e281cdd_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ActionType)
                    .HasMaxLength(20)
                    .HasColumnName("action_type");

                entity.Property(e => e.CreatedAt)
                    .HasMaxLength(6)
                    .HasColumnName("created_at");

                entity.Property(e => e.Description).HasColumnName("description");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.Points).HasColumnName("points");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.ApiPointhistories)
                    .HasForeignKey(d => d.OrderId)
                    .HasConstraintName("api_pointhistory_order_id_9f9443d8_fk_api_order_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiPointhistories)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_pointhistory_user_id_3e281cdd_fk_api_user_id");
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

                entity.Property(e => e.WeightGram).HasColumnName("weight_gram");

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

                entity.Property(e => e.DistrictId).HasColumnName("district_id");

                entity.Property(e => e.FullName)
                    .HasMaxLength(200)
                    .HasColumnName("full_name");

                entity.Property(e => e.Phone)
                    .HasMaxLength(15)
                    .HasColumnName("phone");

                entity.Property(e => e.ProvinceId).HasColumnName("province_id");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.Property(e => e.WardCode)
                    .HasMaxLength(20)
                    .HasColumnName("ward_code");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiShippingaddresses)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_shippingaddress_user_id_aab6f3a7_fk_api_user_id");
            });

            modelBuilder.Entity<ApiSupplier>(entity =>
            {
                entity.ToTable("api_supplier");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.Phone)
                    .HasMaxLength(11)
                    .HasColumnName("phone");
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

                entity.Property(e => e.RewardPoints).HasColumnName("reward_points");

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

                entity.HasOne(d => d.Group)
                    .WithMany(p => p.ApiUserGroups)
                    .HasForeignKey(d => d.GroupId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_user_groups_group_id_3af85785_fk_auth_group_id");

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

                entity.HasOne(d => d.Permission)
                    .WithMany(p => p.ApiUserUserPermissions)
                    .HasForeignKey(d => d.PermissionId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_user_user_permis_permission_id_305b7fea_fk_auth_perm");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiUserUserPermissions)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_user_user_permissions_user_id_f3945d65_fk_api_user_id");
            });

            modelBuilder.Entity<ApiUservoucher>(entity =>
            {
                entity.ToTable("api_uservoucher");

                entity.HasIndex(e => e.UserId, "api_uservoucher_user_id_af4ac5e4_fk_api_user_id");

                entity.HasIndex(e => e.VoucherId, "api_uservoucher_voucher_id_5e480dc7_fk_api_voucher_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.UsedAt)
                    .HasMaxLength(6)
                    .HasColumnName("used_at");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.Property(e => e.VoucherId).HasColumnName("voucher_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ApiUservouchers)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_uservoucher_user_id_af4ac5e4_fk_api_user_id");

                entity.HasOne(d => d.Voucher)
                    .WithMany(p => p.ApiUservouchers)
                    .HasForeignKey(d => d.VoucherId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("api_uservoucher_voucher_id_5e480dc7_fk_api_voucher_id");
            });

            modelBuilder.Entity<ApiVoucher>(entity =>
            {
                entity.ToTable("api_voucher");

                entity.HasIndex(e => e.Code, "code")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Code)
                    .HasMaxLength(50)
                    .HasColumnName("code");

                entity.Property(e => e.DiscountType)
                    .HasMaxLength(10)
                    .HasColumnName("discount_type");

                entity.Property(e => e.DiscountValue)
                    .HasPrecision(10, 2)
                    .HasColumnName("discount_value");

                entity.Property(e => e.EndDate)
                    .HasMaxLength(6)
                    .HasColumnName("end_date");

                entity.Property(e => e.IsActive).HasColumnName("is_active");

                entity.Property(e => e.MaxDiscount)
                    .HasPrecision(10, 2)
                    .HasColumnName("max_discount");

                entity.Property(e => e.MinOrderValue)
                    .HasPrecision(10, 2)
                    .HasColumnName("min_order_value");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.Property(e => e.StartDate)
                    .HasMaxLength(6)
                    .HasColumnName("start_date");
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

            modelBuilder.Entity<AuthGroup>(entity =>
            {
                entity.ToTable("auth_group");

                entity.HasIndex(e => e.Name, "name")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Name)
                    .HasMaxLength(150)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<AuthGroupPermission>(entity =>
            {
                entity.ToTable("auth_group_permissions");

                entity.HasIndex(e => e.PermissionId, "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm");

                entity.HasIndex(e => new { e.GroupId, e.PermissionId }, "auth_group_permissions_group_id_permission_id_0cd325b0_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.GroupId).HasColumnName("group_id");

                entity.Property(e => e.PermissionId).HasColumnName("permission_id");

                entity.HasOne(d => d.Group)
                    .WithMany(p => p.AuthGroupPermissions)
                    .HasForeignKey(d => d.GroupId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("auth_group_permissions_group_id_b120cbf9_fk_auth_group_id");

                entity.HasOne(d => d.Permission)
                    .WithMany(p => p.AuthGroupPermissions)
                    .HasForeignKey(d => d.PermissionId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("auth_group_permissio_permission_id_84c5c92e_fk_auth_perm");
            });

            modelBuilder.Entity<AuthPermission>(entity =>
            {
                entity.ToTable("auth_permission");

                entity.HasIndex(e => new { e.ContentTypeId, e.Codename }, "auth_permission_content_type_id_codename_01ab375a_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Codename)
                    .HasMaxLength(100)
                    .HasColumnName("codename");

                entity.Property(e => e.ContentTypeId).HasColumnName("content_type_id");

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.HasOne(d => d.ContentType)
                    .WithMany(p => p.AuthPermissions)
                    .HasForeignKey(d => d.ContentTypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("auth_permission_content_type_id_2f476e4b_fk_django_co");
            });

            modelBuilder.Entity<DjangoAdminLog>(entity =>
            {
                entity.ToTable("django_admin_log");

                entity.HasIndex(e => e.ContentTypeId, "django_admin_log_content_type_id_c4bce8eb_fk_django_co");

                entity.HasIndex(e => e.UserId, "django_admin_log_user_id_c564eba6_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ActionFlag).HasColumnName("action_flag");

                entity.Property(e => e.ActionTime)
                    .HasMaxLength(6)
                    .HasColumnName("action_time");

                entity.Property(e => e.ChangeMessage).HasColumnName("change_message");

                entity.Property(e => e.ContentTypeId).HasColumnName("content_type_id");

                entity.Property(e => e.ObjectId).HasColumnName("object_id");

                entity.Property(e => e.ObjectRepr)
                    .HasMaxLength(200)
                    .HasColumnName("object_repr");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.ContentType)
                    .WithMany(p => p.DjangoAdminLogs)
                    .HasForeignKey(d => d.ContentTypeId)
                    .HasConstraintName("django_admin_log_content_type_id_c4bce8eb_fk_django_co");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.DjangoAdminLogs)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("django_admin_log_user_id_c564eba6_fk_api_user_id");
            });

            modelBuilder.Entity<DjangoContentType>(entity =>
            {
                entity.ToTable("django_content_type");

                entity.HasIndex(e => new { e.AppLabel, e.Model }, "django_content_type_app_label_model_76bd3d3b_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.AppLabel)
                    .HasMaxLength(100)
                    .HasColumnName("app_label");

                entity.Property(e => e.Model)
                    .HasMaxLength(100)
                    .HasColumnName("model");
            });

            modelBuilder.Entity<DjangoMigration>(entity =>
            {
                entity.ToTable("django_migrations");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.App)
                    .HasMaxLength(255)
                    .HasColumnName("app");

                entity.Property(e => e.Applied)
                    .HasMaxLength(6)
                    .HasColumnName("applied");

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<DjangoSession>(entity =>
            {
                entity.HasKey(e => e.SessionKey)
                    .HasName("PRIMARY");

                entity.ToTable("django_session");

                entity.HasIndex(e => e.ExpireDate, "django_session_expire_date_a5c62663");

                entity.Property(e => e.SessionKey)
                    .HasMaxLength(40)
                    .HasColumnName("session_key");

                entity.Property(e => e.ExpireDate)
                    .HasMaxLength(6)
                    .HasColumnName("expire_date");

                entity.Property(e => e.SessionData).HasColumnName("session_data");
            });

            modelBuilder.Entity<DjangoSite>(entity =>
            {
                entity.ToTable("django_site");

                entity.HasIndex(e => e.Domain, "django_site_domain_a2e37b91_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Domain)
                    .HasMaxLength(100)
                    .HasColumnName("domain");

                entity.Property(e => e.Name)
                    .HasMaxLength(50)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<SocialaccountSocialaccount>(entity =>
            {
                entity.ToTable("socialaccount_socialaccount");

                entity.HasIndex(e => new { e.Provider, e.Uid }, "socialaccount_socialaccount_provider_uid_fc810c6e_uniq")
                    .IsUnique();

                entity.HasIndex(e => e.UserId, "socialaccount_socialaccount_user_id_8146e70c_fk_api_user_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.DateJoined)
                    .HasMaxLength(6)
                    .HasColumnName("date_joined");

                entity.Property(e => e.ExtraData)
                    .HasColumnType("json")
                    .HasColumnName("extra_data");

                entity.Property(e => e.LastLogin)
                    .HasMaxLength(6)
                    .HasColumnName("last_login");

                entity.Property(e => e.Provider)
                    .HasMaxLength(200)
                    .HasColumnName("provider");

                entity.Property(e => e.Uid)
                    .HasMaxLength(191)
                    .HasColumnName("uid");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.SocialaccountSocialaccounts)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("socialaccount_socialaccount_user_id_8146e70c_fk_api_user_id");
            });

            modelBuilder.Entity<SocialaccountSocialapp>(entity =>
            {
                entity.ToTable("socialaccount_socialapp");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ClientId)
                    .HasMaxLength(191)
                    .HasColumnName("client_id");

                entity.Property(e => e.Key)
                    .HasMaxLength(191)
                    .HasColumnName("key");

                entity.Property(e => e.Name)
                    .HasMaxLength(40)
                    .HasColumnName("name");

                entity.Property(e => e.Provider)
                    .HasMaxLength(30)
                    .HasColumnName("provider");

                entity.Property(e => e.ProviderId)
                    .HasMaxLength(200)
                    .HasColumnName("provider_id");

                entity.Property(e => e.Secret)
                    .HasMaxLength(191)
                    .HasColumnName("secret");

                entity.Property(e => e.Settings)
                    .HasColumnType("json")
                    .HasColumnName("settings")
                    .HasDefaultValueSql("_utf8mb3\\'{}\\'");
            });

            modelBuilder.Entity<SocialaccountSocialappSite>(entity =>
            {
                entity.ToTable("socialaccount_socialapp_sites");

                entity.HasIndex(e => e.SiteId, "socialaccount_socialapp_sites_site_id_2579dee5_fk_django_site_id");

                entity.HasIndex(e => new { e.SocialappId, e.SiteId }, "socialaccount_socialapp_sites_socialapp_id_site_id_71a9a768_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.SiteId).HasColumnName("site_id");

                entity.Property(e => e.SocialappId).HasColumnName("socialapp_id");

                entity.HasOne(d => d.Site)
                    .WithMany(p => p.SocialaccountSocialappSites)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("socialaccount_socialapp_sites_site_id_2579dee5_fk_django_site_id");

                entity.HasOne(d => d.Socialapp)
                    .WithMany(p => p.SocialaccountSocialappSites)
                    .HasForeignKey(d => d.SocialappId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("socialaccount_social_socialapp_id_97fb6e7d_fk_socialacc");
            });

            modelBuilder.Entity<SocialaccountSocialtoken>(entity =>
            {
                entity.ToTable("socialaccount_socialtoken");

                entity.HasIndex(e => e.AccountId, "socialaccount_social_account_id_951f210e_fk_socialacc");

                entity.HasIndex(e => new { e.AppId, e.AccountId }, "socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.AccountId).HasColumnName("account_id");

                entity.Property(e => e.AppId).HasColumnName("app_id");

                entity.Property(e => e.ExpiresAt)
                    .HasMaxLength(6)
                    .HasColumnName("expires_at");

                entity.Property(e => e.Token).HasColumnName("token");

                entity.Property(e => e.TokenSecret).HasColumnName("token_secret");

                entity.HasOne(d => d.Account)
                    .WithMany(p => p.SocialaccountSocialtokens)
                    .HasForeignKey(d => d.AccountId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("socialaccount_social_account_id_951f210e_fk_socialacc");

                entity.HasOne(d => d.App)
                    .WithMany(p => p.SocialaccountSocialtokens)
                    .HasForeignKey(d => d.AppId)
                    .HasConstraintName("socialaccount_social_app_id_636a42d7_fk_socialacc");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
