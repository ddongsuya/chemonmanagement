'use client';

/**
 * CommandPalette - cmdk 기반 커맨드 팔레트
 */

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, Users, FileText, Settings, Plus, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCustomerManagementStore } from '@/stores/customerManagementStore';
import { getUnifiedCustomers } from '@/lib/unified-customer-api';
import type { UnifiedEntity } from '@/types/unified-customer';

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, toggleCommandPalette } = useCustomerManagementStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UnifiedEntity[]>([]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleCommandPalette]);

  // Search customers
  useEffect(() => {
    if (!search.trim() || !isCommandPaletteOpen) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await getUnifiedCustomers({ search, limit: 8 });
      if (res.success && res.data) {
        const data = res.data as any;
        setResults(data.entities || data.data || []);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isCommandPaletteOpen]);

  const navigate = useCallback((path: string) => {
    toggleCommandPalette();
    setSearch('');
    router.push(path);
  }, [router, toggleCommandPalette]);

  return (
    <Dialog open={isCommandPaletteOpen} onOpenChange={() => { toggleCommandPalette(); setSearch(''); }}>
      <DialogContent className="p-0 max-w-lg overflow-hidden">
        <Command className="rounded-lg border-none" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="고객 검색, 페이지 이동..."
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              결과가 없습니다
            </Command.Empty>

            {results.length > 0 && (
              <Command.Group heading="고객 검색 결과">
                {results.map(entity => (
                  <Command.Item
                    key={entity.id}
                    value={entity.companyName}
                    onSelect={() => navigate(entity.entityType === 'LEAD' ? `/leads/${entity.id}` : `/customers/${entity.id}`)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{entity.companyName}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{entity.contactName}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="빠른 이동">
              <Command.Item onSelect={() => navigate('/customers')} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted">
                <Users className="h-4 w-4" /> 고객 목록
              </Command.Item>
              <Command.Item onSelect={() => navigate('/leads')} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted">
                <FileText className="h-4 w-4" /> 리드 목록
              </Command.Item>
              <Command.Item onSelect={() => navigate('/dashboard')} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted">
                <BarChart3 className="h-4 w-4" /> 대시보드
              </Command.Item>
              <Command.Item onSelect={() => navigate('/settings')} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted">
                <Settings className="h-4 w-4" /> 설정
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
