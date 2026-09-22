#!/bin/bash

# Frontend Startup Script
echo "Starting LLM Fine-tuning Platform Frontend..."

# Navigate to frontend directory
cd frontend || {
    echo "Frontend directory not found!"
    exit 1
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 24 ]; then
    echo "Node.js version v24.14.1 is required. Current version: $(node -v)"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."

    cat > .env << EOL
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
EOL
fi

# Check if backend is running
echo "Checking if backend is running on port 8000..."

if ! curl -s http://localhost:8000/docs > /dev/null; then
    echo "Warning: Backend is not running on port 8000"
    echo "Please start the backend first:"
    echo "cd backend && uv run uvicorn app.main:app --reload"
    echo ""

    read -p "Continue anyway? (y/n) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start frontend
echo "Starting frontend development server..."
echo "Frontend will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npm run dev