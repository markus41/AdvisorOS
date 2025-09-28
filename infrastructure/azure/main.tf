terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
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

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    always_on = true
  }

  app_settings = {
    "DATABASE_URL"                    = "postgresql://${azurerm_postgresql_server.cpa_platform.administrator_login}:${azurerm_postgresql_server.cpa_platform.administrator_login_password}@${azurerm_postgresql_server.cpa_platform.fqdn}:5432/${azurerm_postgresql_database.cpa_platform.name}?sslmode=require"
    "NEXTAUTH_URL"                   = "https://${var.app_name}.azurewebsites.net"
    "NEXTAUTH_SECRET"                = var.nextauth_secret
    "AZURE_STORAGE_CONNECTION_STRING" = azurerm_storage_account.cpa_platform.primary_connection_string
    "QUICKBOOKS_CLIENT_ID"           = var.quickbooks_client_id
    "QUICKBOOKS_CLIENT_SECRET"       = var.quickbooks_client_secret
  }

  connection_string {
    name  = "DefaultConnection"
    type  = "PostgreSQL"
    value = "postgresql://${azurerm_postgresql_server.cpa_platform.administrator_login}:${azurerm_postgresql_server.cpa_platform.administrator_login_password}@${azurerm_postgresql_server.cpa_platform.fqdn}:5432/${azurerm_postgresql_database.cpa_platform.name}?sslmode=require"
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