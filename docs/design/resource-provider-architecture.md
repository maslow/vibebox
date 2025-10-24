# VibeBox 资源管理架构设计

**版本**: 1.0
**日期**: 2025-10-23
**状态**: 设计中
**作者**: Fugen, Claude

**Tags:** #design:architecture #component:provider #feature:multi-cloud #feature:resource-management #principle:abstraction #principle:extensibility

---

## 目录

1. [设计目标](#设计目标)
2. [核心理念](#核心理念)
3. [架构概览](#架构概览)
4. [接口设计](#接口设计)
5. [工厂模式](#工厂模式)
6. [资源生命周期](#资源生命周期)
7. [移动云实现](#移动云实现)
8. [扩展性设计](#扩展性设计)
9. [监控与容错](#监控与容错)
10. [成本优化](#成本优化)
11. [安全考虑](#安全考虑)
12. [实施路径](#实施路径)

---

## 设计目标

### 业务目标

- ✅ **支持多云厂商** - 初期支持移动云，后续扩展阿里云、腾讯云、Docker等
- ✅ **灵活切换** - 根据成本、地域、性能自动选择最优Provider
- ✅ **统一管理** - 对上层业务提供统一的资源操作接口
- ✅ **易于扩展** - 新增厂商只需实现标准接口

### 技术目标

- ✅ **解耦** - 业务逻辑与底层云厂商解耦
- ✅ **可测试** - 每个Provider可独立测试和Mock
- ✅ **可靠性** - 故障自动重试和降级
- ✅ **可观测** - 完整的日志和监控

---

## 核心理念

### 统一抽象层

**理念**：无论底层是虚拟机（VM）还是容器（Container），无论是移动云、阿里云还是Docker，对业务层来说都是"可以创建、启动、停止、删除的计算资源"。

```
业务层视角:
"我要一台 2C4G 的服务器"

Provider层负责:
- 移动云: 翻译成移动云ECS的规格
- 阿里云: 翻译成 ecs.t5-c1m2.large
- Docker: 翻译成 Memory=4GB, NanoCpus=2
```

### 不区分资源类型

**决策**：不区分VM和Container，它们都是Provider的不同实现

**理由**：
- 对业务逻辑无差异
- 简化架构复杂度
- 更易扩展

---

## 架构概览

### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    业务层（VibeBox Service）              │
│  职责:                                                    │
│  - 处理用户订阅请求                                        │
│  - 选择合适的 Provider                                    │
│  - 调用 Provider 创建/管理资源                            │
│  - 配置 Happy 环境                                        │
└──────────────────────┬──────────────────────────────────┘
                       │ 统一接口调用
┌──────────────────────▼──────────────────────────────────┐
│              Provider 抽象层（Factory + Base）             │
│  职责:                                                    │
│  - 定义统一的资源操作接口（IResourceProvider）             │
│  - 提供基础实现（BaseProvider）                           │
│  - Provider 工厂模式（ProviderFactory）                   │
│  - 配置管理与注册机制                                      │
└──────────────────────┬──────────────────────────────────┘
                       │ 多实现
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  移动云       │ │  阿里云       │ │  腾讯云       │ │  Docker      │
│  Provider    │ │  Provider    │ │  Provider    │ │  Provider    │
│              │ │              │ │              │ │              │
│  - 实现接口   │ │  - 实现接口   │ │  - 实现接口   │ │  - 实现接口   │
│  - 调用SDK    │ │  - 调用SDK    │ │  - 调用SDK    │ │  - 调用SDK    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  移动云       │ │  阿里云       │ │  腾讯云       │ │  Docker      │
│  ECS API     │ │  ECS API     │ │  CVM API     │ │  Engine API  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### 核心组件

| 组件 | 职责 | 文件位置 |
|------|------|---------|
| **IResourceProvider** | 接口定义 | `server/lib/providers/types.ts` |
| **BaseProvider** | 基础实现 | `server/lib/providers/baseProvider.ts` |
| **ProviderFactory** | 工厂模式 | `server/lib/providers/factory.ts` |
| **ChinaMobileProvider** | 移动云实现 | `server/lib/providers/chinamobile.ts` |
| **VibeBoxService** | 业务服务 | `server/services/vibeboxService.ts` |

---

## 接口设计

### 统一资源操作接口

所有 Provider 必须实现的操作：

| 操作 | 方法签名 | 说明 |
|------|---------|------|
| **初始化** | `initialize(config)` | 配置认证信息，连接API |
| **创建资源** | `createResource(spec) → ResourceInfo` | 创建新服务器 |
| **查询信息** | `getResourceInfo(id) → ResourceInfo` | 查询服务器详情 |
| **启动** | `startResource(id)` | 启动已停止的服务器 |
| **停止** | `stopResource(id)` | 停止运行中的服务器 |
| **重启** | `restartResource(id)` | 重启服务器 |
| **删除** | `deleteResource(id)` | 永久删除服务器 |
| **等待状态** | `waitForStatus(id, status)` | 轮询直到达到目标状态 |
| **健康检查** | `healthCheck() → boolean` | 检查 Provider 是否可用 |

### 数据结构

#### 1. Provider配置（ProviderConfig）

```
用途: 初始化 Provider

字段:
- type: 'chinamobile' | 'aliyun' | 'tencent' | 'docker' ...
- credentials:
    - accessKeyId: "AK..."
    - accessKeySecret: "SK..."
- region: "beijing" | "shanghai" ...（可选）
- options: 厂商特定配置（可选）
```

#### 2. 资源规格（ResourceSpec）

```
用途: 业务层指定资源需求

字段:
- cpu: 2          # CPU核数
- memory: 4       # 内存GB
- disk: 40        # 磁盘GB
- region: "beijing"  # 区域（可选）
- image: "ubuntu-22.04"  # 镜像（可选）
- tags: { project: "vibebox", env: "prod" }  # 标签（可选）
```

#### 3. 资源信息（ResourceInfo）

```
用途: Provider 返回的服务器信息

字段:
- id: "i-abc123xyz"       # 厂商的资源ID
- status: "running"       # 状态
- ipAddress: "1.2.3.4"    # 公网IP
- privateIp: "172.16.0.1" # 内网IP（可选）
- sshPort: 22             # SSH端口
- sshUser: "root"         # SSH用户名
- sshPassword: "Temp123!" # 临时密码（可选）
- sshKeyPath: "..."       # SSH密钥路径（可选）
- metadata: {...}         # 厂商特定元数据
- createdAt: Date         # 创建时间
```

#### 4. 资源状态（ResourceStatus）

```
枚举值:
- CREATING   # 创建中
- RUNNING    # 运行中
- STOPPED    # 已停止
- STARTING   # 启动中
- STOPPING   # 停止中
- DELETING   # 删除中
- DELETED    # 已删除
- ERROR      # 错误
```

---

## 工厂模式

### 设计理念

使用工厂模式动态创建 Provider 实例，支持运行时注册和选择。

### 工作流程

```
步骤1: 注册 Provider
  ProviderFactory.register('chinamobile', ChinaMobileProvider)

步骤2: 创建配置
  config = {
    type: 'chinamobile',
    credentials: { accessKeyId: '...', accessKeySecret: '...' },
    region: 'beijing'
  }

步骤3: 创建 Provider
  provider = await ProviderFactory.create(config)

步骤4: 使用 Provider
  resource = await provider.createResource({ cpu: 2, memory: 4, disk: 40 })
```

### 自动注册机制

```
在 server/lib/providers/factory.ts 启动时:

1. 扫描 providers 目录
2. 自动注册所有可用 Provider:
   - ChinaMobileProvider
   - AliyunProvider
   - TencentProvider
   - DockerProvider

3. 支持动态禁用（通过配置）:
   ENABLED_PROVIDERS=chinamobile,aliyun
```

### 选择策略

#### 策略1：手动指定

```
场景: 管理员创建 VibeBox 时明确指定

流程:
用户订阅 → 管理后台选择 "移动云" → 创建时传入 providerType='chinamobile'
```

#### 策略2：自动选择（推荐）

```
规则引擎:
IF 用户在中国 AND 需要低延迟:
  → 优先移动云/阿里云/腾讯云

IF 用户需要容器化:
  → 优先 Docker/Kubernetes

IF 成本最优:
  → 对比价格后选择最便宜的

IF 特定区域:
  → 选择该区域有节点的厂商
```

#### 策略3：混合模式

```
- 默认: 自动选择
- Pro/Enterprise 用户: 可手动指定
- 多活: 同时使用多个厂商
```

---

## 资源生命周期

### 完整流程

```
┌────────────┐
│ 用户订阅     │
└──────┬─────┘
       ↓
┌────────────┐
│ 创建资源     │ ← createResource()
│ 状态: CREATING
└──────┬─────┘
       ↓
┌────────────┐
│ 等待就绪     │ ← waitForStatus('RUNNING')
│ 轮询查询     │
└──────┬─────┘
       ↓
┌────────────┐
│ 运行中       │
│ 状态: RUNNING
└──────┬─────┘
       │
       ├─→ 用户操作: 停止 → stopResource() → STOPPED
       │   ├─→ 重新启动 → startResource() → RUNNING
       │   └─→ 长期不用 → deleteResource() → DELETED
       │
       ├─→ 用户操作: 重启 → restartResource()
       │   → STOPPING → STOPPED → STARTING → RUNNING
       │
       └─→ 订阅到期 → deleteResource() → DELETING → DELETED
```

### 状态转换规则

| 当前状态 | 允许操作 | 目标状态 |
|---------|---------|---------|
| CREATING | 等待 | RUNNING / ERROR |
| RUNNING | 停止、重启、删除 | STOPPING / DELETING |
| STOPPED | 启动、删除 | STARTING / DELETING |
| STARTING | 等待 | RUNNING / ERROR |
| STOPPING | 等待 | STOPPED / ERROR |
| DELETING | 等待 | DELETED |
| ERROR | 重试、删除 | (depends) |

### 超时与重试

```
创建资源:
- 超时: 10分钟
- 重试: 3次（间隔5秒）
- 失败策略: 标记为ERROR，通知用户

启动资源:
- 超时: 2分钟
- 重试: 2次（间隔3秒）
- 失败策略: 保持STOPPED状态

停止资源:
- 超时: 2分钟
- 强制停止: 超时后调用强制关机API
- 失败策略: 保持当前状态

删除资源:
- 超时: 5分钟
- 强制删除: 超时后调用强制删除API
- 失败策略: 标记为ERROR但继续尝试
```

---

## 移动云实现

### 移动云 Provider 特点

```
厂商: 中国移动
产品: 移动云 ECS（弹性云服务器）
文档: https://ecloud.10086.cn/op-help-center/api/outline/33181
特点:
- 国内主流云厂商之一
- 区域: 华北、华东、华南等
- 认证: AccessKey + 签名算法
```

### 实现清单

| 功能 | 移动云API | 映射 |
|------|-----------|------|
| 创建实例 | `CreateInstance` | createResource() |
| 查询实例 | `DescribeInstances` | getResourceInfo() |
| 启动实例 | `StartInstance` | startResource() |
| 停止实例 | `StopInstance` | stopResource() |
| 重启实例 | `RebootInstance` | restartResource() |
| 删除实例 | `DeleteInstance` | deleteResource() |
| 查询区域 | `DescribeRegions` | healthCheck() |

### 规格映射

```
通用规格 → 移动云实例规格

2C4G:
- cpu: 2, memory: 4
- → 移动云: "ecs.c6.large" 或类似规格

4C8G:
- cpu: 4, memory: 8
- → 移动云: "ecs.c6.xlarge" 或类似规格

策略:
1. 查询移动云可用规格列表
2. 根据 CPU/内存匹配最接近的规格
3. 考虑价格因素选择性价比最高的
```

### 状态映射

```
移动云状态 → 统一状态

"Pending" / "Starting" → CREATING / STARTING
"Running" → RUNNING
"Stopping" → STOPPING
"Stopped" → STOPPED
"Deleting" → DELETING
"Deleted" / "Released" → DELETED
"Error" / "Failed" → ERROR
```

### 认证机制

```
移动云使用 AccessKey + 签名算法:

1. 准备请求参数
   - AccessKeyId: "CMCC..."
   - Timestamp: "2025-10-23T10:30:00Z"
   - SignatureNonce: "uuid..."

2. 计算签名
   - 按规则拼接待签名字符串
   - 使用 HMAC-SHA256 计算签名
   - Base64 编码

3. 添加到请求头
   - Authorization: "CMCC-HMAC-SHA256 Credential=..., Signature=..."
```

**详细实现**: 见 `docs/implementation/china-mobile-cloud-provider.md`

---

## 扩展性设计

### 添加新 Provider 的步骤

```
步骤1: 创建 Provider 类
  文件: server/lib/providers/newprovider.ts
  继承: BaseProvider
  实现: 9个必需方法

步骤2: 注册到工厂
  在 factory.ts 中:
  ProviderFactory.register('newprovider', NewProvider)

步骤3: 添加配置
  在 config/providers.ts 中:
  newprovider: {
    enabled: true,
    credentials: { ... },
    region: ...
  }

步骤4: 测试
  编写单元测试
  编写集成测试

步骤5: 上线
  更新文档
  部署配置
  监控告警
```

### 支持的 Provider 列表

| Provider | 优先级 | 状态 | 预计时间 |
|----------|--------|------|---------|
| 移动云 ECS | P0 | 设计中 | 2周 |
| 阿里云 ECS | P1 | 待开始 | 1周 |
| 腾讯云 CVM | P1 | 待开始 | 1周 |
| Docker | P2 | 待开始 | 1周 |
| AWS EC2 | P3 | 待开始 | 2周 |
| Kubernetes | P3 | 待开始 | 2周 |

---

## 监控与容错

### 健康检查

```
目的: 确保 Provider 可用

机制:
- 每5分钟执行一次 healthCheck()
- 失败3次连续 → 标记为不可用
- 触发告警 → 通知运维
- 自动切换 → 新订阅使用备用 Provider

移动云健康检查:
调用 DescribeRegions API
- 成功: Provider 可用
- 失败: 网络问题或认证失败
```

### 故障恢复

#### 场景1：创建失败

```
问题: 移动云 ECS 库存不足

策略:
1. 重试3次（间隔5秒）
2. 仍失败 → 尝试其他区域
3. 所有区域都失败 → 切换到阿里云
4. 记录日志 → 后续分析

实现:
try {
  resource = await provider.createResource(spec)
} catch (error) {
  if (error.code === 'InsufficientStock') {
    // 切换 Provider
    provider = await ProviderFactory.create({ type: 'aliyun', ... })
    resource = await provider.createResource(spec)
  }
}
```

#### 场景2：操作超时

```
问题: 启动实例超过2分钟无响应

策略:
1. 查询当前状态
2. 如果状态异常 → 重试
3. 如果状态正常 → 继续等待
4. 超过最大超时 → 标记为ERROR
```

#### 场景3：API限流

```
问题: 移动云 API 限流（429错误）

策略:
1. 指数退避重试
   - 第1次: 等待 1秒
   - 第2次: 等待 2秒
   - 第3次: 等待 4秒
   - 第4次: 等待 8秒
2. 最多重试5次
3. 仍失败 → 记录错误
```

### 日志与追踪

```
日志级别:
- INFO: 正常操作（创建、启动、停止）
- WARN: 重试、降级
- ERROR: 失败、异常

日志格式:
[2025-10-23 10:30:00] [INFO] [ChinaMobileProvider] createResource: Requesting ECS instance
[2025-10-23 10:30:05] [INFO] [ChinaMobileProvider] createResource: Instance i-abc123 created
[2025-10-23 10:30:10] [WARN] [ChinaMobileProvider] createResource: Timeout, retrying (1/3)
[2025-10-23 10:30:15] [ERROR] [ChinaMobileProvider] createResource: Failed after 3 retries

追踪:
- 每个操作生成 requestId
- 关联所有相关日志
- 便于问题追踪和分析
```

---

## 成本优化

### 多厂商价格对比

```
需求: 2C4G Linux 服务器（按月计费）

移动云: ¥180/月
阿里云: ¥200/月
腾讯云: ¥180/月
DigitalOcean: $24/月 ≈ ¥170/月  ← 最便宜

策略:
IF 用户在中国:
  → 移动云 / 腾讯云（延迟低）
ELSE:
  → DigitalOcean（价格低）
```

### 资源池策略

#### 模式A：热资源池

```
适用: Pro/Enterprise 计划

优点:
- 用户订阅后立即可用（<1分钟）
- 体验极佳

缺点:
- 需预先创建 N 台服务器
- 成本较高（闲置浪费）

实现:
1. 系统预先创建10台服务器（pool）
2. 用户订阅 → 从pool取一台分配
3. 后台监控pool，少于5台时自动补充
4. pool中的服务器标记为 "reserved"
```

#### 模式B：按需创建

```
适用: 基础版计划

优点:
- 成本效益高
- 用多少买多少

缺点:
- 用户需等待 5-10分钟
- 创建可能失败

实现:
1. 用户订阅
2. 实时调用移动云 API 创建服务器
3. 等待创建完成（轮询状态）
4. 配置 Happy 环境
5. 交付给用户
```

#### 推荐：混合模式

```
规则:
- 基础版: 按需创建（成本优先）
- Pro版: 热资源池（体验优先）
- 高峰期: 临时扩大pool（晚8-10点）
- 低峰期: 缩小pool（凌晨2-6点）

动态调整:
监控订阅速度:
IF 每小时订阅 > 10:
  → 扩大pool到20台
ELSE IF 每小时订阅 < 5:
  → 缩小pool到5台
```

### 闲置资源回收

```
问题: 用户停止 VibeBox 后，服务器闲置

方案A: 真的停止服务器
- 调用 StopInstance
- 节省计算费用（按量计费）
- 用户重启需等待1-2分钟

方案B: 保持运行，回收到pool
- 清理用户数据
- 重置环境
- 归还到pool给新用户使用
- 适用于包年包月（已付费）

推荐: 根据计费模式
- 按量计费 → 真停止
- 包年包月 → 回收复用
```

---

## 安全考虑

### Provider Credentials 管理

```
问题: AccessKey 是敏感信息，泄露可能造成损失

方案:

1. 加密存储
   - 数据库中使用 AES-256 加密
   - 密钥存储在环境变量或密钥管理服务
   - 不在日志中输出原始密钥

2. 最小权限
   - 移动云 AccessKey 只授予 ECS 相关权限
   - 不授予其他资源权限（RDS、OSS、VPC等）
   - 使用 RAM 子账号而非主账号

3. 定期轮转
   - 每3个月更换一次 AccessKey
   - 自动化流程，最小化人工干预
   - 轮转前验证新密钥可用

4. 审计日志
   - 记录所有 Provider API 调用
   - 监控异常调用模式
   - 发现异常立即告警
```

### 资源访问控制

```
问题: 防止用户访问其他用户的 VibeBox

方案:

1. 数据库层
   - VibeBox 表关联 userId
   - 查询时必须 WHERE userId = currentUser

2. API层
   - 所有操作验证资源所有权
   - GET /api/vibeboxes/:id → 检查是否属于当前用户

3. Provider层
   - 资源打标签: { project: 'vibebox', userId: 'xxx' }
   - 便于审计和成本分析
```

### 网络安全

```
1. SSH 密码管理
   - 创建时生成强随机密码
   - 仅在 API 响应中返回一次
   - 用户首次登录后强制修改

2. 安全组配置
   - 默认只开放 SSH (22) 和 HTTP (80/443)
   - 用户可自定义规则

3. 内网通信
   - VibeBox 后端与资源的通信走内网
   - 减少公网暴露
```

---

## 实施路径

### Phase 1：基础框架（Week 1-2）

```
目标: 建立 Provider 抽象层，实现移动云 Provider

任务:
✅ 设计接口（IResourceProvider）
✅ 实现基础类（BaseProvider）
✅ 实现工厂模式（ProviderFactory）
✅ 实现移动云 Provider（ChinaMobileProvider）
✅ 编写单元测试

交付:
- server/lib/providers/ 目录完成
- 单元测试覆盖率 > 80%
- 文档更新
```

### Phase 2：业务集成（Week 3）

```
目标: VibeBox Service 集成 Provider

任务:
✅ 实现 VibeBoxService.createVibeBox()
✅ 实现 VibeBoxService.startVibeBox()
✅ 实现 VibeBoxService.stopVibeBox()
✅ 实现 VibeBoxService.deleteVibeBox()
✅ 数据库 Schema 更新
✅ API 端点实现

交付:
- VibeBox 完整生命周期管理
- API 端点可用
- 集成测试通过
```

### Phase 3：监控与容错（Week 4）

```
目标: 生产就绪

任务:
✅ 实现健康检查机制
✅ 实现故障自动恢复
✅ 日志与追踪
✅ 告警通知
✅ 性能优化

交付:
- 监控 Dashboard
- 告警规则配置
- 运维手册
```

### Phase 4：扩展（Week 5+）

```
目标: 支持更多 Provider

任务:
✅ 实现阿里云 Provider
✅ 实现腾讯云 Provider
✅ 实现 Docker Provider
✅ 自动选择策略
✅ 成本优化

交付:
- 多 Provider 生产可用
- 自动选择规则
- 成本报告
```

---

## 附录A：快速参考

### Provider 实现清单

```
新 Provider 必须实现:

类声明:
- extends BaseProvider
- readonly type: ProviderType
- readonly name: string

方法实现（9个）:
✅ validateConfig(config)
✅ setupClient(config)
✅ createResource(spec)
✅ getResourceInfo(id)
✅ startResource(id)
✅ stopResource(id)
✅ restartResource(id)
✅ deleteResource(id)
✅ performHealthCheck()

测试:
✅ 单元测试（每个方法）
✅ 集成测试（完整流程）
✅ 性能测试（并发创建）
```

### 配置示例

```
移动云配置（环境变量）:

CHINAMOBILE_ACCESS_KEY_ID=CMCC123...
CHINAMOBILE_ACCESS_KEY_SECRET=abcd1234...
CHINAMOBILE_REGION=beijing
CHINAMOBILE_ENABLED=true

阿里云配置:

ALIYUN_ACCESS_KEY_ID=LTAI...
ALIYUN_ACCESS_KEY_SECRET=abc123...
ALIYUN_REGION=cn-hangzhou
ALIYUN_ENABLED=true
```

---

## 附录B：API 示例

### 创建 VibeBox

```
POST /api/vibeboxes

Request:
{
  "planId": "basic",
  "providerType": "chinamobile",  // 可选，不传则自动选择
  "region": "beijing"             // 可选
}

Response:
{
  "id": "vibebox-123",
  "status": "provisioning",
  "providerType": "chinamobile",
  "resourceId": null,             // 创建中，尚未分配
  "createdAt": "2025-10-23T10:30:00Z"
}
```

### 查询 VibeBox 状态

```
GET /api/vibeboxes/vibebox-123

Response:
{
  "id": "vibebox-123",
  "status": "active",
  "providerType": "chinamobile",
  "resourceId": "i-abc123",
  "ipAddress": "1.2.3.4",
  "sshPort": 22,
  "createdAt": "2025-10-23T10:30:00Z",
  "metadata": {
    "instanceType": "ecs.c6.large",
    "region": "beijing"
  }
}
```

### 启动/停止 VibeBox

```
POST /api/vibeboxes/vibebox-123/start
POST /api/vibeboxes/vibebox-123/stop
POST /api/vibeboxes/vibebox-123/restart

Response:
{
  "success": true,
  "message": "VibeBox is starting"
}
```

---

**文档历史**:
- 2025-10-23: 初始版本创建，基于移动云ECS作为第一个 Provider
