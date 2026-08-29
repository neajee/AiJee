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
