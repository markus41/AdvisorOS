# Simple MCP Setup for AdvisorOS
Write-Host "Setting up MCP servers for AdvisorOS..." -ForegroundColor Green

# Install core Node.js MCP servers
Write-Host "Installing Node.js MCP servers..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-github  
npm install -g @modelcontextprotocol/server-memory

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install mcp requests

# Create missing directories
if (-not (Test-Path "zen-mcp-server")) {
    New-Item -ItemType Directory -Path "zen-mcp-server" | Out-Null
}
if (-not (Test-Path "advisoros-zen-tools")) {
    New-Item -ItemType Directory -Path "advisoros-zen-tools" | Out-Null
}

Write-Host "Basic MCP setup complete!" -ForegroundColor Green
Write-Host "You can now use: claude chat --config .claude\claude_desktop_config.json" -ForegroundColor Yellow