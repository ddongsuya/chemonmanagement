'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Upload, X, Building2, Phone, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getCompanyInfo,
  updateCompanyInfo,
  UpdateCompanyInfoDTO,
} from '@/lib/package-api';

const DEFAULT_COMPANY = {
  name: '주식회사 켐온',
  nameEn: 'CHEMON Inc.',
  businessNumber: '123-45-67890',
  ceoName: '대표이사',
  address: '경기도 수원시 영통구 광교로 156',
  addressEn: '156, Gwanggyo-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Korea',
  tel: '031-888-9900',
  fax: '031-888-9901',
  email: 'contact@chemon.co.kr',
  website: 'www.chemon.co.kr',
  logo: '',
};

export default function CompanySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [company, setCompany] = useState(DEFAULT_COMPANY);

  // API에서 회사 정보 조회
  const { data: companyResponse, isLoading } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

  // 회사 정보 로드
  useEffect(() => {
    if (companyResponse?.data) {
      const data = companyResponse.data;
      setCompany({
        name: data.name || DEFAULT_COMPANY.name,
        nameEn: data.nameEn || DEFAULT_COMPANY.nameEn,
        businessNumber: data.businessNumber || DEFAULT_COMPANY.businessNumber,
        ceoName: data.ceoName || DEFAULT_COMPANY.ceoName,
        address: data.address || DEFAULT_COMPANY.address,
        addressEn: data.addressEn || DEFAULT_COMPANY.addressEn,
        tel: data.tel || DEFAULT_COMPANY.tel,
        fax: data.fax || DEFAULT_COMPANY.fax,
        email: data.email || DEFAULT_COMPANY.email,
        website: data.website || DEFAULT_COMPANY.website,
        logo: data.logo || '',
      });
    }
  }, [companyResponse]);

  // 회사 정보 저장 mutation
  const saveMutation = useMutation({
    mutationFn: (data: UpdateCompanyInfoDTO) => updateCompanyInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyInfo'] });
      toast({
        title: '저장 완료',
        description: '회사 정보가 업데이트되었습니다.',
      });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '회사 정보 저장에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 로고 업로드
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          title: '파일 크기 초과',
          description: '로고 이미지는 1MB 이하로 업로드해주세요.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setCompany({ ...company, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 로고 삭제
  const handleRemoveLogo = () => {
    setCompany({ ...company, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 저장
  const handleSave = () => {
    saveMutation.mutate({
      name: company.name,
      nameEn: company.nameEn,
      businessNumber: company.businessNumber,
      ceoName: company.ceoName,
      address: company.address,
      addressEn: company.addressEn,
      tel: company.tel,
      fax: company.fax,
      email: company.email,
      website: company.website,
      logo: company.logo,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>회사 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            회사 기본 정보
          </CardTitle>
          <CardDescription>견적서에 표시될 회사 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                회사명 (국문) <span className="text-red-500">*</span>
              </Label>
              <Input
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
                placeholder="주식회사 켐온"
              />
            </div>
            <div className="space-y-2">
              <Label>회사명 (영문)</Label>
              <Input
                value={company.nameEn}
                onChange={(e) =>
                  setCompany({ ...company, nameEn: e.target.value })
                }
                placeholder="CHEMON Inc."
              />
            </div>
            <div className="space-y-2">
              <Label>사업자등록번호</Label>
              <Input
                value={company.businessNumber}
                onChange={(e) =>
                  setCompany({ ...company, businessNumber: e.target.value })
                }
                placeholder="000-00-00000"
              />
            </div>
            <div className="space-y-2">
              <Label>대표자명</Label>
              <Input
                value={company.ceoName}
                onChange={(e) =>
                  setCompany({ ...company, ceoName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>주소 (국문)</Label>
            <Textarea
              value={company.address}
              onChange={(e) =>
                setCompany({ ...company, address: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>주소 (영문)</Label>
            <Textarea
              value={company.addressEn}
              onChange={(e) =>
                setCompany({ ...company, addressEn: e.target.value })
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 연락처 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            연락처 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input
                value={company.tel}
                onChange={(e) =>
                  setCompany({ ...company, tel: e.target.value })
                }
                placeholder="031-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>팩스번호</Label>
              <Input
                value={company.fax}
                onChange={(e) =>
                  setCompany({ ...company, fax: e.target.value })
                }
                placeholder="031-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                value={company.email}
                onChange={(e) =>
                  setCompany({ ...company, email: e.target.value })
                }
                placeholder="contact@chemon.co.kr"
              />
            </div>
            <div className="space-y-2">
              <Label>웹사이트</Label>
              <Input
                value={company.website}
                onChange={(e) =>
                  setCompany({ ...company, website: e.target.value })
                }
                placeholder="www.chemon.co.kr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로고 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            회사 로고
          </CardTitle>
          <CardDescription>
            견적서 상단에 표시될 로고 이미지 (권장: 200x60px, 최대 1MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* 로고 미리보기 */}
            <div className="w-48 h-16 border rounded-lg flex items-center justify-center bg-gray-50">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt="Company Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-sm">로고 없음</span>
              )}
            </div>

            {/* 업로드 버튼 */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  업로드
                </Button>
                {company.logo && (
                  <Button variant="outline" onClick={handleRemoveLogo}>
                    <X className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, SVG 형식 지원</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          회사정보 저장
        </Button>
      </div>
    </div>
  );
}
