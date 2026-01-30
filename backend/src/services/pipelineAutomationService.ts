// backend/src/services/pipelineAutomationService.ts
// 파이프라인 자동화 서비스
// Requirements: 2.1, 2.2, 2.3

import { PrismaClient, LeadStatus, QuotationStatus, ContractStatus, Lead } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * Lead Status 진행 순서 정의
 * NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → CONVERTED
 * 
 * 이 순서는 영업 파이프라인의 진행 단계를 나타냅니다.
 * 상태 업데이트 시 현재 상태가 목표 상태보다 이전 단계인 경우에만 업데이트합니다.
 */
const LEAD_STATUS_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
  LeadStatus.CONVERTED,
];

/**
 * PROPOSAL 이전 단계 목록
 * 이 단계들에 있는 리드만 PROPOSAL로 자동 업데이트됩니다.
 */
const STAGES_BEFORE_PROPOSAL: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
];

/**
 * PipelineAutomationService
 * 
 * 견적서 및 계약서 상태 변경에 따른 리드 파이프라인 자동화를 처리합니다.
 * 
 * 주요 기능:
 * - 견적서 SENT 시 리드 상태를 PROPOSAL로 자동 업데이트
 * - 계약서 SIGNED 시 리드를 고객으로 자동 전환
 * - 상태 진행 순서 검증 (역방향 업데이트 방지)
 */
export class PipelineAutomationService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * 리드 상태가 목표 상태보다 이전 단계인지 확인
   * 
   * @param currentStatus - 현재 리드 상태
   * @param targetStatus - 목표 리드 상태
   * @returns 현재 상태가 목표 상태보다 이전 단계이면 true
   */
  isStatusBeforeTarget(currentStatus: LeadStatus, targetStatus: LeadStatus): boolean {
    const currentIndex = LEAD_STATUS_ORDER.indexOf(currentStatus);
    const targetIndex = LEAD_STATUS_ORDER.indexOf(targetStatus);
    
    // 상태가 순서 목록에 없는 경우 (LOST, DORMANT 등) false 반환
    if (currentIndex === -1 || targetIndex === -1) {
      return false;
    }
    
    return currentIndex < targetIndex;
  }

  /**
   * 리드 상태가 PROPOSAL 이전 단계인지 확인
   * 
   * Requirements 2.3: PROPOSAL보다 진행된 단계(NEGOTIATION, CONVERTED)인 경우
   * 파이프라인 단계를 변경하지 않아야 합니다.
   * 
   * @param status - 확인할 리드 상태
   * @returns PROPOSAL 이전 단계이면 true
   */
  isBeforeProposal(status: LeadStatus): boolean {
    return STAGES_BEFORE_PROPOSAL.includes(status);
  }

  /**
   * 견적서 상태 변경 시 파이프라인 자동화 처리
   * 
   * Requirements 2.1: 견적서 상태가 SENT로 변경되고 해당 견적서에 연결된 리드가 존재하면
   * 해당 리드의 status를 PROPOSAL로 자동 업데이트해야 합니다.
   * 
   * Requirements 2.2: 리드의 status가 PROPOSAL로 변경되면 해당 리드의 stageId를
   * "견적발송" 단계의 PipelineStage ID로 업데이트해야 합니다.
   * 
   * Requirements 2.3: 리드의 현재 status가 PROPOSAL보다 진행된 단계(NEGOTIATION, CONVERTED)이면
   * 파이프라인 단계를 변경하지 않아야 합니다.
   * 
   * Requirements 2.4: 파이프라인 단계가 자동 변경되면 LeadActivity 테이블에 
   * type이 "STATUS_CHANGE"인 활동 기록을 생성해야 합니다.
   * 
   * @param quotationId - 견적서 ID
   * @param newStatus - 새로운 견적서 상태
   * @param userId - 상태 변경을 수행한 사용자 ID (활동 기록용, 선택적)
   * @returns 업데이트된 리드 정보 또는 null (업데이트가 필요 없는 경우)
   */
  async onQuotationStatusChange(
    quotationId: string,
    newStatus: QuotationStatus,
    userId?: string
  ): Promise<Lead | null> {
    // SENT 상태가 아니면 처리하지 않음
    if (newStatus !== QuotationStatus.SENT) {
      return null;
    }

    // 견적서 조회 (연결된 리드 및 생성자 정보 포함)
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        lead: true,
      },
    });

    // 견적서가 없거나 연결된 리드가 없으면 처리하지 않음
    if (!quotation || !quotation.leadId || !quotation.lead) {
      return null;
    }

    const lead = quotation.lead;
    const previousStatus = lead.status;

    // Requirements 2.3: 현재 상태가 PROPOSAL 이전 단계인 경우에만 업데이트
    if (!this.isBeforeProposal(lead.status)) {
      return null;
    }

    // "견적발송" 단계의 PipelineStage 조회
    // code가 'PROPOSAL'인 단계를 찾거나, 없으면 현재 stageId 유지
    const proposalStage = await this.prisma.pipelineStage.findFirst({
      where: {
        OR: [
          { code: 'PROPOSAL' },
          { name: { contains: '견적발송' } },
        ],
        isActive: true,
      },
    });

    // 리드 상태 및 단계 업데이트
    const updatedLead = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.PROPOSAL,
        // 견적발송 단계가 있으면 해당 단계로 업데이트, 없으면 현재 단계 유지
        ...(proposalStage && { stageId: proposalStage.id }),
      },
      include: {
        stage: true,
        customer: true,
      },
    });

    // Requirements 2.4: LeadActivity 생성 (STATUS_CHANGE 활동 기록)
    await this.createStatusChangeActivity(
      lead.id,
      previousStatus,
      LeadStatus.PROPOSAL,
      userId || quotation.userId,
      quotationId
    );

    return updatedLead;
  }

  /**
   * 파이프라인 단계 변경 시 LeadActivity 레코드 생성
   * 
   * Requirements 2.4: 파이프라인 단계가 자동 변경되면 LeadActivity 테이블에 
   * type이 "STATUS_CHANGE"인 활동 기록을 생성해야 합니다.
   * 
   * @param leadId - 리드 ID
   * @param previousStatus - 이전 상태
   * @param newStatus - 새로운 상태
   * @param userId - 활동을 수행한 사용자 ID
   * @param quotationId - 관련 견적서 ID (선택적)
   */
  async createStatusChangeActivity(
    leadId: string,
    previousStatus: LeadStatus,
    newStatus: LeadStatus,
    userId: string,
    quotationId?: string
  ): Promise<void> {
    try {
      await this.prisma.leadActivity.create({
        data: {
          leadId,
          userId,
          type: 'STATUS_CHANGE',
          subject: `파이프라인 단계 변경: ${previousStatus} → ${newStatus}`,
          content: quotationId 
            ? `견적서 발송으로 인한 자동 상태 변경 (견적서 ID: ${quotationId})`
            : `파이프라인 단계가 ${previousStatus}에서 ${newStatus}로 자동 변경되었습니다.`,
          contactedAt: new Date(),
        },
      });
    } catch (error) {
      // 활동 기록 생성 실패는 주요 작업에 영향을 주지 않도록 로그만 기록
      console.error('Failed to create LeadActivity for status change:', error);
    }
  }

  /**
   * 계약서 상태 변경 시 파이프라인 자동화 처리
   * 
   * 계약서가 SIGNED 상태로 변경되면 연결된 리드를 고객으로 전환합니다.
   * (이 메서드는 Task 4에서 구현될 LeadConversionService와 연동됩니다)
   * 
   * @param contractId - 계약서 ID
   * @param newStatus - 새로운 계약서 상태
   */
  async onContractStatusChange(
    contractId: string,
    newStatus: ContractStatus
  ): Promise<void> {
    // SIGNED 상태가 아니면 처리하지 않음
    if (newStatus !== ContractStatus.SIGNED) {
      return;
    }

    // 계약서 조회
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        quotations: {
          include: {
            lead: true,
          },
        },
      },
    });

    if (!contract) {
      return;
    }

    // 계약에 연결된 견적서들의 리드를 찾아서 CONVERTED로 업데이트
    // (실제 고객 전환 로직은 LeadConversionService에서 처리)
    for (const quotation of contract.quotations) {
      if (quotation.lead && quotation.lead.status !== LeadStatus.CONVERTED) {
        await this.prisma.lead.update({
          where: { id: quotation.lead.id },
          data: {
            status: LeadStatus.CONVERTED,
            convertedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * 리드 파이프라인 단계 업데이트
   * 
   * @param leadId - 리드 ID
   * @param stageCode - 단계 코드
   * @returns 업데이트된 리드
   */
  async updateLeadPipelineStage(leadId: string, stageCode: string): Promise<Lead> {
    // 단계 조회
    const stage = await this.prisma.pipelineStage.findFirst({
      where: {
        code: stageCode,
        isActive: true,
      },
    });

    if (!stage) {
      throw new Error(`Pipeline stage with code '${stageCode}' not found`);
    }

    // 리드 업데이트
    const updatedLead = await this.prisma.lead.update({
      where: { id: leadId },
      data: { stageId: stage.id },
      include: {
        stage: true,
        customer: true,
      },
    });

    return updatedLead;
  }
}

// 싱글톤 인스턴스 export
export const pipelineAutomationService = new PipelineAutomationService();

export default PipelineAutomationService;
