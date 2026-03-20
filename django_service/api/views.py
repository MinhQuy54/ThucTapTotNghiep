from .models import *
from .serializers import *
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import uuid, time

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
        
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('firstname', ''), 
            last_name=data.get('lastname', ''),   
        )
        
        return Response({
            "message": "Đăng ký thành công 🎉"
        }, status=status.HTTP_201_CREATED)

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
        return Response({
            "message": "Link reset password",
            "reset_link": reset_link
        })
    
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

