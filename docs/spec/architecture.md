# AiJee 架构定稿

## 目录结构

```text
AiJee/
├── apps/
│   ├── server/                    # 唯一后端（含CLI与可执行入口）
│   │   ├── src/
│   │   │   ├── main.ts            # 启动、配置装载、优雅退出
│   │   │   ├── bin/               # 仅命令入口
│   │   │   │   ├── aijee.ts
│   │   │   │   ├── start.ts
│   │   │   │   └── auth-reset.ts
│   │   │   ├── api/               # REST + SSE + WS对外边界
│   │   │   │   ├── routes/
│   │   │   │   ├── stream/        # 内部事件 → SSE/WS序列化
│   │   │   │   └── middleware/
│   │   │   ├── auth/              # 设备配对、token、权限
│   │   │   ├── sessions/          # 生命周期、registry、并发与取消
│   │   │   ├── orchestrator/      # 任务编排、队列、重试、审批门
│   │   │   ├── storage/           # 配置、历史、任务持久化
│   │   │   └── telemetry/         # 日志、指标
│   │   └── package.json
│   ├── client/                    # Expo Web / iOS / Android
│   └── desktop/                   # Electron窗口、托盘、更新、Server发现
│
├── packages/
│   ├── engine/                    # 引擎层（单包，内部分目录）
│   │   └── src/
│   │       ├── core/              # engine / session / events / capabilities / errors
│   │       ├── registry/          # 注册、探测、选择、配置校验
│   │       ├── adapters/{pi,codex,opencode}/
│   │       └── index.ts
│   ├── api-contract/              # 协议唯一源头
│   │   ├── openapi.yaml
│   │   └── scripts/generate.ts
│   ├── client-sdk/                # openapi生成代码与薄封装
│   │   └── src/{generated,core,hooks,types}
│   └── ui/                        # 跨端UI、状态与数据hooks，不感知引擎
│       └── features/{chat,agent,workspace,tasks,settings}
│
└── docs/spec/{architecture.md,sdk.md,engines.md}
```

## 运行时依赖方向

```text
client / desktop → ui → client-sdk
apps/server → engine → Pi / Codex / OpenCode SDK
```

任何反向依赖均视为架构违规。`ui`的hooks只能使用`client-sdk`导出的类型与流封装，不得自行拼接URL或手写请求。

## 生成时依赖

```text
api-contract/openapi.yaml
        ├── 生成 → client-sdk/src/generated
        ├── 清单 → api-contract/generated-manifest.json
        └── 约束 → apps/server实现
```

`api-contract`只出现在devDependencies与生成脚本中，不进入任何包的runtime dependencies。`yarn api:check`校验路径、HTTP方法、响应Schema、Server路由和生成操作清单；协议漂移在合并前失败。

## 核心约定

`engine/core`由类型化的`EngineSession`、`EngineAdapter`和`EngineRegistry`组成，统一动作包括`createSession`、`prompt`、`steer`、`abort`、`subscribe`、`listModels`、`listTools`。引擎特有能力通过`capabilities`声明，Server按能力降级，禁止`if (engine === "pi")`式分支；Pi SDK对象只能在`adapters/pi`边界出现。

事件分两层：引擎产出内部标准`AgentEvent`，`api/stream`再映射为对外SSE/WS帧。新增引擎不得修改客户端协议；前端展示调整不得侵入引擎。

`src/bin/*`只做参数解析、配置装载、调用`src/`函数和设置退出码。单文件超过百余行即说明业务逻辑漏入入口。

`packages/aijee`与手写客户端`protocol`目录已删除；发布入口统一为`apps/server`的`aijee`包。

### UI Feature组件拆分规范

#### 策略一：大组件目录化，不向平铺转移

扁平`components/`是碎片化根源。巨型组件拆出的子件就近归入组件自己的目录；`message-list`是现有示范：

```text
features/<feature>/components/<MajorComponent>/
├── index.tsx        # 编排层：只做状态 + 组装，目标 <200 行
├── <sub-view>.tsx   # 表现层：纯 props 渲染
└── types.ts         # 局部类型
```

#### 策略二：逻辑与视图分离（`.ts`/`.tsx`分家）

巨型文件提取出的非渲染逻辑不进入`components/`，按类型归位：

- `reducers.ts`或纯函数 → `store/`或`utils/`
- hooks → `hooks/`
- 风格常量（如`custom-models-styles`） → `utils/`

#### 策略三：共享判定

- 单个组件内部使用 → 就近放入组件子目录
- feature内多个组件复用 → 放在`components/`平铺层
- 跨feature复用 → 提升到公共层，禁止复制

运行时状态保存在`~/.aijee/`：工作区、模式、会话索引和任务日志均可在重启后恢复；会话激活时才由`SessionRegistry`按其磁盘session file重建。文件、Git和任务cwd必须位于已配置工作区内。

## Rust后端处置

Rust RPC不再是运行时依赖；Server直接调用Pi SDK。确需原生能力时只能作为同一产品包的内部子进程，并通过`EngineSession`或产品服务暴露，禁止恢复第二个用户可见后端。

历史清理目标：2026-09-30；当前代码已满足单包、单Server边界。

## 迁移顺序

已完成：冻结`api-contract` → 建立`engine/core`、`EngineRegistry`与`adapters/pi` → `apps/server`承接Runtime → Web/Mobile合入`apps/client` → 删除Rust RPC与旧适配器。下一步仅增加Codex/OpenCode适配器并复用同一契约。

## 最终验收条件

接入第二个引擎时，`api-contract/openapi.yaml`、`generated-manifest.json`与`client-sdk/src/generated`必须通过生成检查且客户端协议零改动；同时运行REST、SSE、WS契约测试。
