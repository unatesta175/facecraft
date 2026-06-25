# FaceCraft EC2 Deployment Script
# Run this from: C:\Users\User\facecraft

Write-Host "=== FaceCraft Deployment to EC2 ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Git Push
Write-Host "Step 1: Pushing changes to GitHub..." -ForegroundColor Yellow
Write-Host "Running: git add ." -ForegroundColor Gray
git add .

Write-Host "Running: git status" -ForegroundColor Gray
git status

$commitMsg = Read-Host "Enter commit message"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host "Running: git commit -m `"$commitMsg`"" -ForegroundColor Gray
git commit -m "$commitMsg"

Write-Host "Running: git push origin main" -ForegroundColor Gray
git push origin main

Write-Host "✓ Pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions for EC2
Write-Host "Step 2: Deploy on EC2" -ForegroundColor Yellow
Write-Host "Copy and paste these commands into your EC2 SSH terminal:" -ForegroundColor Cyan
Write-Host ""
Write-Host "cd /var/www/facecraft" -ForegroundColor White
Write-Host "git pull origin main" -ForegroundColor White
Write-Host "npm install --production=false" -ForegroundColor White
Write-Host "npm run db:generate" -ForegroundColor White
Write-Host "npm run db:migrate:deploy --workspace=apps/api" -ForegroundColor White
Write-Host "npm run build" -ForegroundColor White
Write-Host "pm2 restart facecraft-api facecraft-web" -ForegroundColor White
Write-Host "pm2 status" -ForegroundColor White
Write-Host ""

Write-Host "After running those commands, check:" -ForegroundColor Yellow
Write-Host "http://54.255.93.4" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key when done to open browser..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://54.255.93.4"
