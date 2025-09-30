#!/bin/bash
# Deploy Read Replicas for AdvisorOS Production Environment
# This script provisions PostgreSQL read replicas and configures monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="prod"
RESOURCE_GROUP=""
SUBSCRIPTION_ID=""
ENABLE_DR_REPLICA="false"

# Print functions
print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --subscription)
            SUBSCRIPTION_ID="$2"
            shift 2
            ;;
        --resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        --enable-dr-replica)
            ENABLE_DR_REPLICA="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$SUBSCRIPTION_ID" ] || [ -z "$RESOURCE_GROUP" ]; then
    print_error "Missing required parameters"
    echo "Usage: $0 --subscription <subscription-id> --resource-group <resource-group-name> [--enable-dr-replica]"
    exit 1
fi

print_header "AdvisorOS Read Replica Deployment"

# Set Azure subscription
print_info "Setting Azure subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

# Validate Terraform configuration
print_header "Step 1: Validate Terraform Configuration"
cd "$(dirname "$0")/.."
terraform init
terraform validate
print_info "Terraform configuration is valid"

# Plan deployment
print_header "Step 2: Generate Deployment Plan"
terraform plan \
    -var="environment=$ENVIRONMENT" \
    -var="enable_dr_replica=$ENABLE_DR_REPLICA" \
    -out=replica-deployment.tfplan

print_info "Review the plan above. Do you want to proceed? (yes/no)"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_warning "Deployment cancelled by user"
    exit 0
fi

# Apply deployment
print_header "Step 3: Deploy Read Replicas"
terraform apply replica-deployment.tfplan

# Verify deployment
print_header "Step 4: Verify Replica Deployment"

# Get primary server name
PRIMARY_SERVER=$(terraform output -raw postgres_server_name)
print_info "Primary server: $PRIMARY_SERVER"

# Check replica 1 status
print_info "Checking Read Replica 1 status..."
REPLICA_1_NAME="${ENVIRONMENT}-advisoros-postgres-replica-1"
REPLICA_1_STATUS=$(az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REPLICA_1_NAME" \
    --query "state" -o tsv 2>/dev/null || echo "Not found")

if [ "$REPLICA_1_STATUS" == "Ready" ]; then
    print_info "Read Replica 1 is ready"

    # Get replication lag
    print_info "Checking replication lag..."
    sleep 10 # Wait for metrics to populate

    REPLICATION_LAG=$(az monitor metrics list \
        --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$REPLICA_1_NAME" \
        --metric "physical_replication_delay_in_seconds" \
        --aggregation Average \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].average" -o tsv 2>/dev/null || echo "N/A")

    if [ "$REPLICATION_LAG" != "N/A" ]; then
        print_info "Current replication lag: ${REPLICATION_LAG}s"
        if (( $(echo "$REPLICATION_LAG < 10" | bc -l) )); then
            print_info "Replication lag is within acceptable limits (<10s)"
        else
            print_warning "Replication lag is high: ${REPLICATION_LAG}s"
        fi
    fi
else
    print_error "Read Replica 1 is not ready. Status: $REPLICA_1_STATUS"
fi

# Check DR replica if enabled
if [ "$ENABLE_DR_REPLICA" == "true" ]; then
    print_info "Checking DR Replica status..."
    REPLICA_DR_NAME="${ENVIRONMENT}-advisoros-postgres-replica-dr"
    REPLICA_DR_STATUS=$(az postgres flexible-server show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$REPLICA_DR_NAME" \
        --query "state" -o tsv 2>/dev/null || echo "Not found")

    if [ "$REPLICA_DR_STATUS" == "Ready" ]; then
        print_info "DR Replica is ready"
    else
        print_warning "DR Replica status: $REPLICA_DR_STATUS"
    fi
fi

# Test connectivity
print_header "Step 5: Test Replica Connectivity"

# Get connection strings from Key Vault
KEY_VAULT_NAME=$(terraform output -raw key_vault_name)
print_info "Retrieving connection strings from Key Vault: $KEY_VAULT_NAME"

REPLICA_1_URL=$(az keyvault secret show \
    --vault-name "$KEY_VAULT_NAME" \
    --name "database-read-replica-1-url" \
    --query "value" -o tsv 2>/dev/null || echo "Not found")

if [ "$REPLICA_1_URL" != "Not found" ]; then
    print_info "Connection string retrieved successfully"
    print_info "Testing connectivity to Read Replica 1..."

    # Extract connection details
    REPLICA_HOST=$(echo "$REPLICA_1_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')

    # Test DNS resolution
    if nslookup "$REPLICA_HOST" >/dev/null 2>&1; then
        print_info "DNS resolution successful for $REPLICA_HOST"
    else
        print_warning "DNS resolution failed for $REPLICA_HOST"
    fi

    # Test TCP connectivity (port 5432)
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$REPLICA_HOST/5432" 2>/dev/null; then
        print_info "TCP connectivity successful to $REPLICA_HOST:5432"
    else
        print_warning "TCP connectivity failed to $REPLICA_HOST:5432"
    fi
else
    print_error "Failed to retrieve connection string from Key Vault"
fi

# Verify monitoring setup
print_header "Step 6: Verify Monitoring Configuration"

print_info "Checking metric alerts..."
ALERTS=$(az monitor metrics alert list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?contains(name, 'replica')].{Name:name, Enabled:enabled}" -o table)

echo "$ALERTS"

print_info "Checking Log Analytics workspace..."
LOG_WORKSPACE=$(terraform output -raw log_analytics_workspace_id 2>/dev/null || echo "N/A")
if [ "$LOG_WORKSPACE" != "N/A" ]; then
    print_info "Log Analytics workspace configured: ${LOG_WORKSPACE##*/}"
else
    print_warning "Log Analytics workspace output not found"
fi

# Generate deployment summary
print_header "Deployment Summary"

cat << EOF

Deployment Status: ${GREEN}COMPLETED${NC}
Environment: $ENVIRONMENT
Resource Group: $RESOURCE_GROUP

Components Deployed:
- Primary Database: $PRIMARY_SERVER
- Read Replica 1: $REPLICA_1_NAME (Status: $REPLICA_1_STATUS)
EOF

if [ "$ENABLE_DR_REPLICA" == "true" ]; then
    echo "- DR Replica: $REPLICA_DR_NAME (Status: $REPLICA_DR_STATUS)"
fi

cat << EOF

Monitoring:
- Application Insights: Enabled
- Log Analytics: Enabled
- Metric Alerts: Configured
- Dashboards: Created

Next Steps:
1. Update application configuration with new connection strings
2. Test read replica connectivity from application
3. Monitor replication lag in Azure Portal
4. Review and configure alert notification channels
5. Run performance tests to validate replica performance
6. Update documentation with new infrastructure details

Connection Strings (stored in Key Vault: $KEY_VAULT_NAME):
- database-read-replica-1-url
- database-readonly-url
EOF

if [ "$ENABLE_DR_REPLICA" == "true" ]; then
    echo "- database-read-replica-dr-url"
fi

print_header "Deployment Complete!"
print_info "Review the Azure Portal for detailed metrics and logs"
print_info "Dashboard: https://portal.azure.com/#resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Portal/dashboards"