'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StitchCard } from '@/components/ui/StitchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const { data: companyResponse, isLoading } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

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

  const saveMutation = useMutation({
    mutationFn: (data: UpdateCompanyInfoDTO) => updateCompanyInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyInfo'] });
      toast({ title: '저장 완료', description: '회사 정보가 업데이트되었습니다.' });
    },
    onError: () => {
      toast({ title: '오류', description: '회사 정보 저장에 실패했습니다.', variant: 'destructive' });
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ title: '파일 크기 초과', description: '로고 이미지는 1MB 이하로 업로드해주세요.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => { setCompany({ ...company, logo: event.target?.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCompany({ ...company, logo: '' });
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const handleSave = () => {
    saveMutation.mutate({
      name: company.name, nameEn: company.nameEn, businessNumber: company.businessNumber,
      ceoName: company.ceoName, address: company.address, addressEn: company.addressEn,
      tel: company.tel, fax: company.fax, email: company.email, website: company.website, logo: company.logo,
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
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            회사 기본 정보
          </h2>
          <p className="text-sm text-slate-500">견적서에 표시될 회사 정보입니다</p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">회사명 (국문) <span className="text-red-500">*</span></label>
              <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="주식회사 켐온" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">회사명 (영문)</label>
              <Input value={company.nameEn} onChange={(e) => setCompany({ ...company, nameEn: e.target.value })} placeholder="CHEMON Inc." className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">사업자등록번호</label>
              <Input value={company.businessNumber} onChange={(e) => setCompany({ ...company, businessNumber: e.target.value })} placeholder="000-00-00000" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">대표자명</label>
              <Input value={company.ceoName} onChange={(e) => setCompany({ ...company, ceoName: e.target.value })} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">주소 (국문)</label>
            <Textarea value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} rows={2} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">주소 (영문)</label>
            <Textarea value={company.addressEn} onChange={(e) => setCompany({ ...company, addressEn: e.target.value })} rows={2} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
      </StitchCard>

      {/* 연락처 */}
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            연락처 정보
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">전화번호</label>
            <Input value={company.tel} onChange={(e) => setCompany({ ...company, tel: e.target.value })} placeholder="031-000-0000" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">팩스번호</label>
            <Input value={company.fax} onChange={(e) => setCompany({ ...company, fax: e.target.value })} placeholder="031-000-0000" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이메일</label>
            <Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} placeholder="contact@chemon.co.kr" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">웹사이트</label>
            <Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} placeholder="www.chemon.co.kr" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
      </StitchCard>

      {/* 로고 */}
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            회사 로고
          </h2>
          <p className="text-sm text-slate-500">견적서 상단에 표시될 로고 이미지 (권장: 200x60px, 최대 1MB)</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-48 h-16 rounded-xl flex items-center justify-center bg-[#F5EDE3]">
            {company.logo ? (
              <img src={company.logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-slate-400 text-sm">로고 없음</span>
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                <Upload className="w-4 h-4 mr-2" />업로드
              </Button>
              {company.logo && (
                <Button variant="outline" onClick={handleRemoveLogo} className="rounded-xl">
                  <X className="w-4 h-4 mr-2" />삭제
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, SVG 형식 지원</p>
          </div>
        </div>
      </StitchCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg" className="rounded-xl">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          회사정보 저장
        </Button>
      </div>
    </div>
  );
}
