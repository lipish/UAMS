import { NextRequest, NextResponse } from 'next/server';

// 代理转发到后端API
export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();

    // 转发到后端API
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 获取响应数据
    const data = await response.json();
    
    // 确保用户数据包含角色信息
    if (data && data.status === 'success' && data.data && data.data.user) {
      // 如果后端没有提供角色，添加默认角色
      if (!data.data.user.role) {
        data.data.user.role = 'user';
      }
      console.log('代理登录成功，用户信息:', data.data.user);
    }

    // 返回后端的响应
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error('登录代理错误:', error);
    
    // 返回错误响应
    return NextResponse.json(
      { 
        status: 'error',
        message: error.message || '登录请求处理失败' 
      },
      { status: 500 }
    );
  }
}