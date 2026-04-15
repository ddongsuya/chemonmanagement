/**
 * Import/Export Service Tests
 * 
 * 검증 항목:
 * 1. 중복+손상 행 혼합 CSV로 skip/update 두 모드 동작
 * 2. export → 재 import(skip 모드) 시 전부 skipped 처리 (왕복 호환성)
 * 3. 500행 상한 체크
 * 4. best-effort: 개별 행 실패 시 다른 행은 계속 처리
 */

import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { executeImport } from '../../src/services/importExportService';

// Mock Prisma
const mockCustomers: Map<string, Record<string, unknown>> = new Map();
let createCallCount = 0;
let updateCallCount = 0;

const mockFindFirst = jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
  for (const [id, c] of mockCustomers) {
    if (where.email && c.email === where.email && c.userId === where.userId && !c.deletedAt) {
      return { id };
    }
    if (!where.email && c.name === where.name && c.userId === where.userId && !c.deletedAt) {
      if (where.company === undefined || c.company === where.company) {
        return { id };
      }
    }
  }
  return null;
});

const mockCreate = jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
  const id = `cust-${++createCallCount}`;
  mockCustomers.set(id, { ...data, id });
  return { id, ...data };
});

const mockUpdate = jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
  const existing = mockCustomers.get(where.id);
  if (existing) {
    const updated = { ...existing, ...data };
    mockCustomers.set(where.id, updated);
    return updated;
  }
  throw new Error('Not found');
});

// Mock prisma.$transaction — passes a tx object with same shape
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: {
          findFirst: mockFindFirst,
          create: mockCreate,
          update: mockUpdate,
        },
      };
      return fn(tx);
    }),
    customer: {
      findMany: jest.fn(async () => []),
    },
  },
}));

const DEFAULT_MAPPING = [
  { excelColumn: 1, field: 'name', label: '고객명', required: true },
  { excelColumn: 2, field: 'company', label: '회사명', required: false },
  { excelColumn: 3, field: 'email', label: '이메일', required: false },
  { excelColumn: 4, field: 'phone', label: '전화번호', required: false },
  { excelColumn: 5, field: 'address', label: '주소', required: false },
  { excelColumn: 6, field: 'grade', label: '등급', required: false },
  { excelColumn: 7, field: 'segment', label: '세그먼트', required: false },
  { excelColumn: 8, field: 'notes', label: '비고', required: false },
];

const TEST_USER_ID = 'test-user-001';

async function createTestExcel(rows: (string | null)[][], filename: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  
  // Header
  sheet.addRow(['고객명', '회사명', '이메일', '전화번호', '주소', '등급', '세그먼트', '비고']);
  
  // Data rows
  for (const row of rows) {
    sheet.addRow(row);
  }
  
  const dir = path.join(process.cwd(), 'test-tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

function seedCustomer(id: string, data: Record<string, unknown>) {
  mockCustomers.set(id, { ...data, id, deletedAt: null });
}

describe('Import Service', () => {
  beforeEach(() => {
    mockCustomers.clear();
    createCallCount = 0;
    updateCallCount = 0;
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Cleanup test files
    const dir = path.join(process.cwd(), 'test-tmp');
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('검증 3: skip/update 모드 + 중복/손상 행 혼합', () => {
    it('skip 모드: 중복은 건너뛰고, 새 레코드는 생성하고, 손상 행은 실패 처리', async () => {
      // 기존 고객 시드
      seedCustomer('existing-1', { userId: TEST_USER_ID, name: '홍길동', email: 'hong@test.com', company: '(주)테스트' });
      seedCustomer('existing-2', { userId: TEST_USER_ID, name: '김철수', email: null, company: '(주)ABC' });

      const filePath = await createTestExcel([
        ['홍길동', '(주)테스트', 'hong@test.com', '010-1111-1111', '', '', '', ''],  // 이메일 중복 → skip
        ['김철수', '(주)ABC', null, '010-2222-2222', '', '', '', ''],                // name+company 중복 → skip
        ['이영희', '(주)신규', 'lee@new.com', '010-3333-3333', '', '', '', ''],      // 새 레코드 → created
        [null, '', '', '', '', '', '', ''],                                           // 손상 행 (이름 없음) → failed
        ['박지민', '(주)신규2', 'park@new.com', '010-4444-4444', '', '', '', ''],    // 새 레코드 → created
      ], 'test-skip.xlsx');

      const result = await executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'skip');

      expect(result.created).toBe(2);
      expect(result.skipped).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.rows).toHaveLength(5);

      // 행별 상태 확인
      expect(result.rows[0].status).toBe('skipped');
      expect(result.rows[0].message).toContain('이메일 중복');
      expect(result.rows[1].status).toBe('skipped');
      expect(result.rows[1].message).toContain('name+company 중복');
      expect(result.rows[2].status).toBe('created');
      expect(result.rows[3].status).toBe('failed');
      expect(result.rows[3].message).toContain('고객명이 필요합니다');
      expect(result.rows[4].status).toBe('created');
    });

    it('update 모드: 중복은 업데이트하고, 새 레코드는 생성', async () => {
      seedCustomer('existing-1', { userId: TEST_USER_ID, name: '홍길동', email: 'hong@test.com', company: '(주)테스트', phone: '010-0000-0000' });

      const filePath = await createTestExcel([
        ['홍길동', '(주)테스트변경', 'hong@test.com', '010-9999-9999', '', '', '', ''],  // 이메일 중복 → update
        ['새사람', '(주)신규', 'new@test.com', '010-5555-5555', '', '', '', ''],          // 새 레코드 → created
      ], 'test-update.xlsx');

      const result = await executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'update');

      expect(result.updated).toBe(1);
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);

      expect(result.rows[0].status).toBe('updated');
      expect(result.rows[0].message).toContain('업데이트');
      expect(result.rows[1].status).toBe('created');

      // update가 값 있는 필드만 덮어쓰는지 확인
      const updated = mockCustomers.get('existing-1');
      expect(updated?.company).toBe('(주)테스트변경');
      expect(updated?.phone).toBe('010-9999-9999');
    });

    it('update 모드: 빈 필드는 기존 값 유지', async () => {
      seedCustomer('existing-1', { userId: TEST_USER_ID, name: '홍길동', email: 'hong@test.com', company: '(주)테스트', phone: '010-0000-0000', address: '서울시 강남구' });

      const filePath = await createTestExcel([
        // phone과 address가 빈 문자열 → 기존 값 유지해야 함
        ['홍길동', '', 'hong@test.com', '', '', '', '', ''],
      ], 'test-update-partial.xlsx');

      const result = await executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'update');

      expect(result.updated).toBe(1);
      
      // update 호출 시 빈 필드는 포함되지 않아야 함
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('company');
      expect(updateCall.data).not.toHaveProperty('phone');
      expect(updateCall.data).not.toHaveProperty('address');
      // name과 email은 값이 있으므로 포함
      expect(updateCall.data.name).toBe('홍길동');
      expect(updateCall.data.email).toBe('hong@test.com');
    });
  });

  describe('검증 4: 왕복 호환성 (export → import skip)', () => {
    it('이미 존재하는 고객을 다시 import하면 전부 skipped', async () => {
      // 기존 고객 3명 시드 (export된 데이터를 시뮬레이션)
      seedCustomer('c1', { userId: TEST_USER_ID, name: '홍길동', email: 'hong@test.com', company: '(주)A' });
      seedCustomer('c2', { userId: TEST_USER_ID, name: '김철수', email: 'kim@test.com', company: '(주)B' });
      seedCustomer('c3', { userId: TEST_USER_ID, name: '이영희', email: 'lee@test.com', company: '(주)C' });

      // 동일한 데이터로 Excel 생성 (export → import 시뮬레이션)
      const filePath = await createTestExcel([
        ['홍길동', '(주)A', 'hong@test.com', '', '', '', '', ''],
        ['김철수', '(주)B', 'kim@test.com', '', '', '', '', ''],
        ['이영희', '(주)C', 'lee@test.com', '', '', '', '', ''],
      ], 'test-roundtrip.xlsx');

      const result = await executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'skip');

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(3);
      expect(result.failed).toBe(0);

      // 모든 행이 skipped
      result.rows.forEach(r => {
        expect(r.status).toBe('skipped');
        expect(r.message).toContain('이메일 중복');
      });
    });

    it('이메일 없는 고객도 name+company로 왕복 호환', async () => {
      seedCustomer('c1', { userId: TEST_USER_ID, name: '박지민', email: null, company: '(주)D' });

      const filePath = await createTestExcel([
        ['박지민', '(주)D', '', '', '', '', '', ''],
      ], 'test-roundtrip-nomail.xlsx');

      const result = await executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'skip');

      expect(result.skipped).toBe(1);
      expect(result.created).toBe(0);
      expect(result.rows[0].status).toBe('skipped');
      expect(result.rows[0].message).toContain('name+company 중복');
    });
  });

  describe('행 수 상한 체크', () => {
    it('500행 초과 시 에러', async () => {
      const rows: (string | null)[][] = [];
      for (let i = 0; i < 501; i++) {
        rows.push([`고객${i}`, `회사${i}`, `test${i}@test.com`, '', '', '', '', '']);
      }
      const filePath = await createTestExcel(rows, 'test-over-limit.xlsx');

      await expect(
        executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'skip')
      ).rejects.toThrow('한 번에 최대 500행까지 가져올 수 있습니다');
    });
  });

  describe('best-effort: 개별 행 실패 시 다른 행 계속 처리', () => {
    it('중간 행 실패해도 나머지 행은 정상 처리', async () => {
      const filePath = await createTestExcel([
        ['정상고객1', '(주)A', 'ok1@test.com', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],  // 이름 없음 → failed
        ['정상고객2', '(주)B', 'ok2@test.com', '', '', '', '', ''],
      ], 'test-best-effort.xlsx');

      const result = await executeImport(filePath, DEFAULT_MAPPING, TEST_USER_ID, 'skip');

      expect(result.created).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.rows[0].status).toBe('created');
      expect(result.rows[1].status).toBe('failed');
      expect(result.rows[2].status).toBe('created');
    });
  });
});
