# 효력시험 견적서 작성 모듈

이 폴더는 CHEMON 효력시험 견적서 작성 모듈의 복사본입니다.

## 파일 구조

```
efficacy-quotation-module/
├── README.md                          # 이 파일
├── page.tsx                           # 메인 페이지 (app/(dashboard)/efficacy-quotations/new/page.tsx)
├── efficacy.ts                        # 타입 정의 (types/efficacy.ts)
├── efficacyQuotationStore.ts          # Zustand 스토어 (stores/efficacyQuotationStore.ts)
└── components/
    ├── EfficacyQuotationWizard.tsx    # 위자드 진행 표시기
    ├── StepBasicInfo.tsx              # 1단계: 기본 정보 입력
    ├── StepModelSelection.tsx         # 2단계: 모델 선택
    ├── StepItemConfiguration.tsx      # 3단계: 항목 구성
    ├── StepStudyDesign.tsx            # 4단계: 시험 디자인
    ├── StepCalculation.tsx            # 5단계: 금액 계산
    ├── StepPreview.tsx                # 6단계: 미리보기 및 저장
    ├── EfficacyStudyDesignDiagram.tsx # 시험 디자인 다이어그램 (화면용)
    ├── EfficacyStudyDesignPDF.tsx     # 시험 디자인 다이어그램 (PDF용)
    ├── EfficacyQuotationPDF.tsx       # 견적서 PDF 생성
    └── ScheduleTimeline.tsx           # 스케쥴 타임라인 컴포넌트
```

## 주요 기능

### 1. 6단계 위자드 프로세스
- **기본정보**: 고객사, 프로젝트명, 유효기간 입력
- **모델선택**: 22개 효력시험 모델 중 선택
- **항목구성**: 기본/옵션 항목 추가 및 수량 설정
- **시험디자인**: 군 구성 및 스케쥴 설계
- **금액계산**: 카테고리별 소계, VAT, 총액 확인
- **미리보기**: PDF 다운로드 및 저장

### 2. 시험 디자인 다이어그램
- 정보 카드 (시험정보, 동물정보, 투여정보, 기간)
- 전체 타임라인 바
- 군별 상세 타임라인
- 투여/관찰 마커

### 3. PDF 출력
- 견적서 PDF (1페이지)
- 시험 디자인 다이어그램 PDF (2페이지)

## 원본 파일 위치

| 복사본 | 원본 |
|--------|------|
| page.tsx | chemon-quotation/app/(dashboard)/efficacy-quotations/new/page.tsx |
| efficacy.ts | chemon-quotation/types/efficacy.ts |
| efficacyQuotationStore.ts | chemon-quotation/stores/efficacyQuotationStore.ts |
| components/*.tsx | chemon-quotation/components/efficacy-quotation/*.tsx |

## 의존성

- React 18+
- Next.js 14+
- Zustand (상태 관리)
- @react-pdf/renderer (PDF 생성)
- date-fns (날짜 처리)
- lucide-react (아이콘)
- shadcn/ui 컴포넌트
