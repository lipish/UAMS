'use client';

import { useState } from 'react';
import { Metadata } from 'next';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const documentCategories = [
  { id: 'api', name: 'API文档', description: '接口调用说明和示例' },
  { id: 'sdk', name: 'SDK文档', description: '软件开发工具包使用指南' },
  { id: 'integration', name: '集成指南', description: '系统集成和部署文档' },
  { id: 'troubleshooting', name: '故障排除', description: '常见问题和解决方案' },
  { id: 'best-practices', name: '最佳实践', description: '推荐的使用方法和规范' },
  { id: 'security', name: '安全文档', description: '安全配置和注意事项' },
];

const urgencyLevels = [
  { value: 'low', label: '低 - 1-2周内' },
  { value: 'medium', label: '中 - 3-5天内' },
  { value: 'high', label: '高 - 1-2天内' },
  { value: 'urgent', label: '紧急 - 24小时内' },
];

export default function DocumentApplyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentCategories: [] as string[],
    projectName: '',
    businessPurpose: '',
    urgency: '',
    expectedUsage: '',
    additionalRequirements: '',
  });

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      documentCategories: checked
        ? [...prev.documentCategories, categoryId]
        : prev.documentCategories.filter(id => id !== categoryId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.documentCategories.length === 0) {
      toast({
        title: "请选择文档类型",
        description: "至少需要选择一种文档类型",
        variant: "destructive",
      });
      return;
    }

    if (!formData.projectName || !formData.businessPurpose || !formData.urgency) {
      toast({
        title: "请填写必填信息",
        description: "项目名称、业务用途和紧急程度为必填项",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 这里应该调用API提交申请
      // const response = await fetch('/api/documents/apply', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "申请提交成功",
        description: "您的文档访问申请已提交，我们将在1-2个工作日内处理",
      });
      
      // 重置表单
      setFormData({
        documentCategories: [],
        projectName: '',
        businessPurpose: '',
        urgency: '',
        expectedUsage: '',
        additionalRequirements: '',
      });
      
    } catch (error) {
      toast({
        title: "提交失败",
        description: "请稍后重试或联系管理员",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">申请文档访问权限</h1>
        <p className="text-muted-foreground">
          请填写以下信息以申请访问相关技术文档。我们将根据您的需求和业务用途审核申请。
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>文档访问申请表</CardTitle>
          <CardDescription>
            请详细填写申请信息，以便我们更好地为您提供所需的文档资源。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 申请人信息 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">公司名称</Label>
                <Input 
                  id="company-name" 
                  value={user?.company_name || ''} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-name">联系人</Label>
                <Input 
                  id="contact-name" 
                  value={user?.contact_name || user?.username || ''} 
                  disabled 
                  className="bg-muted"
                />
              </div>
            </div>

            {/* 项目信息 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">项目名称 *</Label>
                <Input 
                  id="project-name" 
                  placeholder="请输入项目名称"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="business-purpose">业务用途 *</Label>
                <Textarea 
                  id="business-purpose" 
                  placeholder="请详细描述您申请文档的业务用途和目的"
                  value={formData.businessPurpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessPurpose: e.target.value }))}
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>

            {/* 文档类型选择 */}
            <div className="space-y-4">
              <Label>需要访问的文档类型 *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentCategories.map((category) => (
                  <div key={category.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id={category.id}
                      checked={formData.documentCategories.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={category.id} className="font-medium cursor-pointer">
                        {category.name}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 紧急程度和预期使用 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="urgency">紧急程度 *</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                  <SelectTrigger id="urgency">
                    <SelectValue placeholder="选择紧急程度" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expected-usage">预期使用时长</Label>
                <Input 
                  id="expected-usage" 
                  placeholder="如：3个月、长期使用等"
                  value={formData.expectedUsage}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedUsage: e.target.value }))}
                />
              </div>
            </div>

            {/* 附加要求 */}
            <div className="space-y-2">
              <Label htmlFor="additional-requirements">附加要求或说明</Label>
              <Textarea 
                id="additional-requirements" 
                placeholder="如有特殊要求或需要说明的内容，请在此填写"
                value={formData.additionalRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? '提交中...' : '提交申请'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}