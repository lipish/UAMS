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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '申请License - UAMS',
  description: '填写表单以申请新的License',
};

export default function ApplyLicensePage() {
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
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="license-type">License类型</Label>
              <Select>
                <SelectTrigger id="license-type">
                  <SelectValue placeholder="选择License类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">试用 (15天)</SelectItem>
                  <SelectItem value="permanent">永久</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">客户名称</Label>
                <Input 
                  id="customer-name" 
                  placeholder="客户名称"
                  defaultValue="当前用户名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">客户邮箱</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="客户邮箱"
                  defaultValue="user@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac-address">服务器MAC地址</Label>
              <Input 
                id="mac-address" 
                placeholder="输入服务器MAC地址 (例如: 00:1B:44:11:3A:B7)"
                pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
              />
              <p className="text-sm text-muted-foreground">
                License 将根据此 MAC 地址生成，请确保输入正确的服务器 MAC 地址
              </p>
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