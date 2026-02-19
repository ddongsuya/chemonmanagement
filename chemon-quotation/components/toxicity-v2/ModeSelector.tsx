'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pill, Leaf, Cpu } from 'lucide-react';
import type { TestMode } from '@/types/toxicity-v2';

interface ModeSelectorProps {
  onModeSelect: (mode: TestMode) => void;
}

type Level = 'top' | 'drug' | 'screening' | 'healthFood';

interface ModeCard {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  mode?: TestMode;
  next?: Level;
}

const TOP_CATEGORIES: ModeCard[] = [
  { label: '의약품', description: '의약품 독성시험', icon: <Pill className="h-8 w-8" />, next: 'drug' },
  { label: '건강기능식품', description: '건기식 안전성시험', icon: <Leaf className="h-8 w-8" />, next: 'healthFood' },
  { label: '의료기기', description: '생물학적 안전성시험', icon: <Cpu className="h-8 w-8" />, mode: 'md_bio' },
];

const DRUG_MODES: ModeCard[] = [
  { label: '의약품', description: '일반 의약품 독성시험', mode: 'drug_single' },
  { label: '복합제', description: '복합제 독성시험', mode: 'drug_combo' },
  { label: '백신', description: '백신 독성시험', mode: 'drug_vaccine' },
  { label: '스크리닝', description: '스크리닝 시험', next: 'screening' },
];

const SCREENING_MODES: ModeCard[] = [
  { label: '독성 스크리닝', description: '독성 스크리닝 시험', mode: 'drug_screen_tox' },
  { label: '심혈관계 스크리닝', description: '심혈관계 스크리닝 시험', mode: 'drug_screen_cv' },
];

const HEALTH_FOOD_MODES: ModeCard[] = [
  { label: '개별인정형', description: '개별인정형 안전성시험', mode: 'hf_indv' },
  { label: '프로바이오틱스', description: '프로바이오틱스 안전성시험', mode: 'hf_prob' },
  { label: '한시적식품', description: '한시적식품 안전성시험', mode: 'hf_temp' },
];

const LEVEL_CONFIG: Record<Level, { title: string; cards: ModeCard[]; parent?: Level }> = {
  top: { title: '시험 유형 선택', cards: TOP_CATEGORIES },
  drug: { title: '의약품 시험 모드', cards: DRUG_MODES, parent: 'top' },
  screening: { title: '스크리닝 모드', cards: SCREENING_MODES, parent: 'drug' },
  healthFood: { title: '건강기능식품 시험 모드', cards: HEALTH_FOOD_MODES, parent: 'top' },
};

export default function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  const [level, setLevel] = useState<Level>('top');

  const config = LEVEL_CONFIG[level];

  const handleCardClick = (card: ModeCard) => {
    if (card.mode) {
      onModeSelect(card.mode);
    } else if (card.next) {
      setLevel(card.next);
    }
  };

  const handleBack = () => {
    if (config.parent) {
      setLevel(config.parent);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {config.parent && (
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold">{config.title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.cards.map((card) => (
          <Card
            key={card.label}
            className="cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => handleCardClick(card)}
          >
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6 min-h-[120px]">
              {card.icon && <div className="text-orange-500">{card.icon}</div>}
              <span className="text-base font-medium">{card.label}</span>
              {card.description && (
                <span className="text-sm text-muted-foreground text-center">{card.description}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
