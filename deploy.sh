#!/bin/bash

# Vanguard Production Deployment Script

set -e

echo "🚀 Starting Vanguard deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📦 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"