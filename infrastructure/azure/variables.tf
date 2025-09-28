variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = "cpa-platform-rg"
}

variable "location" {
  description = "The Azure location for all resources"
  type        = string
  default     = "East US"
}

variable "app_name" {
  description = "The name of the application"
  type        = string
  default     = "cpa-platform"
}

variable "app_service_sku" {
  description = "The SKU for the App Service Plan"
  type        = string
  default     = "B1"
}

variable "postgres_sku" {
  description = "The SKU for the PostgreSQL server"
  type        = string
  default     = "B_Gen5_1"
}

variable "database_name" {
  description = "The name of the PostgreSQL database"
  type        = string
  default     = "cpa_platform_db"
}

variable "db_admin_username" {
  description = "The administrator username for the PostgreSQL server"
  type        = string
  default     = "cpaadmin"
}

variable "db_admin_password" {
  description = "The administrator password for the PostgreSQL server"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "The NextAuth secret for session encryption"
  type        = string
  sensitive   = true
}

variable "quickbooks_client_id" {
  description = "QuickBooks API Client ID"
  type        = string
  sensitive   = true
}

variable "quickbooks_client_secret" {
  description = "QuickBooks API Client Secret"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "cpa-platform"
  }
}

# Key Vault variables
variable "key_vault_sku" {
  description = "The SKU for the Key Vault"
  type        = string
  default     = "standard"
}

# Azure AD B2C variables
variable "b2c_tenant_name" {
  description = "The name for the Azure AD B2C tenant"
  type        = string
  default     = "cpaplatform"
}

variable "b2c_data_residency_location" {
  description = "The data residency location for B2C tenant"
  type        = string
  default     = "United States"
}

# Cognitive Services variables
variable "cognitive_services_sku" {
  description = "The SKU for Cognitive Services"
  type        = string
  default     = "S0"
}

variable "openai_sku" {
  description = "The SKU for OpenAI service"
  type        = string
  default     = "S0"
}

# Function App variables
variable "function_app_sku" {
  description = "The SKU for the Function App consumption plan"
  type        = string
  default     = "Y1"
}

# Stripe API variables
variable "stripe_api_key" {
  description = "Stripe API Key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret"
  type        = string
  sensitive   = true
}

# Environment specific variables
variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "admin_email" {
  description = "Administrator email for alerts and notifications"
  type        = string
}

# Auto-scaling variables
variable "min_instances" {
  description = "Minimum number of instances for auto-scaling"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances for auto-scaling"
  type        = number
  default     = 10
}