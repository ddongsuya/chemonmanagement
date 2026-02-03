# 요구사항 문서

## 소개

본 문서는 CHEMON 견적관리시스템의 통합 견적서 코드 시스템에 대한 요구사항을 정의합니다. 현재 독성시험, 효력시험, 임상병리시험 등 시험 유형별로 분리되어 있는 견적서 번호 체계를 통합하고, 리드 번호의 접두사도 사용자 설정 견적서 코드를 따르도록 개선합니다. 또한 사용자 간 견적서 코드 중복을 방지하는 유효성 검사를 추가합니다.

## 용어집

- **Quotation_Code_System**: 견적서 번호 및 리드 번호 생성을 관리하는 통합 시스템
- **User_Code**: 사용자별 고유 견적서 코드 (2글자 영문, 예: DL, PK, KS)
- **Quotation_Number**: 견적서 번호 (형식: YY-UC-MM-NNNN, 예: 26-DL-01-0001)
- **Lead_Number**: 리드 번호 (형식: UC-YYYY-NNNN, 예: DL-2025-0001)
- **Toxicity_Quotation**: 독성시험 견적서
- **Efficacy_Quotation**: 효력시험 견적서
- **Clinical_Quotation**: 임상병리시험 견적서
- **Preview_Page**: 견적서 미리보기 페이지
- **Settings_Page**: 사용자 설정 페이지
- **Company_Info**: 회사 정보 (회사명, 주소, 연락처 등)

## 요구사항

### 요구사항 1: 통합 견적서 번호 시스템

**사용자 스토리:** 영업 담당자로서, 모든 시험 유형(독성, 효력, 임상병리)의 견적서가 동일한 번호 체계를 공유해야 합니다. 이를 통해 견적서 번호의 일관성을 유지하고 관리를 단순화할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 독성시험 견적서를 생성하면 THEN THE Quotation_Code_System SHALL 사용자의 User_Code를 사용하여 Quotation_Number를 생성해야 합니다
2. WHEN 사용자가 효력시험 견적서를 생성하면 THEN THE Quotation_Code_System SHALL 독성시험과 동일한 번호 체계(YY-UC-MM-NNNN)로 Quotation_Number를 생성해야 합니다
3. WHEN 사용자가 임상병리시험 견적서를 생성하면 THEN THE Quotation_Code_System SHALL 독성시험과 동일한 번호 체계로 Quotation_Number를 생성해야 합니다
4. WHEN 동일 사용자가 같은 월에 여러 유형의 견적서를 생성하면 THEN THE Quotation_Code_System SHALL 시험 유형에 관계없이 일련번호를 순차적으로 증가시켜야 합니다
5. WHEN 견적서 번호가 생성되면 THEN THE Quotation_Code_System SHALL 해당 사용자의 next_quotation_seq를 1 증가시켜야 합니다

### 요구사항 2: 효력시험 견적서 미리보기 통합

**사용자 스토리:** 영업 담당자로서, 효력시험 견적서 미리보기 페이지에서도 독성시험 견적서와 동일하게 견적번호, 회사 정보가 표시되어야 합니다. 이를 통해 일관된 견적서 형식을 제공할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 효력시험 견적서 미리보기를 요청하면 THEN THE Preview_Page SHALL 견적번호를 헤더 영역에 표시해야 합니다
2. WHEN 효력시험 견적서 미리보기가 표시되면 THEN THE Preview_Page SHALL Company_Info에서 회사명, 주소, 연락처, 로고를 로드하여 표시해야 합니다
3. WHEN 효력시험 견적서 미리보기가 표시되면 THEN THE Preview_Page SHALL 독성시험 견적서와 동일한 레이아웃 구조(헤더, 고객정보, 항목목록, 금액, 푸터)를 사용해야 합니다
4. WHEN 효력시험 견적서를 PDF로 내보내면 THEN THE Quotation_Code_System SHALL 견적번호와 회사 정보가 포함된 PDF를 생성해야 합니다
5. WHEN 임상병리시험 견적서 미리보기가 표시되면 THEN THE Preview_Page SHALL 독성시험 견적서와 동일한 형식으로 견적번호와 회사 정보를 표시해야 합니다

### 요구사항 3: 리드 번호 코드 통일

**사용자 스토리:** 영업 담당자로서, 리드 번호의 접두사가 기존 "LD" 대신 사용자가 설정한 견적서 코드를 따라야 합니다. 이를 통해 리드와 견적서 간의 연관성을 명확히 할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 새 리드를 생성하면 THEN THE Quotation_Code_System SHALL 사용자의 User_Code를 접두사로 사용하여 Lead_Number를 생성해야 합니다 (형식: UC-YYYY-NNNN)
2. WHEN User_Code가 "DL"인 사용자가 리드를 생성하면 THEN THE Quotation_Code_System SHALL "DL-2025-0001" 형식의 Lead_Number를 생성해야 합니다
3. WHEN 리드 번호가 생성되면 THEN THE Quotation_Code_System SHALL 해당 사용자의 리드 일련번호를 1 증가시켜야 합니다
4. IF 사용자의 User_Code가 설정되지 않은 상태에서 리드 생성을 시도하면 THEN THE Quotation_Code_System SHALL "견적서 코드가 설정되지 않았습니다" 오류 메시지를 표시해야 합니다
5. WHEN 기존 리드 목록을 조회하면 THEN THE Quotation_Code_System SHALL 각 리드의 Lead_Number를 해당 리드 생성 시점의 형식으로 표시해야 합니다

### 요구사항 4: 견적서 코드 중복 방지

**사용자 스토리:** 시스템 관리자로서, 사용자 간 견적서 코드가 중복되지 않도록 유효성 검사가 필요합니다. 이를 통해 견적서 번호의 고유성을 보장할 수 있습니다.

#### 인수 조건

1. WHEN 사용자가 새 User_Code를 설정하려고 하면 THEN THE Quotation_Code_System SHALL 다른 사용자가 이미 사용 중인 코드인지 확인해야 합니다
2. IF 입력한 User_Code가 다른 사용자에 의해 이미 사용 중이면 THEN THE Quotation_Code_System SHALL "이미 사용 중인 견적서 코드입니다" 오류 메시지를 표시하고 저장을 거부해야 합니다
3. WHEN User_Code 중복 검사를 수행하면 THEN THE Quotation_Code_System SHALL 대소문자를 구분하지 않고 비교해야 합니다 (DL과 dl은 동일한 코드로 처리)
4. WHEN 사용자가 User_Code 입력 필드에 값을 입력하면 THEN THE Settings_Page SHALL 실시간으로 중복 여부를 확인하고 피드백을 제공해야 합니다
5. WHEN 사용자가 자신의 기존 User_Code와 동일한 값을 입력하면 THEN THE Quotation_Code_System SHALL 중복 오류 없이 저장을 허용해야 합니다
6. THE Quotation_Code_System SHALL User_Code를 저장할 때 항상 대문자로 변환하여 저장해야 합니다

### 요구사항 5: 견적서 코드 관리 기능 통합

**사용자 스토리:** 영업 담당자로서, 모든 시험 유형의 견적서 작성 화면에서 동일한 견적서 코드 설정 및 관리 기능을 사용할 수 있어야 합니다.

#### 인수 조건

1. WHEN 사용자가 효력시험 견적서 작성 화면에 접근하면 THEN THE Quotation_Code_System SHALL User_Code 설정 여부를 확인하고 미설정 시 설정 안내를 표시해야 합니다
2. WHEN 사용자가 임상병리시험 견적서 작성 화면에 접근하면 THEN THE Quotation_Code_System SHALL User_Code 설정 여부를 확인하고 미설정 시 설정 안내를 표시해야 합니다
3. WHEN User_Code가 미설정된 상태에서 견적서 작성을 시도하면 THEN THE Quotation_Code_System SHALL 설정 페이지로 이동하는 링크와 함께 안내 메시지를 표시해야 합니다
4. WHEN 사용자가 설정 페이지에서 User_Code를 변경하면 THEN THE Quotation_Code_System SHALL 변경 후 생성되는 모든 견적서와 리드에 새 코드를 적용해야 합니다
5. WHEN User_Code가 변경되면 THEN THE Quotation_Code_System SHALL 기존에 생성된 견적서와 리드의 번호는 변경하지 않아야 합니다

