/**
 * Master Data Hooks
 * 백엔드 API에서 마스터데이터를 가져오고 캐싱하는 훅
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getToxicityTests,
  getEfficacyPriceItems,
  getEfficacyModels,
  getModalities,
  getModalitiesHierarchy,
  getToxicityTestCategories,
  getAnimalClasses,
  getSpecies,
  getRoutes,
  ToxicityTest,
  ToxicityCategory,
  AnimalClass,
  Species,
  Route,
  EfficacyPriceItem,
  EfficacyModel,
  Modality,
  ModalityHierarchy,
} from '@/lib/master-api';

// 캐시 저장소
const cache: {
  toxicityTests: ToxicityTest[] | null;
  toxicityCategories: ToxicityCategory[] | null;
  animalClasses: AnimalClass[] | null;
  species: Species[] | null;
  routes: Route[] | null;
  efficacyPriceItems: EfficacyPriceItem[] | null;
  efficacyModels: EfficacyModel[] | null;
  modalities: Modality[] | null;
  modalitiesHierarchy: ModalityHierarchy[] | null;
  lastFetch: {
    toxicityTests: number;
    toxicityCategories: number;
    animalClasses: number;
    species: number;
    routes: number;
    efficacyPriceItems: number;
    efficacyModels: number;
    modalities: number;
    modalitiesHierarchy: number;
  };
} = {
  toxicityTests: null,
  toxicityCategories: null,
  animalClasses: null,
  species: null,
  routes: null,
  efficacyPriceItems: null,
  efficacyModels: null,
  modalities: null,
  modalitiesHierarchy: null,
  lastFetch: {
    toxicityTests: 0,
    toxicityCategories: 0,
    animalClasses: 0,
    species: 0,
    routes: 0,
    efficacyPriceItems: 0,
    efficacyModels: 0,
    modalities: 0,
    modalitiesHierarchy: 0,
  },
};

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

function isCacheValid(key: keyof typeof cache.lastFetch): boolean {
  return Date.now() - cache.lastFetch[key] < CACHE_TTL;
}

// ============ Toxicity Tests Hook ============

export function useToxicityTests() {
  const [tests, setTests] = useState<ToxicityTest[]>(cache.toxicityTests || []);
  const [loading, setLoading] = useState(!cache.toxicityTests);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = useCallback(async (force = false) => {
    if (!force && cache.toxicityTests && isCacheValid('toxicityTests')) {
      setTests(cache.toxicityTests);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getToxicityTests();
      if (response.success && response.data) {
        cache.toxicityTests = response.data;
        cache.lastFetch.toxicityTests = Date.now();
        setTests(response.data);
      } else {
        setError(response.error?.message || '데이터를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return { tests, loading, error, refetch: () => fetchTests(true) };
}

// ============ Efficacy Price Items Hook ============

export function useEfficacyPriceItems() {
  const [items, setItems] = useState<EfficacyPriceItem[]>(cache.efficacyPriceItems || []);
  const [loading, setLoading] = useState(!cache.efficacyPriceItems);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (force = false) => {
    if (!force && cache.efficacyPriceItems && isCacheValid('efficacyPriceItems')) {
      setItems(cache.efficacyPriceItems);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getEfficacyPriceItems();
      if (response.success && response.data) {
        cache.efficacyPriceItems = response.data;
        cache.lastFetch.efficacyPriceItems = Date.now();
        setItems(response.data);
      } else {
        setError(response.error?.message || '데이터를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: () => fetchItems(true) };
}

// ============ Efficacy Models Hook ============

export function useEfficacyModels() {
  const [models, setModels] = useState<EfficacyModel[]>(cache.efficacyModels || []);
  const [loading, setLoading] = useState(!cache.efficacyModels);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async (force = false) => {
    if (!force && cache.efficacyModels && isCacheValid('efficacyModels')) {
      setModels(cache.efficacyModels);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getEfficacyModels();
      if (response.success && response.data) {
        cache.efficacyModels = response.data;
        cache.lastFetch.efficacyModels = Date.now();
        setModels(response.data);
      } else {
        setError(response.error?.message || '데이터를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, refetch: () => fetchModels(true) };
}

// ============ Modalities Hook ============

export function useModalities() {
  const [modalities, setModalities] = useState<Modality[]>(cache.modalities || []);
  const [loading, setLoading] = useState(!cache.modalities);
  const [error, setError] = useState<string | null>(null);

  const fetchModalities = useCallback(async (force = false) => {
    if (!force && cache.modalities && isCacheValid('modalities')) {
      setModalities(cache.modalities);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getModalities();
      if (response.success && response.data) {
        cache.modalities = response.data;
        cache.lastFetch.modalities = Date.now();
        setModalities(response.data);
      } else {
        setError(response.error?.message || '데이터를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModalities();
  }, [fetchModalities]);

  return { modalities, loading, error, refetch: () => fetchModalities(true) };
}

// ============ Modalities Hierarchy Hook ============

export function useModalitiesHierarchy() {
  const [hierarchy, setHierarchy] = useState<ModalityHierarchy[]>(cache.modalitiesHierarchy || []);
  const [loading, setLoading] = useState(!cache.modalitiesHierarchy);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async (force = false) => {
    if (!force && cache.modalitiesHierarchy && isCacheValid('modalitiesHierarchy')) {
      setHierarchy(cache.modalitiesHierarchy);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getModalitiesHierarchy();
      if (response.success && response.data) {
        cache.modalitiesHierarchy = response.data;
        cache.lastFetch.modalitiesHierarchy = Date.now();
        setHierarchy(response.data);
      } else {
        setError(response.error?.message || '데이터를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  return { hierarchy, loading, error, refetch: () => fetchHierarchy(true) };
}

// ============ Cache Utilities ============

export function clearMasterDataCache() {
  cache.toxicityTests = null;
  cache.toxicityCategories = null;
  cache.animalClasses = null;
  cache.species = null;
  cache.routes = null;
  cache.efficacyPriceItems = null;
  cache.efficacyModels = null;
  cache.modalities = null;
  cache.modalitiesHierarchy = null;
  cache.lastFetch = {
    toxicityTests: 0,
    toxicityCategories: 0,
    animalClasses: 0,
    species: 0,
    routes: 0,
    efficacyPriceItems: 0,
    efficacyModels: 0,
    modalities: 0,
    modalitiesHierarchy: 0,
  };
}

// ============ Sync Functions (for non-hook usage) ============

// 캐시된 데이터를 동기적으로 반환 (이미 로드된 경우)
export function getCachedToxicityTests(): ToxicityTest[] {
  return cache.toxicityTests || [];
}

export function getCachedEfficacyPriceItems(): EfficacyPriceItem[] {
  return cache.efficacyPriceItems || [];
}

export function getCachedEfficacyModels(): EfficacyModel[] {
  return cache.efficacyModels || [];
}

export function getCachedModalities(): Modality[] {
  return cache.modalities || [];
}

// 데이터 프리로드 (앱 시작 시 호출)
export async function preloadMasterData() {
  await Promise.all([
    getToxicityTests().then((res) => {
      if (res.success && res.data) {
        cache.toxicityTests = res.data;
        cache.lastFetch.toxicityTests = Date.now();
      }
    }),
    getEfficacyPriceItems().then((res) => {
      if (res.success && res.data) {
        cache.efficacyPriceItems = res.data;
        cache.lastFetch.efficacyPriceItems = Date.now();
      }
    }),
    getEfficacyModels().then((res) => {
      if (res.success && res.data) {
        cache.efficacyModels = res.data;
        cache.lastFetch.efficacyModels = Date.now();
      }
    }),
    getModalities().then((res) => {
      if (res.success && res.data) {
        cache.modalities = res.data;
        cache.lastFetch.modalities = Date.now();
      }
    }),
  ]);
}
