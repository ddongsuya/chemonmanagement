'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Eye, Trash2, FileText } from 'lucide-react';
import { TestReception } from '@/types/customer';

interface TestReceptionTableProps {
  testReceptions: TestReception[];
  onEdit?: (testReception: TestReception) => void;
  onView?: (testReception: TestReception) => void;
  onDelete?: (testReception: TestReception) => void;
}

// 상태별 배지 스타일 - Requirements 2.4
const statusConfig: Record<TestReception['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  received: { label: '접수완료', variant: 'secondary' },
  in_progress: { label: '진행중', variant: 'default' },
  completed: { label: '완료', variant: 'outline' },
  cancelled: { label: '취소', variant: 'destructive' },
};

// 금액 포맷팅
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// 날짜 포맷팅
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function TestReceptionTable({
  testReceptions,
  onEdit,
  onView,
  onDelete,
}: TestReceptionTableProps) {
  if (testReceptions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>등록된 시험 접수가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">시험번호</TableHead>
            <TableHead>시험제목</TableHead>
            <TableHead className="w-[100px]">시험책임자</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="w-[120px] text-right">총 금액</TableHead>
            <TableHead className="w-[100px]">접수일</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testReceptions.map((reception) => {
            const status = statusConfig[reception.status];
            return (
              <TableRow key={reception.id}>
                <TableCell className="font-medium">
                  {reception.test_number}
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] truncate" title={reception.test_title}>
                    {reception.test_title}
                  </div>
                  <div className="text-xs text-gray-500 truncate" title={reception.substance_name}>
                    {reception.substance_name}
                  </div>
                </TableCell>
                <TableCell>{reception.test_director}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(reception.total_amount)}
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatDate(reception.reception_date)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">메뉴 열기</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(reception)}>
                          <Eye className="mr-2 h-4 w-4" />
                          상세보기
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(reception)}>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(reception)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
