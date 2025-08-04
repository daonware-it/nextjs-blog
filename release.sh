#!/bin/bash
# Release-Skript für das Blog-System
# Verwendung: ./release.sh [major|minor|patch]

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hilfsfunktion für farbigen Output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfe ob Git clean ist
if [ -n "$(git status --porcelain)" ]; then
    print_error "Git working directory ist nicht sauber. Bitte committen Sie alle Änderungen zuerst."
    exit 1
fi

# Aktuelle Version aus package.json lesen
current_version=$(cat blog-page/package.json | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')
print_status "Aktuelle Version: $current_version"

# Versiontyp bestimmen
version_type=${1:-patch}
print_status "Release-Typ: $version_type"

# Neue Version berechnen
IFS='.' read -ra ADDR <<< "$current_version"
major=${ADDR[0]}
minor=${ADDR[1]}
patch=${ADDR[2]}

case $version_type in
    major)
        major=$((major + 1))
        minor=0
        patch=0
        ;;
    minor)
        minor=$((minor + 1))
        patch=0
        ;;
    patch)
        patch=$((patch + 1))
        ;;
    *)
        print_error "Ungültiger Versiontyp: $version_type. Verwenden Sie major, minor oder patch."
        exit 1
        ;;
esac

new_version="$major.$minor.$patch"
print_status "Neue Version: $new_version"

# Bestätigung
read -p "Release $new_version erstellen? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Release abgebrochen."
    exit 0
fi

# package.json aktualisieren
print_status "Aktualisiere package.json..."
sed -i.bak "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" blog-page/package.json
rm blog-page/package.json.bak

# README.md aktualisieren
print_status "Aktualisiere README.md..."
sed -i.bak "s/Aktuelle Version \`v$current_version\`/Aktuelle Version \`v$new_version\`/" README.md
rm README.md.bak

# Änderungen committen
print_status "Committe Versionsänderungen..."
git add blog-page/package.json README.md
git commit -m "chore: bump version to v$new_version"

# Git Tag erstellen
print_status "Erstelle Git Tag v$new_version..."
git tag "v$new_version" -m "Release v$new_version"

print_status "Release v$new_version erfolgreich erstellt!"
print_status "Führen Sie 'git push && git push --tags' aus, um das Release zu veröffentlichen."

# Optional: CHANGELOG.md updaten
if [ -f CHANGELOG.md ]; then
    print_status "Vergessen Sie nicht, CHANGELOG.md zu aktualisieren!"
fi
