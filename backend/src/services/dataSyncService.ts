// backend/src/services/dataSyncService.ts
// 리드-고객 데이터 동기화 서비스
// Requirements: 5.1, 5.2, 5.3, 5.4

import { PrismaClient, Lead, Customer } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * 동기화 결과 인터페이스
 */
export interface SyncResult {
  success: boolean;
  direction: 'lead-to-customer' | 'customer-to-lead';
  sourceId: string;
  targetId: string;
  syncedFields: string[];
  conflictResolved?: boolean;
  conflictDetails?: ConflictDetails;
}

/**
 * 충돌 상세 정보
 */
export interface ConflictDetails {
  leadUpdatedAt: Date;
  customerUpdatedAt: Date;
  winner: 'lead' | 'customer';
  conflictingFields: string[];
}

/**
 * 동기화 대상 필드 매핑
 * Lead 필드 -> Customer 필드
 */
const FIELD_MAPPING = {
  leadToCustomer: {
    contactName: 'name',
    companyName: 'company',
    contactEmail: 'email',
    contactPhone: 'phone',
  },
  customerToLead: {
    name: 'contactName',
    company: 'companyName',
    email: 'contactEmail',
    phone: 'contactPhone',
  },
} as const;

/**
 * DataSyncService
 * 
 * 리드와 고객 데이터 간의 양방향 동기화를 처리하는 서비스입니다.
 * 
 * 주요 기능:
 * - 리드 → 고객 데이터 동기화 (Requirements 5.1)
 * - 고객 → 리드 데이터 동기화 (Requirements 5.2)
 * - 동기화 로그 기록 (Requirements 5.3)
 * - 충돌 해결 (updatedAt 기준) (Requirements 5.4)
 */
export class DataSyncService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }


  /**
   * 리드 정보를 연결된 고객에게 동기화
   * 
   * Requirements 5.1: 리드 정보가 수정되고 해당 리드에 연결된 Customer가 존재하면
   * Customer의 관련 필드(name, company, email, phone)도 함께 업데이트
   * 
   * @param leadId - 동기화할 리드 ID
   * @param userId - 동기화를 수행하는 사용자 ID
   * @returns SyncResult - 동기화 결과
   */
  async syncLeadToCustomer(leadId: string, userId: string): Promise<SyncResult | null> {
    // 리드와 연결된 고객 조회
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });

    if (!lead || !lead.customerId || !lead.customer) {
      // 연결된 고객이 없으면 동기화 스킵
      return null;
    }

    const customer = lead.customer;
    const syncedFields: string[] = [];

    // 동기화할 데이터 준비
    const updateData: Partial<Customer> = {};

    // 필드별 동기화 (변경된 필드만)
    if (lead.contactName && lead.contactName !== customer.name) {
      updateData.name = lead.contactName;
      syncedFields.push('name');
    }
    if (lead.companyName !== customer.company) {
      updateData.company = lead.companyName;
      syncedFields.push('company');
    }
    if (lead.contactEmail !== customer.email) {
      updateData.email = lead.contactEmail;
      syncedFields.push('email');
    }
    if (lead.contactPhone !== customer.phone) {
      updateData.phone = lead.contactPhone;
      syncedFields.push('phone');
    }

    // 변경된 필드가 없으면 스킵
    if (syncedFields.length === 0) {
      return {
        success: true,
        direction: 'lead-to-customer',
        sourceId: leadId,
        targetId: customer.id,
        syncedFields: [],
      };
    }

    // 고객 정보 업데이트
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
    });

    // Requirements 5.3: 동기화 로그 기록
    await this.logSyncActivity(userId, 'lead-to-customer', leadId, customer.id, syncedFields);

    return {
      success: true,
      direction: 'lead-to-customer',
      sourceId: leadId,
      targetId: customer.id,
      syncedFields,
    };
  }

  /**
   * 고객 정보를 연결된 리드에게 동기화
   * 
   * Requirements 5.2: Customer 정보가 수정되고 해당 Customer에 연결된 Lead가 존재하면
   * Lead의 관련 필드(contactName, companyName, contactEmail, contactPhone)도 함께 업데이트
   * 
   * @param customerId - 동기화할 고객 ID
   * @param userId - 동기화를 수행하는 사용자 ID
   * @returns SyncResult[] - 동기화 결과 배열 (여러 리드가 연결될 수 있음)
   */
  async syncCustomerToLead(customerId: string, userId: string): Promise<SyncResult[]> {
    // 고객과 연결된 모든 리드 조회
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        leads: {
          where: { deletedAt: null },
        },
      },
    });

    if (!customer || !customer.leads || customer.leads.length === 0) {
      // 연결된 리드가 없으면 빈 배열 반환
      return [];
    }

    const results: SyncResult[] = [];

    // 각 연결된 리드에 대해 동기화 수행
    for (const lead of customer.leads) {
      const syncedFields: string[] = [];
      const updateData: Partial<Lead> = {};

      // 필드별 동기화 (변경된 필드만)
      if (customer.name && customer.name !== lead.contactName) {
        updateData.contactName = customer.name;
        syncedFields.push('contactName');
      }
      if (customer.company !== lead.companyName) {
        updateData.companyName = customer.company || lead.companyName;
        syncedFields.push('companyName');
      }
      if (customer.email !== lead.contactEmail) {
        updateData.contactEmail = customer.email;
        syncedFields.push('contactEmail');
      }
      if (customer.phone !== lead.contactPhone) {
        updateData.contactPhone = customer.phone;
        syncedFields.push('contactPhone');
      }

      // 변경된 필드가 없으면 스킵
      if (syncedFields.length === 0) {
        results.push({
          success: true,
          direction: 'customer-to-lead',
          sourceId: customerId,
          targetId: lead.id,
          syncedFields: [],
        });
        continue;
      }

      // 리드 정보 업데이트
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: updateData,
      });

      // Requirements 5.3: 동기화 로그 기록
      await this.logSyncActivity(userId, 'customer-to-lead', customerId, lead.id, syncedFields);

      results.push({
        success: true,
        direction: 'customer-to-lead',
        sourceId: customerId,
        targetId: lead.id,
        syncedFields,
      });
    }

    return results;
  }


  /**
   * 충돌 해결을 포함한 양방향 동기화
   * 
   * Requirements 5.4: 동기화 중 충돌이 발생하면(양쪽 모두 수정된 경우)
   * 가장 최근에 수정된 데이터를 우선 적용하고 충돌 내역을 로그에 기록
   * 
   * @param leadId - 리드 ID
   * @param userId - 사용자 ID
   * @param lastSyncAt - 마지막 동기화 시간 (선택적)
   * @returns SyncResult - 동기화 결과 (충돌 해결 정보 포함)
   */
  async syncWithConflictResolution(
    leadId: string,
    userId: string,
    lastSyncAt?: Date
  ): Promise<SyncResult | null> {
    // 리드와 연결된 고객 조회
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });

    if (!lead || !lead.customerId || !lead.customer) {
      return null;
    }

    const customer = lead.customer;
    const syncTime = lastSyncAt || new Date(0); // 마지막 동기화 시간이 없으면 epoch

    // 양쪽 모두 마지막 동기화 이후 수정되었는지 확인
    const leadModified = lead.updatedAt > syncTime;
    const customerModified = customer.updatedAt > syncTime;

    // 충돌 감지: 양쪽 모두 수정된 경우
    if (leadModified && customerModified) {
      // Requirements 5.4: 가장 최근에 수정된 데이터를 우선 적용
      const winner = lead.updatedAt > customer.updatedAt ? 'lead' : 'customer';
      const conflictingFields = this.detectConflictingFields(lead, customer);

      let result: SyncResult;

      if (winner === 'lead') {
        // 리드가 더 최신 -> 리드 데이터를 고객에게 적용
        result = await this.syncLeadToCustomer(leadId, userId) || {
          success: true,
          direction: 'lead-to-customer',
          sourceId: leadId,
          targetId: customer.id,
          syncedFields: [],
        };
      } else {
        // 고객이 더 최신 -> 고객 데이터를 리드에게 적용
        const results = await this.syncCustomerToLead(customer.id, userId);
        result = results[0] || {
          success: true,
          direction: 'customer-to-lead',
          sourceId: customer.id,
          targetId: leadId,
          syncedFields: [],
        };
      }

      // 충돌 정보 추가
      result.conflictResolved = true;
      result.conflictDetails = {
        leadUpdatedAt: lead.updatedAt,
        customerUpdatedAt: customer.updatedAt,
        winner,
        conflictingFields,
      };

      // 충돌 해결 로그 기록
      await this.logConflictResolution(userId, leadId, customer.id, result.conflictDetails);

      return result;
    }

    // 충돌 없음: 수정된 쪽의 데이터를 다른 쪽에 적용
    if (leadModified) {
      return await this.syncLeadToCustomer(leadId, userId);
    } else if (customerModified) {
      const results = await this.syncCustomerToLead(customer.id, userId);
      return results[0] || null;
    }

    // 양쪽 모두 수정되지 않음
    return {
      success: true,
      direction: 'lead-to-customer',
      sourceId: leadId,
      targetId: customer.id,
      syncedFields: [],
    };
  }

  /**
   * 충돌하는 필드 감지
   * 
   * @param lead - 리드 객체
   * @param customer - 고객 객체
   * @returns 충돌하는 필드 이름 배열
   */
  private detectConflictingFields(lead: Lead, customer: Customer): string[] {
    const conflictingFields: string[] = [];

    if (lead.contactName !== customer.name) {
      conflictingFields.push('name/contactName');
    }
    if (lead.companyName !== customer.company) {
      conflictingFields.push('company/companyName');
    }
    if (lead.contactEmail !== customer.email) {
      conflictingFields.push('email/contactEmail');
    }
    if (lead.contactPhone !== customer.phone) {
      conflictingFields.push('phone/contactPhone');
    }

    return conflictingFields;
  }

  /**
   * 동기화 활동 로그 기록
   * 
   * Requirements 5.3: ActivityLog 테이블에 action이 "SYNC"인 로그를 기록
   * 
   * @param userId - 사용자 ID
   * @param direction - 동기화 방향
   * @param sourceId - 소스 ID
   * @param targetId - 타겟 ID
   * @param syncedFields - 동기화된 필드 목록
   */
  private async logSyncActivity(
    userId: string,
    direction: 'lead-to-customer' | 'customer-to-lead',
    sourceId: string,
    targetId: string,
    syncedFields: string[]
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'SYNC',
        resource: 'Lead-Customer',
        resourceId: direction === 'lead-to-customer' ? sourceId : targetId,
        details: {
          direction,
          sourceId,
          targetId,
          syncedFields,
          syncedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * 충돌 해결 로그 기록
   * 
   * Requirements 5.4: 충돌 내역을 로그에 기록
   * 
   * @param userId - 사용자 ID
   * @param leadId - 리드 ID
   * @param customerId - 고객 ID
   * @param conflictDetails - 충돌 상세 정보
   */
  private async logConflictResolution(
    userId: string,
    leadId: string,
    customerId: string,
    conflictDetails: ConflictDetails
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'SYNC_CONFLICT_RESOLVED',
        resource: 'Lead-Customer',
        resourceId: leadId,
        details: {
          leadId,
          customerId,
          conflictDetails: {
            leadUpdatedAt: conflictDetails.leadUpdatedAt.toISOString(),
            customerUpdatedAt: conflictDetails.customerUpdatedAt.toISOString(),
            winner: conflictDetails.winner,
            conflictingFields: conflictDetails.conflictingFields,
          },
          resolvedAt: new Date().toISOString(),
        },
      },
    });
  }
}

// 싱글톤 인스턴스 export
export const dataSyncService = new DataSyncService();

export default DataSyncService;
