// ================================================================
// Front Door Module - Global Load Balancing, WAF, CDN
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Domain name')
param domainName string

@description('Primary App Service URL')
param primaryAppServiceUrl string

@description('Secondary App Service URL (optional)')
param secondaryAppServiceUrl string = ''

@description('Enable multi-region deployment')
param enableMultiRegion bool

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var frontDoorProfileName = '${resourcePrefix}-fd'
var wafPolicyName = '${resourcePrefix}-waf'
var frontDoorEndpointName = replace(domainName, '.', '-')

// Extract hostname from URLs
var primaryHostname = replace(replace(primaryAppServiceUrl, 'https://', ''), '/', '')
var secondaryHostname = enableMultiRegion && secondaryAppServiceUrl != '' ? replace(replace(secondaryAppServiceUrl, 'https://', ''), '/', '') : ''

// ================================================================
// WAF Policy
// ================================================================

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2024-02-01' = {
  name: wafPolicyName
  location: 'Global'
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium_AzureFrontDoor' : 'Standard_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: environment == 'prod' ? 'Prevention' : 'Detection'
      redirectUrl: 'https://${domainName}/blocked'
      customBlockResponseStatusCode: 403
      customBlockResponseBody: base64('Access denied by WAF policy')
      requestBodyCheck: 'Enabled'
    }
    customRules: {
      rules: [
        {
          name: 'RateLimitRule'
          enabledState: 'Enabled'
          priority: 1
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: environment == 'prod' ? 1000 : 100
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              negateCondition: false
              matchValue: [
                '0.0.0.0/0'
              ]
            }
          ]
          action: 'Block'
        }
        {
          name: 'BlockSuspiciousUserAgents'
          enabledState: 'Enabled'
          priority: 2
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestHeader'
              selector: 'User-Agent'
              operator: 'Contains'
              negateCondition: false
              matchValue: [
                'sqlmap'
                'nikto'
                'nmap'
                'masscan'
                'zmap'
              ]
              transforms: [
                'Lowercase'
              ]
            }
          ]
          action: 'Block'
        }
        {
          name: 'GeoBlockRule'
          enabledState: environment == 'prod' ? 'Enabled' : 'Disabled'
          priority: 3
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'GeoMatch'
              negateCondition: true
              matchValue: [
                'US'
                'CA'
                'GB'
                'AU'
                'DE'
                'FR'
                'JP'
              ]
            }
          ]
          action: 'Block'
        }
      ]
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleSetAction: 'Block'
          ruleGroupOverrides: [
            {
              ruleGroupName: 'SQLI'
              rules: [
                {
                  ruleId: '942100'
                  enabledState: 'Enabled'
                  action: 'Block'
                }
                {
                  ruleId: '942110'
                  enabledState: 'Enabled'
                  action: 'Block'
                }
              ]
            }
            {
              ruleGroupName: 'XSS'
              rules: [
                {
                  ruleId: '941100'
                  enabledState: 'Enabled'
                  action: 'Block'
                }
                {
                  ruleId: '941110'
                  enabledState: 'Enabled'
                  action: 'Block'
                }
              ]
            }
          ]
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
          ruleSetAction: 'Block'
        }
      ]
    }
  }
}

// ================================================================
// Front Door Profile
// ================================================================

resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: frontDoorProfileName
  location: 'Global'
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium_AzureFrontDoor' : 'Standard_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 240
  }
}

// ================================================================
// Front Door Endpoint
// ================================================================

resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoorProfile
  name: frontDoorEndpointName
  location: 'Global'
  tags: tags
  properties: {
    enabledState: 'Enabled'
  }
}

// ================================================================
// Origin Group
// ================================================================

resource originGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoorProfile
  name: 'app-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/api/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
    sessionAffinityState: 'Disabled'
  }
}

// ================================================================
// Primary Origin
// ================================================================

resource primaryOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: originGroup
  name: 'primary-origin'
  properties: {
    hostName: primaryHostname
    httpPort: 80
    httpsPort: 443
    originHostHeader: primaryHostname
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// ================================================================
// Secondary Origin (if multi-region is enabled)
// ================================================================

resource secondaryOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = if (enableMultiRegion && secondaryHostname != '') {
  parent: originGroup
  name: 'secondary-origin'
  properties: {
    hostName: secondaryHostname
    httpPort: 80
    httpsPort: 443
    originHostHeader: secondaryHostname
    priority: 2
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// ================================================================
// Route Configuration
// ================================================================

resource defaultRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: frontDoorEndpoint
  name: 'default-route'
  properties: {
    originGroup: {
      id: originGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: {
      compressionSettings: {
        contentTypesToCompress: [
          'application/eot'
          'application/font'
          'application/font-sfnt'
          'application/javascript'
          'application/json'
          'application/opentype'
          'application/otf'
          'application/pkcs7-mime'
          'application/truetype'
          'application/ttf'
          'application/vnd.ms-fontobject'
          'application/xhtml+xml'
          'application/xml'
          'application/xml+rss'
          'application/x-font-opentype'
          'application/x-font-truetype'
          'application/x-font-ttf'
          'application/x-httpd-cgi'
          'application/x-javascript'
          'application/x-mpegurl'
          'application/x-opentype'
          'application/x-otf'
          'application/x-perl'
          'application/x-ttf'
          'font/eot'
          'font/ttf'
          'font/otf'
          'font/opentype'
          'image/svg+xml'
          'text/css'
          'text/csv'
          'text/html'
          'text/javascript'
          'text/js'
          'text/plain'
          'text/richtext'
          'text/tab-separated-values'
          'text/xml'
          'text/x-script'
          'text/x-component'
          'text/x-java-source'
        ]
        isCompressionEnabled: true
      }
      queryStringCachingBehavior: 'IgnoreSpecifiedQueryStrings'
      queryParameters: 'utm_source,utm_medium,utm_campaign,utm_term,utm_content,fbclid,gclid'
      cacheBehavior: 'HonorOrigin'
      cacheDuration: '1.12:00:00'
    }
  }
  dependsOn: [
    primaryOrigin
    secondaryOrigin
  ]
}

// ================================================================
// API Route (No Caching)
// ================================================================

resource apiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: frontDoorEndpoint
  name: 'api-route'
  properties: {
    originGroup: {
      id: originGroup.id
    }
    supportedProtocols: [
      'Https'
    ]
    patternsToMatch: [
      '/api/*'
      '/trpc/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: {
      compressionSettings: {
        isCompressionEnabled: true
      }
      queryStringCachingBehavior: 'UseQueryString'
      cacheBehavior: 'BypassCache'
    }
  }
  dependsOn: [
    defaultRoute
  ]
}

// ================================================================
// Static Assets Route (Long Caching)
// ================================================================

resource staticRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: frontDoorEndpoint
  name: 'static-route'
  properties: {
    originGroup: {
      id: originGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/_next/static/*'
      '/static/*'
      '/images/*'
      '/favicon.ico'
      '/*.css'
      '/*.js'
      '/*.woff'
      '/*.woff2'
      '/*.ttf'
      '/*.eot'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: {
      compressionSettings: {
        isCompressionEnabled: true
      }
      queryStringCachingBehavior: 'IgnoreQueryString'
      cacheBehavior: 'Override'
      cacheDuration: '365.00:00:00'
    }
  }
  dependsOn: [
    apiRoute
  ]
}

// ================================================================
// Security Policy (WAF Association)
// ================================================================

resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2023-05-01' = {
  parent: frontDoorProfile
  name: 'security-policy'
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: wafPolicy.id
      }
      associations: [
        {
          domains: [
            {
              id: frontDoorEndpoint.id
            }
          ]
          patternsToMatch: [
            '/*'
          ]
        }
      ]
    }
  }
  dependsOn: [
    staticRoute
  ]
}

// ================================================================
// Custom Domain (if production)
// ================================================================

resource customDomain 'Microsoft.Cdn/profiles/customDomains@2023-05-01' = if (environment == 'prod') {
  parent: frontDoorProfile
  name: replace(domainName, '.', '-')
  properties: {
    hostName: domainName
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

// ================================================================
// Custom Domain Route Association
// ================================================================

resource customDomainRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = if (environment == 'prod') {
  parent: frontDoorEndpoint
  name: 'custom-domain-route'
  properties: {
    originGroup: {
      id: originGroup.id
    }
    supportedProtocols: [
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Disabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    customDomains: environment == 'prod' ? [
      {
        id: customDomain.id
      }
    ] : []
    cacheConfiguration: {
      compressionSettings: {
        isCompressionEnabled: true
      }
      queryStringCachingBehavior: 'IgnoreSpecifiedQueryStrings'
      queryParameters: 'utm_source,utm_medium,utm_campaign,utm_term,utm_content,fbclid,gclid'
      cacheBehavior: 'HonorOrigin'
      cacheDuration: '1.12:00:00'
    }
  }
  dependsOn: [
    securityPolicy
    customDomain
  ]
}

// ================================================================
// Outputs
// ================================================================

output frontDoorId string = frontDoorProfile.id
output frontDoorName string = frontDoorProfile.name
output frontDoorEndpoint string = 'https://${frontDoorEndpoint.properties.hostName}'
output customDomainEndpoint string = environment == 'prod' ? 'https://${domainName}' : ''

output wafPolicyId string = wafPolicy.id
output wafPolicyName string = wafPolicy.name

output frontDoorConfiguration object = {
  profileName: frontDoorProfile.name
  endpointHostname: frontDoorEndpoint.properties.hostName
  customDomain: environment == 'prod' ? domainName : null
  wafPolicy: {
    name: wafPolicy.name
    mode: wafPolicy.properties.policySettings.mode
    state: wafPolicy.properties.policySettings.enabledState
  }
  origins: {
    primary: {
      hostname: primaryHostname
      priority: 1
      weight: 1000
    }
    secondary: enableMultiRegion ? {
      hostname: secondaryHostname
      priority: 2
      weight: 1000
    } : null
  }
  routes: [
    'default-route'
    'api-route'
    'static-route'
  ]
  caching: {
    staticAssets: '365 days'
    dynamicContent: '1 day'
    apiResponses: 'bypass'
  }
  compression: {
    enabled: true
    types: 'standard web assets'
  }
  httpsRedirect: true
  minimumTlsVersion: 'TLS 1.2'
}