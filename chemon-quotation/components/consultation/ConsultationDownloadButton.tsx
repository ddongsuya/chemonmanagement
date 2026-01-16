'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateConsultationRecord } from '@/lib/consultation/consultation-generator';
import {
  ConsultationRecordData,
  QuotationContentItem,
} from '@/lib/consultation/types';
import { saveAs } from 'file-saver';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConsultationDownloadButtonProps {
  data: ConsultationRecordData;
  quotationItems: QuotationContentItem[];
  fileName?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export default function ConsultationDownloadButton({
  data,
  quotationItems,
  fileName,
  variant = 'default',
  size = 'default',
}: ConsultationDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const blob = await generateConsultationRecord(data, quotationItems);
      const name =
        fileName ||
        `상담기록지_${data.basic.clientCompany}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, name);

      toast({
        title: '다운로드 완료',
        description: '상담기록지가 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('상담기록지 생성 실패:', error);
      toast({
        title: '생성 실패',
        description: '상담기록지 생성 중 오류가 발생했습니다.',
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
      상담기록지 다운로드 (.xlsx)
    </Button>
  );
}
