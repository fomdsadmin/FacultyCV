#!/bin/bash

# Gotenberg PDF Service Startup Script
# This script helps you start the Gotenberg service and proxy

echo "🚀 Starting Gotenberg PDF Service..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Start Docker services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if Gotenberg is running
echo "🔍 Checking Gotenberg service..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Gotenberg service is running on http://localhost:3000"
else
    echo "❌ Gotenberg service is not responding. Check Docker logs:"
    echo "   docker-compose logs gotenberg"
    exit 1
fi

echo ""
echo "🎉 Gotenberg PDF service is ready!"
echo ""
echo "📖 Usage:"
echo "   - Direct access: http://localhost:3000"
echo ""
echo "🛠️  Commands:"
echo "   - View logs: docker-compose logs"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""
echo "📚 Check the React components in frontend/src/Components/"
echo "   - GotenbergPDFConverter.jsx"
echo "   - CVPDFGenerator.jsx"
echo "   - PDFExamples.jsx"
echo ""
echo "📖 Read GOTENBERG_README.md for detailed documentation"
