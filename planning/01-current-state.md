# 项目现状分析

## 1. 架构总览

```
did-connect/
├── core/                    # 协议核心
│   ├── types/               # 类型定义 + Joi Schema
│   ├── state/               # XState 状态机 (客户端)
│   ├── authenticator/       # JWT 签名/验证 (服务端)
│   └── handler/             # Relay 请求处理逻辑
├── relay/                   # Relay 实现
│   ├── storage/             # 抽象存储接口
│   ├── storage-memory/      # 内存存储
│   ├── storage-nedb/        # NeDB 文件存储
│   ├── storage-mongo/       # MongoDB 存储
│   ├── adapter-express/     # Express 中间件
│   └── server/              # Relay Blocklet 服务
├── ux/                      # 前端组件
│   ├── react/               # React 组件 (生产)
│   └── vue/                 # Vue 3 组件 (实验)
├── playground/              # 演示 Blocklet
└── website/                 # 文档站
```

## 2. 协议流程

三方交互: **dApp** ↔ **Relay Server** ↔ **DID Wallet**

```
1. dApp 创建 Session → 生成 QR/DeepLink
2. 用户用钱包扫码 → 钱包请求 Claims
3. Relay 返回 authPrincipal (身份选择)
4. 用户选择账户 → 钱包签名回复
5. Relay 验证 → 转发 dApp 的 requestedClaims
6. 用户确认 Claims → 钱包签名提交
7. dApp 审批 → Session completed
```

支持多步骤流程 (multi-step workflow), 每步有独立 challenge。

### 支持的 Claim 类型

| 类型 | 用途 |
|------|------|
| authPrincipal | 身份验证、账户选择 |
| profile | 用户资料 (姓名/邮箱/手机等) |
| signature | 签名任意数据 (交易/文本/ETH) |
| prepareTx | 准备区块链交易 |
| agreement | 协议确认签名 |
| verifiableCredential | VC 出示与验证 |
| asset | 资产所有权证明 |

### 支持的链

- ArcBlock (原生)
- Ethereum
- Solana (拼写为 "solona", 应修正)

## 3. 认证方式

| 方式 | 状态 | 实现位置 |
|------|------|---------|
| DID Wallet (扫码) | 生产 | core/state + ux/react |
| DID Wallet (DeepLink) | 生产 | core/state + ux/react |
| Web Wallet | 生产 | ux/react (Service Worker) |
| Social Login | 支持 | 通过外部集成 |
| Passkey | 支持 | 通过 authPrincipal targetType |

## 4. 传输机制

- **WebSocket**: 实时 Session 状态广播 (`@arcblock/ws`, 10s 心跳)
- **HTTP REST**: Session CRUD + Claim 请求/响应
- **DeepLink**: `abt://` 协议调起钱包
- **Native Bridge**: `dsbridge` 在钱包 WebView 内通信

## 5. 代码量分布

| 包 | 源码行数 (约) | 测试行数 (约) |
|----|-------------|-------------|
| core/types | 800 | 180 |
| core/state | 600 | 1,034 |
| core/authenticator | 300 | 基础测试 |
| core/handler | 1,000+ | 1,090 |
| relay/storage | 200 | 基础测试 |
| relay/storage-* | 各 ~150 | 各有测试 |
| relay/adapter-express | 300 | 基础测试 |
| ux/react | 1,640 | 仅 Storybook |
| ux/vue | 2,481 | 仅 Storybook |

**总计**: ~8,000+ 行源码, ~3,785 行测试

## 6. 构建输出

| 包 | 格式 | 工具 |
|----|------|------|
| core/* | CJS (.js + .d.ts) | tsc |
| relay/* | CJS (.js + .d.ts) | tsc |
| ux/react | CJS (Babel 转译) | @babel/cli + tsc |
| ux/vue | ESM + UMD | Vite |

**问题**: core 包只输出 CJS, 无法 tree-shake。

## 7. 依赖生态

### 核心依赖
- **@arcblock/***: DID/JWT/WS 等基础库, 统一锁定 1.20.8
- **@ocap/***: 区块链操作库
- **xstate@^4.33.6**: 状态机
- **joi**: Schema 验证

### UI 依赖 (React)
- **@mui/material@^5.10**: UI 组件库 (~130KB gzipped)
- **@emotion/react + styled**: CSS-in-JS
- **lodash@^4.17**: 工具库 (~70KB)
- **buffer@^6.0**: Node polyfill (~6KB)
- **tweetnacl**: 加密库 (~25KB)
- **core-js**: ES polyfills

### 过时依赖
| 依赖 | 当前版本 | 最新版本 | 严重性 |
|------|---------|---------|--------|
| mongodb | 3.1.13 | 6.x | 🔴 严重 |
| TypeScript | 4.8.4 | 5.7.x | 🟡 建议升级 |
| Storybook | 6.5.13 | 8.x | 🟡 建议升级 |
| Jest | 28.1.3 | 30.x | 🟢 可选 |
| Prettier | 2.7.1 (root) vs 3.2.5 (playground) | 3.x | 🟡 不一致 |

## 8. 测试状态

- 测试框架: Jest + ts-jest
- 覆盖率: **CI 中已被注释掉** (`# 暂时跳过 test`)
- 集成测试质量高: 完整的 WebSocket + HTTP 多步骤流程测试
- React/Vue 组件: 无单元测试, 仅 Storybook stories

## 9. 代码中的 TODO/FIXME

| 文件 | 标记 | 内容 | 优先级 |
|------|------|------|--------|
| ux/react/src/Connect/basic.tsx | FIXME | Session 复用不工作 | 🔴 高 |
| core/state/src/index.ts | TODO | WebSocket 失败时回退到轮询 | 🔴 高 |
| core/state/src/index.ts | FIXME | 向服务端报告超时事件 | 🟡 中 |
| ux/react/src/Connect/with-dialog.tsx | TODO | 关闭对话框应调用 cancel | 🟡 中 |
| core/types/src/types/index.ts | FIXME | Union 类型转 LiteralUnion | 🟢 低 |
| relay/storage-nedb/src/index.ts | TODO | 大文件需要 ready 状态 | 🟢 低 |
