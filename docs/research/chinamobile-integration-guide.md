# China Mobile Cloud API Integration Guide

**Tags:** #chinamobile #methodology #debugging #decision-making

**Purpose:** Reference guide for debugging issues or adding new interfaces

---

## 🎯 Core Decisions & Lessons

### Key Decision: Use Official Node SDK as the Sole Source of Truth

**Why:**
1. ✅ Official documentation is incomplete/inaccurate
2. ✅ SDK source code is the most reliable reference
3. ✅ SDK has been officially tested and verified
4. ❌ Don't trust online example code
5. ❌ Don't attempt "creative" implementations

**Core Principle:** **Zero Modification > Custom Solutions**
- Use the official SDK's approach, don't modify it
- When encountering issues, check how the SDK does it first
- Don't try to "optimize" or "improve" the SDK's methods

---

## 📦 How to Obtain and Use Official SDK

### Download Node SDK

**Official SDK Package:**
- Name: `@ecloud/ecloud-sdk-ecs`
- Version: 1.0.1 (as of 2025-10-24)
- Available via npm from China Mobile Cloud registry

**Installation Steps:**

```bash
# Configure China Mobile Cloud npm registry
npm config set registry https://ecloud.10086.cn/api/query/developer/nexus/repository/npm-group/

# Install required packages for ECS (Elastic Compute Service)
npm install @ecloud/ecloud-sdk-core
npm install @ecloud/ecloud-sdk-ecs
```

**Note:**
- All product SDKs require `@ecloud/ecloud-sdk-core` as a dependency
- Check the SDK Center at China Mobile Cloud Developer Portal for complete SDK list
- Registry configuration is essential for accessing official packages

**SDK Directory Structure:**
```
ecloud-sdk-ecs/
├── package/v1/
│   ├── Client.js          ← KEY FILE! All API definitions
│   ├── model/             ← Request/response models
│   └── public-api.d.ts
└── ecloud-sdk-core/
    ├── ApiClient.js       ← KEY FILE! Gateway invocation logic
    └── ...
```

### Key Files Explained

**1. Client.js - API Method Definitions**

This file reveals:
- ✅ All available API action names
- ✅ Parameter types (pathParameter vs bodyParameter)
- ✅ SDK version number

```javascript
// Example: Finding vmStart definition
Client.prototype.vmStart = function (vmStartRequest) {
    this.httpRequest.action = "vmStart";  // ← action name
    this.httpRequest.body = vmStartRequest;
    var resp = this.apiClient.sendRequest(this.httpRequest, this.config);
    return resp;
};
```

**2. ApiClient.js - Gateway Invocation Logic**

This file reveals:
- ✅ Gateway URL
- ✅ SDK version
- ✅ Request format
- ✅ Response parsing method

```javascript
// Key configurations
SDK_PORTAL_GATEWAY_URL = "/api/query/openapi/apim/request/sdk";
SDK_VERSION = "1.0.1";

// Response parsing
JSON.parse(result.data['body']['responseBody'])  // ← Double-nested JSON
```

---

## 🔍 Debugging Methodology

### When Encountering API Issues

**Step 1: Compare Against Node SDK Source Code**

```bash
# Find the corresponding API method
grep -n "vmStart" Client.js

# View complete method definition
sed -n '394,399p' Client.js
```

**Checklist:**
- [ ] Is the action name exactly the same? (case, spelling)
- [ ] Is the parameter type correct? (pathParameter / bodyParameter)
- [ ] Is the SDK version correct?
- [ ] Does the request format match the SDK?

**Step 2: Verify Parameter Format**

```bash
# Check request model
cat model/VmStartRequest.d.ts

# Check path parameters
cat model/VmStartPath.js
```

**Common Mistakes:**
- ❌ Wrong parameter location (should use pathParameter instead of bodyParameter)
- ❌ Action name typo (`batchStop` vs `vmBatchStop`)
- ❌ SDK version mismatch

**Step 3: Use Proper Debugging Tools**

```typescript
// Log complete request
console.log('Request:', JSON.stringify({
  action,
  params,
  sdkVersion: this.SDK_VERSION
}, null, 2));

// Log raw response (before parsing)
console.log('Raw response:', response.data);

// Then parse
const parsed = JSON.parse(response.data.body.responseBody);
console.log('Parsed:', parsed);
```

---

## ⚠️ Critical Lessons Learned

### 1. SDK Version Compatibility Issue

**Problem:** SDK 1.1.22 completely doesn't work in Suzhou pool

**Discovery Process:**
- Testing SDK 1.0.1 → ✅ All basic operations succeed
- Testing SDK 1.1.22 → ❌ All failed with "Gateway request failed"
- Testing batch operations + 1.1.22 → ❌ "Invalid SDK,1.1.22,batchStop"

**Conclusion:** Different pools support different SDK versions

**Lesson:**
```typescript
// ❌ Don't assume newer is better
sdkVersion: '1.1.22'  // May not work

// ✅ Use official Node SDK version
sdkVersion: '1.0.1'   // Verified working
```

### 2. The Truth About Batch Operations

**Problem:** Python SDK has batchStart/Stop, why can't we use them?

**Investigation Process:**
1. Python SDK 1.1.22 has batch operation methods ✅
2. But SDK 1.1.22 doesn't work in our environment ❌
3. Node SDK 1.0.1 has NO batch operation methods at all ❌

**Conclusion:** Official Node SDK simply doesn't support batch operations

**Lesson:**
```typescript
// ❌ Don't try to "port" Python SDK features
async batchStop() { ... }  // Doesn't exist in Node SDK

// ✅ Use what Node SDK has
async stopInstances(ids: string[]) {
  return Promise.all(ids.map(id => this.stopInstance(id)));
}
```

### 3. Parameter Location Issue

**Problem:** vmGetServerDetail kept returning "not authorized"

**Wrong Code:**
```typescript
// ❌ Wrong
await client.portalRequest('vmGetServerDetail', {
  bodyParameter: { serverId: instanceId }
});
```

**Correct Code:**
```typescript
// ✅ Correct (learned from SDK)
await client.portalRequest('vmGetServerDetail', {
  pathParameter: { serverId: instanceId }  // ← Critical!
});
```

**How We Found It:**
1. Checked Node SDK's Request model
2. Discovered it uses `VmGetServerDetailPath` (not Body)
3. Changed to pathParameter → immediately succeeded

**Lesson:** Always refer to SDK's model definitions

### 4. The Network ID Pitfall

**Problem:** networks parameter kept failing when creating instances

**Mistakes We Tried:**
```typescript
// ❌ Using VPC ID
networks: { networkId: 'vpc_id' }

// ❌ Using Subnet ID
networks: { networkId: 'subnet_id' }

// ❌ Using array
networks: [{ networkId: '...' }]
```

**Correct Approach:**
```typescript
// ✅ Extract networkId from existing instance
// 1. Query existing instance
const instances = await client.listInstances();

// 2. Check portDetail
console.log(instances[0].portDetail);

// 3. Find network ID (not VPC or Subnet ID!)
networks: {
  networkId: 'a40618a7-6605-461f-8c22-dbd43510c717'  // ← Special network ID
}
```

**Lesson:** Don't guess parameter values, extract from existing resources

---

## 🛠️ How to Add New Interfaces

### Standard Workflow

**1. Check Node SDK**

```bash
# List all available methods
grep "Client.prototype" Client.js

# Find target method
grep -A 10 "vmUpdateName" Client.js
```

**2. Extract Key Information**

```javascript
// From SDK
Client.prototype.vmUpdateName = function (vmUpdateNameRequest) {
    this.httpRequest.action = "vmUpdateName";  // ← Action name
    this.httpRequest.body = vmUpdateNameRequest;  // ← Parameter location
    ...
};
```

**3. Check Parameter Model**

```bash
# Check request model
cat model/VmUpdateNameRequest.d.ts
cat model/VmUpdateNameBody.d.ts
```

**4. Implement Method**

```typescript
async updateInstanceName(instanceId: string, newName: string): Promise<any> {
  return this.portalRequest('vmUpdateName', {  // ← SDK's action
    bodyParameter: {  // ← SDK uses body
      serverId: instanceId,
      name: newName
    }
  });
}
```

**5. Test and Verify**

```typescript
// Create simple test script
const result = await client.updateInstanceName('instance-id', 'new-name');
console.log('Result:', result);

// Verify result
const details = await client.describeInstance('instance-id');
console.log('New name:', details.name);
```

---

## 🚨 Pitfalls to Avoid

### 1. Don't Rely on Official Documentation

❌ **Wrong Approach:**
> "Documentation says use HMAC-SHA1 signature to call API directly"

✅ **Correct Approach:**
> "Check SDK source code, discovered everything goes through Portal Gateway"

### 2. Don't Try to "Improve" SDK

❌ **Wrong Approach:**
> "Portal Gateway adds a layer, I'll call API directly for better performance"

✅ **Correct Approach:**
> "SDK does it this way for a reason, follow it"

### 3. Don't Port Features Across SDKs

❌ **Wrong Approach:**
> "Python SDK has batchStop, I'll implement one based on it"

✅ **Correct Approach:**
> "Node SDK doesn't have it means it doesn't have it, use Promise.all instead"

### 4. Don't Assume Parameter Formats

❌ **Wrong Approach:**
> "Should be VPC ID, let me try"

✅ **Correct Approach:**
> "Query existing resources, see what actual value is"

---

## 📋 Debugging Checklist

When API calls fail, check in this order:

### Basic Checks
- [ ] Is SDK version `1.0.1`?
- [ ] Does action name exactly match SDK?
- [ ] Is Gateway URL correct?

### Parameter Checks
- [ ] Is parameter location correct? (pathParameter / bodyParameter / queryParameter)
- [ ] Does parameter format match SDK model?
- [ ] Are all required fields present?

### Response Checks
- [ ] Did you correctly parse double-nested JSON?
- [ ] Did you check the `state` field?
- [ ] Error message is in `errorMessage`

### Environment Checks
- [ ] Does Pool ID support this SDK version?
- [ ] Is this API available in current pool?
- [ ] Do credentials have sufficient permissions?

---

## 🎓 Core Methodology Summary

### The Golden Rule

> **When encountering issues, first go check Node SDK source code**

Don't:
- ❌ Search for online examples
- ❌ Read outdated documentation
- ❌ Code by intuition
- ❌ Reference other language SDKs

Instead:
- ✅ Download official Node SDK
- ✅ Read Client.js and ApiClient.js
- ✅ Compare against model definitions
- ✅ Completely replicate SDK's approach

### The Testing Loop

```
1. Read SDK source → Understand correct approach
2. Implement method → Exactly follow SDK
3. Write test script → Verify functionality
4. If error → Return to step 1, compare differences
5. If success → Keep test script as reference
```

### The Documentation Principle

> **SDK Source Code > Official Documentation > Everything Else**

Trust ranking:
1. 🥇 Official Node SDK source code (100% trustworthy)
2. 🥈 Actual test results (trustworthy after verification)
3. 🥉 Official documentation (may be outdated)
4. ❌ Online examples (untrustworthy)

---

## 📁 Important File Locations

### Source Code
```
/server/lib/providers/chinamobile/client.ts  # Implementation
/server/lib/providers/chinamobile/types.ts   # Type definitions
```

### Utilities
```
/server/scripts/list-all-instances.ts  # List all instances
```

### Reference
```
/docs/research/chinamobile-integration-guide.md  # This document
```

---

## 🔄 Continuous Integration Recommendations

### Monitor SDK Updates

Regularly check for official SDK updates:
- New API methods
- SDK version changes
- Parameter format adjustments

### Maintain Test Scripts

Keep a simple test script for each implemented API:
```typescript
// test-vm-update-name.ts
const result = await client.updateInstanceName('id', 'name');
console.log('✅ Success:', result);
```

For quick verification when API behavior changes.

---

**Last Updated:** 2025-10-24
**Maintainer:** Reference this document, implement based on Node SDK source code
