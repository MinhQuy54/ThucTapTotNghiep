from django.db import models
from django.contrib.auth.models import AbstractUser

# --- 1. Roles & Permissions ---
class Role(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Permission(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True)
    activation_token = models.CharField(max_length=255, blank=True, null=True)
    reset_token = models.CharField(max_length=255, blank=True, null=True)
    
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True)

    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username
    
class ShippingAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    city = models.CharField(max_length=100)
    default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.default:
            ShippingAddress.objects.filter(user=self.user, default=True
            ).exclude(pk=self.pk
            ).update(default=False)
        super(ShippingAddress, self).save(*args, **kwargs)


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
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.product.name

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.IntegerField(default=0)
    shipping_address = models.ForeignKey(ShippingAddress, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    status = models.IntegerField()
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=100)
    transaction_id = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.IntegerField()
    paid_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

# --- 5. Interactions & Notifications ---
class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Contact(models.Model):
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField()
    message = models.TextField()
    is_reply = models.BooleanField(default=False)