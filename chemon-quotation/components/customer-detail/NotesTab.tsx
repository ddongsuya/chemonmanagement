'use client';

/**
 * NotesTab - 고객 메모 탭 (리치 텍스트, 고정, @멘션)
 */

import { useState, useEffect, useCallback } from 'react';
import { Pin, PinOff, Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getNotes, createNote, updateNote, deleteNote, toggleNotePin } from '@/lib/unified-customer-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotesTabProps {
  customerId: string;
}

interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  mentions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesTab({ customerId }: NotesTabProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const res = await getNotes(customerId);
    if (res.success && res.data) {
      const data = res.data as any;
      setNotes(data.notes || data || []);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    // Parse @mentions
    const mentions = (newContent.match(/@(\w+)/g) || []).map(m => m.slice(1));
    const res = await createNote(customerId, newContent, mentions);
    if (res.success) {
      setNewContent('');
      loadNotes();
      toast({ title: '메모 추가 완료' });
    }
    setSaving(false);
  };

  const handleUpdate = async (noteId: string) => {
    setSaving(true);
    const res = await updateNote(customerId, noteId, { content: editContent });
    if (res.success) {
      setEditingId(null);
      loadNotes();
    }
    setSaving(false);
  };

  const handleDelete = async (noteId: string) => {
    const res = await deleteNote(customerId, noteId);
    if (res.success) loadNotes();
  };

  const handleTogglePin = async (noteId: string) => {
    const res = await toggleNotePin(customerId, noteId);
    if (res.success) loadNotes();
  };

  // Sort: pinned first, then by date
  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-[#FAF2E9] rounded-xl">
      <div className="p-6 pb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">메모</h3>
      </div>
      <div className="px-6 pb-6 space-y-4">
        {/* 새 메모 작성 */}
        <div className="space-y-2">
          <Textarea
            placeholder="메모를 입력하세요... (@멘션 지원)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleCreate} disabled={saving || !newContent.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              추가
            </Button>
          </div>
        </div>

        {/* 메모 목록 */}
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">로딩 중...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">메모가 없습니다</div>
        ) : (
          <div className="space-y-3">
            {sorted.map(note => (
              <div key={note.id} className={`rounded-xl p-3 ${note.isPinned ? 'bg-yellow-50/50' : 'bg-[#F5EDE3]'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{note.createdBy}</span>
                    <span>·</span>
                    <span>{format(new Date(note.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                    {note.isPinned && <Pin className="h-3 w-3 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleTogglePin(note.id)}>
                      {note.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingId(note.id); setEditContent(note.content); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDelete(note.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>취소</Button>
                      <Button size="sm" onClick={() => handleUpdate(note.id)} disabled={saving}>저장</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
