# 계약서 PDF 폰트 설정 가이드

## 📁 파일 구조

```
src/
├── components/
│   └── pdf/
│       ├── ContractPDF.tsx           # 원계약서 PDF
│       ├── ContractAmendmentPDF.tsx  # 변경계약서 PDF
│       ├── index.ts                  # 컴포넌트 내보내기
│       └── examples/
│           └── ContractPDFExample.tsx # 사용 예시
├── lib/
│   └── contractPdfStyles.ts          # 스타일 및 유틸리티
└── public/
    └── fonts/                        # 폰트 파일 (추가 필요)
        ├── NotoSansKR-Regular.ttf
        ├── NotoSansKR-Bold.ttf
        └── HumanYetche.ttf           # (선택) 휴먼옛체
```

---

## 🔤 폰트 설정

### 옵션 1: Noto Sans KR (무료, 권장)

1. Google Fonts에서 다운로드:
   - https://fonts.google.com/noto/specimen/Noto+Sans+KR

2. `public/fonts/` 폴더에 복사:
   ```
   public/fonts/NotoSansKR-Regular.ttf
   public/fonts/NotoSansKR-Bold.ttf
   ```

3. `contractPdfStyles.ts`에서 이미 설정되어 있음 (기본값)

### 옵션 2: 휴먼옛체 (상용, 제목용)

1. 휴먼옛체 `.ttf` 파일 준비 (라이선스 필요)

2. `public/fonts/` 폴더에 복사:
   ```
   public/fonts/HumanYetche.ttf
   ```

3. `contractPdfStyles.ts`에서 주석 해제:
   ```typescript
   // 휴먼옛체 등록
   Font.register({
     family: 'HumanYetche',
     src: '/fonts/HumanYetche.ttf',
   });
   ```

4. 스타일에서 폰트 적용:
   ```typescript
   mainTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     letterSpacing: 8,
     fontFamily: 'HumanYetche', // 추가
   },
   ```

---

## 🚀 사용 방법

### 1. 기본 사용

```tsx
import { ContractPDF, ContractAmendmentPDF } from '@/components/pdf';
import { PDFDownloadLink } from '@react-pdf/renderer';

// 원계약서 다운로드
<PDFDownloadLink
  document={<ContractPDF data={contractData} />}
  fileName="계약서.pdf"
>
  다운로드
</PDFDownloadLink>

// 변경계약서 다운로드
<PDFDownloadLink
  document={<ContractAmendmentPDF data={amendmentData} />}
  fileName="변경계약서.pdf"
>
  다운로드
</PDFDownloadLink>
```

### 2. 서버사이드 생성 (API Route)

```typescript
// app/api/contract/pdf/route.ts
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import ContractPDF from '@/components/pdf/ContractPDF';

export async function POST(request: Request) {
  const data = await request.json();
  
  const pdfBuffer = await renderToBuffer(
    <ContractPDF data={data} />
  );
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract.pdf"`,
    },
  });
}
```

### 3. 전자서명 적용

```tsx
const contractData = {
  // ... 기타 데이터
  signatureA: '/signatures/partyA-signature.png', // 갑 서명 이미지
  signatureB: '/signatures/partyB-signature.png', // 을 서명 이미지
};
```

### 4. 로고 적용

```tsx
const contractData = {
  // ... 기타 데이터
  logo: '/images/company-logo.png',
};
```

---

## 📋 데이터 구조

### ContractData (원계약서)

```typescript
interface ContractData {
  contractNumber: string;      // 계약번호
  contractDate: Date;          // 계약일
  
  partyA: PartyInfo;           // 갑 정보
  partyB: PartyInfo;           // 을 정보
  
  researchTitle: string;       // 연구과제명
  researchAmount: number;      // 연구비
  vatIncluded: boolean;        // 부가세 포함 여부
  startDate: Date;             // 시작일
  endDate: Date;               // 종료일
  
  paymentSchedule: PaymentSchedule[]; // 지불 조건
  
  bankName: string;            // 은행명
  accountNumber: string;       // 계좌번호
  accountHolder: string;       // 예금주
  
  logo?: string;               // 로고 (선택)
  signatureA?: string;         // 갑 서명 (선택)
  signatureB?: string;         // 을 서명 (선택)
  attachments?: string[];      // 첨부 목록 (선택)
}
```

### AmendmentData (변경계약서)

```typescript
interface AmendmentData {
  amendmentNumber: string;     // 변경계약 번호
  amendmentDate: Date;         // 변경계약일
  
  originalContractNumber: string; // 원계약 번호
  originalContractDate: Date;     // 원계약일
  originalResearchTitle: string;  // 원계약 연구명
  studyNumber?: string;           // 시험번호
  
  partyA: PartyInfo;
  partyB: PartyInfo;
  
  changeReason: string;        // 변경 사유
  changes: ChangeItem[];       // 변경 항목들
  
  researchInfo?: { before, after }; // 연구정보 변경
  paymentInfo?: { before, after };  // 금액정보 변경
  
  // ... 기타 동일
}
```

---

## ⚠️ 주의사항

1. **SSR 비활성화 필요**
   ```tsx
   // 동적 import 사용
   const ContractPDF = dynamic(
     () => import('@/components/pdf/ContractPDF'),
     { ssr: false }
   );
   ```

2. **폰트 파일 크기**
   - Noto Sans KR: 약 4MB
   - 첫 로드 시 약간의 지연 발생 가능

3. **한글 줄바꿈**
   - @react-pdf/renderer는 한글 줄바꿈을 자동 처리
   - 긴 텍스트는 적절히 분리 필요

4. **이미지 경로**
   - 서명/로고는 절대 경로 또는 base64 사용
   - Next.js public 폴더 기준 경로

---

## 🔧 커스터마이징

### 조항 수정

`ContractPDF.tsx`에서 각 Article 컴포넌트 내용 수정:

```tsx
<Article number={1} title="연구의 목적">
  <Text style={contractStyles.articleContent}>
    {/* 원하는 내용으로 수정 */}
  </Text>
</Article>
```

### 스타일 수정

`contractPdfStyles.ts`에서 스타일 조정:

```typescript
mainTitle: {
  fontSize: 28,        // 크기 변경
  color: '#1a365d',    // 색상 변경
  // ...
},
```

### 새 조항 추가

```tsx
<Article number={17} title="새로운 조항">
  <Text style={contractStyles.articleContent}>
    새로운 조항 내용
  </Text>
</Article>
```
