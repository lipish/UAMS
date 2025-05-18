import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

/**
 * API代理处理程序
 * 将所有请求转发到后端API服务器，避免前端直接调用后端API时的跨域问题
 *
 * 使用示例:
 * 前端请求: /api/proxy/auth/login
 * 会被代理到: http://localhost:3001/api/auth/login
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path, 'POST');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path, 'PUT');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path, 'DELETE');
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path, 'PATCH');
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path, 'OPTIONS');
}

/**
 * 通用请求处理函数
 */
async function handleRequest(
  req: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // 构建代理URL
    const path = pathSegments.join('/');
    const url = new URL(req.url);
    const targetUrl = `${API_BASE_URL}/${path}${url.search}`;

    // 构建请求选项
    const headers = new Headers();
    
    // 复制原始请求的所有头部
    req.headers.forEach((value, key) => {
      // 不要复制host和origin等特定于请求的头部
      if (
        !['host', 'connection', 'sec-', 'cookie', 'upgrade'].some(prefix => 
          key.toLowerCase().startsWith(prefix)
        )
      ) {
        headers.set(key, value);
      }
    });
    
    // 替换或添加origin头部，指向API服务器
    headers.set('origin', new URL(API_BASE_URL).origin);
    
    // 如果有Authorization头部，保留它
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      headers.set('authorization', authHeader);
    }
    
    // 设置内容类型
    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers.set('content-type', contentType);
    }

    // 创建请求选项
    const requestInit: RequestInit = {
      method,
      headers,
      redirect: 'follow',
    };

    // 对于POST/PUT/PATCH请求，添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      // 尝试读取请求体
      let bodyContent;
      
      if (contentType?.includes('application/json')) {
        bodyContent = JSON.stringify(await req.json());
      } else if (contentType?.includes('multipart/form-data')) {
        bodyContent = await req.formData();
      } else {
        bodyContent = await req.text();
      }
      
      requestInit.body = bodyContent;
    }

    // 发送请求到API服务器
    const response = await fetch(targetUrl, requestInit);
    
    // 创建响应选项
    const responseHeaders = new Headers();
    
    // 复制API服务器响应的所有头部
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // 设置CORS头部
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 读取响应体
    const responseData = await response.arrayBuffer();
    
    // 创建并返回响应
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API代理错误:', error);
    
    // 返回错误响应
    return NextResponse.json(
      { 
        status: 'error', 
        message: '无法连接到API服务器', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}