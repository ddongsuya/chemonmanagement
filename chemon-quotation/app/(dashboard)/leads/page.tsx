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
import { Plus, Search, Building2, User, Phone, Mail, Calendar, Loader2, Kanban } from 'lucide-react';
import { getLeads, Lead, getPipelineStages, PipelineStage } from '@/lib/lead-api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import ExcelImportExport from '@/components/excel/ExcelImportExport';

const statusLabels: Record<string, string> = {
  NEW: '신규',
  CONTACTED: '연락완료',
  QUALIFIED: '검토완료',
  PROPOSAL: '견적발송',
  NEGOTIATION: '협상중',
  CONVERTED: '계약전환',
  LOST: '실패',
  DORMANT: '휴면',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  PROPOSAL: 'bg-purple-100 text-purple-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-red-100 text-red-800',
  DORMANT: 'bg-gray-100 text-gray-800',
};

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter, stageFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, stagesRes] = await Promise.all([
        getLeads({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          stageId: stageFilter !== 'all' ? stageFilter : undefined,
          search: search || undefined,
        }),
        getPipelineStages(),
      ]);
      if (leadsRes.success && leadsRes.data?.leads) {
        setLeads(leadsRes.data.leads);
      }
      if (stagesRes.success && stagesRes.data?.stages) {
        setStages(stagesRes.data.stages);
      }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">리드 관리</h1>
          <p className="text-sm text-muted-foreground">잠재 고객 및 문의 관리</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="hidden sm:block">
            <ExcelImportExport defaultType="leads" onImportSuccess={loadData} />
          </div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => router.push('/pipeline')}>
            <Kanban className="w-4 h-4 mr-1" />
            파이프라인
          </Button>
          <Button size="sm" onClick={() => router.push('/leads/new')}>
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">새 리드</span>
            <span className="sm:hidden">추가</span>
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="회사명, 담당자명, 리드번호 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="단계" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 단계</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="flex-shrink-0">검색</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리드 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">리드 목록 ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              등록된 리드가 없습니다.
            </div>
          ) : (
            <>
              {/* 모바일: 카드 리스트 */}
              <div className="md:hidden space-y-3">
                {leads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="touch-manipulation active:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{lead.leadNumber}</span>
                        <Badge className={statusColors[lead.status]}>
                          {statusLabels[lead.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 font-medium text-sm mb-1">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{lead.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span>{lead.contactName}</span>
                        {lead.contactPhone && (
                          <>
                            <span className="text-border">·</span>
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span>{lead.contactPhone}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {lead.stage && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                              style={{ borderColor: lead.stage.color, color: lead.stage.color }}
                            >
                              {lead.stage.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {lead.expectedAmount && (
                            <span className="font-semibold text-foreground">{formatCurrency(lead.expectedAmount)}</span>
                          )}
                          <span>{formatDate(lead.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 데스크톱: 테이블 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>리드번호</TableHead>
                      <TableHead>회사명</TableHead>
                      <TableHead>담당자</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>단계</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>예상금액</TableHead>
                      <TableHead>등록일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <TableCell className="font-medium">{lead.leadNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {lead.companyName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {lead.contactName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {lead.contactPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.contactPhone}
                              </div>
                            )}
                            {lead.contactEmail && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.contactEmail}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.stage && (
                            <Badge
                              variant="outline"
                              style={{ borderColor: lead.stage.color, color: lead.stage.color }}
                            >
                              {lead.stage.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[lead.status]}>
                            {statusLabels[lead.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.expectedAmount ? formatCurrency(lead.expectedAmount) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.createdAt)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
