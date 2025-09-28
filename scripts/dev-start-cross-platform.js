#!/usr/bin/env node
/**
 * Cross-platform development environment starter
 * Works on Windows, macOS, and Linux
 */

const { spawn, exec } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log('🚀 Starting CPA Platform Development Environment...');

// Check if Docker is running
function checkDocker() {
  return new Promise((resolve, reject) => {
    exec('docker version', (error) => {
      if (error) {
        console.error('❌ Docker is not running. Please start Docker Desktop and try again.');
        reject(error);
      } else {
        console.log('✅ Docker is running');
        resolve();
      }
    });
  });
}

// Start database services
function startServices() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting database services...');
    const dockerCompose = spawn('docker-compose', ['up', '-d', 'postgres', 'redis'], {
      stdio: 'inherit'
    });

    dockerCompose.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database services started');
        resolve();
      } else {
        reject(new Error(`Docker compose failed with code ${code}`));
      }
    });
  });
}

// Wait for PostgreSQL to be ready
function waitForPostgres() {
  return new Promise((resolve, reject) => {
    console.log('⏳ Waiting for PostgreSQL to be ready...');

    const checkConnection = () => {
      exec('docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform', (error) => {
        if (error) {
          console.log('   Waiting for PostgreSQL...');
          setTimeout(checkConnection, 2000);
        } else {
          console.log('✅ PostgreSQL is ready!');
          resolve();
        }
      });
    };

    checkConnection();
  });
}

// Run database migrations
function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running database migrations...');
    const npm = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'db:push'], {
      stdio: 'inherit'
    });

    npm.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database migrations completed');
        resolve();
      } else {
        console.log('⚠️  Migrations may have failed, but continuing...');
        resolve(); // Continue even if migrations fail for now
      }
    });
  });
}

// Start development server
function startDevServer() {
  console.log('🌐 Starting Next.js development server...');
  console.log('📊 Application will be available at: http://localhost:3000');
  console.log('🗄️  Prisma Studio will be available at: http://localhost:5555');
  console.log('🐘 pgAdmin will be available at: http://localhost:5050 (admin@cpa-platform.local / admin123)');
  console.log('');

  const npm = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    stdio: 'inherit'
  });

  npm.on('close', (code) => {
    console.log(`Development server exited with code ${code}`);
  });
}

// Main execution
async function main() {
  try {
    await checkDocker();
    await startServices();
    await waitForPostgres();
    await runMigrations();
    startDevServer();
  } catch (error) {
    console.error('❌ Failed to start development environment:', error.message);
    process.exit(1);
  }
}

main();