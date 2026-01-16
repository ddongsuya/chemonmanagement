/**
 * 상담기록지 데이터 타입 정의
 */

// 상담기록지 생성에 필요한 전체 데이터
export interface ConsultationRecordData {
  // 기본 정보
  basic: {
    substanceName: string;           // 시험 물질 명
    authorName: string;              // 상담기록지 작성 담당자명
    clientCompany: string;           // 고객사명
    clientContact: string;           // 고객사 담당자명
    clientTel: string;               // 고객사 담당자 연락처
    clientEmail: string;             // 고객사 담당자 이메일
    substanceDeliveryDate: string;   // 시험물질 제공 예상 일자
  };

  // 시험의 종류
  testTypes: {
    toxicity: string;                // 독성시험
    genotoxicity: string;            // 유전독성
    efficacy: string;                // 약효시험
    safetyPharmacology: string;      // 일반약리/안전성약리
    hematology: string;              // 혈액검사
    histopathology: string;          // 조직병리검사
    analysis: string;                // 분석시험
    others: string;                  // 기타
  };

  // 시험계 (동물 종)
  animals: {
    rodent: string;                  // 설치류
    nonRodent: string;               // 비설치류
    rabbit: string;                  // 토끼
    guineaPig: string;               // 기니픽
    others: string;                  // 기타
  };

  // 시험물질 정보
  substance: {
    type: string;                    // 시험물질 종류
    indication: string;              // 적응증
    administrationRoute: string;     // 투여경로
    clinicalDuration: string;        // 임상투여기간
    storageCondition: string;        // 보관조건
    otherInfo: string;               // 기타
  };

  // 다지점시험
  multiSite: {
    isMultiSite: string;             // 다지점시험여부 (있음/없음)
    delegationScope: string;         // 위임범위(시험항목)
    siteInfo: string;                // 다지점시험장소, 담당자 연락처
  };

  // 자료 보관기간
  retentionPeriod: string;

  // 상담 내역 (최대 5건)
  consultations: ConsultationEntry[];
}

// 상담 내역 항목
export interface ConsultationEntry {
  date: string;                      // 상담 날짜
  consultant: string;                // 상담자
  content: string;                   // 상담 내용
}

// 견적내용 시트용 (가격 제외)
export interface QuotationContentItem {
  no: number;                        // 순번
  testName: string;                  // 시험명
  species: string;                   // 동물종
  duration: string;                  // 투여기간
  route: string;                     // 투여경로
  animalCount: string;               // 동물수
  groupCount: string;                // 군수
  options: string;                   // 옵션
  remarks: string;                   // 비고
}

// 상담기록지 폼 데이터
export interface ConsultationFormData {
  // 기본 정보
  substanceName: string;
  authorName: string;
  substanceDeliveryDate: string;
  
  // 시험물질 정보
  substanceType: string;
  indication: string;
  administrationRoute: string;
  clinicalDuration: string;
  storageCondition: string;
  otherInfo: string;
  
  // 다지점시험
  isMultiSite: string;
  delegationScope: string;
  siteInfo: string;
  
  // 자료 보관기간
  retentionPeriod: string;
  
  // 상담 내역
  consultations: ConsultationEntry[];
}
