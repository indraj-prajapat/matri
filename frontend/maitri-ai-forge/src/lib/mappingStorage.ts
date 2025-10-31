import { SavedMapping } from '@/components/PastMappingsView';

const STORAGE_KEY = 'maitri_saved_mappings';

export const saveMappingToLocal = (mapping: SavedMapping): void => {
  try {
    const existing = getMappingsFromLocal();
    const updated = [mapping, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save mapping:', error);
  }
};

export const getMappingsFromLocal = (): SavedMapping[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load mappings:', error);
    return [];
  }
};

export const updateMappingInLocal = (id: string, updatedMapping: SavedMapping): void => {
  try {
    const existing = getMappingsFromLocal();
    const updated = existing.map(m => m.id === id ? updatedMapping : m);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update mapping:', error);
  }
};
