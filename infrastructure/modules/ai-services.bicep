// ================================================================
// AI Services Module - OpenAI, Document Intelligence, Cognitive Search
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Azure region')
param location string

@description('Key Vault ID')
param keyVaultId string

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var openAiServiceName = '${resourcePrefix}-openai'
var documentIntelligenceName = '${resourcePrefix}-docintel'
var cognitiveSearchName = '${resourcePrefix}-search-${uniqueString(resourceGroup().id)}'
var translatorServiceName = '${resourcePrefix}-translator'

// Pricing tiers based on environment
var openAiSku = environment == 'prod' ? 'S0' : 'S0'
var documentIntelligenceSku = environment == 'prod' ? 'S0' : 'S0'
var searchSku = environment == 'prod' ? 'standard' : 'basic'
var translatorSku = environment == 'prod' ? 'S1' : 'F0'

// ================================================================
// OpenAI Service
// ================================================================

resource openAiService 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: openAiServiceName
  location: location
  tags: tags
  sku: {
    name: openAiSku
  }
  kind: 'OpenAI'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: openAiServiceName
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    restrictOutboundNetworkAccess: false
  }
}

// ================================================================
// OpenAI Model Deployments
// ================================================================

resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAiService
  name: 'gpt-4'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4'
      version: '0613'
    }
    scaleSettings: {
      scaleType: 'Standard'
      capacity: environment == 'prod' ? 30 : 10
    }
  }
}

resource gpt35TurboDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAiService
  name: 'gpt-35-turbo'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-35-turbo'
      version: '0613'
    }
    scaleSettings: {
      scaleType: 'Standard'
      capacity: environment == 'prod' ? 50 : 20
    }
  }
  dependsOn: [
    gpt4Deployment
  ]
}

resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAiService
  name: 'text-embedding-ada-002'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-ada-002'
      version: '2'
    }
    scaleSettings: {
      scaleType: 'Standard'
      capacity: environment == 'prod' ? 30 : 10
    }
  }
  dependsOn: [
    gpt35TurboDeployment
  ]
}

// ================================================================
// Document Intelligence Service
// ================================================================

resource documentIntelligence 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: documentIntelligenceName
  location: location
  tags: tags
  sku: {
    name: documentIntelligenceSku
  }
  kind: 'FormRecognizer'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: documentIntelligenceName
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
  }
}

// ================================================================
// Cognitive Search Service
// ================================================================

resource cognitiveSearch 'Microsoft.Search/searchServices@2024-06-01-preview' = {
  name: cognitiveSearchName
  location: location
  tags: tags
  sku: {
    name: searchSku
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    replicaCount: environment == 'prod' ? 2 : 1
    partitionCount: environment == 'prod' ? 2 : 1
    hostingMode: environment == 'prod' ? 'default' : 'default'
    publicNetworkAccess: 'enabled'
    networkRuleSet: {
      ipRules: []
      bypass: 'AzurePortal'
    }
    encryptionWithCmk: {
      enforcement: 'Unspecified'
    }
    disableLocalAuth: false
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    semanticSearch: environment == 'prod' ? 'standard' : 'free'
  }
}

// ================================================================
// Translator Service
// ================================================================

resource translatorService 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: translatorServiceName
  location: 'global'
  tags: tags
  sku: {
    name: translatorSku
  }
  kind: 'TextTranslation'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: translatorServiceName
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
  }
}

// ================================================================
// Key Vault Secrets for AI Services
// ================================================================

resource openAiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/openai-api-key'
  properties: {
    value: openAiService.listKeys().key1
    attributes: {
      enabled: true
    }
    contentType: 'api-key'
  }
}

resource openAiEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/openai-endpoint'
  properties: {
    value: openAiService.properties.endpoint
    attributes: {
      enabled: true
    }
    contentType: 'endpoint-url'
  }
}

resource documentIntelligenceKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/document-intelligence-api-key'
  properties: {
    value: documentIntelligence.listKeys().key1
    attributes: {
      enabled: true
    }
    contentType: 'api-key'
  }
}

resource documentIntelligenceEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/document-intelligence-endpoint'
  properties: {
    value: documentIntelligence.properties.endpoint
    attributes: {
      enabled: true
    }
    contentType: 'endpoint-url'
  }
}

resource cognitiveSearchKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/cognitive-search-api-key'
  properties: {
    value: cognitiveSearch.listAdminKeys().primaryKey
    attributes: {
      enabled: true
    }
    contentType: 'api-key'
  }
}

resource cognitiveSearchEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/cognitive-search-endpoint'
  properties: {
    value: 'https://${cognitiveSearchName}.search.windows.net'
    attributes: {
      enabled: true
    }
    contentType: 'endpoint-url'
  }
}

resource translatorKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${split(keyVaultId, '/')[8]}/translator-api-key'
  properties: {
    value: translatorService.listKeys().key1
    attributes: {
      enabled: true
    }
    contentType: 'api-key'
  }
}

// ================================================================
// Search Index Configuration (Document Intelligence Integration)
// ================================================================

resource documentIndex 'Microsoft.Search/searchServices/indexes@2024-06-01-preview' = {
  parent: cognitiveSearch
  name: 'documents-index'
  properties: {
    fields: [
      {
        name: 'id'
        type: 'Edm.String'
        key: true
        searchable: false
        filterable: true
        retrievable: true
      }
      {
        name: 'fileName'
        type: 'Edm.String'
        searchable: true
        filterable: true
        retrievable: true
        analyzer: 'standard.lucene'
      }
      {
        name: 'content'
        type: 'Edm.String'
        searchable: true
        retrievable: true
        analyzer: 'standard.lucene'
      }
      {
        name: 'category'
        type: 'Edm.String'
        searchable: true
        filterable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'subcategory'
        type: 'Edm.String'
        searchable: true
        filterable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'clientId'
        type: 'Edm.String'
        searchable: false
        filterable: true
        retrievable: true
      }
      {
        name: 'organizationId'
        type: 'Edm.String'
        searchable: false
        filterable: true
        retrievable: true
      }
      {
        name: 'tags'
        type: 'Collection(Edm.String)'
        searchable: true
        filterable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'extractedData'
        type: 'Edm.ComplexType'
        fields: [
          {
            name: 'entities'
            type: 'Collection(Edm.String)'
            searchable: true
            retrievable: true
          }
          {
            name: 'keyPhrases'
            type: 'Collection(Edm.String)'
            searchable: true
            retrievable: true
          }
          {
            name: 'amounts'
            type: 'Collection(Edm.Double)'
            searchable: false
            filterable: true
            retrievable: true
          }
          {
            name: 'dates'
            type: 'Collection(Edm.DateTimeOffset)'
            searchable: false
            filterable: true
            retrievable: true
          }
        ]
      }
      {
        name: 'ocrConfidence'
        type: 'Edm.Double'
        searchable: false
        filterable: true
        retrievable: true
      }
      {
        name: 'createdAt'
        type: 'Edm.DateTimeOffset'
        searchable: false
        filterable: true
        sortable: true
        retrievable: true
      }
      {
        name: 'lastModified'
        type: 'Edm.DateTimeOffset'
        searchable: false
        filterable: true
        sortable: true
        retrievable: true
      }
    ]
    semantic: {
      configurations: [
        {
          name: 'semantic-config'
          prioritizedFields: {
            titleField: {
              fieldName: 'fileName'
            }
            prioritizedContentFields: [
              {
                fieldName: 'content'
              }
            ]
            prioritizedKeywordsFields: [
              {
                fieldName: 'tags'
              }
              {
                fieldName: 'category'
              }
            ]
          }
        }
      ]
    }
    suggesters: [
      {
        name: 'sg-documents'
        searchMode: 'analyzingInfixMatching'
        sourceFields: [
          'fileName'
          'content'
          'tags'
        ]
      }
    ]
    scoringProfiles: [
      {
        name: 'recent-boost'
        text: {
          weights: {
            fileName: 2
            content: 1
            tags: 1.5
          }
        }
        functions: [
          {
            type: 'freshness'
            fieldName: 'lastModified'
            boost: 2
            interpolation: 'linear'
            freshness: {
              boostingDuration: 'P30D'
            }
          }
        ]
      }
    ]
  }
}

// ================================================================
// Outputs
// ================================================================

output openAiServiceName string = openAiService.name
output openAiEndpoint string = openAiService.properties.endpoint
output openAiResourceId string = openAiService.id

output documentIntelligenceName string = documentIntelligence.name
output documentIntelligenceEndpoint string = documentIntelligence.properties.endpoint
output documentIntelligenceResourceId string = documentIntelligence.id

output cognitiveSearchName string = cognitiveSearch.name
output cognitiveSearchEndpoint string = 'https://${cognitiveSearchName}.search.windows.net'
output cognitiveSearchResourceId string = cognitiveSearch.id

output translatorServiceName string = translatorService.name
output translatorEndpoint string = translatorService.properties.endpoint
output translatorResourceId string = translatorService.id

output aiServicesConfiguration object = {
  openAi: {
    endpoint: openAiService.properties.endpoint
    deployments: {
      gpt4: gpt4Deployment.name
      gpt35Turbo: gpt35TurboDeployment.name
      embedding: embeddingDeployment.name
    }
  }
  documentIntelligence: {
    endpoint: documentIntelligence.properties.endpoint
    capabilities: [
      'layout'
      'general-document'
      'invoice'
      'receipt'
      'tax-document'
      'business-card'
      'id-document'
    ]
  }
  cognitiveSearch: {
    endpoint: 'https://${cognitiveSearchName}.search.windows.net'
    indexes: [
      'documents-index'
    ]
    semanticSearch: environment == 'prod' ? 'enabled' : 'free'
  }
  translator: {
    endpoint: translatorService.properties.endpoint
    region: 'global'
  }
}