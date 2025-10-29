# E2E Test Troubleshooting Guide

> **Note:** All commands in this document assume you are running from the project root directory.

This guide covers common issues encountered when running e2e tests, based on real debugging sessions.

---

## Issue 1: Test Redirects to `/callback` and Stays There

**Symptoms:**
- OAuth flow completes
- Browser redirects to `http://localhost:8081/callback`
- Never redirects to `/` (home page)
- Test may report "success" but app is not functional

**Root Cause:**
API calls from callback page are failing, preventing authentication completion.

**Diagnosis:**
Check browser console or test output for:
- 404 errors on `/api/happy-accounts/me`
- 500 errors on other API endpoints
- Connection refused errors

**Solution:**
Check client environment variable:
```bash
# The client MUST be started with this env var:
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
```

**Why This Happens:**
- Client defaults to `http://localhost:3000` if env var not set
- Next.js server actually runs on port 3003
- API calls go to wrong port → 404 errors
- Callback page can't complete auth → stuck on `/callback`

**How to Fix:**
1. Stop the Expo web client (Ctrl+C)
2. Restart with correct env var:
   ```bash
   cd client
   EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
   ```
3. Re-run the test

---

## Issue 2: CORS Errors on `/v1/*` Endpoints

**Symptoms:**
- Browser console shows CORS errors
- Errors specifically on paths like `/v1/account`, `/v1/challenge`, etc.
- Error message: "No 'Access-Control-Allow-Origin' header"

**Example Error:**
```
Access to fetch at 'http://localhost:3003/v1/account' from origin
'http://localhost:8081' has been blocked by CORS policy
```

**Root Cause:**
Client is configured to send Happy Server API requests to localhost:3003, but these should go to the official Happy Server.

**Diagnosis:**
Check if `EXPO_PUBLIC_HAPPY_SERVER_URL` is set incorrectly:
```bash
# This is WRONG:
EXPO_PUBLIC_HAPPY_SERVER_URL=http://localhost:3003
```

**Solution:**
DO NOT set `EXPO_PUBLIC_HAPPY_SERVER_URL` at all. The client should use the default.

**Architecture Explanation:**
- **VibeBox Platform API** (`/api/*`) → localhost:3003 (Next.js server)
- **Happy Server API** (`/v1/*`) → https://api.cluster-fluster.com (official external service)
- These are TWO DIFFERENT servers

**How to Fix:**
1. Stop the Expo web client
2. Start WITHOUT `EXPO_PUBLIC_HAPPY_SERVER_URL`:
   ```bash
   cd client
   EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
   ```
3. Verify in browser console:
   - `/api/*` requests go to localhost:3003 ✅
   - `/v1/*` requests go to https://api.cluster-fluster.com ✅

---

## Issue 3: 404 on All API Endpoints

**Symptoms:**
- All `/api/*` endpoints return 404
- Test can't complete OAuth callback
- Browser shows "Not Found" errors

**Root Cause:**
Next.js server is not running.

**Diagnosis:**
```bash
lsof -ti:3003
# No output = server not running
```

**Solution:**
Start the Next.js server:
```bash
cd server
yarn dev
```

**Verification:**
```bash
curl http://localhost:3003/api/auth/me
# Should return 401 (expected) or actual user data
# Should NOT return 404
```

---

## Issue 4: "Connection Refused" to Logto

**Symptoms:**
- Test fails to load Logto sign-in page
- Error: `ECONNREFUSED localhost:3001`
- Browser shows "This site can't be reached"

**Root Cause:**
Docker services (Postgres + Logto) are not running.

**Diagnosis:**
```bash
docker ps | grep logto
# No output = not running
```

**Solution:**
```bash
cd docker
docker compose up -d

# Wait for Logto to initialize (10-15 seconds)
sleep 15

# Verify
curl http://localhost:3001
# Should return HTML (Logto sign-in page)
```

---

## Issue 5: Test Reports Success But Has Errors

**Symptoms:**
- Test output shows "✅ SUCCESS!!!"
- But there are 404 or 500 errors in the logs
- Final URL is not `/` (home page)

**Root Cause:**
Test only checks for tokens in localStorage, not actual functionality.

**Diagnosis:**
- Look at FULL test output, not just final status
- Check for error messages in browser logs
- Verify final URL in test output

**Solution:**
Read the ENTIRE test output carefully:
```
📍 Final URL: http://localhost:8081/   ← Should be "/" not "/callback"
🔐 localStorage keys: 3                 ← Should have keys
🎫 Has ID token: true                   ← Should be true

❌ Browser Warning: 404 on /api/...     ← These are PROBLEMS!
❌ Browser Warning: 500 on /api/...
```

If you see errors, the test is NOT actually successful.

**Real Success Criteria:**
- ✅ Final URL is `http://localhost:8081/` (root, not callback)
- ✅ No 404 errors in output
- ✅ No 500 errors in output
- ✅ No CORS errors
- ✅ Has ID token in localStorage

---

## Issue 6: Server Has Wrong `HAPPY_SERVER_URL`

**Symptoms:**
- Server tries to connect to wrong Happy Server
- Happy account operations fail
- Errors like "Happy Server unreachable"

**Root Cause:**
Missing or incorrect `HAPPY_SERVER_URL` in server environment.

**Diagnosis:**
```bash
cat server/.env.local | grep HAPPY_SERVER_URL
```

Should output:
```
HAPPY_SERVER_URL=https://api.cluster-fluster.com
```

**Solution:**
1. Edit `server/.env.local`
2. Ensure it contains:
   ```
   HAPPY_SERVER_URL=https://api.cluster-fluster.com
   ```
3. Restart Next.js server:
   ```bash
   cd server
   yarn dev
   ```

---

## Issue 7: Playwright Browser Closes Too Fast

**Symptoms:**
- Error: "Target page, context or browser has been closed"
- Test runs successfully but fails at screenshot step

**Root Cause:**
Test completes so fast that browser closes before final screenshot.

**Impact:**
- This is a MINOR ISSUE
- The actual test functionality worked correctly
- Only the final screenshot fails

**Solution:**
Ignore this error if:
- All functional steps completed successfully
- OAuth flow worked
- Authentication state is correct
- Final URL is correct

This is a timing issue, not a functional failure.

---

## Quick Diagnosis Checklist

When test fails, check in order:

1. **Are all services running?**
   ```bash
   docker ps | grep logto                    # Should show logto
   lsof -ti:3003                             # Should show PID
   lsof -ti:8081                             # Should show PID
   ```

2. **Is client env correct?**
   ```bash
   # Check what URL client is using
   # Look in client terminal output when it starts
   ```
   Should show `EXPO_PUBLIC_API_URL=http://localhost:3003`

3. **Is server env correct?**
   ```bash
   grep HAPPY_SERVER_URL server/.env.local
   ```
   Should show `https://api.cluster-fluster.com`

4. **Are there errors in test output?**
   - Look for 404, 500, CORS errors
   - Check final URL (should be `/` not `/callback`)

5. **Is Happy Server config correct?**
   - Client should NOT have `EXPO_PUBLIC_HAPPY_SERVER_URL` set
   - Should use default `https://api.cluster-fluster.com`

---

## Emergency Reset Procedure

If everything is broken and you don't know why:

```bash
# 1. Stop everything
docker compose -f docker/docker-compose.yml down
# Kill any stray processes on 3003 and 8081
lsof -ti:3003 | xargs kill -9
lsof -ti:8081 | xargs kill -9

# 2. Verify server env
cat server/.env.local
# Should have: HAPPY_SERVER_URL=https://api.cluster-fluster.com

# 3. Start fresh in correct order
cd docker
docker compose up -d
sleep 15

cd server
yarn dev
# Wait for "ready" message

cd client
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
# Wait for "Bundled successfully"

# 4. Run test
cd client/tests/e2e/web
EXPO_PUBLIC_API_URL=http://localhost:3003 node oauth-authentication.test.js
```

---

## Getting Help

If none of these solutions work:

1. **Capture full test output** - Don't just show final status
2. **Check all service logs** - Docker, server, client
3. **Verify environment variables** - Both client and server
4. **Test each service individually** - Ensure each works standalone
5. **Review git changes** - Did something change recently?

Remember: 90% of issues are environment variable configuration problems!
