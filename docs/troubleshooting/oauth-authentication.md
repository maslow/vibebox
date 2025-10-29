# OAuth Authentication Troubleshooting Guide

**Tags:** #troubleshooting:oauth #feature:logto #feature:authentication #feature:dual-auth #component:client #component:server

This guide covers common OAuth and authentication issues in the VibeBox/Happy project. Our authentication system uses a **dual authentication architecture**: Logto OAuth for platform access + Happy Server authentication for development environment access.

> **Quick Tip**: 90% of OAuth issues are caused by incorrect environment variable configuration. Start with the [Quick Diagnosis Checklist](#quick-diagnosis-checklist) first!

---

## Table of Contents

1. [Common OAuth Issues](#common-oauth-issues)
2. [Logto Configuration Issues](#logto-configuration-issues)
3. [Dual Authentication Issues](#dual-authentication-issues)
4. [Token Management Issues](#token-management-issues)
5. [Platform-Specific Issues](#platform-specific-issues)
6. [Debugging Workflows](#debugging-workflows)
7. [Quick Diagnosis Checklist](#quick-diagnosis-checklist)
8. [Emergency Reset Procedure](#emergency-reset-procedure)

---

## Common OAuth Issues

### Issue 1: Stuck on `/callback` Page After OAuth Redirect

**Symptoms:**
- OAuth flow completes and redirects to `http://localhost:8081/callback`
- Page never redirects to `/` (home page)
- App appears frozen on callback page
- User sees loading spinner indefinitely

**Root Cause:**
API calls from the callback page are failing, preventing authentication from completing.

**Diagnosis:**
1. Open browser developer console (F12)
2. Check Network tab for failed requests
3. Look for:
   - `404 Not Found` on `/api/happy-accounts/me`
   - `404 Not Found` on other `/api/*` endpoints
   - `ECONNREFUSED` or `ERR_CONNECTION_REFUSED` errors

**Solution:**

Check that the client is using the correct API URL:

```bash
# The client MUST use this environment variable:
EXPO_PUBLIC_API_URL=http://localhost:3003

# Restart Expo web with correct configuration:
cd client
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
```

**Why This Happens:**
- Client defaults to `http://localhost:3000` if `EXPO_PUBLIC_API_URL` is not set
- Next.js server runs on port 3003, not 3000
- API calls go to wrong port → 404 errors
- Callback page can't complete authentication → stuck forever

**Prevention:**
Always start the Expo web client with `EXPO_PUBLIC_API_URL=http://localhost:3003` during local development.

---

### Issue 2: CORS Errors on `/v1/*` Happy Server Endpoints

**Symptoms:**
- Browser console shows CORS errors like:
  ```
  Access to fetch at 'http://localhost:3003/v1/account' from origin
  'http://localhost:8081' has been blocked by CORS policy:
  No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```
- Errors specifically on paths starting with `/v1/*` (Happy Server API)

**Root Cause:**
Client is incorrectly configured to send Happy Server requests to localhost instead of the official Happy Server.

**Diagnosis:**

Check if `EXPO_PUBLIC_HAPPY_SERVER_URL` is set:

```bash
# Check client environment
echo $EXPO_PUBLIC_HAPPY_SERVER_URL
```

If this outputs anything (especially `http://localhost:3003`), that's the problem.

**Solution:**

**DO NOT SET `EXPO_PUBLIC_HAPPY_SERVER_URL`**. Remove it from your environment:

```bash
unset EXPO_PUBLIC_HAPPY_SERVER_URL

# Restart client without this variable:
cd client
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
```

**Architecture Explanation:**

Our system has TWO separate API servers:

| API | Base Path | Server | Environment Variable |
|-----|-----------|--------|---------------------|
| VibeBox Platform API | `/api/*` | Next.js (localhost:3003) | `EXPO_PUBLIC_API_URL` |
| Happy Server API | `/v1/*` | Official Happy Server | Default (no env var needed) |

**Why This Matters:**
- VibeBox Platform API handles user accounts, subscriptions, and Logto integration
- Happy Server API handles development environment synchronization
- These are SEPARATE services and should NOT be confused
- The default Happy Server URL (`https://api.cluster-fluster.com`) is correct for local development

**Prevention:**
Never set `EXPO_PUBLIC_HAPPY_SERVER_URL` unless you're developing against a custom Happy Server instance (rare).

---

### Issue 3: "Connection Refused" to Logto

**Symptoms:**
- Cannot load Logto sign-in page
- Error: `ECONNREFUSED localhost:3001`
- Browser shows "This site can't be reached"
- Network error when clicking "Sign In with Logto"

**Root Cause:**
Docker services (Postgres + Logto) are not running.

**Diagnosis:**

```bash
# Check if Logto is running:
docker ps | grep logto

# No output means it's not running
```

**Solution:**

Start Docker services:

```bash
cd docker
docker compose up -d

# Wait for Logto to initialize (10-15 seconds)
sleep 15

# Verify Logto is accessible:
curl http://localhost:3001
# Should return HTML (Logto sign-in page)
```

**Additional Checks:**

If Logto still doesn't work after starting Docker:

```bash
# Check container logs for errors:
docker logs vibebox-logto

# Check if ports are bound correctly:
docker ps | grep logto
# Should show: 0.0.0.0:3001-3002->3001-3002/tcp

# Restart if needed:
docker restart vibebox-logto
```

---

### Issue 4: 404 on All `/api/*` Endpoints

**Symptoms:**
- All API calls return `404 Not Found`
- OAuth callback fails
- Browser console shows multiple 404 errors for `/api/auth/me`, `/api/happy-accounts/me`, etc.

**Root Cause:**
Next.js server is not running.

**Diagnosis:**

```bash
# Check if server is running:
lsof -ti:3003

# No output means server is not running
```

**Solution:**

Start the Next.js server:

```bash
cd server
yarn dev

# Wait for "ready" message:
# ✓ Ready on http://localhost:3003
```

**Verification:**

```bash
# Test API health:
curl http://localhost:3003/api/auth/me

# Expected responses:
# - 401 Unauthorized (good - means server is running but you're not authenticated)
# - User data (good - if you have valid auth)
# NOT EXPECTED:
# - 404 Not Found (bad - means server is not running or route is broken)
```

---

### Issue 5: Infinite Redirect Loop Between `/` and `/callback`

**Symptoms:**
- Browser keeps redirecting between root page and callback page
- URL bar flashes between `http://localhost:8081/` and `http://localhost:8081/callback`
- Eventually browser shows "Too many redirects" error

**Root Cause:**
Authentication state is inconsistent or OAuth tokens are corrupted.

**Diagnosis:**

1. Open browser developer console (F12)
2. Go to Application tab → Local Storage → `http://localhost:8081`
3. Look for keys starting with `logto:`

**Solution:**

Clear OAuth state and retry:

```bash
# In browser console:
localStorage.clear()
location.reload()
```

Or manually in developer tools:
1. Application tab → Local Storage → `http://localhost:8081`
2. Delete all keys starting with `logto:`
3. Refresh the page
4. Try signing in again

**Why This Happens:**
- OAuth tokens can become corrupted during failed authentication attempts
- Partial authentication state (has token but invalid/expired)
- Callback handler ran but didn't complete properly

**Prevention:**
- Always wait for OAuth redirect to fully complete before refreshing
- Don't force-refresh during authentication flow

---

## Logto Configuration Issues

### Issue 6: "Invalid Redirect URI" Error

**Symptoms:**
- After clicking "Sign In with Logto", Logto shows error page
- Error message: "redirect_uri_mismatch" or "Invalid redirect URI"

**Root Cause:**
The redirect URI used by the client is not configured in Logto admin console.

**Diagnosis:**

Check what redirect URI the client is using:

```typescript
// For web: http://localhost:8081/callback
// For native: io.vibebox://callback
```

**Solution:**

Configure redirect URIs in Logto admin console:

1. Open Logto Admin Console: http://localhost:3002
2. Navigate to **Applications** → Select your application
3. Go to **Redirect URIs** section
4. Ensure these URIs are added:
   - Web (development): `http://localhost:8081/callback`
   - Web (production): `https://your-domain.com/callback`
   - Native: `io.vibebox://callback`
5. Save changes
6. Retry OAuth flow

**Platform-Specific Redirect URIs:**

| Platform | Redirect URI | When to Use |
|----------|--------------|-------------|
| Web (dev) | `http://localhost:8081/callback` | Local development |
| Web (prod) | `https://vibebox.app/callback` | Production deployment |
| iOS/Android | `io.vibebox://callback` | Native mobile apps |

**Reference:**
See implementation in `client/sources/hooks/useLogtoAuth.ts:23` for platform-specific redirect URI logic.

---

### Issue 7: "Invalid Client" or "Application Not Found"

**Symptoms:**
- Logto returns error: "Invalid client" or "Application not found"
- OAuth flow fails immediately after redirect to Logto

**Root Cause:**
Logto application ID in client configuration doesn't match Logto admin console.

**Diagnosis:**

1. Check client configuration:
   ```bash
   # View current Logto config:
   cat client/sources/config/logto.ts
   ```

2. Check Logto admin console:
   - Go to http://localhost:3002
   - Navigate to **Applications**
   - Find your application and copy the **App ID**

**Solution:**

Update `client/sources/config/logto.ts` with correct App ID:

```typescript
export const logtoConfigDev: LogtoConfig = {
    endpoint: 'http://localhost:3001',
    appId: 'YOUR_CORRECT_APP_ID_HERE', // Update this
};
```

Restart the client:
```bash
cd client
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
```

---

## Dual Authentication Issues

Our system uses **dual authentication**: Logto OAuth (platform) + Happy Server auth (development environment). Both must succeed for full app access.

### Issue 8: Logto Succeeds but Happy Auto-Login Fails

**Symptoms:**
- OAuth flow completes successfully
- User redirects from `/callback` to `/`
- App shows error screen: "Failed to connect to Happy Server" or similar
- User is stuck and cannot access main app

**Root Cause:**
Happy account auto-provisioning failed. This happens during the dual authentication phase.

**Diagnosis:**

1. Check browser console for API errors:
   - Look for failed requests to `/api/happy-accounts/me`
   - Check response status: 500 (server error), 404 (not found), etc.

2. Check server logs:
   ```bash
   # In server terminal, look for errors containing:
   # - "Happy Server"
   # - "Ed25519"
   # - "/v1/auth"
   ```

**Common Sub-Issues:**

#### 8a: Happy Server Unreachable from Server

**Solution:**

Check server environment variable:

```bash
# Verify server configuration:
grep HAPPY_SERVER_URL server/.env.local

# Should output:
# HAPPY_SERVER_URL=https://api.cluster-fluster.com
```

If missing or incorrect, update `server/.env.local`:
```
HAPPY_SERVER_URL=https://api.cluster-fluster.com
```

Restart Next.js server:
```bash
cd server
yarn dev
```

#### 8b: Happy Server Credentials Encryption Failed

**Solution:**

Check that encryption key is set:

```bash
# Check server environment:
grep ENCRYPTION_KEY server/.env.local
```

If missing, add to `server/.env.local`:
```
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

Restart Next.js server.

**Reference:**
- Happy auto-login logic: `client/sources/components/HappyAutoLogin.tsx`
- Happy account provisioning: `server/app/api/happy-accounts/me/route.ts`
- Happy auth implementation: `server/lib/happy/auth.ts`

---

### Issue 9: Logto Token Valid but API Returns 401

**Symptoms:**
- Successfully signed in with Logto
- Browser has valid ID token in localStorage
- But API calls return `401 Unauthorized`

**Root Cause:**
Logto JWT token verification failed on server side.

**Diagnosis:**

Check server logs for JWT verification errors:
```bash
# Look for errors containing:
# - "JWT verification failed"
# - "Invalid token"
# - "Token expired"
```

**Common Sub-Issues:**

#### 9a: Token Expired

**Solution:**

Logto tokens have limited lifetime (typically 1 hour). Force a token refresh:

```bash
# In browser console:
localStorage.clear()
location.reload()
# Sign in again
```

Or wait for SDK to automatically refresh (if refresh token is valid).

#### 9b: JWT Verification Configuration Issue

**Solution:**

Check server Logto configuration:

```typescript
// In server/lib/auth/logto.ts
// Ensure JWKS URL and issuer are correct
```

Verify JWKS endpoint is accessible:
```bash
curl http://localhost:3001/oidc/.well-known/jwks.json
# Should return JWKS key set
```

---

## Token Management Issues

### Issue 10: Token Refresh Fails

**Symptoms:**
- User gets logged out unexpectedly
- "Session expired" message appears
- Need to sign in again even though recent session was active

**Root Cause:**
Refresh token is invalid, expired, or revoked.

**Diagnosis:**

Check browser console and localStorage:

```javascript
// In browser console:
const refreshToken = localStorage.getItem('logto:YOUR_APP_ID:refreshToken');
console.log(refreshToken ? 'Has refresh token' : 'No refresh token');
```

**Solution:**

If refresh token is missing or invalid, user must sign in again:

1. Clear authentication state:
   ```javascript
   localStorage.clear();
   ```

2. Sign in again through OAuth flow

**Prevention:**
- Don't manually clear localStorage during active sessions
- Ensure users complete OAuth flow fully before closing browser
- Check Logto admin console for refresh token TTL settings

---

### Issue 11: Multiple Tabs Cause Authentication Issues

**Symptoms:**
- Opening app in multiple browser tabs causes one tab to lose authentication
- Inconsistent authentication state across tabs
- One tab shows logged in, another shows logged out

**Root Cause:**
LocalStorage synchronization issues between tabs.

**Solution:**

**Option 1**: Close all tabs and open single tab

**Option 2**: Force refresh all tabs
```javascript
// In each tab's console:
location.reload();
```

**Prevention:**
- Use single tab during active development
- Test multi-tab scenarios explicitly if needed

**Note:** This is a known limitation of localStorage-based token storage on web. Native platforms use secure storage and don't have this issue.

---

## Platform-Specific Issues

### Issue 12: Web OAuth Works but Native Doesn't

**Symptoms:**
- OAuth flow works perfectly on web (localhost:8081)
- But fails on iOS/Android simulator or device

**Root Cause:**
Platform-specific redirect URI or deep link configuration issue.

**Diagnosis:**

Check native configuration:

1. **Redirect URI**: Should be `io.vibebox://callback`
2. **Logto Config**: Must be registered in Logto admin console
3. **Deep Link**: Must be configured in `app.json` / `app.config.js`

**Solution:**

1. Verify Logto has native redirect URI:
   - Logto Admin Console → Applications → Redirect URIs
   - Ensure `io.vibebox://callback` is added

2. Check app configuration:
   ```json
   // In app.json or app.config.js
   {
     "expo": {
       "scheme": "io.vibebox"
     }
   }
   ```

3. For iOS, check Associated Domains (if using universal links)

4. Rebuild native app:
   ```bash
   cd client
   yarn ios  # or yarn android
   ```

---

### Issue 13: Native OAuth Opens Browser but Doesn't Return to App

**Symptoms:**
- Clicking "Sign In with Logto" opens Safari/Chrome
- User authenticates successfully in browser
- Browser doesn't redirect back to app
- User stuck in browser

**Root Cause:**
Deep link not triggering or not configured correctly.

**Diagnosis:**

Check device logs:
```bash
# iOS:
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "io.vibebox"'

# Android:
adb logcat | grep -i "vibebox"
```

Look for deep link handling messages.

**Solution:**

1. **iOS**: Ensure URL scheme is registered:
   ```bash
   # Rebuild app:
   cd client
   yarn ios
   ```

2. **Android**: Check intent filters in AndroidManifest.xml:
   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="io.vibebox" />
   </intent-filter>
   ```

3. **Test deep link manually**:
   ```bash
   # iOS:
   xcrun simctl openurl booted "io.vibebox://callback"

   # Android:
   adb shell am start -a android.intent.action.VIEW -d "io.vibebox://callback"
   ```

---

## Debugging Workflows

### Workflow 1: Verify OAuth Flow End-to-End

Use this workflow to systematically verify every step of the OAuth flow:

1. **Check Prerequisites**
   ```bash
   # All services running?
   docker ps | grep logto                # Logto
   lsof -ti:3003                         # Next.js
   lsof -ti:8081                         # Expo web

   # Environment correct?
   grep HAPPY_SERVER_URL server/.env.local
   echo $EXPO_PUBLIC_API_URL            # Should be http://localhost:3003
   ```

2. **Test Logto Directly**
   ```bash
   # Logto homepage:
   curl http://localhost:3001
   # Should return HTML

   # Logto OIDC config:
   curl http://localhost:3001/oidc/.well-known/openid-configuration
   # Should return JSON config
   ```

3. **Test VibeBox API**
   ```bash
   # Health check:
   curl http://localhost:3003/api/auth/me
   # Expected: 401 (means server is working)
   ```

4. **Test OAuth Initiation**
   - Open http://localhost:8081
   - Click "Sign In with Logto"
   - Should redirect to http://localhost:3001
   - Should see Logto sign-in form

5. **Test OAuth Callback**
   - After signing in on Logto
   - Should redirect to http://localhost:8081/callback
   - Should automatically redirect to http://localhost:8081/
   - Check browser console for errors

6. **Verify Authentication State**
   ```javascript
   // In browser console:
   // Check localStorage:
   Object.keys(localStorage).filter(k => k.startsWith('logto:'))
   // Should show: idToken, accessToken, refreshToken

   // Check API authentication:
   fetch('http://localhost:3003/api/auth/me', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('logto:YOUR_APP_ID:idToken')}`
     }
   }).then(r => r.json()).then(console.log)
   // Should return user data
   ```

---

### Workflow 2: Debug Dual Authentication

Dual authentication (Logto + Happy) has two phases. Debug each independently:

**Phase 1: Logto Authentication**

1. Verify Logto OAuth completes:
   ```javascript
   // Browser console:
   const idToken = localStorage.getItem('logto:ctwsvtkhp7e0yn5nm6s93:idToken');
   console.log(idToken ? 'Logto auth OK' : 'Logto auth FAILED');
   ```

2. If Logto fails, see [Common OAuth Issues](#common-oauth-issues)

**Phase 2: Happy Auto-Provisioning**

1. Check if Happy account exists:
   ```bash
   # Call platform API with Logto token:
   curl -H "Authorization: Bearer YOUR_LOGTO_ID_TOKEN" \
        http://localhost:3003/api/happy-accounts/me
   ```

2. Expected response:
   ```json
   {
     "token": "happy-jwt-token-here",
     "secret": "happy-secret-here"
   }
   ```

3. If this fails, check:
   - Server logs for errors
   - `HAPPY_SERVER_URL` in `server/.env.local`
   - Happy Server accessibility from server

4. Check Happy Server connection:
   ```bash
   # From server machine:
   curl https://api.cluster-fluster.com/health
   # Should return 200 OK
   ```

---

### Workflow 3: Debug Token Issues

Use this workflow when tokens appear corrupted or invalid:

1. **Inspect Token Structure**
   ```javascript
   // Browser console:
   const idToken = localStorage.getItem('logto:YOUR_APP_ID:idToken');

   // Decode JWT (without verification):
   const parts = idToken.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('Token payload:', payload);
   console.log('Issued at:', new Date(payload.iat * 1000));
   console.log('Expires at:', new Date(payload.exp * 1000));
   console.log('Is expired?', payload.exp * 1000 < Date.now());
   ```

2. **Verify Token on Server**

   Check server logs when API call is made. Look for:
   - "JWT verification successful" (good)
   - "JWT verification failed: ..." (indicates problem)

3. **Test Token Manually**
   ```bash
   # Make authenticated API call:
   curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
        http://localhost:3003/api/auth/me

   # Expected: User data (200) or specific error (401)
   ```

4. **Force Token Refresh**
   ```javascript
   // Browser console - clear tokens:
   Object.keys(localStorage)
     .filter(k => k.startsWith('logto:'))
     .forEach(k => localStorage.removeItem(k));

   // Reload and sign in again:
   location.reload();
   ```

---

## Quick Diagnosis Checklist

When facing OAuth issues, run through this checklist in order:

### 1. Services Running?
```bash
docker ps | grep -E "postgres|logto"     # Docker services
lsof -ti:3003                            # Next.js server
lsof -ti:8081                            # Expo web
```
✅ All should show running processes/containers

### 2. Environment Variables Correct?

**Client**:
```bash
echo $EXPO_PUBLIC_API_URL
```
✅ Should be: `http://localhost:3003` (or not set for production)

```bash
echo $EXPO_PUBLIC_HAPPY_SERVER_URL
```
✅ Should be: *empty* (use default)

**Server**:
```bash
grep HAPPY_SERVER_URL server/.env.local
```
✅ Should be: `HAPPY_SERVER_URL=https://api.cluster-fluster.com`

### 3. Logto Configuration?

```bash
# Test Logto homepage:
curl http://localhost:3001

# Test Logto OIDC config:
curl http://localhost:3001/oidc/.well-known/openid-configuration
```
✅ Both should return successful responses

### 4. API Server Working?

```bash
curl http://localhost:3003/api/auth/me
```
✅ Should return `401` (not `404`)

### 5. Authentication State?

Open browser console:
```javascript
// Check tokens:
Object.keys(localStorage).filter(k => k.startsWith('logto:'))
```
✅ Should show: idToken, accessToken, refreshToken (when authenticated)

### 6. Browser Console Errors?

Check browser developer console for:
- ❌ 404 errors (missing API routes)
- ❌ CORS errors (wrong server URLs)
- ❌ Network errors (services not running)
- ❌ Authentication errors (invalid tokens)

---

## Emergency Reset Procedure

When everything is broken and you don't know why, follow this complete reset procedure:

```bash
# ============================================
# STEP 1: Stop Everything
# ============================================

# Stop Docker services:
cd docker
docker compose down

# Kill any stray processes:
lsof -ti:3003 | xargs kill -9 2>/dev/null  # Next.js
lsof -ti:8081 | xargs kill -9 2>/dev/null  # Expo web
lsof -ti:3001 | xargs kill -9 2>/dev/null  # Logto (if not in Docker)

# ============================================
# STEP 2: Clean State
# ============================================

# Clear browser state (do this manually):
# 1. Open http://localhost:8081 in browser
# 2. Open DevTools (F12) → Application → Storage
# 3. Click "Clear site data"
# 4. Close browser

# ============================================
# STEP 3: Verify Configuration
# ============================================

# Server environment:
cat server/.env.local
# Required: HAPPY_SERVER_URL=https://api.cluster-fluster.com

# Client environment (should be empty/unset):
env | grep EXPO_PUBLIC

# ============================================
# STEP 4: Start Fresh (in order!)
# ============================================

# 4a. Start Docker:
cd docker
docker compose up -d
echo "Waiting for Logto to initialize..."
sleep 20

# Verify Logto:
curl http://localhost:3001
# Should return HTML

# 4b. Start Next.js server:
cd server
yarn dev
# Wait for "✓ Ready on http://localhost:3003"

# Verify server:
curl http://localhost:3003/api/auth/me
# Should return 401 (good!)

# 4c. Start Expo web client:
cd client
EXPO_PUBLIC_API_URL=http://localhost:3003 yarn web
# Wait for "Bundled successfully"

# Verify client:
# Open http://localhost:8081 in browser
# Should show login page

# ============================================
# STEP 5: Test OAuth Flow
# ============================================

# Manual test:
# 1. Open http://localhost:8081
# 2. Click "Sign In with Logto"
# 3. Should redirect to Logto (http://localhost:3001)
# 4. Create account or sign in
# 5. Should redirect back to app (http://localhost:8081/)
# 6. Should see main app interface

# Automated test (optional):
cd client/tests/e2e/web
EXPO_PUBLIC_API_URL=http://localhost:3003 node oauth-authentication.test.js
```

If this doesn't work, check:
1. Logto admin console configuration (redirect URIs)
2. Server logs for specific errors
3. Browser console for client-side errors

---

## Quick Reference

### Environment Variables Summary

| Variable | Component | Value | Required? |
|----------|-----------|-------|-----------|
| `EXPO_PUBLIC_API_URL` | Client | `http://localhost:3003` (dev) | ✅ Yes (dev only) |
| `EXPO_PUBLIC_HAPPY_SERVER_URL` | Client | *not set* (use default) | ❌ No (never set for dev) |
| `HAPPY_SERVER_URL` | Server | `https://api.cluster-fluster.com` | ✅ Yes |
| `LOGTO_ENDPOINT` | Client | `http://localhost:3001` (dev) | ✅ Yes |
| `ENCRYPTION_KEY` | Server | 32-char random string | ✅ Yes |

### Port Reference

| Service | Port | URL |
|---------|------|-----|
| Logto (Auth) | 3001 | http://localhost:3001 |
| Logto (Admin) | 3002 | http://localhost:3002 |
| Next.js (API) | 3003 | http://localhost:3003 |
| Postgres | 5432 | localhost:5432 |
| Expo Web | 8081 | http://localhost:8081 |

### Logto Admin Console Quick Links

- **Admin Console**: http://localhost:3002
- **Applications**: http://localhost:3002/applications
- **Users**: http://localhost:3002/users
- **Connectors**: http://localhost:3002/connectors
- **Logs**: http://localhost:3002/logs

### Key File Locations

#### Client (OAuth Flow)
- OAuth hook: `client/sources/hooks/useLogtoAuth.ts:23`
- Logto config: `client/sources/config/logto.ts`
- OAuth callback: `client/sources/app/callback.tsx`
- Auth guard: `client/sources/components/AuthGuard.tsx`
- Happy auto-login: `client/sources/components/HappyAutoLogin.tsx`

#### Server (JWT Verification)
- JWT verification: `server/lib/auth/logto.ts`
- Auth middleware: `server/lib/auth/middleware.ts`
- Happy provisioning: `server/app/api/happy-accounts/me/route.ts`
- Happy auth logic: `server/lib/happy/auth.ts`

### Related Documentation

- **Design**: `docs/design/architecture.md` (Section 7.1 - Authentication)
- **Decision**: `docs/decisions/002-authentication-solution.md` (Why Logto?)
- **Implementation**: `docs/implementation/logto-web-oauth-setup.md` (Platform setup)
- **Research**: `docs/research/authentication-system-analysis.md` (Deep dive - Chinese)
- **Testing**: `.claude/skills/e2e-test-runner/` (E2E test automation)

---

## Getting Help

If none of these solutions work:

1. **Capture full context**:
   - Browser console errors (screenshots)
   - Server logs (copy full output)
   - Network tab (failed requests)
   - Environment variables (sanitized)

2. **Check recent changes**:
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

3. **Test each component independently**:
   - Can you access Logto directly? (http://localhost:3001)
   - Can you access Next.js API? (http://localhost:3003/api/auth/me)
   - Does Expo web load? (http://localhost:8081)

4. **Review related documentation**:
   - Check `docs/research/authentication-system-analysis.md` for deep technical details
   - Check `.claude/skills/e2e-test-runner/TROUBLESHOOTING.md` for test-specific issues

5. **Ask for help with complete information**:
   - What were you trying to do?
   - What did you expect to happen?
   - What actually happened?
   - What have you already tried?

---

**Remember**: Most OAuth issues come from environment misconfiguration. Start with the [Quick Diagnosis Checklist](#quick-diagnosis-checklist) and you'll solve 90% of problems quickly!
