import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '控制台 - License管理系统',
  description: 'License管理系统控制台',
};

export default function DashboardPage() {
  // 直接重定向到申请页面
  redirect('/dashboard/apply');
  
  // 下面的代码不会执行，因为已经重定向
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">欢迎使用License管理系统</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>申请License</CardTitle>
            <CardDescription>
              填写信息申请新的License授权
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>通过提供必要的信息为您的客户申请新的License。</p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/apply" passHref>
              <Button>申请License</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>查看申请状态</CardTitle>
            <CardDescription>
              查看您提交的License申请状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>查看所有已提交的License申请的处理状态。</p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/status" passHref>
              <Button variant="outline">查看状态</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}