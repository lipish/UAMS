'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  category: string;
  description: string;
  version: string;
  lastUpdated: string;
  fileSize: string;
  downloadCount: number;
  accessLevel: 'public' | 'restricted' | 'confidential';
  tags: string[];
}

// 模拟文档数据
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'API接口文档 v2.1',
    category: 'api',
    description: '完整的API接口调用说明，包含所有端点的详细参数和示例',
    version: '2.1.0',
    lastUpdated: '2024-01-15',
    fileSize: '2.3 MB',
    downloadCount: 156,
    accessLevel: 'public',
    tags: ['API', 'REST', '接口']
  },
  {
    id: '2',
    title: 'JavaScript SDK使用指南',
    category: 'sdk',
    description: 'JavaScript SDK的安装、配置和使用方法，包含完整示例代码',
    version: '1.8.2',
    lastUpdated: '2024-01-12',
    fileSize: '1.7 MB',
    downloadCount: 89,
    accessLevel: 'restricted',
    tags: ['SDK', 'JavaScript', '前端']
  },
  {
    id: '3',
    title: '系统集成部署指南',
    category: 'integration',
    description: '详细的系统集成步骤和部署配置说明',
    version: '3.0.1',
    lastUpdated: '2024-01-10',
    fileSize: '4.1 MB',
    downloadCount: 234,
    accessLevel: 'restricted',
    tags: ['部署', '集成', '配置']
  },
  {
    id: '4',
    title: '安全配置最佳实践',
    category: 'security',
    description: '系统安全配置的推荐做法和注意事项',
    version: '1.5.0',
    lastUpdated: '2024-01-08',
    fileSize: '1.2 MB',
    downloadCount: 67,
    accessLevel: 'confidential',
    tags: ['安全', '配置', '最佳实践']
  },
  {
    id: '5',
    title: '常见问题解决方案',
    category: 'troubleshooting',
    description: '用户常遇到的问题及其解决方案汇总',
    version: '2.3.0',
    lastUpdated: '2024-01-05',
    fileSize: '3.5 MB',
    downloadCount: 312,
    accessLevel: 'public',
    tags: ['FAQ', '故障排除', '解决方案']
  },
  {
    id: '6',
    title: 'Python SDK开发文档',
    category: 'sdk',
    description: 'Python SDK的详细开发文档和API参考',
    version: '2.0.3',
    lastUpdated: '2024-01-03',
    fileSize: '2.8 MB',
    downloadCount: 145,
    accessLevel: 'restricted',
    tags: ['SDK', 'Python', '后端']
  }
];

const categoryNames = {
  api: 'API文档',
  sdk: 'SDK文档',
  integration: '集成指南',
  troubleshooting: '故障排除',
  'best-practices': '最佳实践',
  security: '安全文档'
};

const accessLevelColors = {
  public: 'bg-green-100 text-green-800',
  restricted: 'bg-yellow-100 text-yellow-800',
  confidential: 'bg-red-100 text-red-800'
};

const accessLevelNames = {
  public: '公开',
  restricted: '受限',
  confidential: '机密'
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // 过滤文档
  useEffect(() => {
    let filtered = documents;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedCategory]);

  const handleDownload = async (document: Document) => {
    setIsLoading(true);
    try {
      // 这里应该调用下载API
      // const response = await fetch(`/api/documents/${document.id}/download`);
      
      // 模拟下载
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "下载开始",
        description: `正在下载 ${document.title}`,
      });
      
      // 更新下载次数
      setDocuments(prev => prev.map(doc => 
        doc.id === document.id 
          ? { ...doc, downloadCount: doc.downloadCount + 1 }
          : doc
      ));
      
    } catch (error) {
      toast({
        title: "下载失败",
        description: "请稍后重试或联系管理员",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (document: Document) => {
    toast({
      title: "预览功能",
      description: "文档预览功能正在开发中",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">我的文档</h1>
        <p className="text-muted-foreground">
          浏览和下载您有权限访问的技术文档。共 {filteredDocuments.length} 个文档可用。
        </p>
      </div>

      {/* 搜索和过滤 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="搜索文档标题、描述或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {Object.entries(categoryNames).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/dashboard/documents/apply">
          <Button variant="outline" className="w-full sm:w-auto">
            申请更多文档
          </Button>
        </Link>
      </div>

      {/* 文档列表 */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="text-lg font-medium mb-2">暂无可用文档</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? '没有找到符合条件的文档，请尝试调整搜索条件。'
                : '您还没有可访问的文档，请先申请文档访问权限。'
              }
            </p>
            <Link href="/dashboard/documents/apply">
              <Button>申请文档访问</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{document.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {categoryNames[document.category as keyof typeof categoryNames]}
                      </Badge>
                      <Badge className={accessLevelColors[document.accessLevel]}>
                        {accessLevelNames[document.accessLevel]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {document.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>版本:</span>
                    <span>{document.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>更新时间:</span>
                    <span>{document.lastUpdated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>文件大小:</span>
                    <span>{document.fileSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>下载次数:</span>
                    <span>{document.downloadCount}</span>
                  </div>
                </div>
                
                {document.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePreview(document)}
                  className="flex-1"
                >
                  预览
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleDownload(document)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '下载中...' : '下载'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}