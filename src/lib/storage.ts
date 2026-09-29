// Everything stays in this browser: the album (as JSON) and uploaded photos/videos (as blobs) in IndexedDB.
// Every call is wrapped so the app still works in private windows where storage is blocked.
import type { AppState } from './types';

const DB = 'ourstory';
let dbp: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('kv');
        db.createObjectStore('media');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbp;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const t = db.transaction(store, mode);
          const req = fn(t.objectStore(store));
          t.oncomplete = () => resolve(req ? (req.result as T) : undefined);
          t.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      }),
  );
}

export const loadState = () => tx<AppState>('kv', 'readonly', (s) => s.get('state'));
export const saveState = (st: AppState) => tx('kv', 'readwrite', (s) => { s.put(st, 'state'); });
export const loadDraft = () => tx<{ state: AppState; stamp: number }>('kv', 'readonly', (s) => s.get('draft'));
export const saveDraft = (d: { state: AppState; stamp: number }) => tx('kv', 'readwrite', (s) => { s.put(d, 'draft'); });
export const clearAll = () =>
  Promise.all([tx('kv', 'readwrite', (s) => { s.clear(); }), tx('media', 'readwrite', (s) => { s.clear(); })]);

const urls = new Map<string, string>();

export async function putMedia(id: string, blob: Blob): Promise<string> {
  urls.set(id, URL.createObjectURL(blob));
  await tx('media', 'readwrite', (s) => { s.put(blob, id); });
  return id;
}

export async function getMediaUrl(id: string): Promise<string | undefined> {
  const hit = urls.get(id);
  if (hit) return hit;
  const blob = await tx<Blob>('media', 'readonly', (s) => s.get(id));
  if (!blob) return undefined;
  const u = URL.createObjectURL(blob);
  urls.set(id, u);
  return u;
}

export const mediaUrlSync = (id: string) => urls.get(id);

export function deleteMedia(id: string) {
  const u = urls.get(id);
  if (u) URL.revokeObjectURL(u);
  urls.delete(id);
  return tx('media', 'readwrite', (s) => { s.delete(id); });
}

/** Shrink big phone photos so the album stays light. */
export async function shrinkImage(file: File, max = 1800): Promise<{ blob: Blob; ratio: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b ?? file), 'image/jpeg', max <= 1400 ? 0.78 : 0.86));
    return { blob, ratio: w / h };
  } catch {
    return { blob: file, ratio: 4 / 3 };
  }
}

export function videoRatio(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    try {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => resolve(v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9);
      v.onerror = () => resolve(16 / 9);
      v.src = URL.createObjectURL(file);
    } catch {
      resolve(16 / 9);
    }
  });
}
