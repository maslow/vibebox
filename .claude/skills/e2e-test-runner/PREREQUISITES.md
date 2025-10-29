# E2E Test Prerequisites Checklist

> **Note:** All commands in this document assume you are running from the project root directory.

Before running e2e tests, verify ALL of these requirements are met.

## 1. Docker Services (Postgres + Logto)

**Status Check:**
```bash
docker ps | grep -E "postgres|logto"
```

**Expected Output:**
- Two containers running: `postgres` and `logto`
- Logto should expose port 3001 (web UI) and 3002 (admin console)
- Postgres should be accessible internally

**If Not Running:**
```bash
cd ./docker
docker compose up -d
```

**Wait Time:** Give Logto ~10 seconds to fully initialize

**Verify:**
- Browse to http://localhost:3001 - should show Logto sign-in page
- Browse to http://localhost:3002 - should show Logto admin console

---

## 2. Next.js Server (VibeBox Platform API)

**Status Check:**
```bash
lsof -ti:3003
```

**Expected Output:**
- Process ID number (means something is running on port 3003)

**If Not Running:**
```bash
cd ./server
yarn dev
```

**Configuration Check:**
```bash
cat server/.env.local | grep HAPPY_SERVER_URL
```

**Expected Output:**
```
HAPPY_SERVER_URL=https://api.cluster-fluster.com
```

**CRITICAL:**
- Server MUST have `HAPPY_SERVER_URL=https://api.cluster-fluster.com`
- This tells the server to use official Happy Server for account operations

**Verify:**
- Browse to http://localhost:3003 - should show VibeBox landing page
- Check http://localhost:3003/api/auth/me - should return 401 (expected, means API is working)

---

## 3. Expo Web Client (VibeBox Frontend)

**Status Check:**
```bash
lsof -ti:8081
```

**Expected Output:**
- Process ID number (means something is running on port 8081)

**If Not Running:**
```bash
cd ./client
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
```

**CRITICAL Environment Variable:**
- MUST set `EXPO_PUBLIC_API_URL=http://localhost:3003`
- This tells the client to call the local Next.js server
- DO NOT set `EXPO_PUBLIC_HAPPY_SERVER_URL` - let it use default

**Verify:**
- Browse to http://localhost:8081 - should show VibeBox app
- Should see "Sign In" or "Sign In with Logto" button
- Check browser console - should not show connection errors

---

## 4. Happy Server Configuration

**No Action Needed** - This should be automatic!

**What Should Happen:**
- Client defaults to `https://api.cluster-fluster.com` for Happy Server
- Server also uses `https://api.cluster-fluster.com` (set in `.env.local`)

**What NOT To Do:**
- ❌ Do NOT set `EXPO_PUBLIC_HAPPY_SERVER_URL=http://localhost:3003`
- ❌ Do NOT try to run Happy Server locally
- ❌ Do NOT modify Happy Server URL in client code

**Why:**
- Happy Server is an external service (like GitHub API)
- We use the official hosted instance
- Local server is VibeBox Platform API, not Happy Server

---

## 5. Node.js and Dependencies

**Node Version:**
```bash
node --version
```
Should be v18 or higher

**Dependencies Installed:**
```bash
# Check if node_modules exist
ls -d client/node_modules
ls -d server/node_modules
```

**If Missing:**
```bash
cd ./client && yarn install
cd ./server && yarn install
```

---

## 6. Playwright (for Web Tests)

**Check Installation:**
```bash
cd ./client/tests/e2e/web
node -e "const { chromium } = require('playwright'); console.log('OK')"
```

**If Not Installed:**
```bash
cd ./client/tests/e2e/web
yarn add playwright
npx playwright install chromium
```

---

## Quick Pre-Flight Check Script

Run all checks at once:
```bash
cd .claude/skills/e2e-test-runner
./scripts/check-services.sh
```

This script will:
- ✅ Check all services are running
- ✅ Verify correct ports
- ✅ Validate environment variables
- ✅ Confirm Happy Server configuration
- ❌ Report any issues found

---

## Summary: Required Running Services

Before running tests, ensure:

1. ✅ Docker (Postgres + Logto) - ports 3001-3002
2. ✅ Next.js Server - port 3003, with `HAPPY_SERVER_URL=https://api.cluster-fluster.com`
3. ✅ Expo Web - port 8081, with `EXPO_PUBLIC_API_URL=http://localhost:3003`

That's it! If all three are running with correct configuration, tests should work.

---

## Common Mistakes to Avoid

❌ **Forgetting to set `EXPO_PUBLIC_API_URL`**
- Symptom: Client tries to connect to port 3000 instead of 3003
- Fix: Restart client with `EXPO_PUBLIC_API_URL=http://localhost:3003`

❌ **Setting `EXPO_PUBLIC_HAPPY_SERVER_URL` to localhost**
- Symptom: CORS errors on `/v1/*` endpoints
- Fix: Unset the variable, let it use default official URL

❌ **Server missing `HAPPY_SERVER_URL` in `.env.local`**
- Symptom: Server tries to use wrong Happy Server URL
- Fix: Add `HAPPY_SERVER_URL=https://api.cluster-fluster.com` to `server/.env.local`

❌ **Docker services not fully started**
- Symptom: Connection refused to Logto
- Fix: Wait 10-15 seconds after `docker compose up`
