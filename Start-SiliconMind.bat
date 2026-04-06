@echo off
echo ==============================================
echo   SILICONMIND PRO - Local Server Launcher
echo ==============================================
echo.

echo Starting Python Backend API on port 8000...
start cmd /k "cd ai_backend && run_backend.bat"

timeout /t 3 >nul

echo Starting Next.js Frontend on port 3000...
start cmd /k "cd siliconmind && npm run dev"

echo.
echo Servers are launching in separate windows...
echo Opening browser in 5 seconds...
timeout /t 5 >nul
start http://localhost:3000

exit
