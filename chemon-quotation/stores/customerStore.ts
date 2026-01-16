import { create } from 'zustand';
import { Customer } from '@/types';

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  selectCustomer: (customer: Customer | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  selectedCustomer: null,
  searchQuery: '',

  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) => set((state) => ({
    customers: [...state.customers, customer],
  })),
  updateCustomer: (id, updates) => set((state) => ({
    customers: state.customers.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),
  deleteCustomer: (id) => set((state) => ({
    customers: state.customers.filter((c) => c.id !== id),
  })),
  selectCustomer: (customer) => set({ selectedCustomer: customer }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
