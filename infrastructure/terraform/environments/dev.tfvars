# Development Environment Configuration

environment = "dev"
location    = "eastus"
app_url     = "http://localhost:3000"

# CORS Origins for development
allowed_origins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000"
]

# PostgreSQL Configuration - Minimal for dev
postgres_sku        = "B_Standard_B1ms"  # 1 vCore, 2 GB RAM
postgres_storage_mb = 32768              # 32 GB

# Cost Center
cost_center = "Development"

# Monitoring - Basic for dev
enable_monitoring = true
alert_email      = "dev-team@cpaplatform.com"

# Backup Configuration - Minimal for dev
backup_retention_days        = 7
enable_geo_redundant_backup = false

# Network Configuration
enable_private_endpoints = false
allowed_ip_ranges       = [] # Open for development

# Auto-scaling - Disabled for dev
min_capacity = 1
max_capacity = 1

# Custom Domain - Not used in dev
custom_domain        = ""
ssl_certificate_name = ""

# Third-party Services - Use dev/sandbox accounts
quickbooks_client_id     = ""  # Set via environment variable
quickbooks_client_secret = ""  # Set via environment variable
sendgrid_api_key        = ""  # Set via environment variable
sendgrid_from_email     = "dev@cpaplatform.com"