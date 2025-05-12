#!/usr/bin/env node

/**
 * MCP HTTP 客户端
 * 
 * 这个脚本用于通过 HTTP 与 MCP 服务进行通信
 * 它支持发现工具、调用翻译工具和调用加法工具
 * 
 * 使用方法:
 *   node http-client.js discover
 *   node http-client.js translate "你好世界" "en"
 *   node http-client.js add 5 7
 */

import fetch from 'node-fetch';

// 配置
const MCP_VERSION = '0.1.0';
const API_URL = process.env.MCP_API_URL || 'http://localhost:3000/mcp';

// 解析命令行参数
const [,, command, ...args] = process.argv;

// 主函数
async function main() {
  try {
    switch(command) {
      case 'discover':
        await discoverTools();
        break;
      case 'translate':
        if (args.length < 2) {
          console.error('用法: node http-client.js translate "<文本>" "<目标语言>"');
          process.exit(1);
        }
        await translateText(args[0], args[1]);
        break;
      case 'add':
        if (args.length < 2) {
          console.error('用法: node http-client.js add <数字1> <数字2>');
          process.exit(1);
        }
        await addNumbers(Number(args[0]), Number(args[1]));
        break;
      default:
        console.log(`
MCP HTTP 客户端

支持的命令:
  discover                 发现可用工具
  translate <文本> <语言>   翻译文本到指定语言
  add <数字1> <数字2>       计算两个数字的和

示例:
  node http-client.js discover
  node http-client.js translate "你好世界" "en"
  node http-client.js add 5 7
        `);
    }
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

// 发现工具
async function discoverTools() {
  console.log('正在发现可用工具...');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mcp_version: MCP_VERSION,
      id: 'discover-' + Date.now(),
      method: 'discover'
    })
  });
  
  const result = await response.json();
  console.log('工具集:');
  console.log(JSON.stringify(result, null, 2));
}

// 翻译文本
async function translateText(text, targetLanguage) {
  console.log(`正在将文本 "${text}" 翻译为 ${targetLanguage}...`);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mcp_version: MCP_VERSION,
      id: 'translate-' + Date.now(),
      method: 'execute',
      toolName: 'translateText',
      inputs: {
        text,
        targetLanguage
      }
    })
  });
  
  const result = await response.json();
  if (result.error) {
    throw new Error(`翻译出错: ${result.error.message || JSON.stringify(result.error)}`);
  }
  
  console.log('翻译结果:');
  console.log(` - 原文: ${text}`);
  console.log(` - 译文: ${result.result.translatedText}`);
}

// 加法计算
async function addNumbers(number1, number2) {
  console.log(`正在计算 ${number1} + ${number2}...`);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mcp_version: MCP_VERSION,
      id: 'add-' + Date.now(),
      method: 'execute',
      toolName: 'addNumbers',
      inputs: {
        number1,
        number2
      }
    })
  });
  
  const result = await response.json();
  if (result.error) {
    throw new Error(`计算出错: ${result.error.message || JSON.stringify(result.error)}`);
  }
  
  console.log('计算结果:');
  console.log(` ${number1} + ${number2} = ${result.result.sum}`);
}

// 运行主函数
main().catch(err => {
  console.error('执行过程中发生错误:', err);
  process.exit(1);
});
