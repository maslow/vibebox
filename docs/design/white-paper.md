# 需求分析报告

**Tags:** #design:requirements #design:business-positioning #feature:vibebox #feature:mobile-first #feature:subscription #principle:simplicity

## 1. 项目核心与愿景 (Project Core & Vision)

- **核心价值**: 提供极致便捷、开箱即用的AI编码环境（"VibeBox"），实现零配置、订阅即用。
- **核心目标**: 利用低成本服务器资源，将其包装为高价值、易于订阅的AI原型验证工具，帮助开发者专注于创意本身，而非繁琐的环境配置。

## 2. 目标用户与关键场景 (Target Users & Key Scenarios)

- **目标用户**:
    1. **首要 (Primary)**: **独立开发者 / 技术爱好者**。他们看重效率，需要一个即时可用的环境来快速验证新想法。
    2. **次要 (Secondary)**: **AI初学者 / 学生**。他们需要一个零门槛的沙盒环境来学习和实验AI编码。
- **关键场景**: 独立开发者（首要用户）在移动场景下（通勤路上、咖啡厅、外出时）突然有了一个AI创意或想测试某个API，需要通过手机即时访问一个已预装好所有工具（Vibe, Web栈, API Key）的环境来快速验证原型，避免繁琐配置，随时可用。

## 3. 商业定位 (Business Positioning)

- **战略定位**: **移动优先 (Mobile-First)** 的AI编码平台
    - **核心差异化**: 与桌面端竞品不同，我们主打**移动Vibe编码场景**，为开发者提供随时随地的AI编码体验
    - **目标场景**: 用户在通勤、咖啡厅、床上等移动场景下，通过手机进行快速原型验证和创意实现
    - **技术实现**: 原生iOS/Android应用（基于React Native），Web端作为辅助平台
- **商业模式**: **极简订阅 (Simplified Subscription)**
- **模式描述**: 平台提供单一 SKU（VibeBox Pro 2c4g），用户按月/年付费订阅，支持通过 Quantity 订阅多个 Box。
- **核心价值点**:
    - **单一产品**: 仅提供 VibeBox Pro（2核4G + 无忧 Claude API）
    - **清晰定价**: 月付 $24，年付 $192（节省 33%）
    - **无忧 API**: 订阅即包含 Claude API 用量，无需关心额度或配置
    - **多 Box 支持**: 用户可通过 Quantity 订阅多个 Box，每个 Box 独立配置和 API 额度
    - **单一统一客户端**：用户无需在不同平台间切换，无需额外下载应用或OAuth跳转，提供无缝体验

## 4. 核心功能需求 (Core Functional Requirements)

### 4.1. 范围内的功能 (In-Scope Features)

- **模块1：Box 管理**
    - **订阅绑定**: 用户的每一个"分层订阅"产品，都自动关联一个专属的、持久化的 Box。
    - **状态管理**: 用户可以在平台（App 的 Boxes Tab 或 Web）上对该 Box 执行 `启动`、`停止`、`重启` 操作。
    - **完全开放 (Root Access)**: 用户获得服务器的完全（root）权限，可以自由安装软件或修改配置。
    - **预装环境 (Standard Environment)**: Box 从资源池分配时，已预装 `claude code`, `happy-coder` (及其依赖 `Node.js`), `Python` 和 `Nginx`。
- **模块2：API 用量管理**
    - **预配置 API Key**: Box 分配时，已从 API Key 资源池分配了 Claude API Key（该 Key 在 Claude 后台设置了每日上限，用于防止极端滥用）。
    - **无忧体验**: MVP 阶段，平台不显示 API 用量进度、数字或百分比，让用户觉得"无忧，用不完"。用户在 Chats Tab 和 Boxes Tab 可以看到"✓ 无忧 AI 编码"的标识。
    - **后台防滥用**: 如果用户触发后台防滥用上限（极端情况），平台通过邮件联系用户，而非前端提示。
- **模块3：Vibe Coding 客户端体验**
    - **聊天会话集成 (核心)**: 平台（App/Web）深度集成 `happy-client`，用户通过 Chats Tab 的聊天界面与专属 Box 上的 `claude code` 进行对话式编码。
    - **传统访问支持 (Fallback)**: 平台在 Boxes Tab，清晰展示服务器的连接信息（如 `IP地址`, `SSH端口 (22)`, `Web端口 (80/443)`, 以及 `Root密码`或`SSH密钥`），允许用户通过传统 SSH 方式连接服务器。
- **模块4：用户账户与订阅管理**
    - **混合认证 (Flexible Auth)**: 平台提供多种便捷的注册和登录方式，包括匿名试用（自动创建）、`社交登录 (GitHub/Google)` 和 `手机号+验证码` (例如通过 Logto 实现)。
    - **零障碍试用**: 用户首次打开 App 自动创建匿名账户，获得 3 天免费试用（时间限制，非用量限制），试用 Box 配置与正式版相同（2核4G，无忧 API）。试用后可选择绑定账户。
    - **订阅展示页**: 平台提供清晰的页面，展示 VibeBox Pro 的规格（2核4G + 无忧 Claude API + 预装环境 + 完全 Root 权限）和定价（月付 $24，年付 $192，节省 33%）。
    - **支付集成**: 平台集成多平台支付系统（Web 使用 Stripe，iOS 使用 Apple IAP，Android 使用 Google Play），用户选择订阅周期（月付或年付）后完成购买。
    - **多 Box 订阅**: 用户可通过 Quantity 参数订阅多个 Box，每个 Box 独立分配服务器和 API Key。
- **模块5：运营管理后台 (Admin Portal)**
    - **自动化交付 (Automated Provisioning)**: 后台系统的核心职责是实现新订阅的自动化交付。它应能（1）监听支付成功事件，（2）从服务器资源池分配预配置的 VibeBox Pro（2核4G），（3）从 API Key 资源池分配 Claude API Key（设置每日上限），（4）将 Box 与用户账户绑定。整个过程在 <30 秒内完成。如果用户订阅多个 Box（通过 Quantity），系统为每个 Box 独立分配服务器和 API Key。
- **模块6：用户支持与反馈**
    - **电子邮件支持 (Email Support)**: 平台在显著位置（如页脚）提供一个 `support@...` 电子邮箱地址，作为所有技术支持和账单请求（如取消订阅）的唯一渠道。

### 4.2. 明确排除的功能 (Out-of-Scope Features)

*(以下功能在当前MVP阶段明确排除，以确保核心价值的快速交付)*

- **多规格套餐**: 暂不提供多个规格选项，仅提供 VibeBox Pro 2c4g。
- **API 用量显示**: MVP 阶段不显示 API 用量进度、数字或百分比。
- **一键重置 Box (One-click Reset)**: 暂不提供将 Box 恢复到初始状态的功能。
- **API 用量叠加包/升级**: 暂不提供 API 额度用尽后的即时充值或套餐升级功能。
- **Gift Code 功能**: 暂不提供 Gift Code 兑换功能。
- **Docker 预装**: 暂不在标准环境中预装 Docker（用户可自行安装）。
- **自助取消订阅**: 暂不提供。用户需要通过电子邮件支持渠道手动申请。
- **自助账单管理**: 暂不提供查看历史账单、修改支付方式等功能。
- **按比例退费**: 暂不提供退费功能，取消订阅后服务持续到当前计费周期结束。
- **复杂后台管理**: 暂不包含数据分析仪表盘、资源池监控、复杂用户管理等后台功能。
- **工单系统或实时客服**: 暂不提供，仅通过电子邮件支持。