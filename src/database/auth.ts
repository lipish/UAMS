import { query } from './db';
import bcrypt from 'bcrypt';

// 盐轮数
const SALT_ROUNDS = 10;

/**
 * 注册新用户
 * @param username 用户名
 * @param password 密码
 * @param email 邮箱
 * @param contactName 联系人姓名
 * @param phone 手机号
 * @param companyName 公司名称
 * @returns 注册结果
 */
export async function registerUser(
  username: string, 
  password: string, 
  email: string, 
  contactName?: string, 
  phone?: string,
  companyName?: string
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
      'INSERT INTO users(username, password, email, contact_name, phone, company_name) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      [username, hashedPassword, email, contactName || null, phone || null, companyName || null]
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
 * @param email 邮箱
 * @param password 密码
 * @returns 登录结果
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
 * @param userId 用户ID
 * @returns 用户信息
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

/**
 * 更新用户密码
 * @param userId 用户ID
 * @param currentPassword 当前密码
 * @param newPassword 新密码
 * @returns 更新结果
 */
export async function updatePassword(userId: number, currentPassword: string, newPassword: string) {
  try {
    // 获取当前用户信息
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    // 验证当前密码
    const passwordMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    
    if (!passwordMatch) {
      return { success: false, message: '当前密码不正确' };
    }
    
    // 密码加密并更新
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    return { success: true, message: '密码更新成功' };
  } catch (error) {
    console.error('更新密码错误:', error);
    return { success: false, message: '密码更新失败，请稍后再试' };
  }
}

export default {
  registerUser,
  loginUser,
  getUserById,
  updatePassword
};