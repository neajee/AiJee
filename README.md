# AiJee

AiJee —— Pi Coding Agent everywhere。

AiJee 是面向 [Pi Coding Agent](https://github.com/badlogic/pi-mono/) 的多端控制台：在一台机器安装AiJee，即可通过Web、手机或桌面端使用同一套Pi Runtime。

## 快速开始

### 连接客户端

1. 打开 AiJee Web、移动端或桌面端。
2. 选择“添加服务器”。
3. 输入或扫描 AiJee Runtime终端中的连接信息。
4. 配对完成后即可创建工作区和 Coding Session。

### Pi 插件

AiJee可以通过Pi插件自动启动本地SDK Runtime：

```bash
pi install npm:aijee
```

架构规范见[架构规范](docs/spec/architecture.md)，SDK适配见[引擎适配约定](docs/spec/engines.md)。

## 架构

```text
apps/client + apps/desktop → packages/ui → packages/client-sdk
apps/server → packages/engine → Pi SDK
```

目录职责：

```text
apps/server                      唯一后端、CLI、REST/SSE/WS与运行时
apps/client                      Expo Web / iOS / Android客户端
apps/desktop                     Electron 外壳与Server发现
packages/engine                  统一引擎抽象与适配器
packages/api-contract            OpenAPI协议唯一源头
packages/client-sdk              生成客户端与薄封装
packages/ui                      跨端组件、状态与数据hooks
```

## 配置

首次启动后访问：

```text
http://localhost:10088/setup
```

输入终端显示的Setup Code、管理员账号和密码完成初始化。初始化前仅开放静态资源、健康检查和Setup接口；初始化完成后Setup流程关闭。

重置管理员认证并撤销全部登录Token和已配对设备：

```bash
aijee auth reset
```

默认运行状态文件：

```text
~/.aijee/runtime.json
```

可用环境变量：

```toml
AIJEE_HOST=0.0.0.0
AIJEE_PORT=10088
AIJEE_STATE_PATH=~/.aijee/runtime.json
```

## 开发

环境要求：Node.js 22+、Yarn 4。

```bash
yarn install
yarn web                  # 启动 Web 开发端
yarn android              # 启动 Android
yarn ios                  # 启动 iOS
yarn runtime:check       # 检查 Pi SDK Runtime
yarn runtime:start       # 启动 Runtime Web 服务
yarn desktop             # 启动 Desktop Shell
```

构建生产版本：

```bash
yarn build:prod
```

构建 Android APK：

```bash
cd apps/client
eas build --platform android --profile preview --local
```

## 截图

<p float="left">
  <img src="docs/screenshots/mobile-workspace-home.png" width="250" alt="移动端工作区" />
  <img src="docs/screenshots/mobile-workspaces-sessions.jpeg" width="250" alt="工作区与会话" />
</p>

<p float="left">
  <img src="docs/screenshots/mobile-chat-mode.jpeg" width="250" alt="移动端对话" />
  <img src="docs/screenshots/mobile-settings.jpeg" width="250" alt="移动端设置" />
</p>

<img src="docs/screenshots/desktop-code-session.png" width="700" alt="桌面端代码会话" />
