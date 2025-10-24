# Provider 集成通用指南

**版本**: 1.0
**日期**: 2025-10-23
**状态**: Active
**作者**: Fugen, Claude

**Tags:** #implementation:guide #component:provider #howto:integration #reference:best-practices

---

## 目录

1. [概述](#概述)
2. [准备工作](#准备工作)
3. [实现步骤](#实现步骤)
4. [接口实现清单](#接口实现清单)
5. [测试策略](#测试策略)
6. [配置管理](#配置管理)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)
9. [示例参考](#示例参考)

---

## 概述

本文档提供添加新 Provider 的完整指南，适用于任何云厂商或容器平台的集成。

### 目标读者

- 后端开发工程师
- DevOps 工程师
- 想要集成新云厂商的团队成员

### 前置要求

```
技术栈:
✅ TypeScript
✅ Node.js
✅ 熟悉异步编程
✅ 了解 REST API

知识要求:
✅ 理解 Provider 架构设计
✅ 阅读过 resource-provider-architecture.md
✅ 了解目标云厂商的 API 文档
```

### 时间估算

```
简单 Provider (Docker):        1-2 天
中等 Provider (阿里云/腾讯云): 3-5 天
复杂 Provider (AWS/Azure):    5-7 天
```

---

## 准备工作

### 1. 研究目标云厂商

```
需要了解的信息:

API文档:
- 认证方式（AccessKey、OAuth、Token等）
- 创建实例的 API
- 查询实例的 API
- 启动/停止/重启/删除的 API
- 实例状态的定义

规格信息:
- 可用的实例规格（CPU/内存配置）
- 规格命名规则
- 价格信息

区域信息:
- 支持的区域列表
- 区域代码命名规则

镜像信息:
- 支持的操作系统
- 镜像ID格式
- 如何查询可用镜像
```

### 2. 获取测试账号

```
测试环境:
✅ 获取测试账号的 AccessKey/SecretKey
✅ 确认测试环境的 API Endpoint
✅ 确认测试配额（避免创建过多实例）

开发环境:
✅ 安装官方 SDK（如果有）
✅ 配置本地开发环境
✅ 测试 API 连通性
```

### 3. 规划实现方案

```
定义 Provider 类型:
- 类型名称: 例如 'aliyun-ecs', 'tencent-cvm'
- 显示名称: 例如 '阿里云 ECS', '腾讯云 CVM'

规格映射策略:
- 2C4G 对应哪个规格?
- 4C8G 对应哪个规格?
- 如何查询和缓存规格列表?

状态映射策略:
- 云厂商的状态值如何映射到统一状态?
- 是否有特殊的中间状态?
```

---

## 实现步骤

### Step 1: 创建 Provider 文件

```
文件位置: server/lib/providers/<provider-name>.ts

示例: server/lib/providers/aliyun.ts
```

### Step 2: 定义 Provider 类

```
基本结构:

import { BaseProvider } from './baseProvider';
import { ProviderType, ResourceStatus, ... } from './types';

export class AliyunProvider extends BaseProvider {
  readonly type = ProviderType.ALIYUN_ECS;
  readonly name = '阿里云 ECS';

  private client: any; // SDK client

  protected async validateConfig(config: ProviderConfig): Promise<void> {
    // 验证配置
  }

  protected async setupClient(config: ProviderConfig): Promise<void> {
    // 初始化 SDK client
  }

  async createResource(spec: ResourceSpec): Promise<ResourceInfo> {
    // 创建资源
  }

  async getResourceInfo(resourceId: string): Promise<ResourceInfo> {
    // 查询资源
  }

  async startResource(resourceId: string): Promise<void> {
    // 启动资源
  }

  async stopResource(resourceId: string): Promise<void> {
    // 停止资源
  }

  async deleteResource(resourceId: string): Promise<void> {
    // 删除资源
  }

  protected async performHealthCheck(): Promise<boolean> {
    // 健康检查
  }

  // 辅助方法
  private mapStatus(providerStatus: string): ResourceStatus {
    // 状态映射
  }
}
```

### Step 3: 注册到工厂

```
文件位置: server/lib/providers/factory.ts

添加导入:
import { AliyunProvider } from './aliyun';

注册Provider:
ProviderFactory.register(ProviderType.ALIYUN_ECS, AliyunProvider);
```

### Step 4: 添加配置

```
文件位置: server/config/providers.ts

添加配置:
export const PROVIDER_CONFIGS = {
  // ... existing providers
  'aliyun-ecs': {
    enabled: true,
    credentials: {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    },
    region: 'cn-hangzhou',
    endpoint: 'https://ecs.aliyuncs.com',
  },
};
```

### Step 5: 编写测试

```
文件位置: server/lib/providers/<provider-name>.spec.ts

测试结构:
describe('AliyunProvider', () => {
  describe('initialize', () => {
    it('should initialize with valid config', async () => {});
    it('should fail with invalid config', async () => {});
  });

  describe('createResource', () => {
    it('should create resource successfully', async () => {});
    it('should handle API errors', async () => {});
  });

  // ... 其他测试
});
```

### Step 6: 更新类型定义

```
文件位置: server/lib/providers/types.ts

添加 Provider 类型:
export enum ProviderType {
  // ... existing types
  ALIYUN_ECS = 'aliyun-ecs',
}
```

---

## 接口实现清单

### 必需方法（9个）

#### 1. `validateConfig(config: ProviderConfig)`

```
目的: 验证配置是否有效

检查项:
✅ credentials 中的必需字段存在
✅ region 是否有效（如果需要）
✅ endpoint 格式正确（如果有）

示例:
protected async validateConfig(config: ProviderConfig): Promise<void> {
  const { accessKeyId, accessKeySecret } = config.credentials;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error('Missing AccessKey or SecretKey');
  }

  // 验证 region
  const validRegions = ['cn-hangzhou', 'cn-beijing', 'cn-shanghai'];
  if (config.region && !validRegions.includes(config.region)) {
    throw new Error(`Invalid region: ${config.region}`);
  }
}
```

#### 2. `setupClient(config: ProviderConfig)`

```
目的: 初始化 API 客户端

任务:
✅ 创建 SDK 实例
✅ 配置认证信息
✅ 设置 endpoint
✅ 测试连接性（可选）

示例:
protected async setupClient(config: ProviderConfig): Promise<void> {
  // 使用官方 SDK
  const Core = require('@alicloud/pop-core');

  this.client = new Core({
    accessKeyId: config.credentials.accessKeyId,
    accessKeySecret: config.credentials.accessKeySecret,
    endpoint: config.endpoint || 'https://ecs.aliyuncs.com',
    apiVersion: '2014-05-26',
  });

  // 可选：测试连接
  try {
    await this.client.request('DescribeRegions', {});
  } catch (error) {
    throw new Error(`Failed to connect to API: ${error.message}`);
  }
}
```

#### 3. `createResource(spec: ResourceSpec)`

```
目的: 创建新的计算资源

流程:
1. 映射规格 → 厂商特定的实例类型
2. 选择镜像 → 厂商的镜像ID
3. 调用创建 API
4. 返回资源信息

示例:
async createResource(spec: ResourceSpec): Promise<ResourceInfo> {
  this.ensureInitialized();

  // 1. 映射规格
  const instanceType = await this.mapSpecToInstanceType(spec);

  // 2. 选择镜像
  const imageId = await this.selectImage(spec.image || 'ubuntu-22.04');

  // 3. 调用 API
  const response = await this.client.request('RunInstances', {
    RegionId: this.config.region,
    ImageId: imageId,
    InstanceType: instanceType,
    InternetMaxBandwidthOut: 5, // 5 Mbps
    SystemDisk: {
      Size: spec.disk,
      Category: 'cloud_efficiency',
    },
    InstanceName: `vibebox-${Date.now()}`,
    Password: this.generatePassword(),
  });

  const instanceId = response.InstanceIdSets.InstanceIdSet[0];

  // 4. 返回资源信息
  return {
    id: instanceId,
    status: ResourceStatus.CREATING,
    createdAt: new Date(),
  };
}
```

#### 4. `getResourceInfo(resourceId: string)`

```
目的: 查询资源的详细信息

返回:
- ID
- 状态
- IP地址
- SSH信息
- 元数据

示例:
async getResourceInfo(resourceId: string): Promise<ResourceInfo> {
  this.ensureInitialized();

  const response = await this.client.request('DescribeInstances', {
    InstanceIds: JSON.stringify([resourceId]),
  });

  const instance = response.Instances.Instance[0];

  if (!instance) {
    throw new Error(`Instance ${resourceId} not found`);
  }

  return {
    id: instance.InstanceId,
    status: this.mapStatus(instance.Status),
    ipAddress: instance.PublicIpAddress?.IpAddress[0],
    privateIp: instance.VpcAttributes?.PrivateIpAddress?.IpAddress[0],
    sshPort: 22,
    sshUser: 'root',
    metadata: {
      instanceType: instance.InstanceType,
      region: instance.RegionId,
      createdTime: instance.CreationTime,
    },
    createdAt: new Date(instance.CreationTime),
  };
}
```

#### 5. `startResource(resourceId: string)`

```
目的: 启动已停止的资源

示例:
async startResource(resourceId: string): Promise<void> {
  this.ensureInitialized();

  await this.client.request('StartInstance', {
    InstanceId: resourceId,
  });
}
```

#### 6. `stopResource(resourceId: string)`

```
目的: 停止运行中的资源

注意:
- 优雅关机 vs 强制关机
- 是否释放公网IP

示例:
async stopResource(resourceId: string): Promise<void> {
  this.ensureInitialized();

  await this.client.request('StopInstance', {
    InstanceId: resourceId,
    ForceStop: false, // 优雅关机
  });
}
```

#### 7. `restartResource(resourceId: string)`

```
目的: 重启资源

选项A: 如果 API 有专门的重启接口
async restartResource(resourceId: string): Promise<void> {
  this.ensureInitialized();

  await this.client.request('RebootInstance', {
    InstanceId: resourceId,
  });
}

选项B: 使用 BaseProvider 的默认实现
(BaseProvider 会自动调用 stop → wait → start)
不需要覆盖此方法
```

#### 8. `deleteResource(resourceId: string)`

```
目的: 永久删除资源

注意:
- 是否强制删除
- 是否同时删除快照/磁盘

示例:
async deleteResource(resourceId: string): Promise<void> {
  this.ensureInitialized();

  await this.client.request('DeleteInstance', {
    InstanceId: resourceId,
    Force: true, // 强制删除
  });
}
```

#### 9. `performHealthCheck()`

```
目的: 检查 Provider 是否可用

方法: 调用一个轻量级API（不会产生费用）

示例:
protected async performHealthCheck(): Promise<boolean> {
  try {
    await this.client.request('DescribeRegions', {});
    return true;
  } catch (error) {
    console.error(`Health check failed:`, error);
    return false;
  }
}
```

### 辅助方法（推荐）

#### 1. 规格映射

```
private async mapSpecToInstanceType(spec: ResourceSpec): Promise<string> {
  // 简单映射
  if (spec.cpu === 2 && spec.memory === 4) {
    return 'ecs.t5-c1m2.large';
  }
  if (spec.cpu === 4 && spec.memory === 8) {
    return 'ecs.c5.xlarge';
  }

  // 默认
  return 'ecs.t5-c1m2.large';
}

// 或者动态查询（推荐）
private async mapSpecToInstanceType(spec: ResourceSpec): Promise<string> {
  const instanceTypes = await this.getAvailableInstanceTypes();

  // 筛选符合条件的规格
  const matched = instanceTypes.filter(type =>
    type.cpuCores >= spec.cpu &&
    type.memorySize >= spec.memory
  );

  if (matched.length === 0) {
    throw new Error('No matching instance type found');
  }

  // 选择最便宜的
  matched.sort((a, b) => a.price - b.price);
  return matched[0].instanceTypeId;
}
```

#### 2. 状态映射

```
private mapStatus(providerStatus: string): ResourceStatus {
  const mapping: Record<string, ResourceStatus> = {
    'Pending': ResourceStatus.CREATING,
    'Starting': ResourceStatus.STARTING,
    'Running': ResourceStatus.RUNNING,
    'Stopping': ResourceStatus.STOPPING,
    'Stopped': ResourceStatus.STOPPED,
    'Deleted': ResourceStatus.DELETED,
  };

  return mapping[providerStatus] || ResourceStatus.ERROR;
}
```

#### 3. 镜像选择

```
private async selectImage(imageName: string): Promise<string> {
  // 预定义映射
  const imageMapping: Record<string, string> = {
    'ubuntu-22.04': 'img-ubuntu-22.04-x64',
    'ubuntu-20.04': 'img-ubuntu-20.04-x64',
    'centos-7': 'img-centos-7.9-x64',
  };

  const imageId = imageMapping[imageName];

  if (!imageId) {
    throw new Error(`Unsupported image: ${imageName}`);
  }

  return imageId;
}
```

---

## 测试策略

### 单元测试

```
文件: <provider-name>.spec.ts

测试框架: Vitest

测试覆盖:
1. 配置验证
   ✅ 有效配置
   ✅ 无效配置

2. 初始化
   ✅ 成功初始化
   ✅ 认证失败

3. 创建资源
   ✅ 正常创建
   ✅ 参数错误
   ✅ 配额超限

4. 查询资源
   ✅ 查询存在的资源
   ✅ 查询不存在的资源

5. 生命周期操作
   ✅ 启动/停止/重启/删除

6. 状态映射
   ✅ 所有状态值有映射
   ✅ 未知状态处理

7. 健康检查
   ✅ API 可用
   ✅ API 不可用

覆盖率目标: > 85%
```

### Mock 策略

```
使用 Mock 而非真实 API:

import { vi } from 'vitest';

describe('AliyunProvider', () => {
  let provider: AliyunProvider;
  let mockClient: any;

  beforeEach(() => {
    // Mock SDK client
    mockClient = {
      request: vi.fn(),
    };

    provider = new AliyunProvider();
    (provider as any).client = mockClient;
  });

  it('should create resource', async () => {
    // Mock API 响应
    mockClient.request.mockResolvedValue({
      InstanceIdSets: {
        InstanceIdSet: ['i-abc123'],
      },
    });

    const resource = await provider.createResource({
      cpu: 2,
      memory: 4,
      disk: 40,
    });

    expect(resource.id).toBe('i-abc123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'RunInstances',
      expect.any(Object)
    );
  });
});
```

### 集成测试

```
文件: <provider-name>.integration.spec.ts

环境: 真实的测试账号

测试流程:
1. 创建实例
2. 等待运行
3. 查询信息
4. 停止实例
5. 启动实例
6. 删除实例

示例:
describe('AliyunProvider Integration', () => {
  let provider: AliyunProvider;
  let resourceId: string;

  beforeAll(async () => {
    provider = new AliyunProvider();
    await provider.initialize({
      type: ProviderType.ALIYUN_ECS,
      credentials: {
        accessKeyId: process.env.ALIYUN_TEST_KEY_ID!,
        accessKeySecret: process.env.ALIYUN_TEST_KEY_SECRET!,
      },
      region: 'cn-hangzhou',
    });
  });

  it('should complete full lifecycle', async () => {
    // 1. 创建
    const resource = await provider.createResource({
      cpu: 1,
      memory: 1,
      disk: 20,
    });
    resourceId = resource.id;

    // 2. 等待运行
    await provider.waitForStatus(resourceId, ResourceStatus.RUNNING, 600000);

    // 3. 查询
    const info = await provider.getResourceInfo(resourceId);
    expect(info.status).toBe(ResourceStatus.RUNNING);
    expect(info.ipAddress).toBeDefined();

    // 4. 停止
    await provider.stopResource(resourceId);
    await provider.waitForStatus(resourceId, ResourceStatus.STOPPED, 120000);

    // 5. 启动
    await provider.startResource(resourceId);
    await provider.waitForStatus(resourceId, ResourceStatus.RUNNING, 120000);

    // 6. 删除
    await provider.deleteResource(resourceId);
  }, 900000); // 15分钟超时
});
```

---

## 配置管理

### 环境变量

```
# .env.example

# 阿里云
ALIYUN_ACCESS_KEY_ID=LTAI...
ALIYUN_ACCESS_KEY_SECRET=abc123...
ALIYUN_REGION=cn-hangzhou
ALIYUN_ENABLED=true

# 腾讯云
TENCENT_SECRET_ID=AKID...
TENCENT_SECRET_KEY=xyz789...
TENCENT_REGION=ap-guangzhou
TENCENT_ENABLED=true
```

### 配置文件

```
// server/config/providers.ts

export const PROVIDER_CONFIGS = {
  'aliyun-ecs': {
    enabled: process.env.ALIYUN_ENABLED === 'true',
    credentials: {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    },
    region: process.env.ALIYUN_REGION || 'cn-hangzhou',
    options: {
      // Provider 特定配置
      timeout: 30000,
      retries: 3,
    },
  },
};
```

### 动态配置

```
支持从数据库加载配置（生产环境推荐）:

// server/services/providerConfigService.ts

export class ProviderConfigService {
  async getConfig(providerType: ProviderType): Promise<ProviderConfig> {
    const config = await db.providerConfig.findUnique({
      where: { type: providerType },
    });

    if (!config || !config.enabled) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    return {
      type: providerType,
      credentials: decrypt(config.credentials), // 解密
      region: config.region,
      options: config.options,
    };
  }
}
```

---

## 最佳实践

### 1. 错误处理

```
DO: 区分错误类型
✅ try {
    await this.client.createInstance(...);
  } catch (error) {
    if (error.code === 'InvalidParameter') {
      throw new Error('Invalid parameters');
    }
    if (error.code === 'InsufficientStock') {
      throw new Error('Insufficient inventory');
    }
    throw error;
  }

DON'T: 忽略错误
❌ try {
    await this.client.createInstance(...);
  } catch (error) {
    // 什么都不做
  }
```

### 2. 日志记录

```
DO: 记录关键操作
✅ console.log(`[AliyunProvider] Creating instance with spec:`, spec);
  console.log(`[AliyunProvider] Instance created: ${instanceId}`);

DON'T: 输出敏感信息
❌ console.log(`[AliyunProvider] AccessKey: ${this.accessKeyId}`);
```

### 3. 超时处理

```
DO: 设置合理超时
✅ await provider.waitForStatus(id, 'RUNNING', 600000); // 10分钟

DON'T: 无限等待
❌ while (true) {
    const status = await provider.getResourceInfo(id);
    if (status === 'RUNNING') break;
  }
```

### 4. 资源清理

```
DO: 测试后清理资源
✅ afterEach(async () => {
    if (resourceId) {
      await provider.deleteResource(resourceId);
    }
  });

DON'T: 留下测试资源
❌ // 不清理，浪费钱
```

### 5. 缓存策略

```
DO: 缓存不常变的数据
✅ private instanceTypesCache: InstanceType[] | null = null;
  private cacheExpiry: number = 0;

  async getAvailableInstanceTypes(): Promise<InstanceType[]> {
    if (this.instanceTypesCache && Date.now() < this.cacheExpiry) {
      return this.instanceTypesCache;
    }

    const types = await this.client.request('DescribeInstanceTypes', {});
    this.instanceTypesCache = types;
    this.cacheExpiry = Date.now() + 3600000; // 1小时

    return types;
  }
```

---

## 常见问题

### Q1: 如何调试 API 调用？

```
方法1: 启用 SDK 调试日志
const client = new Core({
  ...config,
  debug: true, // 输出详细日志
});

方法2: 使用请求拦截器
client.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});

方法3: 使用抓包工具
- Charles Proxy
- Wireshark
```

### Q2: 如何处理 API 限流？

```
实现指数退避重试:

async requestWithRetry(action: string, params: any, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await this.client.request(action, params);
    } catch (error) {
      if (error.code === 'Throttling' && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, 8s, 16s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Q3: 如何测试不同区域？

```
使用参数化测试:

describe.each([
  ['cn-hangzhou', '杭州'],
  ['cn-beijing', '北京'],
  ['cn-shanghai', '上海'],
])('Region: %s (%s)', (region, name) => {
  it('should create instance', async () => {
    const provider = new AliyunProvider();
    await provider.initialize({
      ...config,
      region,
    });

    const resource = await provider.createResource(spec);
    expect(resource.id).toBeDefined();
  });
});
```

### Q4: Provider 初始化失败怎么办？

```
检查清单:
1. ✅ AccessKey/SecretKey 是否正确
2. ✅ 网络是否可达（防火墙/代理）
3. ✅ Endpoint 是否正确
4. ✅ Region 是否有效
5. ✅ SDK 版本是否兼容

调试步骤:
1. 测试认证: 调用最简单的 API (如 DescribeRegions)
2. 检查错误码: 根据错误码查文档
3. 对比官方示例: 看参数是否缺失
```

---

## 示例参考

### 完整示例：DigitalOcean Provider

```
// server/lib/providers/digitalocean.ts

import { BaseProvider } from './baseProvider';
import axios, { AxiosInstance } from 'axios';

export class DigitalOceanProvider extends BaseProvider {
  readonly type = ProviderType.DIGITALOCEAN;
  readonly name = 'DigitalOcean';

  private client: AxiosInstance;
  private apiToken: string;

  protected async validateConfig(config: ProviderConfig): Promise<void> {
    if (!config.credentials.apiToken) {
      throw new Error('Missing API token');
    }
    this.apiToken = config.credentials.apiToken;
  }

  protected async setupClient(config: ProviderConfig): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://api.digitalocean.com/v2',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createResource(spec: ResourceSpec): Promise<ResourceInfo> {
    this.ensureInitialized();

    const response = await this.client.post('/droplets', {
      name: `vibebox-${Date.now()}`,
      region: this.config.region || 'sgp1',
      size: this.mapSpecToSize(spec),
      image: 'ubuntu-22-04-x64',
      ssh_keys: [],
    });

    return {
      id: response.data.droplet.id.toString(),
      status: ResourceStatus.CREATING,
      createdAt: new Date(),
    };
  }

  async getResourceInfo(resourceId: string): Promise<ResourceInfo> {
    this.ensureInitialized();

    const response = await this.client.get(`/droplets/${resourceId}`);
    const droplet = response.data.droplet;

    return {
      id: droplet.id.toString(),
      status: this.mapStatus(droplet.status),
      ipAddress: droplet.networks?.v4?.find(n => n.type === 'public')?.ip_address,
      privateIp: droplet.networks?.v4?.find(n => n.type === 'private')?.ip_address,
      sshPort: 22,
      sshUser: 'root',
      metadata: {
        size: droplet.size.slug,
        region: droplet.region.slug,
      },
      createdAt: new Date(droplet.created_at),
    };
  }

  async startResource(resourceId: string): Promise<void> {
    await this.client.post(`/droplets/${resourceId}/actions`, {
      type: 'power_on',
    });
  }

  async stopResource(resourceId: string): Promise<void> {
    await this.client.post(`/droplets/${resourceId}/actions`, {
      type: 'power_off',
    });
  }

  async deleteResource(resourceId: string): Promise<void> {
    await this.client.delete(`/droplets/${resourceId}`);
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      await this.client.get('/account');
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapSpecToSize(spec: ResourceSpec): string {
    if (spec.cpu === 1 && spec.memory === 1) return 's-1vcpu-1gb';
    if (spec.cpu === 2 && spec.memory === 4) return 's-2vcpu-4gb';
    if (spec.cpu === 4 && spec.memory === 8) return 's-4vcpu-8gb';
    return 's-2vcpu-4gb';
  }

  private mapStatus(doStatus: string): ResourceStatus {
    const mapping: Record<string, ResourceStatus> = {
      'new': ResourceStatus.CREATING,
      'active': ResourceStatus.RUNNING,
      'off': ResourceStatus.STOPPED,
      'archive': ResourceStatus.DELETED,
    };
    return mapping[doStatus] || ResourceStatus.ERROR;
  }
}
```

---

## 总结

遵循本指南，你可以快速集成新的 Provider。关键步骤：

1. ✅ 研究目标云厂商 API
2. ✅ 实现 9 个必需方法
3. ✅ 注册到工厂
4. ✅ 编写完整测试
5. ✅ 配置环境变量
6. ✅ 上线前检查

**文档历史**:
- 2025-10-23: 初始版本创建
