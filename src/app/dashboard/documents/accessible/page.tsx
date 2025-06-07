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
import { FileText, Download, Eye, Calendar } from 'lucide-react';

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
  last_accessed?: string;
  access_granted_at?: string;
}

export default function AccessibleDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  // 获取有权限的文档列表
  useEffect(() => {
    fetchAccessibleDocuments();
  }, []);

  const fetchAccessibleDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents/accessible', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        throw new Error('获取可访问文档列表失败');
      }
    } catch (error) {
      console.error('获取可访问文档列表错误:', error);
      toast({
        title: "错误",
        description: "获取可访问文档列表失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        
        // 更新最后访问时间
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, last_accessed: new Date().toISOString() }
            : doc
        ));
        
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

  const handlePreview = async (document: Document) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${document.id}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // 更新最后访问时间
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, last_accessed: new Date().toISOString() }
            : doc
        ));
        
        toast({
          title: "成功",
          description: "文档预览已打开",
        });
      } else {
        throw new Error('预览文档失败');
      }
    } catch (error) {
      console.error('预览文档错误:', error);
      toast({
        title: "错误",
        description: "预览文档失败，请稍后重试",
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
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccessLevelBadge = (accessLevel: string) => {
    if (accessLevel === 'public') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">公开</Badge>;
    } else if (accessLevel === 'restricted') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">已授权</Badge>;
    } else {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">特殊权限</Badge>;
    }
  };

  // 获取所有分类
  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  // 筛选和排序文档
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'last_accessed':
          const aAccessed = a.last_accessed ? new Date(a.last_accessed).getTime() : 0;
          const bAccessed = b.last_accessed ? new Date(b.last_accessed).getTime() : 0;
          return bAccessed - aAccessed;
        case 'file_size':
          return b.file_size - a.file_size;
        default:
          return 0;
      }
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
        <h1 className="text-3xl font-bold mb-2">我的文档</h1>
        <p className="text-muted-foreground">
          这里显示您有访问权限的所有文档。您可以下载、预览这些文档。
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
          <Label htmlFor="sort-by" className="text-sm font-medium mb-2 block">
            排序方式
          </Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="选择排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">按标题</SelectItem>
              <SelectItem value="category">按分类</SelectItem>
              <SelectItem value="created_at">按创建时间</SelectItem>
              <SelectItem value="last_accessed">按访问时间</SelectItem>
              <SelectItem value="file_size">按文件大小</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">可访问文档</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.download_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">总下载次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">文档分类</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredAndSortedDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">暂无可访问文档</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' 
                  ? '没有找到符合条件的文档，请尝试调整搜索条件。'
                  : '您暂时没有可访问的文档，请联系管理员申请权限。'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAndSortedDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
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
                  {getAccessLevelBadge(document.access_level)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">分类</p>
                    <p className="text-sm">{document.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">文件大小</p>
                    <p className="text-sm">{formatFileSize(document.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">创建时间</p>
                    <p className="text-sm">{formatDate(document.created_at)}</p>
                  </div>
                  {document.last_accessed && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">最后访问</p>
                      <p className="text-sm">{formatDate(document.last_accessed)}</p>
                    </div>
                  )}
                  {document.access_granted_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">授权时间</p>
                      <p className="text-sm">{formatDate(document.access_granted_at)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePreview(document)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    预览
                  </Button>
                  <Button onClick={() => handleDownload(document)}>
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}