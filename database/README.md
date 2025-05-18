# 数据库文档

## 数据库信息

### 连接信息
- **数据库名称**: license_management
- **用户名**: license_admin
- **密码**: license123
- **主机**: localhost
- **端口**: 5432 (PostgreSQL默认端口)

## 数据库表结构

### 用户表（users）
| 字段名称 | 类型 | 描述 | 约束 |
|---------|------|------|------|
| id | integer | 用户ID | 主键，自动递增 |
| username | varchar(255) | 用户名 | 可空 |
| password | varchar(255) | 密码 | 非空 |
| email | varchar(255) | 电子邮箱 | 非空，唯一 |
| company_name | varchar(255) | 公司名称 | 非空 |
| contact_name | varchar(255) | 联系人姓名 | 非空 |
| phone | varchar(50) | 手机号码 | 可空 |
| is_active | boolean | 是否激活 | 默认 true |
| role | varchar(20) | 用户角色 | 默认'usr'，可选'admin' |
| created_at | timestamp with time zone | 创建时间 | 默认当前时间 |
| updated_at | timestamp with time zone | 更新时间 | 默认当前时间 |

### 证书表（licenses）
| 字段名称 | 类型 | 描述 | 约束 |
|---------|------|------|------|
| id | integer | 证书ID | 主键，自动递增 |
| applicant_name | varchar(100) | 申请人姓名 | 非空 |
| applicant_email | varchar(100) | 申请人邮箱 | 非空 |
| applicant_phone | varchar(20) | 申请人手机 | 可空 |
| company_name | varchar(100) | 客户公司名称 | 可空 |
| license_type | varchar(20) | 证书类型 | 非空 |
| mac_address | varchar(50) | 服务器MAC地址 | 非空 |
| application_reason | text | 申请说明 | 可空 |
| license_key | text | 生成的密钥 | 可空 |
| status | varchar(20) | 状态 | 默认'pending' |
| created_at | timestamp | 创建时间 | 默认当前时间 |
| expiry_date | timestamp | 过期时间 | 可空 |

## 数据库架构文件

项目使用以下架构文件：

- `postgres_schema.sql`：主要应用程序数据架构
- 其他迁移文件：位于 `migrations/` 目录下

## 数据库视图

1. **pending_license_reviews** - 待审核证书视图
2. **license_reviews** - 证书审核详情视图

## 超级管理员账户

- **用户名**: admin
- **密码**: admin123
- **邮箱**: admin@example.com

## 数据库审核流程

1. 用户提交申请后，在licenses表中创建记录，status为'pending'
2. 管理员通过查询pending_license_reviews视图查看所有待审核申请
3. 管理员审核后，更新licenses表中的status字段：
   - 'approved'（批准）：生成license_key并设置expiry_date
   - 'rejected'（拒绝）：记录拒绝原因
