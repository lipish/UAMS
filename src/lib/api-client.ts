import { toast } from "@/components/ui/use-toast";

/**
 * API错误类 - 自定义错误类型，用于处理API请求错误
 */
export class ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;

  constructor(message: string, status: number, data?: any, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * API响应类型接口
 */
interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * API客户端配置接口
 */
interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 统一API客户端
 * 用于处理所有前端API请求，提供统一的错误处理和请求逻辑
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  /**
   * 构造函数
   * @param config API客户端配置
   */
  constructor(config: ApiClientConfig = {}) {
    // 使用相对URL通过代理访问API (通过Next.js API路由代理转发到后端)
    this.baseUrl = config.baseUrl || '/api';
    this.timeout = config.timeout || 30000; // 默认30秒超时
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    };
  }

  /**
   * 获取授权头
   * @returns 包含授权信息的请求头对象
   */
  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * 处理API响应
   * @param response Fetch响应对象
   * @returns 解析后的响应数据
   * @throws ApiError 当API返回错误时抛出
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    let data: any;

    try {
      // 根据内容类型解析响应
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      console.error('解析响应数据失败:', error);
      throw new ApiError(
        '无法解析服务器响应',
        response.status, 
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }

    // 处理错误响应
    if (!response.ok) {
      const errorMessage = 
        (data && data.message) || 
        (data && data.error) || 
        `服务器返回错误 (${response.status})`;
      
      throw new ApiError(errorMessage, response.status, data);
    }

    // 验证返回的数据格式
    if (typeof data !== 'object' && typeof data !== 'string') {
      throw new ApiError('服务器返回了非预期的数据格式', response.status, data);
    }

    return data as T;
  }

  /**
   * 执行API请求
   * @param method HTTP方法
   * @param endpoint API端点
   * @param data 请求数据
   * @param customHeaders 自定义请求头
   * @returns 请求响应
   */
  private async request<T>(
    method: string, 
    endpoint: string, 
    data?: any, 
    customHeaders?: Record<string, string>
  ): Promise<T> {
    // 构建完整URL - 直接使用后端URL
      const url = endpoint.startsWith('http') 
        ? endpoint 
        : `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
      
      console.log(`发送请求: ${method} ${url}`);
    
    // 准备请求配置
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...customHeaders
    };

    // 准备请求选项
    const options: RequestInit = {
      method,
      headers,
      // 对POST/PUT/PATCH请求，添加请求体
      ...(method !== 'GET' && method !== 'DELETE' && data 
        ? { body: JSON.stringify(data) } 
        : {})
    };

    try {
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      options.signal = controller.signal;

      // 发送请求
      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      // 处理响应
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ApiError('请求超时，请稍后重试', 408, null, true);
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 处理网络错误（如连接失败、DNS解析失败等）
      if (error.message && (
          error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed')
        )) {
        console.error('网络连接错误:', error);
        throw new ApiError(
          '网络连接错误，请检查您的网络连接或服务器是否可用', 
          0, // 使用0表示网络错误
          { originalError: error.message },
          true // 标记为网络错误
        );
      }
      
      throw new ApiError(error.message || '请求失败', 500);
    }
  }

  /**
   * GET请求
   * @param endpoint API端点
   * @param customHeaders 自定义请求头
   * @returns 请求响应
   */
  public async get<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, customHeaders);
  }

  /**
   * POST请求
   * @param endpoint API端点
   * @param data 请求数据
   * @param customHeaders 自定义请求头
   * @returns 请求响应
   */
  public async post<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, data, customHeaders);
  }

  /**
   * PUT请求
   * @param endpoint API端点
   * @param data 请求数据
   * @param customHeaders 自定义请求头
   * @returns 请求响应
   */
  public async put<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, customHeaders);
  }

  /**
   * DELETE请求
   * @param endpoint API端点
   * @param customHeaders 自定义请求头
   * @returns 请求响应
   */
  public async delete<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, customHeaders);
  }

  /**
   * PATCH请求
   * @param endpoint API端点
   * @param data 请求数据
   * @param customHeaders 自定义请求头
   * @returns 请求响应
   */
  public async patch<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, customHeaders);
  }
}

/**
 * 认证相关API服务
 */
export class AuthService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * 用户登录
   * @param email 邮箱
   * @param password 密码
   * @returns 登录响应
   */
  async login(email: string, password: string) {
    try {
      console.log('通过代理发送登录请求', { url: 'auth/login', email });
      const response = await this.client.post<ApiResponse<{
        user: any;
        token: string;
      }>>('auth/login', { email, password });

      // 验证响应数据的完整性
      if (!response || typeof response !== 'object') {
        throw new ApiError('收到无效的响应格式', 500);
      }

      if (!response.data) {
        throw new ApiError('响应中缺少data字段', 500);
      }

      if (!response.data.token) {
        throw new ApiError('响应中缺少token', 500);
      }

      localStorage.setItem('token', response.data.token);
      console.log('登录成功，保存token');

      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   * @param userData 用户数据
   * @returns 注册响应
   */
  async register(userData: any) {
    return this.client.post<ApiResponse<{user: any}>>('auth/register', userData);
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  async getCurrentUser() {
    try {
      return await this.client.get<ApiResponse<{user: any}>>('auth/me');
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果获取用户信息失败，清除token
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem('token');
      }
      throw error;
    }
  }

  /**
   * 更新用户资料
   * @param profileData 资料数据
   * @returns 更新响应
   */
  async updateProfile(profileData: any) {
    return this.client.put<ApiResponse<{user: any}>>('auth/profile', profileData);
  }

  /**
   * 修改密码
   * @param currentPassword 当前密码
   * @param newPassword 新密码
   * @returns 修改响应
   */
  async changePassword(currentPassword: string, newPassword: string) {
    return this.client.put<ApiResponse<{}>>('auth/password', {
      currentPassword,
      newPassword
    });
  }

  /**
   * 退出登录
   */
  logout() {
    localStorage.removeItem('token');
  }

  /**
   * 检查用户是否已认证
   * @returns 是否已认证
   */
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }
}

/**
 * License相关API服务
 */
export class LicenseService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * 创建license申请
   * @param licenseData License数据
   * @returns 创建响应
   */
  async create(licenseData: any) {
    return this.client.post<ApiResponse<{license: any}>>('licenses', licenseData);
  }

  /**
   * 获取用户的license申请
   * @returns License列表
   */
  async getMyLicenses() {
    return this.client.get<ApiResponse<{licenses: any[]}>>('licenses/my');
  }

  /**
   * 获取license详情
   * @param id License ID
   * @returns License详情
   */
  async getLicense(id: number) {
    return this.client.get<ApiResponse<{license: any}>>(`licenses/${id}`);
  }

  /**
   * 审核license申请
   * @param id License ID
   * @param status 状态
   * @param comments 审核意见
   * @param license_key License密钥
   * @returns 审核响应
   */
  async reviewLicense(id: number, status: string, comments: string, license_key?: string) {
    return this.client.put<ApiResponse<{license: any}>>(`licenses/${id}/review`, {
      status,
      comments,
      license_key
    });
  }

  /**
   * 获取待审核的license
   * @returns 待审核License列表
   */
  async getPendingLicenses() {
    return this.client.get<ApiResponse<{licenses: any[]}>>('licenses/pending/all');
  }

  /**
   * 获取所有license
   * @param params 查询参数
   * @returns License列表
   */
  async getAllLicenses(params?: { status?: string; limit?: number; offset?: number }) {
    // 构建查询字符串
    const queryParams = params 
      ? '?' + Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';
    
    return this.client.get<ApiResponse<{licenses: any[]}>>(`licenses${queryParams}`);
  }

  /**
   * 验证license有效性
   * @param license_key License密钥
   * @param mac_address MAC地址
   * @returns 验证结果
   */
  async verifyLicense(license_key: string, mac_address: string) {
    return this.client.post<ApiResponse<{
      valid: boolean;
      license_type?: string;
      expiry_date?: string;
      message?: string;
    }>>('licenses/verify', {
      license_key,
      mac_address
    });
  }
}

/**
 * API服务全局单例
 */
class ApiService {
  private client: ApiClient;
  readonly auth: AuthService;
  readonly licenses: LicenseService;

  constructor() {
    this.client = new ApiClient();
    this.auth = new AuthService(this.client);
    this.licenses = new LicenseService(this.client);
  }

  /**
   * 处理并显示API错误
   * @param error 错误对象
   * @returns 友好的错误消息
   */
  handleError(error: any): string {
    if (error instanceof ApiError) {
      // 如果是API错误，则使用API的错误消息
      let description = error.message;
      let title = '';
      
      // 网络错误特殊处理
      if (error.isNetworkError) {
        title = '网络错误';
        console.error('API网络错误:', error);
      } else {
        // 根据状态码自定义标题
        switch (error.status) {
          case 400:
            title = '请求错误';
            break;
          case 401:
            title = '未授权';
            break;
          case 403:
            title = '权限不足';
            break;
          case 404:
            title = '资源未找到';
            break;
          case 408:
            title = '请求超时';
            break;
          case 500:
          case 502:
          case 503:
            title = '服务器错误';
            break;
          default:
            title = error.status ? `错误 (${error.status})` : '未知错误';
        }
      }
      
      toast({
        title: title,
        description: description,
        variant: 'destructive',
      });
      return error.message;
    }
    
    // 网络错误特殊处理
      if (error instanceof ApiError && error.isNetworkError) {
        const message = '网络连接错误，请检查您的网络连接或服务器是否可用';
        toast({
          title: '网络错误',
          description: message,
          variant: 'destructive',
        });
        return message;
      }
    
    // 默认错误处理
    const message = error.message || '发生未知错误';
    toast({
      title: '错误',
      description: message,
      variant: 'destructive',
    });
    return message;
  }
}

// 导出API服务单例
export const apiService = new ApiService();