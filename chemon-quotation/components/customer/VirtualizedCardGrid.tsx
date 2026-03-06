'use client';

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EnhancedCustomerCard } from './EnhancedCustomerCard';
import type { UnifiedEntity } from '@/types/unified-customer';

interface VirtualizedCardGridProps {
  entities: UnifiedEntity[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onClick: (entity: UnifiedEntity) => void;
  columns?: number;
}

export function VirtualizedCardGrid({
  entities,
  selectedIds,
  onToggleSelection,
  onClick,
  columns = 3,
}: VirtualizedCardGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Group entities into rows
  const rows = useMemo(() => {
    const result: UnifiedEntity[][] = [];
    for (let i = 0; i < entities.length; i += columns) {
      result.push(entities.slice(i, i + columns));
    }
    return result;
  }, [entities, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 3,
  });

  // For small lists, render normally without virtualization
  if (entities.length <= 30) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((entity) => (
          <EnhancedCustomerCard
            key={`${entity.entityType}-${entity.id}`}
            entity={entity}
            isSelected={selectedIds.includes(entity.id)}
            onSelect={onToggleSelection}
            onClick={onClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-320px)] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-0.5"
            >
              {row.map((entity) => (
                <EnhancedCustomerCard
                  key={`${entity.entityType}-${entity.id}`}
                  entity={entity}
                  isSelected={selectedIds.includes(entity.id)}
                  onSelect={onToggleSelection}
                  onClick={onClick}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
