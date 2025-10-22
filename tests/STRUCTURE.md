# Testing Directory Structure

```
testing/
│
├── README.md                                  # Complete documentation
├── QUICKSTART.md                              # Quick start guide
├── STRUCTURE.md                               # This file
├── package.json                               # npm scripts for testing
│
├── e2e/                                       # ⭐ Production E2E Tests
│   ├── README.md                              #    E2E documentation
│   └── oauth-authentication.test.js           #    Complete OAuth flow test
│
├── templates/                                 # Reusable Templates
│   └── oauth-popup-test-template.js           #    OAuth popup test template
│
├── docs/                                      # Best Practices
│   └── popup-window-pattern.md                #    Critical: Popup capture pattern
│
├── utils/                                     # Utility Scripts
│   └── check-app-config.sh                    #    Database config verification
│
└── tmp/                                       # Test Artifacts (gitignored)
    └── oauth-success/                         #    Screenshots from test runs
        ├── 01-vibebox.png
        ├── 02-popup.png
        ├── 03-username.png
        ├── 04-password-page.png
        ├── 05-password-filled.png
        └── error-*.png (if test fails)
```

## 📂 Directory Purpose

### `/e2e` - Production E2E Tests
**Purpose:** Tests that can be run repeatedly to verify system behavior

**When to use:**
- Regression testing before deployment
- CI/CD pipeline integration
- Manual verification after changes
- Recording demo videos

**Key file:** `oauth-authentication.test.js` - Complete working OAuth test

### `/templates` - Reusable Test Templates
**Purpose:** Starting points for creating new tests

**When to use:**
- Creating tests for new OAuth providers
- Testing different authentication flows
- Adapting for similar popup-based flows

**Key file:** `oauth-popup-test-template.js` - Customizable OAuth template

### `/docs` - Best Practices & Lessons
**Purpose:** Document critical patterns and lessons learned

**When to use:**
- Before writing OAuth tests
- Debugging popup-related issues
- Sharing knowledge with team

**Key file:** `popup-window-pattern.md` - THE critical pattern

### `/utils` - Utility Scripts
**Purpose:** Helper scripts for configuration and verification

**When to use:**
- Verifying Logto database configuration
- Checking if settings are actually saved
- Debugging configuration issues

**Key file:** `check-app-config.sh` - Database query tool

## 🎯 Quick Navigation

**Want to:**
- Run a test? → `e2e/oauth-authentication.test.js`
- Create new test? → `templates/oauth-popup-test-template.js`
- Learn the pattern? → `docs/popup-window-pattern.md`
- Verify config? → `utils/check-app-config.sh`
- Get started? → `QUICKSTART.md`
- Full docs? → `README.md`

## 🚀 Common Commands

```bash
# Run OAuth E2E test
npm run test:oauth
# or
node e2e/oauth-authentication.test.js

# Check Logto configuration
npm run check:config
# or
./utils/check-app-config.sh

# Create new test from template
cp templates/oauth-popup-test-template.js my-test.js
```

## 📸 Test Artifacts

All test screenshots are saved to `tmp/oauth-success/` (gitignored).

**Naming convention:**
- `01-step-name.png` - Sequential steps
- `error-main.png` - Main page on error
- `error-popup.png` - Popup page on error

## 🔗 Integration Points

This testing framework integrates with:
- **Application:** `client/` (Expo web app)
- **Backend:** `server/` (Next.js API)
- **Auth Provider:** Logto (Docker container)
- **Documentation:** `docs/implementation/`

---

**Maintained by:** VibeBox Team
**Last updated:** October 22, 2025
