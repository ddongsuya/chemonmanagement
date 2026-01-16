'use client';

import { useCustomerStore } from '@/stores/customerStore';
import { useMemo, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCustomersApi } from './useCustomersApi';

export function useCustomers() {
  const store = useCustomerStore();
  const { isAuthenticated } = useAuthStore();
  
  // Use API when authenticated
  const { data: apiData, isLoading, error, refetch } = useCustomersApi(
    isAuthenticated ? { limit: 100 } : {}
  );

  // Sync API data to store when available
  useEffect(() => {
    if (isAuthenticated && apiData?.data) {
      // Convert API format to local format
      const convertedCustomers = apiData.data.map((c) => ({
        id: c.id,
        company_name: c.company || c.name,
        business_number: null,
        contact_person: c.name,
        contact_email: c.email || '',
        contact_phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        created_at: c.createdAt,
        updated_at: c.updatedAt,
        quotation_count: 0,
        total_amount: 0,
      }));
      store.setCustomers(convertedCustomers);
    }
  }, [isAuthenticated, apiData, store.setCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!store.searchQuery) return store.customers;
    
    const query = store.searchQuery.toLowerCase();
    return store.customers.filter(
      (customer) =>
        customer.company_name.toLowerCase().includes(query) ||
        customer.contact_person.toLowerCase().includes(query) ||
        customer.contact_email?.toLowerCase().includes(query)
    );
  }, [store.customers, store.searchQuery]);

  return {
    ...store,
    filteredCustomers,
    isLoading: isAuthenticated ? isLoading : false,
    error: error?.message,
    refetch,
    isUsingApi: isAuthenticated,
  };
}
