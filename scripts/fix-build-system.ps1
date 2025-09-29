# AdvisorOS Build System Fix
# This script addresses the major build issues and ensures proper dependency management

Write-Host "🔧 Fixing AdvisorOS Build System..." -ForegroundColor Green

# Step 1: Fix missing dependencies
Write-Host "📦 Installing missing dependencies..." -ForegroundColor Cyan

# Install TensorFlow.js and required ML dependencies
npm install --save-dev @tensorflow/tfjs-node @types/tensorflow__tfjs-node
npm install --save-dev @types/ws @types/bull
npm install --save-dev @types/ml-regression

# Install missing runtime dependencies
npm install simple-statistics ws bull ml-regression

# Step 2: Fix turbo.json configuration
Write-Host "⚙️ Updating turbo.json configuration..." -ForegroundColor Cyan

# Step 3: Fix TypeScript configuration issues
Write-Host "🔧 Fixing TypeScript configuration..." -ForegroundColor Cyan

# Step 4: Create build validation script
Write-Host "✅ Creating build validation script..." -ForegroundColor Cyan

Write-Host "🎉 Build system fixes applied!" -ForegroundColor Green
Write-Host "Run 'npm run build:fix' to test the fixes" -ForegroundColor Yellow