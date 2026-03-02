# Passkey 作为 DID 验证机制 — did-connect 协议影响

> 本文档聚焦 Passkey 策略对 did-connect 协议和实现的影响。
> 链上实现方案见 [blockchain/planning/38-passkey-did-identity-layer.md](https://github.com/ArcBlock/blockchain/blob/master/planning/38-passkey-did-identity-layer.md)。
> 更广的产品/战略讨论见 [07-broader-vision.md](./07-broader-vision.md)。

## 核心方案

**用 passkey 的硬件签名 (WebAuthn/FIDO2 secp256r1) 直接作为 DID 的 verification method**，而不是用 passkey 产生 seed 去派生密钥。

私钥永远不离开硬件安全芯片 (TPM/Secure Enclave)，链上已原生支持 secp256r1 验证。

### 优势
- **安全**: 私钥不可导出，无 seed phrase 泄露风险
- **体验**: 指纹/FaceID 完成签名，零密码学概念暴露
- **抗钓鱼**: WebAuthn 协议绑定 origin，天然防钓鱼
- **链原生**: ArcBlock 链已支持 secp256r1 验证，零额外成本

### 核心限制
- **无 BIP39 派生能力**: 一个 passkey = 一个密钥对，没有层级派生结构
- **隐私问题**: 同一 passkey 在不同场景 = 同一身份，行为可关联

## 解决方案: Context DID 派生

**协议层确定性派生**，不是密钥层派生:

```
Passkey (hardware) → Master DID
                      ├── hash(pubkey || context || salt) → Context DID A (社交)
                      ├── hash(pubkey || context || salt) → Context DID B (金融)
                      └── hash(pubkey || context || salt) → Context DID C (匿名)
```

- 私钥始终只有一个 (passkey 里那个)
- 对外呈现多个不可关联的 Context DID
- 验证: 用户用 passkey 签名含 context 的 challenge，verifier 验证 `hash(signer_pubkey || context || salt) == context_did`
- **salt 存设备本地不上链**，防止公钥暴露后被反推所有 Context DID

### 对 did-connect 的影响

1. **authPrincipal 扩展**: 需要支持 context 参数，让 dApp 指定场景
2. **Session 类型**: 新增 context DID 相关字段
3. **签名验证**: handler 需要支持 secp256r1 + context 验证逻辑
4. **state 包**: 需要 WebAuthn API 调用能力 (浏览器端)

---

## 多密钥类型共存

一个 DID 可以同时持有多种 verification method:

```json
{
  "id": "did:abt:z1234...",
  "verificationMethod": [
    { "id": "#key-passkey", "type": "EcdsaSecp256r1", "publicKey": "..." },
    { "id": "#key-bip39", "type": "EcdsaSecp256k1", "publicKey": "..." }
  ],
  "authentication": ["#key-passkey", "#key-bip39"]
}
```

### 信任层级与 did-connect Session 策略

| 操作 | 要求的验证等级 | did-connect 如何处理 |
|------|-------------|-------------------|
| 普通登录 | passkey 单签 | 标准 authPrincipal flow |
| 签发普通 VC | passkey 单签 | signature claim |
| 转账 < 阈值 | passkey 单签 | prepareTx claim |
| 转账 > 阈值 | passkey + BIP39 双签 | **新: 多步 multi-sig claim** |
| 修改 DID Document | 所有 key 的 m-of-n | **新: multi-sig claim** |
| 恢复流程 | guardian 批准 + social + timelock | **新: recovery claim** |

### 对 did-connect 协议的具体变化

**1. Session 创建时声明安全等级**

```typescript
interface SessionCreateOptions {
  // 现有字段...

  // 新增: 要求的验证等级
  securityLevel?: 'standard' | 'elevated' | 'critical';

  // 新增: 要求的签名类型
  requiredKeyTypes?: ('secp256r1' | 'secp256k1' | 'ed25519')[];

  // 新增: 是否要求多签
  multiSig?: {
    threshold: number;     // m of n
    keyTypes?: string[];   // 指定哪些 key 参与
  };
}
```

**2. authPrincipal claim 扩展**

```typescript
interface AuthPrincipalRequest {
  // 现有字段...

  // 新增: passkey 特定
  webauthn?: {
    rpId?: string;           // Relying Party ID
    allowCredentials?: [];   // 允许的 credential ID 列表
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };

  // 新增: context DID 派生
  context?: string;           // 场景标识符 (如 'social', 'finance')

  // 新增: 要求的 key 类型
  requiredKeyType?: 'secp256r1' | 'secp256k1' | 'ed25519';
}
```

**3. 新增 Claim 类型: multiSigAuth**

```typescript
interface MultiSigAuthRequest {
  type: 'multiSigAuth';
  description: string;
  threshold: number;           // 需要几个签名
  requiredKeys?: string[];     // 指定必须参与的 key ID
  challenge: string;           // 待签名 challenge
  payload: any;                // 待签名数据
}

interface MultiSigAuthResponse {
  type: 'multiSigAuth';
  signatures: Array<{
    keyId: string;             // verification method ID
    keyType: string;           // secp256r1 / secp256k1 / ed25519
    signature: string;         // 签名值
  }>;
}
```

---

## Passkey-First 认证流程

### 新用户 (Passkey 入门)

```
1. dApp 创建 Session
2. UI 检测浏览器 WebAuthn 支持
3. 显示 "用指纹/面部创建账户" (主选项)
4. 用户点击 → navigator.credentials.create()
5. 浏览器弹出 passkey 创建
6. 创建成功 → 链上注册 DID + passkey 公钥
7. Session completed with new DID

// 全程无密码学概念暴露
// 无需下载钱包 App
```

### 已有用户 (Passkey 登录)

```
1. dApp 创建 Session
2. UI 显示 "用指纹/面部登录" (主选项)
3. 用户点击 → navigator.credentials.get()
4. 浏览器弹出 passkey 选择
5. 用户验证 → 签名 challenge
6. Relay 验证签名 → Session completed

// 1 次点击 + 1 次生物识别 = 登录完成
```

### 多种方式并存

```
UI 认证选项 (按推荐顺序):
┌─────────────────────────────────────┐
│  🔑  用指纹/面部登录  (Passkey)     │  ← 主推
├─────────────────────────────────────┤
│  📱  用 DID Wallet 扫码            │  ← 高级用户
├─────────────────────────────────────┤
│  🌐  用 Google/Apple 登录          │  ← 入门用户
└─────────────────────────────────────┘
```

### 对 did-connect UI 的影响

1. **Connect 组件需要新的 "Passkey" 卡片**: 调用 WebAuthn API
2. **策略排序逻辑**: 检测设备能力, 自动推荐最佳方式
3. **注册 vs 登录**: 首次 = credentials.create(), 之后 = credentials.get()
4. **回退**: 设备不支持 passkey → 显示钱包扫码 → 显示 social login

---

## Social Login 的定位

> Social login 是**入口，不是身份**。

### 在 did-connect 中的角色

```
Social Login Flow (onboarding):
1. 用户选择 "Sign in with Google"
2. OAuth redirect → 获取 id_token
3. 后台自动:
   a. 引导创建 passkey (浏览器内)
   b. 链上创建 DID, 绑定 passkey
   c. Social login binding hash 存入 DID service
4. 返回: Session completed with new DID

// 用户体验: "用 Google 登录" → 弹出指纹 → 完成
// 底层: Google 只是入口, DID 绑定的是 passkey
```

### DID Document 中的表示

```json
{
  "id": "did:abt:z1234...",
  "verificationMethod": [
    { "id": "#key-passkey", "type": "EcdsaSecp256r1", "publicKey": "..." }
  ],
  "service": [
    {
      "type": "SocialLoginBinding",
      "provider": "google",
      "bindingHash": "hash(google_sub_id || salt)"
    }
  ]
}
```

**关键**: Social login 不在 `verificationMethod` 中，没有链上签名权限。只作为恢复流程的辅助因子。

### 对 did-connect types 的影响

```typescript
// Session 创建时声明支持的策略
interface SessionCreateOptions {
  // 现有...

  strategies?: Array<
    | 'passkey'                    // WebAuthn
    | 'wallet'                     // DID Wallet 扫码
    | 'wallet:web'                 // Web Wallet
    | `social:${string}`           // social:google, social:apple, ...
  >;

  // Social login 配置
  socialProviders?: Array<{
    provider: string;              // 'google' | 'apple' | 'github'
    clientId: string;
    autoCreatePasskey?: boolean;   // 登录后自动引导创建 passkey
  }>;
}
```

---

## Agent DID 委托

> Agent 持有受限的 delegated key，链上 policy 限制其能力范围。

### did-connect 中的 delegation flow

```
1. 用户登录 (passkey/wallet)
2. dApp 请求 delegation claim:
   { type: 'delegation', delegateTo: agentDid, permissions: [...], expiry: ... }
3. 用户在钱包/浏览器中确认委托范围
4. 用户签名委托声明
5. 链上注册委托关系
6. Agent 获得受限权限
```

### 新 Claim 类型

```typescript
interface DelegationRequest {
  type: 'delegation';
  description: string;

  delegateTo: string;            // 被委托方 DID

  permissions: string[];          // 允许的操作列表

  constraints?: {
    maxAmount?: string;           // 单笔上限
    dailyLimit?: string;          // 日累计上限
    rateLimit?: number;           // 每小时最大次数
    whitelist?: string[];         // 允许交互的地址
    expiry: number;               // 过期时间 (unix timestamp)
  };
}

interface DelegationResponse {
  type: 'delegation';
  delegationToken: string;        // 签名后的委托证书
  chainTxHash?: string;           // 链上注册的交易 hash
}
```

---

## 实现优先级 (对 did-connect)

### 必须做 (v3.0 核心)

1. **Passkey 认证流程**: authPrincipal 支持 WebAuthn，UI 添加 passkey 卡片
2. **secp256r1 签名验证**: handler 和 authenticator 支持新签名类型
3. **strategies 机制**: Session 支持声明多种认证策略，UI 按策略渲染
4. **Social login 作为入口**: OAuth flow + 自动 passkey 创建

### 应该做 (v3.x)

5. **Context DID 派生**: authPrincipal 支持 context 参数
6. **Multi-sig claim**: 高安全场景的多签验证
7. **Delegation claim**: Agent 委托机制

### 可以后做 (v4.0)

8. **信任层级策略**: Session 按操作类型要求不同验证等级
9. **Recovery flow**: 链上恢复流程集成

---

## 对现有代码的影响评估

| 包 | 影响程度 | 主要变化 |
|----|---------|---------|
| @did-connect/types | 🔴 大 | 新 claim 类型, session 字段扩展, strategy 类型 |
| @did-connect/state | 🔴 大 | WebAuthn API 调用, 新状态转换, 策略选择逻辑 |
| @did-connect/handler | 🔴 大 | secp256r1 验证, 新 claim 处理, OAuth flow |
| @did-connect/authenticator | 🟡 中 | 支持 secp256r1 签名/验证 |
| @did-connect/storage | 🟢 小 | Session 字段扩展, 向后兼容 |
| ux/react | 🔴 大 | Passkey 卡片, Social login 卡片, 策略排序 UI |
| relay/adapter-express | 🟡 中 | 新 endpoints (OAuth callback 等) |
