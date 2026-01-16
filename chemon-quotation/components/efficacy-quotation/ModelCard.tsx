'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { EfficacyModel } from '@/types/efficacy';

/**
 * ModelCard Component
 * Displays efficacy model information for selection
 * Requirements: 1.1, 1.3
 */

interface ModelCardProps {
  model: EfficacyModel;
  isSelected: boolean;
  onSelect: () => void;
}

// Category color mapping
const categoryColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  '피부': { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' },
  '피부/면역': { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' },
  '항암': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  '면역/항암': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  '근골격': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  '대사': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  '대사/혈관': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  '신경': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  '심혈관': { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  '세포': { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
  '소화기': { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  '비뇨기': { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
};

const getColors = (category: string) =>
  categoryColors[category] || {
    bg: 'bg-gray-50',
    border: 'border-gray-500',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800',
  };

export default function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  const colors = getColors(model.category);

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md relative',
        isSelected
          ? `ring-2 ${colors.border} ${colors.bg}`
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="w-5 h-5 text-green-600" />
        </div>
      )}

      {/* Model name */}
      <h3 className={cn('font-semibold text-base mb-2', isSelected ? colors.text : 'text-gray-900')}>
        {model.model_name}
      </h3>

      {/* Category badge */}
      <Badge className={cn('text-xs mb-2', colors.badge)} variant="secondary">
        {model.category}
      </Badge>

      {/* Indication */}
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-medium">적응증:</span> {model.indication}
      </p>

      {/* Description */}
      <p className="text-xs text-gray-500 line-clamp-2">{model.description}</p>
    </Card>
  );
}
