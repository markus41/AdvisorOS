#!/usr/bin/env node

/**
 * Standalone Health Check Service for AdvisorOS
 * Comprehensive health monitoring without Azure dependencies
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class HealthCheckService {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {},
      summary: {},
      recommendations: []
    };
    
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m', 
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
  }

  log(message, color = 'white') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  logHeader(title) {
    this.log(`\n${'='.repeat(80)}`, 'cyan');
    this.log(`${this.colors.bold}🏥 ${title}${this.colors.reset}`, 'cyan');
    this.log(`${'='.repeat(80)}`, 'cyan');
  }

  logSection(title) {
    this.log(`\n${'─'.repeat(60)}`, 'blue');
    this.log(`📋 ${title}`, 'blue');
    this.log(`${'─'.repeat(60)}`, 'blue');
  }

  async checkFileSystem() {
    this.logSection('File System Health');
    const start = Date.now();
    
    try {
      // Check critical directories exist
      const criticalPaths = [
        './apps/web',
        './packages',
        './package.json',
        './apps/web/src/pages/api/health.ts'
      ];

      const results = [];
      for (const filePath of criticalPaths) {
        try {
          const stat = fs.statSync(filePath);
          results.push({
            path: filePath,
            exists: true,
            type: stat.isDirectory() ? 'directory' : 'file',
            size: stat.isFile() ? stat.size : null
          });
          this.log(`✅ ${filePath} - ${stat.isDirectory() ? 'Directory' : 'File'}`, 'green');
        } catch (error) {
          results.push({
            path: filePath,
            exists: false,
            error: error.message
          });
          this.log(`❌ ${filePath} - Missing`, 'red');
        }
      }

      // Check disk space
      let diskSpace = null;
      try {
        const { stdout } = await execAsync('df -h . | tail -1');
        const parts = stdout.trim().split(/\s+/);
        diskSpace = {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4]
        };
        this.log(`💾 Disk Usage: ${diskSpace.used}/${diskSpace.total} (${diskSpace.usePercent})`, 'blue');
      } catch (error) {
        this.log(`⚠️  Could not check disk space: ${error.message}`, 'yellow');
      }

      const responseTime = Date.now() - start;
      const status = results.every(r => r.exists) ? 'pass' : 'fail';
      
      this.results.checks.filesystem = {
        status,
        response_time_ms: responseTime,
        details: { paths: results, diskSpace },
        message: status === 'pass' ? 'All critical paths accessible' : 'Some critical paths missing'
      };

      return { status, responseTime, results, diskSpace };
    } catch (error) {
      this.results.checks.filesystem = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'File system check failed'
      };
      this.log(`❌ File system check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkPackageDependencies() {
    this.logSection('Package Dependencies');
    const start = Date.now();
    
    try {
      // Check if package.json exists and is valid
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      // Check node_modules directory
      const nodeModulesExists = fs.existsSync('./node_modules');
      this.log(`📦 Package.json: Valid (${Object.keys(packageJson.devDependencies || {}).length} dev deps)`, 'green');
      this.log(`📁 node_modules: ${nodeModulesExists ? 'Present' : 'Missing'}`, nodeModulesExists ? 'green' : 'red');

      // Try to check for outdated packages
      let outdatedPackages = null;
      try {
        const { stdout } = await execAsync('npm outdated --json', { timeout: 10000 });
        outdatedPackages = JSON.parse(stdout || '{}');
        const outdatedCount = Object.keys(outdatedPackages).length;
        this.log(`📊 Outdated packages: ${outdatedCount}`, outdatedCount > 10 ? 'yellow' : 'green');
      } catch (error) {
        this.log(`⚠️  Could not check outdated packages: ${error.message}`, 'yellow');
      }

      // Check for security vulnerabilities
      let vulnerabilities = null;
      try {
        const { stdout } = await execAsync('npm audit --json', { timeout: 15000 });
        const auditResult = JSON.parse(stdout);
        vulnerabilities = auditResult.metadata?.vulnerabilities || {};
        const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
        this.log(`🔒 Security vulnerabilities: ${total}`, total > 0 ? 'red' : 'green');
      } catch (error) {
        this.log(`⚠️  Could not run security audit: ${error.message}`, 'yellow');
      }

      const responseTime = Date.now() - start;
      const status = nodeModulesExists ? 'pass' : 'fail';
      
      this.results.checks.dependencies = {
        status,
        response_time_ms: responseTime,
        details: {
          packageJson: !!packageJson,
          nodeModules: nodeModulesExists,
          outdatedPackages,
          vulnerabilities
        },
        message: status === 'pass' ? 'Dependencies healthy' : 'Missing dependencies'
      };

      return { status, responseTime, nodeModulesExists, outdatedPackages, vulnerabilities };
    } catch (error) {
      this.results.checks.dependencies = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Dependencies check failed'
      };
      this.log(`❌ Dependencies check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkApplicationHealth() {
    this.logSection('Application Health Check');
    const start = Date.now();
    
    try {
      // Check if we can import and validate key application files
      const healthApiPath = './apps/web/src/pages/api/health.ts';
      
      if (fs.existsSync(healthApiPath)) {
        const content = fs.readFileSync(healthApiPath, 'utf8');
        const hasHealthInterface = content.includes('interface HealthStatus');
        const hasHealthChecks = content.includes('checkDatabase');
        
        this.log(`🚀 Health API: ${hasHealthInterface && hasHealthChecks ? 'Valid' : 'Incomplete'}`, 
                 hasHealthInterface && hasHealthChecks ? 'green' : 'yellow');
      } else {
        this.log(`❌ Health API: Missing`, 'red');
      }

      // Check for environment configuration
      const envExampleExists = fs.existsSync('./.env.example');
      const envExists = fs.existsSync('./.env') || fs.existsSync('./.env.local');
      
      this.log(`⚙️  Environment template: ${envExampleExists ? 'Present' : 'Missing'}`, 
               envExampleExists ? 'green' : 'yellow');
      this.log(`🔐 Environment config: ${envExists ? 'Present' : 'Missing'}`, 
               envExists ? 'green' : 'yellow');

      // Check TypeScript configuration
      const tsconfigExists = fs.existsSync('./apps/web/tsconfig.json');
      this.log(`📝 TypeScript config: ${tsconfigExists ? 'Present' : 'Missing'}`, 
               tsconfigExists ? 'green' : 'red');

      // Try to validate some TypeScript files
      let tsValidation = null;
      try {
        if (tsconfigExists) {
          // Basic syntax check for main health API
          const { stdout, stderr } = await execAsync(
            `cd apps/web && npx tsc --noEmit --skipLibCheck src/pages/api/health.ts`, 
            { timeout: 30000 }
          );
          tsValidation = { success: !stderr, output: stderr || 'No errors' };
          this.log(`✅ TypeScript validation: ${tsValidation.success ? 'Passed' : 'Has errors'}`, 
                   tsValidation.success ? 'green' : 'yellow');
        }
      } catch (error) {
        tsValidation = { success: false, error: error.message };
        this.log(`⚠️  TypeScript validation: ${error.message}`, 'yellow');
      }

      const responseTime = Date.now() - start;
      const status = (envExampleExists && tsconfigExists) ? 'pass' : 'fail';
      
      this.results.checks.application = {
        status,
        response_time_ms: responseTime,
        details: {
          healthApi: fs.existsSync(healthApiPath),
          envTemplate: envExampleExists,
          envConfig: envExists,
          typescript: tsconfigExists,
          tsValidation
        },
        message: status === 'pass' ? 'Application structure healthy' : 'Application structure issues'
      };

      return { status, responseTime };
    } catch (error) {
      this.results.checks.application = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Application health check failed'
      };
      this.log(`❌ Application health check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkSystemResources() {
    this.logSection('System Resources');
    const start = Date.now();
    
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      this.log(`🧠 Memory - RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB`, 'blue');

      // CPU load average (Linux/Mac only)
      let loadAverage = [0, 0, 0];
      try {
        if (process.platform !== 'win32') {
          loadAverage = require('os').loadavg();
          this.log(`⚡ Load Average: ${loadAverage.map(l => l.toFixed(2)).join(', ')}`, 'blue');
        }
      } catch (error) {
        this.log(`⚠️  Could not get load average: ${error.message}`, 'yellow');
      }

      // Process uptime
      const uptime = process.uptime();
      this.log(`⏱️  Process uptime: ${Math.round(uptime)}s`, 'blue');

      // Node.js version
      this.log(`🟢 Node.js version: ${process.version}`, 'green');

      const responseTime = Date.now() - start;
      const status = memUsageMB.heapUsed < 512 ? 'pass' : 'fail'; // Arbitrary 512MB limit
      
      this.results.checks.system = {
        status,
        response_time_ms: responseTime,
        details: {
          memory: memUsageMB,
          loadAverage,
          uptime,
          nodeVersion: process.version
        },
        message: status === 'pass' ? 'System resources healthy' : 'High memory usage detected'
      };

      return { status, responseTime, memUsageMB, loadAverage, uptime };
    } catch (error) {
      this.results.checks.system = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'System resources check failed'
      };
      this.log(`❌ System resources check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async runAllChecks() {
    this.logHeader('AdvisorOS Health Check Service');
    
    const startTime = Date.now();
    
    try {
      // Run all health checks
      const [filesystem, dependencies, application, system] = await Promise.all([
        this.checkFileSystem(),
        this.checkPackageDependencies(), 
        this.checkApplicationHealth(),
        this.checkSystemResources()
      ]);

      // Calculate overall status
      const checks = [filesystem, dependencies, application, system];
      const failedChecks = checks.filter(check => check.status === 'fail');
      const totalTime = Date.now() - startTime;

      let overallStatus = 'healthy';
      if (failedChecks.length > 0) {
        overallStatus = failedChecks.length >= checks.length / 2 ? 'unhealthy' : 'degraded';
      }

      this.results.status = overallStatus;
      this.results.summary = {
        totalChecks: checks.length,
        passedChecks: checks.filter(c => c.status === 'pass').length,
        failedChecks: failedChecks.length,
        totalTime,
        overallStatus
      };

      // Generate recommendations
      if (failedChecks.length > 0) {
        this.results.recommendations.push('Address failed health checks immediately');
      }
      if (dependencies.vulnerabilities && Object.keys(dependencies.vulnerabilities).length > 0) {
        this.results.recommendations.push('Update packages with security vulnerabilities');
      }
      if (!dependencies.nodeModulesExists) {
        this.results.recommendations.push('Run npm install to install dependencies');
      }

      // Final summary
      this.logSection('Health Check Summary');
      this.log(`📊 Overall Status: ${overallStatus.toUpperCase()}`, 
               overallStatus === 'healthy' ? 'green' : overallStatus === 'degraded' ? 'yellow' : 'red');
      this.log(`✅ Passed: ${this.results.summary.passedChecks}/${this.results.summary.totalChecks}`, 'green');
      
      if (failedChecks.length > 0) {
        this.log(`❌ Failed: ${failedChecks.length}`, 'red');
        failedChecks.forEach(check => {
          this.log(`   - ${check.error || 'Unknown error'}`, 'red');
        });
      }
      
      this.log(`⏱️  Total time: ${totalTime}ms`, 'blue');

      if (this.results.recommendations.length > 0) {
        this.log(`\n💡 Recommendations:`, 'yellow');
        this.results.recommendations.forEach((rec, i) => {
          this.log(`   ${i + 1}. ${rec}`, 'yellow');
        });
      }

      return this.results;
    } catch (error) {
      this.log(`❌ Health check service failed: ${error.message}`, 'red');
      this.results.status = 'unhealthy';
      this.results.error = error.message;
      return this.results;
    }
  }

  async saveResults(outputPath = './health-check-results.json') {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
      this.log(`📄 Results saved to: ${outputPath}`, 'green');
    } catch (error) {
      this.log(`❌ Failed to save results: ${error.message}`, 'red');
    }
  }
}

// CLI execution
if (require.main === module) {
  const healthCheck = new HealthCheckService();
  
  healthCheck.runAllChecks()
    .then(async (results) => {
      await healthCheck.saveResults();
      
      // Exit with appropriate code
      const exitCode = results.status === 'healthy' ? 0 : 
                      results.status === 'degraded' ? 1 : 2;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Health check failed:', error);
      process.exit(2);
    });
}

module.exports = HealthCheckService;