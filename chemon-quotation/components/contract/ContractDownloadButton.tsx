'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateContract } from '@/lib/contract/contract-generator';
import { ContractData } from '@/lib/contract/types';
import { saveAs } from 'file-saver';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { contractApi, createSavedContractFromData } from '@/lib/contract-api';

interface ContractDownloadButtonProps {
  data: ContractData;
  quotationId?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export default function ContractDownloadButton({ 
  data, 
  quotationId,
  variant = 'default',
  size = 'default' 
}: ContractDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const blob = await generateContract(data);
      const dateStr = data.contract.date.replace(/\s/g, '').replace(/년|월/g, '-').replace(/일/g, '');
      const fileName = `위탁연구계약서${data.contract.isDraft ? '(안)' : ''}_${data.customer.companyName}_${dateStr}.docx`;
      saveAs(blob, fileName);
      
      // 계약서 정보를 API로 저장
      try {
        const savedContract = createSavedContractFromData(data, quotationId);
        await contractApi.create(savedContract);
      } catch (saveError) {
        console.warn('계약서 저장 실패 (다운로드는 완료됨):', saveError);
      }
      
      toast({
        title: '다운로드 완료',
        description: '계약서가 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('계약서 생성 실패:', error);
      toast({
        title: '생성 실패',
        description: '계약서 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isLoading}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      계약서 다운로드 (.docx)
    </Button>
  );
}
