# DPWH Road Crack Detection System - Development Startup Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "DPWH Road Crack Detection System" -ForegroundColor Cyan
Write-Host "Development Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js is not installed. Please install Node.js 16+ first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green

# Check if node_modules exists
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Check if .env.local exists
Write-Host ""
Write-Host "Checking configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Write-Host "Warning: .env.local not found!" -ForegroundColor Yellow
    Write-Host "You need to add Firebase credentials to .env.local" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Expected variables:" -ForegroundColor Cyan
    Write-Host "  NEXT_PUBLIC_FIREBASE_API_KEY" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_FIREBASE_PROJECT_ID" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_FIREBASE_APP_ID" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✓ .env.local configured" -ForegroundColor Green
}

# Start development server
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Starting Development Server..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Green
Write-Host "API Health:   http://localhost:3000/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
