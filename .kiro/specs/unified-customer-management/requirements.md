# 요구사항 문서

## 소개

본 문서는 고객사 관리 페이지에서 리드(Lead)와 고객(Customer)을 통합하여 표시하는 기능에 대한 요구사항을 정의합니다. 현재 시스템에서는 리드 관리(/leads)와 고객사 관리(/customers)가 분리되어 있으나, 리드 단계부터 고객사 관리가 이루어져야 한다는 비즈니스 요구에 따라 두 데이터를 하나의 통합된 뷰에서 관리할 수 있도록 합니다.

## 용어집

- **System**: 견적 관리 시스템 전체
- **Lead**: 잠재 고객 정보 (문의 단계의 고객)
- **Customer**: 계약이 체결된 실제 고객
- **Unified_Customer_List**: 리드와 고객을 통합하여 표시하는 페이지
- **Pipeline_Stage**: 리드의 영업 진행 단계 (문의접수, 검토, 견적발송, 계약협의, 시험접수, 진행, 완료 등)
- **Unified_Entity**: 리드 또는 고객을 통합된 형태로 표현하는 데이터 구조
- **Stage_Filter**: 파이프라인 단계별 필터링 기능
- **Entity_Type**: 항목의 유형 (LEAD 또는 CUSTOMER)

## 요구사항

### 요구사항 1: 통합 고객사 목록 표시

**사용자 스토리:** 영업 담당자로서, 고객사 관리 페이지에서 리드와 고객을 모두 한 화면에서 확인할 수 있어야 합니다. 이를 통해 리드 단계부터 고객 전환까지 전체 고객 관계를 일관되게 관리할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 고객사 관리 페이지에 접근하면 THEN THE Unified_Customer_List SHALL Lead 테이블과 Customer 테이블의 데이터를 통합하여 표시해야 합니다
2. WHEN 통합 목록이 표시되면 THEN THE Unified_Customer_List SHALL 각 항목에 유형 배지(리드/고객)를 표시해야 합니다
3. WHEN 리드 항목이 표시되면 THEN THE Unified_Customer_List SHALL 해당 리드의 companyName, contactName, contactEmail, contactPhone, stage 정보를 표시해야 합니다
4. WHEN 고객 항목이 표시되면 THEN THE Unified_Customer_List SHALL 해당 고객의 company, name, email, phone, grade 정보를 표시해야 합니다
5. WHEN 통합 목록이 로드되면 THEN THE System SHALL 최신 업데이트 순으로 정렬하여 표시해야 합니다

### 요구사항 2: 파이프라인 단계 표시

**사용자 스토리:** 영업 담당자로서, 각 항목의 현재 파이프라인 단계를 한눈에 확인할 수 있어야 합니다. 이를 통해 영업 진행 상황을 빠르게 파악할 수 있습니다.

#### 인수 조건

1. WHEN 리드 항목이 표시되면 THEN THE Unified_Customer_List SHALL 해당 리드의 PipelineStage 이름과 색상을 배지로 표시해야 합니다
2. WHEN 고객 항목이 표시되면 THEN THE Unified_Customer_List SHALL 해당 고객의 grade에 따른 단계(계약완료, VIP 등)를 배지로 표시해야 합니다
3. WHEN 리드가 CONVERTED 상태이면 THEN THE Unified_Customer_List SHALL "계약전환" 단계를 표시해야 합니다
4. WHEN 파이프라인 단계 배지가 표시되면 THEN THE System SHALL PipelineStage 테이블에 정의된 color 값을 사용해야 합니다

### 요구사항 3: 파이프라인 단계별 필터링

**사용자 스토리:** 영업 담당자로서, 특정 파이프라인 단계의 항목만 필터링하여 볼 수 있어야 합니다. 이를 통해 특정 단계에 집중하여 업무를 처리할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 고객사 관리 페이지에 접근하면 THEN THE Stage_Filter SHALL 모든 파이프라인 단계 옵션(문의접수, 검토, 견적발송, 계약협의, 시험접수, 진행, 완료, 계약전환)을 표시해야 합니다
2. WHEN 사용자가 특정 파이프라인 단계를 선택하면 THEN THE Unified_Customer_List SHALL 해당 단계에 해당하는 리드만 표시해야 합니다
3. WHEN 사용자가 "계약전환" 또는 "고객" 필터를 선택하면 THEN THE Unified_Customer_List SHALL Customer 테이블의 데이터만 표시해야 합니다
4. WHEN 사용자가 "전체" 필터를 선택하면 THEN THE Unified_Customer_List SHALL 모든 리드와 고객을 표시해야 합니다
5. WHEN 필터가 적용되면 THEN THE System SHALL URL 쿼리 파라미터에 필터 상태를 반영해야 합니다

### 요구사항 4: 유형별 필터링

**사용자 스토리:** 영업 담당자로서, 리드만 또는 고객만 필터링하여 볼 수 있어야 합니다. 이를 통해 특정 유형의 항목에 집중할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 고객사 관리 페이지에 접근하면 THEN THE System SHALL 유형 필터(전체, 리드, 고객)를 제공해야 합니다
2. WHEN 사용자가 "리드" 유형 필터를 선택하면 THEN THE Unified_Customer_List SHALL Lead 테이블의 데이터만 표시해야 합니다
3. WHEN 사용자가 "고객" 유형 필터를 선택하면 THEN THE Unified_Customer_List SHALL Customer 테이블의 데이터만 표시해야 합니다
4. WHEN 유형 필터와 단계 필터가 동시에 적용되면 THEN THE System SHALL 두 조건을 모두 만족하는 항목만 표시해야 합니다

### 요구사항 5: 통합 검색 기능

**사용자 스토리:** 영업 담당자로서, 회사명, 담당자명, 연락처로 리드와 고객을 통합 검색할 수 있어야 합니다. 이를 통해 원하는 항목을 빠르게 찾을 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 검색어를 입력하면 THEN THE System SHALL 리드의 companyName, contactName, contactEmail, contactPhone과 고객의 company, name, email, phone 필드에서 검색해야 합니다
2. WHEN 검색이 수행되면 THEN THE System SHALL 검색어와 일치하는 모든 리드와 고객을 표시해야 합니다
3. WHEN 검색어와 필터가 동시에 적용되면 THEN THE System SHALL 두 조건을 모두 만족하는 항목만 표시해야 합니다

### 요구사항 6: 통합 API 엔드포인트

**사용자 스토리:** 시스템 개발자로서, 리드와 고객 데이터를 통합하여 조회하는 API가 필요합니다. 이를 통해 프론트엔드에서 효율적으로 데이터를 로드할 수 있습니다.

#### 인수 조건

1. THE System SHALL GET /api/unified-customers 엔드포인트를 제공해야 합니다
2. WHEN API가 호출되면 THEN THE System SHALL Lead와 Customer 데이터를 통합된 형식(Unified_Entity)으로 반환해야 합니다
3. WHEN API에 stageId 파라미터가 전달되면 THEN THE System SHALL 해당 파이프라인 단계의 리드만 필터링해야 합니다
4. WHEN API에 type 파라미터가 전달되면 THEN THE System SHALL 해당 유형(lead/customer)의 데이터만 반환해야 합니다
5. WHEN API에 search 파라미터가 전달되면 THEN THE System SHALL 검색어와 일치하는 항목만 반환해야 합니다
6. WHEN API 응답이 반환되면 THEN THE System SHALL 각 항목에 entityType(LEAD/CUSTOMER), displayStage(표시용 단계명), stageColor(단계 색상) 필드를 포함해야 합니다

### 요구사항 7: 통합 통계 표시

**사용자 스토리:** 영업 담당자로서, 통합 고객사 목록의 통계(총 항목 수, 리드 수, 고객 수, 단계별 분포)를 확인할 수 있어야 합니다. 이를 통해 전체 영업 현황을 파악할 수 있습니다.

#### 인수 조건

1. WHEN 통합 고객사 목록이 표시되면 THEN THE System SHALL 총 항목 수(리드 + 고객)를 표시해야 합니다
2. WHEN 통합 고객사 목록이 표시되면 THEN THE System SHALL 리드 수와 고객 수를 각각 표시해야 합니다
3. WHEN 통합 고객사 목록이 표시되면 THEN THE System SHALL 파이프라인 단계별 항목 수를 표시해야 합니다
4. WHEN 필터가 적용되면 THEN THE System SHALL 필터링된 결과에 대한 통계를 표시해야 합니다

### 요구사항 8: 항목 상세 페이지 연결

**사용자 스토리:** 영업 담당자로서, 통합 목록에서 항목을 클릭하면 해당 항목의 상세 페이지로 이동할 수 있어야 합니다. 이를 통해 상세 정보를 확인하고 관리할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 리드 항목을 클릭하면 THEN THE System SHALL /leads/{leadId} 페이지로 이동해야 합니다
2. WHEN 사용자가 고객 항목을 클릭하면 THEN THE System SHALL /customers/{customerId} 상세 모달 또는 페이지를 표시해야 합니다
3. WHEN 항목 상세 페이지에서 뒤로가기를 하면 THEN THE System SHALL 이전 필터 상태가 유지된 통합 목록으로 돌아가야 합니다
