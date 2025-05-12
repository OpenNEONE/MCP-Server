FROM node:20-slim

WORKDIR /app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有项目文件
COPY . .

# 构建 TypeScript 项目
RUN npm run build

# 为 HTTP 模式暴露端口
EXPOSE 3000

# 设置环境变量默认值
ENV MCP_MODE=stdio
ENV HTTP_PORT=3000
ENV HTTP_HOST=0.0.0.0
ENV ENABLE_CORS=true
ENV LOG_LEVEL=info

# 启动 MCP 服务
CMD ["npm", "run", "start"]
