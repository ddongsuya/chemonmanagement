'use client';

import { useState, useMemo } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { useEfficacyModels } from '@/hooks/useMasterData';
import {
  CATEGORY_ORDER,
  getCategoryColors,
} from '@/lib/efficacy-model-utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, ChevronRight, Beaker, FlaskConical, Microscope, TestTube, Dna, Heart, Brain, Bone, Pill, Activity, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StepModelSelection Component
 * Step 2 of efficacy quotation wizard - Model selection
 * Redesigned with category filter tabs and clickable model cards
 * Requirements: 1.1, 1.2, 1.4
 */

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  '피부': FlaskConical,
  '피부/면역': FlaskConical,
  '항암': Microscope,
  '면역/항암': Microscope,
  '근골격': Bone,
  '대사': Activity,
  '대사/혈관': Activity,
  '신경': Brain,
  '심혈관': Heart,
  '세포': Dna,
  '소화기': Pill,
  '비뇨기': TestTube,
};

export default function StepModelSelection() {
  const {
    selectedModelId,
    selectedModel,
    setModel,
    nextStep,
    prevStep,
    selectedItems,
  } = useEfficacyQuotationStore();

  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load models from backend API
  const { models: allModels, loading, error } = useEfficacyModels();

  // Filter active models
  const activeModels = useMemo(
    () => allModels.filter((m) => m.isActive),
    [allModels]
  );

  // Group models by category
  const modelsByCategory = useMemo(() => {
    const grouped: Record<string, typeof activeModels> = {};
    activeModels.forEach((model) => {
      if (!grouped[model.category]) {
        grouped[model.category] = [];
      }
      grouped[model.category].push(model);
    });
    return grouped;
  }, [activeModels]);

  // Get sorted categories that have models
  const categories = useMemo(() => {
    const availableCategories = Object.keys(modelsByCategory);
    return CATEGORY_ORDER.filter((cat) => availableCategories.includes(cat));
  }, [modelsByCategory]);

  // Models to display (filtered by category or all)
  const displayModels = useMemo(() => {
    if (selectedCategory) {
      return modelsByCategory[selectedCategory] || [];
    }
    return activeModels;
  }, [selectedCategory, modelsByCategory, activeModels]);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Handle model selection - select and auto-proceed
  const handleModelSelect = (modelId: string) => {
    // If changing model and items exist, confirm
    if (selectedModelId && selectedModelId !== modelId && selectedItems.length > 0) {
      if (
        window.confirm(
          '모델을 변경하면 선택한 항목이 초기화됩니다. 계속하시겠습니까?'
        )
      ) {
        setModel(modelId);
        nextStep();
      }
    } else {
      setModel(modelId);
      nextStep();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">모델 데이터를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>효력시험 모델 선택</CardTitle>
        <CardDescription>
          카테고리를 선택한 후 원하는 모델을 클릭하면 다음 단계로 진행됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Category Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Badge variant="outline">1단계</Badge>
            카테고리 선택
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              const colors = getCategoryColors(category);
              const Icon = categoryIcons[category] || Beaker;
              const modelCount = modelsByCategory[category]?.length || 0;

              return (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center hover:shadow-md relative',
                    isSelected
                      ? `${colors.border} ${colors.bg}`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      isSelected ? colors.text : 'text-gray-400'
                    )}
                  />
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isSelected ? colors.text : 'text-gray-700'
                    )}
                  >
                    {category}
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {modelCount}개 모델
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Model Selection */}
        {selectedCategory && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Badge variant="outline">2단계</Badge>
              모델 선택
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Badge className={getCategoryColors(selectedCategory).badge} variant="secondary">
                {selectedCategory}
              </Badge>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayModels.map((model) => {
                const isSelected = selectedModelId === model.modelId;
                const colors = getCategoryColors(model.category);

                return (
                  <button
                    key={model.modelId}
                    onClick={() => handleModelSelect(model.modelId)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left hover:shadow-md relative',
                      isSelected
                        ? `${colors.border} ${colors.bg} ring-2 ring-green-500`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    <h4
                      className={cn(
                        'font-semibold text-sm mb-2 pr-6',
                        isSelected ? colors.text : 'text-gray-900'
                      )}
                    >
                      {model.modelName}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">적응증:</span> {model.indication}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {model.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No category selected - show all models grouped */}
        {!selectedCategory && (
          <div className="text-center py-8 text-gray-500">
            <Beaker className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>위에서 카테고리를 선택해주세요.</p>
            <p className="text-sm mt-1">총 {activeModels.length}개의 모델이 있습니다.</p>
          </div>
        )}

        {/* Selection result */}
        {selectedModel && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">
                모델 선택 완료
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Badge variant="secondary">{selectedModel.category}</Badge>
              <ChevronRight className="w-4 h-4" />
              <Badge variant="default">{selectedModel.model_name}</Badge>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">
              적응증: {selectedModel.indication}
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>
          <div className="text-sm text-gray-500">
            모델을 클릭하면 자동으로 다음 단계로 진행됩니다
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
