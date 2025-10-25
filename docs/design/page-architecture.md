# VibeBox Page Architecture Design

**Version**: 1.0
**Date**: 2025-10-25
**Status**: Approved
**Author**: Fugen, Claude

**Tags:** #design:page-architecture #design:navigation #design:user-flow #feature:mobile-first #component:client #principle:simplicity

---

## Overview

This document defines the complete page structure, navigation, and user flow for the VibeBox application. The design is based on Expo Router's file-based routing system and follows a mobile-first approach.

**Core Principles:**
- **Simplicity > Features**: Clear page hierarchy, minimal navigation depth
- **Mobile First**: Tab bar navigation, optimized for touch
- **Seamless Integration**: Preserve happy-client core functionality
- **State-Driven UI**: Pages adapt based on subscription status

---

## Architecture Overview

### Three-Layer Structure

```
app/
├── (public)/          # Public pages (no authentication required)
├── (auth)/            # Authentication flow pages
└── (app)/             # Main application (authenticated)
```

---

## Complete Page Map

### 1. Public Pages `(public)/`

```
(public)/
├── index.tsx                    # Landing page / Product introduction
├── pricing.tsx                  # Plans & Pricing
└── _layout.tsx                  # Public pages layout
```

**Purpose:**
- **Landing**: Product introduction, value proposition, CTA ("Get Started")
- **Pricing**: Plan comparison table (Basic/Pro), features, pricing

**Navigation:**
- Landing → Click "Get Started" → Login page
- Pricing → Click "Subscribe" → Login page (if not logged in) or Checkout (if logged in)

---

### 2. Authentication Flow `(auth)/`

```
(auth)/
├── index.tsx                    # Redirect to login
├── login.tsx                    # Login page (Logto OAuth)
├── callback.tsx                 # OAuth callback handler
└── _layout.tsx                  # Auth pages layout
```

**Purpose:**
- **Login**: GitHub/Google OAuth + Phone verification
- **Callback**: Handle Logto OAuth callback

**Navigation:**
- Login success → Dashboard `(app)/index`
- First login → Dashboard (empty state, prompt to choose plan)

---

### 3. Main Application `(app)/` - Core Business Features

#### 3.1 Dashboard & Subscription Management

```
(app)/
├── index.tsx                    # 📊 Dashboard / VibeBox list
│
├── subscriptions/               # 💳 Subscription management
│   ├── index.tsx                # Current subscription status + renewal
│   ├── plans.tsx                # Plan selection page
│   ├── checkout.tsx             # Payment page (WeChat/Stripe)
│   ├── payment-success.tsx      # Payment success page
│   ├── provisioning.tsx         # VibeBox provisioning progress
│   └── _layout.tsx
│
├── vibeboxes/                   # 🖥️ VibeBox instance management
│   ├── index.tsx                # Instance list (may merge with app/index)
│   ├── [id].tsx                 # Instance details
│   ├── [id]/
│   │   ├── connect.tsx          # Connect to Happy (prepare for session)
│   │   ├── credentials.tsx      # View SSH credentials
│   │   └── control.tsx          # Instance control (start/stop/restart)
│   └── _layout.tsx
│
└── _layout.tsx                  # Main app layout (Tab Bar / Side Nav)
```

**Key Pages:**

**📊 Dashboard `(app)/index`:**
- **Empty state** (no subscription): Show "Choose a plan to get started" + CTA
- **Provisioning**: Show configuration progress bar
- **Running**: Show VibeBox instance card
  - Status indicator
  - API usage progress bar
  - Quick action buttons (Connect, Restart, Stop)

**💳 Subscription Flow:**
```
plans.tsx → checkout.tsx → payment-success.tsx → provisioning.tsx → index.tsx (show instance)
```

**🖥️ VibeBox Details `vibeboxes/[id]`:**
- Full instance information (IP, specs, status)
- API usage details
- Connection method switcher (Mobile App / SSH)
- Instance control operations

---

#### 3.2 Happy Client Core Features (Inherited)

```
(app)/
├── session/                     # 💬 Happy Client Core - Session management
│   ├── index.tsx                # Session list
│   ├── [id].tsx                 # Session details (chat interface)
│   └── new.tsx                  # Create new session
│
├── terminal/                    # ⌨️ Terminal module
│   ├── index.tsx                # Terminal home
│   └── connect.tsx              # Connect to VibeBox terminal
│
├── artifacts/                   # 📁 Artifact management
│   ├── index.tsx                # Artifact list
│   ├── [id].tsx                 # Artifact details
│   ├── new.tsx                  # Create artifact
│   └── edit/[id].tsx            # Edit artifact
│
├── inbox/                       # 📬 Inbox
│   └── index.tsx                # Notifications/Messages
│
├── zen/                         # 🧘 Focus mode
│   └── index.tsx
│
└── settings/                    # ⚙️ Settings
    ├── index.tsx                # Settings home
    ├── account.tsx              # Account settings
    ├── appearance.tsx           # Appearance settings
    ├── features.tsx             # Feature toggles
    ├── language.tsx             # Language settings
    ├── usage.tsx                # Usage statistics
    └── connect/
        └── claude.tsx           # Claude API configuration
```

**Note:**
- These are core features inherited from **happy-client**
- **session** is the core coding interface (conversation with Claude Code)
- **terminal** provides full terminal access
- **artifacts** manages generated code/files

---

## Page Navigation Flow

### User Journey 1: New User Registration to Coding

```
(public)/index
    ↓ Click "Get Started"
(auth)/login (Logto OAuth)
    ↓ Login success
(app)/index (empty state)
    ↓ Click "Choose Plan"
(app)/subscriptions/plans
    ↓ Select plan
(app)/subscriptions/checkout
    ↓ Payment success
(app)/subscriptions/payment-success
    ↓ Auto redirect
(app)/subscriptions/provisioning
    ↓ Configuration complete (2-3 min)
(app)/index (show VibeBox instance card)
    ↓ Click "Open Happy Client"
(app)/session/[id] or (app)/terminal
    ↓ Start coding!
```

### User Journey 2: Existing User Daily Usage

```
(auth)/login
    ↓
(app)/index (show instance list)
    ↓ Option A: Click "Open Happy Client"
(app)/vibeboxes/[id]/connect
    ↓ Auto connect
(app)/session/new
    ↓ Start new session

    ↓ Option B: Click "View Details"
(app)/vibeboxes/[id]
    ↓ View SSH info, control instance
```

### User Journey 3: Renewal Flow

```
(app)/index
    ↓ See "Subscription expiring soon" alert
(app)/subscriptions/index
    ↓ Click "Renew Now"
(app)/subscriptions/checkout
    ↓ Re-payment
(app)/subscriptions/payment-success
    ↓ Subscription extended 30 days
```

---

## Navigation Structure

### Mobile Tab Bar (Bottom Navigation)

```
┌────────┬────────┬────────┬────────┬────────┐
│Dashboard│Session │Terminal│ Inbox  │Settings│
│   🏠   │   💬   │   ⌨️   │   📬   │   ⚙️  │
└────────┴────────┴────────┴────────┴────────┘
```

- **Dashboard**: `(app)/index` - VibeBox instance management
- **Session**: `(app)/session` - Happy Client core (conversational coding)
- **Terminal**: `(app)/terminal` - Direct terminal access
- **Inbox**: `(app)/inbox` - Notifications
- **Settings**: `(app)/settings` - Account and app settings

### Web Side Nav (Sidebar)

```
┌────────────────┐
│ VibeBox        │
├────────────────┤
│ 📊 Dashboard    │
│ 💬 Sessions     │
│ ⌨️ Terminal     │
│ 📁 Artifacts    │
│ 📬 Inbox        │
├────────────────┤
│ 💳 Subscription │
│ ⚙️ Settings     │
└────────────────┘
```

---

## Relationship with Happy Client

### Inherited Core Features (Keep Unchanged)

Pages inherited and preserved from `happy-client`:

✅ **Fully Retained:**
- `session/` - Core conversational coding interface
- `terminal/` - Terminal access
- `artifacts/` - Artifact management
- `inbox/` - Message notifications
- `zen/` - Focus mode
- `settings/` - Most settings pages

### New VibeBox Business Features

🆕 **New Modules:**
- `subscriptions/` - Subscription management (completely new)
- `vibeboxes/` - Instance management (completely new)
- `(public)/` - Marketing pages (completely new)
- `(auth)/` - Logto OAuth integration (replaces original auth)

### Modified Pages

🔧 **Needs Modification:**
- `(app)/index` - From simple session list to VibeBox dashboard
- `settings/account` - Add subscription info and billing entry
- `settings/usage` - Integrate API usage monitoring

### Removed/Hidden Features

❌ **Remove or Hide:**
- `server.tsx` - No need for manual server configuration (auto-configured)
- `friends/` - No social features in MVP
- `dev/` - Developer tools (keep if needed)
- `changelog.tsx` - Optional
- `machine/` - Replaced by vibeboxes/
- `restore/` - Keep if needed

---

## State-Driven Page Changes

### Dashboard `(app)/index` Different States

```typescript
// State 1: No subscription (empty state)
<EmptyState>
  <Title>Get Started with VibeBox</Title>
  <Description>Choose a plan to start your AI coding journey</Description>
  <Button href="/subscriptions/plans">Choose Plan</Button>
</EmptyState>

// State 2: Provisioning
<ProvisioningState>
  <ProgressBar value={60} />
  <Status>Installing Claude Code...</Status>
  <EstimatedTime>Estimated completion: 2 minutes</EstimatedTime>
</ProvisioningState>

// State 3: Running (core state)
<VibeBoxDashboard>
  <InstanceCard
    status="running"
    apiUsage="$3.50 / $10.00"
    actions={['Connect', 'Restart', 'Stop']}
  />
  <QuickActions>
    <ConnectButton />
    <NewSessionButton />
    <TerminalButton />
  </QuickActions>
</VibeBoxDashboard>

// State 4: Subscription expiring soon
<VibeBoxDashboard>
  <RenewalAlert>
    ⚠️ Subscription expires in 7 days
    <Button>Renew Now</Button>
  </RenewalAlert>
  <InstanceCard ... />
</VibeBoxDashboard>
```

---

## Page Priority

### P0 - MVP Essential (Phase 1)

```
✅ (auth)/login                  # Authentication
✅ (app)/index                   # Dashboard
✅ (app)/subscriptions/plans     # Plan selection
✅ (app)/subscriptions/checkout  # Payment
✅ (app)/subscriptions/provisioning  # Provisioning progress
✅ (app)/vibeboxes/[id]         # Instance details
✅ (app)/session/[id]           # Core coding interface (happy-client)
✅ (app)/terminal               # Terminal (happy-client)
```

### P1 - Important Features (Phase 2)

```
- (public)/index                # Landing page
- (public)/pricing              # Pricing page
- (app)/subscriptions/index     # Subscription management
- (app)/vibeboxes/[id]/credentials  # SSH credentials
- (app)/artifacts               # Artifact management
- (app)/settings                # Settings
```

### P2 - Enhanced Experience (Phase 3)

```
- (app)/inbox                   # Notifications
- (app)/zen                     # Focus mode
- (app)/subscriptions/payment-success  # Payment success page
- (app)/settings/usage          # Detailed usage
```

---

## Implementation Roadmap

### Phase 1: Core Subscription Flow (Week 1-2)
1. Authentication pages (Logto integration)
2. Dashboard home (empty state + instance card)
3. Subscription flow (plans → checkout → provisioning)

### Phase 2: Happy Client Integration (Week 3-4)
1. Connection logic (vibeboxes/[id]/connect)
2. Session interface integration
3. Terminal interface integration

### Phase 3: Feature Completion (Week 5-6)
1. Instance management (details, control)
2. Subscription management (renewal, status)
3. Settings and usage monitoring

---

## Key Design Decisions

1. **Single Entry Point**: `(app)/index` as the hub for all features
2. **State-Driven**: Auto-switch page content based on subscription status
3. **Preserve Core**: Happy Client core functionality fully retained
4. **Minimal Path**: New users can start coding in 3 steps (Login → Choose Plan → Pay)
5. **Mobile First**: Tab bar navigation, large buttons for key actions
6. **Progressive**: P0→P1→P2 gradual refinement, fast MVP validation

---

## Technical Notes

**Expo Router Features:**
- File-based routing
- Group routes with `(name)/` folders
- Dynamic routes with `[id].tsx`
- Layout nesting with `_layout.tsx`
- TypeScript support

**Navigation Libraries:**
- `expo-router` for routing
- `@react-navigation/native` under the hood
- Tab bar from `@react-navigation/bottom-tabs`
- Stack navigation from `@react-navigation/stack`

**State Management:**
- Subscription status: Global state (Zustand/Redux)
- Instance status: Server-driven via API polling/WebSocket
- Auth state: Logto SDK + secure storage

---

## Related Documents

- [PRD](./prd.md) - Product requirements and user stories
- [Architecture](./architecture.md) - System architecture
- [User Flow: Subscription](./user-flow-subscription.md) - Detailed subscription flow
- [ADR 001: Client Technology Stack](../decisions/001-client-technology-stack.md)
- [ADR 002: Authentication Solution](../decisions/002-authentication-solution.md)

---

**Document History:**
- 2025-10-25: Initial version created based on user stories and architecture review
