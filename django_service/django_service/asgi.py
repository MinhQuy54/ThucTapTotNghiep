import os 
from django.core.asgi import get_asgi_application # xu ly HTTP 
from channels.routing import ProtocolTypeRouter, URLRouter # tach http / websocket 
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

# AuthMiddlewareStack -> JwtAuthMiddleware -> URLRouter -> Consumer