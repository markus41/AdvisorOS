#!/usr/bin/env node

/**
 * Performance Analysis Service for AdvisorOS
 * Comprehensive performance analysis without external dependencies
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PerformanceAnalysisService {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {},
      metrics: {},
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
    
    // Performance thresholds
    this.thresholds = {
      memory: {
        heap_used: 512 * 1024 * 1024, // 512MB
        rss: 1024 * 1024 * 1024       // 1GB
      },
      load: {
        average_1m: 2.0,
        average_5m: 1.5,
        average_15m: 1.0
      },
      build: {
        time: 60000 // 60 seconds
      },
      bundle: {
        size: 5 * 1024 * 1024 // 5MB
      }
    };
  }

  log(message, color = 'white') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  logHeader(title) {
    this.log(`\n${'='.repeat(80)}`, 'cyan');
    this.log(`${this.colors.bold}📊 ${title}${this.colors.reset}`, 'cyan');
    this.log(`${'='.repeat(80)}`, 'cyan');
  }

  logSection(title) {
    this.log(`\n${'─'.repeat(60)}`, 'blue');
    this.log(`📋 ${title}`, 'blue');
    this.log(`${'─'.repeat(60)}`, 'blue');
  }

  async checkSystemPerformance() {
    this.logSection('System Performance Metrics');
    const start = Date.now();
    
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      };
      
      // CPU Load (Unix-like systems only)
      let loadAverage = [0, 0, 0];
      let cpuInfo = null;
      try {
        if (process.platform !== 'win32') {
          loadAverage = require('os').loadavg();
          cpuInfo = require('os').cpus();
        }
      } catch (error) {
        this.log(`⚠️  Could not get CPU info: ${error.message}`, 'yellow');
      }

      // Process information
      const processInfo = {
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };

      // Network interfaces (if available)
      let networkInfo = null;
      try {
        networkInfo = require('os').networkInterfaces();
      } catch (error) {
        this.log(`⚠️  Could not get network info: ${error.message}`, 'yellow');
      }

      // Display metrics
      this.log(`🧠 Memory Usage:`, 'blue');
      this.log(`   RSS: ${memUsageMB.rss}MB ${this.getPerformanceIndicator(memUsage.rss, this.thresholds.memory.rss)}`, 
               memUsage.rss > this.thresholds.memory.rss ? 'yellow' : 'green');
      this.log(`   Heap Used: ${memUsageMB.heapUsed}MB/${memUsageMB.heapTotal}MB ${this.getPerformanceIndicator(memUsage.heapUsed, this.thresholds.memory.heap_used)}`, 
               memUsage.heapUsed > this.thresholds.memory.heap_used ? 'yellow' : 'green');
      this.log(`   External: ${memUsageMB.external}MB`, 'blue');

      if (loadAverage[0] > 0) {
        this.log(`⚡ CPU Load Average:`, 'blue');
        this.log(`   1m: ${loadAverage[0].toFixed(2)} ${this.getPerformanceIndicator(loadAverage[0], this.thresholds.load.average_1m)}`, 
                 loadAverage[0] > this.thresholds.load.average_1m ? 'yellow' : 'green');
        this.log(`   5m: ${loadAverage[1].toFixed(2)} ${this.getPerformanceIndicator(loadAverage[1], this.thresholds.load.average_5m)}`, 
                 loadAverage[1] > this.thresholds.load.average_5m ? 'yellow' : 'green');
        this.log(`   15m: ${loadAverage[2].toFixed(2)} ${this.getPerformanceIndicator(loadAverage[2], this.thresholds.load.average_15m)}`, 
                 loadAverage[2] > this.thresholds.load.average_15m ? 'yellow' : 'green');
      }

      if (cpuInfo) {
        this.log(`🔧 CPU Cores: ${cpuInfo.length} (${cpuInfo[0].model})`, 'blue');
      }

      this.log(`⏱️  Process Uptime: ${processInfo.uptime}s`, 'blue');
      this.log(`🟢 Node.js: ${processInfo.nodeVersion} (${processInfo.platform}/${processInfo.arch})`, 'green');

      const responseTime = Date.now() - start;
      const status = this.evaluateSystemPerformance(memUsage, loadAverage);
      
      this.results.checks.systemPerformance = {
        status,
        response_time_ms: responseTime,
        details: {
          memory: memUsageMB,
          loadAverage,
          processInfo,
          cpuInfo: cpuInfo ? { count: cpuInfo.length, model: cpuInfo[0].model } : null,
          networkInfo: networkInfo ? Object.keys(networkInfo).length : 0
        },
        message: status === 'pass' ? 
          'System performance within acceptable limits' : 
          'System performance issues detected'
      };

      return { status, responseTime, memUsage: memUsageMB, loadAverage, processInfo };
    } catch (error) {
      this.results.checks.systemPerformance = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'System performance check failed'
      };
      this.log(`❌ System performance check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkBuildPerformance() {
    this.logSection('Build Performance Analysis');
    const start = Date.now();
    
    try {
      let buildResults = null;
      let buildTime = null;
      
      // Try to analyze build performance
      try {
        this.log(`🔨 Attempting to analyze build configuration...`, 'blue');
        
        // Check package.json build scripts
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const buildScripts = {
          build: packageJson.scripts?.build,
          dev: packageJson.scripts?.dev,
          lint: packageJson.scripts?.lint,
          test: packageJson.scripts?.test
        };
        
        this.log(`📦 Build scripts configured: ${Object.keys(buildScripts).filter(k => buildScripts[k]).length}`, 'green');
        
        // Check for TypeScript configuration
        const tsconfigExists = fs.existsSync('./apps/web/tsconfig.json');
        if (tsconfigExists) {
          const tsconfig = JSON.parse(fs.readFileSync('./apps/web/tsconfig.json', 'utf8'));
          this.log(`📝 TypeScript config: ${tsconfig.compilerOptions ? 'Configured' : 'Basic'}`, 'green');
        }
        
        // Check for Next.js configuration
        const nextConfigExists = fs.existsSync('./apps/web/next.config.js');
        if (nextConfigExists) {
          this.log(`⚡ Next.js config: Present`, 'green');
        }
        
        // Simulate build time estimation
        const estimatedBuildTime = this.estimateBuildTime();
        this.log(`⏱️  Estimated build time: ${estimatedBuildTime}ms`, 
                 estimatedBuildTime > this.thresholds.build.time ? 'yellow' : 'green');
        
        buildResults = {
          scripts: buildScripts,
          typescript: tsconfigExists,
          nextjs: nextConfigExists,
          estimatedTime: estimatedBuildTime
        };
        
      } catch (error) {
        this.log(`⚠️  Could not analyze build: ${error.message}`, 'yellow');
        buildResults = { error: error.message };
      }

      const responseTime = Date.now() - start;
      const status = buildResults && !buildResults.error ? 'pass' : 'fail';
      
      this.results.checks.buildPerformance = {
        status,
        response_time_ms: responseTime,
        details: buildResults,
        message: status === 'pass' ? 
          'Build configuration analyzed successfully' : 
          'Build performance analysis failed'
      };

      return { status, responseTime, buildResults };
    } catch (error) {
      this.results.checks.buildPerformance = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Build performance check failed'
      };
      this.log(`❌ Build performance check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkCodeQualityMetrics() {
    this.logSection('Code Quality & Performance Analysis');
    const start = Date.now();
    
    try {
      const codeMetrics = await this.analyzeCodebase();
      
      this.log(`📁 Total files analyzed: ${codeMetrics.totalFiles}`, 'blue');
      this.log(`📏 Total lines of code: ${codeMetrics.totalLines.toLocaleString()}`, 'blue');
      this.log(`📊 Average file size: ${Math.round(codeMetrics.averageFileSize)} lines`, 'blue');
      this.log(`🔍 Complex files (>500 lines): ${codeMetrics.complexFiles}`, 
               codeMetrics.complexFiles > 5 ? 'yellow' : 'green');
      
      // File type breakdown
      this.log(`📋 File type breakdown:`, 'blue');
      Object.entries(codeMetrics.fileTypes).forEach(([type, count]) => {
        this.log(`   ${type}: ${count} files`, 'white');
      });

      // Performance issues detection
      const performanceIssues = this.detectPerformanceIssues(codeMetrics);
      this.log(`⚠️  Potential performance issues: ${performanceIssues.length}`, 
               performanceIssues.length > 0 ? 'yellow' : 'green');
      
      if (performanceIssues.length > 0) {
        this.log(`   Issues found:`, 'yellow');
        performanceIssues.slice(0, 3).forEach(issue => {
          this.log(`   - ${issue}`, 'yellow');
        });
      }

      const responseTime = Date.now() - start;
      const status = codeMetrics.complexFiles < 10 && performanceIssues.length < 5 ? 'pass' : 'warn';
      
      this.results.checks.codeQuality = {
        status,
        response_time_ms: responseTime,
        details: {
          ...codeMetrics,
          performanceIssues
        },
        message: status === 'pass' ? 
          'Code quality metrics look good' : 
          'Some code quality concerns detected'
      };

      return { status, responseTime, codeMetrics, performanceIssues };
    } catch (error) {
      this.results.checks.codeQuality = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Code quality analysis failed'
      };
      this.log(`❌ Code quality analysis failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkDependencyPerformance() {
    this.logSection('Dependency Performance Analysis');
    const start = Date.now();
    
    try {
      // Analyze package.json
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      const depCount = {
        production: Object.keys(dependencies).length,
        development: Object.keys(devDependencies).length,
        total: Object.keys(dependencies).length + Object.keys(devDependencies).length
      };

      this.log(`📦 Production dependencies: ${depCount.production}`, 'green');
      this.log(`🛠️  Development dependencies: ${depCount.development}`, 'blue');
      this.log(`📊 Total dependencies: ${depCount.total}`, 
               depCount.total > 100 ? 'yellow' : 'green');

      // Check for heavy dependencies
      const heavyDependencies = this.identifyHeavyDependencies(dependencies);
      if (heavyDependencies.length > 0) {
        this.log(`⚠️  Heavy dependencies detected:`, 'yellow');
        heavyDependencies.forEach(dep => {
          this.log(`   - ${dep}`, 'yellow');
        });
      }

      // Check node_modules size if it exists
      let nodeModulesSize = null;
      try {
        if (fs.existsSync('./node_modules')) {
          nodeModulesSize = await this.calculateDirectorySize('./node_modules');
          this.log(`📁 node_modules size: ${this.formatBytes(nodeModulesSize)}`, 
                   nodeModulesSize > 500 * 1024 * 1024 ? 'yellow' : 'green'); // 500MB threshold
        }
      } catch (error) {
        this.log(`⚠️  Could not calculate node_modules size: ${error.message}`, 'yellow');
      }

      // Check for duplicate dependencies
      const duplicates = this.findDuplicateDependencies(dependencies, devDependencies);
      if (duplicates.length > 0) {
        this.log(`🔄 Duplicate dependencies: ${duplicates.length}`, 'yellow');
      }

      const responseTime = Date.now() - start;
      const status = depCount.total < 150 && heavyDependencies.length < 5 ? 'pass' : 'warn';
      
      this.results.checks.dependencyPerformance = {
        status,
        response_time_ms: responseTime,
        details: {
          dependencyCount: depCount,
          heavyDependencies,
          nodeModulesSize,
          duplicates,
          totalDependencies: depCount.total
        },
        message: status === 'pass' ? 
          'Dependency performance looks good' : 
          'Dependency performance concerns detected'
      };

      return { status, responseTime, depCount, heavyDependencies };
    } catch (error) {
      this.results.checks.dependencyPerformance = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Dependency performance analysis failed'
      };
      this.log(`❌ Dependency performance analysis failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async analyzeCodebase() {
    const metrics = {
      totalFiles: 0,
      totalLines: 0,
      complexFiles: 0,
      fileTypes: {},
      largestFiles: []
    };

    const scanDirectories = ['./apps/web/src', './packages'];
    const extensions = ['.js', '.ts', '.tsx', '.jsx', '.css', '.scss'];

    for (const dir of scanDirectories) {
      if (fs.existsSync(dir)) {
        await this.scanDirectoryForMetrics(dir, metrics, extensions);
      }
    }

    metrics.averageFileSize = metrics.totalFiles > 0 ? metrics.totalLines / metrics.totalFiles : 0;
    
    return metrics;
  }

  async scanDirectoryForMetrics(dirPath, metrics, extensions) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await this.scanDirectoryForMetrics(fullPath, metrics, extensions);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n').length;
            
            metrics.totalFiles++;
            metrics.totalLines += lines;
            
            // Track file types
            metrics.fileTypes[ext] = (metrics.fileTypes[ext] || 0) + 1;
            
            // Complex files (>500 lines)
            if (lines > 500) {
              metrics.complexFiles++;
            }
            
            // Track largest files
            metrics.largestFiles.push({ file: fullPath, lines });
            metrics.largestFiles.sort((a, b) => b.lines - a.lines);
            metrics.largestFiles = metrics.largestFiles.slice(0, 10); // Keep top 10
          }
        }
      }
    } catch (error) {
      // Ignore directory read errors
    }
  }

  detectPerformanceIssues(codeMetrics) {
    const issues = [];
    
    if (codeMetrics.complexFiles > 10) {
      issues.push(`${codeMetrics.complexFiles} files with >500 lines (consider refactoring)`);
    }
    
    if (codeMetrics.totalFiles > 1000) {
      issues.push(`Large codebase with ${codeMetrics.totalFiles} files`);
    }
    
    const jsxFiles = codeMetrics.fileTypes['.jsx'] || 0;
    const tsxFiles = codeMetrics.fileTypes['.tsx'] || 0;
    if (jsxFiles > tsxFiles && tsxFiles > 0) {
      issues.push('Mixed JSX/TSX usage may impact build performance');
    }
    
    return issues;
  }

  identifyHeavyDependencies(dependencies) {
    const heavyDeps = [
      'webpack', 'rollup', 'babel', 'typescript', 'eslint',
      'lodash', 'moment', 'axios', 'react-router-dom'
    ];
    
    return Object.keys(dependencies).filter(dep => 
      heavyDeps.some(heavy => dep.includes(heavy))
    );
  }

  findDuplicateDependencies(deps, devDeps) {
    const duplicates = [];
    
    for (const dep of Object.keys(deps)) {
      if (devDeps[dep]) {
        duplicates.push(dep);
      }
    }
    
    return duplicates;
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          totalSize += await this.calculateDirectorySize(fullPath);
        } else {
          totalSize += stat.size;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return totalSize;
  }

  estimateBuildTime() {
    // Simple heuristic based on project complexity
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    
    // Base time + dependency factor
    const baseTime = 10000; // 10 seconds
    const depFactor = (depCount + devDepCount) * 200; // 200ms per dependency
    
    return baseTime + depFactor;
  }

  evaluateSystemPerformance(memUsage, loadAverage) {
    if (memUsage.heapUsed > this.thresholds.memory.heap_used ||
        memUsage.rss > this.thresholds.memory.rss) {
      return 'fail';
    }
    
    if (loadAverage[0] > this.thresholds.load.average_1m) {
      return 'warn';
    }
    
    return 'pass';
  }

  getPerformanceIndicator(value, threshold) {
    return value > threshold ? '⚠️' : '✅';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async runAllChecks() {
    this.logHeader('AdvisorOS Performance Analysis Service');
    
    const startTime = Date.now();
    
    try {
      // Run all performance checks
      const [systemPerf, buildPerf, codeQuality, depPerf] = await Promise.all([
        this.checkSystemPerformance(),
        this.checkBuildPerformance(),
        this.checkCodeQualityMetrics(),
        this.checkDependencyPerformance()
      ]);

      // Calculate overall status
      const checks = [systemPerf, buildPerf, codeQuality, depPerf];
      const failedChecks = checks.filter(check => check.status === 'fail');
      const warnChecks = checks.filter(check => check.status === 'warn');
      const totalTime = Date.now() - startTime;

      let overallStatus = 'healthy';
      if (failedChecks.length > 0) {
        overallStatus = 'unhealthy';
      } else if (warnChecks.length > 1) {
        overallStatus = 'degraded';
      }

      this.results.status = overallStatus;
      this.results.summary = {
        totalChecks: checks.length,
        passedChecks: checks.filter(c => c.status === 'pass').length,
        warningChecks: warnChecks.length,
        failedChecks: failedChecks.length,
        totalTime,
        overallStatus
      };

      // Store key metrics
      this.results.metrics = {
        memory: systemPerf.memUsage,
        loadAverage: systemPerf.loadAverage,
        codeMetrics: codeQuality.codeMetrics,
        dependencyCount: depPerf.depCount
      };

      // Generate recommendations
      if (systemPerf.memUsage && systemPerf.memUsage.heapUsed > 256) {
        this.results.recommendations.push('Consider optimizing memory usage');
      }
      if (codeQuality.codeMetrics && codeQuality.codeMetrics.complexFiles > 5) {
        this.results.recommendations.push('Refactor complex files for better maintainability');
      }
      if (depPerf.depCount && depPerf.depCount.total > 100) {
        this.results.recommendations.push('Review dependencies and remove unused packages');
      }
      if (failedChecks.length > 0 || warnChecks.length > 0) {
        this.results.recommendations.push('Address performance warnings to improve system efficiency');
      }

      // Final summary
      this.logSection('Performance Analysis Summary');
      this.log(`📊 Overall Status: ${overallStatus.toUpperCase()}`, 
               overallStatus === 'healthy' ? 'green' : overallStatus === 'degraded' ? 'yellow' : 'red');
      this.log(`✅ Passed: ${this.results.summary.passedChecks}/${this.results.summary.totalChecks}`, 'green');
      
      if (warnChecks.length > 0) {
        this.log(`⚠️  Warnings: ${warnChecks.length}`, 'yellow');
      }
      
      if (failedChecks.length > 0) {
        this.log(`❌ Failed: ${failedChecks.length}`, 'red');
        failedChecks.forEach(check => {
          this.log(`   - ${check.error || 'Performance check failed'}`, 'red');
        });
      }
      
      this.log(`⏱️  Total analysis time: ${totalTime}ms`, 'blue');

      if (this.results.recommendations.length > 0) {
        this.log(`\n💡 Performance Recommendations:`, 'yellow');
        this.results.recommendations.forEach((rec, i) => {
          this.log(`   ${i + 1}. ${rec}`, 'yellow');
        });
      }

      return this.results;
    } catch (error) {
      this.log(`❌ Performance analysis service failed: ${error.message}`, 'red');
      this.results.status = 'unhealthy';
      this.results.error = error.message;
      return this.results;
    }
  }

  async saveResults(outputPath = './performance-analysis-results.json') {
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
  const performanceAnalysis = new PerformanceAnalysisService();
  
  performanceAnalysis.runAllChecks()
    .then(async (results) => {
      await performanceAnalysis.saveResults();
      
      // Exit with appropriate code
      const exitCode = results.status === 'healthy' ? 0 : 
                      results.status === 'degraded' ? 1 : 2;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Performance analysis failed:', error);
      process.exit(2);
    });
}

module.exports = PerformanceAnalysisService;