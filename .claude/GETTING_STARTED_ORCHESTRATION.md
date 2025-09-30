# Getting Started with Agent Orchestration

Quick start guide for using the new Agent Orchestration System in AdvisorOS.

## What's New?

Your AdvisorOS now has **intelligent agent orchestration** with:

- 🤝 **Agents communicate** with each other during workflows
- 📊 **Real-time dashboards** show live execution progress
- 🔄 **Automatic handoffs** transfer context between agents seamlessly
- 🎓 **Learning system** makes agents smarter with each execution
- ⚡ **Parallel execution** runs independent agents simultaneously
- 📝 **Complete audit trails** for every workflow

## Quick Start (2 minutes)

### 1. Run the Test Suite

```bash
cd .claude/orchestration
node test-orchestration.js
```

This will run 3 test scenarios and generate:
- Live execution logs
- Real-time dashboards
- Performance reports
- Learned patterns

### 2. Check the Results

After running tests, check the generated files:

```bash
# View the dashboard
cat ../logs/dashboard-session_*.md

# View the execution log
cat ../logs/execution-session_*.log

# View the performance report
cat ../logs/report-session_*.json
```

### 3. Try Your Own Request

```javascript
const { ExecutionOrchestrator } = require('./.claude/orchestration/execution-orchestrator');

async function main() {
  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.executeRequest(
    'Your request here'
  );

  console.log('Dashboard:', result.dashboard);
  console.log('Log file:', result.logFile);
}

main();
```

## Real-World Examples

### Example 1: Security Fix

**Before (single agent):**
```javascript
await Task({
  subagent_type: 'security-auditor',
  prompt: 'Fix authentication vulnerability'
});
```

**After (orchestrated with communication):**
```javascript
const result = await orchestrator.executeRequest(
  'Fix security vulnerability in authentication endpoint'
);

// Automatically:
// 1. security-auditor analyzes issue
// 2. Broadcasts finding to all agents
// 3. database-optimizer confirms missing index
// 4. Hands off to backend-api-developer
// 5. Backend implements fix
// 6. Requests validation from security-auditor
// 7. Security approves
// 8. Hands off to test-suite-developer (parallel with docs-writer)
// 9. Both complete in parallel
// 10. Learnings recorded for future use
```

**Result:** Complete workflow with validation, testing, and documentation - all automated.

### Example 2: Feature Development

**Request:**
```javascript
await orchestrator.executeRequest(
  'Build new tax calculation API endpoint with tests and security review'
);
```

**What Happens:**

```
Phase 1 (Parallel):
├─ architecture-designer: Plan architecture
└─ database-optimizer: Design schema

Phase 2 (Sequential):
└─ backend-api-developer: Implement API

Phase 3 (Parallel):
├─ test-suite-developer: Generate tests
├─ docs-writer: Create documentation
└─ security-auditor: Security review

Learnings: All patterns saved for future use
```

### Example 3: Database Performance

**Request:**
```javascript
await orchestrator.executeRequest(
  'Optimize slow database queries in client reports'
);
```

**Agent Communication:**

```
database-optimizer discovers slow queries
  ↓ FINDING_REPORT
All agents notified
  ↓ ASSISTANCE_REQUEST
performance-optimization-specialist helps
  ↓ HANDOFF
backend-api-developer implements fixes
  ↓ VALIDATION_REQUEST
database-optimizer validates improvements
  ↓ PATTERN_DISCOVERED
Learning system records optimization pattern
```

## Understanding the Output

### Live Dashboard

Located at `.claude/logs/dashboard-{sessionId}.md`

```markdown
# 🚀 Live Execution Dashboard

**Session**: session_20250130_abc123
**Status**: ✅ Complete

## 📊 Agent Status
| Agent | Status | Duration | Tools | Messages |
|-------|--------|----------|-------|----------|
| security-auditor | ✅ Complete | 7000ms | 3 | 2 |
| backend-api-developer | ✅ Complete | 8156ms | 5 | 3 |

## 🔄 Communication Flow
[Mermaid diagram showing agent interactions]

## ⚡ Performance
- Parallel Execution: 60%
- MCP Utilization: 100%

## 🎓 Learned Patterns
- New patterns discovered and saved
```

### Execution Log

Located at `.claude/logs/execution-{sessionId}.log`

Shows chronological execution with:
- Agent start/complete times
- Tool calls with durations
- Agent messages
- Handoffs with context
- Learned patterns

### Performance Report

Located at `.claude/logs/report-{sessionId}.json`

JSON file with:
- Total duration
- Agents used
- Tool call statistics
- Communication metrics
- Bottleneck analysis
- Optimization recommendations
- Learned patterns

## Key Features Explained

### 1. Inter-Agent Communication

Agents send messages during execution:

```
security-auditor: "Found security issue in auth.ts:42"
  ↓ FINDING_REPORT broadcast
database-optimizer: "Confirmed - missing organizationId index"
  ↓ VALIDATION_RESULT response
backend-api-developer: "Fix implemented, requesting review"
  ↓ VALIDATION_REQUEST
security-auditor: "Approved - security issue resolved"
  ↓ VALIDATION_RESULT
```

### 2. Intelligent Handoffs

Context is transferred seamlessly:

```javascript
Handoff Package:
{
  from: 'security-auditor',
  to: 'backend-api-developer',
  context: {
    filesRead: ['auth.ts'],
    securityIssues: [{ severity: 'high', line: 42 }],
    recommendations: ['Add organizationId validation']
  },
  mcpData: {
    postgresQueries: [...],
    memoryBankContext: {...}
  }
}
```

### 3. Learning System

Each execution teaches the agents:

```javascript
// Before first execution
agent.queryLearnings('create-api-endpoint')
// → No learnings, uses default approach

// After 5 executions
agent.queryLearnings('create-api-endpoint')
// → Returns:
{
  recommendedToolSequence: ['Read', 'Edit', 'Write'],
  mcpServers: ['PostgreSQL MCP', 'GitHub MCP'],
  estimatedDuration: 8000ms,
  commonPitfalls: ['Forgot to update tests'],
  confidence: 85%
}
```

### 4. Parallel Execution

Independent agents run simultaneously:

```
Sequential (OLD): A → B → C → D = 40 seconds

Parallel (NEW):   A → B         = 20 seconds
                  └─→ C → D

50% faster!
```

## Integration with Your Workflow

### Option 1: Use in Slash Commands

Add to `.claude/commands/your-command.md`:

```javascript
const { ExecutionOrchestrator } = require('../orchestration/execution-orchestrator');

const orchestrator = new ExecutionOrchestrator();
await orchestrator.initialize();

const result = await orchestrator.executeRequest(userRequest);

return {
  dashboard: result.dashboard,
  logs: result.logFile,
  report: result.report
};
```

### Option 2: Use in Agent Routing

Update `.claude/lib/agent-selector.js`:

```javascript
// For complex multi-agent workflows
if (requiresMultipleAgents(request)) {
  const orchestrator = new ExecutionOrchestrator();
  await orchestrator.initialize();
  return await orchestrator.executeRequest(request);
}

// For single agent requests
return await executeAgent(selectedAgent, request);
```

### Option 3: Use Directly

```javascript
const orchestrator = new ExecutionOrchestrator();
await orchestrator.initialize();

const result = await orchestrator.executeRequest(
  'Your complex workflow request here'
);
```

## Configuration

### Basic Configuration

```javascript
const orchestrator = new ExecutionOrchestrator({
  communicationBus: {
    maxHistorySize: 1000,
    logPath: './logs/messages.log'
  },
  logger: {
    logDir: './logs'
  }
});
```

### Environment Variables

```bash
# Log directory
export CLAUDE_LOG_DIR=./.claude/logs

# MCP integration
export CLAUDE_MCP_MEMORY_BANK=enabled

# Orchestration settings
export CLAUDE_ENABLE_LEARNING=true
```

## Monitoring & Debugging

### View Statistics

```javascript
const stats = orchestrator.getStatistics();

console.log('Communication:', stats.communication);
// Total messages, active agents, messages by type

console.log('Handoffs:', stats.handoffs);
// Total handoffs, success rate, patterns

console.log('Learning:', stats.learning);
// Total executions, patterns discovered, trends
```

### Check Agent Messages

```bash
# View all agent messages
tail -f .claude/logs/agent-messages.log

# View specific session
grep "session_abc123" .claude/logs/agent-messages.log
```

### Debug Handoffs

```javascript
const handoffHistory = orchestrator.handoffSystem.getHandoffHistory({
  fromAgent: 'security-auditor',
  limit: 10
});

console.log('Recent handoffs:', handoffHistory);
```

## Performance Tips

1. **Enable Parallel Execution** - Automatically detected
2. **Use MCP Servers** - Faster data access via shared memory
3. **Cache Learning Data** - Queries cached for 1 hour
4. **Monitor Bottlenecks** - Check performance reports

## Troubleshooting

### Issue: Agents not communicating

```javascript
// Check communication bus
const stats = orchestrator.communicationBus.getStatistics();
console.log('Active agents:', stats.activeAgents);
console.log('Total messages:', stats.totalMessages);
```

### Issue: Handoffs failing

```javascript
// Check handoff statistics
const handoffStats = orchestrator.handoffSystem.getStatistics();
console.log('Success rate:', handoffStats.successfulHandoffs / handoffStats.totalHandoffs);
```

### Issue: No learnings available

```javascript
// Verify learning system
const learningStats = orchestrator.learningSystem.getStatistics();
console.log('Total executions:', learningStats.totalExecutions);
console.log('Patterns discovered:', learningStats.totalPatterns);
```

## Next Steps

1. **Run Tests**: `cd .claude/orchestration && node test-orchestration.js`
2. **Review Logs**: Check `.claude/logs/` for generated dashboards and reports
3. **Try Examples**: Use the examples above with your own requests
4. **Integrate**: Add to your slash commands or agent routing
5. **Monitor**: Watch the dashboards during execution

## Resources

- **Complete Documentation**: [.claude/AGENT_ORCHESTRATION.md](./.claude/AGENT_ORCHESTRATION.md)
- **Implementation Summary**: [.claude/ORCHESTRATION_IMPLEMENTATION_SUMMARY.md](./.claude/ORCHESTRATION_IMPLEMENTATION_SUMMARY.md)
- **Quick Reference**: [.claude/orchestration/README.md](./.claude/orchestration/README.md)
- **Test Suite**: [.claude/orchestration/test-orchestration.js](./.claude/orchestration/test-orchestration.js)

## Questions?

Common questions answered in the documentation:

- **How do agents know when to communicate?** - Automatically triggered by discoveries, validations, and handoffs
- **What happens if an agent fails?** - Error logged, other agents notified, workflow adjusts
- **How long are learnings stored?** - 30 days in Memory Bank MCP
- **Can I customize agent behavior?** - Yes, via configuration and custom agent templates
- **Does this work with existing agents?** - Yes, fully compatible with all 27 existing agents

---

**You're ready to use intelligent agent orchestration in AdvisorOS!**

Run `node .claude/orchestration/test-orchestration.js` to see it in action.