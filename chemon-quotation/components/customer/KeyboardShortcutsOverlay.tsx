'use client';

/**
 * KeyboardShortcutsOverlay - 키보드 단축키 도움말 오버레이
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useCustomerKeyboardShortcuts';

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsOverlay({ open, onOpenChange }: KeyboardShortcutsOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>키보드 단축키</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {KEYBOARD_SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
