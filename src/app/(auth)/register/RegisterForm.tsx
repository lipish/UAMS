'use client';

import { useState } from 'react';
// import axios from 'axios'; // Not used in the new version
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import { apiService } from '@/services/api'; // Not used directly, assuming fetch is preferred or part of a context
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

// Define Zod schema for registration form validation
const registerSchema = z.object({
  companyName: z.string().min(1, {
    message: '公司名称不能为空',
  }).min(3, { message: '公司名称至少需要3个字符' }), // Added min length from original logic
  contactName: z.string().min(1, {
    message: '联系人不能为空',
  }).min(2, { message: '联系人姓名至少需要2个字符' }), // Added min length from original logic
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
  path: ["confirmPassword"], // Apply error to confirmPassword field
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  // const [formData, setFormData] = useState({...}); // Replaced by react-hook-form state
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    mode: "onBlur",
  });

  // handleChange removed, react-hook-form handles changes

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    // Form validation is now handled by Zod resolver

    try {
      // Prepare registration data from react-hook-form data
      const registerData = {
        username: data.email, // Using email as username
        email: data.email.trim(),
        password: data.password,
        company_name: data.companyName.trim(),
        contact_name: data.contactName.trim(),
      };
      
      console.log('准备发送注册请求 (react-hook-form):', JSON.stringify(registerData, null, 2));
      
      // API URL construction (can be moved to a service or env config)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const registerUrl = `${API_BASE_URL}/api/auth/register`;
      
      console.log('发送注册请求到:', registerUrl);
      
      // Health check can be optional or moved to a global app setup
      // try {
      //   console.log('测试连接性...');
      //   const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
      //   if (!healthCheck.ok) throw new Error('Health check failed');
      //   console.log('健康检查成功');
      // } catch (healthError) {
      //   console.error('健康检查失败:', healthError);
      //   toast.error(`无法连接到后端服务，请稍后重试`);
      //   setIsLoading(false);
      //   return;
      // }
      
      const response = await fetch(registerUrl, {
        method: 'POST',
        mode: 'cors', // Keep cors if needed, otherwise default is fine for same-origin
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Optional, usually not needed for fetch POST
        },
        body: JSON.stringify(registerData)
      });
      
      console.log('收到响应，状态码:', response.status);
      const responseData = await response.json(); // Assume JSON response
      console.log('响应数据:', responseData);

      if (!response.ok) {
        // Handle specific error messages from backend if available
        let errorMessage = responseData.message || `请求失败，状态码: ${response.status}`;
        if (response.status === 400 && responseData.errors && Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors.map((err: any) => err.msg || err.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // If registration is successful
      toast.success('注册成功！', {
        description: '正在跳转至登录页面...'
      });
      setTimeout(() => router.push('/login'), 2000); // Redirect to /login (within (auth) group)
      
    } catch (error: any) {
      console.error('注册请求失败:', error);
      toast.error(error.message || '注册失败，请检查输入信息或稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <Card className="w-full max-w-md shadow-xl border-purple-200">
        <CardHeader className="text-center">
            <div className="bg-gray-100 py-6 px-6 rounded-t-lg">
              <div className="flex justify-center mb-3">
                <Image src="/xinference.svg" alt="UAMS Logo" width={45} height={45} />
              </div>
              <p className="text-base font-medium text-gray-600 text-center">欢迎注册统一授权管理系统</p>
              <p className="text-xs text-gray-500 text-center">(Unified Authorization Management System)</p>
            </div>
            <div className="pt-6 pb-4 px-6">
              <CardTitle className="text-xl font-semibold text-center text-black mb-1">创建账户</CardTitle>
              <CardDescription className="text-sm text-center text-gray-500">填写您的详细信息以完成注册</CardDescription>
            </div>
          </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公司名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入您的公司全称" {...field} disabled={isLoading} />
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
                    <FormLabel>联系人姓名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入联系人真实姓名" {...field} disabled={isLoading} />
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
                    <FormLabel>邮箱地址</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@example.com" {...field} disabled={isLoading} />
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
                    <FormLabel>设置密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入至少6位密码" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
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
                      <Input type="password" placeholder="请再次输入密码" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button style={{ backgroundColor: '#8836F4' }} type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white h-12" disabled={isLoading}>
                {isLoading ? '注册中...' : '创建账户'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-700">
            已有账号？
            <Link href="/login" className="font-semibold text-black hover:underline ml-1">
              直接登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
