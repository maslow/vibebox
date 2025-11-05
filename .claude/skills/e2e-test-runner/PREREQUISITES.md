# E2E Test Prerequisites Checklist

> **Note:** All commands in this document assume you are running from the project root directory.

Before running e2e tests, verify ALL of these requirements are met.

## 1. Docker Services (All Infrastructure)

**Status Check:**
```bash
docker ps | grep -E "postgres|logto|redis|minio|happy-server"
```

**Expected Output:**
- Five containers running: `postgres`, `logto`, `redis`, `minio`, `happy-server`
- Postgres: port 5432 (shared database)
- Logto: ports 3001-3002 (auth service)
- Redis: port 6379 (cache/pub-sub)
- MinIO: ports 9000-9001 (S3 storage)
- Happy Server: port 3005 (sync backend)

**If Not Running:**
```bash
docker compose up -d
```

**Wait Time:**
- Postgres: ~5 seconds
- Redis: ~3 seconds
- MinIO: ~10 seconds
- Logto: ~10 seconds
- Happy Server: ~30 seconds (depends on database migrations)

**Verify:**
- Browse to http://localhost:3001 - should show Logto sign-in page
- Browse to http://localhost:3002 - should show Logto admin console
- Browse to http://localhost:9001 - should show MinIO console
- Check Happy Server: `curl http://localhost:3005/health` (should return 200)

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
HAPPY_SERVER_URL=http://localhost:3005
```

**CRITICAL:**
- Server MUST have `HAPPY_SERVER_URL=http://localhost:3005`
- This tells the server to use self-hosted Happy Server for account operations
- NO external dependencies - everything runs locally

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
EXPO_PUBLIC_HAPPY_SERVER_URL=http://localhost:3005 EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
```

**CRITICAL Environment Variables:**
- MUST set `EXPO_PUBLIC_API_URL=http://localhost:3003` - tells client to call local Next.js server
- MUST set `EXPO_PUBLIC_HAPPY_SERVER_URL=http://localhost:3005` - tells client to use self-hosted Happy Server

**Verify:**
- Browse to http://localhost:8081 - should show VibeBox app
- Should see "Sign In" or "Sign In with Logto" button
- Check browser console - should not show connection errors

---

## 4. Happy Server (Self-Hosted)

**Status:** Happy Server is now self-hosted in Docker!

**What Changed:**
- Happy Server runs locally at `http://localhost:3005`
- NO external dependencies on official hosted instance
- All data stays on your machine
- Redis and MinIO provide required infrastructure

**Configuration:**
- Server: `HAPPY_SERVER_URL=http://localhost:3005` in `.env.local`
- Client: `EXPO_PUBLIC_HAPPY_SERVER_URL=http://localhost:3005`
- Docker: All services orchestrated together

**Why Self-Host:**
- More reliable for e2e tests (no network dependency)
- Consistent test environment
- Faster test execution
- Complete control over test data

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

1. ✅ Docker (All infrastructure) - 5 services:
   - Postgres: port 5432
   - Logto: ports 3001-3002
   - Redis: port 6379
   - MinIO: ports 9000-9001
   - Happy Server: port 3005
2. ✅ Next.js Server - port 3003, with `HAPPY_SERVER_URL=http://localhost:3005`
3. ✅ Expo Web - port 8081, with `EXPO_PUBLIC_API_URL=http://localhost:3003`

That's it! All infrastructure is self-hosted. No external dependencies.

---

## Common Mistakes to Avoid

❌ **Forgetting to set `EXPO_PUBLIC_API_URL`**
- Symptom: Client tries to connect to port 3000 instead of 3003
- Fix: Restart client with `EXPO_PUBLIC_API_URL=http://localhost:3003`

❌ **Forgetting to set `EXPO_PUBLIC_HAPPY_SERVER_URL`**
- Symptom: Client can't connect to self-hosted Happy Server
- Fix: Restart client with `EXPO_PUBLIC_HAPPY_SERVER_URL=http://localhost:3005`

❌ **Server has wrong `HAPPY_SERVER_URL` in `.env.local`**
- Symptom: Server can't connect to Happy Server
- Fix: Set `HAPPY_SERVER_URL=http://localhost:3005` in `server/.env.local`

❌ **Docker services not fully started**
- Symptom: Connection refused to any service
- Fix: Wait 30-60 seconds after `docker compose up` for all services to be healthy
- Check: `docker ps` should show all 5 containers as "healthy"
