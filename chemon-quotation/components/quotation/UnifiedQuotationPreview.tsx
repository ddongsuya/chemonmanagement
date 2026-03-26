'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, User, FileText } from 'lucide-react';

/**
 * UnifiedQuotationPreview Component
 * 
 * A unified quotation preview layout that can be used across all test types
 * (TOXICITY, EFFICACY, CLINICAL). Displays quotation number, company info,
 * customer info, items, amounts, and footer in a consistent format.
 * 
 * Requirements: 2.1, 2.2, 2.3
 * - 2.1: Preview page SHALL display quotation number in header area
 * - 2.2: Preview page SHALL load and display company name, address, contact, logo from CompanyInfo
 * - 2.3: Preview page SHALL use same layout structure as toxicity quotation
 */

// Type definitions based on design.md
export interface CompanyInfo {
  name: string;
  nameEn?: string;
  address: string;
  addressEn?: string;
  tel: string;
  fax?: string;
  email?: string;
  logo?: string;
  businessNumber?: string;
  ceoName?: string;
}

export interface CustomerInfo {
  id?: string;
  name: string;
  projectName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface QuotationItem {
  id: string;
  name: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  multiplier?: number;
  amount: number;
  isOption?: boolean;
  isDefault?: boolean;
  glpStatus?: string;
  parentItemId?: string | null;
}

export interface QuotationAmounts {
  subtotal: number;
  subtotalByCategory?: Record<string, number>;
  discountRate?: number;
  discountAmount?: number;
  vat?: number;
  total: number;
}

export interface UnifiedQuotationPreviewProps {
  quotationType: 'TOXICITY' | 'EFFICACY' | 'CLINICAL';
  quotationNumber: string;
  companyInfo: CompanyInfo;
  customerInfo: CustomerInfo;
  items: QuotationItem[];
  amounts: QuotationAmounts;
  notes?: string;
  validUntil?: Date;
  quotationDate?: Date;
  validDays?: number;
  /** Additional content to render after items (e.g., study design diagram) */
  additionalContent?: React.ReactNode;
  /** Content to render before items section (e.g., model info for efficacy) */
  preItemsContent?: React.ReactNode;
  /** Custom title for the quotation (defaults to type-based title) */
  title?: string;
  /** Whether to show VAT in the amounts section */
  showVat?: boolean;
  /** Whether to group items by category */
  groupByCategory?: boolean;
  /** Category display order for grouped items */
  categoryOrder?: string[];
}

// Format number with Korean won
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// Format date
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Get quotation type title in Korean
function getQuotationTypeTitle(type: 'TOXICITY' | 'EFFICACY' | 'CLINICAL'): string {
  switch (type) {
    case 'TOXICITY':
      return '독성시험 견적서';
    case 'EFFICACY':
      return '효력시험 견적서';
    case 'CLINICAL':
      return '임상병리시험 견적서';
    default:
      return '견적서';
  }
}

// Default category order
const DEFAULT_CATEGORY_ORDER = [
  '동물비',
  '사육비',
  '측정',
  '조직병리',
  '분석',
  '기타',
];

export default function UnifiedQuotationPreview({
  quotationType,
  quotationNumber,
  companyInfo,
  customerInfo,
  items,
  amounts,
  notes,
  validUntil,
  quotationDate = new Date(),
  validDays = 30,
  additionalContent,
  preItemsContent,
  title,
  showVat = false,
  groupByCategory = false,
  categoryOrder = DEFAULT_CATEGORY_ORDER,
}: UnifiedQuotationPreviewProps) {
  // Calculate valid until date if not provided
  const calculatedValidUntil = useMemo(() => {
    if (validUntil) return validUntil;
    const date = new Date(quotationDate);
    date.setDate(date.getDate() + validDays);
    return date;
  }, [validUntil, quotationDate, validDays]);

  // Group items by category if enabled
  const itemsByCategory = useMemo(() => {
    if (!groupByCategory) return null;

    const grouped: Record<string, QuotationItem[]> = {};
    
    items.forEach((item) => {
      const category = item.category || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return { grouped, sortedCategories };
  }, [items, groupByCategory, categoryOrder]);

  // Get main items (non-option items) for numbering
  const mainItems = useMemo(() => items.filter((item) => !item.isOption), [items]);

  // Display title
  const displayTitle = title || getQuotationTypeTitle(quotationType);

  return (
    <div
      id="unified-quotation-preview"
      className="bg-white dark:bg-slate-900 p-4 sm:p-8 shadow-ambient rounded-xl max-w-4xl mx-auto print:shadow-none print:p-0"
    >
      {/* Header - Requirement 2.1: Display quotation number in header area */}
      <div className="text-center mb-6 sm:mb-8">
        {/* Company Logo */}
        {companyInfo.logo ? (
          <img
            src={companyInfo.logo}
            alt={companyInfo.name}
            className="h-10 sm:h-12 mx-auto mb-2 print:h-10"
          />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            {companyInfo.nameEn || 'CHEMON'}
          </h1>
        )}
        <h2 className="text-xl sm:text-2xl font-semibold">{displayTitle}</h2>
      </div>

      {/* Quotation Info - Requirement 2.1: Display quotation number */}
      <div className="flex justify-between mb-4 sm:mb-6 text-sm">
        <div className="space-y-1">
          <p>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">견적번호:</span>{' '}
            <strong>{quotationNumber}</strong>
          </p>
          <p>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">견적일자:</span>{' '}
            {formatDate(quotationDate)}
          </p>
          <p>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">유효기간:</span>{' '}
            {formatDate(calculatedValidUntil)}까지
          </p>
        </div>
      </div>

      {/* Recipient / Sender - Requirement 2.2: Display company info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Recipient (Customer Info) */}
        <div className="bg-[#FAF2E9] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-slate-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              수신
            </h3>
          </div>
          <p className="font-medium text-lg">{customerInfo.name || '-'}</p>
          {customerInfo.projectName && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              프로젝트: {customerInfo.projectName}
            </p>
          )}
          {customerInfo.contactPerson && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              담당자: {customerInfo.contactPerson}
            </p>
          )}
        </div>

        {/* Sender (Company Info) - Requirement 2.2 */}
        <div className="bg-[#FAF2E9] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              발신
            </h3>
          </div>
          <p className="font-medium">{companyInfo.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {companyInfo.address}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tel: {companyInfo.tel}
          </p>
          {companyInfo.fax && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Fax: {companyInfo.fax}
            </p>
          )}
          {companyInfo.email && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Email: {companyInfo.email}
            </p>
          )}
        </div>
      </div>

      {/* Pre-Items Content (e.g., Model Info for Efficacy) */}
      {preItemsContent && (
        <div className="mb-6">
          {preItemsContent}
        </div>
      )}

      {/* Items Section - Requirement 2.3: Same layout structure */}
      <div className="mb-4 sm:mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          견적 항목
        </h3>

        {groupByCategory && itemsByCategory ? (
          /* Grouped by Category View */
          <ScrollArea className="max-h-[500px] print:max-h-none">
            {itemsByCategory.sortedCategories.map((category) => (
              <div key={category} className="mb-4 last:mb-0">
                {/* Category Header */}
                <div className="flex items-center justify-between bg-[#FAF2E9] dark:bg-slate-800 px-3 py-2 rounded-t-xl">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{category}</span>
                  <span className="font-semibold text-sm">
                    {formatKRW(amounts.subtotalByCategory?.[category] || 0)}
                  </span>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[400px]">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <th className="text-left py-2 px-2 sm:px-3 w-[40%]">항목명</th>
                        <th className="text-right py-2 px-2 sm:px-3 w-[15%]">단가</th>
                        <th className="text-center py-2 px-1.5 sm:px-3 w-[10%]">수량</th>
                        <th className="text-center py-2 px-1.5 sm:px-3 w-[10%]">횟수</th>
                        <th className="text-right py-2 px-2 sm:px-3 w-[25%]">금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemsByCategory.grouped[category].map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#FFF8F1] transition-colors"
                        >
                          <td className="py-2 px-2 sm:px-3">
                            <span className="text-xs sm:text-sm">{item.name}</span>
                            {item.isDefault && (
                              <Badge
                                variant="outline"
                                className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 print:bg-transparent rounded-full"
                              >
                                기본
                              </Badge>
                            )}
                          </td>
                          <td className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm">
                            {formatKRW(item.unitPrice).replace('원', '')}
                          </td>
                          <td className="text-center py-2 px-1.5 sm:px-3 text-xs sm:text-sm">
                            {item.quantity}
                          </td>
                          <td className="text-center py-2 px-1.5 sm:px-3 text-xs sm:text-sm">
                            {item.multiplier || 1}
                          </td>
                          <td className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium">
                            {formatKRW(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </ScrollArea>
        ) : (
          /* Standard Table View */
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-[#FAF2E9] dark:bg-slate-800">
                  <th className="p-1.5 sm:p-2 text-left w-10 sm:w-12 text-[11px] font-bold uppercase tracking-widest text-slate-400">No</th>
                  <th className="p-1.5 sm:p-2 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">시험항목</th>
                  <th className="p-1.5 sm:p-2 text-center w-16 sm:w-20 text-[11px] font-bold uppercase tracking-widest text-slate-400">규격</th>
                  <th className="p-1.5 sm:p-2 text-right w-24 sm:w-32 text-[11px] font-bold uppercase tracking-widest text-slate-400">금액(원)</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFF8F1] transition-colors">
                  <td className="p-1.5 sm:p-2 text-xs sm:text-sm">
                    {item.isOption
                      ? ''
                      : mainItems.findIndex((m) => m.id === item.id) + 1}
                  </td>
                  <td className="p-1.5 sm:p-2 text-xs sm:text-sm">
                    {item.isOption && (
                      <span className="text-slate-400 mr-1">└</span>
                    )}
                    {item.name}
                  </td>
                  <td className="p-1.5 sm:p-2 text-center text-xs sm:text-sm">
                    {item.glpStatus || '-'}
                  </td>
                  <td className="p-1.5 sm:p-2 text-right text-xs sm:text-sm">
                    {formatKRW(item.amount).replace('원', '')}
                  </td>
                </tr>
              ))}

              {/* Subtotal */}
              <tr className="bg-[#FAF2E9] dark:bg-slate-800 font-semibold">
                <td colSpan={3} className="p-1.5 sm:p-2 text-right text-xs sm:text-sm">
                  소계
                </td>
                <td className="p-1.5 sm:p-2 text-right text-xs sm:text-sm">
                  {formatKRW(amounts.subtotal).replace('원', '')}
                </td>
              </tr>

              {/* Discount */}
              {amounts.discountRate && amounts.discountRate > 0 && (
                <tr className="text-red-600">
                  <td colSpan={3} className="p-1.5 sm:p-2 text-right text-xs sm:text-sm">
                    할인 ({amounts.discountRate}%)
                  </td>
                  <td className="p-1.5 sm:p-2 text-right text-xs sm:text-sm">
                    -{formatKRW(amounts.discountAmount || 0).replace('원', '')}
                  </td>
                </tr>
              )}

              {/* VAT */}
              {showVat && amounts.vat !== undefined && (
                <tr className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <td colSpan={3} className="p-1.5 sm:p-2 text-right">
                    부가가치세 (10%)
                  </td>
                  <td className="p-1.5 sm:p-2 text-right">
                    {formatKRW(amounts.vat).replace('원', '')}
                  </td>
                </tr>
              )}

              {/* Total */}
              <tr className="bg-primary/10 font-bold">
                <td colSpan={3} className="p-1.5 sm:p-2 text-right text-xs sm:text-sm">
                  합계
                </td>
                <td className="p-1.5 sm:p-2 text-right text-primary text-xs sm:text-sm">
                  {formatKRW(amounts.total).replace('원', '')}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Amounts Summary for Grouped View */}
      {groupByCategory && (
        <>
          <Separator className="my-6" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>소계 {showVat ? '(VAT 별도)' : ''}</span>
              <span className="font-medium">{formatKRW(amounts.subtotal)}</span>
            </div>
            {amounts.discountRate && amounts.discountRate > 0 && (
              <div className="flex justify-between text-red-600">
                <span>할인 ({amounts.discountRate}%)</span>
                <span>-{formatKRW(amounts.discountAmount || 0)}</span>
              </div>
            )}
            {showVat && amounts.vat !== undefined && (
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>부가가치세 (10%)</span>
                <span>{formatKRW(amounts.vat)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>총 견적금액</span>
              <span className="text-primary">{formatKRW(amounts.total)}</span>
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {notes && (
        <div className="mt-6 p-4 bg-[#FAF2E9] dark:bg-slate-800 rounded-xl">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">비고</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {notes}
          </p>
        </div>
      )}

      {/* Footer Notes */}
      <div className="mt-6 text-sm text-slate-500 space-y-1">
        <p>※ {showVat ? '상기 금액에는 부가가치세가 포함되어 있습니다.' : '부가가치세 별도'}</p>
        <p>※ 상기 금액은 견적 유효기간 내 계약 체결 시 적용됩니다.</p>
        <p>※ 시험 일정은 계약 체결 후 협의하여 확정합니다.</p>
      </div>

      {/* Company Footer - Requirement 2.2 */}
      <div className="mt-8 pt-4 text-sm text-slate-500">
        <p>
          {companyInfo.name} | {companyInfo.tel}
          {companyInfo.email && ` | ${companyInfo.email}`}
        </p>
        {companyInfo.businessNumber && (
          <p>사업자등록번호: {companyInfo.businessNumber}</p>
        )}
      </div>

      {/* Additional Content (e.g., Study Design Diagram) */}
      {additionalContent && (
        <div className="mt-8 pt-8 print:break-before-page">
          {additionalContent}
        </div>
      )}
    </div>
  );
}
