'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LicenseApplication {
  id: number;
  product_name: string;
  license_type: string;
  customer_name: string;
  mac_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  notes?: string;
  user_id: number;
  company_name?: string;
  contact_name?: string;
  email?: string;
}

export default function ReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<LicenseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 检查管理员权限
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "访问被拒绝",
        description: "您没有权限访问此页面",
        variant: "destructive",
      });
      window.location.href = '/dashboard';
    }
  }, [user, toast]);

  // 获取申请列表
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/license/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
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

  const handleReviewApplication = async (applicationId: number, action: 'approve' | 'reject') => {
    setProcessing(applicationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/license/applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: `申请已${action === 'approve' ? '批准' : '拒绝'}`,
        });
        setReviewNotes('');
        // 刷新申请列表
        fetchApplications();
      } else {
        throw new Error(`${action === 'approve' ? '批准' : '拒绝'}申请失败`);
      }
    } catch (error) {
      console.error('审核申请错误:', error);
      toast({
        title: "错误",
        description: `${action === 'approve' ? '批准' : '拒绝'}申请失败，请稍后重试`,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待审核</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已批准</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">已拒绝</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">已过期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">访问被拒绝</h3>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold mb-2">License申请审核</h1>
        <p className="text-muted-foreground">
          管理员可以审核、批准或拒绝License申请。
        </p>
      </div>

      {/* 状态筛选 */}
      <div className="mb-6">
        <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
          筛选状态
        </Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已批准</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">暂无申请</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' ? '当前没有任何License申请。' : `当前没有状态为"${statusFilter}"的申请。`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{application.product_name}</CardTitle>
                    <CardDescription>
                      申请时间：{formatDate(application.created_at)} | 申请人：{application.company_name || application.contact_name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(application.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">申请公司</p>
                    <p className="text-sm">{application.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">联系人</p>
                    <p className="text-sm">{application.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">邮箱</p>
                    <p className="text-sm">{application.email}</p>
                  </div>
                  {application.notes && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm font-medium text-muted-foreground mb-1">申请备注</p>
                      <p className="text-sm">{application.notes}</p>
                    </div>
                  )}
                </div>
                
                {application.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`notes-${application.id}`} className="text-sm font-medium mb-2 block">
                        审核备注（可选）
                      </Label>
                      <Textarea
                        id={`notes-${application.id}`}
                        placeholder="请输入审核备注..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            disabled={processing === application.id}
                          >
                            拒绝
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认拒绝申请</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要拒绝对产品 "{application.product_name}" 的License申请吗？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReviewApplication(application.id, 'reject')}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              确认拒绝
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            disabled={processing === application.id}
                          >
                            {processing === application.id ? '处理中...' : '批准'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认批准申请</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要批准对产品 "{application.product_name}" 的License申请吗？
                              批准后将生成相应的License密钥。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReviewApplication(application.id, 'approve')}
                            >
                              确认批准
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}