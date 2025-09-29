# Production Environment Configuration for AdvisorOS

# Environment Settings
environment = "prod"
location    = "eastus"
app_url     = "https://advisoros.com"

# Allowed origins for CORS
allowed_origins = [
  "https://advisoros.com",
  "https://www.advisoros.com"
]

# Cost and Management
cost_center = "Production"

# PostgreSQL Configuration
postgres_sku        = "GP_Standard_D4s_v3" # 4 vCores, 16GB RAM
postgres_storage_mb = 131072               # 128 GB

# Monitoring and Alerts
enable_monitoring = true
alert_email      = "alerts@advisoros.com"

# Backup Configuration
backup_retention_days        = 35
enable_geo_redundant_backup = true

# Auto-scaling Configuration
min_capacity = 3
max_capacity = 20

# Network Security
enable_private_endpoints = true
allowed_ip_ranges = [
  "203.0.113.0/24",  # Office IP range - replace with actual
  "198.51.100.0/24"  # Additional trusted range - replace with actual
]

# Custom Domain Configuration
custom_domain         = "advisoros.com"
ssl_certificate_name = "advisoros-ssl-cert"

# External Service Configuration (values should be set via environment variables or Azure Key Vault)
# These are placeholders - actual values should be configured securely
b2c_tenant_name              = "advisorosb2c"
b2c_user_flow_signup         = "B2C_1_signup_signin"
b2c_user_flow_password_reset = "B2C_1_password_reset"

# SendGrid Configuration
sendgrid_from_email = "noreply@advisoros.com"