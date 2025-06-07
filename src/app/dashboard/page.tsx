import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '控制台 - UAMS',
  description: 'UAMS (Unified Authorization Management System) 统一授权管理系统控制台',
};

export default function DashboardPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          欢迎使用UAMS统一授权管理系统
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Unified Authorization Management System
        </p>
        <p className="text-lg text-muted-foreground">统一授权管理，让权限控制更简单高效</p>
      </div>
      
      {/* License 管理区域 */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-blue-600">🔐</span>
            License 管理
          </h2>
          <p className="text-muted-foreground">管理您的软件授权许可</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">📝</span>
                申请 License
              </CardTitle>
              <CardDescription>
                提交新的License授权申请
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">填写必要信息，为您的项目申请软件授权许可。</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/apply" passHref>
                <Button className="w-full">立即申请</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-red-600">❌</span>
                取消申请 License
              </CardTitle>
              <CardDescription>
                撤销已提交的License申请
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">取消尚未审批的License申请，释放申请资源。</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/cancel" passHref>
                <Button variant="destructive" className="w-full">取消申请</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">📊</span>
                License 状态
              </CardTitle>
              <CardDescription>
                查看所有License申请状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">实时查看License申请的审批进度和状态。</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/status" passHref>
                <Button variant="outline" className="w-full">查看状态</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* 文档管理区域 */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-purple-600">📚</span>
            文档管理
          </h2>
          <p className="text-muted-foreground">管理您的文档访问权限</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-purple-600">📋</span>
                申请文档权限
              </CardTitle>
              <CardDescription>
                申请访问特定技术文档的权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">提交文档访问申请，获得查看和下载相关技术文档的权限。</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/documents/apply" passHref>
                <Button className="w-full" variant="secondary">申请权限</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-orange-600">📖</span>
                查看文档
              </CardTitle>
              <CardDescription>
                浏览已获得访问权限的文档
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">查看、下载和管理您有权限访问的所有技术文档。</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/documents" passHref>
                <Button variant="outline" className="w-full">进入文档库</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">待处理申请</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <span className="text-2xl">⏳</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已获得License</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">可访问文档</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <span className="text-2xl">📄</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}