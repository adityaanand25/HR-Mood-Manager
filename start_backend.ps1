# HR Mood Manager - Backend Server Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " HR Mood Manager - Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".venv311\Scripts\Activate.ps1"

Write-Host ""
Write-Host "Installing/Updating dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Starting FastAPI Server..." -ForegroundColor Green
Write-Host " API will be available at:" -ForegroundColor Green
Write-Host " http://localhost:8000" -ForegroundColor White
Write-Host " Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

python api_server.py
