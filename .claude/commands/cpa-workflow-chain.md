---
description: Automated CPA workflow chain that orchestrates document processing through tax compliance verification
allowed-tools: [Bash, Read, Write, Edit, Task]
---

# CPA Document Processing Workflow Chain

End-to-end automated workflow for CPA document processing and compliance:

## Process Overview
Processing workflow for: $ARGUMENTS

## Agent Chain Sequence:

### 1. Document Intelligence & OCR
**Agent**: document-intelligence-optimizer
**Task**: Extract and classify document content
**Output**: Structured data and document metadata

### 2. Financial Data Validation
**Agent**: financial-prediction-modeler
**Task**: Validate extracted financial data for accuracy and completeness
**Output**: Validated financial records with anomaly flags

### 3. Tax Compliance Analysis
**Agent**: cpa-tax-compliance
**Task**: Analyze tax implications and compliance requirements
**Output**: Tax classification and compliance recommendations

### 4. Audit Trail Creation
**Agent**: audit-trail-perfectionist
**Task**: Generate comprehensive audit trail and documentation
**Output**: Complete audit documentation package

### 5. Client Communication
**Agent**: client-success-optimizer
**Task**: Prepare client communication and next steps
**Output**: Client notification and action items

## Workflow Initialization:
```bash
# Initialize the CPA workflow chain
node .claude/hooks/subagentStop.js init cpa-document-processing
```

## Execution Flow:
1. **Document Upload** → OCR Processing → Data Extraction
2. **Data Validation** → Anomaly Detection → Quality Verification
3. **Tax Analysis** → Compliance Check → Risk Assessment
4. **Audit Documentation** → Trail Generation → Compliance Verification
5. **Client Notification** → Summary Generation → Next Steps

Let me start by using the document-intelligence-optimizer agent to begin the document processing workflow.