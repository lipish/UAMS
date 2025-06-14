"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// 定义表单验证模式
const testSchema = z.object({
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

type TestFormValues = z.infer<typeof testSchema>;

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false);

  // 初始化表单
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
    mode: "onChange", // 实时验证
  });

  // 提交表单
  function onSubmit(data: TestFormValues) {
    setIsLoading(true);
    
    // 模拟提交
    setTimeout(() => {
      console.log('表单数据:', data);
      toast.success('表单提交成功');
      setIsLoading(false);
    }, 1000);
  }

  // 显示验证错误
  const { errors } = form.formState;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-xl shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">密码一致性测试</h1>
          <p className="text-gray-500">
            测试表单验证错误显示
          </p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              placeholder="请输入密码"
              {...form.register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">密码长度至少6位</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              placeholder="请再次输入密码"
              {...form.register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full py-3 font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '提交'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            <a href="/register" className="text-blue-600 hover:underline">返回注册页面</a>
          </p>
        </div>
      </div>
      
      <div className="mt-8 p-4 border border-gray-300 rounded-md">
        <h2 className="font-bold mb-2">验证状态</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify({errors: form.formState.errors}, null, 2)}
        </pre>
      </div>
    </div>
  );
}