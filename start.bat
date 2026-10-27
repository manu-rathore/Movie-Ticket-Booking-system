@echo off
cd /d "%~dp0server"
start "Backend" cmd /k npm run dev
cd /d "%~dp0client"
start "Frontend" cmd /k npm run dev
timeout /t 6 >nul
start http://localhost:5173
