# Happy - Vibe Server 商业化项目

基于 [Happy](https://github.com/slopus/happy) 开源项目（MIT License）构建的智能编程服务器商业化方案。

## 项目概述

本项目旨在构建一个商业化的"智能编程服务器"产品，让用户可以通过订阅方式获得预配置的 AI 编程环境（Vibe Server），并通过 Web/Mobile 端远程控制和使用。

### 核心价值

- **开箱即用**：预装 Claude Code、Happy CLI、Web 开发栈
- **零配置**：用户无需手动配置 API Key 和开发环境
- **远程访问**：通过 Web/Mobile 端随时随地使用
- **订阅制**：按月/年订阅，包含固定的 Claude API 用量

## 技术方案

本项目采用**零二开方案**（Zero Modification Solution），核心理念是：

- ✅ **不修改 happy-server** - 完全使用原生 API
- ✅ **不修改 happy-cli** - 通过配置文件方式集成
- ✅ **仅定制 happy-web** - 添加 URL 参数自动登录功能

详细方案请参阅 [docs/implementation/zero-modification-solution.md](docs/implementation/zero-modification-solution.md)

## 项目结构

```
.
├── docs/                          # 文档
│   ├── design/                   # 设计文档
│   │   ├── prd.md               # 产品需求文档
│   │   └── white-paper.md       # 项目白皮书
│   ├── research/                 # 调研文档
│   │   ├── authentication-system-analysis.md    # 认证体系分析
│   │   └── web-integration-analysis.md          # Web 集成方案
│   ├── implementation/           # 实施方案
│   │   └── zero-modification-solution.md        # 零二开方案
│   └── verification/             # 验证文档
│       ├── guide.md             # 验证指南
│       └── results.md           # 验证结果
│
├── verify-happy-integration.js   # 验证脚本（重要工具）
│
├── happy-cli/                     # Happy CLI 参考（git submodule/reference-only）
├── happy-server/                  # Happy Server 参考
└── happy-client/                  # Happy Client 参考
```

## 快速开始

### 环境要求

- Node.js >= 20
- npm 或 yarn
- Git

### 验证方案可行性

如果你想验证零二开方案的可行性，可以使用验证脚本：

```bash
# 安装依赖
npm install tweetnacl tweetnacl-util axios

# 步骤1: 创建 Happy 账户
node verify-happy-integration.js step1

# 步骤2: 配置 CLI（按照步骤1的输出操作）
node verify-happy-integration.js step2 --token "YOUR_TOKEN" --secret "YOUR_SECRET"

# 步骤3: 生成 Web URL（按照步骤2的输出操作）
node verify-happy-integration.js step3 --token "YOUR_TOKEN" --secret "YOUR_SECRET"
```

详细的验证指南请参阅 [docs/verification/guide.md](docs/verification/guide.md)

## 文档导航

### 设计阶段
- [产品需求文档 (PRD)](docs/design/prd.md) - 定义核心功能和用户旅程
- [项目白皮书](docs/design/white-paper.md) - 项目愿景和需求分析

### 调研阶段
- [认证体系分析](docs/research/authentication-system-analysis.md) - Happy 认证机制深度分析
- [Web 集成方案分析](docs/research/web-integration-analysis.md) - Web 端集成方案对比

### 实施阶段
- [零二开方案](docs/implementation/zero-modification-solution.md) - 完整的实施方案和代码
- [验证指南](docs/verification/guide.md) - 手动验证步骤
- [验证结果](docs/verification/results.md) - 验证成果报告

## 开发计划

### Phase 1: 准备工作（已完成）
- ✅ 技术调研
- ✅ 方案设计
- ✅ 可行性验证

### Phase 2: 项目实施（进行中）
- 🔄 项目代码组织讨论
- ⏳ 前后端架构设计
- ⏳ 核心功能开发

### Phase 3: 部署上线（待定）
- ⏳ 生产环境部署
- ⏳ 用户测试
- ⏳ 正式发布

## 技术栈

### 前端
- React / Next.js（待定）
- Happy Client（定制版）

### 后端
- Node.js / Python（待定）
- Happy Server（官方版，无修改）
- PostgreSQL
- Redis

### 基础设施
- Docker
- Nginx
- SSL/TLS

## 参考资料

- [Happy 官方仓库](https://github.com/slopus/happy)
- [Happy 官方文档](https://github.com/slopus/happy/blob/main/CLAUDE.md)
- [Claude Code](https://www.anthropic.com/claude)

## 许可证

本项目基于 MIT 许可证开源的 Happy 项目构建。

## 联系方式

如有疑问或建议，请联系项目维护者。

---

**注意**: 本项目目前处于开发阶段，尚未发布生产版本。
