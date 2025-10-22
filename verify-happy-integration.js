#!/usr/bin/env node

/**
 * Happy 零二开方案验证脚本
 *
 * 用途：手动验证 Happy 商业化集成方案的可行性
 *
 * 使用方法：
 *   npm install tweetnacl tweetnacl-util axios
 *
 *   # 步骤1: 创建账户
 *   node verify-happy-integration.js step1 --server https://happy-api.slopus.com
 *
 *   # 步骤2: 生成 access.key 内容
 *   node verify-happy-integration.js step2 --token "YOUR_TOKEN" --secret "YOUR_SECRET"
 *
 *   # 步骤3: 生成 Web URL
 *   node verify-happy-integration.js step3 --token "YOUR_TOKEN" --secret "YOUR_SECRET" --web-url https://happy.slopus.com
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('');
    log('═'.repeat(60), 'cyan');
    log(`  ${title}`, 'bright');
    log('═'.repeat(60), 'cyan');
    console.log('');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {};

    for (let i = 1; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        options[key] = value;
    }

    return { command, options };
}

// Step 1: 创建 Happy 账户
async function step1CreateAccount(serverUrl) {
    logSection('步骤 1: 创建 Happy 账户');

    logInfo(`服务器地址: ${serverUrl}`);
    console.log('');

    // 1. 生成密钥对
    log('1️⃣  生成密钥对...', 'cyan');
    const secret = nacl.randomBytes(32);
    const keypair = nacl.sign.keyPair.fromSeed(secret);
    const publicKey = keypair.publicKey;

    logSuccess('密钥对生成成功');
    console.log('');

    // 2. 生成 challenge 和签名
    log('2️⃣  生成 challenge-response 签名...', 'cyan');
    const challenge = nacl.randomBytes(32);
    const signature = nacl.sign.detached(challenge, keypair.secretKey);

    logSuccess('签名生成成功');
    console.log('');

    // 3. 调用 /v1/auth API
    log('3️⃣  调用 /v1/auth API...', 'cyan');
    logInfo(`POST ${serverUrl}/v1/auth`);

    try {
        const response = await axios.post(`${serverUrl}/v1/auth`, {
            publicKey: naclUtil.encodeBase64(publicKey),
            challenge: naclUtil.encodeBase64(challenge),
            signature: naclUtil.encodeBase64(signature)
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success && response.data.token) {
            logSuccess('账户创建成功！');
            console.log('');

            const secretBase64 = naclUtil.encodeBase64(secret);
            const token = response.data.token;

            // 显示结果
            log('📋 请保存以下信息（后续步骤需要）:', 'bright');
            console.log('');
            log('Secret (base64):', 'yellow');
            console.log(secretBase64);
            console.log('');
            log('Token:', 'yellow');
            console.log(token);
            console.log('');

            // 保存到临时文件
            const tmpData = {
                secret: secretBase64,
                token: token,
                timestamp: new Date().toISOString(),
                serverUrl: serverUrl
            };

            const tmpFile = path.join(os.tmpdir(), 'happy-verify-step1.json');
            fs.writeFileSync(tmpFile, JSON.stringify(tmpData, null, 2));

            logInfo(`数据已保存到: ${tmpFile}`);
            console.log('');

            // 下一步提示
            log('🎯 下一步操作:', 'bright');
            console.log('');
            console.log(`  node verify-happy-integration.js step2 --token "${token}" --secret "${secretBase64}"`);
            console.log('');

        } else {
            logError('账户创建失败: API 返回了意外的响应');
            console.log(JSON.stringify(response.data, null, 2));
            process.exit(1);
        }

    } catch (error) {
        logError('账户创建失败');
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            console.error('无法连接到服务器');
            logWarning('请检查服务器地址是否正确，以及网络连接是否正常');
        } else {
            console.error('错误:', error.message);
        }
        process.exit(1);
    }
}

// Step 2: 生成 access.key 文件内容
function step2GenerateAccessKey(token, secret) {
    logSection('步骤 2: 生成 access.key 文件');

    const accessKeyContent = {
        secret: secret,
        token: token
    };

    const accessKeyJson = JSON.stringify(accessKeyContent, null, 2);
    const happyDir = path.join(os.homedir(), '.happy');
    const accessKeyPath = path.join(happyDir, 'access.key');

    log('📄 access.key 文件内容:', 'cyan');
    console.log('');
    console.log(accessKeyJson);
    console.log('');

    log('🎯 执行以下命令:', 'bright');
    console.log('');
    console.log(`  # 1. 创建 .happy 目录（如果不存在）`);
    console.log(`  mkdir -p ~/.happy`);
    console.log('');
    console.log(`  # 2. 写入 access.key 文件`);
    console.log(`  cat > ~/.happy/access.key << 'EOF'`);
    console.log(accessKeyJson);
    console.log(`EOF`);
    console.log('');
    console.log(`  # 3. 设置文件权限`);
    console.log(`  chmod 600 ~/.happy/access.key`);
    console.log('');
    console.log(`  # 4. 验证文件内容`);
    console.log(`  cat ~/.happy/access.key`);
    console.log('');

    // 保存到临时文件方便复制
    const tmpFile = path.join(os.tmpdir(), 'happy-access.key');
    fs.writeFileSync(tmpFile, accessKeyJson);

    logInfo(`文件内容已保存到: ${tmpFile}`);
    logInfo(`你可以使用以下命令直接复制:`);
    console.log('');
    console.log(`  cp ${tmpFile} ~/.happy/access.key`);
    console.log(`  chmod 600 ~/.happy/access.key`);
    console.log('');

    log('🎯 完成后的下一步:', 'bright');
    console.log('');
    console.log(`  # 启动 Happy daemon`);
    console.log(`  happy daemon start`);
    console.log('');
    console.log(`  # 检查 daemon 状态`);
    console.log(`  happy daemon status`);
    console.log('');
    console.log(`  # 查看 daemon 日志`);
    console.log(`  happy daemon logs | xargs tail -f`);
    console.log('');
}

// Step 3: 生成 Web 访问 URL
function step3GenerateWebUrl(token, secret, webUrl) {
    logSection('步骤 3: 生成 Web 访问 URL');

    // 构建 URL 参数
    const params = new URLSearchParams({
        token: token,
        secret: secret
    });

    const fullUrl = `${webUrl}?${params.toString()}`;

    log('🌐 Web 访问 URL:', 'bright');
    console.log('');
    console.log(fullUrl);
    console.log('');

    logInfo('在浏览器中打开上面的 URL，应该会自动登录');
    console.log('');

    log('✅ 验证清单:', 'bright');
    console.log('');
    console.log('  [ ] 页面自动登录成功');
    console.log('  [ ] 能看到你的 machine（显示主机名）');
    console.log('  [ ] Machine 状态显示为 "online" 或有绿色指示');
    console.log('  [ ] 可以点击 "New Session" 按钮');
    console.log('');

    log('🎯 下一步操作（在 Web 界面）:', 'bright');
    console.log('');
    console.log('  1. 点击 "New Session"');
    console.log('  2. 选择你的 machine');
    console.log('  3. 选择工作目录（如 /tmp 或 ~/test）');
    console.log('  4. 输入测试消息，如: "list files in current directory"');
    console.log('  5. 发送消息');
    console.log('');
    console.log('  ✅ 如果看到 Claude 的回复，说明整个流程验证成功！');
    console.log('');

    // 保存 URL 到临时文件
    const tmpFile = path.join(os.tmpdir(), 'happy-web-url.txt');
    fs.writeFileSync(tmpFile, fullUrl);

    logInfo(`URL 已保存到: ${tmpFile}`);
    console.log('');
}

// 显示帮助信息
function showHelp() {
    console.log(`
${colors.bright}Happy 零二开方案验证脚本${colors.reset}

${colors.cyan}用法:${colors.reset}
  node verify-happy-integration.js <command> [options]

${colors.cyan}命令:${colors.reset}

  ${colors.green}step1${colors.reset}  - 创建 Happy 账户
    选项:
      --server <url>    Happy Server 地址 (默认: https://api.cluster-fluster.com)

    示例:
      node verify-happy-integration.js step1 --server https://api.cluster-fluster.com

  ${colors.green}step2${colors.reset}  - 生成 access.key 文件内容
    选项:
      --token <token>   步骤1获得的 token (必需)
      --secret <secret> 步骤1获得的 secret (必需)

    示例:
      node verify-happy-integration.js step2 --token "eyJ..." --secret "abcd..."

  ${colors.green}step3${colors.reset}  - 生成 Web 访问 URL
    选项:
      --token <token>   步骤1获得的 token (必需)
      --secret <secret> 步骤1获得的 secret (必需)
      --web-url <url>   Happy Web 地址 (默认: https://happy.engineering)

    示例:
      node verify-happy-integration.js step3 --token "eyJ..." --secret "abcd..." --web-url https://happy.engineering

${colors.cyan}完整验证流程:${colors.reset}

  1. 运行 step1 创建账户
  2. 运行 step2 获取 access.key 文件内容，并手动写入 ~/.happy/access.key
  3. 启动 daemon: ${colors.yellow}happy daemon start${colors.reset}
  4. 检查状态: ${colors.yellow}happy daemon status${colors.reset}
  5. 运行 step3 获取 Web URL
  6. 在浏览器中打开 URL，验证自动登录
  7. 在 Web 界面创建新会话，发送消息
  8. ✅ 验证完成！

${colors.cyan}依赖安装:${colors.reset}
  npm install tweetnacl tweetnacl-util axios

${colors.cyan}更多信息:${colors.reset}
  参考 VERIFICATION_GUIDE.md 获取详细的操作指南
`);
}

// 主函数
async function main() {
    const { command, options } = parseArgs();

    if (!command || command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }

    try {
        switch (command) {
            case 'step1':
                const serverUrl = options.server || 'https://api.cluster-fluster.com';
                await step1CreateAccount(serverUrl);
                break;

            case 'step2':
                if (!options.token || !options.secret) {
                    logError('缺少必需参数');
                    console.log('');
                    console.log('用法: node verify-happy-integration.js step2 --token "YOUR_TOKEN" --secret "YOUR_SECRET"');
                    console.log('');
                    process.exit(1);
                }
                step2GenerateAccessKey(options.token, options.secret);
                break;

            case 'step3':
                if (!options.token || !options.secret) {
                    logError('缺少必需参数');
                    console.log('');
                    console.log('用法: node verify-happy-integration.js step3 --token "YOUR_TOKEN" --secret "YOUR_SECRET" --web-url "WEB_URL"');
                    console.log('');
                    process.exit(1);
                }
                const webUrl = options['web-url'] || 'https://happy.engineering';
                step3GenerateWebUrl(options.token, options.secret, webUrl);
                break;

            default:
                logError(`未知命令: ${command}`);
                console.log('');
                console.log('运行 "node verify-happy-integration.js help" 查看帮助');
                console.log('');
                process.exit(1);
        }
    } catch (error) {
        logError('执行失败');
        console.error(error);
        process.exit(1);
    }
}

// 运行
main();
