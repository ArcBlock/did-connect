### 关联 Issue

<!-- 请用 fixes、closes、resolves、relates 这些关键词来关联 issue，原则上，所有 PR 都应该有关联 Issue -->

### 主要改动

<!--
  @example:
    1. 修复了 xxx
    2. 改进了 xxx
    3. 调整了 xxx
-->

### 界面截图

<!-- 如果改动的是跟 UI 相关的，不论是 CLI 还是 WEB 都应该截图 -->

### 测试计划

<!-- 如果本次变更没有自动化测试覆盖，你整理的测试用例集是什么？需要编写成 todo list 放到下面 -->

### 检查清单

- [ ] 这次变更包含 breaking change，我为 breaking change 编写了 migration document【如果不是 breaking change 可以勾选】
- [ ] 本次变更新增了文件需要被包含在 npm 包的文件，且对应 package.json 的 files 字段包括了这些新增的文件
- [ ] 本次变更增加了依赖，并且 core/blocklet-services 和 core/webapp 的前端依赖我放在了 devDependencies 里面
- [ ] 本次变更需要更新文档，并且我更新了相关文档，如果还没更新文档，请新建文档更新的 Issue 并关联上来
- [ ] 本次变更的地方已经有测试覆盖，并且我调整了变更部分的测试覆盖
- [ ] 本次变更新增的代码逻辑也增加了测试覆盖
- [ ] 本次变更的兼容性测试覆盖了 Chrome
- [ ] 本次变更的兼容性测试覆盖了 Safari
- [ ] 本次变更的兼容性测试覆盖了 PC 端
- [ ] 本次变更的兼容性测试覆盖了移动端【手机浏览器、钱包内置浏览器】
- [ ] 本次变更中有用户输入的逻辑，用户输入的后端、前端都增加了校验、错误提示
- [ ] 本次变更中有添加或更新 npm 依赖，并且没有导致同 1 个依赖出现多个版本【检查 pnpm.lock 的 diff】
- [ ] 本次变更我已经把 ArcBlock 的依赖升级到了最新：https://www.notion.so/arcblock/JS-afb6960ba36546fa8ddc638fc47e5f51
