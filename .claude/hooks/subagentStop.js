#!/usr/bin/env node

/**
 * Subagent Stop Hook for AdvisorOS
 * Orchestrates agent chaining and workflow management
 */

const fs = require('fs');
const path = require('path');

// Workflow queue management
const WORKFLOW_QUEUE_FILE = path.join(__dirname, '..', 'workflow-queue.json');

function loadWorkflowQueue() {
  if (!fs.existsSync(WORKFLOW_QUEUE_FILE)) {
    return { active: null, pending: [] };
  }

  try {
    const content = fs.readFileSync(WORKFLOW_QUEUE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load workflow queue:', error.message);
    return { active: null, pending: [] };
  }
}

function saveWorkflowQueue(queue) {
  try {
    fs.writeFileSync(WORKFLOW_QUEUE_FILE, JSON.stringify(queue, null, 2));
  } catch (error) {
    console.error('Failed to save workflow queue:', error.message);
  }
}

function processWorkflowChain() {
  const queue = loadWorkflowQueue();

  // Mark current task as completed
  if (queue.active) {
    console.log(`✅ Completed: ${queue.active.description}`);
    queue.active = null;
  }

  // Check if there are pending tasks
  if (queue.pending.length === 0) {
    console.log('🎉 All workflow tasks completed successfully!');
    return;
  }

  // Get next task from queue
  const nextTask = queue.pending.shift();
  queue.active = nextTask;

  // Save updated queue
  saveWorkflowQueue(queue);

  // Generate command for next agent
  const nextCommand = generateAgentCommand(nextTask);

  console.log(`🔄 Next in workflow: ${nextTask.description}`);
  console.log(`📋 Suggested command:`);
  console.log(nextCommand);

  // In a fully automated system, this would execute automatically
  // For safety, we suggest the command for human approval
  console.log('\n💡 Copy and paste the above command to continue the workflow');
}

function generateAgentCommand(task) {
  const agentMap = {
    'tax-compliance': 'cpa-tax-compliance',
    'security-audit': 'security-auditor',
    'performance-optimization': 'performance-optimization-specialist',
    'database-optimization': 'database-optimizer',
    'frontend-development': 'frontend-builder',
    'backend-development': 'backend-api-developer',
    'integration-setup': 'integration-specialist',
    'documentation': 'docs-writer',
    'testing': 'test-suite-developer',
    'deployment': 'devops-azure-specialist'
  };

  const agentName = agentMap[task.type] || task.agent;

  if (!agentName) {
    return `# Manual task: ${task.description}`;
  }

  return `Use the ${agentName} agent to ${task.description}${task.parameters ? ` with parameters: ${task.parameters}` : ''}`;
}

// Predefined workflow templates
const workflowTemplates = {
  'client-onboarding': [
    {
      type: 'backend-development',
      description: 'create client database records and authentication setup',
      agent: 'backend-api-developer'
    },
    {
      type: 'integration-setup',
      description: 'configure QuickBooks and banking integrations',
      agent: 'integration-specialist'
    },
    {
      type: 'frontend-development',
      description: 'customize client portal interface',
      agent: 'client-portal-designer'
    },
    {
      type: 'documentation',
      description: 'generate client onboarding documentation',
      agent: 'docs-writer'
    }
  ],

  'feature-deployment': [
    {
      type: 'testing',
      description: 'create comprehensive test coverage for new feature',
      agent: 'test-suite-developer'
    },
    {
      type: 'security-audit',
      description: 'perform security vulnerability assessment',
      agent: 'security-auditor'
    },
    {
      type: 'performance-optimization',
      description: 'optimize feature performance and monitoring',
      agent: 'performance-optimization-specialist'
    },
    {
      type: 'deployment',
      description: 'deploy feature with blue-green strategy',
      agent: 'devops-azure-specialist'
    }
  ],

  'tax-season-preparation': [
    {
      type: 'performance-optimization',
      description: 'optimize system for increased tax season load',
      agent: 'tax-season-optimizer'
    },
    {
      type: 'database-optimization',
      description: 'optimize database queries and indexing',
      agent: 'database-optimizer'
    },
    {
      type: 'security-audit',
      description: 'ensure compliance and audit trail readiness',
      agent: 'audit-trail-perfectionist'
    },
    {
      type: 'testing',
      description: 'execute load testing for peak capacity',
      agent: 'test-suite-developer'
    }
  ]
};

function initializeWorkflow(workflowType) {
  if (!workflowTemplates[workflowType]) {
    console.error(`Unknown workflow type: ${workflowType}`);
    return;
  }

  const queue = {
    active: null,
    pending: [...workflowTemplates[workflowType]]
  };

  saveWorkflowQueue(queue);
  console.log(`🚀 Initialized ${workflowType} workflow with ${queue.pending.length} tasks`);
}

// Main execution
try {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init' && args[1]) {
    initializeWorkflow(args[1]);
  } else {
    processWorkflowChain();
  }

  process.exit(0);

} catch (error) {
  console.error(`❌ Subagent stop hook failed: ${error.message}`);
  process.exit(1);
}