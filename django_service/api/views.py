from .models import *
from .serializers import *
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import APIView
from rest_framework_simplejwt.tokens import RefreshToken


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