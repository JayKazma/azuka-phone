@echo off
title Azuka - Update the phone app
cd /d "%~dp0"
rem Over-the-air update: the phone swaps in the new JavaScript next time it opens
rem (or from Settings > Update now). A native change needs build.bat instead.
if not exist node_modules ( echo Installing packages first... & call npm ci || ( echo [X] npm ci failed. & pause & exit /b 1 ) )
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set D=%%c-%%a-%%b
call npx eas-cli update --channel main --environment production --message "update %D% %time:~0,5%" --non-interactive
if errorlevel 1 ( echo [X] Update failed - read the message above. & pause & exit /b 1 )
echo.
echo Published. Open the app on the phone: it updates on launch, or press Update now in Settings.
pause
