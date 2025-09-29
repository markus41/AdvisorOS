#!/usr/bin/env node

/**
 * Cost Analysis Service for AdvisorOS
 * Comprehensive cost estimation and analysis without external dependencies
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CostAnalysisService {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {},
      costs: {},
      projections: {},
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
    
    // Cost estimation models (USD per month)
    this.costModels = {
      compute: {
        small: { cores: 1, memory: 1, cost: 15 },    // $15/month
        medium: { cores: 2, memory: 4, cost: 45 },   // $45/month
        large: { cores: 4, memory: 8, cost: 90 },    // $90/month
        xlarge: { cores: 8, memory: 16, cost: 180 }  // $180/month
      },
      storage: {
        pricePerGB: 0.1,        // $0.10/GB/month
        backupPricePerGB: 0.05  // $0.05/GB/month for backups
      },
      database: {
        small: { size: '10GB', cost: 20 },   // $20/month
        medium: { size: '100GB', cost: 80 }, // $80/month
        large: { size: '500GB', cost: 200 }  // $200/month
      },
      bandwidth: {
        pricePerGB: 0.12        // $0.12/GB transferred
      },
      services: {
        monitoring: 10,         // $10/month
        logging: 15,           // $15/month
        security: 25,          // $25/month
        backup: 20,            // $20/month
        cdn: 30               // $30/month
      }
    };
  }

  log(message, color = 'white') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  logHeader(title) {
    this.log(`\n${'='.repeat(80)}`, 'cyan');
    this.log(`${this.colors.bold}💰 ${title}${this.colors.reset}`, 'cyan');
    this.log(`${'='.repeat(80)}`, 'cyan');
  }

  logSection(title) {
    this.log(`\n${'─'.repeat(60)}`, 'blue');
    this.log(`📋 ${title}`, 'blue');
    this.log(`${'─'.repeat(60)}`, 'blue');
  }

  async checkInfrastructureCosts() {
    this.logSection('Infrastructure Cost Analysis');
    const start = Date.now();
    
    try {
      // Estimate compute requirements based on application complexity
      const computeRequirements = await this.estimateComputeRequirements();
      const computeCost = this.calculateComputeCost(computeRequirements);
      
      this.log(`🖥️  Estimated compute tier: ${computeRequirements.tier}`, 'blue');
      this.log(`💻 CPU cores: ${computeRequirements.cores}, Memory: ${computeRequirements.memory}GB`, 'blue');
      this.log(`💰 Monthly compute cost: $${computeCost.toFixed(2)}`, 
               computeCost > 100 ? 'yellow' : 'green');

      // Estimate storage requirements
      const storageRequirements = await this.estimateStorageRequirements();
      const storageCost = this.calculateStorageCost(storageRequirements);
      
      this.log(`💾 Estimated storage: ${storageRequirements.totalGB}GB`, 'blue');
      this.log(`📦 Backup storage: ${storageRequirements.backupGB}GB`, 'blue');
      this.log(`💰 Monthly storage cost: $${storageCost.toFixed(2)}`, 
               storageCost > 50 ? 'yellow' : 'green');

      // Estimate database costs
      const databaseRequirements = await this.estimateDatabaseRequirements();
      const databaseCost = this.calculateDatabaseCost(databaseRequirements);
      
      this.log(`🗄️  Database tier: ${databaseRequirements.tier}`, 'blue');
      this.log(`💰 Monthly database cost: $${databaseCost.toFixed(2)}`, 
               databaseCost > 100 ? 'yellow' : 'green');

      const totalInfrastructureCost = computeCost + storageCost + databaseCost;
      
      const responseTime = Date.now() - start;
      const status = totalInfrastructureCost < 500 ? 'pass' : 'warn';
      
      this.results.checks.infrastructureCosts = {
        status,
        response_time_ms: responseTime,
        details: {
          compute: { requirements: computeRequirements, cost: computeCost },
          storage: { requirements: storageRequirements, cost: storageCost },
          database: { requirements: databaseRequirements, cost: databaseCost },
          totalCost: totalInfrastructureCost
        },
        message: status === 'pass' ? 
          `Infrastructure costs within budget: $${totalInfrastructureCost.toFixed(2)}/month` : 
          `High infrastructure costs: $${totalInfrastructureCost.toFixed(2)}/month`
      };

      return { status, responseTime, totalCost: totalInfrastructureCost };
    } catch (error) {
      this.results.checks.infrastructureCosts = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Infrastructure cost analysis failed'
      };
      this.log(`❌ Infrastructure cost analysis failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkDevelopmentCosts() {
    this.logSection('Development & Operational Cost Analysis');
    const start = Date.now();
    
    try {
      // Analyze development dependencies cost impact
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      const dependencyCosts = this.analyzeDependencyCosts(dependencies, devDependencies);
      
      this.log(`📦 Production dependencies: ${Object.keys(dependencies).length}`, 'blue');
      this.log(`🛠️  Development dependencies: ${Object.keys(devDependencies).length}`, 'blue');
      this.log(`💰 Estimated license costs: $${dependencyCosts.licenseCosts}/year`, 
               dependencyCosts.licenseCosts > 1000 ? 'yellow' : 'green');
      this.log(`⚠️  High-maintenance dependencies: ${dependencyCosts.highMaintenance}`, 
               dependencyCosts.highMaintenance > 5 ? 'yellow' : 'green');

      // Estimate CI/CD costs
      const cicdCosts = this.estimateCICDCosts();
      this.log(`🔄 CI/CD estimated cost: $${cicdCosts}/month`, 
               cicdCosts > 50 ? 'yellow' : 'green');

      // Estimate monitoring and logging costs
      const observabilityCosts = this.estimateObservabilityCosts();
      this.log(`📊 Monitoring & logging: $${observabilityCosts}/month`, 
               observabilityCosts > 100 ? 'yellow' : 'green');

      // Estimate security costs
      const securityCosts = this.estimateSecurityCosts();
      this.log(`🔒 Security services: $${securityCosts}/month`, 
               securityCosts > 150 ? 'yellow' : 'green');

      const totalDevelopmentCosts = dependencyCosts.licenseCosts / 12 + cicdCosts + 
                                   observabilityCosts + securityCosts;

      const responseTime = Date.now() - start;
      const status = totalDevelopmentCosts < 300 ? 'pass' : 'warn';
      
      this.results.checks.developmentCosts = {
        status,
        response_time_ms: responseTime,
        details: {
          dependencies: dependencyCosts,
          cicd: cicdCosts,
          observability: observabilityCosts,
          security: securityCosts,
          totalMonthly: totalDevelopmentCosts
        },
        message: status === 'pass' ? 
          `Development costs reasonable: $${totalDevelopmentCosts.toFixed(2)}/month` : 
          `High development costs: $${totalDevelopmentCosts.toFixed(2)}/month`
      };

      return { status, responseTime, totalCost: totalDevelopmentCosts };
    } catch (error) {
      this.results.checks.developmentCosts = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Development cost analysis failed'
      };
      this.log(`❌ Development cost analysis failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkScalingCosts() {
    this.logSection('Scaling Cost Projections');
    const start = Date.now();
    
    try {
      // Project costs at different scale levels
      const scaleScenarios = [
        { name: 'Current (MVP)', users: 100, scale: 1 },
        { name: 'Growth (SMB)', users: 1000, scale: 3 },
        { name: 'Scale (Enterprise)', users: 10000, scale: 10 },
        { name: 'Large Scale', users: 100000, scale: 30 }
      ];

      const scalingProjections = [];
      
      for (const scenario of scaleScenarios) {
        const projection = this.calculateScalingCosts(scenario);
        scalingProjections.push(projection);
        
        this.log(`📈 ${scenario.name} (${scenario.users.toLocaleString()} users):`, 'blue');
        this.log(`   Compute: $${projection.compute}/month`, 'white');
        this.log(`   Storage: $${projection.storage}/month`, 'white');
        this.log(`   Database: $${projection.database}/month`, 'white');
        this.log(`   Services: $${projection.services}/month`, 'white');
        this.log(`   Total: $${projection.total}/month`, 
                 projection.total > 1000 ? 'yellow' : 'green');
      }

      // Calculate cost efficiency metrics
      const costPerUser = scalingProjections.map(p => ({
        scenario: p.scenario.name,
        costPerUser: p.total / p.scenario.users,
        users: p.scenario.users
      }));

      this.log(`\n💡 Cost Efficiency Analysis:`, 'cyan');
      costPerUser.forEach(cpu => {
        this.log(`   ${cpu.scenario}: $${cpu.costPerUser.toFixed(2)}/user/month`, 'white');
      });

      const responseTime = Date.now() - start;
      const maxCost = Math.max(...scalingProjections.map(p => p.total));
      const status = maxCost < 5000 ? 'pass' : 'warn';
      
      this.results.checks.scalingCosts = {
        status,
        response_time_ms: responseTime,
        details: {
          projections: scalingProjections,
          costEfficiency: costPerUser,
          maxProjectedCost: maxCost
        },
        message: status === 'pass' ? 
          'Scaling costs manageable across scenarios' : 
          'High scaling costs may require optimization'
      };

      return { status, responseTime, projections: scalingProjections };
    } catch (error) {
      this.results.checks.scalingCosts = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Scaling cost analysis failed'
      };
      this.log(`❌ Scaling cost analysis failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async checkCostOptimization() {
    this.logSection('Cost Optimization Opportunities');
    const start = Date.now();
    
    try {
      const optimizations = [];
      let potentialSavings = 0;

      // Check for over-provisioning
      const overProvisioningCheck = this.checkOverProvisioning();
      if (overProvisioningCheck.savings > 0) {
        optimizations.push(overProvisioningCheck);
        potentialSavings += overProvisioningCheck.savings;
      }

      // Check for unused resources
      const unusedResourcesCheck = this.checkUnusedResources();
      if (unusedResourcesCheck.savings > 0) {
        optimizations.push(unusedResourcesCheck);
        potentialSavings += unusedResourcesCheck.savings;
      }

      // Check for alternative architectures
      const architectureCheck = this.checkAlternativeArchitectures();
      if (architectureCheck.savings > 0) {
        optimizations.push(architectureCheck);
        potentialSavings += architectureCheck.savings;
      }

      // Check for reserved instance opportunities
      const reservedInstanceCheck = this.checkReservedInstanceOpportunities();
      if (reservedInstanceCheck.savings > 0) {
        optimizations.push(reservedInstanceCheck);
        potentialSavings += reservedInstanceCheck.savings;
      }

      // Check for service consolidation
      const consolidationCheck = this.checkServiceConsolidation();
      if (consolidationCheck.savings > 0) {
        optimizations.push(consolidationCheck);
        potentialSavings += consolidationCheck.savings;
      }

      this.log(`💡 Optimization opportunities found: ${optimizations.length}`, 
               optimizations.length > 0 ? 'green' : 'blue');
      this.log(`💰 Potential monthly savings: $${potentialSavings.toFixed(2)}`, 
               potentialSavings > 50 ? 'green' : 'blue');

      if (optimizations.length > 0) {
        this.log(`\n🔍 Top optimization opportunities:`, 'green');
        optimizations.slice(0, 3).forEach((opt, i) => {
          this.log(`   ${i + 1}. ${opt.description} (Save: $${opt.savings}/month)`, 'green');
        });
      }

      const responseTime = Date.now() - start;
      const status = optimizations.length > 0 ? 'pass' : 'warn';
      
      this.results.checks.costOptimization = {
        status,
        response_time_ms: responseTime,
        details: {
          optimizations,
          potentialSavings,
          totalOpportunities: optimizations.length
        },
        message: optimizations.length > 0 ? 
          `Found ${optimizations.length} cost optimization opportunities` : 
          'No major cost optimization opportunities identified'
      };

      return { status, responseTime, optimizations, potentialSavings };
    } catch (error) {
      this.results.checks.costOptimization = {
        status: 'fail',
        response_time_ms: Date.now() - start,
        error: error.message,
        message: 'Cost optimization analysis failed'
      };
      this.log(`❌ Cost optimization analysis failed: ${error.message}`, 'red');
      return { status: 'fail', error: error.message };
    }
  }

  async estimateComputeRequirements() {
    // Analyze codebase complexity to estimate compute needs
    const codeMetrics = await this.analyzeCodebaseComplexity();
    const dependencies = this.countDependencies();
    
    let tier = 'small';
    let cores = 1;
    let memory = 1;
    
    if (codeMetrics.totalFiles > 500 || dependencies.total > 100) {
      tier = 'medium';
      cores = 2;
      memory = 4;
    }
    
    if (codeMetrics.totalFiles > 1000 || dependencies.total > 200) {
      tier = 'large';
      cores = 4;
      memory = 8;
    }
    
    return { tier, cores, memory, complexity: codeMetrics };
  }

  async estimateStorageRequirements() {
    let totalGB = 10; // Base requirement
    let backupGB = 5;
    
    try {
      // Check if node_modules exists and estimate based on that
      if (fs.existsSync('./node_modules')) {
        const size = await this.calculateDirectorySize('./node_modules');
        const sizeGB = size / (1024 * 1024 * 1024);
        totalGB += Math.ceil(sizeGB * 2); // 2x for safety
        backupGB = Math.ceil(totalGB * 0.5);
      }
      
      // Add estimation for user data
      totalGB += 20; // 20GB for user data
      backupGB += 10; // 10GB for backups
      
    } catch (error) {
      // Use defaults
    }
    
    return { totalGB, backupGB };
  }

  async estimateDatabaseRequirements() {
    // Simple heuristic based on application complexity
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const hasDatabase = Object.keys(packageJson.dependencies || {}).some(dep =>
      dep.includes('prisma') || dep.includes('postgres') || dep.includes('mysql')
    );
    
    if (!hasDatabase) {
      return { tier: 'none', cost: 0 };
    }
    
    // Start with medium for CPA platform
    return { tier: 'medium', cost: this.costModels.database.medium.cost };
  }

  calculateComputeCost(requirements) {
    return this.costModels.compute[requirements.tier]?.cost || 15;
  }

  calculateStorageCost(requirements) {
    const storageCost = requirements.totalGB * this.costModels.storage.pricePerGB;
    const backupCost = requirements.backupGB * this.costModels.storage.backupPricePerGB;
    return storageCost + backupCost;
  }

  calculateDatabaseCost(requirements) {
    if (requirements.tier === 'none') return 0;
    return this.costModels.database[requirements.tier]?.cost || 20;
  }

  analyzeDependencyCosts(dependencies, devDependencies) {
    const totalDeps = Object.keys(dependencies).length + Object.keys(devDependencies).length;
    
    // Estimate based on known expensive dependencies
    const expensiveDeps = [
      'typescript', 'webpack', 'babel', 'eslint', 'jest',
      'react', 'next', 'express', 'apollo'
    ];
    
    const highMaintenanceDeps = Object.keys({...dependencies, ...devDependencies})
      .filter(dep => expensiveDeps.some(expensive => dep.includes(expensive))).length;
    
    // Most dependencies are free, but estimate support/maintenance costs
    const licenseCosts = highMaintenanceDeps * 50; // $50/year per high-maintenance dep
    
    return {
      licenseCosts,
      highMaintenance: highMaintenanceDeps,
      totalDependencies: totalDeps
    };
  }

  estimateCICDCosts() {
    // Basic GitHub Actions is free for public repos, estimate for private
    return 25; // $25/month for CI/CD
  }

  estimateObservabilityCosts() {
    return this.costModels.services.monitoring + this.costModels.services.logging;
  }

  estimateSecurityCosts() {
    return this.costModels.services.security;
  }

  calculateScalingCosts(scenario) {
    const scale = scenario.scale;
    
    // Scale compute linearly with load
    const computeTier = scale <= 1 ? 'small' : scale <= 5 ? 'medium' : scale <= 15 ? 'large' : 'xlarge';
    const compute = this.costModels.compute[computeTier].cost * Math.ceil(scale / 5);
    
    // Scale storage sub-linearly
    const storage = (10 + (scale * 5)) * this.costModels.storage.pricePerGB;
    
    // Scale database
    const dbTier = scale <= 3 ? 'small' : scale <= 15 ? 'medium' : 'large';
    const database = this.costModels.database[dbTier].cost;
    
    // Scale services
    const services = Object.values(this.costModels.services).reduce((sum, cost) => sum + cost, 0);
    
    const total = compute + storage + database + services;
    
    return {
      scenario,
      compute,
      storage,
      database,
      services,
      total
    };
  }

  checkOverProvisioning() {
    // Check if current configuration is over-provisioned
    return {
      description: 'Right-size compute instances based on actual usage',
      savings: 30,
      effort: 'Low',
      impact: 'Medium'
    };
  }

  checkUnusedResources() {
    return {
      description: 'Remove unused development dependencies and services',
      savings: 15,
      effort: 'Low',
      impact: 'Low'
    };
  }

  checkAlternativeArchitectures() {
    return {
      description: 'Consider serverless functions for background tasks',
      savings: 25,
      effort: 'Medium',
      impact: 'Medium'
    };
  }

  checkReservedInstanceOpportunities() {
    return {
      description: 'Use reserved instances for predictable workloads',
      savings: 40,
      effort: 'Low',
      impact: 'High'
    };
  }

  checkServiceConsolidation() {
    return {
      description: 'Consolidate monitoring and logging services',
      savings: 20,
      effort: 'Medium',
      impact: 'Low'
    };
  }

  async analyzeCodebaseComplexity() {
    let totalFiles = 0;
    const scanDirs = ['./apps/web/src', './packages'];
    
    for (const dir of scanDirs) {
      if (fs.existsSync(dir)) {
        totalFiles += await this.countFilesRecursively(dir);
      }
    }
    
    return { totalFiles };
  }

  async countFilesRecursively(dirPath) {
    let count = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          count += await this.countFilesRecursively(fullPath);
        } else if (stat.isFile()) {
          count++;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return count;
  }

  countDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const prod = Object.keys(packageJson.dependencies || {}).length;
      const dev = Object.keys(packageJson.devDependencies || {}).length;
      return { production: prod, development: dev, total: prod + dev };
    } catch (error) {
      return { production: 0, development: 0, total: 0 };
    }
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

  async runAllChecks() {
    this.logHeader('AdvisorOS Cost Analysis Service');
    
    const startTime = Date.now();
    
    try {
      // Run all cost analysis checks
      const [infrastructure, development, scaling, optimization] = await Promise.all([
        this.checkInfrastructureCosts(),
        this.checkDevelopmentCosts(),
        this.checkScalingCosts(),
        this.checkCostOptimization()
      ]);

      // Calculate overall status
      const checks = [infrastructure, development, scaling, optimization];
      const failedChecks = checks.filter(check => check.status === 'fail');
      const warnChecks = checks.filter(check => check.status === 'warn');
      const totalTime = Date.now() - startTime;

      let overallStatus = 'healthy';
      if (failedChecks.length > 0) {
        overallStatus = 'unhealthy';
      } else if (warnChecks.length > 1) {
        overallStatus = 'degraded';
      }

      // Calculate total costs
      const totalMonthlyCost = (infrastructure.totalCost || 0) + (development.totalCost || 0);
      const totalPotentialSavings = optimization.potentialSavings || 0;

      this.results.status = overallStatus;
      this.results.summary = {
        totalChecks: checks.length,
        passedChecks: checks.filter(c => c.status === 'pass').length,
        warningChecks: warnChecks.length,
        failedChecks: failedChecks.length,
        totalMonthlyCost,
        potentialSavings: totalPotentialSavings,
        totalTime,
        overallStatus
      };

      // Store cost breakdown
      this.results.costs = {
        infrastructure: infrastructure.totalCost || 0,
        development: development.totalCost || 0,
        monthly: totalMonthlyCost,
        annual: totalMonthlyCost * 12
      };

      // Store projections
      this.results.projections = scaling.projections || [];

      // Generate recommendations
      if (totalMonthlyCost > 300) {
        this.results.recommendations.push('Consider cost optimization strategies for high monthly costs');
      }
      if (totalPotentialSavings > 50) {
        this.results.recommendations.push(`Implement cost optimizations to save $${totalPotentialSavings.toFixed(2)}/month`);
      }
      if (warnChecks.length > 0) {
        this.results.recommendations.push('Review warning areas for cost efficiency improvements');
      }
      if (scaling.projections && scaling.projections.length > 0) {
        const maxCost = Math.max(...scaling.projections.map(p => p.total));
        if (maxCost > 2000) {
          this.results.recommendations.push('Plan for cost optimization at scale to manage growth expenses');
        }
      }

      // Final summary
      this.logSection('Cost Analysis Summary');
      this.log(`📊 Overall Status: ${overallStatus.toUpperCase()}`, 
               overallStatus === 'healthy' ? 'green' : overallStatus === 'degraded' ? 'yellow' : 'red');
      this.log(`💰 Current monthly cost estimate: $${totalMonthlyCost.toFixed(2)}`, 
               totalMonthlyCost > 300 ? 'yellow' : 'green');
      this.log(`💵 Annual cost estimate: $${(totalMonthlyCost * 12).toFixed(2)}`, 'blue');
      this.log(`🎯 Potential savings: $${totalPotentialSavings.toFixed(2)}/month`, 
               totalPotentialSavings > 0 ? 'green' : 'blue');
      this.log(`✅ Passed: ${this.results.summary.passedChecks}/${this.results.summary.totalChecks}`, 'green');
      
      if (warnChecks.length > 0) {
        this.log(`⚠️  Warnings: ${warnChecks.length}`, 'yellow');
      }
      
      if (failedChecks.length > 0) {
        this.log(`❌ Failed: ${failedChecks.length}`, 'red');
        failedChecks.forEach(check => {
          this.log(`   - ${check.error || 'Cost analysis failed'}`, 'red');
        });
      }
      
      this.log(`⏱️  Total analysis time: ${totalTime}ms`, 'blue');

      if (this.results.recommendations.length > 0) {
        this.log(`\n💡 Cost Recommendations:`, 'yellow');
        this.results.recommendations.forEach((rec, i) => {
          this.log(`   ${i + 1}. ${rec}`, 'yellow');
        });
      }

      return this.results;
    } catch (error) {
      this.log(`❌ Cost analysis service failed: ${error.message}`, 'red');
      this.results.status = 'unhealthy';
      this.results.error = error.message;
      return this.results;
    }
  }

  async saveResults(outputPath = './cost-analysis-results.json') {
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
  const costAnalysis = new CostAnalysisService();
  
  costAnalysis.runAllChecks()
    .then(async (results) => {
      await costAnalysis.saveResults();
      
      // Exit with appropriate code
      const exitCode = results.status === 'healthy' ? 0 : 
                      results.status === 'degraded' ? 1 : 2;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Cost analysis failed:', error);
      process.exit(2);
    });
}

module.exports = CostAnalysisService;