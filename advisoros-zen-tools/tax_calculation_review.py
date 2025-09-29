"""
Tax Calculation Review Tool for AdvisorOS
Multi-step tax calculation validation and optimization for CPA workflows

This tool provides comprehensive validation of tax calculations with:
- US tax code compliance verification
- IRS regulation adherence checking
- Edge case identification and handling
- Performance optimization recommendations
"""

import logging
from typing import Any, Optional
from mcp.types import TextContent
from tools.workflow.base import WorkflowTool
from tools.shared.base_models import ToolRequest

logger = logging.getLogger(__name__)


class TaxCalculationReviewTool(WorkflowTool):
    """
    Multi-step workflow tool for comprehensive tax calculation review
    specifically designed for CPA platform development
    """

    def get_name(self) -> str:
        return "tax-calculation-review"

    def get_description(self) -> str:
        return """TAX CALCULATION REVIEW & COMPLIANCE VALIDATION

Advanced multi-step workflow for validating tax calculations in CPA software:

🔍 **Tax Logic Analysis**
- Validates calculation accuracy against IRS regulations
- Identifies potential compliance issues
- Checks for proper tax code implementation

📋 **Regulatory Compliance** 
- Verifies adherence to current tax year regulations
- Validates deduction calculations and limitations
- Checks credit calculations and phase-outs

⚠️ **Edge Case Testing**
- Identifies boundary conditions and edge cases
- Tests AMT calculations and scenarios
- Validates multi-state tax calculations

🚀 **Performance Optimization**
- Analyzes calculation efficiency
- Suggests optimization opportunities
- Validates multi-tenant performance

Perfect for CPA developers working on tax preparation software, financial reporting systems, and multi-tenant accounting platforms."""

    def get_tool_fields(self) -> dict[str, Any]:
        return {
            "prompt": {
                "type": "string",
                "description": "Describe the tax calculation logic or issue you want reviewed"
            },
            "tax_year": {
                "type": "string", 
                "description": "Tax year for regulation compliance (e.g., 2024)",
                "default": "2024"
            },
            "calculation_type": {
                "type": "string",
                "description": "Type of tax calculation (federal, state, payroll, corporate, etc.)",
                "default": "federal"
            },
            "files": self.FILES_FIELD
        }

    def get_required_fields(self) -> list[str]:
        return ["prompt"]

    def get_required_actions(self, step_number: int, confidence: float, 
                           findings: str, total_steps: int) -> list[str]:
        """Define the multi-step investigation process for tax calculation review"""
        
        if step_number == 1:
            return [
                "Analyze the tax calculation logic and implementation",
                "Review code for tax regulation compliance",
                "Identify the tax calculation components and flow"
            ]
        elif step_number == 2:
            return [
                "Validate calculations against IRS regulations and tax code",
                "Check for proper handling of deductions and credits",
                "Verify tax bracket calculations and thresholds"
            ]
        elif step_number == 3:
            return [
                "Test edge cases and boundary conditions",
                "Validate multi-state and special scenario handling",
                "Check AMT (Alternative Minimum Tax) calculations if applicable"
            ]
        elif step_number == 4:
            return [
                "Analyze performance and multi-tenant considerations",
                "Generate comprehensive test cases for validation",
                "Provide optimization recommendations and compliance summary"
            ]
        else:
            return [
                "Finalize tax calculation review",
                "Generate compliance documentation", 
                "Provide implementation recommendations"
            ]

    def should_call_expert_analysis(self, consolidated_findings: Any) -> bool:
        """
        Determine if expert CPA analysis is needed based on findings
        """
        # Always call expert analysis for tax calculations due to complexity
        return True

    def prepare_expert_analysis_context(self, consolidated_findings: Any) -> str:
        """
        Prepare context for expert tax calculation analysis
        """
        context = f"""
TAX CALCULATION EXPERT ANALYSIS REQUEST

CONSOLIDATED INVESTIGATION FINDINGS:
{consolidated_findings.findings}

RELEVANT FILES ANALYZED:
{', '.join(consolidated_findings.relevant_files) if consolidated_findings.relevant_files else 'No specific files provided'}

EXPERT ANALYSIS NEEDED:
You are a senior CPA with expertise in tax software development and IRS regulations. 
Please provide expert analysis covering:

1. TAX COMPLIANCE VALIDATION
   - Verify calculations align with current IRS regulations
   - Validate tax bracket implementations
   - Check deduction and credit calculations

2. REGULATORY ADHERENCE  
   - Confirm compliance with tax year regulations
   - Validate business rule implementations
   - Check for required disclosures and warnings

3. EDGE CASE COVERAGE
   - Identify potential calculation edge cases
   - Validate boundary condition handling
   - Check AMT and special scenario calculations

4. MULTI-TENANT CONSIDERATIONS
   - Validate organization-scoped tax calculations
   - Check for data isolation in tax processing
   - Verify performance at scale

5. RECOMMENDATIONS
   - Optimization opportunities
   - Compliance improvements
   - Testing strategies
   - Documentation needs

Focus on CPA software development best practices and multi-tenant architecture considerations.
"""
        return context

    async def prepare_prompt(self, request: ToolRequest) -> str:
        """
        Prepare the initial prompt for tax calculation review
        """
        base_prompt = await super().prepare_prompt(request)
        
        # Add tax-specific context
        tax_context = f"""
TAX CALCULATION REVIEW CONTEXT:
- Tax Year: {request.tax_year if hasattr(request, 'tax_year') else '2024'}
- Calculation Type: {request.calculation_type if hasattr(request, 'calculation_type') else 'federal'}
- Multi-tenant CPA Platform: AdvisorOS
- Focus: Compliance, accuracy, and multi-tenant performance

ANALYSIS REQUEST:
{request.prompt}

Please begin the systematic tax calculation review process.
"""
        
        return base_prompt + "\n\n" + tax_context


# Tool registration
def create_tool():
    """Factory function to create the tool instance"""
    return TaxCalculationReviewTool()