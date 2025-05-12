# MCP 服务示例

这个项目是一个 Model Context Protocol (MCP) 服务示例，实现了两个能力：
- 文本翻译工具 (translateText)
- 简单加法计算工具 (addNumbers)

该项目演示了如何从零开始搭建一个 MCP 服务，包括能力定义、执行接口和容器化部署。服务支持通过 stdio 本地通信和 HTTP 远程调用两种方式。

## 目录

- [功能描述](#功能描述)
- [通信模式](#通信模式)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [测试](#测试)
- [与 Claude for Desktop 集成](#与-claude-for-desktop-集成)
- [Docker 部署](#docker-部署)
- [项目结构](#项目结构)
- [扩展与改进](#扩展与改进)
- [常见问题](#常见问题)

## 功能描述

### 文本翻译工具 (translateText)

这个工具可以将文本从一种语言翻译到另一种语言。在示例实现中，我们提供了简单的模拟翻译功能。

参数：
- `text`: 要翻译的文本
- `targetLanguage`: 目标语言代码，如 'en', 'zh', 'fr' 等

### 简单加法工具 (addNumbers)

这个工具可以执行两个数字的加法运算。

参数：
- `number1`: 第一个数字
- `number2`: 第二个数字

## 通信模式

本服务支持两种通信模式：

### stdio 模式

通过标准输入/输出与 MCP 客户端通信，适合本地集成或通过管道连接。这是 VS Code 等 IDE 中 MCP 工具的默认通信方式。

### HTTP 模式

启动一个 Web 服务器，通过 HTTP 协议接收和响应 MCP 请求，支持远程调用。

在 HTTP 模式下，服务提供以下端点：
- `POST /mcp` - 主要的 MCP 请求端点
- `GET /health` - 健康检查端点
- `GET /` - API 文档页面

## 技术栈

- 语言: TypeScript
- 运行时: Node.js
- Web 框架: Express (HTTP 模式)
- 参数验证: TypeScript 类型系统
- 环境配置: dotenv
- 容器化: Docker

## 快速开始

如果你只想快速运行这个服务，可以按照以下步骤操作：

```bash
# 克隆仓库
git clone <repository-url>
cd mcp-demo

# 安装依赖
npm install

# 构建并启动 (默认 stdio 模式)
npm run dev

# 构建并以 HTTP 模式启动
MCP_MODE=http npm run dev
```

## 配置

服务通过环境变量或 `.env` 文件进行配置。可用的配置选项包括：

| 环境变量 | 说明 | 默认值 |
|----------|------|---------|
| MCP_MODE | 服务模式 (`http` 或 `stdio`) | `stdio` |
| HTTP_PORT | HTTP 服务端口 | `3000` |
| HTTP_HOST | HTTP 服务主机 | `0.0.0.0` |
| ENABLE_CORS | 是否启用 CORS | `true` |
| LOG_LEVEL | 日志级别 (`debug`, `info`, `warn`, `error`) | `info` |

## 本地开发

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd mcp-demo

# 安装依赖
npm install
```

### 构建

```bash
npm run build
```

### 运行

```bash
npm run start
```

### 开发模式 (构建并运行)

```bash
npm run dev
```

## 测试

本项目提供了两种测试方法：

### 自动化测试

使用 Node.js 测试脚本：

```bash
npm test
```

这将启动一个测试客户端，该客户端会向 MCP 服务发送请求并显示响应。

### 手动测试

使用 shell 脚本进行手动测试：

```bash
chmod +x test/manual-test.sh
./test/manual-test.sh
```

此脚本使用命名管道与服务通信，并显示请求和响应。

## 与 Claude for Desktop 集成

要将此 MCP 服务与 Claude for Desktop 集成，您需要编辑 Claude 配置文件：

1. 找到或创建 Claude 配置文件：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%AppData%\Claude\claude_desktop_config.json`

2. 添加以下配置（替换路径为实际路径）：

```json
{
  "mcpServers": {
    "mcp-demo": {
      "command": "node",
      "args": [
        "/absolute/path/to/your/mcp-demo/build/index.js"
      ]
    }
  }
}
```

3. 重启 Claude for Desktop

4. 在 Claude 中，您应该能够看到可用工具图标，并可以使用如下提示测试：
   - "请将'hello'从英文翻译成中文"
   - "请计算 42 加 58"

## Docker 部署

### 构建 Docker 镜像

```bash
npm run docker:build
```

或直接使用 Docker 命令：

```bash
docker build -t mcp-demo-service .
```

### 运行 Docker 容器

```bash
npm run docker:run
```

或直接使用 Docker 命令：

```bash
docker run -it --rm --name mcp-demo-service mcp-demo-service
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 项目结构

```
mcp-demo/
├── .github/                  # GitHub 相关文件
│   └── copilot-instructions.md  # Copilot 指导说明
├── .vscode/                  # VS Code 配置
│   ├── tasks.json           # VS Code 任务
│   └── mcp.json             # MCP 集成配置
├── build/                    # 构建输出目录
│   └── index.js             # 编译后的 JavaScript 文件
├── src/                      # 源代码目录
│   └── index.ts             # 主入口文件
├── test/                     # 测试目录
│   ├── test-client.js       # 测试客户端
│   └── manual-test.sh       # 手动测试脚本
├── .gitignore                # Git 忽略文件
├── CHANGELOG.md              # 更新日志
├── claude_desktop_config.json.example  # Claude for Desktop 配置示例
├── docker-compose.yml        # Docker Compose 配置
├── Dockerfile                # Docker 构建文件
├── package.json              # npm 配置
├── README.md                 # 项目说明
└── tsconfig.json             # TypeScript 配置
```

## 扩展与改进

这个示例可以通过以下方式进行扩展：

1. 添加更多工具能力
   - 文件处理工具
   - 数据分析工具
   - 网络请求工具

2. 增强现有工具
   - 集成真实的翻译 API (如 Google Translate, DeepL 等)
   - 增加更复杂的数学运算 (如支持四则运算、三角函数等)

3. 添加资源管理
   - 实现 MCP 资源接口
   - 提供文件访问能力

4. 提升可靠性
   - 增加错误处理
   - 添加单元测试
   - 实现日志系统

5. 改进部署
   - 添加 CI/CD 配置
   - 支持云部署

## 常见问题

### Q: 如何调试 MCP 服务?
A: 您可以使用 `console.error()` 输出调试信息，因为 `console.log()` 被用于 MCP 通信。另外，您也可以使用测试脚本来检查服务的响应。

### Q: 如何向 MCP 服务添加新工具?
A: 参考现有工具定义，使用 `server.tool()` 方法添加新工具。确保为每个参数提供类型定义和描述。

### Q: 为什么要使用 Docker 部署?
A: Docker 提供了一致的运行环境，使服务更容易在不同系统上部署和运行。它也简化了依赖管理和版本控制。

### Q: 如何获取更多 MCP 资源?
A: 访问 [Model Context Protocol 官方网站](https://modelcontextprotocol.io/) 获取更多文档和示例。
