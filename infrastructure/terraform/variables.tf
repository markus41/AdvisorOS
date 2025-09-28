# Variables for CPA Platform Terraform Configuration

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "app_url" {
  description = "Application URL for the environment"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "Engineering"
}

# PostgreSQL Configuration
variable "postgres_sku" {
  description = "SKU for PostgreSQL Flexible Server"
  type        = string
  default     = "B_Standard_B2s"
}

variable "postgres_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 32768 # 32 GB
}

# Azure AD B2C Configuration
variable "b2c_tenant_name" {
  description = "Azure AD B2C tenant name"
  type        = string
  default     = "cpaplatformb2c"
}

variable "b2c_user_flow_signup" {
  description = "B2C user flow name for signup/signin"
  type        = string
  default     = "B2C_1_signup_signin"
}

variable "b2c_user_flow_password_reset" {
  description = "B2C user flow name for password reset"
  type        = string
  default     = "B2C_1_password_reset"
}

# Monitoring and Alerts
variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}

variable "enable_monitoring" {
  description = "Enable advanced monitoring and alerts"
  type        = bool
  default     = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_geo_redundant_backup" {
  description = "Enable geo-redundant backups"
  type        = bool
  default     = false
}

# Network Configuration
variable "enable_private_endpoints" {
  description = "Enable private endpoints for services"
  type        = bool
  default     = false
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access resources"
  type        = list(string)
  default     = []
}

# Auto-scaling Configuration
variable "min_capacity" {
  description = "Minimum capacity for auto-scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum capacity for auto-scaling"
  type        = number
  default     = 10
}

# Custom Domain Configuration
variable "custom_domain" {
  description = "Custom domain for the application"
  type        = string
  default     = ""
}

variable "ssl_certificate_name" {
  description = "Name of the SSL certificate in Key Vault"
  type        = string
  default     = ""
}

# QuickBooks Integration
variable "quickbooks_client_id" {
  description = "QuickBooks OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "quickbooks_client_secret" {
  description = "QuickBooks OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# SendGrid Configuration
variable "sendgrid_api_key" {
  description = "SendGrid API key for email"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sendgrid_from_email" {
  description = "From email address for SendGrid"
  type        = string
  default     = "noreply@cpaplatform.com"
}