/**
 * Test Script for Agent Orchestration System
 *
 * Demonstrates inter-agent communication, runtime logging, handoffs, and learning.
 */

const { ExecutionOrchestrator } = require('./execution-orchestrator');

/**
 * Run test scenarios
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   AdvisorOS Agent Orchestration System - Test Suite            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const orchestrator = new ExecutionOrchestrator();

  try {
    // Initialize orchestrator
    await orchestrator.initialize();

    console.log('\n' + '='.repeat(70));
    console.log('TEST 1: Security Vulnerability Fix with Agent Communication');
    console.log('='.repeat(70));

    const test1Result = await orchestrator.executeRequest(
      'Fix security vulnerability in authentication endpoint',
      { timeout: 30000 }
    );

    displayTestResult('Test 1', test1Result);

    console.log('\n' + '='.repeat(70));
    console.log('TEST 2: Feature Development with Parallel Execution');
    console.log('='.repeat(70));

    const test2Result = await orchestrator.executeRequest(
      'Build new API endpoint with database optimization and frontend UI',
      { timeout: 30000 }
    );

    displayTestResult('Test 2', test2Result);

    console.log('\n' + '='.repeat(70));
    console.log('TEST 3: Database Query Optimization');
    console.log('='.repeat(70));

    const test3Result = await orchestrator.executeRequest(
      'Optimize slow database query',
      { timeout: 30000 }
    );

    displayTestResult('Test 3', test3Result);

    // Display overall statistics
    console.log('\n' + '='.repeat(70));
    console.log('ORCHESTRATOR STATISTICS');
    console.log('='.repeat(70));

    const stats = orchestrator.getStatistics();
    displayStatistics(stats);

    // Shutdown
    await orchestrator.shutdown();

    console.log('\n✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

/**
 * Display test result
 */
function displayTestResult(testName, result) {
  console.log(`\n${testName} Result:`);
  console.log('─'.repeat(70));

  if (result.success) {
    console.log('✅ Status: SUCCESS');
    console.log(`📊 Dashboard: ${result.dashboard}`);
    console.log(`📄 Logs: ${result.logFile}`);
    console.log(`\n📈 Execution Report:`);
    console.log(`   • Duration: ${result.report.totalDuration}ms`);
    console.log(`   • Agents Used: ${result.report.agentsUsed.join(', ')}`);
    console.log(`   • Tool Calls: ${result.report.toolCallsTotal}`);
    console.log(`   • Agent Messages: ${result.report.agentMessagesTotal}`);
    console.log(`   • Parallel Execution: ${result.report.parallelExecutionPercentage}%`);
    console.log(`   • MCP Utilization: ${result.report.mcpUtilization}%`);

    if (result.report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      for (const rec of result.report.recommendations) {
        console.log(`   • [${rec.priority}] ${rec.type}: ${rec.message}`);
      }
    }

    if (result.report.learnedPatterns.length > 0) {
      console.log(`\n🎓 Learned Patterns:`);
      for (const pattern of result.report.learnedPatterns) {
        console.log(`   • ${pattern.type}: ${pattern.pattern} (${pattern.confidence}% confidence)`);
      }
    }
  } else {
    console.log('❌ Status: FAILED');
    console.log(`   Error: ${result.error}`);
  }

  console.log('─'.repeat(70));
}

/**
 * Display statistics
 */
function displayStatistics(stats) {
  console.log('\n📊 Communication Statistics:');
  console.log(`   • Total Messages: ${stats.communication.totalMessages}`);
  console.log(`   • Total Agents: ${stats.communication.totalAgents}`);
  console.log(`   • Active Agents: ${stats.communication.activeAgents}`);

  console.log('\n   Messages by Type:');
  for (const [type, count] of Object.entries(stats.communication.messagesByType)) {
    console.log(`      - ${type}: ${count}`);
  }

  console.log('\n   Top Agents by Activity:');
  const sortedAgents = stats.communication.agentStats
    .sort((a, b) => (b.messagesSent + b.messagesReceived) - (a.messagesSent + a.messagesReceived))
    .slice(0, 5);

  for (const agent of sortedAgents) {
    console.log(`      - ${agent.name}: ${agent.messagesSent + agent.messagesReceived} messages`);
  }

  console.log('\n🤝 Handoff Statistics:');
  console.log(`   • Total Handoffs: ${stats.handoffs.totalHandoffs}`);
  console.log(`   • Successful Handoffs: ${stats.handoffs.successfulHandoffs}`);
  console.log(`   • Success Rate: ${stats.handoffs.totalHandoffs > 0 ? Math.round((stats.handoffs.successfulHandoffs / stats.handoffs.totalHandoffs) * 100) : 0}%`);

  console.log('\n🎓 Learning Statistics:');
  console.log(`   • Total Executions Recorded: ${stats.learning.totalExecutions}`);
  console.log(`   • Total Patterns Discovered: ${stats.learning.totalPatterns}`);

  if (stats.learning.learningTrends.executionsThisWeek > 0) {
    console.log(`\n   This Week's Trends:`);
    console.log(`      - Executions: ${stats.learning.learningTrends.executionsThisWeek}`);
    console.log(`      - Success Rate: ${Math.round(stats.learning.learningTrends.successRate * 100)}%`);
    console.log(`      - New Patterns: ${stats.learning.learningTrends.newPatternsDiscovered}`);
  }

  if (stats.learning.mostDiscoveredPatterns.length > 0) {
    console.log('\n   Most Used Patterns:');
    for (const pattern of stats.learning.mostDiscoveredPatterns) {
      console.log(`      - ${pattern.name}: ${pattern.usageCount} uses (discovered by ${pattern.discoveredBy})`);
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };