@echo off
set "PATH=%LOCALAPPDATA%\MinGit\cmd;%LOCALAPPDATA%\Microsoft\WinGet\Packages\GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe\bin;%PATH%"
cd /d "%~dp0"
echo ====================================================
echo Pushing TechnoKids Portal to GitHub...
echo ====================================================
git push -u origin main
echo.
echo ====================================================
if %ERRORLEVEL% equ 0 (
    echo SUCCESS! All code is live on GitHub!
) else (
    echo If asked to sign in, follow the on-screen prompt.
)
echo ====================================================
pause
