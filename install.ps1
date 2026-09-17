# ================================================================
#  Hardware Inspector — Auto Installer Script
#  AliStudio Lab © 2026
#  
#  CÁCH DÙNG:
#  1. Mở PowerShell với quyền Administrator
#  2. Chạy: irm https://raw.githubusercontent.com/YOUR_USERNAME/HardwareInspectorApp/main/install.ps1 | iex
#     Hoặc tải file này về rồi chạy: .\install.ps1
# ================================================================

param(
    [string]$RepoUrl = "https://github.com/aligaming11/CPUZZZ.git",
    [string]$InstallDir = "$env:LOCALAPPDATA\HardwareInspector",
    [switch]$BuildFromSource = $false
)

$AppName = "Hardware Inspector"
$Version = "2.0.0"
$Author  = "AliStudio Lab"

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ============================================================" -ForegroundColor Cyan
    Write-Host "   $AppName v$Version" -ForegroundColor White
    Write-Host "   by $Author" -ForegroundColor DarkCyan
    Write-Host "  ============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Command($cmd) {
    return $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Install-Step($msg) {
    Write-Host "  [>>] $msg" -ForegroundColor Yellow
}

function OK-Step($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Fail-Step($msg) {
    Write-Host "  [!!] $msg" -ForegroundColor Red
    exit 1
}

Write-Banner

# ---- BƯỚC 1: Kiểm tra Git ----
Install-Step "Kiem tra Git..."
if (-not (Check-Command "git")) {
    Write-Host ""
    Write-Host "  Git chua duoc cai dat. Dang tai Git tu git-scm.com..." -ForegroundColor Yellow
    $gitInstaller = "$env:TEMP\GitSetup.exe"
    Invoke-WebRequest "https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe" -OutFile $gitInstaller
    Start-Process $gitInstaller -ArgumentList "/SILENT /NORESTART" -Wait
    $env:Path += ";C:\Program Files\Git\bin"
    if (-not (Check-Command "git")) {
        Fail-Step "Khong the cai Git. Hay cai thu cong tai: https://git-scm.com"
    }
}
OK-Step "Git san sang: $(git --version)"

# ---- BƯỚC 2: Kiểm tra Node.js ----
Install-Step "Kiem tra Node.js..."
if (-not (Check-Command "node")) {
    Write-Host ""
    Write-Host "  Node.js chua duoc cai dat. Dang tai Node.js LTS..." -ForegroundColor Yellow
    $nodeInstaller = "$env:TEMP\NodeSetup.msi"
    Invoke-WebRequest "https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi" -OutFile $nodeInstaller
    Start-Process msiexec -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
    $env:Path += ";C:\Program Files\nodejs"
    if (-not (Check-Command "node")) {
        Fail-Step "Khong the cai Node.js. Hay cai thu cong tai: https://nodejs.org"
    }
}
OK-Step "Node.js san sang: $(node --version)"

# ---- BƯỚC 3: Clone repository ----
Install-Step "Dang tai source code tu GitHub..."

if (Test-Path $InstallDir) {
    Write-Host "  Thu muc da ton tai. Dang cap nhat..." -ForegroundColor DarkYellow
    Set-Location $InstallDir
    git pull origin main 2>&1 | Out-Null
} else {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    git clone $RepoUrl $InstallDir 2>&1 | Out-Null
}

if (-not (Test-Path "$InstallDir\package.json")) {
    Fail-Step "Khong the tai source code. Kiem tra URL: $RepoUrl"
}
OK-Step "Da tai xong source code -> $InstallDir"

# ---- BƯỚC 4: Cài Node modules ----
Set-Location $InstallDir
Install-Step "Dang cai dat thu vien (npm install)..."
npm install --prefer-offline 2>&1 | Out-Null
OK-Step "Da cai xong thu vien"

# ---- BƯỚC 5: Build Installer ----
if ($BuildFromSource) {
    Install-Step "Dang build file cai dat Windows (.exe)..."
    npm run build:installer 2>&1 | Out-Null
    
    $setupFile = Get-ChildItem "$InstallDir\release\*Setup*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($setupFile) {
        OK-Step "Build thanh cong: $($setupFile.Name)"
        
        Install-Step "Dang chay file cai dat..."
        Start-Process $setupFile.FullName -Wait
        OK-Step "Cai dat hoan tat!"
    } else {
        Fail-Step "Khong tim thay file .exe sau khi build."
    }
} else {
    # Chạy trực tiếp từ source (không cần build)
    Install-Step "Tao shortcut Desktop..."
    
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Hardware Inspector.lnk")
    $Shortcut.TargetPath = "cmd.exe"
    $Shortcut.Arguments = "/c `"cd /d `"$InstallDir`" && npm start`""
    $Shortcut.WorkingDirectory = $InstallDir
    $Shortcut.WindowStyle = 7
    $Shortcut.Description = "Hardware Inspector by AliStudio Lab"
    $Shortcut.Save()
    
    OK-Step "Da tao shortcut tren Desktop"
}

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "   Hoan tat! $AppName da san sang su dung." -ForegroundColor Green
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Khoi dong app:   cd `"$InstallDir`" && npm start" -ForegroundColor White
Write-Host "  Cap nhat app:    cd `"$InstallDir`" && git pull && npm install" -ForegroundColor DarkCyan
Write-Host ""
