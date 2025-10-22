# Testing Framework for VibeBox OAuth Integration

This directory contains reusable testing templates and utilities for OAuth authentication testing.

## 📁 Directory Structure

```
testing/
├── README.md           # This file
├── templates/          # Reusable test script templates
├── docs/              # Testing best practices and lessons learned
└── utils/             # Utility scripts for configuration and verification
```

## 🎯 Key Testing Scenarios

### 1. OAuth Flow with Popup Window (Web Platform)

**Critical Learning:** When testing OAuth flows in web browsers, the authentication process often opens a **popup window**. Standard Playwright tests will miss this window unless you explicitly listen for it.

**Template:** See `templates/oauth-popup-test-template.js`

**Key Code Pattern:**
```javascript
// CRITICAL: Listen for popup windows
let popupPage = null;
context.on('page', async (newPage) => {
    console.log('🪟 Popup detected');
    popupPage = newPage;
    await newPage.waitForLoadState('networkidle').catch(() => {});
});
```

**Why This Matters:**
- OAuth providers (like Logto) use popups to avoid navigating away from the main app
- Popup windows are separate `Page` objects in Playwright
- Without capturing the popup, you can't interact with the authentication flow
- This pattern is universal for any OAuth popup-based flow

### 2. Database Configuration Verification

**Template:** See `utils/check-app-config.sh`

Directly query the database to verify configuration is actually saved (UI automation can be unreliable).

### 3. Multi-Step Registration Flows

**Template:** See `templates/oauth-popup-test-template.js` (includes multi-step handling)

Many auth providers use multi-step registration (username → password → email verification). Handle each step separately.

## 🚀 Quick Start

### Test OAuth Authentication

```bash
cd /Users/fugen/codes/happy/testing
node templates/oauth-popup-test-template.js
```

### Verify Logto Configuration

```bash
cd /Users/fugen/codes/happy/testing
./utils/check-app-config.sh
```

## 📚 Best Practices

### 1. Always Capture Popup Windows

When testing OAuth flows:
- ✅ **DO**: Listen for `context.on('page')` events
- ❌ **DON'T**: Assume navigation happens in the main window

### 2. Screenshot Everything

Save screenshots at every step for debugging:
- Before actions
- After actions
- On errors
- Use descriptive filenames: `01-step-name.png`

### 3. Verify Configuration Directly

Don't trust UI automation for configuration:
- ✅ **DO**: Query database to verify settings
- ❌ **DON'T**: Assume "Save" button actually saved

### 4. Generate Strong Random Passwords

Auth providers may reject weak passwords:
- ✅ **DO**: Generate random 16+ char passwords
- ❌ **DON'T**: Use predictable passwords like "Test123!"

### 5. Handle Async Popups Gracefully

Popup windows may close automatically:
- ✅ **DO**: Wrap operations in try-catch
- ✅ **DO**: Check `popupPage.isClosed()` before operations
- ❌ **DON'T**: Assume popup stays open

## 🔍 Common Issues and Solutions

### Issue: "No popup detected"

**Cause:** OAuth flow might use redirect instead of popup on certain browsers
**Solution:** Check both redirect and popup patterns

### Issue: "Invalid redirect URI"

**Cause:** Redirect URI not registered in OAuth provider
**Solution:** Use `utils/check-app-config.sh` to verify configuration

### Issue: "Password rejected"

**Cause:** Auth provider has strict password policies
**Solution:** Use random password generator in template

### Issue: "Authentication succeeds but app shows login page"

**Cause:** Token not properly stored or retrieved
**Solution:** Check browser storage and token handling in app code

## 📖 Related Documentation

- [OAuth Integration Plan](../docs/implementation/logto-web-oauth-setup.md)
- [Architecture Decision: Authentication](../docs/decisions/002-logto-authentication.md)
- [System Architecture](../docs/architecture/system-architecture.md)

## 🎓 Lessons Learned

### Critical Discovery: Popup Window Pattern

**What We Learned:**
The most critical insight was that `@logto/rn` SDK uses popup windows for OAuth on web platform, not redirects. This is non-obvious and easy to miss.

**How We Discovered It:**
1. Initial tests showed button click had no effect
2. User reported seeing a small window appear
3. Modified test to capture all new pages with `context.on('page')`
4. Success!

**Future Applications:**
This pattern applies to ANY web-based OAuth testing where the provider uses popups instead of redirects. Always monitor for new pages when testing OAuth flows.

---

**Last Updated:** October 22, 2025
**Maintained By:** Claude Code + Happy Engineering Team
