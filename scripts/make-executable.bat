@echo off
setlocal
cd /d "%~dp0.."
if errorlevel 1 goto :error

echo [1/3] Building player...
call npm run build:player
if errorlevel 1 goto :error

echo [2/3] Building library...
call npm run build:library
if errorlevel 1 goto :error

echo [3/3] Creating Windows installer with Node 22...
rem Node 24.16.0 exits prematurely while extracting Electron on this machine.
call npx --yes --package=node@22 node node_modules/@electron-forge/cli/dist/electron-forge.js make --platform=win32 --arch=x64
if errorlevel 1 goto :error

echo.
echo Build completed successfully.
echo Installer folder: "%CD%\out\make\squirrel.windows\x64"
echo.
pause
exit /b 0

:error
echo.
echo Build failed. See the error above.
echo.
pause
exit /b 1
