import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/database';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { username, password, email, company_name, phone } = body;
    
    // 参数验证
    if (!username || !password || !email) {
      return NextResponse.json(
        { success: false, message: '用户名、密码和邮箱不能为空' },
        { status: 400 }
      );
    }
    
    // 调用数据库注册函数
    const result = await auth.registerUser(
      username,
      password,
      email,
      company_name, // 可选
      phone // 可选
    );
    
    if (!result.success) {
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