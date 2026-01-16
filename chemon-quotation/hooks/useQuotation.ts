'use client';

import { useQuotationStore } from '@/stores/quotationStore';
import { calculateAnalysisCost, calculateDiscount, calculateTotal } from '@/lib/calculations';
import { useMemo } from 'react';

export function useQuotation() {
  const store = useQuotationStore();

  const subtotalTest = useMemo(() => {
    return store.selectedItems.reduce((sum, item) => sum + item.amount, 0);
  }, [store.selectedItems]);

  const analysis = useMemo(() => {
    return calculateAnalysisCost(store.selectedItems);
  }, [store.selectedItems]);

  const discountAmount = useMemo(() => {
    return calculateDiscount(subtotalTest + analysis.total_cost, store.discountRate);
  }, [subtotalTest, analysis.total_cost, store.discountRate]);

  const totalAmount = useMemo(() => {
    return calculateTotal(subtotalTest, analysis.total_cost, discountAmount);
  }, [subtotalTest, analysis.total_cost, discountAmount]);

  return {
    ...store,
    subtotalTest,
    analysis,
    discountAmount,
    totalAmount,
  };
}
