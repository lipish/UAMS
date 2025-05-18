import { Pool, QueryResult } from 'pg';
import { config } from './config';

/**
 * PostgreSQL MCP扩展功能封装
 * 实现与Zed.dev MCP扩展的交互
 */
export class MCPExtensions {
  private pool: Pool;
  private encryptionKey: string;

  constructor() {
    this.pool = new Pool({
      user: config.db.user,
      host: config.db.host,
      database: config.db.database,
      password: config.db.password,
      port: config.db.port,
      ssl: config.db.ssl,
    });

    // 从环境变量或安全存储获取加密密钥
    this.encryptionKey = process.env.ENCRYPTION_KEY || '';
    
    if (!this.encryptionKey && process.env.NODE_ENV === 'production') {
      console.error('警告: 生产环境中未设置加密密钥');
    }
  }

  /**
   * 使用pgcrypto进行数据加密
   * @param data 要加密的数据
   * @returns 加密后的数据
   */
  async encryptData<T>(data: T): Promise<string> {
    const jsonData = JSON.stringify(data);
    const query = 'SELECT encrypt_data($1, $2) AS encrypted_data';
    
    try {
      const result = await this.pool.query(query, [jsonData, this.encryptionKey]);
      return result.rows[0].encrypted_data;
    } catch (error) {
      console.error('数据加密失败:', error);
      throw new Error('数据加密操作失败');
    }
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据
   * @returns 解密后的数据
   */
  async decryptData<T>(encryptedData: string): Promise<T> {
    const query = 'SELECT decrypt_data($1, $2) AS decrypted_data';
    
    try {
      const result = await this.pool.query(query, [encryptedData, this.encryptionKey]);
      return JSON.parse(result.rows[0].decrypted_data) as T;
    } catch (error) {
      console.error('数据解密失败:', error);
      throw new Error('数据解密操作失败');
    }
  }

  /**
   * 生成唯一的License密钥
   * @returns 格式化的License密钥
   */
  async generateLicenseKey(): Promise<string> {
    try {
      const result = await this.pool.query('SELECT generate_license_key() AS key');
      return result.rows[0].key;
    } catch (error) {
      console.error('License密钥生成失败:', error);
      throw new Error('License密钥生成失败');
    }
  }

  /**
   * 验证License密钥有效性
   * @param licenseKey License密钥
   * @returns 是否有效
   */
  async validateLicenseKey(licenseKey: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM licenses WHERE license_key = $1 AND is_active = true
      ) AS is_valid;
    `;
    
    try {
      const result = await this.pool.query(query, [licenseKey]);
      return result.rows[0].is_valid;
    } catch (error) {
      console.error('License密钥验证失败:', error);
      return false;
    }
  }

  /**
   * 记录License使用统计数据
   * @param licenseId License ID
   * @param usageData 使用数据
   */
  async recordLicenseUsage(licenseId: number, usageData: LicenseUsageData): Promise<void> {
    const query = `
      INSERT INTO license_usage_stats (
        time, license_id, user_count, feature_usage, system_metrics
      ) VALUES (
        NOW(), $1, $2, $3, $4
      );
    `;
    
    try {
      await this.pool.query(query, [
        licenseId,
        usageData.userCount,
        JSON.stringify(usageData.featureUsage),
        JSON.stringify(usageData.systemMetrics)
      ]);
    } catch (error) {
      console.error('记录License使用统计失败:', error);
      throw new Error('无法记录使用统计数据');
    }
  }

  /**
   * 获取License使用分析报告
   * @param licenseId License ID
   * @param timeRange 时间范围(小时)
   */
  async getLicenseUsageReport(licenseId: number, timeRange: number = 24): Promise<LicenseUsageReport> {
    const query = `
      SELECT 
        time_bucket('1 hour', time) AS hour,
        AVG(user_count) AS avg_users,
        MAX(user_count) AS max_users,
        jsonb_agg(DISTINCT feature_usage) AS features_used
      FROM license_usage_stats
      WHERE 
        license_id = $1 AND 
        time > NOW() - interval '${timeRange} hours'
      GROUP BY hour
      ORDER BY hour;
    `;
    
    try {
      const result = await this.pool.query(query, [licenseId]);
      
      return {
        licenseId,
        timeRange,
        dataPoints: result.rows.map(row => ({
          timestamp: row.hour,
          avgUsers: parseFloat(row.avg_users),
          maxUsers: row.max_users,
          featuresUsed: row.features_used
        }))
      };
    } catch (error) {
      console.error('获取License使用报告失败:', error);
      throw new Error('无法生成使用报告');
    }
  }

  /**
   * 获取查询性能统计数据
   * @param limit 限制返回条数
   * @returns 性能统计数据
   */
  async getQueryPerformanceStats(limit: number = 10): Promise<QueryPerformanceStat[]> {
    // 需要超级用户权限或pg_read_all_stats角色
    const query = `
      SELECT 
        query, 
        calls, 
        total_exec_time, 
        rows, 
        mean_exec_time,
        100.0 * shared_blks_hit / 
          NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT $1;
    `;
    
    try {
      const result = await this.pool.query(query, [limit]);
      
      return result.rows.map(row => ({
        query: row.query,
        calls: row.calls,
        totalExecTime: parseFloat(row.total_exec_time),
        meanExecTime: parseFloat(row.mean_exec_time),
        rows: row.rows,
        cacheHitPercent: parseFloat(row.hit_percent) || 0
      }));
    } catch (error) {
      console.error('获取查询性能统计失败:', error);
      throw new Error('无法获取性能统计数据');
    }
  }

  /**
   * 创建定时任务
   * @param name 任务名称
   * @param schedule cron表达式
   * @param command SQL命令
   */
  async createCronJob(name: string, schedule: string, command: string): Promise<void> {
    const query = `
      SELECT cron.schedule($1, $2, $3);
    `;
    
    try {
      await this.pool.query(query, [name, schedule, command]);
    } catch (error) {
      console.error('创建定时任务失败:', error);
      throw new Error('无法创建定时任务');
    }
  }

  /**
   * 获取定时任务列表
   */
  async listCronJobs(): Promise<CronJob[]> {
    const query = `
      SELECT 
        jobid,
        jobname,
        schedule,
        command,
        nodename,
        nodeport,
        database,
        username,
        active
      FROM cron.job;
    `;
    
    try {
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.jobid,
        name: row.jobname,
        schedule: row.schedule,
        command: row.command,
        database: row.database,
        active: row.active
      }));
    } catch (error) {
      console.error('获取定时任务列表失败:', error);
      throw new Error('无法获取定时任务列表');
    }
  }

  /**
   * 执行表重整以优化性能
   * @param tableName 表名
   */
  async repackTable(tableName: string): Promise<void> {
    try {
      // 使用pg_repack扩展重整表
      await this.pool.query(`SELECT repack.repack_table('${tableName}')`);
    } catch (error) {
      console.error(`表重整失败 (${tableName}):`, error);
      throw new Error(`无法重整表 ${tableName}`);
    }
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * License使用数据接口
 */
export interface LicenseUsageData {
  userCount: number;
  featureUsage: Record<string, number>; // 功能ID -> 使用次数
  systemMetrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    requestCount?: number;
    [key: string]: any;
  };
}

/**
 * License使用报告接口
 */
export interface LicenseUsageReport {
  licenseId: number;
  timeRange: number;
  dataPoints: {
    timestamp: Date;
    avgUsers: number;
    maxUsers: number;
    featuresUsed: any[];
  }[];
}

/**
 * 查询性能统计接口
 */
export interface QueryPerformanceStat {
  query: string;
  calls: number;
  totalExecTime: number;
  meanExecTime: number;
  rows: number;
  cacheHitPercent: number;
}

/**
 * 定时任务接口
 */
export interface CronJob {
  id: number;
  name: string;
  schedule: string;
  command: string;
  database: string;
  active: boolean;
}

// 导出单例实例
export const mcpExtensions = new MCPExtensions();