#!/usr/bin/env node
/**
 * Test local database connection without Docker
 * For use with local PostgreSQL installation or cloud databases
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...\n');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    console.log('   Please create .env file from .env.example');
    process.exit(1);
  }

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in .env file');
    console.log('   Please set DATABASE_URL in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment file found');
  console.log(`📍 Database URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

  // Test database connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful');

    // Test basic query
    const result = await client.query('SELECT version() as version, now() as current_time');
    console.log('✅ Database query successful');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`   Current time: ${result.rows[0].current_time}`);

    // Test if required extensions exist
    const extensionsResult = await client.query(`
      SELECT extname FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
      ORDER BY extname
    `);

    const extensions = extensionsResult.rows.map(row => row.extname);
    if (extensions.includes('uuid-ossp')) {
      console.log('✅ uuid-ossp extension available');
    } else {
      console.log('⚠️  uuid-ossp extension not found (may be needed for UUIDs)');
    }

    if (extensions.includes('pgcrypto')) {
      console.log('✅ pgcrypto extension available');
    } else {
      console.log('⚠️  pgcrypto extension not found (may be needed for encryption)');
    }

    // Test Prisma client
    const prismaClientPath = path.join(process.cwd(), 'apps', 'web', 'node_modules', '.prisma', 'client');
    if (fs.existsSync(prismaClientPath)) {
      console.log('✅ Prisma client is generated');
    } else {
      console.log('⚠️  Prisma client not found');
      console.log('   Run: npm run db:generate');
    }

    console.log('\n🎉 Database setup is working correctly!');
    console.log('\nNext steps:');
    console.log('  npm run db:push     - Push schema to database');
    console.log('  npm run db:studio   - Open Prisma Studio');
    console.log('  npm run dev         - Start development server');

  } catch (error) {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${error.message}`);

    // Provide helpful error messages
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Suggestions:');
      console.log('   - Check if the database host is correct');
      console.log('   - Verify internet connection (for cloud databases)');
      console.log('   - Ensure PostgreSQL service is running (for local databases)');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('   - Check if PostgreSQL is running on the specified port');
      console.log('   - Verify the port number in DATABASE_URL');
      console.log('   - Check firewall settings');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Suggestions:');
      console.log('   - Check username and password in DATABASE_URL');
      console.log('   - Verify user exists in PostgreSQL');
      console.log('   - Check pg_hba.conf for authentication settings');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabaseConnection();