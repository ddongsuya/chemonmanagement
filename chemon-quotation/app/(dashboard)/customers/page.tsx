'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import CustomerForm from '@/components/customer/CustomerForm';
import CustomerCard from '@/components/customer/CustomerCard';
import Skeleton from '@/components/ui/Skeleton';
import { Plus, Search, Users, RefreshCw } from 'lucide-react';
import { Customer } from '@/types';
import { getCustomers, Customer as ApiCustomer } from '@/lib/data-api';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // API에서 고객 데이터 로드
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCustomers({ limit: 100 });
      if (response.success && response.data) {
        // API 응답을 프론트엔드 Customer 타입으로 변환
        const customerData = response.data.data || [];
        const mappedCustomers: Customer[] = customerData.map((c: ApiCustomer) => ({
          id: c.id,
          company_name: c.company || c.name,
          business_number: '',
          address: c.address || '',
          contact_person: c.name,
          contact_email: c.email || '',
          contact_phone: c.phone || '',
          notes: c.notes || '',
          created_at: c.createdAt,
          updated_at: c.updatedAt,
          quotation_count: 0,
          total_amount: 0,
        }));
        setCustomers(mappedCustomers);
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '고객 목록을 불러오는데 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '서버 연결에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.company_name.toLowerCase().includes(query) ||
      customer.contact_person.toLowerCase().includes(query) ||
      customer.contact_email?.toLowerCase().includes(query)
    );
  });

  // 통계
  const totalCustomers = customers.length;
  const totalQuotations = customers.reduce(
    (sum, c) => sum + c.quotation_count,
    0
  );
  const totalAmount = customers.reduce((sum, c) => sum + c.total_amount, 0);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    loadCustomers();
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="고객사 관리"
          description="고객사 정보를 관리하고 견적 이력을 확인합니다"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="고객사 관리"
        description="고객사 정보를 관리하고 견적 이력을 확인합니다"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadCustomers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  신규 고객 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <CustomerForm onSuccess={handleAddSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 고객사</p>
                <p className="text-xl font-bold">{totalCustomers}개</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 견적 건수</p>
                <p className="text-xl font-bold">{totalQuotations}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 견적 금액</p>
                <p className="text-xl font-bold">
                  {totalAmount > 0 ? `${(totalAmount / 100000000).toFixed(1)}억원` : '0원'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색바 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="회사명, 담당자, 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* 고객 카드 그리드 */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{customers.length === 0 ? '등록된 고객사가 없습니다. 신규 고객을 등록해보세요.' : '검색 결과가 없습니다.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}
