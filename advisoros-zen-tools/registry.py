"""
AdvisorOS CPA Tools Registry
Custom tools for professional CPA development workflows
"""

CPA_TOOLS = {
    "tax_calculation_review": {
        "name": "Tax Calculation Review",
        "description": "Automated review of tax calculation logic with compliance checking",
        "category": "compliance",
        "multi_tenant_aware": True
    },
    "financial_compliance_audit": {
        "name": "Financial Compliance Audit", 
        "description": "Comprehensive audit of financial compliance (SOX, GAAP)",
        "category": "audit",
        "multi_tenant_aware": True
    },
    "multi_tenant_security_check": {
        "name": "Multi-Tenant Security Check",
        "description": "Security validation for organization isolation and RBAC",
        "category": "security", 
        "multi_tenant_aware": True
    }
}

def get_available_tools():
    """Return list of available CPA tools"""
    return list(CPA_TOOLS.keys())

def get_tool_info(tool_name):
    """Get detailed information about a specific tool"""
    return CPA_TOOLS.get(tool_name, None)