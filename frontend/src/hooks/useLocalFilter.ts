// src/hooks/useLocalFilter.ts
import { useMemo } from 'react';

export const useLocalFilter = <T extends Record<string, any>>(
  data: T[],
  filters: Partial<Record<keyof T, string>>,
  searchFields?: (keyof T)[]
): T[] => {
  return useMemo(() => {
    return data.filter((item) => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        if (key === '_search' && searchFields) {
          const searchStr = searchFields.map((f) => String(item[f] ?? '')).join(' ').toLowerCase();
          if (!searchStr.includes(value.toLowerCase())) return false;
        } else {
          if (String(item[key]) !== value) return false;
        }
      }
      return true;
    });
  }, [data, filters, searchFields]);
};
