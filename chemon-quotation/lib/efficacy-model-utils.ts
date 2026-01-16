/**
 * Efficacy Model Utility Functions
 * Pure functions for model filtering and grouping
 * Requirements: 1.1, 1.2, 1.4
 */

import type { EfficacyModel, ModelItem, EfficacyMasterData } from '@/types/efficacy';
import { getEfficacyMasterData } from '@/lib/efficacy-storage';

/**
 * Filter active models only
 * Property 13: Active Models Only Display
 * Validates: Requirements 1.1
 */
export function filterActiveModels(models: EfficacyModel[]): EfficacyModel[] {
  return models.filter((model) => model.is_active === true);
}

/**
 * Group models by category
 */
export function groupModelsByCategory(
  models: EfficacyModel[]
): Record<string, EfficacyModel[]> {
  const grouped: Record<string, EfficacyModel[]> = {};

  for (const model of models) {
    const category = model.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(model);
  }

  return grouped;
}

/**
 * Get default items for a model from master data
 * Property 4: Model Selection Loads Correct Defaults
 * Validates: Requirements 1.2, 3.2
 */
export function getDefaultItemsForModel(modelId: string): ModelItem[] {
  const masterData = getEfficacyMasterData();
  return getDefaultItemsForModelFromData(modelId, masterData);
}

/**
 * Pure function version for testing - takes master data as parameter
 */
export function getDefaultItemsForModelFromData(
  modelId: string,
  masterData: EfficacyMasterData
): ModelItem[] {
  return masterData.model_items.filter(
    (mi) => mi.model_id === modelId && mi.is_default === true
  );
}

/**
 * Get optional items for a model
 * Property 7: Optional Items Filter by Model
 * Validates: Requirements 3.1
 */
export function getOptionalItemsForModel(modelId: string): ModelItem[] {
  const masterData = getEfficacyMasterData();
  return masterData.model_items.filter(
    (mi) => mi.model_id === modelId && mi.is_default === false
  );
}

/**
 * Get all items for a model
 */
export function getAllItemsForModel(modelId: string): ModelItem[] {
  const masterData = getEfficacyMasterData();
  return masterData.model_items.filter((mi) => mi.model_id === modelId);
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string): EfficacyModel | undefined {
  const masterData = getEfficacyMasterData();
  return masterData.models.find((m) => m.model_id === modelId);
}

// Category order for display
export const CATEGORY_ORDER = [
  '피부',
  '피부/면역',
  '항암',
  '면역/항암',
  '근골격',
  '대사',
  '대사/혈관',
  '신경',
  '심혈관',
  '세포',
  '소화기',
  '비뇨기',
];

// Category colors for UI
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  '피부': { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' },
  '피부/면역': { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' },
  '항암': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  '면역/항암': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  '근골격': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  '대사': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  '대사/혈관': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  '신경': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  '심혈관': { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  '세포': { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
  '소화기': { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  '비뇨기': { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
};

export const getCategoryColors = (category: string) =>
  CATEGORY_COLORS[category] || {
    bg: 'bg-gray-50',
    border: 'border-gray-500',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800',
  };
