#!/bin/bash
# Smart Café Network Server Startup Script for Mac/Linux
# This script starts the Django backend accessible on your local network

echo "========================================"
echo "  Smart Café Network Server"
echo "========================================"
echo ""

# Get the local IP address (try different methods)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

# Check if IP is valid
if [ -z "$IP" ]; then
    echo "ERROR: Could not detect your IP address."
    echo "Please run 'ifconfig' and manually add your IP to ALLOWED_HOSTS in settings.py"
    exit 1
fi

echo "Your IP Address is: $IP"
echo ""
echo "Starting Django server on all network interfaces..."
echo "Backend will be accessible at: http://$IP:8000"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

cd backend
python manage.py runserver 0.0.0.0:8000

