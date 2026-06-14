# Development startup script - runs all three services with live reload
# Frontend HMR: http://localhost:5173
# Backend API: http://127.0.0.1:5000
# ML Service: http://127.0.0.1:8000

Write-Host "======================================"
Write-Host "Batik Klasifikasi Development Mode"
Write-Host "======================================"

# Get the root directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Open PowerShell windows for each service
Write-Host ""
Write-Host "Starting ML Service..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\ml_service'; `$env:PYTHONUNBUFFERED=1; & '.\venv\Scripts\python.exe' -m uvicorn app:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend (HMR enabled)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev"

Write-Host ""
Write-Host "======================================"
Write-Host "All services started!"
Write-Host "======================================"
Write-Host ""
Write-Host "Frontend HMR:    http://localhost:5173"
Write-Host "Backend API:     http://127.0.0.1:5000"
Write-Host "ML Service:      http://127.0.0.1:8000"
Write-Host ""
Write-Host "Changes to React/CSS files will auto-reload in browser"
Write-Host "No need for manual Ctrl+F5 refresh!"
Write-Host ""
