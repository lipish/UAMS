import { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'License状态 - License管理系统',
  description: '查看和管理License申请的状态',
};

const licenses = [
  {
    id: '#001',
    productName: '产品A',
    customer: '公司X',
    type: '专业版',
    applyDate: '2023-06-01',
    expiryDate: '2024-06-01',
    status: '已批准',
  },
  {
    id: '#002',
    productName: '产品B',
    customer: '公司Y',
    type: '标准版',
    applyDate: '2023-06-15',
    expiryDate: '2024-06-15',
    status: '待审核',
  },
  {
    id: '#003',
    productName: '产品C',
    customer: '公司Z',
    type: '企业版',
    applyDate: '2023-05-20',
    expiryDate: '2023-11-20',
    status: '已过期',
  },
  {
    id: '#004',
    productName: '产品D',
    customer: '公司W',
    type: '试用版',
    applyDate: '2023-07-01',
    expiryDate: '2023-07-31',
    status: '已拒绝',
  },
];

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case '已批准':
      return 'default';
    case '待审核':
      return 'secondary';
    case '已过期':
      return 'outline';
    case '已拒绝':
      return 'destructive';
    default:
      return 'default';
  }
}

export default function LicenseStatusPage() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>License状态</CardTitle>
          <CardDescription>
            查看和管理所有License申请的状态和详情。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="pending">待审核</TabsTrigger>
              <TabsTrigger value="approved">已批准</TabsTrigger>
              <TabsTrigger value="rejected">已拒绝</TabsTrigger>
              <TabsTrigger value="expired">已过期</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <LicenseTable licenses={licenses} />
            </TabsContent>
            <TabsContent value="pending">
              <LicenseTable
                licenses={licenses.filter((l) => l.status === '待审核')}
              />
            </TabsContent>
            <TabsContent value="approved">
              <LicenseTable
                licenses={licenses.filter((l) => l.status === '已批准')}
              />
            </TabsContent>
            <TabsContent value="rejected">
              <LicenseTable
                licenses={licenses.filter((l) => l.status === '已拒绝')}
              />
            </TabsContent>
            <TabsContent value="expired">
              <LicenseTable
                licenses={licenses.filter((l) => l.status === '已过期')}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LicenseTable({ licenses }: { licenses: typeof licenses }) {
  if (licenses.length === 0) {
    return <p className="text-center text-muted-foreground py-4">没有找到相关的License记录。</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>产品名称</TableHead>
          <TableHead>客户</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>申请日期</TableHead>
          <TableHead>有效期</TableHead>
          <TableHead className="text-center">状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {licenses.map((license) => (
          <TableRow key={license.id}>
            <TableCell className="font-medium">{license.id}</TableCell>
            <TableCell>{license.productName}</TableCell>
            <TableCell>{license.customer}</TableCell>
            <TableCell>{license.type}</TableCell>
            <TableCell>{license.applyDate}</TableCell>
            <TableCell>{license.expiryDate}</TableCell>
            <TableCell className="text-center">
              <Badge variant={getStatusBadgeVariant(license.status)}>
                {license.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                查看
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}