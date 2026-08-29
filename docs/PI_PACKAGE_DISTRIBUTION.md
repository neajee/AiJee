# PiDeck 运行与发布架构

> 当前目录与运行边界以[`docs/spec/architecture.md`](spec/architecture.md)为准；本文保留`pideck`发布包的兼容与迁移记录。

## 架构状态

目标架构已定稿：`pideck`发布包由`apps/server`构建，Node Runtime通过`packages/engine`适配Pi SDK；REST/SSE与产品服务集中在唯一Server。

## 目标

PiDeck对用户只暴露一个安装单元和一个命令：

```bash
npm install -g pideck
pideck
```

`pideck`安装包包含`apps/server`构建产物及其运行时依赖；用户不需要分别安装Gateway或第二个后端服务。

安装在不同机器上的仍是同一个PiDeck：

- 个人电脑：打开Desktop，并同时提供本机Web界面。
- 服务器或NAS：无界面运行，通过浏览器和移动端远程访问。
- 局域网设备：按配置暴露受保护的远程接口。
- Android和iOS：作为客户端连接PiDeck主机，不承担常驻Agent Runtime。

## 核心原则

- 一个产品包：Pi SDK和服务能力随`pideck`安装。
- 一个Agent Runtime：同一机器内只维护一套会话、模型和事件状态。
- 多种启动模式：Desktop、Web和Remote Server不是三套后端。
- 一个协议入口：Web、Desktop和Mobile都使用同一REST/SSE/WebSocket契约。
- SDK直连：Runtime通过`createAgentSessionRuntime()`使用Pi SDK，不启动`pi --mode rpc`子进程。
- 本地优先：数据、会话和工具默认运行在安装PiDeck的机器上。

## 目标运行结构

```text
pideck
├── Pi Runtime
│   ├── AgentSessionRuntime
│   ├── Session Registry
│   ├── ModelRuntime
│   ├── ResourceLoader
│   └── Tools / Extensions
├── Product Services
│   ├── Auth / Pairing
│   ├── Workspace / Files / Terminal
│   ├── REST / SSE / WebSocket
│   └── Persistence / Logs
├── Web Assets
└── Launchers
    ├── Desktop Window
    └── Headless Process
```

这里的HTTP服务是PiDeck进程内部的产品接口，不是需要用户单独部署的后端。

## 启动模式

```bash
pideck                 # 启动本机Runtime并提供Web与远程连接
pideck serve           # 无界面运行（与默认命令相同）
pideck auth reset      # 重置管理员认证和设备授权
```

所有模式共享相同配置目录和单实例锁。Desktop只负责创建窗口并加载本机Web地址，不复制Agent逻辑。

## 仓库职责

```text
PiDeck/
├── apps/
│   ├── server/                 # 唯一后端、CLI与Pi SDK Runtime
│   ├── client/                 # Expo Web/Android/iOS客户端
│   └── desktop/                # Desktop壳，不持有Agent业务
├── packages/
│   ├── engine/                 # 引擎核心与Pi适配器
│   ├── api-contract/           # OpenAPI唯一源头
│   ├── client-sdk/             # 外部API、SSE和WebSocket客户端
│   └── ui/                     # 多端共享界面与feature
└── docs/
```

`apps/server`是唯一可独立运行的核心包。Web构建产物在发布时复制进该包；Desktop发布物复用同一Runtime，不另建服务实现。

## 进程与状态边界

单台机器默认只有一个PiDeck Runtime进程：

- Runtime拥有所有`AgentSessionRuntime`实例。
- 每个工作会话对应一个Session Registry记录。
- `newSession()`、`switchSession()`和`fork()`替换活动Session后，Runtime必须重新绑定事件订阅与扩展。
- 浏览器刷新、Desktop窗口关闭或客户端断线不能销毁仍在运行的Agent Session。
- 最后一个界面关闭后是否退出由运行模式决定：Desktop可配置退出，`serve`必须继续运行。

## 接口边界

客户端继续只依赖`@pideck/client-sdk`：

```text
Web / Desktop / Mobile
        ↓
@pideck/client-sdk
        ↓
REST + SSE + WebSocket
        ↓
pideck Runtime
        ↓
Pi SDK
```

OpenAPI仍是客户端协议源。Pi SDK事件在Runtime内转换成现有PiDeck事件，不把Pi SDK对象直接暴露给客户端。

## 安装与发布

### npm安装

```bash
npm install -g pideck
pideck serve
```

顶层包必须包含：

- Pi SDK运行依赖。
- PiDeck Runtime和CLI。
- 已构建Web静态资源。
- 数据库迁移和默认配置。
- 当前平台确实需要的可选原生模块。

不再发布仅用于启动Rust Gateway的`@pideck/server-*`平台包。若VNC、PTY等能力必须保留原生实现，应作为同一产品包的内部原生模块，而不是第二个用户可见服务。

### Pi Package安装

```bash
pi install npm:pideck
```

Pi扩展只复用或启动本机PiDeck实例，并展示状态与连接入口；它不再查找Pi二进制，也不管理RPC子进程。

### Desktop发布

Desktop安装器打包同版本Web资源和PiDeck Runtime。Electron主进程启动或复用本机实例，窗口加载受保护的本机地址。Desktop与npm安装版必须使用同一配置、协议版本和数据格式。

## 安全边界

- 首次启动创建`~/.pideck/`并生成一次性Setup Code。
- Setup Code只用于初始化；设备配对使用独立的五分钟轮换码，且由已认证设备获取。
- 初始化前只开放静态资源、`/health`和`/setup`。
- 默认本机地址可直接用于Desktop；绑定局域网地址时必须启用认证和设备授权。
- Token、Setup Code、二维码内容和模型密钥不得写入日志。
- Agent工具权限按工作区隔离，远程客户端不能绕过Runtime权限策略。

## 迁移计划

### P0：冻结外部契约

- 为现有会话、消息、模型、队列、终止和事件顺序补充契约测试。
- 标记哪些接口是Pi RPC形状，定义稳定的PiDeck领域事件。
- 保持`@pideck/client-sdk`调用方式不变。

### P1：建立SDK Runtime

- 将`@earendil-works/pi-coding-agent`从peer/dev依赖改为`pideck`的固定生产依赖。
- 在`apps/server`增加Runtime入口、Session Registry和生命周期管理；由`packages/engine/adapters/pi`封装Pi SDK。
- 使用`createAgentSessionRuntime()`创建、恢复、切换和释放会话。
- 将Pi SDK事件转换为现有SSE/WebSocket事件。
- 实现异常退出恢复、并发创建去重、空闲释放和优雅关闭。

### P2：迁移产品服务

- 将Rust中的鉴权、配对、配置、工作区和持久化逐项迁入Runtime。
- 文件、终端和VNC按能力迁移；确需原生实现的部分改为内部模块。
- 让Web构建产物由Runtime直接托管。

### P3：切换启动与发布

- 将`pideck`CLI改为启动同包Runtime。
- Desktop改为复用本机Runtime；Pi扩展删除平台二进制解析。
- 发布单包安装产物并完成Linux、macOS和Windows干净环境测试。

### P4：删除RPC与Rust Gateway

- 删除`PiAgentProvider`、JSONL命令映射和`pi --mode rpc`进程管理。
- 删除`@pideck/server-*`发布流程和遗留配置。
- 契约fixture、SDK Runtime集成测试和打包检查均已纳入验证。

## 代码落点

Runtime代码落点：

```text
apps/server/src/
├── main.ts                    # Runtime启动与优雅退出
├── api/                       # REST/SSE/WS边界
├── auth/                      # 认证与配对
├── sessions/                  # Session Registry与生命周期
├── orchestrator/              # 任务与产品服务
└── storage/                   # 状态持久化
packages/engine/src/
├── core/                      # 引擎无关接口与事件
└── adapters/pi/               # Pi SDK会话包装与事件适配
```

验收标准：可直接通过SDK创建会话、发送消息、接收流事件、终止任务并释放会话；HTTP层保持既有REST/SSE路径与响应包络。

## 最终验收

在未安装PiDeck和Pi CLI的干净机器上：

```bash
npm install -g pideck
pideck serve
```

必须满足：

- 一个安装包即可创建Pi会话并调用模型。
- 浏览器可直接打开本机Web界面。
- Desktop复用同一Runtime和会话。
- 手机可通过授权连接该机器。
- 客户端断线后任务继续执行，重连后恢复状态。
- 全程不启动`pi --mode rpc`，也不要求用户部署第二个服务。
