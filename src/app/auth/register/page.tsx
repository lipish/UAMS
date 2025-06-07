"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// 定义表单验证模式
const registerSchema = z.object({
  companyName: z.string().min(1, {
    message: '公司名称不能为空',
  }),
  contactName: z.string().min(1, {
    message: '联系人不能为空',
  }),
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  password: z.string().min(6, {
    message: '密码不能少于6个字符',
  }),
  confirmPassword: z.string().min(1, {
    message: '请确认密码',
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 初始化表单
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    mode: "onBlur", // 失焦时验证，避免无限循环
  });

  // 移除手动密码验证的useEffect，因为zod schema中已经有refine验证
  // 这样可以避免无限循环问题

  // 提交表单
  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    
    try {
      // 连接后端API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.email, // 使用邮箱作为用户名
          password: data.password,
          email: data.email,
          company_name: data.companyName,
          contact_name: data.contactName
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('注册成功！正在跳转至登录页面...');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        toast.error(result.message || '注册失败，请稍后再试');
      }
    } catch (error) {
      toast.error('注册失败，请稍后再试');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-xl shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">注册</h1>
          <p className="text-gray-500">
            创建您的代理商账号
          </p>
          <p className="text-xs text-gray-400 mt-1">所有字段均为必填</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公司名称</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系人</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                  <p className="text-xs text-gray-400 mt-1">密码长度至少6位</p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input placeholder="" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                  {form.formState.errors.confirmPassword ? null : (
                    <p className="text-xs text-gray-400 mt-1">请再次输入相同的密码</p>
                  )}
                </FormItem>
              )}
            />
            
            <Button 
            type="submit" 
            className="w-full py-6 bg-gray-900 hover:bg-gray-800 h-12"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '注册'}
          </Button>
          </form>
        </Form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            已有账号？ <Link href="/auth/login" className="text-blue-600">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}