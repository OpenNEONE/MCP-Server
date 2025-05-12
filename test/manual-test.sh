#!/usr/bin/env zsh

# 这个脚本用于与我们的 MCP 服务进行交互测试
# 它手动构造 MCP 请求并通过标准输入/输出与服务通信

# 确保构建是最新的
echo "正在构建 MCP 服务..."
npm run build

# 创建一个 FIFO 用于通信
FIFO_IN=/tmp/mcp_in_pipe
FIFO_OUT=/tmp/mcp_out_pipe

# 确保 FIFO 存在并且是干净的
rm -f $FIFO_IN $FIFO_OUT
mkfifo $FIFO_IN $FIFO_OUT

# 启动服务（后台）
echo "启动 MCP 服务..."
cat $FIFO_IN | MCP_MODE=stdio node build/index.js > $FIFO_OUT &
SERVICE_PID=$!

# 确保脚本退出时清理
function cleanup {
  echo "正在清理..."
  kill $SERVICE_PID 2>/dev/null
  rm -f $FIFO_IN $FIFO_OUT
  exit
}
trap cleanup EXIT INT TERM

# 等待一会儿确保服务已启动
sleep 1

# 发送初始化请求 (JSON-RPC 2.0)
echo "发送初始化请求..."
echo '{"jsonrpc":"2.0","id":"init-request","method":"initialize","params":{}}' > $FIFO_IN

# 等待响应
RESPONSE=$(cat $FIFO_OUT)
echo "初始化响应: $RESPONSE"

# 发送发现请求 (MCP 格式)
echo "发送发现请求..."
echo '{"mcp_version":"0.1.0","id":"discover-request","method":"discover"}' > $FIFO_IN

# 等待响应
RESPONSE=$(cat $FIFO_OUT)
echo "发现响应: $RESPONSE"

# 测试翻译工具
echo "测试翻译工具..."
echo '{"mcp_version":"0.1.0","id":"translate-request","method":"execute","toolName":"translateText","inputs":{"text":"hello world","targetLanguage":"zh"}}' > $FIFO_IN

# 等待响应
RESPONSE=$(cat $FIFO_OUT)
echo "翻译响应: $RESPONSE"

# 测试加法工具
echo "测试加法工具..."
echo '{"mcp_version":"0.1.0","id":"add-request","method":"execute","toolName":"addNumbers","inputs":{"number1":42,"number2":58}}' > $FIFO_IN

# 等待响应
RESPONSE=$(cat $FIFO_OUT)
echo "加法响应: $RESPONSE"

# 关闭连接
echo "测试完成，关闭连接..."

# 清理过程由 cleanup 函数处理
echo "脚本结束"
