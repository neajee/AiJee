# 引擎层规范

`packages/engine`是单包，内部按职责分目录；只有独立依赖、发布、团队或构建成本显著增加时才拆包。

```text
packages/engine/src/
├── core/
│   ├── engine.ts
│   ├── session.ts
│   ├── events.ts
│   ├── capabilities.ts
│   └── errors.ts
├── registry/                 # 注册、探测、选择、配置校验
├── adapters/
│   ├── pi/
│   ├── codex/
│   └── opencode/
└── index.ts
```

`core`只定义`createSession`、`prompt`、`steer`、`abort`、`subscribe`、`listModels`、`listTools`等统一动作。特有能力通过`capabilities`声明和命名空间接口提供；Server按能力降级，禁止按引擎名称分支。

事件链路：引擎 → `AgentEvent` → `apps/server/src/api/stream` → SSE/WS帧。新增引擎不得修改客户端协议，客户端只依赖`client-sdk`生成类型与流封装。

Pi适配迁移顺序：先把现有Pi SDK会话包装迁入`adapters/pi`，再由`Session Registry`统一生命周期、并发、取消和释放；通过契约测试后接入Codex与OpenCode。

当前Pi适配固定使用`@earendil-works/pi-coding-agent@0.86.0`。Pi专有的`AgentSessionEvent`只在`adapters/pi/event-adapter.ts`读取，并以引擎中立事件封装后进入SSE；会话、压缩、队列和重试事件保持原事件名及字段语义。`SessionManager`使用持久化文件模式，`ModelRuntime`负责模型目录与认证；不引入Pi TUI或实验性client子路径。

0.86.0的自定义provider流式接口改用`TranscriptContext`，工具参数与结果详情收紧为JSON值，`user_bash`改为失败即停止；AiJee没有自定义provider或`user_bash`扩展调用，因此无需外溢改动。

`@aijee/client-sdk`通过`ApiClient.getProductCapabilities()`、`setCacheWarmingMode()`和`setActiveTools()`封装0.86产品能力：返回当前缓存预热、按模型压缩预算、重试状态和活动工具集；Pi的Radius目录随`ModelRuntime`模型列表自动可见。SDK只暴露引擎中立快照，不把Pi对象或TUI依赖带入客户端。
