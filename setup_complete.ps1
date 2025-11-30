# Setup script for HR Mood Manager with RAG system
# Installs all dependencies and sets up the complete system

Write-Host "🚀 Setting up HR Mood Manager with RAG system..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow

# Install Python dependencies
python -m pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting up RAG system..." -ForegroundColor Yellow

# Run RAG setup
python setup_rag.py

Write-Host ""
Write-Host "📱 Installing frontend dependencies..." -ForegroundColor Yellow

# Install frontend dependencies
Set-Location frontend
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 IMPORTANT CONFIGURATION:" -ForegroundColor Cyan
Write-Host "1. Edit .env file to add your OpenAI API key for full AI capabilities"
Write-Host "   OPENAI_API_KEY=your_api_key_here"
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Cyan
Write-Host "1. Backend: python api_server.py"
Write-Host "2. Frontend: cd frontend && npm run dev"
Write-Host ""
Write-Host "✨ New Features Available:" -ForegroundColor Magenta
Write-Host "• AI-powered mood insights and recommendations"
Write-Host "• Team mood analysis for HR users"
Write-Host "• Intelligent risk assessment"
Write-Host "• Knowledge-based suggestions"
Write-Host ""
Write-Host "Access the AI insights in the dashboard under 'AI Insights' tab!" -ForegroundColor Green