'use client';

import { ContractData } from '@/lib/contract/types';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContractPreviewProps {
  data: ContractData;
}

export default function ContractPreview({ data }: ContractPreviewProps) {
  return (
    <ScrollArea className="h-[600px] border rounded-lg bg-white">
      <div className="p-8 space-y-6 text-sm leading-relaxed">
        {/* 제목 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-widest">
            위 탁 연 구 계 약 서{data.contract.isDraft ? '(안)' : ''}
          </h1>
          <p className="text-gray-500">(Contract Sheet)</p>
        </div>

        {/* 계약 당사자 */}
        <p className="text-justify">
          <strong>{data.customer.companyName}</strong> (이하 "갑"이라 한다.)와{' '}
          <strong>코아스템켐온㈜</strong> (이하 "을"이라 한다.)과 "갑"의{' '}
          <strong>{data.project.name}</strong>(이하 "연구"라 한다.) 수행을 위하여 
          "을"이 "갑"으로부터 관련사항에 대한 연구를 위탁 받아 수행하기로 하고 아래와 같이 합의한다.
        </p>

        {/* 제1조 */}
        <ArticleSection number={1} title="연구의 목적">
          <p>본 연구는 비임상시험을 "갑"으로부터 용역 받아 동물실험 등을 실시하며, 이를 통하여 "갑"의 연구수행의 결과물을 확보하는 데 있다.</p>
        </ArticleSection>

        {/* 제2조 */}
        <ArticleSection number={2} title="연구의 내용 및 범위">
          <p className="mb-3">"을"은 "갑"이 지원하는 연구비에 의해 연구를 실시하며, "갑"과 "을"의 합의 하에 변경 가능하다.</p>
          <table className="w-full border-collapse border text-sm">
            <tbody>
              <tr>
                <td className="border p-2 bg-gray-50 font-medium w-28">연구과제명</td>
                <td className="border p-2">{data.project.name}</td>
              </tr>
              <tr>
                <td className="border p-2 bg-gray-50 font-medium">연 구 비</td>
                <td className="border p-2">
                  금 {data.payment.advancePayment.amountInKorean}원정 (₩ {formatCurrency(data.payment.subtotal)})
                  <span className="text-xs text-gray-500 ml-2">부가세 별도</span>
                </td>
              </tr>
              <tr>
                <td className="border p-2 bg-gray-50 font-medium">연구기간</td>
                <td className="border p-2">{data.period.displayText}</td>
              </tr>
            </tbody>
          </table>
        </ArticleSection>

        {/* 제3조 */}
        <ArticleSection number={3} title="연구 일정">
          <p>1) 본 연구기간 동안의 세부일정은 시험계획서에 명기된 내용으로 하며, "갑"과 "을" 쌍방의 합의에 의하여 조정될 수 있다.</p>
          <p>2) 시험물질은 협의된 개시 일정의 3주 전까지 입고되어야 하며, 물질 입고 지연 및 의뢰자의 일방적인 시험 취소 등으로 인한 동물실 일정 변경은 계약금액의 5% 수수료(부가세 별도) 비용이 발생된다.</p>
        </ArticleSection>

        {/* 제4조 */}
        <ArticleSection number={4} title="연구용역비">
          <p className="mb-3">1) 본 용역을 수행함에 있어서, "갑"은 "을"에게 연구용역비로 금 {data.payment.advancePayment.amountInKorean}원정 (₩ {formatCurrency(data.payment.subtotal)}) 부가세 별도를 지급한다.</p>
          <p className="mb-3">2) 연구용역비는 현금으로 지급하며, 지급조건은 아래의 표에 따른다.</p>
          <table className="w-full border-collapse border text-sm mb-3">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 w-20">구분</th>
                <th className="border p-2">금액</th>
                <th className="border p-2 w-40">지불</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2 text-center">선금</td>
                <td className="border p-2">
                  금 {data.payment.advancePayment.amountInKorean}원정<br/>
                  <span className="text-xs text-gray-500">(₩ {formatCurrency(data.payment.advancePayment.amount)}) 부가세 별도</span>
                </td>
                <td className="border p-2 text-sm">{data.payment.advancePayment.dueCondition}</td>
              </tr>
              <tr>
                <td className="border p-2 text-center">잔금</td>
                <td className="border p-2">
                  금 {data.payment.remainingPayment.amountInKorean}원정<br/>
                  <span className="text-xs text-gray-500">(₩ {formatCurrency(data.payment.remainingPayment.amount)}) 부가세 별도</span>
                </td>
                <td className="border p-2 text-sm">{data.payment.remainingPayment.dueCondition}</td>
              </tr>
            </tbody>
          </table>
          <p>3) "갑"은 "을"에게 부가세를 포함한 연구용역비를 세금계산서 발행일로부터 30일 이내 신한은행 (계좌번호 : 140-007-295200, 예금주 : 코아스템켐온㈜)으로 입금하도록 한다.</p>
        </ArticleSection>

        {/* 제5조 ~ 제8조 */}
        <ArticleSection number={5} title="상호협조">
          <p>"을"은 전 연구과정을 통하여 "갑"의 요청이 있을 때는 수시로 연구내용에 관하여 "갑"과 협의하며, "갑" 또한 필요한 사항을 "을"에게 적극 협조한다.</p>
        </ArticleSection>

        <ArticleSection number={6} title="보고서 및 관계자료 제출">
          <p>1) "갑"과 "을"은 연구개시 후 수시로 연구진척에 관한 내용에 관하여 상의할 수 있고, 연구결과에 대하여 "갑"에게 결과보고서를 제출한다.</p>
          <p>2) "을"은 "갑"또는 "갑"이 지정하는 자의 연구개발 현장 확인, 관계서류의 열람, 관계자료의 제출요청에 성실히 응하도록 하여야 한다.</p>
        </ArticleSection>

        <ArticleSection number={7} title="연구의 완성 및 종료">
          <p>본 연구는 "을"이 "갑"에게 제출한 결과보고서(안)를 검토하고 연구가 완료된 것을 승낙함으로써 종료되며, "갑"은 필요한 경우 "을"에게 보고서 내용의 보완을 요청할 수 있다.</p>
        </ArticleSection>

        <ArticleSection number={8} title="비밀정보">
          <p>1) "비밀정보"라 함은 "을"이 본 계약과 관련하여 구두, 문서, 컴퓨터 파일, Fax등 "갑"으로부터 제공받거나 인지하게 된 일체의 정보를 말하며, 이를 비롯한 기타 쌍방의 "비밀정보"는 상호간의 서면 동의 없이 양 당사자를 제외한 제 3자에게 반출, 복사, 복제, 유출, 판매, 누설, 발표되어서는 아니 된다.</p>
          <p>2) "을"은 "갑"으로부터 제공받은 비밀정보의 제 3자에게로의 공개와 전달을 방지하기 위하여 "을"은 내부적으로 동일 수준의 비밀정보를 보호하는 것과 같이 최대한 보호하여야 할 의무와 책임이 있다.</p>
          <p>3) 본 조의 비밀준수의무는 본 계약의 계약기간 종료에도 불구하고 본 계약이 종료된 날로부터 10년간 그 효력이 지속되는 것으로 한다.</p>
        </ArticleSection>

        {/* 제9조 ~ 제12조 */}
        <ArticleSection number={9} title="연구결과의 귀속">
          <p>1) "을"은 본 연구의 연구결과, Know-How 및 본 연구결과로 기대되는 특허권 및 지적재산권, 유형적 발생품, 시작품, 보고서의 판권 등은 "갑"의 소유임을 인정하고 "갑"으로 하여금 당해 권리를 승계할 수 있도록 협조한다.</p>
          <p>2) "을"은 "갑"에게 승계하거나, "갑"이 취득한 본 연구의 연구결과를 직접 실시하거나 제3자에게 이에 대한 실시권을 설정할 수 없다.</p>
        </ArticleSection>

        <ArticleSection number={10} title="보 관">
          <p>1) 최종보고서 제출일로부터 5년간 연구에 관련된 "결과보고서, Raw data 및 검체"는 "을"의 "자료보관실"에서 보관하며, "갑"의 요청이나 시험계획서에 따른 변경이 필요한 경우에 그 이후의 보관에 대하여는 "갑"과 협의한다.</p>
          <p>2) "갑"은 보관기간의 연장 여부에 대해서 회신을 해야하며, 문의 후 2개월 이내에 회신이 없는 경우, "을"은 해당 연구자료를 폐기할 수 있다.</p>
        </ArticleSection>

        <ArticleSection number={11} title="계약의 변경">
          <p>"갑" 또는 "을"의 요청이 있거나 필요한 경우에는 서면 합의에 의하여 본 계약서의 내용을 변경할 수 있다.</p>
        </ArticleSection>

        <ArticleSection number={12} title="계약의 해지">
          <p>1) "갑"은 "을"이 본 연구를 수행할 능력이 없다고 명백하고 객관적으로 인정될 경우에는 즉시 "을"에게 이를 통보하고 협의한 후 계약을 해지 할 수 있다.</p>
          <p>2) "갑"은 "을"이 본 계약을 위배하여 원활한 연구수행이 극히 곤란하다고 인정될 경우에는 즉시 "을"에게 이의 개선을 통고하고 통고 후 14일 이내에 시정되지 않으면 본 계약을 해지할 수 있다.</p>
        </ArticleSection>

        {/* 제13조 ~ 제16조 */}
        <ArticleSection number={13} title="계약의 효력발생">
          <p>본 계약은 당사자가 서명 날인한 날로부터 유효하다. "을"은 "갑"의 서면동의 없이 본 계약에 의하여 취득하는 제반 권리를 제 3자에게 제공하거나 양도할 수 없다.</p>
        </ArticleSection>

        <ArticleSection number={14} title="지체상금">
          <p>"을"이 제2조에 명시되어 있는 연구기간을 초과하여 연구의 완성 또는 종료의 지체가 20일 이상 계속되는 경우, "을"은 "갑"에게 납득할 만한 정당한 사유와 근거를 제시하여야 한다.</p>
        </ArticleSection>

        <ArticleSection number={15} title="손해배상">
          <p>본 계약의 일방 당사자가 본 계약을 위반하거나, 기타 고의 또는 과실로 인하여 상대방에게 손해가 발생하는 경우 귀책당사자는 상대방의 손해를 배상하여야 한다.</p>
        </ArticleSection>

        <ArticleSection number={16} title="분쟁해결 및 관할법원">
          <p>1) 본 계약서에 명시되지 아니한 사항이나 해석상 불분명한 사항에 대해서는 관련법규, 관계 법령 및 일반적 상관례에 따라 상호 호혜적 입장에서 당사자간에 협의하여 결정한다.</p>
          <p>2) 당사자간 우호적으로 분쟁이 해결되지 않을 경우 대한민국의 법률을 적용하여 서울중앙지방법원을 관할 법원으로 한다.</p>
        </ArticleSection>

        {/* 증명 문구 */}
        <p className="mt-6">위 사항을 증명하기 위하여 각 당사자는 서명, 날인하여 각각 1부씩 보관한다.</p>
        <p className="font-medium"># 별첨 1. 견적서</p>

        {/* 계약일 */}
        <p className="text-center text-lg font-bold my-6">{data.contract.date}</p>

        {/* 서명란 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b text-center">
            <p className="font-bold">"갑"</p>
            <p>{data.customer.companyName}</p>
            <p className="text-sm text-gray-500">{data.customer.address}</p>
            <p>대표이사 : {data.customer.ceoName} (인)</p>
          </div>
          <div className="p-4 text-center">
            <p className="font-bold">"을"</p>
            <p>코아스템켐온㈜ 양지지점</p>
            <p className="text-sm text-gray-500">경기도 용인시 처인구 양지면 남평로 240</p>
            <p>대표이사 : 양 길 안 (인)</p>
          </div>
        </div>

        {/* 별첨 견적서 */}
        <div className="mt-8 pt-6 border-t">
          <h2 className="text-center text-lg font-bold mb-4"># 별첨 1. 견적서</h2>
          <p className="mb-3">견적번호: {data.quotation.quotationNo}</p>
          <table className="w-full border-collapse border text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 w-10">No</th>
                <th className="border p-2">시험명</th>
                <th className="border p-2 w-20">동물종</th>
                <th className="border p-2 w-16">기간</th>
                <th className="border p-2 w-24 text-right">단가</th>
                <th className="border p-2 w-24 text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {data.quotation.items.map((item) => (
                <tr key={item.no}>
                  <td className="border p-2 text-center">{item.no}</td>
                  <td className="border p-2">{item.testName}</td>
                  <td className="border p-2 text-center">{item.species || '-'}</td>
                  <td className="border p-2 text-center">{item.duration || '-'}</td>
                  <td className="border p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="border p-2 text-right">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td colSpan={5} className="border p-2 text-right">합계 (VAT 별도)</td>
                <td className="border p-2 text-right">{formatCurrency(data.payment.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  );
}

// 조항 섹션 컴포넌트
function ArticleSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold">제 {number} 조 {title}</h3>
      <div className="space-y-1 pl-2">{children}</div>
    </div>
  );
}
