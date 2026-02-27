'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Edit, Building2, User, Phone, Mail } from 'lucide-react';

interface CustomerSummaryHeaderProps {
  customer: {
    id: string;
    company?: string | null;
    name: string;
    phone?: string | null;
    email?: string | null;
    grade?: string;
  };
  onGradeChange: (grade: string) => void;
  gradeUpdating: boolean;
  onEdit: () => void;
  onBack: () => void;
}

const GRADE_OPTIONS = [
  { value: 'LEAD', label: '리드' },
  { value: 'PROSPECT', label: '잠재고객' },
  { value: 'CUSTOMER', label: '고객' },
  { value: 'VIP', label: 'VIP' },
  { value: 'INACTIVE', label: '비활성' },
] as const;

export default function CustomerSummaryHeader({
  customer,
  onGradeChange,
  gradeUpdating,
  onEdit,
  onBack,
}: CustomerSummaryHeaderProps) {
  return (
    <div className="bg-card border rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
              <h1 className="text-xl font-bold truncate">
                {customer.company || customer.name}
              </h1>
              <Select
                value={customer.grade || 'LEAD'}
                onValueChange={onGradeChange}
                disabled={gradeUpdating}
              >
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {customer.name}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {customer.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="shrink-0">
          <Edit className="w-4 h-4 mr-1" />
          수정
        </Button>
      </div>
    </div>
  );
}
