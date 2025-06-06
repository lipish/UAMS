import * as fs from 'fs';

/**
 * 应用配置
 */
export const config = {
  /**
   * 数据库配置
   */
  db: {
    // 数据库连接配置
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'license_app',
    password: process.env.DB_PASSWORD || 'development_password',
    database: process.env.DB_NAME || 'license_management',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    
    // 连接池配置
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
    
    // SSL配置 (生产环境应启用)
    ssl: process.env.NODE_ENV === 'production' ? {
      ca: process.env.DB_SSL_CA || '',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    } : undefined,
  },
  
  /**
   * 应用设置
   */
  app: {
    name: 'UAMS',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: '/api',
    url: process.env.APP_URL || 'http://localhost:3000',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  },
  
  /**
   * 认证设置
   */
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    bcryptSaltRounds: 12,
    cookieName: 'license_auth',
    cookieMaxAge: 86400000, // 1天
  },
  
  /**
   * 日志配置
   */
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxSize: '10m',
    maxFiles: '7d',
  },
  
  /**
   * 邮件配置
   */
  email: {
    from: process.env.EMAIL_FROM || 'license-system@example.com',
    smtp: {
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    },
  },
  
  /**
   * License配置
   */
  license: {
    keyLength: 32,
    keyFormat: 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx',
    expiryNotificationDays: [30, 15, 7, 3, 1],
  },
};

/**
 * 加载环境特定配置
 */
function loadEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  try {
    // 尝试加载环境特定的配置文件
    if (fs.existsSync(`./config.${env}.json`)) {
      const envConfig = JSON.parse(fs.readFileSync(`./config.${env}.json`, 'utf8'));
      return deepMerge(config, envConfig);
    }
  } catch (err) {
    console.warn(`无法加载环境配置文件 config.${env}.json:`, err);
  }
  
  return config;
}

/**
 * 深度合并两个对象
 */
function deepMerge(target: any, source: any) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * 检查值是否为对象
 */
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// 导出合并后的配置
export default loadEnvironmentConfig();