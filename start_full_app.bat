@echo off
echo Starting HR Mood Manager Application...

echo Starting backend server...
start "Backend Server" cmd /c "cd /d %~dp0 && .\.venv\Scripts\Activate.ps1 && python api_server.py"

timeout /t 5 /nobreak

echo Starting frontend development server...
start "Frontend Server" cmd /c "cd /d %~dp0\frontend && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause

echo Stopping servers...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
echo Servers stopped.
pause