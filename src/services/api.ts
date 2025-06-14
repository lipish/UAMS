import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15秒超时
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器，添加认证token
axiosInstance.interceptors.request.use(
  (config) => {
    // 记录请求信息
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    
    // 如果存在token，添加到Authorization头
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器，处理错误和token过期
axiosInstance.interceptors.response.use(
  (response) => {
    // 记录响应信息
    console.log('收到响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // 记录错误响应
    if (error.response) {
      console.error('请求失败:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('无响应:', error.request);
    } else {
      console.error('请求错误:', error.message);
    }
    
    // 检查是否是401错误（未授权）
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // 标记请求已经重试过
      originalRequest._retry = true;
      
      // 清除无效的token
      localStorage.removeItem('token');
      
      // 可以在这里添加重定向到登录页面的逻辑
      window.location.href = '/login';
      
      return Promise.reject(error);
    }
    
    // 处理其他错误
    return Promise.reject(error);
  }
);

// API服务类
class ApiService {
  // 用户认证相关API
  auth = {
    // 用户注册
    register: (userData: any) => {
      return axiosInstance.post('/api/auth/register', userData);
    },
    
    // 用户登录
    login: async (email: string, password: string) => {
      try {
        const response = await axiosInstance.post('/api/auth/login', { email, password });
        
        // 保存token到localStorage
        if (response.data?.data?.token) {
          localStorage.setItem('token', response.data.data.token);
        }
        
        return response;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 退出登录
    logout: () => {
      localStorage.removeItem('token');
      return Promise.resolve();
    },
    
    // 获取当前用户信息
    getCurrentUser: () => {
      return axiosInstance.get('/auth/me');
    },
    
    // 更新用户资料
    updateProfile: (profileData: any) => {
      return axiosInstance.put('/auth/profile', profileData);
    },
    
    // 修改密码
    changePassword: (currentPassword: string, newPassword: string) => {
      return axiosInstance.put('/auth/password', {
        currentPassword,
        newPassword
      });
    },
    
    // 检查用户是否已认证
    isAuthenticated: () => {
      return !!localStorage.getItem('token');
    }
  };
  
  // UAMS License管理相关API
  licenses = {
    // 创建license申请
    create: (licenseData: any) => {
      return axiosInstance.post('/licenses', licenseData);
    },
    
    // 获取当前用户的license申请
    getMyLicenses: () => {
      return axiosInstance.get('/licenses/my');
    },
    
    // 获取单个license详情
    getLicense: (id: number) => {
      return axiosInstance.get(`/licenses/${id}`);
    },
    
    // 审核license申请（管理员）
    reviewLicense: (id: number, status: 'approved' | 'rejected', comments: string, license_key?: string) => {
      return axiosInstance.put(`/licenses/${id}/review`, {
        status,
        comments,
        license_key
      });
    },
    
    // 获取所有待审核的license（管理员）
    getPendingLicenses: () => {
      return axiosInstance.get('/licenses/pending/all');
    },
    
    // 获取所有license或按状态筛选（管理员）
    getAllLicenses: (params?: { status?: string; limit?: number; offset?: number }) => {
      return axiosInstance.get('/licenses', { params });
    },
    
    // 验证license有效性
    verifyLicense: (license_key: string, mac_address: string) => {
      return axiosInstance.post('/licenses/verify', {
        license_key,
        mac_address
      });
    }
  };
  
  // 通用错误处理
  handleError(error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      // 返回后端返回的错误消息，或者默认错误消息
      return axiosError.response?.data?.message || '操作失败，请稍后再试';
    }
    return '发生未知错误';
  }
}

// 导出单例实例
export const apiService = new ApiService();

// 导出类型
export type { AxiosResponse, AxiosError };