# 协议演进方向

## 当前协议能力 (v2)

```
身份认证: DID Wallet 扫码 / DeepLink / Web Wallet
签名类型: Ed25519, Secp256k1, Ethereum
Claims:   authPrincipal, profile, signature, prepareTx,
          agreement, verifiableCredential, asset
传输:     WebSocket + HTTP REST
多步骤:   支持 (requestedClaims[][])
存储:     Memory / NeDB / MongoDB
```

## 演进方向

### 1. Passkey 硬件签名作为 DID 验证机制 (核心方向)

> 详细方案见 [06-passkey-strategy.md](./06-passkey-strategy.md)
> 链/产品层面的讨论见 [07-broader-vision.md](./07-broader-vision.md)

**核心思路**: 用 passkey 的 secp256r1 硬件签名**直接**作为 DID 的 verification method，不是当 seed 用。配合链上协议层的 Context DID 派生解决隐私问题。

**关键设计决策**:
- Passkey 签名 (secp256r1) 与 BIP39 (secp256k1/ed25519) 共存于同一 DID Document
- Context DID 派生发生在协议层: `hash(pubkey || context || salt)`，不在密钥层
- Social login 是入口不是身份，自动引导 passkey 创建
- 信任层级: passkey 日常 → BIP39 高价值 → multi-sig 管理 → social 辅助
- 链是 policy 执行引擎，不满足策略条件的操作在共识层被拒绝

**对 did-connect 的主要影响**:
- authPrincipal 扩展支持 WebAuthn 参数和 context
- 新增 strategies 机制 (passkey / wallet / social)
- 新增 multiSigAuth 和 delegation claim 类型
- UI 需要 passkey 卡片和策略排序逻辑
- handler 需要 secp256r1 验证和 OAuth 回调处理

### 2. Social Login 标准化

> 详见 [06-passkey-strategy.md](./06-passkey-strategy.md) 中 "Social Login 的定位" 一节

**定位**: 入口，不是身份。零链上权限。

```
Flow: OAuth → 获取 id_token → 自动创建 passkey → DID 绑定 passkey
DID Document 中: 只存在 service 层 (bindingHash)，不在 verificationMethod 中
```

### 3. 多链扩展

**现状**: 支持 ArcBlock, Ethereum, "Solona" (拼写错误)

**目标**: 规范化多链支持

```typescript
// 当前
type TChainType = 'arcblock' | 'ethereum' | 'solona';

// 目标
type TChainType =
  | 'arcblock'
  | 'ethereum'
  | 'solana'       // 修正拼写
  | 'polygon'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | string;        // 允许扩展

// 支持 EIP-155 Chain ID
interface ChainInfo {
  type: TChainType;
  id: string;              // EIP-155 Chain ID (e.g., "1" for Ethereum mainnet)
  host?: string;           // RPC endpoint
  name?: string;           // 人类可读名称
  nativeCurrency?: {       // 链原生代币
    name: string;
    symbol: string;
    decimals: number;
  };
}
```

### 4. 协议版本管理

**现状**: 无正式协议版本, JWT 版本通过 User-Agent 判断

**目标**: 正式的协议版本协商

```typescript
// Session 创建时声明协议版本
interface SessionCreate {
  protocolVersion: '2.0' | '3.0';
  capabilities: string[];    // 支持的特性
  // ...
}

// 钱包响应时声明支持的版本
interface WalletResponse {
  protocolVersion: '2.0' | '3.0';
  // ...
}

// Relay 进行版本协商
// 如果版本不兼容, 返回明确的错误信息
```

### 5. Transport 抽象

**现状**: 硬编码 WebSocket + HTTP

**目标**: 可插拔的 transport 层

```typescript
interface Transport {
  // 创建 Session
  createSession(options: SessionOptions): Promise<Session>;

  // 监听 Session 变化
  subscribe(sessionId: string, callback: (event: SessionEvent) => void): Unsubscribe;

  // 发送 Claim 响应
  submitResponse(sessionId: string, response: ClaimResponse): Promise<void>;

  // 关闭连接
  close(): void;
}

// 内置实现
class WebSocketTransport implements Transport { ... }
class HttpPollingTransport implements Transport { ... }
class SSETransport implements Transport { ... }       // Server-Sent Events

// 自动降级
class AutoTransport implements Transport {
  // 尝试: WebSocket → SSE → HTTP Polling
}
```

### 6. Relay 去中心化

**现状**: Relay 是一个中心化的 Express 服务

**长期目标**: 去中心化的 Relay 网络

```
方案 A: 自托管 Relay (短期)
- 每个 Blocklet 运行自己的 Relay
- 减少对中心化 Relay 的依赖
- 已经部分实现 (relay-server 是 Blocklet)

方案 B: P2P Relay (中期)
- 使用 WebRTC DataChannel 直连
- dApp 和 Wallet 直接通信
- Relay 只在无法直连时使用

方案 C: 链上 Relay (长期)
- Session 信息存储在链上
- 完全去中心化, 无单点故障
- 适合高价值交易场景
```

### 7. Claim 类型扩展

```typescript
// 新增: DID Communication
type DidCommRequest = {
  type: 'didcomm';
  message: DIDCommMessage;    // DIDComm v2 消息
};

// 新增: Zero-Knowledge Proof
type ZKProofRequest = {
  type: 'zkproof';
  circuit: string;            // 证明电路标识
  publicInputs: any[];        // 公开输入
  // 用户证明某个条件成立, 但不暴露具体数据
  // 例: 证明年龄 > 18, 但不暴露具体年龄
};

// 新增: Delegation
type DelegationRequest = {
  type: 'delegation';
  delegateTo: string;         // 被委托方 DID
  permissions: string[];      // 委托的权限
  expiry: number;             // 过期时间
};
```

## 协议演进路线图

```
v2 (当前)
├── DID Wallet 认证 ✅
├── 7 种 Claim 类型 ✅
├── 多步骤工作流 ✅
└── WebSocket + HTTP ✅

v2.5 (改进, 兼容)
├── 修正 Solana 拼写 (兼容旧值)
├── WebSocket 回退到 Polling
├── ESM 输出
└── 协议版本声明

v3.0 (Passkey-first)                    ← 核心版本
├── Passkey 硬件签名作为 DID 验证 (secp256r1)
├── strategies 机制 (passkey / wallet / social)
├── Social Login 作为入口 (OAuth → 自动 passkey → DID)
├── Context DID 协议层派生
├── Transport 抽象层
├── UI 轻量化 (Web Components)
└── 正式协议版本协商

v3.x (增强)
├── Multi-sig claim (多签验证)
├── Delegation claim (Agent DID 委托)
├── 信任层级策略 (按操作类型要求不同验证等级)
├── 多链扩展 (EIP-155)
└── BIP39 + Passkey 共存流程完善

v4.0 (远期)
├── DIDComm v2 集成
├── ZK Proof Claims
├── P2P Transport
├── Recovery flow 链上集成
└── 链上 Relay 选项
```

## 与 DID Spec 的对齐

参考 https://github.com/ArcBlock/abt-did-spec:

1. **DID 格式**: `did:abt:z[base58]` — 协议已正确实现
2. **应用隔离 DID**: HD 路径派生 — 通过 authPrincipal strategy 支持
3. **隐私保护**: 链下 PII, 只存签名 — 协议正确遵守
4. **密钥类型**: Ed25519 + Secp256k1 — 已支持
5. **JWT 格式**: 自定义 ArcBlock JWT — 已实现 (v1.0 和 v1.1)

**需要对齐的**:
- DID Spec 定义的角色类型 (account, device, application 等) 在协议中作为 authPrincipal 的 role 支持
- DID Spec 的 hash 算法列表与 types 中的定义一致
- Ethereum/Solana 支持是 DID Spec 之外的扩展, 需要文档化
