# Decision 002: Authentication Solution Selection

**Status**: Accepted
**Date**: 2025-10-22
**Deciders**: Fugen, Claude
**Context**: Selecting the authentication and authorization solution for VibeBox commercial platform

**Tags:** #decision:authentication #component:client #feature:logto #feature:oauth #principle:experience-over-purity #feature:mobile-first #phase:think

---

## Context and Problem Statement

We need to choose an authentication and authorization solution for the VibeBox commercial platform. The platform requires user account management, subscription handling, and secure access control across mobile and web platforms.

Key requirements:
- **Mobile-first experience**: Native authentication flow optimized for mobile (no WebView)
- **Open-source preference**: Align with project values and MIT License compatibility
- **Standard protocols**: OIDC/OAuth 2.0 for flexibility and future migration
- **Cost-effectiveness**: Reasonable pricing for early-stage commercial platform
- **Enterprise features**: RBAC, multi-tenant support for subscription tiers
- **Self-hosting option**: Full control over user data and service availability
- **Cross-platform support**: iOS, Android, and Web

## Decision Drivers

### Business Requirements
- Subscription-based model requires robust user management
- Need to map platform accounts to Happy accounts
- Different subscription tiers (Free, Pro, Enterprise) require RBAC
- Early-stage budget constraints
- Future scalability requirements

### Technical Considerations
- Must integrate seamlessly with Expo/React Native client
- Must work with Next.js backend
- Standard protocols for avoiding vendor lock-in
- Native mobile experience (not WebView)
- Secure token storage (SecureStore on mobile)
- Support for social login (Google, Apple, GitHub)

### Strategic Factors
- Open-source alignment with project philosophy
- Self-hosting option for data sovereignty
- Active maintenance and community
- Quality documentation and SDK support

## Considered Options

### Option A: Logto (Recommended)

**Architecture**:
```
Mobile/Web Client (Expo/Next.js)
    ↓ (OIDC/OAuth 2.0)
Logto Service (Cloud or Self-hosted)
    ↓
VibeBox Backend (Next.js)
    ↓
Happy Server Integration
```

**Pros**:
- ✅ **Open-source** (MIT License compatible)
- ✅ **Mobile-first**: Native Expo/React Native SDK (`@logto/rn`)
- ✅ **Standard protocols**: OIDC/OAuth 2.0 (no vendor lock-in)
- ✅ **Cost-effective**: $16/month unlimited MAU, or 50,000 MAU free tier
- ✅ **Self-hosting option**: Full control over data and infrastructure
- ✅ **Enterprise features**: RBAC, multi-tenant (Organizations), MFA, enterprise SSO
- ✅ **Social login**: Google, Apple, GitHub, Discord, etc.
- ✅ **Active development**: Regular updates and good documentation
- ✅ **Framework-agnostic**: Aligns with Zero Modification principle

**Cons**:
- ❌ **Additional deployment**: Requires separate Logto service (Cloud or self-hosted)
- ❌ **Newer ecosystem**: Less mature than Auth0/Firebase (but growing fast)
- ❌ **Expo Go limitation**: Not compatible with Expo Go on Android (requires Development Build)
  - Mitigation: Use `npx expo run:android` for development, no impact on production

**Technical Stack**:
- **Client SDK**: `@logto/rn` with peer dependencies (expo-crypto, expo-secure-store, expo-web-browser)
- **Server**: JWT verification with standard OIDC endpoints
- **Deployment**: Logto Cloud (managed) or self-hosted (Docker)

### Option B: Clerk

**Pros**:
- ✅ Excellent developer experience with pre-built components
- ✅ Official React Native SDK
- ✅ Easy integration

**Cons**:
- ❌ **Closed-source**: No self-hosting, vendor lock-in risk
- ❌ **Expensive**: ~$25/month starting price, scales with usage
- ❌ **Non-standard OIDC**: Custom API, harder to migrate
- ❌ **Next.js focused**: Less suitable for framework-agnostic approach

### Option C: Supabase Auth

**Pros**:
- ✅ Open-source with generous free tier
- ✅ Includes database and backend features
- ✅ Good React Native support

**Cons**:
- ❌ **Ecosystem binding**: Tied to Supabase platform
- ❌ **Full BaaS**: More than just auth (may be overkill)
- ❌ **Less flexible**: Best used with full Supabase stack

### Option D: Auth0

**Pros**:
- ✅ Very mature and enterprise-grade
- ✅ Comprehensive features

**Cons**:
- ❌ **Expensive**: $35-240/month for just 500 MAU
- ❌ **WebView on mobile**: Poor native experience
- ❌ **No self-hosting**: Cloud-only

### Option E: Better Auth

**Pros**:
- ✅ Lightweight and simple
- ✅ Supports Expo API Routes

**Cons**:
- ❌ **Limited features**: Basic auth only
- ❌ **Newer project**: Less battle-tested
- ❌ **No enterprise features**: No RBAC, multi-tenant out of the box

### Option F: Firebase Auth

**Pros**:
- ✅ Mature with comprehensive documentation
- ✅ Good React Native support

**Cons**:
- ❌ **Google ecosystem binding**: Vendor lock-in
- ❌ **Hard to self-host**: Primarily cloud-based
- ❌ **Not pure auth**: Part of larger Firebase platform

## Decision Outcome

**Chosen option**: **Option A - Logto**

### Rationale

1. **Perfect mobile-first fit**
   - Native Expo/React Native SDK provides true native experience
   - No WebView, uses system browser for authentication
   - Secure token storage via expo-secure-store
   - Smooth deep linking for redirect flow

2. **Open-source and flexible**
   - MIT-compatible license aligns with project values
   - Can self-host for full control
   - Standard OIDC/OAuth 2.0 enables future migration if needed
   - Framework-agnostic approach

3. **Cost-effective for scaling**
   - Free tier: 50,000 MAU (sufficient for launch phase)
   - Paid tier: $16/month unlimited MAU (vs Auth0's $35-240/month for 500 MAU)
   - Self-hosting option for cost control at scale

4. **Enterprise-ready features**
   - **RBAC**: Manage subscription tiers (Free, Pro, Enterprise)
   - **Multi-tenant**: Organizations support for team accounts
   - **MFA**: Enhanced security for enterprise users
   - **Enterprise SSO**: SAML/OIDC for corporate customers
   - **Social login**: Google, Apple, GitHub, etc.

5. **Integration architecture clarity**
   ```
   VibeBox User Account (Logto)
        ↓
   Subscription Tier (RBAC roles)
        ↓
   VibeBox Backend (Next.js)
        ↓
   Happy Account Mapping (Database)
        ↓
   Happy Server (Vibe Server provisioning)
   ```

6. **Aligns with project principles**
   - ✅ Zero Modification (standard OIDC/OAuth API)
   - ✅ Open-source first
   - ✅ Simplicity > Features (use what we need)
   - ✅ Safety > Speed (standard protocols)

### Why not Clerk?

While Clerk offers excellent DX, it doesn't align with our principles:
- Closed-source creates vendor lock-in risk
- Non-standard OIDC makes future migration difficult
- Higher cost doesn't justify benefits for our use case

### Why not Supabase Auth?

Supabase Auth is excellent but:
- We don't need the full BaaS (already have Happy Server)
- Prefer pure authentication solution
- Want flexibility to use different backend services

## Consequences

### Positive

- ✅ True native mobile authentication experience
- ✅ Full control through self-hosting option
- ✅ Cost-effective scaling from 0 to millions of users
- ✅ Standards-based for future flexibility
- ✅ Enterprise features for commercial needs
- ✅ No vendor lock-in
- ✅ Open-source community and contributions

### Negative

- ⚠️ Additional infrastructure to deploy and maintain
  - Mitigation: Start with Logto Cloud, migrate to self-hosted when needed
- ⚠️ Newer ecosystem compared to Auth0/Firebase
  - Mitigation: Active development, good documentation, growing community
- ⚠️ Expo Go limitation on Android
  - Mitigation: Use Development Build for Android testing, no production impact

### Risks and Mitigations

**Risk 1**: Logto service availability affects entire platform
- **Mitigation**: Use Logto Cloud SLA (99.9% uptime), or self-host with redundancy

**Risk 2**: Learning curve for OIDC/OAuth implementation
- **Mitigation**: Logto provides comprehensive docs and SDK examples

**Risk 3**: Migration complexity if switching providers later
- **Mitigation**: Standard OIDC/OAuth makes migration easier than proprietary solutions

## Implementation Plan

### Phase 1: Logto Service Setup (Week 1)
1. **Service Deployment**:
   - Start with Logto Cloud (https://cloud.logto.io)
   - Create VibeBox tenant
   - Configure application settings

2. **Application Configuration**:
   - Create Native Application for Expo client
   - Set redirect URI: `io.vibebox://callback`
   - Configure social connectors (Google, Apple)
   - Set up custom branding

3. **RBAC Setup**:
   - Define roles: `free`, `pro`, `enterprise`, `admin`
   - Create permissions: `vibe-server:read`, `vibe-server:create`, etc.
   - Map subscription tiers to roles

### Phase 2: Client Integration (Week 1-2)
1. **Install Dependencies**:
   ```bash
   yarn add @logto/rn expo-crypto expo-secure-store expo-web-browser @react-native-async-storage/async-storage
   ```

2. **Create Auth Provider**:
   - Implement `LogtoProvider` wrapper
   - Configure OIDC endpoints
   - Set up token refresh

3. **Build Auth Screens**:
   - Login/signup flow
   - Profile management
   - Token storage using expo-secure-store

4. **Handle Deep Linking**:
   - Configure redirect URI in app.json
   - Handle authentication callback

### Phase 3: Backend Integration (Week 2)
1. **JWT Verification**:
   - Install `jose` for JWT verification
   - Fetch JWKS from Logto OIDC endpoint
   - Create auth middleware for Next.js API Routes

2. **User Management API**:
   - `/api/auth/profile` - Get current user
   - `/api/auth/subscription` - Get subscription status
   - `/api/users/:id/happy-account` - Manage Happy account mapping

3. **Database Schema**:
   ```typescript
   interface PlatformUser {
     logtoId: string          // Logto user ID (sub claim)
     email: string
     name?: string
     subscription: 'free' | 'pro' | 'enterprise'
     createdAt: Date
   }

   interface HappyAccountMapping {
     logtoUserId: string      // Foreign key to PlatformUser
     happyToken: string       // Happy account token (encrypted)
     happySecret: string      // Happy account secret (encrypted)
     vibeServerId?: string    // Associated Vibe Server
     createdAt: Date
   }
   ```

### Phase 4: User Mapping Flow (Week 3)
1. **Initial Onboarding**:
   ```
   User signs up with Logto
       ↓
   Create PlatformUser record
       ↓
   Provision Happy account (via Happy API)
       ↓
   Store encrypted credentials in HappyAccountMapping
       ↓
   Provision Vibe Server
   ```

2. **Authentication Flow**:
   ```
   User logs in via Logto
       ↓
   Client receives JWT with Logto ID
       ↓
   Backend verifies JWT
       ↓
   Look up HappyAccountMapping
       ↓
   Return Vibe Server connection info
   ```

### Phase 5: Testing and Optimization (Week 3-4)
1. **End-to-end Testing**:
   - Sign up flow
   - Login flow
   - Token refresh
   - Social login
   - Subscription tier changes

2. **Security Audit**:
   - Token storage security
   - API endpoint authorization
   - Encryption of sensitive data

3. **Performance Optimization**:
   - Token caching strategy
   - API response times
   - Error handling and retry logic

## References

### Logto Documentation
- [Logto Official Site](https://logto.io)
- [Logto Expo Quick Start](https://docs.logto.io/quick-starts/expo)
- [Logto React Native SDK](https://github.com/logto-io/react-native)
- [Logto vs Auth0 Comparison](https://blog.logto.io/logto-auth0-comparison)

### Technical Protocols
- [OpenID Connect Core Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)

### Related Decisions
- [ADR 001: Client Technology Stack](./001-client-technology-stack.md) - Expo/React Native architecture
- [Zero Modification Solution](../implementation/zero-modification-solution.md) - Integration principles

### Research
- Search results from authentication solution evaluation (2025-10-22)
- Mobile authentication best practices for Expo/React Native

---

**Note**: This decision balances mobile-first requirements, open-source values, cost-effectiveness, and enterprise features. Logto provides the best combination of these factors while maintaining flexibility through standard protocols.
