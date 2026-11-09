@echo off
title Azuka - Publish the phone app
cd /d "%~dp0.."
rem the app is built by GitHub Actions in the public mirror JayKazma/azuka-phone:
rem only the phone/ folder goes there, as its own history.
git rev-parse --verify HEAD >nul 2>nul || ( echo [X] Not a git repo. & pause & exit /b 1 )
for /f %%s in ('git subtree split --prefix=phone HEAD') do set SPLIT=%%s
if "%SPLIT%"=="" ( echo [X] Could not split phone/ - read the message above. & pause & exit /b 1 )
git push --force https://github.com/JayKazma/azuka-phone.git %SPLIT%:refs/heads/main
if errorlevel 1 ( echo [X] Push failed - read the message above. & pause & exit /b 1 )
echo.
echo Pushed phone/ to azuka-phone. The iOS app build starts on GitHub:
echo https://github.com/JayKazma/azuka-phone/actions
pause
