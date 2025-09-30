#!/bin/bash
# Validate Read Replica Health and Performance
# This script performs comprehensive validation of PostgreSQL read replicas

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="prod"
RESOURCE_GROUP=""
SUBSCRIPTION_ID=""
REPLICATION_LAG_THRESHOLD=10  # seconds
CPU_THRESHOLD=80              # percent
MEMORY_THRESHOLD=85           # percent

# Print functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
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
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$SUBSCRIPTION_ID" ] || [ -z "$RESOURCE_GROUP" ]; then
    print_error "Missing required parameters"
    echo "Usage: $0 --subscription <subscription-id> --resource-group <resource-group-name>"
    exit 1
fi

print_header "AdvisorOS Read Replica Validation"

# Set Azure subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Validation counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to run validation check
run_check() {
    local check_name=$1
    local check_command=$2
    local expected_result=$3

    print_info "Checking: $check_name"

    if result=$(eval "$check_command" 2>&1); then
        if [ "$expected_result" == "success" ] || [ "$result" == "$expected_result" ]; then
            print_success "$check_name passed"
            ((CHECKS_PASSED++))
            return 0
        fi
    fi

    print_error "$check_name failed: $result"
    ((CHECKS_FAILED++))
    return 1
}

# 1. Validate Primary Server
print_header "Step 1: Validate Primary Database Server"

PRIMARY_SERVER="${ENVIRONMENT}-advisoros-postgres"
PRIMARY_STATUS=$(az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$PRIMARY_SERVER" \
    --query "state" -o tsv 2>/dev/null || echo "Not found")

if [ "$PRIMARY_STATUS" == "Ready" ]; then
    print_success "Primary server is ready"
    ((CHECKS_PASSED++))
else
    print_error "Primary server is not ready. Status: $PRIMARY_STATUS"
    ((CHECKS_FAILED++))
fi

# 2. Validate Read Replica 1
print_header "Step 2: Validate Read Replica 1"

REPLICA_1_NAME="${ENVIRONMENT}-advisoros-postgres-replica-1"
REPLICA_1_STATUS=$(az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REPLICA_1_NAME" \
    --query "state" -o tsv 2>/dev/null || echo "Not found")

if [ "$REPLICA_1_STATUS" == "Ready" ]; then
    print_success "Read Replica 1 is ready"
    ((CHECKS_PASSED++))
else
    print_error "Read Replica 1 is not ready. Status: $REPLICA_1_STATUS"
    ((CHECKS_FAILED++))
fi

# 3. Check Replication Lag
print_header "Step 3: Check Replication Lag"

if [ "$REPLICA_1_STATUS" == "Ready" ]; then
    print_info "Fetching replication lag metrics (last 5 minutes)..."

    RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$REPLICA_1_NAME"

    LAG_METRICS=$(az monitor metrics list \
        --resource "$RESOURCE_ID" \
        --metric "physical_replication_delay_in_seconds" \
        --aggregation Average \
        --interval PT1M \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --query "value[0].timeseries[0].data[?average!=null].[timeStamp,average]" -o tsv 2>/dev/null || echo "N/A")

    if [ "$LAG_METRICS" != "N/A" ]; then
        # Calculate average and max lag
        AVG_LAG=$(echo "$LAG_METRICS" | awk '{sum+=$2; count++} END {if(count>0) print sum/count; else print 0}')
        MAX_LAG=$(echo "$LAG_METRICS" | awk '{max=$2; if($2>max) max=$2} END {print max}')

        echo ""
        echo "Replication Lag Statistics (Last 5 minutes):"
        echo "  Average: $(printf "%.2f" $AVG_LAG) seconds"
        echo "  Maximum: $(printf "%.2f" $MAX_LAG) seconds"
        echo "  Threshold: $REPLICATION_LAG_THRESHOLD seconds"
        echo ""

        if (( $(echo "$AVG_LAG < $REPLICATION_LAG_THRESHOLD" | bc -l) )); then
            print_success "Replication lag is within acceptable limits"
            ((CHECKS_PASSED++))
        elif (( $(echo "$AVG_LAG < $(($REPLICATION_LAG_THRESHOLD * 2))" | bc -l) )); then
            print_warning "Replication lag is elevated but acceptable"
            ((CHECKS_WARNING++))
        else
            print_error "Replication lag is too high"
            ((CHECKS_FAILED++))
        fi
    else
        print_warning "No replication lag metrics available (replica may be newly created)"
        ((CHECKS_WARNING++))
    fi
fi

# 4. Check CPU Usage
print_header "Step 4: Check CPU Usage"

for SERVER in "$PRIMARY_SERVER" "$REPLICA_1_NAME"; do
    print_info "Checking CPU for: $SERVER"

    RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$SERVER"

    CPU_AVG=$(az monitor metrics list \
        --resource "$RESOURCE_ID" \
        --metric "cpu_percent" \
        --aggregation Average \
        --interval PT5M \
        --start-time "$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --query "value[0].timeseries[0].data[?average!=null].average | [0]" -o tsv 2>/dev/null || echo "N/A")

    if [ "$CPU_AVG" != "N/A" ] && [ "$CPU_AVG" != "" ]; then
        if (( $(echo "$CPU_AVG < $CPU_THRESHOLD" | bc -l) )); then
            print_success "$SERVER CPU usage is normal: $(printf "%.1f" $CPU_AVG)%"
            ((CHECKS_PASSED++))
        else
            print_warning "$SERVER CPU usage is high: $(printf "%.1f" $CPU_AVG)%"
            ((CHECKS_WARNING++))
        fi
    else
        print_warning "No CPU metrics available for $SERVER"
        ((CHECKS_WARNING++))
    fi
done

# 5. Check Memory Usage
print_header "Step 5: Check Memory Usage"

for SERVER in "$PRIMARY_SERVER" "$REPLICA_1_NAME"; do
    print_info "Checking memory for: $SERVER"

    RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$SERVER"

    MEMORY_AVG=$(az monitor metrics list \
        --resource "$RESOURCE_ID" \
        --metric "memory_percent" \
        --aggregation Average \
        --interval PT5M \
        --start-time "$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --query "value[0].timeseries[0].data[?average!=null].average | [0]" -o tsv 2>/dev/null || echo "N/A")

    if [ "$MEMORY_AVG" != "N/A" ] && [ "$MEMORY_AVG" != "" ]; then
        if (( $(echo "$MEMORY_AVG < $MEMORY_THRESHOLD" | bc -l) )); then
            print_success "$SERVER memory usage is normal: $(printf "%.1f" $MEMORY_AVG)%"
            ((CHECKS_PASSED++))
        else
            print_warning "$SERVER memory usage is high: $(printf "%.1f" $MEMORY_AVG)%"
            ((CHECKS_WARNING++))
        fi
    else
        print_warning "No memory metrics available for $SERVER"
        ((CHECKS_WARNING++))
    fi
done

# 6. Check Active Connections
print_header "Step 6: Check Active Connections"

for SERVER in "$PRIMARY_SERVER" "$REPLICA_1_NAME"; do
    print_info "Checking connections for: $SERVER"

    RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$SERVER"

    CONNECTIONS=$(az monitor metrics list \
        --resource "$RESOURCE_ID" \
        --metric "active_connections" \
        --aggregation Average \
        --interval PT5M \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --query "value[0].timeseries[0].data[?average!=null].average | [0]" -o tsv 2>/dev/null || echo "N/A")

    if [ "$CONNECTIONS" != "N/A" ] && [ "$CONNECTIONS" != "" ]; then
        MAX_CONNECTIONS=200
        CONNECTION_PERCENT=$(echo "scale=1; ($CONNECTIONS / $MAX_CONNECTIONS) * 100" | bc)

        if (( $(echo "$CONNECTION_PERCENT < 75" | bc -l) )); then
            print_success "$SERVER connections: $(printf "%.0f" $CONNECTIONS) ($(printf "%.1f" $CONNECTION_PERCENT)% of max)"
            ((CHECKS_PASSED++))
        else
            print_warning "$SERVER connections are high: $(printf "%.0f" $CONNECTIONS) ($(printf "%.1f" $CONNECTION_PERCENT)% of max)"
            ((CHECKS_WARNING++))
        fi
    else
        print_warning "No connection metrics available for $SERVER"
        ((CHECKS_WARNING++))
    fi
done

# 7. Validate Monitoring Alerts
print_header "Step 7: Validate Monitoring Alerts"

print_info "Checking configured alerts..."

REPLICA_ALERTS=$(az monitor metrics alert list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?contains(name, 'replica')].{Name:name, Enabled:enabled, Severity:severity}" -o json)

ALERT_COUNT=$(echo "$REPLICA_ALERTS" | jq length)

if [ "$ALERT_COUNT" -gt 0 ]; then
    print_success "Found $ALERT_COUNT replica monitoring alerts"
    echo "$REPLICA_ALERTS" | jq -r '.[] | "  - \(.Name) (Enabled: \(.Enabled), Severity: \(.Severity))"'
    ((CHECKS_PASSED++))
else
    print_warning "No replica monitoring alerts found"
    ((CHECKS_WARNING++))
fi

# 8. Validate Diagnostic Settings
print_header "Step 8: Validate Diagnostic Settings"

for SERVER in "$PRIMARY_SERVER" "$REPLICA_1_NAME"; do
    print_info "Checking diagnostic settings for: $SERVER"

    RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$SERVER"

    DIAGNOSTICS=$(az monitor diagnostic-settings list \
        --resource "$RESOURCE_ID" \
        --query "value[].{Name:name, LogsEnabled:logs[?enabled==\`true\`] | length(@)}" -o json 2>/dev/null || echo "[]")

    DIAG_COUNT=$(echo "$DIAGNOSTICS" | jq length)

    if [ "$DIAG_COUNT" -gt 0 ]; then
        print_success "$SERVER has diagnostic settings configured"
        ((CHECKS_PASSED++))
    else
        print_warning "$SERVER has no diagnostic settings"
        ((CHECKS_WARNING++))
    fi
done

# 9. Validate Key Vault Secrets
print_header "Step 9: Validate Key Vault Connection Strings"

# Get Key Vault name from Terraform
cd "$(dirname "$0")/.."
KEY_VAULT_NAME=$(terraform output -raw key_vault_name 2>/dev/null || echo "")

if [ -n "$KEY_VAULT_NAME" ]; then
    print_info "Checking Key Vault: $KEY_VAULT_NAME"

    for SECRET in "database-readonly-url" "database-read-replica-1-url"; do
        if az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "$SECRET" >/dev/null 2>&1; then
            print_success "Secret exists: $SECRET"
            ((CHECKS_PASSED++))
        else
            print_error "Secret missing: $SECRET"
            ((CHECKS_FAILED++))
        fi
    done
else
    print_warning "Could not retrieve Key Vault name"
    ((CHECKS_WARNING++))
fi

# 10. Generate Validation Summary
print_header "Validation Summary"

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

cat << EOF

Total Checks: $TOTAL_CHECKS
${GREEN}Passed: $CHECKS_PASSED${NC}
${YELLOW}Warnings: $CHECKS_WARNING${NC}
${RED}Failed: $CHECKS_FAILED${NC}

EOF

if [ $CHECKS_FAILED -eq 0 ] && [ $CHECKS_WARNING -eq 0 ]; then
    print_header "${GREEN}ALL CHECKS PASSED - REPLICAS ARE HEALTHY${NC}"
    exit 0
elif [ $CHECKS_FAILED -eq 0 ]; then
    print_header "${YELLOW}CHECKS COMPLETED WITH WARNINGS${NC}"
    print_info "Review warnings above and take corrective action if needed"
    exit 0
else
    print_header "${RED}VALIDATION FAILED${NC}"
    print_error "$CHECKS_FAILED critical checks failed"
    print_info "Review failed checks above and fix issues before proceeding"
    exit 1
fi