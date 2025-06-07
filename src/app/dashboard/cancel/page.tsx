'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface LicenseApplication {
  id: number;
  product_name: string;
  license_type: string;
  customer_name: string;
  mac_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  notes?: string;
}

export default function CancelApplicationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<LicenseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // 获取可取消的申请列表
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/license/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 只显示待审核状态的申请，这些可以被取消
        const pendingApplications = data.filter((app: LicenseApplication) => app.status === 'pending');
        setApplications(pendingApplications);
      } else {
        throw new Error('获取申请列表失败');
      }
    } catch (error) {
      console.error('获取申请列表错误:', error);
      toast({
        title: "错误",
        description: "获取申请列表失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    setCancelling(applicationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/license/applications/${applicationId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "申请已成功取消",
        });
        // 刷新申请列表
        fetchApplications();
      } else {
        throw new Error('取消申请失败');
      }
    } catch (error) {
      console.error('取消申请错误:', error);
      toast({
        title: "错误",
        description: "取消申请失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">取消License申请</h1>
        <p className="text-muted-foreground">
          您可以取消状态为"待审核"的License申请。已批准、已拒绝或已过期的申请无法取消。
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">暂无可取消的申请</h3>
              <p className="text-muted-foreground mb-4">
                您当前没有状态为"待审核"的License申请。
              </p>
              <Button onClick={() => window.location.href = '/dashboard/apply'}>
                申请新的License
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{application.product_name}</CardTitle>
                    <CardDescription>
                      申请时间：{formatDate(application.created_at)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    待审核
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">License类型</p>
                    <p className="text-sm">{application.license_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">客户名称</p>
                    <p className="text-sm">{application.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">MAC地址</p>
                    <p className="text-sm font-mono">{application.mac_address}</p>
                  </div>
                  {application.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">备注</p>
                      <p className="text-sm">{application.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        disabled={cancelling === application.id}
                      >
                        {cancelling === application.id ? '取消中...' : '取消申请'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认取消申请</AlertDialogTitle>
                        <AlertDialogDescription>
                          您确定要取消对产品 "{application.product_name}" 的License申请吗？
                          此操作无法撤销，您需要重新提交申请。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelApplication(application.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          确认取消
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}