'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotationApi,
  QuotationFilters,
  CreateQuotationDTO,
  UpdateQuotationDTO,
  Quotation,
} from '@/lib/data-api';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const quotationKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationKeys.all, 'list'] as const,
  list: (filters: QuotationFilters) => [...quotationKeys.lists(), filters] as const,
  details: () => [...quotationKeys.all, 'detail'] as const,
  detail: (id: string) => [...quotationKeys.details(), id] as const,
};

/**
 * Hook to fetch quotations list with pagination and filters
 */
export function useQuotations(filters: QuotationFilters = {}) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: async () => {
      const response = await getQuotations(filters);
      if (!response.success) {
        throw new Error(response.error?.message || '견적서 목록을 불러오는데 실패했습니다');
      }
      return response.data!;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single quotation by ID
 */
export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(id!),
    queryFn: async () => {
      const response = await getQuotationById(id!);
      if (!response.success) {
        throw new Error(response.error?.message || '견적서를 불러오는데 실패했습니다');
      }
      return response.data!;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to create a new quotation
 */
export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateQuotationDTO) => {
      const response = await createQuotation(data);
      if (!response.success) {
        throw new Error(response.error?.message || '견적서 생성에 실패했습니다');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // Invalidate and refetch quotations list
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast({
        title: '견적서 생성 완료',
        description: '새 견적서가 생성되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '견적서 생성 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a quotation
 */
export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuotationDTO }) => {
      const response = await updateQuotation(id, data);
      if (!response.success) {
        throw new Error(response.error?.message || '견적서 수정에 실패했습니다');
      }
      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific quotation
      queryClient.setQueryData(quotationKeys.detail(variables.id), data);
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast({
        title: '견적서 수정 완료',
        description: '견적서가 수정되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '견적서 수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a quotation
 */
export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteQuotationApi(id);
      if (!response.success) {
        throw new Error(response.error?.message || '견적서 삭제에 실패했습니다');
      }
      return id;
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: quotationKeys.detail(id) });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast({
        title: '견적서 삭제 완료',
        description: '견적서가 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '견적서 삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
