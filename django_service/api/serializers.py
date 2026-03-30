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


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'shipping_address', 'total_price', 'status', 'created_at']
        read_only_fields = ['total_price', 'status']


class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image', 'category_name']

    def get_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            return first_image.image.url
        return None
    
class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductDetailSerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'subtotal']

    def get_subtotal(self, obj):
        return obj.quantity * obj.price
    

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'total_price', 'status', 
            'created_at', 'shipping_address', 'items']


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ["full_name", "phone_number", "email", "message"]
