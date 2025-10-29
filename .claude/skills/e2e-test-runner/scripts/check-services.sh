#!/bin/bash

# E2E Test Services Pre-Flight Check
# This script verifies all required services are running correctly

set -e

# Detect project root directory
# Look for .claude directory or package.json to determine project root
if [ -d ".claude" ] && [ -d "client" ] && [ -d "server" ]; then
    PROJECT_ROOT="$(pwd)"
elif [ -d "../../../client" ] && [ -d "../../../server" ]; then
    # Running from .claude/skills/e2e-test-runner/scripts
    PROJECT_ROOT="$(cd ../../../ && pwd)"
elif [ -d "../../client" ] && [ -d "../../server" ]; then
    # Running from .claude/skills/e2e-test-runner
    PROJECT_ROOT="$(cd ../../ && pwd)"
else
    echo "❌ Error: Cannot detect project root directory"
    echo "   Please run this script from the project root or .claude/skills/e2e-test-runner directory"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

echo "🚀 E2E Test Pre-Flight Check"
echo "================================"
echo ""

# Check 1: Docker Services
echo "1️⃣  Checking Docker services (Postgres + Logto)..."
if docker ps | grep -q "logto"; then
    echo -e "${GREEN}✅ Logto container is running${NC}"
else
    echo -e "${RED}❌ Logto container is NOT running${NC}"
    echo "   Fix: cd docker && docker compose up -d"
    ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q "postgres"; then
    echo -e "${GREEN}✅ Postgres container is running${NC}"
else
    echo -e "${RED}❌ Postgres container is NOT running${NC}"
    echo "   Fix: cd docker && docker compose up -d"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Logto Web UI
echo ""
echo "2️⃣  Checking Logto web UI (port 3001)..."
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Logto is accessible at http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Logto is NOT accessible${NC}"
    echo "   Fix: Wait 10-15 seconds for Logto to initialize"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Next.js Server
echo ""
echo "3️⃣  Checking Next.js server (port 3003)..."
if lsof -ti:3003 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js server is running on port 3003${NC}"

    # Check if server responds
    if curl -s http://localhost:3003 > /dev/null; then
        echo -e "${GREEN}✅ Server is responding to requests${NC}"
    else
        echo -e "${YELLOW}⚠️  Server is running but not responding${NC}"
        echo "   Note: Server might still be starting up"
    fi
else
    echo -e "${RED}❌ Next.js server is NOT running${NC}"
    echo "   Fix: cd server && yarn dev"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Server Environment Variables
echo ""
echo "4️⃣  Checking server environment variables..."
if [ -f "$PROJECT_ROOT/server/.env.local" ]; then
    if grep -q "HAPPY_SERVER_URL=https://api.cluster-fluster.com" "$PROJECT_ROOT/server/.env.local"; then
        echo -e "${GREEN}✅ HAPPY_SERVER_URL is correctly set${NC}"
    else
        echo -e "${RED}❌ HAPPY_SERVER_URL is missing or incorrect${NC}"
        echo "   Expected: HAPPY_SERVER_URL=https://api.cluster-fluster.com"
        echo "   Fix: Add to $PROJECT_ROOT/server/.env.local"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Server .env.local file does not exist${NC}"
    echo "   Fix: Create $PROJECT_ROOT/server/.env.local"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Expo Web
echo ""
echo "5️⃣  Checking Expo web (port 8081)..."
if lsof -ti:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Expo web is running on port 8081${NC}"

    # Check if it responds
    if curl -s http://localhost:8081 > /dev/null; then
        echo -e "${GREEN}✅ Expo web is responding to requests${NC}"
    else
        echo -e "${YELLOW}⚠️  Expo web is running but not responding${NC}"
        echo "   Note: App might still be bundling"
    fi
else
    echo -e "${RED}❌ Expo web is NOT running${NC}"
    echo "   Fix: cd client && EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Client Environment (can't easily check without modifying client, so just warn)
echo ""
echo "6️⃣  Client environment configuration..."
echo -e "${YELLOW}⚠️  Cannot automatically verify client env vars${NC}"
echo "   IMPORTANT: Client must be started with:"
echo "   EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web"
echo ""
echo "   DO NOT set: EXPO_PUBLIC_HAPPY_SERVER_URL"
echo "   (Should use default: https://api.cluster-fluster.com)"

# Check 7: Playwright
echo ""
echo "7️⃣  Checking Playwright..."
if command -v npx > /dev/null 2>&1; then
    if [ -d "$PROJECT_ROOT/client/tests/e2e/web/node_modules/playwright" ]; then
        echo -e "${GREEN}✅ Playwright is installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Playwright might not be installed${NC}"
        echo "   Fix: cd client/tests/e2e/web && yarn add playwright"
    fi
else
    echo -e "${YELLOW}⚠️  npx not found (unusual but might be OK)${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to run tests.${NC}"
    echo ""
    echo "Run the test with:"
    echo "  cd client/tests/e2e/web"
    echo "  EXPO_PUBLIC_API_URL=http://localhost:3003 node oauth-authentication.test.js"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS issue(s). Fix them before running tests.${NC}"
    echo ""
    echo "After fixing issues, run this check again:"
    echo "  .claude/skills/e2e-test-runner/scripts/check-services.sh"
    exit 1
fi
