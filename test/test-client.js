#!/usr/bin/env node

/**
 * 这是一个简单的测试脚本，用于测试 MCP 服务
 * 它通过管道与服务通信，模拟 MCP 客户端的行为
 */

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, '../build/index.js');

// 启动 MCP 服务
const mcpServer = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    MCP_MODE: 'stdio', // 确保使用 stdio 模式
    LOG_LEVEL: 'debug' // 设置更详细的日志级别
  }
});

// 处理服务器输出
mcpServer.stdout.on('data', (data) => {
  console.log(`收到服务器响应: ${data}`);
  processServerResponse(data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.error(`服务器日志: ${data}`);
});

mcpServer.on('close', (code) => {
  console.log(`服务进程已退出，退出码: ${code}`);
});

// 处理服务器响应
function processServerResponse(response) {
  try {
    const json = JSON.parse(response);
    console.log('解析后的响应:', JSON.stringify(json, null, 2));
    
    // 如果需要，可以在此处添加更多响应处理逻辑
  } catch (error) {
    console.error('解析响应时出错:', error);
  }
}

// 等待服务启动
setTimeout(() => {
  // 发送 JSON-RPC 2.0 格式的初始化请求
  sendRequest({
    jsonrpc: "2.0",
    id: "initialize-request",
    method: "initialize",
    params: {}
  });
  
  // 等待初始化完成后，发送发现请求
  setTimeout(() => {
    sendDiscoveryRequest();
  }, 1000);
  
  // 然后测试翻译工具
  setTimeout(() => {
    testTranslation();
  }, 2000);
  
  // 再等待一段时间，测试加法工具
  setTimeout(() => {
    testAddition();
  }, 3000);
  
  // 最后关闭连接
  setTimeout(() => {
    sendRequest({
      jsonrpc: "2.0",
      id: "shutdown-request",
      method: "shutdown",
      params: {}
    });
    
    setTimeout(() => {
      mcpServer.kill();
    }, 500);
  }, 4000);
}, 1000);

// 发送请求至 MCP 服务
function sendRequest(request) {
  const requestStr = JSON.stringify(request) + "\n";
  console.log(`发送请求: ${requestStr}`);
  mcpServer.stdin.write(requestStr);
}

// 发送发现请求
function sendDiscoveryRequest() {
  sendRequest({
    mcp_version: "0.1.0",
    id: "discovery-request",
    method: "discover"
  });
}

// 测试翻译工具
function testTranslation() {
  sendRequest({
    mcp_version: "0.1.0",
    id: "translation-request",
    method: "execute",
    toolName: "translateText",
    inputs: {
      text: "hello world",
      targetLanguage: "zh"
    }
  });
}

// 测试加法工具
function testAddition() {
  sendRequest({
    mcp_version: "0.1.0",
    id: "addition-request",
    method: "execute",
    toolName: "addNumbers",
    inputs: {
      number1: 42,
      number2: 58
    }
  });
}
