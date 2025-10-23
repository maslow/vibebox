# VibeBox 系统架构

**版本**: 1.1
**日期**: 2025-10-23
**状态**: 草稿
**作者**: Fugen, Claude

---

## 1. 系统概述

### 1.1 愿景

VibeBox 是一个**移动优先**的 AI 编码平台，提供基于订阅的编码环境（VibeBox 实例），配备原生移动应用和网页访问。用户可以在任何地点、任何时间使用 AI 辅助编码，无需复杂配置。

### 1.2 核心价值主张

- **移动优先体验**: 针对移动编码场景优化的原生 iOS/Android 应用
- **零配置**: 预配置 Claude Code、Happy CLI 和开发工具
- **无缝访问**: 跨所有平台的单一统一客户端
- **订阅制**: 月付/年付订阅，包含 Claude API 配额

### 1.3 核心架构原则

基于 [CLAUDE.md](../../CLAUDE.md) 和 [ADR 001](../decisions/001-client-technology-stack.md)：

- **零修改 > 自定义方案**: 使用 Happy Server 原生 API，不做修改
- **体验 > 纯粹性**: 前后端分离是合理的架构
- **控制权 > 依赖**: 为商业需求提供深度定制能力
- **移动优先**: React Native 客户端为主要平台，Web 为辅助
- **简单 > 功能**: 从简单认证开始，逐步演进

**零修改原则的具体范围**:

VibeBox 项目遵循"零修改"原则，但仅针对核心 Happy 基础设施：

✅ **不修改的组件** (Zero Modification):
- `happy-server`: 完全使用官方版本，不 fork，不修改源码
- `happy-cli`: 完全使用官方版本，通过配置文件集成
- Happy 协议和 API: 仅使用官方公开的 API（`/v1/auth`, `/v1/machines`, WebSocket）

⚠️ **需要定制的组件** (Reasonable Customization):
- `happy-client`: Fork 并定制，添加 VibeBox 商业功能
  - 原因: 需要集成订阅管理、支付流程、VibeBox 实例管理等商业功能
  - 策略: 保留所有核心功能（终端、编辑器、Claude Code 集成、加密、同步），仅添加平台特定 UI 和业务逻辑
--  - 维护: 定期合并上游更新，最小化定制范围

这种分离符合 CLAUDE.md 的核心理念：
- **零修改**: 不改变 Happy 基础设施和协议
- **控制权 > 依赖**: 对客户端体验有完全控制权
- **体验 > 纯粹性**: 为用户提供商业级体验比保持纯粹的开源使用更重要

-

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户设备                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  iOS 原生应用   │  │ Android 原生   │  │   Web 浏览器      │  │
│  │  (React Native)│  │ (React Native) │  │  (react-native-  │  │
│  │                │  │                │  │   web)           │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS/WebSocket
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                    VibeBox 后端                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 (App Router)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │ │
│  │  │  认证 API     │  │  订阅管理     │  │  VibeBox       │ │ │
│  │  │  路由        │  │  API 路由     │  │  管理 API      │ │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │         Happy 集成服务                               │ │ │
│  │  │  - 账户创建 (通过 /v1/auth)                          │ │ │
│  │  │  - SSH 自动化 (VibeBox 配置)                        │ │ │
│  │  │  - 连接信息管理                                      │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
┌───────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  PostgreSQL       │ │ Happy Server │ │  外部服务        │
│  数据库            │ │ (官方)       │ │  - 支付服务      │
│  - 用户           │ │ - /v1/auth   │ │    (微信/        │
│  - 订阅           │ │ - /v1/machines│ │     Stripe)     │
│  - VibeBoxes      │ │ - WebSocket  │ │  - 邮件服务      │
│  - Happy 映射     │ │              │ │                 │
└───────────────────┘ └──────────────┘ └─────────────────┘
                              │
                              │ SSH 自动化
                              ▼
                    ┌──────────────────┐
                    │  VibeBox 资源池   │
                    │  (云服务器)       │
                    │  - 预装环境       │
                    │  - Happy 守护进程 │
                    │  - Claude Code   │
                    └──────────────────┘
```

---

## 3. 组件架构

### 3.1 前端（客户端）

**技术栈**: Expo SDK 54 + React Native 0.81 + React Native Web

**目录结构**:
```
client/sources/
├── app/                          # Expo Router (基于文件的路由)
│   ├── (auth)/                  # 认证流程
│   │   ├── login.tsx            # 登录页面
│   │   ├── register.tsx         # 注册页面
│   │   └── _layout.tsx          # 认证布局
│   ├── (app)/                   # 主应用（受保护）
│   │   ├── index.tsx            # 控制台/VibeBox 列表
│   │   ├── vibeboxes/           # VibeBox 管理
│   │   │   ├── [id].tsx         # VibeBox 详情
│   │   │   └── connect.tsx      # 连接到 Happy
│   │   ├── subscriptions/       # 订阅管理
│   │   │   ├── plans.tsx        # 计划选择
│   │   │   └── checkout.tsx     # 支付流程
│   │   └── _layout.tsx          # 应用布局（带导航）
│   └── _layout.tsx              # 根布局
├── components/
│   ├── auth/                    # 认证组件
│   ├── vibebox/                 # VibeBox 组件
│   │   ├── VibeBoxCard.tsx      # 实例卡片
│   │   ├── ConnectButton.tsx    # 连接到 Happy 按钮
│   │   └── StatusIndicator.tsx  # 状态显示
│   └── subscription/            # 订阅组件
├── services/
│   ├── api.ts                   # API 客户端
│   ├── auth.ts                  # 认证服务
│   └── vibebox.ts               # VibeBox 服务
└── store/                       # 状态管理 (Zustand/Redux)
    ├── authStore.ts
    └── vibeboxStore.ts
```

**关键设计决策**:
- **基于 happy-client**: 直接 fork 和定制，继承所有核心功能（终端、编辑器、Claude Code 集成、加密、同步）
- 使用 Expo Router 实现基于文件的路由（类似 Next.js）
- 简单的状态管理（Zustand 或 Context API）
- 通过集中式服务层调用 VibeBox 平台功能的 API
- 使用 token/secret 认证直接 WebSocket 连接到 Happy Server

### 3.2 后端（服务器）

**技术栈**: Next.js 15 + TypeScript + PostgreSQL

**目录结构**:
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
│   │   │   └── webhook/route.ts        # POST /api/subscriptions/webhook (支付回调)
│   │   ├── vibeboxes/
│   │   │   ├── route.ts                # GET /api/vibeboxes (列表)
│   │   │   ├── [id]/route.ts           # GET /api/vibeboxes/:id
│   │   │   ├── [id]/connect/route.ts   # POST /api/vibeboxes/:id/connect
│   │   │   └── [id]/control/route.ts   # POST /api/vibeboxes/:id/control (启动/停止)
│   │   └── admin/
│   │       └── provision/route.ts      # POST /api/admin/provision (内部)
│   └── layout.tsx
├── lib/
│   ├── auth.ts                         # 会话管理
│   ├── db.ts                           # 数据库客户端 (Prisma/Drizzle)
│   ├── payment/                        # 支付集成
│   │   ├── types.ts                    # PaymentProvider 接口
│   │   ├── paymentService.ts           # 主支付服务
│   │   └── providers/                  # 提供商实现
│   │       ├── wechatPayProvider.ts    # 微信支付
│   │       ├── stripeProvider.ts       # Stripe
│   │       └── alipayProvider.ts       # 支付宝
│   └── happy/
│       ├── integration.ts              # HappyIntegration 类
│       ├── ssh.ts                      # SSH 自动化
│       └── types.ts                    # Happy 相关类型
├── services/
│   ├── authService.ts                  # 认证业务逻辑
│   ├── subscriptionService.ts          # 订阅逻辑
│   ├── vibeboxService.ts               # VibeBox 配置
│   └── happyService.ts                 # Happy 集成
├── middleware.ts                        # 认证中间件
└── prisma/                             # 数据库模式
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

### 3.3 外部服务集成

#### 3.3.1 Happy Server（官方）

**集成端点**:
- `/v1/auth` - 账户创建（挑战-签名认证）
- `/v1/machines` - 机器注册（自动）
- WebSocket - 实时通信（未来）

**集成策略**: 零修改
- 使用官方 Happy Server API
- 不 fork，不修改
- 在 VibeBox 数据库中映射账户

#### 3.3.2 支付服务

**架构**: 插件化支付提供商系统（详见第 6.2 节）

**支持的提供商**:
- **微信支付** - 中国市场主要方式（QR 码、原生 APP）
- **Stripe** - 国际市场主要方式（Checkout Session）
- **支付宝** - 中国市场辅助方式

**通用集成端点**:
- 订单创建 - 启动支付流程
- 回调/Webhook - 支付成功通知
- 订单状态查询 - 检查支付状态
- 订单取消 - 处理退款

**关键 Webhook 事件**（跨提供商标准化）:
- 支付成功 - 触发 VibeBox 配置
- 订阅续费 - 延长订阅周期
- 订阅取消 - 处理取消

#### 3.3.3 邮件服务

**使用场景**:
- 支持渠道 (support@vibebox.com)
- 手动订阅取消（MVP）
- 未来: 引导流程、通知

---

## 4. 数据模型

### 4.1 数据库模式

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

### 4.2 实体关系

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

## 6. 集成详情

### 6.1 Happy Server 集成

**基于**: [零修改方案](../implementation/zero-modification-solution.md)

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

**Token 有效期策略**：
- ✅ **永久有效**：Happy Server 使用 `PersistentToken`（持久化令牌），无过期时间
- ✅ **无需刷新**：一次性创建，长期使用
- ✅ **简化架构**：无需实现 token 刷新机制和过期检测
- ⚠️ **撤销机制**：如果需要撤销用户访问权限，可调用 Happy Server 的 `invalidateUserTokens` API（例如：用户主动注销、安全事件响应）

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

**零修改范围** (与 Section 1.3 一致):

本方案严格遵循零修改原则，仅针对 Happy 核心基础设施：

✅ **完全不修改的组件**:
- `happy-server`: 使用官方版本和 Docker 镜像
- `happy-cli`: 使用官方 npm 包
- Happy 协议: 仅使用官方公开 API

**使用的官方API**:
- `/v1/auth` - 标准的挑战-签名认证，自动创建账户
- `/v1/machines` - 机器自动注册
- WebSocket - 标准连接协议，端到端加密

**我们不做的事（Zero Modification）**:
- ❌ 不修改 happy-server 源码或数据库 schema
- ❌ 不 fork happy-server 或 happy-cli 项目
- ❌ 不依赖 Happy 非公开 API 或内部实现细节
- ❌ 不修改 Happy 协议或通信格式
- ✅ 完全基于官方文档的公开 API 和标准配置

**客户端定制说明**:

VibeBox 客户端是 happy-client 的**直接 fork 和合理定制**（非包装器或外壳）。这种定制是合理的，因为：

1. **符合"控制权 > 依赖"原则**: 商业产品需要对用户体验有完全控制权
2. **符合"体验 > 纯粹性"原则**: 为用户提供商业级体验比保持纯粹的开源使用更重要
3. **不违反零修改原则**: 零修改仅适用于 Happy 基础设施（server/cli），不包括客户端 UI

✅ **完整功能继承**:
- 完整的终端模拟器（来自 happy-client）
- 带语法高亮的代码编辑器（来自 happy-client）
- Claude Code 集成（来自 happy-client）
- 实时同步和加密（来自 happy-client）
- 文件系统操作（来自 happy-client）

✅ **新增商业功能**:
- 订阅管理 UI（Logto 集成）
- 支付流程集成（多支付提供商）
- VibeBox 实例管理（启动/停止/重启）
- 平台账户系统（用户 Dashboard）

✅ **单一统一客户端**:
- 用户不会离开 VibeBox 应用
- 无 WebView 嵌入或外部网页
- 全程原生移动体验
- 直接 WebSocket 连接到 Happy Server（与 happy-cli 相同协议）

❌ **我们不做的事**:
- ~~嵌入 Happy 的 web 界面 (web.happy.dev)~~
- ~~生成 web URL 供用户访问~~
- ~~深度链接到外部应用~~
- ~~OAuth 重定向到 Happy 的认证~~

**技术实现**:
客户端使用与 happy-cli 和 happy-web 相同的协议直接连接到 Happy Server，使用从 VibeBox 后端获取的 token/secret 进行认证，但提供原生移动 UI 而非 web 界面。

---

### 6.2 支付集成

**架构设计**: 插件化支付提供商系统，支持多市场多支付方式

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

## 7. 安全考虑

### 7.1 认证（基于 Logto）

**策略**: 基于 Logto 的 OIDC/OAuth 2.0 标准认证

**架构**:
```
客户端（Expo/React Native） ─────┐
                              │ OIDC/OAuth 2.0
                              ▼
                        Logto Service
                              │
                              ▼
                    VibeBox 后端（Next.js）
                              │
                              ▼
                    Happy Server 集成
```

**核心特性**:
- **标准协议**: OIDC/OAuth 2.0，避免供应商锁定
- **移动优先**: 原生 Expo SDK (`@logto/rn`)，非 WebView
- **安全存储**: expo-secure-store 存储 token
- **社交登录**: Google, Apple, GitHub 等
- **企业级功能**: RBAC, MFA, 多租户支持
- **订阅映射**: Logto 角色映射到订阅等级（free/pro/enterprise）

**实现细节**:
- Token 验证: JWT 验证，使用 Logto JWKS endpoint
- 会话管理: JWT access token + refresh token
- Token 过期: Access token 1小时，refresh token 14天
- CSRF 保护: Next.js 内置 + OIDC state parameter
- RBAC 角色:
  - `free`: 基础订阅用户
  - `pro`: 专业订阅用户
  - `enterprise`: 企业订阅用户
  - `admin`: 平台管理员

**与 Happy Server 集成**:
- VibeBox 平台用户（Logto ID）→ Happy 账户映射存储在数据库
- 用户订阅时，后端自动创建 Happy 账户（调用 `/v1/auth`）
- 客户端使用 Happy credentials 直接连接 Happy Server

**参考文档**: 详见 [ADR 002: Authentication Solution](../decisions/002-authentication-solution.md)

### 7.2 API 安全

- 所有 API 路由由中间件保护
- 限流: 每 IP 100 次请求/分钟
- 输入验证: Zod schemas
- SQL 注入防护: 参数化查询 (Prisma)

### 7.3 密钥管理

**敏感数据**:
- 用户密码: bcrypt hash
- Root 密码: AES-256 加密
- Happy secrets: 静态加密
- 支付提供商 API 密钥: 环境变量

**环境变量**:
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

## 8. 技术决策总结

| 决策 | 选择 | 理由 |
|----------|--------|-----------|
| **客户端框架** | Expo + React Native | 移动优先，跨平台，已验证 ([ADR 001](../decisions/001-client-technology-stack.md)) |
| **后端框架** | Next.js 15 | API Routes，TypeScript，React 生态 |
| **数据库** | PostgreSQL | 可靠，成熟，良好的 Prisma 支持 |
| **认证 (MVP)** | 用户名 + 密码 | 简单，快速实现，可后续迁移到 Logto |
| **Happy 集成** | 零修改 | 使用官方 API，无需 fork |
| **支付** | 插件化 (微信/Stripe/支付宝) | 多市场支持，中国优先（微信），国际后续（Stripe） |
| **部署** | TBD | Docker + 云服务商 (AWS/GCP/DigitalOcean) |

---

## 9. 架构考虑

### 9.1 VibeBox 资源池管理

**托管选项**:
- 云服务商: AWS EC2, DigitalOcean, Vultr, Linode, 腾讯云, 阿里云
- 考虑因素: 成本、延迟、区域可用性

**资源池管理策略**:
- **预配置资源池**: 保持 N 个就绪实例，配置更快但成本更高
- **按需配置**: 支付成功后创建，较慢但成本效益高
- **混合方案**: 小型热池 + 按需扩展

**架构影响**:
- 数据库需要跟踪资源池库存
- 后台任务进行资源池监控和健康检查
- 基于需求的自动扩展

### 9.2 多区域和市场支持

**区域部署**:
- **中国市场**: 部署在阿里云/腾讯云以获得更好的访问
  - 考虑 Happy Server 延迟和可访问性
  - 可能需要自托管 Happy Server 镜像
- **国际市场**: AWS / GCP / DigitalOcean
  - 分布式部署实现全球低延迟访问

**数据主权**:
- 用户数据存储在其注册的区域
- 跨区域复制考虑
- 遵守当地法规

### 9.3 可扩展性设计

**数据库扩展**:
- 连接池 (PgBouncer)
- 用于报告和分析的只读副本
- 大表的分区策略（订阅、vibeboxes）

**Happy Server 可扩展性**:
- 官方 Happy Server 容量限制
- 可能需要多个 Happy Server 实例
- Happy 账户的负载均衡策略

**VibeBox 资源限制**:
- 每用户资源配额
- 公平调度和资源分配
- 溢出处理策略

### 9.4 监控和可观测性

**关键指标**:
- 系统健康: API 延迟、错误率、数据库性能
- 业务指标: 活跃订阅、VibeBox 利用率、API 配额使用
- 用户体验: 客户端应用性能、连接成功率

**工具考虑**:
- 错误跟踪: Sentry, Bugsnag 或类似工具
- 日志: 结构化日志 (JSON)，集中聚合
- 指标: Prometheus + Grafana，或云服务商方案
- 告警: 关键故障、支付问题、资源耗尽

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

**注意**:
- 所有API（除auth相关）需要认证（Bearer token或Session cookie）
- 详细的Request/Response格式应在后续的"API规范文档"中定义
- 本表仅供架构层面快速参考

---

**文档历史**:
- 2025-10-22: 初始草稿创建
- 2025-10-22: 移除实施阶段，专注架构
- 2025-10-22: **重大修正** - 移除 WebView 嵌入的误解，澄清 VibeBox 客户端是 happy-client 的直接 fork（非包装器/外壳）
- 2025-10-22: **重大重构** - 从代码导向改为架构导向风格：用流程图、时序图和架构描述替代 API 定义和代码示例
- 2025-10-22: **语言统一** - 将文档从中英混杂统一为中文
- 2025-10-23: **P0 修复** (v1.1) - 更新认证方案为 Logto（与 ADR 002 一致，已集成），澄清零修改原则的具体范围（仅适用于 happy-server/cli，不包括客户端定制）
