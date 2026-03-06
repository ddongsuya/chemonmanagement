'use client';

/**
 * AuditLogTab - 감사 추적 탭
 */

import { useState, useEffect, useCallback } from 'react';
import { History, ArrowRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuditLog, getLifecycleHistory } from '@/lib/unified-customer-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AuditLogTabProps {
  customerId: string;
}

interface AuditEntry {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface LifecycleEntry {
  id: string;
  fromStage: string;
  toStage: string;
  reason: string | null;
  isAutomatic: boolean;
  triggeredBy: string;
  transitionAt: string;
}

export default function AuditLogTab({ customerId }: AuditLogTabProps) {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldFilter, setFieldFilter] = useState('');
  const [view, setView] = useState<'audit' | 'lifecycle'>('audit');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [auditRes, lifecycleRes] = await Promise.all([
      getAuditLog(customerId, fieldFilter ? { fieldName: fieldFilter } : undefined),
      getLifecycleHistory(customerId),
    ]);
    if (auditRes.success && auditRes.data) {
      const data = auditRes.data as any;
      setAuditLogs(data.logs || data || []);
    }
    if (lifecycleRes.success && lifecycleRes.data) {
      setLifecycle(lifecycleRes.data as unknown as LifecycleEntry[]);
    }
    setLoading(false);
  }, [customerId, fieldFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">변경 이력</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v) => setView(v as 'audit' | 'lifecycle')}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="audit">감사 로그</SelectItem>
                <SelectItem value="lifecycle">라이프사이클</SelectItem>
              </SelectContent>
            </Select>
            {view === 'audit' && (
              <Input
                placeholder="필드명 필터"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="w-32 h-8 text-xs"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">로딩 중...</div>
        ) : view === 'audit' ? (
          auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">변경 이력이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <History className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{log.changedBy}</span>
                      <span>·</span>
                      <span>{format(new Date(log.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{log.fieldName || log.action}</span>
                      {log.oldValue && log.newValue && (
                        <span className="text-muted-foreground">
                          {' '}<span className="line-through text-red-500/70">{log.oldValue}</span>
                          <ArrowRight className="inline h-3 w-3 mx-1" />
                          <span className="text-green-600">{log.newValue}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          lifecycle.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">라이프사이클 이력이 없습니다</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
              {lifecycle.map((entry, i) => (
                <div key={entry.id} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>{format(new Date(entry.transitionAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                      {entry.isAutomatic && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 text-[10px]">자동</span>}
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{entry.fromStage}</span>
                      <ArrowRight className="inline h-3 w-3 mx-1" />
                      <span className="font-medium text-primary">{entry.toStage}</span>
                    </p>
                    {entry.reason && <p className="text-xs text-muted-foreground mt-1">{entry.reason}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">by {entry.triggeredBy}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
