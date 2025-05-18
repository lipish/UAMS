require('dotenv').config();
const { Pool } = require('pg');

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'license_management',
  user: process.env.DB_USER || 'license_admin',
  password: process.env.DB_PASSWORD || 'license123',
  // 连接池配置
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 连接最大空闲时间（毫秒）
  connectionTimeoutMillis: 2000, // 连接超时时间（毫秒）
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('数据库连接成功');
    client.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

// 执行SQL查询的通用函数
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('执行查询', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('查询错误', { text, error });
    throw error;
  }
};

// 获取客户端（用于事务）
const getClient = async () => {
  const client = await pool.connect();
  
  // 定义执行事务查询的函数
  const transactionQuery = async (text, params = []) => {
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    client,
    query: transactionQuery,
    release: () => client.release(),
    commit: async () => {
      await client.query('COMMIT');
      client.release();
    },
    rollback: async () => {
      await client.query('ROLLBACK');
      client.release();
    }
  };
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};