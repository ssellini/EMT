#!/bin/bash

#####################################
# EMT Madrid - Android TWA Builder
# Build script for Trusted Web Activity
#####################################

set -e  # Exit on error

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

# Print header
print_header() {
    echo ""
    print_message "$BLUE" "================================================"
    print_message "$BLUE" "  EMT Madrid - TWA Build Script"
    print_message "$BLUE" "================================================"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_message "$YELLOW" "🔍 Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_message "$RED" "❌ Node.js not found. Please install Node.js 16+"
        exit 1
    fi
    print_message "$GREEN" "✅ Node.js $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_message "$RED" "❌ npm not found. Please install npm"
        exit 1
    fi
    print_message "$GREEN" "✅ npm $(npm --version)"

    # Check Java
    if ! command -v java &> /dev/null; then
        print_message "$RED" "❌ Java not found. Please install Java JDK 11+"
        exit 1
    fi
    print_message "$GREEN" "✅ Java $(java -version 2>&1 | head -n 1)"

    # Check Bubblewrap
    if ! command -v bubblewrap &> /dev/null; then
        print_message "$YELLOW" "⚠️  Bubblewrap not found. Installing..."
        npm install -g @bubblewrap/cli
    fi
    print_message "$GREEN" "✅ Bubblewrap CLI installed"

    # Check keystore
    if [ ! -f "android.keystore" ]; then
        print_message "$RED" "❌ android.keystore not found!"
        print_message "$YELLOW" "Please generate a keystore first (see ANDROID-BUILD.md)"
        exit 1
    fi
    print_message "$GREEN" "✅ Keystore found: android.keystore"

    # Check twa-manifest.json
    if [ ! -f "twa-manifest.json" ]; then
        print_message "$RED" "❌ twa-manifest.json not found!"
        exit 1
    fi
    print_message "$GREEN" "✅ TWA manifest found"

    echo ""
}

# Validate PWA
validate_pwa() {
    print_message "$YELLOW" "🔍 Validating PWA..."

    # Check manifest.json
    if [ ! -f "manifest.json" ]; then
        print_message "$RED" "❌ manifest.json not found!"
        exit 1
    fi
    print_message "$GREEN" "✅ PWA manifest found"

    # Check service worker
    if [ ! -f "sw.js" ]; then
        print_message "$RED" "❌ Service worker (sw.js) not found!"
        exit 1
    fi
    print_message "$GREEN" "✅ Service worker found"

    # Check .well-known/assetlinks.json
    if [ ! -f ".well-known/assetlinks.json" ]; then
        print_message "$YELLOW" "⚠️  .well-known/assetlinks.json not found!"
        print_message "$YELLOW" "    This file must be deployed to your web server"
    else
        print_message "$GREEN" "✅ Digital Asset Links file found"
    fi

    echo ""
}

# Build APK
build_apk() {
    print_message "$YELLOW" "🏗️  Building Android APK..."
    print_message "$BLUE" "This may take several minutes..."

    # Build with Bubblewrap
    if bubblewrap build --skipPwaValidation 2>&1 | tee build.log; then
        print_message "$GREEN" "✅ APK built successfully!"

        # Find the generated APK
        if [ -f "app-release-signed.apk" ]; then
            APK_SIZE=$(du -h app-release-signed.apk | cut -f1)
            print_message "$GREEN" "📦 APK: app-release-signed.apk (${APK_SIZE})"

            # Show APK details
            print_message "$BLUE" "\n📋 APK Details:"
            print_message "$NC" "   Package: com.ssellini.emt"
            print_message "$NC" "   Version: 2.0.0 (20000)"
            print_message "$NC" "   Min SDK: 21 (Android 5.0+)"
            print_message "$NC" "   Target SDK: 33 (Android 13)"
        else
            print_message "$YELLOW" "⚠️  APK file not found at expected location"
        fi
    else
        print_message "$RED" "❌ Build failed! Check build.log for details"
        exit 1
    fi

    echo ""
}

# Verify APK
verify_apk() {
    if [ ! -f "app-release-signed.apk" ]; then
        print_message "$YELLOW" "⚠️  No APK to verify"
        return
    fi

    print_message "$YELLOW" "🔐 Verifying APK signature..."

    if jarsigner -verify -verbose -certs app-release-signed.apk > /dev/null 2>&1; then
        print_message "$GREEN" "✅ APK signature is valid"
    else
        print_message "$RED" "❌ APK signature verification failed!"
    fi

    echo ""
}

# Show next steps
show_next_steps() {
    print_message "$BLUE" "🚀 Next Steps:"
    print_message "$NC" ""
    print_message "$NC" "1. Test the APK on Android device:"
    print_message "$NC" "   adb install app-release-signed.apk"
    print_message "$NC" ""
    print_message "$NC" "2. Deploy .well-known/assetlinks.json to:"
    print_message "$NC" "   https://ssellini.github.io/EMT/.well-known/assetlinks.json"
    print_message "$NC" ""
    print_message "$NC" "3. Verify Digital Asset Links:"
    print_message "$NC" "   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ssellini.github.io&relation=delegate_permission/common.handle_all_urls"
    print_message "$NC" ""
    print_message "$NC" "4. Upload to Google Play Console"
    print_message "$NC" ""
    print_message "$GREEN" "For detailed instructions, see ANDROID-BUILD.md"
    echo ""
}

# Main execution
main() {
    print_header
    check_prerequisites
    validate_pwa
    build_apk
    verify_apk
    show_next_steps

    print_message "$GREEN" "✨ Build process completed!"
}

# Run main function
main
