@echo off
title Mahmoud Mobarak Portfolio - Admin Panel
echo ========================================================
echo   Mahmoud Mobarak Portfolio - Local Admin Launcher
echo ========================================================
echo.
echo Starting the admin panel on http://localhost:3000 ...
echo Your browser will open automatically once it is ready.
echo.
echo KEEP THIS WINDOW OPEN while you are editing.
echo To stop the panel: close this window or press Ctrl+C.
echo.

rem `node` must be in PATH. If this fails, install Node.js from https://nodejs.org
node admin/server.js

echo.
echo The admin panel has stopped.
pause
