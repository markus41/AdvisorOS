# /orchestrated-feature-dev - Orchestrated Feature Development

**Usage:** `/orchestrated-feature-dev <feature description>`

Develops a complete feature using intelligent agent orchestration with inter-agent communication, automatic handoffs, and real-time progress tracking.

## What This Does

This command uses the **Agent Orchestration System** to:
- 🎯 Automatically route to multiple specialized agents
- 🤝 Enable inter-agent communication and handoffs
- 📊 Provide real-time dashboard updates
- 🎓 Learn from execution for future improvements
- ⚡ Execute agents in parallel where possible
- 📝 Generate complete audit trails

## Parameters

- `feature description` (required): Description of the feature to build

## Examples

```bash
# Build complete API feature
/orchestrated-feature-dev Build REST API for client document management

# Create full-stack feature
/orchestrated-feature-dev Add document upload with OCR processing and storage

# Security-critical feature
/orchestrated-feature-dev Implement multi-factor authentication for admin panel
```

## Command Implementation

```javascript
// Initialize the orchestration router
const AgentOrchestrationRouter = require('../lib/agent-orchestration-router');
const router = new AgentOrchestrationRouter();

// Parse feature description
const featureDescription = args.join(' ') || 'Build new feature';

console.log(`\n🚀 Starting orchestrated feature development...\n`);
console.log(`📝 Feature: ${featureDescription}\n`);

// Execute with full orchestration
const result = await router.execute(featureDescription, {
  forceOrchestration: true  // Always use orchestration for feature development
});

if (result.mode === 'orchestrated') {
  console.log('\n✅ Feature development completed!\n');
  console.log('📊 Results:');
  console.log(`   • Dashboard: ${result.dashboard}`);
  console.log(`   • Execution Log: ${result.logs}`);
  console.log(`   • Duration: ${result.report.totalDuration}ms`);
  console.log(`   • Agents Used: ${result.report.agentsUsed.length}`);
  console.log(`   • Tool Calls: ${result.report.toolCallsTotal}`);
  console.log(`   • Agent Messages: ${result.report.agentMessagesTotal}`);
  console.log(`   • Parallel Execution: ${result.report.parallelExecutionPercentage}%`);

  if (result.report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.report.recommendations.forEach(rec => {
      console.log(`   • [${rec.priority}] ${rec.message}`);
    });
  }

  if (result.report.learnedPatterns.length > 0) {
    console.log('\n🎓 Learned Patterns:');
    result.report.learnedPatterns.forEach(pattern => {
      console.log(`   • ${pattern.type}: ${pattern.pattern} (${pattern.confidence}% confidence)`);
    });
  }

  console.log(`\n📄 View complete dashboard: ${result.dashboard}`);
  console.log(`📝 View execution logs: ${result.logs}\n`);
} else {
  console.log('\n⚠️  Orchestration unavailable, using single-agent mode\n');
  console.log(`Agent: ${result.selection.agent}`);
  console.log(`Recommendation: ${result.recommendation}\n`);
}

// Cleanup
await router.shutdown();
```

## Execution Flow

### Phase 1: Analysis & Planning
```
architecture-designer
  ↓ Analyzes feature requirements
  ↓ Designs system architecture
  ↓ HANDOFF with architecture plan
```

### Phase 2: Database & Backend (Parallel)
```
database-optimizer              backend-api-developer
  ↓ Optimizes schema              ↓ Builds API endpoints
  ↓ Creates indexes               ↓ Implements business logic
  ↓ VALIDATION_REQUEST to security-auditor
```

### Phase 3: Security & Frontend (Parallel)
```
security-auditor                frontend-builder
  ↓ Reviews security              ↓ Creates UI components
  ↓ Validates auth/authz          ↓ Integrates with API
  ↓ VALIDATION_RESULT (approved)
```

### Phase 4: Testing & Documentation (Parallel)
```
test-suite-developer            docs-writer
  ↓ Generates unit tests          ↓ Creates API documentation
  ↓ Creates integration tests     ↓ Writes user guides
  ↓ COMPLETION
```

### Phase 5: Learning
```
All agents share discoveries
  ↓ PATTERN_DISCOVERED messages
  ↓ Learnings stored in Memory Bank MCP
  ↓ Future executions improved
```

## Real-Time Dashboard

During execution, a live Markdown dashboard is generated showing:

- **Agent Status Table**: Real-time agent progress
- **Communication Flow**: Mermaid diagram of agent interactions
- **Progress Bar**: Visual execution progress
- **Recent Messages**: Latest agent communications
- **Performance Metrics**: Parallel execution %, MCP utilization, etc.
- **Learned Patterns**: New patterns discovered during execution

## Audit Trail

Complete execution log includes:
- Chronological agent start/complete times
- All tool calls with durations
- Inter-agent messages and handoffs
- Performance bottlenecks identified
- Optimization recommendations
- Learned patterns for future use

## Benefits vs. Standard Development

| Standard Approach | Orchestrated Approach |
|-------------------|----------------------|
| Manual agent coordination | Automatic orchestration |
| No inter-agent communication | Full message passing |
| Sequential execution | Parallel where possible |
| Lost context between agents | Seamless handoffs |
| No execution visibility | Real-time dashboard |
| No learning | Continuous improvement |
| 100% developer time | 50-70% faster |

## Integration with MCP Servers

Automatically integrates with:
- **PostgreSQL MCP**: Database queries shared between agents
- **Memory Bank MCP**: Learning storage and retrieval
- **GitHub MCP**: Repository operations coordinated
- **Azure AI MCP**: AI service orchestration

## Success Criteria

Feature development is successful when:
- ✅ All agents complete without errors
- ✅ Security validation passes
- ✅ Tests generated and passing
- ✅ Documentation created
- ✅ Handoffs successful (100% success rate)
- ✅ Patterns learned for future use

## Related Commands

- `/multi-agent-review` - Code review with orchestration
- `/feature-development-pipeline` - Full pipeline orchestration
- `/security-audit` - Security-focused orchestration

## Configuration

Set environment variables to customize:
```bash
export CLAUDE_ORCHESTRATION_MODE=enabled
export CLAUDE_MAX_PARALLEL_AGENTS=5
export CLAUDE_ENABLE_LEARNING=true
```

## Troubleshooting

**Issue**: Orchestration not available
- Check that `.claude/orchestration/` exists
- Run `node .claude/orchestration/test-orchestration.js` to verify

**Issue**: Slow execution
- Check dashboard for bottlenecks
- Review performance recommendations in report

**Issue**: Agents not communicating
- Verify communication bus statistics in report
- Check agent messages log

## Output Files

After execution, find generated files in `.claude/logs/`:
- `dashboard-{sessionId}.md` - Real-time dashboard
- `execution-{sessionId}.log` - Complete execution log
- `report-{sessionId}.json` - Performance report JSON
- `agent-messages.log` - All agent communications

---

**Powered by AdvisorOS Agent Orchestration System** - Intelligent multi-agent coordination with communication, handoffs, and learning.