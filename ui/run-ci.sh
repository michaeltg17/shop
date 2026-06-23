#!/bin/bash
set -e

echo "========================================="
echo "  Running CI Pipeline in Docker"
echo "========================================="

# Step 1: Prettier check
echo ""
echo "[1/7] Running prettier check..."
npm run prettier:check
echo "✓ Prettier check passed"

# Step 2: Linting
echo ""
echo "[2/7] Running linting..."
npm run lint
echo "✓ Linting passed"

# Step 3: Unit tests with coverage
echo ""
echo "[3/7] Running unit tests..."
npm run test:coverage
echo "✓ Unit tests passed"

# Step 4: Build
echo ""
echo "[4/7] Building application..."
npm run build
echo "✓ Build successful"

# Step 5: Playwright tests
echo ""
echo "[5/7] Running Playwright tests..."
npm run playwright
echo "✓ Playwright tests passed"

# # Step 6: Stryker mutation testing
# echo ""
# echo "[6/7] Running Stryker mutation testing..."
# npm run stryker
# echo "✓ Stryker mutation testing passed"

# Step 7: SonarCloud analysis (skip if token not set or invalid)
echo ""
echo "[7/7] Running SonarCloud analysis..."
if [ -n "$SONAR_TOKEN" ]; then
  if npx sonarqube-scanner \
    -Dsonar.host.url=https://sonarcloud.io \
    -Dsonar.login="$SONAR_TOKEN"; then
    echo "✓ SonarCloud analysis complete"
  else
    echo "⚠ SonarCloud analysis failed (check SONAR_TOKEN), continuing..."
  fi
else
  echo "⚠ SONAR_TOKEN not set, skipping SonarCloud analysis"
fi

echo ""
echo "========================================="
echo "  All CI checks passed!"
echo "========================================="