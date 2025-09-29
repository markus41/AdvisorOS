// AdvisorOS Production Monitoring Dashboard Configuration
// Comprehensive Azure Monitor, Application Insights, and Log Analytics Setup

@description('Environment name (prod, staging, dev)')
param environment string = 'prod'

@description('Location for resources')
param location string = resourceGroup().location

@description('Resource name prefix')
param namePrefix string = 'advisoros'

@description('Application Insights workspace resource ID')
param workspaceId string

@description('Tags for resources')
param tags object = {
  Environment: environment
  Project: 'AdvisorOS'
  CreatedBy: 'MultiAgentFramework'
  LaunchDate: utcNow('yyyy-MM-dd')
}

// Variables
var dashboardName = '${namePrefix}-${environment}-monitoring-dashboard'
var workbookName = '${namePrefix}-${environment}-monitoring-workbook'
var alertRulesPrefix = '${namePrefix}-${environment}'

// Application Insights for comprehensive monitoring
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-${environment}-appinsights'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceId
    IngestionMode: 'LogAnalytics'
    RetentionInDays: 90
    SamplingPercentage: 100
    DisableIpMasking: false
    DisableLocalAuth: false
  }
}

// Log Analytics Workspace for centralized logging
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${namePrefix}-${environment}-logs'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Action Group for Alert Notifications
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${alertRulesPrefix}-alerts-actiongroup'
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'AdvisorOSAlerts'
    enabled: true
    emailReceivers: [
      {
        name: 'DevOpsTeam'
        emailAddress: 'devops@advisoros.com'
        useCommonAlertSchema: true
      }
      {
        name: 'SecurityTeam'
        emailAddress: 'security@advisoros.com'
        useCommonAlertSchema: true
      }
      {
        name: 'ProductTeam'
        emailAddress: 'product@advisoros.com'
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: [
      {
        name: 'OnCallEngineer'
        countryCode: '1'
        phoneNumber: '+1-555-ON-CALL'
      }
    ]
    webhookReceivers: [
      {
        name: 'SlackIntegration'
        serviceUri: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        useCommonAlertSchema: true
      }
    ]
    azureFunctionReceivers: []
    logicAppReceivers: []
  }
}

// Critical Alert Rules
resource criticalErrorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulesPrefix}-critical-error-rate'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when error rate exceeds 1% (critical threshold)'
    severity: 0
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulesPrefix}-response-time-critical'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when response time exceeds 5 seconds (critical threshold)'
    severity: 0
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 5000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulesPrefix}-availability-critical'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when availability drops below 99%'
    severity: 0
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Availability'
          metricName: 'availabilityResults/availabilityPercentage'
          operator: 'LessThan'
          threshold: 99
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Warning Level Alerts
resource warningErrorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulesPrefix}-warning-error-rate'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when error rate exceeds 0.5% (warning threshold)'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource warningResponseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulesPrefix}-warning-response-time'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when response time exceeds 2 seconds (warning threshold)'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 2000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Security Monitoring Alerts
resource securityAlert 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: '${alertRulesPrefix}-security-incidents'
  location: location
  tags: tags
  properties: {
    displayName: 'Security Incident Detection'
    description: 'Alert on suspicious security activities'
    severity: 0
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      logAnalyticsWorkspace.id
    ]
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          query: '''
            SecurityEvent
            | where TimeGenerated > ago(5m)
            | where EventID in (4625, 4648, 4771, 4776)
            | summarize Count = count() by Computer, Account
            | where Count > 5
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
        actionGroup.id
      ]
    }
  }
}

// Performance Monitoring Alerts
resource performanceAlert 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: '${alertRulesPrefix}-performance-degradation'
  location: location
  tags: tags
  properties: {
    displayName: 'Performance Degradation Detection'
    description: 'Alert on performance degradation patterns'
    severity: 1
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      appInsights.id
    ]
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where timestamp > ago(5m)
            | summarize
                RequestCount = count(),
                AvgDuration = avg(duration),
                P95Duration = percentile(duration, 95)
            | where RequestCount > 100 and P95Duration > 3000
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
        actionGroup.id
      ]
    }
  }
}

// Business Metrics Monitoring
resource businessMetricsAlert 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: '${alertRulesPrefix}-business-metrics'
  location: location
  tags: tags
  properties: {
    displayName: 'Business Metrics Anomaly Detection'
    description: 'Alert on unusual business metric patterns'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT15M'
    scopes: [
      appInsights.id
    ]
    windowSize: 'PT30M'
    criteria: {
      allOf: [
        {
          query: '''
            customEvents
            | where timestamp > ago(30m)
            | where name in ("UserLogin", "DocumentUpload", "PaymentProcessed")
            | summarize Count = count() by name
            | extend Threshold = case(
                name == "UserLogin", 100,
                name == "DocumentUpload", 50,
                name == "PaymentProcessed", 10,
                0
            )
            | where Count < Threshold
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
        actionGroup.id
      ]
    }
  }
}

// Azure Dashboard for Real-time Monitoring
resource monitoringDashboard 'Microsoft.Portal/dashboards@2020-09-01-preview' = {
  name: dashboardName
  location: location
  tags: tags
  properties: {
    lenses: [
      {
        order: 0
        parts: [
          {
            position: {
              x: 0
              y: 0
              rowSpan: 4
              colSpan: 6
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsights.id
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AspNetOverviewPinnedPart'
            }
          }
          {
            position: {
              x: 6
              y: 0
              rowSpan: 4
              colSpan: 6
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsights.id
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/ProactiveDetectionAsyncPart'
            }
          }
          {
            position: {
              x: 0
              y: 4
              rowSpan: 3
              colSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsights.id
                }
                {
                  name: 'MetricName'
                  value: 'requests/count'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/MetricChartPinnedPart'
            }
          }
          {
            position: {
              x: 4
              y: 4
              rowSpan: 3
              colSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsights.id
                }
                {
                  name: 'MetricName'
                  value: 'requests/duration'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/MetricChartPinnedPart'
            }
          }
          {
            position: {
              x: 8
              y: 4
              rowSpan: 3
              colSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsights.id
                }
                {
                  name: 'MetricName'
                  value: 'exceptions/count'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/MetricChartPinnedPart'
            }
          }
        ]
      }
    ]
    metadata: {
      model: {
        timeRange: {
          value: {
            relative: {
              duration: 24
              timeUnit: 1
            }
          }
          type: 'MsPortalFx.Composition.Configuration.ValueTypes.TimeRange'
        }
        filterLocale: {
          value: 'en-us'
        }
        filters: {
          value: {
            MsPortalFx_TimeRange: {
              model: {
                format: 'utc'
                granularity: 'auto'
                relative: '24h'
              }
              displayCache: {
                name: 'UTC Time'
                value: 'Past 24 hours'
              }
              filteredPartIds: []
            }
          }
        }
      }
    }
  }
}

// Custom Workbook for Advanced Analytics
resource monitoringWorkbook 'Microsoft.Insights/workbooks@2022-04-01' = {
  name: guid(workbookName)
  location: location
  tags: tags
  kind: 'shared'
  properties: {
    displayName: workbookName
    serializedData: '''
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "# AdvisorOS Production Monitoring Dashboard\\n\\nComprehensive monitoring for all Wave 0-3 features and critical system components."
      },
      "name": "text - header"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "requests\\n| where timestamp > ago(24h)\\n| summarize \\n    TotalRequests = count(),\\n    SuccessfulRequests = countif(success == true),\\n    FailedRequests = countif(success == false),\\n    AvgResponseTime = avg(duration),\\n    P95ResponseTime = percentile(duration, 95)\\n| extend SuccessRate = round(SuccessfulRequests * 100.0 / TotalRequests, 2)",
        "size": 0,
        "title": "System Health Overview (24h)",
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - system health"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "customEvents\\n| where timestamp > ago(24h)\\n| where name in (\\\"UserLogin\\\", \\\"DocumentUpload\\\", \\\"WorkflowExecution\\\", \\\"QuickBooksSync\\\", \\\"PaymentProcessed\\\")\\n| summarize Count = count() by name, bin(timestamp, 1h)\\n| render timechart",
        "size": 0,
        "title": "Business Activity Trends",
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - business metrics"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "exceptions\\n| where timestamp > ago(24h)\\n| summarize Count = count() by type, bin(timestamp, 1h)\\n| render timechart",
        "size": 0,
        "title": "Error Patterns",
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - errors"
    }
  ],
  "fallbackResourceIds": [
    "''' + appInsights.id + '''"
  ],
  "fromTemplateId": "sentinel-UserWorkbook"
}
'''
    category: 'workbook'
    sourceId: appInsights.id
  }
}

// Outputs
output appInsightsId string = appInsights.id
output appInsightsKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
output dashboardId string = monitoringDashboard.id
output workbookId string = monitoringWorkbook.id
output actionGroupId string = actionGroup.id