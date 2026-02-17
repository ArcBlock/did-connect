# 核心问题清单

## P0 - 必须修复

### 1. CI 测试被跳过
- **位置**: `.github/workflows/integration-tests.yml` (第47-55行)
- **现状**: `make coverage` 被注释, 注释为 "暂时跳过 test"
- **影响**: 代码合并无质量门禁, 回归风险高
- **建议**: 立即恢复, 修复任何失败的测试

### 2. mongodb@3.1.13 严重过时
- **位置**: `relay/storage-mongo/package.json`
- **现状**: ~2017 年版本, 已无安全支持
- **建议**: 升级到 mongodb@6.x, 或如果没有活跃用户则标记 deprecated

### 3. Session 复用功能损坏
- **位置**: `ux/react/src/Connect/basic.tsx` (FIXME 注释)
- **现状**: "Reuse existing session is not working"
- **影响**: 用户体验 — 页面刷新后需要重新扫码
- **建议**: 调查根因并修复

## P1 - 重要改进

### 4. WebSocket 回退机制缺失
- **位置**: `core/state/src/index.ts` (TODO)
- **现状**: WebSocket 连接失败后无 polling 回退
- **影响**: 在 WebSocket 受限环境 (企业防火墙等) 中完全不可用
- **建议**: 实现 HTTP long-polling 作为降级方案

### 5. UI 层过重
- **现状**: React 包带入 MUI (~130KB) + Emotion (~28KB) + Lodash (~70KB)
- **影响**: 首屏加载慢, 对轻量集成不友好
- **建议**: 见 [UI 轻量化方案](./04-ui-lightweight.md)

### 6. 只有 CJS 输出
- **位置**: 所有 core/* 和 relay/* 包
- **影响**: 无法被 bundler tree-shake, 引用者打包体积大
- **建议**: 添加 ESM 输出, 在 package.json 中配置 `exports` 字段

### 7. 依赖版本不一致
- `js-cookie`: react 用 ^2.2.1, vue 用 ^3.0.1
- `prettier`: root 用 ^2.7.1, playground 用 ^3.2.5
- **建议**: 统一版本, 在 root resolutions 中锁定

### 8. Solana 拼写错误
- **位置**: `core/types/src/types/index.ts`
- **现状**: `'solona'` 应为 `'solana'`
- **影响**: API 不专业, 可能造成集成困惑
- **建议**: 修正拼写 (需要考虑向后兼容)

## P2 - 应该做

### 9. TypeScript 升级
- 4.8.4 → 5.7.x
- 无破坏性变更, 获得更好的类型推断和性能

### 10. Storybook 升级
- 6.5 → 8.x
- 现代功能、安全补丁、Vite builder 支持

### 11. Babel 目标浏览器过老
- **位置**: `ux/react/babel.config.js`
- **现状**: 目标 Edge 17 / Firefox 60 / Chrome 67 / Safari 11.1 (2017-2018 年)
- **建议**: 改为 ES2020 目标, 大幅减少 polyfill

### 12. 超时事件未报告到服务端
- **位置**: `core/state/src/index.ts` (FIXME)
- **影响**: 服务端无法感知客户端超时, Session 可能挂起
- **建议**: 在超时时发送 DELETE/CANCEL 请求

### 13. 对话框关闭不触发 cancel
- **位置**: `ux/react/src/Connect/with-dialog.tsx` (TODO)
- **影响**: 用户关闭弹窗后 Session 仍在运行
- **建议**: 关闭时调用 cancel 清理 Session

## P3 - 可以改进

### 14. 无障碍 (Accessibility)
- **现状**: 无 ARIA 标签, 无语义 HTML, 无 aria-live 区域
- **建议**: 添加基本 a11y 支持 (ARIA labels, role, focus management)

### 15. i18n 方案简陋
- **现状**: 手动对象映射, 无动态切换
- **建议**: 如果需要多语言, 引入轻量 i18n (如 @formatjs/intl)

### 16. 缺少贡献指南
- 无 CONTRIBUTING.md / CODE_OF_CONDUCT.md / SECURITY.md
- **建议**: 添加基本文档

### 17. tweetnacl 重复
- React 和 Vue 包都直接依赖 tweetnacl + tweetnacl-sealedbox-js
- **建议**: 抽到共享包或确认是否可以用 @ocap/mcrypto 替代

### 18. NeDB 大文件 ready 状态
- **位置**: `relay/storage-nedb/src/index.ts` (TODO)
- **影响**: 数据库文件过大时可能在未就绪时返回空结果
- **建议**: 添加 ready promise/event
