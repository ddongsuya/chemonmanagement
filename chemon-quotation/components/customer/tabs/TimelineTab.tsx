'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  MessageSquare,
  FlaskConical,
  Receipt,
  FileText,
  Phone,
  Mail,
  Users,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MeetingRecord, TestReception, InvoiceSchedule } from '@/types/customer';
import { meetingRecordApi, testReceptionApi, invoiceScheduleApi } from '@/lib/customer-data-api';
import { getQuotations, Quotation } from '@/lib/data-api';
import { formatDate, formatCurrency } from '@/lib/utils';

/**
 * TimelineTab - 모든 활동 통합 타임라인
 * Requirements: 7.4 - 최근 활동이 발생하면 활동 타임라인에 시간순으로 기록하고 표시
 */

interface TimelineTabProps {
  customerId: string;
}

type ActivityType = 'meeting' | 'call' | 'email' | 'visit' | 'test_reception' | 'invoice' | 'quotation';

interface TimelineItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, any>;
}

interface LocalQuotation {
  id: string;
  quotation_number: string;
  project_name: string;
  status: string;
  total_amount: number;
  modality: string;
  created_at: string;
}

type FilterType = 'all' | 'meetings' | 'tests' | 'invoices' | 'quotations';

const typeIcons: Record<ActivityType, React.ReactNode> = {
  meeting: <Users className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  visit: <Calendar className="w-4 h-4" />,
  test_reception: <FlaskConical className="w-4 h-4" />,
  invoice: <Receipt className="w-4 h-4" />,
  quotation: <FileText className="w-4 h-4" />,
};

const typeColors: Record<ActivityType, string> = {
  meeting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  call: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  visit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  test_reception: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  invoice: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  quotation: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const typeLabels: Record<ActivityType, string> = {
  meeting: '미팅',
  call: '전화',
  email: '이메일',
  visit: '방문',
  test_reception: '시험접수',
  invoice: '세금계산서',
  quotation: '견적서',
};

export default function TimelineTab({ customerId }: TimelineTabProps) {
  const [meetingRecords, setMeetingRecords] = useState<MeetingRecord[]>([]);
  const [testReceptions, setTestReceptions] = useState<TestReception[]>([]);
  const [invoiceSchedules, setInvoiceSchedules] = useState<InvoiceSchedule[]>([]);
  const [quotations, setQuotations] = useState<LocalQuotation[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAll, setShowAll] = useState(false);

  const INITIAL_DISPLAY_COUNT = 20;

  useEffect(() => {
    const loadData = async () => {
      try {
        // API에서 데이터 로드
        const [meetings, tests, invoices] = await Promise.all([
          meetingRecordApi.getByCustomerId(customerId),
          testReceptionApi.getByCustomerId(customerId),
          invoiceScheduleApi.getByCustomerId(customerId),
        ]);
        
        setMeetingRecords(meetings);
        setTestReceptions(tests);
        setInvoiceSchedules(invoices);
        
        // API에서 견적서 로드
        const response = await getQuotations({ customerId, limit: 100 });
        if (response.success && response.data) {
          const mappedQuotations: LocalQuotation[] = response.data.data.map((q: Quotation) => ({
            id: q.id,
            quotation_number: q.quotationNumber,
            project_name: q.projectName,
            status: q.status.toLowerCase(),
            total_amount: q.totalAmount,
            modality: q.modality || '',
            created_at: q.createdAt,
          }));
          setQuotations(mappedQuotations);
        }
      } catch (error) {
        console.error('Failed to load timeline data:', error);
      }
    };

    loadData();
  }, [customerId]);

  // 모든 활동을 타임라인 아이템으로 변환하고 시간순 정렬
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // 미팅 기록 변환
    meetingRecords.forEach((record) => {
      items.push({
        id: `meeting-${record.id}`,
        type: record.type as ActivityType,
        title: record.title,
        description: record.content.substring(0, 100) + (record.content.length > 100 ? '...' : ''),
        date: record.date,
        metadata: {
          attendees: record.attendees,
          is_request: record.is_request,
          request_status: record.request_status,
        },
      });
    });

    // 시험 접수 변환
    testReceptions.forEach((reception) => {
      items.push({
        id: `test-${reception.id}`,
        type: 'test_reception',
        title: `시험 접수: ${reception.test_number}`,
        description: reception.test_title,
        date: reception.reception_date,
        metadata: {
          status: reception.status,
          amount: reception.total_amount,
          test_director: reception.test_director,
        },
      });
    });

    // 세금계산서 일정 변환
    invoiceSchedules.forEach((schedule) => {
      const statusLabel = schedule.status === 'issued' ? '발행완료' : 
                         schedule.status === 'paid' ? '입금완료' : 
                         schedule.status === 'overdue' ? '연체' : '예정';
      items.push({
        id: `invoice-${schedule.id}`,
        type: 'invoice',
        title: `세금계산서 ${statusLabel}`,
        description: `금액: ${formatCurrency(schedule.amount)}`,
        date: schedule.issued_date || schedule.scheduled_date,
        metadata: {
          status: schedule.status,
          amount: schedule.amount,
          invoice_number: schedule.invoice_number,
        },
      });
    });

    // 견적서 변환
    quotations.forEach((quotation) => {
      items.push({
        id: `quotation-${quotation.id}`,
        type: 'quotation',
        title: `견적서: ${quotation.quotation_number}`,
        description: quotation.project_name,
        date: quotation.created_at,
        metadata: {
          status: quotation.status,
          amount: quotation.total_amount,
          modality: quotation.modality,
        },
      });
    });

    // 시간순 내림차순 정렬 (최신순)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetingRecords, testReceptions, invoiceSchedules, quotations]);

  // 필터링된 타임라인 아이템
  const filteredItems = useMemo(() => {
    if (filter === 'all') return timelineItems;

    return timelineItems.filter((item) => {
      switch (filter) {
        case 'meetings':
          return ['meeting', 'call', 'email', 'visit'].includes(item.type);
        case 'tests':
          return item.type === 'test_reception';
        case 'invoices':
          return item.type === 'invoice';
        case 'quotations':
          return item.type === 'quotation';
        default:
          return true;
      }
    });
  }, [timelineItems, filter]);

  // 표시할 아이템 (더보기 기능)
  const displayedItems = showAll 
    ? filteredItems 
    : filteredItems.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = filteredItems.length > INITIAL_DISPLAY_COUNT;

  // 날짜별 그룹화
  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    
    displayedItems.forEach((item) => {
      const dateKey = item.date.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  }, [displayedItems]);

  const sortedDates = Object.keys(groupedItems).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-4">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">활동 타임라인</h2>
          <span className="text-sm text-gray-500">
            ({filteredItems.length}건)
          </span>
        </div>

        <Select
          value={filter}
          onValueChange={(value: FilterType) => setFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 활동</SelectItem>
            <SelectItem value="meetings">미팅/연락</SelectItem>
            <SelectItem value="tests">시험 접수</SelectItem>
            <SelectItem value="invoices">세금계산서</SelectItem>
            <SelectItem value="quotations">견적서</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 타임라인 */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>활동 기록이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* 날짜 헤더 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm font-medium text-gray-500 px-2">
                  {formatDate(dateKey)}
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* 해당 날짜의 아이템들 */}
              <div className="space-y-3 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                {groupedItems[dateKey].map((item) => (
                  <div
                    key={item.id}
                    className="relative flex gap-3 pb-3"
                  >
                    {/* 타임라인 점 */}
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600" />

                    {/* 아이콘 */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeColors[item.type]}`}>
                      {typeIcons[item.type]}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {typeLabels[item.type]}
                            </Badge>
                            {item.metadata?.is_request && (
                              <Badge 
                                variant={item.metadata.request_status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {item.metadata.request_status === 'completed' ? '처리완료' : '요청사항'}
                              </Badge>
                            )}
                            {item.metadata?.status && item.type !== 'invoice' && (
                              <Badge variant="outline" className="text-xs">
                                {item.metadata.status}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium mt-1 truncate">{item.title}</h4>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                          {item.metadata?.amount && (
                            <p className="text-sm font-medium text-primary mt-1">
                              {formatCurrency(item.metadata.amount)}
                            </p>
                          )}
                          {item.metadata?.attendees && item.metadata.attendees.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              참석자: {item.metadata.attendees.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 더보기 버튼 */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="gap-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    더보기 ({filteredItems.length - INITIAL_DISPLAY_COUNT}건)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
