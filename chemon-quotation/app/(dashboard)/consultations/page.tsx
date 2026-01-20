'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, MessageSquare, Building2, Calendar, FileText } from 'lucide-react';
import { getConsultations, ConsultationRecord } from '@/lib/contract-api';
import { useToast } from '@/hooks/use-toast';

export default function ConsultationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getConsultations();
      setRecords(data);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">상담기록</h1>
          <p className="text-muted-foreground">고객 상담 및 미팅 기록 관리</p>
        </div>
        <Button onClick={() => router.push('/consultations/new')}>
          <Plus className="w-4 h-4 mr-2" />
          새 상담기록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 상담기록</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">이번 달</p>
                <p className="text-2xl font-bold text-blue-600">
                  {records.filter(r => {
                    const date = new Date(r.consult_date);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">계약 연결</p>
                <p className="text-2xl font-bold text-green-600">
                  {records.filter(r => (r as any).contractId || r.contract_id).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
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
                  placeholder="기록번호, 물질명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </CardContent>
      </Card>

      {/* 상담기록 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>상담기록 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 상담기록이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기록번호</TableHead>
                  <TableHead>고객사</TableHead>
                  <TableHead>물질명</TableHead>
                  <TableHead>보관상태</TableHead>
                  <TableHead>계약</TableHead>
                  <TableHead>상담일</TableHead>
                  <TableHead>요청사항</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const recordNumber = (record as any).recordNumber || record.record_number || '';
                  const substanceName = (record as any).substanceName || record.substance_name || '';
                  const storageStatus = (record as any).storageStatus || record.storage_status || '';
                  const contractId = (record as any).contractId || record.contract_id;
                  const consultDate = (record as any).consultDate || record.consult_date;
                  const clientRequests = (record as any).clientRequests || record.client_requests || '';
                  
                  return (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/consultations/${record.id}`)}
                    >
                      <TableCell className="font-medium">{recordNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {(record as any).customer?.company || (record as any).customer?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{substanceName || '-'}</TableCell>
                      <TableCell>{storageStatus || '-'}</TableCell>
                      <TableCell>
                        {contractId ? (
                          <span className="text-blue-600">{(record as any).contract?.contractNumber || '-'}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(consultDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="truncate max-w-[200px] block">
                          {clientRequests || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
