'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQuotations, useDeleteQuotation } from './useQuotationsApi';
import { QuotationFilters } from '@/lib/data-api';

export interface QuotationListItem {
  id: string;
  quotation_number?: string;
  title: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  source: 'api';
}

export function useQuotationsList(filters: QuotationFilters = {}) {
  const { isAuthenticated } = useAuthStore();
  
  // Use API for all data
  const { 
    data: apiData, 
    isLoading: apiLoading, 
    error: apiError,
    refetch 
  } = useQuotations(filters);
  
  const deleteQuotationMutation = useDeleteQuotation();

  // Convert API quotations to unified format
  const quotations = useMemo((): QuotationListItem[] => {
    if (!apiData?.data) return [];
    
    return apiData.data.map((q) => ({
      id: q.id,
      quotation_number: q.quotationNumber,
      title: q.projectName,
      customer_name: q.customerName || q.customer?.name || q.customer?.company || '-',
      status: q.status.toLowerCase(),
      total_amount: Number(q.totalAmount),
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      source: 'api' as const,
    }));
  }, [apiData]);

  // Delete quotation
  const deleteQuotation = useCallback(async (id: string) => {
    await deleteQuotationMutation.mutateAsync(id);
  }, [deleteQuotationMutation]);

  // Get statistics
  const stats = useMemo(() => {
    if (!apiData) {
      return {
        total: 0,
        draft: 0,
        submitted: 0,
        won: 0,
        lost: 0,
      };
    }
    
    return {
      total: apiData.pagination.total,
      draft: quotations.filter((q) => q.status === 'draft').length,
      submitted: quotations.filter((q) => q.status === 'sent').length,
      won: quotations.filter((q) => q.status === 'accepted').length,
      lost: quotations.filter((q) => q.status === 'rejected').length,
    };
  }, [apiData, quotations]);

  return {
    quotations,
    isLoading: apiLoading,
    error: apiError?.message,
    pagination: apiData?.pagination,
    stats,
    refetch,
    deleteQuotation,
    isDeleting: deleteQuotationMutation.isPending,
    isAuthenticated,
  };
}
