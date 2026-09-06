@echo off
title Mahmoud Mobarak Portfolio - Admin Panel
echo ========================================================
echo   Mahmoud Mobarak Portfolio - Local Admin Launcher
echo ========================================================
echo.
echo Starting local admin server on http://localhost:3000...
echo All edits are strictly local and automatically sync to index.html
echo for direct deployment to GitHub Pages.
echo.

start "" "http://localhost:3000"
node admin/server.js
pause
