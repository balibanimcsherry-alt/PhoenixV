@echo off
title Coastal Haven - Shutdown

echo Stopping Coastal Haven servers...

for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":8000 "') do (
    taskkill /f /pid %%p >nul 2>&1
)

for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":5173 "') do (
    taskkill /f /pid %%p >nul 2>&1
)

taskkill /fi "WINDOWTITLE eq CoastalHaven-Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq CoastalHaven-Frontend*" /f >nul 2>&1

echo Done. Both servers stopped.
