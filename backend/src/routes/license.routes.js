const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const License = require('../models/license.model');
const authMiddleware = require('../middleware/auth');
const { adminRequired } = require('../middleware/auth');

const router = express.Router();

/**
 * 创建license申请
 * POST /api/licenses
 */
router.post('/', authMiddleware, [
  body('applicant_name').notEmpty().withMessage('申请人姓名不能为空'),
  body('applicant_email').isEmail().withMessage('请提供有效的申请人邮箱'),
  body('mac_address').notEmpty().withMessage('MAC地址不能为空'),
  body('license_type').isIn(['trial', 'official']).withMessage('无效的license类型，只能是trial或official'),
  body('applicant_phone').optional(),
  body('company_name').optional(),
  body('application_reason').optional(),
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

    // 添加用户ID到申请数据
    const licenseData = {
      ...req.body,
      user_id: req.user.id
    };

    // 创建license申请
    const newLicense = await License.create(licenseData);

    res.status(201).json({
      status: 'success',
      message: 'License申请已提交',
      data: {
        license: newLicense
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取当前用户的所有license申请
 * GET /api/licenses/my
 */
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const licenses = await License.findByUserId(req.user.id);

    res.json({
      status: 'success',
      results: licenses.length,
      data: {
        licenses
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取license详情（可由申请用户或管理员访问）
 * GET /api/licenses/:id
 */
router.get('/:id', authMiddleware, [
  param('id').isInt().withMessage('License ID必须是整数')
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

    const licenseId = parseInt(req.params.id);
    const license = await License.findById(licenseId);

    if (!license) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该License申请'
      });
    }

    // 检查访问权限（只有申请用户或管理员可以查看详情）
    if (license.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: '无权访问此License申请'
      });
    }

    res.json({
      status: 'success',
      data: {
        license
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 查看所有待审核的license申请（管理员专用）
 * GET /api/licenses/pending
 */
router.get('/pending/all', adminRequired, async (req, res, next) => {
  try {
    const pendingLicenses = await License.findPending();

    res.json({
      status: 'success',
      results: pendingLicenses.length,
      data: {
        licenses: pendingLicenses
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 管理员审核license申请
 * PUT /api/licenses/:id/review
 */
router.put('/:id/review', adminRequired, [
  param('id').isInt().withMessage('License ID必须是整数'),
  body('status').isIn(['approved', 'rejected']).withMessage('状态必须是approved或rejected'),
  body('comments').notEmpty().withMessage('审核意见不能为空'),
  body('license_key').optional()
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

    const licenseId = parseInt(req.params.id);
    const { status, comments, license_key } = req.body;

    // 查找license确保存在
    const license = await License.findById(licenseId);
    if (!license) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该License申请'
      });
    }

    // 检查license状态，只有pending状态可以审核
    if (license.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `该License申请已经是${license.status}状态，不能再次审核`
      });
    }

    let licenseKeyToUse = license_key;

    // 如果是批准且没有提供license_key，自动生成一个
    if (status === 'approved' && !licenseKeyToUse) {
      // 获取过期时间
      let expiryDate;
      if (license.license_type === 'trial') {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 15); // 试用版15天
      } else {
        expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 正式版1年
      }

      licenseKeyToUse = License.generateLicenseKey(
        license.mac_address,
        license.license_type,
        expiryDate
      );
    }

    // 执行审核
    const reviewedLicense = await License.review(
      licenseId,
      req.user.id,
      status,
      comments,
      status === 'approved' ? licenseKeyToUse : null
    );

    res.json({
      status: 'success',
      message: `License申请已${status === 'approved' ? '批准' : '拒绝'}`,
      data: {
        license: reviewedLicense
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 管理员获取所有license或按状态筛选（管理员专用）
 * GET /api/licenses
 * 可选查询参数：status, limit, offset
 */
router.get('/', adminRequired, [
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('无效的状态值'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须是1-100之间的整数'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset必须是非负整数')
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

    const { status } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    let licenses;
    if (status) {
      // 按状态筛选
      licenses = await License.findByStatus(status, limit, offset);
    } else {
      // 获取所有license
      licenses = await License.findAll(limit, offset);
    }

    res.json({
      status: 'success',
      results: licenses.length,
      data: {
        licenses
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 验证license是否有效
 * POST /api/licenses/verify
 */
router.post('/verify', [
  body('license_key').notEmpty().withMessage('License密钥不能为空'),
  body('mac_address').notEmpty().withMessage('MAC地址不能为空')
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

    const { license_key, mac_address } = req.body;
    const verificationResult = await License.verifyLicense(license_key, mac_address);

    res.json({
      status: 'success',
      data: verificationResult
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;