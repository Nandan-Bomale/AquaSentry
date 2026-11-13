@echo off
title AquaSentry - AI Water Intelligence Platform
color 0B

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║   AquaSentry - AI Water Intelligence     ║
echo  ║   MANTHAN 2.0 - Challenge 06             ║
echo  ╚═══════════════════════════════════════════╝
echo.
echo  Starting services...
echo.

REM Start Python Backend
echo  [1/2] Starting AI Backend (FastAPI)...
start "AquaSentry Backend" /B cmd /c "cd /d ""%~dp0aquasentry-backend"" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

REM Start Next.js Frontend
echo  [2/2] Starting Frontend (Next.js)...
start "AquaSentry Frontend" /B cmd /c "cd /d ""%~dp0aquasentry"" && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo  ════════════════════════════════════════════
echo   AQUASENTRY IS RUNNING!
echo  ════════════════════════════════════════════
echo   Dashboard:  http://localhost:3000
echo   API Docs:   http://localhost:8000/docs
echo   API Health: http://localhost:8000/api/health
echo  ════════════════════════════════════════════
echo.

start "" "http://localhost:3000"

pause
