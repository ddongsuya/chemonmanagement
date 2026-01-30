# 요구사항 문서

## 소개

본 문서는 견적 관리 시스템의 리드(Lead)와 고객(Customer) 관리를 통합된 CRM 플로우로 연결하는 기능에 대한 요구사항을 정의합니다. 현재 시스템에서 리드 등록과 견적서 작성 시 고객 등록이 분리되어 있어 발생하는 워크플로우 문제를 해결하고, 리드에서 고객으로의 자연스러운 전환 프로세스를 구현합니다.

## 용어집

- **System**: 견적 관리 시스템 전체
- **Lead**: 잠재 고객 정보 (문의 단계의 고객)
- **Customer**: 계약이 체결된 실제 고객
- **Quotation**: 견적서
- **Contract**: 계약서
- **Pipeline_Stage**: 리드의 영업 진행 단계 (문의접수, 검토, 견적발송, 협상, 계약전환 등)
- **Customer_Grade**: 고객 등급 (LEAD, PROSPECT, CUSTOMER, VIP, INACTIVE)
- **Customer_Selector**: 견적서 작성 시 고객을 선택하는 UI 컴포넌트
- **Lead_Form**: 리드 등록에 사용되는 상세 입력 폼
- **Customer_List**: 고객 목록 화면

## 요구사항

### 요구사항 1: 견적서 작성 시 고객 선택 통합

**사용자 스토리:** 영업 담당자로서, 견적서 작성 시 기존 고객 또는 리드 목록에서 선택하거나 상세 정보로 신규 고객을 등록할 수 있어야 합니다. 이를 통해 리드 정보를 활용한 일관된 고객 관리가 가능합니다.

#### 인수 조건

1. WHEN 사용자가 견적서 작성 화면에서 고객 선택 영역에 접근하면 THEN THE Customer_Selector SHALL "기존 고객", "리드 목록" 두 가지 탭을 표시해야 합니다
2. WHEN 사용자가 "기존 고객" 탭을 선택하면 THEN THE Customer_Selector SHALL Customer 테이블에서 grade가 CUSTOMER 이상인 고객 목록을 표시해야 합니다
3. WHEN 사용자가 "리드 목록" 탭을 선택하면 THEN THE Customer_Selector SHALL Lead 테이블에서 status가 CONVERTED가 아닌 리드 목록을 표시해야 합니다
4. WHEN 사용자가 리드를 선택하면 THEN THE System SHALL 해당 리드의 companyName, contactName, contactEmail, contactPhone 정보를 견적서에 자동으로 채워야 합니다
5. WHEN 사용자가 신규 고객 등록 버튼을 클릭하면 THEN THE System SHALL Lead_Form과 동일한 상세 입력 폼(회사명, 담당자명, 직책, 부서, 연락처, 이메일, 유입경로, 문의유형, 예상금액, 예상계약일)을 표시해야 합니다
6. WHEN 사용자가 신규 고객 상세 폼을 제출하면 THEN THE System SHALL Lead 테이블에 새 레코드를 생성하고 해당 리드를 견적서에 연결해야 합니다

### 요구사항 2: 견적서 발송 시 파이프라인 단계 자동 업데이트

**사용자 스토리:** 영업 담당자로서, 리드에게 견적서를 발송하면 해당 리드의 파이프라인 단계가 자동으로 "견적발송(PROPOSAL)"으로 변경되어야 합니다. 이를 통해 수동 상태 관리 없이 정확한 영업 현황을 파악할 수 있습니다.

#### 인수 조건

1. WHEN 견적서 상태가 SENT로 변경되고 해당 견적서에 연결된 리드가 존재하면 THEN THE System SHALL 해당 리드의 status를 PROPOSAL로 자동 업데이트해야 합니다
2. WHEN 리드의 status가 PROPOSAL로 변경되면 THEN THE System SHALL 해당 리드의 stageId를 "견적발송" 단계의 PipelineStage ID로 업데이트해야 합니다
3. IF 리드의 현재 status가 PROPOSAL보다 진행된 단계(NEGOTIATION, CONVERTED)이면 THEN THE System SHALL 파이프라인 단계를 변경하지 않아야 합니다
4. WHEN 파이프라인 단계가 자동 변경되면 THEN THE System SHALL LeadActivity 테이블에 type이 "STATUS_CHANGE"인 활동 기록을 생성해야 합니다

### 요구사항 3: 계약 체결 시 리드에서 고객으로 자동 전환

**사용자 스토리:** 영업 담당자로서, 계약이 체결되면 리드가 자동으로 고객으로 전환되어 모든 리드 정보가 고객 레코드에 보존되어야 합니다. 이를 통해 데이터 손실 없이 고객 이력을 관리할 수 있습니다.

#### 인수 조건

1. WHEN 계약서 상태가 SIGNED로 변경되고 해당 계약에 연결된 리드가 존재하면 THEN THE System SHALL 해당 리드의 status를 CONVERTED로 변경해야 합니다
2. WHEN 리드가 CONVERTED 상태로 변경되면 THEN THE System SHALL Customer 테이블에 새 레코드를 생성하고 리드의 모든 정보(companyName→company, contactName→name, contactEmail→email, contactPhone→phone, department, position)를 복사해야 합니다
3. WHEN 새 Customer 레코드가 생성되면 THEN THE System SHALL 해당 Customer의 grade를 CUSTOMER로 설정해야 합니다
4. WHEN 리드가 고객으로 전환되면 THEN THE System SHALL Lead 테이블의 customerId 필드에 새로 생성된 Customer ID를 저장하고 convertedAt에 현재 시간을 기록해야 합니다
5. WHEN 리드가 고객으로 전환되면 THEN THE System SHALL 기존 리드에 연결된 모든 견적서(Quotation)의 customerId를 새로 생성된 Customer ID로 업데이트해야 합니다
6. IF 리드에 이미 연결된 Customer가 존재하면 THEN THE System SHALL 새 Customer를 생성하지 않고 기존 Customer의 정보를 업데이트해야 합니다

### 요구사항 4: 고객 목록에서 상태/유형 표시 및 필터링

**사용자 스토리:** 영업 담당자로서, 고객 목록에서 각 고객의 유형(리드/잠재고객/기존고객)을 확인하고 상태별로 필터링할 수 있어야 합니다. 이를 통해 영업 단계별 고객 관리가 용이해집니다.

#### 인수 조건

1. WHEN 사용자가 고객 목록 화면에 접근하면 THEN THE Customer_List SHALL 각 고객 카드에 grade에 따른 상태 배지(LEAD: "리드", PROSPECT: "잠재고객", CUSTOMER: "고객", VIP: "VIP")를 표시해야 합니다
2. WHEN 고객 목록이 표시되면 THEN THE Customer_List SHALL 상태 필터 드롭다운(전체, 리드, 잠재고객, 고객, VIP, 비활성)을 제공해야 합니다
3. WHEN 사용자가 특정 상태 필터를 선택하면 THEN THE Customer_List SHALL 해당 grade를 가진 고객만 표시해야 합니다
4. WHEN 고객 카드가 표시되면 THEN THE Customer_List SHALL 해당 고객과 연결된 리드가 있는 경우 리드의 source(유입경로) 정보를 함께 표시해야 합니다
5. WHEN 고객 목록 API가 호출되면 THEN THE System SHALL grade 파라미터를 지원하여 서버 측 필터링을 수행해야 합니다

### 요구사항 5: 리드와 고객 데이터 연동

**사용자 스토리:** 시스템 관리자로서, 리드와 고객 데이터가 양방향으로 연동되어 데이터 일관성이 유지되어야 합니다. 이를 통해 중복 데이터 없이 통합된 고객 정보를 관리할 수 있습니다.

#### 인수 조건

1. WHEN 리드 정보가 수정되고 해당 리드에 연결된 Customer가 존재하면 THEN THE System SHALL Customer의 관련 필드(name, company, email, phone)도 함께 업데이트해야 합니다
2. WHEN Customer 정보가 수정되고 해당 Customer에 연결된 Lead가 존재하면 THEN THE System SHALL Lead의 관련 필드(contactName, companyName, contactEmail, contactPhone)도 함께 업데이트해야 합니다
3. WHEN 리드 또는 고객 정보가 동기화되면 THEN THE System SHALL ActivityLog 테이블에 action이 "SYNC"인 로그를 기록해야 합니다
4. IF 동기화 중 충돌이 발생하면(양쪽 모두 수정된 경우) THEN THE System SHALL 가장 최근에 수정된 데이터를 우선 적용하고 충돌 내역을 로그에 기록해야 합니다
