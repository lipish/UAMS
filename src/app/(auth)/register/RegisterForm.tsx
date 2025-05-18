'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    if (!formData.company_name || !formData.contact_name || !formData.email || !formData.password) {
      toast({
        title: '错误',
        description: '请填写所有必填字段',
        variant: 'destructive',
      });
      return;
    }

    // 验证公司名（用户名）长度
    if (formData.company_name.length < 3) {
      toast({
        title: '错误',
        description: '公司名称至少需要3个字符',
        variant: 'destructive',
      });
      return;
    }

    // 验证密码长度
    if (formData.password.length < 6) {
      toast({
        title: '错误',
        description: '密码至少需要6个字符',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: '错误',
        description: '两次输入的密码不一致',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 准备注册数据
      const registerData = {
        username: formData.company_name.trim(),  // 使用公司名作为用户名，并去除首尾空格
        email: formData.email.trim(),
        password: formData.password,
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim()
        // 不发送 phone 字段，因为它是可选的
      };
      
      console.log('准备发送注册请求:', JSON.stringify(registerData, null, 2));
      
      // 前端验证
      if (registerData.username.length < 3) {
        throw new Error('公司名称至少需要3个字符');
      }
      if (registerData.password.length < 6) {
        throw new Error('密码至少需要6个字符');
      }
      if (registerData.contact_name.length < 2) {
        throw new Error('联系人姓名至少需要2个字符');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
        throw new Error('请提供有效的邮箱地址');
      }
      
      // 确保密码确认匹配
      if (formData.password !== formData.confirmPassword) {
        throw new Error('两次输入的密码不匹配');
      }
      
      // 使用环境变量获取 API 基础 URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const registerUrl = `${API_BASE_URL}/api/auth/register`;
      
      console.log('发送注册请求到:', registerUrl);
      console.log('请求体:', JSON.stringify(registerData, null, 2));
      
      // 测试连接性
      try {
        console.log('测试连接性...');
        const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
        console.log('健康检查状态:', healthCheck.status);
        const healthData = await healthCheck.text();
        console.log('健康检查响应:', healthData);
      } catch (healthError) {
        console.error('健康检查失败:', healthError);
        throw new Error(`无法连接到后端服务 (${API_BASE_URL})，请确保后端正在运行`);
      }
      
      // 使用 fetch API 发送请求
      let response;
      try {
        console.log('发送注册请求...');
        response = await fetch(registerUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(registerData)
        });
        console.log('收到响应，状态码:', response.status);
        
        // 获取响应文本
        const responseText = await response.text();
        console.log('响应状态:', response.status);
        console.log('响应头:', Object.fromEntries([...response.headers.entries()]));
        console.log('响应内容:', responseText);
        
        // 解析响应数据
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
          console.log('解析后的响应数据:', responseData);
        } catch (parseError) {
          console.error('解析响应数据失败:', parseError);
          throw new Error(`服务器返回了无效的响应: ${responseText.substring(0, 200)}`);
        }
        
        // 处理错误响应
        if (!response.ok) {
          // 如果有后端验证错误，显示具体的错误信息
          if (response.status === 400) {
            if (responseData.errors && Array.isArray(responseData.errors)) {
              const errorMessages = responseData.errors
                .map((err: any) => `${err.param || 'error'}: ${err.msg || err.message || JSON.stringify(err)}`)
                .join('\n');
              throw new Error(`输入数据验证失败：\n${errorMessages}`);
            } else if (responseData.message) {
              throw new Error(responseData.message);
            }
          }
          throw new Error(responseData.message || `请求失败，状态码: ${response.status}`);
        }
        
        return responseData;
      } catch (error) {
        console.error('注册请求失败:', error);
        // 如果错误已经有 message，直接抛出
        if (error instanceof Error) {
          throw error;
        }
        // 否则创建一个新的错误
        throw new Error(`请求失败: ${String(error)}`);
      }
      
      console.log('收到响应，状态码:', response.status);
      
      // 尝试解析响应体
      let responseData;
      try {
        responseData = await response.json();
        console.log('响应数据:', responseData);
      } catch (parseError) {
        console.error('解析响应数据失败:', parseError);
        throw new Error('服务器返回了无效的响应');
      }
      
      // 检查响应状态码
      if (!response.ok) {
        console.error('请求失败，状态码:', response.status);
        console.error('响应头:', Object.fromEntries(response.headers.entries()));
        
        // 尝试从响应中提取错误信息
        const errorMessage = responseData?.message || 
                            responseData?.error || 
                            responseData?.errors?.[0]?.msg ||
                            `请求失败，状态码: ${response.status}`;
        
        throw new Error(errorMessage);
      }
      
      console.log('注册成功，响应数据:', responseData);
      
      toast({
        title: '注册成功',
        description: '账号注册成功，请登录',
      });
      
      // 注册成功后跳转到登录页面
      router.push('/login');
    } catch (error: any) {
      console.error('注册失败 - 完整错误对象:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.response ? {
          response: {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data
          }
        } : {})
      });
      
      // 显示错误信息
      const errorMessage = error.message || '注册失败，请稍后重试';
      toast({
        title: '注册失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">注册</CardTitle>
          <CardDescription className="text-center">创建您的代理商账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company_name">公司名称</Label>
                <Input 
                  id="company_name"
                  name="company_name"
                  type="text" 
                  value={formData.company_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required 
                  placeholder="请输入公司全称"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_name">联系人姓名</Label>
                <Input 
                  id="contact_name"
                  name="contact_name"
                  type="text" 
                  value={formData.contact_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required 
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  placeholder="example@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">密码</Label>
                <Input 
                  id="password"
                  name="password"
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            已有账号？
            <Link href="/login" className="text-blue-500 hover:text-blue-700 ml-1">
              登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
