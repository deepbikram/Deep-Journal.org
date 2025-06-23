# Deep Journal Windows Installer Helper
# This script helps bypass Windows SmartScreen warnings

param(
    [string]$installerPath = "Deep Journal Setup 1.2.3.exe"
)

Write-Host "🚀 Deep Journal Installation Helper" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if installer exists
if (-not (Test-Path $installerPath)) {
    Write-Host "❌ Installer not found: $installerPath" -ForegroundColor Red
    Write-Host "Please ensure the installer is in the same directory as this script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📥 Download the installer from:" -ForegroundColor Green
    Write-Host "https://github.com/deepbikram/Deep-Journal.org/releases/latest" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found installer: $installerPath" -ForegroundColor Green
Write-Host ""

# Unblock the file to bypass SmartScreen
try {
    Write-Host "🔓 Unblocking installer file..." -ForegroundColor Yellow
    Unblock-File $installerPath -ErrorAction Stop
    Write-Host "✅ File unblocked successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not unblock file automatically." -ForegroundColor Yellow
    Write-Host "You may see a SmartScreen warning - click 'More info' then 'Run anyway'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting installation..." -ForegroundColor Cyan

# Start the installer
try {
    Start-Process $installerPath -Wait -ErrorAction Stop
    Write-Host "✅ Installation completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual installation steps:" -ForegroundColor Yellow
    Write-Host "1. Right-click the installer → Properties" -ForegroundColor White
    Write-Host "2. Check 'Unblock' at the bottom → Apply → OK" -ForegroundColor White
    Write-Host "3. Double-click the installer to run" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Thank you for using Deep Journal!" -ForegroundColor Cyan
Write-Host "📖 Documentation: https://github.com/deepbikram/Deep-Journal.org" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
