from .models import *
from .serializers import *
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.http import Http404
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import uuid, time


from django.conf import settings
from django.shortcuts import redirect


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
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data

        if User.objects.filter(email=data['email']).exists():
            return Response(
                {"error": "Email đã tồn tại"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
            is_active= False
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