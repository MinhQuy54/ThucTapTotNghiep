from .models import *
from rest_framework import serializers

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