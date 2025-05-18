-- Context Management Schema
-- 为项目上下文信息存储建立的数据库结构

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 用于文本搜索优化

-- 上下文类型枚举
CREATE TYPE context_type AS ENUM (
  'project_summary',     -- 项目总结
  'business_logic',      -- 业务逻辑
  'technical_specs',     -- 技术规格
  'api_documentation',   -- API文档
  'user_flow',           -- 用户流程
  'database_schema',     -- 数据库结构
  'deployment_info',     -- 部署信息
  'feature_description'  -- 功能描述
);

-- 上下文表
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type context_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- 用于存储向量嵌入，支持相似性搜索
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 上下文关系表（用于关联相关上下文）
CREATE TABLE context_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  target_context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL, -- 'depends_on', 'references', 'extends', 等
  weight FLOAT DEFAULT 1.0, -- 关系强度/重要性
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_context_id, target_context_id, relation_type)
);

-- 上下文标签表
CREATE TABLE context_tags (
  context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  PRIMARY KEY (context_id, tag)
);

-- 上下文访问历史（用于跟踪使用情况和提高检索精度）
CREATE TABLE context_access_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL, -- 引用用户ID
  access_type VARCHAR(50) NOT NULL, -- 'view', 'edit', 'reference', 等
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  client_info JSONB DEFAULT '{}'::jsonb -- 存储客户端信息，如IP、用户代理等
);

-- 上下文版本历史
CREATE TABLE context_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by INTEGER, -- 引用用户ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(context_id, version)
);

-- 创建搜索索引
CREATE INDEX idx_contexts_title_trgm ON contexts USING gin (title gin_trgm_ops);
CREATE INDEX idx_contexts_content_trgm ON contexts USING gin (content gin_trgm_ops);
CREATE INDEX idx_contexts_type ON contexts(type);
CREATE INDEX idx_contexts_is_active ON contexts(is_active);
CREATE INDEX idx_context_tags_tag ON context_tags(tag);

-- 创建向量搜索索引 (需要pgvector扩展)
-- 如果安装了pgvector扩展，取消以下注释
-- CREATE INDEX idx_contexts_embedding ON contexts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 自动更新updated_at字段的触发器
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contexts_modtime
BEFORE UPDATE ON contexts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 存储项目总结的函数
CREATE OR REPLACE FUNCTION store_project_summary(
  p_title VARCHAR(255),
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_tags TEXT[] DEFAULT '{}'::TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_context_id UUID;
BEGIN
  -- 插入或更新上下文
  INSERT INTO contexts (type, title, content, metadata)
  VALUES ('project_summary', p_title, p_content, p_metadata)
  RETURNING id INTO v_context_id;
  
  -- 删除旧标签
  DELETE FROM context_tags WHERE context_id = v_context_id;
  
  -- 添加新标签
  IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
    FOR i IN 1..array_length(p_tags, 1) LOOP
      INSERT INTO context_tags (context_id, tag)
      VALUES (v_context_id, p_tags[i]);
    END LOOP;
  END IF;
  
  RETURN v_context_id;
END;
$$ LANGUAGE plpgsql;

-- 按类型和标签检索上下文的函数
CREATE OR REPLACE FUNCTION retrieve_contexts(
  p_type context_type DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  type context_type,
  title VARCHAR(255),
  content TEXT,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH context_results AS (
    SELECT c.id, c.type, c.title, c.content, c.metadata, c.created_at, c.updated_at
    FROM contexts c
    WHERE 
      c.is_active = true AND
      (p_type IS NULL OR c.type = p_type) AND
      (
        p_search_term IS NULL OR 
        c.title ILIKE '%' || p_search_term || '%' OR 
        c.content ILIKE '%' || p_search_term || '%'
      )
  ),
  context_with_tags AS (
    SELECT 
      cr.*,
      CASE 
        WHEN p_tags IS NULL THEN true
        ELSE EXISTS (
          SELECT 1 FROM context_tags ct 
          WHERE ct.context_id = cr.id AND ct.tag = ANY(p_tags)
        )
      END AS has_requested_tags,
      array_agg(ct.tag) AS tags
    FROM context_results cr
    LEFT JOIN context_tags ct ON cr.id = ct.context_id
    GROUP BY cr.id, cr.type, cr.title, cr.content, cr.metadata, cr.created_at, cr.updated_at
  )
  SELECT 
    cwt.id, cwt.type, cwt.title, cwt.content, cwt.metadata, 
    CASE WHEN cwt.tags = '{NULL}' THEN NULL ELSE cwt.tags END AS tags,
    cwt.created_at, cwt.updated_at
  FROM context_with_tags cwt
  WHERE cwt.has_requested_tags = true
  ORDER BY cwt.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 插入示例项目总结
SELECT store_project_summary(
  'License管理系统项目总结',
  '这是一个基于Next.js框架开发的License管理系统，主要面向代理商申请License的流程管理。项目使用了现代前端技术栈，包括React 19、TypeScript、Tailwind CSS以及各种UI组件库。

主要功能：
1. 用户认证系统 - 代理商注册和登录功能
2. License申请流程 - 填写和提交License申请表单
3. License状态管理 - 查看和筛选License申请状态

技术架构：
- 前端框架：Next.js 15.3.2 (App Router)
- UI组件：Radix UI + Tailwind CSS
- 表单处理：react-hook-form + zod
- 数据库：PostgreSQL + MCP扩展

用户流程：
1. 代理商注册/登录系统
2. 申请新的License
3. 查看License状态
4. 管理已申请的License',
  '{"version": "0.1.0", "author": "开发团队", "last_updated": "2023-11-01"}'::jsonb,
  ARRAY['nextjs', 'react', 'license', 'management', 'postgresql']
);