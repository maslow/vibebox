# End-to-End (E2E) Tests

This directory contains production-ready E2E tests for VibeBox OAuth authentication.

## 🎯 Available Tests

### `oauth-authentication.test.js`

**Purpose:** Complete end-to-end OAuth authentication flow test

**What it tests:**
1. ✅ Application loads correctly
2. ✅ Login button triggers OAuth popup
3. ✅ Popup window is captured (critical pattern)
4. ✅ User registration flow (username + strong password)
5. ✅ OAuth callback completes successfully
6. ✅ User is authenticated in main application

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
node testing/e2e/oauth-authentication.test.js
```

**Expected output:**
```
🎯 OAuth Success Test - Full Authentication
═══════════════════════════════════════════════════════

🔑 Generated strong password: TnSRd5JwphhHSGv#

📱 STEP 1: Opening VibeBox...
  ✅ Loaded

🖱️  STEP 2: Clicking Sign In...
🪟  OAuth popup opened
  ✅ Clicked

📝 STEP 3: Create account - username...
  ✅ Username: user1761127832813

🚀 STEP 4: Submitting username...
  ✅ Submitted

🔐 STEP 5: Setting password...
  ✅ Password entered

💾 STEP 6: Saving password...
  ✅ Clicked Save

⏳ STEP 7: Waiting for OAuth to complete...
  ✅ ✅ Popup closed - OAuth completed!

📊 STEP 8: Checking authentication result...

═══════════════════════════════════════════════════════
🎯 AUTHENTICATION RESULT:

  📍 URL: http://localhost:8081/
  🔐 Has login button: false
  📱 Has app content: true

  ✅ ✅ ✅ SUCCESS!!!
  ✅ User is authenticated!
  ✅ OAuth flow completed!
  ✅ Application is accessible!
```

## 🎬 Recording a Video Demo

To record a video of the successful OAuth flow:

```bash
# Run with browser visible (headless: false is default)
node testing/e2e/oauth-authentication.test.js

# The browser will stay open for 15 seconds at the end
# giving you time to see the final authenticated state
```

**Pro tip:** Use screen recording software (QuickTime, OBS, etc.) to capture the entire flow.

## 🔄 Regression Testing

This test serves as a regression test to ensure:
- OAuth integration continues to work after changes
- Popup window pattern is correctly handled
- Multi-step registration flow works
- Password policies are met

**Run before:**
- Deploying to production
- Changing authentication code
- Updating Logto configuration
- Modifying OAuth-related dependencies

## 🐛 Troubleshooting

### Test fails at "No popup detected"

**Cause:** Services not running or OAuth configuration issue
**Solution:**
1. Verify Logto is running: `docker ps | grep logto`
2. Check redirect URI in database: `./testing/utils/check-app-config.sh`
3. Ensure redirect URI includes: `http://localhost:8081/callback`

### Test fails at "Password rejected"

**Cause:** Password policy changed in Logto
**Solution:** Test auto-generates strong passwords. Check Logto Admin Console for updated policy.

### Popup opens but closes immediately

**Cause:** OAuth configuration mismatch
**Solution:**
1. Check App ID matches in `client/sources/config/logto.ts`
2. Verify redirect URI is registered in Logto
3. Check browser console for errors (popup screenshots capture this)

## 📸 Test Artifacts

All test runs save screenshots to `testing/tmp/oauth-success/`:
- `01-vibebox.png` - Initial app load
- `02-popup.png` - OAuth popup opened
- `03-username.png` - Username entered
- `04-password-page.png` - Password setup page
- `05-password-filled.png` - Password entered
- `error-main.png` / `error-popup.png` - Saved on failure

## 🎓 Learning Resources

This test demonstrates the critical **"Popup Window Pattern"** for OAuth testing.

**Key learning:** See `testing/docs/popup-window-pattern.md`

**Template:** See `testing/templates/oauth-popup-test-template.js`

## 🔗 Related Tests

- [ ] Token refresh test (TODO)
- [ ] Logout flow test (TODO)
- [ ] Multi-device auth test (TODO)

---

**Last Updated:** October 22, 2025
**Status:** ✅ Passing
