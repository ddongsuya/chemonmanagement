'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getToxicityV2Items,
  getToxicityV2Categories,
  getToxicityV2Relations,
  getToxicityV2Overlays,
  getToxicityV2Metadata,
} from '@/lib/toxicity-v2-api';
import type { TestMode } from '@/types/toxicity-v2';

// Query key factory
const toxicityV2Keys = {
  all: ['toxicityV2'] as const,
  items: (mode: TestMode) => ['toxicityV2', 'items', mode] as const,
  categories: (mode: TestMode) => ['toxicityV2', 'categories', mode] as const,
  relations: () => ['toxicityV2', 'relations'] as const,
  overlays: () => ['toxicityV2', 'overlays'] as const,
  metadata: () => ['toxicityV2', 'metadata'] as const,
};

/** 모드별 시험 항목 조회 */
export function useToxicityV2Items(mode: TestMode | null) {
  return useQuery({
    queryKey: toxicityV2Keys.items(mode!),
    queryFn: async () => {
      const res = await getToxicityV2Items(mode!);
      if (!res.success) throw new Error(res.error?.message || '시험 항목 조회 실패');
      return res.data!;
    },
    enabled: !!mode,
    staleTime: 1000 * 60 * 30, // 30분 캐시
  });
}

/** 모드별 카테고리 목록 조회 */
export function useToxicityV2Categories(mode: TestMode | null) {
  return useQuery({
    queryKey: toxicityV2Keys.categories(mode!),
    queryFn: async () => {
      const res = await getToxicityV2Categories(mode!);
      if (!res.success) throw new Error(res.error?.message || '카테고리 조회 실패');
      return res.data!;
    },
    enabled: !!mode,
    staleTime: 1000 * 60 * 30,
  });
}

/** 시험 관계 트리 조회 */
export function useToxicityV2Relations() {
  return useQuery({
    queryKey: toxicityV2Keys.relations(),
    queryFn: async () => {
      const res = await getToxicityV2Relations();
      if (!res.success) throw new Error(res.error?.message || '관계 트리 조회 실패');
      return res.data!;
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** OECD 오버레이 조회 */
export function useToxicityV2Overlays() {
  return useQuery({
    queryKey: toxicityV2Keys.overlays(),
    queryFn: async () => {
      const res = await getToxicityV2Overlays();
      if (!res.success) throw new Error(res.error?.message || '오버레이 조회 실패');
      return res.data!;
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** 메타데이터 조회 (FN, GL, CC, IM, CATS) */
export function useToxicityV2Metadata() {
  return useQuery({
    queryKey: toxicityV2Keys.metadata(),
    queryFn: async () => {
      const res = await getToxicityV2Metadata();
      if (!res.success) throw new Error(res.error?.message || '메타데이터 조회 실패');
      return res.data!;
    },
    staleTime: 1000 * 60 * 30,
  });
}
