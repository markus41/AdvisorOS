# Azure Dashboard Configuration for AdvisorOS
# Comprehensive monitoring dashboard with database replica metrics

resource "azurerm_portal_dashboard" "main" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "${var.environment}-advisoros-dashboard"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  dashboard_properties = jsonencode({
    lenses = [
      {
        order = 0
        parts = [
          # Application Overview
          {
            position = {
              x        = 0
              y        = 0
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/HubsExtension/PartType/MarkdownPart"
              settings = {
                content = {
                  settings = {
                    content = "# AdvisorOS - ${upper(var.environment)} Environment\n\n## Infrastructure Overview\n- **Environment**: ${var.environment}\n- **Region**: ${azurerm_resource_group.main.location}\n- **Database**: PostgreSQL ${var.environment == "prod" ? "with Read Replicas" : "Single Instance"}\n- **Monitoring**: Application Insights + Log Analytics"
                  }
                }
              }
            }
          },
          # Application Health
          {
            position = {
              x        = 6
              y        = 0
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Application Availability"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_application_insights.main.id
                      name       = "availabilityResults/availabilityPercentage"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Database Primary Metrics
          {
            position = {
              x        = 0
              y        = 4
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Primary Database CPU"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "cpu_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Database Primary Memory
          {
            position = {
              x        = 4
              y        = 4
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Primary Database Memory"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "memory_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Database Connections
          {
            position = {
              x        = 8
              y        = 4
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Database Active Connections"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "active_connections"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Read Replica 1 Replication Lag (Production only)
          {
            position = {
              x        = 0
              y        = 8
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = var.environment == "prod" ? {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Read Replica 1 - Replication Lag"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "physical_replication_delay_in_seconds"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            } : null
          },
          # Read Replica 1 Performance (Production only)
          {
            position = {
              x        = 6
              y        = 8
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = var.environment == "prod" ? {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Read Replica 1 - CPU & Memory"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "cpu_percent"
                      aggregationType = "Average"
                    },
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "memory_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            } : null
          },
          # Application Response Time
          {
            position = {
              x        = 0
              y        = 12
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Application Response Time"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_linux_web_app.app.id
                      name       = "HttpResponseTime"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Application Error Rate
          {
            position = {
              x        = 6
              y        = 12
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Application Errors (5xx)"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_linux_web_app.app.id
                      name       = "Http5xx"
                      aggregationType = "Total"
                    }
                  ]
                }
              }
            }
          },
          # Redis Cache Performance
          {
            position = {
              x        = 0
              y        = 16
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Redis Cache - CPU & Memory"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_redis_cache.main.id
                      name       = "percentProcessorTime"
                      aggregationType = "Average"
                    },
                    {
                      resourceId = azurerm_redis_cache.main.id
                      name       = "usedmemorypercentage"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Storage Account Transactions
          {
            position = {
              x        = 6
              y        = 16
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Storage Account - Transactions"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_storage_account.documents.id
                      name       = "Transactions"
                      aggregationType = "Total"
                    }
                  ]
                }
              }
            }
          },
          # Log Analytics Query - Application Errors
          {
            position = {
              x        = 0
              y        = 20
              colSpan  = 12
              rowSpan  = 6
            }
            metadata = {
              type = "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
              settings = {
                content = {
                  Query = "AppExceptions | where TimeGenerated > ago(1h) | summarize Count = count() by Type, bin(TimeGenerated, 5m) | order by TimeGenerated desc | render timechart"
                  ControlType = "AnalyticsChart"
                  Scope = {
                    ResourceIds = [azurerm_log_analytics_workspace.main.id]
                  }
                  PartTitle = "Application Exceptions (Last Hour)"
                }
              }
            }
          },
          # Log Analytics Query - Slow Requests
          {
            position = {
              x        = 0
              y        = 26
              colSpan  = 12
              rowSpan  = 6
            }
            metadata = {
              type = "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
              settings = {
                content = {
                  Query = "AppRequests | where TimeGenerated > ago(1h) | where DurationMs > 3000 | project TimeGenerated, Name, Url, DurationMs, ResultCode | order by DurationMs desc | take 20"
                  ControlType = "AnalyticsGrid"
                  Scope = {
                    ResourceIds = [azurerm_log_analytics_workspace.main.id]
                  }
                  PartTitle = "Slow Requests (>3 seconds)"
                }
              }
            }
          }
        ]
      }
    ]
  })

  tags = merge(local.tags, {
    Purpose = "Monitoring"
    DashboardType = "Infrastructure"
  })
}

# Database Performance Dashboard (Production with replicas)
resource "azurerm_portal_dashboard" "database" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "${var.environment}-advisoros-database-dashboard"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  dashboard_properties = jsonencode({
    lenses = [
      {
        order = 0
        parts = [
          # Dashboard Header
          {
            position = {
              x        = 0
              y        = 0
              colSpan  = 12
              rowSpan  = 2
            }
            metadata = {
              type = "Extension/HubsExtension/PartType/MarkdownPart"
              settings = {
                content = {
                  settings = {
                    content = "# Database Performance Dashboard\n## PostgreSQL Flexible Server with Read Replicas\n**Environment**: Production | **Region**: ${azurerm_resource_group.main.location}"
                  }
                }
              }
            }
          },
          # Primary DB CPU
          {
            position = {
              x        = 0
              y        = 2
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Primary - CPU %"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "cpu_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Replica 1 CPU
          {
            position = {
              x        = 4
              y        = 2
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Replica 1 - CPU %"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "cpu_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Replication Lag
          {
            position = {
              x        = 8
              y        = 2
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Replica 1 - Replication Lag (seconds)"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "physical_replication_delay_in_seconds"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Primary DB Memory
          {
            position = {
              x        = 0
              y        = 6
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Primary - Memory %"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "memory_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Replica 1 Memory
          {
            position = {
              x        = 4
              y        = 6
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Replica 1 - Memory %"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "memory_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Storage Usage
          {
            position = {
              x        = 8
              y        = 6
              colSpan  = 4
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Storage Usage %"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "storage_percent"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Primary Connections
          {
            position = {
              x        = 0
              y        = 10
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Primary - Active Connections"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.main.id
                      name       = "active_connections"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Replica Connections
          {
            position = {
              x        = 6
              y        = 10
              colSpan  = 6
              rowSpan  = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              settings = {
                content = {
                  chartSettings = {
                    title         = "Replica 1 - Active Connections"
                    visualization = "timechart"
                  }
                  metrics = [
                    {
                      resourceId = azurerm_postgresql_flexible_server.read_replica_1[0].id
                      name       = "active_connections"
                      aggregationType = "Average"
                    }
                  ]
                }
              }
            }
          },
          # Slow Queries
          {
            position = {
              x        = 0
              y        = 14
              colSpan  = 12
              rowSpan  = 6
            }
            metadata = {
              type = "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
              settings = {
                content = {
                  Query = "AzureDiagnostics | where TimeGenerated > ago(1h) | where ResourceProvider == 'MICROSOFT.DBFORPOSTGRESQL' | where Category == 'PostgreSQLLogs' | where Message contains 'duration' | extend QueryDuration = extract('duration: ([0-9.]+) ms', 1, Message) | where todouble(QueryDuration) > 1000 | project TimeGenerated, ResourceId, QueryDuration, Message | order by todouble(QueryDuration) desc | take 20"
                  ControlType = "AnalyticsGrid"
                  Scope = {
                    ResourceIds = [azurerm_log_analytics_workspace.main.id]
                  }
                  PartTitle = "Slow Queries (>1 second)"
                }
              }
            }
          }
        ]
      }
    ]
  })

  tags = merge(local.tags, {
    Purpose = "Monitoring"
    DashboardType = "Database"
  })
}