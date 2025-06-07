"use client"

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from '@heroicons/react/24/outline';

interface License {
  id: string;
  productName: string;
  licenseType: 'trial' | 'standard' | 'professional' | 'enterprise';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'active';
  applyDate: string;
  expiryDate: string;
  licenseKey?: string;
  canCancel: boolean;
}

// 模拟数据
const mockLicenses: License[] = [
  {
    id: 'LIC-001',
    productName: '数据分析平台',
    licenseType: 'professional',
    status: 'active',
    applyDate: '2024-01-15',
    expiryDate: '2025-01-15',
    licenseKey: 'PRO-XXXX-XXXX-XXXX',
    canCancel: false,
  },
  {
    id: 'LIC-002',
    productName: '项目管理系统',
    licenseType: 'trial',
    status: 'pending',
    applyDate: '2024-01-20',
    expiryDate: '2024-02-04',
    canCancel: true,
  },
  {
    id: 'LIC-003',
    productName: '客户关系管理',
    licenseType: 'enterprise',
    status: 'approved',
    applyDate: '2024-01-10',
    expiryDate: '2025-01-10',
    licenseKey: 'ENT-YYYY-YYYY-YYYY',
    canCancel: false,
  },
  {
    id: 'LIC-004',
    productName: '财务管理软件',
    licenseType: 'standard',
    status: 'rejected',
    applyDate: '2024-01-05',
    expiryDate: '2024-01-05',
    canCancel: false,
  },
  {
    id: 'LIC-005',
    productName: '库存管理系统',
    licenseType: 'trial',
    status: 'expired',
    applyDate: '2023-12-01',
    expiryDate: '2023-12-16',
    canCancel: false,
  },
];

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
  const [licenses, setLicenses] = useState<License[]>(mockLicenses);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>(mockLicenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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

  const handleViewDetails = (licenseId: string) => {
    // 这里可以导航到详情页面或打开模态框
    console.log('查看详情:', licenseId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">License 管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的软件授权许可
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          申请新 License
        </Button>
      </div>

      {/* 过滤和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索产品名称或 License ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">已激活</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="trial">试用版</SelectItem>
                <SelectItem value="standard">标准版</SelectItem>
                <SelectItem value="professional">专业版</SelectItem>
                <SelectItem value="enterprise">企业版</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* License 列表 */}
      <div className="grid gap-4">
        {filteredLicenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">没有找到 License</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? '请尝试调整搜索条件或筛选器'
                  : '您还没有任何 License，点击上方按钮申请新的 License'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLicenses.map((license) => (
            <Card key={license.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* 状态图标 */}
                    <div className="mt-1">
                      {getStatusIcon(license.status)}
                    </div>
                    
                    {/* License 信息 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{license.productName}</h3>
                        <Badge variant={getStatusBadgeVariant(license.status)}>
                          {getStatusText(license.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getLicenseTypeText(license.licenseType)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">License ID:</span>
                          <p className="font-mono">{license.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">申请日期:</span>
                          <p>{license.applyDate}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">有效期至:</span>
                          <p>{license.expiryDate}</p>
                        </div>
                        {license.licenseKey && (
                          <div>
                            <span className="text-muted-foreground">License Key:</span>
                            <p className="font-mono text-xs">{license.licenseKey}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(license.id)}
                      className="flex items-center gap-1"
                    >
                      <EyeIcon className="h-4 w-4" />
                      查看
                    </Button>
                    
                    {license.canCancel && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                            取消
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认取消申请</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要取消对产品 "{license.productName}" 的 License 申请吗？
                              此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelLicense(license.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              确认取消
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentCheckIcon className="h-5 w-5" />
            License 统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {licenses.length}
              </div>
              <div className="text-sm text-muted-foreground">总计</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {licenses.filter(l => l.status === 'active' || l.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">已激活</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {licenses.filter(l => l.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">待审核</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {licenses.filter(l => l.status === 'rejected').length}
              </div>
              <div className="text-sm text-muted-foreground">已拒绝</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {licenses.filter(l => l.status === 'expired').length}
              </div>
              <div className="text-sm text-muted-foreground">已过期</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}