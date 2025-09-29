#!/usr/bin/env node

/**
 * Master Maintenance Orchestrator for AdvisorOS
 * Runs all maintenance services and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');

// Import all maintenance services
const HealthCheckService = require('./health-check');
const BackupVerificationService = require('./backup-verification');
const SecurityScanningService = require('./security-scan');
const PerformanceAnalysisService = require('./performance-analysis');
const CostAnalysisService = require('./cost-analysis');

class MaintenanceOrchestrator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      services: {},
      summary: {},
      recommendations: [],
      overallMetrics: {}
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

    this.services = [
      { name: 'health-check', service: HealthCheckService, priority: 1 },
      { name: 'backup-verification', service: BackupVerificationService, priority: 2 },
      { name: 'security-scan', service: SecurityScanningService, priority: 1 },
      { name: 'performance-analysis', service: PerformanceAnalysisService, priority: 2 },
      { name: 'cost-analysis', service: CostAnalysisService, priority: 3 }
    ];
  }

  log(message, color = 'white') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  logHeader(title) {
    this.log(`\n${'='.repeat(100)}`, 'cyan');
    this.log(`${this.colors.bold}🔧 ${title}${this.colors.reset}`, 'cyan');
    this.log(`${'='.repeat(100)}`, 'cyan');
  }

  logSection(title) {
    this.log(`\n${'─'.repeat(80)}`, 'blue');
    this.log(`📋 ${title}`, 'blue');
    this.log(`${'─'.repeat(80)}`, 'blue');
  }

  async runService(serviceConfig) {
    this.log(`🚀 Starting ${serviceConfig.name}...`, 'blue');
    const startTime = Date.now();
    
    try {
      const service = new serviceConfig.service();
      const results = await service.runAllChecks();
      
      const duration = Date.now() - startTime;
      this.log(`✅ ${serviceConfig.name} completed in ${duration}ms`, 'green');
      
      return {
        name: serviceConfig.name,
        status: results.status,
        duration,
        results,
        priority: serviceConfig.priority
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ ${serviceConfig.name} failed: ${error.message}`, 'red');
      
      return {
        name: serviceConfig.name,
        status: 'failed',
        duration,
        error: error.message,
        priority: serviceConfig.priority
      };
    }
  }

  async runAllServices(serviceFilter = null) {
    this.logHeader('AdvisorOS Master Maintenance System');
    
    const startTime = Date.now();
    const servicesToRun = serviceFilter ? 
      this.services.filter(s => serviceFilter.includes(s.name)) : 
      this.services;

    this.log(`📊 Running ${servicesToRun.length} maintenance services...`, 'cyan');
    
    // Run critical services first (priority 1)
    const criticalServices = servicesToRun.filter(s => s.priority === 1);
    const normalServices = servicesToRun.filter(s => s.priority === 2);
    const lowPriorityServices = servicesToRun.filter(s => s.priority === 3);

    const allResults = [];

    // Run critical services first
    if (criticalServices.length > 0) {
      this.logSection('Critical Services (Priority 1)');
      for (const service of criticalServices) {
        const result = await this.runService(service);
        allResults.push(result);
        this.results.services[service.name] = result;
      }
    }

    // Run normal services
    if (normalServices.length > 0) {
      this.logSection('Normal Services (Priority 2)');
      const normalResults = await Promise.all(
        normalServices.map(service => this.runService(service))
      );
      allResults.push(...normalResults);
      normalResults.forEach(result => {
        this.results.services[result.name] = result;
      });
    }

    // Run low priority services
    if (lowPriorityServices.length > 0) {
      this.logSection('Analysis Services (Priority 3)');
      const lowResults = await Promise.all(
        lowPriorityServices.map(service => this.runService(service))
      );
      allResults.push(...lowResults);
      lowResults.forEach(result => {
        this.results.services[result.name] = result;
      });
    }

    const totalTime = Date.now() - startTime;
    
    // Generate comprehensive summary
    await this.generateSummary(allResults, totalTime);
    
    return this.results;
  }

  async generateSummary(serviceResults, totalTime) {
    this.logSection('Maintenance Summary Generation');
    
    // Calculate overall metrics
    const totalServices = serviceResults.length;
    const healthyServices = serviceResults.filter(r => r.status === 'healthy').length;
    const degradedServices = serviceResults.filter(r => r.status === 'degraded').length;
    const unhealthyServices = serviceResults.filter(r => r.status === 'unhealthy' || r.status === 'failed').length;
    
    // Determine overall system status
    let overallStatus = 'healthy';
    if (unhealthyServices > 0) {
      overallStatus = unhealthyServices >= totalServices / 2 ? 'unhealthy' : 'degraded';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    this.results.status = overallStatus;
    this.results.summary = {
      totalServices,
      healthyServices,
      degradedServices,
      unhealthyServices,
      overallStatus,
      totalTime,
      timestamp: new Date().toISOString()
    };

    // Collect metrics from all services
    this.collectOverallMetrics(serviceResults);
    
    // Generate comprehensive recommendations
    this.generateRecommendations(serviceResults);
    
    // Display summary
    this.displaySummary();
  }

  collectOverallMetrics(serviceResults) {
    const metrics = {
      performance: {},
      security: {},
      costs: {},
      health: {}
    };

    serviceResults.forEach(result => {
      if (result.results) {
        switch (result.name) {
          case 'health-check':
            metrics.health = {
              checksRun: result.results.summary?.totalChecks || 0,
              checksPassed: result.results.summary?.passedChecks || 0,
              systemStatus: result.results.status
            };
            break;
            
          case 'security-scan':
            metrics.security = {
              totalVulnerabilities: result.results.summary?.totalVulnerabilities || 0,
              criticalVulnerabilities: result.results.summary?.criticalVulnerabilities || 0,
              securityStatus: result.results.status
            };
            break;
            
          case 'performance-analysis':
            if (result.results.metrics) {
              metrics.performance = {
                memoryUsage: result.results.metrics.memory?.heapUsed || 0,
                codeComplexity: result.results.metrics.codeMetrics?.complexFiles || 0,
                dependencyCount: result.results.metrics.dependencyCount?.total || 0,
                performanceStatus: result.results.status
              };
            }
            break;
            
          case 'cost-analysis':
            if (result.results.costs) {
              metrics.costs = {
                monthlyEstimate: result.results.costs.monthly || 0,
                annualEstimate: result.results.costs.annual || 0,
                potentialSavings: result.results.summary?.potentialSavings || 0,
                costStatus: result.results.status
              };
            }
            break;
        }
      }
    });

    this.results.overallMetrics = metrics;
  }

  generateRecommendations(serviceResults) {
    const recommendations = [];
    const criticalIssues = [];
    const warnings = [];

    // Collect recommendations from all services
    serviceResults.forEach(result => {
      if (result.results && result.results.recommendations) {
        result.results.recommendations.forEach(rec => {
          recommendations.push({
            service: result.name,
            recommendation: rec,
            priority: result.priority
          });
        });
      }

      // Identify critical issues
      if (result.status === 'unhealthy' || result.status === 'failed') {
        criticalIssues.push({
          service: result.name,
          issue: result.error || 'Service unhealthy',
          priority: 'critical'
        });
      }

      // Identify warnings
      if (result.status === 'degraded') {
        warnings.push({
          service: result.name,
          issue: 'Service performance degraded',
          priority: 'warning'
        });
      }
    });

    // Generate system-wide recommendations
    if (criticalIssues.length > 0) {
      recommendations.push({
        service: 'system',
        recommendation: `Address ${criticalIssues.length} critical issues immediately`,
        priority: 1
      });
    }

    if (warnings.length > 2) {
      recommendations.push({
        service: 'system',
        recommendation: 'Multiple services showing performance degradation - investigate system resources',
        priority: 2
      });
    }

    // Security-specific recommendations
    const securityMetrics = this.results.overallMetrics.security;
    if (securityMetrics && securityMetrics.criticalVulnerabilities > 0) {
      recommendations.push({
        service: 'system',
        recommendation: `URGENT: ${securityMetrics.criticalVulnerabilities} critical security vulnerabilities require immediate attention`,
        priority: 1
      });
    }

    // Cost-specific recommendations
    const costMetrics = this.results.overallMetrics.costs;
    if (costMetrics && costMetrics.monthlyEstimate > 500) {
      recommendations.push({
        service: 'system',
        recommendation: `High projected costs ($${costMetrics.monthlyEstimate.toFixed(2)}/month) - review cost optimization opportunities`,
        priority: 2
      });
    }

    // Performance-specific recommendations
    const perfMetrics = this.results.overallMetrics.performance;
    if (perfMetrics && perfMetrics.memoryUsage > 512) {
      recommendations.push({
        service: 'system',
        recommendation: 'High memory usage detected - consider memory optimization',
        priority: 2
      });
    }

    // Sort recommendations by priority
    recommendations.sort((a, b) => a.priority - b.priority);
    
    this.results.recommendations = recommendations;
    this.results.criticalIssues = criticalIssues;
    this.results.warnings = warnings;
  }

  displaySummary() {
    this.logSection('🔧 MAINTENANCE REPORT SUMMARY');
    
    const summary = this.results.summary;
    const metrics = this.results.overallMetrics;
    
    // Overall status
    this.log(`📊 Overall System Status: ${summary.overallStatus.toUpperCase()}`, 
             summary.overallStatus === 'healthy' ? 'green' : 
             summary.overallStatus === 'degraded' ? 'yellow' : 'red');
    
    // Service summary
    this.log(`\n🏥 Service Health:`, 'blue');
    this.log(`   ✅ Healthy: ${summary.healthyServices}/${summary.totalServices}`, 'green');
    if (summary.degradedServices > 0) {
      this.log(`   ⚠️  Degraded: ${summary.degradedServices}`, 'yellow');
    }
    if (summary.unhealthyServices > 0) {
      this.log(`   ❌ Unhealthy/Failed: ${summary.unhealthyServices}`, 'red');
    }
    
    // Key metrics
    if (metrics.security && metrics.security.totalVulnerabilities > 0) {
      this.log(`\n🔒 Security Issues:`, 'red');
      this.log(`   🔴 Critical: ${metrics.security.criticalVulnerabilities}`, 'red');
      this.log(`   📊 Total: ${metrics.security.totalVulnerabilities}`, 'yellow');
    } else {
      this.log(`\n🔒 Security: No critical vulnerabilities detected`, 'green');
    }
    
    if (metrics.costs && metrics.costs.monthlyEstimate > 0) {
      this.log(`\n💰 Cost Analysis:`, 'blue');
      this.log(`   📈 Monthly Estimate: $${metrics.costs.monthlyEstimate.toFixed(2)}`, 
               metrics.costs.monthlyEstimate > 300 ? 'yellow' : 'green');
      if (metrics.costs.potentialSavings > 0) {
        this.log(`   💡 Potential Savings: $${metrics.costs.potentialSavings.toFixed(2)}/month`, 'green');
      }
    }
    
    if (metrics.performance) {
      this.log(`\n📊 Performance Metrics:`, 'blue');
      this.log(`   🧠 Memory Usage: ${metrics.performance.memoryUsage}MB`, 
               metrics.performance.memoryUsage > 512 ? 'yellow' : 'green');
      if (metrics.performance.codeComplexity > 0) {
        this.log(`   📏 Complex Files: ${metrics.performance.codeComplexity}`, 
                 metrics.performance.codeComplexity > 10 ? 'yellow' : 'green');
      }
    }
    
    // Critical issues
    if (this.results.criticalIssues.length > 0) {
      this.log(`\n🚨 CRITICAL ISSUES (${this.results.criticalIssues.length}):`, 'red');
      this.results.criticalIssues.forEach((issue, i) => {
        this.log(`   ${i + 1}. [${issue.service}] ${issue.issue}`, 'red');
      });
    }
    
    // Top recommendations
    if (this.results.recommendations.length > 0) {
      this.log(`\n💡 TOP RECOMMENDATIONS:`, 'yellow');
      this.results.recommendations.slice(0, 5).forEach((rec, i) => {
        const color = rec.priority === 1 ? 'red' : rec.priority === 2 ? 'yellow' : 'white';
        this.log(`   ${i + 1}. [${rec.service}] ${rec.recommendation}`, color);
      });
    }
    
    this.log(`\n⏱️  Total Maintenance Time: ${summary.totalTime}ms`, 'blue');
    this.log(`📅 Report Generated: ${summary.timestamp}`, 'blue');
  }

  async generateMarkdownReport() {
    const date = new Date().toISOString().split('T')[0];
    const summary = this.results.summary;
    const metrics = this.results.overallMetrics;
    
    let markdown = `# 🔧 Maintenance Report - ${date}

## Summary
This report contains the results of scheduled maintenance tasks.

## Task Results

### 🏥 Health Checks
Status: ${this.results.services['health-check']?.status || 'not run'}

### 🗄️ Backup Verification
Status: ${this.results.services['backup-verification']?.status || 'not run'}

### 🔒 Security Scan
Status: ${this.results.services['security-scan']?.status || 'not run'}

### 📊 Performance Analysis
Status: ${this.results.services['performance-analysis']?.status || 'not run'}

### 💰 Cost Analysis
Status: ${this.results.services['cost-analysis']?.status || 'not run'}

## Overall Status: ${summary.overallStatus.toUpperCase()}

### Service Health
- ✅ Healthy: ${summary.healthyServices}/${summary.totalServices}
- ⚠️  Degraded: ${summary.degradedServices}
- ❌ Unhealthy/Failed: ${summary.unhealthyServices}

`;

    // Add critical issues if any
    if (this.results.criticalIssues.length > 0) {
      markdown += `## 🚨 Critical Issues\n\n`;
      this.results.criticalIssues.forEach((issue, i) => {
        markdown += `${i + 1}. **[${issue.service}]** ${issue.issue}\n`;
      });
      markdown += '\n';
    }

    // Add security metrics
    if (metrics.security) {
      markdown += `## 🔒 Security Summary\n\n`;
      markdown += `- Total Vulnerabilities: ${metrics.security.totalVulnerabilities}\n`;
      markdown += `- Critical Vulnerabilities: ${metrics.security.criticalVulnerabilities}\n\n`;
    }

    // Add cost metrics
    if (metrics.costs && metrics.costs.monthlyEstimate > 0) {
      markdown += `## 💰 Cost Summary\n\n`;
      markdown += `- Monthly Estimate: $${metrics.costs.monthlyEstimate.toFixed(2)}\n`;
      markdown += `- Annual Estimate: $${metrics.costs.annualEstimate.toFixed(2)}\n`;
      if (metrics.costs.potentialSavings > 0) {
        markdown += `- Potential Savings: $${metrics.costs.potentialSavings.toFixed(2)}/month\n`;
      }
      markdown += '\n';
    }

    // Add recommendations
    if (this.results.recommendations.length > 0) {
      markdown += `## 💡 Recommendations\n\n`;
      this.results.recommendations.slice(0, 10).forEach((rec, i) => {
        const priority = rec.priority === 1 ? '🔴' : rec.priority === 2 ? '🟡' : '🔵';
        markdown += `${i + 1}. ${priority} **[${rec.service}]** ${rec.recommendation}\n`;
      });
      markdown += '\n';
    }

    markdown += `## Workflow Details
- **Run ID:** ${process.env.GITHUB_RUN_ID || 'local-run'}
- **Triggered by:** ${process.env.GITHUB_EVENT_NAME || 'manual'}
- **Environment:** ${this.results.environment}
- **Total Time:** ${summary.totalTime}ms

For detailed results, check the individual service result files.
`;

    return markdown;
  }

  async saveResults(outputDir = './') {
    try {
      // Save comprehensive results
      const resultsPath = path.join(outputDir, 'maintenance-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
      this.log(`📄 Comprehensive results saved to: ${resultsPath}`, 'green');
      
      // Save markdown report
      const markdownReport = await this.generateMarkdownReport();
      const markdownPath = path.join(outputDir, 'maintenance-report.md');
      fs.writeFileSync(markdownPath, markdownReport);
      this.log(`📄 Markdown report saved to: ${markdownPath}`, 'green');
      
      // Save individual service results
      Object.entries(this.results.services).forEach(([serviceName, serviceResult]) => {
        if (serviceResult.results) {
          const servicePath = path.join(outputDir, `${serviceName}-results.json`);
          fs.writeFileSync(servicePath, JSON.stringify(serviceResult.results, null, 2));
        }
      });
      
      this.log(`📁 Individual service results saved to: ${outputDir}`, 'green');
      
    } catch (error) {
      this.log(`❌ Failed to save results: ${error.message}`, 'red');
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const serviceFilter = args.length > 0 ? args : null;
  
  const orchestrator = new MaintenanceOrchestrator();
  
  orchestrator.runAllServices(serviceFilter)
    .then(async (results) => {
      await orchestrator.saveResults();
      
      // Exit with appropriate code based on overall status
      const exitCode = results.status === 'healthy' ? 0 : 
                      results.status === 'degraded' ? 1 : 2;
      
      console.log(`\n🏁 Maintenance completed with status: ${results.status.toUpperCase()}`);
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Maintenance orchestration failed:', error);
      process.exit(2);
    });
}

module.exports = MaintenanceOrchestrator;