# Quick Health Check for AdvisorOS MCP Ecosystem
Write-Host "AdvisorOS MCP Ecosystem Health Check" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if Claude CLI is available
Write-Host -NoNewline "Claude CLI: "
try {
    $claudeHelp = claude --help 2>$null
    Write-Host "Available" -ForegroundColor Green
} catch {
    Write-Host "Not found - install with: npm install -g @anthropic/claude-cli" -ForegroundColor Yellow
}

# Check key configuration files
$configFiles = @(
    @{Path=".claude\claude_desktop_config.json"; Name="Claude Config"},
    @{Path=".superclaude\config.json"; Name="SuperClaude Config"},
    @{Path="zen-mcp-server\server.py"; Name="Zen MCP Server"},
    @{Path="advisoros-zen-tools\registry.py"; Name="CPA Tools"}
)

foreach ($file in $configFiles) {
    Write-Host -NoNewline "$($file.Name): "
    if (Test-Path $file.Path) {
        Write-Host "Found" -ForegroundColor Green
    } else {
        Write-Host "Missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Quick Start Commands:" -ForegroundColor Yellow
Write-Host "1. Basic usage: claude chat --config .claude\claude_desktop_config.json" -ForegroundColor White
Write-Host "2. With context: claude chat 'Help me review the tax calculation logic in AdvisorOS'" -ForegroundColor White
Write-Host "3. CPA workflow: claude chat 'Perform a multi-tenant security audit'" -ForegroundColor White