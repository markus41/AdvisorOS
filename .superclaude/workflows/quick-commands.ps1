# AdvisorOS SuperClaude Quick Commands
# Simplified PowerShell commands for common SuperClaude operations

# Quick security audit
function Invoke-QuickSecurityAudit {
    Write-Host "🔒 Running quick security audit..." -ForegroundColor Cyan
    
    $criticalFiles = @(
        "apps/web/src/server/api/trpc.ts",
        "packages/database/schema.prisma"
    )
    
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Write-Host "Checking: $file" -ForegroundColor Yellow
            # Basic pattern checks for organizationId
            $content = Get-Content $file -Raw
            
            if ($content -match "organizationId") {
                Write-Host "✅ organizationId found in $file" -ForegroundColor Green
            } else {
                Write-Host "⚠️  organizationId not found in $file" -ForegroundColor Red
            }
            
            if ($content -match "organizationProcedure") {
                Write-Host "✅ organizationProcedure found in $file" -ForegroundColor Green
            }
        }
    }
}

# Quick CPA workflow check
function Invoke-QuickCPACheck {
    Write-Host "💼 Running quick CPA workflow check..." -ForegroundColor Cyan
    
    $cpaFiles = @(
        "apps/web/src/server/api/routers/client.ts",
        "apps/web/src/server/services/"
    )
    
    foreach ($path in $cpaFiles) {
        if (Test-Path $path) {
            Write-Host "✅ CPA workflow file found: $path" -ForegroundColor Green
        } else {
            Write-Host "⚠️  CPA workflow file missing: $path" -ForegroundColor Yellow
        }
    }
}

# Quick Azure service check
function Invoke-QuickAzureCheck {
    Write-Host "⚡ Running quick Azure services check..." -ForegroundColor Cyan
    
    $azurePackages = @(
        "@azure/ai-form-recognizer",
        "@azure/ai-text-analytics", 
        "@azure/openai",
        "@azure/search-documents"
    )
    
    if (Test-Path "apps/web/package.json") {
        $packageContent = Get-Content "apps/web/package.json" -Raw | ConvertFrom-Json
        
        foreach ($package in $azurePackages) {
            if ($packageContent.dependencies.$package) {
                Write-Host "✅ $package found" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $package not found" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "🚀 AdvisorOS SuperClaude Quick Commands Loaded!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  Invoke-QuickSecurityAudit  - Quick multi-tenant security check" -ForegroundColor Green
Write-Host "  Invoke-QuickCPACheck      - Quick CPA workflow validation" -ForegroundColor Green  
Write-Host "  Invoke-QuickAzureCheck    - Quick Azure services check" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  Invoke-QuickSecurityAudit" -ForegroundColor Cyan
Write-Host "  Invoke-QuickCPACheck" -ForegroundColor Cyan
Write-Host "  Invoke-QuickAzureCheck" -ForegroundColor Cyan