export const FinancialPackageTemplate = {
  id: "financial_package",
  name: "Financial Statement Package",
  description: "Complete financial statement package including Balance Sheet, Income Statement, and Cash Flow Statement",
  category: "monthly_financial",
  type: "financial_package",
  version: "1.0.0",
  isSystem: true,
  layout: {
    orientation: "portrait",
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    headers: {
      enabled: true,
      includeCompanyName: true,
      includeReportTitle: true,
      includeDate: true
    },
    footers: {
      enabled: true,
      includePageNumbers: true,
      includeGeneratedBy: true
    }
  },
  sections: [
    {
      id: "cover_page",
      name: "Cover Page",
      type: "cover",
      order: 1,
      configuration: {
        includeCompanyLogo: true,
        includeTableOfContents: true,
        includeExecutiveSummary: false
      }
    },
    {
      id: "balance_sheet",
      name: "Balance Sheet",
      type: "financial_statement",
      order: 2,
      configuration: {
        statementType: "balance_sheet",
        includeComparativePeriod: true,
        includePercentages: true,
        groupings: {
          assets: {
            currentAssets: [
              "cash",
              "accounts_receivable",
              "inventory",
              "prepaid_expenses",
              "other_current_assets"
            ],
            fixedAssets: [
              "property_plant_equipment",
              "accumulated_depreciation",
              "intangible_assets",
              "other_assets"
            ]
          },
          liabilities: {
            currentLiabilities: [
              "accounts_payable",
              "accrued_expenses",
              "current_portion_long_term_debt",
              "other_current_liabilities"
            ],
            longTermLiabilities: [
              "long_term_debt",
              "deferred_tax_liability",
              "other_long_term_liabilities"
            ]
          },
          equity: [
            "retained_earnings",
            "common_stock",
            "additional_paid_in_capital",
            "treasury_stock"
          ]
        }
      }
    },
    {
      id: "income_statement",
      name: "Income Statement",
      type: "financial_statement",
      order: 3,
      configuration: {
        statementType: "income_statement",
        includeComparativePeriod: true,
        includePercentages: true,
        format: "multi_step", // or "single_step"
        groupings: {
          revenue: [
            "sales_revenue",
            "service_revenue",
            "other_revenue"
          ],
          costOfSales: [
            "cost_of_goods_sold",
            "cost_of_services"
          ],
          operatingExpenses: [
            "salaries_benefits",
            "rent",
            "utilities",
            "insurance",
            "professional_fees",
            "depreciation",
            "other_operating_expenses"
          ],
          otherIncomeExpense: [
            "interest_income",
            "interest_expense",
            "gain_loss_on_disposal",
            "other_income_expense"
          ]
        }
      }
    },
    {
      id: "cash_flow_statement",
      name: "Statement of Cash Flows",
      type: "financial_statement",
      order: 4,
      configuration: {
        statementType: "cash_flow",
        method: "indirect", // or "direct"
        includeComparativePeriod: true,
        sections: {
          operating: {
            startWithNetIncome: true,
            adjustments: [
              "depreciation",
              "amortization",
              "gain_loss_on_disposal",
              "changes_in_working_capital"
            ]
          },
          investing: [
            "purchase_ppe",
            "disposal_ppe",
            "investments",
            "acquisitions"
          ],
          financing: [
            "debt_proceeds",
            "debt_payments",
            "equity_issuance",
            "dividends_paid",
            "owner_distributions"
          ]
        }
      }
    },
    {
      id: "notes_to_statements",
      name: "Notes to Financial Statements",
      type: "notes",
      order: 5,
      configuration: {
        standardNotes: [
          "summary_of_significant_accounting_policies",
          "cash_and_cash_equivalents",
          "accounts_receivable",
          "inventory",
          "property_plant_equipment",
          "debt",
          "commitments_contingencies",
          "subsequent_events"
        ],
        customNotes: true
      }
    }
  ],
  dataRequirements: {
    required: [
      "trial_balance",
      "general_ledger",
      "chart_of_accounts"
    ],
    optional: [
      "prior_period_data",
      "budget_data",
      "supplementary_schedules"
    ],
    dataSources: [
      "quickbooks",
      "manual_entry",
      "excel_import"
    ]
  },
  chartConfigs: {
    enabled: true,
    charts: [
      {
        id: "revenue_trend",
        type: "line",
        title: "Revenue Trend",
        data: "monthly_revenue",
        position: "income_statement_summary"
      },
      {
        id: "expense_breakdown",
        type: "pie",
        title: "Expense Breakdown",
        data: "expense_categories",
        position: "income_statement_summary"
      },
      {
        id: "cash_flow_trend",
        type: "bar",
        title: "Cash Flow by Activity",
        data: "cash_flow_activities",
        position: "cash_flow_summary"
      }
    ]
  },
  brandingOptions: {
    logo: {
      enabled: true,
      position: "header_left",
      maxWidth: 200,
      maxHeight: 100
    },
    colors: {
      primary: "#2c3e50",
      secondary: "#34495e",
      accent: "#3498db",
      text: "#2c3e50",
      background: "#ffffff"
    },
    fonts: {
      header: "Arial Bold",
      body: "Arial",
      numbers: "Arial"
    },
    companyInfo: {
      includeAddress: true,
      includePhone: true,
      includeEmail: true,
      includeWebsite: true
    }
  },
  outputFormats: ["pdf", "excel"],
  defaultFormat: "pdf",
  metadata: {
    created: "2024-01-01",
    lastModified: "2024-01-01",
    version: "1.0.0",
    author: "System",
    tags: ["financial", "statements", "monthly", "quarterly", "annual"]
  }
};