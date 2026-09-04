@echo off
REM DPWH Road Crack Detection System - Development Startup Script

color 0B
cls
echo.
echo ================================
echo DPWH Road Crack Detection System
echo Development Environment Setup
echo ================================
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found
echo.

REM Check if node_modules exists
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies (this may take a few minutes)...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)
echo.

REM Check if .env.local exists
echo Checking configuration...
if not exist ".env.local" (
    echo WARNING: .env.local not found!
    echo You need to add Firebase credentials to .env.local
    echo.
    echo Expected variables:
    echo   NEXT_PUBLIC_FIREBASE_API_KEY
    echo   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    echo   NEXT_PUBLIC_FIREBASE_PROJECT_ID
    echo   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    echo   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    echo   NEXT_PUBLIC_FIREBASE_APP_ID
    echo.
) else (
    echo [OK] .env.local configured
)

REM Start development server
echo.
echo ================================
echo Starting Development Server...
echo ================================
echo.
echo Frontend URL: http://localhost:3000
echo API Health:   http://localhost:3000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
pause
