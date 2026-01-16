'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectedEfficacyItem } from '@/types/efficacy';

/**
 * ItemCard Component
 * Displays item info, quantity/multiplier inputs, calculated amount
 * Visual distinction for default vs optional items
 * Requirements: 2.1, 2.4, 3.4
 */

interface ItemCardProps {
  item: SelectedEfficacyItem;
  onUpdate: (quantity: number, multiplier: number) => void;
  onRemove: () => void;
}

// Format number with Korean won
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function ItemCard({ item, onUpdate, onRemove }: ItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [multiplier, setMultiplier] = useState(item.multiplier);

  // Sync local state with prop changes
  useEffect(() => {
    setQuantity(item.quantity);
    setMultiplier(item.multiplier);
  }, [item.quantity, item.multiplier]);

  // Handle quantity change
  const handleQuantityChange = (value: number) => {
    const newQty = Math.max(0, value);
    setQuantity(newQty);
    onUpdate(newQty, multiplier);
  };

  // Handle multiplier change
  const handleMultiplierChange = (value: number) => {
    const newMult = Math.max(0, value);
    setMultiplier(newMult);
    onUpdate(quantity, newMult);
  };

  return (
    <Card
      className={cn(
        'p-4 relative transition-all',
        item.is_default
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-500"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Header: Item name and badge */}
      <div className="flex items-start gap-2 mb-3 pr-8">
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {item.item_name}
          </h4>
          {item.usage_note && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {item.usage_note}
            </p>
          )}
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'text-xs shrink-0',
            item.is_default
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
          )}
        >
          {item.is_default ? '기본' : '옵션'}
        </Badge>
      </div>

      {/* Price info */}
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        <span className="font-medium">{formatKRW(item.unit_price)}</span>
        <span className="ml-1">{item.unit}</span>
        <span className="mx-2">·</span>
        <span>{item.category}</span>
      </div>

      {/* Quantity and Multiplier inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Quantity */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            수량
          </label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="h-8 w-16 text-center text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Multiplier */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            횟수
          </label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleMultiplierChange(multiplier - 1)}
              disabled={multiplier <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min={0}
              value={multiplier}
              onChange={(e) => handleMultiplierChange(parseInt(e.target.value) || 0)}
              className="h-8 w-16 text-center text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleMultiplierChange(multiplier + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calculated amount */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatKRW(item.unit_price)} × {quantity} × {multiplier}
        </span>
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {formatKRW(item.amount)}
        </span>
      </div>
    </Card>
  );
}
