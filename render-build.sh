#!/usr/bin/env bash
# Build script for Render - Backend only (no TypeScript/Vite compilation needed)

echo "======================================"
echo "Building Goodlife Fitness Backend API"
echo "======================================"

# Temporarily rename tsconfig.json to prevent TypeScript compilation
if [ -f "tsconfig.json" ]; then
    echo "Temporarily disabling TypeScript compilation..."
    mv tsconfig.json tsconfig.json.backup
fi

# Temporarily rename vite.config.ts to prevent Vite build
if [ -f "vite.config.ts" ]; then
    echo "Temporarily disabling Vite build..."
    mv vite.config.ts vite.config.ts.backup
fi

# Install only production dependencies
echo "Installing production dependencies..."
npm ci --only=production --ignore-scripts

# Restore config files (in case needed for future operations)
if [ -f "tsconfig.json.backup" ]; then
    mv tsconfig.json.backup tsconfig.json
fi

if [ -f "vite.config.ts.backup" ]; then
    mv vite.config.ts.backup vite.config.ts
fi

echo "======================================"
echo "Build complete! Backend is ready."
echo "======================================"
