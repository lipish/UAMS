import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import { useAuth } from './AuthContext';

// 定义License类型
export interface License {
  id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  company_name?: string;
  license_type: 'trial' | 'official';
  mac_address: string;
  application_reason?: string;
  license_key?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expiry_date?: string;
  user_id: number;
  reviewed_by?: number;
  review_date?: string;
  review_comments?: string;
  applicant_username?: string;
  reviewer_username?: string;
}

// 定义License上下文类型
interface LicenseContextType {
  licenses: License[];
  pendingLicenses: License[];
  selectedLicense: License | null;
  loading: boolean;
  error: string | null;
  createLicense: (licenseData: any) => Promise<void>;
  getMyLicenses: () => Promise<void>;
  getLicense: (id: number) => Promise<void>;
  reviewLicense: (id: number, status: 'approved' | 'rejected', comments: string) => Promise<void>;
  getPendingLicenses: () => Promise<void>;
  getAllLicenses: (params?: { status?: string }) => Promise<void>;
  verifyLicense: (license_key: string, mac_address: string) => Promise<any>;
  clearSelectedLicense: () => void;
}

// 创建License上下文
const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

// 创建License上下文提供者组件
export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [pendingLicenses, setPendingLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  // 创建license申请
  const createLicense = async (licenseData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.licenses.create(licenseData);
      // 创建成功后刷新列表
      await getMyLicenses();
      
      // 跳转到状态页面
      router.push('/dashboard/status');
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 获取当前用户的license申请
  const getMyLicenses = async () => {
    try {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      const response = await apiService.licenses.getMyLicenses();
      setLicenses(response.data.data.licenses);
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // 获取license详情
  const getLicense = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.licenses.getLicense(id);
      setSelectedLicense(response.data.data.license);
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 审核license申请（管理员）
  const reviewLicense = async (id: number, status: 'approved' | 'rejected', comments: string) => {
    try {
      if (!isAdmin) {
        setError('无权限执行此操作');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await apiService.licenses.reviewLicense(id, status, comments);
      setSelectedLicense(response.data.data.license);
      
      // 审核成功后刷新待审核列表
      if (status === 'approved' || status === 'rejected') {
        await getPendingLicenses();
      }
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 获取所有待审核的license（管理员）
  const getPendingLicenses = async () => {
    try {
      if (!isAdmin) return;
      
      setLoading(true);
      setError(null);
      
      const response = await apiService.licenses.getPendingLicenses();
      setPendingLicenses(response.data.data.licenses);
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // 获取所有license或按状态筛选（管理员）
  const getAllLicenses = async (params?: { status?: string }) => {
    try {
      if (!isAdmin) {
        setError('无权限执行此操作');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await apiService.licenses.getAllLicenses(params);
      setLicenses(response.data.data.licenses);
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // 验证license有效性
  const verifyLicense = async (license_key: string, mac_address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.licenses.verifyLicense(license_key, mac_address);
      return response.data.data;
    } catch (err) {
      setError(apiService.handleError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 清除选中的License
  const clearSelectedLicense = () => {
    setSelectedLicense(null);
  };

  // 当认证状态改变时，自动加载数据
  useEffect(() => {
    if (isAuthenticated) {
      getMyLicenses();
      if (isAdmin) {
        getPendingLicenses();
      }
    }
  }, [isAuthenticated, isAdmin]);

  // 提供上下文值
  const contextValue: LicenseContextType = {
    licenses,
    pendingLicenses,
    selectedLicense,
    loading,
    error,
    createLicense,
    getMyLicenses,
    getLicense,
    reviewLicense,
    getPendingLicenses,
    getAllLicenses,
    verifyLicense,
    clearSelectedLicense,
  };

  return (
    <LicenseContext.Provider value={contextValue}>
      {children}
    </LicenseContext.Provider>
  );
};

// 创建使用License上下文的hook
export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense必须在LicenseProvider内部使用');
  }
  return context;
};