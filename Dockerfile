FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=debtpal_project.settings.prod

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN SECRET_KEY=build-time-placeholder ALLOWED_HOSTS=localhost python src/manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "debtpal_project.wsgi:application", "--chdir", "src", "--bind", "0.0.0.0:8000"]
