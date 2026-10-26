@echo off
title Nagdev Products Plant ERP - Live Host
cd /d "%~dp0"
echo ========================================================
echo Starting Nagdev Products Plant ERP on Local & Cloud...
echo ========================================================
start "Next.js Production Server" npm.cmd run start
timeout /t 3 /nobreak >nul
echo Starting Cloudflare Public Tunnel...
"C:\Users\hardi\cloudflared.exe" tunnel --url http://localhost:3000
pause
