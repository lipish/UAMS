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
    req.user = {
      id: decoded.id,
      email: decoded.email,
      company_name: decoded.company_name
    };
    
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
 * 注意：当前版本未实现管理员角色，保留此中间件以供将来使用
 */
const adminRequired = (req, res, next) => {
  return res.status(403).json({
    status: 'error',
    message: '此功能当前不可用'
  });
};

module.exports = authMiddleware;
module.exports.adminRequired = adminRequired;