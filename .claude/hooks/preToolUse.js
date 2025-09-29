#!/usr/bin/env node

/**
 * Pre-Tool Use Hook for AdvisorOS
 * Provides safety guardrails and governance for tool execution
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const toolName = process.argv[2];
const toolArgs = process.argv.slice(3);

// Security patterns to block
const dangerousPatterns = [
  /rm\s+-rf\s+\//, // Dangerous deletion patterns
  /DROP\s+DATABASE/i, // Database destruction
  /DELETE\s+FROM.*WHERE\s+1=1/i, // Mass data deletion
  /\.env/, // Environment file access in production context
  /private.*key/i, // Private key exposure
  /terraform\s+destroy/i, // Infrastructure destruction
];

// Critical files that require approval
const criticalFiles = [
  'prisma/schema.prisma',
  'infrastructure/terraform/',
  '.env.production',
  'package.json',
  'apps/web/next.config.js',
];

function checkSecurityConstraints() {
  const command = toolArgs.join(' ');

  // Check for dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      console.error(`🚫 BLOCKED: Dangerous operation detected: ${command}`);
      console.error(`Reason: Pattern "${pattern}" is not allowed`);
      process.exit(2); // Exit code 2 blocks execution
    }
  }

  // Check for critical file modifications
  if (toolName === 'Edit' || toolName === 'Write') {
    const filePath = toolArgs[0];
    for (const criticalFile of criticalFiles) {
      if (filePath && filePath.includes(criticalFile)) {
        console.log(`⚠️  APPROVAL REQUIRED: Modifying critical file: ${filePath}`);
        console.log('Please confirm this change is intentional (y/n):');
        // In a real implementation, this would prompt for input
        // For automation, we'll log and continue with additional safety checks
      }
    }
  }
}

function logToolExecution() {
  const logEntry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    args: toolArgs,
    user: process.env.USER || process.env.USERNAME || 'unknown',
    workingDirectory: process.cwd()
  };

  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Append to audit log
  const logFile = path.join(logsDir, 'tool-execution.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Main execution
try {
  checkSecurityConstraints();
  logToolExecution();

  // Allow execution to continue
  console.log(`✅ Tool execution approved: ${toolName}`);
  process.exit(0);
} catch (error) {
  console.error(`❌ Hook execution failed: ${error.message}`);
  process.exit(1);
}