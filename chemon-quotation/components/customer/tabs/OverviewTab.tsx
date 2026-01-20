'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  TrendingUp,
  Calendar,
  Plus,
  FileSignature,
  MessageSquare,
} from 'lucide-react';
import { Customer, ProgressStage } from '@/types/customer';
import { progressStageApi } from '@/lib/customer-data-api';
import ProgressWorkflow, { WorkflowStage } from '../ProgressWorkflow';
import WorkflowChecklist from '../WorkflowChecklist';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OverviewTabProps {
  customer: Customer;
  quotationCount?: number;
  totalAmount?: number;
  onQuickAction?: (action: 'quotation' | 'meeting' | 'test_reception') => void;
}

export default function OverviewTab({
  customer,
  quotationCount = 0,
  totalAmount = 0,
  onQuickAction,
}: OverviewTabProps) {
  const [progressStage, setProgressStage] = useState<ProgressStage | null>(null);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | undefined>();

  // 진행 단계 로드 - API 사용
  useEffect(() => {
    const loadProgressStage = async () => {
      try {
        // API에서 진행 단계 조회 (없으면 자동 생성됨)
        const stage = await progressStageApi.getByCustomerId(customer.id);
        setProgressStage(stage);
      } catch (error) {
        console.error('Failed to load progress stage:', error);
      }
    };

    loadProgressStage();
  }, [customer.id]);

  // 단계 클릭 핸들러
  const handleStageClick = (stage: WorkflowStage) => {
    setSelectedStage(stage === selectedStage ? undefined : stage);
  };

  // 진행 단계 업데이트 핸들러
  const handleProgressUpdate = (updatedProgress: ProgressStage) => {
    setProgressStage(updatedProgress);
    // 단계가 변경되면 선택 초기화
    if (updatedProgress.current_stage !== progressStage?.current_stage) {
      setSelectedStage(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* 진행 단계 워크플로우 - Requirements 4.1 */}
      <ProgressWorkflow
        progressStage={progressStage}
        onStageClick={handleStageClick}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 기본 정보 및 통계 */}
        <div className="space-y-6">
          {/* 회사 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4" />
                회사 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">회사명</p>
                <p className="font-medium">{customer.company_name}</p>
              </div>
              {customer.business_number && (
                <div>
                  <p className="text-xs text-gray-500">사업자번호</p>
                  <p className="text-sm">{customer.business_number}</p>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{customer.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 담당자 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                담당자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{customer.contact_person}</span>
              </div>
              {customer.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{customer.contact_phone}</span>
                </div>
              )}
              {customer.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{customer.contact_email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />
                통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 견적 건수</span>
                <Badge variant="secondary">{quotationCount}건</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 견적 금액</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">등록일</span>
                <span className="text-sm">{formatDate(customer.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">최근 수정일</span>
                <span className="text-sm">{formatDate(customer.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 빠른 작업 - Requirements 7.3 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                빠른 작업
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onQuickAction?.('quotation')}
              >
                <FileText className="w-4 h-4 mr-2" />
                새 견적 작성
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onQuickAction?.('meeting')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                미팅 기록
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onQuickAction?.('test_reception')}
              >
                <FileSignature className="w-4 h-4 mr-2" />
                시험 접수
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 우측: 체크리스트 */}
        <div className="lg:col-span-2">
          {progressStage && (
            <WorkflowChecklist
              progressStage={progressStage}
              selectedStage={selectedStage}
              onUpdate={handleProgressUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
