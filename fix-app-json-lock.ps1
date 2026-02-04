# Script to fix app.json file locking issues
# Run this if you encounter EBUSY errors with app.json

Write-Host "Fixing app.json file locking issues..." -ForegroundColor Green

$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Step 1: Check for temporary app.json files
Write-Host "`n[1/3] Checking for temporary app.json files..." -ForegroundColor Yellow
$tempFiles = Get-ChildItem -Path $projectRoot -Filter "app.json.*" -ErrorAction SilentlyContinue

if ($tempFiles) {
    Write-Host "Found $($tempFiles.Count) temporary file(s):" -ForegroundColor Cyan
    foreach ($file in $tempFiles) {
        Write-Host "  - $($file.Name)" -ForegroundColor Gray
        
        # Try to read and merge EAS project ID if present
        try {
            $tempContent = Get-Content $file.FullName -Raw | ConvertFrom-Json
            if ($tempContent.expo.extra.eas.projectId) {
                $projectId = $tempContent.expo.extra.eas.projectId
                Write-Host "    Found EAS project ID: $projectId" -ForegroundColor Green
                
                # Merge into main app.json
                $mainJson = Get-Content "app.json" -Raw | ConvertFrom-Json
                if (-not $mainJson.expo.extra) {
                    $mainJson.expo | Add-Member -MemberType NoteProperty -Name "extra" -Value @{}
                }
                if (-not $mainJson.expo.extra.eas) {
                    $mainJson.expo.extra | Add-Member -MemberType NoteProperty -Name "eas" -Value @{}
                }
                $mainJson.expo.extra.eas.projectId = $projectId
                
                # Save app.json (close it first if open in editor)
                Write-Host "    Merging EAS project ID into app.json..." -ForegroundColor Yellow
                $mainJson | ConvertTo-Json -Depth 10 | Set-Content "app.json" -NoNewline
            }
        } catch {
            Write-Host "    Could not parse temporary file: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No temporary files found." -ForegroundColor Green
}

# Step 2: Clean up temporary files
Write-Host "`n[2/3] Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path "$projectRoot\app.json.*" -Force -ErrorAction SilentlyContinue
Write-Host "Temporary files removed." -ForegroundColor Green

# Step 3: Verify app.json is accessible
Write-Host "`n[3/3] Verifying app.json..." -ForegroundColor Yellow
try {
    $testContent = Get-Content "app.json" -Raw | ConvertFrom-Json
    Write-Host "✓ app.json is valid and accessible" -ForegroundColor Green
    
    if ($testContent.expo.extra.eas.projectId) {
        Write-Host "✓ EAS project ID is present: $($testContent.expo.extra.eas.projectId)" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error reading app.json: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ All done! You can now retry your build." -ForegroundColor Green
Write-Host "`nTip: Close app.json in your editor before running EAS commands to prevent file locks." -ForegroundColor Cyan
