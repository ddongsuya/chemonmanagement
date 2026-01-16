'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQuotations, useDeleteQuotation } from './useQuotationsApi';
import * as quotationStorage from '@/lib/quotation-storage';
import { QuotationFilters, Quotation } from '@/lib/data-api';

export interface QuotationListItem {
  id: string;
  quotation_number?: string;
  title: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  source: 'api' | 'local';
}

export function useQuotationsList(filters: QuotationFilters = {}) {
  const { isAuthenticated } = useAuthStore();
  const [localQuotations, setLocalQuotations] = useState<quotationStorage.SavedQuotation[]>([]);
  
  // Use API when authenticated
  const { 
    data: apiData, 
    isLoading: apiLoading, 
    error: apiError,
    refetch 
  } = useQuotations(isAuthenticated ? filters : {});
  
  const deleteQuotationMutation = useDeleteQuotation();

  // Load local quotations
  useEffect(() => {
    if (!isAuthenticated) {
      setLocalQuotations(quotationStorage.getAllQuotations());
    }
  }, [isAuthenticated]);

  // Convert API quotations to unified format
  const apiQuotationsList = useMemo((): QuotationListItem[] => {
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

  // Convert local quotations to unified format
  const localQuotationsList = useMemo((): QuotationListItem[] => {
    return localQuotations.map((q) => ({
      id: q.id,
      quotation_number: q.quotation_number,
      title: q.project_name,
      customer_name: q.customer_name || '-',
      status: q.status,
      total_amount: q.total_amount,
      created_at: q.created_at,
      updated_at: q.updated_at,
      source: 'local' as const,
    }));
  }, [localQuotations]);

  // Combined quotations list
  const quotations = useMemo(() => {
    if (isAuthenticated) {
      return apiQuotationsList;
    }
    return localQuotationsList;
  }, [isAuthenticated, apiQuotationsList, localQuotationsList]);

  // Delete quotation
  const deleteQuotation = useCallback(async (id: string, source: 'api' | 'local') => {
    if (source === 'api') {
      await deleteQuotationMutation.mutateAsync(id);
    } else {
      quotationStorage.deleteQuotation(id);
      setLocalQuotations(quotationStorage.getAllQuotations());
    }
  }, [deleteQuotationMutation]);

  // Get statistics
  const stats = useMemo(() => {
    if (isAuthenticated && apiData) {
      return {
        total: apiData.pagination.total,
        draft: quotations.filter((q) => q.status === 'draft').length,
        submitted: quotations.filter((q) => q.status === 'sent').length,
        won: quotations.filter((q) => q.status === 'accepted').length,
        lost: quotations.filter((q) => q.status === 'rejected').length,
      };
    }
    
    return quotationStorage.getQuotationStats();
  }, [isAuthenticated, apiData, quotations]);

  return {
    quotations,
    isLoading: isAuthenticated ? apiLoading : false,
    error: apiError?.message,
    pagination: apiData?.pagination,
    stats,
    refetch,
    deleteQuotation,
    isDeleting: deleteQuotationMutation.isPending,
    isUsingApi: isAuthenticated,
  };
}
