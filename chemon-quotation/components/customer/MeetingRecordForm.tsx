'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, X, Plus } from 'lucide-react';
import { MeetingRecord } from '@/types/customer';
import { saveMeetingRecord, updateMeetingRecord } from '@/lib/meeting-record-storage';

interface MeetingRecordFormProps {
  customerId: string;
  requesterId?: string;
  meetingRecord?: MeetingRecord;
  onSuccess: () => void;
  onCancel?: () => void;
}

const MEETING_TYPES = [
  { value: 'meeting', label: '미팅' },
  { value: 'call', label: '전화' },
  { value: 'email', label: '이메일' },
  { value: 'visit', label: '방문' },
] as const;

export default function MeetingRecordForm({
  customerId,
  requesterId,
  meetingRecord,
  onSuccess,
  onCancel,
}: MeetingRecordFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: meetingRecord?.type || 'meeting' as MeetingRecord['type'],
    date: meetingRecord?.date || new Date().toISOString().split('T')[0],
    time: meetingRecord?.time || '',
    duration: meetingRecord?.duration?.toString() || '',
    title: meetingRecord?.title || '',
    attendees: meetingRecord?.attendees || [] as string[],
    content: meetingRecord?.content || '',
    follow_up_actions: meetingRecord?.follow_up_actions || '',
    is_request: meetingRecord?.is_request || false,
    request_status: meetingRecord?.request_status || 'pending' as MeetingRecord['request_status'],
  });
  const [newAttendee, setNewAttendee] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!meetingRecord;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요';
    }
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, newAttendee.trim()],
      });
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (attendee: string) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter((a) => a !== attendee),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttendee();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();

      if (isEditMode && meetingRecord) {
        // 수정 모드
        updateMeetingRecord(meetingRecord.id, {
          type: formData.type,
          date: formData.date,
          time: formData.time || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          title: formData.title,
          attendees: formData.attendees,
          content: formData.content,
          follow_up_actions: formData.follow_up_actions || undefined,
          is_request: formData.is_request,
          request_status: formData.is_request ? formData.request_status : undefined,
        });
      } else {
        // 등록 모드: Requirements 5.1, 5.4
        const newRecord: MeetingRecord = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          requester_id: requesterId,
          type: formData.type,
          date: formData.date,
          time: formData.time || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          title: formData.title,
          attendees: formData.attendees,
          content: formData.content,
          follow_up_actions: formData.follow_up_actions || undefined,
          is_request: formData.is_request,
          request_status: formData.is_request ? 'pending' : undefined,
          created_at: now,
          updated_at: now,
        };
        saveMeetingRecord(newRecord);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save meeting record:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? '미팅 기록 수정' : '미팅 기록 등록'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 유형 선택 */}
          <div className="space-y-2">
            <Label htmlFor="type">
              유형 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: MeetingRecord['type']) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="space-y-2">
            <Label htmlFor="date">
              날짜 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* 시간 */}
          <div className="space-y-2">
            <Label htmlFor="time">시간</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>

          {/* 소요시간 */}
          <div className="space-y-2">
            <Label htmlFor="duration">소요시간 (분)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              placeholder="60"
            />
          </div>
        </div>

        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="미팅 제목을 입력하세요"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* 참석자 */}
        <div className="space-y-2">
          <Label>참석자</Label>
          <div className="flex gap-2">
            <Input
              value={newAttendee}
              onChange={(e) => setNewAttendee(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="참석자 이름 입력 후 Enter"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddAttendee}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.attendees.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.attendees.map((attendee) => (
                <span
                  key={attendee}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                >
                  {attendee}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(attendee)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="space-y-2">
          <Label htmlFor="content">
            내용 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="미팅 내용을 입력하세요"
            rows={5}
            className={errors.content ? 'border-red-500' : ''}
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content}</p>
          )}
        </div>

        {/* 후속조치 */}
        <div className="space-y-2">
          <Label htmlFor="follow_up_actions">후속조치</Label>
          <Textarea
            id="follow_up_actions"
            value={formData.follow_up_actions}
            onChange={(e) =>
              setFormData({ ...formData, follow_up_actions: e.target.value })
            }
            placeholder="후속조치 사항을 입력하세요"
            rows={3}
          />
        </div>

        {/* 요청사항 체크박스 - Requirements 5.4 */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_request"
              checked={formData.is_request}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_request: checked === true })
              }
            />
            <Label htmlFor="is_request" className="cursor-pointer font-medium">
              요청사항으로 등록
            </Label>
          </div>

          {/* 요청사항 상태 관리 - Requirements 5.4, 5.5 */}
          {formData.is_request && isEditMode && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="request_status">처리 상태</Label>
              <Select
                value={formData.request_status}
                onValueChange={(value: 'pending' | 'in_progress' | 'completed') =>
                  setFormData({ ...formData, request_status: value })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="in_progress">처리중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          ) : (
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
          )}
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
