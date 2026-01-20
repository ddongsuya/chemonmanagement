'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, FlaskConical, Building2, Calendar, FileText } from 'lucide-react';
import { getStudies, Study } from '@/lib/contract-api';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  REGISTERED: '접수',
  PREPARING: '준비중',
  IN_PROGRESS: '진행중',
  ANALYSIS: '분석중',
  REPORT_DRAFT: '보고서 작성중',
  REPORT_REVIEW: '보고서 검토중',
  COMPLETED: '완료',
  SUSPENDED: '중단',
};

const statusColors: Record<string, string> = {
  REGISTERED: 'bg-gray-100 text-gray-800',
  PREPARING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  ANALYSIS: 'bg-purple-100 text-purple-800',
  REPORT_DRAFT: 'bg-orange-100 text-orange-800',
  REPORT_REVIEW: 'bg-pink-100 text-pink-800',
  COMPLETED: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

export default function StudiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getStudies({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setStudies(res.data.studies);
    } catch (error) {
      toast({ title: '오류', description: '데이터를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  // 진행률 계산
  const getProgress = (study: Study) => {
    const statusOrder = ['REGISTERED', 'PREPARING', 'IN_PROGRESS', 'ANALYSIS', 'REPORT_DRAFT', 'REPORT_REVIEW', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(study.status);
    if (currentIndex === -1) return 0;
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">시험 관리</h1>
          <p className="text-muted-foreground">진행 중인 시험 현황</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 시험</p>
                <p className="text-2xl font-bold">{studies.length}</p>
              </div>
              <FlaskConical className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">진행중</p>
                <p className="text-2xl font-bold text-blue-600">
                  {studies.filter(s => s.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">보고서 작성중</p>
                <p className="text-2xl font-bold text-orange-600">
                  {studies.filter(s => ['REPORT_DRAFT', 'REPORT_REVIEW'].includes(s.status)).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {studies.filter(s => s.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="시험번호, 시험명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </CardContent>
      </Card>

      {/* 시험 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>시험 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : studies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 시험이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시험번호</TableHead>
                  <TableHead>시험명</TableHead>
                  <TableHead>고객사</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>진행률</TableHead>
                  <TableHead>시작일</TableHead>
                  <TableHead>예상종료일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studies.map((study) => (
                  <TableRow
                    key={study.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/contracts/${study.contractId}`)}
                  >
                    <TableCell className="font-medium">{study.studyNumber}</TableCell>
                    <TableCell>{study.testName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {study.contract?.customer?.company || study.contract?.customer?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {study.studyType === 'TOXICITY' ? '독성' : '효력'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[study.status]}>
                        {statusLabels[study.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${getProgress(study)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{getProgress(study)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(study.startDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(study.expectedEndDate)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
