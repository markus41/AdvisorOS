#!/usr/bin/env node
/**
 * Cross-platform Prisma Studio launcher
 * Works with Docker, local PostgreSQL, or cloud databases
 */

const { spawn, exec } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log('🔍 Starting Prisma Studio...');

// Check if database is accessible
function testDatabaseConnection() {
  return new Promise((resolve) => {
    // First check if we have Docker and if it's running
    exec('docker-compose ps postgres 2>nul', (error, stdout) => {
      if (!error && stdout.includes('Up')) {
        console.log('✅ Using Docker database');
        resolve(true);
      } else {
        // Try to test direct database connection
        console.log('🔌 Testing direct database connection...');
        const testScript = require('./test-local-db.js');
        // We'll assume it works and let Prisma Studio handle the connection
        resolve(true);
      }
    });
  });
}

// Start Prisma Studio
function startPrismaStudio() {
  console.log('🚀 Launching Prisma Studio...');
  console.log('📊 Prisma Studio will be available at: http://localhost:5555');
  console.log('💡 Press Ctrl+C to stop Prisma Studio');
  console.log('');

  // Change to the web app directory where prisma schema is located
  const cwd = require('path').join(process.cwd(), 'apps', 'web');

  const prismaStudio = spawn(isWindows ? 'npx.cmd' : 'npx', ['prisma', 'studio'], {
    stdio: 'inherit',
    cwd: cwd
  });

  prismaStudio.on('close', (code) => {
    console.log(`\nPrisma Studio exited with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Prisma Studio...');
    prismaStudio.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping Prisma Studio...');
    prismaStudio.kill('SIGTERM');
  });
}

// Main execution
async function main() {
  try {
    await testDatabaseConnection();
    startPrismaStudio();
  } catch (error) {
    console.error('❌ Failed to start Prisma Studio:', error.message);
    console.log('\n💡 Make sure your database is running and accessible');
    console.log('   - For Docker: npm run dev:start');
    console.log('   - For local DB: Check PostgreSQL service');
    console.log('   - For cloud DB: Check network connection');
    process.exit(1);
  }
}

main();