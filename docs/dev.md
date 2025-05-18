# 开发文档

## 数据库信息

数据库相关的详细文档请参考 [database/README.md](../database/README.md)


## 登录与注册流程

### 注册流程
1. 用户填写注册表单（用户名、邮箱、密码等）
2. 前端进行基本验证（密码强度、邮箱格式等）
3. 调用后端API，传递注册信息
4. 后端执行以下操作：
   - 检查邮箱是否已被注册
   - 检查用户名是否已被使用
   - 如果都未被使用，对密码进行bcrypt加密
   - 创建新用户记录
   - 返回注册结果
5. 前端根据返回结果显示成功/失败消息

### 登录流程
1. 用户填写登录表单（邮箱和密码）
2. 前端进行基本验证
3. 调用后端API，传递登录信息
4. 后端执行以下操作：
   - 根据邮箱查询用户信息
   - 如果用户存在，使用bcrypt比较输入密码和存储的密码哈希
   - 如果密码匹配，生成会话或令牌
   - 返回登录结果和用户信息（不包含密码）
5. 前端根据返回结果:
   - 如果成功，保存会话信息并重定向到仪表盘
   - 如果失败，显示错误消息

## SQL初始化脚本

```sql
-- 创建数据库
CREATE DATABASE license_management;

-- 创建用户并授权
CREATE USER license_admin WITH ENCRYPTED PASSWORD 'license123';
GRANT ALL PRIVILEGES ON DATABASE license_management TO license_admin;

-- 连接到license_management数据库
\c license_management

-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'user'
);

-- 创建证书表
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_email VARCHAR(100) NOT NULL,
    applicant_phone VARCHAR(20),
    company_name VARCHAR(100),
    license_type VARCHAR(20) NOT NULL,
    mac_address VARCHAR(50) NOT NULL,
    application_reason TEXT,
    license_key TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    reviewed_by INTEGER REFERENCES users(id),
    review_date TIMESTAMP,
    review_comments TEXT
);

-- 创建索引
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_mac_address ON licenses(mac_address);
CREATE INDEX idx_licenses_status ON licenses(status);

-- 创建待审核视图
CREATE VIEW pending_license_reviews AS 
SELECT l.id, l.applicant_name, l.applicant_email, l.company_name, 
       l.license_type, l.mac_address, l.application_reason, l.created_at, 
       u.username as applicant_username 
FROM licenses l 
JOIN users u ON l.user_id = u.id 
WHERE l.status = 'pending';

-- 创建审核详情视图
CREATE VIEW license_reviews AS 
SELECT l.*, u.username as applicant_username, a.username as reviewer_username 
FROM licenses l 
LEFT JOIN users u ON l.user_id = u.id 
LEFT JOIN users a ON l.reviewed_by = a.id;

```sql
-- 创建超级管理员账户
INSERT INTO users (username, password, email, full_name, role) 
VALUES ('admin', 'admin123', 'admin@example.com', 'Super Admin', 'admin');
```

## 用户认证相关SQL操作

### 用户注册
用户注册时，需要先检查邮箱是否已存在，如果不存在才能注册成功。

```sql
-- 检查邮箱是否已存在
SELECT EXISTS(SELECT 1 FROM users WHERE email = '用户输入的邮箱') AS email_exists;

-- 检查用户名是否已存在
SELECT EXISTS(SELECT 1 FROM users WHERE username = '用户输入的用户名') AS username_exists;

-- 如果邮箱和用户名都不存在，则插入新用户记录（使用加密密码）
INSERT INTO users (username, password, email, full_name, phone) 
VALUES ('用户名', '加密后的密码', '邮箱', '全名', '手机号');
```

### 用户登录
用户登录时，需要验证邮箱和密码是否匹配。

```sql
-- 根据邮箱获取用户信息（包含密码哈希）
SELECT id, username, password, email, role, full_name 
FROM users 
WHERE email = '用户输入的邮箱';

-- 然后在应用代码中使用bcrypt比较输入的密码和存储的密码哈希
```

### 安全注意事项
1. 在实际应用中，应当使用加密函数（如bcrypt）存储密码，而不是明文存储
2. 登录验证应当使用加密函数比较密码
3. 可以考虑添加登录失败次数限制和账户锁定机制

## TypeScript实现

项目使用TypeScript实现了用户注册和登录的数据库操作。以下是主要实现代码：

### 数据库连接 (db.ts)

```typescript
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

export default {
  query,
  getClient
};
```

### 用户认证 (auth.ts)

```typescript
import { query } from './db';
import bcrypt from 'bcrypt';

// 盐轮数
const SALT_ROUNDS = 10;

/**
 * 注册新用户
 */
export async function registerUser(
  username: string, 
  password: string, 
  email: string, 
  fullName?: string, 
  phone?: string
) {
  try {
    // 检查邮箱是否已存在
    const checkResult = await query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS email_exists',
      [email]
    );
    
    if (checkResult.rows[0].email_exists) {
      return { success: false, message: '该邮箱已被注册' };
    }

    // 检查用户名是否已存在
    const usernameCheck = await query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS username_exists',
      [username]
    );
    
    if (usernameCheck.rows[0].username_exists) {
      return { success: false, message: '该用户名已被使用' };
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // 注册新用户
    const result = await query(
      'INSERT INTO users(username, password, email, full_name, phone) VALUES($1, $2, $3, $4, $5) RETURNING id',
      [username, hashedPassword, email, fullName || null, phone || null]
    );
    
    return { 
      success: true, 
      message: '注册成功', 
      userId: result.rows[0].id 
    };
  } catch (error) {
    console.error('注册用户错误:', error);
    return { success: false, message: '注册失败，请稍后再试' };
  }
}

/**
 * 用户登录
 */
export async function loginUser(email: string, password: string) {
  try {
    const result = await query(
      'SELECT id, username, password, email, role, full_name FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: '邮箱或密码不正确' };
    }
    
    const user = result.rows[0];
    
    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return { success: false, message: '邮箱或密码不正确' };
    }
    
    // 返回不包含密码的用户信息
    const { password: _, ...userWithoutPassword } = user;
    
    return { 
      success: true, 
      user: userWithoutPassword, 
      message: '登录成功' 
    };
  } catch (error) {
    console.error('用户登录错误:', error);
    return { success: false, message: '登录失败，请稍后再试' };
  }
}

/**
 * 获取用户信息
 */
export async function getUserById(userId: number) {
  try {
    const result = await query(
      'SELECT id, username, email, role, full_name, phone, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    return { success: true, user: result.rows[0] };
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return { success: false, message: '获取用户信息失败' };
  }
}
```