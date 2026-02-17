# DID Connect 项目分析与改进计划

> 分析日期: 2026-02-17
> 当前版本: v2.2.8

## 目录

1. [项目现状分析](./01-current-state.md) - 架构、代码质量、依赖分析
2. [核心问题](./02-issues.md) - 需要解决的问题清单
3. [改进计划](./03-improvement-plan.md) - 分阶段改进方案
4. [UI 轻量化方案](./04-ui-lightweight.md) - 从 React/MUI 到轻量 UI 的路径
5. [协议演进](./05-protocol-evolution.md) - DID Connect 协议层的演进方向
6. [Passkey 策略](./06-passkey-strategy.md) - Passkey 作为 DID 验证机制对 did-connect 的影响
7. [更广视野](./07-broader-vision.md) - Passkey DID 与链的关系 (产品/战略层面)

## 核心结论

### 项目整体质量: 7.5/10

**做得好的:**
- TypeScript strict mode 全开，类型安全强
- 状态机 (xstate) 管理协议流程，可预测
- 存储层抽象清晰 (BaseStorage)，支持多后端
- 单仓多包结构合理，按职责分层 (core/relay/ux)

**需要改进的:**
- UI 层过重 (MUI + Emotion + Lodash + Buffer polyfill)
- CI 中测试被跳过，质量门禁失效
- 依赖过时 (mongodb@3.1.13, Storybook@6.5, TypeScript@4.8)
- 只输出 CJS，不支持 tree-shaking
- 协议层和 UI 层耦合 — state 包直接依赖 axios/ws

### 改进方向

1. **Passkey-first 认证** — 用硬件签名 (secp256r1) 直接作为 DID 验证方法，配合 Context DID 派生解决隐私问题
2. **UI 轻量化** — 脱离 MUI，走 Web Components 方向，支持 Passkey/Wallet/Social 多策略 UI
3. **协议层现代化** — ESM 输出，Transport 抽象，strategies 机制
4. **Social login 正确定位** — 作为入口而非身份，自动引导创建 passkey
5. **CI 修复 + 依赖升级** — 恢复测试门禁，升级过时依赖
