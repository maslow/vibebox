# Testing Framework - Quick Start

## 🚀 Run the OAuth E2E Test

```bash
# 1. Start all services
docker compose up -d              # PostgreSQL + Logto
cd server && yarn dev &           # Next.js server
cd client && yarn web &           # Expo web client

# 2. Run the E2E test
node testing/e2e/oauth-authentication.test.js
```

## 📚 What's in This Directory?

```
testing/
├── QUICKSTART.md              # This file
├── README.md                  # Full documentation
│
├── e2e/                       # Production E2E tests (can replay)
│   ├── oauth-authentication.test.js  # ⭐ Complete OAuth flow test
│   └── README.md              # E2E test documentation
│
├── templates/                 # Reusable test templates
│   └── oauth-popup-test-template.js  # Template for OAuth popup tests
│
├── docs/                      # Best practices and lessons learned
│   └── popup-window-pattern.md       # Critical: How to capture OAuth popups
│
└── utils/                     # Utility scripts
    └── check-app-config.sh    # Verify Logto database configuration
```

## 🎯 Key Concepts

### 1. OAuth Popup Pattern (MOST IMPORTANT!)

When testing OAuth flows, the authentication happens in a **popup window**, not the main page.

**Critical code pattern:**
```javascript
let popupPage = null;
context.on('page', async (newPage) => {
    popupPage = newPage;  // Capture the popup!
});
```

**Read more:** `testing/docs/popup-window-pattern.md`

### 2. Multi-Step Registration

OAuth providers like Logto use multi-step flows:
1. Enter username → Submit
2. Set password → Submit
3. OAuth callback → Complete

**Each step is a separate page navigation in the popup.**

### 3. Strong Password Generation

Auth providers reject weak passwords. Always generate random strong passwords:

```javascript
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
let password = '';
for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
}
```

## 🎬 Recording a Demo Video

The E2E test stays open for 15 seconds at the end, perfect for recording:

```bash
# 1. Start screen recording (QuickTime, OBS, etc.)
# 2. Run test
node testing/e2e/oauth-authentication.test.js

# 3. Watch the automated flow complete
# 4. Stop recording after browser closes
```

## 🔧 Creating Your Own Test

Use the template as a starting point:

```bash
cp testing/templates/oauth-popup-test-template.js my-custom-test.js

# Edit these sections:
# 1. CONFIG object (URLs, button text, etc.)
# 2. handleRegistrationFlow() (your auth provider's steps)
# 3. verifyAuthentication() (how to check if logged in)
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "No popup detected" | Check if services are running |
| "Invalid redirect URI" | Run `./testing/utils/check-app-config.sh` |
| "Password rejected" | Test auto-generates strong passwords, check policy |
| Screenshots missing | Check `testing/tmp/` directory |

## 📖 Full Documentation

- **Complete guide:** `testing/README.md`
- **Popup pattern:** `testing/docs/popup-window-pattern.md`
- **E2E tests:** `testing/e2e/README.md`

## ✅ Success Checklist

Before considering OAuth integration "done":

- [x] E2E test passes consistently
- [x] Popup window is captured correctly
- [x] Multi-step registration works
- [x] Strong passwords accepted
- [x] OAuth callback completes
- [x] User authenticated in main app
- [x] Screenshots captured for all steps
- [x] Test is repeatable (no manual cleanup needed)

---

**Next Steps:** Run the E2E test to verify everything works!

```bash
node testing/e2e/oauth-authentication.test.js
```
