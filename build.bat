@echo off
chcp 65001 >nul 2>&1
title Hardware Inspector — Build Installer

echo.
echo  ==============================================================
echo   Hardware Inspector v2.0 — Build Windows Installer
echo   AliStudio Lab
echo  ==============================================================
echo.

cd /d "%~dp0"

echo  [1/3] Cai dat dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] npm install that bai!
    pause
    exit /b 1
)

echo.
echo  Chon kieu build:
echo    1. NSIS Installer (.exe co wizard cai dat)
echo    2. Portable (.exe chay thang, khong can cai)
echo    3. Ca hai (NSIS + Portable)
echo.
set /p CHOICE="Nhap so (1/2/3): "

if "%CHOICE%"=="1" (
    echo  [2/3] Dang build NSIS Installer...
    call npm run build:installer
)
if "%CHOICE%"=="2" (
    echo  [2/3] Dang build Portable...
    call npm run build:portable
)
if "%CHOICE%"=="3" (
    echo  [2/3] Dang build ca hai...
    call npm run build:all
)

if %ERRORLEVEL% NEQ 0 (
    echo  [!!] Build that bai. Xem log phia tren.
    pause
    exit /b 1
)

echo.
echo  [3/3] Kiem tra output...
echo.
dir /b release\*.exe 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  Khong tim thay file .exe trong thu muc release\
) else (
    echo.
    echo  [OK] File da duoc tao trong: %~dp0release\
)

echo.
echo  ==============================================================
echo   BUILD HOAN TAT!
echo  ==============================================================
echo.
explorer release
pause
