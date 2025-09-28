# Production Environment Configuration

environment = "prod"
location    = "eastus"
app_url     = "https://app.cpaplatform.com"

# CORS Origins for production
allowed_origins = [
  "https://app.cpaplatform.com",
  "https://www.cpaplatform.com",
  "https://api.cpaplatform.com"
]

# PostgreSQL Configuration - Production grade
postgres_sku        = "GP_Standard_D4s_v3"  # 4 vCores, 16 GB RAM
postgres_storage_mb = 262144               # 256 GB

# Cost Center
cost_center = "Operations"

# Monitoring - Full for production
enable_monitoring = true
alert_email      = "ops-alerts@cpaplatform.com"

# Backup Configuration - Enterprise grade
backup_retention_days        = 30
enable_geo_redundant_backup = true

# Network Configuration - Secured
enable_private_endpoints = true
allowed_ip_ranges = [
  # Add whitelisted IP ranges here
  # Office IPs, monitoring services, etc.
]

# Auto-scaling - Full for production
min_capacity = 2
max_capacity = 10

# Custom Domain
custom_domain        = "app.cpaplatform.com"
ssl_certificate_name = "prod-ssl-cert"

# Third-party Services - Production accounts
quickbooks_client_id     = ""  # Set via environment variable
quickbooks_client_secret = ""  # Set via environment variable
sendgrid_api_key        = ""  # Set via environment variable
sendgrid_from_email     = "noreply@cpaplatform.com"