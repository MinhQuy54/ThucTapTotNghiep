from datetime import timedelta
from unittest.mock import Base

from django import forms
from django.conf import settings
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.core.mail import send_mail
from django.db.models import Count, Sum
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from .models import Category, Contact, Order, OrderItem, Permission, Product, ProductImage, Role, User


BADGE_STYLES = {
    "success": {
        "background": "rgba(31, 143, 99, 0.16)",
        "border": "rgba(31, 143, 99, 0.18)",
        "color": "#15543b",
    },
    "warning": {
        "background": "rgba(242, 195, 91, 0.24)",
        "border": "rgba(242, 195, 91, 0.28)",
        "color": "#8a6511",
    },
    "danger": {
        "background": "rgba(220, 38, 38, 0.12)",
        "border": "rgba(220, 38, 38, 0.16)",
        "color": "#991b1b",
    },
    "info": {
        "background": "rgba(37, 99, 235, 0.12)",
        "border": "rgba(37, 99, 235, 0.16)",
        "color": "#1d4ed8",
    },
    "neutral": {
        "background": "rgba(100, 116, 139, 0.12)",
        "border": "rgba(100, 116, 139, 0.16)",
        "color": "#334155",
    },
}


def render_badge(label, tone="neutral"):
    badge = BADGE_STYLES[tone]
    return format_html(
        (
            '<span style="display:inline-flex;align-items:center;gap:0.35rem;'
            "padding:0.35rem 0.72rem;border-radius:999px;border:1px solid {};background:{};"
            'color:{};font-size:0.75rem;font-weight:700;line-height:1.1;">{}</span>'
        ),
        badge["border"],
        badge["background"],
        badge["color"],
        label,
    )


def cohort_color(percent):
    if percent >= 85:
        return "bg-primary-800 text-white"
    if percent >= 70:
        return "bg-primary-700 text-white"
    if percent >= 55:
        return "bg-primary-600 text-white"
    if percent >= 40:
        return "bg-primary-500 text-white"
    if percent >= 25:
        return "bg-primary-300 text-primary-950"
    if percent > 0:
        return "bg-primary-100 text-primary-900"
    return None


def build_order_status_cohort(start_date, end_date):
    dates = [start_date + timedelta(days=offset) for offset in range((end_date - start_date).days + 1)]
    statuses = list(Order.Status)
    status_counts = (
        Order.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        .values("created_at__date", "status")
        .annotate(order_count=Count("id"))
    )

    counts_map = {
        (item["created_at__date"], item["status"]): int(item["order_count"])
        for item in status_counts
    }
    totals_by_status = {
        status.value: sum(counts_map.get((date, status.value), 0) for date in dates)
        for status in statuses
    }

    rows = []
    for day in dates:
        daily_total = sum(counts_map.get((day, status.value), 0) for status in statuses)
        cols = []

        for status in statuses:
            value = counts_map.get((day, status.value), 0)
            percent = round((value / daily_total) * 100) if daily_total else 0
            cols.append(
                {
                    "value": value if value else 0,
                    "subtitle": f"{percent}%" if value else "",
                    "color": cohort_color(percent) if value else None,
                }
            )

        rows.append(
            {
                "header": {
                    "title": day.strftime("%d/%m/%Y"),
                    "subtitle": f"Tổng {daily_total}",
                },
                "cols": cols,
            }
        )

    return {
        "headers": [
            {
                "title": status.label,
                "subtitle": f"Tổng {totals_by_status[status.value]}",
            }
            for status in statuses
        ],
        "rows": rows,
    }


def dashboard_callback(request, context):
    today = timezone.localdate()
    start_date = today - timedelta(days=6)
    revenue = Order.objects.filter(status=1).aggregate(total=Sum("total_price"))["total"] or 0

    context.update(
        {
            "title": "Bảng điều khiển",
            "subtitle": "Theo dõi đơn hàng, doanh thu, tồn kho và liên hệ khách hàng tại Veggie Store.",
            "total_orders": Order.objects.count(),
            "total_revenue": revenue,
            "low_stock": Product.objects.filter(stock__lt=10).count(),
            "new_contacts": Contact.objects.filter(is_reply=False).count(),
            "cohort_data": build_order_status_cohort(start_date, today),
        }
    )
    return context


class BaseAdmin(UnfoldModelAdmin):
    list_filter_submit = True


class ContactReplyForm(forms.Form):
    reply_content = forms.CharField(
        label="Nội dung phản hồi",
        widget=forms.Textarea(
            attrs={
                "class": "contact-reply-textarea",
                "rows": 10,
                "placeholder": "Nhập nội dung phản hồi cho khách hàng...",
            }
        ),
        strip=True,
    )


@admin.register(Role)
class RoleAdmin(BaseAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)
@admin.register(Permission)
class Permission(BaseAdmin):
    list_display = ("code", "name", "created_at")
    search_fields = ("name",)
    ordering = ("name", )
    
@admin.register(User)
class UserAdmin(BaseAdmin):
    list_display = ("username", "email", "role", "is_staff", "reward_points", "date_joined")
    search_fields = ("username", "email", "first_name", "last_name", "phone_number")
    list_filter = ("is_staff", "is_superuser", "is_active", "role")
    ordering = ("-date_joined",)
    autocomplete_fields = ("role",)
    filter_horizontal = ("groups", "user_permissions")


@admin.register(Category)
class CategoryAdmin(BaseAdmin):
    list_display = ("name", "slug", "created_at", "updated_at")
    search_fields = ("name", "slug")
    ordering = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(BaseAdmin):
    list_display = ("name", "category", "price", "stock", "stock_state", "status_label", "updated_at")
    search_fields = ("name", "slug", "category__name")
    list_filter = ("category", "status")
    ordering = ("-updated_at",)
    list_select_related = ("category",)
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("category",)

    @admin.display(description="Tồn kho", ordering="stock")
    def stock_state(self, obj):
        if obj.stock <= 0:
            return render_badge("Hết hàng", "danger")
        if obj.stock < 10:
            return render_badge("Sắp hết", "warning")
        return render_badge("Ổn định", "success")

    @admin.display(description="Hiển thị", ordering="status")
    def status_label(self, obj):
        return render_badge("Đang bán" if obj.status == 1 else "Tạm ẩn", "success" if obj.status == 1 else "neutral")


@admin.register(ProductImage)
class ProductImageAdmin(BaseAdmin):
    list_display = ("product", "created_at")
    search_fields = ("product__name",)
    ordering = ("-created_at",)
    autocomplete_fields = ("product",)


@admin.register(Order)
class OrderAdmin(BaseAdmin):
    list_display = ("id", "user", "status_badge", "total_price", "points_used", "created_at")
    search_fields = ("=id", "user__username", "user__email")
    list_filter = ("status", "created_at")
    ordering = ("-created_at",)
    list_select_related = ("user",)

    @admin.display(description="Trạng thái", ordering="status")
    def status_badge(self, obj):
        tones = {
            Order.Status.PENDING: "warning",
            Order.Status.CONFIRMED: "info",
            Order.Status.SHIPPING: "info",
            Order.Status.DELIVERED: "success",
            Order.Status.CANCELLED: "danger",
            Order.Status.REFUNDED: "neutral",
        }
        return render_badge(obj.get_status_display(), tones.get(obj.status, "neutral"))


@admin.register(OrderItem)
class OrderItemAdmin(BaseAdmin):
    list_display = ("order", "product", "quantity", "price")
    search_fields = ("=order__id", "product__name")
    ordering = ("-order__created_at",)
    list_select_related = ("order", "product")
    autocomplete_fields = ("order", "product")


@admin.register(Contact)
class ContactAdmin(BaseAdmin):
    change_list_template = "admin/contact_reply.html"
    list_display = ("full_name", "email", "reply_status", "created_at")
    search_fields = ("full_name", "email", "phone_number", "message", "reply_content")
    list_filter = ("is_reply", "created_at")
    ordering = ("-created_at",) 
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    @admin.display(description="Trạng thái", ordering="is_reply")
    def reply_status(self, obj):
        return render_badge("Đã phản hồi" if obj.is_reply else "Chờ phản hồi", "success" if obj.is_reply else "warning")

    def change_view(self, request, object_id, form_url="", extra_context=None):
        if not self.has_view_or_change_permission(request):
            raise PermissionDenied

        changelist_url = reverse("admin:api_contact_changelist")
        return redirect(f"{changelist_url}?contact={object_id}")

    def changelist_view(self, request, extra_context=None):
        if not self.has_view_or_change_permission(request):
            raise PermissionDenied

        contacts = sorted(self.get_queryset(request), key=lambda contact: contact.created_at, reverse=True)
        selected_id = request.POST.get("contact_id") or request.GET.get("contact")
        selected_contact = self._select_contact(contacts, selected_id)

        if selected_contact is None and contacts:
            selected_contact = contacts[0]

        form = ContactReplyForm(
            initial={
                "reply_content": getattr(selected_contact, "reply_content", "") or "",
            }
        )

        if request.method == "POST":
            form = ContactReplyForm(request.POST)

            if selected_contact is None:
                messages.error(request, "Không tìm thấy liên hệ để phản hồi.")
            elif not self._from_email():
                messages.error(
                    request,
                    "Chưa cấu hình email gửi. Hãy kiểm tra DEFAULT_FROM_EMAIL hoặc EMAIL_HOST_USER.",
                )
            elif form.is_valid():
                reply_content = form.cleaned_data["reply_content"]

                try:
                    send_mail(
                        subject="Phản hồi từ Veggie Shop",
                        message=self._build_reply_email(selected_contact, reply_content),
                        from_email=self._from_email(),
                        recipient_list=[selected_contact.email],
                        fail_silently=False,
                    )
                except Exception as exc:
                    messages.error(request, f"Gửi email thất bại: {exc}")
                else:
                    selected_contact.reply_content = reply_content
                    selected_contact.is_reply = True
                    selected_contact.save(update_fields=["reply_content", "is_reply"])
                    messages.success(request, f"Đã gửi phản hồi tới {selected_contact.email}.")
                    changelist_url = reverse("admin:api_contact_changelist")
                    return redirect(f"{changelist_url}?contact={self._contact_pk(selected_contact)}")

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Quản lý liên hệ",
            "subtitle": "Theo dõi liên hệ khách hàng và gửi phản hồi trực tiếp từ admin.",
            "contacts": contacts,
            "selected_contact": selected_contact,
            "reply_form": form,
            "total_contacts": len(contacts),
            "pending_contacts": sum(not contact.is_reply for contact in contacts),
            "answered_contacts": sum(contact.is_reply for contact in contacts),
            "email_ready": bool(self._from_email()),
        }

        if extra_context:
            context.update(extra_context)

        return TemplateResponse(request, self.change_list_template, context)

    @staticmethod
    def _contact_pk(contact):
        return getattr(contact, "pk", None) or getattr(contact, "id", None)

    def _select_contact(self, contacts, selected_id):
        if not selected_id:
            return None

        selected_id = str(selected_id)
        for contact in contacts:
            if str(self._contact_pk(contact)) == selected_id:
                return contact
        return None

    @staticmethod
    def _from_email():
        return settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER

    @staticmethod
    def _build_reply_email(contact, reply_content):
        return (
            f"Xin chào {contact.full_name},\n\n"
            "Veggie Shop đã nhận được liên hệ của bạn và gửi phản hồi như sau:\n\n"
            f"{reply_content}\n\n"
            "Thong tin lien he goc:\n"
            f"- Email: {contact.email}\n"
            f"- So dien thoai: {contact.phone_number}\n"
            f"- Noi dung: {contact.message}\n\n"
            "Cam on ban da lien he Veggie Shop."
        )
