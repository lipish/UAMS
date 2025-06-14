'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react'; // 引入 useState
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Menu, X } from 'lucide-react'; // 引入图标

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 添加移动端菜单状态
  const [openMobileLicenseMenu, setOpenMobileLicenseMenu] = useState(false);
  const [openMobileDocsMenu, setOpenMobileDocsMenu] = useState(false);
  
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
              <img src="/xinference.svg" alt="Xinference" className="h-6 w-6" />
              <span className="font-bold">UAMS</span>
            </Link>
            {/* 桌面端导航 */}
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
                      href="/dashboard/license"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      License 管理
                    </Link>
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

          {/* 用户头像和移动端汉堡菜单按钮 */}
          <div className="flex items-center gap-2">
            {/* 移动端汉堡菜单按钮 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-muted-foreground hover:text-primary"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            {/* 用户头像下拉菜单 */}
            <div className="relative group">
              <button className="flex items-center gap-2">
                <span className="text-sm hidden md:inline-block">{user?.company_name || '用户'}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs">{user?.company_name?.[0] || user?.username?.[0] || user?.contact_name?.[0] || '用'}</span>
                </div>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  >
                    用户信息修改
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.href = '/login';
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-b">
            <nav className="container mx-auto max-w-7xl flex flex-col px-2 py-1"> {/* Adjusted padding and gap */}
              {/* License 菜单 */}
              <div className="py-1"> {/* Added padding for each menu group */}
                <button 
                  onClick={() => setOpenMobileLicenseMenu(!openMobileLicenseMenu)}
                  className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2 px-2" /* Added horizontal padding */
                >
                  License
                  <svg className={`ml-1 h-4 w-4 transform transition-transform duration-200 ${openMobileLicenseMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMobileLicenseMenu && (
                  <div className="mt-1 w-full bg-background border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/dashboard/license"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        onClick={() => { setIsMobileMenuOpen(false); setOpenMobileLicenseMenu(false); }} 
                      >
                        License 管理
                      </Link>
                      <Link
                        href="/dashboard/apply"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        onClick={() => { setIsMobileMenuOpen(false); setOpenMobileLicenseMenu(false); }} 
                      >
                        申请License
                      </Link>
                      <Link
                        href="/dashboard/cancel"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        onClick={() => { setIsMobileMenuOpen(false); setOpenMobileLicenseMenu(false); }} 
                      >
                        取消申请
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          href="/dashboard/review"
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          onClick={() => { setIsMobileMenuOpen(false); setOpenMobileLicenseMenu(false); }} 
                        >
                          审核
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 文档菜单 */}
              <div className="py-1"> {/* Added padding for each menu group */}
                <button 
                  onClick={() => setOpenMobileDocsMenu(!openMobileDocsMenu)}
                  className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2 px-2" /* Added horizontal padding */
                >
                  文档
                  <svg className={`ml-1 h-4 w-4 transform transition-transform duration-200 ${openMobileDocsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMobileDocsMenu && (
                  <div className="mt-1 w-full bg-background border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/dashboard/documents/all"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        onClick={() => { setIsMobileMenuOpen(false); setOpenMobileDocsMenu(false); }} 
                      >
                        所有文档
                      </Link>
                      <Link
                        href="/dashboard/documents"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        onClick={() => { setIsMobileMenuOpen(false); setOpenMobileDocsMenu(false); }} 
                      >
                        有权限文档
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
    </ProtectedRoute>
  );
}