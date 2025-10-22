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
│  │  │  - SSH Automation (VibeBox configuration)           │ │ │
│  │  │  - Connection Info Management                       │ │ │
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
- **Based on happy-client**: Direct fork and customization, inheriting all core features (terminal, editor, Claude Code integration, encryption, sync)
- Use Expo Router for file-based routing (similar to Next.js)
- Simple state management (Zustand or Context API)
- API calls through centralized service layer for VibeBox platform features
- Direct WebSocket connection to Happy Server using token/secret authentication

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

**Service Layer Responsibilities**:

**HappyIntegration Service** (`lib/happy/integration.ts`)
- 职责：Happy Server集成和账户管理
- 核心能力：
  - 创建Happy账户（生成密钥对，调用/v1/auth）
  - 自动配置VibeBox服务器（SSH automation）
  - 监控机器连接状态

**VibeBoxService** (`services/vibeboxService.ts`)
- 职责：VibeBox实例生命周期管理
- 核心能力：
  - VibeBox实例配置（从支付成功触发）
  - 实例控制（启动、停止、重启）
  - 资源池管理和分配
  - 提供连接信息（token/secret）给客户端

**PaymentService** (`lib/payment/paymentService.ts`)
- 职责：多支付提供商协调
- 核心能力：
  - 统一订单创建接口
  - Webhook回调处理和验证
  - 订单状态查询
  - 支付成功后触发VibeBox配置

**Note**: VibeBox客户端（基于happy-client）直接通过WebSocket连接到Happy Server，使用存储在HappyAccount表中的token/secret认证。

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

## 5. 核心业务流程

### 5.1 用户完整旅程

从用户注册到开始编码的完整流程：

```
┌─────────┐
│ 用户注册 │
└────┬────┘
     │ 1. 提交邮箱、用户名、密码
     │ 2. 后端验证并创建User记录
     ▼
┌─────────┐
│ 浏览计划 │
└────┬────┘
     │ 3. 获取订阅计划列表
     │    (Basic/Pro/Enterprise)
     ▼
┌─────────┐
│ 选择计划 │
└────┬────┘
     │ 4. 选择计划和付费周期
     │    (月付/年付)
     ▼
┌─────────┐
│ 支付流程 │  ────────────────┐
└────┬────┘                   │
     │ 5. 选择支付方式         │ 详见 5.3
     │    - 微信支付 (中国)    │
     │    - 支付宝 (中国)      │
     │    - Stripe (国际)      │
     │ 6. 完成支付            │
     ▼                        │
┌─────────┐◄─────────────────┘
│支付成功  │
└────┬────┘
     │ 7. Webhook触发后端处理
     ▼
┌─────────────┐
│VibeBox 配置  │  ───────────┐
└─────┬───────┘              │
      │ 8. 创建Happy账户      │
      │ 9. SSH配置服务器      │ 详见 6.1
      │10. 启动Happy守护进程   │
      ▼                      │
┌─────────────┐◄─────────────┘
│VibeBox 就绪  │
└─────┬───────┘
      │11. 客户端获取连接信息
      │    (token/secret)
      ▼
┌──────────────┐
│ 客户端连接    │
└──────┬───────┘
       │12. WebSocket连接到Happy Server
       │13. Happy Server关联到VibeBox
       ▼
┌──────────────┐
│ 开始编码      │
└──────────────┘
   - 终端操作
   - 文件编辑
   - Claude Code 对话
```

**关键时间节点**:
- 注册到登录: <1秒
- 支付成功到VibeBox就绪: 2-5分钟（取决于资源池策略）
- VibeBox就绪到客户端连接: <5秒

### 5.2 VibeBox生命周期状态机

```
        ┌──────────────────────────────────┐
        │        [创建订阅]                  │
        └────────────┬─────────────────────┘
                     ▼
            ┌────────────────┐
            │  provisioning   │ ← 从资源池分配或创建新实例
            └───────┬─────────┘
                    │ SSH配置完成
                    ▼
            ┌────────────────┐
            │  configuring    │ ← 安装Happy环境、写入凭证
            └───────┬─────────┘
                    │ Happy守护进程启动
                    ▼
            ┌────────────────┐
       ┌───→│    running      │◄──┐
       │    └───────┬─────────┘   │
       │            │              │
       │  [启动]    │  [停止]      │  [重启]
       │            ▼              │
       │    ┌────────────────┐    │
       └────┤    stopped      ├────┘
            └───────┬─────────┘
                    │ [订阅过期/取消]
                    ▼
            ┌────────────────┐
            │   terminated    │
            └────────────────┘
                    │
                    ▼
            [释放资源/归还池]

        [任何状态出错]
                │
                ▼
        ┌────────────────┐
        │     error       │ → 人工介入/自动重试
        └────────────────┘
```

**状态说明**:
- **provisioning**: 正在从资源池分配或创建新服务器
- **configuring**: 正在配置Happy环境（SSH automation）
- **running**: VibeBox正常运行，用户可连接使用
- **stopped**: 已停止，可重新启动（保留数据）
- **terminated**: 已终止，资源已释放
- **error**: 配置或运行出错，需要处理

**状态转换触发**:
- 用户操作: 启动/停止/重启按钮
- 系统事件: 订阅过期、配置失败
- 自动化: 资源回收、健康检查失败

### 5.3 支付到配置流程（详细时序）

```
用户客户端          VibeBox后端         支付提供商       Happy Server      VibeBox服务器
    │                   │                   │                │                │
    │ 1. 选择计划        │                   │                │                │
    ├──────────────────>│                   │                │                │
    │                   │                   │                │                │
    │ 2. 创建订单请求    │                   │                │                │
    │   (planId, provider)                  │                │                │
    ├──────────────────>│                   │                │                │
    │                   │ 3. 调用Provider    │                │                │
    │                   ├──────────────────>│                │                │
    │                   │ 4. 返回支付信息    │                │                │
    │                   │   (QR码/URL)      │                │                │
    │   5. 返回支付信息  │<──────────────────┤                │                │
    │<──────────────────┤                   │                │                │
    │                   │                   │                │                │
    │ 6. 展示QR码/打开URL│                   │                │                │
    │ 7. 完成支付        │                   │                │                │
    ├───────────────────────────────────────>│                │                │
    │                   │                   │                │                │
    │                   │ 8. Webhook回调    │                │                │
    │                   │<──────────────────┤                │                │
    │                   │ 9. 验证签名        │                │                │
    │                   │10. 更新订阅状态    │                │                │
    │                   │                   │                │                │
    │                   │11. 触发VibeBox配置 │                │                │
    │                   │    [异步任务]      │                │                │
    │                   │                   │                │                │
    │                   │12. 生成密钥对      │                │                │
    │                   │13. 调用/v1/auth    │                │                │
    │                   ├────────────────────────────────────>│                │
    │                   │14. 返回token       │                │                │
    │                   │<────────────────────────────────────┤                │
    │                   │                   │                │                │
    │                   │15. SSH连接         │                │                │
    │                   ├────────────────────────────────────────────────────>│
    │                   │16. 写入配置文件    │                │                │
    │                   │    ~/.happy/access.key              │                │
    │                   │17. 启动happy daemon│                │                │
    │                   │<────────────────────────────────────────────────────┤
    │                   │                   │                │                │
    │                   │18. 更新VibeBox状态 │                │                │
    │                   │    (running)      │                │                │
    │                   │                   │                │                │
    │ 19. 轮询状态       │                   │                │                │
    ├──────────────────>│                   │                │                │
    │ 20. 返回就绪       │                   │                │                │
    │<──────────────────┤                   │                │                │
    │                   │                   │                │                │
    │ 21. 获取连接信息   │                   │                │                │
    ├──────────────────>│                   │                │                │
    │ 22. 返回token/secret                  │                │                │
    │<──────────────────┤                   │                │                │
    │                   │                   │                │                │
    │ 23. WebSocket连接  │                   │                │                │
    ├────────────────────────────────────────────────────────>│                │
    │ 24. 认证并关联machine                 │                │<───────────────┤
    │<────────────────────────────────────────────────────────┤                │
    │                   │                   │                │                │
    │ 25. 开始使用       │                   │                │                │
```

**关键步骤说明**:

1. **支付阶段** (步骤1-7):
   - 用户选择计划，后端创建支付订单
   - 返回支付方式相关信息（微信QR码/Stripe URL）
   - 用户完成支付

2. **Webhook处理** (步骤8-10):
   - 支付提供商异步回调
   - 验证签名确保安全性
   - 更新订阅状态为active

3. **VibeBox配置** (步骤11-18):
   - 异步任务队列处理（避免阻塞webhook响应）
   - 创建Happy账户（密钥对生成 + /v1/auth调用）
   - SSH自动化配置VibeBox服务器
   - 启动Happy守护进程

4. **客户端连接** (步骤19-25):
   - 客户端轮询VibeBox状态直到就绪
   - 获取token/secret连接信息
   - 直接WebSocket连接Happy Server
   - 开始编码

**时间估算**:
- 支付确认: 实时 - 30秒
- Webhook回调: <10秒
- VibeBox配置: 1-3分钟（首次）/ <30秒（资源池）
- 客户端连接: <5秒

---

## 6. Integration Details

### 6.1 Happy Server Integration

**Based on**: [Zero Modification Solution](../implementation/zero-modification-solution.md)

#### 集成架构图

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ VibeBox后端   │         │ Happy Server │         │VibeBox服务器 │
│              │         │   (官方)      │         │              │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. 创建账户             │                        │
       ├───────────────────────>│                        │
       │   POST /v1/auth        │                        │
       │   {publicKey,          │                        │
       │    challenge,          │                        │
       │    signature}          │                        │
       │                        │                        │
       │ 2. 返回token           │                        │
       │<───────────────────────┤                        │
       │                        │                        │
       │ 3. 存储到数据库         │                        │
       │   HappyAccount表       │                        │
       │   {token, secret}      │                        │
       │                        │                        │
       │ 4. SSH连接配置          │                        │
       ├────────────────────────────────────────────────>│
       │                        │                        │
       │ 5. 写入配置文件         │                        │
       │   ~/.happy/access.key  │                        │
       │                        │                        │
       │ 6. 启动守护进程         │                        │
       │   happy daemon start   │                        │
       │<────────────────────────────────────────────────┤
       │                        │                        │
       │ 7. VibeBox启动成功      │                        │
       │                        │<───────────────────────┤
       │                        │   机器自动注册          │
       │                        │   /v1/machines         │
       │                        │                        │
```

#### 关键流程说明

**步骤1：Happy账户创建（发生在支付成功后）**

目的：为用户创建Happy平台账户，用于后续连接认证

- 后端生成Ed25519密钥对（32字节随机secret）
- 使用密钥对生成签名
- 调用Happy Server的 `/v1/auth` API进行挑战-签名认证
- 获得Happy平台的认证token
- 将token和secret存储到数据库 `HappyAccount` 表
- **关键**: 一个VibeBox平台用户 对应 一个Happy账户（1:1映射）

**步骤2：VibeBox服务器自动配置（SSH automation）**

目的：在用户的VibeBox服务器上配置Happy环境

- 使用SSH连接到VibeBox服务器（root权限）
- 创建Happy配置目录 `~/.happy/`
- 写入访问凭证文件 `access.key`，包含：
  - `token`: Happy Server认证token
  - `secret`: Base64编码的密钥
- 设置文件权限为600（仅所有者可读写）
- 启动Happy守护进程 `happy daemon start`
- 守护进程自动向Happy Server注册机器

**步骤3：客户端连接（直接WebSocket）**

目的：VibeBox客户端通过Happy Server连接到用户的VibeBox

- 客户端从后端API获取连接信息（token/secret）
- 使用happy-client内置的连接逻辑
- 直接通过WebSocket连接到Happy Server (`wss://api.happy.dev`)
- Happy Server根据token识别用户，关联到已注册的VibeBox机器
- 建立端到端加密通道
- 客户端可以执行终端命令、文件操作、Claude Code对话

#### 安全考虑

**密钥管理**:
- Happy secret存储时经过加密（AES-256）
- 数据库中的secret字段为加密后的值
- 传输过程使用HTTPS/TLS加密

**SSH自动化安全**:
- SSH连接使用临时会话
- 配置完成后立即断开SSH连接
- VibeBox root密码加密存储
- 考虑使用SSH密钥替代密码（未来优化）

**Token安全**:
- token由Happy Server生成，不可预测
- token与用户账户绑定，无法跨用户使用
- 客户端存储token时使用secure storage

#### 零修改原则实现

**使用官方API**:
- `/v1/auth` - 标准的挑战-签名认证
- `/v1/machines` - 机器自动注册
- WebSocket - 标准连接协议

**不做的事**:
- ❌ 不修改Happy Server源码
- ❌ 不fork Happy项目
- ❌ 不依赖Happy非公开API
- ✅ 完全基于官方文档的公开API

**Architecture Notes**:

VibeBox client is **not a wrapper or shell** - it's a direct fork and customization of happy-client. This means:

✅ **Full Feature Inheritance**:
- Complete terminal emulator (from happy-client)
- Code editor with syntax highlighting (from happy-client)
- Claude Code integration (from happy-client)
- Real-time sync and encryption (from happy-client)
- File system operations (from happy-client)

✅ **Added Commercial Features**:
- Subscription management UI
- Payment flow integration
- VibeBox instance management
- Platform account system

✅ **Single Unified Client**:
- Users never leave the VibeBox app
- No WebView embedding or external web pages
- Native mobile experience throughout
- Direct WebSocket connection to Happy Server

❌ **What We Don't Do**:
- ~~Embed Happy's web interface (web.happy.dev)~~
- ~~Generate web URLs for user access~~
- ~~Deep linking to external apps~~
- ~~OAuth redirects to Happy's authentication~~

The client connects directly to Happy Server using the same protocol as happy-cli and happy-web, but with a native mobile UI instead of a web interface.

---

### 6.2 Payment Integration

**Architecture Design**: 插件化支付提供商系统，支持多市场多支付方式

#### 架构设计图

```
┌─────────────────────────────────────────────────────────┐
│                  PaymentService                         │
│              (统一支付服务协调层)                         │
│                                                         │
│  - createOrder(provider, params)                        │
│  - handleCallback(provider, request)                    │
│  - queryOrderStatus(orderId)                            │
│                                                         │
└────────────┬───────────┬────────────┬──────────────────┘
             │           │            │
             ▼           ▼            ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  WeChat    │ │  Stripe    │ │  Alipay    │
    │  Provider  │ │  Provider  │ │  Provider  │
    └────────────┘ └────────────┘ └────────────┘
         │              │              │
         │              │              │
         ▼              ▼              ▼
    微信支付API    Stripe API     支付宝API
    - QR码支付    - Checkout     - QR码支付
    - APP支付     - Webhook      - APP支付
```

#### 设计要求

**多市场支持**:
- **中国市场**：微信支付（主）、支付宝（辅）
  - 支付方式：QR码扫码、APP内支付
  - 货币：人民币（CNY）
  - 合规：符合中国支付监管要求

- **国际市场**：Stripe（主）
  - 支付方式：信用卡、借记卡
  - 货币：美元（USD）、欧元（EUR）等
  - 合规：PCI-DSS认证

**插件化架构**:
- 每个支付提供商实现统一接口
- 核心能力：
  - **创建订单**：根据计划和用户创建支付订单
  - **处理回调**：接收支付成功通知（Webhook）
  - **查询状态**：主动查询订单支付状态
  - **取消退款**：处理订单取消和退款请求

- 提供商特定细节封装在各自实现中
- 添加新支付方式无需修改核心逻辑

#### 支付流程架构

```
┌───────────┐
│用户选择计划│
└─────┬─────┘
      │
      ▼
┌──────────────────┐
│后端创建支付订单   │ ← PaymentService.createOrder()
└─────┬────────────┘
      │ 调用对应Provider
      ▼
┌──────────────────┐
│返回支付信息       │
│ - QR码URL (微信) │
│ - Checkout URL   │
│   (Stripe)       │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│用户完成支付       │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│支付提供商Webhook  │ ← 异步回调后端
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│验证签名           │ ← Provider.handleCallback()
│解析支付结果       │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│更新订阅状态       │ ← status = 'active'
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│触发VibeBox配置    │ ← 异步任务队列
└──────────────────┘
```

#### 关键技术要求

**安全性**:
- Webhook签名验证（防伪造回调）
- HTTPS传输加密
- 订单幂等性处理（防重复处理）
- 支付金额校验（防篡改）

**可靠性**:
- Webhook重试机制（支付提供商侧）
- 订单状态主动查询（补偿机制）
- 异步任务队列（解耦支付和配置）
- 失败告警和人工介入

**多提供商差异处理**:
- **微信支付**: 返回QR码URL，用户扫码支付
- **Stripe**: 返回Checkout页面URL，跳转支付
- **支付宝**: 返回QR码URL或调起APP支付

统一接口屏蔽差异，客户端根据返回类型展示不同UI

#### 支付提供商能力映射

| 能力 | 微信支付 | Stripe | 支付宝 |
|------|---------|--------|--------|
| QR码支付 | ✅ | ❌ | ✅ |
| 网页跳转 | ❌ | ✅ | ✅ |
| APP内支付 | ✅ | ✅ | ✅ |
| 订阅模式 | ❌ (手动) | ✅ | ❌ (手动) |
| Webhook回调 | ✅ | ✅ | ✅ |
| 签名验证 | ✅ | ✅ | ✅ |

**Note**: 中国市场暂不支持自动订阅续费，需要每月手动支付（支付监管限制）

#### 设计优势

- ✅ **多市场支持**：中国市场（微信/支付宝），国际市场（Stripe）
- ✅ **易于扩展**：添加新支付方式无需修改核心逻辑
- ✅ **统一处理**：Webhook回调标准化处理
- ✅ **封装细节**：支付提供商特定逻辑封装在各自实现中
- ✅ **灵活切换**：可根据用户地区自动选择支付方式

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

## 附录A: API端点参考

> 本节提供简化的API端点列表供快速参考。详细的接口设计应在后续的"API规范文档"中定义。

### 认证相关

| 端点 | 方法 | 用途 | 说明 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 创建新用户账户 |
| `/api/auth/login` | POST | 用户登录 | 返回session token |
| `/api/auth/logout` | POST | 用户登出 | 清除session |
| `/api/auth/session` | GET | 获取当前session | 检查登录状态 |

### 订阅相关

| 端点 | 方法 | 用途 | 说明 |
|------|------|------|------|
| `/api/subscriptions/plans` | GET | 获取订阅计划 | 返回所有可用计划 |
| `/api/subscriptions/checkout` | POST | 创建支付订单 | 返回支付信息（URL/QR码） |
| `/api/subscriptions/webhook/:provider` | POST | 支付回调 | 接收支付成功通知 |

### VibeBox管理

| 端点 | 方法 | 用途 | 说明 |
|------|------|------|------|
| `/api/vibeboxes` | GET | 获取VibeBox列表 | 返回用户的所有VibeBox |
| `/api/vibeboxes/:id` | GET | 获取VibeBox详情 | 包含连接信息（token/secret） |
| `/api/vibeboxes/:id/control` | POST | 控制VibeBox | 启动/停止/重启操作 |

### 内部API（系统内部调用）

| 端点 | 方法 | 用途 | 说明 |
|------|------|------|------|
| `/api/admin/provision` | POST | 配置VibeBox | 支付成功后触发 |

**Note**:
- 所有API（除auth相关）需要认证（Bearer token或Session cookie）
- 详细的Request/Response格式应在API规范文档中定义
- 本表仅供架构层面快速参考

---

**Document History**:
- 2025-10-22: Initial draft created
- 2025-10-22: Removed implementation phases, focused on architecture
- 2025-10-22: **Major correction** - Removed WebView embedding misconception, clarified that VibeBox client is a direct fork of happy-client (not a wrapper/shell)
- 2025-10-22: **Major refactor** - Changed from code-focused to architecture-focused style: replaced API definitions and code samples with flowcharts, sequence diagrams, and architectural descriptions
