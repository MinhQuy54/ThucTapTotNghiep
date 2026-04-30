
from email import message
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        print(f"DEBUG: WebSocket connect attempt by user: {self.user}")

        if self.user and self.user.is_authenticated:
            # Tất cả user đều gia nhập group riêng của mình
            self.personal_group = f"user_notifications_{self.user.id}"
            await self.channel_layer.group_add(self.personal_group, self.channel_name)

            # Nếu là staff, gia nhập thêm group chung của staff (cho các thông báo hệ thống khác)
            if self.user.is_staff:
                self.staff_group = "staff_notifications"
                await self.channel_layer.group_add(self.staff_group, self.channel_name)
                print(f"DEBUG: Staff {self.user.id} joined personal and staff groups")
            else:
                print(f"DEBUG: User {self.user.id} joined personal group")
            
            await self.accept()
        else:
            print("DEBUG: User is NOT authenticated, closing connection")
            await self.close()
            return

        # Nếu là staff, bật Radar quét đơn hàng ngầm mỗi 5 giây
        if self.user.is_staff:
            import asyncio
            self.poll_task = asyncio.create_task(self.poll_for_new_orders())
            
    async def disconnect(self, close_code):
    # Tắt Radar khi nhân viên đóng web
        if hasattr(self, 'poll_task'):
            self.poll_task.cancel()
            
        if hasattr(self, 'personal_group'):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
        
        if hasattr(self, 'staff_group'):
            await self.channel_layer.group_discard(self.staff_group, self.channel_name)

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

        time_threshold = now() - timedelta(hours=1)
        recent_orders = Order.objects.filter(
            created_at__gte=time_threshold,
            status=1
        )

        for i in recent_orders:
            msg_marker = f"#{i.id}"
            exists= Notification.objects.filter(
                user=self.user,
                message__contains=msg_marker
            ).exists()

            if not exists:
                Notification.objects.create(
                    user=self.user,
                    type="ORDER",
                    message=f"Có đơn hàng mới {msg_marker}. Vui lòng xác nhận đơn hàng!",
                    is_read=False           
                )

    # Nhận tin nhắn từ group và gửi xuống client qua WebSocket
    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["content"]))

