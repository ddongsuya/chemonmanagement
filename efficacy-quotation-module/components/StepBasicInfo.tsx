'use client';

import { useState, useEffect } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ArrowRight, Plus, Building2, Loader2 } from 'lucide-react';
import { VALIDITY_OPTIONS } from '@/lib/constants';
import { addDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getCustomers, createCustomer, Customer } from '@/lib/data-api';

/**
 * StepBasicInfo Component for Efficacy Quotation
 * Step 1 of efficacy quotation wizard - Basic information input
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

export default function StepBasicInfo() {
  const {
    customerId,
    customerName,
    projectName,
    validDays,
    notes,
    setCustomer,
    setProjectName,
    setValidDays,
    setNotes,
    nextStep,
  } = useEfficacyQuotationStore();

  interface CustomerOption {
    id: string;
    name: string;
  }

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerContact, setNewCustomerContact] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [errors, setErrors] = useState<{ customer?: string; project?: string }>(
    {}
  );

  // Fetch customers from API
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await getCustomers({ limit: 100 });
        if (response.success && response.data) {
          const customerList = response.data.data || [];
          setCustomers(customerList.map((c: Customer) => ({
            id: c.id,
            name: c.company || c.name,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setCustomersLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  // Calculate validity date
  const validUntil = format(addDays(new Date(), validDays), 'yyyy년 MM월 dd일', {
    locale: ko,
  });

  const handleCustomerSelect = (value: string) => {
    const customer = customers.find((c) => c.id === value);
    if (customer) {
      setCustomer(customer.id, customer.name);
      setErrors((prev) => ({ ...prev, customer: undefined }));
    }
  };

  const handleAddCustomer = async () => {
    if (newCustomerName.trim()) {
      setAddingCustomer(true);
      try {
        const response = await createCustomer({
          name: newCustomerContact.trim() || newCustomerName.trim(),
          company: newCustomerName.trim(),
        });
        if (response.success && response.data) {
          const newCustomer = response.data;
          setCustomers((prev) => [...prev, { 
            id: newCustomer.id, 
            name: newCustomer.company || newCustomer.name 
          }]);
          setCustomer(newCustomer.id, newCustomer.company || newCustomer.name);
          setNewCustomerName('');
          setNewCustomerContact('');
          setDialogOpen(false);
          setErrors((prev) => ({ ...prev, customer: undefined }));
        }
      } catch (error) {
        console.error('Failed to create customer:', error);
      } finally {
        setAddingCustomer(false);
      }
    }
  };

  const handleNext = () => {
    const newErrors: { customer?: string; project?: string } = {};

    if (!customerId) {
      newErrors.customer = '고객사를 선택해주세요';
    }
    if (!projectName.trim()) {
      newErrors.project = '프로젝트명을 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    nextStep();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          기본 정보 입력
        </CardTitle>
        <CardDescription>
          효력시험 견적서의 기본 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer selection */}
        <div className="space-y-2">
          <Label htmlFor="customer">
            고객사 <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Select value={customerId} onValueChange={handleCustomerSelect} disabled={customersLoading}>
              <SelectTrigger
                className={errors.customer ? 'border-red-500' : ''}
              >
                {customersLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    로딩 중...
                  </span>
                ) : (
                  <SelectValue placeholder="고객사를 선택하세요" />
                )}
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>신규 고객사 등록</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerName">회사명</Label>
                    <Input
                      id="newCustomerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="회사명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerContact">담당자</Label>
                    <Input
                      id="newCustomerContact"
                      value={newCustomerContact}
                      onChange={(e) => setNewCustomerContact(e.target.value)}
                      placeholder="담당자명을 입력하세요"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button onClick={handleAddCustomer} disabled={addingCustomer}>
                    {addingCustomer ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      '등록'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {errors.customer && (
            <p className="text-sm text-red-500">{errors.customer}</p>
          )}
          {customerName && (
            <p className="text-sm text-gray-500">선택됨: {customerName}</p>
          )}
        </div>

        {/* Project name */}
        <div className="space-y-2">
          <Label htmlFor="projectName">
            프로젝트명 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              if (e.target.value.trim()) {
                setErrors((prev) => ({ ...prev, project: undefined }));
              }
            }}
            placeholder="예: ABC-001 효력시험"
            className={errors.project ? 'border-red-500' : ''}
          />
          {errors.project && (
            <p className="text-sm text-red-500">{errors.project}</p>
          )}
        </div>

        {/* Validity period */}
        <div className="space-y-2">
          <Label htmlFor="validDays">견적 유효기간</Label>
          <Select
            value={validDays.toString()}
            onValueChange={(value) => setValidDays(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALIDITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">유효기한: {validUntil}</p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">특이사항</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="견적 관련 특이사항이나 메모를 입력하세요"
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Next button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleNext} size="lg">
            다음: 모델 선택
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
