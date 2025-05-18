'use client';

import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  // 确保认证状态正确
  useEffect(() => {
    // 仅在客户端执行
    if (typeof window !== 'undefined') {
      // 如果有token但用户未加载，尝试刷新
      const token = localStorage.getItem('token');
      if (token && !user && !loading) {
        console.log('Dashboard: 检测到token但未加载用户，尝试刷新');
        // 触发认证状态更新
        window.dispatchEvent(new Event('auth-update'));
      }
    }
  }, [user, loading]);
  
  // 显示欢迎信息
  useEffect(() => {
    if (user && !loading) {
      const companyName = user.company_name || '';
      const userName = user.username || user.contact_name || '';
      
      toast({
        title: "欢迎回来",
        description: `${companyName || userName ? (companyName || userName) + '，' : ''}祝您使用愉快！`,
        duration: 3000,
      });
    }
  }, [user, toast, loading]);
  
  return (
    <ProtectedRoute requiredRole="user">
      <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold">License管理系统</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link
                href="/dashboard/apply"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                申请License
              </Link>
              <Link
                href="/dashboard/status"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                查看状态
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:inline-block">{user?.company_name || '用户'}</span>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs">{user?.company_name?.[0] || user?.username?.[0] || user?.contact_name?.[0] || '用'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>
    </div>
    </ProtectedRoute>
  );
}