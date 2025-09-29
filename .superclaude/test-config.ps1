function Test-SuperClaudeConfig {
    Write-Host "🔍 Testing SuperClaude Configuration..." -ForegroundColor Cyan
    
    $configFiles = @(
        ".superclaude\config.json",
        ".superclaude\agents\cpa-expert.yaml",
        ".superclaude\agents\security-auditor.yaml",
        ".superclaude\agents\azure-architect.yaml"
    )
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Write-Host "✅ Found: $file" -ForegroundColor Green
        } else {
            Write-Host "❌ Missing: $file" -ForegroundColor Red
        }
    }
    
    Write-Host "SuperClaude configuration test completed!" -ForegroundColor Green
}

Test-SuperClaudeConfig