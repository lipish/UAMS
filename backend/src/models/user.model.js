const { query } = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * 用户模型，负责处理用户数据的CRUD操作
 */
class User {
  /**
   * 创建新用户
   * @param {Object} userData 用户数据对象
   * @returns {Promise<Object>} 创建的用户对象（不含密码）
   */
  static async create(userData) {
    const { username, email, password, company_name, contact_name, phone } = userData;
    
    // 检查邮箱是否已存在
    const emailCheck = await query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS email_exists',
      [email]
    );
    
    if (emailCheck.rows[0].email_exists) {
      const error = new Error('该邮箱已被注册');
      error.statusCode = 409;
      throw error;
    }
    
    // 检查用户名是否已存在
    if (username) {
      const usernameCheck = await query(
        'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS username_exists',
        [username]
      );
      
      if (usernameCheck.rows[0].username_exists) {
        const error = new Error('该用户名已被使用');
        error.statusCode = 409;
        throw error;
      }
    }
    
    // 密码加密
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // 插入新用户
    const result = await query(
      `INSERT INTO users(username, password_hash, email, company_name, contact_name, phone) 
       VALUES($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, company_name, contact_name, phone, created_at`,
      [username || email, password_hash, email, company_name, contact_name, phone || null]
    );
    
    return result.rows[0];
  }
  
  /**
   * 通过邮箱查找用户（包含密码哈希）
   * @param {string} email 用户邮箱
   * @returns {Promise<Object|null>} 用户对象或null
   */
  static async findByEmail(email) {
    const result = await query(
      `SELECT 
        id, 
        username, 
        email, 
        password_hash, 
        company_name, 
        contact_name, 
        phone, 
        is_active, 
        created_at, 
        updated_at 
      FROM users WHERE email = $1`,
      [email]
    );
    
    if (result.rows[0]) {
      const user = result.rows[0];
      // 将 password_hash 映射回 password 以保持接口一致
      user.password = user.password_hash;
      delete user.password_hash;
      return user;
    }
    return null;
  }
  
  /**
   * 通过ID查找用户（不含密码）
   * @param {number} id 用户ID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  static async findById(id) {
    const result = await query(
      `SELECT 
        id, 
        username, 
        email, 
        company_name, 
        contact_name, 
        phone, 
        is_active, 
        created_at, 
        updated_at 
      FROM users WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * 更新用户信息
   * @param {number} id 用户ID
   * @param {Object} userData 要更新的用户数据
   * @returns {Promise<Object>} 更新后的用户对象
   */
  static async update(id, userData) {
    const allowedFields = ['company_name', 'contact_name', 'phone', 'username'];
    const updates = [];
    const values = [];
    
    // 构建动态更新查询
    let i = 1;
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${i}`);
        values.push(value);
        i++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('没有提供可更新的字段');
    }
    
    values.push(id);
    
    const queryText = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${i} 
      RETURNING id, username, email, company_name, contact_name, phone, created_at, updated_at
    `;
    
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      const error = new Error('用户不存在');
      error.statusCode = 404;
      throw error;
    }
    
    return result.rows[0];
  }
  
  /**
   * 更新用户密码
   * @param {number} id 用户ID
   * @param {string} currentPassword 当前密码
   * @param {string} newPassword 新密码
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updatePassword(id, currentPassword, newPassword) {
    // 获取当前用户信息（包含密码哈希）
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('用户不存在');
      error.statusCode = 404;
      throw error;
    }
    
    const user = result.rows[0];
    
    // 验证当前密码
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!passwordMatch) {
      const error = new Error('当前密码不正确');
      error.statusCode = 401;
      throw error;
    }
    
    // 加密新密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, id]
    );
    
    return true;
  }
  
  /**
   * 获取所有用户（仅管理员可用）
   * @param {number} limit 限制条数
   * @param {number} offset 偏移量
   * @returns {Promise<Array>} 用户数组
   */
  static async findAll(limit = 100, offset = 0) {
    const result = await query(
      `SELECT id, username, email, full_name, phone, role, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * 删除用户（仅管理员可用）
   * @param {number} id 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  /**
   * 设置用户角色（仅管理员可用）
   * @param {number} id 用户ID
   * @param {string} role 角色名称
   * @returns {Promise<Object>} 更新后的用户对象
   */
  static async setRole(id, role) {
    // 验证角色有效性
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      const error = new Error('无效的角色名称');
      error.statusCode = 400;
      throw error;
    }
    
    const result = await query(
      `UPDATE users 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, username, email, full_name, phone, role, created_at`,
      [role, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('用户不存在');
      error.statusCode = 404;
      throw error;
    }
    
    return result.rows[0];
  }
}

module.exports = User;