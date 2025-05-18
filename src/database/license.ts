import { query } from './db';

/**
 * 创建证书申请
 * @param applicantName 申请人姓名
 * @param applicantEmail 申请人邮箱
 * @param macAddress 服务器MAC地址
 * @param userId 用户ID
 * @param licenseType 证书类型
 * @param applicantPhone 申请人手机（可选）
 * @param companyName 公司名称（可选）
 * @param applicationReason 申请说明（可选）
 * @returns 创建结果
 */
export async function createLicenseApplication(
  applicantName: string,
  applicantEmail: string,
  macAddress: string,
  userId: number,
  licenseType: 'trial' | 'official',
  applicantPhone?: string,
  companyName?: string,
  applicationReason?: string
) {
  try {
    const result = await query(
      `INSERT INTO licenses(
        applicant_name, applicant_email, applicant_phone, company_name, 
        license_type, mac_address, application_reason, user_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        applicantName, 
        applicantEmail, 
        applicantPhone || null, 
        companyName || null, 
        licenseType, 
        macAddress, 
        applicationReason || null, 
        userId
      ]
    );
    
    // 如果是试用版，自动设置15天的过期时间
    if (licenseType === 'trial') {
      await query(
        `UPDATE licenses SET expiry_date = CURRENT_TIMESTAMP + INTERVAL '15 days' WHERE id = $1`,
        [result.rows[0].id]
      );
    }
    
    return { 
      success: true, 
      message: '证书申请已提交', 
      licenseId: result.rows[0].id 
    };
  } catch (error) {
    console.error('创建证书申请错误:', error);
    return { success: false, message: '申请提交失败，请稍后再试' };
  }
}

/**
 * 获取用户的证书申请
 * @param userId 用户ID
 * @returns 证书申请列表
 */
export async function getUserLicenses(userId: number) {
  try {
    const result = await query(
      `SELECT id, applicant_name, applicant_email, company_name, 
        license_type, mac_address, application_reason, license_key, 
        status, created_at, expiry_date, review_comments
      FROM licenses 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );
    
    return { success: true, licenses: result.rows };
  } catch (error) {
    console.error('获取用户证书申请错误:', error);
    return { success: false, message: '获取申请列表失败' };
  }
}

/**
 * 获取待审核的证书申请
 * @returns 待审核证书列表
 */
export async function getPendingLicenses() {
  try {
    const result = await query(
      `SELECT l.*, u.username as applicant_username
      FROM licenses l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at ASC`
    );
    
    return { success: true, licenses: result.rows };
  } catch (error) {
    console.error('获取待审核证书错误:', error);
    return { success: false, message: '获取待审核列表失败' };
  }
}

/**
 * 审核证书申请
 * @param licenseId 证书ID
 * @param adminId 管理员ID
 * @param status 审核状态
 * @param comments 审核意见
 * @param licenseKey 生成的证书密钥（可选）
 * @returns 审核结果
 */
export async function reviewLicense(
  licenseId: number,
  adminId: number,
  status: 'approved' | 'rejected',
  comments: string,
  licenseKey?: string
) {
  try {
    let query_text = `
      UPDATE licenses 
      SET status = $1, 
          reviewed_by = $2, 
          review_date = CURRENT_TIMESTAMP, 
          review_comments = $3
    `;
    
    const params: any[] = [status, adminId, comments];
    
    // 如果审核通过并提供了licenseKey，则更新licenseKey
    if (status === 'approved' && licenseKey) {
      query_text += `, license_key = $4`;
      params.push(licenseKey);
      query_text += ` WHERE id = $5`;
      params.push(licenseId);
    } else {
      query_text += ` WHERE id = $4`;
      params.push(licenseId);
    }
    
    await query(query_text, params);
    
    return { 
      success: true, 
      message: status === 'approved' ? '证书已批准' : '证书已拒绝' 
    };
  } catch (error) {
    console.error('审核证书错误:', error);
    return { success: false, message: '审核操作失败，请稍后再试' };
  }
}

/**
 * 生成证书密钥
 * @param macAddress MAC地址
 * @param licenseType 证书类型
 * @param expiryDate 过期日期（可选）
 * @returns 生成的密钥
 */
export async function generateLicenseKey(
  macAddress: string,
  licenseType: 'trial' | 'official',
  expiryDate?: Date
) {
  try {
    // 这里只是一个简单的示例，实际应用中应使用更安全的加密算法
    const now = new Date();
    const expiry = expiryDate || (licenseType === 'trial' 
      ? new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15天
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)); // 1年
      
    const expiryTimestamp = Math.floor(expiry.getTime() / 1000);
    
    // 简单示例：将MAC地址和过期时间戳组合并编码
    const licenseData = `${macAddress}|${licenseType}|${expiryTimestamp}`;
    const licenseKey = Buffer.from(licenseData).toString('base64');
    
    return { 
      success: true, 
      licenseKey: licenseKey,
      expiryDate: expiry
    };
  } catch (error) {
    console.error('生成证书密钥错误:', error);
    return { success: false, message: '生成密钥失败' };
  }
}

/**
 * 获取证书详情
 * @param licenseId 证书ID
 * @returns 证书详情
 */
export async function getLicenseDetails(licenseId: number) {
  try {
    const result = await query(
      `SELECT l.*, 
        u.username as applicant_username,
        a.username as reviewer_username
      FROM licenses l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.reviewed_by = a.id
      WHERE l.id = $1`,
      [licenseId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: '证书不存在' };
    }
    
    return { success: true, license: result.rows[0] };
  } catch (error) {
    console.error('获取证书详情错误:', error);
    return { success: false, message: '获取证书详情失败' };
  }
}

export default {
  createLicenseApplication,
  getUserLicenses,
  getPendingLicenses,
  reviewLicense,
  generateLicenseKey,
  getLicenseDetails
};