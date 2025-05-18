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

export const metadata: Metadata = {
  title: '申请License - License管理系统',
  description: '填写表单以申请新的License',
};

export default function ApplyLicensePage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>申请License</CardTitle>
          <CardDescription>
            请填写以下信息以申请新的License。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">产品名称</Label>
                <Input id="product-name" placeholder="输入产品名称" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license-type">License类型</Label>
                <Select>
                  <SelectTrigger id="license-type">
                    <SelectValue placeholder="选择License类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">试用版</SelectItem>
                    <SelectItem value="standard">标准版</SelectItem>
                    <SelectItem value="professional">专业版</SelectItem>
                    <SelectItem value="enterprise">企业版</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">客户名称</Label>
                <Input id="customer-name" placeholder="输入客户名称" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">客户邮箱</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="输入客户邮箱"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expiry-date">有效期</Label>
                <Input id="expiry-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>功能特性</Label>
              <div className="space-y-2 pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-basic" />
                  <Label htmlFor="feature-basic" className="font-normal">
                    基础功能
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-advanced" />
                  <Label htmlFor="feature-advanced" className="font-normal">
                    高级功能
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-professional" />
                  <Label htmlFor="feature-professional" className="font-normal">
                    专业功能
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea id="notes" placeholder="输入备注信息" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">提交申请</Button>
        </CardFooter>
      </Card>
    </div>
  );
}