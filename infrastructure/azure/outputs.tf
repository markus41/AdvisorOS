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