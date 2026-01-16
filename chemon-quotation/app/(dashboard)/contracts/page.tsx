'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  FileSignature,
  Download,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAllContracts, deleteContract, SavedContract } from '@/lib/contract-storage';
import { useToast } from '@/hooks/use-toast';

export default function ContractsPage() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    contract: SavedContract | null;
  }>({ open: false, contract: null });

  // 계약서 데이터 로드
  useEffect(() => {
    const loadContracts = () => {
      const savedContracts = getAllContracts();
      setContracts(savedContracts);
    };
    loadContracts();
  }, []);

  // 필터링
  const filteredContracts = contracts.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.quotation_number.toLowerCase().includes(query) ||
      c.customer_name.toLowerCase().includes(query) ||
      c.project_name.toLowerCase().includes(query)
    );
  });

  // 삭제 처리
  const handleDelete = (contract: SavedContract) => {
    setDeleteDialog({ open: true, contract });
  };

  const confirmDelete = () => {
    if (deleteDialog.contract) {
      const success = deleteContract(deleteDialog.contract.id);
      if (success) {
        setContracts(prev => prev.filter(c => c.id !== deleteDialog.contract?.id));
        toast({
          title: '삭제 완료',
          description: '계약서가 삭제되었습니다.',
        });
      }
    }
    setDeleteDialog({ open: false, contract: null });
  };

  // 통계
  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.is_draft).length,
    final: contracts.filter(c => !c.is_draft).length,
    totalAmount: contracts.reduce((sum, c) => sum + c.subtotal, 0),
  };

  return (
    <div>
      <PageHeader
        title="계약서 관리"
        description="생성된 위탁연구계약서를 관리합니다"
        actions={
          <Button asChild>
            <Link href="/contract/new">
              <FileSignature className="w-4 h-4 mr-2" />
              새 계약서 생성
            </Link>
          </Button>
        }
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">총 계약서</p>
            <p className="text-2xl font-bold">{stats.total}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">계약서(안)</p>
            <p className="text-2xl font-bold text-amber-600">{stats.draft}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">확정 계약서</p>
            <p className="text-2xl font-bold text-green-600">{stats.final}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">총 계약금액</p>
            <p className="text-xl font-bold text-primary">
              {(stats.totalAmount / 100000000).toFixed(1)}억
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 검색 */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="견적번호, 고객사, 프로젝트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>견적번호</TableHead>
                  <TableHead>고객사</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>연구기간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">계약금액</TableHead>
                  <TableHead>계약일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {contracts.length === 0 
                        ? '생성된 계약서가 없습니다.'
                        : '검색 결과가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono text-sm">
                        {contract.quotation_number}
                      </TableCell>
                      <TableCell>{contract.customer_name}</TableCell>
                      <TableCell>{contract.project_name}</TableCell>
                      <TableCell className="text-sm">
                        {contract.start_date} ~ {contract.end_date}
                        <br />
                        <span className="text-gray-500">({contract.total_weeks}주)</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contract.is_draft ? 'outline' : 'default'}>
                          {contract.is_draft ? '계약서(안)' : '확정'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contract.subtotal)}
                      </TableCell>
                      <TableCell>{contract.contract_date}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${contract.quotation_id}`}>
                                <Eye className="w-4 h-4 mr-2" /> 견적서 보기
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" /> 다시 다운로드
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(contract)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              총 {filteredContracts.length}개의 계약서
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계약서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteDialog.contract?.customer_name}</strong>의 계약서를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
