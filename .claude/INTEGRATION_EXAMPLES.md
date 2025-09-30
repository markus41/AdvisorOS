# Agent Orchestration - Integration Examples

Practical examples for integrating the Agent Orchestration System into your AdvisorOS workflows.

---

## Table of Contents

1. [Basic Integration](#basic-integration)
2. [Slash Command Integration](#slash-command-integration)
3. [Agent Routing Integration](#agent-routing-integration)
4. [MCP Server Integration](#mcp-server-integration)
5. [Custom Workflow Examples](#custom-workflow-examples)

---

## Basic Integration

### Example 1: Simple Orchestrated Execution

```javascript
const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');

async function developFeature(featureDescription) {
  // Initialize orchestrator
  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  try {
    // Execute with full orchestration
    const result = await orchestrator.executeRequest(featureDescription);

    // Check results
    if (result.success) {
      console.log('✅ Feature developed successfully!');
      console.log(`Dashboard: ${result.dashboard}`);
      console.log(`Logs: ${result.logFile}`);
      console.log(`Duration: ${result.report.totalDuration}ms`);

      return result;
    }
  } finally {
    // Always cleanup
    await orchestrator.shutdown();
  }
}

// Usage
await developFeature('Build client document upload API with OCR processing');
```

### Example 2: Using the Orchestration Router

```javascript
const AgentOrchestrationRouter = require('./.claude/lib/agent-orchestration-router');

async function smartRoute(userRequest, options = {}) {
  const router = new AgentOrchestrationRouter();

  try {
    // Get routing recommendation first
    const recommendation = router.getRoutingRecommendation(userRequest, options);

    console.log(`Recommended mode: ${recommendation.recommendedMode}`);
    console.log(`Primary agent: ${recommendation.selection.agent}`);

    if (recommendation.recommendedMode === 'orchestrated') {
      // Execute with orchestration
      const result = await router.execute(userRequest, options);
      return result;
    } else {
      // Execute single agent (existing workflow)
      return recommendation.selection;
    }
  } finally {
    await router.shutdown();
  }
}

// Usage
await smartRoute('Fix security vulnerability in authentication endpoint');
```

---

## Slash Command Integration

### Example 3: Enhanced Slash Command

Create `.claude/commands/my-feature.md`:

```markdown
# /my-feature

\`\`\`javascript
const AgentOrchestrationRouter = require('../lib/agent-orchestration-router');

// Parse args
const featureName = args[0] || 'New Feature';
const useOrchestration = args.includes('--orchestrated');

const router = new AgentOrchestrationRouter();

try {
  if (useOrchestration) {
    console.log('🚀 Using intelligent orchestration...\n');

    const result = await router.execute(`Build ${featureName}`, {
      forceOrchestration: true
    });

    if (result.mode === 'orchestrated') {
      console.log(`\\n✅ Orchestrated execution completed!`);
      console.log(`📊 Dashboard: ${result.dashboard}`);
      console.log(`📝 Logs: ${result.logs}`);
      console.log(`⏱️  Duration: ${result.report.totalDuration}ms`);
      console.log(`🤖 Agents: ${result.report.agentsUsed.join(', ')}`);
      console.log(`🤝 Messages: ${result.report.agentMessagesTotal}`);
      console.log(`⚡ Parallel: ${result.report.parallelExecutionPercentage}%`);
    }
  } else {
    // Standard execution
    console.log('Using standard agent routing...');
    const selection = router.agentSelector.selectAgent(`Build ${featureName}`);
    console.log(`Agent: ${selection.agent}`);
  }
} finally {
  await router.shutdown();
}
\`\`\`

## Usage

\`\`\`bash
# Standard execution
/my-feature "Document Upload"

# With orchestration
/my-feature "Document Upload" --orchestrated
\`\`\`
```

### Example 4: Multi-Step Workflow Command

```markdown
# /build-and-deploy

\`\`\`javascript
const { ExecutionOrchestrator } = require('../orchestration/execution-orchestrator');

const orchestrator = new ExecutionOrchestrator();
await orchestrator.initialize();

try {
  // Step 1: Build feature
  console.log('📦 Building feature...');
  const buildResult = await orchestrator.executeRequest(
    'Build and test new feature: ' + args.join(' ')
  );

  console.log(`✅ Build complete (${buildResult.report.totalDuration}ms)`);
  console.log(`   Agents used: ${buildResult.report.agentsUsed.join(', ')}`);

  // Step 2: Security scan
  console.log('\\n🔒 Running security scan...');
  const securityResult = await orchestrator.executeRequest(
    'Security audit of recent changes'
  );

  console.log(`✅ Security scan complete`);

  // Step 3: Deploy if all passed
  if (buildResult.success && securityResult.success) {
    console.log('\\n🚀 Deploying...');
    const deployResult = await orchestrator.executeRequest(
      'Deploy to staging environment'
    );

    console.log(`✅ Deployment complete!`);
    console.log(`\\n📊 Complete dashboard: ${deployResult.dashboard}`);
  }

  // Show aggregate stats
  const stats = orchestrator.getStatistics();
  console.log(`\\n📈 Total Statistics:`);
  console.log(`   Messages: ${stats.communication.totalMessages}`);
  console.log(`   Handoffs: ${stats.handoffs.totalHandoffs}`);
  console.log(`   Learnings: ${stats.learning.totalExecutions}`);

} finally {
  await orchestrator.shutdown();
}
\`\`\`
```

---

## Agent Routing Integration

### Example 5: Conditional Orchestration in Agent Selector

Update your agent selection logic:

```javascript
const AgentSelector = require('./.claude/lib/agent-selector');
const AgentOrchestrationRouter = require('./.claude/lib/agent-orchestration-router');

async function selectAndExecute(userRequest, filePath = null) {
  const selector = new AgentSelector();
  const selection = selector.selectAgent(userRequest, filePath);

  // Check if orchestration would benefit this request
  const complexityIndicators = [
    'build', 'implement', 'create and', 'with tests',
    'fix and', 'review and', 'end-to-end'
  ];

  const isComplex = complexityIndicators.some(
    indicator => userRequest.toLowerCase().includes(indicator)
  );

  if (isComplex || selection.type === 'multi-agent-workflow') {
    // Use orchestration
    const router = new AgentOrchestrationRouter();
    try {
      return await router.execute(userRequest, { filePath });
    } finally {
      await router.shutdown();
    }
  }

  // Use single agent
  return {
    mode: 'single-agent',
    selection
  };
}
```

### Example 6: Progressive Enhancement

```javascript
// Start with simple routing, upgrade to orchestration when beneficial
async function smartExecute(userRequest) {
  const AgentOrchestrationRouter = require('./.claude/lib/agent-orchestration-router');
  const router = new AgentOrchestrationRouter();

  try {
    // Get recommendation
    const rec = router.getRoutingRecommendation(userRequest);

    console.log(`Recommendation: ${rec.recommendedMode}`);
    console.log(`Benefits:`);
    rec.benefits.forEach(b => console.log(`  • ${b}`));

    // Ask user (or auto-decide based on complexity)
    const useOrchestration = rec.recommendedMode === 'orchestrated';

    if (useOrchestration) {
      return await router.execute(userRequest);
    } else {
      // Execute single agent via existing workflow
      return await executeStandardAgent(rec.selection);
    }
  } finally {
    await router.shutdown();
  }
}
```

---

## MCP Server Integration

### Example 7: PostgreSQL MCP with Orchestration

```javascript
const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');

async function optimizeDatabaseWithOrchestration() {
  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  try {
    // Orchestration automatically uses PostgreSQL MCP
    const result = await orchestrator.executeRequest(
      'Optimize database queries for client reports'
    );

    // PostgreSQL MCP data is automatically shared between agents
    console.log('Agents had access to shared PostgreSQL MCP data');
    console.log(`MCP Utilization: ${result.report.mcpUtilization}%`);

    return result;
  } finally {
    await orchestrator.shutdown();
  }
}
```

### Example 8: Memory Bank MCP for Learning

```javascript
async function learnFromExecution(taskDescription) {
  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  try {
    // Execute task
    const result = await orchestrator.executeRequest(taskDescription);

    // Learnings automatically stored in Memory Bank MCP
    console.log('\\n🎓 Learned Patterns:');
    result.report.learnedPatterns.forEach(pattern => {
      console.log(`   • ${pattern.type}: ${pattern.pattern}`);
      console.log(`     Confidence: ${pattern.confidence}%`);
    });

    // Query learnings for similar tasks
    const learnings = await orchestrator.learningSystem.queryLearnings(
      'backend-api-developer',
      { taskType: 'api-creation' }
    );

    console.log('\\n💡 Relevant Past Learnings:');
    console.log(`   Tool sequence: ${learnings.recommendedApproach.toolSequence.join(' → ')}`);
    console.log(`   Estimated duration: ${learnings.estimatedDuration?.estimated}ms`);

    return result;
  } finally {
    await orchestrator.shutdown();
  }
}
```

---

## Custom Workflow Examples

### Example 9: CPA Tax Workflow with Orchestration

```javascript
async function processTaxReturn(clientId, taxYear) {
  const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');

  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  try {
    console.log(`Processing tax return for client ${clientId}, year ${taxYear}...\\n`);

    // Step 1: Document processing with OCR
    const docResult = await orchestrator.executeRequest(
      `Process tax documents for client ${clientId} using OCR and AI classification`
    );

    console.log(`✅ Documents processed: ${docResult.report.agentsUsed.join(', ')}`);

    // Step 2: Tax calculation with compliance
    const taxResult = await orchestrator.executeRequest(
      `Calculate tax liability for ${taxYear} ensuring IRS compliance`
    );

    console.log(`✅ Tax calculated with compliance validation`);

    // Step 3: Review and audit trail
    const auditResult = await orchestrator.executeRequest(
      `Generate audit trail for tax return ${clientId}-${taxYear}`
    );

    console.log(`✅ Audit trail generated`);

    // Aggregate results
    const totalDuration =
      docResult.report.totalDuration +
      taxResult.report.totalDuration +
      auditResult.report.totalDuration;

    console.log(`\\n📊 Complete Tax Processing:`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Total Agents: ${new Set([
      ...docResult.report.agentsUsed,
      ...taxResult.report.agentsUsed,
      ...auditResult.report.agentsUsed
    ]).size}`);
    console.log(`   Total Messages: ${
      docResult.report.agentMessagesTotal +
      taxResult.report.agentMessagesTotal +
      auditResult.report.agentMessagesTotal
    }`);

    return {
      documents: docResult,
      calculation: taxResult,
      audit: auditResult
    };
  } finally {
    await orchestrator.shutdown();
  }
}
```

### Example 10: Parallel Feature Development

```javascript
async function developMultipleFeaturesInParallel(features) {
  const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');

  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  try {
    console.log(`Developing ${features.length} features in parallel...\\n`);

    // Execute all features in parallel
    const results = await Promise.all(
      features.map(feature =>
        orchestrator.executeRequest(`Build feature: ${feature}`)
      )
    );

    console.log(`\\n✅ All ${features.length} features completed!\\n`);

    // Aggregate statistics
    results.forEach((result, index) => {
      console.log(`Feature ${index + 1}: ${features[index]}`);
      console.log(`   Duration: ${result.report.totalDuration}ms`);
      console.log(`   Agents: ${result.report.agentsUsed.length}`);
      console.log(`   Messages: ${result.report.agentMessagesTotal}`);
      console.log(`   Dashboard: ${result.dashboard}\\n`);
    });

    return results;
  } finally {
    await orchestrator.shutdown();
  }
}

// Usage
await developMultipleFeaturesInParallel([
  'Client document upload',
  'Email notification system',
  'Report generation API'
]);
```

---

## Testing Integration

### Example 11: Integration Test with Orchestration

```javascript
const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');

describe('Orchestrated Feature Development', () => {
  let orchestrator;

  beforeAll(async () => {
    orchestrator = new ExecutionOrchestrator();
    await orchestrator.initialize();
  });

  afterAll(async () => {
    await orchestrator.shutdown();
  });

  test('should develop feature with multiple agents', async () => {
    const result = await orchestrator.executeRequest(
      'Build REST API for client management'
    );

    expect(result.success).toBe(true);
    expect(result.report.agentsUsed.length).toBeGreaterThan(1);
    expect(result.report.totalDuration).toBeLessThan(60000);
    expect(result.dashboard).toBeDefined();
  });

  test('should enable inter-agent communication', async () => {
    const result = await orchestrator.executeRequest(
      'Fix security vulnerability with validation'
    );

    expect(result.report.agentMessagesTotal).toBeGreaterThan(0);
    expect(result.report.mcpUtilization).toBeGreaterThan(0);
  });

  test('should learn from execution', async () => {
    const result = await orchestrator.executeRequest(
      'Create API endpoint'
    );

    const stats = orchestrator.getStatistics();
    expect(stats.learning.totalExecutions).toBeGreaterThan(0);
    expect(result.report.learnedPatterns.length).toBeGreaterThan(0);
  });
});
```

---

## Environment Configuration

### Example 12: Configuration File

Create `.claude/orchestration-config.json`:

```json
{
  "orchestration": {
    "enabled": true,
    "autoDetectComplexity": true,
    "maxParallelAgents": 5,
    "agentTimeout": 30000,
    "enableLearning": true,
    "enableCommunication": true
  },
  "logging": {
    "logDir": ".claude/logs",
    "logRetention": "30d",
    "dashboardEnabled": true,
    "realtimeUpdates": true
  },
  "mcp": {
    "postgresqlEnabled": true,
    "memoryBankEnabled": true,
    "githubEnabled": true
  },
  "performance": {
    "cacheEnabled": true,
    "cacheTTL": 3600000,
    "parallelThreshold": 2
  }
}
```

Load configuration:

```javascript
const fs = require('fs');
const config = JSON.parse(
  fs.readFileSync('.claude/orchestration-config.json', 'utf8')
);

const orchestrator = new ExecutionOrchestrator(config);
```

---

## Monitoring Integration

### Example 13: Real-Time Monitoring

```javascript
const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');
const fs = require('fs').promises;

async function monitoredExecution(userRequest) {
  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  // Set up monitoring
  const monitoringInterval = setInterval(async () => {
    const stats = orchestrator.getStatistics();

    console.log('\\n📊 Real-time Stats:');
    console.log(`   Active Agents: ${stats.communication.activeAgents}`);
    console.log(`   Total Messages: ${stats.communication.totalMessages}`);
    console.log(`   Handoffs: ${stats.handoffs.totalHandoffs}`);
  }, 5000); // Every 5 seconds

  try {
    const result = await orchestrator.executeRequest(userRequest);

    clearInterval(monitoringInterval);

    console.log('\\n✅ Execution complete!');
    console.log(`   Final dashboard: ${result.dashboard}`);

    return result;
  } catch (error) {
    clearInterval(monitoringInterval);
    throw error;
  } finally {
    await orchestrator.shutdown();
  }
}
```

---

## Best Practices

### When to Use Orchestration

✅ **Use orchestration for:**
- Multi-agent workflows
- Features requiring validation
- Complex development tasks
- Tasks benefiting from learning
- Workflows needing audit trails

❌ **Don't use orchestration for:**
- Simple file reads
- Single tool executions
- Quick queries
- Trivial tasks

### Performance Tips

1. **Enable parallelization** - Let orchestrator detect parallel opportunities
2. **Use MCP servers** - Share data via communication bus
3. **Cache learnings** - Query past executions before running
4. **Monitor dashboards** - Check for bottlenecks in real-time
5. **Review recommendations** - Act on optimization suggestions

---

For more examples, see:
- [Complete Documentation](./.claude/AGENT_ORCHESTRATION.md)
- [Test Suite](./.claude/orchestration/test-orchestration.js)
- [Getting Started Guide](./.claude/GETTING_STARTED_ORCHESTRATION.md)