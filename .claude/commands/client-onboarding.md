---
description: Automated client onboarding workflow that creates accounts, sets up integrations, and initiates document collection
allowed-tools: [Bash, Read, Write, Edit, Task]
---

# Client Onboarding Automation

Streamlined client onboarding process using agent orchestration:

## Client Details
Processing onboarding for: $ARGUMENTS

## Workflow Steps:

### 1. Client Profile Creation
Use the backend-api-developer agent to:
- Create client record in database
- Set up authentication and permissions
- Configure billing and subscription settings

### 2. Integration Setup
Use the integration-specialist agent to:
- Configure QuickBooks OAuth connection
- Set up bank account linking
- Initialize data synchronization

### 3. Document Collection Setup
Use the document-intelligence-optimizer agent to:
- Create document upload workspace
- Configure OCR processing pipeline
- Set up classification and routing rules

### 4. Portal Configuration
Use the client-portal-designer agent to:
- Customize client portal interface
- Configure communication preferences
- Set up task and deadline management

### 5. Welcome Communication
Use the client-success-optimizer agent to:
- Send welcome email sequence
- Schedule onboarding call
- Create progress tracking dashboard

Let me start the onboarding process by using the backend-api-developer agent to create the client infrastructure.