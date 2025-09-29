// ================================================================
// AdvisorOS Production Infrastructure - Main Template
// Enterprise-grade CPA practice management platform
// ================================================================

targetScope = 'subscription'

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Application name prefix')
param appName string = 'advisoros'

@description('Primary Azure region')
param primaryRegion string = 'East US 2'

@description('Secondary Azure region for DR')
param secondaryRegion string = 'West US 2'

@description('Enable multi-region deployment for high availability')
param enableMultiRegion bool = false

@description('SKU tier for production workloads')
@allowed(['Basic', 'Standard', 'Premium'])
param productionTier string = 'Premium'

@description('Admin email for alerts and notifications')
param adminEmail string

@description('Domain name for the application')
param domainName string

@description('Enable Azure Front Door with WAF')
param enableFrontDoor bool = true

@description('Enable DDoS Protection Standard')
param enableDdosProtection bool = true

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Application: appName
  Owner: 'DevOps'
  CostCenter: 'IT'
  BackupPolicy: 'Daily'
  Compliance: 'SOC2-GDPR'
}

// ================================================================
// Variables and Configuration
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var primaryRgName = '${resourcePrefix}-primary-rg'
var secondaryRgName = '${resourcePrefix}-secondary-rg'
var sharedRgName = '${resourcePrefix}-shared-rg'

// Network configuration
var vnetConfig = {
  addressSpace: '10.0.0.0/16'
  subnets: {
    app: {
      name: 'app-subnet'
      addressPrefix: '10.0.1.0/24'
    }
    data: {
      name: 'data-subnet'
      addressPrefix: '10.0.2.0/24'
    }
    services: {
      name: 'services-subnet'
      addressPrefix: '10.0.3.0/24'
    }
    gateway: {
      name: 'gateway-subnet'
      addressPrefix: '10.0.4.0/24'
    }
  }
}

// Application configuration based on environment
var appConfig = environment == 'prod' ? {
  appServicePlan: {
    sku: 'P2v3'
    capacity: 3
    autoScaleMax: 10
    autoScaleMin: 3
  }
  database: {
    sku: 'GP_Gen5_4'
    storageSize: 1024
    backupRetention: 35
    geoRedundantBackup: true
    highAvailability: true
  }
  redis: {
    sku: 'Premium'
    family: 'P'
    capacity: 1
  }
  storage: {
    sku: 'Premium_LRS'
    tier: 'Premium'
  }
} : environment == 'staging' ? {
  appServicePlan: {
    sku: 'P1v3'
    capacity: 2
    autoScaleMax: 5
    autoScaleMin: 2
  }
  database: {
    sku: 'GP_Gen5_2'
    storageSize: 512
    backupRetention: 14
    geoRedundantBackup: false
    highAvailability: false
  }
  redis: {
    sku: 'Standard'
    family: 'C'
    capacity: 1
  }
  storage: {
    sku: 'Standard_LRS'
    tier: 'Standard'
  }
} : {
  appServicePlan: {
    sku: 'S2'
    capacity: 1
    autoScaleMax: 3
    autoScaleMin: 1
  }
  database: {
    sku: 'B_Gen5_1'
    storageSize: 100
    backupRetention: 7
    geoRedundantBackup: false
    highAvailability: false
  }
  redis: {
    sku: 'Basic'
    family: 'C'
    capacity: 0
  }
  storage: {
    sku: 'Standard_LRS'
    tier: 'Standard'
  }
}

// ================================================================
// Resource Groups
// ================================================================

resource primaryResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: primaryRgName
  location: primaryRegion
  tags: tags
}

resource sharedResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: sharedRgName
  location: primaryRegion
  tags: tags
}

resource secondaryResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = if (enableMultiRegion) {
  name: secondaryRgName
  location: secondaryRegion
  tags: tags
}

// ================================================================
// Shared Services (Key Vault, Monitoring, Front Door)
// ================================================================

module sharedServices 'modules/shared-services.bicep' = {
  name: 'shared-services-deployment'
  scope: sharedResourceGroup
  params: {
    environment: environment
    appName: appName
    location: primaryRegion
    adminEmail: adminEmail
    domainName: domainName
    enableFrontDoor: enableFrontDoor
    tags: tags
  }
}

// ================================================================
// Networking Infrastructure
// ================================================================

module networking 'modules/networking.bicep' = {
  name: 'networking-deployment'
  scope: primaryResourceGroup
  params: {
    environment: environment
    appName: appName
    location: primaryRegion
    vnetConfig: vnetConfig
    enableDdosProtection: enableDdosProtection
    tags: tags
  }
}

// ================================================================
// Primary Region Infrastructure
// ================================================================

module primaryInfrastructure 'modules/primary-infrastructure.bicep' = {
  name: 'primary-infrastructure-deployment'
  scope: primaryResourceGroup
  params: {
    environment: environment
    appName: appName
    location: primaryRegion
    appConfig: appConfig
    vnetId: networking.outputs.vnetId
    appSubnetId: networking.outputs.appSubnetId
    dataSubnetId: networking.outputs.dataSubnetId
    servicesSubnetId: networking.outputs.servicesSubnetId
    keyVaultId: sharedServices.outputs.keyVaultId
    logAnalyticsWorkspaceId: sharedServices.outputs.logAnalyticsWorkspaceId
    applicationInsightsId: sharedServices.outputs.applicationInsightsId
    tags: tags
  }
}

// ================================================================
// Secondary Region Infrastructure (Disaster Recovery)
// ================================================================

module secondaryInfrastructure 'modules/secondary-infrastructure.bicep' = if (enableMultiRegion) {
  name: 'secondary-infrastructure-deployment'
  scope: secondaryResourceGroup
  params: {
    environment: environment
    appName: appName
    location: secondaryRegion
    appConfig: appConfig
    keyVaultId: sharedServices.outputs.keyVaultId
    logAnalyticsWorkspaceId: sharedServices.outputs.logAnalyticsWorkspaceId
    applicationInsightsId: sharedServices.outputs.applicationInsightsId
    primaryStorageAccountId: primaryInfrastructure.outputs.storageAccountId
    tags: tags
  }
}

// ================================================================
// AI Services and Cognitive Services
// ================================================================

module aiServices 'modules/ai-services.bicep' = {
  name: 'ai-services-deployment'
  scope: primaryResourceGroup
  params: {
    environment: environment
    appName: appName
    location: primaryRegion
    keyVaultId: sharedServices.outputs.keyVaultId
    tags: tags
  }
}

// ================================================================
// Monitoring and Security
// ================================================================

module security 'modules/security.bicep' = {
  name: 'security-deployment'
  scope: sharedResourceGroup
  params: {
    environment: environment
    appName: appName
    location: primaryRegion
    keyVaultId: sharedServices.outputs.keyVaultId
    logAnalyticsWorkspaceId: sharedServices.outputs.logAnalyticsWorkspaceId
    applicationInsightsId: sharedServices.outputs.applicationInsightsId
    adminEmail: adminEmail
    tags: tags
  }
}

// ================================================================
// Front Door and CDN Configuration
// ================================================================

module frontDoor 'modules/front-door.bicep' = if (enableFrontDoor) {
  name: 'front-door-deployment'
  scope: sharedResourceGroup
  params: {
    environment: environment
    appName: appName
    domainName: domainName
    primaryAppServiceUrl: primaryInfrastructure.outputs.appServiceUrl
    secondaryAppServiceUrl: enableMultiRegion ? secondaryInfrastructure.outputs.appServiceUrl : ''
    enableMultiRegion: enableMultiRegion
    tags: tags
  }
}

// ================================================================
// Outputs
// ================================================================

output primaryResourceGroupName string = primaryResourceGroup.name
output sharedResourceGroupName string = sharedResourceGroup.name
output secondaryResourceGroupName string = enableMultiRegion ? secondaryResourceGroup.name : ''

output keyVaultId string = sharedServices.outputs.keyVaultId
output keyVaultName string = sharedServices.outputs.keyVaultName
output keyVaultUri string = sharedServices.outputs.keyVaultUri

output appServiceName string = primaryInfrastructure.outputs.appServiceName
output appServiceUrl string = primaryInfrastructure.outputs.appServiceUrl
output appServicePrincipalId string = primaryInfrastructure.outputs.appServicePrincipalId

output databaseServerName string = primaryInfrastructure.outputs.databaseServerName
output databaseName string = primaryInfrastructure.outputs.databaseName
output databaseConnectionString string = primaryInfrastructure.outputs.databaseConnectionString

output storageAccountName string = primaryInfrastructure.outputs.storageAccountName
output storageAccountId string = primaryInfrastructure.outputs.storageAccountId
output cdnEndpointUrl string = primaryInfrastructure.outputs.cdnEndpointUrl

output redisCacheName string = primaryInfrastructure.outputs.redisCacheName
output redisCacheConnectionString string = primaryInfrastructure.outputs.redisCacheConnectionString

output logAnalyticsWorkspaceId string = sharedServices.outputs.logAnalyticsWorkspaceId
output applicationInsightsId string = sharedServices.outputs.applicationInsightsId
output applicationInsightsInstrumentationKey string = sharedServices.outputs.applicationInsightsInstrumentationKey

output openAiEndpoint string = aiServices.outputs.openAiEndpoint
output documentIntelligenceEndpoint string = aiServices.outputs.documentIntelligenceEndpoint
output cognitiveSearchEndpoint string = aiServices.outputs.cognitiveSearchEndpoint

output frontDoorEndpoint string = enableFrontDoor ? frontDoor.outputs.frontDoorEndpoint : ''
output frontDoorId string = enableFrontDoor ? frontDoor.outputs.frontDoorId : ''

output deploymentSummary object = {
  environment: environment
  primaryRegion: primaryRegion
  secondaryRegion: enableMultiRegion ? secondaryRegion : 'Not deployed'
  multiRegionEnabled: enableMultiRegion
  frontDoorEnabled: enableFrontDoor
  ddosProtectionEnabled: enableDdosProtection
  deploymentTimestamp: utcNow()
}