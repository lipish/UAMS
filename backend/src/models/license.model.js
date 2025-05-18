const { query, getClient } = require('../config/db');

/**
 * License模型，负责处理license申请和管理的CRUD操作
 */
class License {
  /**
   * 创建新的license申请
   * @param {Object} licenseData license申请数据
   * @returns {Promise<Object>} 创建的license对象
   */
  static async create(licenseData) {
    const {
      applicant_name,
      applicant_email,
      mac_address,
      user_id,
      license_type,
      applicant_phone,
      company_name,
      application_reason
    } = licenseData;
    
    // 验证必填字段
    if (!applicant_name || !applicant_email || !mac_address || !license_type) {
      const error = new Error('缺少必要的申请信息');
      error.statusCode = 400;
      throw error;
    }
    
    const result = await query(
      `INSERT INTO licenses(
        applicant_name, applicant_email, applicant_phone, company_name, 
        license_type, mac_address, application_reason, user_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        applicant_name, 
        applicant_email, 
        applicant_phone || null, 
        company_name || null, 
        license_type, 
        mac_address, 
        application_reason || null, 
        user_id
      ]
    );
    
    // 如果是试用版，自动设置15天的过期时间
    if (license_type === 'trial') {
      await query(
        `UPDATE licenses SET expiry_date = CURRENT_TIMESTAMP + INTERVAL '15 days' WHERE id = $1`,
        [result.rows[0].id]
      );
      
      // 重新获取更新后的数据
      const updatedResult = await query(
        `SELECT * FROM licenses WHERE id = $1`,
        [result.rows[0].id]
      );
      
      return updatedResult.rows[0];
    }
    
    return result.rows[0];
  }
  
  /**
   * 获取指定用户的所有license申请
   * @param {number} userId 用户ID
   * @returns {Promise<Array>} license数组
   */
  static async findByUserId(userId) {
    const result = await query(
      `SELECT id, applicant_name, applicant_email, company_name, 
        license_type, mac_address, application_reason, license_key, 
        status, created_at, expiry_date, review_comments
      FROM licenses 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }
  
  /**
   * 获取所有待审核的license申请（管理员用）
   * @returns {Promise<Array>} 待审核的license数组
   */
  static async findPending() {
    const result = await query(
      `SELECT l.*, u.username as applicant_username
      FROM licenses l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at ASC`
    );
    
    return result.rows;
  }
  
  /**
   * 通过ID获取license详情
   * @param {number} id License ID
   * @returns {Promise<Object|null>} license对象或null
   */
  static async findById(id) {
    const result = await query(
      `SELECT l.*, 
        u.username as applicant_username,
        a.username as reviewer_username
      FROM licenses l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.reviewed_by = a.id
      WHERE l.id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * 审核license申请
   * @param {number} licenseId License ID
   * @param {number} adminId 管理员ID
   * @param {'approved'|'rejected'} status 审核状态
   * @param {string} comments 审核意见
   * @param {string} licenseKey 生成的license密钥（仅approved状态需要）
   * @returns {Promise<Object>} 更新后的license对象
   */
  static async review(licenseId, adminId, status, comments, licenseKey) {
    // 验证状态有效性
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      const error = new Error('无效的审核状态');
      error.statusCode = 400;
      throw error;
    }
    
    // 使用事务保证数据一致性
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // 更新license状态
      let result;
      if (status === 'approved' && licenseKey) {
        result = await client.query(
          `UPDATE licenses 
          SET status = $1, 
              reviewed_by = $2, 
              review_date = CURRENT_TIMESTAMP, 
              review_comments = $3,
              license_key = $4
          WHERE id = $5
          RETURNING *`,
          [status, adminId, comments, licenseKey, licenseId]
        );
      } else {
        result = await client.query(
          `UPDATE licenses 
          SET status = $1, 
              reviewed_by = $2, 
              review_date = CURRENT_TIMESTAMP, 
              review_comments = $3
          WHERE id = $4
          RETURNING *`,
          [status, adminId, comments, licenseId]
        );
      }
      
      // 如果是正式版并且状态为approved，设置一年有效期
      if (status === 'approved' && result.rows[0].license_type === 'official') {
        await client.query(
          `UPDATE licenses SET expiry_date = CURRENT_TIMESTAMP + INTERVAL '1 year' WHERE id = $1`,
          [licenseId]
        );
      }
      
      await client.query('COMMIT');
      
      // 获取更新后的完整数据
      const updatedLicense = await License.findById(licenseId);
      return updatedLicense;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * 生成license密钥
   * @param {string} macAddress MAC地址
   * @param {string} licenseType license类型
   * @param {Date} expiryDate 过期日期
   * @returns {Promise<string>} 生成的license密钥
   */
  static generateLicenseKey(macAddress, licenseType, expiryDate) {
    // 实际应用中应使用更安全的算法生成license密钥
    // 此处仅为示例
    const timestamp = Math.floor(expiryDate.getTime() / 1000);
    const dataString = `${macAddress}|${licenseType}|${timestamp}`;
    const buffer = Buffer.from(dataString, 'utf-8');
    
    // 生成Base64编码的密钥
    return buffer.toString('base64');
  }
  
  /**
   * 按状态筛选license列表（管理员用）
   * @param {string} status 状态
   * @param {number} limit 限制条数
   * @param {number} offset 偏移量
   * @returns {Promise<Array>} license数组
   */
  static async findByStatus(status, limit = 100, offset = 0) {
    const result = await query(
      `SELECT l.*, u.username as applicant_username
      FROM licenses l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = $1
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * 获取所有license（管理员用）
   * @param {number} limit 限制条数
   * @param {number} offset 偏移量
   * @returns {Promise<Array>} license数组
   */
  static async findAll(limit = 100, offset = 0) {
    const result = await query(
      `SELECT l.*, u.username as applicant_username
      FROM licenses l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * 检查license是否有效
   * @param {string} licenseKey License密钥
   * @param {string} macAddress MAC地址
   * @returns {Promise<Object>} 验证结果
   */
  static async verifyLicense(licenseKey, macAddress) {
    const result = await query(
      `SELECT * FROM licenses WHERE license_key = $1 AND mac_address = $2`,
      [licenseKey, macAddress]
    );
    
    if (result.rows.length === 0) {
      return { 
        valid: false, 
        message: 'License不存在或MAC地址不匹配' 
      };
    }
    
    const license = result.rows[0];
    
    // 检查状态
    if (license.status !== 'approved') {
      return { 
        valid: false, 
        message: `License状态为 ${license.status}` 
      };
    }
    
    // 检查过期时间
    if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
      return { 
        valid: false, 
        message: 'License已过期',
        expiry_date: license.expiry_date
      };
    }
    
    return {
      valid: true,
      license_type: license.license_type,
      expiry_date: license.expiry_date
    };
  }
}

module.exports = License;