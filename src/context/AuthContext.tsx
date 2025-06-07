import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 定义用户类型
export interface User {
  id: number;
  username?: string;
  email: string;
  company_name: string;
  contact_name: string;
  phone?: string;
  role?: 'user' | 'admin';
  created_at: string;
  updated_at?: string;
}

// 定义认证上下文类型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, skipRequest?: boolean) => Promise<{ success: boolean; user: User | null }>;
  logout: () => void;
  register: (userData: any) => Promise<{ success: boolean; user: User | null }>;
  updateProfile: (profileData: any) => Promise<any>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
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
  const checkAuth = useCallback(async () => {
    try {
      // 只有在浏览器环境才执行
      if (typeof window !== 'undefined') {
        setLoading(true);
        
        console.log('AuthContext: 开始检查认证状态');
        
        // 首先尝试从sessionStorage恢复用户信息（更快）
        const cachedUser = sessionStorage.getItem('user');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            console.log('AuthContext: 从缓存恢复用户信息', userData);
            setUser(userData);
            setLoading(false);
            return;
          } catch (e) {
            console.warn('AuthContext: 解析缓存用户数据失败', e);
            // 清除无效的缓存
            sessionStorage.removeItem('user');
          }
        }
        
        // 检查是否有token
        const token = localStorage.getItem('token');
        console.log('AuthContext: 检查认证状态, token存在:', !!token);
        
        if (!token) {
          // 没有token，设置未认证状态
          setUser(null);
          setLoading(false);
          return;
        }
        
        // 有token，获取用户信息
        try {
          // 直接使用fetch获取用户信息
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.data?.user) {
              console.log('AuthContext: 成功获取用户信息', data.data.user);
              // 确保有角色信息
              if (!data.data.user.role) {
                data.data.user.role = 'user';
              }
              
              // 保存到sessionStorage加速下次加载
              try {
                sessionStorage.setItem('user', JSON.stringify(data.data.user));
              } catch (e) {
                console.warn('AuthContext: 保存用户数据到sessionStorage失败', e);
              }
              
              setUser(data.data.user);
            } else {
              console.error('AuthContext: 用户信息格式不正确', data);
              sessionStorage.removeItem('user');
              setUser(null);
            }
          } else {
            console.error('AuthContext: 获取用户信息失败', response.status);
            localStorage.removeItem('token');
            sessionStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          // token无效或获取用户信息失败
          console.error('AuthContext: 获取用户信息出错', error);
          localStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (err) {
      // 其他错误
      console.error('AuthContext: 认证检查出错', err);
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时检查认证状态
  useEffect(() => {
    console.log('AuthContext: 初始化认证检查');
    
    // 先尝试从存储中直接读取认证信息
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUserStr = sessionStorage.getItem('user');
      
      console.log('AuthContext: 存储中的认证信息:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUserStr 
      });
      
      if (storedToken && storedUserStr && !user) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          console.log('AuthContext: 从存储恢复用户:', storedUser);
          setUser(storedUser);
          setLoading(false);
          return;
        } catch (e) {
          console.error('AuthContext: 解析存储的用户数据失败:', e);
        }
      }
    }
    
    checkAuth();
    
    // 添加storage事件监听，当localStorage改变时重新检查认证状态
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('AuthContext: 存储变化，重新检查认证状态');
        checkAuth();
      }
    };
    
    // 创建自定义事件监听器用于手动触发
    const handleCustomEvent = () => {
      console.log('AuthContext: 收到认证更新事件，重新检查认证状态');
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-update', handleCustomEvent);
    
    // 定期检查认证状态，防止过期
    const intervalId = setInterval(() => {
      if (user && typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('AuthContext: 定期检查认证状态');
          checkAuth();
        }
      }
    }, 300000); // 每5分钟检查一次，减少频率
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-update', handleCustomEvent);
      clearInterval(intervalId);
    };
  }, [checkAuth]);

  // 登录方法
  const login = useCallback(async (email: string, password: string, skipRequest = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (skipRequest) {
        console.log('AuthContext: 跳过登录请求，直接使用现有认证');
        // 从localStorage和sessionStorage恢复状态
        const token = localStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUser(userData);
            console.log('AuthContext: 已从存储中恢复用户状态');
            return { success: true, user: userData };
          } catch (e) {
            console.error('AuthContext: 解析用户数据失败', e);
          }
        }
        
        // 如果无法从存储恢复，尝试从API获取
        await checkAuth();
        return { success: !!user, user };
      }
      
      // 清除之前的认证状态
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      console.log('AuthContext: 开始登录请求...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `登录请求失败 (${response.status})`);
      }

      const data = await response.json();
      console.log('AuthContext: 登录请求成功', data);
      
      if (!data.data?.token) {
        throw new Error('登录响应中缺少token');
      }
      
      // 确保用户有角色信息
      const userData = data.data.user || { 
        id: 0,
        email,
        role: 'user',
        username: email.split('@')[0]
      };
      
      if (!userData.role) {
        userData.role = 'user';
      }
      
      // 保存认证信息
      try {
        localStorage.setItem('token', data.data.token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        console.log('AuthContext: 认证信息已保存', { token: data.data.token, user: userData });
      } catch (e) {
        console.error('AuthContext: 保存认证信息失败', e);
      }
      
      // 立即设置用户状态
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (err: any) {
      console.error('AuthContext: 登录错误:', err);
      // 确保清除任何可能的部分认证状态
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
      setError(err.message || '登录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  // 注销
  const logout = useCallback(() => {
    console.log('AuthContext: 执行注销');
    
    // 清除存储的认证信息
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // 清除状态
    setUser(null);
    setError(null);
    
    // 触发自定义事件通知系统认证状态已更新
    try {
      const authEvent = new Event('auth-update');
      window.dispatchEvent(authEvent);
    } catch (e) {
      console.warn('AuthContext: 无法触发认证更新事件', e);
    }
    
    // 确保重定向到正确的登录页面路径
    router.push('/auth/login');
  }, [router]);

  // 注册方法
  const register = useCallback(async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '注册失败');
      }
      
      const data = await response.json();
      
      // 注册成功后自动登录
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        
        if (data.data.user) {
          // 确保有角色信息
          if (!data.data.user.role) {
            data.data.user.role = 'user';
          }
          
          setUser(data.data.user);
          sessionStorage.setItem('user', JSON.stringify(data.data.user));
          
          // 触发存储事件，通知其他组件
          try {
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'user',
              newValue: JSON.stringify(data.data.user),
              url: window.location.href
            }));
          } catch (e) {
            console.warn('触发storage事件失败:', e);
          }
          
          return { success: true, user: data.data.user };
        }
      }
      
      return { success: false, user: null };
    } catch (err: any) {
      console.error('注册错误:', err);
      setError(err.message || '注册失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新用户资料
  const updateProfile = useCallback(async (profileData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新资料失败');
      }
      
      const data = await response.json();
      if (data.data?.user) {
        setUser(data.data.user);
        sessionStorage.setItem('user', JSON.stringify(data.data.user));
      }
      
      return data;
    } catch (err: any) {
      console.error('更新资料错误:', err);
      setError(err.message || '更新资料失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 修改密码
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '修改密码失败');
      }
      
      return await response.json();
    } catch (err: any) {
      console.error('修改密码错误:', err);
      setError(err.message || '修改密码失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 计算认证状态
  const isAuthenticated = !!user;
  
  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
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