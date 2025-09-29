#!/usr/bin/env node
/**
 * Complete Database Setup Script
 *
 * This script completes the database setup after you've updated the DATABASE_URL
 * with your actual Supabase credentials.
 *
 * Steps performed:
 * 1. Verify database connection
 * 2. Push Prisma schema to database
 * 3. Generate Prisma client
 * 4. Seed database with demo data
 * 5. Final verification
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'bright');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function execCommand(command, workingDir = process.cwd()) {
  try {
    log(`  Running: ${command}`, 'cyan');
    const result = execSync(command, {
      cwd: workingDir,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

async function main() {
  log('🚀 Starting Complete Database Setup Process', 'bright');
  log('='.repeat(50), 'cyan');

  const rootDir = process.cwd();
  const webAppDir = path.join(rootDir, 'apps', 'web');
  const databaseDir = path.join(rootDir, 'packages', 'database');

  // Step 1: Verify Environment
  logStep('1️⃣', 'Verifying Environment Setup...');

  // Check if .env file exists
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    logError('.env file not found');
    process.exit(1);
  }
  logSuccess('.env file found');

  // Check if DATABASE_URL is set
  require('dotenv').config();
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL not found in .env file');
    process.exit(1);
  }

  // Check if DATABASE_URL contains placeholder values
  if (process.env.DATABASE_URL.includes('[YOUR-PASSWORD]') || process.env.DATABASE_URL.includes('[PROJECT-REF]')) {
    logError('DATABASE_URL still contains placeholder values');
    logInfo('Please update DATABASE_URL in your .env file with actual Supabase credentials');
    logInfo('Go to: Supabase Dashboard → Settings → Database → Connection string');
    process.exit(1);
  }
  logSuccess('DATABASE_URL is properly configured');

  // Step 2: Test Database Connection
  logStep('2️⃣', 'Testing Database Connection...');
  const connectionTest = execCommand('node scripts/test-local-db.js', rootDir);
  if (!connectionTest.success) {
    logError('Database connection test failed');
    log(connectionTest.output, 'red');
    process.exit(1);
  }
  logSuccess('Database connection successful');

  // Step 3: Push Prisma Schema
  logStep('3️⃣', 'Pushing Prisma Schema to Database...');
  const schemaPush = execCommand('npx prisma db push --accept-data-loss', webAppDir);
  if (!schemaPush.success) {
    logError('Failed to push Prisma schema');
    log(schemaPush.output, 'red');
    process.exit(1);
  }
  logSuccess('Prisma schema pushed successfully');

  // Step 4: Generate Prisma Client
  logStep('4️⃣', 'Generating Prisma Client...');
  const clientGenerate = execCommand('npx prisma generate', webAppDir);
  if (!clientGenerate.success) {
    logError('Failed to generate Prisma client');
    log(clientGenerate.output, 'red');
    process.exit(1);
  }
  logSuccess('Prisma client generated successfully');

  // Step 5: Install dependencies for database package (if needed)
  logStep('5️⃣', 'Ensuring Database Package Dependencies...');
  const databasePackageInstall = execCommand('npm install', databaseDir);
  if (!databasePackageInstall.success) {
    logWarning('Failed to install database package dependencies');
    log(databasePackageInstall.output, 'yellow');
  } else {
    logSuccess('Database package dependencies verified');
  }

  // Step 6: Seed Database
  logStep('6️⃣', 'Seeding Database with Demo Data...');
  const seedDatabase = execCommand('npm run db:seed', databaseDir);
  if (!seedDatabase.success) {
    logError('Failed to seed database');
    log(seedDatabase.output, 'red');

    // Try alternative seeding approach
    logInfo('Trying alternative seeding approach...');
    const altSeed = execCommand('npx tsx seed.ts', databaseDir);
    if (!altSeed.success) {
      logError('Alternative seeding also failed');
      log(altSeed.output, 'red');
      process.exit(1);
    }
  }
  logSuccess('Database seeded successfully with demo data');

  // Step 7: Final Verification
  logStep('7️⃣', 'Final Verification...');

  // Test connection again
  const finalTest = execCommand('node scripts/test-local-db.js', rootDir);
  if (!finalTest.success) {
    logWarning('Final connection test had issues');
    log(finalTest.output, 'yellow');
  } else {
    logSuccess('Final connection test passed');
  }

  // Check if Prisma client exists
  const prismaClientPath = path.join(webAppDir, 'node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    logSuccess('Prisma client is available');
  } else {
    logWarning('Prisma client directory not found');
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('🎉 Database Setup Complete!', 'bright');
  log('='.repeat(50), 'cyan');

  logInfo('What was accomplished:');
  log('  • Database connection verified', 'green');
  log('  • Prisma schema pushed to Supabase', 'green');
  log('  • Prisma client generated', 'green');
  log('  • Database seeded with comprehensive demo data', 'green');

  logInfo('\nDemo Data Created:');
  log('  • 3 Organizations (Demo, Acme, Elite)', 'blue');
  log('  • 6 Users with different roles', 'blue');
  log('  • 4 Clients with realistic business data', 'blue');
  log('  • 2 Workflows (Tax prep, Bookkeeping)', 'blue');
  log('  • 2 Engagements with tasks', 'blue');
  log('  • 2 Invoices (sent and paid)', 'blue');
  log('  • Sample documents, notes, and reports', 'blue');
  log('  • Audit logs and auth events', 'blue');

  logInfo('\nNext Steps:');
  log('  • npm run dev         - Start development server', 'cyan');
  log('  • npm run db:studio   - Open Prisma Studio', 'cyan');
  log('  • Login with: john.doe@demo.com / password123', 'cyan');

  logInfo('\nUseful Commands:');
  log('  • npm run db:push     - Push schema changes', 'magenta');
  log('  • npm run db:generate - Regenerate Prisma client', 'magenta');
  log('  • npm run db:studio   - Open database browser', 'magenta');

  log('\n✨ Your AdvisorOS database is ready for development!', 'bright');
}

// Run the setup
main().catch((error) => {
  logError('Setup process failed');
  console.error(error);
  process.exit(1);
});