'use client';

import Link from 'next/link';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { Button } from '@/components/ui/button';
import { Building2, User, Phone, Mail, FileText, ArrowRight, Globe } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types';
import CustomerGradeBadge from './CustomerGradeBadge';

// 리드 유입경로 라벨 매핑
const sourceLabels: Record<string, string> = {
  WEBSITE: '웹사이트',
  REFERRAL: '소개',
  COLD_CALL: '콜드콜',
  EXHIBITION: '전시회',
  ADVERTISEMENT: '광고',
  OTHER: '기타',
};

interface CustomerCardProps {
  customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <StitchCard variant="elevated" hover>
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {customer.company_name}
              </h3>
              {customer.business_number && (
                <p className="text-sm text-slate-500">
                  {customer.business_number}
                </p>
              )}
            </div>
          </div>
          {/* 고객 등급 배지 표시 (Requirements 4.1) */}
          {customer.grade && (
            <CustomerGradeBadge grade={customer.grade} size="sm" />
          )}
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4" />
            <span>{customer.contact_person}</span>
          </div>
          {customer.contact_phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4" />
              <span>{customer.contact_phone}</span>
            </div>
          )}
          {customer.contact_email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4" />
              <span>{customer.contact_email}</span>
            </div>
          )}
          {/* 연결된 리드의 유입경로 표시 (Requirements 4.4) */}
          {customer.linked_lead && (
            <div className="flex items-center gap-2 text-slate-600">
              <Globe className="w-4 h-4" />
              <span>유입경로: {sourceLabels[customer.linked_lead.source] || customer.linked_lead.source}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 bg-[#FAF2E9] -mx-6 px-6 py-3 rounded-b-xl">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              견적 {customer.quotation_count}건
            </span>
          </div>
          <StitchBadge variant="primary">
            {formatCurrency(customer.total_amount)}
          </StitchBadge>
        </div>

        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
            <Link href={`/customers/${customer.id}`}>
              상세보기 <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </StitchCard>
  );
}
