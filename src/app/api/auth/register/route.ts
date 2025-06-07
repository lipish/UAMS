import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/database';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { username, password, email, company_name, contact_name, phone } = body;
    
    // 参数验证
    if (!username || !password || !email) {
      return NextResponse.json(
        { success: false, message: '用户名、密码和邮箱不能为空' },
        { status: 400 }
      );
    }
    
    // 调用数据库注册函数
    console.log('注册请求数据:', { username, email, company_name, contact_name });
    const result = await auth.registerUser(
      username,
      password,
      email,
      contact_name, // 可选
      phone, // 可选
      company_name // 可选
    );
    
    console.log('注册结果:', result);
    if (!result.success) {
      console.log('注册失败:', result.message);
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    // 注册成功
    return NextResponse.json({
      success: true,
      message: '注册成功',
      userId: result.userId
    });
    
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}