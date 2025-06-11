'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { toast } from '@/components/ui/use-toast';
import { apiService } from '@/lib/api-client';
import { ErrorDisplay } from '@/components/ui/error-display';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // 检查服务器状态
  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/health', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        console.log('服务器状态检查:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('服务器连接失败:', error);
      return false;
    }
  };

  // 页面加载时的检查
  useEffect(() => {
    console.log('LoginForm: 组件已加载');
    
    // 检查URL参数是否有错误提示
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      toast({
        title: '登录错误',
        description: decodeURIComponent(errorParam),
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: '错误',
        description: '请输入邮箱和密码',
        variant: 'destructive',
      });
      return;
    }
    
    setError(null);
    setLoginSuccess(false);
    setIsLoading(true);
    
    try {
      console.log('开始登录流程', { email });
      
      // 直接使用fetch调用后端API
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('登录响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('登录失败:', errorData);
        throw new Error(errorData.message || `登录失败 (${response.status})`);
      }
      
      const data = await response.json();
      console.log('登录成功，获取到数据:', Object.keys(data));
      
      if (!data.data?.token) {
        console.error('登录响应缺少token:', data);
        throw new Error('登录响应中缺少token');
      }
      
      // 保存认证信息
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // 保存新token
      localStorage.setItem('token', data.data.token);
      console.log('已保存token到localStorage');
      
      // 保存用户信息
      if (data.data.user) {
        const userData = {...data.data.user};
        if (!userData.role) {
          userData.role = 'user';
        }
        sessionStorage.setItem('user', JSON.stringify(userData));
        console.log('已保存用户信息到sessionStorage:', userData);
      }
      
      // 使用context更新状态
      await login(email, password, true);
      
      // 标记登录成功
      setLoginSuccess(true);
      
      // 显示登录成功提示
      toast({
        title: '登录成功',
        description: '欢迎回来！正在跳转到控制台...',
      });
      
      // 检查认证状态
      console.log('登录完成，检查认证状态:');
      console.log('- localStorage token:', !!localStorage.getItem('token'));
      console.log('- sessionStorage user:', !!sessionStorage.getItem('user'));
      
      // 手动触发存储事件，确保其他组件能感知到变化
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          newValue: data.data.token,
          url: window.location.href
        }));
        console.log('已触发storage事件');
      } catch (e) {
        console.warn('触发storage事件失败:', e);
      }
      
      // 延迟跳转
      console.log('准备延迟跳转...');
      setTimeout(() => {
        console.log('执行客户端跳转到/dashboard/apply');
        // 使用 Next.js 的客户端导航
        router.push('/dashboard/apply');
      }, 1000);
      
    } catch (error: any) {
      console.error('登录错误:', error);
      setError(error.message || '登录失败，请检查您的邮箱和密码');
      setLoginSuccess(false);
      setIsLoading(false);
    }
  };

  // 手动跳转函数
  const handleManualRedirect = () => {
    console.log('手动跳转触发');
    router.push('/dashboard/apply');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/xinference.svg" alt="UAMS Logo" width={80} height={80} />
          </div>
          <p className="text-lg font-semibold mb-1">欢迎使用UAMS统一授权管理系统</p>
          <p className="text-sm text-muted-foreground mb-4">Unified Authorization Management System</p>
          <CardTitle className="text-2xl text-center">登录</CardTitle>
          <CardDescription className="text-center">输入您的账号信息登录系统</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <ErrorDisplay 
              variant="error"
              description={error}
              className="mb-4"
            />
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">密码</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full relative" 
                disabled={isLoading || loginSuccess}
                variant={loginSuccess ? "success" : "default"}
                onClick={() => {
                  if (!isLoading && !loginSuccess) {
                    console.log('LoginForm: 按钮点击 - 提交表单');
                  }
                }}
              >
                {(isLoading || loginSuccess) && (
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <svg className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
                {isLoading 
                  ? '处理中...' 
                  : loginSuccess 
                    ? '登录成功，正在跳转...'
                    : '登录'
                }
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            还没有账号？
            <Link href="/auth/register" className="text-blue-500 hover:text-blue-700 ml-1">
              注册
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
