'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  CustomerFilters,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  Customer,
} from '@/lib/data-api';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

/**
 * Hook to fetch customers list with pagination and filters
 */
export function useCustomersApi(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: async () => {
      const response = await getCustomers(filters);
      if (!response.success) {
        throw new Error(response.error?.message || '고객 목록을 불러오는데 실패했습니다');
      }
      return response.data!;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single customer by ID
 */
export function useCustomerApi(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn: async () => {
      const response = await getCustomerById(id!);
      if (!response.success) {
        throw new Error(response.error?.message || '고객 정보를 불러오는데 실패했습니다');
      }
      return response.data!;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCustomerDTO) => {
      const response = await createCustomer(data);
      if (!response.success) {
        throw new Error(response.error?.message || '고객 생성에 실패했습니다');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: '고객 등록 완료',
        description: '새 고객이 등록되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '고객 등록 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerDTO }) => {
      const response = await updateCustomer(id, data);
      if (!response.success) {
        throw new Error(response.error?.message || '고객 정보 수정에 실패했습니다');
      }
      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific customer
      queryClient.setQueryData(customerKeys.detail(variables.id), data);
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: '고객 정보 수정 완료',
        description: '고객 정보가 수정되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '고객 정보 수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteCustomer(id);
      if (!response.success) {
        throw new Error(response.error?.message || '고객 삭제에 실패했습니다');
      }
      return id;
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: '고객 삭제 완료',
        description: '고객이 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '고객 삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
