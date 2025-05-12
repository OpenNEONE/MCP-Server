<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot 指导说明

这是一个基于 TypeScript 的 Model Context Protocol (MCP) 服务项目。

## 项目概述

该项目实现了一个 MCP 服务，包含文本翻译和简单加法两个工具能力。MCP 是一种标准化协议，用于构建可被 AI 代理调用的工具。

## 相关资源

- MCP 官方文档: https://modelcontextprotocol.io/
- MCP SDK 文档: https://github.com/modelcontextprotocol/create-python-server
- TypeScript MCP 示例: https://github.com/modelcontextprotocol/quickstart-resources/tree/main/weather-server-typescript

## 代码约定

- 使用 TypeScript 类型标注
- 使用 ES 模块
- 使用 zod 进行参数验证
- 使用 StdioServerTransport 进行通信

## 最佳实践

- 每个工具函数应该包含明确的参数类型定义
- 每个工具应该有详细的描述信息
- 使用 console.error 输出日志信息，因为 console.log 被用于 MCP 通信
- 始终提供适当的错误处理
