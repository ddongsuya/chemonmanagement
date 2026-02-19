/**
 * Toxicity V2 API Client
 * 
 * v2 독성시험 데이터 조회 API 클라이언트
 */

import { apiFetch } from './api-utils';
import type { ApiResponse } from './api-utils';
import type { TestMode } from '@/types/toxicity-v2';

// API 응답 타입
export interface ToxicityV2ItemResponse {
  id: number;
  num: number | null;
  name: string;
  category: string;
  species: string | null;
  duration: string | null;
  description: string | null;
  priceOral: number | null;
  routeOral: string | null;
  weeksOral: string | null;
  priceIv: number | null;
  routeIv: string | null;
  weeksIv: string | null;
  priceP2: number | null;
  priceP3: number | null;
  priceP4: number | null;
  priceSingle: number | null;
  formalName: string | null;
  guideline: string[] | null;
  note: string | null;
}

export interface ToxicityV2RelationResponse {
  mainTestId: number;
  recoveryTestId: number | null;
  tkOptions: Record<string, unknown> | null;
}

export interface ToxicityV2OverlaysResponse {
  ov: Record<number, { oop?: number; oip?: number }>;
  oe: Record<number, { oop?: number; oip?: number }>;
}

// 모드별 시험 항목 조회
export async function getToxicityV2Items(
  mode: TestMode
): Promise<ApiResponse<ToxicityV2ItemResponse[]>> {
  return apiFetch<ToxicityV2ItemResponse[]>(`/api/toxicity-v2/items?mode=${mode}`);
}

// 모드별 카테고리 목록 조회
export async function getToxicityV2Categories(
  mode: TestMode
): Promise<ApiResponse<string[]>> {
  return apiFetch<string[]>(`/api/toxicity-v2/categories?mode=${mode}`);
}

// 시험 관계 트리 조회
export async function getToxicityV2Relations(): Promise<ApiResponse<ToxicityV2RelationResponse[]>> {
  return apiFetch<ToxicityV2RelationResponse[]>('/api/toxicity-v2/relations');
}

// OECD 오버레이 조회
export async function getToxicityV2Overlays(): Promise<ApiResponse<ToxicityV2OverlaysResponse>> {
  return apiFetch<ToxicityV2OverlaysResponse>('/api/toxicity-v2/overlays');
}

// 메타데이터 조회
export async function getToxicityV2Metadata(): Promise<ApiResponse<Record<string, unknown>>> {
  return apiFetch<Record<string, unknown>>('/api/toxicity-v2/metadata');
}
