from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# --- 1. Roles & Permissions ---
class Role(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True, null=True, blank=True)  
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"


# --- 2. User & Reward Points ---
class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True)
    activation_token = models.CharField(max_length=255, blank=True, null=True)
    reset_token = models.CharField(max_length=255, blank=True, null=True)

    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    email = models.EmailField(unique=True)
    
    # Tính năng tích điểm
    reward_points = models.IntegerField(default=0, help_text="Điểm tích lũy hiện tại")

    def __str__(self):
        return f"{self.username} ({self.email})"


class PointHistory(models.Model):
    class ActionType(models.TextChoices):
        EARN = 'earn', 'Tích điểm (Mua hàng)'
        REDEEM = 'redeem', 'Tiêu điểm (Đổi thưởng/Thanh toán)'
        REFUND = 'refund', 'Hoàn điểm (Hủy đơn)'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_histories')
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True)
    points = models.IntegerField(help_text="Số điểm cộng (+) hoặc trừ (-)")
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} | {self.points} pts | {self.get_action_type_display()}"


# --- 3. Shipping Address ---
class ShippingAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15)
    address = models.TextField() 
    city = models.CharField(max_length=100) 

    province_id = models.IntegerField(null=True, blank=True)
    district_id = models.IntegerField(null=True, blank=True)
    ward_code = models.CharField(max_length=20, null=True, blank=True) 
    
    default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.default:
            with transaction.atomic():
                ShippingAddress.objects.filter(user=self.user, default=True)\
                    .exclude(pk=self.pk)\
                    .update(default=False)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} - {self.city}"


# --- 4. Category & Product ---
class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=400)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    status = models.IntegerField(default=1)
    unit = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Stock: {self.stock})"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image of {self.product.name}"


# --- 5. Order & Payment ---
class Order(models.Model):
    class Status(models.IntegerChoices):
        PENDING = 1, "Chờ xác nhận"
        CONFIRMED = 2, "Đã xác nhận"
        SHIPPING = 3, "Đang giao"
        DELIVERED = 4, "Đã giao"
        CANCELLED = 5, "Đã hủy"
        REFUNDED = 6, "Hoàn trả"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    points_used = models.IntegerField(default=0, help_text="Số điểm đã dùng để thanh toán") 
    status = models.IntegerField(choices=Status.choices, default=Status.PENDING)
    shipping_address = models.ForeignKey(ShippingAddress, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.email} - {self.get_status_display()}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x{self.quantity} (Order #{self.order.id})"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    status = models.IntegerField()
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"Order #{self.order.id} - Status {self.status}"


class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=100)
    transaction_id = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.IntegerField()
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment Order #{self.order.id} - {self.amount}"


# --- 6. Cart, Review, Wishlist & Notifications ---
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='carts')
    status = models.CharField(max_length=50, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.status}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"Cart {self.cart.id} - {self.product.name} x{self.quantity}"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}⭐)"


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type}"


class Contact(models.Model):
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField()
    message = models.TextField()
    reply_content = models.TextField(blank=True, null=True) 
    is_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.email}"


# --- 7. Vouchers ---
class Voucher(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = 'percent', 'Phần trăm'
        FIXED = 'fixed', 'Số tiền'

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity = models.IntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class UserVoucher(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE)
    used_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.voucher}"


# --- 8. Inventory & Suppliers ---
class Supplier(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=11)

    def __str__(self):
        return f"{self.name} - {self.phone}"


class EntryForm(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    created_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role__name': 'Staff'},
        related_name='created_entry_forms'
    )
    status = models.CharField(max_length=50, default="Draft")
    note = models.TextField(blank=True, null=True)
    date = models.DateField()

    def __str__(self):
        return f"EntryForm #{self.id} - {self.supplier.name}"


class EntryFormDetail(models.Model):
    entry_form = models.ForeignKey(EntryForm, on_delete=models.CASCADE, related_name='details')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.product.name} x{self.quantity} (Entry #{self.entry_form.id})"


class CancelForm(models.Model):
    class ReasonChoices(models.TextChoices):
        EXPIRED = 'expired', 'Hết hạn sử dụng'
        DAMAGED = 'damaged', 'Hư hỏng/Lỗi'
        LOST = 'lost', 'Thất lạc'

    created_user = models.ForeignKey(
        User, on_delete=models.CASCADE, limit_choices_to={'role__name': 'Staff'}
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=50, choices=ReasonChoices.choices)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Hủy {self.quantity} {self.product.name} - {self.get_reason_display()}"