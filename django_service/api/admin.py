import json
from datetime import timedelta

from django import forms
from django.conf import settings
from django.contrib import admin, messages
from django.core.mail import send_mail
from django.core.exceptions import PermissionDenied
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone
from .models import Category, Contact, Order, OrderItem, Product, ProductImage, Role, User


class VeggieAdminSite(admin.AdminSite):
    def index(self, request, extra_context=None):

        extra_context = extra_context or {}

        extra_context["total_orders"] = Order.objects.count()
        revenue = Order.objects.filter(status=1).aggregate(Sum("total_price"))["total_price__sum"]
        extra_context["total_revenue"] = revenue if revenue else 0
        extra_context["low_stock"] = Product.objects.filter(stock__lt=10).count()
        extra_context["new_contacts"] = Contact.objects.filter(is_reply=False).count()
        today = timezone.localdate()
        start_date = today - timedelta(days=6)
        daily_orders = (
            Order.objects.filter(created_at__date__gte=start_date, created_at__date__lte=today)
            .annotate(order_date=TruncDate("created_at"))
            .values("order_date")
            .annotate(order_count=Count("id"))
            .order_by("order_date")
        )
        daily_orders_map = {
            item["order_date"]: int(item["order_count"]) for item in daily_orders
        }
        trend_dates = [start_date + timedelta(days=offset) for offset in range(7)]
        extra_context["trend_labels"] = json.dumps(
            [chart_date.strftime("%d/%m") for chart_date in trend_dates],
            ensure_ascii=False,
        )
        extra_context["trend_data"] = json.dumps(
            [daily_orders_map.get(chart_date, 0) for chart_date in trend_dates]
        )


        return super().index(request, extra_context)


admin.site = VeggieAdminSite()

class ContactReplyForm(forms.Form):
    reply_content = forms.CharField(
        label="Nội dung phản hồi",
        widget=forms.Textarea(
            attrs={
                "class": "vLargeTextField contact-reply-textarea",
                "rows": 10,
                "placeholder": "Nhập nội dung phản hồi cho khách hàng...",
            }
        ),
        strip=True,
    )

class ContactAdmin(admin.ModelAdmin):
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
        badge_class = "success" if obj.is_reply else "warning"
        label = "Đã phản hồi" if obj.is_reply else "Chờ phản hồi"
        return format_html('<span class="badge badge-{}">{}</span>', badge_class, label)

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
                    messages.success(
                        request,
                        f"Đã gửi phản hồi tới {selected_contact.email}.",
                    )
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

admin.site.register(Contact, ContactAdmin)

admin.site.register([Role, User, Product, ProductImage, Category, Order, OrderItem])

