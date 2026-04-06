from .models import *
from .serializers import *
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.http import Http404
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import uuid, time
import requests


from django.conf import settings
from django.shortcuts import redirect, get_object_or_404, render
from django.contrib import messages
from django.views.decorators.http import require_GET

# redis

from django.core.cache import cache


@require_GET
def google_oauth_success(request):
    if not request.user.is_authenticated:
        return redirect(f"{settings.FRONTEND_URL}/login.html?oauth=error")

    user = request.user
    updated_fields = []

    if user.role_id is None:
        customer_role = Role.objects.filter(name='Customer').first()
        if customer_role:
            user.role = customer_role
            updated_fields.append('role')

    google_account = user.socialaccount_set.filter(provider='google').first()
    if google_account and user.google_id != google_account.uid:
        user.google_id = google_account.uid
        updated_fields.append('google_id')

    if updated_fields:
        user.save(update_fields=updated_fields)

    refresh = RefreshToken.for_user(user)

    return render(request, "auth/social_login_success.html", {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "username": user.username,
        "email": user.email,
    })

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data.get('username')
        password = serializer.validated_data.get('password')

        if not username or not password:
            return Response({
                "detail" : "Thiếu thông tin đăng nhập"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(
            request,
            username=username,
            password=password
        )

        if not user:
            return Response(
                {"non_field_error": ["Sai tài khoản hoặc mật khẩu"]}, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email,
        }, status=status.HTTP_200_OK)
    


class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        role = Role.objects.filter(name='Customer').first()
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data

        if User.objects.filter(email=data['email']).exists():
            return Response(
                {"error": "Email đã tồn tại"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not role:
            return Response({"error": "Chưa tạo role Customer"}, status=500)
        
        activation_token = str(uuid.uuid4())

        activation_link = f'http://localhost:8080/api/activate/{activation_token}/'

        send_mail(
            subject="Kích hoạt tài khoản Veggie",
            message=f"Nhấn vào link để kích hoạt tài khoản:\n{activation_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[data['email']],
            fail_silently=False
        )
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('firstname', ''), 
            last_name=data.get('lastname', ''),   
            is_active= False,
            role=role
        )
        user.activation_token = activation_token
        user.save()
        
        return Response({
            "message": "Đăng ký thành công"
        }, status=status.HTTP_201_CREATED)
        


class ActivateAccountView(APIView):
    def get(self, request, token):
        user = User.objects.filter(activation_token=token).first()

        if not user:
            return redirect(
                "http://localhost:8080/login.html?activated=error"
            )

        user.is_active = True
        user.activation_token = None
        user.save()

        return redirect(
            "http://localhost:8080/login.html?activated=success"
        )

class RequestResetPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Vui lòng nhập email"}, status=400)
        
        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"error": "Email không tồn tại"}, status=400)
        
        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_created = int(time.time())
        user.save()

        reset_link = f"http://localhost:8080/resetpass.html?token={token}"

        send_mail(
            subject="Reset mật khẩu Veggie",
            message=f"Nhấn vào link để đặt lại mật khẩu:\n{reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email]
        )
        return Response(
            {"message": "Đã gửi email reset mật khẩu"},
            status=status.HTTP_200_OK
        )
    
class ResetPasswordView(APIView):
    def post(self, request):
        serializer = PasswordFieldSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        token = request.data.get('token')
        password = serializer.validated_data.get('password')
        confirm = request.data.get("confirm_password")

        if not token or not password or not confirm:
            return Response({"error": "Thiếu dữ liệu"}, status=400)
        
        if password != confirm:
            return Response({"error": "Mật khẩu không khớp"}, status=400)
        
        user = User.objects.filter(reset_token=token).first()

        if not user:
            return Response({"error": "Token không hợp lệ"}, status=400)
        
        user.set_password(password)
        user.reset_token = None
        user.reset_token_created = None
        user.save()
        return Response({"message": "Reset password thành công"})


class UserList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializers = UserSerializer(request.user)

        if serializers:
            return Response(serializers.data, status=status.HTTP_200_OK)


class UserDetail(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        user = request.user

        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        serializer = UserSerializer(user, data=request.data, partial=True)

        if any([current_password, new_password, confirm_password]):

            password_serializer = ChangePasswordSerializer(data=request.data)

            if not password_serializer.is_valid():
                return Response(
                    password_serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            validated = password_serializer.validated_data
            current_password = validated['current_password']
            new_password = validated['new_password']

            if not user.check_password(current_password):
                return Response(
                    {"error": "Mật khẩu hiện tại không chính xác"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(new_password)
            user.save()

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Cập nhật thành công",
                "user": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ShippingAddressList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        address = ShippingAddress.objects.filter(user=request.user)
        serializers = ShippingAddressSerializer(address, many=True)
        return Response(serializers.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializers = ShippingAddressSerializer(data=request.data)

        if serializers.is_valid():
            serializers.save(user=request.user)
            return Response(serializers.data, status=status.HTTP_200_OK)   
        return Response(serializers.errors, status=status.HTTP_400_BAD_REQUEST)
        

class ShippingAddressDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get_obj(self, pk):
        try:
            return ShippingAddress.objects.get(pk=pk)
        except ShippingAddress.DoesNotExist:
            raise Http404()
        
    def get(self, request, pk):
        address = self.get_obj(pk)
        serializer = ShippingAddressSerializer(address)
        return Response(serializer.data)
    
    def delete(self, request, pk):
        address = self.get_obj(pk)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def put(self, request, pk):
        address = self.get_obj(pk)
        serializer = ShippingAddressSerializer(address, data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    

class OrderList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        order = Order.objects.filter(user=request.user)
        serializers = OrderSerializer(order, many=True)
        return Response(serializers.data, status=status.HTTP_200_OK)
    

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
            serializer = OrderDetailSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({"error": "Đơn hàng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk,user=request.user)

            if order.status not in [1,2]:
                return Response({"error": "Không thể hủy đơn"}, status=400)
            
            for item in order.items.all():
                product = item.product
                product.stock += item.quantity
                product.save()
            order.status = 5
            order.save()
            return Response({"message": "Đã hủy đơn"})
        except Order.DoesNotExist:
            return Response({"error": "Không tìm thấy đơn"}, status=404)


class ContactList(APIView):

    def post(self, request):
        serializers = ContactSerializer(data=request.data)

        if serializers.is_valid():
            contact = serializers.save()

            admins = User.objects.filter(is_staff = True)
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    type="CONTACT",
                    message=f"Liên hệ mới từ {contact.full_name}"
                )
            return Response({
                "message": "Gửi liên hệ thành công"
            }, status=status.HTTP_201_CREATED)
        return Response(serializers.errors, status=400)

def admin_contact_view(request):
    contacts = Contact.objects.all().order_by('-created_at')
    selected_contact = None

    contact_id = request.GET.get('id')
    if contact_id:
        selected_contact = get_object_or_404(Contact, id=contact_id)

    if request.method == "POST":
        contact_id = request.POST.get('contact_id')
        reply_content = request.POST.get('reply_content')

        contact = get_object_or_404(Contact, id=contact_id)

        send_mail(
            subject="Phản hồi từ Veggie Shop",
            message=reply_content,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[contact.email],
            fail_silently=False,
        )

        contact.reply_content = reply_content
        contact.is_reply = True
        contact.save()

        messages.success(request, "Đã gửi phản hồi thành công!")

        return redirect(f"/admin/contacts?id={contact.id}")

    return render(request, "admin/contact.html", {
        "contacts": contacts,
        "selected_contact": selected_contact
    })
    

class GHNProxyBase(APIView):
    permission_classes = [IsAuthenticated]
    ghn_headers = {
        "Token" : settings.GHN_TOKEN,
        "Content-Type" : "application/json"
    }
    if settings.GHN_SHOP_ID:
        ghn_headers["ShopId"] = str(settings.GHN_SHOP_ID)

    def request_ghn(self, method, endpoint, payload=None):
        url = f"{settings.GHN_API_URL}{endpoint}"
        try: 
            response = requests.request(
                method=method,
                url=url,
                headers=self.ghn_headers,
                json=payload,
                timeout=15
            )
            data = response.json()
        except requests.RequestException as exc:
            return Response({
                "message" : f"hông kết nối được GHN: {exc}"
            }, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError:
            return Response(
                {"message": "GHN trả về dữ liệu không hợp lệ."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(data, status=response.status_code)
    
class GetProvincesView(GHNProxyBase):
    def get(self, request):
        cache_key = "ghn_provinces"

        data = cache.get(cache_key)
        if data:
            return Response(data)
        response = self.request_ghn("GET", "province")
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            cache.set(cache_key, data, timeout=86400)
        return response
    

class GetDistrictsView(GHNProxyBase):
    def post(self, request):
        province_id = request.data.get('province_id')
        if not province_id:
            return Response({"message": "Thiếu province_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        cache_key = f"ghn_districts_{province_id}"

        data = cache.get(cache_key)
        if data:
            return Response(data)

        payload = {"province_id": int(province_id)}
        response = self.request_ghn("POST", "district", payload)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            cache.set(cache_key, data, timeout=86400)
        return response

class GetWardsView(GHNProxyBase):
    def post(self, request):
        district_id = request.data.get('district_id')

        if not district_id:
            return Response({"message": "Thiếu district_id"}, status=400)

        cache_key = f"ghn_wards_{district_id}"

        data = cache.get(cache_key)
        if data:
            return Response(data)

        payload = {"district_id": int(district_id)}
        response = self.request_ghn("POST", "ward", payload)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            cache.set(cache_key, data, timeout=86400)
        return response
