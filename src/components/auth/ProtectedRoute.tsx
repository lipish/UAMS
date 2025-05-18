'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuthCheck } from '@/hooks/use-auth-check';
import { ErrorDisplay } from '../ui/error-display';

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
  const router = useRouter();
  const [localChecked, setLocalChecked] = useState(false);
  const [localAuthenticated, setLocalAuthenticated] = useState(false);

  // 使用统一的身份认证检查钩子
  const { loading, isAuthenticated, isAuthorized } = useAuthCheck({
    requiredRole
  });
  
  // 在组件挂载时检查本地存储中的认证信息
  useEffect(() => {
    if (typeof window !== 'undefined' && !localChecked) {
      const token = localStorage.getItem('token');
      const userStr = sessionStorage.getItem('user');
      
      console.log('ProtectedRoute: 直接检查存储:', { 
        hasToken: !!token, 
        hasUser: !!userStr 
      });
      
      // 如果存储中有认证信息但钩子报告未认证，允许暂时访问
      if (token && userStr && !isAuthenticated && !loading) {
        console.log('ProtectedRoute: 存储中有认证信息，允许访问');
        setLocalAuthenticated(true);
      }
      
      setLocalChecked(true);
    }
  }, [isAuthenticated, loading, localChecked]);
  
  // 在客户端渲染受保护的内容
  return (
    <ClientOnly>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      ) : (!isAuthenticated && !localAuthenticated) ? (
        // 未认证，不渲染任何内容，由钩子处理重定向
        null
      ) : !isAuthorized ? (
        // 无权限
        <div className="flex items-center justify-center min-h-screen">
          <ErrorDisplay 
            variant="error"
            title="无权限访问"
            description="您没有权限访问此页面，请联系管理员获取权限"
            status={403}
          />
        </div>
      ) : (
        // 已认证且有权限，渲染子组件
        <>{children}</>
      )}
    </ClientOnly>
  );
}
