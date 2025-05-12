import * as readline from "readline";
import * as http from "http";
import express from "express";
import cors from "cors";
import { config } from "dotenv";

// 加载 .env 文件中的环境变量
config();

// --- 配置 ---
const CONFIG = {
  mode: process.env.MCP_MODE || "stdio", // 'http' 或 'stdio'
  http: {
    port: parseInt(process.env.HTTP_PORT || "3000", 10),
    host: process.env.HTTP_HOST || "0.0.0.0",
    enableCors: process.env.ENABLE_CORS === "true",
  },
  logLevel: process.env.LOG_LEVEL || "info",
};

// 根据日志级别过滤日志
function log(level: string, ...args: any[]) {
  const levels = ["debug", "info", "warn", "error"];
  const configLevelIndex = levels.indexOf(CONFIG.logLevel);
  const messageLevelIndex = levels.indexOf(level);

  if (messageLevelIndex >= configLevelIndex) {
    console.error(`[${level}]`, ...args);
  }
}

// --- MCP 服务配置 ---
const MCP_VERSION = "0.1.0";

// --- 工具定义 ---

interface ToolInput {
  [key: string]: any;
}

interface ToolOutput {
  [key: string]: any;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchemaDescription: { [key: string]: string };
  outputSchemaDescription: { [key: string]: string };
  execute: (input: ToolInput) => Promise<ToolOutput>;
}

// 1. 文本翻译工具
const translateTextTool: ToolDefinition = {
  name: "translateText",
  description: "将文本翻译成指定的目标语言。",
  inputSchemaDescription: {
    text: "string (需要翻译的文本)",
    targetLanguage: "string (目标语言代码, 例如 'en', 'zh', 'fr')",
  },
  outputSchemaDescription: {
    translatedText: "string (翻译后的文本)",
  },
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    console.error(`[translateText] Received input: ${JSON.stringify(input)}`);
    if (
      typeof input.text !== "string" ||
      typeof input.targetLanguage !== "string"
    ) {
      throw new Error("无效输入：'text' 和 'targetLanguage' 必须是字符串。");
    }
    // 模拟翻译
    const translated = `${input.text} (translated to ${input.targetLanguage})`;
    console.error(
      `[translateText] Sending output: ${JSON.stringify({
        translatedText: translated,
      })}`
    );
    return { translatedText: translated };
  },
};

// 2. 简单加法工具
const addNumbersTool: ToolDefinition = {
  name: "addNumbers",
  description: "计算两个数字的和。",
  inputSchemaDescription: {
    number1: "number (第一个加数)",
    number2: "number (第二个加数)",
  },
  outputSchemaDescription: {
    sum: "number (两个数字的和)",
  },
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    console.error(`[addNumbers] Received input: ${JSON.stringify(input)}`);
    if (
      typeof input.number1 !== "number" ||
      typeof input.number2 !== "number"
    ) {
      throw new Error("无效输入：'number1' 和 'number2' 必须是数字。");
    }
    const sum = input.number1 + input.number2;
    console.error(`[addNumbers] Sending output: ${JSON.stringify({ sum })}`);
    return { sum };
  },
};

// 工具集定义
const toolset = {
  name: "mcp-demo-toolset",
  description: "一个包含文本翻译和简单加法功能的MCP工具集。",
  tools: [translateTextTool, addNumbersTool].map((tool) => ({
    // 只暴露描述，不暴露执行函数给客户端
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchemaDescription, // 在MCP中，这通常是更结构化的JSON Schema
    outputSchema: tool.outputSchemaDescription,
  })),
};

// --- 消息处理 ---

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false, // 确保我们正在读取管道输入而不是 TTY
});

// 发送 JSON-RPC 2.0 响应
function sendJsonRpcResponse(
  id: string | number | null,
  result: any,
  error?: { code: number; message: string; data?: any }
) {
  const response: any = {
    jsonrpc: "2.0",
    id: id,
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  // 在 stdio 模式下，通过 stdout 发送响应
  if (CONFIG.mode === "stdio") {
    const responseStr = JSON.stringify(response);
    process.stdout.write(responseStr + "\n");
    log("debug", `Sent JSON-RPC Response: ${responseStr}`);
  }

  return response;
}

// 发送自定义 MCP 响应
function sendCustomMcpResponse(id: string | null, result: any, error?: any) {
  const response: any = {
    mcp_version: MCP_VERSION,
    id: id,
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  // 在 stdio 模式下，通过 stdout 发送响应
  if (CONFIG.mode === "stdio") {
    const responseStr = JSON.stringify(response);
    process.stdout.write(responseStr + "\n");
    log("debug", `Sent Custom MCP Response: ${responseStr}`);
  }

  return response;
}

async function handleRequest(request: any) {
  if (request.jsonrpc === "2.0") {
    // 处理 JSON-RPC 2.0 请求
    const { id, method, params } = request;
    log(
      "debug",
      `[JSON-RPC] Received method: ${method}, id: ${id}, params: ${JSON.stringify(
        params
      )}`
    );

    switch (method) {
      case "initialize":
        // 对于 initialize 请求，返回服务器能力
        return sendJsonRpcResponse(id, { capabilities: {} });
      case "shutdown":
        // 客户端请求关闭，服务器应准备关闭并响应
        log(
          "info",
          "[JSON-RPC shutdown] Received shutdown request. Server will allow exit."
        );
        return sendJsonRpcResponse(id, null);
      default:
        return sendJsonRpcResponse(id, null, {
          code: -32601,
          message: "Method not found",
        });
    }
  } else {
    // 处理自定义 MCP 请求
    const { mcp_version, id, method, toolName, inputs } = request;
    log(
      "debug",
      `[Custom MCP] Received method: ${method}, toolName: ${toolName}, id: ${id}, mcp_version: ${mcp_version}`
    );

    if (mcp_version && mcp_version !== MCP_VERSION) {
      return sendCustomMcpResponse(id, null, {
        code: "VersionMismatch",
        message: `不支持的 MCP 版本: ${mcp_version}。需要 ${MCP_VERSION}`,
      });
    }

    switch (method) {
      case "discover":
        log("debug", "[Custom MCP discover] Received discovery request.");
        return sendCustomMcpResponse(id, { toolsets: [toolset] });
      case "execute":
        log(
          "debug",
          `[Custom MCP execute] Received execute request for tool: ${toolName}`
        );
        const toolToExecute = [translateTextTool, addNumbersTool].find(
          (t) => t.name === toolName
        );
        if (toolToExecute) {
          try {
            const result = await toolToExecute.execute(inputs);
            return sendCustomMcpResponse(id, result);
          } catch (e: any) {
            log("error", `Error executing tool ${toolName}:`, e);
            return sendCustomMcpResponse(id, null, {
              code: "ToolExecutionError",
              message: e.message || "工具执行时发生未知错误。",
            });
          }
        } else {
          return sendCustomMcpResponse(id, null, {
            code: "ToolNotFound",
            message: `未找到工具: ${toolName}`,
          });
        }
      default:
        return sendCustomMcpResponse(id, null, {
          code: "MethodNotFound",
          message: `未知自定义方法: ${method}`,
        });
    }
  }
}

// --- 主程序 ---
async function main() {
  if (CONFIG.mode === "http") {
    startHttpServer();
  } else {
    startStdioServer();
  }
}

// 启动基于 HTTP 的服务器
function startHttpServer() {
  const app = express();
  const server = http.createServer(app);

  // 配置中间件
  app.use(express.json());
  if (CONFIG.http.enableCors) {
    app.use(cors());
  }

  // MCP 服务路由 - 处理所有 MCP 请求
  app.post("/mcp", async (req, res) => {
    try {
      log("debug", "Received HTTP request:", req.body);

      // 处理 MCP 请求
      const request = req.body;
      await handleRequest(request)
        .then((response) => {
          // handleRequest 直接通过 stdout 发送响应，所以我们需要劫持这个过程
          // 这个实现是不完美的，但演示了基本思路
          res.json(response);
        })
        .catch((error) => {
          log("error", "Error handling MCP request:", error);
          res.status(500).json({
            error: {
              code: "InternalServerError",
              message: error.message || "处理请求时发生内部错误。",
            },
          });
        });
    } catch (error: any) {
      log("error", "Error processing HTTP request:", error);
      res.status(400).json({
        error: {
          code: "BadRequest",
          message: error.message || "请求格式错误。",
        },
      });
    }
  });

  // 健康检查路由
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // API 文档路由
  app.get("/", (req, res) => {
    res.status(200).send(`
      <html>
        <head><title>MCP 服务 API</title></head>
        <body>
          <h1>MCP 服务 API</h1>
          <p>这是一个符合 Model Context Protocol 的服务，提供以下工具:</p>
          <ul>
            <li><strong>translateText</strong>: 将文本翻译成指定的目标语言</li>
            <li><strong>addNumbers</strong>: 计算两个数字的和</li>
          </ul>
          <h2>API 端点</h2>
          <ul>
            <li><code>POST /mcp</code> - MCP 请求端点</li>
            <li><code>GET /health</code> - 健康检查端点</li>
          </ul>
        </body>
      </html>
    `);
  });

  // 启动服务器
  server.listen(CONFIG.http.port, CONFIG.http.host, () => {
    log(
      "info",
      `HTTP MCP Server running at http://${CONFIG.http.host}:${CONFIG.http.port}/`
    );
    log("info", "Available endpoints:");
    log("info", "  POST /mcp - MCP 请求端点");
    log("info", "  GET /health - 健康检查端点");
  });

  // 处理服务器关闭
  server.on("close", () => {
    log("info", "HTTP server closed");
  });

  // 处理未捕获的异常
  server.on("error", (error) => {
    log("error", "HTTP server error:", error);
  });
}

// 启动基于标准输入/输出的服务器
function startStdioServer() {
  log("info", "MCP Service starting in stdio mode... Listening on stdin.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    log("debug", `Received line: ${line}`);
    try {
      const request = JSON.parse(line);
      handleRequest(request).catch((err) => {
        log("error", "Error handling request:", err);
        // 尝试发送一个通用错误响应，如果请求ID可用
        const requestId =
          request && typeof request.id !== "undefined" ? request.id : null;
        sendCustomMcpResponse(requestId, null, {
          code: "InternalServerError",
          message: "处理请求时发生内部错误。",
        });
      });
    } catch (e: any) {
      log("error", "Failed to parse JSON request:", e.message);
      // 如果JSON解析失败，我们可能没有请求ID
      sendCustomMcpResponse(null, null, {
        code: "InvalidRequest",
        message: "请求必须是有效的JSON。",
      });
    }
  });

  rl.on("close", () => {
    log("info", "Stdin stream closed. Exiting.");
    process.exit(0);
  });
}

// 捕获未处理的Promise拒绝
process.on("unhandledRejection", (reason, promise) => {
  log("error", "Unhandled Rejection at:", promise, "reason:", reason);
});

// 捕获未捕获的异常
process.on("uncaughtException", (error) => {
  log("error", "Uncaught Exception:", error);
  process.exit(1); // 对于未捕获的异常，强制退出是推荐的做法
});

// 启动服务
main().catch((error) => {
  log("error", "Error starting MCP service:", error);
  process.exit(1);
});
