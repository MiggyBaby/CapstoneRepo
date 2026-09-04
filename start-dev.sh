#!/bin/bash

# DPWH Road Crack Detection System - Development Startup Script

echo ""
echo "================================"
echo "DPWH Road Crack Detection System"
echo "Development Environment Setup"
echo "================================"
echo ""

# Check if Node.js is installed
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✓ Node.js $NODE_VERSION found"

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (this may take a few minutes)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Check if .env.local exists
echo ""
echo "Checking configuration..."
if [ ! -f ".env.local" ]; then
    echo "Warning: .env.local not found!"
    echo "You need to add Firebase credentials to .env.local"
    echo ""
    echo "Expected variables:"
    echo "  NEXT_PUBLIC_FIREBASE_API_KEY"
    echo "  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    echo "  NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    echo "  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    echo "  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    echo "  NEXT_PUBLIC_FIREBASE_APP_ID"
    echo ""
else
    echo "✓ .env.local configured"
fi

# Start development server
echo ""
echo "================================"
echo "Starting Development Server..."
echo "================================"
echo ""
echo "Frontend URL: http://localhost:3000"
echo "API Health:   http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
