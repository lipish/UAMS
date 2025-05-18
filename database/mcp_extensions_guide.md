# Zed.dev MCP扩展功能指南

## 概述

Zed.dev的PostgreSQL MCP (Managed Control Plane) 扩展功能为License管理系统提供了强大的数据处理和分析能力。本文档详细介绍了如何在项目中配置和使用这些扩展功能。

## MCP扩展功能列表

### 1. 核心扩展

| 扩展名 | 功能描述 | 适用场景 |
|--------|----------|----------|
| `pg_stat_statements` | SQL查询性能监控 | 性能分析和优化 |
| `pgcrypto` | 数据加密功能 | 敏感数据加密 |
| `uuid-ossp` | UUID生成 | License密钥生成 |
| `pg_partman` | 表分区管理 | 大数据量处理 |
| `timescaledb` | 时间序列数据处理 | 统计和趋势分析 |

### 2. 高级功能扩展

| 扩展名 | 功能描述 | 适用场景 |
|--------|----------|----------|
| `pg_background` | 后台处理 | 异步任务执行 |
| `pg_cron` | 定时任务 | 自动化维护 |
| `pg_repack` | 表重整 | 性能维护 |
| `pg_audit` | 详细审计日志 | 合规性要求 |
| `postgis` | 地理空间数据支持 | 区域分析 |

## 安装与配置

### 在PostgreSQL MCP上启用扩展

```sql
-- 通用模式
CREATE EXTENSION IF NOT EXISTS 扩展名;

-- 具体示例
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 权限配置

```sql
-- 为特定角色授予扩展使用权限
GRANT USAGE ON SCHEMA extensions TO license_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO license_app;
```

## 常用扩展功能实践

### 1. 使用pgcrypto进行敏感数据加密

```sql
-- 创建加密函数
CREATE OR REPLACE FUNCTION encrypt_data(data text, key text)
RETURNS text AS $$
BEGIN
  RETURN encode(encrypt_iv(data::bytea, key::bytea, '0123456789abcdef'::bytea, 'aes-cbc'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建解密函数
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data text, key text)
RETURNS text AS $$
BEGIN
  RETURN convert_from(decrypt_iv(decode(encrypted_data, 'hex'), key::bytea, '0123456789abcdef'::bytea, 'aes-cbc'), 'utf8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在表中使用
ALTER TABLE licenses ADD COLUMN encrypted_data text;
```

### 2. 使用uuid-ossp生成唯一License密钥

```sql
-- 创建License生成函数
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS text AS $$
DECLARE
  new_key text;
BEGIN
  -- 生成格式化的UUID
  SELECT REPLACE(uuid_generate_v4()::text, '-', '')::text INTO new_key;
  -- 格式化为XXXX-XXXX-XXXX-XXXX
  RETURN UPPER(
    SUBSTRING(new_key, 1, 4) || '-' ||
    SUBSTRING(new_key, 5, 4) || '-' ||
    SUBSTRING(new_key, 9, 4) || '-' ||
    SUBSTRING(new_key, 13, 4) || '-' ||
    SUBSTRING(new_key, 17, 4) || '-' ||
    SUBSTRING(new_key, 21, 4) || '-' ||
    SUBSTRING(new_key, 25, 4) || '-' ||
    SUBSTRING(new_key, 29, 4)
  );
END;
$$ LANGUAGE plpgsql;
```

### 3. 使用pg_cron进行定时任务调度

```sql
-- 启用cron扩展
CREATE EXTENSION pg_cron;

-- 设置自动过期License状态更新（每天凌晨1点执行）
SELECT cron.schedule('0 1 * * *', $$
  UPDATE license_applications 
  SET status = '已过期' 
  WHERE status = '已批准' AND expiry_date < CURRENT_DATE
$$);

-- 设置定期数据汇总（每周一凌晨3点执行）
SELECT cron.schedule('0 3 * * 1', $$
  INSERT INTO license_weekly_stats (week_start, total_active, new_licenses, expired_licenses)
  SELECT 
    date_trunc('week', CURRENT_DATE) as week_start,
    COUNT(*) FILTER (WHERE status = '已批准') as total_active,
    COUNT(*) FILTER (WHERE status = '已批准' AND apply_date >= date_trunc('week', CURRENT_DATE)) as new_licenses,
    COUNT(*) FILTER (WHERE status = '已过期' AND updated_at >= date_trunc('week', CURRENT_DATE)) as expired_licenses
  FROM license_applications
$$);
```

### 4. 使用timescaledb进行时间序列分析

```sql
-- 创建hypertable用于License使用统计
CREATE TABLE license_usage_stats (
  time TIMESTAMPTZ NOT NULL,
  license_id INTEGER,
  user_count INTEGER,
  feature_usage JSONB,
  system_metrics JSONB
);

-- 转换为TimescaleDB hypertable
SELECT create_hypertable('license_usage_stats', 'time');

-- 创建连续聚合视图进行实时分析
CREATE MATERIALIZED VIEW hourly_license_usage
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  license_id,
  AVG(user_count) AS avg_users,
  MAX(user_count) AS max_users
FROM license_usage_stats
GROUP BY hour, license_id;
```

## 性能优化配置

### 使用pg_stat_statements进行查询性能监控

```sql
-- 启用统计扩展
CREATE EXTENSION pg_stat_statements;

-- 配置监控参数
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = all;
ALTER SYSTEM SET pg_stat_statements.track_utility = true;

-- 重新加载配置
SELECT pg_reload_conf();

-- 查询最慢的SQL语句
SELECT query, calls, total_exec_time, rows, 100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## 安全注意事项

1. **扩展权限控制**：仅向必要的数据库角色授予扩展使用权限
2. **数据加密密钥管理**：不在数据库中存储加密密钥，使用外部密钥管理服务
3. **定期审计**：使用pg_audit记录敏感操作，定期审查日志
4. **最小权限原则**：为每个功能模块创建专用的数据库角色

## 与应用集成

### Node.js/TypeScript集成示例

```typescript
import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  /* 连接配置 */
});

// 使用加密扩展
async function storeEncryptedLicense(licenseId: number, userData: any): Promise<void> {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const query = `
    UPDATE licenses 
    SET encrypted_data = encrypt_data($1, $2)
    WHERE id = $3
  `;
  
  await pool.query(query, [JSON.stringify(userData), encryptionKey, licenseId]);
}

// 使用UUID生成器
async function createNewLicense(): Promise<string> {
  const result = await pool.query('SELECT generate_license_key() as key');
  return result.rows[0].key;
}

// 使用时间序列数据
async function recordLicenseUsage(licenseId: number, metrics: any): Promise<void> {
  const query = `
    INSERT INTO license_usage_stats (time, license_id, user_count, feature_usage, system_metrics)
    VALUES (NOW(), $1, $2, $3, $4)
  `;
  
  await pool.query(query, [
    licenseId,
    metrics.userCount,
    JSON.stringify(metrics.featureUsage),
    JSON.stringify(metrics.systemMetrics)
  ]);
}
```

## 故障排除

| 常见问题 | 可能原因 | 解决方案 |
|--------|----------|----------|
| 扩展无法创建 | 权限不足 | 使用具有SUPERUSER权限的账号创建扩展 |
| pgcrypto性能问题 | 加密操作过多 | 仅对必要字段加密，考虑批处理 |
| 时间序列数据增长过快 | 采集频率过高 | 调整数据保留策略，使用聚合表 |
| cron任务未执行 | cron服务未启动 | 检查pg_cron.use_background_workers设置 |

## 性能基准和配置建议

| 扩展功能 | 资源消耗 | 建议配置 |
|--------|----------|----------|
| pg_stat_statements | 中等内存 | shared_buffers增加20% |
| pgcrypto | 高CPU | 增加work_mem至少4MB |
| timescaledb | 高I/O、高内存 | 增加maintenance_work_mem至少1GB |
| pg_cron | 低CPU、低内存 | max_worker_processes至少4 |

## MCP服务监控与管理

Zed.dev MCP控制面板提供了以下管理功能：

1. **扩展状态监控**：实时查看各扩展运行状态和资源使用情况
2. **自动备份**：设置扩展配置和数据的备份策略
3. **版本管理**：扩展版本升级和回滚控制
4. **性能分析**：扩展相关的性能问题诊断工具
5. **日志聚合**：集中查看所有扩展的日志信息

## 结论

正确配置和使用PostgreSQL MCP扩展功能可以大幅提升License管理系统的性能、安全性和功能性。通过本指南中的最佳实践，开发团队可以充分利用这些强大的扩展特性，同时避免常见的陷阱和性能问题。