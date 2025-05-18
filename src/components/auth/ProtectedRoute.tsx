'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

// 客户端组件包装器，确保只在客户端渲染
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // 未登录，重定向到登录页
      router.push('/login');
    } else if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // 已登录但权限不足，重定向到首页或显示无权限页面
      router.push('/');
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  // 在客户端渲染受保护的内容
  return (
    <ClientOnly>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      ) : !isAuthenticated ? (
        // 未认证，不渲染任何内容，由 useEffect 处理重定向
        null
      ) : requiredRole && user?.role !== requiredRole ? (
        // 无权限
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">无权限访问</h2>
            <p>您没有权限访问此页面</p>
          </div>
        </div>
      ) : (
        // 已认证且有权限，渲染子组件
        <>{children}</>
      )}
    </ClientOnly>
  );
}
