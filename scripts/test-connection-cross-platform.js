#!/usr/bin/env node
/**
 * Cross-platform database connection tester
 * Tests all aspects of the development environment setup
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
let hasErrors = false;

console.log('🧪 Testing CPA Platform database connection and setup...\n');

// Helper function to run shell commands
function runCommand(command, description) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${description}: FAILED`);
        if (stderr) console.log(`   Error: ${stderr.trim()}`);
        hasErrors = true;
        resolve(false);
      } else {
        console.log(`✅ ${description}: PASSED`);
        resolve(true);
      }
    });
  });
}

// Test functions
async function testDocker() {
  return runCommand('docker version', 'Docker is running');
}

async function testDockerCompose() {
  return runCommand('docker-compose version', 'Docker Compose is available');
}

async function startDatabaseIfNeeded() {
  return new Promise((resolve) => {
    exec('docker-compose ps postgres', (error, stdout) => {
      if (!stdout.includes('Up')) {
        console.log('⚠️  Starting database...');
        const dockerCompose = spawn('docker-compose', ['up', '-d', 'postgres'], {
          stdio: 'pipe'
        });

        dockerCompose.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database started');
            // Wait a moment for it to be ready
            setTimeout(() => {
              waitForPostgres().then(resolve);
            }, 2000);
          } else {
            console.log('❌ Failed to start database');
            hasErrors = true;
            resolve(false);
          }
        });
      } else {
        console.log('✅ Database is already running');
        resolve(true);
      }
    });
  });
}

function waitForPostgres() {
  return new Promise((resolve) => {
    const checkConnection = () => {
      exec('docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform', (error) => {
        if (error) {
          setTimeout(checkConnection, 1000);
        } else {
          resolve(true);
        }
      });
    };
    checkConnection();
  });
}

async function testDatabaseConnection() {
  return runCommand(
    'docker-compose exec -T postgres psql -U cpa_user -d cpa_platform -c "SELECT version();"',
    'Database connection'
  );
}

async function testPrismaClient() {
  const prismaClientPath = path.join(process.cwd(), 'apps', 'web', 'node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('✅ Prisma client is generated: PASSED');
    return true;
  } else {
    console.log('⚠️  Prisma client not found, generating...');
    return new Promise((resolve) => {
      const npm = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'db:generate'], {
        stdio: 'pipe'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Prisma client generated: PASSED');
          resolve(true);
        } else {
          console.log('❌ Failed to generate Prisma client: FAILED');
          hasErrors = true;
          resolve(false);
        }
      });
    });
  }
}

async function testEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists: PASSED');

    // Check if DATABASE_URL is set correctly
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform')) {
      console.log('✅ DATABASE_URL is configured correctly: PASSED');
      return true;
    } else {
      console.log('⚠️  DATABASE_URL may not be configured for local development');
      return true; // Non-critical
    }
  } else {
    console.log('❌ .env file not found: FAILED');
    console.log('   Please create .env file from .env.example');
    hasErrors = true;
    return false;
  }
}

async function testNodeModules() {
  const webNodeModules = path.join(process.cwd(), 'apps', 'web', 'node_modules');
  const rootNodeModules = path.join(process.cwd(), 'node_modules');

  if (fs.existsSync(webNodeModules) && fs.existsSync(rootNodeModules)) {
    console.log('✅ Node modules are installed: PASSED');
    return true;
  } else {
    console.log('❌ Node modules not found: FAILED');
    console.log('   Please run: npm install');
    hasErrors = true;
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('Running environment tests...\n');

  // Test basic requirements
  await testDocker();
  await testDockerCompose();
  await testNodeModules();
  await testEnvFile();

  // Test database setup
  await startDatabaseIfNeeded();
  await testDatabaseConnection();
  await testPrismaClient();

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Some tests failed. Please fix the issues above.');
    console.log('\nCommon solutions:');
    console.log('  - Ensure Docker Desktop is running');
    console.log('  - Run: npm install');
    console.log('  - Create .env file from .env.example');
    console.log('  - Run: npm run dev:start');
  } else {
    console.log('🎉 All tests passed! Development environment is ready.');
    console.log('\nNext steps:');
    console.log('  npm run dev:start     - Start full development environment');
    console.log('  npm run dev:studio    - Open Prisma Studio');
    console.log('  npm run dev:connect   - Connect to database via psql');
  }
  console.log('='.repeat(50));

  process.exit(hasErrors ? 1 : 0);
}

runTests();