import db from './db';
import * as auth from './auth';
import * as license from './license';

// 导出所有数据库操作函数
export {
  // 数据库连接
  db,
  
  // 用户认证相关
  auth,
  
  // 证书管理相关
  license
};

// 默认导出
export default {
  db,
  auth,
  license
};