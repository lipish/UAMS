import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 转发到后端API健康检查端点
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 获取响应数据
    const data = await response.json();

    // 返回后端的响应
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error('健康检查代理错误:', error);
    
    // 返回本地健康检查失败
    return NextResponse.json(
      { 
        status: 'error',
        message: '无法连接到后端服务',
        details: error.message || '服务检查失败'
      },
      { status: 503 }
    );
  }
}