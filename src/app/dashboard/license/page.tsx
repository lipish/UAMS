'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // 导入 useAuth
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Heroicons 图标
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentCheckIcon,
  StopCircleIcon, // 添加 StopCircleIcon 作为 Ban 的替代
} from '@heroicons/react/24/outline';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'; // 导入 Dialog 组件

interface License {
  id: string;
  productName: string;
  licenseType: 'trial' | 'standard' | 'professional' | 'enterprise';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'active' | 'cancelled';
  applyDate: string;
  expiryDate: string;
  licenseKey?: string;
  canCancel: boolean;
  // 新增字段以匹配后端数据和前端使用
  company_name?: string;
  applicant_name?: string;
  applicant_email?: string;
  mac_address?: string;
  application_reason?: string;
  created_at: string; // 确保 created_at 存在
  review_comments?: string;
}



function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
    case 'approved':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'pending':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'rejected':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'expired':
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    default:
      return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'active':
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'expired':
      return 'outline';
    case 'rejected':
      return 'destructive';
    default:
      return 'default';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'active':
      return '已激活';
    case 'approved':
      return '已批准';
    case 'pending':
      return '待审核';
    case 'rejected':
      return '已拒绝';
    case 'expired':
      return '已过期';
    default:
      return status;
  }
}

function getLicenseTypeText(type: string) {
  switch (type) {
    case 'trial':
      return '试用版';
    case 'standard':
      return '标准版';
    case 'professional':
      return '专业版';
    case 'enterprise':
      return '企业版';
    default:
      return type;
  }
}

export default function LicenseManagePage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const { user } = useAuth(); // 获取用户信息

  // 获取license数据
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setLoading(true);
        const response = await apiService.licenses.getMyLicenses();
        if (response.data.status === 'success') {
          // 转换后端数据格式为前端格式
          const transformedLicenses = response.data.data.licenses.map((license: any): License => ({
            id: license.id.toString(),
            productName: 'Xinference 企业版', // 或者从后端获取产品名称
            licenseType: license.license_type,
            status: license.status,
            applyDate: new Date(license.created_at).toISOString().split('T')[0],
            expiryDate: license.expires_at ? new Date(license.expires_at).toISOString().split('T')[0] : '',
            licenseKey: license.license_key || '',
            canCancel: license.status === 'pending',
            company_name: license.company_name,
            applicant_name: license.applicant_name,
            applicant_email: license.applicant_email,
            mac_address: license.mac_address,
            application_reason: license.application_reason,
            created_at: license.created_at, // 添加 created_at
            review_comments: license.review_comments,
          }));
          setLicenses(transformedLicenses);
        }
      } catch (error) {
        console.error('获取license数据失败:', error);
        setError('获取license数据失败');
        // 如果API失败，设置为空数组
        setLicenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  // 过滤逻辑
  useEffect(() => {
    let filtered = licenses;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (license) =>
          license.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          license.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter((license) => license.status === statusFilter);
    }

    // 类型过滤
    if (typeFilter !== 'all') {
      filtered = filtered.filter((license) => license.licenseType === typeFilter);
    }

    setFilteredLicenses(filtered);
  }, [licenses, searchTerm, statusFilter, typeFilter]);

  const handleCancelLicense = (licenseId: string) => {
    setLicenses(licenses.filter((license) => license.id !== licenseId));
  };

  const handleViewDetails = (license: License) => {
    setSelectedLicense(license);
    setIsModalOpen(true);
    console.log('查看详情:', license.id);
  };


  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">License 管理</h1>
        <Button onClick={() => router.push('/dashboard/apply')}>申请新的 License</Button>
      </div>

      {/* 加载和错误状态 */}
      {loading && <p>加载中...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* 过滤和搜索 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="搜索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="active">已激活</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="所有类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有类型</SelectItem>
            <SelectItem value="trial">试用版</SelectItem>
            <SelectItem value="standard">标准版</SelectItem>
            <SelectItem value="professional">专业版</SelectItem>
            <SelectItem value="enterprise">企业版</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* License 列表 */}
      <div className="space-y-4">
        {filteredLicenses.map((license) => (
          <Card key={license.id} className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{license.productName} - {license.id.slice(0, 8)}</CardTitle>
                  <CardDescription>
                    申请人: {license.applicant_name} ({license.applicant_email})
                  </CardDescription>
                </div>
                <Badge variant={license.status === 'active' ? 'default' : license.status === 'pending' ? 'secondary' : 'destructive'}>
                  {getStatusText(license.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>申请日期: {license.applyDate}</p>
              <p>到期日期: {license.expiryDate || 'N/A'}</p>
              <p>MAC 地址: {license.mac_address}</p>
              <p>公司名称: {license.company_name}</p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleViewDetails(license)}>
                <EyeIcon className="mr-2 h-4 w-4" /> 详情
              </Button>
              {user && user.role === 'admin' && license.status === 'pending' && (
                <>
                  <Button variant="success" onClick={() => console.log('批准:', license.id)}>
                    <CheckCircleIcon className="mr-2 h-4 w-4" /> 批准
                  </Button>
                  <Button variant="destructive" onClick={() => console.log('拒绝:', license.id)}>
                    <XCircleIcon className="mr-2 h-4 w-4" /> 拒绝
                  </Button>
                </>
              )}
              {license.canCancel && (
                <Button variant="ghost" onClick={() => handleCancelLicense(license.id)}>
                  <TrashIcon className="mr-2 h-4 w-4" /> 取消
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 详情弹窗 */}
      {selectedLicense && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>License 详细信息</DialogTitle>
              <DialogDescription>
                查看 License 的详细申请信息和状态。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">ID:</span>
                <span className="col-span-3">{selectedLicense.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">产品名称:</span>
                <span className="col-span-3">{selectedLicense.productName}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">申请人:</span>
                <span className="col-span-3">{selectedLicense.applicant_name} ({selectedLicense.applicant_email})</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">公司名称:</span>
                <span className="col-span-3">{selectedLicense.company_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">MAC 地址:</span>
                <span className="col-span-3">{selectedLicense.mac_address}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">License 类型:</span>
                <span className="col-span-3">{getLicenseTypeText(selectedLicense.licenseType)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">状态:</span>
                <span className="col-span-3">
                  <Badge variant={getStatusBadgeVariant(selectedLicense.status)}>
                    {getStatusText(selectedLicense.status)}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">申请日期:</span>
                <span className="col-span-3">{selectedLicense.applyDate}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-semibold">到期日期:</span>
                <span className="col-span-3">{selectedLicense.expiryDate || 'N/A'}</span>
              </div>
              {selectedLicense.licenseKey && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right font-semibold">License Key:</span>
                  <span className="col-span-3 font-mono bg-gray-100 p-2 rounded text-sm break-all">
                    {selectedLicense.licenseKey}
                  </span>
                </div>
              )}
              {selectedLicense.application_reason && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <span className="text-right font-semibold pt-1">申请理由:</span>
                  <span className="col-span-3 whitespace-pre-wrap">{selectedLicense.application_reason}</span>
                </div>
              )}
              {selectedLicense.review_comments && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <span className="text-right font-semibold pt-1">审核备注:</span>
                  <span className="col-span-3 whitespace-pre-wrap">{selectedLicense.review_comments}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};