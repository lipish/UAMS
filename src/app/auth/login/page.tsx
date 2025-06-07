"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// 定义表单验证模式
const loginSchema = z.object({
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  password: z.string().min(1, {
    message: '请输入密码',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 初始化表单
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 提交表单
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        toast.success('登录成功！');
        router.push('/dashboard');
      } else {
        toast.error(result.message || '邮箱或密码不正确');
      }
    } catch (error) {
      toast.error('登录失败，请稍后再试');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-xl shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">登录</h1>
          <p className="text-gray-500">
            使用您的账号信息登录
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="example@example.com" type="email" {...field} />
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
                    <Input placeholder="" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full py-6 bg-gray-900 hover:bg-gray-800 h-12"
              disabled={isLoading}
            >
              {isLoading ? '处理中...' : '登录'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            没有账号？ <Link href="/auth/register" className="text-blue-600 hover:underline">注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}