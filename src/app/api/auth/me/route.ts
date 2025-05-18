import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 从请求中获取授权头
    const authHeader = request.headers.get('authorization');
    
    // 检查URL参数中是否有认证令牌
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : tokenParam;
    
    if (!authHeader && !tokenParam) {
      console.log('ME API: 未提供授权令牌');
      return NextResponse.json(
        { 
          status: 'error',
          message: '未提供授权令牌' 
        },
        { status: 401 }
      );
    }

    console.log('ME API: 获取用户信息, 授权信息存在');

    // 准备发送到后端的请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (tokenParam) {
      headers['Authorization'] = `Bearer ${tokenParam}`;
    }

    // 转发到后端API
    const response = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: headers,
    });

    // 获取响应数据
    const data = await response.json();
    
    // 确保用户数据包含角色信息
    if (data && data.status === 'success' && data.data && data.data.user) {
      // 如果后端没有提供角色，添加默认角色
      if (!data.data.user.role) {
        data.data.user.role = 'user';
        console.log('ME API: 添加默认用户角色');
      }
      console.log('ME API: 用户信息获取成功:', data.data.user);
      
      // 保存到响应头的cookie中，增加一层容错
      const headers = new Headers();
      headers.append('Set-Cookie', `user=${JSON.stringify(data.data.user)}; Path=/; HttpOnly; SameSite=Strict`);
      
      return NextResponse.json(data, {
        status: response.status,
        headers: headers
      });
    } else {
      console.log('ME API: 响应数据格式不正确或不包含用户信息:', data);
      return NextResponse.json(data, {
        status: response.status,
      });
    }
  } catch (error: any) {
    console.error('用户信息代理错误:', error);
    
    // 返回错误响应
    return NextResponse.json(
      { 
        status: 'error',
        message: error.message || '获取用户信息失败' 
      },
      { status: 500 }
    );
  }
}