"""
Multi-Tenant Security Check Tool for AdvisorOS
Comprehensive security audit for multi-tenant CPA platform architecture

This tool provides comprehensive security validation with:
- Organization isolation verification  
- RBAC (Role-Based Access Control) validation
- Cross-tenant access prevention testing
- Data security and privacy compliance
"""

import logging
from typing import Any, Optional
from mcp.types import TextContent
from tools.workflow.base import WorkflowTool
from tools.shared.base_models import ToolRequest

logger = logging.getLogger(__name__)


class MultiTenantSecurityCheckTool(WorkflowTool):
    """
    Multi-step workflow tool for comprehensive multi-tenant security auditing
    specifically designed for CPA platform security validation
    """

    def get_name(self) -> str:
        return "multi-tenant-security-check"

    def get_description(self) -> str:
        return """MULTI-TENANT SECURITY AUDIT & VALIDATION

Advanced multi-step workflow for comprehensive multi-tenant security auditing:

🔒 **Organization Isolation Validation**
- Verifies organizationId filtering in all database queries
- Tests cross-tenant data access prevention
- Validates tenant-scoped business logic

🛡️ **RBAC Implementation Testing**  
- Tests role-based access control hierarchy
- Validates permission checking mechanisms
- Checks user authorization workflows

🔍 **Session Security Analysis**
- Reviews session management and tenant resolution
- Validates JWT token security and organization claims
- Tests session isolation between organizations

📊 **Database Security Audit**
- Validates Prisma schema organization relationships
- Tests cascade delete and data integrity
- Checks composite indexing for performance and security

🚨 **Penetration Testing Scenarios**
- Tests cross-organization API access attempts
- Validates middleware tenant validation
- Checks for data leakage vulnerabilities

🏢 **CPA Platform Specific Checks**
- Validates financial data isolation
- Tests client data access controls
- Checks tax preparation workflow security

Perfect for CPA platform developers ensuring robust multi-tenant security, data isolation, and regulatory compliance in accounting systems."""

    def get_tool_fields(self) -> dict[str, Any]:
        return {
            "prompt": {
                "type": "string", 
                "description": "Describe the security concern or specific multi-tenant security area to audit"
            },
            "audit_focus": {
                "type": "string",
                "description": "Primary security focus (data-isolation, rbac-validation, api-security, database-security)",
                "default": "comprehensive"
            },
            "threat_model": {
                "type": "string",
                "description": "Threat model context (insider-threat, external-attack, data-breach, privilege-escalation)",
                "default": "comprehensive"
            },
            "compliance_requirements": {
                "type": "string",
                "description": "Compliance requirements to validate (SOX, PCI-DSS, SOC2, GDPR)",
                "default": "SOX"
            },
            "files": self.FILES_FIELD
        }

    def get_required_fields(self) -> list[str]:
        return ["prompt"]

    def get_required_actions(self, step_number: int, confidence: float,
                           findings: str, total_steps: int) -> list[str]:
        """Define the multi-step security audit process"""
        
        if step_number == 1:
            return [
                "Analyze database schema and organization relationships",
                "Review all Prisma queries for organizationId filtering",
                "Identify potential data isolation vulnerabilities"
            ]
        elif step_number == 2:
            return [
                "Test tRPC procedures for proper tenant validation",
                "Validate organizationProcedure usage across API routes",
                "Check middleware implementation for tenant resolution"
            ]
        elif step_number == 3:
            return [
                "Audit RBAC implementation and role hierarchy",
                "Test permission checking across different user roles",
                "Validate user authorization workflows and edge cases"
            ]
        elif step_number == 4:
            return [
                "Test session security and JWT token validation",
                "Validate cross-tenant access prevention mechanisms",
                "Check for potential privilege escalation vulnerabilities"
            ]
        else:
            return [
                "Conduct penetration testing scenarios",
                "Generate comprehensive security assessment report",
                "Provide remediation recommendations and security improvements"
            ]

    def should_call_expert_analysis(self, consolidated_findings: Any) -> bool:
        """
        Always require expert analysis for security audits due to critical nature
        """
        return True

    def prepare_expert_analysis_context(self, consolidated_findings: Any) -> str:
        """
        Prepare context for expert multi-tenant security analysis
        """
        context = f"""
MULTI-TENANT SECURITY EXPERT ANALYSIS REQUEST

CONSOLIDATED SECURITY AUDIT FINDINGS:
{consolidated_findings.findings}

RELEVANT SECURITY COMPONENTS ANALYZED:
{', '.join(consolidated_findings.relevant_files) if consolidated_findings.relevant_files else 'No specific files provided'}

EXPERT SECURITY ANALYSIS NEEDED:
You are a senior security architect with expertise in multi-tenant SaaS security and CPA platform compliance.
Please provide expert analysis covering:

1. ORGANIZATION ISOLATION VALIDATION
   - Verify organizationId filtering completeness
   - Identify potential data leakage vulnerabilities
   - Validate tenant isolation mechanisms

2. RBAC SECURITY ASSESSMENT
   - Evaluate role hierarchy implementation (owner > admin > cpa > staff > client)
   - Validate permission checking mechanisms
   - Test privilege escalation prevention

3. API SECURITY VALIDATION
   - Check tRPC procedure security implementation
   - Validate middleware tenant resolution
   - Test cross-tenant API access prevention

4. DATABASE SECURITY AUDIT
   - Verify Prisma schema organization relationships
   - Validate composite indexing for security
   - Check data cascade and integrity controls

5. SESSION SECURITY ANALYSIS
   - Evaluate JWT token security and claims validation
   - Test session isolation between organizations
   - Validate NextAuth.js multi-tenant configuration

6. CPA PLATFORM SPECIFIC SECURITY
   - Validate financial data access controls
   - Check client confidentiality mechanisms
   - Verify tax data isolation and protection

7. COMPLIANCE SECURITY REQUIREMENTS
   - Assess SOX security control requirements
   - Validate audit trail security
   - Check data retention and deletion security

8. PENETRATION TESTING RESULTS
   - Identify exploitable vulnerabilities
   - Assess attack surface and risk levels
   - Recommend security hardening measures

Provide specific recommendations for enhancing multi-tenant security architecture.
Focus on CPA platform requirements and regulatory compliance needs.
"""
        return context

    async def prepare_prompt(self, request: ToolRequest) -> str:
        """
        Prepare the initial prompt for multi-tenant security audit
        """
        base_prompt = await super().prepare_prompt(request)
        
        # Add security-specific context
        security_context = f"""
MULTI-TENANT SECURITY AUDIT CONTEXT:
- Audit Focus: {request.audit_focus if hasattr(request, 'audit_focus') else 'comprehensive'}
- Threat Model: {request.threat_model if hasattr(request, 'threat_model') else 'comprehensive'}  
- Compliance Requirements: {request.compliance_requirements if hasattr(request, 'compliance_requirements') else 'SOX'}
- Platform: AdvisorOS Multi-Tenant CPA Platform
- Architecture: Next.js 15 + tRPC v10 + Prisma v5 + PostgreSQL + NextAuth.js
- Focus: Organization isolation, RBAC validation, and CPA data security

SECURITY AUDIT REQUEST:
{request.prompt}

Please begin the systematic multi-tenant security audit process with focus on organization isolation and CPA platform security requirements.
"""
        
        return base_prompt + "\n\n" + security_context


# Tool registration
def create_tool():
    """Factory function to create the tool instance"""
    return MultiTenantSecurityCheckTool()