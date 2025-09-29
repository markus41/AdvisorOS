"""
Financial Compliance Audit Tool for AdvisorOS
SOX compliance and financial regulation validation for CPA platforms

This tool provides comprehensive financial compliance auditing with:
- SOX (Sarbanes-Oxley) compliance validation
- GAAP/IFRS adherence checking
- Audit trail verification
- Financial controls testing
"""

import logging
from typing import Any, Optional
from mcp.types import TextContent
from tools.workflow.base import WorkflowTool
from tools.shared.base_models import ToolRequest

logger = logging.getLogger(__name__)


class FinancialComplianceAuditTool(WorkflowTool):
    """
    Multi-step workflow tool for comprehensive financial compliance auditing
    specifically designed for CPA platform compliance validation
    """

    def get_name(self) -> str:
        return "financial-compliance-audit"

    def get_description(self) -> str:
        return """FINANCIAL COMPLIANCE AUDIT & SOX VALIDATION

Advanced multi-step workflow for comprehensive financial compliance auditing:

📋 **SOX Compliance Validation**
- Verifies Sarbanes-Oxley compliance requirements
- Validates internal financial controls
- Checks audit trail completeness and integrity

🔍 **GAAP/IFRS Adherence**
- Validates financial reporting standards compliance
- Checks accounting principle implementations  
- Verifies financial statement accuracy

📊 **Audit Trail Analysis**
- Reviews data retention policies and implementation
- Validates change tracking and logging
- Checks user access controls and permissions

🛡️ **Financial Controls Testing**
- Tests segregation of duties implementation
- Validates authorization controls
- Checks data backup and recovery procedures

🏢 **Multi-Tenant Compliance**
- Validates organization-scoped financial data
- Checks cross-tenant access prevention
- Verifies compliance reporting capabilities

Perfect for CPA platform developers ensuring financial compliance, audit readiness, and regulatory adherence in multi-tenant accounting systems."""

    def get_tool_fields(self) -> dict[str, Any]:
        return {
            "prompt": {
                "type": "string",
                "description": "Describe the financial compliance area or specific compliance requirements to audit"
            },
            "compliance_standard": {
                "type": "string",
                "description": "Primary compliance standard to validate against (SOX, GAAP, IFRS, etc.)",
                "default": "SOX"
            },
            "audit_scope": {
                "type": "string",
                "description": "Scope of audit (financial-controls, audit-trails, reporting, data-security)",
                "default": "comprehensive"
            },
            "organization_context": {
                "type": "string",
                "description": "Organization type context (public-company, CPA-firm, financial-services)",
                "default": "CPA-firm"
            },
            "files": self.FILES_FIELD
        }

    def get_required_fields(self) -> list[str]:
        return ["prompt"]

    def get_required_actions(self, step_number: int, confidence: float,
                           findings: str, total_steps: int) -> list[str]:
        """Define the multi-step financial compliance audit process"""
        
        if step_number == 1:
            return [
                "Analyze financial data handling and storage mechanisms",
                "Review audit trail implementation and completeness",
                "Identify financial control points and validation logic"
            ]
        elif step_number == 2:
            return [
                "Validate SOX compliance requirements implementation",
                "Check internal financial controls and segregation of duties",
                "Review user access controls and authorization mechanisms"
            ]
        elif step_number == 3:
            return [
                "Test data retention and backup procedures",
                "Validate financial reporting accuracy and completeness",
                "Check compliance documentation and audit evidence"
            ]
        elif step_number == 4:
            return [
                "Analyze multi-tenant compliance isolation",
                "Test cross-organization access prevention",
                "Validate compliance reporting and monitoring capabilities"
            ]
        else:
            return [
                "Generate comprehensive compliance assessment",
                "Document compliance gaps and recommendations",
                "Provide remediation roadmap and implementation guidance"
            ]

    def should_call_expert_analysis(self, consolidated_findings: Any) -> bool:
        """
        Always require expert analysis for financial compliance due to regulatory complexity
        """
        return True

    def prepare_expert_analysis_context(self, consolidated_findings: Any) -> str:
        """
        Prepare context for expert financial compliance analysis
        """
        context = f"""
FINANCIAL COMPLIANCE EXPERT ANALYSIS REQUEST

CONSOLIDATED AUDIT FINDINGS:
{consolidated_findings.findings}

RELEVANT FINANCIAL SYSTEMS ANALYZED:
{', '.join(consolidated_findings.relevant_files) if consolidated_findings.relevant_files else 'No specific files provided'}

EXPERT COMPLIANCE ANALYSIS NEEDED:
You are a senior CPA with expertise in financial compliance, SOX regulations, and audit requirements.
Please provide expert analysis covering:

1. SOX COMPLIANCE VALIDATION
   - Verify Sarbanes-Oxley compliance implementation
   - Validate internal financial controls effectiveness
   - Check audit trail completeness and integrity

2. FINANCIAL CONTROLS ASSESSMENT
   - Evaluate segregation of duties implementation
   - Validate authorization and approval workflows
   - Check financial data access controls

3. AUDIT TRAIL COMPLIANCE
   - Verify comprehensive change tracking
   - Validate data retention policies
   - Check audit evidence completeness

4. GAAP/IFRS ADHERENCE
   - Validate financial reporting standards compliance
   - Check accounting principle implementations
   - Verify financial statement accuracy

5. MULTI-TENANT COMPLIANCE
   - Validate organization-scoped financial controls
   - Check cross-tenant compliance isolation
   - Verify compliance reporting capabilities

6. REGULATORY RISK ASSESSMENT
   - Identify compliance gaps and risks
   - Recommend remediation strategies
   - Provide implementation roadmap

Focus on CPA platform compliance requirements and multi-tenant financial system architecture.
Provide specific recommendations for achieving and maintaining compliance.
"""
        return context

    async def prepare_prompt(self, request: ToolRequest) -> str:
        """
        Prepare the initial prompt for financial compliance audit
        """
        base_prompt = await super().prepare_prompt(request)
        
        # Add compliance-specific context
        compliance_context = f"""
FINANCIAL COMPLIANCE AUDIT CONTEXT:
- Compliance Standard: {request.compliance_standard if hasattr(request, 'compliance_standard') else 'SOX'}
- Audit Scope: {request.audit_scope if hasattr(request, 'audit_scope') else 'comprehensive'}
- Organization Context: {request.organization_context if hasattr(request, 'organization_context') else 'CPA-firm'}
- Multi-tenant CPA Platform: AdvisorOS
- Focus: Regulatory compliance, audit readiness, and financial controls

COMPLIANCE AUDIT REQUEST:
{request.prompt}

Please begin the systematic financial compliance audit process with focus on regulatory requirements and multi-tenant architecture.
"""
        
        return base_prompt + "\n\n" + compliance_context


# Tool registration
def create_tool():
    """Factory function to create the tool instance"""
    return FinancialComplianceAuditTool()