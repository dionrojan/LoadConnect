@echo off
title LoadConnect Launcher
echo ========================================================
echo               Starting LoadConnect (YOKI)               
echo ========================================================
echo.

echo Starting Backend Server (Port 5000)...
start "LoadConnect - Backend" cmd /k "cd /d "%~dp0Backend" && node server.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend Dev Server (Port 5173)...
start "LoadConnect - Frontend" cmd /k "cd /d "%~dp0Frontend" && npm.cmd run dev"

echo.
echo ========================================================
echo Services are starting:
echo   - Backend API: http://localhost:5000
echo   - Frontend UI: http://localhost:5173
echo ========================================================
echo.
