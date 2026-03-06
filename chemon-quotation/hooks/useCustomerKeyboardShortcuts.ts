'use client';

/**
 * useCustomerKeyboardShortcuts - 고객 목록 키보드 단축키
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerManagementStore } from '@/stores/customerManagementStore';
import type { UnifiedEntity } from '@/types/unified-customer';

interface UseKeyboardShortcutsOptions {
  entities: UnifiedEntity[];
  enabled?: boolean;
}

export function useCustomerKeyboardShortcuts({ entities, enabled = true }: UseKeyboardShortcutsOptions) {
  const router = useRouter();
  const { toggleCommandPalette } = useCustomerManagementStore();
  const [focusIndex, setFocusIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    // Ignore when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case 'j':
        e.preventDefault();
        setFocusIndex(prev => Math.min(prev + 1, entities.length - 1));
        break;
      case 'k':
        e.preventDefault();
        setFocusIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (focusIndex >= 0 && focusIndex < entities.length) {
          e.preventDefault();
          const entity = entities[focusIndex];
          router.push(entity.entityType === 'LEAD' ? `/leads/${entity.id}` : `/customers/${entity.id}`);
        }
        break;
      case '?':
        e.preventDefault();
        setShowHelp(prev => !prev);
        break;
      case 'Escape':
        setShowHelp(false);
        setFocusIndex(-1);
        break;
    }
  }, [enabled, entities, focusIndex, router]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { focusIndex, showHelp, setShowHelp };
}

export const KEYBOARD_SHORTCUTS = [
  { key: 'J / K', description: '목록 위/아래 이동' },
  { key: 'Enter', description: '선택한 고객 상세 열기' },
  { key: 'Ctrl+K', description: '커맨드 팔레트 열기' },
  { key: '?', description: '단축키 도움말' },
  { key: 'Esc', description: '닫기' },
];
