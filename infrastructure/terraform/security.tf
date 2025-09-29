# Security Infrastructure for AdvisorOS
# Key Vault, Secrets Management, SSL Certificates, and RBAC

# Enhanced Key Vault configuration (updating existing one)
# Adding RBAC assignments for the managed identity
resource "azurerm_role_assignment" "key_vault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

resource "azurerm_role_assignment" "key_vault_crypto_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Crypto User"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

# System-assigned identity RBAC for App Service
resource "azurerm_role_assignment" "app_key_vault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.app.identity[0].principal_id
}

# Storage Account RBAC for App Service
resource "azurerm_role_assignment" "app_storage_blob_contributor" {
  scope                = azurerm_storage_account.documents.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_web_app.app.identity[0].principal_id
}

# Key Vault Secrets
resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = local.database_url
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "nextauth_secret" {
  name         = "nextauth-secret"
  value        = random_password.nextauth_secret.result
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "storage_connection" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.documents.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "redis_connection" {
  name         = "redis-connection-string"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

# AI Services API Keys
resource "azurerm_key_vault_secret" "openai_api_key" {
  name         = "openai-api-key"
  value        = azurerm_cognitive_account.openai.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "form_recognizer_api_key" {
  name         = "form-recognizer-api-key"
  value        = azurerm_cognitive_account.form_recognizer.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "search_api_key" {
  name         = "search-api-key"
  value        = azurerm_search_service.main.primary_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "text_analytics_api_key" {
  name         = "text-analytics-api-key"
  value        = azurerm_cognitive_account.text_analytics.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "computer_vision_api_key" {
  name         = "computer-vision-api-key"
  value        = azurerm_cognitive_account.computer_vision.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

# External Service Secrets (with default values)
resource "azurerm_key_vault_secret" "quickbooks_client_id" {
  name         = "quickbooks-client-id"
  value        = var.quickbooks_client_id != "" ? var.quickbooks_client_id : "placeholder_client_id"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "quickbooks_client_secret" {
  name         = "quickbooks-client-secret"
  value        = var.quickbooks_client_secret != "" ? var.quickbooks_client_secret : random_password.quickbooks_secret.result
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "stripe_secret_key" {
  name         = "stripe-secret-key"
  value        = "sk_test_placeholder_key"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "stripe_publishable_key" {
  name         = "stripe-publishable-key"
  value        = "pk_test_placeholder_key"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

resource "azurerm_key_vault_secret" "sendgrid_api_key" {
  name         = "sendgrid-api-key"
  value        = var.sendgrid_api_key != "" ? var.sendgrid_api_key : "placeholder_sendgrid_key"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

# SSL Certificate (if custom domain is provided)
resource "azurerm_key_vault_certificate" "ssl" {
  count        = var.custom_domain != "" && var.ssl_certificate_name != "" ? 1 : 0
  name         = var.ssl_certificate_name
  key_vault_id = azurerm_key_vault.main.id

  certificate_policy {
    issuer_parameters {
      name = "Self"
    }

    key_properties {
      exportable = true
      key_size   = 2048
      key_type   = "RSA"
      reuse_key  = true
    }

    lifetime_action {
      action {
        action_type = "AutoRenew"
      }

      trigger {
        days_before_expiry = 30
      }
    }

    secret_properties {
      content_type = "application/x-pkcs12"
    }

    x509_certificate_properties {
      key_usage = [
        "cRLSign",
        "dataEncipherment",
        "digitalSignature",
        "keyAgreement",
        "keyEncipherment",
        "keyCertSign",
      ]

      subject            = "CN=${var.custom_domain}"
      validity_in_months = 12

      subject_alternative_names {
        dns_names = [var.custom_domain, "www.${var.custom_domain}"]
      }
    }
  }

  depends_on = [azurerm_role_assignment.key_vault_secrets_user]
}

# Random passwords for various services
resource "random_password" "nextauth_secret" {
  length  = 32
  special = true
}

resource "random_password" "quickbooks_secret" {
  length  = 32
  special = true
}

# Azure Security Center Configuration
resource "azurerm_security_center_subscription_pricing" "main" {
  tier          = var.environment == "prod" ? "Standard" : "Free"
  resource_type = "VirtualMachines"
}

resource "azurerm_security_center_subscription_pricing" "sql" {
  tier          = var.environment == "prod" ? "Standard" : "Free"
  resource_type = "SqlServers"
}

resource "azurerm_security_center_subscription_pricing" "storage" {
  tier          = var.environment == "prod" ? "Standard" : "Free"
  resource_type = "StorageAccounts"
}

resource "azurerm_security_center_subscription_pricing" "app_services" {
  tier          = var.environment == "prod" ? "Standard" : "Free"
  resource_type = "AppServices"
}

# Log Analytics Workspace for security monitoring
resource "azurerm_log_analytics_workspace" "security" {
  name                = "${var.environment}-advisoros-security-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = "PerGB2018"
  retention_in_days   = var.environment == "prod" ? 90 : 30

  tags = local.tags
}

# Security Center workspace configuration
resource "azurerm_security_center_workspace" "main" {
  scope        = "/subscriptions/${data.azurerm_client_config.current.subscription_id}"
  workspace_id = azurerm_log_analytics_workspace.security.id
}

# Diagnostic settings for Key Vault
resource "azurerm_monitor_diagnostic_setting" "key_vault" {
  name                       = "key-vault-diagnostics"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.security.id

  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# Diagnostic settings for Storage Account
resource "azurerm_monitor_diagnostic_setting" "storage" {
  name                       = "storage-diagnostics"
  target_resource_id         = azurerm_storage_account.documents.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.security.id

  metric {
    category = "Transaction"
    enabled  = true
  }

  metric {
    category = "Capacity"
    enabled  = true
  }
}

# Network Watcher for network monitoring
resource "azurerm_network_watcher" "main" {
  name                = "${var.environment}-advisoros-nw"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = local.tags
}

# NSG Flow Logs for security monitoring
resource "azurerm_storage_account" "flow_logs" {
  count                    = var.environment == "prod" ? 1 : 0
  name                     = "${var.environment}advisorosflowlogs${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"

  tags = local.tags
}

resource "azurerm_network_watcher_flow_log" "app_service" {
  count                     = var.environment == "prod" ? 1 : 0
  network_watcher_name      = azurerm_network_watcher.main.name
  resource_group_name       = azurerm_resource_group.main.name
  network_security_group_id = azurerm_network_security_group.app_service.id
  storage_account_id        = azurerm_storage_account.flow_logs[0].id
  enabled                   = true

  retention_policy {
    enabled = true
    days    = 30
  }

  traffic_analytics {
    enabled               = true
    workspace_id          = azurerm_log_analytics_workspace.security.workspace_id
    workspace_region      = azurerm_log_analytics_workspace.security.location
    workspace_resource_id = azurerm_log_analytics_workspace.security.id
    interval_in_minutes   = 10
  }

  tags = local.tags
}

resource "azurerm_network_watcher_flow_log" "database" {
  count                     = var.environment == "prod" ? 1 : 0
  network_watcher_name      = azurerm_network_watcher.main.name
  resource_group_name       = azurerm_resource_group.main.name
  network_security_group_id = azurerm_network_security_group.database.id
  storage_account_id        = azurerm_storage_account.flow_logs[0].id
  enabled                   = true

  retention_policy {
    enabled = true
    days    = 30
  }

  traffic_analytics {
    enabled               = true
    workspace_id          = azurerm_log_analytics_workspace.security.workspace_id
    workspace_region      = azurerm_log_analytics_workspace.security.location
    workspace_resource_id = azurerm_log_analytics_workspace.security.id
    interval_in_minutes   = 10
  }

  tags = local.tags
}