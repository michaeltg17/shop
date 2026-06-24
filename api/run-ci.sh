#!/bin/bash
set -e

echo "========================================="
echo "  Running CI Pipeline in Docker"
echo "========================================="

# Step 1: Restore
echo ""
echo "[1/3] Restoring packages..."
dotnet restore Shop.slnx
echo "Restore successful"

# Step 2: Build
echo ""
echo "[2/3] Building..."
dotnet build src/Api/Api.csproj
echo "Build successful"

# Step 3: Tests
echo ""
echo "[3/3] Running tests..."
dotnet test tests/Api.Tests/Api.Tests.csproj --verbosity normal
echo "Tests passed"

echo ""
echo "========================================="
echo "  All CI checks passed!"
echo "========================================="
