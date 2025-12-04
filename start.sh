#!/bin/bash

# Debug: Print environment variable status (hide password)
echo "=== Environment Check ==="
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is SET (hiding full value for security)"
    echo "DATABASE_URL starts with: ${DATABASE_URL:0:30}..."
else
    echo "WARNING: DATABASE_URL is NOT SET"
fi

echo "PORT: $PORT"
echo "==========================="

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Start the server
echo "Starting Gunicorn..."
exec gunicorn habittree.wsgi:application --bind 0.0.0.0:${PORT:-8000}

