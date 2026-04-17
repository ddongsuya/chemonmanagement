'use client';

/**
 * FilterPresetManager - 필터 프리셋 저장/불러오기
 */

import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  getFilterPresets,
  createFilterPreset,
  deleteFilterPreset,
  updateFilterPreset,
} from '@/lib/unified-customer-api';
import type { UnifiedCustomerFilters } from '@/types/unified-customer';

interface FilterPresetManagerProps {
  filters: UnifiedCustomerFilters;
  onApplyPreset: (filters: UnifiedCustomerFilters) => void;
}

interface Preset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: string;
  isDefault?: boolean;
}

export function FilterPresetManager({ filters, onApplyPreset }: FilterPresetManagerProps) {
  const { toast } = useToast();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPresets = useCallback(async () => {
    const res = await getFilterPresets();
    if (res.success && res.data) {
      setPresets(res.data as unknown as Preset[]);
    }
  }, []);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  const handleSave = async () => {
    if (!presetName.trim()) return;
    setSaving(true);
    const { page, limit, ...filterData } = filters;
    const res = await createFilterPreset(presetName, filterData as Record<string, unknown>, filters.sortBy, filters.sortOrder);
    if (res.success) {
      toast({ title: '프리셋 저장 완료' });
      setShowSaveDialog(false);
      setPresetName('');
      loadPresets();
    } else {
      toast({ title: '저장 실패', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleApply = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    onApplyPreset({
      ...preset.filters,
      sortBy: preset.sortBy as UnifiedCustomerFilters['sortBy'],
      sortOrder: preset.sortOrder as UnifiedCustomerFilters['sortOrder'],
      page: 1,
      limit: 20,
    } as UnifiedCustomerFilters);
  };

  const handleDelete = async (presetId: string) => {
    const res = await deleteFilterPreset(presetId);
    if (res.success) {
      toast({ title: '프리셋 삭제 완료' });
      loadPresets();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {presets.length > 0 && (
        <Select onValueChange={handleApply}>
          <SelectTrigger className="w-28 md:w-40 bg-white border-none rounded-xl">
            <SelectValue placeholder="프리셋 선택" />
          </SelectTrigger>
          <SelectContent>
            {presets.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-1">
                  {p.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                  {p.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
        <Save className="h-3.5 w-3.5 mr-1" />
        저장
      </Button>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>필터 프리셋 저장</DialogTitle></DialogHeader>
          <Input placeholder="프리셋 이름" value={presetName} onChange={(e) => setPresetName(e.target.value)} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          {presets.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">기존 프리셋:</p>
              {presets.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1">
                  <span>{p.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving || !presetName.trim()}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
