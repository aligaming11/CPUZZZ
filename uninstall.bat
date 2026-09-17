@echo off
chcp 65001 >nul 2>&1
title Hardware Inspector — Go Cai Dat (Uninstall)

echo.
echo  ==============================================================
echo   Hardware Inspector — Go Cai Dat (Uninstall)
echo   AliStudio Lab
echo  ==============================================================
echo.

set INSTALL_DIR=%LOCALAPPDATA%\HardwareInspector
set SHORTCUT=%USERPROFILE%\Desktop\Hardware Inspector.bat
set SHORTCUT_LNK=%USERPROFILE%\Desktop\Hardware Inspector.lnk

echo  Ban co chac chan muon go cai dat Hardware Inspector khoi may?
echo  - Thu muc app: %INSTALL_DIR%
echo  - Shortcut tren Desktop
echo.
set /p CONFIRM="Nhap 'y' de xac nhan go bo, hoac bat ky phim nao de huy: "
if /i not "%CONFIRM%"=="y" (
    echo.
    echo  [!] Da huy thao tac go cai dat.
    pause
    exit /b 0
)

echo.
echo  [>>] Dang dong cac tien trinh dang chay...
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM "Hardware Inspector.exe" /T >nul 2>&1

echo  [>>] Dang xoa shortcut tren Desktop...
if exist "%SHORTCUT%" del /f /q "%SHORTCUT%" >nul 2>&1
if exist "%SHORTCUT_LNK%" del /f /q "%SHORTCUT_LNK%" >nul 2>&1

echo  [>>] Dang xoa thu muc ung dung...
if exist "%INSTALL_DIR%" (
    rmdir /s /q "%INSTALL_DIR%"
)

echo.
echo  ==============================================================
echo  [OK] Da go cai dat Hardware Inspector thanh cong khoi may!
echo  ==============================================================
echo.
pause
