'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, Copy, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface LicenseApplication {
  id: number;
  applicant_name: string;
  applicant_email: string;
  company_name?: string;
  license_type: string;
  mac_address: string;
  application_reason?: string;
  license_key?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expiry_date?: string;
  review_comments?: string;
}

const statusConfig = {
  pending: {
    label: '等待审核',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  approved: {
    label: '已批准',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  rejected: {
    label: '已拒绝',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200'
  }
};

const licenseTypeLabels = {
  trial: '试用版 (15天)',
  official: '正式版'
};

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<LicenseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await apiService.licenses.getMyLicenses();
      
      if (response.data.status === 'success') {
        setApplications(response.data.data.licenses || []);
      } else {
        throw new Error(response.data.message || '获取申请列表失败');
      }
    } catch (error: any) {
      console.error('获取申请列表失败:', error);
      setError(error.response?.data?.message || error.message || '获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const copyLicenseKey = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast({
      title: "复制成功",
      description: "License Key 已复制到剪贴板",
      duration: 2000,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载申请列表...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={fetchApplications} variant="outline">
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">我的申请</h1>
        <p className="text-muted-foreground mt-2">
          查看您的所有 License 申请状态和详情
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无申请记录</h3>
            <p className="text-muted-foreground mb-4">您还没有提交过任何 License 申请</p>
            <Link href="/dashboard/apply">
              <Button>立即申请</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const statusInfo = statusConfig[app.status];
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={app.id} className="w-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        申请 #{app.id}
                        <Badge className={statusInfo.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        申请时间：{formatDate(app.created_at)}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>License 类型：{licenseTypeLabels[app.license_type as keyof typeof licenseTypeLabels] || app.license_type}</div>
                      {app.expiry_date && (
                        <div>过期时间：{formatDate(app.expiry_date)}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">申请人：</span>
                        <span className="ml-2">{app.applicant_name}</span>
                      </div>
                      <div>
                        <span className="font-medium">邮箱：</span>
                        <span className="ml-2">{app.applicant_email}</span>
                      </div>
                      {app.company_name && (
                        <div>
                          <span className="font-medium">公司：</span>
                          <span className="ml-2">{app.company_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">MAC 地址：</span>
                        <span className="ml-2 font-mono text-sm bg-muted px-2 py-1 rounded">
                          {app.mac_address}
                        </span>
                      </div>
                      {app.application_reason && (
                        <div>
                          <span className="font-medium">申请说明：</span>
                          <span className="ml-2">{app.application_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* License Key 显示 */}
                  {app.status === 'approved' && app.license_key && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-800 mb-2">License Key</h4>
                          <div className="font-mono text-sm bg-white px-3 py-2 rounded border break-all">
                            {app.license_key}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLicenseKey(app.license_key!)}
                          className="ml-4 shrink-0"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          复制
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 审核意见 */}
                  {app.review_comments && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">审核意见</h4>
                      <p className="text-sm">{app.review_comments}</p>
                    </div>
                  )}

                  {/* 等待审核提示 */}
                  {app.status === 'pending' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800">
                          您的申请正在等待管理员审核，请耐心等待。
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link href="/dashboard/apply">
          <Button variant="outline">
            提交新申请
          </Button>
        </Link>
      </div>
    </div>
  );
}