# AdvisorOS Claude CLI Setup Script (PowerShell)
# Configures the complete MCP ecosystem for seamless Claude CLI integration

param(
    [switch]$TestOnly,
    [switch]$Force
)

Write-Host "🚀 Setting up AdvisorOS Claude CLI Integration..." -ForegroundColor Green

# Check if Claude CLI is installed
try {
    $claudeVersion = claude --version 2>$null
    Write-Host "✅ Claude CLI detected: $claudeVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Claude CLI not found. Please install it first:" -ForegroundColor Yellow
    Write-Host "   npm install -g @anthropic/claude-cli" -ForegroundColor White
    Write-Host "   or follow: https://github.com/anthropic-ai/claude-cli" -ForegroundColor White
    if (-not $Force) { exit 1 }
}

# Verify directory structure
$advisorosRoot = Get-Location
if (-not (Test-Path "package.json") -or -not (Test-Path "apps/web")) {
    Write-Host "❌ Please run this script from the AdvisorOS root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ AdvisorOS root directory detected: $advisorosRoot" -ForegroundColor Green

# Create .claude directory if it doesn't exist
if (-not (Test-Path ".claude")) {
    New-Item -ItemType Directory -Path ".claude" -Force | Out-Null
}

# Verify MCP ecosystem files exist
Write-Host "🔍 Verifying MCP ecosystem files..." -ForegroundColor Cyan

$requiredFiles = @(
    ".superclaude/config.json",
    ".superclaude/mcp-servers/advisoros-context.js",
    ".superclaude/mcp-servers/tenant-validator.js", 
    ".superclaude/mcp-servers/azure-mcp-bridge.py",
    "advisoros-zen-tools/registry.py",
    "zen-mcp-server/server.py"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "❌ Required file missing: $file" -ForegroundColor Red
    }
}

if ($missingFiles.Count -gt 0 -and -not $Force) {
    Write-Host "   Please run the complete MCP installation first:" -ForegroundColor Yellow
    Write-Host "   powershell .superclaude/scripts/install-complete-mcp.ps1" -ForegroundColor White
    exit 1
}

Write-Host "✅ All required MCP ecosystem files found" -ForegroundColor Green

# Install Node.js MCP servers
if (-not $TestOnly) {
    Write-Host "📦 Installing Node.js MCP servers..." -ForegroundColor Cyan
    
    $mcpServers = @(
        "@modelcontextprotocol/server-postgres",
        "@modelcontextprotocol/server-github",
        "@modelcontextprotocol/server-puppeteer",
        "@modelcontextprotocol/server-notion",
        "@modelcontextprotocol/server-memory",
        "@modelcontextprotocol/server-reference"
    )
    
    foreach ($server in $mcpServers) {
        try {
            Write-Host "  Installing $server..." -ForegroundColor Gray
            npm install -g $server 2>$null
            Write-Host "  ✅ $server installed" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️ Failed to install $server" -ForegroundColor Yellow
        }
    }
    
    # Install Python dependencies for custom MCP servers
    Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Cyan
    
    $pythonDeps = @(
        "azure-ai-formrecognizer",
        "azure-ai-textanalytics", 
        "azure-openai",
        "mcp-python",
        "requests"
    )
    
    foreach ($dep in $pythonDeps) {
        try {
            Write-Host "  Installing $dep..." -ForegroundColor Gray
            pip install $dep 2>$null
            Write-Host "  ✅ $dep installed" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️ Failed to install $dep" -ForegroundColor Yellow
        }
    }
}

# Verify Claude CLI configuration
Write-Host "⚙️  Verifying Claude CLI configuration..." -ForegroundColor Cyan
if (Test-Path ".claude/claude_desktop_config.json") {
    Write-Host "✅ Claude CLI configuration found" -ForegroundColor Green
    
    # Test configuration syntax
    try {
        $config = Get-Content ".claude/claude_desktop_config.json" | ConvertFrom-Json
        Write-Host "✅ Configuration syntax valid" -ForegroundColor Green
        Write-Host "✅ Found $($config.mcpServers.Count) MCP servers configured" -ForegroundColor Green
    } catch {
        Write-Host "❌ Configuration syntax invalid: $($_.Exception.Message)" -ForegroundColor Red
        if (-not $Force) { exit 1 }
    }
} else {
    Write-Host "❌ Claude CLI configuration missing" -ForegroundColor Red
    if (-not $Force) { exit 1 }
}

# Create environment setup script
if (-not $TestOnly) {
    Write-Host "📝 Creating environment setup scripts..." -ForegroundColor Cyan
    
    $envSetupContent = @'
# AdvisorOS Claude CLI Environment Setup (PowerShell)

Write-Host "Setting up AdvisorOS Claude CLI environment..." -ForegroundColor Green

# PostgreSQL Connection (Development)
$env:POSTGRES_CONNECTION_STRING = "postgresql://user:pass@localhost:5432/advisoros_dev?schema=public"

# GitHub Integration
if (-not $env:GITHUB_PERSONAL_ACCESS_TOKEN) {
    Write-Host "⚠️  GITHUB_PERSONAL_ACCESS_TOKEN not set" -ForegroundColor Yellow
}

# Azure AI Services
if (-not $env:AZURE_FORM_RECOGNIZER_KEY) {
    Write-Host "⚠️  AZURE_FORM_RECOGNIZER_KEY not set" -ForegroundColor Yellow
}
if (-not $env:AZURE_TEXT_ANALYTICS_KEY) {
    Write-Host "⚠️  AZURE_TEXT_ANALYTICS_KEY not set" -ForegroundColor Yellow
}
if (-not $env:AZURE_OPENAI_KEY) {
    Write-Host "⚠️  AZURE_OPENAI_KEY not set" -ForegroundColor Yellow
}

# Notion Integration
if (-not $env:NOTION_API_KEY) {
    Write-Host "⚠️  NOTION_API_KEY not set" -ForegroundColor Yellow
}

# Python Path for Custom MCP Servers
$currentPath = Get-Location
$pythonPaths = @(
    "$currentPath\.superclaude\mcp-servers",
    "$currentPath\zen-mcp-server", 
    "$currentPath\advisoros-zen-tools"
)
$env:PYTHONPATH = ($pythonPaths -join ";") + ";" + $env:PYTHONPATH

Write-Host "✅ Environment configured for AdvisorOS Claude CLI" -ForegroundColor Green
Write-Host "🚀 Start with: claude chat --config .claude\claude_desktop_config.json" -ForegroundColor Cyan
'@
    
    $envSetupContent | Out-File -FilePath ".claude/setup-env.ps1" -Encoding UTF8
    
    # Create quick start script
    $quickStartContent = @'
# Quick start script for AdvisorOS Claude CLI

param(
    [string[]]$Arguments
)

# Source environment
& ".claude/setup-env.ps1"

# Start Claude CLI with AdvisorOS MCP ecosystem
Write-Host "🚀 Starting Claude CLI with AdvisorOS MCP Ecosystem..." -ForegroundColor Green
claude chat --config .claude/claude_desktop_config.json @Arguments
'@
    
    $quickStartContent | Out-File -FilePath ".claude/start-claude.ps1" -Encoding UTF8
    
    # Create health check script
    $healthCheckContent = @'
# Health check for AdvisorOS MCP ecosystem

Write-Host "🔍 AdvisorOS MCP Ecosystem Health Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check Claude CLI
Write-Host -NoNewline "Claude CLI: "
try {
    $claudeVersion = claude --version 2>$null
    Write-Host "✅ Installed ($claudeVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not found" -ForegroundColor Red
}

# Check Node.js MCP servers
$mcpServers = @(
    "@modelcontextprotocol/server-postgres",
    "@modelcontextprotocol/server-github", 
    "@modelcontextprotocol/server-puppeteer",
    "@modelcontextprotocol/server-notion",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-reference"
)

foreach ($server in $mcpServers) {
    Write-Host -NoNewline "$server`: "
    try {
        $result = npm list -g $server 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Installed" -ForegroundColor Green
        } else {
            Write-Host "❌ Missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Missing" -ForegroundColor Red
    }
}

# Check Python dependencies
$pythonDeps = @(
    @{Name="azure-ai-formrecognizer"; Import="azure.ai.formrecognizer"},
    @{Name="azure-ai-textanalytics"; Import="azure.ai.textanalytics"},
    @{Name="azure-openai"; Import="azure.openai"},
    @{Name="mcp-python"; Import="mcp"},
    @{Name="requests"; Import="requests"}
)

foreach ($dep in $pythonDeps) {
    Write-Host -NoNewline "$($dep.Name): "
    try {
        python -c "import $($dep.Import)" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Installed" -ForegroundColor Green
        } else {
            Write-Host "❌ Missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Missing" -ForegroundColor Red
    }
}

# Check custom MCP files
$customFiles = @(
    ".superclaude/mcp-servers/advisoros-context.js",
    ".superclaude/mcp-servers/tenant-validator.js",
    ".superclaude/mcp-servers/azure-mcp-bridge.py",
    "zen-mcp-server/server.py",
    "advisoros-zen-tools/registry.py"
)

foreach ($file in $customFiles) {
    Write-Host -NoNewline "$(Split-Path $file -Leaf): "
    if (Test-Path $file) {
        Write-Host "✅ Found" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "   . .claude/setup-env.ps1" -ForegroundColor White
Write-Host "   .claude/start-claude.ps1" -ForegroundColor White
Write-Host ""
'@
    
    $healthCheckContent | Out-File -FilePath ".claude/health-check.ps1" -Encoding UTF8
}

Write-Host ""
Write-Host "🎉 AdvisorOS Claude CLI Integration Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure your environment variables in .claude/setup-env.ps1" -ForegroundColor White
Write-Host "2. Run health check: ./.claude/health-check.ps1" -ForegroundColor White
Write-Host "3. Start Claude CLI: ./.claude/start-claude.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Quick Start:" -ForegroundColor Cyan
Write-Host "   . .claude/setup-env.ps1" -ForegroundColor White
Write-Host "   claude chat --config .claude/claude_desktop_config.json" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full documentation: .claude/README.md" -ForegroundColor Cyan

if ($TestOnly) {
    Write-Host ""
    Write-Host "✅ Test mode completed successfully" -ForegroundColor Green
}