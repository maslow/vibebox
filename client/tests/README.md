# VibeBox Testing Strategy

**Philosophy**: AI First - Automate everything except what is technically impossible.

**Quality Gate**: Client (Mobile) is the final quality checkpoint.

---

## 🎯 Testing Strategy

```
┌─────────────────────────────────────────────┐
│ Web E2E (Playwright)                        │
│ - 100% automated                            │
│ - Complete OAuth flow (including WebView)  │
│ - All user journeys                         │
│ - Runs on: PR (CI/CD)                       │
└─────────────────────────────────────────────┘
                    ↓ Passes
┌─────────────────────────────────────────────┐
│ Mobile E2E (Maestro)                        │
│ - Maximum automation                        │
│ - OAuth flow (until WebView - iOS limit)   │
│ - All native UI interactions               │
│ - Runs on: Merge to main                   │
└─────────────────────────────────────────────┘
                    ↓ Passes
┌─────────────────────────────────────────────┐
│ Manual Tests (MANUAL_TESTS.md)              │
│ - ONLY technical limitations                │
│ - Currently: iOS OAuth WebView only         │
│ - Runs on: Pre-release                      │
└─────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
/client/tests/
├── e2e/
│   ├── web/                          # Web E2E tests
│   │   ├── oauth-authentication.test.js
│   │   ├── user-onboarding.test.js
│   │   └── navigation.test.js
│   └── mobile/                       # → symlink to ../maestro
│       ├── oauth-flow-verification.yaml
│       ├── navigation.yaml
│       └── README.md
├── fixtures/                         # Shared test data
│   ├── users.json
│   └── scenarios.json
├── MANUAL_TESTS.md                   # Technical debt tracking
├── playwright.config.js              # Web E2E config
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. Start backend services
docker compose up -d                  # PostgreSQL + Logto

# 2. Start Next.js server
cd server && yarn dev

# 3. Start Metro bundler (for mobile)
cd client && yarn start
```

### Run Web E2E

```bash
cd client/tests
npx playwright test e2e/web
```

### Run Mobile E2E

```bash
# Set JAVA_HOME (add to ~/.zshrc for persistence)
export JAVA_HOME="/opt/homebrew/Cellar/openjdk/25/libexec/openjdk.jdk/Contents/Home"

# Start iOS simulator
cd client && yarn ios

# Run tests
cd client
maestro test maestro/oauth-flow-verification.yaml
```

### Run Manual Tests

See [`MANUAL_TESTS.md`](./MANUAL_TESTS.md) for the checklist.

---

## 📊 Test Coverage

### Current Status

| Area | Web E2E | Mobile E2E | Manual |
|------|---------|------------|--------|
| OAuth Flow | ✅ 100% | ⚠️ 90% | ⚠️ WebView only |
| Navigation | ✅ 100% | ⏳ TODO | - |
| User Onboarding | ✅ 100% | ⏳ TODO | - |
| Settings | ⏳ TODO | ⏳ TODO | - |
| Data Sync | ⏳ TODO | ⏳ TODO | - |

**Legend**:
- ✅ Fully automated
- ⚠️ Partially automated
- ⏳ Not yet implemented
- `-` Not needed

### Automation Priority

**P0 (Must automate)**:
- OAuth authentication flow
- Core user journeys
- Critical error scenarios

**P1 (Should automate)**:
- Settings and preferences
- Navigation flows
- Data synchronization

**P2 (Nice to automate)**:
- Edge cases
- UI polish verification

---

## 🧪 Writing Tests

### Test Organization

**Organize by USER JOURNEY, not by feature**:

```javascript
// ✅ Good - User journey focused
describe('First Time User Journey', () => {
  it('should complete onboarding from install to first action', async () => {
    // 1. Open app
    // 2. Sign in with OAuth
    // 3. Complete profile
    // 4. Navigate to home
    // 5. Perform first action
  })
})

// ❌ Bad - Feature focused
describe('Auth', () => {})
describe('Profile', () => {})
describe('Navigation', () => {})
```

### Web E2E Example

```javascript
// tests/e2e/web/oauth-authentication.test.js
import { test, expect } from '@playwright/test'

test('OAuth authentication flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3001')

  // Click sign in
  await page.click('text=Sign In with Logto')

  // Complete OAuth (Web can do this!)
  await page.fill('[name="username"]', `testuser${Date.now()}`)
  await page.click('text=Continue')
  await page.fill('[name="password"]', 'TestPassword123!@#')
  await page.click('text=Sign in')

  // Verify logged in
  await expect(page.locator('text=/Happy|Session|Disconnected/')).toBeVisible()
})
```

### Mobile E2E Example

```yaml
# maestro/oauth-flow-verification.yaml
appId: com.vibebox.app.dev
---
# Launch and navigate to OAuth
- launchApp
- tapOn: "Sign In with Logto"

# Verify WebView opens
- extendedWaitUntil:
    notVisible: "Sign In with Logto"
    timeout: 10000
- takeScreenshot: maestro/screenshots/oauth-opened.png

# Manual: Complete OAuth in WebView (iOS limitation)
# Automated: Verify post-OAuth state (TODO)
```

---

## 🔧 Debugging

### Web E2E

```bash
# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test oauth-authentication

# Debug mode
npx playwright test --debug
```

### Mobile E2E

```bash
# Run with console output
maestro test --continuous maestro/oauth-flow-verification.yaml

# Record session
maestro record

# View hierarchy
maestro hierarchy
```

### Screenshots

All test screenshots are saved in:
- Web: `tests/e2e/web/test-results/`
- Mobile: `maestro/screenshots/`

---

## 🚨 When Tests Fail

### 1. Check if it's a real bug
- Does it fail consistently?
- Can you reproduce manually?
- Is it a real user-facing issue?

### 2. Check test assumptions
- Are services running (Docker, Next.js, Metro)?
- Is test data still valid?
- Did app behavior intentionally change?

### 3. Check technical limitations
- Did iOS/Maestro update break something?
- Is JAVA_HOME still set correctly?
- Are simulators/browsers up to date?

### 4. Never ignore failures
- Fix the test OR fix the bug
- Don't skip/disable tests without documenting why

---

## 📈 Continuous Improvement

### Quarterly Review (Every 3 months)

Review [`MANUAL_TESTS.md`](./MANUAL_TESTS.md):
- [ ] Are manual tests still necessary?
- [ ] Any new automation tools available?
- [ ] Can we automate any manual tests?

### Adding New Tests

When adding new features:
1. ✅ Write Web E2E first (fully automated)
2. ✅ Write Mobile E2E (maximize automation)
3. ⚠️ Add to `MANUAL_TESTS.md` ONLY if technically impossible

### Test Maintenance

- Keep tests fast (< 5 min total)
- Keep tests reliable (no flaky tests)
- Keep tests simple (readable by anyone)

---

## 🎓 Best Practices

### DO ✅
- Test user journeys, not individual functions
- Make tests independent (no test depends on another)
- Use meaningful test data
- Take screenshots at key points
- Document technical limitations

### DON'T ❌
- Test third-party libraries
- Test React Native internals
- Test Logto SDK behavior
- Write flaky tests
- Add manual tests without trying automation first

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Maestro Documentation](https://maestro.mobile.dev)
- [Web E2E Tests](./e2e/web/)
- [Mobile E2E Tests](../maestro/)
- [Manual Tests Tracking](./MANUAL_TESTS.md)

---

**Remember**: Every line of test code is an investment in quality and confidence. Make it count.
