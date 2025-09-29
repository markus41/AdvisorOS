"""
AdvisorOS Custom Zen Tools Package
Custom CPA-specific tools for Zen MCP Server integration
"""

from .tax_calculation_review import TaxCalculationReviewTool
from .financial_compliance_audit import FinancialComplianceAuditTool  
from .multi_tenant_security_check import MultiTenantSecurityCheckTool

__all__ = [
    "TaxCalculationReviewTool",
    "FinancialComplianceAuditTool", 
    "MultiTenantSecurityCheckTool"
]

# Tool registry for Zen MCP Server integration
ADVISOROS_ZEN_TOOLS = {
    "tax-calculation-review": TaxCalculationReviewTool(),
    "financial-compliance-audit": FinancialComplianceAuditTool(),
    "multi-tenant-security-check": MultiTenantSecurityCheckTool()
}