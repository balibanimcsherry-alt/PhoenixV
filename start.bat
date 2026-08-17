@echo off
title Coastal Haven - Launcher

echo Starting Coastal Haven servers...

start "CoastalHaven-Backend" cmd /k "cd /d C:\Users\sriha\OneDrive\Desktop && python -m uvicorn website_phoenix.main:app --reload --port 8000"

start "CoastalHaven-Frontend" cmd /k "cd /d C:\Users\sriha\OneDrive\Desktop\website_phoenix && npm run dev"

echo.
echo  Backend API : http://localhost:8000
echo  API Docs    : http://localhost:8000/docs
echo  Frontend    : http://localhost:5173
echo.
echo Run stop.bat to shut down both servers.
