# Outputs for CPA Platform Infrastructure

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "storage_account_name" {
  description = "Name of the storage account for documents"
  value       = azurerm_storage_account.documents.name
}

output "storage_connection_string" {
  description = "Connection string for the storage account"
  value       = azurerm_storage_account.documents.primary_connection_string
  sensitive   = true
}

output "postgres_server_name" {
  description = "Name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "postgres_fqdn" {
  description = "FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "Name of the PostgreSQL database"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "database_url" {
  description = "PostgreSQL connection URL"
  value       = local.database_url
  sensitive   = true
}

output "static_web_app_url" {
  description = "URL of the Static Web App"
  value       = azurerm_static_site.web.default_host_name
}

output "static_web_app_api_key" {
  description = "API key for Static Web App deployment"
  value       = azurerm_static_site.web.api_key
  sensitive   = true
}

output "function_app_name" {
  description = "Name of the Function App"
  value       = azurerm_linux_function_app.api.name
}

output "function_app_url" {
  description = "URL of the Function App"
  value       = azurerm_linux_function_app.api.default_hostname
}

output "cdn_endpoint_url" {
  description = "URL of the CDN endpoint"
  value       = azurerm_cdn_endpoint.static.host_name
}

output "b2c_application_id" {
  description = "Azure AD B2C application ID"
  value       = azuread_application.b2c.application_id
}

output "b2c_client_secret" {
  description = "Azure AD B2C client secret"
  value       = azuread_application_password.b2c.value
  sensitive   = true
}

output "managed_identity_id" {
  description = "ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.id
}

output "managed_identity_client_id" {
  description = "Client ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.client_id
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "deployment_instructions" {
  description = "Next steps for deployment"
  value = <<EOT
Deployment Complete! Next steps:

1. Store sensitive outputs in secure location
2. Configure DNS for custom domain (if applicable)
3. Set up CI/CD pipeline with the static_web_app_api_key
4. Configure Azure AD B2C user flows:
   - Sign up and sign in flow
   - Password reset flow
   - Profile edit flow
5. Add secrets to Key Vault:
   - QuickBooks OAuth credentials
   - SendGrid API key
   - Other third-party API keys
6. Configure backup policies
7. Set up monitoring alerts
8. Test all connections

Important URLs:
- Web App: https://${azurerm_static_site.web.default_host_name}
- API: https://${azurerm_linux_function_app.api.default_hostname}
- Key Vault: ${azurerm_key_vault.main.vault_uri}
- Application Insights: https://portal.azure.com/#resource${azurerm_application_insights.main.id}
EOT
}