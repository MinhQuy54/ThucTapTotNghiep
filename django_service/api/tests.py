from datetime import timedelta
from unittest.mock import Mock, patch

from django.contrib.admin import AdminSite
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.utils import timezone

from .admin import ContactAdmin
from .models import Contact
from .serializers import ContactSerializer


class DummyContact:
    def __init__(
        self,
        pk,
        full_name,
        email,
        phone_number,
        message,
        created_at,
        is_reply=False,
        reply_content="",
    ):
        self.pk = pk
        self.id = pk
        self.full_name = full_name
        self.email = email
        self.phone_number = phone_number
        self.message = message
        self.created_at = created_at
        self.is_reply = is_reply
        self.reply_content = reply_content
        self.saved = False
        self.save_kwargs = None

    def save(self, **kwargs):
        self.saved = True
        self.save_kwargs = kwargs


class ContactAdminTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.site = AdminSite()
        self.admin = ContactAdmin(Contact, self.site)
        self.admin.admin_site.each_context = Mock(return_value={})

    @staticmethod
    def _attach_staff_user(request):
        request.user = Mock()
        request.user.has_perm = Mock(return_value=True)
        return request

    def test_change_view_redirects_to_custom_inbox(self):
        request = self._attach_staff_user(self.factory.get("/admin/api/contact/7/change/"))

        with patch("api.admin.reverse", return_value="/admin/api/contact/"):
            response = self.admin.change_view(request, "7")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/admin/api/contact/?contact=7")

    def test_changelist_uses_latest_contact_as_default_selection(self):
        older_contact = DummyContact(
            pk=1,
            full_name="Older User",
            email="older@example.com",
            phone_number="0123456789",
            message="Older message",
            created_at=timezone.now() - timedelta(days=1),
            is_reply=True,
            reply_content="Da phan hoi",
        )
        newest_contact = DummyContact(
            pk=2,
            full_name="Newest User",
            email="new@example.com",
            phone_number="0987654321",
            message="New message",
            created_at=timezone.now(),
        )
        request = self._attach_staff_user(self.factory.get("/admin/api/contact/"))

        with patch.object(self.admin, "get_queryset", return_value=[older_contact, newest_contact]):
            response = self.admin.changelist_view(request)

        self.assertEqual(response.context_data["selected_contact"], newest_contact)
        self.assertEqual(response.context_data["total_contacts"], 2)
        self.assertEqual(response.context_data["pending_contacts"], 1)
        self.assertEqual(response.context_data["answered_contacts"], 1)

    @override_settings(DEFAULT_FROM_EMAIL="admin@veggie.test")
    def test_changelist_post_sends_email_and_marks_contact_replied(self):
        contact = DummyContact(
            pk=9,
            full_name="Lien He",
            email="customer@example.com",
            phone_number="0909000000",
            message="Toi can duoc ho tro don hang",
            created_at=timezone.now(),
        )
        request = self._attach_staff_user(
            self.factory.post(
                "/admin/api/contact/",
                {
                    "contact_id": "9",
                    "reply_content": "Veggie Shop da tiep nhan va se lien he lai som nhat.",
                },
            )
        )

        with patch.object(self.admin, "get_queryset", return_value=[contact]), patch(
            "api.admin.send_mail"
        ) as send_mail, patch("api.admin.reverse", return_value="/admin/api/contact/"), patch(
            "api.admin.messages.success"
        ) as success_message, patch("api.admin.messages.error") as error_message:
            response = self.admin.changelist_view(request)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/admin/api/contact/?contact=9")
        self.assertTrue(contact.saved)
        self.assertEqual(contact.save_kwargs, {"update_fields": ["reply_content", "is_reply"]})
        self.assertTrue(contact.is_reply)
        self.assertEqual(
            contact.reply_content,
            "Veggie Shop da tiep nhan va se lien he lai som nhat.",
        )
        self.assertIn(
            "Veggie Shop da tiep nhan va se lien he lai som nhat.",
            send_mail.call_args.kwargs["message"],
        )
        self.assertEqual(send_mail.call_args.kwargs["recipient_list"], ["customer@example.com"])
        success_message.assert_called_once()
        error_message.assert_not_called()


class ContactSerializerTests(SimpleTestCase):
    def test_contact_serializer_exposes_only_public_contact_fields(self):
        serializer = ContactSerializer()

        self.assertEqual(
            set(serializer.fields.keys()),
            {"full_name", "phone_number", "email", "message"},
        )
