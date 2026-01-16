/**
 * Data Synchronization Service
 * 
 * This service provides a unified interface for data operations that can work with
 * both local storage (offline/fallback) and the backend API (online).
 * 
 * Usage:
 * - When the backend is available, it uses API calls
 * - When offline or API fails, it falls back to local storage
 * - Provides sync functionality to push local changes to the server
 */

import { getAccessToken } from './auth-api';
import * as dataApi from './data-api';
import * as quotationStorage from './quotation-storage';

// Check if we should use API (user is authenticated)
export function shouldUseApi(): boolean {
  return !!getAccessToken();
}

// ============ Quotation Sync ============

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Sync local quotations to the server
 * This is useful when user was working offline and comes back online
 */
export async function syncLocalQuotationsToServer(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  if (!shouldUseApi()) {
    result.success = false;
    result.errors.push('사용자가 로그인되어 있지 않습니다');
    return result;
  }

  const localQuotations = quotationStorage.getAllQuotations();
  
  for (const localQuotation of localQuotations) {
    try {
      // Convert local format to API format
      const apiData: dataApi.CreateQuotationDTO = {
        quotationType: 'TOXICITY',
        customerName: localQuotation.customer_name || '',
        projectName: localQuotation.project_name,
        items: localQuotation.items.map((item) => ({
          name: item.test.test_name,
          description: item.test.test_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          amount: item.amount,
        })),
        totalAmount: localQuotation.total_amount,
        status: mapLocalStatusToApi(localQuotation.status),
        validUntil: localQuotation.valid_until,
        notes: localQuotation.notes || null,
      };

      const response = await dataApi.createQuotation(apiData);
      
      if (response.success) {
        // Remove from local storage after successful sync
        quotationStorage.deleteQuotation(localQuotation.id);
        result.synced++;
      } else {
        result.failed++;
        result.errors.push(`견적서 "${localQuotation.project_name}" 동기화 실패: ${response.error?.message}`);
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`견적서 "${localQuotation.project_name}" 동기화 중 오류 발생`);
    }
  }

  result.success = result.failed === 0;
  return result;
}

/**
 * Map local quotation status to API status
 */
function mapLocalStatusToApi(localStatus: string): dataApi.QuotationStatus {
  const statusMap: Record<string, dataApi.QuotationStatus> = {
    draft: 'DRAFT',
    submitted: 'SENT',
    won: 'ACCEPTED',
    lost: 'REJECTED',
    expired: 'REJECTED',
  };
  return statusMap[localStatus] || 'DRAFT';
}

/**
 * Map API quotation status to local status
 */
function mapApiStatusToLocal(apiStatus: dataApi.QuotationStatus): quotationStorage.SavedQuotation['status'] {
  const statusMap: Record<dataApi.QuotationStatus, quotationStorage.SavedQuotation['status']> = {
    DRAFT: 'draft',
    SENT: 'submitted',
    ACCEPTED: 'won',
    REJECTED: 'lost',
    EXPIRED: 'expired',
  };
  return statusMap[apiStatus] || 'draft';
}

// ============ Hybrid Data Access ============

/**
 * Get quotations - tries API first, falls back to local storage
 */
export async function getQuotationsHybrid(
  filters: dataApi.QuotationFilters = {}
): Promise<{
  source: 'api' | 'local';
  data: dataApi.Quotation[] | quotationStorage.SavedQuotation[];
  pagination?: dataApi.PaginatedResult<dataApi.Quotation>['pagination'];
}> {
  if (shouldUseApi()) {
    try {
      const response = await dataApi.getQuotations(filters);
      if (response.success && response.data) {
        return {
          source: 'api',
          data: response.data.data,
          pagination: response.data.pagination,
        };
      }
    } catch (error) {
      console.warn('API call failed, falling back to local storage:', error);
    }
  }

  // Fallback to local storage
  const localData = quotationStorage.getAllQuotations();
  return {
    source: 'local',
    data: localData,
  };
}

/**
 * Check if there are local quotations that need to be synced
 */
export function hasUnsyncedQuotations(): boolean {
  const localQuotations = quotationStorage.getAllQuotations();
  return localQuotations.length > 0;
}

/**
 * Get count of unsynced local quotations
 */
export function getUnsyncedQuotationCount(): number {
  return quotationStorage.getAllQuotations().length;
}
