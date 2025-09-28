output "app_service_url" {
  description = "The URL of the App Service"
  value       = "https://${azurerm_linux_web_app.cpa_platform.default_hostname}"
}

output "database_fqdn" {
  description = "The FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_server.cpa_platform.fqdn
}

output "storage_account_name" {
  description = "The name of the storage account"
  value       = azurerm_storage_account.cpa_platform.name
}

output "application_insights_key" {
  description = "The Application Insights instrumentation key"
  value       = azurerm_application_insights.cpa_platform.instrumentation_key
  sensitive   = true
}

# Key Vault outputs
output "key_vault_name" {
  description = "The name of the Key Vault"
  value       = azurerm_key_vault.cpa_platform.name
}

output "key_vault_uri" {
  description = "The URI of the Key Vault"
  value       = azurerm_key_vault.cpa_platform.vault_uri
}

# Azure AD B2C outputs
output "b2c_tenant_id" {
  description = "The Azure AD B2C tenant ID"
  value       = azurerm_aadb2c_directory.cpa_platform.tenant_id
}

output "b2c_domain_name" {
  description = "The Azure AD B2C domain name"
  value       = azurerm_aadb2c_directory.cpa_platform.domain_name
}

output "b2c_client_id" {
  description = "The Azure AD B2C application client ID"
  value       = azuread_application.b2c_app.application_id
  sensitive   = true
}

# Cognitive Services outputs
output "form_recognizer_endpoint" {
  description = "The Form Recognizer endpoint"
  value       = azurerm_cognitive_account.form_recognizer.endpoint
}

output "computer_vision_endpoint" {
  description = "The Computer Vision endpoint"
  value       = azurerm_cognitive_account.computer_vision.endpoint
}

output "openai_endpoint" {
  description = "The OpenAI endpoint"
  value       = azurerm_cognitive_account.openai.endpoint
}

# Function App outputs
output "function_app_name" {
  description = "The name of the Function App"
  value       = azurerm_linux_function_app.cpa_platform.name
}

output "function_app_default_hostname" {
  description = "The default hostname of the Function App"
  value       = azurerm_linux_function_app.cpa_platform.default_hostname
}

# Log Analytics outputs
output "log_analytics_workspace_id" {
  description = "The Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.cpa_platform.workspace_id
  sensitive   = true
}

output "log_analytics_workspace_name" {
  description = "The Log Analytics workspace name"
  value       = azurerm_log_analytics_workspace.cpa_platform.name
}

# Recovery Services Vault outputs
output "backup_vault_name" {
  description = "The name of the Recovery Services Vault"
  value       = azurerm_recovery_services_vault.cpa_platform.name
}

# Custom Role outputs
output "cicd_role_id" {
  description = "The ID of the custom CI/CD role"
  value       = azurerm_role_definition.cicd_deployer.role_definition_id
}

# Network Security Group outputs
output "app_nsg_id" {
  description = "The ID of the App Service Network Security Group"
  value       = azurerm_network_security_group.app_service.id
}

output "database_nsg_id" {
  description = "The ID of the Database Network Security Group"
  value       = azurerm_network_security_group.database.id
}

# Monitor Action Group outputs
output "alert_action_group_id" {
  description = "The ID of the Monitor Action Group for alerts"
  value       = azurerm_monitor_action_group.cpa_platform.id
}

# Auto-scaling outputs
output "autoscale_setting_id" {
  description = "The ID of the Auto-scaling setting"
  value       = azurerm_monitor_autoscale_setting.app_service.id
}

# Environment and configuration outputs
output "environment" {
  description = "The deployment environment"
  value       = var.environment
}

output "resource_group_location" {
  description = "The location of the resource group"
  value       = azurerm_resource_group.cpa_platform.location
}

# Storage containers outputs
output "documents_container_name" {
  description = "The name of the documents storage container"
  value       = azurerm_storage_container.documents.name
}

output "backups_container_name" {
  description = "The name of the backups storage container"
  value       = azurerm_storage_container.backups.name
}

output "job_queue_name" {
  description = "The name of the job processing queue"
  value       = azurerm_storage_queue.job_queue.name
}