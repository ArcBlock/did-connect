# UI 轻量化方案

## 现状分析

### 当前 React 包依赖链 (估算 gzipped)
```
@did-connect/react
├── @mui/material          ~130 KB
├── @emotion/react         ~12 KB
├── @emotion/styled        ~8 KB
├── lodash                 ~25 KB (tree-shaken)
├── buffer                 ~6 KB
├── core-js                ~15 KB (polyfills)
├── xstate                 ~15 KB
├── tweetnacl              ~10 KB
├── axios                  ~6 KB
├── @arcblock/ux           ~30 KB (估)
├── @arcblock/icons        ~10 KB (估)
├── 组件自身代码            ~8 KB
└── 其他小依赖              ~5 KB
                    合计: ~280 KB+ gzipped
```

### 实际 UI 使用了什么
从 MUI 中实际使用的组件:
- `Dialog` / `DialogContent` — 弹窗
- `Button` — 按钮
- `Box` — 布局
- `Slide` — 动画
- `CircularProgress` — 加载
- `useMediaQuery` — 响应式
- `useTheme` — 主题

**结论**: 用了 MUI 130KB 的体积, 实际只用了 ~6 个组件。

## 方案对比

### 方案 A: Web Components (推荐)

```
优点:
+ 零框架依赖 — 任何前端框架都能用
+ Shadow DOM 隔离 — 不怕宿主样式冲突
+ 浏览器原生支持 — 无 polyfill 需求
+ 可以用在 React/Vue/Svelte/Angular/vanilla
+ 极小体积: 目标 < 30KB gzipped

缺点:
- 开发体验不如 React
- Shadow DOM 与外部主题集成需要 CSS Custom Properties
- Server-side rendering 较复杂

适用场景: 作为核心实现, 然后提供 React/Vue wrapper
```

**推荐库**: Lit (Google 维护, ~5KB, 成熟稳定)

```
@did-connect/connect (Web Component, Lit)
├── lit                    ~5 KB
├── 组件代码                ~8 KB
├── 样式                   ~3 KB
└── 状态机 (精简)          ~10 KB
                    合计: ~26 KB gzipped
```

### 方案 B: Preact

```
优点:
+ API 兼容 React, 迁移成本低
+ 只有 3KB (vs React 40KB)
+ 生态丰富

缺点:
- 仍是 React 生态思维
- 消费者用 React 时仍需 React (peer dep)
- 不能在 Vue/Svelte 等框架中直接使用

适用场景: 如果主要用户群是 React
```

### 方案 C: Vanilla JS + 模板

```
优点:
+ 零依赖
+ 最小体积

缺点:
- 开发/维护成本高
- 状态管理要自己实现
- 没有响应式更新机制

适用场景: 极简场景 (如嵌入式设备)
```

## 推荐方案: Web Components (Lit) + Framework Wrappers

### 架构

```
@did-connect/connect-element (核心 Web Component)
├── <did-connect-button> — 触发按钮
├── <did-connect-dialog> — 认证弹窗
├── <did-connect-qrcode> — QR 码
└── <did-connect-status> — 状态显示

@did-connect/react (React wrapper, 轻量)
├── <Connect> — 包装 <did-connect-dialog>
├── <ConnectButton> — 包装 <did-connect-button>
├── useSession() — Hook
└── SessionProvider — Context

@did-connect/vue (Vue wrapper, 轻量)
├── <Connect> — 包装 <did-connect-dialog>
└── useSession() — Composable
```

### 体积目标

| 包 | 当前 | 目标 | 降幅 |
|----|------|------|------|
| @did-connect/connect-element | N/A | ~25 KB | 新 |
| @did-connect/react | ~280 KB | ~30 KB | -89% |
| @did-connect/vue | ~200 KB | ~28 KB | -86% |

### 实现步骤

#### Step 1: 抽取 UI 无关逻辑
```
将以下逻辑从 ux/react 移到 core/:
- QR 码生成 → @did-connect/qrcode (可选, 或用轻量库)
- Cookie 管理 → @did-connect/state (已有部分)
- 钱包检测 → @did-connect/state
- DeepLink 构建 → @did-connect/state (已有)
```

#### Step 2: 创建 Web Component 核心
```
新包: @did-connect/connect-element

技术栈:
- Lit 3.x (Web Component 框架, ~5KB)
- CSS Custom Properties (主题定制)
- 内联 SVG (QR 码, 无额外依赖)

组件:
- did-connect-dialog: 核心弹窗
- did-connect-button: 触发按钮
- did-connect-qrcode: QR 码显示
- did-connect-status: 状态提示
```

#### Step 3: React/Vue 轻量 Wrapper
```
@did-connect/react (v3, 轻量版)

import { Connect } from '@did-connect/react';

// 内部只是:
// 1. 渲染 <did-connect-dialog> Web Component
// 2. 提供 React hooks 绑定事件
// 3. 提供 Context 管理 Session

// 不再依赖: MUI, Emotion, lodash, buffer, core-js
```

#### Step 4: 主题与定制

```css
/* 消费者通过 CSS Custom Properties 定制 */
did-connect-dialog {
  --dc-primary-color: #4598fa;
  --dc-border-radius: 12px;
  --dc-font-family: 'Inter', sans-serif;
  --dc-bg-color: #ffffff;
  --dc-text-color: #334660;
}
```

### 向后兼容策略

```
v2.x (当前): 基于 MUI 的 React 组件
v3.x (新): 基于 Web Component 的轻量组件

迁移路径:
1. v3.0 发布 Web Component 核心
2. v3.0 的 @did-connect/react 保持相同 API
3. 内部实现从 MUI 切换到 Web Component wrapper
4. 消费者只需升级版本, API 不变
5. v2.x 进入维护模式

破坏性变更 (需要文档说明):
- 主题定制方式改变 (MUI theme → CSS Custom Properties)
- 样式覆盖方式改变 (className → CSS parts)
- 部分 props 可能调整
```

## 替代: 增量优化 (不全部重写)

如果全部重写风险太大, 可以先做增量优化:

### 快速 wins (1-2 周)
1. **替换 lodash**: 用原生 JS 替代 (实际用到的方法很少)
2. **移除 buffer polyfill**: 改用 Uint8Array
3. **Babel 目标现代化**: ES2020, 去掉 core-js
4. **MUI tree-shaking**: 确认用了路径导入 (`@mui/material/Button` 而非 `@mui/material`)

### 预期效果
```
当前: ~280 KB gzipped
优化后: ~200 KB gzipped (-30%)
```

不够彻底, 但风险低, 可以先做。
