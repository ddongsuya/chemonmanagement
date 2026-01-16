'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { MeetingRecord } from '@/types/customer';

interface MeetingRecordListProps {
  records: MeetingRecord[];
  onEdit: (record: MeetingRecord) => void;
  onDelete: (record: MeetingRecord) => void;
  onStatusChange?: (record: MeetingRecord, status: 'pending' | 'in_progress' | 'completed') => void;
}

const TYPE_CONFIG = {
  meeting: { icon: Users, label: '미팅', color: 'bg-blue-100 text-blue-700' },
  call: { icon: Phone, label: '전화', color: 'bg-green-100 text-green-700' },
  email: { icon: Mail, label: '이메일', color: 'bg-purple-100 text-purple-700' },
  visit: { icon: MapPin, label: '방문', color: 'bg-orange-100 text-orange-700' },
};

const STATUS_CONFIG = {
  pending: { icon: AlertCircle, label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { icon: Loader2, label: '처리중', color: 'bg-blue-100 text-blue-700' },
  completed: { icon: CheckCircle2, label: '완료', color: 'bg-green-100 text-green-700' },
};

export default function MeetingRecordList({
  records,
  onEdit,
  onDelete,
  onStatusChange,
}: MeetingRecordListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    return timeStr;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>등록된 미팅 기록이 없습니다.</p>
        <p className="text-sm mt-1">미팅 기록 추가 버튼을 클릭하여 등록해주세요.</p>
      </div>
    );
  }

  // 날짜별로 그룹화 (타임라인 형태) - Requirements 5.2
  const groupedRecords = records.reduce((acc, record) => {
    const dateKey = record.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {} as Record<string, MeetingRecord[]>);

  const sortedDates = Object.keys(groupedRecords).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date} className="relative">
          {/* 날짜 헤더 */}
          <div className="sticky top-0 z-10 bg-white pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">{formatDate(date)}</span>
              <span className="text-sm text-gray-400">
                ({groupedRecords[date].length}건)
              </span>
            </div>
          </div>

          {/* 타임라인 */}
          <div className="ml-2 border-l-2 border-gray-200 pl-4 space-y-4">
            {groupedRecords[date].map((record) => {
              const TypeIcon = TYPE_CONFIG[record.type].icon;
              const typeConfig = TYPE_CONFIG[record.type];

              return (
                <Card key={record.id} className="relative hover:shadow-md transition-shadow">
                  {/* 타임라인 도트 */}
                  <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full bg-white border-2 border-gray-300" />

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* 헤더 */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge className={typeConfig.color}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                          {record.is_request && record.request_status && (
                            <Badge className={STATUS_CONFIG[record.request_status].color}>
                              {STATUS_CONFIG[record.request_status].label}
                            </Badge>
                          )}
                          {record.time && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(record.time)}
                            </span>
                          )}
                          {record.duration && (
                            <span className="text-sm text-gray-500">
                              ({formatDuration(record.duration)})
                            </span>
                          )}
                        </div>

                        {/* 제목 */}
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {record.title}
                        </h4>

                        {/* 참석자 */}
                        {record.attendees.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span>{record.attendees.join(', ')}</span>
                          </div>
                        )}

                        {/* 내용 */}
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                          {record.content}
                        </p>

                        {/* 후속조치 */}
                        {record.follow_up_actions && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium text-gray-700">후속조치: </span>
                            <span className="text-gray-600">{record.follow_up_actions}</span>
                          </div>
                        )}

                        {/* 요청사항 응답 */}
                        {record.is_request && record.request_response && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                            <span className="font-medium text-green-700">처리 내용: </span>
                            <span className="text-green-600">{record.request_response}</span>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(record)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(record)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 요청사항 상태 변경 버튼 */}
                    {record.is_request && record.request_status !== 'completed' && onStatusChange && (
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        {record.request_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStatusChange(record, 'in_progress')}
                          >
                            처리 시작
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onStatusChange(record, 'completed')}
                        >
                          처리 완료
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
