# Maestro E2E Tests for VibeBox

> **Note**: This directory contains mobile E2E tests. For the complete testing strategy and documentation, see [`/client/tests/README.md`](../tests/README.md).

This directory contains end-to-end tests for the VibeBox iOS/Android app using Maestro.

## Quick Links

- 📖 [Complete Testing Strategy](../tests/README.md) - Overall test organization
- ⚠️ [Manual Tests Tracking](../tests/MANUAL_TESTS.md) - Technical limitations & workarounds
- 🌐 [Web E2E Tests](../tests/e2e/web/) - Fully automated web tests

## Installation

Maestro is already installed via Homebrew:
```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

## Running Tests

### Prerequisites
1. **Start Metro bundler:**
   ```bash
   yarn start
   ```

2. **Start the app on simulator:**
   ```bash
   yarn ios
   ```

3. **Ensure backend services are running:**
   - PostgreSQL + Logto (Docker): `docker compose up -d`
   - Next.js Server: `cd server && yarn dev`

### Run a single test
```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk/25/libexec/openjdk.jdk/Contents/Home"
maestro test maestro/oauth-flow-verification.yaml
```

### Run all tests
```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk/25/libexec/openjdk.jdk/Contents/Home"
maestro test maestro/
```

**Note:** JAVA_HOME must be set for Maestro to work. Add it to your shell profile for convenience.

## Available Tests

### `oauth-flow-verification.yaml` ⭐ **Recommended**
OAuth flow initiation test for iOS app

**What it tests:**
1. ✅ App launches correctly
2. ✅ Connects to dev server (Expo Dev Client)
3. ✅ Sign In button is visible and works
4. ✅ OAuth browser/WebView opens successfully

**Limitations:**
Due to iOS security restrictions, Maestro cannot interact with SFSafariViewController/WebView content. This test verifies the OAuth flow initiation, but complete authentication must be verified manually or through web E2E tests.

### `oauth-authentication.yaml` (Experimental)
Full OAuth authentication flow test - **Note:** This test may fail at the OAuth page interaction step due to iOS WebView limitations. Use `oauth-flow-verification.yaml` for reliable automated testing.

### `simple-launch-test.yaml`
Basic app launch test for debugging

### `connect-and-test.yaml`
Expo Dev Client connection test

## Test Results Summary

### ✅ What Works on iOS
The `oauth-flow-verification.yaml` test successfully automates:
1. **App Launch** - Launches VibeBox dev build on iOS simulator
2. **Expo Dev Client Handling** - Dismisses developer menu modal
3. **Dev Server Connection** - Connects to localhost Metro bundler
4. **Sign In Flow Initiation** - Clicks "Sign In with Logto" button
5. **OAuth Browser Detection** - Verifies OAuth browser/WebView opens

### ⚠️ iOS Limitations
Due to iOS security sandbox restrictions, Maestro cannot:
- **Interact with WebView content** - Cannot fill forms or click buttons inside SFSafariViewController/WKWebView
- **Read WebView text** - Cannot verify text content inside the OAuth browser
- **Complete full OAuth flow** - Cannot automate username/password entry in Logto

These are platform limitations, not Maestro bugs. For complete OAuth testing, use:
- ✅ [Web E2E Tests](../tests/e2e/web/oauth-authentication.test.js) - Fully automated
- ⚠️ [Manual Test Steps](../tests/MANUAL_TESTS.md#1-ios-oauth-webview-interaction) - iOS WebView only

## Test Structure

Each test file follows Maestro YAML format:
- `appId`: Bundle identifier for the app
- `---`: Test steps separator
- Steps: Actions like `tapOn`, `inputText`, `assertVisible`, etc.

## Debugging

### View test in slow motion
```bash
maestro test --debug-output /tmp/maestro maestro/oauth-authentication.yaml
```

### Record test video
```bash
maestro record maestro/oauth-authentication.yaml
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro API Reference](https://maestro.mobile.dev/api-reference/commands)

