from .models import *
from rest_framework import serializers
import re
from django.contrib.auth.hashers import make_password

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
    
