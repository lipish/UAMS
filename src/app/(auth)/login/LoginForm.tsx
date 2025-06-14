'use client';

import { useState } from 'react'; // Removed useEffect as it's not used in the new version
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Replaced by FormLabel
import Image from 'next/image';
import { toast } from 'sonner'; // Changed from '@/components/ui/use-toast' to 'sonner'
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// import { apiService } from '@/lib/api-client'; // Not used
// import { ErrorDisplay } from '@/components/ui/error-display'; // Replaced by FormMessage and toast

// Define Zod schema for login form validation
const loginSchema = z.object({
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  password: z.string().min(1, { // Using min(1) as per the target file's logic for password presence
    message: '请输入密码',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null); // Handled by react-hook-form & toast
  // const [loginSuccess, setLoginSuccess] = useState(false); // Handled by toast & navigation
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur', // Added for better UX, validates on blur
  });

  // Removed useEffect for URL error param, toast handles errors directly now

  const onSubmit = async (values: LoginFormValues) => {

    setIsLoading(true);

    try {
      console.log('开始登录请求 (react-hook-form):', values);
      const result = await login(values.email, values.password);
      console.log('登录结果 (react-hook-form):', result);

      if (result.success) {
        console.log('登录成功，准备跳转');
        toast.success('登录成功!', {
          description: '欢迎回来！正在跳转到仪表盘...',
        });
        router.push('/dashboard'); // Target file redirects to /dashboard
      } else {
        console.log('登录失败 (LoginForm):', result.error); // 添加日志确认错误信息
        const errorMessage = result.error || '邮箱或密码不正确';
      console.log('准备调用 toast.error', result.error);
      toast.error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('登录过程中发生未预期错误:', error);
      if (error.message && error.message.includes('fetch failed')) {
        toast.error('登录服务当前不可用，请检查您的网络连接或稍后再试。');
      } else {
        toast.error('登录失败，请稍后再试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Removed handleManualRedirect as it's not part of the merged logic

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <Card className="w-full max-w-md shadow-xl border-purple-200">
        <CardHeader className="text-center">
            <div className="bg-gray-100 py-6 px-6 rounded-t-lg">
              <div className="flex justify-center mb-3">
                <Image src="/xinference.svg" alt="UAMS Logo" width={45} height={45} />
              </div>
              <p className="text-base font-medium text-gray-600 text-center">欢迎登录统一授权管理系统</p>
              <p className="text-xs text-gray-500 text-center">(Unified Authorization Management System)</p>
            </div>
            <div className="pt-6 pb-4 px-6">
              <CardTitle className="text-xl font-semibold text-center text-black mb-1">登录</CardTitle>
              <CardDescription className="text-sm text-center text-gray-500">请输入您的凭据以访问您的账户</CardDescription>
            </div>
          </CardHeader>
        <CardContent className="p-6"> {/* Ensured padding for content area */}
          {/* ErrorDisplay removed, FormMessage handles field-specific errors */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="example@example.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="请输入密码" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white h-12" // Matched style from target file, adjusted py
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                  </>
                ) : '登录'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-700">
            没有账号？
            <Link href="/register" className="font-semibold text-black hover:underline ml-1">
              立即注册
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
