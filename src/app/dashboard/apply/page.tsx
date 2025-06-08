'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ApplyLicensePage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    licenseType: 'trial',
    customerName: '',
    customerEmail: '',
    macAddress: '',
    notes: ''
  });

  // 当用户信息加载后，更新表单默认值
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.contact_name || user.username || '',
        customerEmail: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除之前的错误状态
    if (submitStatus === 'error') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      setErrorMessage('请输入客户名称');
      return false;
    }
    if (!formData.customerEmail.trim()) {
      setErrorMessage('请输入客户邮箱');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      setErrorMessage('请输入有效的邮箱地址');
      return false;
    }
    if (!formData.macAddress.trim()) {
      setErrorMessage('请输入服务器MAC地址');
      return false;
    }
    // MAC地址格式验证
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macPattern.test(formData.macAddress)) {
      setErrorMessage('MAC地址格式不正确，请使用格式：00:1B:44:11:3A:B7');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await apiService.licenses.create({
        applicant_name: formData.customerName,
        applicant_email: formData.customerEmail,
        mac_address: formData.macAddress.toUpperCase(),
        license_type: formData.licenseType,
        company_name: user?.company_name || '',
        application_reason: formData.notes || null
      });

      if (response.data.status === 'success') {
        setSubmitStatus('success');
        // 重置表单（保留用户信息）
        setFormData(prev => ({
          ...prev,
          macAddress: '',
          notes: ''
        }));
      } else {
        throw new Error(response.data.message || '提交失败');
      }
    } catch (error: any) {
      console.error('提交申请失败:', error);
      setSubmitStatus('error');
      setErrorMessage(error.response?.data?.message || error.message || '提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>申请License</CardTitle>
          <CardDescription>
            请填写以下信息以申请 Xinference 企业版 License。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 状态提示 */}
          {submitStatus === 'success' && (
            <Alert className="mb-6 border-green-200 bg-green-50">
               <CheckCircle className="h-4 w-4 text-green-600" />
               <AlertDescription className="text-green-800">
                 申请已成功提交！您的申请正在等待管理员审核，请耐心等待。您可以在
                 <a href="/dashboard/my-applications" className="font-medium underline ml-1 mr-1">我的申请</a>
                 页面查看申请状态。
               </AlertDescription>
             </Alert>
          )}
          
          {submitStatus === 'error' && errorMessage && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="license-type">License类型</Label>
              <Select 
                value={formData.licenseType} 
                onValueChange={(value) => handleInputChange('licenseType', value)}
              >
                <SelectTrigger id="license-type">
                  <SelectValue placeholder="选择License类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">试用 (15天)</SelectItem>
                  <SelectItem value="official">正式版</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">客户名称 <span className="text-red-500">*</span></Label>
                <Input 
                  id="customer-name" 
                  placeholder="请输入客户名称"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">客户邮箱 <span className="text-red-500">*</span></Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="请输入客户邮箱"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac-address">服务器MAC地址 <span className="text-red-500">*</span></Label>
              <Input 
                id="mac-address" 
                placeholder="输入服务器MAC地址 (例如: 00:1B:44:11:3A:B7)"
                value={formData.macAddress}
                onChange={(e) => handleInputChange('macAddress', e.target.value.toUpperCase())}
                style={{textTransform: 'uppercase'}}
                disabled={isSubmitting}
                required
              />
              <p className="text-sm text-muted-foreground">
                License 将根据此 MAC 地址生成，请确保输入正确的服务器 MAC 地址。<span className="font-medium text-orange-600">请使用大写字母</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea 
                id="notes" 
                placeholder="输入备注信息"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '提交申请'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}