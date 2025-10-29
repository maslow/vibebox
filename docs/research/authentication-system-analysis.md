# Happy 认证体系调查报告

**文档版本**: 1.0
**创建日期**: 2025-01-XX
**调查范围**: Happy 完整认证架构与平台集成方案验证

**Tags:** #research:authentication #component:happy-server #component:happy-cli #component:happy-client #principle:zero-modification #verification:technical #language:chinese #feature:dual-auth #feature:token-management #troubleshooting:oauth

---

## 📋 执行摘要

本报告通过深入分析 Happy 代码库（happy-server、happy-cli、happy-client），验证了 Happy 的完整认证体系架构，并针对平台集成方案中的关键假设进行了事实核查。

**核心发现**:
- ✅ 账户本质上是一个 32 字节的 secret key
- ✅ publicKey 由**客户端**从 secret 派生后发送给服务器
- ✅ CLI 和 Mobile 共享同一个 secret（通过加密通道传输）
- ✅ Server 从未知道 secret，仅存储 publicKey
- ✅ 原方案核心逻辑可行，但需修正实现细节

---

## 🎯 调查背景与目标

### 背景
平台需要集成 Happy CLI，提出了"零二开方案"，核心思路是：
1. 平台后端生成账户
2. 调用 `/v1/auth` API 创建账户
3. SSH 写入 `access.key` 文件
4. 启动 daemon 自动注册 Machine

### 调查目标
验证以下关键问题：
1. `/v1/auth` API 是否真的自动创建账户？
2. publicKey 是客户端派生还是服务器派生？
3. CLI 和 Mobile 的 secret 是否相同？
4. Server 是否知道 secret？
5. 原方案是否存在事实幻觉或逻辑错误？

---

## 🔐 Happy 认证体系完整解析

### 1. 账户的本质

**账户 = 一个 32 字节的 secret key**

```prisma
// happy-server/prisma/schema.prisma:22-55
model Account {
    id              String      @id @default(cuid())
    publicKey       String      @unique  // ← 账户的唯一标识
    seq             Int         @default(0)
    createdAt       DateTime    @default(now())
    updatedAt       DateTime    @updatedAt

    Session             Session[]
    Machine             Machine[]
    TerminalAuthRequest TerminalAuthRequest[]
    ...
}
```

**架构关系**:
```
┌──────────────────────────────────────────────────┐
│  Client Side                                     │
│                                                  │
│  secret (32 bytes) ────────────┐                │
│     ↓ derive (client-side)     │                │
│  publicKey ─────────────────────┼────────────────►
│  privateKey (for signing)      │                │
│                                 │                │
│  存储: { token, secret }        │                │
└─────────────────────────────────┼────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────┼────────────────┐
│  Server Side                    │                │
│                                 │                │
│  Account:                       │                │
│    id: "cuid_xxx"              │                │
│    publicKey: "hex_..." ◄───────┘                │
│    sessions[]                                    │
│    machines[]                                    │
│                                                  │
│  ❌ 从未存储 secret                              │
└──────────────────────────────────────────────────┘
```

**关键事实**:
- Client 持有: `secret` (私钥材料)
- Server 存储: `publicKey` (公钥，账户唯一标识)
- 识别方式: `publicKey` 在数据库中 `@unique`

---

### 2. 创建账户流程（Mobile/Web 端）

**文件位置**: `happy-client/sources/app/(app)/index.tsx:39-50`

```typescript
const createAccount = async () => {
    // Step 1: 客户端本地生成随机 secret (32 bytes)
    const secret = await getRandomBytesAsync(32);

    // Step 2: 调用 /v1/auth，服务器自动创建 Account
    const token = await authGetToken(secret);

    // Step 3: 存储到本地
    if (token && secret) {
        await auth.login(token, encodeBase64(secret, 'base64url'));
    }
}
```

#### `authGetToken` 内部实现

**文件**: `happy-client/sources/auth/authGetToken.ts:6-12`

```typescript
export async function authGetToken(secret: Uint8Array) {
    const API_ENDPOINT = getServerUrl();

    // 从 secret 派生 publicKey 和签名
    const { challenge, signature, publicKey } = authChallenge(secret);

    // 调用 /v1/auth
    const response = await axios.post(`${API_ENDPOINT}/v1/auth`, {
        challenge: encodeBase64(challenge),
        signature: encodeBase64(signature),
        publicKey: encodeBase64(publicKey)  // ← 发送客户端派生的 publicKey
    });

    return response.data.token;
}
```

#### `authChallenge` 密钥派生逻辑

**文件**: `happy-client/sources/auth/authChallenge.ts:4-9`

```typescript
export function authChallenge(secret: Uint8Array) {
    // 从 secret 派生签名密钥对
    const keypair = sodium.crypto_sign_seed_keypair(secret);

    // 生成随机挑战
    const challenge = getRandomBytes(32);

    // 用私钥签名挑战
    const signature = sodium.crypto_sign_detached(challenge, keypair.privateKey);

    return {
        challenge,           // 随机数
        signature,           // 签名
        publicKey: keypair.publicKey  // ← 派生的公钥
    };
}
```

#### Server 端处理逻辑

**文件**: `happy-server/sources/app/api/routes/authRoutes.ts:9-39`

```typescript
app.post('/v1/auth', {
    schema: {
        body: z.object({
            publicKey: z.string(),   // ← 接收客户端的 publicKey
            challenge: z.string(),
            signature: z.string()
        })
    }
}, async (request, reply) => {
    const tweetnacl = (await import("tweetnacl")).default;

    // 解码客户端发送的数据
    const publicKey = privacyKit.decodeBase64(request.body.publicKey);
    const challenge = privacyKit.decodeBase64(request.body.challenge);
    const signature = privacyKit.decodeBase64(request.body.signature);

    // 验证签名（使用客户端提供的 publicKey）
    const isValid = tweetnacl.sign.detached.verify(challenge, signature, publicKey);
    if (!isValid) {
        return reply.code(401).send({ error: 'Invalid signature' });
    }

    // 直接使用客户端提供的 publicKey 创建/更新账户
    const publicKeyHex = privacyKit.encodeHex(publicKey);
    const user = await db.account.upsert({
        where: { publicKey: publicKeyHex },
        update: { updatedAt: new Date() },
        create: { publicKey: publicKeyHex }  // ← 直接存储客户端的 publicKey
    });

    return reply.send({
        success: true,
        token: await auth.createToken(user.id)
    });
});
```

**流程图**:
```
Client (Mobile/Web)                    Server
─────────────────                     ──────

1. secret = random(32)
2. publicKey = derive(secret) ───────►
3. challenge = random(32)             │
4. signature = sign(challenge)        │
   |                                  ▼
   └──────────────────────────► POST /v1/auth
                                 { publicKey,
                                   challenge,
                                   signature }
                                      │
                                      ▼
                                 verify(challenge,
                                        signature,
                                        publicKey)
                                      │
                                      ▼
                                 Account.upsert({
                                   publicKey: publicKey
                                 })
                                      │
                                      ▼
   ◄───────────────────────────  { token }

5. 存储 { token, secret }
```

**关键事实**:
- ✅ **客户端**从 secret 派生 publicKey
- ✅ **客户端**直接发送 publicKey 给服务器
- ✅ **服务器**从未接收 secret
- ✅ **服务器**直接使用客户端提供的 publicKey
- ✅ **服务器**通过 `upsert` 自动创建账户

---

### 3. CLI 授权登录流程（扫码授权）

**CLI 不创建新账户，而是通过 Mobile 授权获取已有账户的 secret**

#### 完整流程图

```
┌─────────────┐                     ┌──────────────┐                ┌────────────┐
│   CLI 端    │                     │    Server    │                │ Mobile 端  │
│  (未登录)   │                     │              │                │ (已登录)   │
└─────────────┘                     └──────────────┘                └────────────┘
      │                                     │                              │
      │ 1. 生成临时密钥对                    │                              │
      │    ephemeral_keypair                │                              │
      │    (仅用于加密通道)                  │                              │
      │                                     │                              │
      │ 2. POST /v1/auth/request           │                              │
      ├────────────────────────────────────►│                              │
      │    { publicKey: ephemeral.publicKey }│                            │
      │                                     │                              │
      │ ◄───────────────────────────────────┤                              │
      │    { state: 'requested' }           │                              │
      │                                     │                              │
      │ 3. 显示 QR 码                       │                              │
      │    happy://terminal?<ephemeral.publicKey>                         │
      │                                     │                              │
      │                                     │      4. 扫码获取 ephemeral.publicKey
      │                                     │ ◄────────────────────────────┤
      │                                     │                              │
      │                                     │      5. 加密自己的 secret    │
      │                                     │         encrypted = encrypt( │
      │                                     │           mobile.secret,     │
      │                                     │           ephemeral.publicKey│
      │                                     │         )                    │
      │                                     │                              │
      │                                     │      6. POST /v1/auth/response
      │                                     │ ◄────────────────────────────┤
      │                                     │         {                    │
      │                                     │           publicKey,         │
      │                                     │           response: encrypted│
      │                                     │         }                    │
      │                                     │         (需 mobile.token 认证)│
      │                                     ▼                              │
      │                              存储 encrypted                        │
      │                              (Server 无法解密)                      │
      │                                     │                              │
      │ 7. 轮询 /v1/auth/request           │                              │
      ├────────────────────────────────────►│                              │
      │                                     │                              │
      │ ◄───────────────────────────────────┤                              │
      │    {                                │                              │
      │      state: 'authorized',           │                              │
      │      token: ...,                    │                              │
      │      response: encrypted            │                              │
      │    }                                │                              │
      │                                     │                              │
      │ 8. 解密 response                    │                              │
      │    mobile_secret = decrypt(         │                              │
      │      encrypted,                     │                              │
      │      ephemeral.privateKey           │                              │
      │    )                                │                              │
      │                                     │                              │
      │ 9. 写入 ~/.happy/access.key         │                              │
      │    {                                │                              │
      │      token: ...,                    │                              │
      │      secret: mobile_secret          │                              │
      │    }                                │                              │
      │                                     │                              │
      └─────────────────────────────────────┴──────────────────────────────┘

      ✅ CLI 和 Mobile 现在共享同一个 secret（Mobile 的 secret）
```

#### 关键代码实现

##### Step 1-3: CLI 生成临时密钥并显示 QR 码

**文件**: `happy-cli/src/ui/auth.ts:27-98`

```typescript
export async function doAuth(): Promise<Credentials | null> {
    // 生成临时密钥对（仅用于本次加密通道）
    const secret = new Uint8Array(randomBytes(32));
    const keypair = tweetnacl.box.keyPair.fromSecretKey(secret);

    // 创建认证请求
    await axios.post(`${configuration.serverUrl}/v1/auth/request`, {
        publicKey: encodeBase64(keypair.publicKey),  // ← 临时公钥
        supportsV2: true
    });

    // 显示 QR 码
    const authUrl = 'happy://terminal?' + encodeBase64Url(keypair.publicKey);
    displayQRCode(authUrl);

    return await waitForAuthentication(keypair);
}
```

##### Step 4-6: Mobile 扫码并加密 secret

**文件**: `happy-client/sources/hooks/useConnectTerminal.ts:23-54`

```typescript
const processAuthUrl = React.useCallback(async (url: string) => {
    if (!url.startsWith('happy://terminal?')) {
        return false;
    }

    // 提取 CLI 的临时公钥
    const tail = url.slice('happy://terminal?'.length);
    const publicKey = decodeBase64(tail, 'base64url');

    // 用 CLI 的临时公钥加密 Mobile 的 secret
    const responseV1 = encryptBox(
        decodeBase64(auth.credentials!.secret, 'base64url'),  // ← Mobile 的 secret
        publicKey  // ← CLI 的临时公钥
    );

    // V2: 加密数据密钥
    let responseV2Bundle = new Uint8Array(sync.encryption.contentDataKey.length + 1);
    responseV2Bundle[0] = 0;
    responseV2Bundle.set(sync.encryption.contentDataKey, 1);
    const responseV2 = encryptBox(responseV2Bundle, publicKey);

    // 发送加密后的数据到服务器
    await authApprove(auth.credentials!.token, publicKey, responseV1, responseV2);

    return true;
}, [auth.credentials]);
```

**文件**: `happy-client/sources/auth/authApprove.ts:11-50`

```typescript
export async function authApprove(
    token: string,
    publicKey: Uint8Array,
    answerV1: Uint8Array,
    answerV2: Uint8Array
) {
    // 发送加密的 secret
    await axios.post(`${API_ENDPOINT}/v1/auth/response`, {
        publicKey: encodeBase64(publicKey),
        response: supportsV2 ? encodeBase64(answerV2) : encodeBase64(answerV1)
    }, {
        headers: {
            'Authorization': `Bearer ${token}`,  // ← 需要 Mobile 的 token
        }
    });
}
```

##### Server 存储加密数据

**文件**: `happy-server/sources/app/api/routes/authRoutes.ts:126-166`

```typescript
app.post('/v1/auth/response', {
    preHandler: app.authenticate,  // ← 验证是已登录用户
    schema: {
        body: z.object({
            response: z.string(),   // ← 加密的 secret
            publicKey: z.string()   // ← CLI 的临时公钥
        })
    }
}, async (request, reply) => {
    const publicKey = privacyKit.decodeBase64(request.body.publicKey);
    const publicKeyHex = privacyKit.encodeHex(publicKey);

    const authRequest = await db.terminalAuthRequest.findUnique({
        where: { publicKey: publicKeyHex }
    });

    if (!authRequest) {
        return reply.code(404).send({ error: 'Request not found' });
    }

    if (!authRequest.response) {
        // 存储加密的 response（Server 无法解密）
        await db.terminalAuthRequest.update({
            where: { id: authRequest.id },
            data: {
                response: request.body.response,        // ← 加密数据
                responseAccountId: request.userId       // ← Mobile 的账户 ID
            }
        });
    }

    return reply.send({ success: true });
});
```

##### Step 7-9: CLI 轮询并解密

**文件**: `happy-cli/src/ui/auth.ts:135-218`

```typescript
async function waitForAuthentication(keypair: tweetnacl.BoxKeyPair): Promise<Credentials | null> {
    while (!cancelled) {
        // 轮询认证状态
        const response = await axios.post(`${configuration.serverUrl}/v1/auth/request`, {
            publicKey: encodeBase64(keypair.publicKey),
            supportsV2: true
        });

        if (response.data.state === 'authorized') {
            let token = response.data.token as string;
            let r = decodeBase64(response.data.response);

            // 用临时私钥解密
            let decrypted = decryptWithEphemeralKey(r, keypair.secretKey);

            if (decrypted) {
                if (decrypted.length === 32) {
                    // Legacy V1: 直接是 Mobile 的 secret
                    const credentials = {
                        secret: decrypted,  // ← Mobile 的 secret
                        token: token
                    }
                    await writeCredentialsLegacy(credentials);

                    return {
                        encryption: {
                            type: 'legacy',
                            secret: decrypted  // ← 保存 Mobile 的 secret
                        },
                        token: token
                    };
                } else if (decrypted[0] === 0) {
                    // V2: 包含数据密钥
                    const credentials = {
                        publicKey: decrypted.slice(1, 33),
                        machineKey: randomBytes(32),
                        token: token
                    }
                    await writeCredentialsDataKey(credentials);

                    return {
                        encryption: {
                            type: 'dataKey',
                            publicKey: credentials.publicKey,
                            machineKey: credentials.machineKey
                        },
                        token: token
                    };
                }
            }
        }

        await delay(1000);
    }
}
```

**解密函数**:

```typescript
export function decryptWithEphemeralKey(
    encryptedBundle: Uint8Array,
    recipientSecretKey: Uint8Array
): Uint8Array | null {
    // 提取组件: ephemeral public key (32) + nonce (24) + encrypted data
    const ephemeralPublicKey = encryptedBundle.slice(0, 32);
    const nonce = encryptedBundle.slice(32, 32 + tweetnacl.box.nonceLength);
    const encrypted = encryptedBundle.slice(32 + tweetnacl.box.nonceLength);

    const decrypted = tweetnacl.box.open(encrypted, nonce, ephemeralPublicKey, recipientSecretKey);

    return decrypted;  // ← Mobile 的原始 secret
}
```

**关键事实**:
- ✅ CLI 的临时 keypair **仅用于建立端到端加密通道**
- ✅ Mobile 用 CLI 的临时公钥加密**自己的 secret**
- ✅ Server 转发加密数据但**无法解密**
- ✅ CLI 用临时私钥解密得到 **Mobile 的 secret**
- ✅ CLI 和 Mobile **共享同一个 secret**（来自 Mobile）

---

### 4. access.key 的作用与唯一性

#### 文件位置

**配置**: `happy-cli/src/configuration.ts:50`

```typescript
this.privateKeyFile = join(this.happyHomeDir, 'access.key')
```

**完整路径**: `~/.happy/access.key`（非 `credentials.json`）

#### 文件格式

**Legacy 模式**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "secret": "base64_encoded_32_bytes_secret"
}
```

**DataKey 模式**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "encryption": {
    "publicKey": "base64_encoded_public_key",
    "machineKey": "base64_encoded_machine_key"
  }
}
```

#### Schema 定义

**文件**: `happy-cli/src/persistence.ts:137-153`

```typescript
const credentialsSchema = z.object({
  token: z.string(),
  secret: z.string().base64().nullish(),  // Legacy
  encryption: z.object({
    publicKey: z.string().base64(),
    machineKey: z.string().base64()
  }).nullish()
})

export type Credentials = {
  token: string,
  encryption: {
    type: 'legacy', secret: Uint8Array
  } | {
    type: 'dataKey', publicKey: Uint8Array, machineKey: Uint8Array
  }
}
```

#### 读取逻辑

**文件**: `happy-cli/src/persistence.ts:155-184`

```typescript
export async function readCredentials(): Promise<Credentials | null> {
  if (!existsSync(configuration.privateKeyFile)) {
    return null
  }

  try {
    const keyBase64 = (await readFile(configuration.privateKeyFile, 'utf8'));
    const credentials = credentialsSchema.parse(JSON.parse(keyBase64));

    if (credentials.secret) {
      // Legacy V1
      return {
        token: credentials.token,
        encryption: {
          type: 'legacy',
          secret: new Uint8Array(Buffer.from(credentials.secret, 'base64'))
        }
      };
    } else if (credentials.encryption) {
      // V2 with data encryption key
      return {
        token: credentials.token,
        encryption: {
          type: 'dataKey',
          publicKey: new Uint8Array(Buffer.from(credentials.encryption.publicKey, 'base64')),
          machineKey: new Uint8Array(Buffer.from(credentials.encryption.machineKey, 'base64'))
        }
      }
    }
  } catch {
    return null
  }

  return null
}
```

#### Daemon 启动时的使用

**文件**: `happy-cli/src/daemon/run.ts:130-437`

```typescript
export async function startDaemon(): Promise<void> {
    // 1. 读取 credentials
    const { credentials, machineId } = await authAndSetupMachineIfNeeded();

    // 2. 创建 API 客户端
    const api = await ApiClient.create(credentials);

    // 3. 注册 Machine
    const machine = await api.getOrCreateMachine({
        machineId,
        metadata: initialMachineMetadata,
        daemonState: initialDaemonState
    });

    // 4. 建立 WebSocket 连接
    const apiMachine = api.machineSyncClient(machine);
    apiMachine.connect();
}
```

**Machine 注册逻辑**:

**文件**: `happy-cli/src/api/api.ts:99-161`

```typescript
async getOrCreateMachine(opts: {
    machineId: string,
    metadata: MachineMetadata,
    daemonState?: DaemonState,
}): Promise<Machine> {
    // 使用 credentials 中的 encryption key 加密数据
    let dataEncryptionKey: Uint8Array | null = null;
    let encryptionKey: Uint8Array;
    let encryptionVariant: 'legacy' | 'dataKey';

    if (this.credential.encryption.type === 'dataKey') {
        encryptionVariant = 'dataKey';
        encryptionKey = this.credential.encryption.machineKey;
        let encryptedDataKey = libsodiumEncryptForPublicKey(
            this.credential.encryption.machineKey,
            this.credential.encryption.publicKey
        );
        dataEncryptionKey = new Uint8Array(encryptedDataKey.length + 1);
        dataEncryptionKey.set([0], 0);
        dataEncryptionKey.set(encryptedDataKey, 1);
    } else {
        encryptionKey = this.credential.encryption.secret;
        encryptionVariant = 'legacy';
    }

    // 调用 /v1/machines API
    const response = await axios.post(
        `${configuration.serverUrl}/v1/machines`,
        {
            id: opts.machineId,
            metadata: encodeBase64(encrypt(encryptionKey, encryptionVariant, opts.metadata)),
            daemonState: opts.daemonState ? encodeBase64(encrypt(encryptionKey, encryptionVariant, opts.daemonState)) : undefined,
            dataEncryptionKey: dataEncryptionKey ? encodeBase64(dataEncryptionKey) : undefined
        },
        {
            headers: {
                'Authorization': `Bearer ${this.credential.token}`,  // ← 使用 token 认证
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.machine;
}
```

#### 唯一性分析

**事实**:
- ✅ 一个 CLI 实例**只能绑定一个账户**
- ✅ `access.key` 内容对应一个 `publicKey`（账户 ID）
- ✅ 切换账户需要删除文件并重新认证

**原因**:
1. 文件路径固定：`~/.happy/access.key`
2. 读取逻辑不支持多账户
3. Daemon 启动时只读取此文件
4. Token 和 secret 一一对应账户

---

## ✅ 三个核心问题的验证

### 问题 1: 谁派生 publicKey？

**原假设**: "服务器从 secret 派生 publicKey"

**验证结果**: ❌ **假设错误**

**正确事实**:
1. **客户端**从 secret 派生 publicKey
2. **客户端**直接发送 publicKey 给服务器
3. **服务器**从未接收 secret
4. **服务器**直接使用客户端提供的 publicKey

**代码证据**:

```typescript
// Client: happy-client/sources/auth/authChallenge.ts:4-8
export function authChallenge(secret: Uint8Array) {
    const keypair = sodium.crypto_sign_seed_keypair(secret);  // ← 客户端派生
    const challenge = getRandomBytes(32);
    const signature = sodium.crypto_sign_detached(challenge, keypair.privateKey);
    return { challenge, signature, publicKey: keypair.publicKey };  // ← 返回公钥
}

// Client: happy-client/sources/auth/authGetToken.ts:6-11
const { challenge, signature, publicKey } = authChallenge(secret);
const response = await axios.post(`${API_ENDPOINT}/v1/auth`, {
    publicKey: encodeBase64(publicKey)  // ← 发送客户端派生的 publicKey
});

// Server: happy-server/sources/app/api/routes/authRoutes.ts:19-32
const publicKey = privacyKit.decodeBase64(request.body.publicKey);  // ← 接收
const user = await db.account.upsert({
    where: { publicKey: publicKeyHex },  // ← 直接使用
    create: { publicKey: publicKeyHex }  // ← 直接存储
});
```

---

### 问题 2: CLI 和 Mobile 的 secret 是否相同？

**假设**: CLI 和 Mobile 共享同一个 secret

**验证结果**: ✅ **假设正确**

**正确事实**:
- ✅ CLI 生成的临时 keypair **仅用于加密通道**
- ✅ Mobile 用 CLI 的临时公钥加密**自己的 secret**
- ✅ CLI 解密后得到 **Mobile 的 secret**
- ✅ CLI 和 Mobile **共享同一个 secret**

**数据流**:

```
Mobile 端:
  mobile.secret (32 bytes) ──┐
                             │
                             │ (1) 用 CLI 的临时公钥加密
                             │
                             ├──► encrypted = encrypt(mobile.secret, cli_ephemeral_pubkey)
                             │
                             └──► POST /v1/auth/response { response: encrypted }
                                                   │
                                                   ▼
                                          Server 转发（不解密）
                                                   │
                                                   ▼
CLI 端:                                    GET /v1/auth/request
  cli_ephemeral_keypair ──────────────────┬──► { response: encrypted }
  (仅用于加密通道)                        │
                                          └──► decrypted = decrypt(encrypted, cli_ephemeral_privkey)
                                                   │
                                                   ▼
                                          mobile.secret (same 32 bytes!)
                                                   │
                                                   ▼
                                          ~/.happy/access.key
                                          { token, secret: mobile.secret }
```

**代码证据**:

```typescript
// Mobile 加密自己的 secret
// happy-client/sources/hooks/useConnectTerminal.ts:33-38
const responseV1 = encryptBox(
    decodeBase64(auth.credentials!.secret, 'base64url'),  // ← Mobile 的 secret
    publicKey  // ← CLI 的临时公钥
);
await authApprove(auth.credentials!.token, publicKey, responseV1, responseV2);

// CLI 解密得到 Mobile 的 secret
// happy-cli/src/ui/auth.ts:158-174
let decrypted = decryptWithEphemeralKey(r, keypair.secretKey);  // ← 解密
if (decrypted.length === 32) {
    const credentials = {
        secret: decrypted,  // ← Mobile 的 secret
        token: token
    }
    await writeCredentialsLegacy(credentials);  // ← 保存
}
```

---

### 问题 3: Server 是否知道 secret？

**假设**: Server 从未知道 secret

**验证结果**: ✅ **假设正确**

**正确事实**:
- ✅ Server 只知道 `publicKey`（明文）
- ✅ Server 只知道 `encrypted(secret)`（密文，无法解密）
- ✅ Server **从未知道 secret**

**整个系统的 secret 流向**:

```
┌──────────────────────────────────────────────────────────┐
│  Secret 在整个系统中的流向                                │
└──────────────────────────────────────────────────────────┘

Mobile 创建账户:
  secret (32 bytes) ──┐
                      │ (1) 派生 publicKey
                      ├──────────► publicKey ────────► Server 存储
                      │                                (明文, @unique)
                      │ (2) 本地存储
                      └──────────► Mobile Storage
                                   { token, secret }

CLI 授权登录:
  Mobile.secret ──────┐
                      │ (1) 用临时公钥加密
                      ├──────────► encrypt(secret, cli_temp_pubkey)
                      │                      │
                      │                      ▼
                      │               Server 转发（密文）
                      │               ❌ 无法解密
                      │                      │
                      │                      ▼
                      │               CLI 解密（用临时私钥）
                      │                      │
                      └──────────────────────┴──────► CLI Storage
                                                      ~/.happy/access.key
                                                      { token, secret }

Server 视角:
  ✅ 知道: publicKey (hex encoded)
  ✅ 知道: encrypted(secret) (base64 encoded, 无法解密)
  ❌ 不知道: secret (never received)
```

**API 分析**:

| API 端点 | 接收参数 | Server 知道什么 | Server 不知道什么 |
|---------|---------|----------------|------------------|
| POST /v1/auth | `publicKey`, `challenge`, `signature` | ✅ publicKey | ❌ secret |
| POST /v1/auth/request | `publicKey` (临时) | ✅ 临时公钥 | ❌ 临时私钥 |
| POST /v1/auth/response | `publicKey`, `response` (加密) | ✅ 密文 | ❌ secret |

**关键证据**:

Server 端没有任何代码试图解密 `response`:

```typescript
// happy-server/sources/app/api/routes/authRoutes.ts:160-163
await db.terminalAuthRequest.update({
    where: { id: authRequest.id },
    data: {
        response: request.body.response,  // ← 直接存储密文
        responseAccountId: request.userId
    }
});
// ❌ 没有任何解密逻辑
```

---

## 🔄 修正后的完整流程

### Mobile/Web 创建账户

```typescript
1. Client: secret = randomBytes(32)
2. Client: publicKey = derive(secret)  // ← 客户端派生
3. Client: signature = sign(challenge, secret)
4. Client → Server: POST /v1/auth { publicKey, challenge, signature }
5. Server: verify(signature, publicKey)
6. Server: Account.upsert({ publicKey })  // ← 自动创建
7. Server → Client: { token }
8. Client: 存储 { token, secret }
```

### CLI 授权登录

```typescript
1. CLI: ephemeral_keypair = generate()  // ← 临时密钥
2. CLI → Server: POST /v1/auth/request { publicKey: ephemeral.publicKey }
3. CLI: 显示 QR 码 "happy://terminal?<ephemeral.publicKey>"
4. Mobile: 扫码获取 ephemeral.publicKey
5. Mobile: encrypted = encrypt(mobile.secret, ephemeral.publicKey)
6. Mobile → Server: POST /v1/auth/response { publicKey, response: encrypted }
   (需要 mobile.token 认证)
7. Server: 存储 encrypted（无法解密）
8. CLI → Server: 轮询 GET /v1/auth/request
9. Server → CLI: { state: 'authorized', token, response: encrypted }
10. CLI: mobile_secret = decrypt(encrypted, ephemeral.privateKey)
11. CLI: 写入 ~/.happy/access.key { token, secret: mobile_secret }
12. ✅ CLI 和 Mobile 共享同一个 secret
```

---

## 🎯 对平台集成方案的影响

### 原方案假设

**假设 1**: 调用 `/v1/auth` 可以自动创建账户
**验证**: ✅ **正确** - Server 使用 `upsert` 自动创建

**假设 2**: CLI 从 `~/.happy/credentials.json` 读取
**验证**: ❌ **错误** - 实际文件名是 `access.key`

**假设 3**: Machine 自动注册
**验证**: ✅ **正确** - Daemon 启动时调用 `/v1/machines` 自动 upsert

**假设 4**: Server 从 secret 派生 publicKey
**验证**: ❌ **错误** - 客户端派生后发送给 Server

### 修正后的实现方案

```typescript
// ========================================
// 平台后端实现
// ========================================

import tweetnacl from 'tweetnacl';
import axios from 'axios';
import { SSH2Client } from 'ssh2';

// Step 1: 生成账户
const secret = randomBytes(32);

// Step 2: 客户端派生 publicKey（不是让服务器派生！）
const keypair = tweetnacl.sign.keyPair.fromSeed(secret);
const publicKey = keypair.publicKey;

// Step 3: 生成 challenge-response
const challenge = randomBytes(32);
const signature = tweetnacl.sign.detached(challenge, keypair.secretKey);

// Step 4: 调用 /v1/auth 创建账户
const response = await axios.post('https://api.cluster-fluster.com/v1/auth', {
    publicKey: encodeBase64(publicKey),      // ← 发送客户端派生的公钥
    challenge: encodeBase64(challenge),
    signature: encodeBase64(signature)
});

const token = response.data.token;

// Step 5: 平台数据库存储映射关系
await db.platform.create({
    serverInstanceId: 'xxx',
    happyAccountId: publicKeyToHex(publicKey),  // ← 用于关联
    token: token,
    secret: encodeBase64(secret)
});

// Step 6: SSH 连接到服务器
const ssh = new SSH2Client();
await ssh.connect({
    host: serverInstance.ip,
    username: 'root',
    privateKey: serverInstance.sshKey
});

// Step 7: 写入 access.key（注意文件名！）
const accessKeyContent = JSON.stringify({
    token: token,
    secret: encodeBase64(secret)  // ← Base64 编码
}, null, 2);

await ssh.exec(`mkdir -p ~/.happy`);
await ssh.writeFile('~/.happy/access.key', accessKeyContent);  // ← 正确文件名

// Step 8: 生成 machineId（或让 daemon 自动生成）
const machineId = uuidv4();
const settingsContent = JSON.stringify({
    onboardingCompleted: true,
    machineId: machineId
}, null, 2);

await ssh.writeFile('~/.happy/settings.json', settingsContent);

// Step 9: 启动 daemon
await ssh.exec('happy daemon start');

// Step 10: 验证 daemon 启动成功
await delay(3000);
const daemonStatus = await ssh.exec('happy daemon status');
console.log('Daemon status:', daemonStatus);

await ssh.disconnect();

// ========================================
// 完成！
// ========================================
// - Account 已在 Server 创建
// - Machine 已自动注册
// - Daemon 已启动并连接 WebSocket
// - 平台可通过 API 管理此 Machine
```

### 关键修正点

| 项目 | 原方案 | 修正后 | 影响 |
|-----|--------|--------|------|
| 文件名 | `credentials.json` | `access.key` | ✅ 必须修正 |
| publicKey 派生 | Server 派生 | Client 派生 | ✅ 必须修正 |
| secret 编码 | 未说明 | Base64 编码 | ✅ 必须添加 |
| machineId | 未提及 | 需要生成或自动 | ⚠️ 建议添加 |

---

## 📊 结论与建议

### 核心发现总结

1. ✅ **账户本质**: 一个 32 字节的 secret key
2. ✅ **publicKey 派生**: 客户端从 secret 派生后发送给服务器
3. ✅ **CLI 和 Mobile 共享 secret**: 通过端到端加密通道传输
4. ✅ **Server 从未知道 secret**: 仅存储 publicKey 和加密数据
5. ✅ **原方案核心逻辑可行**: 需修正实现细节

### 方案可行性评估

**✅ 完全可行的部分**:
- `/v1/auth` 自动创建账户（upsert 语义）
- CLI 从文件读取 credentials
- Machine 自动注册（daemon 启动时）
- 无需修改 happy-server 或 happy-cli

**⚠️ 需要修正的部分**:
- 文件名：`access.key`（非 `credentials.json`）
- 客户端派生 publicKey（非服务器派生）
- secret 需要 base64 编码
- 需要处理 machineId

### 实施建议

1. **密钥管理**:
   - 使用 `tweetnacl` 库进行密钥派生
   - 妥善存储 secret 和 token
   - 考虑密钥轮换策略

2. **错误处理**:
   - 验证 `/v1/auth` 响应
   - 处理 SSH 连接失败
   - 处理 daemon 启动失败

3. **安全性**:
   - SSH 传输已加密
   - secret 从未发送给 Server
   - access.key 文件权限 600

4. **监控**:
   - 验证 daemon 状态
   - 监控 Machine 注册状态
   - 通过 WebSocket 事件监控

---

## 📚 参考文件索引

### Server 端
- `happy-server/prisma/schema.prisma:22-55` - Account 模型定义
- `happy-server/sources/app/api/routes/authRoutes.ts:9-39` - /v1/auth 端点
- `happy-server/sources/app/api/routes/authRoutes.ts:126-166` - /v1/auth/response 端点
- `happy-server/sources/app/api/routes/machinesRoutes.ts:11-106` - /v1/machines 端点

### CLI 端
- `happy-cli/src/configuration.ts:50` - access.key 路径定义
- `happy-cli/src/persistence.ts:137-184` - credentials 读取逻辑
- `happy-cli/src/ui/auth.ts:16-218` - 认证流程实现
- `happy-cli/src/daemon/run.ts:34-550` - daemon 启动逻辑
- `happy-cli/src/api/api.ts:99-161` - Machine 注册逻辑

### Client 端
- `happy-client/sources/auth/authChallenge.ts:4-9` - publicKey 派生
- `happy-client/sources/auth/authGetToken.ts:6-12` - 账户创建
- `happy-client/sources/auth/authApprove.ts:11-50` - CLI 授权
- `happy-client/sources/hooks/useConnectTerminal.ts:23-54` - 扫码处理
- `happy-client/sources/app/(app)/index.tsx:39-50` - 创建账户 UI

---

**报告完成日期**: 2025-01-XX
**调查人员**: Claude Code
**审核状态**: 已完成代码验证
