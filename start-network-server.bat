@echo off
REM Smart Café Network Server Startup Script for Windows
REM This script starts the Django backend accessible on your local network

echo ========================================
echo   Smart Café Network Server
echo ========================================
echo.

REM Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
REM Remove spaces from IP
set IP=%IP: =%
echo Your IP Address is: %IP%
echo.

REM Check if IP is valid
if "%IP%"=="" (
    echo ERROR: Could not detect your IP address.
    echo Please run 'ipconfig' and manually add your IP to ALLOWED_HOSTS in settings.py
    pause
    exit /b 1
)

echo Starting Django server on all network interfaces...
echo Backend will be accessible at: http://%IP%:8000
echo.
echo To stop the server, press Ctrl+C
echo.

cd backend
python manage.py runserver 0.0.0.0:8000

pause

