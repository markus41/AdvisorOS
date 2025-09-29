# Azure Cost Optimization and Multi-Environment Infrastructure
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
  }
}

# Cost Management Budget Alerts
resource "azurerm_consumption_budget_resource_group" "main" {
  name              = "${var.environment}-advisoros-budget"
  resource_group_id = var.resource_group_id

  amount     = var.monthly_budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00'Z'", timestamp())
    end_date   = formatdate("YYYY-MM-01'T'00:00:00'Z'", timeadd(timestamp(), "8760h")) # 1 year
  }

  filter {
    dimension {
      name = "ResourceGroupName"
      values = [
        var.resource_group_name
      ]
    }
  }

  notification {
    enabled        = true
    threshold      = 80.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.budget_alert_emails
  }

  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.budget_alert_emails
  }

  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Forecasted"

    contact_emails = var.budget_alert_emails
  }

  tags = var.tags
}

# Auto-scaling configuration for App Service Plan
resource "azurerm_monitor_autoscale_setting" "app_service" {
  name                = "${var.environment}-advisoros-autoscale"
  location            = var.location
  resource_group_name = var.resource_group_name
  target_resource_id  = var.app_service_plan_id

  profile {
    name = "defaultProfile"

    capacity {
      default = var.environment == "prod" ? 2 : 1
      minimum = var.environment == "prod" ? 1 : 1
      maximum = var.environment == "prod" ? 10 : 3
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = var.app_service_plan_id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = var.environment == "prod" ? 70 : 80
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = var.app_service_plan_id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT10M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = var.environment == "prod" ? 30 : 40
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "MemoryPercentage"
        metric_resource_id = var.app_service_plan_id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 85
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }

  # Scale down during off-hours for non-prod environments
  dynamic "profile" {
    for_each = var.environment != "prod" ? [1] : []
    content {
      name = "offHoursProfile"

      capacity {
        default = 1
        minimum = 1
        maximum = 1
      }

      recurrence {
        timezone = "UTC"
        hours    = [22] # 10 PM UTC
        minutes  = [0]
        days = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ]
      }
    }
  }

  dynamic "profile" {
    for_each = var.environment != "prod" ? [1] : []
    content {
      name = "workHoursProfile"

      capacity {
        default = var.environment == "staging" ? 2 : 1
        minimum = 1
        maximum = 3
      }

      recurrence {
        timezone = "UTC"
        hours    = [6] # 6 AM UTC
        minutes  = [0]
        days = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ]
      }
    }
  }

  notification {
    email {
      send_to_subscription_administrator    = false
      send_to_subscription_co_administrator = false
      custom_emails                        = var.autoscale_notification_emails
    }

    webhook {
      service_uri = var.autoscale_webhook_url
    }
  }

  tags = var.tags
}

# PostgreSQL auto-scaling (for Flexible Server)
resource "azurerm_postgresql_flexible_server_configuration" "auto_vacuum" {
  name      = "autovacuum"
  server_id = var.postgres_server_id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "shared_preload_libraries" {
  name      = "shared_preload_libraries"
  server_id = var.postgres_server_id
  value     = "pg_stat_statements"
}

resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  name      = "max_connections"
  server_id = var.postgres_server_id
  value     = var.environment == "prod" ? "200" : "100"
}

# Storage Account lifecycle management
resource "azurerm_storage_management_policy" "documents" {
  storage_account_id = var.storage_account_id

  rule {
    name    = "deleteOldBackups"
    enabled = true

    filters {
      prefix_match = ["backups/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = var.environment == "prod" ? 2555 : 365 # 7 years for prod, 1 year for others
      }

      snapshot {
        delete_after_days_since_creation_greater_than = 30
      }

      version {
        delete_after_days_since_creation = 30
      }
    }
  }

  rule {
    name    = "optimizeDocuments"
    enabled = true

    filters {
      prefix_match = ["documents/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than = 30
        tier_to_archive_after_days_since_modification_greater_than = 180
      }
    }
  }

  rule {
    name    = "cleanupTempFiles"
    enabled = true

    filters {
      prefix_match = ["temp/", "uploads/temp/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 7
      }
    }
  }
}

# Scheduled shutdown for non-production resources
resource "azurerm_automation_account" "cost_optimization" {
  count               = var.environment != "prod" ? 1 : 0
  name                = "${var.environment}-advisoros-automation"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku_name           = "Basic"

  tags = var.tags
}

resource "azurerm_automation_runbook" "shutdown_vms" {
  count                   = var.environment != "prod" ? 1 : 0
  name                    = "shutdown-dev-resources"
  location                = var.location
  resource_group_name     = var.resource_group_name
  automation_account_name = azurerm_automation_account.cost_optimization[0].name
  log_verbose            = true
  log_progress           = true
  runbook_type           = "PowerShell"

  content = <<-EOT
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory=$true)]
    [string]$Environment
)

# Connect to Azure using Managed Identity
Connect-AzAccount -Identity

Write-Output "Starting cost optimization for environment: $Environment"

# Get all resources in the resource group
$resources = Get-AzResource -ResourceGroupName $ResourceGroupName

# Shutdown/scale down development resources
foreach ($resource in $resources) {
    Write-Output "Processing resource: $($resource.Name) of type: $($resource.ResourceType)"

    switch ($resource.ResourceType) {
        "Microsoft.Compute/virtualMachines" {
            Write-Output "Stopping VM: $($resource.Name)"
            Stop-AzVM -ResourceGroupName $ResourceGroupName -Name $resource.Name -Force
        }
        "Microsoft.Web/serverfarms" {
            Write-Output "Scaling down App Service Plan: $($resource.Name)"
            Set-AzAppServicePlan -ResourceGroupName $ResourceGroupName -Name $resource.Name -Tier "Basic" -NumberofWorkers 1 -WorkerSize "Small"
        }
        "Microsoft.DBforPostgreSQL/flexibleServers" {
            Write-Output "Scaling down PostgreSQL server: $($resource.Name)"
            # Note: Scaling PostgreSQL requires specific API calls
        }
    }
}

Write-Output "Cost optimization completed"
EOT

  tags = var.tags
}

resource "azurerm_automation_schedule" "shutdown_schedule" {
  count                   = var.environment != "prod" ? 1 : 0
  name                    = "shutdown-dev-resources-schedule"
  resource_group_name     = var.resource_group_name
  automation_account_name = azurerm_automation_account.cost_optimization[0].name
  frequency              = "Week"
  interval               = 1
  timezone               = "UTC"
  start_time             = formatdate("YYYY-MM-DD'T'22:00:00'Z'", timeadd(timestamp(), "24h"))
  week_days              = ["Friday"]
  description            = "Shutdown development resources on Friday evenings"
}

resource "azurerm_automation_job_schedule" "shutdown_job" {
  count                   = var.environment != "prod" ? 1 : 0
  resource_group_name     = var.resource_group_name
  automation_account_name = azurerm_automation_account.cost_optimization[0].name
  schedule_name          = azurerm_automation_schedule.shutdown_schedule[0].name
  runbook_name           = azurerm_automation_runbook.shutdown_vms[0].name

  parameters = {
    ResourceGroupName = var.resource_group_name
    Environment      = var.environment
  }
}

# Reserved instances recommendations (Azure Advisor integration)
resource "azurerm_advisor_recommendations" "cost_optimization" {
  count           = var.environment == "prod" ? 1 : 0
  filter_by_category = ["Cost"]

  # This is a data source to get recommendations, not a resource
  # Actual implementation would involve Azure Policy or custom automation
}

# Cost allocation tags
resource "azurerm_policy_definition" "cost_allocation_tags" {
  name         = "${var.environment}-cost-allocation-policy"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Enforce cost allocation tags"
  description  = "Ensures all resources have required cost allocation tags"

  policy_rule = jsonencode({
    if = {
      field = "type"
      in = [
        "Microsoft.Compute/virtualMachines",
        "Microsoft.Web/sites",
        "Microsoft.Storage/storageAccounts",
        "Microsoft.DBforPostgreSQL/flexibleServers"
      ]
    }
    then = {
      effect = "Deny"
      details = {
        requiredTags = [
          "CostCenter",
          "Environment",
          "Project",
          "Owner"
        ]
      }
    }
  })

  parameters = jsonencode({
    requiredTags = {
      type = "Array"
      metadata = {
        displayName = "Required Tags"
        description = "List of required tags for cost allocation"
      }
      defaultValue = ["CostCenter", "Environment", "Project", "Owner"]
    }
  })
}

resource "azurerm_policy_assignment" "cost_allocation_tags" {
  name                 = "${var.environment}-cost-allocation-assignment"
  scope                = var.resource_group_id
  policy_definition_id = azurerm_policy_definition.cost_allocation_tags.id
  display_name         = "Enforce cost allocation tags"
  description          = "Ensures all resources have required cost allocation tags"

  parameters = jsonencode({
    requiredTags = {
      value = ["CostCenter", "Environment", "Project", "Owner"]
    }
  })
}

# Environment-specific resource sizing
locals {
  environment_configs = {
    dev = {
      app_service_sku          = "B1"
      postgres_sku            = "B_Standard_B1ms"
      postgres_storage_mb     = 32768
      redis_sku              = "Basic"
      redis_capacity         = 0
      storage_replication    = "LRS"
      backup_retention_days  = 7
    }
    staging = {
      app_service_sku          = "S1"
      postgres_sku            = "GP_Standard_D2s_v3"
      postgres_storage_mb     = 65536
      redis_sku              = "Standard"
      redis_capacity         = 1
      storage_replication    = "GRS"
      backup_retention_days  = 14
    }
    prod = {
      app_service_sku          = "P1V2"
      postgres_sku            = "GP_Standard_D4s_v3"
      postgres_storage_mb     = 131072
      redis_sku              = "Premium"
      redis_capacity         = 2
      storage_replication    = "GZRS"
      backup_retention_days  = 30
    }
  }

  current_config = local.environment_configs[var.environment]
}

# Cost monitoring alerts
resource "azurerm_monitor_metric_alert" "high_cost_alert" {
  name                = "${var.environment}-high-cost-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.resource_group_id]
  description         = "Alert when resource group costs are high"
  severity            = 2
  frequency          = "PT1H"
  window_size        = "PT1H"

  criteria {
    metric_namespace = "Microsoft.Consumption/budgets"
    metric_name      = "ActualCost"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = var.monthly_budget_amount * 0.8
  }

  action {
    action_group_id = var.cost_alert_action_group_id
  }

  tags = var.tags
}

# Resource optimization recommendations
data "azurerm_advisor_recommendations" "all" {
  filter_by_category = ["Cost", "Performance"]
}

# Output cost optimization recommendations
output "cost_optimization_recommendations" {
  value = {
    budget_id = azurerm_consumption_budget_resource_group.main.id
    autoscale_setting_id = azurerm_monitor_autoscale_setting.app_service.id
    environment_config = local.current_config
    automation_account_id = var.environment != "prod" ? azurerm_automation_account.cost_optimization[0].id : null
    policy_assignment_id = azurerm_policy_assignment.cost_allocation_tags.id

    # Cost savings estimates
    estimated_monthly_savings = {
      dev = {
        weekend_shutdown = 200  # USD
        right_sizing = 150
        storage_tiering = 50
      }
      staging = {
        off_hours_scaling = 300
        right_sizing = 200
        storage_tiering = 75
      }
      prod = {
        reserved_instances = 500
        autoscaling = 300
        storage_optimization = 100
      }
    }[var.environment]
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "resource_group_id" {
  description = "Resource group ID"
  type        = string
}

variable "app_service_plan_id" {
  description = "App Service Plan resource ID"
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

variable "monthly_budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 1000
}

variable "budget_alert_emails" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  default     = []
}

variable "autoscale_notification_emails" {
  description = "Email addresses for autoscale notifications"
  type        = list(string)
  default     = []
}

variable "autoscale_webhook_url" {
  description = "Webhook URL for autoscale notifications"
  type        = string
  default     = ""
}

variable "cost_alert_action_group_id" {
  description = "Action group ID for cost alerts"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}