# App Service for Next.js Application
# Replacing Static Web App for full Next.js SSR support

# App Service Plan with auto-scaling
resource "azurerm_service_plan" "app" {
  name                = "${var.environment}-advisoros-app-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type            = "Linux"
  sku_name           = var.environment == "prod" ? "P2v3" : "S1"

  tags = local.tags
}

# App Service for Next.js
resource "azurerm_linux_web_app" "app" {
  name                = "${var.environment}-advisoros-app"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.app.id

  # HTTPS only for security
  https_only = true

  site_config {
    always_on         = var.environment == "prod"
    health_check_path = "/api/health"

    application_stack {
      node_version = "18-lts"
    }

    # Auto-healing configuration
    auto_heal_enabled = true
    auto_heal_setting {
      trigger {
        requests {
          count    = 100
          interval = "00:05:00"
        }
        status_code {
          status_code_range = "500-599"
          count            = 10
          interval         = "00:05:00"
        }
        slow_request {
          count      = 10
          interval   = "00:05:00"
          time_taken = "00:01:00"
        }
      }
      action {
        action_type = "Recycle"
      }
    }

    # CORS configuration
    cors {
      allowed_origins     = var.allowed_origins
      support_credentials = true
    }

    # IP restrictions for production
    dynamic "ip_restriction" {
      for_each = var.environment == "prod" && length(var.allowed_ip_ranges) > 0 ? var.allowed_ip_ranges : []
      content {
        ip_address = ip_restriction.value
        action     = "Allow"
        priority   = 100 + ip_restriction.key
        name       = "AllowedIP${ip_restriction.key}"
      }
    }
  }

  # Application settings
  app_settings = {
    # Next.js configuration
    "NEXTAUTH_URL"                     = var.app_url
    "NEXTAUTH_SECRET"                 = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.nextauth_secret.id})"

    # Database
    "DATABASE_URL"                    = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.database_url.id})"

    # Azure services
    "AZURE_STORAGE_CONNECTION_STRING" = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.storage_connection.id})"
    "APPLICATION_INSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string

    # QuickBooks
    "QUICKBOOKS_CLIENT_ID"            = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.quickbooks_client_id.id})"
    "QUICKBOOKS_CLIENT_SECRET"        = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.quickbooks_client_secret.id})"
    "QUICKBOOKS_SANDBOX"              = var.environment != "prod" ? "true" : "false"

    # Stripe
    "STRIPE_SECRET_KEY"               = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.stripe_secret_key.id})"
    "STRIPE_PUBLISHABLE_KEY"          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.stripe_publishable_key.id})"

    # SendGrid
    "SENDGRID_API_KEY"                = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.sendgrid_api_key.id})"

    # Azure AI Services
    "AZURE_OPENAI_ENDPOINT"           = azurerm_cognitive_account.openai.endpoint
    "AZURE_OPENAI_API_KEY"            = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.openai_api_key.id})"
    "AZURE_FORM_RECOGNIZER_ENDPOINT"  = azurerm_cognitive_account.form_recognizer.endpoint
    "AZURE_FORM_RECOGNIZER_API_KEY"   = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.form_recognizer_api_key.id})"

    # Redis Cache
    "REDIS_URL"                       = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.redis_connection.id})"

    # Node.js optimization
    "NODE_ENV"                        = var.environment == "prod" ? "production" : "development"
    "NODE_OPTIONS"                    = "--max-old-space-size=1024"

    # Build and deployment
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "ENABLE_ORYX_BUILD"               = "true"
    "PRE_BUILD_COMMAND"               = "npm ci"
    "POST_BUILD_COMMAND"              = "npm run build"

    # Performance monitoring
    "WEBSITE_TIME_ZONE"               = "Eastern Standard Time"
    "WEBSITE_LOCAL_CACHE_OPTION"      = "Always"
    "WEBSITE_LOCAL_CACHE_SIZEINMB"    = "1000"
  }

  # Connection strings for better performance
  connection_string {
    name  = "DefaultConnection"
    type  = "PostgreSQL"
    value = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.database_url.id})"
  }

  # Managed identity for Key Vault access
  identity {
    type         = "SystemAssigned, UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.main.id]
  }

  # Backup configuration
  backup {
    name                = "${var.environment}-advisoros-backup"
    enabled             = var.environment == "prod"
    storage_account_url = var.environment == "prod" ? "${azurerm_storage_account.backups[0].primary_blob_endpoint}${azurerm_storage_container.app_backups[0].name}${data.azurerm_storage_account_blob_container_sas.backup[0].sas}" : null

    schedule {
      frequency_interval       = 1
      frequency_unit          = "Day"
      retention_period_in_days = var.backup_retention_days
      start_time              = "2023-01-01T02:00:00Z"
    }
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    application_logs {
      file_system_level = var.environment == "prod" ? "Information" : "Verbose"
    }

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 100
      }
    }
  }

  tags = local.tags
}

# Auto-scaling settings for App Service Plan
resource "azurerm_monitor_autoscale_setting" "app" {
  count               = var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-advisoros-autoscale"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  target_resource_id  = azurerm_service_plan.app.id

  profile {
    name = "default"

    capacity {
      default = 2
      minimum = var.min_capacity
      maximum = var.max_capacity
    }

    # Scale out rule - CPU > 70%
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 70
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    # Scale in rule - CPU < 30%
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT10M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 30
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }

    # Scale out rule - Memory > 80%
    rule {
      metric_trigger {
        metric_name        = "MemoryPercentage"
        metric_resource_id = azurerm_service_plan.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 80
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    # Scale out rule - HTTP Queue Length > 50
    rule {
      metric_trigger {
        metric_name        = "HttpQueueLength"
        metric_resource_id = azurerm_service_plan.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 50
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }
  }

  # Tax season profile (March-April)
  profile {
    name = "tax-season"

    capacity {
      default = 5
      minimum = 3
      maximum = var.max_capacity * 2
    }

    recurrence {
      timezone = "Eastern Standard Time"
      days     = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      hours    = [0]
      minutes  = [0]
    }

    fixed_date {
      timezone = "Eastern Standard Time"
      start    = "2024-03-01T00:00:00Z"
      end      = "2024-04-30T23:59:59Z"
    }

    # More aggressive scaling during tax season
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT3M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 60
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT3M"
      }
    }
  }

  notification {
    email {
      send_to_subscription_administrator    = false
      send_to_subscription_co_administrator = false
      custom_emails                        = var.alert_email != "" ? [var.alert_email] : []
    }
  }

  tags = local.tags
}

# Storage account for backups (production only)
resource "azurerm_storage_account" "backups" {
  count                    = var.environment == "prod" ? 1 : 0
  name                     = "${var.environment}advisorosbackup${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "GRS"

  blob_properties {
    delete_retention_policy {
      days = var.backup_retention_days
    }
    versioning_enabled = true
  }

  tags = local.tags
}

resource "azurerm_storage_container" "app_backups" {
  count                 = var.environment == "prod" ? 1 : 0
  name                  = "app-backups"
  storage_account_name  = azurerm_storage_account.backups[0].name
  container_access_type = "private"
}

# SAS token for backup access
data "azurerm_storage_account_blob_container_sas" "backup" {
  count             = var.environment == "prod" ? 1 : 0
  connection_string = azurerm_storage_account.backups[0].primary_connection_string
  container_name    = azurerm_storage_container.app_backups[0].name
  https_only        = true

  start  = timestamp()
  expiry = timeadd(timestamp(), "8760h") # 1 year

  permissions {
    read   = true
    add    = true
    create = true
    write  = true
    delete = true
    list   = true
  }
}