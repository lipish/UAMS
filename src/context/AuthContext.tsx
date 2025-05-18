import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';

// 定义用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at: string;
}

// 定义认证上下文类型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 创建认证上下文提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 检查认证状态
  const checkAuth = async () => {
    try {
      // 只有在浏览器环境才执行
      if (typeof window !== 'undefined') {
        setLoading(true);
        
        // 检查是否有token
        const isAuth = apiService.auth.isAuthenticated();
        
        if (!isAuth) {
          // 没有token，设置未认证状态
          setUser(null);
          setLoading(false);
          return;
        }
        
        // 有token，获取用户信息
        const response = await apiService.auth.getCurrentUser();
        setUser(response.data.data.user);
      }
    } catch (err) {
      // 获取用户信息失败，可能是token无效
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.auth.login(email, password);
      setUser(response.data.data.user);
      
      // 登录成功后跳转到仪表盘
      router.push('/dashboard');
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 注销
  const logout = () => {
    apiService.auth.logout();
    setUser(null);
    router.push('/auth/login');
  };

  // 注册
  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.auth.register(userData);
      
      // 注册成功后跳转到登录页
      router.push('/auth/login');
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新用户资料
  const updateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.auth.updateProfile(profileData);
      setUser(response.data.data.user);
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.auth.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    register,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 创建使用认证上下文的hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};