from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Lấy token từ query string (vd: ws://.../?token=...)
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            try:
                # Giải mã token để lấy user_id
                access_token = AccessToken(token)
                user_id = access_token["user_id"]
                # Gán user vào scope
                scope["user"] = await get_user(user_id)
            except Exception as e:
                print(f"DEBUG: JWT Auth Error: {e}")
                scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)
