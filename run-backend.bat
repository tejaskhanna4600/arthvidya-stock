@echo off
set "SERVER_DIR=%~dp0server"
cd /d "%SERVER_DIR%"

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python is not installed or not in PATH.
  echo Please install Python from https://www.python.org/downloads/
  echo Make sure to check "Add Python to PATH" during installation.
  pause
  exit /b 1
)

echo Python found. Creating virtual environment...
if not exist "venv" (
  python -m venv venv
  if errorlevel 1 (
    echo ERROR: Failed to create virtual environment.
    echo Make sure Python is installed correctly.
    pause
    exit /b 1
  )
  echo Virtual environment created successfully.
) else (
  echo Virtual environment already exists.
)

set "ACTIVATE=%SERVER_DIR%\venv\Scripts\activate.bat"
if not exist "%ACTIVATE%" (
  echo ERROR: venv activation script not found at:
  echo %ACTIVATE%
  echo Trying to recreate venv...
  rmdir /s /q venv 2>nul
  python -m venv venv
  if errorlevel 1 (
    echo ERROR: Failed to recreate virtual environment.
    pause
    exit /b 1
  )
)

echo Activating virtual environment...
call "%ACTIVATE%"
if errorlevel 1 (
  echo ERROR: Failed to activate virtual environment.
  pause
  exit /b 1
)

echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
  echo ERROR: Failed to install dependencies.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Starting Flask backend...
echo Backend will run at http://127.0.0.1:5000
echo ========================================
echo.
python app.py
pause
