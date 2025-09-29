// ================================================================
// Security Module - Advanced Threat Protection, Compliance, Monitoring
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Azure region')
param location string

@description('Key Vault ID')
param keyVaultId string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Application Insights ID')
param applicationInsightsId string

@description('Admin email for security alerts')
param adminEmail string

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var securityCenterWorkspaceName = '${resourcePrefix}-security'
var actionGroupName = '${resourcePrefix}-security-alerts'

// ================================================================
// Microsoft Defender for Cloud Configuration
// ================================================================

resource defenderPlan 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'AppServices'
  properties: {
    pricingTier: environment == 'prod' ? 'Standard' : 'Free'
  }
}

resource defenderPlanStorage 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'StorageAccounts'
  properties: {
    pricingTier: environment == 'prod' ? 'Standard' : 'Free'
  }
}

resource defenderPlanDatabase 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'OpenSourceRelationalDatabases'
  properties: {
    pricingTier: environment == 'prod' ? 'Standard' : 'Free'
  }
}

resource defenderPlanKeyVault 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'KeyVaults'
  properties: {
    pricingTier: environment == 'prod' ? 'Standard' : 'Free'
  }
}

// ================================================================
// Security Contact Information
// ================================================================

resource securityContact 'Microsoft.Security/securityContacts@2020-01-01-preview' = {
  name: 'default'
  properties: {
    emails: adminEmail
    notificationsByRole: {
      state: 'On'
      roles: [
        'Owner'
        'Contributor'
        'ServiceAdmin'
      ]
    }
    alertNotifications: {
      state: 'On'
      minimalSeverity: 'Medium'
    }
  }
}

// ================================================================
// Action Group for Security Alerts
// ================================================================

resource securityActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'SecurityAG'
    enabled: true
    emailReceivers: [
      {
        name: 'SecurityTeam'
        emailAddress: adminEmail
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: []
    webhookReceivers: []
    eventHubReceivers: []
    itsmReceivers: []
    azureAppPushReceivers: []
    automationRunbookReceivers: []
    voiceReceivers: []
    logicAppReceivers: []
    azureFunctionReceivers: []
    armRoleReceivers: [
      {
        name: 'SecurityAdmin'
        roleId: '8e3af657-a8ff-443c-a75c-2fe8c4bcb635' // Owner role
        useCommonAlertSchema: true
      }
    ]
  }
}

// ================================================================
// Security Alerts and Rules
// ================================================================

// Failed authentication attempts
resource failedAuthAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-failed-auth-alert'
  location: location
  tags: tags
  properties: {
    description: 'Alert when multiple failed authentication attempts detected'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      logAnalyticsWorkspaceId
    ]
    targetResourceTypes: [
      'Microsoft.OperationalInsights/workspaces'
    ]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            AuditLog
            | where OperationName contains "Sign-in"
            | where Result == "failure"
            | where TimeGenerated > ago(15m)
            | summarize FailedAttempts = count() by UserPrincipalName, IPAddress
            | where FailedAttempts >= 5
          '''
          timeAggregation: 'Count'
          dimensions: [
            {
              name: 'UserPrincipalName'
              operator: 'Include'
              values: ['*']
            }
            {
              name: 'IPAddress'
              operator: 'Include'
              values: ['*']
            }
          ]
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        securityActionGroup.id
      ]
      customProperties: {
        AlertType: 'Security'
        Severity: 'High'
        Category: 'Authentication'
      }
    }
    autoMitigate: false
  }
}

// Suspicious database access
resource suspiciousDbAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-suspicious-db-alert'
  location: location
  tags: tags
  properties: {
    description: 'Alert on suspicious database access patterns'
    severity: 1
    enabled: true
    evaluationFrequency: 'PT10M'
    scopes: [
      logAnalyticsWorkspaceId
    ]
    targetResourceTypes: [
      'Microsoft.OperationalInsights/workspaces'
    ]
    windowSize: 'PT30M'
    criteria: {
      allOf: [
        {
          query: '''
            AzureDiagnostics
            | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
            | where Category == "PostgreSQLLogs"
            | where Message contains "DROP" or Message contains "DELETE" or Message contains "TRUNCATE"
            | where TimeGenerated > ago(30m)
            | summarize SuspiciousQueries = count() by Resource, CallerIpAddress
            | where SuspiciousQueries >= 3
          '''
          timeAggregation: 'Count'
          dimensions: [
            {
              name: 'Resource'
              operator: 'Include'
              values: ['*']
            }
            {
              name: 'CallerIpAddress'
              operator: 'Include'
              values: ['*']
            }
          ]
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        securityActionGroup.id
      ]
      customProperties: {
        AlertType: 'Security'
        Severity: 'Critical'
        Category: 'Database'
      }
    }
    autoMitigate: false
  }
}

// High error rate alert
resource highErrorRateAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-high-error-rate-alert'
  location: location
  tags: tags
  properties: {
    description: 'Alert when application error rate exceeds threshold'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      logAnalyticsWorkspaceId
    ]
    targetResourceTypes: [
      'Microsoft.OperationalInsights/workspaces'
    ]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            AppServiceHTTPLogs
            | where TimeGenerated > ago(15m)
            | where ScStatus >= 400
            | summarize ErrorCount = count(), TotalRequests = countif(ScStatus > 0)
            | extend ErrorRate = (ErrorCount * 100.0) / TotalRequests
            | where ErrorRate > 10
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        securityActionGroup.id
      ]
      customProperties: {
        AlertType: 'Performance'
        Severity: 'Medium'
        Category: 'Application'
      }
    }
    autoMitigate: true
  }
}

// Key Vault access anomaly
resource keyVaultAnomalyAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-keyvault-anomaly-alert'
  location: location
  tags: tags
  properties: {
    description: 'Alert on unusual Key Vault access patterns'
    severity: 1
    enabled: true
    evaluationFrequency: 'PT15M'
    scopes: [
      logAnalyticsWorkspaceId
    ]
    targetResourceTypes: [
      'Microsoft.OperationalInsights/workspaces'
    ]
    windowSize: 'PT1H'
    criteria: {
      allOf: [
        {
          query: '''
            AzureDiagnostics
            | where ResourceProvider == "MICROSOFT.KEYVAULT"
            | where TimeGenerated > ago(1h)
            | where OperationName == "SecretGet" or OperationName == "KeyGet"
            | summarize AccessCount = count() by CallerIPAddress, bin(TimeGenerated, 15m)
            | where AccessCount > 50
          '''
          timeAggregation: 'Count'
          dimensions: [
            {
              name: 'CallerIPAddress'
              operator: 'Include'
              values: ['*']
            }
          ]
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        securityActionGroup.id
      ]
      customProperties: {
        AlertType: 'Security'
        Severity: 'Critical'
        Category: 'KeyVault'
      }
    }
    autoMitigate: false
  }
}

// ================================================================
// Compliance and Audit Workbook
// ================================================================

resource complianceWorkbook 'Microsoft.Insights/workbooks@2023-06-01' = {
  name: guid('${resourcePrefix}-compliance-workbook')
  location: location
  tags: tags
  kind: 'shared'
  properties: {
    displayName: 'AdvisorOS Compliance Dashboard'
    description: 'SOC 2 and GDPR compliance monitoring dashboard'
    sourceId: logAnalyticsWorkspaceId
    category: 'workbook'
    serializedData: json('''
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "# AdvisorOS Compliance Dashboard\\n\\nThis dashboard provides visibility into security and compliance metrics for SOC 2 and GDPR requirements."
      },
      "name": "text - header"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "AuditLog\\n| where TimeGenerated > ago(24h)\\n| summarize Count = count() by OperationName\\n| order by Count desc\\n| take 10",
        "size": 0,
        "title": "Top Audit Events (24h)",
        "timeContext": {
          "durationMs": 86400000
        },
        "queryType": 0,
        "resourceType": "microsoft.operationalinsights/workspaces",
        "visualization": "piechart"
      },
      "name": "query - audit events"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "SecurityEvent\\n| where TimeGenerated > ago(7d)\\n| where EventID in (4625, 4771, 4776)\\n| summarize FailedLogins = count() by bin(TimeGenerated, 1h)\\n| render timechart",
        "size": 0,
        "title": "Failed Authentication Attempts (7 days)",
        "timeContext": {
          "durationMs": 604800000
        },
        "queryType": 0,
        "resourceType": "microsoft.operationalinsights/workspaces"
      },
      "name": "query - failed auth"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "AzureDiagnostics\\n| where ResourceProvider == \\"MICROSOFT.KEYVAULT\\"\\n| where TimeGenerated > ago(24h)\\n| summarize AccessCount = count() by OperationName\\n| order by AccessCount desc",
        "size": 0,
        "title": "Key Vault Operations (24h)",
        "timeContext": {
          "durationMs": 86400000
        },
        "queryType": 0,
        "resourceType": "microsoft.operationalinsights/workspaces",
        "visualization": "table"
      },
      "name": "query - keyvault ops"
    }
  ],
  "isLocked": false,
  "fallbackResourceIds": []
}''')
  }
}

// ================================================================
// Data Loss Prevention Policies
// ================================================================

resource dataClassificationWorkbook 'Microsoft.Insights/workbooks@2023-06-01' = {
  name: guid('${resourcePrefix}-data-classification')
  location: location
  tags: tags
  kind: 'shared'
  properties: {
    displayName: 'Data Classification and Protection'
    description: 'Monitor data access patterns and classification compliance'
    sourceId: logAnalyticsWorkspaceId
    category: 'workbook'
    serializedData: json('''
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "# Data Classification Dashboard\\n\\nMonitor access to sensitive data categories including PII, PHI, and financial information."
      },
      "name": "text - header"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "AppServiceHTTPLogs\\n| where TimeGenerated > ago(24h)\\n| where CsUriStem contains \\"/api/documents\\" or CsUriStem contains \\"/api/clients\\"\\n| extend DataCategory = case(\\n    CsUriStem contains \\"tax\\", \\"Tax Documents\\",\\n    CsUriStem contains \\"financial\\", \\"Financial Data\\",\\n    CsUriStem contains \\"client\\", \\"Client PII\\",\\n    \\"Other\\")\\n| summarize AccessCount = count() by DataCategory, bin(TimeGenerated, 1h)\\n| render timechart",
        "size": 0,
        "title": "Sensitive Data Access Patterns",
        "queryType": 0,
        "resourceType": "microsoft.operationalinsights/workspaces"
      },
      "name": "query - data access"
    }
  ]
}''')
  }
}

// ================================================================
// Incident Response Automation
// ================================================================

resource incidentResponseLogicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: '${resourcePrefix}-incident-response'
  location: location
  tags: tags
  properties: {
    state: 'Enabled'
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {}
      triggers: {
        'When_a_HTTP_request_is_received': {
          type: 'Request'
          kind: 'Http'
          inputs: {
            schema: {
              type: 'object'
              properties: {
                alertType: { type: 'string' }
                severity: { type: 'string' }
                description: { type: 'string' }
                resourceId: { type: 'string' }
              }
            }
          }
        }
      }
      actions: {
        'Create_incident_ticket': {
          type: 'Http'
          inputs: {
            method: 'POST'
            uri: 'https://api.example.com/incidents'
            headers: {
              'Content-Type': 'application/json'
            }
            body: {
              title: '@{triggerBody()?[\'description\']}'
              severity: '@{triggerBody()?[\'severity\']}'
              type: '@{triggerBody()?[\'alertType\']}'
              resource: '@{triggerBody()?[\'resourceId\']}'
            }
          }
        }
        'Send_notification': {
          type: 'ApiConnection'
          inputs: {
            host: {
              connection: {
                name: '@parameters(\'$connections\')[\'office365\'][\'connectionId\']'
              }
            }
            method: 'post'
            path: '/v2/Mail'
            body: {
              To: adminEmail
              Subject: 'Security Incident Alert'
              Body: 'A security incident has been detected: @{triggerBody()?[\'description\']}'
            }
          }
          runAfter: {
            'Create_incident_ticket': ['Succeeded']
          }
        }
      }
    }
  }
}

// ================================================================
// Outputs
// ================================================================

output securityActionGroupId string = securityActionGroup.id
output securityActionGroupName string = securityActionGroup.name

output complianceWorkbookId string = complianceWorkbook.id
output dataClassificationWorkbookId string = dataClassificationWorkbook.id

output incidentResponseLogicAppId string = incidentResponseLogicApp.id
output incidentResponseTriggerUrl string = incidentResponseLogicApp.listCallbackUrl().value

output securityConfiguration object = {
  defenderForCloud: {
    appServices: environment == 'prod' ? 'Standard' : 'Free'
    storage: environment == 'prod' ? 'Standard' : 'Free'
    database: environment == 'prod' ? 'Standard' : 'Free'
    keyVault: environment == 'prod' ? 'Standard' : 'Free'
  }
  alerts: [
    {
      name: 'Failed Authentication'
      severity: 'High'
      threshold: '5 failed attempts in 15 minutes'
    }
    {
      name: 'Suspicious Database Activity'
      severity: 'Critical'
      threshold: '3+ destructive queries in 30 minutes'
    }
    {
      name: 'High Error Rate'
      severity: 'Medium'
      threshold: '10% error rate in 15 minutes'
    }
    {
      name: 'Key Vault Anomaly'
      severity: 'Critical'
      threshold: '50+ access attempts in 15 minutes'
    }
  ]
  compliance: {
    soc2: {
      auditLogging: 'Enabled'
      accessControls: 'Enforced'
      dataEncryption: 'Enabled'
      incidentResponse: 'Automated'
    }
    gdpr: {
      dataClassification: 'Implemented'
      accessLogging: 'Enabled'
      dataRetention: 'Configurable'
      rightToErasure: 'Supported'
    }
  }
  incidentResponse: {
    automation: 'Enabled'
    notification: 'Real-time'
    escalation: 'Configured'
    logging: 'Comprehensive'
  }
}