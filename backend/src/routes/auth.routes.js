const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', [
  // 数据验证规则
  body('username').optional().isLength({ min: 3 }).withMessage('用户名至少需要3个字符'),
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符'),
  body('full_name').optional().isLength({ min: 2 }).withMessage('姓名至少需要2个字符'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('请提供有效的手机号码'),
], async (req, res, next) => {
  try {
    // 处理验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    // 创建用户
    const newUser = await User.create(req.body);

    res.status(201).json({
      status: 'success',
      message: '用户注册成功',
      data: {
        user: newUser
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', [
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  body('password').notEmpty().withMessage('请输入密码'),
], async (req, res, next) => {
  try {
    // 处理验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    
    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '邮箱或密码不正确'
      });
    }
    
    // 验证密码
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: '邮箱或密码不正确'
      });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'your-jwt-secret-key', 
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );
    
    // 返回用户信息（不含密码）
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新用户资料
 * PUT /api/auth/profile
 */
router.put('/profile', authMiddleware, [
  body('full_name').optional().isLength({ min: 2 }).withMessage('姓名至少需要2个字符'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('请提供有效的手机号码'),
  body('username').optional().isLength({ min: 3 }).withMessage('用户名至少需要3个字符'),
], async (req, res, next) => {
  try {
    // 处理验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }
    
    // 更新用户信息
    const updatedUser = await User.update(req.user.id, req.body);
    
    res.json({
      status: 'success',
      message: '个人资料更新成功',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 修改密码
 * PUT /api/auth/password
 */
router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少需要6个字符'),
], async (req, res, next) => {
  try {
    // 处理验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // 更新密码
    await User.updatePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      status: 'success',
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;