'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Skeleton from '@/components/ui/Skeleton';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Calendar,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, updateCustomer, Customer } from '@/lib/data-api';
import CustomerForm from '@/components/customer/CustomerForm';

const GRADE_OPTIONS = [
  { value: 'LEAD', label: '리드' },
  { value: 'PROSPECT', label: '잠재고객' },
  { value: 'CUSTOMER', label: '고객' },
  { value: 'VIP', label: 'VIP' },
  { value: 'INACTIVE', label: '비활성' },
] as const;

/**
 * 고객 상세 페이지
 * 
 * @requirements 8.2 - 고객 클릭 시 상세 페이지 표시
 */
export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [gradeUpdating, setGradeUpdating] = useState(false);

  const loadCustomer = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      const response = await getCustomerById(customerId);
      if (response.success && response.data) {
        setCustomer(response.data);
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '고객 정보를 불러오는데 실패했습니다',
          variant: 'destructive',
        });
        router.push('/customers');
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '서버 연결에 실패했습니다',
        variant: 'destructive',
      });
      router.push('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const handleGradeChange = async (newGrade: string) => {
    if (!customer) return;
    setGradeUpdating(true);
    try {
      const response = await updateCustomer(customer.id, { grade: newGrade as any });
      if (response.success) {
        setCustomer(prev => prev ? { ...prev, grade: newGrade as any } : null);
        toast({ title: '등급 변경 완료', description: `${getGradeLabel(newGrade)}(으)로 변경되었습니다.` });
      } else {
        toast({ title: '오류', description: response.error?.message || '등급 변경에 실패했습니다.', variant: 'destructive' });
      }
    } catch {
      toast({ title: '오류', description: '서버 연결에 실패했습니다.', variant: 'destructive' });
    } finally {
      setGradeUpdating(false);
    }
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    loadCustomer();
  };

  const handleBack = () => {
    router.back();
  };

  // 등급별 배지 색상
  const getGradeBadgeVariant = (grade: string) => {
    switch (grade) {
      case 'VIP':
        return 'default';
      case 'CUSTOMER':
        return 'secondary';
      case 'PROSPECT':
        return 'outline';
      case 'INACTIVE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'VIP':
        return 'VIP';
      case 'CUSTOMER':
        return '고객';
      case 'PROSPECT':
        return '잠재고객';
      case 'LEAD':
        return '리드';
      case 'INACTIVE':
        return '비활성';
      default:
        return grade;
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="고객 상세"
          description="고객 정보를 확인합니다"
        />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={customer.company || customer.name}
        description="고객 상세 정보"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                value={customer.grade || 'LEAD'}
                onValueChange={handleGradeChange}
                disabled={gradeUpdating}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gradeUpdating && <span className="text-xs text-muted-foreground">변경 중...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">담당자</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">이메일</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">전화번호</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">주소</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="flex items-start gap-3 pt-4 border-t">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">메모</p>
                  <p className="font-medium whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 메타 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              등록 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">등록일</p>
              <p className="font-medium">
                {new Date(customer.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">최종 수정일</p>
              <p className="font-medium">
                {new Date(customer.updatedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <CustomerForm
            customer={{
              id: customer.id,
              company_name: customer.company || '',
              business_number: null,
              address: customer.address || null,
              contact_person: customer.name,
              contact_email: customer.email || null,
              contact_phone: customer.phone || null,
              notes: customer.notes || null,
              created_at: customer.createdAt,
              updated_at: customer.updatedAt,
              quotation_count: 0,
              total_amount: 0,
              grade: customer.grade as any,
            }}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
