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