// backend/src/services/pipelineInitializationService.ts
// 파이프라인 초기화 서비스
// Requirements: 1.1, 1.2, 1.3

import { PrismaClient, PipelineStage, StageTask } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * 기본 태스크 인터페이스
 */
export interface DefaultTask {
  name: string;
  order: number;
  isRequired: boolean;
  description?: string;
}

/**
 * 기본 파이프라인 단계 정의
 * Requirements 1.1: 7개의 파이프라인 단계를 기본값으로 제공
 */
export const DEFAULT_STAGES: { code: string; name: string; color: string; order: number }[] = [
  { code: 'INQUIRY', name: '문의접수', color: '#6B7280', order: 1 },
  { code: 'REVIEW', name: '검토중', color: '#3B82F6', order: 2 },
  { code: 'QUOTATION_SENT', name: '견적발송', color: '#8B5CF6', order: 3 },
  { code: 'NEGOTIATION', name: '계약협의', color: '#F59E0B', order: 4 },
  { code: 'TEST_RECEPTION', name: '시험접수', color: '#10B981', order: 5 },
  { code: 'IN_PROGRESS', name: '시험진행', color: '#06B6D4', order: 6 },
  { code: 'COMPLETED', name: '완료', color: '#22C55E', order: 7 },
];

/**
 * 단계별 기본 태스크 정의
 * Requirements 1.4 ~ 1.10: 각 단계에 맞는 기본 Stage_Task 체크리스트
 */
const DEFAULT_TASKS_BY_STAGE: Record<string, DefaultTask[]> = {
  // Requirements 1.4: 문의접수 단계 태스크
  INQUIRY: [
    { name: '고객 정보 확인', order: 1, isRequired: true, description: '고객사 및 담당자 정보 확인' },
    { name: '문의 내용 기록', order: 2, isRequired: true, description: '문의 내용 상세 기록' },
    { name: '시험 가능 여부 검토', order: 3, isRequired: false, description: '시험 수행 가능 여부 초기 검토' },
  ],
  // Requirements 1.5: 검토중 단계 태스크
  REVIEW: [
    { name: '시험 가능 여부 판단', order: 1, isRequired: true, description: '시험 수행 가능 여부 최종 판단' },
    { name: '담당자 배정', order: 2, isRequired: true, description: '영업 담당자 배정' },
    { name: '예상 일정 산정', order: 3, isRequired: false, description: '시험 예상 일정 산정' },
  ],
  // Requirements 1.6: 견적발송 단계 태스크
  QUOTATION_SENT: [
    { name: '견적서 작성', order: 1, isRequired: true, description: '견적서 작성 완료' },
    { name: '견적서 발송', order: 2, isRequired: true, description: '고객에게 견적서 발송' },
    { name: '고객 회신 대기', order: 3, isRequired: false, description: '고객 회신 대기 및 팔로업' },
  ],
  // Requirements 1.7: 계약협의 단계 태스크
  NEGOTIATION: [
    { name: '계약 조건 협의', order: 1, isRequired: true, description: '계약 조건 협의 진행' },
    { name: '지급 조건 확정', order: 2, isRequired: true, description: '지급 조건 확정' },
    { name: '계약서 초안 작성', order: 3, isRequired: false, description: '계약서 초안 작성' },
  ],
  // Requirements 1.8: 시험접수 단계 태스크
  TEST_RECEPTION: [
    { name: '시험의뢰서 접수', order: 1, isRequired: true, description: '시험의뢰서 접수 완료' },
    { name: '상담기록지 작성', order: 2, isRequired: true, description: '상담기록지 작성 완료' },
    { name: 'PM팀 접수 요청', order: 3, isRequired: true, description: 'PM팀에 시험 접수 요청' },
    { name: '시험번호 발행', order: 4, isRequired: true, description: '시험번호 발행 완료' },
  ],
  // Requirements 1.9: 시험진행 단계 태스크
  IN_PROGRESS: [
    { name: '시험 시작', order: 1, isRequired: true, description: '시험 시작' },
    { name: '중간 보고', order: 2, isRequired: false, description: '중간 진행 상황 보고' },
    { name: '시험 완료', order: 3, isRequired: true, description: '시험 완료' },
  ],
  // Requirements 1.10: 완료 단계 태스크
  COMPLETED: [
    { name: '최종 보고서 발행', order: 1, isRequired: true, description: '최종 보고서 발행 완료' },
    { name: '정산 완료', order: 2, isRequired: true, description: '정산 완료' },
    { name: '고객 피드백 수집', order: 3, isRequired: false, description: '고객 피드백 수집' },
  ],
};

/**
 * PipelineInitializationService
 * 
 * 파이프라인 단계 및 태스크 초기화를 담당하는 서비스입니다.
 * 
 * 주요 기능:
 * - 기본 7개 파이프라인 단계 생성
 * - 각 단계별 기본 태스크 생성
 * - 이미 초기화된 경우 기존 데이터 유지
 */
export class PipelineInitializationService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * 기본 파이프라인 단계 초기화
   * 
   * Requirements 1.2: 시스템이 초기화되면 Pipeline_Stage 테이블에 7개의 기본 단계를 순서대로 생성
   * Requirements 1.3: 각 파이프라인 단계가 생성되면 해당 단계에 맞는 기본 Stage_Task 체크리스트를 함께 생성
   * 
   * @returns 생성된 파이프라인 단계 배열
   * @throws Error 이미 초기화된 경우 또는 DB 오류 발생 시
   */
  async initializeDefaultStages(): Promise<PipelineStage[]> {
    // 이미 초기화되었는지 확인
    const existingStages = await this.prisma.pipelineStage.findMany({
      where: { isDefault: true },
    });

    if (existingStages.length > 0) {
      throw new Error('파이프라인이 이미 초기화되어 있습니다');
    }

    // 트랜잭션으로 모든 단계와 태스크 생성
    const createdStages = await this.prisma.$transaction(async (tx) => {
      const stages: PipelineStage[] = [];

      for (const stageData of DEFAULT_STAGES) {
        // 단계 생성
        const stage = await tx.pipelineStage.create({
          data: {
            code: stageData.code,
            name: stageData.name,
            color: stageData.color,
            order: stageData.order,
            isDefault: true,
            isActive: true,
          },
        });

        // 해당 단계의 기본 태스크 생성
        const defaultTasks = this.getDefaultTasksForStage(stageData.code);
        for (const taskData of defaultTasks) {
          await tx.stageTask.create({
            data: {
              stageId: stage.id,
              name: taskData.name,
              order: taskData.order,
              isRequired: taskData.isRequired,
              description: taskData.description,
              isActive: true,
            },
          });
        }

        stages.push(stage);
      }

      return stages;
    });

    return createdStages;
  }

  /**
   * 특정 단계에 대한 태스크 초기화
   * 
   * @param stageId - 단계 ID
   * @param stageCode - 단계 코드
   * @returns 생성된 태스크 배열
   */
  async initializeStageTasksForStage(stageId: string, stageCode: string): Promise<StageTask[]> {
    const defaultTasks = this.getDefaultTasksForStage(stageCode);

    if (defaultTasks.length === 0) {
      return [];
    }

    // 이미 태스크가 있는지 확인
    const existingTasks = await this.prisma.stageTask.findMany({
      where: { stageId },
    });

    if (existingTasks.length > 0) {
      return existingTasks;
    }

    // 태스크 생성
    const createdTasks: StageTask[] = [];
    for (const taskData of defaultTasks) {
      const task = await this.prisma.stageTask.create({
        data: {
          stageId,
          name: taskData.name,
          order: taskData.order,
          isRequired: taskData.isRequired,
          description: taskData.description,
          isActive: true,
        },
      });
      createdTasks.push(task);
    }

    return createdTasks;
  }

  /**
   * 단계 코드에 해당하는 기본 태스크 목록 반환
   * 
   * @param stageCode - 단계 코드 (INQUIRY, REVIEW, QUOTATION_SENT, NEGOTIATION, TEST_RECEPTION, IN_PROGRESS, COMPLETED)
   * @returns 기본 태스크 배열
   */
  getDefaultTasksForStage(stageCode: string): DefaultTask[] {
    return DEFAULT_TASKS_BY_STAGE[stageCode] || [];
  }

  /**
   * 파이프라인 초기화 상태 확인
   * 
   * @returns 초기화 여부
   */
  async isInitialized(): Promise<boolean> {
    const count = await this.prisma.pipelineStage.count({
      where: { isDefault: true },
    });
    return count > 0;
  }

  /**
   * 모든 파이프라인 단계 조회 (태스크 포함)
   * 
   * @returns 파이프라인 단계 배열 (태스크 포함)
   */
  async getAllStagesWithTasks(): Promise<(PipelineStage & { tasks: StageTask[] })[]> {
    return this.prisma.pipelineStage.findMany({
      where: { isActive: true },
      include: { tasks: { where: { isActive: true }, orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * 단계 코드로 단계 조회
   * 
   * @param code - 단계 코드
   * @returns 파이프라인 단계 또는 null
   */
  async getStageByCode(code: string): Promise<PipelineStage | null> {
    return this.prisma.pipelineStage.findFirst({
      where: { code, isActive: true },
    });
  }
}

// 싱글톤 인스턴스 export
export const pipelineInitializationService = new PipelineInitializationService();

export default PipelineInitializationService;
