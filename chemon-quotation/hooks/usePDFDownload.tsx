'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import QuotationPDFDocument from '@/components/pdf/QuotationPDFDocument';
import { getCompanyInfo } from '@/lib/constants';

interface QuotationItem {
  id: string;
  name: string;
  glp: string;
  amount: number;
  isOption?: boolean;
}

interface PDFData {
  quotationNumber: string;
  quotationDate: Date;
  customerName: string;
  projectName: string;
  validDays: number;
  items: QuotationItem[];
  subtotalTest: number;
  subtotalAnalysis: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
}

export const usePDFDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPDF = async (data: PDFData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const companyInfo = getCompanyInfo();
      const company = {
        name: companyInfo.name,
        address: companyInfo.address,
        tel: companyInfo.tel,
        fax: companyInfo.fax,
        email: companyInfo.email,
      };

      const doc = (
        <QuotationPDFDocument
          quotationNumber={data.quotationNumber}
          quotationDate={data.quotationDate}
          customerName={data.customerName}
          projectName={data.projectName}
          validDays={data.validDays}
          items={data.items}
          subtotalTest={data.subtotalTest}
          subtotalAnalysis={data.subtotalAnalysis}
          discountRate={data.discountRate}
          discountAmount={data.discountAmount}
          totalAmount={data.totalAmount}
          company={company}
          notes={data.notes}
        />
      );

      const blob = await pdf(doc).toBlob();

      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `견적서_${data.quotationNumber}_${data.customerName}.pdf`;

      // 다운로드 실행
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // URL 해제
      URL.revokeObjectURL(url);

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      setError('PDF 생성 중 오류가 발생했습니다.');
      setIsLoading(false);
      return false;
    }
  };

  return {
    downloadPDF,
    isLoading,
    error,
  };
};
