# 구현 계획: Stitch Amber Curator 디자인 시스템 전면 적용

## 개요

이미 완료된 globals.css, Sidebar, Header, Dashboard, StatsCard, SalesDashboard KPI, Login을 제외한 나머지 18개 페이지/컴포넌트에 Stitch Amber Curator 디자인 토큰을 적용합니다. 우선순위는 고빈도 사용 페이지(견적, 고객, 리드, 파이프라인) → 보조 페이지 순서로 진행합니다. 기능 로직은 변경하지 않고 className만 교체합니다.

## Tasks

- [x] 1. Stitch 공유 컴포넌트 생성
  - [x] 1.1 StitchCard, StitchBadge, StitchPageHeader 공유 컴포넌트 생성
    - `chemon-quotation/components/ui/StitchCard.tsx` 생성: variant별 Surface_Hierarchy 배경색, hover 트랜지션, No-Line Rule 적용
    - `chemon-quotation/components/ui/StitchBadge.tsx` 생성: Pill_Badge 스타일(rounded-full, uppercase, tracking-wider), STATUS_BADGE_MAP 색상 매핑
    - `chemon-quotation/components/ui/StitchPageHeader.tsx` 생성: Editorial_Typography 라벨(text-[10px] uppercase tracking-widest) + 제목(font-extrabold tracking-tight)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8_

  - [x] 1.2 StitchTable, StitchInput 공유 컴포넌트 생성
    - `chemon-quotation/components/ui/StitchTable.tsx` 생성: tonal layering 행 구분, editorial 헤더, hover:bg-[#FFF8F1]
    - `chemon-quotation/components/ui/StitchInput.tsx` 생성: border-none, rounded-xl, focus:ring-2 ring-primary/40, 에러 상태 처리
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 1.3 공유 컴포넌트 Property 테스트 작성
    - **Property 1: No-Line Rule 준수** — StitchCard, StitchTable 렌더 결과에 border-border, border-b 등 레이아웃 보더 클래스 부재 확인
    - **Validates: Requirements 2.1, 9.4**
    - **Property 2: Surface Hierarchy 배경색 일관성** — StitchCard variant별 배경색이 5개 Surface 색상 중 하나에 해당하는지 확인
    - **Validates: Requirements 1.2, 3.5**
    - **Property 3: Badge Pill 스타일 일관성** — StitchBadge 렌더 결과에 rounded-full, uppercase, tracking-wider, font-bold, text-xs 포함 확인
    - **Validates: Requirements 1.4, 5.1, 5.2, 5.3**

- [x] 2. 체크포인트 — 공유 컴포넌트 검증
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의합니다.


- [x] 3. [고빈도] 견적 목록 및 작성 페이지 Stitch 적용
  - [x] 3.1 독성 견적 목록/상세 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/quotations/page.tsx` — 테이블을 StitchTable로, 상태 뱃지를 StitchBadge로, 페이지 헤더를 StitchPageHeader로 변환
    - `chemon-quotation/app/(dashboard)/quotations/[id]/page.tsx` — 상세 뷰 카드를 StitchCard로, 라벨을 Editorial_Typography로 변환
    - _Requirements: 7.1, 7.2, 10.1, 10.4_

  - [x] 3.2 독성 견적 작성 위자드 Stitch 적용
    - `chemon-quotation/app/(dashboard)/quotations/new/page.tsx` — 위자드 컨테이너 Stitch 스타일 적용
    - `chemon-quotation/components/quotation/QuotationWizard.tsx` — 스텝 네비게이션, 폼 섹션을 surface-low StitchCard로 변환
    - `chemon-quotation/components/quotation/StepBasicInfo.tsx` — 인풋을 StitchInput, 라벨을 Editorial_Typography로 변환
    - `chemon-quotation/components/quotation/StepTestSelection.tsx`, `StepTestSelectionNew.tsx` — 시험 선택 카드를 StitchCard로 변환
    - `chemon-quotation/components/quotation/StepCalculation.tsx` — 계산 결과 영역 Surface_Hierarchy 적용
    - `chemon-quotation/components/quotation/StepPreview.tsx` — 미리보기 카드 Stitch 스타일 적용
    - `chemon-quotation/components/quotation/StepModality.tsx` — 모달리티 선택 영역 Stitch 적용
    - _Requirements: 6.1, 6.4, 6.5, 8.1, 10.2, 10.3_

  - [x] 3.3 견적 보조 컴포넌트 Stitch 적용
    - `chemon-quotation/components/quotation/CustomerSelector.tsx` — 고객 선택 드롭다운 Stitch 스타일
    - `chemon-quotation/components/quotation/DetailedCustomerForm.tsx` — 폼 인풋 StitchInput 적용
    - `chemon-quotation/components/quotation/TestCard.tsx` — 시험 카드 StitchCard 적용
    - `chemon-quotation/components/quotation/SelectedTestList.tsx` — 선택된 시험 목록 tonal layering
    - `chemon-quotation/components/quotation/UnifiedQuotationPreview.tsx` — 통합 미리보기 Stitch 적용
    - `chemon-quotation/components/quotation/DeleteConfirmDialog.tsx` — 다이얼로그 surface-highest 배경
    - _Requirements: 3.4, 5.4, 6.1, 10.2_

- [x] 4. [고빈도] 효능 견적 페이지 Stitch 적용
  - [x] 4.1 효능 견적 목록/작성 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/efficacy-quotations/page.tsx` — 목록 테이블 StitchTable, 뱃지 StitchBadge
    - `chemon-quotation/app/(dashboard)/efficacy-quotations/new/page.tsx` — 위자드 컨테이너 Stitch 적용
    - `chemon-quotation/app/(dashboard)/efficacy-quotations/[id]/page.tsx` — 상세 뷰 StitchCard
    - `chemon-quotation/components/efficacy-quotation/StepBasicInfo.tsx` — 폼 인풋 StitchInput
    - `chemon-quotation/components/efficacy-quotation/ScheduleTimeline.tsx` — 타임라인 Stitch 스타일
    - `chemon-quotation/components/efficacy-quotation/EfficacyStudyDesignDiagram.tsx` — 다이어그램 영역 Surface_Hierarchy
    - _Requirements: 6.1, 8.1, 10.1, 10.2, 10.3_

  - [x] 4.2 독성 V2 견적 컴포넌트 Stitch 적용
    - `chemon-quotation/components/toxicity-v2/ModeSelector.tsx` — 모드 선택 카드 StitchCard
    - `chemon-quotation/components/toxicity-v2/V2TestSelector.tsx` — 시험 선택 영역 tonal layering
    - `chemon-quotation/components/toxicity-v2/PriceOptionBar.tsx` — 가격 옵션 바 Stitch 스타일
    - `chemon-quotation/components/toxicity-v2/StepCalculationV2.tsx` — 계산 영역 Surface_Hierarchy
    - `chemon-quotation/components/toxicity-v2/StepPreviewV2.tsx` — 미리보기 Stitch 적용
    - `chemon-quotation/components/toxicity-v2/PreviewPanel.tsx`, `PreviewDetail.tsx`, `PreviewQuote.tsx` — 미리보기 패널 StitchCard
    - `chemon-quotation/components/toxicity-v2/TestRelationPanel.tsx` — 시험 관계 패널 Stitch 적용
    - _Requirements: 2.1, 3.2, 4.1, 10.2_

- [x] 5. 체크포인트 — 견적 페이지 검증
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의합니다.


- [x] 6. [고빈도] 고객사 목록/상세 페이지 Stitch 적용
  - [x] 6.1 고객사 목록 페이지 및 카드 컴포넌트 Stitch 적용
    - `chemon-quotation/app/(dashboard)/customers/page.tsx` — 페이지 헤더 StitchPageHeader, 필터 영역 surface-low
    - `chemon-quotation/components/customer/UnifiedCustomerCard.tsx` — 고객 카드 StitchCard, 등급 뱃지 StitchBadge
    - `chemon-quotation/components/customer/EnhancedCustomerCard.tsx` — 향상된 카드 StitchCard
    - `chemon-quotation/components/customer/CustomerCard.tsx` — 기본 카드 StitchCard
    - `chemon-quotation/components/customer/UnifiedCustomerFilters.tsx` — 필터 패널 surface-low, 인풋 StitchInput
    - `chemon-quotation/components/customer/UnifiedCustomerStats.tsx` — 통계 카드 StitchCard
    - `chemon-quotation/components/customer/CustomerSummaryBar.tsx` — 요약 바 tonal layering
    - _Requirements: 2.1, 3.2, 5.5, 11.1_

  - [x] 6.2 고객사 목록 보조 컴포넌트 Stitch 적용
    - `chemon-quotation/components/customer/TableView.tsx` — 테이블 뷰 StitchTable
    - `chemon-quotation/components/customer/KanbanView.tsx` — 칸반 카드 bg-white rounded-xl hover:translate-y-[-2px]
    - `chemon-quotation/components/customer/AdvancedFilterPanel.tsx` — 고급 필터 surface-container
    - `chemon-quotation/components/customer/FilterPresetManager.tsx` — 프리셋 관리 Stitch 스타일
    - `chemon-quotation/components/customer/SortControl.tsx` — 정렬 컨트롤 Stitch 스타일
    - `chemon-quotation/components/customer/KPIDashboard.tsx` — KPI 대시보드 StitchCard
    - `chemon-quotation/components/customer/BulkActionBar.tsx` — 벌크 액션 바 surface-highest
    - `chemon-quotation/components/customer/CommandPalette.tsx` — 커맨드 팔레트 glassmorphism
    - `chemon-quotation/components/customer/ImportExportPanel.tsx` — 가져오기/내보내기 패널 Stitch 적용
    - `chemon-quotation/components/customer/VirtualizedCardGrid.tsx` — 가상화 그리드 StitchCard
    - _Requirements: 2.1, 3.4, 7.1, 9.2, 11.1, 11.5_

  - [x] 6.3 고객사 상세 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/customers/[id]/page.tsx` — 상세 페이지 레이아웃 Surface_Hierarchy
    - `chemon-quotation/components/customer-detail/CustomerSummaryHeader.tsx` — 요약 헤더 StitchCard, Editorial_Typography
    - `chemon-quotation/components/customer-detail/OverviewTab.tsx` — 개요 탭 StitchCard
    - `chemon-quotation/components/customer-detail/ActivityTimelineTab.tsx` — 활동 타임라인 tonal layering
    - `chemon-quotation/components/customer-detail/ContractTab.tsx` — 계약 탭 StitchTable
    - `chemon-quotation/components/customer-detail/RequesterTab.tsx` — 의뢰자 탭 StitchCard
    - `chemon-quotation/components/customer-detail/TestReceptionTab.tsx` — 시험 접수 탭 StitchTable
    - `chemon-quotation/components/customer-detail/MeetingRecordTab.tsx` — 미팅 기록 탭 StitchCard
    - `chemon-quotation/components/customer-detail/NotesTab.tsx` — 메모 탭 surface-low
    - `chemon-quotation/components/customer-detail/InvoiceScheduleTab.tsx` — 청구 일정 탭 StitchTable
    - `chemon-quotation/components/customer-detail/AuditLogTab.tsx` — 감사 로그 탭 StitchTable
    - `chemon-quotation/components/customer-detail/ProjectManagementTab.tsx` — 프로젝트 관리 탭 Stitch 적용
    - `chemon-quotation/components/customer-detail/CustomFieldsSection.tsx` — 커스텀 필드 StitchInput
    - _Requirements: 3.2, 3.3, 4.1, 11.2_

  - [x] 6.4 고객사 상세 인라인 폼 Stitch 적용
    - `chemon-quotation/components/customer-detail/InlineConsultationForm.tsx` — 상담 폼 StitchInput, surface-low
    - `chemon-quotation/components/customer-detail/InlineMeetingForm.tsx` — 미팅 폼 StitchInput
    - `chemon-quotation/components/customer-detail/InlineRequesterForm.tsx` — 의뢰자 폼 StitchInput
    - `chemon-quotation/components/customer-detail/InlineTestReceptionForm.tsx` — 시험 접수 폼 StitchInput
    - `chemon-quotation/components/customer-detail/RequesterSelector.tsx` — 의뢰자 선택 Stitch 드롭다운
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 11.2_

- [x] 7. [고빈도] 리드/파이프라인 페이지 Stitch 적용
  - [x] 7.1 리드 목록/상세/생성 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/leads/page.tsx` — 리드 목록 StitchTable, StitchPageHeader
    - `chemon-quotation/app/(dashboard)/leads/[id]/page.tsx` — 리드 상세 파이프라인 스테퍼, 정보 섹션, 활동 타임라인 Stitch 적용
    - `chemon-quotation/app/(dashboard)/leads/new/page.tsx` — 리드 생성 폼 StitchInput, surface-low
    - `chemon-quotation/components/lead/LostReasonDialog.tsx` — 실주 사유 다이얼로그 surface-highest
    - _Requirements: 5.5, 8.1, 11.3, 11.4_

  - [x] 7.2 파이프라인 칸반 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/pipeline/page.tsx` — 파이프라인 페이지 StitchPageHeader
    - `chemon-quotation/components/kanban/KanbanBoard.tsx` — 칸반 보드 컬럼 surface-low, 카드 bg-white rounded-xl hover:translate-y-[-2px] shadow-ambient
    - _Requirements: 2.1, 3.2, 9.1, 11.3_

- [x] 8. 체크포인트 — 고빈도 페이지 검증
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의합니다.


- [x] 9. [보조] 계약/시험/스터디 페이지 Stitch 적용
  - [x] 9.1 계약 관리 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/contracts/page.tsx` — 계약 목록 StitchTable, StitchPageHeader
    - `chemon-quotation/app/(dashboard)/contracts/[id]/page.tsx` — 계약 상세 StitchCard
    - `chemon-quotation/components/contract/PaymentScheduleTable.tsx` — 결제 일정 테이블 StitchTable
    - `chemon-quotation/components/contract/ContractPaymentForm.tsx` — 결제 폼 StitchInput, surface-low
    - _Requirements: 7.1, 7.4, 12.1, 12.4_

  - [x] 9.2 스터디 관리 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/studies/page.tsx` — 스터디 목록 StitchTable, StitchPageHeader
    - `chemon-quotation/app/(dashboard)/studies/[id]/page.tsx` — 스터디 상세 Surface_Hierarchy, Editorial_Typography
    - `chemon-quotation/components/study/StudyDocumentTimeline.tsx` — 문서 타임라인 tonal layering
    - `chemon-quotation/components/study/DocumentAddModal.tsx` — 문서 추가 모달 surface-highest
    - `chemon-quotation/components/study/StudyBulkRegisterModal.tsx` — 일괄 등록 모달 surface-highest
    - _Requirements: 3.4, 9.2, 12.3, 12.4_

  - [x] 9.3 임상병리 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/clinical-pathology/page.tsx` — 임상병리 메인 StitchPageHeader
    - `chemon-quotation/app/(dashboard)/clinical-pathology/quotations/[id]/page.tsx` — 견적 상세 StitchCard
    - `chemon-quotation/app/(dashboard)/clinical-pathology/test-requests/` — 시험 요청 페이지 StitchTable, StitchInput
    - `chemon-quotation/app/(dashboard)/clinical-pathology/settings/` — 설정 페이지 Stitch 적용
    - _Requirements: 6.1, 7.1, 10.1, 12.2_

- [x] 10. [보조] 설정/관리자 페이지 Stitch 적용
  - [x] 10.1 설정 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/settings/page.tsx` — 설정 메인 StitchPageHeader, 섹션 StitchCard
    - `chemon-quotation/components/settings/ProfileSettings.tsx` — 프로필 설정 StitchInput, surface-low
    - `chemon-quotation/components/settings/CompanySettings.tsx` — 회사 설정 StitchInput
    - `chemon-quotation/components/settings/SystemSettings.tsx` — 시스템 설정 StitchCard
    - `chemon-quotation/components/settings/MasterDataSettings.tsx` — 마스터 데이터 설정 StitchTable
    - `chemon-quotation/components/settings/PushNotificationSettings.tsx` — 푸시 알림 설정 Stitch 토글
    - `chemon-quotation/components/settings/UserCodeSetting.tsx` — 사용자 코드 설정 StitchInput
    - _Requirements: 6.1, 6.5, 13.1, 13.4_

  - [x] 10.2 관리자 컴포넌트 Stitch 적용
    - `chemon-quotation/components/admin/AutomationRuleList.tsx` — 자동화 규칙 목록 StitchTable
    - `chemon-quotation/components/admin/AutomationRuleForm.tsx` — 규칙 폼 StitchInput, surface-low
    - `chemon-quotation/components/admin/AutomationTriggerConfig.tsx` — 트리거 설정 surface-container
    - `chemon-quotation/components/admin/AutomationConditionBuilder.tsx` — 조건 빌더 surface-container
    - `chemon-quotation/components/admin/AutomationActionConfig.tsx` — 액션 설정 surface-container
    - `chemon-quotation/components/admin/AutomationExecutionLog.tsx` — 실행 로그 StitchTable
    - `chemon-quotation/components/admin/BackupManagement.tsx` — 백업 관리 StitchCard
    - `chemon-quotation/components/admin/BackupProgress.tsx` — 백업 진행 상태 Stitch 프로그레스
    - `chemon-quotation/components/admin/BackupRestoreDialog.tsx` — 복원 다이얼로그 surface-highest
    - _Requirements: 2.1, 3.4, 13.2, 13.3, 13.4_

- [x] 11. 체크포인트 — 보조 페이지 검증
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의합니다.


- [x] 12. [보조] 검색/공지사항/캘린더/리포트 페이지 Stitch 적용
  - [x] 12.1 검색/공지사항 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/search/page.tsx` — 검색 인풋 StitchInput, 검색 결과 StitchCard
    - `chemon-quotation/app/(dashboard)/announcements/page.tsx` — 공지 목록 StitchCard, StitchPageHeader
    - `chemon-quotation/app/(dashboard)/announcements/[id]/page.tsx` — 공지 상세 StitchCard, 댓글 영역 surface-low
    - _Requirements: 4.1, 6.1, 16.1, 16.2, 16.4_

  - [x] 12.2 캘린더/리포트/분석 페이지 Stitch 적용
    - `chemon-quotation/app/(dashboard)/calendar/page.tsx` — 캘린더 페이지 StitchPageHeader, 이벤트 카드 StitchCard
    - `chemon-quotation/app/(dashboard)/reports/page.tsx` — 리포트 페이지 StitchPageHeader, 차트 영역 surface-low
    - `chemon-quotation/components/analytics/LostReasonStats.tsx` — 실주 사유 통계 StitchCard, Editorial_Typography
    - _Requirements: 3.2, 4.1, 16.3_

- [x] 13. [보조] 모바일/레이아웃/에러 페이지 Stitch 적용
  - [x] 13.1 모바일 컴포넌트 Stitch 적용
    - `chemon-quotation/components/layout/MobileNav.tsx` — 모바일 네비게이션 surface-highest, glassmorphism
    - `chemon-quotation/components/layout/MobileBottomNav.tsx` — 하단 네비게이션 surface-highest, backdrop-blur
    - `chemon-quotation/components/mobile/MobileLeadCard.tsx` — 모바일 리드 카드 StitchCard
    - `chemon-quotation/components/mobile/MobileLeadForm.tsx` — 모바일 리드 폼 StitchInput
    - `chemon-quotation/components/mobile/MobileNavigation.tsx` — 모바일 네비게이션 Stitch 적용
    - `chemon-quotation/components/mobile/OfflineIndicator.tsx` — 오프라인 표시 StitchBadge
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 13.2 에러/로딩/404 페이지 및 레이아웃 Stitch 적용
    - `chemon-quotation/app/(dashboard)/error.tsx` — 에러 페이지 Surface_Hierarchy, Editorial_Typography
    - `chemon-quotation/app/(dashboard)/loading.tsx` — 로딩 페이지 surface 배경, Stitch 스피너
    - `chemon-quotation/app/(dashboard)/not-found.tsx` — 404 페이지 Surface_Hierarchy, Editorial_Typography
    - `chemon-quotation/app/error.tsx` — 루트 에러 페이지 Stitch 적용
    - `chemon-quotation/components/layout/PageHeader.tsx` — 공통 페이지 헤더 StitchPageHeader 스타일 통일
    - `chemon-quotation/components/layout/UserMenu.tsx` — 사용자 메뉴 드롭다운 surface-highest
    - `chemon-quotation/components/auth/ProtectedRoute.tsx` — 인증 래퍼 스타일 확인
    - _Requirements: 3.1, 4.2, 9.2, 16.3_

  - [x] 13.3 전체 No-Line Rule 및 기능 무결성 Property 테스트 작성
    - **Property 4: Input Border-None 일관성** — 모든 StitchInput, Select 트리거에 border-none, rounded-xl 포함 확인
    - **Validates: Requirements 1.5, 6.1, 6.4**
    - **Property 5: Editorial Typography 일관성** — 메타데이터 라벨에 text-[10px]/text-[11px], uppercase, tracking-widest 포함 확인
    - **Validates: Requirements 4.1, 4.2**
    - **Property 6: 순수 검정 텍스트 금지** — 변환된 컴포넌트에 text-black, #000000 미사용 확인
    - **Validates: Requirement 4.4**

- [x] 14. 최종 체크포인트 — 전체 디자인 시스템 적용 검증
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의합니다.
  - 전체 페이지 네비게이션 후 Stitch 스타일 일관성 확인
  - 모바일/데스크톱 뷰포트별 레이아웃 정상 동작 확인

## Notes

- `*` 표시된 태스크는 선택 사항이며 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 태스크는 추적 가능성을 위해 특정 요구사항을 참조합니다
- 체크포인트는 점진적 검증을 보장합니다
- 기능 로직은 변경하지 않고 className만 교체합니다 (Requirements 15.1, 15.2, 15.3)
- 이미 완료된 컴포넌트: globals.css, Sidebar, Header, Dashboard, StatsCard, SalesDashboard KPI, Login
