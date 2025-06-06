# UAMS 后端服务

这是UAMS (Unified Authorization Management System) 的后端API服务，负责处理用户认证、License申请和管理等功能。

## 技术栈

- **Node.js**: 运行环境
- **Express**: Web框架
- **PostgreSQL**: 数据库
- **JWT**: 用户认证
- **bcrypt**: 密码加密

## 目录结构

```
backend/
├── src/                # 源代码目录
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── utils/          # 实用工具
│   └── index.js        # 应用程序入口
├── .env.example        # 环境变量示例
├── package.json        # 项目依赖
└── README.md           # 项目说明
```

## 安装和启动

### 前提条件

- Node.js 16+ 
- PostgreSQL 14+

### 安装步骤

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填写配置信息
```

3. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

默认情况下，API服务会在 http://localhost:3001 上运行。

## API接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料
- `PUT /api/auth/password` - 修改密码

### UAMS License管理接口

- `POST /api/licenses` - 创建license申请
- `GET /api/licenses/my` - 获取当前用户的license申请
- `GET /api/licenses/:id` - 获取license详情
- `PUT /api/licenses/:id/review` - 审核license申请（管理员）
- `GET /api/licenses/pending/all` - 获取所有待审核的license（管理员）
- `GET /api/licenses` - 获取所有license或按状态筛选（管理员）
- `POST /api/licenses/verify` - 验证license是否有效

## 数据库

数据库使用PostgreSQL，涉及以下主要表：

- **users** - 存储用户信息
- **licenses** - 存储license申请和管理信息

详细数据库结构请参考`docs/dev.md`文件。

## 开发指南

### 新增路由

1. 在`src/models`中创建所需的数据模型
2. 在`src/routes`中定义API路由
3. 在`src/index.js`中注册路由

### 环境变量

主要环境变量包括：

- `DB_HOST` - 数据库主机
- `DB_PORT` - 数据库端口
- `DB_NAME` - 数据库名称
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `PORT` - API服务端口
- `JWT_SECRET` - JWT密钥
- `JWT_EXPIRES_IN` - JWT过期时间
- `CORS_ORIGIN` - CORS允许的源

## 测试

```bash
npm test
```

## 生产部署

推荐使用PM2或Docker进行生产环境部署。

```bash
# 使用PM2部署
npm install -g pm2
pm2 start src/index.js --name "license-api"

# 或者使用Docker
docker-compose up -d
```

## License

MIT