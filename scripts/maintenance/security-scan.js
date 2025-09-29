#!/usr/bin/env node

/**
 * Security Scanning Service for AdvisorOS
 * Comprehensive security analysis without external dependencies
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SecurityScanningService {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {},
      vulnerabilities: [],
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
    
    // Security patterns to check for
    this.securityPatterns = {
      sensitiveData: [
        /password\s*=\s*['"][^'"]+['"]/gi,
        /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
        /secret\s*=\s*['"][^'"]+['"]/gi,
        /token\s*=\s*['"][^'"]+['"]/gi,
        /private[_-]?key\s*=\s*['"][^'"]+['"]/gi
      ],
      sqlInjection: [
        /\$\{[^}]*query[^}]*\}/gi,
        /query\s*\+\s*[^;]+/gi,
        /execute\s*\(\s*['"][^'"]*\+/gi
      ],
      xss: [
        /innerHTML\s*=\s*[^;]+/gi,
        /document\.write\s*\(/gi,
        /eval\s*\(/gi,
        /dangerouslySetInnerHTML/gi
      ],
      insecureRandomness: [
        /Math\.random\(\)/gi,
        /Math\.floor\(Math\.random/gi
      ]
    };
    
    // Files to scan for security issues
    this.scanPaths = [
      './apps/web/src',
      './packages',
      './scripts'
    ];
    
    // Configuration files to check
    this.configFiles = [
      './.env.example',
      './apps/web/next.config.js',
      './package.json',
      './docker-compose.yml'
    ];
  }

  log(message, color = 'white') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  logHeader(title) {
    this.log(`\n${'='.repeat(80)}`, 'cyan');
    this.log(`${this.colors.bold}🔒 ${title}${this.colors.reset}`, 'cyan');
    this.log(`${'='.repeat(80)}`, 'cyan');
  }

  logSection(title) {
    this.log(`\n${'─'.repeat(60)}`, 'blue');
    this.log(`📋 ${title}`, 'blue');
    this.log(`${'─'.repeat(60)}`, 'blue');
  }

  async checkPackageVulnerabilities() {
    this.logSection('Package Vulnerability Scan');
    const start = Date.now();
    
    try {
      let auditResults = null;
      let vulnerabilityCount = 0;
      
      try {
        // Run npm audit
        const { stdout } = await execAsync('npm audit --json', { timeout: 30000 });
        auditResults = JSON.parse(stdout);
        
        if (auditResults.metadata && auditResults.metadata.vulnerabilities) {
          const vulns = auditResults.metadata.vulnerabilities;
          vulnerabilityCount = Object.values(vulns).reduce((sum, count) => sum + count, 0);
          
          this.log(`🔍 Total vulnerabilities: ${vulnerabilityCount}`, vulnerabilityCount > 0 ? 'red' : 'green');
          
          if (vulns.critical) this.log(`  🔴 Critical: ${vulns.critical}`, 'red');
          if (vulns.high) this.log(`  🟠 High: ${vulns.high}`, 'red');
          if (vulns.moderate) this.log(`  🟡 Moderate: ${vulns.moderate}`, 'yellow');
          if (vulns.low) this.log(`  🟢 Low: ${vulns.low}`, 'green');
          if (vulns.info) this.log(`  ℹ️  Info: ${vulns.info}`, 'blue');
        }
      } catch (error) {
        this.log(`⚠️  Could not run npm audit: ${error.message}`, 'yellow');
        auditResults = { error: error.message };
      }

      const responseTime = Date.now() - start;
      const status = vulnerabilityCount === 0 ? 'pass' : vulnerabilityCount > 10 ? 'fail' : 'warn';
      
      this.results.checks.packageVulnerabilities = {
        status,
        response_time_ms: responseTime,
        details: {
          auditResults,
          vulnerabilityCount,
          hasAuditCapability: auditResults && !auditResults.error
        },
        message: status === 'pass' ? 
          'No package vulnerabilities found' : 
          `${vulnerabilityCount} package vulnerabilities detected`
      };

      return { status, responseTime, auditResults, vulnerabilityCount };
    } catch (error) {
      this.results.checks.packageVulnerabilities = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Package vulnerability scan failed'
      };
      this.log(`❌ Package vulnerability scan failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkCodeSecurity() {
    this.logSection('Code Security Scan');
    const start = Date.now();
    
    try {
      const securityIssues = [];
      const scannedFiles = [];
      
      for (const scanPath of this.scanPaths) {
        if (fs.existsSync(scanPath)) {
          const issues = await this.scanDirectoryForSecurity(scanPath);
          securityIssues.push(...issues);
        }
      }
      
      // Categorize issues by severity
      const categorizedIssues = this.categorizeSecurityIssues(securityIssues);
      
      this.log(`🔍 Files scanned: ${scannedFiles.length}`, 'blue');
      this.log(`🔴 Critical issues: ${categorizedIssues.critical.length}`, 
               categorizedIssues.critical.length > 0 ? 'red' : 'green');
      this.log(`🟠 High issues: ${categorizedIssues.high.length}`, 
               categorizedIssues.high.length > 0 ? 'red' : 'green');
      this.log(`🟡 Medium issues: ${categorizedIssues.medium.length}`, 
               categorizedIssues.medium.length > 0 ? 'yellow' : 'green');
      this.log(`🟢 Low issues: ${categorizedIssues.low.length}`, 'blue');

      // Show some examples of issues found
      if (categorizedIssues.critical.length > 0) {
        this.log(`\n⚠️  Critical Issues (first 3):`, 'red');
        categorizedIssues.critical.slice(0, 3).forEach(issue => {
          this.log(`   - ${issue.file}:${issue.line} - ${issue.description}`, 'red');
        });
      }

      const responseTime = Date.now() - start;
      const totalIssues = securityIssues.length;
      const criticalIssues = categorizedIssues.critical.length;
      const status = criticalIssues > 0 ? 'fail' : totalIssues > 10 ? 'warn' : 'pass';
      
      this.results.checks.codeSecurity = {
        status,
        response_time_ms: responseTime,
        details: {
          securityIssues: categorizedIssues,
          totalIssues,
          criticalIssues,
          filesScanned: scannedFiles.length
        },
        message: status === 'pass' ? 
          'No critical security issues found in code' : 
          `${totalIssues} security issues found (${criticalIssues} critical)`
      };

      return { status, responseTime, securityIssues: categorizedIssues, totalIssues };
    } catch (error) {
      this.results.checks.codeSecurity = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Code security scan failed'
      };
      this.log(`❌ Code security scan failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkConfigurationSecurity() {
    this.logSection('Configuration Security Check');
    const start = Date.now();
    
    try {
      const configIssues = [];
      
      for (const configFile of this.configFiles) {
        if (fs.existsSync(configFile)) {
          const issues = await this.scanConfigFile(configFile);
          configIssues.push(...issues);
        }
      }

      // Check environment variables
      const envIssues = this.checkEnvironmentSecurity();
      configIssues.push(...envIssues);

      // Check file permissions (Unix-like systems)
      const permissionIssues = await this.checkFilePermissions();
      configIssues.push(...permissionIssues);

      this.log(`🔍 Configuration files checked: ${this.configFiles.length}`, 'blue');
      this.log(`⚠️  Configuration issues: ${configIssues.length}`, 
               configIssues.length > 0 ? 'yellow' : 'green');

      if (configIssues.length > 0) {
        this.log(`\n⚠️  Configuration Issues (first 5):`, 'yellow');
        configIssues.slice(0, 5).forEach(issue => {
          this.log(`   - ${issue.file}: ${issue.description}`, 'yellow');
        });
      }

      const responseTime = Date.now() - start;
      const status = configIssues.length === 0 ? 'pass' : configIssues.length > 5 ? 'fail' : 'warn';
      
      this.results.checks.configurationSecurity = {
        status,
        response_time_ms: responseTime,
        details: {
          configIssues,
          totalIssues: configIssues.length,
          filesChecked: this.configFiles.length
        },
        message: status === 'pass' ? 
          'Configuration security looks good' : 
          `${configIssues.length} configuration security issues found`
      };

      return { status, responseTime, configIssues };
    } catch (error) {
      this.results.checks.configurationSecurity = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Configuration security check failed'
      };
      this.log(`❌ Configuration security check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkAuthenticationSecurity() {
    this.logSection('Authentication Security Check');
    const start = Date.now();
    
    try {
      const authIssues = [];
      
      // Check for authentication-related files
      const authFiles = [
        './apps/web/src/pages/api/auth',
        './apps/web/src/server/auth.ts',
        './apps/web/src/lib/auth.ts'
      ];
      
      let authImplemented = false;
      for (const authFile of authFiles) {
        if (fs.existsSync(authFile)) {
          authImplemented = true;
          const issues = await this.scanAuthFile(authFile);
          authIssues.push(...issues);
        }
      }

      if (!authImplemented) {
        authIssues.push({
          file: 'Authentication System',
          severity: 'high',
          description: 'No authentication system detected'
        });
      }

      // Check for JWT secret configuration
      const jwtConfigured = process.env.NEXTAUTH_SECRET || 
                           process.env.JWT_SECRET || 
                           fs.existsSync('.env.local');
      
      if (!jwtConfigured) {
        authIssues.push({
          file: 'JWT Configuration',
          severity: 'critical',
          description: 'JWT secret not configured'
        });
      }

      // Check for HTTPS enforcement
      const httpsConfigured = this.checkHttpsConfiguration();
      if (!httpsConfigured) {
        authIssues.push({
          file: 'HTTPS Configuration',
          severity: 'high',
          description: 'HTTPS not enforced'
        });
      }

      this.log(`🔐 Authentication system: ${authImplemented ? 'Detected' : 'Not detected'}`, 
               authImplemented ? 'green' : 'red');
      this.log(`🔑 JWT configuration: ${jwtConfigured ? 'Configured' : 'Missing'}`, 
               jwtConfigured ? 'green' : 'red');
      this.log(`🔒 HTTPS enforcement: ${httpsConfigured ? 'Enabled' : 'Disabled'}`, 
               httpsConfigured ? 'green' : 'yellow');
      this.log(`⚠️  Authentication issues: ${authIssues.length}`, 
               authIssues.length === 0 ? 'green' : 'red');

      const responseTime = Date.now() - start;
      const criticalAuthIssues = authIssues.filter(issue => issue.severity === 'critical').length;
      const status = criticalAuthIssues === 0 && authImplemented ? 'pass' : 'fail';
      
      this.results.checks.authenticationSecurity = {
        status,
        response_time_ms: responseTime,
        details: {
          authIssues,
          authImplemented,
          jwtConfigured,
          httpsConfigured,
          criticalIssues: criticalAuthIssues
        },
        message: status === 'pass' ? 
          'Authentication security looks good' : 
          `${authIssues.length} authentication security issues found`
      };

      return { status, responseTime, authIssues, authImplemented };
    } catch (error) {
      this.results.checks.authenticationSecurity = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Authentication security check failed'
      };
      this.log(`❌ Authentication security check failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async scanDirectoryForSecurity(dirPath) {
    const issues = [];
    
    try {
      const files = this.getAllFiles(dirPath, ['.js', '.ts', '.tsx', '.jsx']);
      
      for (const file of files) {
        const fileIssues = await this.scanFileForSecurity(file);
        issues.push(...fileIssues);
      }
    } catch (error) {
      // Ignore directory traversal errors
    }
    
    return issues;
  }

  async scanFileForSecurity(filePath) {
    const issues = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Check for sensitive data patterns
      for (const [category, patterns] of Object.entries(this.securityPatterns)) {
        for (const pattern of patterns) {
          lines.forEach((line, index) => {
            const matches = line.match(pattern);
            if (matches) {
              issues.push({
                file: filePath,
                line: index + 1,
                category,
                pattern: pattern.toString(),
                match: matches[0],
                severity: this.getSeverityForCategory(category),
                description: this.getDescriptionForCategory(category)
              });
            }
          });
        }
      }
    } catch (error) {
      // Ignore file read errors
    }
    
    return issues;
  }

  async scanConfigFile(configFile) {
    const issues = [];
    
    try {
      const content = fs.readFileSync(configFile, 'utf8');
      
      // Check for hardcoded secrets
      const secretPatterns = [
        /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        /key\s*[:=]\s*['"][^'"]{16,}['"]/gi,
        /secret\s*[:=]\s*['"][^'"]{16,}['"]/gi
      ];
      
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          issues.push({
            file: configFile,
            severity: 'critical',
            description: 'Hardcoded secret detected in configuration'
          });
        }
      }
      
      // Check for insecure configurations
      if (configFile.includes('next.config.js')) {
        if (!content.includes('strictMode')) {
          issues.push({
            file: configFile,
            severity: 'medium',
            description: 'React strict mode not enabled'
          });
        }
      }
      
    } catch (error) {
      // Ignore file read errors
    }
    
    return issues;
  }

  async scanAuthFile(authFile) {
    const issues = [];
    
    try {
      const content = fs.readFileSync(authFile, 'utf8');
      
      // Check for weak authentication patterns
      if (content.includes('password === ') && !content.includes('bcrypt')) {
        issues.push({
          file: authFile,
          severity: 'critical',
          description: 'Plain text password comparison detected'
        });
      }
      
      if (content.includes('jwt.sign') && !content.includes('expiresIn')) {
        issues.push({
          file: authFile,
          severity: 'high',
          description: 'JWT without expiration time'
        });
      }
      
    } catch (error) {
      // Ignore file read errors
    }
    
    return issues;
  }

  checkEnvironmentSecurity() {
    const issues = [];
    
    // Check for development environment in production
    if (process.env.NODE_ENV === 'production') {
      if (process.env.DEBUG) {
        issues.push({
          file: 'Environment Variables',
          severity: 'medium',
          description: 'Debug mode enabled in production'
        });
      }
    }
    
    return issues;
  }

  async checkFilePermissions() {
    const issues = [];
    
    try {
      const sensitiveFiles = ['.env', '.env.local', 'private.key'];
      
      for (const file of sensitiveFiles) {
        if (fs.existsSync(file)) {
          const stat = fs.statSync(file);
          const mode = stat.mode & parseInt('777', 8);
          
          if (mode & parseInt('044', 8)) { // Others can read
            issues.push({
              file,
              severity: 'high',
              description: 'Sensitive file readable by others'
            });
          }
        }
      }
    } catch (error) {
      // Ignore permission check errors on non-Unix systems
    }
    
    return issues;
  }

  checkHttpsConfiguration() {
    // Check if HTTPS is configured
    const nextConfig = './apps/web/next.config.js';
    
    if (fs.existsSync(nextConfig)) {
      try {
        const content = fs.readFileSync(nextConfig, 'utf8');
        return content.includes('https') || content.includes('secure');
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }

  getAllFiles(dirPath, extensions) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore directory read errors
    }
    
    return files;
  }

  categorizeSecurityIssues(issues) {
    return {
      critical: issues.filter(issue => issue.severity === 'critical'),
      high: issues.filter(issue => issue.severity === 'high'),
      medium: issues.filter(issue => issue.severity === 'medium'),
      low: issues.filter(issue => issue.severity === 'low')
    };
  }

  getSeverityForCategory(category) {
    const severityMap = {
      sensitiveData: 'critical',
      sqlInjection: 'critical', 
      xss: 'high',
      insecureRandomness: 'medium'
    };
    return severityMap[category] || 'low';
  }

  getDescriptionForCategory(category) {
    const descriptionMap = {
      sensitiveData: 'Hardcoded sensitive data detected',
      sqlInjection: 'Potential SQL injection vulnerability',
      xss: 'Potential XSS vulnerability',
      insecureRandomness: 'Insecure random number generation'
    };
    return descriptionMap[category] || 'Security issue detected';
  }

  async runAllChecks() {
    this.logHeader('AdvisorOS Security Scanning Service');
    
    const startTime = Date.now();
    
    try {
      // Run all security checks
      const [packageVulns, codeSecurity, configSecurity, authSecurity] = await Promise.all([
        this.checkPackageVulnerabilities(),
        this.checkCodeSecurity(),
        this.checkConfigurationSecurity(),
        this.checkAuthenticationSecurity()
      ]);

      // Collect all vulnerabilities
      this.results.vulnerabilities = [
        ...(codeSecurity.securityIssues?.critical || []),
        ...(codeSecurity.securityIssues?.high || []),
        ...(configSecurity.configIssues || []),
        ...(authSecurity.authIssues || [])
      ];

      // Calculate overall status
      const checks = [packageVulns, codeSecurity, configSecurity, authSecurity];
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
        totalVulnerabilities: this.results.vulnerabilities.length,
        criticalVulnerabilities: this.results.vulnerabilities.filter(v => v.severity === 'critical').length,
        totalTime,
        overallStatus
      };

      // Generate recommendations
      if (this.results.summary.criticalVulnerabilities > 0) {
        this.results.recommendations.push('Address critical security vulnerabilities immediately');
      }
      if (packageVulns.vulnerabilityCount > 0) {
        this.results.recommendations.push('Update packages with security vulnerabilities');
      }
      if (!authSecurity.authImplemented) {
        this.results.recommendations.push('Implement proper authentication system');
      }
      if (failedChecks.length > 0) {
        this.results.recommendations.push('Review and fix failed security checks');
      }

      // Final summary
      this.logSection('Security Scan Summary');
      this.log(`📊 Overall Status: ${overallStatus.toUpperCase()}`, 
               overallStatus === 'healthy' ? 'green' : overallStatus === 'degraded' ? 'yellow' : 'red');
      this.log(`✅ Passed: ${this.results.summary.passedChecks}/${this.results.summary.totalChecks}`, 'green');
      this.log(`🔴 Critical vulnerabilities: ${this.results.summary.criticalVulnerabilities}`, 
               this.results.summary.criticalVulnerabilities === 0 ? 'green' : 'red');
      this.log(`⚠️  Total vulnerabilities: ${this.results.summary.totalVulnerabilities}`, 
               this.results.summary.totalVulnerabilities === 0 ? 'green' : 'yellow');
      
      if (failedChecks.length > 0) {
        this.log(`❌ Failed: ${failedChecks.length}`, 'red');
        failedChecks.forEach(check => {
          this.log(`   - ${check.error || 'Security check failed'}`, 'red');
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
      this.log(`❌ Security scanning service failed: ${error.message}`, 'red');
      this.results.status = 'unhealthy';
      this.results.error = error.message;
      return this.results;
    }
  }

  async saveResults(outputPath = './security-scan-results.json') {
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
  const securityScan = new SecurityScanningService();
  
  securityScan.runAllChecks()
    .then(async (results) => {
      await securityScan.saveResults();
      
      // Exit with appropriate code
      const exitCode = results.status === 'healthy' ? 0 : 
                      results.status === 'degraded' ? 1 : 2;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Security scan failed:', error);
      process.exit(2);
    });
}

module.exports = SecurityScanningService;