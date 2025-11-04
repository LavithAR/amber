@echo off
title AMBER SCRABBLE INTERHOUSE - SERVER STARTUP
echo ==============================================
echo         AMBER SCRABBLE INTERHOUSE
echo ==============================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    exit /b
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm not found. Please reinstall Node.js.
    pause
    exit /b
)

echo Installing dependencies...
npm install

echo.
echo Building project...
npm run build

echo.
echo Starting server on port 10000...
npm start

echo.
echo ==============================================
echo  SERVER IS NOW RUNNING! OPEN IN BROWSER:
echo  http://localhost:10000
echo ==============================================
pause
