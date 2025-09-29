// ================================================================
// Secondary Infrastructure Module - Disaster Recovery Setup
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Azure region for secondary deployment')
param location string

@description('Application configuration')
param appConfig object

@description('Key Vault ID from primary region')
param keyVaultId string

@description('Log Analytics Workspace ID from shared services')
param logAnalyticsWorkspaceId string

@description('Application Insights ID from shared services')
param applicationInsightsId string

@description('Primary Storage Account ID for geo-replication')
param primaryStorageAccountId string

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}-dr'
var appServicePlanName = '${resourcePrefix}-asp'
var appServiceName = '${resourcePrefix}-app'
var storageAccountName = '${replace(resourcePrefix, '-', '')}sa${uniqueString(resourceGroup().id)}'

// Database configuration for read replicas
var dbAdminPasswordRef = '@Microsoft.KeyVault(VaultName=${split(keyVaultId, '/')[8]};SecretName=database-password)'

// ================================================================
// App Service Plan (Disaster Recovery)
// ================================================================

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: union(tags, { Purpose: 'DisasterRecovery' })
  sku: {
    name: appConfig.appServicePlan.sku
    capacity: 1 // Start with minimal capacity for DR
  }
  kind: 'linux'
  properties: {
    reserved: true
    targetWorkerCount: 1
    targetWorkerSizeId: 0
  }
}

// ================================================================
// Storage Account (Geo-Redundant)
// ================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: union(tags, { Purpose: 'DisasterRecovery' })
  sku: {
    name: 'Standard_GRS' // Geo-redundant storage for DR
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Cool' // Cost optimization for DR storage
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// ================================================================
// Storage Containers (Mirror Primary)
// ================================================================

resource storageContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [
  for containerName in ['documents', 'receipts', 'tax-returns', 'financial-statements', 'backups', 'templates', 'exports']: {
    name: '${storageAccount.name}/default/${containerName}'
    properties: {
      publicAccess: 'None'
      metadata: {
        purpose: containerName
        environment: environment
        region: 'secondary'
      }
    }
  }
]

// ================================================================
// App Service (Standby Mode)
// ================================================================

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  tags: union(tags, { Purpose: 'DisasterRecovery' })
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    enabled: false // Start in disabled state for DR
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: false // Cost optimization for standby
      http20Enabled: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: false
      webSocketsEnabled: true
      managedPipelineMode: 'Integrated'
      remoteDebuggingEnabled: false
      httpLoggingEnabled: true
      logsDirectorySizeLimit: 35
      detailedErrorLoggingEnabled: true
      requestTracingEnabled: true
      netFrameworkVersion: 'v8.0'
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'NODE_ENV'
          value: environment
        }
        {
          name: 'DISASTER_RECOVERY_MODE'
          value: 'true'
        }
        {
          name: 'NEXTAUTH_URL'
          value: 'https://${appServiceName}.azurewebsites.net'
        }
        {
          name: 'NEXTAUTH_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${split(keyVaultId, '/')[8]};SecretName=nextauth-secret)'
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_KEY'
          value: storageAccount.listKeys().keys[0].value
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: reference(applicationInsightsId, '2020-02-02').ConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: reference(applicationInsightsId, '2020-02-02').InstrumentationKey
        }
        {
          name: 'KEY_VAULT_URI'
          value: reference(keyVaultId, '2023-07-01').vaultUri
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: appService.identity.principalId
        }
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'BUILD_FLAGS'
          value: 'useAppServiceBuild'
        }
      ]
    }
  }
}

// ================================================================
// Disaster Recovery Automation Account
// ================================================================

resource automationAccount 'Microsoft.Automation/automationAccounts@2023-11-01' = {
  name: '${resourcePrefix}-automation'
  location: location
  tags: union(tags, { Purpose: 'DisasterRecovery' })
  properties: {
    sku: {
      name: 'Basic'
    }
    encryption: {
      keySource: 'Microsoft.Automation'
      identity: {}
    }
    publicNetworkAccess: true
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// ================================================================
// DR Failover Runbook
// ================================================================

resource failoverRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  parent: automationAccount
  name: 'FailoverToSecondaryRegion'
  properties: {
    runbookType: 'PowerShell'
    logVerbose: true
    logProgress: true
    description: 'Automated failover to secondary region for AdvisorOS'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/automation-runbook-georestore/azuredeploy.json'
      version: '1.0.0.0'
    }
  }
}

// ================================================================
// DR Health Check Runbook
// ================================================================

resource healthCheckRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  parent: automationAccount
  name: 'HealthCheckSecondaryRegion'
  properties: {
    runbookType: 'PowerShell'
    logVerbose: true
    logProgress: true
    description: 'Health check for secondary region infrastructure'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/automation-runbook-georestore/azuredeploy.json'
      version: '1.0.0.0'
    }
  }
}

// ================================================================
// Recovery Services Vault (for backup orchestration)
// ================================================================

resource recoveryServicesVault 'Microsoft.RecoveryServices/vaults@2024-04-01' = {
  name: '${resourcePrefix}-rsv'
  location: location
  tags: union(tags, { Purpose: 'DisasterRecovery' })
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    restoreSettings: {
      crossSubscriptionRestoreSettings: {
        crossSubscriptionRestoreState: 'Enabled'
      }
    }
    securitySettings: {
      immutabilitySettings: {
        state: 'Unlocked'
      }
      softDeleteSettings: {
        softDeleteState: 'Enabled'
        softDeleteRetentionPeriodInDays: 14
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// ================================================================
// App Service Diagnostic Settings
// ================================================================

resource appServiceDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'AppServiceDiagnostics'
  scope: appService
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// ================================================================
// Storage Sync Configuration
// ================================================================

resource storageSyncService 'Microsoft.StorageSync/storageSyncServices@2022-09-01' = {
  name: '${resourcePrefix}-sync'
  location: location
  tags: union(tags, { Purpose: 'DisasterRecovery' })
  properties: {
    incomingTrafficPolicy: 'AllowAllTraffic'
  }
}

// ================================================================
// Outputs
// ================================================================

output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePrincipalId string = appService.identity.principalId

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id

output automationAccountName string = automationAccount.name
output automationAccountId string = automationAccount.id

output recoveryServicesVaultName string = recoveryServicesVault.name
output recoveryServicesVaultId string = recoveryServicesVault.id

output storageSyncServiceName string = storageSyncService.name
output storageSyncServiceId string = storageSyncService.id

output disasterRecoveryConfiguration object = {
  region: location
  appService: {
    name: appService.name
    url: 'https://${appService.properties.defaultHostName}'
    status: 'Standby'
    autoFailover: false
  }
  storage: {
    name: storageAccount.name
    sku: 'Standard_GRS'
    tier: 'Cool'
    sync: {
      service: storageSyncService.name
      policy: 'Continuous'
    }
  }
  automation: {
    account: automationAccount.name
    runbooks: [
      'FailoverToSecondaryRegion'
      'HealthCheckSecondaryRegion'
    ]
  }
  backup: {
    vault: recoveryServicesVault.name
    retentionDays: 14
    crossRegionRestore: true
  }
  rto: '< 1 hour' // Recovery Time Objective
  rpo: '< 15 minutes' // Recovery Point Objective
}