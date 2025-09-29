// ================================================================
// Monitoring and Observability Module
// Enterprise-grade monitoring for CPA practice management platform
// Tax season scaling, performance monitoring, and alerting
// ================================================================

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Azure region')
param location string

@description('App Service ID')
param appServiceId string

@description('Database Server ID')
param databaseServerId string

@description('Storage Account ID')
param storageAccountId string

@description('Redis Cache ID')
param redisCacheId string

@description('Key Vault ID')
param keyVaultId string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Application Insights ID')
param applicationInsightsId string

@description('Admin email for alerts')
param adminEmail string

@description('Enable tax season monitoring')
param enableTaxSeasonMonitoring bool = true

@description('Tax season start date')
param taxSeasonStartDate string = '2024-01-01'

@description('Tax season end date')
param taxSeasonEndDate string = '2024-04-30'

@description('Resource tags')
param tags object

// ================================================================
// Variables
// ================================================================

var resourcePrefix = '${appName}-${environment}'
var monitoringName = '${resourcePrefix}-monitoring'

// Tax season monitoring configuration
var taxSeasonConfig = {
  enabled: enableTaxSeasonMonitoring
  startDate: taxSeasonStartDate
  endDate: taxSeasonEndDate
  enhancedMetrics: true
  alertThresholds: {
    highLoad: {
      cpuPercentage: 70
      memoryPercentage: 80
      responseTime: 3000
      errorRate: 5
    }
    criticalLoad: {
      cpuPercentage: 85
      memoryPercentage: 90
      responseTime: 5000
      errorRate: 10
    }
  }
}

// CPA-specific business metrics to monitor
var businessMetrics = [
  'client_onboarding_rate'
  'tax_return_completion_rate'
  'document_processing_time'
  'quickbooks_sync_success_rate'
  'user_session_duration'
  'revenue_per_client'
  'support_ticket_resolution_time'
]

// ================================================================
// Action Groups for Different Alert Types
// ================================================================

// Critical alerts action group
resource criticalAlertsActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${resourcePrefix}-critical-alerts'
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'Critical'
    enabled: true
    emailReceivers: [
      {
        name: 'DevOpsTeam'
        emailAddress: adminEmail
        useCommonAlertSchema: true
      }
      {
        name: 'OnCallEngineer'
        emailAddress: 'oncall@advisoros.com'
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: [
      {
        name: 'OnCallSMS'
        countryCode: '1'
        phoneNumber: '+1234567890'
      }
    ]
    webhookReceivers: [
      {
        name: 'PagerDuty'
        serviceUri: 'https://events.pagerduty.com/integration/${subscription().subscriptionId}/enqueue'
        useCommonAlertSchema: true
      }
    ]
  }
}

// Warning alerts action group
resource warningAlertsActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${resourcePrefix}-warning-alerts'
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'Warning'
    enabled: true
    emailReceivers: [
      {
        name: 'DevOpsTeam'
        emailAddress: adminEmail
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: [
      {
        name: 'SlackNotification'
        serviceUri: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        useCommonAlertSchema: true
      }
    ]
  }
}

// Business alerts action group
resource businessAlertsActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${resourcePrefix}-business-alerts'
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'Business'
    enabled: true
    emailReceivers: [
      {
        name: 'BusinessTeam'
        emailAddress: 'business@advisoros.com'
        useCommonAlertSchema: true
      }
      {
        name: 'ProductTeam'
        emailAddress: 'product@advisoros.com'
        useCommonAlertSchema: true
      }
    ]
  }
}

// ================================================================
// Application Performance Monitoring
// ================================================================

// App Service performance alerts
resource appServiceCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${resourcePrefix}-app-cpu-high'
  location: 'Global'
  tags: tags
  properties: {
    description: 'App Service CPU usage is high'
    severity: 2
    enabled: true
    scopes: [appServiceId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: taxSeasonConfig.alertThresholds.highLoad.cpuPercentage
          name: 'Metric1'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'CpuPercentage'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: warningAlertsActionGroup.id
        webHookProperties: {}
      }
    ]
  }
}

resource appServiceMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${resourcePrefix}-app-memory-high'
  location: 'Global'
  tags: tags
  properties: {
    description: 'App Service memory usage is high'
    severity: 2
    enabled: true
    scopes: [appServiceId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: taxSeasonConfig.alertThresholds.highLoad.memoryPercentage
          name: 'Metric1'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'MemoryPercentage'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: warningAlertsActionGroup.id
      }
    ]
  }
}

resource appServiceResponseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${resourcePrefix}-app-response-time-high'
  location: 'Global'
  tags: tags
  properties: {
    description: 'App Service response time is high'
    severity: 1
    enabled: true
    scopes: [appServiceId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: taxSeasonConfig.alertThresholds.highLoad.responseTime
          name: 'Metric1'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: criticalAlertsActionGroup.id
      }
    ]
  }
}

// ================================================================
// Database Performance Monitoring
// ================================================================

resource databaseCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${resourcePrefix}-db-cpu-high'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Database CPU usage is high'
    severity: 2
    enabled: true
    scopes: [databaseServerId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: 80
          name: 'Metric1'
          metricNamespace: 'Microsoft.DBforPostgreSQL/flexibleServers'
          metricName: 'cpu_percent'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: warningAlertsActionGroup.id
      }
    ]
  }
}

resource databaseConnectionAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${resourcePrefix}-db-connections-high'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Database connection count is high'
    severity: 2
    enabled: true
    scopes: [databaseServerId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: 80
          name: 'Metric1'
          metricNamespace: 'Microsoft.DBforPostgreSQL/flexibleServers'
          metricName: 'active_connections'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: warningAlertsActionGroup.id
      }
    ]
  }
}

// ================================================================
// Business Logic Monitoring (Log-based Alerts)
// ================================================================

// Tax return completion rate monitoring
resource taxReturnCompletionAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-tax-return-completion-low'
  location: location
  tags: tags
  properties: {
    displayName: 'Tax Return Completion Rate Low'
    description: 'Tax return completion rate is below expected threshold'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT1H'
    windowSize: 'PT1H'
    criteria: {
      allOf: [
        {
          query: '''
            traces
            | where timestamp > ago(1h)
            | where message contains "tax_return_completed"
            | summarize completed = count() by bin(timestamp, 1h)
            | extend expected_rate = 50
            | where completed < expected_rate
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
      actionGroups: [businessAlertsActionGroup.id]
    }
  }
}

// QuickBooks integration health monitoring
resource quickbooksHealthAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-quickbooks-sync-failures'
  location: location
  tags: tags
  properties: {
    displayName: 'QuickBooks Sync Failure Rate High'
    description: 'QuickBooks synchronization failure rate is above threshold'
    severity: 1
    enabled: true
    evaluationFrequency: 'PT15M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            traces
            | where timestamp > ago(15m)
            | where message contains "quickbooks_sync"
            | summarize total = count(), failures = countif(severityLevel >= 3) by bin(timestamp, 15m)
            | extend failure_rate = (failures * 100.0) / total
            | where failure_rate > 10
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
      actionGroups: [criticalAlertsActionGroup.id]
    }
  }
}

// Document processing bottleneck monitoring
resource documentProcessingAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${resourcePrefix}-document-processing-slow'
  location: location
  tags: tags
  properties: {
    displayName: 'Document Processing Time High'
    description: 'Document processing is taking longer than expected'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT30M'
    windowSize: 'PT30M'
    criteria: {
      allOf: [
        {
          query: '''
            traces
            | where timestamp > ago(30m)
            | where message contains "document_processing_completed"
            | extend processing_time = toreal(customDimensions["processing_time_ms"])
            | summarize avg_processing_time = avg(processing_time) by bin(timestamp, 30m)
            | where avg_processing_time > 30000
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
      actionGroups: [warningAlertsActionGroup.id]
    }
  }
}

// ================================================================
// Tax Season Specific Monitoring
// ================================================================

// Tax season load monitoring
resource taxSeasonLoadAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (enableTaxSeasonMonitoring) {
  name: '${resourcePrefix}-tax-season-high-load'
  location: location
  tags: tags
  properties: {
    displayName: 'Tax Season High Load Detected'
    description: 'System is experiencing high load during tax season'
    severity: 1
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where timestamp > ago(5m)
            | where timestamp between (datetime("${taxSeasonStartDate}") .. datetime("${taxSeasonEndDate}"))
            | summarize request_count = count(), avg_duration = avg(duration) by bin(timestamp, 5m)
            | where request_count > 1000 or avg_duration > 3000
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 2
            minFailingPeriodsToAlert: 2
          }
        }
      ]
    }
    actions: {
      actionGroups: [criticalAlertsActionGroup.id]
    }
  }
}

// Tax deadline proximity alerts
resource taxDeadlineAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (enableTaxSeasonMonitoring) {
  name: '${resourcePrefix}-tax-deadline-approaching'
  location: location
  tags: tags
  properties: {
    displayName: 'Tax Deadline Approaching - Incomplete Returns'
    description: 'Tax returns remain incomplete as deadline approaches'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT6H'
    windowSize: 'PT6H'
    criteria: {
      allOf: [
        {
          query: '''
            traces
            | where timestamp > ago(6h)
            | where message contains "tax_return_status"
            | where customDimensions["status"] in ("not_started", "in_progress")
            | where customDimensions["due_date"] <= now() + 7d
            | summarize incomplete_returns = dcount(customDimensions["return_id"])
            | where incomplete_returns > 50
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
      actionGroups: [businessAlertsActionGroup.id]
    }
  }
}

// ================================================================
// Workbook for Comprehensive Monitoring
// ================================================================

resource monitoringWorkbook 'Microsoft.Insights/workbooks@2023-06-01' = {
  name: guid('${resourcePrefix}-monitoring-workbook')
  location: location
  tags: tags
  kind: 'shared'
  properties: {
    displayName: 'AdvisorOS Production Monitoring Dashboard'
    description: 'Comprehensive monitoring dashboard for CPA practice management platform'
    serializedData: string({
      version: 'Notebook/1.0'
      items: [
        {
          type: 1
          content: {
            json: '## AdvisorOS Production Monitoring Dashboard\n\nComprehensive monitoring for the CPA practice management platform including tax season analytics, performance metrics, and business KPIs.'
          }
        }
        {
          type: 3
          content: {
            version: 'KqlItem/1.0'
            query: '''
              requests
              | where timestamp > ago(24h)
              | summarize
                  RequestCount = count(),
                  AvgDuration = avg(duration),
                  P95Duration = percentile(duration, 95),
                  ErrorRate = (countif(success == false) * 100.0) / count()
              | project
                  RequestCount,
                  AvgDuration = round(AvgDuration, 2),
                  P95Duration = round(P95Duration, 2),
                  ErrorRate = round(ErrorRate, 2)
            '''
            size: 0
            title: 'Application Performance (24h)'
            timeContext: {
              durationMs: 86400000
            }
            queryType: 0
            resourceType: 'microsoft.insights/components'
            visualization: 'table'
          }
        }
        {
          type: 3
          content: {
            version: 'KqlItem/1.0'
            query: '''
              traces
              | where timestamp > ago(24h)
              | where message contains "tax_return"
              | summarize
                  CompletedReturns = countif(message contains "completed"),
                  InProgressReturns = countif(message contains "in_progress"),
                  NotStartedReturns = countif(message contains "not_started")
              | project CompletedReturns, InProgressReturns, NotStartedReturns
            '''
            size: 0
            title: 'Tax Return Status (24h)'
            timeContext: {
              durationMs: 86400000
            }
            queryType: 0
            resourceType: 'microsoft.insights/components'
            visualization: 'piechart'
          }
        }
        {
          type: 3
          content: {
            version: 'KqlItem/1.0'
            query: '''
              traces
              | where timestamp > ago(7d)
              | where message contains "quickbooks_sync"
              | summarize
                  TotalSyncs = count(),
                  SuccessfulSyncs = countif(severityLevel <= 2),
                  FailedSyncs = countif(severityLevel >= 3)
              by bin(timestamp, 1h)
              | project timestamp, SuccessRate = (SuccessfulSyncs * 100.0) / TotalSyncs
              | render timechart
            '''
            size: 0
            title: 'QuickBooks Sync Success Rate (7d)'
            timeContext: {
              durationMs: 604800000
            }
            queryType: 0
            resourceType: 'microsoft.insights/components'
            visualization: 'timechart'
          }
        }
      ]
    })
    category: 'workbook'
    sourceId: applicationInsightsId
  }
}

// ================================================================
// Availability Tests
// ================================================================

// Critical endpoint availability test
resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${resourcePrefix}-availability-test'
  location: location
  tags: union(tags, {
    'hidden-link:${applicationInsightsId}': 'Resource'
  })
  kind: 'ping'
  properties: {
    SyntheticMonitorId: '${resourcePrefix}-availability-test'
    Name: '${resourcePrefix}-availability-test'
    Description: 'Availability test for AdvisorOS critical endpoints'
    Enabled: true
    Frequency: 300
    Timeout: 30
    Kind: 'ping'
    RetryEnabled: true
    Locations: [
      {
        Id: 'us-ca-sjc-azr'
      }
      {
        Id: 'us-tx-sn1-azr'
      }
      {
        Id: 'us-il-ch1-azr'
      }
    ]
    Configuration: {
      WebTest: '<WebTest Name="${resourcePrefix}-availability-test" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale=""><Items><Request Method="GET" Version="1.1" Url="https://${resourcePrefix}-app.azurewebsites.net/api/health" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" /></Items></WebTest>'
    }
  }
}

// Availability test alert
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${resourcePrefix}-availability-alert'
  location: 'Global'
  tags: tags
  properties: {
    description: 'AdvisorOS availability test is failing'
    severity: 0
    enabled: true
    scopes: [
      availabilityTest.id
      applicationInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: availabilityTest.id
      componentId: applicationInsightsId
      failedLocationCount: 2
    }
    actions: [
      {
        actionGroupId: criticalAlertsActionGroup.id
      }
    ]
  }
}

// ================================================================
// Custom Metrics for Business KPIs
// ================================================================

// Logic App for custom metrics collection
resource metricsCollectionLogicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: '${resourcePrefix}-metrics-collection'
  location: location
  tags: tags
  properties: {
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      triggers: {
        Recurrence: {
          type: 'Recurrence'
          recurrence: {
            frequency: 'Hour'
            interval: 1
          }
        }
      }
      actions: {
        'Collect-Business-Metrics': {
          type: 'Http'
          inputs: {
            method: 'GET'
            uri: 'https://${resourcePrefix}-app.azurewebsites.net/api/metrics/business'
            headers: {
              'Content-Type': 'application/json'
              'Authorization': 'Bearer @{parameters(\'api-key\')}'
            }
          }
        }
        'Send-To-Application-Insights': {
          type: 'Http'
          runAfter: {
            'Collect-Business-Metrics': ['Succeeded']
          }
          inputs: {
            method: 'POST'
            uri: 'https://dc.services.visualstudio.com/v2/track'
            headers: {
              'Content-Type': 'application/json'
            }
            body: {
              name: 'Microsoft.ApplicationInsights.Event'
              time: '@{utcNow()}'
              iKey: '@{parameters(\'application-insights-key\')}'
              data: {
                baseType: 'EventData'
                baseData: {
                  name: 'BusinessMetrics'
                  properties: '@body(\'Collect-Business-Metrics\')'
                }
              }
            }
          }
        }
      }
    }
    parameters: {
      'api-key': {
        type: 'String'
        value: '@{listKeys(\'${keyVaultId}\', \'2023-02-01\').value}'
      }
      'application-insights-key': {
        type: 'String'
        value: '@{reference(\'${applicationInsightsId}\', \'2020-02-02\').InstrumentationKey}'
      }
    }
  }
}

// ================================================================
// Outputs
// ================================================================

output monitoringWorkbookId string = monitoringWorkbook.id
output criticalAlertsActionGroupId string = criticalAlertsActionGroup.id
output warningAlertsActionGroupId string = warningAlertsActionGroup.id
output businessAlertsActionGroupId string = businessAlertsActionGroup.id
output availabilityTestId string = availabilityTest.id
output metricsCollectionLogicAppId string = metricsCollectionLogicApp.id

output monitoringConfig object = {
  taxSeasonMonitoring: taxSeasonConfig
  alertThresholds: taxSeasonConfig.alertThresholds
  businessMetrics: businessMetrics
  availabilityTestUrl: 'https://${resourcePrefix}-app.azurewebsites.net/api/health'
}

output dashboardUrls object = {
  workbook: 'https://portal.azure.com/#asset/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/${applicationInsightsId}/source/LogsBlade.AnalyticsShareLinkToQuery/q/${base64(monitoringWorkbook.properties.serializedData)}'
  applicationInsights: 'https://portal.azure.com/#asset/AppInsightsExtension/ComponentMenuBlade/ResourceId/${applicationInsightsId}'
  logAnalytics: 'https://portal.azure.com/#asset/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/${logAnalyticsWorkspaceId}'
}