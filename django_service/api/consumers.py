import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

        
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        print(f"DEBUG: WebSocket connect attempt by user: {self.user}")
        
        if self.user and self.user.is_authenticated and self.user.is_staff:
            self.group_name = "staff_notifications"
            print("DEBUG: User is staff, joining staff_notifications")
        elif self.user and self.user.is_authenticated:
            self.group_name = f"user_notifications_{self.user.id}"
            print(f"DEBUG: User is authenticated, joining {self.group_name}")
        else:
            print("DEBUG: User is NOT authenticated, closing connection")
            await self.close()
            return

        # Tham gia vào group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        # Nếu là staff, bật Radar quét đơn hàng ngầm mỗi 5 giây
        if self.user.is_staff:
            import asyncio
            self.poll_task = asyncio.create_task(self.poll_for_new_orders())

    async def disconnect(self, close_code):
        # Tắt Radar khi nhân viên đóng web
        if hasattr(self, 'poll_task'):
            self.poll_task.cancel()
            
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def poll_for_new_orders(self):
        import asyncio
        while True:
            await asyncio.sleep(5) # Quét 5 giây/lần
            await self.scan_database_for_orders()

    @database_sync_to_async
    def scan_database_for_orders(self):
        from api.models import Order, Notification
        from django.utils.timezone import now
        from datetime import timedelta
        
        # Tìm đơn hàng trong 1 tiếng qua chưa có thông báo cho staff này
        time_threshold = now() - timedelta(hours=1)
        recent_orders = Order.objects.filter(
            created_at__gte=time_threshold,
            status=1 # PENDING
        )
        
        for order in recent_orders:
            msg_marker = f"#{order.id}"
            exists = Notification.objects.filter(
                user=self.user,
                message__contains=msg_marker
            ).exists()
            
            if not exists:
                # Tạo thông báo đúng cấu trúc của model Notification
                Notification.objects.create(
                    user=self.user,
                    type="ORDER",
                    message=f"Có đơn hàng mới {msg_marker}. Vui lòng xác nhận đơn hàng!",
                    is_read=False
                )


    # Nhận tin nhắn từ group và gửi xuống client qua WebSocket
    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["content"]))
