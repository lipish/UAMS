const jwt = require('jsonwebtoken');

/**
 * 身份验证中间件
 * 验证用户提供的JWT token并将用户信息添加到req对象
 */
const authMiddleware = (req, res, next) => {
  // 获取请求头中的Authorization字段
  const authHeader = req.headers.authorization;
  
  // 检查是否提供了token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: '未授权，请先登录'
    });
  }
  
  // 从请求头中提取token
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key');
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    // 继续处理请求
    next();
  } catch (error) {
    // 处理token验证错误
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '登录已过期，请重新登录'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: '无效的登录令牌'
      });
    }
    
    // 其他错误
    return res.status(401).json({
      status: 'error',
      message: '认证失败，请重新登录'
    });
  }
};

/**
 * 管理员权限验证中间件
 * 检查用户是否具有管理员权限
 */
const adminRequired = (req, res, next) => {
  // 先验证用户身份
  authMiddleware(req, res, () => {
    // 检查用户角色
    if (req.user && req.user.role === 'admin') {
      next(); // 用户具有管理员权限，继续处理请求
    } else {
      // 用户不具有管理员权限
      res.status(403).json({
        status: 'error',
        message: '权限不足，需要管理员权限'
      });
    }
  });
};

module.exports = authMiddleware;
module.exports.adminRequired = adminRequired;