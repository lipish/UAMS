import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface UseAuthCheckOptions {
  redirectTo?: string;
  requiredRole?: 'admin' | 'user';
  redirectIfFound?: boolean;
}

/**
 * 身份认证检查钩子
 * 用于检查用户是否已登录以及权限检查
 * 
 * @param options 配置选项
 * @returns 认证状态信息
 */
export function useAuthCheck(options: UseAuthCheckOptions = {}) {
  const { 
    redirectTo = '/auth/login', 
    requiredRole, 
    redirectIfFound = false 
  } = options;
  
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [localChecked, setLocalChecked] = useState(false);

  // 直接读取存储中的认证信息
  const tokenFromStorage = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  const userFromStorage = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = sessionStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('解析存储的用户数据失败:', e);
      return null;
    }
  }, []);

  // 本地判断认证状态
  const hasToken = !!tokenFromStorage;
  const hasStoredUser = !!userFromStorage;
  
  // 计算有效的认证状态
  const effectiveAuthenticated = isAuthenticated || (hasToken && hasStoredUser);
  
  // 获取用户角色，从多个来源
  const userRole = user?.role || userFromStorage?.role || 'user';
  
  // 调试日志
  useEffect(() => {
    console.log('useAuthCheck: 认证状态更新', {
      isAuthenticated,
      hasToken,
      hasStoredUser,
      effectiveAuthenticated,
      userRole,
      pathname
    });
  }, [isAuthenticated, hasToken, hasStoredUser, effectiveAuthenticated, userRole, pathname]);
  
  // 在挂载时检查本地存储
  useEffect(() => {
    if (!localChecked && typeof window !== 'undefined') {
      setLocalChecked(true);
      const token = localStorage.getItem('token');
      const user = sessionStorage.getItem('user');
      
      console.log('useAuthCheck: 本地存储检查', {
        hasToken: !!token,
        hasUser: !!user,
        tokenContent: token ? `${token.substring(0, 5)}...${token.slice(-5)}` : null,
        userData: user ? JSON.parse(user) : null
      });
      
      // 如果有token但用户状态未更新，触发认证状态更新而不是刷新页面
      if (token && user && !isAuthenticated) {
        console.log('检测到存储中的认证信息，但状态未更新，触发认证更新');
        window.dispatchEvent(new Event('auth-update'));
      }
    }
  }, [localChecked, isAuthenticated]);
  
  useEffect(() => {
    // 如果仍在加载，则跳过检查
    if (loading) return;

    // 已检查标记
    if (!checked) {
      setChecked(true);
      console.log('useAuthCheck: 认证状态检查', {
        isAuthenticated,
        effectiveAuthenticated,
        hasToken,
        hasStoredUser,
        pathname
      });
    }

    // 在登录或注册页面不需要检查
    if (pathname === '/auth/login' || pathname === '/auth/register') {
      // 如果已经认证，重定向到首页
      if (effectiveAuthenticated) {
        router.push('/dashboard/apply');
      }
      return;
    }

    // dashboard路径特殊处理
    if (pathname.startsWith('/dashboard')) {
      if (effectiveAuthenticated) {
        return; // 已认证，允许访问
      }
      
      if (hasToken) {
        console.log('有token但认证状态不完整，触发认证更新');
        // 如果有token但认证不完整，可能是状态未同步，触发认证更新
        window.dispatchEvent(new Event('auth-update'));
        return;
      }
    }

    // 如果是redirectIfFound模式且用户已认证，则重定向
    if (redirectIfFound && effectiveAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // 如果未认证且需要认证，则重定向
    if (!redirectIfFound && !effectiveAuthenticated) {
      // 保存当前路径以便登录后返回
      if (pathname !== '/auth/login' && pathname !== '/auth/register') {
        sessionStorage.setItem('returnUrl', pathname);
      }
      router.push(redirectTo);
      return;
    }

    // 如果需要特定角色但用户无此角色
    if (
      !redirectIfFound && 
      effectiveAuthenticated && 
      requiredRole && 
      userRole !== requiredRole && 
      userRole !== 'admin'
    ) {
      const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/dashboard/apply';
      router.push(redirectPath);
      return;
    }
  }, [
    checked, 
    loading, 
    isAuthenticated,
    effectiveAuthenticated,
    hasToken,
    hasStoredUser,
    redirectIfFound, 
    redirectTo, 
    requiredRole, 
    user, 
    userRole,
    router,
    pathname
  ]);
  
  return {
    user: user || userFromStorage,
    isAuthenticated: effectiveAuthenticated,
    loading: loading || !checked,
    isAuthorized: !requiredRole || userRole === requiredRole || userRole === 'admin'
  };
}