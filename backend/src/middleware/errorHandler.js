const { ValidationError } = require('express-validator');

const { validationResult } = require('express-validator');

/**
 * 全局错误处理中间件
 * 捕获并处理API请求过程中产生的错误
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误信息
  console.error('错误:', err.message);
  console.error(err.stack);

  // 处理不同类型的错误
  if (err.name === 'ValidationError' || err.errors) {
    // 表单验证错误
    return res.status(400).json({
      status: 'error',
      message: '请求参数验证失败',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    // 认证相关错误
    return res.status(401).json({
      status: 'error',
      message: '未授权访问' 
    });
  }

  if (err.name === 'ForbiddenError' || err.status === 403) {
    // 权限相关错误
    return res.status(403).json({
      status: 'error',
      message: '权限不足'
    });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF攻击防护
    return res.status(403).json({
      status: 'error',
      message: '表单提交无效，可能是CSRF令牌无效'
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    // 数据库唯一性约束错误
    return res.status(409).json({
      status: 'error',
      message: '资源冲突，请检查请求数据是否重复',
      detail: err.errors[0]?.message
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    // 数据库错误
    return res.status(500).json({
      status: 'error',
      message: '数据库操作失败',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // 自定义API错误
  if (err.isApiError) {
    return res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
      code: err.code,
      data: err.data
    });
  }

  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message || '服务器内部错误' 
      : '服务器内部错误'
  });
};

module.exports = errorHandler;