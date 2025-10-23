# Happy 零二开方案验证指南

> 本指南帮助你在测试机器上手动验证 Happy 商业化集成方案的可行性

**Tags:** #verification:guide #verification:manual-testing #component:happy-server #component:happy-cli #component:happy-web #principle:zero-modification

## 📋 概述

本次验证将模拟平台侧的所有操作，证明以下核心假设：

1. ✅ 平台可以通过调用 `/v1/auth` API 自动创建 Happy 账户
2. ✅ 平台可以直接写入 `~/.happy/access.key` 文件配置 CLI
3. ✅ CLI daemon 启动后自动注册 machine
4. ✅ Web 端可以通过手动方式完成登录认证（URL 参数登录待实现）
5. ✅ Web/Mobile 可以远程创建会话，无需在 machine 端手动运行命令

**注意**: 当前 happy-web 尚未实现 URL 参数自动登录功能，这是零二开方案中**唯一需要定制的组件**。在定制完成前，可使用手动浏览器认证方式完成验证。

---

## 🚀 环境准备

### 测试机器要求

- **操作系统**: Linux（推荐 Ubuntu 20.04+）或 macOS
- **Node.js**: v20 或更高版本
- **网络**: 可以访问互联网（连接到 api.cluster-fluster.com）

### 安装步骤

#### 1. 安装 Node.js (如果未安装)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node
```

验证安装：
```bash
node --version  # 应该显示 v20.x.x
npm --version   # 应该显示 10.x.x
```

#### 2. 安装 Claude CLI

```bash
npm install -g @anthropic-ai/claude-cli
```

验证安装：
```bash
claude --version
```

#### 3. 安装 Happy CLI

```bash
npm install -g happy-coder
```

验证安装：
```bash
happy --version
```

#### 4. 安装验证脚本依赖

```bash
# 在 happy 项目目录下
cd /path/to/happy
npm install tweetnacl tweetnacl-util axios
```

---

## 🎯 验证流程

### 步骤 1: 创建 Happy 账户

**目标**: 通过 API 创建账户并获取 token

**操作**:
```bash
# 使用官方默认服务器（推荐）
node verify-happy-integration.js step1

# 或指定服务器地址
node verify-happy-integration.js step1 --server https://api.cluster-fluster.com
```

**预期输出**:
```
═══════════════════════════════════════════════════════════
  步骤 1: 创建 Happy 账户
═══════════════════════════════════════════════════════════

ℹ️  服务器地址: https://api.cluster-fluster.com

1️⃣  生成密钥对...
✅ 密钥对生成成功

2️⃣  生成 challenge-response 签名...
✅ 签名生成成功

3️⃣  调用 /v1/auth API...
ℹ️  POST https://api.cluster-fluster.com/v1/auth
✅ 账户创建成功！

📋 请保存以下信息（后续步骤需要）:

Secret (base64):
abcdefghijklmnopqrstuvwxyz1234567890ABCD==

Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

ℹ️  数据已保存到: /tmp/happy-verify-step1.json

🎯 下一步操作:

  node verify-happy-integration.js step2 --token "eyJ..." --secret "abcd..."
```

**✅ 验证检查点**:
- [ ] 看到 "✅ 账户创建成功！"
- [ ] 收到 secret（base64 编码，约 44 字符）
- [ ] 收到 token（JWT 格式，以 eyJ 开头）
- [ ] 临时文件已创建 `/tmp/happy-verify-step1.json`

**❌ 如果失败**:
- 检查网络连接：`curl https://api.cluster-fluster.com/health`
- 检查 Node.js 版本：`node --version`
- 检查依赖安装：`npm list tweetnacl tweetnacl-util axios`

**说明**:
- 默认使用 `https://api.cluster-fluster.com`（Happy CLI 代码中的官方默认服务器）
- 你也可以使用 `--server` 参数指定其他服务器地址

---

### 步骤 2: 配置 CLI

**目标**: 写入 `~/.happy/access.key` 文件

**操作**:
```bash
# 使用步骤1的输出替换 TOKEN 和 SECRET
node verify-happy-integration.js step2 \
  --token "YOUR_TOKEN_FROM_STEP1" \
  --secret "YOUR_SECRET_FROM_STEP1"
```

**预期输出**:
```
═══════════════════════════════════════════════════════════
  步骤 2: 生成 access.key 文件
═══════════════════════════════════════════════════════════

📄 access.key 文件内容:

{
  "secret": "abcdefghijklmnopqrstuvwxyz1234567890ABCD==",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

🎯 执行以下命令:

  # 1. 创建 .happy 目录（如果不存在）
  mkdir -p ~/.happy

  # 2. 写入 access.key 文件
  cat > ~/.happy/access.key << 'EOF'
{
  "secret": "abcdefghijklmnopqrstuvwxyz1234567890ABCD==",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
EOF

  # 3. 设置文件权限
  chmod 600 ~/.happy/access.key

  # 4. 验证文件内容
  cat ~/.happy/access.key
```

**实际操作** - 复制输出的命令并执行:
```bash
mkdir -p ~/.happy

cat > ~/.happy/access.key << 'EOF'
{
  "secret": "YOUR_SECRET_HERE",
  "token": "YOUR_TOKEN_HERE"
}
EOF

chmod 600 ~/.happy/access.key
```

**✅ 验证检查点**:
```bash
# 检查文件是否存在
ls -la ~/.happy/access.key
# 应该显示: -rw------- 1 user user 123 ... access.key

# 检查文件内容
cat ~/.happy/access.key
# 应该显示 JSON 格式，包含 secret 和 token

# 检查 JSON 格式是否正确
cat ~/.happy/access.key | jq .
# 应该成功解析 JSON
```

**❌ 如果失败**:
- 确保 JSON 格式正确（特别是引号和逗号）
- 确保没有多余的空格或换行
- 可以使用脚本提供的快捷命令：`cp /tmp/happy-access.key ~/.happy/access.key`

---

### 步骤 3: 启动 Daemon

**目标**: 启动 Happy daemon 并验证 machine 注册成功

**操作**:
```bash
# 启动 daemon
happy daemon start
```

**预期输出**:
```
Daemon started successfully
```

**验证 daemon 状态**:
```bash
# 检查 daemon 是否运行
happy daemon status
```

**预期输出**:
```
═══════════════════════════════════════════════════════════
  Happy Daemon Status
═══════════════════════════════════════════════════════════

✅ Daemon is running
  PID: 12345
  HTTP Port: 54321
  Started: 2025-10-20 15:30:00
  Version: 1.0.0
  Log: /Users/username/.happy-dev/logs/daemon.log

✅ Authentication configured
  Credentials file: /Users/username/.happy/access.key
  ✓ File exists
  ✓ Valid format

✅ Machine registered
  Machine ID: abc-123-def
  Status: online
```

**查看 daemon 日志** (可选):
```bash
# 获取日志文件路径
happy daemon logs

# 实时查看日志
happy daemon logs | xargs tail -f
```

**✅ 验证检查点**:
- [ ] Daemon 状态显示 "running"
- [ ] 看到 PID 和 HTTP Port
- [ ] Credentials 验证通过
- [ ] Machine 已注册（有 Machine ID）
- [ ] Machine 状态显示 "online" 或 "connected"

**❌ 如果失败**:

**问题 1: Daemon 启动失败**
```bash
# 检查是否已有 daemon 运行
ps aux | grep happy

# 强制停止旧 daemon
happy daemon stop

# 清理可能的僵尸进程
happy doctor clean

# 重新启动
happy daemon start
```

**问题 2: 认证失败**
```bash
# 检查 access.key 文件
cat ~/.happy/access.key | jq .

# 如果格式错误，重新执行步骤2
```

**问题 3: Machine 注册失败**
```bash
# 查看详细日志
happy daemon logs | xargs cat | grep -i error

# 检查网络连接
curl https://api.cluster-fluster.com/health
```

---

### 步骤 4: Web 浏览器认证（手动方式）

**目标**: 在 Web 浏览器中完成账户认证和登录

**重要说明**:
- URL 参数自动登录功能尚未在 happy-web 中实现
- 这是零二开方案中**唯一需要定制的组件**
- 在 Web 客户端定制完成之前，需使用本步骤的手动方式

#### 4.1 生成 Web URL

首先生成带有认证参数的 Web URL（用于参考）：

```bash
# 使用步骤1的输出替换 TOKEN 和 SECRET
node verify-happy-integration.js step3 \
  --token "YOUR_TOKEN_FROM_STEP1" \
  --secret "YOUR_SECRET_FROM_STEP1"

# 或者指定其他 Web 地址
node verify-happy-integration.js step3 \
  --token "YOUR_TOKEN_FROM_STEP1" \
  --secret "YOUR_SECRET_FROM_STEP1" \
  --web-url https://happy.engineering
```

**预期输出**:
```
═══════════════════════════════════════════════════════════
  步骤 3: 生成 Web 访问 URL
═══════════════════════════════════════════════════════════

🌐 Web 访问 URL:

https://happy.engineering?token=eyJhbGci...&secret=abcdef...

ℹ️  URL 已保存到: /tmp/happy-web-url.txt
```

**保存这两个值**（后续步骤需要）:
- `token`: URL 参数中的 token 值
- `secret`: URL 参数中的 secret 值（需要进行 URL 解码）

#### 4.2 手动浏览器认证

由于 happy-web 尚未实现 URL 参数自动登录功能，我们需要通过浏览器开发者工具手动设置认证凭据。

**操作步骤**:

1. **打开浏览器并访问 Happy Web**
   ```
   https://happy.engineering
   ```

2. **打开浏览器开发者工具**
   - Chrome/Edge: 按 `F12` 或 `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
   - Firefox: 按 `F12` 或 `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
   - Safari: 启用开发菜单后按 `Cmd+Option+I`

3. **切换到 Console 标签页**

4. **执行以下 JavaScript 代码**

   **重要**: 将 `YOUR_TOKEN_FROM_STEP1` 和 `YOUR_SECRET_FROM_STEP1` 替换为实际的值

   **注意**: Secret 必须是 **URL 解码后的值**（即原始的 base64 字符串，不是 URL 编码后的）

   ```javascript
   // 替换为你的实际值
   const token = "YOUR_TOKEN_FROM_STEP1";
   const secret = "YOUR_SECRET_FROM_STEP1";  // 必须是 URL 解码后的值！

   // 创建认证凭据对象
   const credentials = {
       token: token,
       secret: secret
   };

   // 保存到 localStorage
   localStorage.setItem('auth_credentials', JSON.stringify(credentials));

   console.log('✅ Credentials saved!');
   console.log('Stored credentials:', credentials);
   ```

5. **刷新页面**
   ```javascript
   location.reload();
   ```
   或手动按 `F5` / `Cmd+R`

**完整示例**:
```javascript
// 示例值（实际使用时替换为你的真实值）
const token = "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiI2NmU3YTAzYi0wMDI1LTRkYzctODY0Yi1hMGUzYTFiNThhZmEiLCJpYXQiOjE3Mjk0MDQyNDIsImV4cCI6MTc2MDk0MDI0Mn0.xV5mH9w_ZsGfU8xQP7oPz9yK3qN4lV6tJ2wR8hS1cM0pY4eL7fZ3nA9uD5bG6hX2jK8mT1vQ0rW3sE4cI9oJBw";
const secret = "JO33EpNkI3I/UD6vWeSyzozIRuxJg0Vnq2/08RMtJmI=";  // 注意: 已 URL 解码

const credentials = { token, secret };
localStorage.setItem('auth_credentials', JSON.stringify(credentials));
console.log('✅ Credentials saved!');
location.reload();
```

**✅ 验证检查点**:
- [ ] 控制台显示 "✅ Credentials saved!"
- [ ] 页面刷新后自动登录（没有显示登录表单）
- [ ] 看到左侧边栏（如果是桌面浏览器）或底部导航（移动设备）
- [ ] 看到你的 machine，显示主机名（如 `your-hostname`）
- [ ] Machine 卡片显示绿色圆点或 "online" 状态
- [ ] 看到 "New Session" 或 "+" 按钮

**❌ 如果失败**:

**问题 1: 刷新后仍显示登录表单**
```javascript
// 在控制台检查 localStorage 中的值
console.log(localStorage.getItem('auth_credentials'));

// 应该显示: {"token":"...","secret":"..."}
// 如果为 null 或格式不对，重新执行步骤 4.2.4
```

**问题 2: Secret 值错误（常见）**
- **检查是否进行了 URL 解码**: URL 中的 `%2F` 应该是 `/`, `%2B` 应该是 `+`, `%3D` 应该是 `=`
- 示例:
  - URL 编码: `JO33EpNkI3I%2FUD6vWeSyzozIRuxJg0Vnq2%2F08RMtJmI%3D`
  - URL 解码: `JO33EpNkI3I/UD6vWeSyzozIRuxJg0Vnq2/08RMtJmI=` ← 使用这个！

**问题 3: 登录后看不到 machine**
- Daemon 可能未正常运行：
  ```bash
  happy daemon status
  ```
- Machine 可能未注册成功，检查 daemon 日志:
  ```bash
  happy daemon logs | xargs tail -50
  ```

**问题 4: Machine 状态显示 "offline"**
- 重启 daemon:
  ```bash
  happy daemon stop
  happy daemon start
  ```
- 检查网络连接:
  ```bash
  curl https://api.cluster-fluster.com/health
  ```

#### 4.3 理解认证机制

**技术细节** (可选阅读):

Happy Web 使用 `localStorage` 存储认证凭据：
- **存储位置**: `localStorage`
- **Key**: `auth_credentials`
- **Value**: JSON 字符串 `{"token": "...", "secret": "..."}`

这个手动方式直接模拟了 Web 客户端的认证凭据存储逻辑，绕过了尚未实现的 URL 参数解析功能。

**未来改进**:
当 happy-web 实现 URL 参数自动登录后，步骤将简化为：
1. 生成 URL: `node verify-happy-integration.js step3 ...`
2. 在浏览器中打开 URL
3. 自动完成登录

但目前的手动方式**完全可行**，并且成功验证了零二开方案的所有核心假设

---

### 步骤 5: 创建首个会话

**目标**: 在 Web 界面通过远程方式创建会话，验证完整流程

**操作** (在浏览器中):

1. **点击 "New Session"**
   - 应该打开新会话创建界面

2. **选择 Machine**
   - 应该看到你的 machine（如 `MacBook-Pro`）
   - 点击选择

3. **选择或输入工作目录**
   - 输入: `/tmp` 或 `~/test` 或任何存在的目录
   - 如果目录不存在，系统会询问是否创建

4. **输入测试消息**
   - 建议使用简单的测试命令：
     ```
     list files in current directory
     ```
   - 或者：
     ```
     what is the current working directory?
     ```

5. **发送消息**
   - 点击发送按钮或按 Enter

**预期行为**:

1. **会话创建阶段** (5-15秒):
   - 显示 "Creating session..." 或加载指示器
   - 这期间 daemon 在后台 spawn 新的 happy 进程

2. **会话就绪**:
   - 页面自动跳转到会话界面
   - 看到你的消息显示在对话框中
   - 状态显示 "Claude is thinking..." 或类似文本

3. **Claude 响应** (10-30秒):
   - 看到 Claude 的回复开始流式输出
   - 回复内容应该包含当前目录的文件列表
   - 或者回答了你的问题

**✅ 最终验证检查点**:
- [ ] 会话创建成功（有 session ID）
- [ ] 看到 Claude 的回复
- [ ] 回复内容正确（列出了文件或回答了问题）
- [ ] 可以继续发送后续消息
- [ ] Claude 持续响应

**🎉 如果所有检查点都通过，恭喜！零二开方案验证成功！**

---

## 🐛 常见问题排查

### 问题：Daemon 启动后立即退出

**症状**:
```bash
$ happy daemon start
Daemon started successfully
$ happy daemon status
Daemon is not running
```

**可能原因和解决方案**:

1. **认证文件格式错误**
   ```bash
   # 检查文件格式
   cat ~/.happy/access.key | jq .

   # 如果报错，重新生成文件
   node verify-happy-integration.js step2 --token "..." --secret "..."
   ```

2. **端口冲突**
   ```bash
   # 查看是否有其他进程占用端口
   lsof -i :54321

   # 如果有，kill 该进程
   kill -9 <PID>
   ```

3. **查看 daemon 日志找到详细错误**
   ```bash
   # 找到最新的日志文件
   ls -lt ~/.happy-dev/logs/

   # 查看日志
   cat ~/.happy-dev/logs/[LATEST_LOG_FILE]
   ```

### 问题：Web 界面看不到 Machine

**可能原因**:

1. **Daemon 未正常运行**
   ```bash
   happy daemon status
   # 如果显示 not running，重新启动
   happy daemon start
   ```

2. **Token 过期或无效**
   ```bash
   # 重新生成账户
   node verify-happy-integration.js step1
   # 重新配置 CLI
   node verify-happy-integration.js step2 --token "..." --secret "..."
   # 重启 daemon
   happy daemon stop && happy daemon start
   ```

3. **WebSocket 连接问题**
   - 检查浏览器控制台是否有错误
   - 检查网络连接
   - 尝试刷新页面

### 问题：会话创建超时

**症状**:
```
Creating session...
(长时间等待，然后显示错误)
```

**可能原因和解决方案**:

1. **Daemon 未响应**
   ```bash
   # 查看 daemon 日志
   happy daemon logs | xargs tail -f

   # 应该看到 "Spawning session" 相关日志
   # 如果没有，重启 daemon
   happy daemon stop && happy daemon start
   ```

2. **目录权限问题**
   ```bash
   # 确保目录存在且有写权限
   mkdir -p /tmp/test
   chmod 755 /tmp/test

   # 在 Web 界面重试，使用 /tmp/test 作为目录
   ```

3. **Claude CLI 未正确安装**
   ```bash
   # 验证 Claude CLI
   which claude
   claude --version

   # 如果未安装或版本不对
   npm install -g @anthropic-ai/claude-cli
   ```

---

## 📊 验证结果记录

请在完成验证后填写以下表格：

```
验证时间: _____________
测试机器: _____________
操作系统: _____________
服务器地址: _____________

[ ] 步骤 1: 创建账户成功
[ ] 步骤 2: 配置 CLI 成功
[ ] 步骤 3: Daemon 启动成功
[ ] 步骤 4: Web 手动认证成功
[ ] 步骤 5: 远程创建会话成功
[ ] 步骤 5: Claude 响应成功

验证方式:
[ ] URL 参数自动登录（happy-web 已实现自动登录功能）
[ ] 手动浏览器认证（使用 localStorage 方式）

遇到的问题:
_____________________________________
_____________________________________

解决方案:
_____________________________________
_____________________________________

总体评价:
[ ] 流程顺畅，无重大问题
[ ] 有小问题但可以解决
[ ] 有较大问题需要修复

备注:
_____________________________________
_____________________________________
```

---

## 🔄 清理和重置

如果需要重新验证或清理测试环境：

```bash
# 1. 停止 daemon
happy daemon stop

# 2. 删除配置文件
rm ~/.happy/access.key

# 3. 清理临时文件
rm /tmp/happy-verify-step1.json
rm /tmp/happy-access.key
rm /tmp/happy-web-url.txt

# 4. 清理 daemon 状态
rm -rf ~/.happy-dev/logs/
rm ~/.happy-dev/daemon.state.json

# 5. 清理测试会话（可选）
# 在 Web 界面中删除测试会话

# 6. 重新开始验证
node verify-happy-integration.js step1
```

---

## 📚 参考资料

- Happy 项目主文档: [CLAUDE.md](./happy-client/CLAUDE.md)
- Happy CLI 文档: [happy-cli/CLAUDE.md](./happy-cli/CLAUDE.md)
- 商业化方案文档: [Happy商业化零二开方案-最终版.md](./Happy商业化零二开方案-最终版.md)
- 认证体系调查报告: [Happy_认证体系调查报告.md](./Happy_认证体系调查报告.md)

---

## ✅ 验证完成后

恭喜！如果你成功完成了所有步骤，这意味着：

1. ✅ **零二开方案完全可行**
   - 平台可以通过 API 自动创建账户
   - 平台可以直接配置 CLI（无需修改 happy-cli）
   - Daemon 可以自动注册 machine（无需修改 happy-server）
   - Web 认证机制已验证（目前使用手动方式，待实现 URL 参数自动登录）

2. ✅ **技术路径已验证**
   - 密钥生成和签名算法正确
   - API 调用流程正确
   - WebSocket 通信正常
   - RPC 远程会话创建正常
   - Web localStorage 认证机制正常

3. ✅ **可以开始平台集成开发**
   - 参考 `verify-happy-integration.js` 的实现
   - 参考商业化方案文档中的平台集成代码
   - 开发时间预估: 1.5-2 周
   - **唯一需要定制的组件**: happy-web 的 URL 参数自动登录功能

4. ✅ **验证成果**
   - 完整的端到端流程已验证
   - 从账户创建到远程会话执行全流程打通
   - 手动认证方法证明了 Web 客户端集成的可行性
   - 所有核心假设得到验证

### 后续开发建议

**必须完成**:
- [ ] 实现 happy-web 的 URL 参数自动登录功能
  - 解析 URL 中的 `token` 和 `secret` 参数
  - 自动调用 `TokenStorage.setCredentials()` 保存到 localStorage
  - 参考实现位置: `happy-client/sources/auth/tokenStorage.ts`

**可选优化**:
- [ ] 添加 Web 端的认证状态持久化验证
- [ ] 实现更优雅的登录跳转流程
- [ ] 添加认证失败的错误提示

---

**祝验证顺利！🚀**

如有任何问题，请参考文档或联系技术支持。
