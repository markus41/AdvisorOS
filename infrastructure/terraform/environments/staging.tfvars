# Staging Environment Configuration for AdvisorOS

environment = "staging"
location    = "eastus"
app_url     = "https://staging.advisoros.com"

# CORS Origins for staging
allowed_origins = [
  "https://staging.advisoros.com",
  "http://localhost:3000"
]

# PostgreSQL Configuration - Medium for staging
postgres_sku        = "B_Standard_B2s"   # 2 vCores, 4 GB RAM
postgres_storage_mb = 65536             # 64 GB

# Cost Center
cost_center = "Engineering"

# Monitoring - Full for staging
enable_monitoring = true
alert_email      = "staging-alerts@cpaplatform.com"

# Backup Configuration - Standard for staging
backup_retention_days        = 14
enable_geo_redundant_backup = false

# Network Configuration
enable_private_endpoints = false
allowed_ip_ranges = [
  # Add office IP ranges here
]

# Auto-scaling - Limited for staging
min_capacity = 1
max_capacity = 3

# Custom Domain
custom_domain        = "staging.cpaplatform.com"
ssl_certificate_name = "staging-ssl-cert"

# Third-party Services - Use staging/test accounts
quickbooks_client_id     = ""  # Set via environment variable
quickbooks_client_secret = ""  # Set via environment variable
sendgrid_api_key        = ""  # Set via environment variable
sendgrid_from_email     = "staging@cpaplatform.com"