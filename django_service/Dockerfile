FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Chờ DB khởi động lâu hơn một chút vì là lần đầu tạo
CMD ["sh", "-c", "sleep 15 && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]