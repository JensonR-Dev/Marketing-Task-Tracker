# Publishes the app to GitHub Pages via the public repo marketing-tracker-live.
# Run from anywhere:  .\scripts\deploy-pages.ps1
$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

$env:GH_PAGES_BASE = "/marketing-tracker-live/"
$env:VITE_BACKEND = "supabase"
npm run build

Set-Location dist
git init -b main | Out-Null
git add -A
git -c user.name="Jenson" -c user.email="jenson.r@manageartworks.com" commit -m "deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Out-Null
git push --force https://github.com/JensonR-Dev/marketing-tracker-live.git main
Set-Location ..

Write-Host ""
Write-Host "Deployed. Live in ~1 minute at: https://jensonr-dev.github.io/marketing-tracker-live/"
