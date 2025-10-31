#!/bin/bash
set -e

echo "🚀 Setting up backend environment..."

cd backend

# Create venv if not exists
if [ ! -d "venv" ]; then
    echo "🧩 Creating backend virtual environment..."
    python -m venv venv
fi

# Activate venv (cross-platform)
if [ -f "venv/bin/activate" ]; then
    echo "⚡ Activating backend venv (Linux/macOS)..."
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    echo "⚡ Activating backend venv (Windows)..."
    source venv/Scripts/activate
else
    echo "⚠️ Could not find virtual environment activate script."
    exit 1
fi



# Install backend dependencies
if [ -f "requirements.txt" ]; then
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Run backend in background
echo "▶️ Starting backend..."
python app.py &

cd ..

echo "⚙️ Setting up frontend environment..."
cd frontend/maitri-ai-forge

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Run frontend
echo "▶️ Starting frontend..."
npm run dev

echo "✅ Both backend and frontend are running!"
