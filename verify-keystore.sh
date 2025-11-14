#!/bin/bash

#####################################
# EMT Madrid - Keystore Verification
# Verify Android keystore details
#####################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if keystore exists
if [ ! -f "android.keystore" ]; then
    print_message "$RED" "❌ android.keystore not found!"
    echo ""
    print_message "$YELLOW" "To generate a new keystore, run:"
    print_message "$NC" "keytool -genkeypair -v -keystore android.keystore -alias emt-madrid-key \\"
    print_message "$NC" "  -keyalg RSA -keysize 2048 -validity 10000 \\"
    print_message "$NC" "  -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD \\"
    print_message "$NC" '  -dname "CN=EMT Madrid, OU=Development, O=Sellini, L=Madrid, ST=Madrid, C=ES"'
    echo ""
    exit 1
fi

print_message "$BLUE" "================================================"
print_message "$BLUE" "  Android Keystore Information"
print_message "$BLUE" "================================================"
echo ""

# Get password from user or use default
read -sp "Enter keystore password (press Enter for default): " STOREPASS
echo ""

if [ -z "$STOREPASS" ]; then
    STOREPASS="emtmadrid2024"
    print_message "$YELLOW" "Using default password"
fi

echo ""

# Show keystore details
print_message "$YELLOW" "📋 Keystore Details:"
echo ""

if keytool -list -v -keystore android.keystore -storepass "$STOREPASS" 2>/dev/null; then
    echo ""

    # Extract SHA256 fingerprint
    SHA256=$(keytool -list -v -keystore android.keystore -alias emt-madrid-key -storepass "$STOREPASS" 2>/dev/null | grep "SHA256:" | awk '{print $2}')

    if [ -n "$SHA256" ]; then
        print_message "$GREEN" "✅ SHA256 Fingerprint:"
        print_message "$NC" "   $SHA256"
        echo ""

        # Check if it matches assetlinks.json
        if [ -f ".well-known/assetlinks.json" ]; then
            if grep -q "$SHA256" ".well-known/assetlinks.json"; then
                print_message "$GREEN" "✅ Fingerprint matches .well-known/assetlinks.json"
            else
                print_message "$RED" "❌ Fingerprint does NOT match .well-known/assetlinks.json"
                print_message "$YELLOW" "   Update the assetlinks.json with the correct fingerprint!"
            fi
        else
            print_message "$YELLOW" "⚠️  .well-known/assetlinks.json not found"
        fi
    fi

    echo ""
    print_message "$BLUE" "📄 For Digital Asset Links, add this to .well-known/assetlinks.json:"
    echo ""
    cat << EOF
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.ssellini.emt",
    "sha256_cert_fingerprints": [
      "$SHA256"
    ]
  }
}]
EOF
    echo ""
else
    print_message "$RED" "❌ Failed to read keystore. Check your password!"
    exit 1
fi

print_message "$GREEN" "✨ Verification completed!"
