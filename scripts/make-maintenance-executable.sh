#!/bin/bash

# Make all maintenance scripts executable
echo "🔧 Making maintenance scripts executable..."

chmod +x scripts/maintenance/health-check.js
chmod +x scripts/maintenance/backup-verification.js 
chmod +x scripts/maintenance/security-scan.js
chmod +x scripts/maintenance/performance-analysis.js
chmod +x scripts/maintenance/cost-analysis.js
chmod +x scripts/maintenance/maintenance-orchestrator.js

echo "✅ All maintenance scripts are now executable"
echo ""
echo "Available maintenance commands:"
echo "  npm run maintenance:health     - Run health checks"
echo "  npm run maintenance:backup     - Run backup verification"
echo "  npm run maintenance:security   - Run security scan"
echo "  npm run maintenance:performance - Run performance analysis"
echo "  npm run maintenance:cost       - Run cost analysis"
echo "  npm run maintenance:all        - Run complete maintenance suite"
echo ""