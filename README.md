# License管理系统

一个专业的软件授权管理平台，用于代理商申请License、管理员审核申请流程，以及生成和分发许可证密钥。

> [!NOTE]
> 开发者相关文档请查看 [开发文档](docs/dev.md)，包含数据库结构和管理员账户信息。

<div align="center">
  <img src="https://img.shields.io/badge/next.js-15.3.2-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/react-19-blue" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwindcss-4-blueviolet" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/postgres-latest-blue" alt="PostgreSQL" />
</div>

## 项目截图

<div align="center">
  <table>
    <tr>
      <td><img src="https://via.placeholder.com/400x200?text=登录页面" alt="登录页面" /></td>
      <td><img src="https://via.placeholder.com/400x200?text=注册页面" alt="注册页面" /></td>
    </tr>
    <tr>
      <td><img src="https://via.placeholder.com/400x200?text=License申请" alt="License申请" /></td>
      <td><img src="https://via.placeholder.com/400x200?text=状态查看" alt="状态查看" /></td>
    </tr>
  </table>
</div>

## 主要功能

### 用户认证系统
- **代理商注册**：收集公司名称、联系人、邮箱等基本信息
- **用户登录**：基于邮箱和密码的安全认证系统
- **管理员权限**：特殊权限用户可审核和管理License申请

### License申请流程
- **申请表单**：包含产品名称、License类型、客户信息、MAC地址等字段
- **提交申请**：代理商填写并提交License申请
- **状态追踪**：实时查看申请处理情况

### License状态管理
- **状态查看**：显示所有申请的License及其状态（待审核、已批准、已拒绝、已过期）
- **状态筛选**：按不同状态筛选License列表
- **详情查看**：提供查看License详细信息的功能

## 技术架构

- **前端框架**：Next.js 15.3.2（App Router架构）+ React 19
- **UI组件**：Radix UI + Tailwind CSS + shadcn/ui
- **表单处理**：react-hook-form + zod
- **数据库**：PostgreSQL（用于存储用户、申请和许可证信息）
- **认证**：基于会话的认证系统，支持角色和权限控制

## 快速开始

### 系统要求
- Node.js 18+
- PostgreSQL 14+

### 安装与部署

1. 克隆仓库
```bash
git clone https://github.com/yourusername/license-management.git
cd license-management
```

2. 安装依赖
```bash
npm install
```

3. 配置数据库
```bash
# 详见docs/dev.md中的数据库设置说明
```

4. 启动开发服务器
```bash
npm run dev
```

5. 在浏览器中访问
```
http://localhost:3000
```

## 文档

完整的开发和部署文档请参考 [开发文档](docs/dev.md)。

## 贡献指南

欢迎提交问题和功能请求！请先查看现有问题，然后再创建新的问题。

## 许可证

本项目采用 MIT 许可证