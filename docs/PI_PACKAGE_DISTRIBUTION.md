# PiDeck 一体化安装与发布架构

## 目标

PiDeck 对用户只暴露一个安装入口：

```bash
pi install npm:pideck
```

安装完成后，Pi Package 自动选择当前平台的 PiDeck Server，并负责检测、启动和展示连接状态。用户不需要单独下载 Server、配置路径或手动启动后台进程。

## 设计原则

- 一个 Monorepo：Client、Server、协议、插件和发布脚本统一维护。
- 一个产品版本：插件、启动器和平台二进制使用相同版本发布。
- 一个安装命令：用户只安装 `pideck`。
- 分层运行：Pi 插件负责生命周期，Rust Server 独立提供服务。
- Server 可独立使用：服务器、NAS 和无 Pi TUI 场景仍可直接运行二进制。
- 平台包按需安装：不把全部平台二进制放入同一个 npm 包。

## 仓库结构

```text
PiDeck/
├── apps/
│   ├── web/                    # Web 平台入口
│   ├── mobile/                 # Android / iOS 平台入口
│   └── desktop/                # Desktop 平台入口
├── packages/
│   ├── client/                 # 三端共享前端与 Client SDK
│   └── pideck/                 # Pi Package、CLI、Rust Server
├── tools/                      # 发布准备脚本
└── .github/workflows/          # 构建与统一发布
```

`packages/pideck/server`是Rust源码，Pi入口为`src/extension/index.ts`，CLI与二进制解析属于同一个`pideck`包。平台包由发布脚本临时生成。

## npm 产物

| 包名 | 职责 |
| --- | --- |
| `pideck` | Pi Package、命令注册、Server 生命周期入口 |
| `@pideck/server-linux-x64` | Linux x64 Server |
| `@pideck/server-linux-arm64` | Linux ARM64 Server |
| `@pideck/server-darwin-x64` | macOS Intel Server |
| `@pideck/server-darwin-arm64` | macOS Apple Silicon Server |
| `@pideck/server-win32-x64` | Windows x64 Server |

`pideck`通过`optionalDependencies`声明平台包。npm只安装当前平台产物，内置CLI和Pi扩展共同解析该二进制。

## Pi Package Manifest

`pideck` 必须符合 Pi Package 规范：

```json
{
  "name": "pideck",
  "version": "0.1.0",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension/index.ts"]
  },
  "bin": { "pideck": "./bin/pideck.cjs" },
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*"
  }
}
```

## 安装与启动流程

```text
pi install npm:pideck
        ↓
npm 安装 Pi Package 与当前平台 Server
        ↓
Pi 加载 src/extension/index.ts
        ↓
请求 http://127.0.0.1:5454/api/health
        ↓
┌───────────────────┬────────────────────┐
│ Server 已运行      │ Server 未运行       │
│ 校验版本与协议      │ 定位平台二进制       │
│ 复用现有实例        │ 获取进程锁并启动      │
└───────────────────┴────────────────────┘
        ↓
显示状态、连接地址和配对入口
```

## Server 必备契约

插件依赖以下稳定接口：

```text
GET /api/health          进程是否可用
GET /api/version         产品版本和协议版本
GET /api/runtime/status  Pi、Node、工作目录和运行状态
POST /api/auth/pair      一次性二维码配对
```

建议统一响应：

```json
{
  "ok": true,
  "data": {
    "version": "0.1.0",
    "protocolVersion": 1
  }
}
```

Server 还必须支持：

- 零配置启动并自动创建 `~/.pideck/`。
- 自动发现 Node 和 Pi。
- 端口冲突时返回明确错误。
- 使用 PID 文件或进程锁避免重复实例。
- 支持结构化日志和优雅退出。
- 重启后保留设备授权和 Agent Session。

## 插件职责

插件负责：

- 检测 Server 健康状态和协议兼容性。
- 定位 npm 安装的平台二进制。
- 启动单一 Server 实例。
- 注册 `/pideck`、`/pideck-status`、`/pideck-stop` 和 `/pideck-pair`。
- 通过 `ctx.ui.notify()` 返回真实结果。
- 捕获启动错误并展示日志路径。
- Pi 退出时不误杀由系统服务或其他客户端启动的 Server。

插件不负责：

- 实现 Agent、Session、配对和数据库业务。
- 直接读取或修改 Server 数据库。
- 将 Server 逻辑复制到 TypeScript Extension。

## 生命周期策略

启动前依次检查：

1. 请求健康接口。
2. 校验协议版本。
3. 检查 PID 文件和进程是否存在。
4. 获取跨进程启动锁。
5. 再次检查健康接口，防止并发重复启动。
6. 启动二进制并等待健康接口就绪。
7. 超时后终止本次子进程并返回日志位置。

Server 默认独立于当前 Pi Session 存活，使手机和其他客户端在 Pi TUI 关闭后仍可连接。`/pideck-stop` 只能停止由当前用户管理的 PiDeck 实例。

## 版本策略

- 产品包统一使用同一版本，例如 `0.1.0`。
- 插件声明支持的 `protocolVersion` 范围。
- Server 返回产品版本和协议版本。
- 协议不兼容时禁止复用旧 Server，并提示升级。
- CI 必须先发布平台包，再发布`pideck`。

## 发布流程

```text
Git tag v0.1.0
    ↓
构建并测试 Rust Server
    ↓
生成 Linux / macOS / Windows 二进制
    ↓
组装并发布平台 npm 包
    ↓
执行 Pi Package 本地安装测试
    ↓
发布 pideck
    ↓
验证 pi install npm:pideck
```

每个平台包发布前必须验证 SHA-256、执行权限和 `pideck --version`。任何平台构建失败时，不发布顶层 `pideck`。

## 安全边界

- 健康检查默认只访问 `127.0.0.1`。
- 二进制必须来自同版本 npm 平台包，禁止执行未校验下载文件。
- 二维码使用一次性随机凭据，并具备过期和重放保护。
- Server 暴露局域网时必须保留设备授权与撤销能力。
- 插件不得记录 token、二维码密钥或用户凭据。

## 实施顺序

### P0：完成 Server

- 固定 health、version、runtime 和 pairing 契约。
- 完成零配置启动、进程锁、日志和优雅退出。
- 完成重启恢复、端口冲突和无 Pi 场景测试。

### P1：完成启动器与平台包

- 在`pideck`内完成CLI和平台解析。
- 生成各平台二进制npm包。
- 验证平台解析、权限和版本一致性。

### P2：完成 Pi Package

- 修正 Pi manifest。
- 实现健康检查和 Server 生命周期命令。
- 增加错误反馈、状态和配对入口。

### P3：统一发布

- 建立跨平台 CI。
- 完成 npm provenance、版本编排和发布回滚。
- 使用干净环境验收一条命令安装。

## 最终验收

在未安装 PiDeck 的干净机器上：

```bash
pi install npm:pideck
pi
```

必须满足：

- Pi 正确加载 PiDeck Extension。
- 当前平台 Server 自动安装并只启动一个实例。
- `/pideck-status` 返回健康状态、版本和地址。
- 手机扫码后自动完成配对。
- 关闭 Pi 后 Server 继续运行。
- 再次启动 Pi 时复用已有 Server。
- `pi update npm:pideck` 能完成兼容升级。
