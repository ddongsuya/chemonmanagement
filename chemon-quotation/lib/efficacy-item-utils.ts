/**
 * Utility functions for efficacy item configuration
 * Requirements: 2.3, 3.1, 3.3
 */

import { getEfficacyMasterData } from '@/lib/efficacy-storage';
import type { ModelItem, SelectedEfficacyItem } from '@/types/efficacy';

/**
 * Get optional items for a model
 * Property 7: Optional Items Filter by Model
 * Validates: Requirements 3.1
 * 
 * For any model, the optional items list SHALL contain only items 
 * where model_id matches and is_default=false.
 */
export function getOptionalItemsForModel(modelId: string): ModelItem[] {
  const masterData = getEfficacyMasterData();
  return masterData.model_items.filter(
    (mi) => mi.model_id === modelId && mi.is_default === false
  );
}

/**
 * Filter items by search query
 * Property 8: Search Filter Returns Matching Items
 * Validates: Requirements 3.3
 * 
 * For any search query string, all returned items SHALL contain 
 * the query string in their item_name (case-insensitive).
 */
export function filterItemsBySearch(items: ModelItem[], query: string): ModelItem[] {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    item.item_name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Calculate subtotal from items
 * Property 6: Item Removal Decreases Total
 * Validates: Requirements 2.3
 */
export function calculateSubtotal(items: SelectedEfficacyItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Remove item from array and return new array
 * Property 6: Item Removal Decreases Total
 * Validates: Requirements 2.3
 * 
 * For any item removal, the new subtotal SHALL equal 
 * the previous subtotal minus the removed item's amount.
 */
export function removeItemFromList(
  items: SelectedEfficacyItem[],
  itemId: string
): SelectedEfficacyItem[] {
  return items.filter((item) => item.id !== itemId);
}
