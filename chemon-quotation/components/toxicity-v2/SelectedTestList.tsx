'use client';

import { Button } from '@/components/ui/button';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { formatKRW } from '@/lib/toxicity-v2/priceEngine';
import { X } from 'lucide-react';

export default function SelectedTestList() {
  const selectedTests = useToxicityV2Store((s) => s.selectedTests);
  const subtotalTest = useToxicityV2Store((s) => s.subtotalTest);
  const removeTest = useToxicityV2Store((s) => s.removeTest);

  if (selectedTests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
        선택된 시험이 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold mb-1">
        선택된 시험 ({selectedTests.length}건)
      </h3>

      <ul className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
        {selectedTests.map((test) => (
          <li
            key={test.id}
            className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
              test.isOption ? 'ml-4 bg-gray-50' : 'bg-white'
            }`}
          >
            <span className="truncate min-w-0 flex-1">
              {test.isOption && (
                <span className="text-gray-400 mr-1">└</span>
              )}
              {test.name}
            </span>
            <span className="shrink-0 text-xs text-gray-600">
              {formatKRW(test.price)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => removeTest(test.id)}
              aria-label={`${test.name} 제거`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-semibold">
        <span>시험비 소계</span>
        <span>{formatKRW(subtotalTest)}</span>
      </div>
    </div>
  );
}
