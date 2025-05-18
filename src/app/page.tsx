"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 重定向到注册页面
    router.push('/auth/register');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-medium">正在跳转...</h1>
        <p className="mt-2 text-gray-500">如果没有自动跳转，请点击<a href="/auth/register" className="text-blue-600 hover:underline">这里</a></p>
      </div>
    </div>
  );
}