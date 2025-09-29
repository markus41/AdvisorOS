# 🚀 AdvisorOS MCP Ecosystem - Usage Guide

## ✅ Your MCP Ecosystem is Ready!

You now have a powerful AI development environment specifically configured for AdvisorOS CPA platform development.

## 📋 3 Ways to Use It

### **🟢 Method 1: Quick One-Shot Queries**

Perfect for getting immediate answers and analysis:

```powershell
# Architecture Analysis
claude --mcp-config .claude\working-config.json --print "Analyze the AdvisorOS multi-tenant architecture and identify potential security risks"

# Code Review
claude --mcp-config .claude\working-config.json --print "Review the Prisma schema in packages/database/schema.prisma for multi-tenant best practices"

# Feature Development
claude --mcp-config .claude\working-config.json --print "Help me implement a new client onboarding workflow with proper organization isolation"

# Performance Optimization  
claude --mcp-config .claude\working-config.json --print "Analyze the tRPC setup and suggest optimizations for CPA workflows"

# Compliance Check
claude --mcp-config .claude\working-config.json --print "Audit the authentication system for SOX compliance requirements"
```

### **🟡 Method 2: Interactive Development Session**

Start an ongoing conversation for complex development tasks:

```powershell
# Start interactive session
claude --mcp-config .claude\working-config.json

# Then use natural language for development:
# "Help me refactor the tax calculation service"
# "Create a new API endpoint for client document upload" 
# "Debug the multi-tenant query filtering"
# "Implement automated testing for organization isolation"
```

### **🔴 Method 3: Advanced CPA Workflows** (Coming Soon)

When you install the complete MCP ecosystem with:
```powershell
.\.claude\simple-setup.ps1
```

You'll get access to:
- **Tax Calculation Review**: Automated compliance checking
- **Financial Audit Tools**: SOX/GAAP validation
- **Multi-Tenant Security Audits**: Organization isolation verification
- **Azure AI Integration**: Document OCR and analysis

## 🎯 Example CPA Development Workflows

### 1. **New Feature Development**
```powershell
claude --mcp-config .claude\working-config.json --print "I need to add a new tax calculation feature. Help me design the database schema, API endpoints, and frontend components with proper multi-tenant isolation."
```

### 2. **Security Audit**
```powershell
claude --mcp-config .claude\working-config.json --print "Perform a comprehensive security review of the AdvisorOS platform, focusing on organization data isolation and role-based access control."
```

### 3. **Performance Optimization**
```powershell
claude --mcp-config .claude\working-config.json --print "Analyze the database queries and API performance. Suggest optimizations for handling multiple CPA organizations efficiently."
```

### 4. **Compliance Review**
```powershell
claude --mcp-config .claude\working-config.json --print "Review the entire codebase for SOX compliance requirements. Identify areas that need audit trails, access controls, and data integrity measures."
```

## 🛠️ Available MCP Capabilities

Currently Active:
- ✅ **Memory Management**: Persistent context across sessions
- ✅ **File System Access**: Full AdvisorOS codebase analysis
- ✅ **AdvisorOS Context**: Understanding of CPA platform architecture

Coming with Full Setup:
- 🔄 **GitHub Integration**: Repository management and CI/CD
- 🔄 **Azure AI Services**: Document OCR and text analysis  
- 🔄 **Database Tools**: PostgreSQL optimization and security
- 🔄 **Custom CPA Tools**: Tax compliance and audit automation

## 💡 Pro Tips

1. **Be Specific**: Include file paths and specific requirements in your queries
2. **Context Matters**: The MCP system understands AdvisorOS architecture and CPA workflows
3. **Interactive Mode**: Use for complex, multi-step development tasks
4. **Print Mode**: Use for quick analysis and one-shot questions
5. **Memory Persistence**: Your conversation context is saved between sessions

## 🚀 Getting Started

**Start with this simple command:**
```powershell
claude --mcp-config .claude\working-config.json --print "Give me an overview of the AdvisorOS project and suggest the next development priorities"
```

**For ongoing development:**
```powershell
claude --mcp-config .claude\working-config.json
```

Then just talk naturally about what you want to build or improve!

---

**🎉 You now have a professional AI development environment tailored specifically for CPA platform development!**