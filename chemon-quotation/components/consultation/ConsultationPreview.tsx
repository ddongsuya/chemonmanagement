'use client';

import {
  ConsultationRecordData,
  QuotationContentItem,
} from '@/lib/consultation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConsultationPreviewProps {
  data: ConsultationRecordData;
  quotationItems: QuotationContentItem[];
}

export default function ConsultationPreview({
  data,
  quotationItems,
}: ConsultationPreviewProps) {
  return (
    <Tabs defaultValue="main" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="main">상담기록지</TabsTrigger>
        <TabsTrigger value="quotation">견적내용 (가격표시x)</TabsTrigger>
      </TabsList>

      <TabsContent value="main">
        <ScrollArea className="h-[500px] border rounded-lg bg-white">
          <div className="p-6">
            {/* 제목 */}
            <div className="bg-blue-600 text-white text-center py-3 font-bold text-lg mb-4 rounded">
              견적 의뢰 기초 자료
            </div>

            {/* 기본 정보 테이블 */}
            <table className="w-full border-collapse text-sm mb-4">
              <tbody>
                <tr>
                  <td className="border p-2 bg-gray-100 font-medium w-24">
                    물질
                  </td>
                  <td className="border p-2" colSpan={2}>
                    {data.basic.substanceName}
                  </td>
                  <td className="border p-2 bg-gray-100 font-medium w-24">
                    작성자
                  </td>
                  <td className="border p-2">{data.basic.authorName}</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-gray-100 font-medium">
                    의뢰기관
                  </td>
                  <td className="border p-2" colSpan={2}>
                    {data.basic.clientCompany}
                  </td>
                  <td className="border p-2 bg-gray-100 font-medium">의뢰자</td>
                  <td className="border p-2">{data.basic.clientContact}</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-gray-100 font-medium">연락처</td>
                  <td className="border p-2 bg-gray-100 font-medium w-16">
                    Tel
                  </td>
                  <td className="border p-2">{data.basic.clientTel}</td>
                  <td className="border p-2 bg-gray-100 font-medium">e mail</td>
                  <td className="border p-2">{data.basic.clientEmail}</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-gray-100 font-medium" colSpan={3}>
                    물질 제공 예상 일정
                  </td>
                  <td className="border p-2" colSpan={2}>
                    {data.basic.substanceDeliveryDate || '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 항목 헤더 */}
            <table className="w-full border-collapse text-sm mb-0">
              <tbody>
                <tr>
                  <td
                    className="border p-2 bg-gray-100 font-medium text-center"
                    colSpan={2}
                  >
                    항 목
                  </td>
                  <td
                    className="border p-2 bg-gray-100 font-medium text-center"
                    colSpan={2}
                  >
                    각 항목에 대해서 자세히 기입해 주세요
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 시험의 종류 */}
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['독성시험', data.testTypes.toxicity],
                  ['유전독성', data.testTypes.genotoxicity],
                  ['약효시험', data.testTypes.efficacy],
                  ['일반약리/안전성약리', data.testTypes.safetyPharmacology],
                  ['혈액검사', data.testTypes.hematology],
                  ['조직병리검사', data.testTypes.histopathology],
                  ['분석시험', data.testTypes.analysis],
                  ['기타', data.testTypes.others],
                ].map(([label, value], index) => (
                  <tr key={label}>
                    {index === 0 && (
                      <td
                        className="border p-2 bg-gray-100 font-medium text-center w-24"
                        rowSpan={8}
                      >
                        시험의
                        <br />
                        종류
                      </td>
                    )}
                    <td className="border p-2 bg-gray-100 font-medium w-36">
                      {label}
                    </td>
                    <td className="border p-2" colSpan={2}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 시험계 */}
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['설치류', data.animals.rodent],
                  ['비설치류', data.animals.nonRodent],
                  ['토끼', data.animals.rabbit],
                  ['기니픽', data.animals.guineaPig],
                  ['기타', data.animals.others],
                ].map(([label, value], index) => (
                  <tr key={label}>
                    {index === 0 && (
                      <td
                        className="border p-2 bg-gray-100 font-medium text-center w-24"
                        rowSpan={5}
                      >
                        시험계
                      </td>
                    )}
                    <td className="border p-2 bg-gray-100 font-medium w-36">
                      {label}
                    </td>
                    <td className="border p-2" colSpan={2}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 시험물질 */}
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['시험물질 종류', data.substance.type],
                  ['적응증', data.substance.indication],
                  ['투여경로', data.substance.administrationRoute],
                  ['임상투여기간', data.substance.clinicalDuration],
                  ['보관조건', data.substance.storageCondition],
                  ['기타', data.substance.otherInfo],
                ].map(([label, value], index) => (
                  <tr key={label}>
                    {index === 0 && (
                      <td
                        className="border p-2 bg-gray-100 font-medium text-center w-24"
                        rowSpan={6}
                      >
                        시험물질
                      </td>
                    )}
                    <td className="border p-2 bg-gray-100 font-medium w-36">
                      {label}
                    </td>
                    <td className="border p-2" colSpan={2}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 다지점시험 */}
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['다지점시험여부', data.multiSite.isMultiSite],
                  ['위임범위(시험항목)', data.multiSite.delegationScope],
                  ['다지점시험장소, 담당자 연락처', data.multiSite.siteInfo],
                ].map(([label, value], index) => (
                  <tr key={label}>
                    {index === 0 && (
                      <td
                        className="border p-2 bg-gray-100 font-medium text-center w-24"
                        rowSpan={3}
                      >
                        다지점
                        <br />
                        시험
                      </td>
                    )}
                    <td className="border p-2 bg-gray-100 font-medium w-36">
                      {label}
                    </td>
                    <td className="border p-2" colSpan={2}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 자료 보관기간 */}
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td
                    className="border p-2 bg-gray-100 font-medium text-center"
                    colSpan={2}
                  >
                    자료 보관기간
                  </td>
                  <td className="border p-2" colSpan={2}>
                    {data.retentionPeriod}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 상담 내역 */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-100 font-medium w-24">
                    날짜
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-24">
                    상담자
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium">
                    상담내용
                  </th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((index) => {
                  const consultation = data.consultations[index];
                  return (
                    <tr key={index}>
                      <td className="border p-2 h-12">
                        {consultation?.date || ''}
                      </td>
                      <td className="border p-2">
                        {consultation?.consultant || ''}
                      </td>
                      <td className="border p-2">
                        {consultation?.content || ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="quotation">
        <ScrollArea className="h-[500px] border rounded-lg bg-white">
          <div className="p-6">
            {/* 안내 문구 */}
            <p className="text-sm text-gray-500 italic mb-4">
              ※ 계약서에 첨부된 견적서 내용 - 가격부분은 제외, 시험 내용만
            </p>

            {/* 견적 내용 테이블 */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-100 font-medium w-12">
                    No.
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium">시험명</th>
                  <th className="border p-2 bg-gray-100 font-medium w-24">
                    동물종
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-16">
                    기간
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-20">
                    투여경로
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-16">
                    동물수
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-12">
                    군수
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-28">
                    옵션
                  </th>
                  <th className="border p-2 bg-gray-100 font-medium w-24">
                    비고
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotationItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="border p-4 text-center text-gray-500"
                    >
                      시험 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  quotationItems.map((item) => (
                    <tr key={item.no}>
                      <td className="border p-2 text-center">{item.no}</td>
                      <td className="border p-2">{item.testName}</td>
                      <td className="border p-2 text-center">{item.species}</td>
                      <td className="border p-2 text-center">{item.duration}</td>
                      <td className="border p-2 text-center">{item.route}</td>
                      <td className="border p-2 text-center">
                        {item.animalCount}
                      </td>
                      <td className="border p-2 text-center">
                        {item.groupCount}
                      </td>
                      <td className="border p-2">{item.options}</td>
                      <td className="border p-2">{item.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
