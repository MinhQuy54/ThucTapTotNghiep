FROM python:3.10

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt

CMD ["sh", "-c", "sleep 5 && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]