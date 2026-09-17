@echo off
chcp 65001 >nul 2>&1
title Hardware Inspector — Cai Dat Tu GitHub

echo.
echo  ==============================================================
echo   Hardware Inspector v2.0 — by AliStudio Lab
echo   Script cai dat tu dong tu GitHub
echo  ==============================================================
echo.

REM ---- Kiểm tra Git ----
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] Git chua duoc cai dat!
    echo  [>>] Vui long cai Git tai: https://git-scm.com/download/win
    echo  [>>] Sau do chay lai file nay.
    pause
    exit /b 1
)
echo  [OK] Git san sang.

REM ---- Kiểm tra Node.js ----
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] Node.js chua duoc cai dat!
    echo  [>>] Vui long cai Node.js tai: https://nodejs.org
    echo  [>>] Sau do chay lai file nay.
    pause
    exit /b 1
)
echo  [OK] Node.js san sang.

REM ---- Chọn thư mục cài đặt ----
set INSTALL_DIR=%LOCALAPPDATA%\HardwareInspector
set REPO_URL=https://github.com/aligaming11/CPUZZZ.git

echo.
echo  [>>] Thu muc cai dat: %INSTALL_DIR%
echo  [>>] GitHub Repo    : %REPO_URL%
echo.

REM ---- Clone hoặc Update ----
if exist "%INSTALL_DIR%\package.json" (
    echo  [>>] Da tim thay phien ban cu. Dang cap nhat...
    cd /d "%INSTALL_DIR%"
    git pull origin main
) else (
    echo  [>>] Dang tai source code tu GitHub...
    git clone %REPO_URL% "%INSTALL_DIR%"
    if %ERRORLEVEL% NEQ 0 (
        echo  [!!] Khong the clone repo. Kiem tra URL va ket noi mang.
        pause
        exit /b 1
    )
    cd /d "%INSTALL_DIR%"
)

echo  [OK] Da tai xong source code.

REM ---- Cài npm packages ----
echo  [>>] Dang cai thu vien (npm install)...
npm install --prefer-offline
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] npm install that bai!
    pause
    exit /b 1
)
echo  [OK] Thu vien da duoc cai dat.

REM ---- Tạo shortcut Desktop ----
echo  [>>] Tao shortcut tren Desktop...
set SHORTCUT=%USERPROFILE%\Desktop\Hardware Inspector.bat
echo @echo off > "%SHORTCUT%"
echo cd /d "%INSTALL_DIR%" >> "%SHORTCUT%"
echo npm start >> "%SHORTCUT%"
echo  [OK] Da tao shortcut: %SHORTCUT%

echo.
echo  ==============================================================
echo   HOAN TAT! Hardware Inspector da san sang.
echo.
echo   Khoi dong : Click file "Hardware Inspector" tren Desktop
echo               hoac chay: cd "%INSTALL_DIR%" && npm start
echo.
echo   Cap nhat  : Chay lai file install.bat nay bat ky luc nao
echo  ==============================================================
echo.

set /p LAUNCH="Khoi dong app ngay? (y/n): "
if /i "%LAUNCH%"=="y" (
    cd /d "%INSTALL_DIR%"
    start npm start
)

pause
