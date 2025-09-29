// ================================================================
// Primary Infrastructure Module - App Service, Database, Storage, Redis
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Azure region')
param location string

@description('Application configuration')
param appConfig object

@description('Virtual Network ID')
param vnetId string

@description('App subnet ID')
param appSubnetId string

@description('Data subnet ID')
param dataSubnetId string

@description('Services subnet ID')
param servicesSubnetId string

@description('Key Vault ID')
param keyVaultId string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Application Insights ID')
param applicationInsightsId string

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var appServicePlanName = '${resourcePrefix}-asp'
var appServiceName = '${resourcePrefix}-app'
var databaseServerName = '${resourcePrefix}-pgserver-${uniqueString(resourceGroup().id)}'
var databaseName = '${appName}_${environment}'
var redisCacheName = '${resourcePrefix}-redis-${uniqueString(resourceGroup().id)}'
var storageAccountName = '${replace(resourcePrefix, '-', '')}sa${uniqueString(resourceGroup().id)}'
var cdnProfileName = '${resourcePrefix}-cdn'
var cdnEndpointName = '${resourcePrefix}-cdn-endpoint'

// Database configuration
var dbAdminUsername = 'pgadmin'
var dbAdminPasswordRef = '@Microsoft.KeyVault(VaultName=${split(keyVaultId, '/')[8]};SecretName=database-password)'

// ================================================================
// App Service Plan
// ================================================================

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: appConfig.appServicePlan.sku
    capacity: appConfig.appServicePlan.capacity
  }
  kind: 'linux'
  properties: {
    reserved: true
    targetWorkerCount: appConfig.appServicePlan.capacity
    targetWorkerSizeId: 0
  }
}

// ================================================================
// App Service Auto-scaling
// ================================================================

resource appServiceAutoScale 'Microsoft.Insights/autoscalesettings@2022-10-01' = if (environment == 'prod') {
  name: '${appServicePlanName}-autoscale'
  location: location
  tags: tags
  properties: {
    enabled: true
    targetResourceUri: appServicePlan.id
    profiles: [
      {
        name: 'Default'
        capacity: {
          minimum: string(appConfig.appServicePlan.autoScaleMin)
          maximum: string(appConfig.appServicePlan.autoScaleMax)
          default: string(appConfig.appServicePlan.capacity)
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
          {
            metricTrigger: {
              metricName: 'MemoryPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 80
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
        ]
      }
      {
        name: 'TaxSeasonPeak'
        capacity: {
          minimum: string(appConfig.appServicePlan.capacity)
          maximum: string(appConfig.appServicePlan.autoScaleMax * 2)
          default: string(appConfig.appServicePlan.capacity * 2)
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT3M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 60
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '2'
              cooldown: 'PT3M'
            }
          }
        ]
        recurrence: {
          frequency: 'Year'
          schedule: {
            timeZone: 'Eastern Standard Time'
            startTime: '2024-01-01T00:00:00'
            endTime: '2024-04-30T23:59:59'
          }
        }
      }
    ]
    notifications: []
  }
}

// ================================================================
// PostgreSQL Flexible Server
// ================================================================

resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: databaseServerName
  location: location
  tags: tags
  sku: {
    name: appConfig.database.sku
    tier: startsWith(appConfig.database.sku, 'B_') ? 'Burstable' : startsWith(appConfig.database.sku, 'GP_') ? 'GeneralPurpose' : 'MemoryOptimized'
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPasswordRef
    network: {
      delegatedSubnetResourceId: dataSubnetId
      privateDnsZoneArmResourceId: postgresqlPrivateDnsZone.id
    }
    storage: {
      storageSizeGB: appConfig.database.storageSize
      autoGrow: 'Enabled'
      tier: environment == 'prod' ? 'P30' : 'P10'
    }
    backup: {
      backupRetentionDays: appConfig.database.backupRetention
      geoRedundantBackup: appConfig.database.geoRedundantBackup ? 'Enabled' : 'Disabled'
    }
    highAvailability: appConfig.database.highAvailability ? {
      mode: 'ZoneRedundant'
    } : null
    maintenanceWindow: {
      customWindow: 'Enabled'
      dayOfWeek: 1 // Monday
      startHour: 2
      startMinute: 0
    }
  }
}

// ================================================================
// PostgreSQL Private DNS Zone
// ================================================================

resource postgresqlPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${databaseServerName}.private.postgres.database.azure.com'
  location: 'global'
  tags: tags
}

resource postgresqlPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: postgresqlPrivateDnsZone
  name: '${databaseServerName}-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// ================================================================
// PostgreSQL Database
// ================================================================

resource postgresqlDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresqlServer
  name: databaseName
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// ================================================================
// PostgreSQL Configuration
// ================================================================

resource postgresqlConfigurations 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = [
  {
    parent: postgresqlServer
    name: 'max_connections'
    properties: {
      value: environment == 'prod' ? '200' : '100'
      source: 'user-override'
    }
  }
  {
    parent: postgresqlServer
    name: 'shared_preload_libraries'
    properties: {
      value: 'pg_stat_statements'
      source: 'user-override'
    }
  }
  {
    parent: postgresqlServer
    name: 'log_statement'
    properties: {
      value: environment == 'prod' ? 'ddl' : 'all'
      source: 'user-override'
    }
  }
]

// ================================================================
// Redis Cache
// ================================================================

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: appConfig.redis.sku
      family: appConfig.redis.family
      capacity: appConfig.redis.capacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    redisConfiguration: {
      'rdb-backup-enabled': environment == 'prod' ? 'true' : 'false'
      'rdb-backup-frequency': environment == 'prod' ? '60' : null
      'rdb-backup-max-snapshot-count': environment == 'prod' ? '1' : null
      'rdb-storage-connection-string': environment == 'prod' ? 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net' : null
    }
    redisVersion: '6'
  }
}

// ================================================================
// Redis Private Endpoint
// ================================================================

resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: '${redisCacheName}-pe'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: dataSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${redisCacheName}-pe-connection'
        properties: {
          privateLinkServiceId: redisCache.id
          groupIds: [
            'redisCache'
          ]
        }
      }
    ]
  }
}

// ================================================================
// Storage Account
// ================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: appConfig.storage.sku
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      virtualNetworkRules: [
        {
          id: appSubnetId
          action: 'Allow'
        }
      ]
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
// Storage Containers
// ================================================================

resource storageContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [
  for containerName in ['documents', 'receipts', 'tax-returns', 'financial-statements', 'backups', 'templates', 'exports']: {
    name: '${storageAccount.name}/default/${containerName}'
    properties: {
      publicAccess: 'None'
      metadata: {
        purpose: containerName
        environment: environment
      }
    }
  }
]

// ================================================================
// CDN Profile and Endpoint
// ================================================================

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'Global'
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium_AzureFrontDoor' : 'Standard_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 240
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: cdnEndpointName
  location: 'Global'
  tags: tags
  properties: {
    originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    origins: [
      {
        name: 'storage-origin'
        properties: {
          hostName: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
          httpPort: 80
          httpsPort: 443
          originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
    deliveryPolicy: {
      rules: [
        {
          name: 'CacheDocuments'
          order: 1
          conditions: [
            {
              name: 'UrlPath'
              parameters: {
                operator: 'BeginsWith'
                matchValues: [
                  '/documents/'
                ]
                transforms: [
                  'Lowercase'
                ]
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: '365.00:00:00'
              }
            }
          ]
        }
      ]
    }
  }
}

// ================================================================
// App Service
// ================================================================

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    virtualNetworkSubnetId: appSubnetId
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
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
          name: 'NEXTAUTH_URL'
          value: 'https://${appServiceName}.azurewebsites.net'
        }
        {
          name: 'NEXTAUTH_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${split(keyVaultId, '/')[8]};SecretName=nextauth-secret)'
        }
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${dbAdminUsername}:${dbAdminPasswordRef}@${databaseServerName}.postgres.database.azure.com:5432/${databaseName}?sslmode=require'
        }
        {
          name: 'REDIS_URL'
          value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCacheName}.redis.cache.windows.net:6380'
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
          name: 'CDN_ENDPOINT_URL'
          value: 'https://${cdnEndpoint.properties.hostName}'
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
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'postgresql://${dbAdminUsername}:${dbAdminPasswordRef}@${databaseServerName}.postgres.database.azure.com:5432/${databaseName}?sslmode=require'
          type: 'PostgreSQL'
        }
      ]
    }
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
          days: environment == 'prod' ? 90 : 30
        }
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

// ================================================================
// Outputs
// ================================================================

output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePrincipalId string = appService.identity.principalId

output databaseServerName string = postgresqlServer.name
output databaseName string = postgresqlDatabase.name
output databaseConnectionString string = 'postgresql://${dbAdminUsername}:${dbAdminPasswordRef}@${databaseServerName}.postgres.database.azure.com:5432/${databaseName}?sslmode=require'

output redisCacheName string = redisCache.name
output redisCacheConnectionString string = 'rediss://:${redisCache.listKeys().primaryKey}@${redisCacheName}.redis.cache.windows.net:6380'

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output storageAccountKey string = storageAccount.listKeys().keys[0].value

output cdnProfileName string = cdnProfile.name
output cdnEndpointName string = cdnEndpoint.name
output cdnEndpointUrl string = 'https://${cdnEndpoint.properties.hostName}'