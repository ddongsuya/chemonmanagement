'use client';

/**
 * CustomFieldsSection - 커스텀 필드 표시 및 인라인 편집
 */

import { useState, useEffect, useCallback } from 'react';
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getCustomFields, getCustomFieldValues, updateCustomFieldValues } from '@/lib/unified-customer-api';

interface CustomFieldsSectionProps {
  customerId: string;
}

interface FieldDef {
  id: string;
  name: string;
  fieldType: string;
  options: string[] | null;
  isRequired: boolean;
  displayOrder: number;
}

interface FieldValue {
  fieldId: string;
  value: string;
}

export default function CustomFieldsSection({ customerId }: CustomFieldsSectionProps) {
  const { toast } = useToast();
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [fieldsRes, valuesRes] = await Promise.all([
      getCustomFields(),
      getCustomFieldValues(customerId),
    ]);
    if (fieldsRes.success && fieldsRes.data) {
      setFields(fieldsRes.data as unknown as FieldDef[]);
    }
    if (valuesRes.success && valuesRes.data) {
      const vals = valuesRes.data as unknown as FieldValue[];
      const map: Record<string, string> = {};
      vals.forEach(v => { map[v.fieldId] = v.value; });
      setValues(map);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { loadData(); }, [loadData]);

  const startEdit = () => {
    setEditValues({ ...values });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValues({});
  };

  const saveEdit = async () => {
    setSaving(true);
    const updates = fields.map(f => ({ fieldId: f.id, value: editValues[f.id] || '' }));
    const res = await updateCustomFieldValues(customerId, updates);
    if (res.success) {
      setValues({ ...editValues });
      setEditing(false);
      toast({ title: '커스텀 필드 저장 완료' });
    }
    setSaving(false);
  };

  const renderField = (field: FieldDef, value: string, onChange: (v: string) => void) => {
    switch (field.fieldType) {
      case 'TEXT':
        return <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />;
      case 'NUMBER':
        return <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />;
      case 'DATE':
        return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />;
      case 'DROPDOWN':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-8 bg-white border-none rounded-xl"><SelectValue placeholder="선택" /></SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'CHECKBOX':
        return (
          <Checkbox checked={value === 'true'} onCheckedChange={(c) => onChange(String(c))} />
        );
      default:
        return <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />;
    }
  };

  if (loading) return null;
  if (fields.length === 0) return null;

  return (
    <div className="bg-[#FAF2E9] rounded-xl">
      <div className="p-6 pb-3 flex flex-row items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">커스텀 필드</h3>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Edit2 className="h-3.5 w-3.5 mr-1" /> 편집
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.sort((a, b) => a.displayOrder - b.displayOrder).map(field => (
            <div key={field.id} className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 w-28 shrink-0 truncate">
                {field.name}{field.isRequired && <span className="text-red-500">*</span>}
              </span>
              {editing ? (
                renderField(field, editValues[field.id] || '', (v) => setEditValues(prev => ({ ...prev, [field.id]: v })))
              ) : (
                <span className="text-sm">{values[field.id] || '-'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
