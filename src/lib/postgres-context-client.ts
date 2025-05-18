import { Pool } from 'pg';
import { config } from './config';

/**
 * PostgreSQL上下文服务器MCP客户端
 * 用于与数据库中的上下文数据进行交互
 */
export class PostgresContextClient {
  private pool: Pool;
  private static instance: PostgresContextClient;

  private constructor() {
    this.pool = new Pool({
      user: config.db.user,
      host: config.db.host,
      database: config.db.database,
      password: config.db.password,
      port: config.db.port,
      ssl: config.db.ssl,
    });

    this.pool.on('error', (err) => {
      console.error('PostgreSQL Context服务器连接错误:', err);
    });
  }

  /**
   * 获取客户端单例实例
   */
  public static getInstance(): PostgresContextClient {
    if (!PostgresContextClient.instance) {
      PostgresContextClient.instance = new PostgresContextClient();
    }
    return PostgresContextClient.instance;
  }

  /**
   * 存储项目总结到上下文数据库
   * @param title 标题
   * @param content 内容
   * @param metadata 元数据
   * @param tags 标签
   * @returns 上下文ID
   */
  async storeProjectSummary(
    title: string,
    content: string,
    metadata: Record<string, any> = {},
    tags: string[] = []
  ): Promise<string> {
    try {
      const result = await this.pool.query(
        'SELECT store_project_summary($1, $2, $3, $4) AS context_id',
        [title, content, JSON.stringify(metadata), tags]
      );
      return result.rows[0].context_id;
    } catch (error) {
      console.error('存储项目总结失败:', error);
      throw new Error('无法存储项目总结到上下文服务器');
    }
  }

  /**
   * 检索项目上下文
   * @param contextType 上下文类型
   * @param tags 标签过滤
   * @param searchTerm 搜索词
   * @param limit 限制条数
   * @param offset 偏移量
   * @returns 上下文数组
   */
  async retrieveContexts(
    contextType?: string,
    tags?: string[],
    searchTerm?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ContextItem[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM retrieve_contexts($1, $2, $3, $4, $5)',
        [contextType, tags, searchTerm, limit, offset]
      );
      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('检索上下文失败:', error);
      throw new Error('无法从上下文服务器检索数据');
    }
  }

  /**
   * 通过ID获取特定上下文
   * @param contextId 上下文ID
   * @returns 上下文项
   */
  async getContextById(contextId: string): Promise<ContextItem | null> {
    try {
      const result = await this.pool.query(
        'SELECT c.*, array_agg(ct.tag) AS tags FROM contexts c ' +
        'LEFT JOIN context_tags ct ON c.id = ct.context_id ' +
        'WHERE c.id = $1 AND c.is_active = true ' +
        'GROUP BY c.id',
        [contextId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        tags: row.tags[0] === null ? [] : row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('获取上下文失败:', error);
      throw new Error('无法获取指定的上下文');
    }
  }

  /**
   * 记录上下文访问历史
   * @param contextId 上下文ID
   * @param userId 用户ID
   * @param accessType 访问类型
   * @param clientInfo 客户端信息
   */
  async recordContextAccess(
    contextId: string,
    userId: number,
    accessType: string = 'view',
    clientInfo: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO context_access_history (context_id, user_id, access_type, client_info) ' +
        'VALUES ($1, $2, $3, $4)',
        [contextId, userId, accessType, JSON.stringify(clientInfo)]
      );
    } catch (error) {
      console.error('记录上下文访问失败:', error);
      // 非关键操作，可以继续执行不抛出异常
    }
  }

  /**
   * 使用向量相似性搜索相关上下文
   * 注意：需要pgvector扩展支持
   * @param embedding 查询向量
   * @param limit 结果数量
   * @returns 相似上下文
   */
  async searchSimilarContexts(
    embedding: number[],
    limit: number = 5
  ): Promise<ContextItem[]> {
    try {
      // 检查向量扩展是否可用
      const checkResult = await this.pool.query(
        "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')"
      );
      
      if (!checkResult.rows[0].exists) {
        throw new Error('服务器未安装pgvector扩展，无法执行向量搜索');
      }
      
      const result = await this.pool.query(
        'SELECT c.*, array_agg(ct.tag) AS tags, ' +
        '1 - (c.embedding <=> $1) AS similarity ' +
        'FROM contexts c ' +
        'LEFT JOIN context_tags ct ON c.id = ct.context_id ' +
        'WHERE c.is_active = true AND c.embedding IS NOT NULL ' +
        'GROUP BY c.id ' +
        'ORDER BY similarity DESC ' +
        'LIMIT $2',
        [embedding, limit]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        tags: row.tags[0] === null ? [] : row.tags,
        similarity: row.similarity,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('向量搜索失败:', error);
      throw new Error('无法执行向量相似性搜索');
    }
  }

  /**
   * 更新上下文内容
   * @param contextId 上下文ID
   * @param content 新内容
   * @param metadata 元数据
   * @param userId 用户ID
   */
  async updateContext(
    contextId: string,
    content: string,
    metadata: Record<string, any> = {},
    userId?: number
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 获取当前版本
      const versionResult = await client.query(
        'SELECT version FROM contexts WHERE id = $1',
        [contextId]
      );
      
      if (versionResult.rows.length === 0) {
        throw new Error('上下文不存在');
      }
      
      const currentVersion = versionResult.rows[0].version;
      const newVersion = currentVersion + 1;
      
      // 保存旧版本
      await client.query(
        'INSERT INTO context_versions (context_id, version, content, created_by) ' +
        'SELECT id, version, content, $1 FROM contexts WHERE id = $2',
        [userId, contextId]
      );
      
      // 更新当前版本
      await client.query(
        'UPDATE contexts SET content = $1, metadata = $2, version = $3 WHERE id = $4',
        [content, JSON.stringify(metadata), newVersion, contextId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('更新上下文失败:', error);
      throw new Error('无法更新上下文内容');
    } finally {
      client.release();
    }
  }

  /**
   * 加载README内容到上下文
   * @param readmeContent README文件内容
   * @returns 上下文ID
   */
  async loadReadmeToContext(readmeContent: string): Promise<string> {
    // 提取标题（第一个#后的内容）
    const titleMatch = readmeContent.match(/# (.*)/);
    const title = titleMatch ? titleMatch[1] : 'README';
    
    // 元数据
    const metadata = {
      source: 'README.md',
      imported_at: new Date().toISOString(),
      type: 'documentation'
    };
    
    // 标签
    const tags = ['readme', 'documentation'];
    
    // 存储为项目总结
    return this.storeProjectSummary(title, readmeContent, metadata, tags);
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * 上下文项接口
 */
export interface ContextItem {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
  similarity?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 导出客户端单例
export const contextClient = PostgresContextClient.getInstance();