const winston = require('winston');
const path = require('path');
require('dotenv').config();

// 创建日志配置
const setupLogging = () => {
  const logDir = path.join(__dirname, '../../logs');
  
  // 定义日志格式
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  // 控制台输出格式
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    })
  );

  // 创建logger实例
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'license-api' },
    transports: [
      // 写入所有日志到combined.log
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // 单独写入错误日志到error.log
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // 在开发环境下同时输出到控制台
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
    // 启用异常处理
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
    // 记录未处理的Promise拒绝
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
    // 不退出程序
    exitOnError: false,
  });

  // 在生产环境中不输出到控制台
  if (process.env.NODE_ENV === 'production') {
    logger.remove(winston.transports.Console);
  }

  return logger;
};

// 导出logger工具
module.exports = {
  setupLogging,
};