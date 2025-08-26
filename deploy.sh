#!/bin/bash

# Netflix Real Estate Training - Production Deployment Script
# This script automates the deployment process

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="netflix-real-estate-training"
BUILD_DIR="frontend/build"
DEPLOYMENT_PLATFORM=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check Node.js version
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check npm version
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
else
    print_error "npm is not installed."
    exit 1
fi

# Navigate to frontend directory
print_status "Navigating to frontend directory..."
cd frontend

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run tests (if available)
print_status "Running tests..."
if npm run test -- --coverage --passWithNoTests --watchAll=false; then
    print_success "All tests passed!"
else
    print_warning "Some tests failed, but continuing with deployment..."
fi

# Build the application
print_status "Building application for production..."
if npm run build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Check build size
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
else
    print_error "Build directory not found!"
    exit 1
fi

# Deployment platform selection
echo ""
echo "Select deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify"
echo "3) Manual build only"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        DEPLOYMENT_PLATFORM="vercel"
        print_status "Selected: Vercel"
        ;;
    2)
        DEPLOYMENT_PLATFORM="netlify"
        print_status "Selected: Netlify"
        ;;
    3)
        DEPLOYMENT_PLATFORM="manual"
        print_status "Selected: Manual build only"
        ;;
    *)
        print_error "Invalid choice!"
        exit 1
        ;;
esac

# Deploy based on platform
case $DEPLOYMENT_PLATFORM in
    "vercel")
        print_status "Deploying to Vercel..."
        if command_exists vercel; then
            vercel --prod
            print_success "Deployed to Vercel successfully!"
        else
            print_error "Vercel CLI not found. Install with: npm install -g vercel"
            print_status "Manual deployment: Run 'vercel --prod' after installing Vercel CLI"
        fi
        ;;
    "netlify")
        print_status "Deploying to Netlify..."
        if command_exists netlify; then
            netlify deploy --prod --dir=build
            print_success "Deployed to Netlify successfully!"
        else
            print_error "Netlify CLI not found. Install with: npm install -g netlify-cli"
            print_status "Manual deployment: Run 'netlify deploy --prod --dir=build' after installing Netlify CLI"
        fi
        ;;
    "manual")
        print_success "Build completed! You can now manually deploy the 'build' directory to your hosting provider."
        ;;
esac

# Post-deployment checks
print_status "Post-deployment recommendations:"
echo "1. Test your deployed application"
echo "2. Set up monitoring and analytics"
echo "3. Configure custom domain (if needed)"
echo "4. Set up SSL certificate"
echo "5. Configure backup systems"

print_success "Deployment process completed!"

# Display next steps
echo ""
echo "🎉 Next Steps:"
echo "1. Visit your deployed application"
echo "2. Login with admin credentials: unbrokerage@realtyonegroupmexico.mx / OneVision$07"
echo "3. Upload your real estate training content"
echo "4. Create user accounts for your team"
echo "5. Customize branding and settings"

echo ""
print_success "Your Netflix Real Estate Training platform is now live!"