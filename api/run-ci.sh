#!/bin/bash
set -e

# Ensure testhost can find NuGet packages at runtime
export NUGET_PACKAGES=${NUGET_PACKAGES:-$HOME/.nuget/packages}

echo "========================================="
echo "  Running CI Pipeline in Docker"
echo "========================================="

# Step 1: Build and test
echo ""
echo "[1/1] Building and running tests..."
dotnet test tests/Api.Tests/Api.Tests.csproj --verbosity normal
echo "Tests passed"

echo ""
echo "========================================="
echo "  All CI checks passed!"
echo "========================================="
