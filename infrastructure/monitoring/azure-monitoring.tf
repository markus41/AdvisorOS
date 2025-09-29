# Azure Monitoring and Alerting Infrastructure
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
  }
}

# Application Insights with comprehensive telemetry
resource "azurerm_application_insights" "main" {
  name                = "${var.environment}-advisoros-insights"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"

  retention_in_days   = var.environment == "prod" ? 90 : 30
  daily_data_cap_in_gb = var.environment == "prod" ? 10 : 1

  tags = var.tags
}

# Log Analytics Workspace for centralized logging
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.environment}-advisoros-logs"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                = "PerGB2018"
  retention_in_days   = var.environment == "prod" ? 90 : 30

  tags = var.tags
}

# Application Insights Smart Detection Rules
resource "azurerm_application_insights_smart_detection_rule" "failure_anomalies" {
  name                    = "Failure Anomalies"
  application_insights_id = azurerm_application_insights.main.id
  enabled                = true
  send_emails_to_subscription_owners = true
  additional_email_recipients = var.alert_email_recipients
}

resource "azurerm_application_insights_smart_detection_rule" "performance_anomalies" {
  name                    = "Performance Anomalies"
  application_insights_id = azurerm_application_insights.main.id
  enabled                = true
  send_emails_to_subscription_owners = true
  additional_email_recipients = var.alert_email_recipients
}

# Action Group for notifications
resource "azurerm_monitor_action_group" "main" {
  name                = "${var.environment}-advisoros-alerts"
  resource_group_name = var.resource_group_name
  short_name         = "aosalerts"

  dynamic "email_receiver" {
    for_each = var.alert_email_recipients
    content {
      name          = "email-${email_receiver.key}"
      email_address = email_receiver.value
    }
  }

  webhook_receiver {
    name        = "slack-webhook"
    service_uri = var.slack_webhook_url
    use_common_alert_schema = true
  }

  tags = var.tags
}

# Database Performance Alerts
resource "azurerm_monitor_metric_alert" "database_cpu" {
  name                = "${var.environment}-db-cpu-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgres_server_id]
  description         = "Database CPU utilization is high"
  severity            = 2
  frequency          = "PT1M"
  window_size        = "PT5M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 80 : 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "database_memory" {
  name                = "${var.environment}-db-memory-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgres_server_id]
  description         = "Database memory utilization is high"
  severity            = 2
  frequency          = "PT1M"
  window_size        = "PT5M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "memory_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 85 : 90
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "database_connections" {
  name                = "${var.environment}-db-connections-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgres_server_id]
  description         = "Database connection count is high"
  severity            = 1
  frequency          = "PT1M"
  window_size        = "PT5M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "active_connections"
    aggregation      = "Maximum"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 80 : 50
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Application Performance Alerts
resource "azurerm_monitor_metric_alert" "app_response_time" {
  name                = "${var.environment}-app-response-time-alert"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Application response time is high"
  severity            = 2
  frequency          = "PT1M"
  window_size        = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 2000 : 5000  # milliseconds
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "app_failure_rate" {
  name                = "${var.environment}-app-failure-rate-alert"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Application failure rate is high"
  severity            = 1
  frequency          = "PT1M"
  window_size        = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 5 : 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Storage Account Monitoring
resource "azurerm_monitor_metric_alert" "storage_availability" {
  name                = "${var.environment}-storage-availability-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.storage_account_id]
  description         = "Storage account availability is low"
  severity            = 1
  frequency          = "PT1M"
  window_size        = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Storage/storageAccounts"
    metric_name      = "Availability"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 99.0
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Custom Log Queries for Security Monitoring
resource "azurerm_monitor_scheduled_query_rules_alert" "failed_login_attempts" {
  name                = "${var.environment}-failed-login-alert"
  location            = var.location
  resource_group_name = var.resource_group_name

  action {
    action_group = [azurerm_monitor_action_group.main.id]
    email_subject = "Security Alert: Multiple Failed Login Attempts"
  }

  data_source_id = azurerm_log_analytics_workspace.main.id
  description    = "Alert when there are multiple failed login attempts"
  enabled        = true
  frequency      = 5
  query          = <<-QUERY
    AppTraces
    | where TimeGenerated > ago(5m)
    | where Message contains "Failed login attempt"
    | summarize FailedAttempts = count() by UserEmail = tostring(Properties["userEmail"])
    | where FailedAttempts >= 5
  QUERY

  severity    = 1
  time_window = 5
  trigger {
    operator  = "GreaterThan"
    threshold = 0
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "high_error_rate" {
  name                = "${var.environment}-high-error-rate-alert"
  location            = var.location
  resource_group_name = var.resource_group_name

  action {
    action_group = [azurerm_monitor_action_group.main.id]
    email_subject = "Application Alert: High Error Rate Detected"
  }

  data_source_id = azurerm_log_analytics_workspace.main.id
  description    = "Alert when application error rate exceeds threshold"
  enabled        = true
  frequency      = 5
  query          = <<-QUERY
    AppExceptions
    | where TimeGenerated > ago(5m)
    | summarize ErrorCount = count()
    | where ErrorCount > 10
  QUERY

  severity    = 2
  time_window = 5
  trigger {
    operator  = "GreaterThan"
    threshold = 0
  }

  tags = var.tags
}

# Availability Tests
resource "azurerm_application_insights_web_test" "health_check" {
  name                    = "${var.environment}-health-check-test"
  location                = var.location
  resource_group_name     = var.resource_group_name
  application_insights_id = azurerm_application_insights.main.id
  kind                   = "ping"
  frequency              = 300
  timeout                = 30
  enabled                = true
  geo_locations          = ["us-ca-sjc-azr", "us-tx-sn1-azr", "us-il-ch1-azr"]

  configuration = <<XML
<WebTest Name="${var.environment}-health-check" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialsUserName="" CredentialsPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale="">
  <Items>
    <Request Method="GET" Version="1.1" Url="${var.app_url}/api/health" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML

  tags = var.tags
}

# Dashboard for Operations Team
resource "azurerm_portal_dashboard" "operations" {
  name                = "${var.environment}-advisoros-operations-dashboard"
  resource_group_name = var.resource_group_name
  location            = var.location

  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          "0" = {
            position = {
              x = 0
              y = 0
              rowSpan = 2
              colSpan = 6
            }
            metadata = {
              inputs = [
                {
                  name = "resourceTypeMode"
                  isOptional = true
                }
              ]
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  options = {
                    chart = {
                      metrics = [
                        {
                          resourceMetadata = {
                            id = azurerm_application_insights.main.id
                          }
                          name = "requests/rate"
                          aggregationType = 4
                          namespace = "Microsoft.Insights/components"
                          metricVisualization = {
                            displayName = "Server requests"
                          }
                        }
                      ]
                      title = "Request Rate"
                      titleKind = 1
                      visualization = {
                        chartType = 2
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    metadata = {
      model = {
        timeRange = {
          value = {
            relative = {
              duration = 24
              timeUnit = 1
            }
          }
          type = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
      }
    }
  })

  tags = var.tags
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "postgres_server_id" {
  description = "PostgreSQL server resource ID"
  type        = string
}

variable "storage_account_id" {
  description = "Storage account resource ID"
  type        = string
}

variable "app_url" {
  description = "Application URL for health checks"
  type        = string
}

variable "alert_email_recipients" {
  description = "List of email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

# Outputs
output "application_insights_id" {
  value = azurerm_application_insights.main.id
}

output "application_insights_instrumentation_key" {
  value = azurerm_application_insights.main.instrumentation_key
}

output "application_insights_connection_string" {
  value = azurerm_application_insights.main.connection_string
}

output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.main.id
}

output "action_group_id" {
  value = azurerm_monitor_action_group.main.id
}