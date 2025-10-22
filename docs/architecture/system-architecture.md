# VibeBox System Architecture

**Version**: 1.0
**Date**: 2025-10-22
**Status**: Draft
**Authors**: Fugen, Claude

---

## 1. System Overview

### 1.1 Vision

VibeBox is a **mobile-first** AI coding platform that provides subscription-based coding environments (VibeBox instances) with native mobile apps and web access. Users can code with AI assistance anywhere, anytime, without complex setup.

### 1.2 Core Value Proposition

- **Mobile-First Experience**: Native iOS/Android apps optimized for mobile coding scenarios
- **Zero Configuration**: Pre-configured Claude Code, Happy CLI, and development tools
- **Seamless Access**: Single unified client across all platforms
- **Subscription-based**: Monthly/yearly subscription with included Claude API quota

### 1.3 Key Architecture Principles

Based on [CLAUDE.md](../../CLAUDE.md) and [ADR 001](../decisions/001-client-technology-stack.md):

- **Zero Modification > Custom Solutions**: Use Happy Server native API without modification
- **Experience > Purity**: Frontend/backend separation is reasonable architecture
- **Control > Dependency**: Deep customization capability for commercial needs
- **Mobile-First**: React Native client as primary platform, web as secondary
- **Simplicity > Features**: Start with simple auth, evolve later

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  iOS Native    │  │ Android Native │  │   Web Browser    │  │
│  │  (React Native)│  │ (React Native) │  │  (react-native-  │  │
│  │                │  │                │  │   web)           │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS/WebSocket
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                    VibeBox Backend                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 (App Router)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │ │
│  │  │  Auth API    │  │  Subscription│  │  VibeBox       │ │ │
│  │  │  Routes      │  │  API Routes  │  │  Management API│ │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │         Happy Integration Service                    │ │ │
│  │  │  - Account Creation (via /v1/auth)                  │ │ │
│  │  │  - SSH Automation                                    │ │ │
│  │  │  - Web URL Generation                               │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
┌───────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  PostgreSQL       │ │ Happy Server │ │  External       │
│  Database         │ │ (Official)   │ │  Services       │
│  - Users          │ │ - /v1/auth   │ │  - Payment      │
│  - Subscriptions  │ │ - /v1/machines│ │    (WeChat/     │
│  - VibeBoxes      │ │ - WebSocket  │ │     Stripe)     │
│  - Happy Mappings │ │              │ │  - Email        │
└───────────────────┘ └──────────────┘ └─────────────────┘
                              │
                              │ SSH Automation
                              ▼
                    ┌──────────────────┐
                    │  VibeBox Pool    │
                    │  (Cloud Servers) │
                    │  - Pre-installed │
                    │  - Happy Daemon  │
                    │  - Claude Code   │
                    └──────────────────┘
```

---

## 3. Component Architecture

### 3.1 Frontend (Client)

**Technology**: Expo SDK 54 + React Native 0.81 + React Native Web

**Structure**:
```
client/sources/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                  # Authentication flow
│   │   ├── login.tsx            # Login screen
│   │   ├── register.tsx         # Register screen
│   │   └── _layout.tsx          # Auth layout
│   ├── (app)/                   # Main app (protected)
│   │   ├── index.tsx            # Dashboard/VibeBox list
│   │   ├── vibeboxes/           # VibeBox management
│   │   │   ├── [id].tsx         # VibeBox detail
│   │   │   └── connect.tsx      # Connect to Happy
│   │   ├── subscriptions/       # Subscription management
│   │   │   ├── plans.tsx        # Plan selection
│   │   │   └── checkout.tsx     # Checkout flow
│   │   └── _layout.tsx          # App layout (with nav)
│   └── _layout.tsx              # Root layout
├── components/
│   ├── auth/                    # Auth components
│   ├── vibebox/                 # VibeBox components
│   │   ├── VibeBoxCard.tsx      # Instance card
│   │   ├── ConnectButton.tsx    # Connect to Happy button
│   │   └── StatusIndicator.tsx  # Status display
│   └── subscription/            # Subscription components
├── services/
│   ├── api.ts                   # API client
│   ├── auth.ts                  # Auth service
│   └── vibebox.ts               # VibeBox service
└── store/                       # State management (Zustand/Redux)
    ├── authStore.ts
    └── vibeboxStore.ts
```

**Key Design Decisions**:
- Use Expo Router for file-based routing (similar to Next.js)
- Simple state management (Zustand or Context API)
- API calls through centralized service layer
- Happy Client integration via WebView or deep linking

### 3.2 Backend (Server)

**Technology**: Next.js 15 + TypeScript + PostgreSQL

**Structure**:
```
server/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          # POST /api/auth/login
│   │   │   ├── register/route.ts       # POST /api/auth/register
│   │   │   ├── logout/route.ts         # POST /api/auth/logout
│   │   │   └── session/route.ts        # GET /api/auth/session
│   │   ├── subscriptions/
│   │   │   ├── plans/route.ts          # GET /api/subscriptions/plans
│   │   │   ├── checkout/route.ts       # POST /api/subscriptions/checkout
│   │   │   └── webhook/route.ts        # POST /api/subscriptions/webhook (payment callbacks)
│   │   ├── vibeboxes/
│   │   │   ├── route.ts                # GET /api/vibeboxes (list)
│   │   │   ├── [id]/route.ts           # GET /api/vibeboxes/:id
│   │   │   ├── [id]/connect/route.ts   # POST /api/vibeboxes/:id/connect
│   │   │   └── [id]/control/route.ts   # POST /api/vibeboxes/:id/control (start/stop)
│   │   └── admin/
│   │       └── provision/route.ts      # POST /api/admin/provision (internal)
│   └── layout.tsx
├── lib/
│   ├── auth.ts                         # Session management
│   ├── db.ts                           # Database client (Prisma/Drizzle)
│   ├── payment/                        # Payment integration
│   │   ├── types.ts                    # PaymentProvider interface
│   │   ├── paymentService.ts           # Main payment service
│   │   └── providers/                  # Provider implementations
│   │       ├── wechatPayProvider.ts    # WeChat Pay
│   │       ├── stripeProvider.ts       # Stripe
│   │       └── alipayProvider.ts       # Alipay
│   └── happy/
│       ├── integration.ts              # HappyIntegration class
│       ├── ssh.ts                      # SSH automation
│       └── types.ts                    # Happy-related types
├── services/
│   ├── authService.ts                  # Auth business logic
│   ├── subscriptionService.ts          # Subscription logic
│   ├── vibeboxService.ts               # VibeBox provisioning
│   └── happyService.ts                 # Happy integration
├── middleware.ts                        # Auth middleware
└── prisma/                             # Database schema
    └── schema.prisma
```

**Service Layer Design**:

```typescript
// lib/happy/integration.ts
export class HappyIntegration {
  // Core methods from zero-modification-solution.md
  async createAccount(platformUserId: string): Promise<HappyAccount>
  async configureVibeBox(vibeBoxIp: string, credentials: HappyAccount): Promise<void>
  async getWebAccessUrl(platformUserId: string): Promise<string>
  async getMachineStatus(platformUserId: string): Promise<MachineStatus>
}

// services/vibeboxService.ts
export class VibeBoxService {
  async provisionVibeBox(userId: string, planId: string): Promise<VibeBox>
  async getVibeBoxes(userId: string): Promise<VibeBox[]>
  async controlVibeBox(vibeBoxId: string, action: 'start'|'stop'|'restart'): Promise<void>
  async getConnectionInfo(vibeBoxId: string): Promise<ConnectionInfo>
}
```

### 3.3 External Services Integration

#### 3.3.1 Happy Server (Official)

**Integration Points**:
- `/v1/auth` - Account creation (challenge-signature auth)
- `/v1/machines` - Machine registration (automatic)
- WebSocket - Real-time communication (for future)

**Integration Strategy**: Zero Modification
- Use official Happy Server API
- No fork, no modification
- Account mapping in VibeBox database

#### 3.3.2 Payment Services

**Architecture**: Plugin-based payment provider system (see Section 6.2)

**Supported Providers**:
- **WeChat Pay** - Primary for China market (QR code, native APP)
- **Stripe** - Primary for international market (Checkout Session)
- **Alipay** - Secondary for China market

**Common Integration Points**:
- Order creation - Initiate payment flow
- Callback/Webhook - Payment success notification
- Order status query - Check payment status
- Order cancellation - Handle refunds

**Key Webhook Events** (standardized across providers):
- Payment success - Trigger VibeBox provisioning
- Subscription renewal - Extend subscription period
- Subscription cancellation - Handle cancellation

#### 3.3.3 Email Service

**Use Cases**:
- Support channel (support@vibebox.com)
- Manual subscription cancellation (MVP)
- Future: Onboarding, notifications

---

## 4. Data Model

### 4.1 Database Schema

```prisma
// prisma/schema.prisma

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  subscriptions Subscription[]
  vibeBoxes     VibeBox[]
  happyAccount  HappyAccount?
}

model Subscription {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id])

  planId        String         // "basic" | "pro" | "enterprise"
  status        String         // "active" | "canceled" | "expired"

  // Payment provider info
  paymentProvider        String   // "wechat" | "stripe" | "alipay"
  paymentCustomerId      String?  // Provider's customer ID
  paymentSubscriptionId  String?  // Provider's subscription ID

  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([userId])
  @@index([paymentSubscriptionId])
}

model VibeBox {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id])

  // Server info
  ip            String
  sshPort       Int            @default(22)
  rootPassword  String         // Encrypted

  // Status
  status        String         // "provisioning" | "running" | "stopped" | "error"

  // Plan
  planId        String

  // Happy integration
  happyConfigured Boolean      @default(false)

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([userId])
}

model HappyAccount {
  id            String         @id @default(cuid())
  userId        String         @unique
  user          User           @relation(fields: [userId], references: [id])

  // Happy credentials (from Zero Modification Solution)
  happyToken    String
  happySecret   String         // Base64 encoded

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([userId])
}

model Plan {
  id            String         @id
  name          String         // "Basic" | "Pro" | "Enterprise"
  description   String

  // Pricing
  priceMonthly  Int            // In cents (e.g., 2900 = $29.00)
  priceYearly   Int            // In cents

  // Resources
  cpuCores      Int
  ramGb         Int
  diskGb        Int

  // API Quota
  claudeApiQuota Int           // In dollars (e.g., 10 = $10.00/month)

  // Features
  features      Json           // Array of feature strings

  active        Boolean        @default(true)

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}
```

### 4.2 Entity Relationships

```
User (1) ─── (0..1) HappyAccount
  │
  ├─── (0..N) Subscription
  │
  └─── (0..N) VibeBox

Plan (1) ─── (0..N) Subscription
```

---

## 5. API Design

### 5.1 Authentication APIs

```typescript
// POST /api/auth/register
Request: {
  email: string
  username: string
  password: string
}
Response: {
  user: { id, email, username }
  session: { token }
}

// POST /api/auth/login
Request: {
  username: string  // or email
  password: string
}
Response: {
  user: { id, email, username }
  session: { token }
}

// GET /api/auth/session
Response: {
  user: { id, email, username } | null
}

// POST /api/auth/logout
Response: { success: boolean }
```

### 5.2 Subscription APIs

```typescript
// GET /api/subscriptions/plans
Response: {
  plans: Plan[]
}

// POST /api/subscriptions/checkout
Request: {
  planId: string
  billingCycle: "monthly" | "yearly"
  provider: "wechat" | "stripe" | "alipay"
}
Response: {
  orderId: string
  checkoutUrl?: string  // For redirect-based (Stripe)
  qrCodeUrl?: string    // For QR-based (WeChat Pay, Alipay)
}

// POST /api/subscriptions/webhook/:provider
// Webhook handler for payment provider callbacks (WeChat/Stripe/Alipay)
```

### 5.3 VibeBox Management APIs

```typescript
// GET /api/vibeboxes
Response: {
  vibeBoxes: VibeBox[]
}

// GET /api/vibeboxes/:id
Response: {
  vibeBox: VibeBox & {
    connectionInfo: {
      happyWebUrl: string
      sshCommand: string
    }
  }
}

// POST /api/vibeboxes/:id/connect
Response: {
  happyWebUrl: string
}

// POST /api/vibeboxes/:id/control
Request: {
  action: "start" | "stop" | "restart"
}
Response: {
  status: string
}
```

### 5.4 Admin APIs (Internal)

```typescript
// POST /api/admin/provision
// Triggered by Stripe webhook
Request: {
  userId: string
  planId: string
}
Response: {
  vibeBox: VibeBox
}
```

---

## 6. Integration Details

### 6.1 Happy Server Integration

**Based on**: [Zero Modification Solution](../implementation/zero-modification-solution.md)

**Flow**:

1. **Account Creation** (when user subscribes)
   ```typescript
   // Platform generates keypair
   const secretBytes = crypto.randomBytes(32)
   const signingKey = new SigningKey(secretBytes)
   const publicKey = signingKey.verifyKey.encode()

   // Call Happy Server /v1/auth
   const response = await fetch('https://api.happy.dev/v1/auth', {
     method: 'POST',
     body: JSON.stringify({
       publicKey: base64Encode(publicKey),
       challenge: base64Encode(challenge),
       signature: base64Encode(signature)
     })
   })

   const { token } = await response.json()

   // Store mapping
   await db.happyAccount.create({
     userId,
     happyToken: token,
     happySecret: base64Encode(secretBytes)
   })
   ```

2. **VibeBox Configuration** (SSH automation)
   ```typescript
   // SSH to VibeBox
   const ssh = new SSH({
     host: vibeBox.ip,
     username: 'root',
     password: vibeBox.rootPassword
   })

   // Write credentials
   await ssh.execCommand(`
     mkdir -p ~/.happy
     cat > ~/.happy/access.key <<EOF
     {
       "token": "${happyToken}",
       "secret": "${happySecret}"
     }
     EOF
     chmod 600 ~/.happy/access.key
   `)

   // Start happy daemon
   await ssh.execCommand('happy daemon start')
   ```

3. **Web Access** (URL generation)
   ```typescript
   const happyWebUrl = new URL('https://web.happy.dev')
   happyWebUrl.searchParams.set('token', happyToken)
   happyWebUrl.searchParams.set('secret', happySecret)
   happyWebUrl.searchParams.set('embedded', 'true')
   ```

### 6.2 Payment Integration

**Architecture Design**: Plugin-based payment provider system for multi-market support

**Payment Provider Interface**:
```typescript
// lib/payment/types.ts
export interface PaymentProvider {
  // Create payment order
  createOrder(params: {
    userId: string
    planId: string
    billingCycle: 'monthly' | 'yearly'
  }): Promise<PaymentOrder>

  // Handle payment callback/webhook
  handleCallback(request: Request): Promise<PaymentResult>

  // Query payment status
  queryOrderStatus(orderId: string): Promise<OrderStatus>

  // Cancel/refund
  cancelOrder(orderId: string): Promise<void>
}

export interface PaymentOrder {
  orderId: string
  checkoutUrl?: string     // For redirect-based (Stripe)
  qrCodeUrl?: string       // For QR-based (WeChat Pay, Alipay)
  nativeData?: any         // For native SDK (WeChat Pay APP, Apple IAP)
}

export interface PaymentResult {
  orderId: string
  status: 'success' | 'failed' | 'pending'
  userId: string
  planId: string
  amount: number
  currency: string
}
```

**Payment Flow**:
```
User → /api/subscriptions/checkout
  → PaymentService.createOrder(provider, params)
  → Provider.createOrder() (WeChat/Stripe/Alipay)
  → Return payment info (URL/QR/native data)
  → User completes payment
  → Provider webhook callback
  → Provider.handleCallback()
  → Verify signature & parse data
  → Trigger VibeBox provisioning
```

**Provider Implementations**:

```typescript
// lib/payment/providers/wechatPayProvider.ts
export class WechatPayProvider implements PaymentProvider {
  async createOrder(params) {
    const order = await wechatpay.transactions.native({
      mchid: config.wechat.mchid,
      appid: config.wechat.appid,
      description: `VibeBox ${params.planId}`,
      out_trade_no: generateOrderId(),
      notify_url: `${config.serverUrl}/api/payment/wechat/callback`,
      amount: { total: planPrices[params.planId], currency: 'CNY' }
    })

    return {
      orderId: order.out_trade_no,
      qrCodeUrl: order.code_url
    }
  }

  async handleCallback(req: Request) {
    // Verify WeChat Pay signature
    const verified = await wechatpay.verifySignature(req)
    if (!verified) throw new Error('Invalid signature')

    const { transaction_id, out_trade_no } = await req.json()
    // Return standardized result
    return {
      orderId: out_trade_no,
      status: 'success',
      ...
    }
  }
}

// lib/payment/providers/stripeProvider.ts
export class StripeProvider implements PaymentProvider {
  async createOrder(params) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${config.clientUrl}/checkout/success`,
      cancel_url: `${config.clientUrl}/checkout/cancel`,
      line_items: [{ price: planPriceIds[params.planId], quantity: 1 }],
      metadata: { userId: params.userId, planId: params.planId }
    })

    return {
      orderId: session.id,
      checkoutUrl: session.url
    }
  }

  async handleCallback(req: Request) {
    // Verify Stripe signature
    const sig = req.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(
      await req.text(), sig, webhookSecret
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      return {
        orderId: session.id,
        status: 'success',
        userId: session.metadata.userId,
        planId: session.metadata.planId,
        ...
      }
    }
  }
}

// lib/payment/paymentService.ts
export class PaymentService {
  private providers: Map<string, PaymentProvider>

  constructor() {
    this.providers = new Map([
      ['wechat', new WechatPayProvider()],
      ['stripe', new StripeProvider()],
      ['alipay', new AlipayProvider()]
    ])
  }

  async createOrder(
    providerName: string,
    params: OrderParams
  ): Promise<PaymentOrder> {
    const provider = this.providers.get(providerName)
    if (!provider) throw new Error(`Unknown provider: ${providerName}`)

    return provider.createOrder(params)
  }

  async handleCallback(
    providerName: string,
    req: Request
  ): Promise<PaymentResult> {
    const provider = this.providers.get(providerName)
    const result = await provider.handleCallback(req)

    // Trigger VibeBox provisioning
    if (result.status === 'success') {
      await vibeboxService.provisionVibeBox(result.userId, result.planId)
    }

    return result
  }
}
```

**Key Design Benefits**:
- ✅ Multi-market support (China: WeChat/Alipay, International: Stripe)
- ✅ Easy to add new providers without touching core logic
- ✅ Unified callback handling
- ✅ Provider-specific details encapsulated

---

## 7. Security Considerations

### 7.1 Authentication (MVP: Simple)

**Strategy**: Username + Password with secure session management

**Implementation**:
- Password hashing: bcrypt with salt rounds = 12
- Session management: HTTP-only cookies + JWT
- Session expiry: 7 days (configurable)
- CSRF protection: Next.js built-in

**Future Migration to Logto**:
- Keep user table structure compatible
- Add `authProvider` field: "local" | "logto"
- Migration script: existing users → Logto

### 7.2 API Security

- All API routes protected by middleware
- Rate limiting: 100 requests/minute per IP
- Input validation: Zod schemas
- SQL injection protection: Parameterized queries (Prisma)

### 7.3 Secrets Management

**Sensitive Data**:
- User passwords: bcrypt hash
- Root passwords: AES-256 encryption
- Happy secrets: Encrypted at rest
- Payment provider API keys: Environment variables

**Environment Variables**:
```env
DATABASE_URL=
HAPPY_SERVER_URL=

# Payment Providers
WECHAT_PAY_MCHID=
WECHAT_PAY_APPID=
WECHAT_PAY_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=

# Security
ENCRYPTION_KEY=
SESSION_SECRET=
```

---

## 8. Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Client Framework** | Expo + React Native | Mobile-first, cross-platform, proven ([ADR 001](../decisions/001-client-technology-stack.md)) |
| **Backend Framework** | Next.js 15 | API Routes, TypeScript, React ecosystem |
| **Database** | PostgreSQL | Reliable, mature, good Prisma support |
| **Auth (MVP)** | Username + Password | Simplicity, fast to implement, can migrate to Logto later |
| **Happy Integration** | Zero Modification | Use official API, no fork needed |
| **Payment** | Plugin-based (WeChat/Stripe/Alipay) | Multi-market support, China first (WeChat), international later (Stripe) |
| **Deployment** | TBD | Docker + Cloud provider (AWS/GCP/DigitalOcean) |

---

## 9. Architecture Considerations

### 9.1 VibeBox Resource Pool Management

**Hosting Options**:
- Cloud providers: AWS EC2, DigitalOcean, Vultr, Linode, Tencent Cloud, Alibaba Cloud
- Considerations: Cost, latency, regional availability

**Pool Management Strategies**:
- **Pre-provisioned pool**: Keep N ready instances, faster provisioning but higher cost
- **On-demand provisioning**: Create on payment success, slower but cost-effective
- **Hybrid approach**: Small warm pool + on-demand scaling

**Architecture Impact**:
- Database needs to track pool inventory
- Background jobs for pool monitoring and health checks
- Auto-scaling based on demand

### 9.2 Multi-Region & Market Support

**Regional Deployment**:
- **China Market**: Deploy on Alibaba Cloud / Tencent Cloud for better access
  - Consider Happy Server latency and accessibility
  - May need self-hosted Happy Server mirror
- **International Markets**: AWS / GCP / DigitalOcean
  - Distributed deployment for global low-latency access

**Data Sovereignty**:
- User data stored in region where they registered
- Cross-region replication considerations
- Compliance with local regulations

### 9.3 Scalability Design

**Database Scaling**:
- Connection pooling (PgBouncer)
- Read replicas for reporting and analytics
- Partitioning strategy for large tables (subscriptions, vibeboxes)

**Happy Server Scalability**:
- Official Happy Server capacity limits
- Potential need for multiple Happy Server instances
- Load balancing strategy for Happy accounts

**VibeBox Resource Limits**:
- Per-user resource quotas
- Fair scheduling and resource allocation
- Overflow handling strategy

### 9.4 Monitoring & Observability

**Key Metrics**:
- System health: API latency, error rates, database performance
- Business metrics: Active subscriptions, VibeBox utilization, API quota usage
- User experience: Client app performance, connection success rate

**Tooling Considerations**:
- Error tracking: Sentry, Bugsnag, or similar
- Logging: Structured logging (JSON), centralized aggregation
- Metrics: Prometheus + Grafana, or cloud provider solutions
- Alerting: Critical failures, payment issues, resource exhaustion

---

**Document History**:
- 2025-10-22: Initial draft created
- 2025-10-22: Removed implementation phases, focused on architecture
