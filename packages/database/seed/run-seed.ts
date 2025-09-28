import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runSeed() {
  console.log('🚀 Starting CPA Platform Demo Data Generation...\n');

  try {
    console.log('📦 Installing dependencies...');
    await execAsync('npm install bcryptjs date-fns', { cwd: __dirname });

    console.log('🌱 Running comprehensive seed...');
    await execAsync('npx tsx comprehensive-seed.ts', { cwd: __dirname });

    console.log('\n🎉 Demo data generation completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your development server');
    console.log('2. Navigate to any of the demo organizations');
    console.log('3. Log in with demo credentials (password: demo123!)');
    console.log('4. Explore the comprehensive demo data');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();