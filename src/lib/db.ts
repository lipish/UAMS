import { Pool, PoolClient } from 'pg';
import { config } from '@/lib/config';

// 创建数据库连接池
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 连接最大空闲时间
  connectionTimeoutMillis: 2000, // 连接超时
  ssl: config.db.ssl ? {
    rejectUnauthorized: true,
    ca: Buffer.from(config.db.ssl.ca, 'base64').toString('ascii')
  } : undefined
});

// 错误监听
pool.on('error', (err) => {
  console.error('PostgreSQL 连接池发生错误:', err);
});

// 执行查询的辅助函数
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // 记录长时间查询用于性能调优
    if (duration > 500) {
      console.warn(`长时间查询 (${duration}ms): ${text}`, params);
    }
    
    return res.rows as T[];
  } catch (err) {
    console.error('查询执行错误:', err);
    throw new Error(`数据库查询失败: ${(err as Error).message}`);
  }
}

// 单一记录查询
export async function queryOne<T>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

// 事务处理
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// 分页查询辅助函数
export async function paginatedQuery<T>(
  baseQuery: string,
  countQuery: string,
  params: any[] = [],
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: T[], total: number, pages: number }> {
  // 确保页码和每页数量有效
  const currentPage = Math.max(1, page);
  const limit = Math.max(1, Math.min(100, pageSize)); // 限制最大为100条
  const offset = (currentPage - 1) * limit;
  
  // 查询总记录数
  const countResult = await queryOne<{ count: string }>(countQuery, params);
  const total = parseInt(countResult?.count || '0', 10);
  
  // 查询分页数据
  const paginatedParams = [...params, limit, offset];
  const paginatedSql = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const data = await query<T>(paginatedSql, paginatedParams);
  
  return {
    data,
    total,
    pages: Math.ceil(total / limit)
  };
}

// 健康检查
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('数据库健康检查失败:', err);
    return false;
  }
}

// 关闭数据库连接池
export async function closePool(): Promise<void> {
  await pool.end();
}