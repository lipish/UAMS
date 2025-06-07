'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FileText, Download, Lock, Unlock } from 'lucide-react';

interface Document {
  id: number;
  title: string;
  description?: string;
  category: string;
  file_path: string;
  file_size: number;
  created_at: string;
  updated_at?: string;
  access_level: 'public' | 'restricted' | 'private';
  download_count: number;
  has_access?: boolean;
}

export default function AllDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [requesting, setRequesting] = useState<number | null>(null);

  // 获取所有文档列表
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        throw new Error('获取文档列表失败');
      }
    } catch (error) {
      console.error('获取文档列表错误:', error);
      toast({
        title: "错误",
        description: "获取文档列表失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (documentId: number) => {
    setRequesting(documentId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${documentId}/request-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "文档访问权限申请已提交，请等待审核",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '申请访问权限失败');
      }
    } catch (error) {
      console.error('申请访问权限错误:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "申请访问权限失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setRequesting(null);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = document.title;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "成功",
          description: "文档下载已开始",
        });
      } else {
        throw new Error('下载文档失败');
      }
    } catch (error) {
      console.error('下载文档错误:', error);
      toast({
        title: "错误",
        description: "下载文档失败，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getAccessLevelBadge = (accessLevel: string, hasAccess?: boolean) => {
    if (accessLevel === 'public') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">公开</Badge>;
    } else if (accessLevel === 'restricted') {
      return hasAccess ? 
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">有权限</Badge> :
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">需申请</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">私有</Badge>;
    }
  };

  // 获取所有分类
  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  // 筛选文档
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesAccess = accessFilter === 'all' || 
                         (accessFilter === 'accessible' && (doc.access_level === 'public' || doc.has_access)) ||
                         (accessFilter === 'restricted' && doc.access_level === 'restricted' && !doc.has_access) ||
                         (accessFilter === 'private' && doc.access_level === 'private');
    
    return matchesSearch && matchesCategory && matchesAccess;
  });

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
        <h1 className="text-3xl font-bold mb-2">所有文档</h1>
        <p className="text-muted-foreground">
          浏览系统中的所有可用文档。您可以下载公开文档，或申请访问受限文档。
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            搜索文档
          </Label>
          <Input
            id="search"
            placeholder="搜索文档标题或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="category-filter" className="text-sm font-medium mb-2 block">
            分类筛选
          </Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="access-filter" className="text-sm font-medium mb-2 block">
            权限筛选
          </Label>
          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger>
              <SelectValue placeholder="选择权限" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部权限</SelectItem>
              <SelectItem value="accessible">可访问</SelectItem>
              <SelectItem value="restricted">需申请</SelectItem>
              <SelectItem value="private">私有</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">暂无文档</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' || accessFilter !== 'all' 
                  ? '没有找到符合条件的文档，请尝试调整搜索条件。'
                  : '系统中暂无可用文档。'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {document.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {document.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  {getAccessLevelBadge(document.access_level, document.has_access)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">分类</p>
                    <p className="text-sm">{document.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">文件大小</p>
                    <p className="text-sm">{formatFileSize(document.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">下载次数</p>
                    <p className="text-sm">{document.download_count}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">创建时间</p>
                    <p className="text-sm">{formatDate(document.created_at)}</p>
                  </div>
                  {document.updated_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">更新时间</p>
                      <p className="text-sm">{formatDate(document.updated_at)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 justify-end">
                  {document.access_level === 'public' || document.has_access ? (
                    <Button onClick={() => handleDownload(document)}>
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </Button>
                  ) : document.access_level === 'restricted' ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline"
                          disabled={requesting === document.id}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          {requesting === document.id ? '申请中...' : '申请访问'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>申请文档访问权限</AlertDialogTitle>
                          <AlertDialogDescription>
                            您确定要申请访问文档 "{document.title}" 吗？
                            申请提交后需要等待管理员审核。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRequestAccess(document.id)}
                          >
                            确认申请
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button variant="outline" disabled>
                      <Lock className="h-4 w-4 mr-2" />
                      私有文档
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}