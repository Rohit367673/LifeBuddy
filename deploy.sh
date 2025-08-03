#!/bin/bash

# LifeBuddy Deployment Script
# This script handles git operations and deployment

set -e  # Exit on any error

echo "🚀 LifeBuddy Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "Frontend" ] && [ ! -d "Backend" ]; then
    print_error "Please run this script from the LifeBuddy root directory"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MESSAGE
        if [ -z "$COMMIT_MESSAGE" ]; then
            COMMIT_MESSAGE="Auto-commit: $(date)"
        fi
        
        print_status "Committing changes..."
        git add .
        git commit -m "$COMMIT_MESSAGE"
        print_success "Changes committed"
    else
        print_warning "Skipping commit. Make sure to commit your changes later."
    fi
fi

# Check if we're behind remote
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
BASE=$(git merge-base @ @{u})

if [ $LOCAL = $REMOTE ]; then
    print_success "Local branch is up to date with remote"
elif [ $LOCAL = $BASE ]; then
    print_warning "Local branch is behind remote. Pulling changes..."
    git pull origin $CURRENT_BRANCH
    print_success "Pulled latest changes"
elif [ $REMOTE = $BASE ]; then
    print_warning "Local branch is ahead of remote"
else
    print_warning "Local and remote branches have diverged"
fi

# Push to remote
print_status "Pushing to remote..."
if git push origin $CURRENT_BRANCH; then
    print_success "Successfully pushed to remote"
else
    print_error "Failed to push to remote"
    exit 1
fi

# Optional: Deploy to production
read -p "Do you want to deploy to production? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deploying to production..."
    
    # Add your deployment commands here
    # For example:
    # - Vercel deployment
    # - Render deployment
    # - Custom server deployment
    
    print_success "Deployment completed!"
else
    print_status "Skipping production deployment"
fi

echo ""
print_success "Deployment script completed successfully!"
print_status "Remember to:"
print_status "1. Test your changes locally"
print_status "2. Check the deployed application"
print_status "3. Monitor for any issues" 