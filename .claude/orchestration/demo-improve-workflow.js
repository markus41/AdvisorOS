#!/usr/bin/env node

/**
 * Demo: Orchestrated Workflow Improvement Analysis
 *
 * Shows how the orchestration system coordinates multiple agents
 * for comprehensive workflow improvement analysis
 */

const { ExecutionOrchestrator } = require('./execution-orchestrator');

async function demoImproveWorkflow() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Orchestrated Workflow Improvement - Live Demo                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const orchestrator = new ExecutionOrchestrator();

  try {
    // Initialize
    await orchestrator.initialize();

    console.log('\n📋 Demo Scenario: Improve Document Processing Workflow\n');
    console.log('This demo shows how multiple agents collaborate to analyze');
    console.log('and improve a CPA document processing workflow.\n');

    // Execute orchestrated improvement analysis
    const result = await orchestrator.executeRequest(
      'Analyze and improve document processing workflow for tax documents'
    );

    console.log('\n' + '='.repeat(70));
    console.log('📊 ORCHESTRATION RESULTS');
    console.log('='.repeat(70) + '\n');

    console.log('✅ Analysis Completed Successfully!\n');

    console.log('🤖 Agents Coordinated:');
    result.report.agentsUsed.forEach(agent => {
      console.log(`   • ${agent}`);
    });

    console.log(`\n💬 Inter-Agent Communications: ${result.report.agentMessagesTotal}`);
    console.log(`⏱️  Total Duration: ${result.report.totalDuration}ms`);
    console.log(`⚡ Parallel Execution: ${result.report.parallelExecutionPercentage}%`);
    console.log(`📞 Tool Calls: ${result.report.toolCallsTotal}`);
    console.log(`🔄 MCP Utilization: ${result.report.mcpUtilization}%`);

    if (result.report.recommendations.length > 0) {
      console.log('\n💡 Improvement Recommendations:');
      result.report.recommendations.forEach(rec => {
        console.log(`   [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }

    if (result.report.learnedPatterns.length > 0) {
      console.log('\n🎓 Patterns Learned:');
      result.report.learnedPatterns.forEach(pattern => {
        console.log(`   • ${pattern.type}: ${pattern.pattern}`);
        console.log(`     Confidence: ${pattern.confidence}%`);
      });
    }

    console.log('\n📂 Generated Artifacts:');
    console.log(`   Dashboard: ${result.dashboard}`);
    console.log(`   Execution Log: ${result.logFile}`);
    console.log(`   Performance Report: ${result.logFile.replace('.log', '-report.json')}`);

    console.log('\n' + '='.repeat(70));
    console.log('📈 ORCHESTRATION STATISTICS');
    console.log('='.repeat(70) + '\n');

    const stats = orchestrator.getStatistics();

    console.log('Communication:');
    console.log(`   • Total Messages: ${stats.communication.totalMessages}`);
    console.log(`   • Active Agents: ${stats.communication.activeAgents}`);
    console.log(`   • Message Types: ${Object.keys(stats.communication.messagesByType).join(', ')}`);

    console.log('\nHandoffs:');
    console.log(`   • Total Handoffs: ${stats.handoffs.totalHandoffs}`);
    console.log(`   • Success Rate: ${stats.handoffs.totalHandoffs > 0 ? Math.round((stats.handoffs.successfulHandoffs / stats.handoffs.totalHandoffs) * 100) : 0}%`);

    console.log('\nLearning:');
    console.log(`   • Executions Recorded: ${stats.learning.totalExecutions}`);
    console.log(`   • Patterns Discovered: ${stats.learning.totalPatterns}`);

    if (stats.learning.learningTrends.executionsThisWeek > 0) {
      console.log(`\n   This Week:`);
      console.log(`   • Executions: ${stats.learning.learningTrends.executionsThisWeek}`);
      console.log(`   • Success Rate: ${Math.round(stats.learning.learningTrends.successRate * 100)}%`);
      console.log(`   • New Patterns: ${stats.learning.learningTrends.newPatternsDiscovered}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('💡 KEY BENEFITS DEMONSTRATED');
    console.log('='.repeat(70) + '\n');

    console.log('✅ Multiple Specialized Agents - Coordinated analysis from experts');
    console.log('✅ Inter-Agent Communication - Agents validated each other\'s findings');
    console.log('✅ Parallel Execution - Faster results through concurrent processing');
    console.log('✅ Automatic Handoffs - Seamless context transfer between agents');
    console.log('✅ Learning System - Patterns stored for future improvements');
    console.log('✅ Complete Audit Trail - Every step logged and traceable');
    console.log('✅ Real-Time Dashboard - Live progress visualization');

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Demo completed! Check the generated files for details.\n');

    // Cleanup
    await orchestrator.shutdown();

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.error(error.stack);
    await orchestrator.shutdown();
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  demoImproveWorkflow().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { demoImproveWorkflow };