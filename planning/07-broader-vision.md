# 更广视野: Passkey DID 与链的关系

> 本文档记录 passkey DID 策略中超出 did-connect 协议范围但对产品方向重要的讨论。
> did-connect 协议层面的影响见 [06-passkey-strategy.md](./06-passkey-strategy.md)。
> 链上实现方案见 [blockchain/planning/38-passkey-did-identity-layer.md](https://github.com/ArcBlock/blockchain/blob/master/planning/38-passkey-did-identity-layer.md)。

## 为什么需要链

传统 passkey 场景里，人们会问"为什么要上链"。Passkey DID 方案给出了清晰回答:

**链是派生层和信任锚。** Passkey 只解决了"谁在签名"，但链解决了:

1. **确定性派生的公共可验证性** — `hash(pubkey || context || salt)` 的映射关系需要一个所有人都能查询、不可篡改的注册表
2. **DID 的生命周期管理** — 轮换、撤销、恢复都需要一个不依赖任何单一服务商的状态机
3. **跨场景的选择性关联** — 用户主动证明两个 Context DID 属于同一个 master，这个"主动披露"动作需要链上验证逻辑

**硬件级安全 (passkey) + 协议级隐私 (派生) + 链级信任 (不可篡改注册表)**，三层各司其职，缺一不可。

## Passkey + Multi-sig + 链

完整生命周期:

1. **初始**: 用户注册 passkey，链上创建 master DID，DID Document 只有一个 verification method
2. **增强**: 第二台设备创建新 passkey，链上交易加入 DID Document。2 个 key，可设策略 — 日常 1-of-2，高危 2-of-2
3. **轮换**: 设备丢失，用剩余 key 发起链上交易，移除旧 key 添加新 key
4. **恢复**: 最后一个 key 丢失 → 社交恢复 / 时间锁 / 新 passkey 注册

**链上 policy 不是建议，是强制执行。** 不满足策略条件的交易在共识层被拒绝。

策略示例:
- 登录、签发普通 VC → passkey 单签
- 转账 < 1000 → passkey 单签
- 转账 > 1000 → passkey + BIP39 双签
- 修改 DID Document → m-of-n 全部 key
- 72h 大额累计超阈值 → 自动锁定

**定位**: passkey 是锁，BIP39 是保险箱，链是执法者。

## 对比 iCloud Sync Passkey

| 维度 | iCloud Sync Passkey | 链上 Passkey DID |
|------|-------------------|-----------------|
| 密钥存储 | Apple 端到端加密同步 | 私钥在设备，公钥在链上 |
| 恢复 | Apple 账号 + 设备信任链 | 链上 multi-sig + 社交恢复 |
| 单点依赖 | 完全依赖 Apple | 不依赖任何单一厂商 |
| 跨平台 | Apple 为主 | 链是平台无关的 |
| 隐私 | Apple 知道你的所有 passkey | 链上公开但可匿名 |
| 可审计 | 不可审计 | 完全可审计 |
| 用户主权 | Apple 可锁你的账号 | 没人能夺走你的身份 |
| 体验 | 极好，无感同步 | 需要额外链上交互 |

**两者不互斥**: 用户可用 iCloud 同步的 passkey 做链上 DID 的验证方法。Apple 帮同步私钥，链管理身份。

## Agent 经济与 DID

Agent 持有 delegated key，链上 policy 定义能力边界:

```
Master DID (passkey + BIP39)
  └── Agent DID (delegated key, 链上 policy)
       └── Payment Channel → Service Provider DID
```

Agent policy 约束:
- 额度上限 (单笔/日累计)
- 频率限制
- 白名单地址
- 有效期自动过期

Agent 的 key 泄露影响被限定在 policy 范围内。Master DID 完全不受影响。

**链不只是记账，它是 agent 经济活动的规则引擎和仲裁者。**

## Social Login 的定位

Social login 在这个体系里是**入口，不是身份**:

- **onboarding 通道**: 用 Google 登录 → 自动引导创建 passkey → DID 绑定的是 passkey 不是 Google
- **恢复辅助因子** (弱): guardian 批准 + social 验证 + 时间锁
- **绝对不能**: 让 social login 单独拥有任何链上权限

信任层级:
1. passkey → 日常操作，硬件级安全
2. BIP39 → 高价值操作，冷存储级安全
3. multi-sig 组合 → DID 管理级操作
4. social login → 仅辅助 onboarding 和恢复，零链上权限

## 安全与隐私分析

### 隐私隐患
- **公钥暴露**: DID Document 上链 = 公钥公开。应对: 派生函数加 salt，salt 不上链
- **链上行为分析**: 单个 Context DID 的行为模式可被分析。普遍问题，非方案特有
- **DID Document 变更历史**: 每次 key 变更是链上交易，可能泄露设备状态信息

### 安全隐患
- **Multi-sig 策略暴露**: 攻击者知道 m-of-n 策略。应对: 策略哈希上链，执行时验证
- **密钥轮换时间窗口**: 设备丢失到链上撤销之间的时间差。应对: 高危操作加时间锁
- **量子威胁**: P-256 公钥长期暴露。应对: DID Document 天然支持 post-quantum verification method 迁移

## 护城河

Passkey 链上验证本身不是护城河 (ETH ERC-4337 也能做)。真正的护城河:

1. **协议层完整性**: passkey DID + context 派生 + multi-sig + 恢复，作为链的一等公民
2. **DID 生态深度**: W3C DID + VC + DIDComm 完整栈
3. **"节点即自我保护"的网络效应**: 用户保护身份 → 跑节点 → 独有激励结构
4. **Agent 叙事**: 身份 + agent + 链的组合，从 agent 角度思考身份问题

**速度很重要** — 在别人拼凑出同样的东西之前，先把协议层完整方案做出来，形成标准。
