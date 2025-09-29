#!/usr/bin/env node

/**
 * Post-Tool Use Hook for AdvisorOS
 * Enforces code quality and runs automated validations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const toolName = process.argv[2];
const toolArgs = process.argv.slice(3);
const filePath = toolArgs[0];

// Quality control configurations
const qualityChecks = {
  '.ts': ['eslint', 'typescript'],
  '.tsx': ['eslint', 'typescript'],
  '.js': ['eslint'],
  '.jsx': ['eslint'],
  '.json': ['json-lint'],
  '.md': ['markdown-lint'],
  '.prisma': ['prisma-validate']
};

function runQualityChecks(modifiedFile) {
  if (!fs.existsSync(modifiedFile)) {
    return;
  }

  const ext = path.extname(modifiedFile);
  const checks = qualityChecks[ext];

  if (!checks) {
    console.log(`ℹ️  No quality checks configured for ${ext} files`);
    return;
  }

  console.log(`🔍 Running quality checks for: ${modifiedFile}`);

  try {
    // Run ESLint for applicable files
    if (checks.includes('eslint')) {
      try {
        execSync(`npx eslint "${modifiedFile}" --fix`, {
          stdio: 'pipe',
          cwd: process.cwd()
        });
        console.log('✅ ESLint: Passed');
      } catch (error) {
        console.error('❌ ESLint: Failed');
        console.error(error.stdout.toString());
        return blockExecution('ESLint violations found');
      }
    }

    // Run TypeScript compilation check
    if (checks.includes('typescript')) {
      try {
        execSync('npx tsc --noEmit', {
          stdio: 'pipe',
          cwd: process.cwd()
        });
        console.log('✅ TypeScript: Compilation check passed');
      } catch (error) {
        console.error('❌ TypeScript: Compilation errors found');
        console.error(error.stdout.toString());
        return blockExecution('TypeScript compilation errors');
      }
    }

    // Validate Prisma schema
    if (checks.includes('prisma-validate') && modifiedFile.includes('schema.prisma')) {
      try {
        execSync('npx prisma validate', {
          stdio: 'pipe',
          cwd: 'apps/web'
        });
        console.log('✅ Prisma: Schema validation passed');
      } catch (error) {
        console.error('❌ Prisma: Schema validation failed');
        console.error(error.stdout.toString());
        return blockExecution('Prisma schema validation errors');
      }
    }

    console.log('✅ All quality checks passed');

  } catch (error) {
    console.error(`❌ Quality check execution failed: ${error.message}`);
    return blockExecution('Quality check execution error');
  }
}

function blockExecution(reason) {
  const response = {
    decision: 'block',
    reason: reason,
    suggestion: 'Please fix the quality issues before proceeding'
  };

  console.log(JSON.stringify(response));
  process.exit(1);
}

function runAutomaticFixes(modifiedFile) {
  if (!fs.existsSync(modifiedFile)) {
    return;
  }

  const ext = path.extname(modifiedFile);

  try {
    // Auto-format with Prettier
    if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md'].includes(ext)) {
      execSync(`npx prettier --write "${modifiedFile}"`, {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ Prettier: Auto-formatted');
    }

    // Auto-fix ESLint issues
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      execSync(`npx eslint "${modifiedFile}" --fix`, {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ ESLint: Auto-fixed');
    }

  } catch (error) {
    console.log(`ℹ️  Some auto-fixes may have failed: ${error.message}`);
  }
}

// Main execution
try {
  if (toolName === 'Edit' || toolName === 'Write') {
    if (filePath) {
      console.log(`🔧 Post-processing: ${filePath}`);

      // Run automatic fixes first
      runAutomaticFixes(filePath);

      // Then run quality checks
      runQualityChecks(filePath);
    }
  }

  console.log('✅ Post-tool processing completed');
  process.exit(0);

} catch (error) {
  console.error(`❌ Post-tool hook failed: ${error.message}`);
  process.exit(1);
}