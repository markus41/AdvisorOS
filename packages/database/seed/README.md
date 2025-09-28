# CPA Platform Demo Data

This directory contains comprehensive demo data for the CPA platform, designed to showcase all features and capabilities of the system.

## 🎯 Overview

The demo data includes:

- **3 CPA Firms** with different subscription tiers and team sizes
- **20+ Users** with varied roles and permissions
- **15+ Clients** across diverse industries and business types
- **15+ Engagements** with realistic timelines and workflows
- **50+ Tasks** with proper assignments and statuses
- **30+ Documents** with realistic metadata and categorization
- **15+ Invoices** showing various billing scenarios
- **25+ Notes** demonstrating client communication
- **10+ Reports** with financial analysis and KPIs
- **Complete Audit Trails** and authentication logs

## 🏢 Demo Organizations

### TaxPro Associates (Enterprise)
- **Subdomain:** `taxpro`
- **Team Size:** 15 members
- **Focus:** Full-service CPA firm with tax, audit, and CFO services
- **Location:** San Francisco, CA
- **Specializes in:** Corporate tax, international tax, R&D credits

### QuickBooks Advisory Group (Professional)
- **Subdomain:** `qbadvisory`
- **Team Size:** 8 members
- **Focus:** Modern accounting firm specializing in QuickBooks and technology
- **Location:** Austin, TX
- **Specializes in:** QuickBooks implementations, monthly bookkeeping

### Smith & Jones CPAs (Starter)
- **Subdomain:** `smithjones`
- **Team Size:** 3 members
- **Focus:** Boutique practice serving small businesses and individuals
- **Location:** Portland, OR
- **Specializes in:** Individual tax returns, small business accounting

## 👥 User Roles & Permissions

### Owner
- Full system access
- Strategic planning and business development
- High-level client relationships
- **Sample:** Michael Chen (TaxPro), Mark Thompson (QBAdvisory)

### Senior CPA
- Advanced tax and accounting work
- Client management and advisory services
- Team leadership and review responsibilities
- **Sample:** David Johnson (TaxPro), Brian Lee (QBAdvisory)

### CPA
- Standard accounting and tax work
- Client service delivery
- Moderate system permissions
- **Sample:** Robert Williams (TaxPro), Stephanie Wilson (QBAdvisory)

### Staff
- Data entry and basic accounting tasks
- Document preparation and organization
- Limited system access
- **Sample:** James Brown (TaxPro), Carlos Gonzalez (QBAdvisory)

### Admin
- System administration and client relations
- Operations management
- User and workflow management
- **Sample:** Sarah Rodriguez (TaxPro), Jessica Martinez (QBAdvisory)

## 🤝 Client Portfolio

### Technology Sector
- **TechFlow Solutions Inc** - Software company with R&D credits
- **Austin Coffee Collective** - Coffee shop with POS integration needs

### Healthcare
- **Golden Gate Medical Group** - Medical practice requiring CFO services
- **Portland Family Dentistry** - Small dental practice

### Real Estate
- **Bay Area Real Estate Holdings** - Real estate investment company
- **Mountain View Landscaping** - Landscaping services

### Professional Services
- **Lone Star Consulting Group** - Business consulting firm
- **Pacific Northwest Consulting** - Solo consultant practice

### Other Industries
- **Pacific Import Export Co** - International trade (complex tax issues)
- **Green Valley Organic Farms** - Agriculture business
- **Hill Country Construction** - Construction company
- **Music City Retail** - Retail business

## 📊 Sample Engagements

### Tax Preparation
- Individual returns (Form 1040)
- Corporate returns (Form 1120, 1120S)
- Partnership returns (Form 1065)
- Complex tax planning scenarios

### Bookkeeping Services
- Monthly bookkeeping workflows
- QuickBooks setup and maintenance
- Financial statement preparation
- Bank reconciliation processes

### Advisory Services
- CFO services with board reporting
- Business setup and formation
- Estate and succession planning
- Financial analysis and forecasting

### Audit & Compliance
- Audit support services
- Internal control reviews
- Compliance monitoring
- Year-end closing procedures

## 💰 Billing Scenarios

### Service Packages
- **Tax Only:** Annual tax preparation
- **Tax & Bookkeeping:** Monthly bookkeeping + tax
- **Full Service:** Comprehensive accounting and advisory
- **CFO Services:** Outsourced CFO with strategic planning

### Payment Terms
- Net 15, Net 30, Net 45 terms
- Monthly retainers for ongoing services
- Fixed-fee projects for implementations
- Hourly billing for advisory work

### Invoice Statuses
- Draft invoices being prepared
- Sent invoices awaiting payment
- Partial payments with remaining balances
- Fully paid invoices with payment history
- Overdue invoices requiring follow-up

## 📄 Document Types

### Tax Documents
- W-2 and 1099 forms
- Tax returns (1040, 1120, 1065)
- Supporting schedules and worksheets
- Tax planning documentation

### Financial Statements
- Audited, reviewed, and compiled statements
- Monthly financial reports
- Management dashboards and KPIs
- Cash flow forecasts

### Business Documents
- Bank statements and reconciliations
- General ledger exports
- Depreciation schedules
- Contracts and agreements

### Working Papers
- Audit workpapers and lead sheets
- Review notes and checklists
- Quality control documentation
- Client correspondence

## 🔑 Login Credentials

**Password for all demo users:** `demo123!`

### TaxPro Associates
- `michael.chen@taxpro.com` (Owner)
- `david.johnson@taxpro.com` (Senior CPA)
- `sarah.rodriguez@taxpro.com` (Admin)

### QuickBooks Advisory Group
- `mark.thompson@qbadvisory.com` (Owner)
- `brian.lee@qbadvisory.com` (Senior CPA)
- `jessica.martinez@qbadvisory.com` (Admin)

### Smith & Jones CPAs
- `william.smith@smithjones.com` (Owner)
- `patricia.jones@smithjones.com` (Senior CPA)
- `thomas.miller@smithjones.com` (Staff)

## 🚀 Running the Demo Data

### Option 1: Run Comprehensive Seed
```bash
cd packages/database/seed
npx tsx comprehensive-seed.ts
```

### Option 2: Use the Runner Script
```bash
cd packages/database/seed
npx tsx run-seed.ts
```

### Option 3: Individual Data Files
Each data type is available in separate files:
- `organizations.ts` - Organization and subscription data
- `users.ts` - User accounts and permissions
- `clients.ts` - Client profiles and service packages
- `workflows.ts` - Workflow templates
- `engagements.ts` - Client engagements and projects
- `tasks.ts` - Task assignments and progress
- `documents.ts` - Document metadata and categorization
- `invoices.ts` - Billing and payment scenarios
- `notes.ts` - Client communication and meeting notes
- `reports.ts` - Generated reports and analytics

## 📋 Data Relationships

The demo data maintains proper relationships between entities:

- **Organizations** contain users, clients, and all related data
- **Users** are assigned to teams with appropriate permissions
- **Clients** have multiple engagements and service packages
- **Engagements** contain tasks, documents, and invoices
- **Tasks** follow workflow templates with dependencies
- **Documents** are categorized and linked to clients/engagements
- **Invoices** reference specific engagements and include payment history
- **Notes** capture client interactions and project updates
- **Reports** analyze performance across multiple dimensions

## 🎨 Customization

To customize the demo data:

1. **Modify Organizations:** Update `organizations.ts` with your firm details
2. **Adjust User Roles:** Modify `users.ts` to match your team structure
3. **Update Client Industries:** Customize `clients.ts` for relevant business types
4. **Configure Workflows:** Adapt `workflows.ts` to your processes
5. **Set Realistic Dates:** Adjust date ranges in all files for current periods

## 🔒 Security Notes

- All passwords are hashed using bcrypt
- SSNs and EINs are clearly marked as demo data
- Bank account numbers and financial data are fictional
- Email addresses use demo domains
- All data includes appropriate disclaimers

## 🎯 Use Cases

This demo data supports:

- **Sales Demonstrations:** Show platform capabilities to prospects
- **Training Sessions:** Onboard new team members with realistic data
- **Feature Testing:** Test new features with comprehensive scenarios
- **Performance Analysis:** Analyze system performance with realistic data volumes
- **Integration Testing:** Test integrations with complete workflows
- **User Acceptance Testing:** Validate features with business scenarios

## 📞 Support

For questions about the demo data or customization needs, please refer to the main project documentation or contact the development team.