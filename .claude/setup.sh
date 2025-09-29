#!/bin/bash

# AdvisorOS Claude CLI Setup Script
# Configures the complete MCP ecosystem for seamless Claude CLI integration

set -e

echo "🚀 Setting up AdvisorOS Claude CLI Integration..."

# Check if Claude CLI is installed
if ! command -v claude &> /dev/null; then
    echo "⚠️  Claude CLI not found. Please install it first:"
    echo "   npm install -g @anthropic/claude-cli"
    echo "   or follow: https://github.com/anthropic-ai/claude-cli"
    exit 1
fi

# Verify directory structure
ADVISOROS_ROOT="$(pwd)"
if [[ ! -f "package.json" ]] || [[ ! -d "apps/web" ]]; then
    echo "❌ Please run this script from the AdvisorOS root directory"
    exit 1
fi

echo "✅ AdvisorOS root directory detected: $ADVISOROS_ROOT"

# Create .claude directory if it doesn't exist
mkdir -p .claude

# Verify MCP ecosystem files exist
echo "🔍 Verifying MCP ecosystem files..."

REQUIRED_FILES=(
    ".superclaude/config.json"
    ".superclaude/mcp-servers/advisoros-context.js"
    ".superclaude/mcp-servers/tenant-validator.js"
    ".superclaude/mcp-servers/azure-mcp-bridge.py"
    "advisoros-zen-tools/registry.py"
    "zen-mcp-server/server.py"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Required file missing: $file"
        echo "   Please run the complete MCP installation first:"
        echo "   powershell .superclaude/scripts/install-complete-mcp.ps1"
        exit 1
    fi
done

echo "✅ All required MCP ecosystem files found"

# Install Node.js MCP servers
echo "📦 Installing Node.js MCP servers..."
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-notion
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-reference

# Install Python dependencies for custom MCP servers
echo "🐍 Installing Python dependencies..."
pip install azure-ai-formrecognizer azure-ai-textanalytics azure-openai mcp-python requests

# Verify Claude CLI configuration
echo "⚙️  Verifying Claude CLI configuration..."
if [[ -f ".claude/claude_desktop_config.json" ]]; then
    echo "✅ Claude CLI configuration found"
    
    # Test configuration syntax
    if python -m json.tool .claude/claude_desktop_config.json > /dev/null 2>&1; then
        echo "✅ Configuration syntax valid"
    else
        echo "❌ Configuration syntax invalid"
        exit 1
    fi
else
    echo "❌ Claude CLI configuration missing"
    exit 1
fi

# Create environment setup script
cat > .claude/setup-env.sh << 'EOF'
#!/bin/bash
# AdvisorOS Claude CLI Environment Setup

echo "Setting up AdvisorOS Claude CLI environment..."

# PostgreSQL Connection (Development)
export POSTGRES_CONNECTION_STRING="postgresql://user:pass@localhost:5432/advisoros_dev?schema=public"

# GitHub Integration
export GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-}"

# Azure AI Services
export AZURE_FORM_RECOGNIZER_KEY="${AZURE_FORM_RECOGNIZER_KEY:-}"
export AZURE_TEXT_ANALYTICS_KEY="${AZURE_TEXT_ANALYTICS_KEY:-}"
export AZURE_OPENAI_KEY="${AZURE_OPENAI_KEY:-}"

# Notion Integration
export NOTION_API_KEY="${NOTION_API_KEY:-}"

# Python Path for Custom MCP Servers
export PYTHONPATH="$PWD/.superclaude/mcp-servers:$PWD/zen-mcp-server:$PWD/advisoros-zen-tools:$PYTHONPATH"

echo "✅ Environment configured for AdvisorOS Claude CLI"
echo "🚀 Start with: claude chat --config .claude/claude_desktop_config.json"
EOF

chmod +x .claude/setup-env.sh

# Create quick start script
cat > .claude/start-claude.sh << 'EOF'
#!/bin/bash
# Quick start script for AdvisorOS Claude CLI

# Source environment
source .claude/setup-env.sh

# Start Claude CLI with AdvisorOS MCP ecosystem
echo "🚀 Starting Claude CLI with AdvisorOS MCP Ecosystem..."
claude chat --config .claude/claude_desktop_config.json "$@"
EOF

chmod +x .claude/start-claude.sh

# Create health check script
cat > .claude/health-check.sh << 'EOF'
#!/bin/bash
# Health check for AdvisorOS MCP ecosystem

echo "🔍 AdvisorOS MCP Ecosystem Health Check"
echo "======================================"

# Check Claude CLI
echo -n "Claude CLI: "
if command -v claude &> /dev/null; then
    echo "✅ Installed"
else
    echo "❌ Not found"
fi

# Check Node.js MCP servers
MCP_SERVERS=(
    "@modelcontextprotocol/server-postgres"
    "@modelcontextprotocol/server-github"
    "@modelcontextprotocol/server-puppeteer"
    "@modelcontextprotocol/server-notion"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-reference"
)

for server in "${MCP_SERVERS[@]}"; do
    echo -n "$server: "
    if npm list -g "$server" &> /dev/null; then
        echo "✅ Installed"
    else
        echo "❌ Missing"
    fi
done

# Check Python dependencies
PYTHON_DEPS=(
    "azure-ai-formrecognizer"
    "azure-ai-textanalytics" 
    "azure-openai"
    "mcp-python"
)

for dep in "${PYTHON_DEPS[@]}"; do
    echo -n "$dep: "
    if python -c "import ${dep//-/_}" &> /dev/null; then
        echo "✅ Installed"
    else
        echo "❌ Missing"
    fi
done

# Check custom MCP files
CUSTOM_FILES=(
    ".superclaude/mcp-servers/advisoros-context.js"
    ".superclaude/mcp-servers/tenant-validator.js"
    ".superclaude/mcp-servers/azure-mcp-bridge.py"
    "zen-mcp-server/server.py"
    "advisoros-zen-tools/registry.py"
)

for file in "${CUSTOM_FILES[@]}"; do
    echo -n "$(basename "$file"): "
    if [[ -f "$file" ]]; then
        echo "✅ Found"
    else
        echo "❌ Missing"
    fi
done

echo ""
echo "🎯 Quick Start Commands:"
echo "   source .claude/setup-env.sh"
echo "   ./.claude/start-claude.sh"
echo ""
EOF

chmod +x .claude/health-check.sh

echo ""
echo "🎉 AdvisorOS Claude CLI Integration Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your environment variables in .claude/setup-env.sh"
echo "2. Run health check: ./.claude/health-check.sh"
echo "3. Start Claude CLI: ./.claude/start-claude.sh"
echo ""
echo "🚀 Quick Start:"
echo "   source .claude/setup-env.sh"
echo "   claude chat --config .claude/claude_desktop_config.json"
echo ""
echo "📖 Full documentation: .claude/README.md"
echo ""