# PowerShell script to build APK with file locking workaround
# This script attempts to handle Windows file locking issues

Write-Host "Building APK for VIPsyncApp..." -ForegroundColor Green

# Step 1: Clean build directories
Write-Host "`n[1/4] Cleaning build directories..." -ForegroundColor Yellow
if (Test-Path "android") {
    Remove-Item -Recurse -Force "android" -ErrorAction SilentlyContinue
}
Get-ChildItem -Path "node_modules" -Recurse -Directory -Filter "build" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -like "*android\build" } | 
    ForEach-Object { Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue }

# Step 2: Prebuild
Write-Host "`n[2/4] Running expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "Prebuild failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Clean Gradle
Write-Host "`n[3/4] Cleaning Gradle build..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat clean

# Step 4: Build with retry logic
Write-Host "`n[4/4] Building APK (this may take several minutes)..." -ForegroundColor Yellow
Write-Host "If you encounter file locking errors, try:" -ForegroundColor Cyan
Write-Host "  1. Close any file explorers in the project directory" -ForegroundColor Cyan
Write-Host "  2. Temporarily disable antivirus real-time scanning" -ForegroundColor Cyan
Write-Host "  3. Close Android Studio if open" -ForegroundColor Cyan
Write-Host "  4. Use EAS Build instead: npm run build:android" -ForegroundColor Cyan
Write-Host ""

$maxRetries = 3
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    $retryCount++
    Write-Host "Attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
    
    # Clean codegen directories before each attempt
    $codegenDirs = @(
        "..\node_modules\@react-native-async-storage\async-storage\android\build\generated",
        "..\node_modules\react-native-safe-area-context\android\build\generated",
        "..\node_modules\react-native-gesture-handler\android\build\generated",
        "..\node_modules\@react-native-community\datetimepicker\android\build\generated",
        "..\node_modules\@shopify\react-native-skia\android\build\generated"
    )
    
    foreach ($dir in $codegenDirs) {
        if (Test-Path $dir) {
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        }
    }
    
    # Wait a moment for file locks to release
    Start-Sleep -Seconds 2
    
    # Build
    .\gradlew.bat assembleRelease --no-daemon
    
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        Write-Host "`n✓ Build successful!" -ForegroundColor Green
        Write-Host "APK location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Green
    } else {
        if ($retryCount -lt $maxRetries) {
            Write-Host "Build failed. Retrying in 5 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "`n✗ Build failed after $maxRetries attempts." -ForegroundColor Red
            Write-Host "`nRecommendation: Use EAS Build (cloud) to avoid Windows file locking issues:" -ForegroundColor Cyan
            Write-Host "  npm run build:android" -ForegroundColor White
        }
    }
}

Set-Location ..
