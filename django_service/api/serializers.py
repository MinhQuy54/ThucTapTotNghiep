from .models import *
from rest_framework import serializers
import re

class LoginSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(
        write_only=True, 
        min_length=6, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['username', 'password']

    def validate(self, data):
        return data
    
class RegisterSerializer(serializers.ModelSerializer):
    firstname = serializers.CharField(
    )
    lastname = serializers.CharField()
    password = serializers.CharField(
        min_length=6,
        style = {'input_type' : 'password'},  
    )

    class Meta:
        model = User
        fields = ['username', 'firstname', 'lastname', 'email', 'password']
    
    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ số.")
        return value
    

class PasswordFieldSerializer(serializers.Serializer):
    password = serializers.CharField(
        min_length=6,
        style = {'input_type' : 'password'},  
    )

    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ số.")
        return value
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField()
    confirm_password = serializers.CharField()

    def validate_new_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất 1 chữ số.")
        return value
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Mật khẩu không khớp")
        if data['new_password'] == data['current_password']:
            raise serializers.ValidationError("Mat khau moi khong duoc giong mat khau cu")
        return data
    
class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'
        read_only_fields = ['user']