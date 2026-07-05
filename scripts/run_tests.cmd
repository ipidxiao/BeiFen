@echo off
setlocal
cd /d "%~dp0.."
node tests\run_all_smoke.js
exit /b %ERRORLEVEL%
