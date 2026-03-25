'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Plus, AlertTriangle, MessageSquare, Loader2, Trash2,
} from 'lucide-react';
import {
  getStudyDocuments,
  deleteStudyDocument,
  DOCUMENT_TYPE_CONFIG,
  VERSION_LABELS,
  StudyDocument,
  StudyDocumentType,
  getStudyTypeColor,
} from '@/lib/study-document-api';
import DocumentAddModal from './DocumentAddModal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  studyId: string;
  studyCode: string;
}

export default function StudyDocumentTimeline({ studyId, studyCode }: Props) {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();

  const loadDocs = async () => {
    try {
      const docs = await getStudyDocuments(studyId);
      setDocuments(docs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, [studyId]);

  const handleDelete = async (docId: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    try {
      await deleteStudyDocument(docId);
      toast({ title: '삭제되었습니다.' });
      loadDocs();
    } catch {
      toast({ title: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  // 월별 그룹핑
  const grouped = documents.reduce<Record<string, StudyDocument[]>>((acc, doc) => {
    const key = `${doc.sentYear}-${String(doc.sentMonth).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).sort().reverse();

  // 변경기록지 번호 계산
  const amendmentDocs = documents
    .filter(d => d.documentType === 'AMENDMENT')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getAmendmentNum = (docId: string) => {
    const idx = amendmentDocs.findIndex(d => d.id === docId);
    return idx >= 0 ? idx + 1 : 0;
  };

  const getDocLabel = (doc: StudyDocument) => {
    const cfg = DOCUMENT_TYPE_CONFIG[doc.documentType];
    const vLabel = VERSION_LABELS[doc.version];
    if (doc.documentType === 'AMENDMENT') {
      return `${cfg.label} ${getAmendmentNum(doc.id)}`;
    }
    return vLabel ? `${cfg.label} ${vLabel}` : cfg.label;
  };

  const getDocColor = (type: StudyDocumentType) => {
    const cfg = DOCUMENT_TYPE_CONFIG[type];
    const colorMap: Record<string, string> = {
      gray: 'bg-slate-100 text-slate-700 border-slate-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return colorMap[cfg.color] || colorMap.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">문서 송부 이력</h3>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />기록 추가
        </Button>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg border-dashed">
          아직 문서 기록이 없습니다
        </div>
      ) : (
        <div className="relative pl-6">
          {/* 타임라인 세로선 */}
          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />

          {sortedMonths.map(monthKey => {
            const [y, m] = monthKey.split('-');
            const docs = grouped[monthKey];
            return (
              <div key={monthKey} className="mb-6 last:mb-0">
                {/* 월 마커 */}
                <div className="flex items-center gap-2 mb-3 -ml-6">
                  <div className="w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {parseInt(y)}년 {parseInt(m)}월
                  </span>
                </div>

                {/* 이벤트 카드들 */}
                <div className="space-y-2">
                  {docs.map(doc => {
                    const isAlert = DOCUMENT_TYPE_CONFIG[doc.documentType]?.isAlert;
                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          'rounded-lg border p-3 text-sm group',
                          isAlert ? 'border-red-200 bg-red-50/50' : 'border-border bg-card'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isAlert && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                              getDocColor(doc.documentType)
                            )}>
                              {getDocLabel(doc)}
                            </span>
                            <span className="text-xs text-muted-foreground">송부</span>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </div>
                        {doc.comment && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{doc.comment}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                          <span>{doc.creator.name}</span>
                          {doc.sentDate && (
                            <span>· {new Date(doc.sentDate).toLocaleDateString('ko-KR')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DocumentAddModal
        open={addOpen}
        onOpenChange={setAddOpen}
        studyId={studyId}
        studyCode={studyCode}
        onSuccess={loadDocs}
      />
    </div>
  );
}
