@echo off
echo ========================================
echo  HR Mood Manager - Backend Server
echo ========================================
echo.

REM Activate virtual environment
echo Activating virtual environment...
call .venv311\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
python -m pip install -r requirements.txt

echo.
echo ========================================
echo  Starting FastAPI Server...
echo  API will be available at:
echo  http://localhost:8000
echo  Docs: http://localhost:8000/docs
echo ========================================
echo.

python api_server.py

pause
