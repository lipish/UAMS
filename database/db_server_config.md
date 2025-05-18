# PostgreSQL MCP 服务器配置

## 概述

为License管理系统配置的PostgreSQL多主控制平面(MCP)服务器，提供高可用性和数据冗余保障。

## 服务器规格

- **数据库版本**：PostgreSQL 15.4
- **服务器类型**：云服务器 (AWS RDS或阿里云RDS)
- **CPU**：4核 (vCPU)
- **内存**：16GB RAM
- **存储**：200GB SSD
- **备份**：每日自动备份，保留15天

## 多控制平面(MCP)配置

### 主节点配置

```conf
listen_addresses = '*'
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 20MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
```

### 复制配置

```conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on
hot_standby_feedback = on
```

## 高可用性设置

- **读写分离**：1个主节点，2个只读副本
- **自动故障转移**：使用Patroni集群管理
- **负载均衡**：使用HAProxy或PgBouncer
- **区域分布**：跨可用区部署

## 连接配置

### 后端服务连接池

```javascript
const pool = new Pool({
  user: 'license_app',
  host: 'license-db.cluster-endpoint.region.rds.example.com',
  database: 'license_management',
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/rds-ca-cert.pem').toString()
  }
})
```

## 安全设置

- **网络安全**：
  - VPC隔离
  - 安全组限制IP访问
  - 数据传输TLS/SSL加密

- **数据加密**：
  - 存储加密(EBS加密)
  - 传输加密(SSL/TLS)
  - 敏感数据列加密(pgcrypto)

- **认证**：
  - 强密码策略
  - IAM角色认证
  - 定期密钥轮换

## 监控与告警

- **监控指标**：
  - CPU使用率
  - 内存使用率
  - 磁盘I/O
  - 活跃连接数
  - 查询性能
  - 复制延迟

- **告警阈值**：
  - CPU > 80% 持续5分钟
  - 内存 > 85% 持续3分钟
  - 磁盘使用 > 85%
  - 复制延迟 > 30秒

## 维护计划

- **定期维护窗口**：每周日凌晨2:00-4:00
- **版本升级策略**：次要版本每季度评估，主要版本每年评估
- **性能优化**：每月进行一次查询性能分析和优化

## 灾难恢复

- **RTO(恢复时间目标)**：< 15分钟
- **RPO(恢复点目标)**：< 5分钟
- **备份策略**：
  - 每日全量备份
  - 连续PITR(时间点恢复)，保留期7天
  - 每月备份归档，保留期1年

## 数据迁移计划

- **初始数据加载**：使用pg_dump和pg_restore工具
- **持续集成**：使用逻辑复制或CDC(变更数据捕获)工具
- **版本迁移**：使用pg_upgrade进行就地升级