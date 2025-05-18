import { Pool } from 'pg';

// 数据库连接配置
const pool = new Pool({
  user: 'license_admin',
  host: 'localhost',
  database: 'license_management',
  password: 'license123',
  port: 5432,
});

// 执行SQL查询的通用函数
export async function query(text: string, params?: any[]) {
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
}

// 获取连接池客户端（用于事务）
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// 测试数据库连接
export async function testConnection() {
  try {
    const res = await query('SELECT NOW()');
    console.log('数据库连接成功:', res.rows[0]);
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

export default {
  query,
  getClient,
  testConnection,
};