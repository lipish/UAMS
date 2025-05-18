require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { setupLogging } = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const licenseRoutes = require('./routes/license.routes');
const errorHandler = require('./middleware/errorHandler');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 设置日志系统
const logger = setupLogging();

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // 一些旧浏览器 (IE11) 需要这个
}));

// 处理预检请求
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// 路由定义
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('无法连接到数据库，服务器启动中止');
      process.exit(1);
    }

    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`服务器运行在 http://localhost:${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
startServer();