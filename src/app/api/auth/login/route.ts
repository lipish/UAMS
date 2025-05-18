import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/database';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { email, password } = body;
    
    // 参数验证
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }
    
    // 调用数据库登录函数
    const result = await auth.loginUser(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || '邮箱或密码不正确' },
        { status: 401 }
      );
    }
    
    // 登录成功，设置cookie
    const { user } = result;
    const cookieStore = cookies();
    
    // 设置用户会话cookie（实际应用中应使用更安全的JWT或会话机制）
    cookieStore.set('user_id', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 一周
      path: '/',
    });
    
    cookieStore.set('user_role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 一周
      path: '/',
    });
    
    // 返回成功响应（不包含敏感信息）
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}