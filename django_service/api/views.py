from django.shortcuts import render
from django.http import JsonResponse
# Create your views here.

def chat(request):
    return JsonResponse({
        "Message" : "Hello from Django Chatbot 🤖"
    })