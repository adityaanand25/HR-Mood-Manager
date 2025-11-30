# HR Mood Manager - Enhanced Startup with Persistence Verification
Write-Host "🚀 Starting HR Mood Manager with Data Persistence..." -ForegroundColor Green
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Function to stop processes on specific ports
function Stop-ProcessOnPort {
    param($Port)
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    foreach ($processId in $processes) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "   Stopped process $processId on port $Port" -ForegroundColor Yellow
        } catch {
            # Ignore errors
        }
    }
}

Write-Host "🔍 Checking database persistence..." -ForegroundColor Cyan
python test_database_persistence.py
Write-Host ""

Write-Host "🛑 Stopping any existing servers..." -ForegroundColor Yellow
Stop-ProcessOnPort 8000
Stop-ProcessOnPort 3000
Stop-ProcessOnPort 3001
Start-Sleep -Seconds 2

Write-Host "🐍 Starting backend server with enhanced persistence..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "D:\HR Mood Manager"
    & ".\\.venv\\Scripts\\Activate.ps1"
    python api_server.py
}

Write-Host "   Backend job started with ID: $($backendJob.Id)" -ForegroundColor Gray

# Wait for backend to fully start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Verify backend is healthy
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "✅ Backend server is healthy and model is loaded" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend started but may have issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🌐 Starting frontend server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "D:\HR Mood Manager\frontend"
    npm run dev
}

Write-Host "   Frontend job started with ID: $($frontendJob.Id)" -ForegroundColor Gray

# Wait for frontend to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎯 SERVERS ARE READY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Database Features:" -ForegroundColor White
Write-Host "   ✅ SQLite database with WAL mode for crash recovery" -ForegroundColor White
Write-Host "   ✅ Automatic backups every 10 mood records" -ForegroundColor White
Write-Host "   ✅ Transaction safety for data integrity" -ForegroundColor White
Write-Host "   ✅ Data persists across server restarts" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Demo Accounts:" -ForegroundColor White
Write-Host "   Employee: EMP001 / emp123" -ForegroundColor White
Write-Host "   HR:       HR001 / hr123" -ForegroundColor White
Write-Host ""
Write-Host "Press CTRL+C to stop all servers..." -ForegroundColor Red

# Monitor jobs and wait for user interrupt
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if jobs are still running
        $backendRunning = (Get-Job -Id $backendJob.Id).State -eq "Running"
        $frontendRunning = (Get-Job -Id $frontendJob.Id).State -eq "Running"
        
        if (-not $backendRunning) {
            Write-Host "⚠️ Backend job stopped unexpectedly" -ForegroundColor Red
            break
        }
        
        if (-not $frontendRunning) {
            Write-Host "⚠️ Frontend job stopped unexpectedly" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
}

# Clean up jobs
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
Remove-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
Remove-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue

# Stop any remaining processes
Stop-ProcessOnPort 8000
Stop-ProcessOnPort 3000

Write-Host "✅ All servers stopped. Data remains safely stored in database.db" -ForegroundColor Green