# ================================================================
# Production Database Migration Script
# Handles schema migrations with safety checks and rollback capability
# ================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$MigrationName = "",

    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,

    [Parameter(Mandatory=$false)]
    [switch]$Rollback = $false,

    [Parameter(Mandatory=$false)]
    [int]$RollbackSteps = 1,

    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# ================================================================
# Configuration
# ================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Config = @{
    dev = @{
        ResourceGroup = "advisoros-dev-primary-rg"
        AppServiceName = "advisoros-dev-app"
        KeyVaultName = "advisoros-dev-kv"
        BackupRetention = 7
    }
    staging = @{
        ResourceGroup = "advisoros-staging-primary-rg"
        AppServiceName = "advisoros-staging-app"
        KeyVaultName = "advisoros-staging-kv"
        BackupRetention = 14
    }
    prod = @{
        ResourceGroup = "advisoros-prod-primary-rg"
        AppServiceName = "advisoros-prod-app"
        KeyVaultName = "advisoros-prod-kv"
        BackupRetention = 30
    }
}

$CurrentConfig = $Config[$Environment]

# ================================================================
# Logging Functions
# ================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage

    # Also log to file
    $logFile = "migration-$Environment-$(Get-Date -Format 'yyyyMMdd').log"
    Add-Content -Path $logFile -Value $logMessage
}

function Write-Success {
    param([string]$Message)
    Write-Log $Message "SUCCESS"
}

function Write-Warning {
    param([string]$Message)
    Write-Log $Message "WARNING"
}

function Write-Error {
    param([string]$Message)
    Write-Log $Message "ERROR"
}

# ================================================================
# Validation Functions
# ================================================================

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."

    # Check Azure CLI
    try {
        $azVersion = az --version 2>$null
        if (-not $azVersion) {
            throw "Azure CLI not found"
        }
        Write-Log "Azure CLI is available"
    }
    catch {
        Write-Error "Azure CLI is required but not found. Please install Azure CLI."
        exit 1
    }

    # Check login status
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if (-not $account) {
            throw "Not logged in"
        }
        Write-Log "Logged in as: $($account.user.name)"
    }
    catch {
        Write-Error "Please log in to Azure: az login"
        exit 1
    }

    # Check Node.js and npm
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        Write-Log "Node.js version: $nodeVersion"
        Write-Log "npm version: $npmVersion"
    }
    catch {
        Write-Error "Node.js and npm are required"
        exit 1
    }

    # Check if running in correct directory
    if (-not (Test-Path "package.json")) {
        Write-Error "Please run this script from the project root directory"
        exit 1
    }
}

function Test-ResourcesExist {
    Write-Log "Validating Azure resources exist..."

    # Check resource group
    $rg = az group show --name $CurrentConfig.ResourceGroup 2>$null | ConvertFrom-Json
    if (-not $rg) {
        Write-Error "Resource group $($CurrentConfig.ResourceGroup) not found"
        exit 1
    }

    # Check App Service
    $app = az webapp show --name $CurrentConfig.AppServiceName --resource-group $CurrentConfig.ResourceGroup 2>$null | ConvertFrom-Json
    if (-not $app) {
        Write-Error "App Service $($CurrentConfig.AppServiceName) not found"
        exit 1
    }

    Write-Success "All required resources exist"
}

# ================================================================
# Database Functions
# ================================================================

function Get-DatabaseConnectionString {
    Write-Log "Retrieving database connection string..."

    try {
        $connectionString = az keyvault secret show `
            --vault-name $CurrentConfig.KeyVaultName `
            --name "database-connection-string" `
            --query "value" -o tsv

        if (-not $connectionString) {
            throw "Connection string not found in Key Vault"
        }

        return $connectionString
    }
    catch {
        Write-Error "Failed to retrieve database connection string: $_"
        exit 1
    }
}

function Backup-Database {
    param([string]$ConnectionString)

    Write-Log "Creating database backup..."

    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $backupFile = "backup-$Environment-$timestamp.sql"

    try {
        # Extract database details from connection string
        if ($ConnectionString -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)") {
            $username = $matches[1]
            $password = $matches[2]
            $server = $matches[3]
            $port = $matches[4]
            $database = $matches[5]

            # Set PGPASSWORD environment variable
            $env:PGPASSWORD = $password

            # Create backup using pg_dump
            Write-Log "Creating backup: $backupFile"
            pg_dump -h $server -p $port -U $username -d $database -f $backupFile --verbose

            if ($LASTEXITCODE -ne 0) {
                throw "pg_dump failed with exit code $LASTEXITCODE"
            }

            # Upload backup to Azure Storage
            $storageAccount = az storage account list --resource-group $CurrentConfig.ResourceGroup --query "[0].name" -o tsv
            $storageKey = az storage account keys list --resource-group $CurrentConfig.ResourceGroup --account-name $storageAccount --query "[0].value" -o tsv

            az storage blob upload `
                --account-name $storageAccount `
                --account-key $storageKey `
                --container-name "backups" `
                --name "database/$backupFile" `
                --file $backupFile `
                --overwrite

            Write-Success "Database backup completed: $backupFile"
            return $backupFile
        }
        else {
            throw "Invalid connection string format"
        }
    }
    catch {
        Write-Error "Database backup failed: $_"
        exit 1
    }
    finally {
        # Clean up environment variable
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

        # Clean up local backup file
        if (Test-Path $backupFile) {
            Remove-Item $backupFile
        }
    }
}

function Test-DatabaseConnection {
    param([string]$ConnectionString)

    Write-Log "Testing database connection..."

    try {
        if ($ConnectionString -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)") {
            $username = $matches[1]
            $password = $matches[2]
            $server = $matches[3]
            $port = $matches[4]
            $database = $matches[5]

            $env:PGPASSWORD = $password

            # Test connection
            $result = psql -h $server -p $port -U $username -d $database -c "SELECT 1;" -t 2>&1

            if ($LASTEXITCODE -ne 0) {
                throw "Connection test failed: $result"
            }

            Write-Success "Database connection successful"
        }
        else {
            throw "Invalid connection string format"
        }
    }
    catch {
        Write-Error "Database connection failed: $_"
        exit 1
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Get-MigrationStatus {
    Write-Log "Checking migration status..."

    try {
        # Run Prisma migrate status
        $status = npx prisma migrate status --schema apps/web/prisma/schema.prisma 2>&1
        Write-Log "Migration status: $status"
        return $status
    }
    catch {
        Write-Error "Failed to check migration status: $_"
        exit 1
    }
}

# ================================================================
# Migration Functions
# ================================================================

function Invoke-Migration {
    param([string]$ConnectionString, [bool]$IsDryRun)

    if ($IsDryRun) {
        Write-Log "Performing dry run migration..."
        Write-Warning "DRY RUN MODE - No actual changes will be made"
    }
    else {
        Write-Log "Performing database migration..."
    }

    try {
        # Set environment variables
        $env:DATABASE_URL = $ConnectionString
        $env:NODE_ENV = $Environment

        if ($IsDryRun) {
            # Generate migration without applying
            npx prisma migrate diff --from-schema-datamodel apps/web/prisma/schema.prisma --to-schema-datasource apps/web/prisma/schema.prisma --script
        }
        else {
            # Apply migrations
            npx prisma migrate deploy --schema apps/web/prisma/schema.prisma
        }

        if ($LASTEXITCODE -ne 0) {
            throw "Migration command failed with exit code $LASTEXITCODE"
        }

        if ($IsDryRun) {
            Write-Success "Dry run completed successfully"
        }
        else {
            Write-Success "Migration completed successfully"
        }
    }
    catch {
        Write-Error "Migration failed: $_"
        exit 1
    }
    finally {
        # Clean up environment variables
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
        Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    }
}

function Invoke-Rollback {
    param([string]$ConnectionString, [int]$Steps)

    Write-Warning "Rolling back $Steps migration step(s)..."
    Write-Warning "This operation cannot be undone!"

    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to proceed? Type 'ROLLBACK' to confirm"
        if ($confirmation -ne "ROLLBACK") {
            Write-Log "Rollback cancelled by user"
            exit 0
        }
    }

    try {
        $env:DATABASE_URL = $ConnectionString

        # Note: Prisma doesn't support automatic rollbacks
        # This would need to be implemented with custom rollback scripts
        Write-Warning "Prisma doesn't support automatic rollbacks."
        Write-Warning "Please manually execute rollback scripts or restore from backup."

        # List available backups
        $storageAccount = az storage account list --resource-group $CurrentConfig.ResourceGroup --query "[0].name" -o tsv
        $storageKey = az storage account keys list --resource-group $CurrentConfig.ResourceGroup --account-name $storageAccount --query "[0].value" -o tsv

        $backups = az storage blob list `
            --account-name $storageAccount `
            --account-key $storageKey `
            --container-name "backups" `
            --prefix "database/" `
            --query "[].name" -o tsv | Sort-Object -Descending

        Write-Log "Available backups:"
        $backups | ForEach-Object { Write-Log "  - $_" }
    }
    catch {
        Write-Error "Rollback preparation failed: $_"
        exit 1
    }
    finally {
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    }
}

# ================================================================
# Post-Migration Functions
# ================================================================

function Test-ApplicationHealth {
    Write-Log "Testing application health after migration..."

    try {
        $appUrl = "https://$($CurrentConfig.AppServiceName).azurewebsites.net"

        # Test health endpoint
        $healthResponse = Invoke-RestMethod -Uri "$appUrl/api/health" -Method Get -TimeoutSec 30

        if ($healthResponse.status -eq "ok") {
            Write-Success "Application health check passed"
        }
        else {
            throw "Health check failed: $($healthResponse.status)"
        }

        # Test database connectivity
        $dbHealthResponse = Invoke-RestMethod -Uri "$appUrl/api/health/database" -Method Get -TimeoutSec 30

        if ($dbHealthResponse.status -eq "ok") {
            Write-Success "Database connectivity check passed"
        }
        else {
            throw "Database connectivity check failed: $($dbHealthResponse.status)"
        }
    }
    catch {
        Write-Error "Application health check failed: $_"
        Write-Warning "Consider rolling back the migration if issues persist"
    }
}

function Update-MigrationLog {
    param([string]$Status, [string]$BackupFile = "")

    $logEntry = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        environment = $Environment
        status = $Status
        backupFile = $BackupFile
        migrationName = $MigrationName
        gitCommit = (git rev-parse HEAD 2>$null)
        operator = $env:USERNAME
    }

    $logJson = $logEntry | ConvertTo-Json -Compress
    Write-Log "Migration log entry: $logJson"

    # Store in Azure Table Storage or similar for audit trail
    # This would require additional setup
}

# ================================================================
# Main Execution
# ================================================================

function Main {
    Write-Log "Starting database migration for environment: $Environment"

    # Validate prerequisites
    Test-Prerequisites
    Test-ResourcesExist

    # Get database connection
    $connectionString = Get-DatabaseConnectionString
    Test-DatabaseConnection $connectionString

    # Check current migration status
    Get-MigrationStatus

    if ($Rollback) {
        Invoke-Rollback $connectionString $RollbackSteps
        Update-MigrationLog "ROLLBACK_INITIATED"
        return
    }

    # Create backup (skip for dry run)
    $backupFile = ""
    if (-not $DryRun) {
        $backupFile = Backup-Database $connectionString
    }

    try {
        # Perform migration
        Invoke-Migration $connectionString $DryRun

        if (-not $DryRun) {
            # Test application health
            Start-Sleep -Seconds 30  # Give app time to restart
            Test-ApplicationHealth

            # Update migration log
            Update-MigrationLog "SUCCESS" $backupFile

            Write-Success "Migration completed successfully!"
            Write-Log "Backup file: $backupFile"
        }
    }
    catch {
        if (-not $DryRun) {
            Update-MigrationLog "FAILED" $backupFile
            Write-Error "Migration failed. Backup available: $backupFile"
            Write-Log "Consider restoring from backup if needed"
        }
        throw
    }
}

# ================================================================
# Entry Point
# ================================================================

try {
    Main
}
catch {
    Write-Error "Script execution failed: $_"
    exit 1
}