'use client';

/**
 * QuickActionMenu - 고객 빠른 액션 메뉴
 */

import { Phone, Mail, StickyNote, Calendar, Tag, ArrowRightLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { UnifiedEntity } from '@/types/unified-customer';

interface QuickActionMenuProps {
  entity: UnifiedEntity;
  trigger?: React.ReactNode;
  onAddNote?: (entity: UnifiedEntity) => void;
  onAddTag?: (entity: UnifiedEntity) => void;
  onChangeStage?: (entity: UnifiedEntity) => void;
}

export function QuickActionMenu({ entity, trigger, onAddNote, onAddTag, onChangeStage }: QuickActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || <Button variant="ghost" size="sm">액션</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {entity.contactPhone && (
          <DropdownMenuItem asChild>
            <a href={`tel:${entity.contactPhone}`} className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> 전화 걸기
            </a>
          </DropdownMenuItem>
        )}
        {entity.contactEmail && (
          <DropdownMenuItem asChild>
            <a href={`mailto:${entity.contactEmail}`} className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> 이메일 보내기
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAddNote?.(entity)}>
          <StickyNote className="h-4 w-4 mr-2" /> 메모 추가
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddTag?.(entity)}>
          <Tag className="h-4 w-4 mr-2" /> 태그 추가
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangeStage?.(entity)}>
          <ArrowRightLeft className="h-4 w-4 mr-2" /> 단계 변경
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
