// ================================================================
// Security and Compliance Module
// SOC 2, GDPR, HIPAA compliance for CPA practice management platform
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

@description('Storage Account ID for compliance logs')
param storageAccountId string

@description('Resource tags')
param tags object

@description('Enable SOC 2 compliance controls')
param enableSoc2Compliance bool = true

@description('Enable GDPR compliance controls')
param enableGdprCompliance bool = true

@description('Enable HIPAA compliance controls')
param enableHipaaCompliance bool = false

@description('Data residency requirements')
@allowed(['US', 'EU', 'Global'])
param dataResidency string = 'US'

@description('Admin email for compliance notifications')
param adminEmail string

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var complianceName = '${resourcePrefix}-compliance'

// Compliance configuration based on requirements
var complianceConfig = {
  soc2: enableSoc2Compliance ? {
    auditLogging: true
    accessControls: true
    changeManagement: true
    dataProtection: true
    systemMonitoring: true
    incidentResponse: true
    vendorManagement: true
  } : {}
  gdpr: enableGdprCompliance ? {
    dataProcessingLogs: true
    consentManagement: true
    dataSubjectRights: true
    privacyByDesign: true
    dataRetention: true
    crossBorderTransfer: dataResidency != 'Global'
  } : {}
  hipaa: enableHipaaCompliance ? {
    encryptionAtRest: true
    encryptionInTransit: true
    accessAuditing: true
    businessAssociateAgreements: true
    riskAssessment: true
    contingencyPlan: true
  } : {}
}

// ================================================================
// Security Center and Defender
// ================================================================

// Enable Azure Defender for all resource types
resource securityContacts 'Microsoft.Security/securityContacts@2020-01-01-preview' = {
  name: 'default'
  properties: {
    email: adminEmail
    phone: ''
    alertNotifications: true
    alertsToAdmins: true
  }
}

// Auto-provisioning settings for security agents
resource autoProvisioningSettings 'Microsoft.Security/autoProvisioningSettings@2017-08-01-preview' = {
  name: 'default'
  properties: {
    autoProvision: 'On'
  }
}

// Workspace settings for security data collection
resource workspaceSettings 'Microsoft.Security/workspaceSettings@2017-08-01-preview' = {
  name: 'default'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    scope: subscription().id
  }
}

// ================================================================
// Compliance Policies and Initiatives
// ================================================================

// SOC 2 Policy Assignment
resource soc2PolicyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = if (enableSoc2Compliance) {
  name: '${complianceName}-soc2'
  properties: {
    displayName: 'SOC 2 Compliance Controls'
    description: 'Ensures SOC 2 compliance controls are implemented'
    policyDefinitionId: '/providers/Microsoft.Authorization/policySetDefinitions/89c6cddc-1c73-4ac1-b19c-54d1a15a42f2' // System and Communications Protection
    parameters: {
      logAnalyticsWorkspaceId: {
        value: logAnalyticsWorkspaceId
      }
    }
    metadata: {
      assignedBy: 'AdvisorOS Compliance Team'
      compliance: 'SOC2'
    }
  }
}

// GDPR Policy Assignment
resource gdprPolicyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = if (enableGdprCompliance) {
  name: '${complianceName}-gdpr'
  properties: {
    displayName: 'GDPR Compliance Controls'
    description: 'Ensures GDPR compliance requirements are met'
    policyDefinitionId: '/providers/Microsoft.Authorization/policySetDefinitions/3e596b57-105f-48a6-be97-03e9243bad6e' // Data Protection Baseline
    parameters: {
      logAnalyticsWorkspaceId: {
        value: logAnalyticsWorkspaceId
      }
      dataResidency: {
        value: dataResidency
      }
    }
    metadata: {
      assignedBy: 'AdvisorOS Privacy Team'
      compliance: 'GDPR'
    }
  }
}

// HIPAA Policy Assignment (if enabled)
resource hipaaPolicyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = if (enableHipaaCompliance) {
  name: '${complianceName}-hipaa'
  properties: {
    displayName: 'HIPAA Compliance Controls'
    description: 'Ensures HIPAA compliance requirements are met'
    policyDefinitionId: '/providers/Microsoft.Authorization/policySetDefinitions/89c6cddc-1c73-4ac1-b19c-54d1a15a42f2'
    parameters: {
      logAnalyticsWorkspaceId: {
        value: logAnalyticsWorkspaceId
      }
    }
    metadata: {
      assignedBy: 'AdvisorOS Healthcare Compliance Team'
      compliance: 'HIPAA'
    }
  }
}

// ================================================================
// Data Classification and Protection
// ================================================================

// Microsoft Purview (formerly Azure Purview) for data governance
resource purviewAccount 'Microsoft.Purview/accounts@2021-07-01' = {
  name: '${resourcePrefix}-purview'
  location: location
  tags: union(tags, {
    Component: 'DataGovernance'
    Compliance: 'SOC2-GDPR'
  })
  properties: {
    cloudConnectors: {}
    publicNetworkAccess: 'Disabled'
    managedResourceGroupName: '${resourcePrefix}-purview-managed-rg'
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Data Loss Prevention policies
resource dlpPolicy 'Microsoft.Security/informationProtectionPolicies@2017-08-01-preview' = {
  name: 'default'
  properties: {
    labels: {
      'public': {
        displayName: 'Public'
        description: 'Information that can be shared publicly'
        color: '#339933'
        sensitivity: 0
      }
      'internal': {
        displayName: 'Internal'
        description: 'Information for internal use only'
        color: '#ffaa00'
        sensitivity: 1
      }
      'confidential': {
        displayName: 'Confidential'
        description: 'Sensitive business information'
        color: '#ff6600'
        sensitivity: 2
      }
      'highly-confidential': {
        displayName: 'Highly Confidential'
        description: 'Highly sensitive information requiring strict protection'
        color: '#cc0000'
        sensitivity: 3
      }
    }
    informationTypes: {
      'ssn': {
        displayName: 'Social Security Number'
        description: 'US Social Security Number'
        keywords: ['SSN', 'Social Security']
        confidenceLevel: 'High'
        recommendedLabelId: 'highly-confidential'
      }
      'ein': {
        displayName: 'Employer Identification Number'
        description: 'US EIN for businesses'
        keywords: ['EIN', 'Tax ID']
        confidenceLevel: 'High'
        recommendedLabelId: 'highly-confidential'
      }
      'financial-data': {
        displayName: 'Financial Information'
        description: 'Financial statements and tax data'
        keywords: ['Income', 'Revenue', 'Tax Return']
        confidenceLevel: 'Medium'
        recommendedLabelId: 'confidential'
      }
    }
  }
}

// ================================================================
// Audit and Compliance Logging
// ================================================================

// Compliance audit storage account
resource complianceStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${resourcePrefix}compliance${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_ZRS'
  }
  tags: union(tags, {
    Component: 'ComplianceLogging'
    DataClassification: 'Audit'
  })
  properties: {
    accessTier: 'Cool'
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    dnsEndpointType: 'Standard'
    encryption: {
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: 'compliance-storage-key'
        keyvaulturi: reference(keyVaultId, '2023-02-01').vaultUri
      }
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
        queue: {
          enabled: true
          keyType: 'Service'
        }
        table: {
          enabled: true
          keyType: 'Service'
        }
      }
    }
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
    publicNetworkAccess: 'Disabled'
    supportsHttpsTrafficOnly: true
  }
}

// Compliance audit containers
resource complianceContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for containerName in ['audit-logs', 'access-logs', 'compliance-reports', 'incident-reports']: {
  name: '${complianceStorageAccount.name}/default/${containerName}'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'compliance-logging'
      retention: '7-years'
      classification: 'audit'
    }
  }
}]

// ================================================================
// Microsoft Sentinel for Security Monitoring
// ================================================================

// Sentinel workspace (uses existing Log Analytics)
resource sentinelSolution 'Microsoft.OperationsManagement/solutions@2015-11-01-preview' = {
  name: 'SecurityInsights(${split(logAnalyticsWorkspaceId, '/')[8]})'
  location: location
  tags: tags
  properties: {
    workspaceResourceId: logAnalyticsWorkspaceId
  }
  plan: {
    name: 'SecurityInsights(${split(logAnalyticsWorkspaceId, '/')[8]})'
    product: 'OMSGallery/SecurityInsights'
    publisher: 'Microsoft'
    promotionCode: ''
  }
}

// Data connectors for compliance monitoring
resource sentinelDataConnectors 'Microsoft.SecurityInsights/dataConnectors@2023-02-01' = [for connector in ['AzureActiveDirectory', 'AzureActivity', 'SecurityEvents', 'Syslog']: {
  name: '${connector}-${uniqueString(resourceGroup().id)}'
  kind: connector
  properties: {
    dataTypes: connector == 'AzureActiveDirectory' ? {
      signIns: {
        state: 'Enabled'
      }
      auditLogs: {
        state: 'Enabled'
      }
    } : connector == 'AzureActivity' ? {
      logs: {
        state: 'Enabled'
      }
    } : {}
  }
}]

// ================================================================
// Compliance Automation and Workflows
// ================================================================

// Logic App for compliance automation
resource complianceLogicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: '${resourcePrefix}-compliance-automation'
  location: location
  tags: union(tags, {
    Component: 'ComplianceAutomation'
  })
  properties: {
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {}
      triggers: {
        'manual': {
          type: 'Request'
          kind: 'Http'
          inputs: {
            schema: {
              type: 'object'
              properties: {
                eventType: {
                  type: 'string'
                }
                resourceId: {
                  type: 'string'
                }
                severity: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
      actions: {
        'Log-Compliance-Event': {
          type: 'Http'
          inputs: {
            method: 'POST'
            uri: 'https://${resourcePrefix}-api.azurewebsites.net/api/compliance/log'
            headers: {
              'Content-Type': 'application/json'
            }
            body: '@triggerBody()'
          }
        }
        'Send-Notification': {
          type: 'Http'
          runAfter: {
            'Log-Compliance-Event': ['Succeeded']
          }
          inputs: {
            method: 'POST'
            uri: '@parameters(\'$connections\')[\'teams\'][\'connectionId\']'
            body: {
              text: 'Compliance event detected: @{triggerBody()[\'eventType\']}'
              themeColor: 'FF0000'
            }
          }
        }
      }
    }
    parameters: {
      '$connections': {
        value: {
          teams: {
            connectionId: '/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}/providers/Microsoft.Web/connections/teams'
            connectionName: 'teams'
            id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/teams'
          }
        }
      }
    }
  }
}

// ================================================================
// Compliance Monitoring Rules
// ================================================================

// Alert rules for compliance violations
resource complianceAlertRules 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = [for rule in [
  {
    name: 'unauthorized-access-attempt'
    query: 'AuditLogs | where ActivityDisplayName contains "sign-in" and Result == "failure" | where TimeGenerated > ago(15m) | summarize count() by UserPrincipalName, IPAddress | where count_ > 5'
    severity: 1
    frequency: 'PT15M'
    timeWindow: 'PT15M'
  }
  {
    name: 'privileged-operation'
    query: 'AuditLogs | where Category == "RoleManagement" or ActivityDisplayName contains "admin" | where TimeGenerated > ago(5m)'
    severity: 2
    frequency: 'PT5M'
    timeWindow: 'PT5M'
  }
  {
    name: 'data-access-anomaly'
    query: 'AppTraces | where Message contains "data_access" | where TimeGenerated > ago(1h) | summarize count() by UserId | where count_ > 100'
    severity: 2
    frequency: 'PT1H'
    timeWindow: 'PT1H'
  }
]: {
  name: '${resourcePrefix}-${rule.name}'
  location: location
  tags: tags
  properties: {
    displayName: 'Compliance Alert: ${rule.name}'
    description: 'Automated compliance monitoring for ${rule.name}'
    severity: rule.severity
    enabled: true
    evaluationFrequency: rule.frequency
    windowSize: rule.timeWindow
    criteria: {
      allOf: [
        {
          query: rule.query
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
        '/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}/providers/Microsoft.Insights/actionGroups/${resourcePrefix}-compliance-alerts'
      ]
    }
  }
}]

// Action group for compliance alerts
resource complianceActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${resourcePrefix}-compliance-alerts'
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'Compliance'
    enabled: true
    emailReceivers: [
      {
        name: 'ComplianceTeam'
        emailAddress: adminEmail
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: [
      {
        name: 'ComplianceWebhook'
        serviceUri: 'https://${resourcePrefix}-api.azurewebsites.net/api/webhooks/compliance'
        useCommonAlertSchema: true
      }
    ]
    logicAppReceivers: [
      {
        name: 'ComplianceAutomation'
        resourceId: complianceLogicApp.id
        callbackUrl: listCallbackUrl('${complianceLogicApp.id}/triggers/manual', '2019-05-01').value
        useCommonAlertSchema: true
      }
    ]
  }
}

// ================================================================
// Key Vault Compliance Secrets
// ================================================================

// Store compliance configuration in Key Vault
resource complianceSecrets 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = [for secret in [
  {
    name: 'soc2-compliance-config'
    value: string(complianceConfig.soc2)
  }
  {
    name: 'gdpr-compliance-config'
    value: string(complianceConfig.gdpr)
  }
  {
    name: 'compliance-admin-email'
    value: adminEmail
  }
  {
    name: 'data-residency-requirement'
    value: dataResidency
  }
]: {
  name: '${split(keyVaultId, '/')[8]}/${secret.name}'
  properties: {
    value: secret.value
    attributes: {
      enabled: true
    }
    contentType: 'application/json'
  }
}]

// ================================================================
// Outputs
// ================================================================

output complianceStorageAccountId string = complianceStorageAccount.id
output complianceStorageAccountName string = complianceStorageAccount.name
output purviewAccountId string = purviewAccount.id
output sentinelWorkspaceId string = logAnalyticsWorkspaceId
output complianceLogicAppId string = complianceLogicApp.id
output complianceActionGroupId string = complianceActionGroup.id

output complianceConfig object = {
  soc2Enabled: enableSoc2Compliance
  gdprEnabled: enableGdprCompliance
  hipaaEnabled: enableHipaaCompliance
  dataResidency: dataResidency
  auditRetention: '7-years'
  encryptionEnabled: true
}

output complianceEndpoints object = {
  purviewEndpoint: 'https://${purviewAccount.name}.purview.azure.com'
  sentinelEndpoint: 'https://portal.azure.com/#asset/Microsoft_Azure_Security_Insights/MainMenuBlade/0/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}/providers/Microsoft.OperationalInsights/workspaces/${split(logAnalyticsWorkspaceId, '/')[8]}'
  complianceStorageEndpoint: complianceStorageAccount.properties.primaryEndpoints.blob
}