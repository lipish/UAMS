# UAMS (Unified Authorization Management System) - 项目深度介绍

## 项目概述

UAMS (Unified Authorization Management System) 是一个专业的统一授权管理平台，专为软件代理商和管理员设计，提供完整的License申请、审核、管理和分发流程。该系统采用现代化的全栈架构，前后端分离设计，确保高性能和良好的用户体验。

## 核心业务流程

### 1. 用户角色体系
- **代理商用户（user）**：可以注册账户、申请License、查看申请状态
- **管理员用户（admin）**：具有审核权限，可以批准/拒绝License申请，管理系统

### 2. License申请流程
1. **代理商注册**：填写公司信息、联系人信息完成注册
2. **提交申请**：填写客户信息、产品信息、License类型、MAC地址等
3. **状态追踪**：实时查看申请状态（待审核、已批准、已拒绝、已过期）
4. **管理员审核**：管理员查看申请详情，进行批准或拒绝操作
5. **License生成**：审核通过后系统自动生成License密钥
6. **密钥分发**：代理商获取License密钥并分发给最终客户

## 技术架构详解

### 前端架构
- **框架**：Next.js 15.3.2 (App Router)
- **UI库**：React 19 + TypeScript
- **组件库**：Radix UI + shadcn/ui + Tailwind CSS
- **状态管理**：React Context (AuthContext + LicenseContext)
- **表单处理**：react-hook-form + zod 验证
- **HTTP客户端**：axios (带拦截器和错误处理)
- **主题系统**：next-themes (支持暗色模式)

### 后端架构
- **运行时**：Node.js + Express.js
- **数据库**：PostgreSQL (关系型数据库)
- **认证**：JWT + bcrypt 密码加密
- **日志系统**：Winston (支持文件和控制台输出)
- **API验证**：express-validator
- **跨域处理**：CORS 中间件

### 数据库设计

#### 核心表结构
1. **users表**：用户信息（代理商和管理员）
   - 基本信息：用户名、邮箱、密码、公司名称、联系人
   - 权限控制：role字段区分用户类型
   - 状态管理：is_active字段控制账户状态

2. **license_applications表**：License申请记录
   - 申请信息：客户信息、产品信息、License类型
   - 技术信息：MAC地址、到期时间、数量
   - 流程控制：状态、审核人、审核时间、审核意见

3. **licenses表**：简化的License记录（向后兼容）
   - 申请人信息、License类型、MAC地址
   - 状态管理和审核流程

4. **产品和功能管理表**：
   - products：产品信息
   - license_types：License类型定义
   - features：功能特性
   - 关联表：支持License类型与功能的多对多关系

## 核心功能模块

### 1. 用户认证模块
- **注册功能**：
  - 邮箱唯一性验证
  - 密码强度要求（最少6位）
  - 公司信息收集
  - bcrypt密码加密存储

- **登录功能**：
  - 邮箱+密码认证
  - JWT token生成
  - 会话状态管理
  - 自动登录状态检查

### 2. License申请模块
- **申请表单**：
  - 客户信息：姓名、邮箱、电话、公司
  - 技术信息：MAC地址、License类型
  - 业务信息：申请原因、到期时间

- **状态管理**：
  - pending：待审核
  - approved：已批准
  - rejected：已拒绝
  - expired：已过期

### 3. 审核管理模块
- **待审核列表**：管理员查看所有待审核申请
- **审核操作**：批准/拒绝申请，添加审核意见
- **License生成**：审核通过后自动生成唯一License密钥
- **审核历史**：记录审核人、审核时间、审核意见

### 4. 状态查询模块
- **我的申请**：代理商查看自己提交的所有申请
- **状态筛选**：按状态筛选申请记录
- **详情查看**：查看申请的详细信息和审核结果
- **License密钥**：获取已批准申请的License密钥

## 项目结构分析

### 前端目录结构