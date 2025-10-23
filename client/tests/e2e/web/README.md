# End-to-End (E2E) Tests

This directory contains production-ready E2E tests for VibeBox OAuth authentication.

## 🎯 Available Tests

### `oauth-authentication.test.js`

**Purpose:** Complete end-to-end OAuth authentication flow test

**What it tests:**
1. ✅ Application loads correctly
2. ✅ Login button triggers OAuth redirect (no popup)
3. ✅ Redirect to Logto authentication page
4. ✅ User registration flow (username + strong password)
5. ✅ OAuth callback redirect completes successfully
6. ✅ User is authenticated with tokens stored in localStorage

**Prerequisites:**
```bash
# Install dependencies
npm install playwright

# Or
yarn add -D playwright

# Install browsers
npx playwright install chromium
```

**Running the test:**
```bash
# Make sure all services are running:
# 1. PostgreSQL + Logto (Docker)
docker compose up -d

# 2. Next.js Server
cd server && yarn dev

# 3. Expo Web Client
cd client && yarn web

# Then run the test:
cd client/tests/e2e/web
node oauth-authentication.test.js
```

**Expected output:**
```
🎯 OAuth Redirect Test - Full Authentication
═══════════════════════════════════════════════════════

🔑 Generated strong password: TnSRd5JwphhHSGv#

📱 STEP 1: Opening VibeBox...
  ✅ Loaded

🖱️  STEP 2: Clicking Sign In...
  ✅ Redirected to Logto (no popup!)

📝 STEP 3: Create account - username...
  ✅ Username: user1761127832813

🚀 STEP 4: Submitting username...
  ✅ Submitted

🔐 STEP 5: Setting password...
  ✅ Password entered

💾 STEP 6: Saving password...
  ✅ Clicked Save

⏳ STEP 7: Waiting for OAuth flow to complete...
  ✅ OAuth redirect detected

⏳ STEP 8: Waiting for auth state to update...

📊 STEP 9: Verifying authentication...

═══════════════════════════════════════════════════════
🎯 AUTHENTICATION RESULT:

  📍 Final URL: http://localhost:8081/
  🔐 localStorage keys: 5
  🎫 Has ID token: true
  🔄 Redirect mode: YES (no popup used)

  ✅ ✅ ✅ SUCCESS!!!
  ✅ User is authenticated!
  ✅ Redirect flow completed!
  ✅ Logto tokens stored in localStorage!
  ✅ No popup window was used!
```

## 🎬 Recording a Video Demo

To record a video of the successful OAuth flow:

```bash
# Run with browser visible (headless: false is default)
cd client/tests/e2e/web
node oauth-authentication.test.js

# The browser will stay open for 15 seconds at the end
# giving you time to see the final authenticated state
```

**Pro tip:** Use screen recording software (QuickTime, OBS, etc.) to capture the entire flow.

## 🔄 Regression Testing

This test serves as a regression test to ensure:
- OAuth integration continues to work after changes
- Redirect-based authentication flow works correctly
- Multi-step registration flow works
- Password policies are met
- Tokens are properly stored in localStorage

**Run before:**
- Deploying to production
- Changing authentication code
- Updating Logto configuration
- Modifying OAuth-related dependencies

## 🐛 Troubleshooting

### Test fails at redirect step

**Cause:** Services not running or OAuth configuration issue
**Solution:**
1. Verify Logto is running: `docker ps | grep logto`
2. Ensure redirect URI is registered: `http://localhost:8081/callback`
3. Check that server is running on port 3003

### Test fails at "Password rejected"

**Cause:** Password policy changed in Logto
**Solution:** Test auto-generates strong passwords. Check Logto Admin Console for updated policy.

### Authentication completes but no tokens in localStorage

**Cause:** OAuth callback redirect might be failing
**Solution:**
1. Check App ID matches in Logto configuration
2. Verify redirect URI is registered in Logto
3. Check browser console for errors in screenshots
4. Ensure @logto/react SDK is properly configured

## 📸 Test Artifacts

All test runs save screenshots to `client/tests/e2e/web/tmp/oauth-redirect/`:
- `01-vibebox.png` - Initial app load
- `02-logto-page.png` - Logto authentication page (after redirect)
- `03-username.png` - Username entered
- `04-password-page.png` - Password setup page
- `05-password-filled.png` - Password entered
- `07-callback-page.png` - OAuth callback page
- `08-app-page.png` - App page after authentication
- `09-final.png` - Final authenticated state
- `error.png` - Saved on failure

## 🎓 Key Learning: Redirect Flow

This test demonstrates the **OAuth Redirect Pattern** used by @logto/react:

**Flow:**
1. User clicks "Sign In" → Browser redirects to Logto
2. User authenticates → Logto redirects to `/callback?code=...`
3. SDK exchanges code for tokens → Stores in localStorage
4. App redirects to home page → User is authenticated

**No popup window is used** - the entire flow happens via page redirects.

## 🔗 Related Tests

- [ ] Token refresh test (TODO)
- [ ] Logout flow test (TODO)
- [ ] Multi-device auth test (TODO)

---

**Last Updated:** October 23, 2025
**Status:** ✅ Updated to redirect flow (matches current implementation)
