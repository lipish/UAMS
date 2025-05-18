# PostgreSQL Context Server MCP 设置指南

## 概述

本指南详细介绍了如何为License管理系统设置和配置PostgreSQL Context Server MCP（多控制平面）。该服务器用于存储和管理项目的上下文信息，使应用程序能够访问和利用结构化的项目数据。

## 数据库架构

项目使用以下架构文件：

- `context_schema.sql`：上下文存储架构
- `postgres_schema.sql`：主要应用程序数据架构

## MCP扩展

为了支持高级上下文功能，我们使用以下PostgreSQL扩展：

- `pgcrypto`：用于敏感数据加密
- `uuid-ossp`：用于生成唯一标识符
- `pg_trgm`：用于高效文本搜索
- `vector`（可选）：用于向量搜索和相似性匹配

## 安装步骤

### 1. 安装PostgreSQL

确保已安装PostgreSQL 14或更高版本：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb

# macOS (使用Homebrew)
brew install postgresql
```

### 2. 创建数据库

```bash
# 登录PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE license_management;
CREATE USER license_app WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE license_management TO license_app;

# 连接到新数据库
\c license_management
```

### 3. 安装必要扩展

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 可选：安装pgvector (需要先编译安装)
-- CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. 创建数据库架构

```bash
# 应用上下文架构
psql -U license_app -d license_management -f context_schema.sql

# 应用主应用程序架构
psql -U license_app -d license_management -f postgres_schema.sql
```

## 上下文服务器配置

### 基本配置

在`postgres_context_server.conf`中设置以下参数：

```
# 内存设置
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 32MB
maintenance_work_mem = 512MB

# 写入设置
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# 搜索优化
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 安全配置

在`pg_hba.conf`中设置适当的访问控制：

```
# 仅允许特定IP访问
host    license_management    license_app    10.0.0.0/24    md5

# 或者使用SSL
hostssl license_management    license_app    all            cert
```

## 加载项目上下文

使用提供的脚本加载项目上下文：

```bash
# 切换到项目目录
cd license-management

# 编译并运行上下文加载脚本
npx ts-node src/scripts/load-project-summary.ts
```

## 客户端集成

### TypeScript/Node.js 集成

1. 安装依赖

```bash
npm install pg pg-promise dotenv
```

2. 使用提供的客户端库

```typescript
import { contextClient } from './lib/postgres-context-client';

// 在应用程序中使用
async function useContext() {
  const projectContext = await contextClient.retrieveContexts('project_summary');
  console.log(projectContext);
}
```

## 监控与维护

### 备份上下文数据

```bash
# 定期备份
pg_dump -U license_app -d license_management -t contexts -t context_* > context_backup.sql
```

### 性能监控

```sql
-- 监控查询性能
SELECT query, calls, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## 故障排除

### 常见问题

1. **连接失败**：检查PostgreSQL服务是否正在运行，以及网络/防火墙设置。
2. **权限错误**：确保用户有适当的数据库权限。
3. **扩展安装失败**：确保已安装`postgresql-contrib`包。

## 更多资源

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [pgvector文档](https://github.com/pgvector/pgvector)
- [PostgreSQL MCP扩展指南](database/mcp_extensions_guide.md)

## 环境变量参考

将以下环境变量添加到`.env`文件中：

```
# 数据库连接
DB_HOST=localhost
DB_PORT=5432
DB_NAME=license_management
DB_USER=license_app
DB_PASSWORD=your_secure_password

# 加密设置
ENCRYPTION_KEY=your_secure_encryption_key

# MCP扩展配置
MCP_VECTOR_ENABLED=true
MCP_MAX_CONNECTIONS=20
```