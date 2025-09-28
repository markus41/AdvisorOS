terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "cpa_platform" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# App Service Plan
resource "azurerm_service_plan" "cpa_platform" {
  name                = "${var.app_name}-plan"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  location            = azurerm_resource_group.cpa_platform.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = var.tags
}

# App Service
resource "azurerm_linux_web_app" "cpa_platform" {
  name                = var.app_name
  resource_group_name = azurerm_resource_group.cpa_platform.name
  location            = azurerm_service_plan.cpa_platform.location
  service_plan_id     = azurerm_service_plan.cpa_platform.id
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    always_on = true

    # Auto-scaling configuration
    auto_heal_enabled = true

    auto_heal_setting {
      trigger {
        status_code {
          status_code   = 500
          count         = 5
          interval      = "00:01:00"
        }
      }
      action {
        action_type = "Recycle"
      }
    }
  }

  app_settings = {
    "NEXTAUTH_URL"                       = "https://${var.app_name}.azurewebsites.net"
    "AZURE_KEY_VAULT_URL"               = azurerm_key_vault.cpa_platform.vault_uri
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.cpa_platform.connection_string
    "APPINSIGHTS_INSTRUMENTATIONKEY"    = azurerm_application_insights.cpa_platform.instrumentation_key
    "FORM_RECOGNIZER_ENDPOINT"          = azurerm_cognitive_account.form_recognizer.endpoint
    "OPENAI_ENDPOINT"                   = azurerm_cognitive_account.openai.endpoint
    "COMPUTER_VISION_ENDPOINT"          = azurerm_cognitive_account.computer_vision.endpoint
    "B2C_TENANT_NAME"                   = "${var.b2c_tenant_name}.onmicrosoft.com"
    "B2C_CLIENT_ID"                     = azuread_application.b2c_app.application_id
    "ENVIRONMENT"                       = var.environment
    "WEBSITE_RUN_FROM_PACKAGE"          = "1"

    # Key Vault references
    "DATABASE_URL"                      = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=database-connection-string)"
    "NEXTAUTH_SECRET"                   = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=nextauth-secret)"
    "AZURE_STORAGE_CONNECTION_STRING"   = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=storage-connection-string)"
    "QUICKBOOKS_CLIENT_ID"              = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=quickbooks-client-id)"
    "QUICKBOOKS_CLIENT_SECRET"          = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=quickbooks-client-secret)"
    "STRIPE_API_KEY"                    = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=stripe-api-key)"
    "STRIPE_WEBHOOK_SECRET"             = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=stripe-webhook-secret)"
  }

  connection_string {
    name  = "DefaultConnection"
    type  = "PostgreSQL"
    value = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=database-connection-string)"
  }
}

# PostgreSQL Server
resource "azurerm_postgresql_server" "cpa_platform" {
  name                = "${var.app_name}-postgres"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  tags                = var.tags

  administrator_login          = var.db_admin_username
  administrator_login_password = var.db_admin_password

  sku_name   = var.postgres_sku
  version    = "11"
  storage_mb = 5120

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  auto_grow_enabled           = true

  public_network_access_enabled    = true
  ssl_enforcement_enabled          = true
  ssl_minimal_tls_version_enforced = "TLS1_2"
}

# PostgreSQL Database
resource "azurerm_postgresql_database" "cpa_platform" {
  name                = var.database_name
  resource_group_name = azurerm_resource_group.cpa_platform.name
  server_name         = azurerm_postgresql_server.cpa_platform.name
  charset             = "UTF8"
  collation           = "English_United States.1252"
}

# PostgreSQL Firewall Rule for Azure Services
resource "azurerm_postgresql_firewall_rule" "azure_services" {
  name                = "AllowAzureServices"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  server_name         = azurerm_postgresql_server.cpa_platform.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# Storage Account
resource "azurerm_storage_account" "cpa_platform" {
  name                     = "${replace(var.app_name, "-", "")}storage"
  resource_group_name      = azurerm_resource_group.cpa_platform.name
  location                 = azurerm_resource_group.cpa_platform.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

# Storage Container for Documents
resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.cpa_platform.name
  container_access_type = "private"
}

# Application Insights
resource "azurerm_application_insights" "cpa_platform" {
  name                = "${var.app_name}-insights"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  application_type    = "web"
  tags                = var.tags
}

# Get current Azure client configuration
data "azurerm_client_config" "current" {}

# Azure Key Vault
resource "azurerm_key_vault" "cpa_platform" {
  name                       = "${var.app_name}-kv-${random_id.kv_suffix.hex}"
  location                   = azurerm_resource_group.cpa_platform.location
  resource_group_name        = azurerm_resource_group.cpa_platform.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = var.key_vault_sku
  purge_protection_enabled   = false
  soft_delete_retention_days = 7
  tags                       = var.tags

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Purge",
      "Recover"
    ]
  }

  # Access policy for App Service
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_linux_web_app.cpa_platform.identity[0].principal_id

    secret_permissions = [
      "Get",
      "List"
    ]
  }

  # Access policy for Function App
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_linux_function_app.cpa_platform.identity[0].principal_id

    secret_permissions = [
      "Get",
      "List"
    ]
  }

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }
}

# Random ID for Key Vault naming
resource "random_id" "kv_suffix" {
  byte_length = 4
}

# Key Vault Secrets
resource "azurerm_key_vault_secret" "db_connection_string" {
  name         = "database-connection-string"
  value        = "postgresql://${azurerm_postgresql_server.cpa_platform.administrator_login}:${azurerm_postgresql_server.cpa_platform.administrator_login_password}@${azurerm_postgresql_server.cpa_platform.fqdn}:5432/${azurerm_postgresql_database.cpa_platform.name}?sslmode=require"
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "nextauth_secret" {
  name         = "nextauth-secret"
  value        = var.nextauth_secret
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "quickbooks_client_id" {
  name         = "quickbooks-client-id"
  value        = var.quickbooks_client_id
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "quickbooks_client_secret" {
  name         = "quickbooks-client-secret"
  value        = var.quickbooks_client_secret
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "stripe_api_key" {
  name         = "stripe-api-key"
  value        = var.stripe_api_key
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "stripe_webhook_secret" {
  name         = "stripe-webhook-secret"
  value        = var.stripe_webhook_secret
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.cpa_platform.primary_connection_string
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

# Azure AD B2C Tenant
resource "azurerm_aadb2c_directory" "cpa_platform" {
  resource_group_name   = azurerm_resource_group.cpa_platform.name
  location              = azurerm_resource_group.cpa_platform.location
  domain_name           = "${var.b2c_tenant_name}.onmicrosoft.com"
  display_name          = "CPA Platform B2C"
  data_residency_location = var.b2c_data_residency_location
  sku_name              = "PremiumP1"
  tags                  = var.tags
}

# Random UUID for API scope
resource "random_uuid" "api_scope" {}

# Azure AD Application for B2C
resource "azuread_application" "b2c_app" {
  display_name            = "${var.app_name}-b2c-app"
  owners                  = [data.azurerm_client_config.current.object_id]
  sign_in_audience        = "AzureADandPersonalMicrosoftAccount"

  web {
    redirect_uris = [
      "https://${var.app_name}.azurewebsites.net/api/auth/callback/azure-ad-b2c",
      "https://${var.app_name}.azurewebsites.net/signin-oidc"
    ]

    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = true
    }
  }

  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }

    resource_access {
      id   = "b4e74841-8e56-480b-be8b-910348b18b4c" # User.ReadWrite
      type = "Scope"
    }
  }

  api {
    mapped_claims_enabled          = false
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Access CPA Platform API"
      admin_consent_display_name = "Access CPA Platform API"
      enabled                    = true
      id                         = random_uuid.api_scope.result
      type                       = "User"
      user_consent_description   = "Access CPA Platform API"
      user_consent_display_name  = "Access CPA Platform API"
      value                      = "api.access"
    }
  }
}

# Service Principal for B2C App
resource "azuread_service_principal" "b2c_app" {
  application_id               = azuread_application.b2c_app.application_id
  app_role_assignment_required = false
  owners                       = [data.azurerm_client_config.current.object_id]
}

# Application Secret
resource "azuread_application_password" "b2c_app" {
  application_object_id = azuread_application.b2c_app.object_id
  display_name          = "CPA Platform B2C Secret"
}

# Store B2C credentials in Key Vault
resource "azurerm_key_vault_secret" "b2c_client_id" {
  name         = "b2c-client-id"
  value        = azuread_application.b2c_app.application_id
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "b2c_client_secret" {
  name         = "b2c-client-secret"
  value        = azuread_application_password.b2c_app.value
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

# Cognitive Services - Form Recognizer
resource "azurerm_cognitive_account" "form_recognizer" {
  name                = "${var.app_name}-form-recognizer"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  kind                = "FormRecognizer"
  sku_name            = var.cognitive_services_sku
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }
}

# Cognitive Services - Computer Vision
resource "azurerm_cognitive_account" "computer_vision" {
  name                = "${var.app_name}-computer-vision"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  kind                = "ComputerVision"
  sku_name            = var.cognitive_services_sku
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }
}

# Cognitive Services - OpenAI
resource "azurerm_cognitive_account" "openai" {
  name                = "${var.app_name}-openai"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  kind                = "OpenAI"
  sku_name            = var.openai_sku
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }
}

# Store Cognitive Services keys in Key Vault
resource "azurerm_key_vault_secret" "form_recognizer_key" {
  name         = "form-recognizer-key"
  value        = azurerm_cognitive_account.form_recognizer.primary_access_key
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "computer_vision_key" {
  name         = "computer-vision-key"
  value        = azurerm_cognitive_account.computer_vision.primary_access_key
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "openai_key" {
  name         = "openai-key"
  value        = azurerm_cognitive_account.openai.primary_access_key
  key_vault_id = azurerm_key_vault.cpa_platform.id
  tags         = var.tags
}

# Storage Queue for Function App
resource "azurerm_storage_queue" "job_queue" {
  name                 = "job-processing-queue"
  storage_account_name = azurerm_storage_account.cpa_platform.name
}

# Service Plan for Functions
resource "azurerm_service_plan" "functions" {
  name                = "${var.app_name}-functions-plan"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  location            = azurerm_resource_group.cpa_platform.location
  os_type             = "Linux"
  sku_name            = var.function_app_sku
  tags                = var.tags
}

# Function App
resource "azurerm_linux_function_app" "cpa_platform" {
  name                = "${var.app_name}-functions"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  location            = azurerm_service_plan.functions.location
  service_plan_id     = azurerm_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.cpa_platform.name
  storage_account_access_key = azurerm_storage_account.cpa_platform.primary_access_key
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      node_version = "18"
    }

    application_insights_connection_string = azurerm_application_insights.cpa_platform.connection_string
    application_insights_key               = azurerm_application_insights.cpa_platform.instrumentation_key

    # Enable health checks
    health_check_path = "/api/health"
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"              = "node"
    "WEBSITE_NODE_DEFAULT_VERSION"          = "~18"
    "AZURE_KEY_VAULT_URL"                  = azurerm_key_vault.cpa_platform.vault_uri
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.cpa_platform.connection_string
    "APPINSIGHTS_INSTRUMENTATIONKEY"       = azurerm_application_insights.cpa_platform.instrumentation_key
    "FORM_RECOGNIZER_ENDPOINT"             = azurerm_cognitive_account.form_recognizer.endpoint
    "OPENAI_ENDPOINT"                      = azurerm_cognitive_account.openai.endpoint
    "COMPUTER_VISION_ENDPOINT"             = azurerm_cognitive_account.computer_vision.endpoint
    "ENVIRONMENT"                          = var.environment

    # Key Vault references
    "DATABASE_URL"                         = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=database-connection-string)"
    "AZURE_STORAGE_CONNECTION_STRING"      = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=storage-connection-string)"
    "FORM_RECOGNIZER_KEY"                  = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=form-recognizer-key)"
    "OPENAI_KEY"                           = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=openai-key)"
    "COMPUTER_VISION_KEY"                  = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.cpa_platform.name};SecretName=computer-vision-key)"
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "cpa_platform" {
  name                = "${var.app_name}-logs"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

# Azure Monitor Action Group for Alerts
resource "azurerm_monitor_action_group" "cpa_platform" {
  name                = "${var.app_name}-alerts"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  short_name          = "cpa-alerts"
  tags                = var.tags

  email_receiver {
    name          = "admin-email"
    email_address = var.admin_email
  }
}

# Application Insights Alert Rules
resource "azurerm_monitor_metric_alert" "high_response_time" {
  name                = "${var.app_name}-high-response-time"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  scopes              = [azurerm_application_insights.cpa_platform.id]
  description         = "Alert when average response time is greater than 5 seconds"
  tags                = var.tags

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 5000

    dimension {
      name     = "cloud/roleName"
      operator = "Include"
      values   = ["*"]
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.cpa_platform.id
  }
}

resource "azurerm_monitor_metric_alert" "high_error_rate" {
  name                = "${var.app_name}-high-error-rate"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  scopes              = [azurerm_application_insights.cpa_platform.id]
  description         = "Alert when error rate is greater than 5%"
  tags                = var.tags

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.cpa_platform.id
  }
}

# Database Alert for High CPU
resource "azurerm_monitor_metric_alert" "database_high_cpu" {
  name                = "${var.app_name}-db-high-cpu"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  scopes              = [azurerm_postgresql_server.cpa_platform.id]
  description         = "Alert when database CPU is greater than 80%"
  tags                = var.tags

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/servers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.cpa_platform.id
  }
}

# Network Security Group for App Service
resource "azurerm_network_security_group" "app_service" {
  name                = "${var.app_name}-app-nsg"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  tags                = var.tags

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Network Security Group for Database
resource "azurerm_network_security_group" "database" {
  name                = "${var.app_name}-db-nsg"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  tags                = var.tags

  security_rule {
    name                       = "AllowAzureServices"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "AzureCloud"
    destination_address_prefix = "*"
  }
}

# Auto-scaling for App Service
resource "azurerm_monitor_autoscale_setting" "app_service" {
  name                = "${var.app_name}-autoscale"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  location            = azurerm_resource_group.cpa_platform.location
  target_resource_id  = azurerm_service_plan.cpa_platform.id
  tags                = var.tags

  profile {
    name = "default"

    capacity {
      default = 2
      minimum = var.min_instances
      maximum = var.max_instances
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.cpa_platform.id
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

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.cpa_platform.id
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

    rule {
      metric_trigger {
        metric_name        = "MemoryPercentage"
        metric_resource_id = azurerm_service_plan.cpa_platform.id
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
  }

  notification {
    email {
      send_to_subscription_administrator    = false
      send_to_subscription_co_administrator = false
      custom_emails                         = [var.admin_email]
    }
  }
}

# Recovery Services Vault for Backup
resource "azurerm_recovery_services_vault" "cpa_platform" {
  name                = "${var.app_name}-backup-vault"
  location            = azurerm_resource_group.cpa_platform.location
  resource_group_name = azurerm_resource_group.cpa_platform.name
  sku                 = "Standard"
  tags                = var.tags

  soft_delete_enabled = true
}

# Backup Policy for Database
resource "azurerm_backup_policy_postgresql" "cpa_platform" {
  name                = "${var.app_name}-db-backup-policy"
  resource_group_name = azurerm_resource_group.cpa_platform.name
  vault_name          = azurerm_recovery_services_vault.cpa_platform.name

  backup_repeating_time_intervals = ["R/2023-01-01T02:00:00+00:00/PT12H"]
  default_retention_duration      = "P30D"

  retention_rule {
    name     = "Monthly"
    duration = "P12M"
    priority = 15

    criteria {
      absolute_criteria = "FirstOfMonth"
    }
  }

  retention_rule {
    name     = "Weekly"
    duration = "P12W"
    priority = 20

    criteria {
      absolute_criteria = "FirstOfWeek"
    }
  }
}

# Cost Monitoring Alert
resource "azurerm_consumption_budget_resource_group" "cpa_platform" {
  name              = "${var.app_name}-budget"
  resource_group_id = azurerm_resource_group.cpa_platform.id

  amount     = 500
  time_grain = "Monthly"

  time_period {
    start_date = "2024-01-01T00:00:00Z"
    end_date   = "2025-12-31T00:00:00Z"
  }

  filter {
    dimension {
      name = "ResourceGroupName"
      values = [
        azurerm_resource_group.cpa_platform.name,
      ]
    }
  }

  notification {
    enabled   = true
    threshold = 80.0
    operator  = "GreaterThan"

    contact_emails = [
      var.admin_email,
    ]
  }

  notification {
    enabled   = true
    threshold = 100.0
    operator  = "GreaterThan"

    contact_emails = [
      var.admin_email,
    ]
  }
}

# Custom Role for CI/CD Deployment
resource "azurerm_role_definition" "cicd_deployer" {
  name  = "${var.app_name}-cicd-deployer"
  scope = azurerm_resource_group.cpa_platform.id

  description = "Custom role for CI/CD deployment operations"

  permissions {
    actions = [
      "Microsoft.Web/sites/write",
      "Microsoft.Web/sites/read",
      "Microsoft.Web/sites/restart/action",
      "Microsoft.Web/sites/deployments/*",
      "Microsoft.Web/sites/config/*",
      "Microsoft.KeyVault/vaults/secrets/read",
      "Microsoft.Storage/storageAccounts/blobServices/containers/*",
      "Microsoft.Storage/storageAccounts/read",
      "Microsoft.Insights/components/*",
      "Microsoft.Resources/deployments/*"
    ]

    not_actions = [
      "Microsoft.Web/sites/delete",
      "Microsoft.KeyVault/vaults/delete"
    ]

    data_actions = [
      "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/*"
    ]

    not_data_actions = []
  }

  assignable_scopes = [
    azurerm_resource_group.cpa_platform.id,
  ]
}

# Storage Account Backup Container
resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.cpa_platform.name
  container_access_type = "private"
}

# Application Insights Web Test
resource "azurerm_application_insights_web_test" "availability" {
  name                    = "${var.app_name}-availability-test"
  location                = azurerm_resource_group.cpa_platform.location
  resource_group_name     = azurerm_resource_group.cpa_platform.name
  application_insights_id = azurerm_application_insights.cpa_platform.id
  kind                    = "ping"
  frequency               = 300
  timeout                 = 60
  enabled                 = true
  geo_locations           = ["us-ca-sjc-azr", "us-tx-sn1-azr", "us-il-ch1-azr"]
  tags                    = var.tags

  configuration = <<XML
<WebTest Name="${var.app_name}-availability-test" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="60" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale="">
  <Items>
    <Request Method="GET" Version="1.1" Url="https://${var.app_name}.azurewebsites.net" ThinkTime="0" Timeout="60" ParseDependentRequests="True" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML
}