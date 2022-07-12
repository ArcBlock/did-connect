## Connect 组件前端

- 当前链接的 URL

## Connect 状态前端

- 根据请求生成新的 Connect 会话，并且返回状态机
- 维护 Websocket 链接，根据 Socket 事件来更新状态机的数量

```javascript
// How the UI uses the state
const { createMachine } = require('@did-connect/state');

const props = {
  strategy: 'default',
  onConnect: async () => {},
  onApprove: async () => {},
};
const [machine, setMachine] = useState(createMachine(props));
const [state, send] = useMachine(machine);
const handleRetry = () => {
  setMachine(createMachine(props));
};
```

```javascript
// How to create state machine
```
