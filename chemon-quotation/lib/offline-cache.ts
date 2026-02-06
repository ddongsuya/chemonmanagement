// chemon-quotation/lib/offline-cache.ts
// IndexedDB 기반 오프라인 캐시 유틸리티
// **Requirements: 3.2.2**

const DB_NAME = 'chemon-offline-cache';
const DB_VERSION = 1;

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  method: string;
  body?: any;
  timestamp: number;
  retryCount: number;
}

// IndexedDB 초기화
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 캐시 데이터 저장소
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      // 펜딩 액션 저장소 (오프라인 중 수행된 작업)
      if (!db.objectStoreNames.contains('pendingActions')) {
        const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// 캐시에 데이터 저장
export async function setCache<T>(
  key: string,
  data: T,
  ttlMinutes: number = 60
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to set cache:', error);
  }
}

// 캐시에서 데이터 조회
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');

    const entry = await new Promise<CacheEntry<T> | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (!entry) return null;

    // 만료 체크
    if (entry.expiresAt < Date.now()) {
      await deleteCache(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Failed to get cache:', error);
    return null;
  }
}

// 캐시 삭제
export async function deleteCache(key: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to delete cache:', error);
  }
}

// 만료된 캐시 정리
export async function cleanExpiredCache(): Promise<number> {
  try {
    const db = await openDB();
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('expiresAt');

    const now = Date.now();
    let deletedCount = 0;

    await new Promise<void>((resolve, reject) => {
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    db.close();
    return deletedCount;
  } catch (error) {
    console.error('Failed to clean expired cache:', error);
    return 0;
  }
}

// 펜딩 액션 추가 (오프라인 중 수행된 작업)
export async function addPendingAction(
  action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>
): Promise<string> {
  try {
    const db = await openDB();
    const transaction = db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.add(pendingAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    return id;
  } catch (error) {
    console.error('Failed to add pending action:', error);
    throw error;
  }
}

// 펜딩 액션 조회
export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction('pendingActions', 'readonly');
    const store = transaction.objectStore('pendingActions');
    const index = store.index('timestamp');

    const actions = await new Promise<PendingAction[]>((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return actions;
  } catch (error) {
    console.error('Failed to get pending actions:', error);
    return [];
  }
}

// 펜딩 액션 삭제
export async function removePendingAction(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to remove pending action:', error);
  }
}

// 펜딩 액션 재시도 횟수 증가
export async function incrementRetryCount(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');

    const action = await new Promise<PendingAction | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (action) {
      action.retryCount++;
      await new Promise<void>((resolve, reject) => {
        const request = store.put(action);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    db.close();
  } catch (error) {
    console.error('Failed to increment retry count:', error);
  }
}

// 온라인 복귀 시 펜딩 액션 동기화
export async function syncPendingActions(
  fetchFn: typeof fetch = fetch
): Promise<{ success: number; failed: number }> {
  const actions = await getPendingActions();
  let success = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const response = await fetchFn(action.endpoint, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (response.ok) {
        await removePendingAction(action.id);
        success++;
      } else {
        await incrementRetryCount(action.id);
        
        // 최대 재시도 횟수 초과 시 삭제
        if (action.retryCount >= 3) {
          await removePendingAction(action.id);
        }
        failed++;
      }
    } catch (error) {
      await incrementRetryCount(action.id);
      failed++;
    }
  }

  return { success, failed };
}

// 캐시 키 생성 헬퍼
export function createCacheKey(prefix: string, params?: Record<string, any>): string {
  if (!params) return prefix;
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}?${sortedParams}`;
}

// 전체 캐시 클리어
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}
