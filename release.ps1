param(
    [ValidateSet("major", "minor", "patch")]
    [string]$VersionType = "patch"
)

# Farben für Output
function Write-Success {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Prüfe ob Git clean ist
$gitStatus = & git status --porcelain
if ($gitStatus) {
    Write-Error "Git working directory ist nicht sauber. Bitte committen Sie alle Änderungen zuerst."
    exit 1
}

# Aktuelle Version aus package.json lesen
$packageJson = Get-Content "blog-page\package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Success "Aktuelle Version: $currentVersion"

Write-Success "Release-Typ: $VersionType"

# Neue Version berechnen
$versionParts = $currentVersion.Split('.')
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

switch ($VersionType) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
    }
    "minor" {
        $minor++
        $patch = 0
    }
    "patch" {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Write-Success "Neue Version: $newVersion"

# Bestätigung
$confirmation = Read-Host "Release $newVersion erstellen? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Warning "Release abgebrochen."
    exit 0
}

# package.json aktualisieren
Write-Success "Aktualisiere package.json..."
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 100 | Set-Content "blog-page\package.json"

# README.md aktualisieren
Write-Success "Aktualisiere README.md..."
$readmeContent = Get-Content "README.md" -Raw
$versionPattern = "Aktuelle Version ``v$currentVersion``"
$versionReplacement = "Aktuelle Version ``v$newVersion``"
$readmeContent = $readmeContent -replace $versionPattern, $versionReplacement
Set-Content "README.md" $readmeContent

# Änderungen committen
Write-Success "Committe Versionsänderungen..."
git add blog-page\package.json README.md
git commit -m "chore: bump version to v$newVersion"

# Git Tag erstellen
Write-Success "Erstelle Git Tag v$newVersion..."
git tag "v$newVersion" -m "Release v$newVersion"

Write-Success "Release v$newVersion erfolgreich erstellt!"
Write-Success "Führen Sie 'git push; git push --tags' aus, um das Release zu veröffentlichen."

if (Test-Path "CHANGELOG.md") {
    Write-Success "Vergessen Sie nicht, CHANGELOG.md zu aktualisieren!"
}
