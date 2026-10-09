import type { MappingTarget, SavedMapping } from './types';
import { normalizeText } from './value-matchers';

const STORAGE_KEY = 'scope_import_saved_mappings_v1';

export function generateHeaderSignature(headers: string[]): string {
  return headers
    .map((h) => normalizeText(h))
    .filter((h) => h.length > 0)
    .sort()
    .join('::');
}

export function getSavedMapping(signature: string): SavedMapping | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const list: SavedMapping[] = JSON.parse(raw);
    return list.find((m) => m.signature === signature) || null;
  } catch {
    return null;
  }
}

export function saveMapping(signature: string, mapping: Record<string, MappingTarget>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: SavedMapping[] = raw ? JSON.parse(raw) : [];
    list = list.filter((m) => m.signature !== signature);
    list.unshift({
      signature,
      mapping,
      updatedAt: new Date().toISOString(),
    });
    // Keep max 20 saved mappings
    if (list.length > 20) {
      list = list.slice(0, 20);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

export function listSavedMappings(): SavedMapping[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
