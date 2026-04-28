@echo off
REM Vanguard Production Deployment Script for Windows

echo 🚀 Starting Vanguard deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo 📦 Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo ✅ Deployment complete!
echo.
echo 🌐 Access your application:
echo    Frontend: http://localhost
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 📊 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
echo.
pause