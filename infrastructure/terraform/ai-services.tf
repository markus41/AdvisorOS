# Azure AI Services for AdvisorOS
# OpenAI, Form Recognizer, Search, and Redis Cache

# Azure OpenAI Service
resource "azurerm_cognitive_account" "openai" {
  name                = "${var.environment}-advisoros-openai"
  location            = var.environment == "prod" ? "eastus" : var.location # OpenAI available regions
  resource_group_name = azurerm_resource_group.main.name
  kind                = "OpenAI"
  sku_name           = "S0"

  # Network restrictions for production
  dynamic "network_acls" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      default_action = "Deny"

      # Allow from App Service subnet
      virtual_network_rules {
        subnet_id = azurerm_subnet.app_service.id
      }

      # Allow from specified IP ranges
      dynamic "ip_rules" {
        for_each = var.allowed_ip_ranges
        content {
          ip_range = ip_rules.value
        }
      }
    }
  }

  tags = local.tags
}

# OpenAI Deployments
resource "azurerm_cognitive_deployment" "gpt4" {
  name                 = "gpt-4"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "0613"
  }

  scale {
    type     = "Standard"
    capacity = var.environment == "prod" ? 50 : 10
  }
}

resource "azurerm_cognitive_deployment" "gpt35_turbo" {
  name                 = "gpt-35-turbo"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-35-turbo"
    version = "0613"
  }

  scale {
    type     = "Standard"
    capacity = var.environment == "prod" ? 100 : 20
  }
}

resource "azurerm_cognitive_deployment" "text_embedding" {
  name                 = "text-embedding-ada-002"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "text-embedding-ada-002"
    version = "2"
  }

  scale {
    type     = "Standard"
    capacity = var.environment == "prod" ? 50 : 10
  }
}

# Azure Form Recognizer (Document Intelligence)
resource "azurerm_cognitive_account" "form_recognizer" {
  name                = "${var.environment}-advisoros-formrecognizer"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "FormRecognizer"
  sku_name           = var.environment == "prod" ? "S0" : "F0"

  # Network restrictions for production
  dynamic "network_acls" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      default_action = "Deny"

      virtual_network_rules {
        subnet_id = azurerm_subnet.app_service.id
      }

      dynamic "ip_rules" {
        for_each = var.allowed_ip_ranges
        content {
          ip_range = ip_rules.value
        }
      }
    }
  }

  tags = local.tags
}

# Azure Cognitive Search
resource "azurerm_search_service" "main" {
  name                = "${var.environment}-advisoros-search"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                = var.environment == "prod" ? "standard" : "basic"
  replica_count      = var.environment == "prod" ? 2 : 1
  partition_count    = var.environment == "prod" ? 2 : 1

  # Enable semantic search for advanced document retrieval
  semantic_search_sku = var.environment == "prod" ? "standard" : "free"

  # Network access control
  public_network_access_enabled = var.environment != "prod"

  # IP rules for production
  dynamic "allowed_ips" {
    for_each = var.environment == "prod" ? var.allowed_ip_ranges : []
    content {
      value = allowed_ips.value
    }
  }

  tags = local.tags
}

# Redis Cache for session management and caching
resource "azurerm_redis_cache" "main" {
  name                = "${var.environment}-advisoros-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.environment == "prod" ? 1 : 0
  family              = var.environment == "prod" ? "P" : "C"
  sku_name           = var.environment == "prod" ? "Premium" : "Basic"

  # Redis configuration
  redis_configuration {
    enable_non_ssl_port = false
    maxmemory_reserved  = var.environment == "prod" ? 200 : 10
    maxmemory_delta     = var.environment == "prod" ? 200 : 10
    maxmemory_policy    = "allkeys-lru"
  }

  # Private endpoint for production
  public_network_access_enabled = var.environment != "prod"

  # Backup configuration for premium tier
  dynamic "redis_configuration" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      rdb_backup_enabled            = true
      rdb_backup_frequency         = 60
      rdb_backup_max_snapshot_count = 7
      rdb_storage_connection_string = azurerm_storage_account.redis_backup[0].primary_connection_string
    }
  }

  # Patch schedule for maintenance
  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 2
  }

  tags = local.tags
}

# Storage account for Redis backups (Premium tier only)
resource "azurerm_storage_account" "redis_backup" {
  count                    = var.environment == "prod" ? 1 : 0
  name                     = "${var.environment}advisorosredis${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"

  tags = local.tags
}

# Private endpoint for Redis (Premium tier)
resource "azurerm_private_endpoint" "redis" {
  count               = var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-advisoros-redis-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "redis-connection"
    private_connection_resource_id = azurerm_redis_cache.main.id
    is_manual_connection          = false
    subresource_names             = ["redisCache"]
  }

  tags = local.tags
}

# Text Analytics Service
resource "azurerm_cognitive_account" "text_analytics" {
  name                = "${var.environment}-advisoros-textanalytics"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "TextAnalytics"
  sku_name           = var.environment == "prod" ? "S" : "F0"

  dynamic "network_acls" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      default_action = "Deny"

      virtual_network_rules {
        subnet_id = azurerm_subnet.app_service.id
      }

      dynamic "ip_rules" {
        for_each = var.allowed_ip_ranges
        content {
          ip_range = ip_rules.value
        }
      }
    }
  }

  tags = local.tags
}

# Computer Vision for document processing
resource "azurerm_cognitive_account" "computer_vision" {
  name                = "${var.environment}-advisoros-vision"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "ComputerVision"
  sku_name           = var.environment == "prod" ? "S1" : "F0"

  dynamic "network_acls" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      default_action = "Deny"

      virtual_network_rules {
        subnet_id = azurerm_subnet.app_service.id
      }

      dynamic "ip_rules" {
        for_each = var.allowed_ip_ranges
        content {
          ip_range = ip_rules.value
        }
      }
    }
  }

  tags = local.tags
}