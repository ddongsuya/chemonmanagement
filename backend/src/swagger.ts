import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CHEMON 견적관리시스템 API',
      version: '1.1.0',
      description: `
# CHEMON 견적관리시스템 백엔드 API 문서

## 개요
CHEMON 견적관리시스템은 비임상시험 견적서 생성, 관리, 계약 관리를 위한 통합 플랫폼입니다.

## 인증
모든 API는 JWT Bearer 토큰 인증을 사용합니다.
- Access Token: 15분 유효
- Refresh Token: 7일 유효

## 에러 코드
| 코드 | 설명 |
|------|------|
| AUTH_INVALID_CREDENTIALS | 잘못된 인증 정보 |
| AUTH_TOKEN_EXPIRED | 토큰 만료 |
| AUTH_TOKEN_INVALID | 유효하지 않은 토큰 |
| AUTH_ACCOUNT_LOCKED | 계정 잠금 (5회 로그인 실패) |
| VALIDATION_ERROR | 입력 데이터 유효성 검사 실패 |
| RESOURCE_NOT_FOUND | 리소스를 찾을 수 없음 |
| RESOURCE_ACCESS_DENIED | 접근 권한 없음 |
| CONFLICT | 데이터 충돌 (중복) |
| RATE_LIMIT_EXCEEDED | 요청 제한 초과 |
| INTERNAL_ERROR | 서버 내부 오류 |

## 변경 이력
- v1.1.0: 분석 API 추가, 에러 처리 개선, 동시성 이슈 해결
- v1.0.0: 초기 릴리스
      `,
      contact: {
        name: 'CHEMON 개발팀',
        email: 'dev@chemon.co.kr',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'https://chemon-quotation-api.onrender.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token을 입력하세요',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: '입력 데이터가 유효하지 않습니다' },
                details: { type: 'object' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'LOCKED'] },
            department: { type: 'string', enum: ['TOXICITY', 'EFFICACY', 'BOTH'], nullable: true },
            position: { type: 'string', enum: ['STAFF', 'SENIOR', 'MANAGER', 'DIRECTOR'], nullable: true },
            canViewAllData: { type: 'boolean', default: false },
            canViewAllSales: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@chemon.co.kr' },
            password: { type: 'string', minLength: 8, example: 'password123!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
                unreadNotifications: { type: 'integer', example: 5 },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, description: '최소 8자, 영문/숫자/특수문자 포함' },
            name: { type: 'string', minLength: 2 },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: '담당자명' },
            company: { type: 'string', description: '회사명' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateCustomerRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        Quotation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quotationNumber: { type: 'string', example: 'TQ-2026-0001', description: '견적번호 (TQ: 독성, EQ: 효력)' },
            quotationType: { type: 'string', enum: ['TOXICITY', 'EFFICACY'] },
            userId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid', nullable: true },
            customerName: { type: 'string' },
            projectName: { type: 'string' },
            modality: { type: 'string', nullable: true },
            modelId: { type: 'string', nullable: true },
            modelCategory: { type: 'string', nullable: true },
            indication: { type: 'string', nullable: true },
            items: { type: 'array', items: { $ref: '#/components/schemas/QuotationItem' } },
            subtotalTest: { type: 'number', nullable: true },
            subtotalAnalysis: { type: 'number', nullable: true },
            subtotal: { type: 'number', nullable: true },
            discountRate: { type: 'number', nullable: true },
            discountAmount: { type: 'number', nullable: true },
            vat: { type: 'number', nullable: true },
            totalAmount: { type: 'number' },
            validDays: { type: 'integer', default: 30 },
            validUntil: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            customer: { $ref: '#/components/schemas/Customer' },
          },
        },
        QuotationItem: {
          type: 'object',
          properties: {
            test_name: { type: 'string', description: '시험명' },
            species: { type: 'string', description: '동물종' },
            duration: { type: 'string', description: '시험기간' },
            route: { type: 'string', description: '투여경로' },
            unit_price: { type: 'number' },
            quantity: { type: 'integer' },
            total_price: { type: 'number' },
          },
        },
        CreateQuotationRequest: {
          type: 'object',
          required: ['quotationType', 'customerName', 'projectName', 'totalAmount'],
          properties: {
            quotationType: { type: 'string', enum: ['TOXICITY', 'EFFICACY'] },
            customerId: { type: 'string', format: 'uuid', nullable: true },
            customerName: { type: 'string' },
            projectName: { type: 'string' },
            modality: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/QuotationItem' } },
            subtotalTest: { type: 'number' },
            subtotalAnalysis: { type: 'number' },
            subtotal: { type: 'number' },
            discountRate: { type: 'number' },
            discountAmount: { type: 'number' },
            totalAmount: { type: 'number' },
            validDays: { type: 'integer', default: 30 },
            notes: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'SENT'], default: 'DRAFT' },
          },
        },
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            viewCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['ANNOUNCEMENT', 'SYSTEM', 'REMINDER', 'QUOTATION', 'CONTRACT'] },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            link: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            leadNumber: { type: 'string', example: 'LD-2026-0001' },
            companyName: { type: 'string' },
            contactName: { type: 'string' },
            contactEmail: { type: 'string', format: 'email' },
            contactPhone: { type: 'string' },
            source: { type: 'string', enum: ['WEBSITE', 'REFERRAL', 'EXHIBITION', 'COLD_CALL', 'OTHER'] },
            status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'] },
            expectedAmount: { type: 'number' },
            expectedCloseDate: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Contract: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            contractNumber: { type: 'string', example: 'CT-2026-0001' },
            customerId: { type: 'string', format: 'uuid' },
            totalAmount: { type: 'number' },
            advancePayment: { type: 'number' },
            remainingPayment: { type: 'number' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            signedDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING', 'SIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Study: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studyNumber: { type: 'string', example: 'ST-2026-0001' },
            contractId: { type: 'string', format: 'uuid' },
            testName: { type: 'string' },
            species: { type: 'string' },
            status: { type: 'string', enum: ['PREPARING', 'IN_PROGRESS', 'ANALYSIS', 'REPORT_DRAFT', 'REPORT_REVIEW', 'COMPLETED', 'SUSPENDED'] },
            startDate: { type: 'string', format: 'date' },
            expectedEndDate: { type: 'string', format: 'date' },
            actualEndDate: { type: 'string', format: 'date', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        AnalyticsRevenue: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string', example: '2026-01' },
                  revenue: { type: 'number' },
                  count: { type: 'integer' },
                  growth: { type: 'number', description: '전월 대비 성장률 (%)' },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                totalRevenue: { type: 'number' },
                totalCount: { type: 'integer' },
                avgDealSize: { type: 'number' },
                growth: { type: 'number' },
              },
            },
          },
        },
        AnalyticsConversion: {
          type: 'object',
          properties: {
            funnel: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stage: { type: 'string' },
                  count: { type: 'integer' },
                  conversionRate: { type: 'number' },
                  avgDaysInStage: { type: 'number' },
                },
              },
            },
            overallConversionRate: { type: 'number' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: '인증 관련 API (로그인, 회원가입, 토큰 갱신)' },
      { name: 'Quotations', description: '견적서 관리 API (CRUD, 상태 변경)' },
      { name: 'Customers', description: '고객 관리 API' },
      { name: 'Leads', description: '리드(영업기회) 관리 API' },
      { name: 'Contracts', description: '계약 관리 API' },
      { name: 'Studies', description: '시험 관리 API' },
      { name: 'Analytics', description: '분석 및 통계 API' },
      { name: 'Announcements', description: '공지사항 API' },
      { name: 'Notifications', description: '알림 API' },
      { name: 'Admin', description: '관리자 전용 API' },
      { name: 'Settings', description: '설정 API' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
