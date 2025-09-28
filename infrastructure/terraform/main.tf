# CPA Platform - Main Terraform Configuration
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstatecpaplatform"
    container_name      = "tfstate"
    key                 = "cpa-platform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

provider "azuread" {}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.environment}-cpa-rg"
  location = var.location

  tags = local.tags
}

# Managed Identity for resources
resource "azurerm_user_assigned_identity" "main" {
  name                = "${var.environment}-cpa-identity"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location

  tags = local.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.environment}-cpa-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"

  tags = local.tags
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                = "${var.environment}cpakeyvault${random_string.kv_suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id          = data.azurerm_client_config.current.tenant_id
  sku_name           = "standard"

  enable_rbac_authorization       = true
  enabled_for_deployment          = false
  enabled_for_disk_encryption     = false
  enabled_for_template_deployment = false
  purge_protection_enabled        = true
  soft_delete_retention_days      = 90

  network_acls {
    default_action = "Allow"
    bypass        = "AzureServices"
  }

  tags = local.tags
}

# Storage Account for documents
resource "azurerm_storage_account" "documents" {
  name                     = "${var.environment}cpadocs${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = var.environment == "prod" ? "ZRS" : "LRS"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT", "DELETE"]
      allowed_origins    = var.allowed_origins
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }

    delete_retention_policy {
      days = 30
    }

    versioning_enabled = true
  }

  tags = local.tags
}

# Storage containers
resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.documents.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.documents.name
  container_access_type = "private"
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "${var.environment}-cpa-postgres"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  version            = "15"

  administrator_login    = "cpaadmin"
  administrator_password = random_password.postgres_password.result

  storage_mb = var.postgres_storage_mb
  sku_name   = var.postgres_sku

  backup_retention_days        = var.environment == "prod" ? 30 : 7
  geo_redundant_backup_enabled = var.environment == "prod"

  high_availability {
    mode                      = var.environment == "prod" ? "ZoneRedundant" : "Disabled"
    standby_availability_zone = var.environment == "prod" ? "2" : null
  }

  tags = local.tags
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "cpadb"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# PostgreSQL Firewall Rules
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Static Web App for Next.js
resource "azurerm_static_site" "web" {
  name                = "${var.environment}-cpa-web"
  resource_group_name = azurerm_resource_group.main.name
  location           = "westus2" # Static Web Apps limited regions
  sku_tier           = var.environment == "prod" ? "Standard" : "Free"
  sku_size           = var.environment == "prod" ? "Standard" : "Free"

  tags = local.tags
}

# Function App for API
resource "azurerm_service_plan" "api" {
  name                = "${var.environment}-cpa-asp"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type            = "Linux"
  sku_name           = var.environment == "prod" ? "P1v2" : "B1"

  tags = local.tags
}

resource "azurerm_linux_function_app" "api" {
  name                = "${var.environment}-cpa-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.api.id

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  site_config {
    application_stack {
      node_version = "18"
    }

    cors {
      allowed_origins = var.allowed_origins
    }

    application_insights_key               = azurerm_application_insights.main.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.main.connection_string
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"       = "node"
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~18"
    "DATABASE_URL"                    = local.database_url
    "AZURE_STORAGE_CONNECTION_STRING" = azurerm_storage_account.documents.primary_connection_string
    "KEY_VAULT_URI"                  = azurerm_key_vault.main.vault_uri
  }

  identity {
    type         = "SystemAssigned, UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.main.id]
  }

  tags = local.tags
}

# Storage Account for Functions
resource "azurerm_storage_account" "functions" {
  name                     = "${var.environment}cpafunc${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"

  tags = local.tags
}

# Azure AD B2C Configuration
resource "azuread_application" "b2c" {
  display_name = "${var.environment}-cpa-platform"

  web {
    homepage_url  = var.app_url
    redirect_uris = ["${var.app_url}/api/auth/callback/azure-ad-b2c"]

    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled    = true
    }
  }

  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "37f7f235-527c-4136-accd-4a02d197296e" # openid
      type = "Scope"
    }

    resource_access {
      id   = "14dad69e-099b-42c9-810b-d002981feec1" # profile
      type = "Scope"
    }

    resource_access {
      id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # email
      type = "Scope"
    }
  }
}

resource "azuread_application_password" "b2c" {
  application_object_id = azuread_application.b2c.object_id
  display_name         = "client-secret"
  end_date            = "2025-12-31T23:59:59Z"
}

# CDN Profile for static assets
resource "azurerm_cdn_profile" "main" {
  name                = "${var.environment}-cpa-cdn"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = var.environment == "prod" ? "Standard_Microsoft" : "Standard_Akamai"

  tags = local.tags
}

resource "azurerm_cdn_endpoint" "static" {
  name                = "${var.environment}-cpa-static"
  profile_name        = azurerm_cdn_profile.main.name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  origin {
    name      = "storage"
    host_name = azurerm_storage_account.documents.primary_blob_host
  }

  is_compression_enabled = true
  content_types_to_compress = [
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/xml"
  ]

  tags = local.tags
}

# Random strings for unique naming
resource "random_string" "kv_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "random_string" "storage_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "random_password" "postgres_password" {
  length  = 32
  special = true
}

# Data sources
data "azurerm_client_config" "current" {}

# Locals
locals {
  tags = {
    Environment = var.environment
    Project     = "CPA-Platform"
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
    CreatedDate = timestamp()
  }

  database_url = "postgresql://${azurerm_postgresql_flexible_server.main.administrator_login}:${azurerm_postgresql_flexible_server.main.administrator_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
}