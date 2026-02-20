'use client';

import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import type { TestMode } from '@/types/toxicity-v2';

/** 모드별 제출목적 텍스트 자동 생성 */
function getPurposeText(mode: TestMode | null, comboType: 2 | 3 | 4): string {
  switch (mode) {
    case 'drug_single':
      return '의약품 독성시험';
    case 'drug_combo':
      return `복합제(${comboType}종) 독성시험`;
    case 'drug_vaccine':
      return '백신 독성시험';
    case 'drug_screen_tox':
      return '독성 스크리닝 시험';
    case 'drug_screen_cv':
      return '심혈관계 스크리닝 시험';
    case 'hf_indv':
      return '건강기능식품(개별인정형) 안전성시험';
    case 'hf_prob':
      return '건강기능식품(프로바이오틱스) 안전성시험';
    case 'hf_temp':
      return '건강기능식품(한시적식품) 안전성시험';
    case 'md_bio':
      return '의료기기 생물학적 안전성시험';
    case 'cos_alt':
      return '화장품 대체시험';
    case 'cos_stem':
      return '화장품 줄기세포배양액 안전성시험';
    case 'drug_celltx':
      return '세포치료제 독성시험';
    case 'doc_send':
      return 'SEND 데이터셋 작성';
    case 'doc_ctd':
      return 'CTD Module 2.6 작성';
    case 'doc_trans':
      return '보고서 영문 번역';
    default:
      return '';
  }
}

/** 현재 날짜를 YYYY년 M월 D일 형식으로 반환 */
function formatDate(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
}

/** 시험 기준 표시 텍스트 */
function getStandardLabel(standard: 'KGLP' | 'KGLP_OECD'): string {
  return standard === 'KGLP' ? 'KGLP' : 'KGLP+OECD';
}

export default function PreviewCover() {
  const { info, mode, standard, comboType } = useToxicityV2Store();

  const purposeText = getPurposeText(mode, comboType);

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white border border-gray-200 shadow-sm aspect-[210/297] flex flex-col justify-between p-12 print:border-none print:shadow-none">
      {/* 상단: 회사 로고 + 제목 */}
      <div className="text-center pt-16">
        <div className="text-2xl font-bold tracking-widest text-gray-700 mb-8">
          코아스템켐온
        </div>
        <div className="text-4xl font-bold tracking-wider mt-12">
          견 적 서
        </div>
      </div>

      {/* 중앙: 시험 정보 */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 py-8">
        <table className="text-sm border-collapse">
          <tbody>
            <InfoRow label="기관명" value={info.org || '-'} />
            <InfoRow label="담당자" value={info.person || '-'} />
            <InfoRow label="연락처" value={info.contact || '-'} />
            <InfoRow label="이메일" value={info.email || '-'} />
            <InfoRow label="시험물질명" value={info.substance || '-'} />
            <InfoRow label="제출목적" value={purposeText || '-'} />
            <InfoRow label="시험기준" value={getStandardLabel(standard)} />
          </tbody>
        </table>
      </div>

      {/* 하단: 날짜 + 견적번호 */}
      <div className="text-center pb-12 space-y-2">
        <div className="text-sm text-gray-600">{formatDate()}</div>
        {info.quotationNumber && (
          <div className="text-sm text-gray-500">
            견적번호: {info.quotationNumber}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-4">
          (주)코아스템켐온 비임상CRO사업부
        </div>
      </div>
    </div>
  );
}

/** 정보 행 컴포넌트 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 pr-6 text-gray-500 font-medium whitespace-nowrap text-right">
        {label}
      </td>
      <td className="py-1.5 text-gray-900">{value}</td>
    </tr>
  );
}
