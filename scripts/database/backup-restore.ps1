# ================================================================
# Database Backup and Restore Script
# Comprehensive backup/restore solution with encryption and verification
# ================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backup", "restore", "list", "cleanup", "verify")]
    [string]$Operation,

    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$BackupName = "",

    [Parameter(Mandatory=$false)]
    [string]$RestorePoint = "",

    [Parameter(Mandatory=$false)]
    [switch]$Encrypted = $false,

    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30,

    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,

    [Parameter(Mandatory=$false)]
    [switch]$Verify = $true
)

# ================================================================
# Configuration
# ================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Config = @{
    dev = @{
        ResourceGroup = "advisoros-dev-primary-rg"
        StorageAccount = "advisorosdevsa"
        KeyVaultName = "advisoros-dev-kv"
        RetentionDays = 7
        BackupSchedule = "Daily"
    }
    staging = @{
        ResourceGroup = "advisoros-staging-primary-rg"
        StorageAccount = "advisorosstagingsa"
        KeyVaultName = "advisoros-staging-kv"
        RetentionDays = 14
        BackupSchedule = "Daily"
    }
    prod = @{
        ResourceGroup = "advisoros-prod-primary-rg"
        StorageAccount = "advisorosprodsa"
        KeyVaultName = "advisoros-prod-kv"
        RetentionDays = 30
        BackupSchedule = "Every 6 hours"
    }
}

$CurrentConfig = $Config[$Environment]

# ================================================================
# Utility Functions
# ================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] [$Operation] $Message"
    Write-Host $logMessage

    $logFile = "backup-restore-$Environment-$(Get-Date -Format 'yyyyMMdd').log"
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

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."

    # Check Azure CLI
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Error "Azure CLI is required but not found"
        exit 1
    }

    # Check PostgreSQL tools
    if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
        Write-Error "PostgreSQL client tools are required (pg_dump, psql)"
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

    Write-Success "Prerequisites check passed"
}

# ================================================================
# Storage Functions
# ================================================================

function Get-StorageCredentials {
    Write-Log "Retrieving storage credentials..."

    try {
        # Get storage account name (auto-discover if not provided)
        if (-not $CurrentConfig.StorageAccount) {
            $storageAccount = az storage account list --resource-group $CurrentConfig.ResourceGroup --query "[0].name" -o tsv
        }
        else {
            $storageAccount = $CurrentConfig.StorageAccount
        }

        $storageKey = az storage account keys list --resource-group $CurrentConfig.ResourceGroup --account-name $storageAccount --query "[0].value" -o tsv

        return @{
            AccountName = $storageAccount
            AccountKey = $storageKey
        }
    }
    catch {
        Write-Error "Failed to retrieve storage credentials: $_"
        exit 1
    }
}

function Ensure-BackupContainer {
    param($StorageCredentials)

    Write-Log "Ensuring backup container exists..."

    try {
        az storage container create `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --name "database-backups" `
            --public-access off 2>$null

        Write-Success "Backup container ready"
    }
    catch {
        Write-Error "Failed to create backup container: $_"
        exit 1
    }
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

function Parse-ConnectionString {
    param([string]$ConnectionString)

    if ($ConnectionString -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)") {
        return @{
            Username = $matches[1]
            Password = $matches[2]
            Server = $matches[3]
            Port = $matches[4]
            Database = $matches[5]
        }
    }
    else {
        throw "Invalid connection string format"
    }
}

function Test-DatabaseConnection {
    param($DbConfig)

    Write-Log "Testing database connection..."

    try {
        $env:PGPASSWORD = $DbConfig.Password

        $result = psql -h $DbConfig.Server -p $DbConfig.Port -U $DbConfig.Username -d $DbConfig.Database -c "SELECT version();" -t 2>&1

        if ($LASTEXITCODE -ne 0) {
            throw "Connection test failed: $result"
        }

        Write-Success "Database connection successful"
    }
    catch {
        Write-Error "Database connection failed: $_"
        exit 1
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# ================================================================
# Backup Functions
# ================================================================

function New-DatabaseBackup {
    param($DbConfig, $StorageCredentials, [bool]$IsEncrypted)

    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $backupName = if ($BackupName) { $BackupName } else { "backup-$Environment-$timestamp" }
    $backupFile = "$backupName.sql"
    $backupPath = Join-Path $env:TEMP $backupFile

    Write-Log "Creating database backup: $backupName"

    try {
        # Set environment variables
        $env:PGPASSWORD = $DbConfig.Password

        # Create backup using pg_dump
        $pgDumpArgs = @(
            "-h", $DbConfig.Server
            "-p", $DbConfig.Port
            "-U", $DbConfig.Username
            "-d", $DbConfig.Database
            "--verbose"
            "--no-password"
            "--clean"
            "--if-exists"
            "--create"
            "--format=custom"
            "--file=$backupPath"
        )

        Write-Log "Running pg_dump with arguments: $($pgDumpArgs -join ' ')"
        & pg_dump @pgDumpArgs

        if ($LASTEXITCODE -ne 0) {
            throw "pg_dump failed with exit code $LASTEXITCODE"
        }

        # Verify backup file exists and has content
        if (-not (Test-Path $backupPath) -or (Get-Item $backupPath).Length -eq 0) {
            throw "Backup file is empty or doesn't exist"
        }

        $backupSize = (Get-Item $backupPath).Length
        Write-Log "Backup created successfully, size: $([math]::Round($backupSize / 1MB, 2)) MB"

        # Encrypt backup if requested
        if ($IsEncrypted) {
            $encryptedPath = "$backupPath.enc"
            Protect-BackupFile $backupPath $encryptedPath
            Remove-Item $backupPath
            $backupPath = $encryptedPath
            $backupFile = "$backupName.sql.enc"
        }

        # Upload to Azure Storage
        $blobName = "backups/$Environment/$backupFile"

        Write-Log "Uploading backup to Azure Storage: $blobName"
        az storage blob upload `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --container-name "database-backups" `
            --name $blobName `
            --file $backupPath `
            --overwrite `
            --metadata "environment=$Environment" "timestamp=$timestamp" "encrypted=$IsEncrypted"

        if ($LASTEXITCODE -ne 0) {
            throw "Failed to upload backup to storage"
        }

        # Verify upload
        $uploadedBlob = az storage blob show `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --container-name "database-backups" `
            --name $blobName `
            --query "properties.contentLength" -o tsv

        if ([int]$uploadedBlob -ne (Get-Item $backupPath).Length) {
            throw "Upload verification failed - size mismatch"
        }

        Write-Success "Backup completed successfully: $blobName"

        # Create backup manifest
        $manifest = @{
            name = $backupName
            file = $blobName
            environment = $Environment
            timestamp = $timestamp
            size = $backupSize
            encrypted = $IsEncrypted
            database = $DbConfig.Database
            server = $DbConfig.Server
            version = (Get-DatabaseVersion $DbConfig)
        }

        $manifestJson = $manifest | ConvertTo-Json -Compress
        Write-Log "Backup manifest: $manifestJson"

        return $manifest
    }
    catch {
        Write-Error "Backup failed: $_"
        exit 1
    }
    finally {
        # Cleanup
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        if (Test-Path $backupPath) {
            Remove-Item $backupPath -Force
        }
    }
}

function Protect-BackupFile {
    param([string]$InputPath, [string]$OutputPath)

    Write-Log "Encrypting backup file..."

    try {
        # Get encryption key from Key Vault
        $encryptionKey = az keyvault secret show `
            --vault-name $CurrentConfig.KeyVaultName `
            --name "backup-encryption-key" `
            --query "value" -o tsv

        if (-not $encryptionKey) {
            throw "Encryption key not found in Key Vault"
        }

        # Use OpenSSL for encryption (requires OpenSSL to be installed)
        if (Get-Command openssl -ErrorAction SilentlyContinue) {
            $env:ENCRYPTION_KEY = $encryptionKey
            & openssl enc -aes-256-cbc -salt -in $InputPath -out $OutputPath -pass env:ENCRYPTION_KEY
            Remove-Item Env:ENCRYPTION_KEY
        }
        else {
            throw "OpenSSL is required for encryption but not found"
        }

        Write-Success "Backup encrypted successfully"
    }
    catch {
        Write-Error "Encryption failed: $_"
        throw
    }
}

function Get-DatabaseVersion {
    param($DbConfig)

    try {
        $env:PGPASSWORD = $DbConfig.Password
        $version = psql -h $DbConfig.Server -p $DbConfig.Port -U $DbConfig.Username -d $DbConfig.Database -c "SELECT version();" -t | ForEach-Object { $_.Trim() }
        return $version
    }
    catch {
        return "Unknown"
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# ================================================================
# Restore Functions
# ================================================================

function Restore-DatabaseBackup {
    param($DbConfig, $StorageCredentials, [string]$BackupName)

    Write-Warning "Database restore operation starting..."
    Write-Warning "This will OVERWRITE the current database!"

    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to proceed? Type 'RESTORE' to confirm"
        if ($confirmation -ne "RESTORE") {
            Write-Log "Restore cancelled by user"
            exit 0
        }
    }

    try {
        # Find backup file
        $backupBlob = Find-BackupBlob $StorageCredentials $BackupName

        if (-not $backupBlob) {
            throw "Backup '$BackupName' not found"
        }

        Write-Log "Found backup: $($backupBlob.name)"

        # Download backup
        $localBackupPath = Join-Path $env:TEMP "restore-$(Get-Date -Format 'yyyyMMddHHmmss').sql"

        Write-Log "Downloading backup from storage..."
        az storage blob download `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --container-name "database-backups" `
            --name $backupBlob.name `
            --file $localBackupPath

        # Decrypt if necessary
        if ($backupBlob.name -like "*.enc") {
            $decryptedPath = $localBackupPath -replace "\.enc$", ""
            Unprotect-BackupFile $localBackupPath $decryptedPath
            Remove-Item $localBackupPath
            $localBackupPath = $decryptedPath
        }

        # Verify backup integrity
        if ($Verify) {
            Test-BackupIntegrity $localBackupPath
        }

        # Create pre-restore backup
        Write-Log "Creating pre-restore backup..."
        $preRestoreBackup = New-DatabaseBackup $DbConfig $StorageCredentials $false
        Write-Log "Pre-restore backup: $($preRestoreBackup.name)"

        # Perform restore
        Write-Log "Restoring database from backup..."
        $env:PGPASSWORD = $DbConfig.Password

        # Use pg_restore for custom format backups
        $pgRestoreArgs = @(
            "-h", $DbConfig.Server
            "-p", $DbConfig.Port
            "-U", $DbConfig.Username
            "-d", $DbConfig.Database
            "--verbose"
            "--clean"
            "--if-exists"
            "--no-password"
            "--single-transaction"
            $localBackupPath
        )

        Write-Log "Running pg_restore..."
        & pg_restore @pgRestoreArgs

        if ($LASTEXITCODE -ne 0) {
            throw "pg_restore failed with exit code $LASTEXITCODE"
        }

        Write-Success "Database restore completed successfully"
        Write-Log "Pre-restore backup available: $($preRestoreBackup.name)"
    }
    catch {
        Write-Error "Restore failed: $_"
        Write-Log "You may need to restore from the pre-restore backup"
        exit 1
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        if (Test-Path $localBackupPath) {
            Remove-Item $localBackupPath -Force
        }
    }
}

function Unprotect-BackupFile {
    param([string]$InputPath, [string]$OutputPath)

    Write-Log "Decrypting backup file..."

    try {
        $encryptionKey = az keyvault secret show `
            --vault-name $CurrentConfig.KeyVaultName `
            --name "backup-encryption-key" `
            --query "value" -o tsv

        if (-not $encryptionKey) {
            throw "Encryption key not found in Key Vault"
        }

        $env:ENCRYPTION_KEY = $encryptionKey
        & openssl enc -aes-256-cbc -d -in $InputPath -out $OutputPath -pass env:ENCRYPTION_KEY
        Remove-Item Env:ENCRYPTION_KEY

        Write-Success "Backup decrypted successfully"
    }
    catch {
        Write-Error "Decryption failed: $_"
        throw
    }
}

function Test-BackupIntegrity {
    param([string]$BackupPath)

    Write-Log "Verifying backup integrity..."

    try {
        # Use pg_restore to verify the backup without actually restoring
        $pgRestoreArgs = @(
            "--list"
            $BackupPath
        )

        $output = & pg_restore @pgRestoreArgs 2>&1

        if ($LASTEXITCODE -ne 0) {
            throw "Backup integrity check failed: $output"
        }

        Write-Success "Backup integrity verified"
    }
    catch {
        Write-Error "Backup integrity check failed: $_"
        throw
    }
}

# ================================================================
# List and Cleanup Functions
# ================================================================

function Get-BackupList {
    param($StorageCredentials)

    Write-Log "Listing available backups..."

    try {
        $blobs = az storage blob list `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --container-name "database-backups" `
            --prefix "backups/$Environment/" `
            --query "[].{name:name,lastModified:properties.lastModified,size:properties.contentLength,metadata:metadata}" `
            -o json | ConvertFrom-Json

        if ($blobs.Count -eq 0) {
            Write-Log "No backups found for environment: $Environment"
            return
        }

        Write-Log "Available backups for $Environment environment:"
        Write-Log ("=" * 80)
        Write-Log ("{0,-30} {1,-20} {2,-15} {3}" -f "Name", "Date", "Size (MB)", "Encrypted")
        Write-Log ("=" * 80)

        foreach ($blob in $blobs | Sort-Object lastModified -Descending) {
            $name = Split-Path $blob.name -Leaf
            $date = [DateTime]::Parse($blob.lastModified).ToString("yyyy-MM-dd HH:mm")
            $sizeMB = [math]::Round($blob.size / 1MB, 2)
            $encrypted = if ($blob.metadata.encrypted -eq "true") { "Yes" } else { "No" }

            Write-Log ("{0,-30} {1,-20} {2,-15} {3}" -f $name, $date, $sizeMB, $encrypted)
        }

        return $blobs
    }
    catch {
        Write-Error "Failed to list backups: $_"
        exit 1
    }
}

function Find-BackupBlob {
    param($StorageCredentials, [string]$BackupName)

    try {
        $blobs = az storage blob list `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --container-name "database-backups" `
            --prefix "backups/$Environment/" `
            -o json | ConvertFrom-Json

        # Find exact match or partial match
        $matchingBlob = $blobs | Where-Object {
            $blobName = Split-Path $_.name -Leaf
            $blobName -eq $BackupName -or $blobName -like "*$BackupName*"
        } | Sort-Object lastModified -Descending | Select-Object -First 1

        return $matchingBlob
    }
    catch {
        Write-Error "Failed to find backup: $_"
        return $null
    }
}

function Remove-OldBackups {
    param($StorageCredentials, [int]$RetentionDays)

    Write-Log "Cleaning up backups older than $RetentionDays days..."

    try {
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)

        $oldBlobs = az storage blob list `
            --account-name $StorageCredentials.AccountName `
            --account-key $StorageCredentials.AccountKey `
            --container-name "database-backups" `
            --prefix "backups/$Environment/" `
            --query "[?properties.lastModified < '$($cutoffDate.ToString('yyyy-MM-ddTHH:mm:ssZ'))'].name" `
            -o tsv

        if (-not $oldBlobs) {
            Write-Log "No old backups to clean up"
            return
        }

        $deleteCount = 0
        foreach ($blobName in $oldBlobs) {
            Write-Log "Deleting old backup: $blobName"

            az storage blob delete `
                --account-name $StorageCredentials.AccountName `
                --account-key $StorageCredentials.AccountKey `
                --container-name "database-backups" `
                --name $blobName

            $deleteCount++
        }

        Write-Success "Cleaned up $deleteCount old backup(s)"
    }
    catch {
        Write-Error "Cleanup failed: $_"
        exit 1
    }
}

# ================================================================
# Main Operations
# ================================================================

function Invoke-BackupOperation {
    Write-Log "Starting backup operation for environment: $Environment"

    Test-Prerequisites
    $storageCredentials = Get-StorageCredentials
    Ensure-BackupContainer $storageCredentials

    $connectionString = Get-DatabaseConnectionString
    $dbConfig = Parse-ConnectionString $connectionString
    Test-DatabaseConnection $dbConfig

    $backup = New-DatabaseBackup $dbConfig $storageCredentials $Encrypted

    Write-Success "Backup operation completed successfully"
    Write-Log "Backup name: $($backup.name)"
    Write-Log "Backup size: $([math]::Round($backup.size / 1MB, 2)) MB"
}

function Invoke-RestoreOperation {
    if (-not $RestorePoint) {
        Write-Error "RestorePoint parameter is required for restore operation"
        exit 1
    }

    Write-Log "Starting restore operation for environment: $Environment"

    Test-Prerequisites
    $storageCredentials = Get-StorageCredentials

    $connectionString = Get-DatabaseConnectionString
    $dbConfig = Parse-ConnectionString $connectionString
    Test-DatabaseConnection $dbConfig

    Restore-DatabaseBackup $dbConfig $storageCredentials $RestorePoint

    Write-Success "Restore operation completed successfully"
}

function Invoke-ListOperation {
    Test-Prerequisites
    $storageCredentials = Get-StorageCredentials
    Get-BackupList $storageCredentials
}

function Invoke-CleanupOperation {
    Write-Log "Starting cleanup operation for environment: $Environment"

    Test-Prerequisites
    $storageCredentials = Get-StorageCredentials

    $retention = if ($RetentionDays -gt 0) { $RetentionDays } else { $CurrentConfig.RetentionDays }
    Remove-OldBackups $storageCredentials $retention

    Write-Success "Cleanup operation completed successfully"
}

function Invoke-VerifyOperation {
    if (-not $BackupName) {
        Write-Error "BackupName parameter is required for verify operation"
        exit 1
    }

    Write-Log "Starting verify operation for backup: $BackupName"

    Test-Prerequisites
    $storageCredentials = Get-StorageCredentials

    $backupBlob = Find-BackupBlob $storageCredentials $BackupName
    if (-not $backupBlob) {
        Write-Error "Backup not found: $BackupName"
        exit 1
    }

    # Download and verify
    $tempPath = Join-Path $env:TEMP "verify-$(Get-Date -Format 'yyyyMMddHHmmss').sql"

    try {
        az storage blob download `
            --account-name $storageCredentials.AccountName `
            --account-key $storageCredentials.AccountKey `
            --container-name "database-backups" `
            --name $backupBlob.name `
            --file $tempPath

        Test-BackupIntegrity $tempPath
        Write-Success "Backup verification completed successfully"
    }
    finally {
        if (Test-Path $tempPath) {
            Remove-Item $tempPath -Force
        }
    }
}

# ================================================================
# Entry Point
# ================================================================

try {
    switch ($Operation) {
        "backup" { Invoke-BackupOperation }
        "restore" { Invoke-RestoreOperation }
        "list" { Invoke-ListOperation }
        "cleanup" { Invoke-CleanupOperation }
        "verify" { Invoke-VerifyOperation }
        default {
            Write-Error "Invalid operation: $Operation"
            exit 1
        }
    }
}
catch {
    Write-Error "Operation failed: $_"
    exit 1
}