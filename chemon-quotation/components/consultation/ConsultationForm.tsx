'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ConsultationRecordData,
  ConsultationEntry,
  ConsultationFormData,
} from '@/lib/consultation/types';
import {
  categorizeTests,
  categoriesToStrings,
} from '@/lib/consultation/test-categorizer';
import {
  extractAnimals,
  animalsToStrings,
} from '@/lib/consultation/animal-extractor';
import { QuotationItem } from '@/types';
import {
  Building2,
  User,
  FlaskConical,
  PawPrint,
  Calendar,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';

interface ConsultationFormProps {
  quotationData: {
    projectName: string;
    items: QuotationItem[];
    customerName: string;
    customerContact?: string;
    customerTel?: string;
    customerEmail?: string;
  };
  onSubmit: (data: ConsultationRecordData) => void;
  isLoading?: boolean;
}

export default function ConsultationForm({
  quotationData,
  onSubmit,
  isLoading,
}: ConsultationFormProps) {
  // 견적서에서 자동으로 분류
  const categorized = categorizeTests(quotationData.items);
  const testStrings = categoriesToStrings(categorized);
  const animals = extractAnimals(quotationData.items);
  const animalStrings = animalsToStrings(animals);

  const [formData, setFormData] = useState<ConsultationFormData>({
    // 기본 정보
    substanceName: quotationData.projectName,
    authorName: '',
    substanceDeliveryDate: '',

    // 시험물질 정보
    substanceType: '',
    indication: '',
    administrationRoute: '',
    clinicalDuration: '',
    storageCondition: '',
    otherInfo: '',

    // 다지점시험
    isMultiSite: '없음',
    delegationScope: '',
    siteInfo: '',

    // 자료 보관기간
    retentionPeriod: '5년',

    // 상담 내역
    consultations: [],
  });

  const handleChange = (
    field: keyof ConsultationFormData,
    value: string | ConsultationEntry[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 상담 내역 추가
  const addConsultation = () => {
    if (formData.consultations.length < 5) {
      handleChange('consultations', [
        ...formData.consultations,
        { date: '', consultant: '', content: '' },
      ]);
    }
  };

  // 상담 내역 삭제
  const removeConsultation = (index: number) => {
    const updated = formData.consultations.filter((_, i) => i !== index);
    handleChange('consultations', updated);
  };

  // 상담 내역 수정
  const updateConsultation = (
    index: number,
    field: keyof ConsultationEntry,
    value: string
  ) => {
    const updated = formData.consultations.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    handleChange('consultations', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: ConsultationRecordData = {
      basic: {
        substanceName: formData.substanceName,
        authorName: formData.authorName,
        clientCompany: quotationData.customerName,
        clientContact: quotationData.customerContact || '',
        clientTel: quotationData.customerTel || '',
        clientEmail: quotationData.customerEmail || '',
        substanceDeliveryDate: formData.substanceDeliveryDate,
      },
      testTypes: {
        toxicity: testStrings.toxicity,
        genotoxicity: testStrings.genotoxicity,
        efficacy: testStrings.efficacy,
        safetyPharmacology: testStrings.safetyPharmacology,
        hematology: testStrings.hematology,
        histopathology: testStrings.histopathology,
        analysis: testStrings.analysis,
        others: testStrings.others,
      },
      animals: {
        rodent: animalStrings.rodent,
        nonRodent: animalStrings.nonRodent,
        rabbit: animalStrings.rabbit,
        guineaPig: animalStrings.guineaPig,
        others: animalStrings.others,
      },
      substance: {
        type: formData.substanceType || '-',
        indication: formData.indication || '-',
        administrationRoute: formData.administrationRoute || '-',
        clinicalDuration: formData.clinicalDuration || '-',
        storageCondition: formData.storageCondition || '-',
        otherInfo: formData.otherInfo || '-',
      },
      multiSite: {
        isMultiSite: formData.isMultiSite,
        delegationScope: formData.delegationScope || '-',
        siteInfo: formData.siteInfo || '-',
      },
      retentionPeriod: formData.retentionPeriod,
      consultations: formData.consultations,
    };

    onSubmit(data);
  };

  const isValid = formData.authorName && formData.substanceName;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="substanceName">시험 물질명 *</Label>
              <Input
                id="substanceName"
                value={formData.substanceName}
                onChange={(e) => handleChange('substanceName', e.target.value)}
                placeholder="예: BP-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorName">작성자 *</Label>
              <Input
                id="authorName"
                value={formData.authorName}
                onChange={(e) => handleChange('authorName', e.target.value)}
                placeholder="상담기록지 작성 담당자명"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">의뢰기관:</span>{' '}
              {quotationData.customerName}
            </p>
            {quotationData.customerContact && (
              <p>
                <span className="text-muted-foreground">의뢰자:</span>{' '}
                {quotationData.customerContact}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="substanceDeliveryDate">
              시험물질 제공 예상 일자
            </Label>
            <Input
              id="substanceDeliveryDate"
              type="date"
              value={formData.substanceDeliveryDate}
              onChange={(e) =>
                handleChange('substanceDeliveryDate', e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 시험의 종류 (자동 분류) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            시험의 종류 (자동 분류)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries({
              독성시험: testStrings.toxicity,
              유전독성: testStrings.genotoxicity,
              약효시험: testStrings.efficacy,
              '일반약리/안전성약리': testStrings.safetyPharmacology,
              혈액검사: testStrings.hematology,
              조직병리검사: testStrings.histopathology,
              분석시험: testStrings.analysis,
              기타: testStrings.others,
            }).map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <Badge variant="outline" className="shrink-0">
                  {label}
                </Badge>
                <span className="text-muted-foreground truncate">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 시험계 (자동 추출) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="w-5 h-5" />
            시험계 - 동물종 (자동 추출)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {Object.entries({
              설치류: animalStrings.rodent,
              비설치류: animalStrings.nonRodent,
              토끼: animalStrings.rabbit,
              기니픽: animalStrings.guineaPig,
              기타: animalStrings.others,
            }).map(([label, value]) => (
              <div key={label} className="p-2 border rounded-lg">
                <p className="font-medium text-xs text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 시험물질 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            시험물질 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="substanceType">시험물질 종류</Label>
              <Select
                value={formData.substanceType}
                onValueChange={(v) => handleChange('substanceType', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="합성의약품">합성의약품</SelectItem>
                  <SelectItem value="바이오의약품">바이오의약품</SelectItem>
                  <SelectItem value="천연물의약품">천연물의약품</SelectItem>
                  <SelectItem value="세포치료제">세포치료제</SelectItem>
                  <SelectItem value="유전자치료제">유전자치료제</SelectItem>
                  <SelectItem value="화장품">화장품</SelectItem>
                  <SelectItem value="의료기기">의료기기</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="indication">적응증</Label>
              <Input
                id="indication"
                value={formData.indication}
                onChange={(e) => handleChange('indication', e.target.value)}
                placeholder="예: 항암제, 당뇨병 치료제"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="administrationRoute">투여경로</Label>
              <Select
                value={formData.administrationRoute}
                onValueChange={(v) => handleChange('administrationRoute', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="경구">경구 (PO)</SelectItem>
                  <SelectItem value="정맥">정맥 (IV)</SelectItem>
                  <SelectItem value="피하">피하 (SC)</SelectItem>
                  <SelectItem value="근육">근육 (IM)</SelectItem>
                  <SelectItem value="복강">복강 (IP)</SelectItem>
                  <SelectItem value="경피">경피</SelectItem>
                  <SelectItem value="흡입">흡입</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicalDuration">임상투여기간</Label>
              <Input
                id="clinicalDuration"
                value={formData.clinicalDuration}
                onChange={(e) =>
                  handleChange('clinicalDuration', e.target.value)
                }
                placeholder="예: 4주, 13주, 6개월"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storageCondition">보관조건</Label>
              <Select
                value={formData.storageCondition}
                onValueChange={(v) => handleChange('storageCondition', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="실온">실온</SelectItem>
                  <SelectItem value="냉장 (2-8°C)">냉장 (2-8°C)</SelectItem>
                  <SelectItem value="냉동 (-20°C)">냉동 (-20°C)</SelectItem>
                  <SelectItem value="초저온 (-80°C)">초저온 (-80°C)</SelectItem>
                  <SelectItem value="차광보관">차광보관</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherInfo">기타 사항</Label>
              <Input
                id="otherInfo"
                value={formData.otherInfo}
                onChange={(e) => handleChange('otherInfo', e.target.value)}
                placeholder="예: 빛에 민감, 특수 취급 필요"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 다지점시험 */}
      <Card>
        <CardHeader>
          <CardTitle>다지점시험</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>다지점시험 여부</Label>
              <Select
                value={formData.isMultiSite}
                onValueChange={(v) => handleChange('isMultiSite', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="없음">없음</SelectItem>
                  <SelectItem value="있음">있음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.isMultiSite === '있음' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="delegationScope">위임범위 (시험항목)</Label>
                  <Input
                    id="delegationScope"
                    value={formData.delegationScope}
                    onChange={(e) =>
                      handleChange('delegationScope', e.target.value)
                    }
                    placeholder="위임한 시험 항목"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteInfo">다지점 시험장소/담당자</Label>
                  <Input
                    id="siteInfo"
                    value={formData.siteInfo}
                    onChange={(e) => handleChange('siteInfo', e.target.value)}
                    placeholder="기관명, 담당자 연락처"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 자료 보관기간 */}
      <Card>
        <CardHeader>
          <CardTitle>자료 보관기간</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.retentionPeriod}
            onValueChange={(v) => handleChange('retentionPeriod', v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5년">5년</SelectItem>
              <SelectItem value="10년">10년</SelectItem>
              <SelectItem value="15년">15년</SelectItem>
              <SelectItem value="영구">영구</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 상담 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              상담 내역
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addConsultation}
              disabled={formData.consultations.length >= 5}
            >
              <Plus className="w-4 h-4 mr-1" />
              추가 ({formData.consultations.length}/5)
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.consultations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              상담 내역이 없습니다. 추가 버튼을 클릭하여 상담 내역을 입력하세요.
            </p>
          ) : (
            formData.consultations.map((consultation, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg space-y-3 relative"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeConsultation(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">상담 날짜</Label>
                    <Input
                      type="date"
                      value={consultation.date}
                      onChange={(e) =>
                        updateConsultation(index, 'date', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">상담자</Label>
                    <Input
                      value={consultation.consultant}
                      onChange={(e) =>
                        updateConsultation(index, 'consultant', e.target.value)
                      }
                      placeholder="상담자명 (최대 5인)"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">상담 내용</Label>
                  <Textarea
                    value={consultation.content}
                    onChange={(e) =>
                      updateConsultation(index, 'content', e.target.value)
                    }
                    placeholder="상담 내용을 입력하세요"
                    rows={2}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid || isLoading} size="lg">
          {isLoading ? '생성 중...' : '상담기록지 생성'}
        </Button>
      </div>
    </form>
  );
}
