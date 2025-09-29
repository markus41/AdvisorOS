// ================================================================
// Networking Module - VNet, Subnets, NSGs, DDoS Protection
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Azure region')
param location string

@description('Virtual network configuration')
param vnetConfig object

@description('Enable DDoS Protection Standard')
param enableDdosProtection bool

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var vnetName = '${resourcePrefix}-vnet'
var nsgName = '${resourcePrefix}-nsg'
var ddosProtectionPlanName = '${resourcePrefix}-ddos-plan'

// ================================================================
// DDoS Protection Plan
// ================================================================

resource ddosProtectionPlan 'Microsoft.Network/ddosProtectionPlans@2023-11-01' = if (enableDdosProtection) {
  name: ddosProtectionPlanName
  location: location
  tags: tags
  properties: {}
}

// ================================================================
// Network Security Groups
// ================================================================

resource appNsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: '${nsgName}-app'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPSInbound'
        properties: {
          description: 'Allow HTTPS traffic'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTPInbound'
        properties: {
          description: 'Allow HTTP traffic for redirects'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowAppServiceInbound'
        properties: {
          description: 'Allow App Service management traffic'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRanges: [
            '8080'
            '454-455'
          ]
          sourceAddressPrefix: 'AppService'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1020
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          description: 'Deny all other inbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4000
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource dataNsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: '${nsgName}-data'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowPostgreSQLFromApp'
        properties: {
          description: 'Allow PostgreSQL from app subnet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '5432'
          sourceAddressPrefix: vnetConfig.subnets.app.addressPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowRedisFromApp'
        properties: {
          description: 'Allow Redis from app subnet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '6380'
          sourceAddressPrefix: vnetConfig.subnets.app.addressPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          description: 'Deny all other inbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4000
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource servicesNsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: '${nsgName}-services'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPSFromApp'
        properties: {
          description: 'Allow HTTPS from app subnet to AI services'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: vnetConfig.subnets.app.addressPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          description: 'Deny all other inbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4000
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource gatewayNsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: '${nsgName}-gateway'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowGatewayManager'
        properties: {
          description: 'Allow Azure Gateway Manager'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '65200-65535'
          sourceAddressPrefix: 'GatewayManager'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTPSInbound'
        properties: {
          description: 'Allow HTTPS inbound'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
        }
      }
    ]
  }
}

// ================================================================
// Virtual Network
// ================================================================

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetConfig.addressSpace
      ]
    }
    ddosProtectionPlan: enableDdosProtection ? {
      id: ddosProtectionPlan.id
    } : null
    enableDdosProtection: enableDdosProtection
    subnets: [
      {
        name: vnetConfig.subnets.app.name
        properties: {
          addressPrefix: vnetConfig.subnets.app.addressPrefix
          networkSecurityGroup: {
            id: appNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.CognitiveServices'
            }
          ]
          delegations: [
            {
              name: 'appServiceDelegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: vnetConfig.subnets.data.name
        properties: {
          addressPrefix: vnetConfig.subnets.data.addressPrefix
          networkSecurityGroup: {
            id: dataNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
          delegations: [
            {
              name: 'postgresqlDelegation'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
      {
        name: vnetConfig.subnets.services.name
        properties: {
          addressPrefix: vnetConfig.subnets.services.addressPrefix
          networkSecurityGroup: {
            id: servicesNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.CognitiveServices'
            }
            {
              service: 'Microsoft.Storage'
            }
          ]
        }
      }
      {
        name: vnetConfig.subnets.gateway.name
        properties: {
          addressPrefix: vnetConfig.subnets.gateway.addressPrefix
          networkSecurityGroup: {
            id: gatewayNsg.id
          }
        }
      }
    ]
  }
}

// ================================================================
// Outputs
// ================================================================

output vnetId string = vnet.id
output vnetName string = vnet.name

output appSubnetId string = '${vnet.id}/subnets/${vnetConfig.subnets.app.name}'
output dataSubnetId string = '${vnet.id}/subnets/${vnetConfig.subnets.data.name}'
output servicesSubnetId string = '${vnet.id}/subnets/${vnetConfig.subnets.services.name}'
output gatewaySubnetId string = '${vnet.id}/subnets/${vnetConfig.subnets.gateway.name}'

output appNsgId string = appNsg.id
output dataNsgId string = dataNsg.id
output servicesNsgId string = servicesNsg.id
output gatewayNsgId string = gatewayNsg.id

output ddosProtectionPlanId string = enableDdosProtection ? ddosProtectionPlan.id : ''