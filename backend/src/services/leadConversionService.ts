// backend/src/services/leadConversionService.ts
// 리드-고객 전환 서비스
// Requirements: 3.2, 3.3, 3.4

import { PrismaClient, Lead, Customer, LeadStatus, CustomerGrade } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * 리드-고객 전환 결과 인터페이스
 * 
 * @property lead - 전환된 리드 정보 (status: CONVERTED, customerId 설정됨)
 * @property customer - 생성되거나 업데이트된 고객 정보
 * @property updatedQuotations - customerId가 업데이트된 견적서 ID 목록
 */
export interface ConversionResult {
  lead: Lead;
  customer: Customer;
  updatedQuotations: string[];
}

/**
 * LeadConversionService
 * 
 * 리드에서 고객으로의 전환을 처리하는 서비스입니다.
 * 
 * 주요 기능:
 * - 리드 정보를 고객 레코드로 복사
 * - 리드에 연결된 견적서의 customerId 업데이트
 * - 리드-고객 데이터 양방향 동기화
 * 
 * Requirements:
 * - 3.2: Lead 정보를 Customer로 복사 (companyName→company, contactName→name, etc.)
 * - 3.3: 새 Customer의 grade를 CUSTOMER로 설정
 * - 3.4: Lead의 customerId 필드에 Customer ID 저장, convertedAt에 현재 시간 기록
 */
export class LeadConversionService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * 리드를 고객으로 전환
   * 
   * Requirements 3.2: Lead 정보를 Customer로 복사
   * - companyName → company
   * - contactName → name
   * - contactEmail → email
   * - contactPhone → phone
   * - department, position 복사
   * 
   * Requirements 3.3: 새 Customer의 grade를 CUSTOMER로 설정
   * 
   * Requirements 3.4: Lead의 customerId 필드에 새로 생성된 Customer ID를 저장하고
   * convertedAt에 현재 시간을 기록
   * 
   * @param leadId - 전환할 리드 ID
   * @param userId - 전환을 수행하는 사용자 ID
   * @returns ConversionResult - 전환 결과 (리드, 고객, 업데이트된 견적서 목록)
   * @throws Error - 리드를 찾을 수 없거나 이미 전환된 경우
   */
  async convertLeadToCustomer(leadId: string, userId: string): Promise<ConversionResult> {
    // 리드 조회 (연결된 견적서 포함)
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        quotations: {
          where: { deletedAt: null },
          select: { id: true },
        },
        customer: true,
      },
    });

    if (!lead) {
      throw new Error(`리드를 찾을 수 없습니다: ${leadId}`);
    }

    // 이미 전환된 리드인지 확인
    if (lead.status === LeadStatus.CONVERTED && lead.customerId) {
      throw new Error('이미 고객으로 전환된 리드입니다');
    }

    // 트랜잭션으로 원자성 보장
    const result = await this.prisma.$transaction(async (tx) => {
      let customer: Customer;
      const updatedQuotations: string[] = [];
      const now = new Date();

      // Requirements 3.6: 리드에 이미 연결된 Customer가 존재하면 기존 Customer 업데이트
      if (lead.customerId && lead.customer) {
        // 기존 고객 정보 업데이트
        customer = await tx.customer.update({
          where: { id: lead.customerId },
          data: {
            company: lead.companyName,
            name: lead.contactName,
            email: lead.contactEmail,
            phone: lead.contactPhone,
            // grade는 이미 CUSTOMER 이상일 수 있으므로 업그레이드만 수행
            grade: this.upgradeGrade(lead.customer.grade),
          },
        });
      } else {
        // Requirements 3.2, 3.3: 새 Customer 생성
        customer = await tx.customer.create({
          data: {
            userId: userId,
            company: lead.companyName,
            name: lead.contactName,
            email: lead.contactEmail,
            phone: lead.contactPhone,
            grade: CustomerGrade.CUSTOMER, // Requirements 3.3
            notes: `리드에서 전환됨 (리드번호: ${lead.leadNumber})`,
          },
        });
      }

      // Requirements 3.4: Lead 업데이트 (customerId, convertedAt, status)
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          customerId: customer.id,
          convertedAt: now,
          status: LeadStatus.CONVERTED,
        },
        include: {
          stage: true,
          customer: true,
        },
      });

      // Requirements 3.5: 리드에 연결된 모든 견적서의 customerId 업데이트
      if (lead.quotations && lead.quotations.length > 0) {
        const quotationIds = lead.quotations.map((q) => q.id);
        
        await tx.quotation.updateMany({
          where: {
            id: { in: quotationIds },
            deletedAt: null,
          },
          data: {
            customerId: customer.id,
          },
        });

        updatedQuotations.push(...quotationIds);
      }

      // LeadActivity 생성 (전환 기록)
      await tx.leadActivity.create({
        data: {
          leadId: leadId,
          userId: userId,
          type: 'STATUS_CHANGE',
          subject: '고객 전환 완료',
          content: `리드가 고객으로 전환되었습니다. (고객 ID: ${customer.id}, 고객명: ${customer.name})`,
          contactedAt: now,
        },
      });

      return {
        lead: updatedLead,
        customer,
        updatedQuotations,
      };
    });

    return result;
  }

  /**
   * 리드-고객 데이터 동기화
   * 
   * Requirements 5.1, 5.2: 리드와 고객 데이터 양방향 동기화
   * 
   * @param leadId - 동기화할 리드 ID
   * @param direction - 동기화 방향 ('lead-to-customer' | 'customer-to-lead')
   */
  async syncLeadCustomerData(
    leadId: string,
    direction: 'lead-to-customer' | 'customer-to-lead'
  ): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });

    if (!lead || !lead.customerId || !lead.customer) {
      // 연결된 고객이 없으면 동기화 스킵
      return;
    }

    if (direction === 'lead-to-customer') {
      // 리드 → 고객 동기화
      await this.prisma.customer.update({
        where: { id: lead.customerId },
        data: {
          company: lead.companyName,
          name: lead.contactName,
          email: lead.contactEmail,
          phone: lead.contactPhone,
        },
      });
    } else {
      // 고객 → 리드 동기화
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          companyName: lead.customer.company || lead.companyName,
          contactName: lead.customer.name,
          contactEmail: lead.customer.email,
          contactPhone: lead.customer.phone,
        },
      });
    }

    // Requirements 5.3: ActivityLog에 동기화 기록
    await this.prisma.activityLog.create({
      data: {
        userId: lead.userId,
        action: 'SYNC',
        resource: 'Lead-Customer',
        resourceId: leadId,
        details: {
          direction,
          leadId,
          customerId: lead.customerId,
          syncedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * 고객 등급 업그레이드 로직
   * 
   * LEAD → CUSTOMER
   * PROSPECT → CUSTOMER
   * CUSTOMER, VIP → 유지
   * INACTIVE → CUSTOMER (재활성화)
   * 
   * @param currentGrade - 현재 고객 등급
   * @returns 업그레이드된 고객 등급
   */
  private upgradeGrade(currentGrade: CustomerGrade): CustomerGrade {
    switch (currentGrade) {
      case CustomerGrade.LEAD:
      case CustomerGrade.PROSPECT:
      case CustomerGrade.INACTIVE:
        return CustomerGrade.CUSTOMER;
      case CustomerGrade.CUSTOMER:
      case CustomerGrade.VIP:
        return currentGrade; // 유지
      default:
        return CustomerGrade.CUSTOMER;
    }
  }
}

// 싱글톤 인스턴스 export
export const leadConversionService = new LeadConversionService();

export default LeadConversionService;
