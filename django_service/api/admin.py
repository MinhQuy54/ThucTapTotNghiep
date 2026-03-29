from django.contrib import admin
from django.db.models import Sum
from .models import *

# api/admin.py
from django.db.models import Count, Sum # Đảm bảo có Count ở đây

class VeggieAdminSite(admin.AdminSite):
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # 1. Lấy các thông số tổng quan
        extra_context['total_orders'] = Order.objects.count()
        revenue = Order.objects.filter(status=1).aggregate(Sum('total_price'))['total_price__sum']
        extra_context['total_revenue'] = revenue if revenue else 0
        extra_context['low_stock'] = Product.objects.filter(stock__lt=10).count()
        extra_context['new_contacts'] = Contact.objects.filter(is_reply=False).count()
        
        # 2. CHÈN THÊM ĐOẠN NÀY: Lấy dữ liệu cho biểu đồ
        categories = Category.objects.annotate(product_count=Count('product'))
        extra_context['cat_labels'] = [str(c.name) for c in categories]
        extra_context['cat_data'] = [int(c.product_count) for c in categories]

        return super().index(request, extra_context)

# Thay thế admin site mặc định
admin.site = VeggieAdminSite()

# Register các model còn lại như bình thường
admin.site.register([Role, User, Product,ProductImage, Category, Order, OrderItem, Contact])