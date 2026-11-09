@echo off
title Azuka - Build the phone app
cd /d "%~dp0.."
rem Native build: mirrors phone/ to the public repo JayKazma/azuka-phone, where
rem Codemagic builds the ipa. Only needed when a native package or app.json changed.
git rev-parse --verify HEAD >nul 2>nul || ( echo [X] Not a git repo. & pause & exit /b 1 )
for /f %%s in ('git subtree split --prefix=phone HEAD') do set SPLIT=%%s
if "%SPLIT%"=="" ( echo [X] Could not split phone/ - read the message above. & pause & exit /b 1 )
git push --force https://github.com/JayKazma/azuka-phone.git %SPLIT%:refs/heads/main
if errorlevel 1 ( echo [X] Push failed - read the message above. & pause & exit /b 1 )
echo.
echo Pushed phone/ to azuka-phone. Codemagic builds the ipa; install it with Sideloadly.
pause
