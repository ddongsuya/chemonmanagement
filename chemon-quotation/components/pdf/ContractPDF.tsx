// src/components/pdf/ContractPDF.tsx
// 위탁연구계약서 PDF 문서

'use client';

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import {
  contractStyles,
  numberToKorean,
  formatContractDate,
  formatPeriod,
} from '@/lib/contractPdfStyles';

// ==================== 타입 정의 ====================

export interface PartyInfo {
  name: string;           // 회사/기관명
  address: string;        // 주소
  representative: string; // 대표자명
  position?: string;      // 직책 (연구원장, 대표이사 등)
}

export interface PaymentSchedule {
  type: string;           // 선금, 잔금, 일시납 등
  amount: number;         // 금액
  vatIncluded: boolean;   // 부가세 포함 여부
  condition: string;      // 지불 조건
}

export interface ContractData {
  // 기본 정보
  contractNumber: string;
  contractDate: Date;
  
  // 당사자 정보
  partyA: PartyInfo;      // 갑 (의뢰자)
  partyB: PartyInfo;      // 을 (수탁자)
  
  // 연구 정보
  researchTitle: string;  // 연구과제명
  researchAmount: number; // 연구비
  vatIncluded: boolean;   // 부가세 포함 여부
  startDate: Date;        // 연구 시작일
  endDate: Date;          // 연구 종료일
  
  // 금액 정보
  paymentSchedule: PaymentSchedule[];
  
  // 은행 정보
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  
  // 옵션
  logo?: string;          // 로고 이미지 URL (선택)
  signatureA?: string;    // 갑 전자서명 이미지 (선택)
  signatureB?: string;    // 을 전자서명 이미지 (선택)
  
  // 첨부
  attachments?: string[]; // 첨부 문서 목록
}

// ==================== 서브 컴포넌트 ====================

// 제목 섹션
const TitleSection: React.FC = () => (
  <View style={contractStyles.titleSection}>
    <Text style={contractStyles.mainTitle}>위 탁 연 구 계 약 서</Text>
    <View style={contractStyles.mainTitleUnderline} />
    <Text style={contractStyles.subTitle}>(Contract Sheet)</Text>
  </View>
);

// 전문 (서문)
const Preamble: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={contractStyles.preamble}>
    <Text style={contractStyles.preambleText}>
      {data.partyA.name}(이하 "갑"이라 한다.)와 {data.partyB.name}(이하 "을"이라 한다.)과 
      "갑"의 "{data.researchTitle}"(이하 "연구"라 한다.) 수행을 위하여 
      "을"이 "갑"으로부터 관련사항에 대한 연구를 위탁 받아 수행하기로 하고 
      아래와 같이 합의한다.
    </Text>
  </View>
);

// 조항 컴포넌트
const Article: React.FC<{
  number: number;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => (
  <View style={contractStyles.article}>
    <Text style={contractStyles.articleTitle}>
      제 {number} 조 {title}
    </Text>
    {children}
  </View>
);

// 연구 정보 테이블 (제2조)
const ResearchInfoTable: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={contractStyles.researchInfoTable}>
    <View style={contractStyles.researchInfoRow}>
      <Text style={contractStyles.researchInfoLabel}>연 구 과 제 명</Text>
      <Text style={contractStyles.researchInfoValue}>{data.researchTitle}</Text>
    </View>
    <View style={contractStyles.researchInfoRow}>
      <Text style={contractStyles.researchInfoLabel}>연 구 비</Text>
      <Text style={contractStyles.researchInfoValue}>
        금 {numberToKorean(data.researchAmount)} (₩ {data.researchAmount.toLocaleString()}) {data.vatIncluded ? '부가세 포함' : '부가세 별도'}
      </Text>
    </View>
    <View style={contractStyles.researchInfoRowLast}>
      <Text style={contractStyles.researchInfoLabel}>연 구 기 간</Text>
      <Text style={contractStyles.researchInfoValue}>
        {formatPeriod(data.startDate, data.endDate)}
      </Text>
    </View>
  </View>
);

// 지불 조건 테이블 (제4조)
const PaymentTable: React.FC<{ payments: PaymentSchedule[] }> = ({ payments }) => (
  <View style={contractStyles.paymentTable}>
    <View style={contractStyles.paymentTableHeader}>
      <Text style={[contractStyles.paymentColType, contractStyles.bold]}>구 분</Text>
      <Text style={[contractStyles.paymentColAmount, contractStyles.bold]}>금 액</Text>
      <Text style={[contractStyles.paymentColVat, contractStyles.bold]}>부가세</Text>
      <Text style={[contractStyles.paymentColCondition, contractStyles.bold]}>지 불 조 건</Text>
    </View>
    {payments.map((payment, index) => (
      <View 
        key={index}
        style={index === payments.length - 1 ? contractStyles.paymentTableRowLast : contractStyles.paymentTableRow}
      >
        <Text style={contractStyles.paymentColType}>{payment.type}</Text>
        <Text style={contractStyles.paymentColAmount}>
          금 {numberToKorean(payment.amount)} (₩ {payment.amount.toLocaleString()})
        </Text>
        <Text style={contractStyles.paymentColVat}>
          {payment.vatIncluded ? '포함' : '별도'}
        </Text>
        <Text style={contractStyles.paymentColCondition}>{payment.condition}</Text>
      </View>
    ))}
  </View>
);

// 서명란
const SignatureSection: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={contractStyles.signatureSection}>
    <Text style={contractStyles.signatureDate}>
      {formatContractDate(data.contractDate)}
    </Text>
    
    <View style={contractStyles.signatureContainer}>
      {/* 갑 서명란 */}
      <View style={contractStyles.signatureBox}>
        <Text style={contractStyles.signatureLabel}>"갑"</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyA.name}</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyA.address}</Text>
        <View style={contractStyles.signatureLine}>
          <Text style={contractStyles.signatureText}>
            {data.partyA.position || '대표자'} : {data.partyA.representative}
          </Text>
          {data.signatureA ? (
            <Image src={data.signatureA} style={contractStyles.eSignatureImage} />
          ) : (
            <View style={contractStyles.signatureStamp}>
              <Text style={contractStyles.signatureStampText}>(인)</Text>
            </View>
          )}
        </View>
      </View>

      {/* 을 서명란 */}
      <View style={contractStyles.signatureBox}>
        <Text style={contractStyles.signatureLabel}>"을"</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyB.name}</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyB.address}</Text>
        <View style={contractStyles.signatureLine}>
          <Text style={contractStyles.signatureText}>
            {data.partyB.position || '대표이사'} : {data.partyB.representative}
          </Text>
          {data.signatureB ? (
            <Image src={data.signatureB} style={contractStyles.eSignatureImage} />
          ) : (
            <View style={contractStyles.signatureStamp}>
              <Text style={contractStyles.signatureStampText}>(인)</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  </View>
);

// 첨부 섹션
const AttachmentSection: React.FC<{ attachments?: string[] }> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <View style={contractStyles.attachmentSection}>
      <Text style={contractStyles.attachmentTitle}>별첨</Text>
      {attachments.map((attachment, index) => (
        <Text key={index} style={contractStyles.attachmentItem}>
          {index + 1}. {attachment}
        </Text>
      ))}
    </View>
  );
};

// ==================== 메인 컴포넌트 ====================

const ContractPDF: React.FC<{ data: ContractData }> = ({ data }) => {
  const totalAmount = data.paymentSchedule.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Document>
      {/* 1페이지: 제목 ~ 제8조 */}
      <Page size="A4" style={contractStyles.page}>
        {/* 로고 (선택) */}
        {data.logo && (
          <View style={contractStyles.logoSection}>
            <Image src={data.logo} style={contractStyles.logo} />
          </View>
        )}

        <TitleSection />
        <Preamble data={data} />

        {/* 제1조 연구의 목적 */}
        <Article number={1} title="연구의 목적">
          <Text style={contractStyles.articleContent}>
            본 연구는 비임상시험을 "갑"으로부터 용역 받아 동물실험 등을 실시하며, 
            이를 통하여 "갑"의 연구수행의 결과물을 확보하는 데 있다.
          </Text>
        </Article>

        {/* 제2조 연구의 내용 및 범위 */}
        <Article number={2} title="연구의 내용 및 범위">
          <Text style={contractStyles.articleContent}>
            "을"은 "갑"이 지원하는 연구비에 의해 연구를 실시하며, "갑"과 "을"의 합의 하에 
            변경 가능하다. 또한, "갑"에 의하여 실험을 추가하는 경우 추가 비용에 대하여는 
            "갑"과 "을"의 협의 하에 "갑"은 추가 비용을 지불한다.
          </Text>
          <ResearchInfoTable data={data} />
        </Article>

        {/* 제3조 연구 일정 */}
        <Article number={3} title="연구 일정">
          <Text style={contractStyles.articleContent}>
            1) 본 연구기간 동안의 세부일정은 시험계획서에 명기된 내용으로 하며, 
            "갑"과 "을" 쌍방의 합의에 의하여 조정될 수 있다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) 시험물질은 협의된 개시 일정의 3주 전까지 입고되어야 하며, 물질 입고 지연 및 
            의뢰자의 일방적인 시험 취소 등으로 인한 동물실 일정 변경은 계약금액의 5% 
            수수료(부가세 별도) 비용이 발생된다.
          </Text>
        </Article>

        {/* 제4조 연구용역비 */}
        <Article number={4} title="연구용역비">
          <Text style={contractStyles.articleContent}>
            1) 본 용역을 수행함에 있어서, "갑"은 "을"에게 연구용역비로 금 {numberToKorean(totalAmount)} 
            (₩ {totalAmount.toLocaleString()}) {data.vatIncluded ? '부가세 포함' : '부가세 별도'}를 지급한다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) 연구용역비는 현금으로 지급하며, 지급조건은 아래의 표에 따른다. 
            지체시 연 12%의 비율로 계산한 금원을 배상한다.
          </Text>
          <PaymentTable payments={data.paymentSchedule} />
          <Text style={contractStyles.articleSubItem}>
            3) "갑"은 "을"에게 부가세를 포함한 연구용역비를 세금계산서 발행일로부터 30일 이내 
            {data.bankName} (계좌번호 : {data.accountNumber}, 예금주 : {data.accountHolder})으로 
            입금하도록 한다.
          </Text>
        </Article>

        {/* 제5조 상호협조 */}
        <Article number={5} title="상호협조">
          <Text style={contractStyles.articleContent}>
            "을"은 전 연구과정을 통하여 "갑"의 요청이 있을 때는 수시로 연구내용에 관하여 
            "갑"과 협의하며, "갑" 또한 필요한 사항을 "을"에게 적극 협조한다.
          </Text>
        </Article>

        {/* 제6조 보고서 및 관계자료 제출 */}
        <Article number={6} title="보고서 및 관계자료 제출">
          <Text style={contractStyles.articleContent}>
            1) "갑"과 "을"은 연구개시 후 수시로 연구진척에 관한 내용에 관하여 상의할 수 있고, 
            연구결과에 대하여 "갑"에게 결과보고서를 제출한다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) "을"은 "갑"또는 "갑"이 지정하는 자의 연구개발 현장 확인, 관계서류의 열람, 
            관계자료의 제출요청에 성실히 응하도록 하여야 한다.
          </Text>
        </Article>

        {/* 제7조 연구의 완성 및 종료 */}
        <Article number={7} title="연구의 완성 및 종료">
          <Text style={contractStyles.articleContent}>
            본 연구는 "을"이 "갑"에게 제출한 결과보고서(안)를 검토하고 연구가 완료된 것을 
            승낙함으로써 종료되며, "갑"은 필요한 경우 "을"에게 보고서 내용의 보완을 요청할 수 있다.
          </Text>
        </Article>

        {/* 제8조 비밀정보 */}
        <Article number={8} title="비밀정보">
          <Text style={contractStyles.articleContent}>
            1) "비밀정보"라 함은 "을"이 본 계약과 관련하여 구두, 문서, 컴퓨터 파일, Fax등 
            "갑"으로부터 제공받거나 인지하게 된 일체의 정보를 말하며, 이를 비롯한 기타 쌍방의 
            "비밀정보"는 상호간의 서면 동의 없이 양 당사자를 제외한 제 3자에게 반출, 복사, 
            복제, 유출, 판매, 누설, 발표되어서는 아니 된다. 단 관련 법령이나 공공기관의 결정 
            및/또는 명령에 의한 경우는 예외로 한다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) "을"은 "갑"으로부터 제공받은 비밀정보의 제 3자에게로의 공개와 전달을 방지하기 
            위하여 "을"은 내부적으로 동일 수준의 비밀정보를 보호하는 것과 같이 최대한 보호하여야 
            할 의무와 책임이 있다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            3) 본 조의 비밀준수의무는 본 계약의 계약기간 종료에도 불구하고 본 계약이 종료된 
            날로부터 10년간 그 효력이 지속되는 것으로 한다.
          </Text>
        </Article>

        <View style={contractStyles.footer}>
          <Text>{data.partyB.name} | 계약서 1/2</Text>
        </View>
      </Page>

      {/* 2페이지: 제9조 ~ 서명란 */}
      <Page size="A4" style={contractStyles.page}>
        {/* 제9조 연구결과의 귀속 */}
        <Article number={9} title="연구결과의 귀속">
          <Text style={contractStyles.articleContent}>
            1) "을"은 본 연구의 연구결과, Know-How 및 본 연구결과로 기대되는 특허권 및 
            지적재산권, 유형적 발생품, 시작품, 보고서의 판권 등은 "갑"의 소유임을 인정하고 
            "갑"으로 하여금 당해 권리를 승계할 수 있도록 협조한다. 또한 "을"은 연구결과에 
            대해 "갑"의 명의로 특허 등 지적 재산권을 확보하는 조치를 취하기 위하여 최대한 
            노력하여야 한다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) "을"은 "갑"에게 승계하거나, "갑"이 취득한 본 연구의 연구결과를 직접 실시하거나 
            제3자에게 이에 대한 실시권을 설정할 수 없다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            3) "을"은 연구 결과물이 제3자의 지식재산권을 침해하지 않는다는 것을 보증하지 않으며 
            제3자의 지식재산권을 침해할 경우 손해배상 등의 책임을 지지 않는다.
          </Text>
        </Article>

        {/* 제10조 보관 */}
        <Article number={10} title="보 관">
          <Text style={contractStyles.articleContent}>
            1) 최종보고서 제출일로부터 5년간 연구에 관련된 "결과보고서, Raw data 및 검체"
            (이하 "연구자료"라 한다.)는 "을"의 "자료보관실"에서 보관하며, "갑"의 요청이나 
            시험계획서에 따른 변경이 필요한 경우에 그 이후의 보관에 대하여는 "갑"과 협의한다. 
            "갑"은 보관기간의 연장 여부를 결정하여야 하고, 보관기간이 연장이 되는 경우에는 
            "을"에게 보관료를 지불한다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) "갑"은 보관기간의 연장 여부에 대해서 회신을 해야하며, 문의 후 2개월 이내에 
            회신이 없는 경우, "을"은 해당 연구자료를 폐기할 수 있다.
          </Text>
        </Article>

        {/* 제11조 계약의 변경 */}
        <Article number={11} title="계약의 변경">
          <Text style={contractStyles.articleContent}>
            "갑" 또는 "을"의 요청이 있거나 필요한 경우에는 서면 합의에 의하여 본 계약서의 
            내용을 변경할 수 있다.
          </Text>
        </Article>

        {/* 제12조 계약의 해지 */}
        <Article number={12} title="계약의 해지">
          <Text style={contractStyles.articleContent}>
            1) "갑"은 "을"이 본 연구를 수행할 능력이 없다고 명백하고 객관적으로 인정될 경우에는 
            즉시 "을"에게 이를 통보하고 협의한 후 계약을 해지 할 수 있다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) "갑"은 "을"이 본 계약을 위배하여 원활한 연구수행이 극히 곤란하다고 명백하고 
            객관적으로 인정될 경우에는 즉시 "을"에게 이의 개선을 통고하고 통고 후 14일 이내에 
            시정되지 않으면 본 계약을 해지할 수 있다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            3) "을"은 "갑"이 본 계약을 위배하여 원활한 연구수행에 곤란함을 초래한다고 인정될 
            경우에는 즉시 "갑"에게 이의 개선을 통고하고 통고 후 1주일 이내에 시정되지 않으면 
            본 계약을 해지할 수 있다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            4) 위 1), 2) 및 3)항에 의하여 계약이 해지될 경우 "을"은 해지일로부터 1개월 이내에 
            해지 시까지의 결과보고서를 "갑"에게 제출하여야 하며, "을"은 수령한 연구 용역비 중 
            본 연구수행에 소요된 비용을 제외하고 나머지 잔액을 "갑"에게 반환할 수 있다.
          </Text>
        </Article>

        {/* 제13조 계약의 효력발생 */}
        <Article number={13} title="계약의 효력발생">
          <Text style={contractStyles.articleContent}>
            본 계약은 당사자가 서명 날인한 날로부터 유효하다. "을"은 "갑"의 서면동의 없이 
            본 계약에 의하여 취득하는 제반 권리를 제 3자에게 제공하거나 양도할 수 없다.
          </Text>
        </Article>

        {/* 제14조 지체상금 */}
        <Article number={14} title="지체상금">
          <Text style={contractStyles.articleContent}>
            "을"이 제2조에 명시되어 있는 연구기간을 초과하여 연구의 완성 또는 종료의 지체가 
            20일 이상 계속되는 경우, "을"은 "갑"에게 납득할 만한 정당한 사유와 근거를 제시하여야 
            하며, 이의 입증과 제시가 불가할 경우에 "을"은 "갑"에게 지체일수에 대한 지체상금을 
            현금으로 지급하되 지체 상금률은 1일 지체당 총 연구개발비의 1/1000을 지급한다. 
            단 "갑"의 귀책사유 또는 불가항력적인 사유로 인해 "을"이 제2조의 연구기간을 준수하지 
            못한 경우에는 예외로 한다.
          </Text>
        </Article>

        {/* 제15조 손해배상 */}
        <Article number={15} title="손해배상">
          <Text style={contractStyles.articleContent}>
            본 계약의 일방 당사자가 본 계약을 위반하거나, 기타 고의 또는 과실로 인하여 상대방에게 
            손해가 발생하는 경우 귀책당사자는 상대방의 손해를 배상하여야 한다.
          </Text>
        </Article>

        {/* 제16조 분쟁해결 및 관할법원 */}
        <Article number={16} title="분쟁해결 및 관할법원">
          <Text style={contractStyles.articleContent}>
            1) 본 계약서에 명시되지 아니한 사항이나 해석상 불분명한 사항에 대해서는 관련법규, 
            관계 법령 및 일반적 상관례에 따라 상호 호혜적 입장에서 당사자간에 협의하여 결정한다.
          </Text>
          <Text style={contractStyles.articleSubItem}>
            2) 당사자간 우호적으로 분쟁이 해결되지 않을 경우 대한민국의 법률을 적용하여 
            서울중앙지방법원을 관할 법원으로 한다.
          </Text>
        </Article>

        {/* 계약 체결 안내문 */}
        <Text style={[contractStyles.articleContent, contractStyles.mt20]}>
          위 사항을 증명하기 위하여 각 당사자는 서명, 날인하여 각각 1부씩 보관한다.
        </Text>

        {/* 첨부 */}
        <AttachmentSection attachments={data.attachments} />

        {/* 서명란 */}
        <SignatureSection data={data} />

        <View style={contractStyles.footer}>
          <Text>{data.partyB.name} | 계약서 2/2</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContractPDF;
