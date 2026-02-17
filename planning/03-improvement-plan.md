# 改进计划

## Phase 1: 基础修复 (1-2 周)

> 目标: 恢复质量门禁, 修复已知 bug

### 1.1 恢复 CI 测试
- [ ] 取消 `.github/workflows/integration-tests.yml` 中的测试注释
- [ ] 修复任何失败的测试用例
- [ ] 设置 coverage 阈值门禁 (建议 > 70%)

### 1.2 修复已知 bug
- [ ] 修复 Session 复用 (FIXME in basic.tsx)
- [ ] 修复对话框关闭不取消 Session (TODO in with-dialog.tsx)
- [ ] 修复超时事件不上报 (FIXME in state/index.ts)

### 1.3 修正拼写
- [ ] `'solona'` → `'solana'` (考虑 backward compat, 两个都接受一段时间)

### 1.4 依赖版本统一
- [ ] js-cookie 统一到 ^3.0.1
- [ ] prettier 统一到 ^3.x

---

## Phase 2: 依赖现代化 (2-4 周)

> 目标: 升级过时依赖, 减少安全风险

### 2.1 关键依赖升级
- [ ] mongodb: 3.1.13 → 6.x (storage-mongo)
  - API 变化大, 需要重写部分代码
  - 或者: 如果没有活跃用户, 标记 deprecated
- [ ] TypeScript: 4.8.4 → 5.7.x
- [ ] Jest: 28.x → 30.x (可选)

### 2.2 构建产物现代化
- [ ] core/* 包添加 ESM 输出 (dual CJS/ESM)
- [ ] 使用 package.json `exports` 字段
- [ ] Babel 目标改为 ES2020
- [ ] 移除不必要的 core-js polyfill

### 2.3 开发工具升级
- [ ] Storybook 6.5 → 8.x
- [ ] 迁移到 Vite builder (替代 Webpack 5)

---

## Phase 3: 架构改进 (1-2 月)

> 目标: 解耦协议层和 UI 层, 为轻量化做准备

### 3.1 协议层解耦

当前问题: `@did-connect/state` 直接依赖 axios, @arcblock/ws, buffer 等

```
目标架构:

@did-connect/state (纯状态机)
├── 不含 HTTP/WS 实现
├── 定义 transport 接口
└── 可在任何环境运行

@did-connect/transport-http (可选)
├── 基于 fetch API (无 axios)
└── 实现 transport 接口

@did-connect/transport-ws (可选)
├── 基于原生 WebSocket
└── 实现 transport 接口
```

### 3.2 WebSocket 回退
- [ ] 实现 HTTP long-polling transport
- [ ] 在 WebSocket 失败时自动降级
- [ ] 添加 transport 策略配置

### 3.3 存储层评估
- [ ] 评估 storage-mongo 是否仍有用户
- [ ] 考虑添加 Redis/SQLite 存储后端
- [ ] storage-nedb 添加 ready 状态

---

## Phase 4: UI 轻量化 (2-3 月)

> 目标: 去 MUI 依赖, 大幅减小包体积

详见 [UI 轻量化方案](./04-ui-lightweight.md)

概要:
- [ ] 方案选择: Web Components / Preact / Vanilla JS
- [ ] 核心 Connect 组件重写
- [ ] 保持向后兼容的 React wrapper
- [ ] 目标: < 50KB gzipped (当前估计 > 300KB)

---

## Phase 5: Passkey-First 认证 (与 Phase 3-4 并行)

> 目标: 实现 passkey 硬件签名作为 DID 验证机制
> 详见 [Passkey 策略](./06-passkey-strategy.md)

### 5.1 基础 Passkey 支持 (优先, 与 Phase 3 并行)
- [ ] `@did-connect/types`: 扩展 authPrincipal 支持 WebAuthn 参数
- [ ] `@did-connect/types`: 添加 `strategies` 字段到 Session 类型
- [ ] `@did-connect/authenticator`: 支持 secp256r1 签名验证
- [ ] `@did-connect/handler`: 处理 WebAuthn assertion 验证
- [ ] `@did-connect/state`: 浏览器端 WebAuthn API 调用 (credentials.create / credentials.get)
- [ ] UI: 添加 Passkey 认证卡片 (指纹/面部登录)

### 5.2 Social Login 作为入口 (紧跟 5.1)
- [ ] `@did-connect/types`: 添加 socialProviders 配置
- [ ] `@did-connect/handler`: OAuth callback 处理
- [ ] OAuth flow → 自动引导 passkey 创建 → DID 绑定 passkey
- [ ] UI: Social login 按钮, 策略排序 (passkey > wallet > social)

### 5.3 Context DID 派生
- [ ] `@did-connect/types`: authPrincipal 支持 context 参数
- [ ] 协议层派生逻辑: `hash(pubkey || context || salt)`
- [ ] 钱包端支持 context DID 选择

### 5.4 高级特性 (v3.x)
- [ ] Multi-sig claim 类型: 高安全场景多签
- [ ] Delegation claim 类型: Agent DID 委托
- [ ] 信任层级: Session 按操作类型要求不同验证等级

---

## Phase 6: 协议增强 (后续)

> 目标: 扩展协议能力

详见 [协议演进](./05-protocol-evolution.md)

概要:
- [ ] 多链扩展 (Solana 正式支持, 更多 EVM 链)
- [ ] 协议版本管理机制
- [ ] DIDComm v2, ZK Proof 等远期 Claim 类型

---

## 里程碑

| 时间 | 里程碑 | 关键交付 |
|------|--------|---------|
| +2周 | M1: 基础修复 | CI 恢复, bug 修复 |
| +1月 | M2: 依赖现代化 | 过时依赖升级, ESM 输出 |
| +2月 | M3: 架构改进 + Passkey 基础 | 协议解耦, secp256r1 验证, WebAuthn flow |
| +3月 | M4: UI 轻量化 + Social Login | Web Components, 策略 UI, OAuth 入口 |
| +4月 | M5: Context DID + Multi-sig | 派生机制, 多签, Agent 委托 |
| +6月 | M6: 协议增强 | 多链扩展, 版本管理 |
