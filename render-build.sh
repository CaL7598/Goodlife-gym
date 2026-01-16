#!/usr/bin/env bash
# Build script for Render - Backend only (no TypeScript/Vite compilation needed)

echo "======================================"
echo "Building Goodlife Fitness Backend API"
echo "======================================"

# Install only production dependencies
echo "Installing production dependencies..."
npm ci --only=production

echo "======================================"
echo "Build complete! Backend is ready."
echo "======================================"
