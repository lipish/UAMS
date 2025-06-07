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
        console.log('Dashboard: 检测到token但未加载用户，触发认证更新');
        // 触发认证状态更新，但添加防抖避免重复触发
        const timeoutId = setTimeout(() => {
          window.dispatchEvent(new Event('auth-update'));
        }, 100);
        
        return () => clearTimeout(timeoutId);
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
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold">UAMS</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              {/* License 菜单 */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  License
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard/apply"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      申请License
                    </Link>
                    <Link
                      href="/dashboard/cancel"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      取消申请
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/dashboard/review"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                      >
                        审核
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* 文档菜单 */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  文档
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard/documents/all"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      所有文档
                    </Link>
                    <Link
                      href="/dashboard/documents"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      有权限文档
                    </Link>
                  </div>
                </div>
              </div>
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
        <div className="container mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
    </ProtectedRoute>
  );
}