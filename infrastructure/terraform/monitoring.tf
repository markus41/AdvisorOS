# Comprehensive Monitoring and Observability for AdvisorOS
# Application Insights, Log Analytics, Alerts, and Dashboards

# Enhanced Application Insights (updating existing configuration)
# Main Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.environment}-advisoros-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = "PerGB2018"
  retention_in_days   = var.environment == "prod" ? 90 : 30
  daily_quota_gb      = var.environment == "prod" ? 10 : 1

  tags = local.tags
}

# Update Application Insights to use the workspace
resource "azurerm_application_insights" "main" {
  name                = "${var.environment}-advisoros-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  # Sampling configuration for cost optimization
  sampling_percentage = var.environment == "prod" ? 100 : 50

  tags = local.tags
}

# Action Groups for alerting
resource "azurerm_monitor_action_group" "main" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-advisoros-alerts"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "advisoros"

  # Email notifications
  dynamic "email_receiver" {
    for_each = var.alert_email != "" ? [var.alert_email] : []
    content {
      name          = "admin-email"
      email_address = email_receiver.value
    }
  }

  # Azure Mobile App notifications
  azure_app_push_receiver {
    name         = "azure-mobile-app"
    email_address = var.alert_email != "" ? var.alert_email : "noreply@advisoros.com"
  }

  # Webhook for Slack/Teams integration
  webhook_receiver {
    name        = "webhook-alerts"
    service_uri = "https://hooks.slack.com/placeholder" # Replace with actual webhook
  }

  tags = local.tags
}

# Application Performance Alerts
resource "azurerm_monitor_metric_alert" "app_response_time" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-app-response-time-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.app.id]
  description         = "Application response time is high"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HttpResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 3 : 5 # seconds
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

resource "azurerm_monitor_metric_alert" "app_error_rate" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-app-error-rate-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.app.id]
  description         = "Application error rate is high"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

resource "azurerm_monitor_metric_alert" "app_availability" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-app-availability-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Application availability is low"
  severity            = 0
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Insights/components"
    metric_name      = "availabilityResults/availabilityPercentage"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 95
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

# Storage Account Alerts
resource "azurerm_monitor_metric_alert" "storage_availability" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-storage-availability-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_storage_account.documents.id]
  description         = "Storage account availability is low"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.Storage/storageAccounts"
    metric_name      = "Availability"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 99
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

# Redis Cache Alerts
resource "azurerm_monitor_metric_alert" "redis_cpu" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-redis-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_redis_cache.main.id]
  description         = "Redis CPU usage is high"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "percentProcessorTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

resource "azurerm_monitor_metric_alert" "redis_memory" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-redis-memory-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_redis_cache.main.id]
  description         = "Redis memory usage is high"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "usedmemorypercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

# AI Services Alerts
resource "azurerm_monitor_metric_alert" "openai_errors" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-openai-errors-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_cognitive_account.openai.id]
  description         = "OpenAI service errors are high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.CognitiveServices/accounts"
    metric_name      = "Errors"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

# Read Replica 1 Monitoring Alerts
resource "azurerm_monitor_metric_alert" "replica_1_replication_lag" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-replica-1-replication-lag-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.read_replica_1[0].id]
  description         = "Read Replica 1 replication lag is high"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "physical_replication_delay_in_seconds"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 10 # Alert if lag > 10 seconds
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.tags, {
    AlertType = "ReplicationLag"
    ReplicaId = "replica-1"
  })
}

resource "azurerm_monitor_metric_alert" "replica_1_cpu" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-replica-1-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.read_replica_1[0].id]
  description         = "Read Replica 1 CPU usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.tags, {
    AlertType = "Performance"
    ReplicaId = "replica-1"
  })
}

resource "azurerm_monitor_metric_alert" "replica_1_memory" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-replica-1-memory-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.read_replica_1[0].id]
  description         = "Read Replica 1 memory usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "memory_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.tags, {
    AlertType = "Performance"
    ReplicaId = "replica-1"
  })
}

resource "azurerm_monitor_metric_alert" "replica_1_connections" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-replica-1-connections-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.read_replica_1[0].id]
  description         = "Read Replica 1 active connections are high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT10M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "active_connections"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 150
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.tags, {
    AlertType = "Connections"
    ReplicaId = "replica-1"
  })
}

# Diagnostic settings for Read Replica 1
resource "azurerm_monitor_diagnostic_setting" "replica_1" {
  count                      = var.environment == "prod" ? 1 : 0
  name                       = "replica-1-diagnostics"
  target_resource_id         = azurerm_postgresql_flexible_server.read_replica_1[0].id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }

  tags = merge(local.tags, {
    ResourceType = "ReadReplica"
    ReplicaId = "replica-1"
  })
}

# DR Replica Monitoring Alerts (if enabled)
resource "azurerm_monitor_metric_alert" "replica_dr_replication_lag" {
  count               = var.enable_monitoring && var.environment == "prod" && var.enable_dr_replica ? 1 : 0
  name                = "${var.environment}-replica-dr-replication-lag-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.read_replica_dr[0].id]
  description         = "DR Replica replication lag is high"
  severity            = 3 # Lower severity for DR replica
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "physical_replication_delay_in_seconds"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 60 # Higher threshold for cross-region
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.tags, {
    AlertType = "ReplicationLag"
    ReplicaId = "replica-dr"
    ReplicaType = "DisasterRecovery"
  })
}

resource "azurerm_monitor_diagnostic_setting" "replica_dr" {
  count                      = var.environment == "prod" && var.enable_dr_replica ? 1 : 0
  name                       = "replica-dr-diagnostics"
  target_resource_id         = azurerm_postgresql_flexible_server.read_replica_dr[0].id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }

  tags = merge(local.tags, {
    ResourceType = "ReadReplica"
    ReplicaId = "replica-dr"
    ReplicaType = "DisasterRecovery"
  })
}

# Custom Log Analytics Queries
resource "azurerm_log_analytics_saved_search" "app_errors" {
  name                       = "Application Errors"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "Application Errors in Last Hour"

  query = <<-QUERY
    AppExceptions
    | where TimeGenerated > ago(1h)
    | summarize Count = count() by ExceptionType, bin(TimeGenerated, 5m)
    | order by TimeGenerated desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "slow_requests" {
  name                       = "Slow Requests"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "Slow Requests (>3 seconds)"

  query = <<-QUERY
    AppRequests
    | where TimeGenerated > ago(1h)
    | where DurationMs > 3000
    | project TimeGenerated, Name, Url, DurationMs, ResultCode
    | order by DurationMs desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "user_activity" {
  name                       = "User Activity"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "User Activity Summary"

  query = <<-QUERY
    AppPageViews
    | where TimeGenerated > ago(24h)
    | summarize Sessions = dcount(SessionId), PageViews = count() by bin(TimeGenerated, 1h)
    | order by TimeGenerated desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "api_performance" {
  name                       = "API Performance"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "API Endpoint Performance"

  query = <<-QUERY
    AppRequests
    | where TimeGenerated > ago(6h)
    | where Name startswith "api/"
    | summarize
        RequestCount = count(),
        AvgDuration = avg(DurationMs),
        P95Duration = percentile(DurationMs, 95),
        ErrorRate = countif(Success == false) * 100.0 / count()
    by Name
    | order by RequestCount desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "replica_replication_lag" {
  name                       = "Replica Replication Lag"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "PostgreSQL Replica Replication Lag Analysis"

  query = <<-QUERY
    AzureMetrics
    | where TimeGenerated > ago(1h)
    | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
    | where MetricName == "physical_replication_delay_in_seconds"
    | extend ReplicaName = tostring(split(ResourceId, "/")[-1])
    | summarize
        AvgLag = avg(Average),
        MaxLag = max(Maximum),
        P95Lag = percentile(Average, 95)
    by ReplicaName, bin(TimeGenerated, 5m)
    | order by TimeGenerated desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "replica_performance" {
  name                       = "Replica Performance"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "PostgreSQL Replica Performance Metrics"

  query = <<-QUERY
    AzureMetrics
    | where TimeGenerated > ago(1h)
    | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
    | where MetricName in ("cpu_percent", "memory_percent", "active_connections")
    | extend ReplicaName = tostring(split(ResourceId, "/")[-1])
    | summarize AvgValue = avg(Average), MaxValue = max(Maximum)
    by ReplicaName, MetricName, bin(TimeGenerated, 5m)
    | order by TimeGenerated desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "database_slow_queries" {
  name                       = "Database Slow Queries"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "AdvisorOS"
  display_name              = "PostgreSQL Slow Queries Analysis"

  query = <<-QUERY
    AzureDiagnostics
    | where TimeGenerated > ago(1h)
    | where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
    | where Category == "PostgreSQLLogs"
    | where Message contains "duration"
    | extend QueryDuration = extract("duration: ([0-9.]+) ms", 1, Message)
    | where todouble(QueryDuration) > 1000
    | project TimeGenerated, ResourceId, QueryDuration, Message
    | order by todouble(QueryDuration) desc
    | take 50
  QUERY
}

# Availability Tests
resource "azurerm_application_insights_web_test" "homepage" {
  count                   = var.enable_monitoring ? 1 : 0
  name                    = "${var.environment}-homepage-availability"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  application_insights_id = azurerm_application_insights.main.id
  kind                   = "ping"
  frequency              = 300
  timeout                = 30
  enabled                = true
  geo_locations          = ["us-ca-sjc-azr", "us-tx-sn1-azr", "us-il-ch1-azr"]

  configuration = <<XML
<WebTest Name="${var.environment}-homepage-availability" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale="">
  <Items>
    <Request Method="GET" Guid="a5f10126-e4cd-570d-961c-cea43999a200" Version="1.1" Url="${var.app_url}" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML

  tags = local.tags
}

resource "azurerm_application_insights_web_test" "api_health" {
  count                   = var.enable_monitoring ? 1 : 0
  name                    = "${var.environment}-api-health-check"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  application_insights_id = azurerm_application_insights.main.id
  kind                   = "ping"
  frequency              = 300
  timeout                = 30
  enabled                = true
  geo_locations          = ["us-ca-sjc-azr", "us-tx-sn1-azr"]

  configuration = <<XML
<WebTest Name="${var.environment}-api-health-check" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale="">
  <Items>
    <Request Method="GET" Guid="a5f10126-e4cd-570d-961c-cea43999a201" Version="1.1" Url="${var.app_url}/api/health" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML

  tags = local.tags
}

# Availability test alerts
resource "azurerm_monitor_metric_alert" "availability_test" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-availability-test-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Availability test is failing"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Insights/components"
    metric_name      = "availabilityResults/availabilityPercentage"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 90

    dimension {
      name     = "availabilityResult/name"
      operator = "Include"
      values   = var.enable_monitoring ? [azurerm_application_insights_web_test.homepage[0].name] : []
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.tags
}

# Smart Detection Rules (automatically detect anomalies)
resource "azurerm_application_insights_smart_detection_rule" "failure_anomalies" {
  name                    = "Failure Anomalies"
  application_insights_id = azurerm_application_insights.main.id
  enabled                = true
  send_emails_to_subscription_owners = false

  additional_email_recipients = var.alert_email != "" ? [var.alert_email] : []
}

resource "azurerm_application_insights_smart_detection_rule" "performance_anomalies" {
  name                    = "Performance Anomalies"
  application_insights_id = azurerm_application_insights.main.id
  enabled                = true
  send_emails_to_subscription_owners = false

  additional_email_recipients = var.alert_email != "" ? [var.alert_email] : []
}

# Diagnostic Settings for all critical resources
resource "azurerm_monitor_diagnostic_setting" "app_service" {
  name                       = "app-service-diagnostics"
  target_resource_id         = azurerm_linux_web_app.app.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  enabled_log {
    category = "AppServiceAuditLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "redis" {
  name                       = "redis-diagnostics"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "application_gateway" {
  name                       = "appgw-diagnostics"
  target_resource_id         = azurerm_application_gateway.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "ApplicationGatewayAccessLog"
  }

  enabled_log {
    category = "ApplicationGatewayPerformanceLog"
  }

  enabled_log {
    category = "ApplicationGatewayFirewallLog"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}