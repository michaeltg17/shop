#!/bin/bash
set -e

echo "========================================="
echo "  Running CI Pipeline in Docker"
echo "========================================="

# Step 1: Restore
echo ""
echo "[1/2] Restoring packages..."
dotnet nuget locals all --clear
dotnet restore Shop.slnx
dotnet restore tests/Api.Tests/Api.Tests.csproj
echo "Restore successful"

# Step 2: Build and test
echo ""
echo "[2/2] Building and running tests..."
dotnet test tests/Api.Tests/Api.Tests.csproj --verbosity normal
echo "Tests passed"

echo ""
echo "========================================="
echo "  All CI checks passed!"
echo "========================================="
