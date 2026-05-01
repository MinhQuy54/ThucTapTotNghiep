import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import api.routing
from api.middleware import JwtAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_service.settings')

application = ProtocolTypeRouter({
    "http" : get_asgi_application(),
    "websocket" : AuthMiddlewareStack(
        JwtAuthMiddleware(
            URLRouter(api.routing.websocket_urlpatterns)
        )
    )
})
