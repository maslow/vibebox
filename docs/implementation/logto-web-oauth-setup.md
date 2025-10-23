# Logto Web OAuth Configuration

**Tags:** #implementation:authentication #component:client:web #feature:logto #feature:oauth #action:required #phase:build

## Problem

The initial Logto integration was configured as a **Native App** with redirect URI `io.vibebox://callback`. This works for iOS/Android but fails on web because browsers cannot handle custom URL schemes.

## Solution

Implemented platform-specific redirect URIs:
- **Native (iOS/Android)**: `io.vibebox://callback` (deep link)
- **Web**: `http://localhost:8081/callback` (HTTP redirect)

## Changes Made

### 1. Updated Redirect URI Logic

**File**: `client/sources/hooks/useLogtoAuth.ts`

```typescript
// Platform-specific redirect URIs
const getRedirectUri = () => {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/callback`;
        }
        return 'http://localhost:8081/callback';
    }
    return 'io.vibebox://callback';
};
```

### 2. Created OAuth Callback Route

**File**: `client/sources/app/callback.tsx`

Handles the OAuth redirect on web platform and redirects to the main app after authentication completes.

## Required Logto Configuration

### Update Logto Application Settings

1. **Open Logto Admin Console**: http://localhost:3002
2. **Navigate to Applications** → **4bq12e6inwe0grgandxsx** (VibeBox Native App)
3. **Update Redirect URIs** section:
   - Keep existing: `io.vibebox://callback`
   - Add new: `http://localhost:8081/callback`
4. **Save changes**

### Alternative: Create Separate Web Application

If you prefer separation, you can create a dedicated Web Application in Logto:

1. Create new application with type "Traditional Web"
2. Configure redirect URI: `http://localhost:8081/callback`
3. Update `client/sources/config/logto.ts` with new App ID for web platform

## Testing

After configuring Logto, test the OAuth flow:

```bash
# Run the automated test
node test-web-login.js
```

Expected behavior:
1. Login page loads
2. Click "Sign In with Logto"
3. Redirects to Logto authentication page (localhost:3001)
4. After authentication, redirects back to app at `/callback`
5. Automatically navigates to main app

## Production Configuration

For production deployment:

1. **Update redirect URIs** in Logto to include production domain:
   - Development: `http://localhost:8081/callback`
   - Production: `https://your-domain.com/callback`

2. **Update environment variables** in `client/sources/config/logto.ts`:
   ```typescript
   export const logtoConfigProd: LogtoConfig = {
       endpoint: 'https://your-logto-instance.com',
       appId: 'your-production-app-id',
   };
   ```

## Architecture Decision

This implementation follows the principle of **platform-specific handling** rather than creating separate codebases for web and native. The same authentication code works across all platforms with conditional redirect URIs.

**Rationale**:
- Maintains code sharing between platforms
- Minimal configuration overhead
- Consistent authentication flow across platforms
- Aligns with Expo's cross-platform philosophy
