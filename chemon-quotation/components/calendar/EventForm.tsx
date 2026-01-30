'use client';

import { useState, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { CalendarEvent, Customer } from '@/types/customer';
import { calendarEventApi } from '@/lib/customer-data-api';
import { getCustomers } from '@/lib/data-api';

interface EventFormProps {
  customerId?: string;
  event?: CalendarEvent;
  initialDate?: Date;
  onSuccess: () => void;
  onCancel?: () => void;
}

const EVENT_TYPES: { value: CalendarEvent['type']; label: string }[] = [
  { value: 'meeting', label: '미팅' },
  { value: 'invoice', label: '세금계산서' },
  { value: 'deadline', label: '마감' },
  { value: 'reminder', label: '알림' },
  { value: 'other', label: '기타' },
];

const COLOR_OPTIONS = [
  { value: 'default', label: '기본' },
  { value: '#3B82F6', label: '파랑' },
  { value: '#EF4444', label: '빨강' },
  { value: '#10B981', label: '초록' },
  { value: '#F59E0B', label: '노랑' },
  { value: '#8B5CF6', label: '보라' },
  { value: '#EC4899', label: '분홍' },
];

export default function EventForm({
  customerId,
  event,
  initialDate,
  onSuccess,
  onCancel,
}: EventFormProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const getInitialDate = () => {
    if (event?.start_date) {
      return event.start_date.split('T')[0];
    }
    if (initialDate) {
      return initialDate.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const getInitialTime = () => {
    if (event?.start_date && !event.all_day) {
      const date = new Date(event.start_date);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return '';
  };

  const [formData, setFormData] = useState({
    type: event?.type || ('other' as CalendarEvent['type']),
    title: event?.title || '',
    description: event?.description || '',
    start_date: getInitialDate(),
    start_time: getInitialTime(),
    end_date: event?.end_date?.split('T')[0] || '',
    all_day: event?.all_day ?? true,
    color: event?.color || 'default',
    customer_id: event?.customer_id || customerId || '',
    reminder_before: event?.reminder_before?.toString() || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!event;

  // 고객사 목록 로드 (API 사용)
  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await getCustomers({ limit: 100 });
        if (response.success && response.data) {
          // API 응답을 Customer 타입으로 변환
          const customerList: Customer[] = response.data.data.map((c) => ({
            id: c.id,
            company_name: c.company || c.name,
            business_number: null,
            address: c.address || null,
            contact_person: c.name,
            contact_email: c.email || null,
            contact_phone: c.phone || null,
            notes: c.notes || null,
            created_at: c.createdAt,
            updated_at: c.updatedAt,
            quotation_count: 0,
            total_amount: 0,
          }));
          setCustomers(customerList);
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    }
    loadCustomers();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }
    if (!formData.start_date) {
      newErrors.start_date = '시작 날짜를 선택해주세요';
    }
    if (!formData.all_day && !formData.start_time) {
      newErrors.start_time = '시작 시간을 입력해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      // 시작 날짜/시간 조합
      let startDateTime = formData.start_date;
      if (!formData.all_day && formData.start_time) {
        startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      }

      // 종료 날짜 처리
      let endDateTime: string | undefined;
      if (formData.end_date) {
        endDateTime = formData.all_day
          ? formData.end_date
          : `${formData.end_date}T23:59:59`;
      }

      // color가 'default'면 undefined로 처리
      const colorValue = formData.color && formData.color !== 'default' ? formData.color : undefined;

      if (isEditMode && event) {
        // 수정 모드 - API 사용
        await calendarEventApi.update(event.id, {
          type: formData.type,
          title: formData.title,
          description: formData.description || undefined,
          start_date: startDateTime,
          end_date: endDateTime,
          all_day: formData.all_day,
          color: colorValue,
          customer_id: formData.customer_id || undefined,
          reminder_before: formData.reminder_before
            ? parseInt(formData.reminder_before)
            : undefined,
        });
      } else {
        // 등록 모드 - API 사용
        await calendarEventApi.create({
          type: formData.type,
          title: formData.title,
          description: formData.description || undefined,
          start_date: startDateTime,
          end_date: endDateTime,
          all_day: formData.all_day,
          color: colorValue,
          customer_id: formData.customer_id || undefined,
          reminder_before: formData.reminder_before
            ? parseInt(formData.reminder_before)
            : undefined,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !confirm('이 일정을 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      await calendarEventApi.delete(event.id);
      onSuccess();
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? '일정 수정' : '일정 등록'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-5 py-4 max-h-[70vh] overflow-y-auto px-1">
        {/* 이벤트 유형 */}
        <div className="space-y-1.5">
          <Label htmlFor="type">
            유형 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value: CalendarEvent['type']) =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 제목 */}
        <div className="space-y-1.5">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="일정 제목을 입력하세요"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* 종일 체크박스 */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="all_day"
            checked={formData.all_day}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, all_day: checked === true })
            }
          />
          <Label htmlFor="all_day" className="cursor-pointer">
            종일
          </Label>
        </div>

        {/* 날짜/시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date">
              시작 날짜 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className={errors.start_date ? 'border-red-500' : ''}
            />
            {errors.start_date && (
              <p className="text-sm text-red-500">{errors.start_date}</p>
            )}
          </div>

          {!formData.all_day && (
            <div className="space-y-1.5">
              <Label htmlFor="start_time">
                시작 시간 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className={errors.start_time ? 'border-red-500' : ''}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">{errors.start_time}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="end_date">종료 날짜</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
            />
          </div>
        </div>

        {/* 설명 */}
        <div className="space-y-1.5">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="일정에 대한 설명을 입력하세요"
            rows={3}
          />
        </div>

        {/* 관련 고객사 */}
        {!customerId && customers.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="customer_id">관련 고객사</Label>
            <Select
              value={formData.customer_id || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, customer_id: value === 'none' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="고객사 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안함</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 색상 */}
        <div className="space-y-1.5">
          <Label htmlFor="color">색상</Label>
          <Select
            value={formData.color}
            onValueChange={(value) => setFormData({ ...formData, color: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="색상 선택" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    {color.value !== 'default' && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                    )}
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 알림 설정 - Requirements 6.6 */}
        <div className="space-y-1.5">
          <Label htmlFor="reminder_before">알림 (분 전)</Label>
          <Select
            value={formData.reminder_before || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, reminder_before: value === 'none' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="알림 설정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">알림 없음</SelectItem>
              <SelectItem value="10">10분 전</SelectItem>
              <SelectItem value="30">30분 전</SelectItem>
              <SelectItem value="60">1시간 전</SelectItem>
              <SelectItem value="1440">1일 전</SelectItem>
              <SelectItem value="10080">1주일 전</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="pt-6 gap-2">
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              삭제
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
